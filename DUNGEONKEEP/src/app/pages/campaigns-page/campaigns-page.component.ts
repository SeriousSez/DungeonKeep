import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CampaignBoardComponent } from '../../components/campaign-board/campaign-board.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-campaigns-page',
    imports: [CommonModule, RouterLink, CampaignBoardComponent],
    templateUrl: './campaigns-page.component.html',
    styleUrl: './campaigns-page.component.scss'
})
export class CampaignsPageComponent {
    readonly store = inject(DungeonStoreService);
}
