import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-campaign-detail-page',
    imports: [CommonModule, RouterLink, ConfirmModalComponent, DropdownComponent],
    templateUrl: './campaign-detail-page.component.html',
    styleUrl: './campaign-detail-page.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignDetailPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly campaignId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

    readonly confirmDeleteOpen = signal(false);
    readonly addThreadModalOpen = signal(false);
    readonly threadModalMode = signal<'add' | 'edit'>('add');
    readonly modalThreadId = signal<string | null>(null);
    readonly newThreadText = signal('');
    readonly newThreadVisibility = signal<'Party' | 'GMOnly'>('Party');

    readonly threadVisibilityOptions: DropdownOption[] = [
        { value: 'Party', label: 'Party', description: 'Visible to all campaign members.' },
        { value: 'GMOnly', label: 'GM Only', description: 'Only visible to campaign owners.' }
    ];

    readonly selectedCampaign = computed(() => {
        const id = this.campaignId();
        if (!id) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === id) ?? null;
    });

    readonly partyMembers = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return [];
        }

        const characterMap = new Map(this.store.characters().map((character) => [character.id, character]));

        return campaign.partyCharacterIds
            .map((id) => characterMap.get(id))
            .filter((character) => character !== undefined);
    });

    readonly visibleThreads = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return [];
        }

        if (campaign.currentUserRole === 'Owner') {
            return campaign.openThreads;
        }

        return campaign.openThreads.filter((thread) => thread.visibility === 'Party');
    });

    handleRequestDelete(): void {
        this.confirmDeleteOpen.set(true);
    }

    async handleDeleteConfirmed(): Promise<void> {
        const id = this.campaignId();
        if (id) {
            await this.store.deleteCampaign(id);
            await this.router.navigate(['/campaigns']);
        }
        this.confirmDeleteOpen.set(false);
    }

    handleDeleteCancelled(): void {
        this.confirmDeleteOpen.set(false);
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

    updateNewThreadText(value: string): void {
        this.newThreadText.set(value);
    }

    updateThreadVisibility(value: string | number): void {
        this.newThreadVisibility.set(value === 'GMOnly' ? 'GMOnly' : 'Party');
    }

    submitThread(): void {
        const text = this.newThreadText().trim();
        const campaign = this.selectedCampaign();

        if (!campaign || campaign.currentUserRole !== 'Owner' || !text) {
            return;
        }

        this.store.selectCampaign(campaign.id);

        if (this.threadModalMode() === 'edit') {
            const threadId = this.modalThreadId();
            if (!threadId) {
                return;
            }

            this.store.updateThread(threadId, text, this.newThreadVisibility());
        } else {
            this.store.addThread(text, this.newThreadVisibility());
        }

        this.closeAddThreadModal();
    }

    archiveThread(threadId: string): void {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        this.store.selectCampaign(campaign.id);
        this.store.archiveThread(threadId);
        this.closeAddThreadModal();
    }
}
