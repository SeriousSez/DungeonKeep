import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
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

    readonly campaignId = signal('');

    readonly selectedCampaign = computed(() => {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === campaignId) ?? null;
    });

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
                }
            });
    }

    isActiveBoard(mapId: string): boolean {
        return this.selectedCampaign()?.activeMapId === mapId;
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