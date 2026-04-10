import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Campaign, CampaignMapBoard } from '../../models/dungeon.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-campaign-maps-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './campaign-maps-page.component.html',
    styleUrl: './campaign-maps-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignMapsPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly activeMapUpdateId = signal('');

    readonly selectedCampaign = computed(() => {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === campaignId) ?? null;
    });
    readonly campaignReady = computed(() => this.selectedCampaign()?.detailsLoaded === true);

    readonly canEdit = computed(() => this.selectedCampaign()?.currentUserRole === 'Owner');
    readonly mapBoards = computed(() => this.normalizeMapBoards(this.selectedCampaign()));

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                this.campaignId.set(campaignId);

                if (campaignId) {
                    this.store.selectCampaign(campaignId);
                    void this.ensureCampaignDetails(campaignId);
                }
            });
    }

    private async ensureCampaignDetails(campaignId: string): Promise<void> {
        await this.store.ensureCampaignLoaded(campaignId);
        this.cdr.detectChanges();
    }

    isActiveBoard(mapId: string): boolean {
        return this.selectedCampaign()?.activeMapId === mapId;
    }

    isUpdatingActiveBoard(mapId: string): boolean {
        return this.activeMapUpdateId() === mapId;
    }

    async setActiveBoard(mapId: string): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || !this.canEdit() || this.isActiveBoard(mapId) || this.activeMapUpdateId()) {
            return;
        }

        const maps = this.mapBoards().map((map) => structuredClone(map));
        this.activeMapUpdateId.set(mapId);

        try {
            await this.store.updateCampaignMap(campaign.id, { activeMapId: mapId, maps });
        } finally {
            this.activeMapUpdateId.set('');
            this.cdr.detectChanges();
        }
    }

    totalRouteCount(map: CampaignMapBoard): number {
        return map.strokes.length + map.layers.rivers.length;
    }

    private normalizeMapBoards(campaign: Campaign | null): CampaignMapBoard[] {
        if (!campaign) {
            return [];
        }

        if (campaign.maps.length > 0) {
            return campaign.maps;
        }

        return [{
            id: campaign.activeMapId || 'main-map',
            name: 'Main Map',
            ...campaign.map
        }];
    }
}