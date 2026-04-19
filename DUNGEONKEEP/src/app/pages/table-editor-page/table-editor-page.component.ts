import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { createDefaultCustomTable, nextCustomTableTitle, sanitizeCustomTable } from '../../data/campaign-custom-table.helpers';
import { loadCampaignCustomTables, loadCustomTableLibrary, saveCampaignCustomTables, saveCustomTableLibrary } from '../../data/campaign-custom-table.storage';
import { CampaignCustomTable } from '../../models/campaign-custom-table.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type TableEditorMode = 'standard' | 'ai';

@Component({
    selector: 'app-table-editor-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './table-editor-page.component.html',
    styleUrl: './table-editor-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableEditorPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly tableId = signal('');
    readonly title = signal('');
    readonly description = signal('');
    readonly entriesText = signal('');
    readonly generationPrompt = signal('');
    readonly generationBusy = signal(false);
    readonly generationError = signal('');
    readonly feedback = signal('');
    readonly editorMode = signal<TableEditorMode>('standard');
    readonly aiDraftShape = signal<'list' | 'grid'>('list');
    readonly aiDraftResultCount = signal(8);
    readonly aiDraftColumnCount = signal(3);
    readonly rowLabels = signal<string[]>([]);
    readonly columnLabels = signal<string[]>([]);
    readonly entryGridRows = computed(() => this.buildEntryGrid(this.entriesText()));
    readonly entryGridRowLabels = computed(() => this.buildGridLabels(this.rowLabels(), this.entryGridRows().length || 1, 'Row'));
    readonly entryGridColumnLabels = computed(() =>
        this.buildGridLabels(this.columnLabels(), Math.max(1, ...this.entryGridRows().map((row) => row.length)), 'Column')
    );

    readonly currentCampaign = computed(() => this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null);
    readonly libraryMode = computed(() => !this.campaignId());
    readonly canEdit = computed(() => this.libraryMode() || this.currentCampaign()?.currentUserRole === 'Owner');
    readonly isNewTable = computed(() => !this.tableId());

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.campaignId.set(params.get('id') ?? '');
                this.tableId.set(params.get('tableId') ?? '');
                void this.loadDraft();
            });
    }

    updateTitle(value: string): void {
        this.title.set(value);
    }

    updateDescription(value: string): void {
        this.description.set(value);
    }

    updateEntries(value: string): void {
        this.entriesText.set(value);
    }

    addEntryRow(): void {
        const nextRows = this.entryGridRows().map((row) => [...row]);
        const columnCount = Math.max(1, this.entryGridColumnLabels().length);
        nextRows.push(Array.from({ length: columnCount }, () => ''));
        this.applyEntryGrid(nextRows);
    }

    addEntryColumn(): void {
        const nextRows = this.entryGridRows().length
            ? this.entryGridRows().map((row) => [...row, ''])
            : [['', '']];

        this.applyEntryGrid(nextRows);
    }

    updateEntryCell(rowIndex: number, columnIndex: number, value: string): void {
        const nextRows = this.entryGridRows().map((row) => [...row]);

        while (nextRows.length <= rowIndex) {
            nextRows.push(Array.from({ length: Math.max(1, this.entryGridColumnLabels().length) }, () => ''));
        }

        while (nextRows[rowIndex].length <= columnIndex) {
            nextRows[rowIndex].push('');
        }

        nextRows[rowIndex][columnIndex] = value;
        this.applyEntryGrid(nextRows);
    }

    updateRowLabel(rowIndex: number, value: string): void {
        const nextLabels = [...this.rowLabels()];

        while (nextLabels.length <= rowIndex) {
            nextLabels.push(`Row ${nextLabels.length + 1}`);
        }

        nextLabels[rowIndex] = value;
        this.rowLabels.set(nextLabels);
    }

    updateColumnLabel(columnIndex: number, value: string): void {
        const nextLabels = [...this.columnLabels()];

        while (nextLabels.length <= columnIndex) {
            nextLabels.push(`Column ${nextLabels.length + 1}`);
        }

        nextLabels[columnIndex] = value;
        this.columnLabels.set(nextLabels);
    }

    updateGenerationPrompt(value: string): void {
        this.generationPrompt.set(value);
    }

    selectAiDraftShape(shape: 'list' | 'grid'): void {
        this.aiDraftShape.set(shape);
    }

    updateAiDraftResultCount(value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.aiDraftResultCount.set(Number.isFinite(parsed) ? Math.max(4, Math.min(20, parsed)) : 8);
    }

    updateAiDraftColumnCount(value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.aiDraftColumnCount.set(Number.isFinite(parsed) ? Math.max(2, Math.min(6, parsed)) : 3);
    }

    selectEditorMode(mode: TableEditorMode): void {
        this.editorMode.set(mode);
        this.generationError.set('');
    }

    async generateTable(): Promise<void> {
        if (!this.canEdit() || this.generationBusy()) {
            return;
        }

        const themeHint = this.generationPrompt().trim();
        const titleHint = this.title().trim();
        const descriptionHint = this.description().trim();
        const shapeHint = this.aiDraftShape();
        const entryCount = Math.max(4, Math.min(20, this.aiDraftResultCount()));
        const columnCount = Math.max(2, Math.min(6, this.aiDraftColumnCount()));

        if (!themeHint && !titleHint && !descriptionHint) {
            this.generationError.set('Add a theme or short prompt first.');
            return;
        }

        this.generationBusy.set(true);
        this.generationError.set('');
        this.feedback.set('');

        try {
            const currentTables = this.campaignId()
                ? (loadCampaignCustomTables(this.campaignId()) ?? []).map((table) => sanitizeCustomTable(table))
                : (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));

            const generated = await this.api.generateTableDraft({
                campaignId: this.campaignId() || undefined,
                titleHint,
                descriptionHint,
                themeHint: this.buildAiThemeHint(themeHint, shapeHint, entryCount, columnCount),
                entryCount,
                shapeHint,
                columnCount: shapeHint === 'grid' ? columnCount : undefined,
                existingTableTitles: currentTables.map((table) => table.title)
            });

            this.title.set(generated.title?.trim() || this.title() || 'Generated Table');
            this.description.set(generated.description?.trim() || this.description());
            this.entriesText.set(this.normalizeGeneratedEntries(generated.entries ?? [], shapeHint, columnCount).join('\n'));
            this.feedback.set(shapeHint === 'grid'
                ? 'AI grid draft generated. Review it and save when ready.'
                : 'AI draft generated. Review it and save when ready.');
            this.editorMode.set('standard');
        } catch (error) {
            this.generationError.set(this.readApiError(error, 'Could not generate a table draft right now.'));
        } finally {
            this.generationBusy.set(false);
            this.cdr.detectChanges();
        }
    }

    async saveTable(): Promise<void> {
        const campaignId = this.campaignId();
        const currentTables = campaignId
            ? (loadCampaignCustomTables(campaignId) ?? []).map((table) => sanitizeCustomTable(table))
            : (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));

        const activeId = this.tableId() || createDefaultCustomTable(nextCustomTableTitle(currentTables)).id;
        const candidate = sanitizeCustomTable({
            id: activeId,
            title: this.title(),
            description: this.description(),
            entries: this.entriesText().split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean),
            rowLabels: this.entryGridRowLabels(),
            columnLabels: this.entryGridColumnLabels(),
            updatedAt: new Date().toISOString()
        });

        const nextList = currentTables.some((table) => table.id === activeId)
            ? currentTables.map((table) => table.id === activeId ? candidate : table)
            : [candidate, ...currentTables];

        if (campaignId) {
            saveCampaignCustomTables(campaignId, nextList);
            await this.router.navigate(['/campaigns', campaignId, 'tables', activeId]);
        } else {
            saveCustomTableLibrary(nextList);
            await this.router.navigate(['/tables', activeId]);
        }
    }

    private buildGridLabels(values: readonly string[], count: number, prefix: string): string[] {
        return Array.from({ length: Math.max(1, count) }, (_, index) => values[index]?.trim() || `${prefix} ${index + 1}`);
    }

    private buildAiThemeHint(themeHint: string, shapeHint: 'list' | 'grid', entryCount: number, columnCount: number): string {
        const baseHint = themeHint || 'Create a useful fantasy random table for tabletop play.';

        if (shapeHint !== 'grid') {
            return `${baseHint}\nReturn exactly ${entryCount} one-line results.`;
        }

        return `${baseHint}\nReturn exactly ${entryCount} rows with ${columnCount} columns. Each entry must be a single row string using " | " between cells. Do not include a markdown header row, separator row, numbering, bullets, or code fences.`;
    }

    private normalizeGeneratedEntries(entries: readonly string[], shapeHint: 'list' | 'grid', columnCount: number): string[] {
        const normalized = entries
            .map((entry) => entry.trim())
            .map((entry) => entry.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))
            .map((entry) => entry.replace(/^\|\s*/, '').replace(/\s*\|$/, ''))
            .filter((entry) => entry.length > 0)
            .filter((entry) => !/^:?-{2,}:?(?:\s*\|\s*:?-{2,}:?)*$/.test(entry));

        if (shapeHint !== 'grid') {
            return normalized;
        }

        return normalized.map((entry) => {
            const cells = entry.split('|').map((cell) => cell.trim());
            return Array.from({ length: columnCount }, (_, index) => cells[index] ?? '').join(' | ');
        });
    }

    private buildEntryGrid(value: string): string[][] {
        const rawLines = value.split(/\r?\n/);

        if (rawLines.length === 1 && rawLines[0].trim() === '') {
            return [['']];
        }

        const parsedRows = rawLines.map((line) => {
            const cells = line.includes('|')
                ? line.split('|').map((cell) => cell.trim())
                : [line.trim()];

            return cells.length > 0 ? cells : [''];
        });

        const columnCount = Math.max(1, ...parsedRows.map((row) => row.length));

        return parsedRows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? ''));
    }

    private applyEntryGrid(rows: string[][]): void {
        const nextText = rows
            .map((row) => {
                const cleanedCells = row.map((cell) => cell.replace(/\r?\n/g, ' ').trim());
                return cleanedCells.length > 1 ? cleanedCells.join(' | ') : (cleanedCells[0] ?? '');
            })
            .join('\n');

        this.entriesText.set(nextText);
    }

    private readApiError(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                return detail || title || fallback;
            }
        }

        return fallback;
    }

    private async loadDraft(): Promise<void> {
        const campaignId = this.campaignId();
        const tableId = this.tableId();

        if (campaignId) {
            await this.store.ensureCampaignLoaded(campaignId);
        }

        const source = campaignId
            ? (loadCampaignCustomTables(campaignId) ?? []).map((table) => sanitizeCustomTable(table))
            : (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));

        if (!tableId) {
            const draft = createDefaultCustomTable(nextCustomTableTitle(source));
            this.title.set(draft.title);
            this.description.set(draft.description);
            this.entriesText.set(draft.entries.join('\n'));
            this.rowLabels.set(draft.rowLabels ?? []);
            this.columnLabels.set(draft.columnLabels ?? []);
            this.feedback.set('');
            this.cdr.detectChanges();
            return;
        }

        const existing = source.find((table) => table.id === tableId) ?? null;
        this.title.set(existing?.title ?? '');
        this.description.set(existing?.description ?? '');
        this.entriesText.set(existing?.entries.join('\n') ?? '');
        this.rowLabels.set(existing?.rowLabels ?? []);
        this.columnLabels.set(existing?.columnLabels ?? []);
        this.feedback.set(existing ? '' : 'Table not found.');
        this.cdr.detectChanges();
    }
}
