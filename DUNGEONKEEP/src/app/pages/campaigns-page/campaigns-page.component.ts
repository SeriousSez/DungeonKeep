import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Campaign } from '../../models/dungeon.models';
import { loadCampaignDisplayOrder, saveCampaignDisplayOrder } from '../../data/local-storage';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { SessionService } from '../../state/session.service';

@Component({
    selector: 'app-campaigns-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './campaigns-page.component.html',
    styleUrl: './campaigns-page.component.scss'
})
export class CampaignsPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly session = inject(SessionService);
    private readonly campaignOrder = signal<string[]>([]);
    readonly isReorderMode = signal(false);
    readonly dragOverCampaignId = signal<string | null>(null);
    private dragSourceId: string | null = null;

    constructor() {
        effect(() => {
            if (!this.store.initialized()) {
                return;
            }

            void this.store.refreshCampaignSummaries();
        });

        effect(() => {
            if (!this.store.initialized()) {
                return;
            }

            const userId = this.session.currentUser()?.id ?? '';
            const visibleIds = this.store.campaigns()
                .filter((campaign) => campaign.currentUserRole === 'Owner' || campaign.currentUserRole === 'Member')
                .map((campaign) => campaign.id);
            const storedOrder = userId ? loadCampaignDisplayOrder(userId) : [];
            const nextOrder = this.normalizeCampaignOrder(storedOrder, visibleIds);

            if (!this.arraysEqual(this.campaignOrder(), nextOrder)) {
                this.campaignOrder.set(nextOrder);
            }

            if (userId && !this.arraysEqual(storedOrder, nextOrder)) {
                saveCampaignDisplayOrder(userId, nextOrder);
            }
        });
    }

    readonly visibleCampaigns = computed(() => {
        const visible = this.store.campaigns().filter((campaign) => campaign.currentUserRole === 'Owner' || campaign.currentUserRole === 'Member');
        return this.sortCampaignsByOrder(visible, this.campaignOrder());
    });

    readonly visibleCampaignCount = computed(() => this.visibleCampaigns().length);

    toggleReorderMode(): void {
        this.isReorderMode.update((mode) => !mode);
        this.dragSourceId = null;
        this.dragOverCampaignId.set(null);
    }

    onDragStart(campaignId: string, event: DragEvent): void {
        this.dragSourceId = campaignId;
        event.dataTransfer?.setData('text/plain', campaignId);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    onDragOver(campaignId: string, event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }

        if (campaignId !== this.dragSourceId) {
            this.dragOverCampaignId.set(campaignId);
        }
    }

    onDragLeave(campaignId: string): void {
        if (this.dragOverCampaignId() === campaignId) {
            this.dragOverCampaignId.set(null);
        }
    }

    onDrop(targetCampaignId: string, event: DragEvent): void {
        event.preventDefault();
        this.dragOverCampaignId.set(null);

        const sourceId = this.dragSourceId;
        this.dragSourceId = null;

        if (!sourceId || sourceId === targetCampaignId) {
            return;
        }

        const visibleIds = this.visibleCampaigns().map((campaign) => campaign.id);
        const fromIndex = visibleIds.indexOf(sourceId);
        const toIndex = visibleIds.indexOf(targetCampaignId);

        if (fromIndex === -1 || toIndex === -1) {
            return;
        }

        const reordered = [...visibleIds];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, sourceId);

        const mergedOrder = this.mergeVisibleOrderWithAllCampaigns(reordered);
        this.campaignOrder.set(mergedOrder);

        const userId = this.session.currentUser()?.id ?? '';
        if (userId) {
            saveCampaignDisplayOrder(userId, mergedOrder);
        }
    }

    onDragEnd(): void {
        this.dragSourceId = null;
        this.dragOverCampaignId.set(null);
    }

    private sortCampaignsByOrder(campaigns: Campaign[], order: string[]): Campaign[] {
        const orderIndex = new Map(order.map((id, index) => [id, index]));

        return [...campaigns].sort((a, b) => {
            const aIndex = orderIndex.get(a.id);
            const bIndex = orderIndex.get(b.id);

            if (aIndex === undefined && bIndex === undefined) {
                return 0;
            }

            if (aIndex === undefined) {
                return 1;
            }

            if (bIndex === undefined) {
                return -1;
            }

            return aIndex - bIndex;
        });
    }

    private normalizeCampaignOrder(storedOrder: string[], visibleIds: string[]): string[] {
        const visibleSet = new Set(visibleIds);
        const normalized: string[] = [];

        for (const id of storedOrder) {
            if (visibleSet.has(id) && !normalized.includes(id)) {
                normalized.push(id);
            }
        }

        for (const id of visibleIds) {
            if (!normalized.includes(id)) {
                normalized.push(id);
            }
        }

        return normalized;
    }

    private mergeVisibleOrderWithAllCampaigns(reorderedVisible: string[]): string[] {
        const allCampaignIds = this.store.campaigns().map((campaign) => campaign.id);
        const visibleSet = new Set(reorderedVisible);
        const preservedHidden = this.campaignOrder().filter((id) => allCampaignIds.includes(id) && !visibleSet.has(id));

        for (const id of allCampaignIds) {
            if (!visibleSet.has(id) && !preservedHidden.includes(id)) {
                preservedHidden.push(id);
            }
        }

        return [...reorderedVisible, ...preservedHidden];
    }

    private arraysEqual(left: string[], right: string[]): boolean {
        if (left.length !== right.length) {
            return false;
        }

        for (let index = 0; index < left.length; index += 1) {
            if (left[index] !== right[index]) {
                return false;
            }
        }

        return true;
    }
}
