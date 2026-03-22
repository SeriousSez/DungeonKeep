import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CampaignBoardComponent } from '../../components/campaign-board/campaign-board.component';
import { HeroOverviewComponent } from '../../components/hero-overview/hero-overview.component';
import { PartyRosterComponent } from '../../components/party-roster/party-roster.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-dashboard-page',
    imports: [CommonModule, RouterLink, HeroOverviewComponent, CampaignBoardComponent, PartyRosterComponent],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
    readonly store = inject(DungeonStoreService);
}
