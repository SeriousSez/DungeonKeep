import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

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
    readonly memberInvited = output<string>();
    readonly inviteEmail = signal('');

    archiveThread(thread: string): void {
        this.threadArchived.emit(thread);
    }

    updateInviteEmail(value: string): void {
        this.inviteEmail.set(value);
    }

    inviteMember(): void {
        const email = this.inviteEmail().trim();
        if (!email) {
            return;
        }

        this.memberInvited.emit(email);
        this.inviteEmail.set('');
    }
}
