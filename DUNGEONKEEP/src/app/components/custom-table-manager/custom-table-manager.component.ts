import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { createCustomTableId, nextImportedCustomTableTitle, normalizeCustomTableTitle, sanitizeCustomTable } from '../../data/campaign-custom-table.helpers';
import { clearCampaignCustomTables, clearCustomTableLibrary, loadCampaignCustomTables, loadCustomTableLibrary, saveCampaignCustomTables, saveCustomTableLibrary } from '../../data/campaign-custom-table.storage';
import { CampaignCustomTable } from '../../models/campaign-custom-table.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-custom-table-manager',
    standalone: true,
    imports: [CommonModule, ConfirmModalComponent],
    templateUrl: './custom-table-manager.component.html',
    styleUrl: './custom-table-manager.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTableManagerComponent {
    readonly campaignId = input<string>('');
    readonly canEdit = input<boolean>(false);
    readonly libraryMode = input<boolean>(false);
    readonly importTargetCampaignId = input<string>('');

    private readonly store = inject(DungeonStoreService);
    private readonly router = inject(Router);

    readonly allTables = signal<CampaignCustomTable[]>([]);
    readonly libraryTables = signal<CampaignCustomTable[]>([]);
    readonly feedback = signal('');
    readonly deleteCandidate = signal<CampaignCustomTable | null>(null);

    readonly importTargetCampaign = computed(() => {
        const campaignId = this.importTargetCampaignId();
        return this.store.campaigns().find((campaign) => campaign.id === campaignId) ?? null;
    });

    constructor() {
        effect(() => {
            const libraryTables = (loadCustomTableLibrary() ?? []).map((table) => sanitizeCustomTable(table));
            this.libraryTables.set(libraryTables);

            if (this.libraryMode()) {
                this.allTables.set(libraryTables);
                return;
            }

            const campaignId = this.campaignId();
            const campaignTables = campaignId
                ? (loadCampaignCustomTables(campaignId) ?? []).map((table) => sanitizeCustomTable(table))
                : [];

            this.allTables.set(campaignTables);
        });
    }

    openTable(tableId: string): void {
        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.libraryMode()) {
            void this.router.navigate(['/tables', tableId], { queryParams });
            return;
        }

        if (this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'tables', tableId]);
        }
    }

    openEditor(tableId: string): void {
        if (!this.canEdit()) {
            return;
        }

        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.libraryMode()) {
            void this.router.navigate(['/tables', tableId, 'edit'], { queryParams });
            return;
        }

        if (this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'tables', tableId, 'edit']);
        }
    }

    openNewTable(): void {
        if (!this.canEdit()) {
            return;
        }

        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.libraryMode()) {
            void this.router.navigate(['/tables', 'new'], { queryParams });
            return;
        }

        if (this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'tables', 'new']);
        }
    }

    saveTableToLibrary(tableId: string): void {
        const source = this.allTables().find((table) => table.id === tableId);
        if (!source) {
            return;
        }

        const currentLibrary = [...this.libraryTables()];
        const existingIndex = currentLibrary.findIndex((table) => normalizeCustomTableTitle(table.title) === normalizeCustomTableTitle(source.title));
        const candidate = sanitizeCustomTable({ ...source, id: createCustomTableId() });
        const nextLibrary = existingIndex >= 0
            ? currentLibrary.map((table, index) => index === existingIndex ? { ...candidate, id: currentLibrary[existingIndex].id } : table)
            : [candidate, ...currentLibrary];

        this.libraryTables.set(nextLibrary);
        saveCustomTableLibrary(nextLibrary);
        this.feedback.set('Table saved to the reusable library.');
    }

    importLibraryTable(tableId: string): void {
        const targetCampaignId = this.importTargetCampaignId();
        if (!targetCampaignId) {
            return;
        }

        const source = this.libraryTables().find((table) => table.id === tableId);
        if (!source) {
            return;
        }

        const currentTables = (loadCampaignCustomTables(targetCampaignId) ?? []).map((table) => sanitizeCustomTable(table));
        const imported = sanitizeCustomTable({
            ...source,
            id: createCustomTableId(),
            title: nextImportedCustomTableTitle(source.title, currentTables)
        });

        const nextTables = [imported, ...currentTables];
        saveCampaignCustomTables(targetCampaignId, nextTables);
        this.feedback.set(`Library table imported into ${this.importTargetCampaign()?.name ?? 'the campaign'}.`);
    }

    requestDeleteTable(tableId: string): void {
        this.deleteCandidate.set(this.allTables().find((table) => table.id === tableId) ?? null);
    }

    cancelDeleteTable(): void {
        this.deleteCandidate.set(null);
    }

    confirmDeleteTable(): void {
        const candidate = this.deleteCandidate();
        if (!candidate) {
            return;
        }

        const nextTables = this.allTables().filter((table) => table.id !== candidate.id);

        if (this.libraryMode()) {
            this.allTables.set(nextTables);
            this.libraryTables.set(nextTables);
            saveCustomTableLibrary(nextTables);
            this.feedback.set('Table removed from the reusable library.');
        } else {
            this.allTables.set(nextTables);
            saveCampaignCustomTables(this.campaignId(), nextTables);
            this.feedback.set('Table removed from the campaign.');
        }

        this.deleteCandidate.set(null);
    }

    clearAllTables(): void {
        if (!this.canEdit()) {
            return;
        }

        if (this.libraryMode()) {
            clearCustomTableLibrary();
            this.allTables.set([]);
            this.libraryTables.set([]);
            this.feedback.set('Table library cleared.');
            return;
        }

        const campaignId = this.campaignId();
        if (!campaignId) {
            return;
        }

        clearCampaignCustomTables(campaignId);
        this.allTables.set([]);
        this.feedback.set('Campaign tables cleared.');
    }
}
