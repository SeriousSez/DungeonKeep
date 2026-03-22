import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { CampaignDetailComponent } from '../../components/campaign-board/campaign-detail/campaign-detail.component';
import { CampaignListComponent } from '../../components/campaign-board/campaign-list/campaign-list.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-sessions-page',
    imports: [CommonModule, CampaignListComponent, CampaignDetailComponent],
    templateUrl: './sessions-page.component.html',
    styleUrl: './sessions-page.component.scss'
})
export class SessionsPageComponent {
    readonly store = inject(DungeonStoreService);
}
