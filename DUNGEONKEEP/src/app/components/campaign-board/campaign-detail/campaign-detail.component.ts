import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

import { DropdownComponent, DropdownOption } from '../../dropdown/dropdown.component';

import { Campaign } from '../../../models/dungeon.models';

@Component({
    selector: 'app-campaign-detail',
    imports: [CommonModule, DropdownComponent],
    templateUrl: './campaign-detail.component.html',
    styleUrl: './campaign-detail.component.scss'
})
export class CampaignDetailComponent {
    readonly selectedCampaign = input<Campaign | null>(null);

    readonly threadAdded = output<{ text: string; visibility: 'Party' | 'GMOnly' }>();
    readonly threadUpdated = output<{ threadId: string; text: string; visibility: 'Party' | 'GMOnly' }>();
    readonly threadArchived = output<string>();
    readonly memberInvited = output<string>();
    readonly inviteEmail = signal('');
    readonly addThreadModalOpen = signal(false);
    readonly threadModalMode = signal<'add' | 'edit'>('add');
    readonly modalThreadId = signal<string | null>(null);
    readonly newThreadText = signal('');
    readonly newThreadVisibility = signal<'Party' | 'GMOnly'>('Party');

    readonly threadVisibilityOptions: DropdownOption[] = [
        { value: 'Party', label: 'Party', description: 'Visible to every campaign member.' },
        { value: 'GMOnly', label: 'GM Only', description: 'Only visible to the campaign owner.' }
    ];

    visibleThreads(campaign: Campaign) {
        if (campaign.currentUserRole === 'Owner') {
            return campaign.openThreads;
        }

        return campaign.openThreads.filter((thread) => thread.visibility === 'Party');
    }

    archiveThread(threadId: string): void {
        this.threadArchived.emit(threadId);
    }

    setNewThreadText(value: string): void {
        this.newThreadText.set(value);
    }

    setNewThreadVisibility(value: string | number): void {
        this.newThreadVisibility.set(value === 'GMOnly' ? 'GMOnly' : 'Party');
    }

    openAddThreadModal(): void {
        this.threadModalMode.set('add');
        this.modalThreadId.set(null);
        this.newThreadText.set('');
        this.newThreadVisibility.set('Party');
        this.addThreadModalOpen.set(true);
    }

    openEditThreadModal(threadId: string, text: string, visibility: 'Party' | 'GMOnly'): void {
        this.threadModalMode.set('edit');
        this.modalThreadId.set(threadId);
        this.newThreadText.set(text);
        this.newThreadVisibility.set(visibility);
        this.addThreadModalOpen.set(true);
    }

    closeAddThreadModal(): void {
        this.modalThreadId.set(null);
        this.addThreadModalOpen.set(false);
    }

    submitThreadModal(): void {
        const text = this.newThreadText().trim();
        if (!text) {
            return;
        }

        if (this.threadModalMode() === 'edit') {
            const threadId = this.modalThreadId();
            if (!threadId) {
                return;
            }

            this.threadUpdated.emit({
                threadId,
                text,
                visibility: this.newThreadVisibility()
            });
        } else {
            this.threadAdded.emit({ text, visibility: this.newThreadVisibility() });
        }

        this.closeAddThreadModal();
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
