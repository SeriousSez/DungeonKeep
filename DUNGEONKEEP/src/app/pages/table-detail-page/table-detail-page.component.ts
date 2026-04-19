import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { createCustomTableId, formatCustomTableEntry, getCustomTableRows, nextImportedCustomTableTitle, normalizeCustomTableLabels, normalizeCustomTableTitle, sanitizeCustomTable } from '../../data/campaign-custom-table.helpers';
import { loadCampaignCustomTables, loadCustomTableLibrary, saveCampaignCustomTables, saveCustomTableLibrary } from '../../data/campaign-custom-table.storage';
import { CampaignCustomTable } from '../../models/campaign-custom-table.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-table-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './table-detail-page.component.html',
    styleUrl: './table-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDetailPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly tableId = signal('');
    readonly importCampaignId = signal('');
    readonly table = signal<CampaignCustomTable | null>(null);
    readonly feedback = signal('');
    readonly rollResult = signal('');

    readonly currentCampaign = computed(() => this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null);
    readonly tableRows = computed(() => getCustomTableRows(this.table()?.entries ?? []));
    readonly tableColumnLabels = computed(() => normalizeCustomTableLabels(this.table()?.columnLabels, Math.max(1, ...this.tableRows().map((row) => row.length)), 'Column'));
    readonly tableRowLabels = computed(() => normalizeCustomTableLabels(this.table()?.rowLabels, Math.max(1, this.tableRows().length), 'Row'));
    readonly isGridTable = computed(() => this.tableRows().length > 0 && (this.tableColumnLabels().length > 1 || this.hasCustomLabels(this.table()?.rowLabels, 'Row') || this.hasCustomLabels(this.table()?.columnLabels, 'Column')));
    readonly importCampaign = computed(() => this.store.campaigns().find((campaign) => campaign.id === this.importCampaignId()) ?? null);
    readonly libraryMode = computed(() => !this.campaignId());
    readonly canEdit = computed(() => this.libraryMode() || this.currentCampaign()?.currentUserRole === 'Owner');

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.campaignId.set(params.get('id') ?? '');
                this.tableId.set(params.get('tableId') ?? '');
                void this.loadTable();
            });

        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.importCampaignId.set(params.get('campaignId') ?? '');
                this.cdr.detectChanges();
            });
    }

    async saveToLibrary(): Promise<void> {
        const activeTable = this.table();
        if (!activeTable) {
            return;
        }

        const currentLibrary = (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));
        const existingIndex = currentLibrary.findIndex((table) => normalizeCustomTableTitle(table.title) === normalizeCustomTableTitle(activeTable.title));
        const candidate = sanitizeCustomTable({ ...activeTable, id: createCustomTableId() });
        const nextLibrary = existingIndex >= 0
            ? currentLibrary.map((table, index) => index === existingIndex ? { ...candidate, id: currentLibrary[existingIndex].id } : table)
            : [candidate, ...currentLibrary];

        saveCustomTableLibrary(nextLibrary);
        this.feedback.set('Table saved to the reusable library.');
        this.cdr.detectChanges();
    }

    async importToCampaign(): Promise<void> {
        const activeTable = this.table();
        const campaignId = this.importCampaignId();

        if (!activeTable || !campaignId) {
            return;
        }

        const currentTables = (loadCampaignCustomTables(campaignId) ?? []).map((table) => sanitizeCustomTable(table));
        const imported = sanitizeCustomTable({
            ...activeTable,
            id: createCustomTableId(),
            title: nextImportedCustomTableTitle(activeTable.title, currentTables)
        });

        saveCampaignCustomTables(campaignId, [imported, ...currentTables]);
        this.feedback.set(`Table imported into ${this.importCampaign()?.name ?? 'the campaign'}.`);
        this.cdr.detectChanges();
    }

    rollTable(): void {
        const activeTable = this.table();
        if (!activeTable) {
            return;
        }

        const entries = activeTable.entries.map((entry) => entry.trim()).filter(Boolean);
        if (entries.length === 0) {
            this.rollResult.set('');
            this.feedback.set('Add at least one entry to roll on this table.');
            return;
        }

        const result = entries[Math.floor(Math.random() * entries.length)];
        this.rollResult.set(formatCustomTableEntry(result) || result);
        this.feedback.set(`Rolled on ${activeTable.title}.`);
    }

    private hasCustomLabels(values: readonly string[] | undefined, prefix: string): boolean {
        return (values ?? []).some((label, index) => {
            const trimmed = label.trim();
            return trimmed.length > 0 && trimmed !== `${prefix} ${index + 1}`;
        });
    }

    private async loadTable(): Promise<void> {
        const campaignId = this.campaignId();
        const tableId = this.tableId();

        if (campaignId) {
            await this.store.ensureCampaignLoaded(campaignId);
        }

        const source = campaignId
            ? (loadCampaignCustomTables(campaignId) ?? []).map((table) => sanitizeCustomTable(table))
            : (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));

        this.table.set(source.find((table) => table.id === tableId) ?? null);
        this.rollResult.set('');
        this.feedback.set('');
        this.cdr.detectChanges();
    }
}
