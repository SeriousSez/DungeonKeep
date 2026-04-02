import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Campaign } from '../../../models/dungeon.models';

@Component({
    selector: 'app-campaign-list',
    imports: [CommonModule, RouterLink],
    templateUrl: './campaign-list.component.html',
    styleUrl: './campaign-list.component.scss'
})
export class CampaignListComponent {
    readonly campaigns = input.required<Campaign[]>();
    readonly selectedCampaignId = input.required<string>();
    readonly openThreadCount = input.required<number>();

    readonly campaignSelected = output<string>();

    selectCampaign(campaignId: string): void {
        this.campaignSelected.emit(campaignId);
    }
}
