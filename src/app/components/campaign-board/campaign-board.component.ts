import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CampaignDetailComponent } from './campaign-detail/campaign-detail.component';
import { CampaignListComponent } from './campaign-list/campaign-list.component';

import { Campaign } from '../../models/dungeon.models';

@Component({
    selector: 'app-campaign-board',
    imports: [CommonModule, CampaignListComponent, CampaignDetailComponent],
    templateUrl: './campaign-board.component.html',
    styleUrl: './campaign-board.component.scss'
})
export class CampaignBoardComponent {
    readonly campaigns = input.required<Campaign[]>();
    readonly selectedCampaignId = input.required<string>();
    readonly selectedCampaign = input<Campaign | null>(null);
    readonly openThreadCount = input.required<number>();

    readonly campaignSelected = output<string>();
    readonly threadArchived = output<string>();

    onCampaignSelected(campaignId: string): void {
        this.campaignSelected.emit(campaignId);
    }

    onThreadArchived(thread: string): void {
        this.threadArchived.emit(thread);
    }
}
