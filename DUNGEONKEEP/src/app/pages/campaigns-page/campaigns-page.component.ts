import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-campaigns-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './campaigns-page.component.html',
    styleUrl: './campaigns-page.component.scss'
})
export class CampaignsPageComponent {
    readonly store = inject(DungeonStoreService);

    constructor() {
        if (this.store.initialized()) {
            void this.store.refreshCampaignSummaries();
        }
    }

    readonly visibleCampaigns = computed(() =>
        this.store.campaigns().filter((campaign) => campaign.currentUserRole === 'Owner' || campaign.currentUserRole === 'Member')
    );

    readonly visibleCampaignCount = computed(() => this.visibleCampaigns().length);
}
