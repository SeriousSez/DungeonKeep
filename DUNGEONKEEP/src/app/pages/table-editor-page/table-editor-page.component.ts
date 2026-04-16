import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { createDefaultCustomTable, nextCustomTableTitle, sanitizeCustomTable } from '../../data/campaign-custom-table.helpers';
import { loadCampaignCustomTables, loadCustomTableLibrary, saveCampaignCustomTables, saveCustomTableLibrary } from '../../data/campaign-custom-table.storage';
import { CampaignCustomTable } from '../../models/campaign-custom-table.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

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
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly tableId = signal('');
    readonly title = signal('');
    readonly description = signal('');
    readonly entriesText = signal('');
    readonly feedback = signal('');

    readonly currentCampaign = computed(() => this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null);
    readonly libraryMode = computed(() => !this.campaignId());
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
