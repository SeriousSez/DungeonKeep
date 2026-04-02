import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CampaignDetailComponent } from './campaign-detail/campaign-detail.component';
import { CampaignListComponent } from './campaign-list/campaign-list.component';

import { Campaign, CampaignThreadVisibility } from '../../models/dungeon.models';

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
    readonly threadAdded = output<{ text: string; visibility: CampaignThreadVisibility }>();
    readonly threadUpdated = output<{ threadId: string; text: string; visibility: CampaignThreadVisibility }>();
    readonly threadArchived = output<string>();
    readonly memberInvited = output<string>();

    onCampaignSelected(campaignId: string): void {
        this.campaignSelected.emit(campaignId);
    }

    onThreadAdded(payload: { text: string; visibility: CampaignThreadVisibility }): void {
        this.threadAdded.emit(payload);
    }

    onThreadUpdated(payload: { threadId: string; text: string; visibility: CampaignThreadVisibility }): void {
        this.threadUpdated.emit(payload);
    }

    onThreadArchived(thread: string): void {
        this.threadArchived.emit(thread);
    }

    onMemberInvited(email: string): void {
        this.memberInvited.emit(email);
    }
}
