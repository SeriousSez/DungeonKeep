import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { Campaign } from '../../../models/dungeon.models';

@Component({
    selector: 'app-campaign-detail',
    imports: [CommonModule],
    templateUrl: './campaign-detail.component.html',
    styleUrl: './campaign-detail.component.scss'
})
export class CampaignDetailComponent {
    readonly selectedCampaign = input<Campaign | null>(null);

    readonly threadArchived = output<string>();

    archiveThread(thread: string): void {
        this.threadArchived.emit(thread);
    }
}
