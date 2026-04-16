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

    updateGenerationPrompt(value: string): void {
        this.generationPrompt.set(value);
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
                themeHint,
                entryCount: 8,
                existingTableTitles: currentTables.map((table) => table.title)
            });

            this.title.set(generated.title?.trim() || this.title() || 'Generated Table');
            this.description.set(generated.description?.trim() || this.description());
            this.entriesText.set((generated.entries ?? []).join('\n'));
            this.feedback.set('AI draft generated. Review it and save when ready.');
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
            this.feedback.set('');
            this.cdr.detectChanges();
            return;
        }

        const existing = source.find((table) => table.id === tableId) ?? null;
        this.title.set(existing?.title ?? '');
        this.description.set(existing?.description ?? '');
        this.entriesText.set(existing?.entries.join('\n') ?? '');
        this.feedback.set(existing ? '' : 'Table not found.');
        this.cdr.detectChanges();
    }
}
