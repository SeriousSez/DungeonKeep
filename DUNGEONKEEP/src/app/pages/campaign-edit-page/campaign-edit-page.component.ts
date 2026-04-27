import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CreationStudioComponent } from '../../components/creation-studio/creation-studio.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { extractApiError } from '../../state/extract-api-error';
import type { CampaignDraft } from '../../models/dungeon.models';

@Component({
    selector: 'app-campaign-edit-page',
    imports: [CommonModule, RouterLink, CreationStudioComponent],
    templateUrl: './campaign-edit-page.component.html',
    styleUrl: './campaign-edit-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class CampaignEditPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

    readonly selectedCampaign = computed(() => {
        const id = this.campaignId();
        if (!id) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === id) ?? null;
    });
    readonly campaignReady = computed(() => this.selectedCampaign()?.detailsLoaded === true);

    readonly canEditCampaign = computed(() => this.selectedCampaign()?.currentUserRole === 'Owner');

    readonly editDraft = computed<CampaignDraft | null>(() => {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return null;
        }

        return {
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone,
            levelStart: campaign.levelStart,
            levelEnd: campaign.levelEnd,
            hook: campaign.hook,
            nextSession: campaign.nextSession,
            summary: campaign.summary
        };
    });

    readonly updateError = signal('');

    constructor() {
        void this.ensureCampaignDetails();

        effect(() => {
            const campaign = this.selectedCampaign();
            if (!campaign || campaign.currentUserRole === 'Owner') {
                return;
            }

            void this.router.navigate(['/campaigns', campaign.id], { replaceUrl: true });
        });
    }

    private async ensureCampaignDetails(): Promise<void> {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return;
        }

        await this.store.refreshCampaignLoaded(campaignId);
        this.cdr.detectChanges();
    }

    async handleCampaignUpdate(draft: CampaignDraft): Promise<void> {
        const id = this.campaignId();
        if (!id || !this.canEditCampaign()) {
            return;
        }

        this.updateError.set('');
        this.cdr.detectChanges();

        try {
            const updated = await this.store.updateCampaign(id, draft);
            if (!updated) {
                this.updateError.set(this.store.lastError() || 'Could not update campaign. Please try again.');
                this.cdr.detectChanges();
                return;
            }

            await this.router.navigate(['/campaigns', id]);
        } catch (error) {
            this.updateError.set(extractApiError(error, 'An error occurred while updating the campaign.'));
            this.cdr.detectChanges();
        }
    }
}

