import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
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
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

    readonly confirmAction = signal<'delete' | 'leave' | null>(null);
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
    readonly campaignReady = computed(() => this.selectedCampaign()?.detailsLoaded === true);

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

    readonly confirmModalOpen = computed(() => this.confirmAction() !== null);
    readonly confirmModalTitle = computed(() => this.confirmAction() === 'leave' ? 'Leave Campaign?' : 'Delete Campaign?');
    readonly confirmModalMessage = computed(() =>
        this.confirmAction() === 'leave'
            ? 'Are you sure you want to leave this campaign? Your characters will be removed from the party and returned to your unassigned roster.'
            : 'Are you sure you want to delete this campaign? This action cannot be undone.');
    readonly confirmModalActionText = computed(() => this.confirmAction() === 'leave' ? 'Leave' : 'Delete');

    constructor() {
        void this.ensureCampaignDetails();
    }

    private async ensureCampaignDetails(): Promise<void> {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return;
        }

        await this.store.ensureCampaignLoaded(campaignId);
        this.cdr.detectChanges();
    }

    handleRequestDelete(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.confirmAction.set('delete');
    }

    handleRequestLeave(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Member') {
            return;
        }

        this.confirmAction.set('leave');
    }

    async handleConfirmAccepted(): Promise<void> {
        const id = this.campaignId();

        if (!id) {
            this.confirmAction.set(null);
            this.cdr.detectChanges();
            return;
        }

        if (this.confirmAction() === 'delete') {
            await this.store.deleteCampaign(id);
            await this.router.navigate(['/campaigns']);
        } else if (this.confirmAction() === 'leave') {
            const didLeave = await this.store.leaveCampaign(id);
            if (didLeave) {
                await this.router.navigate(['/campaigns']);
            }
        }

        this.confirmAction.set(null);
        this.cdr.detectChanges();
    }

    handleConfirmCancelled(): void {
        this.confirmAction.set(null);
        this.cdr.detectChanges();
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
