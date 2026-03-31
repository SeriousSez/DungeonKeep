import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';

import { CreationStudioComponent } from '../../components/creation-studio/creation-studio.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import type { Campaign, CampaignDraft } from '../../models/dungeon.models';
import { DungeonApiService } from '../../state/dungeon-api.service';

type CampaignCreationMode = 'standard' | 'ai';

@Component({
    selector: 'app-new-campaign-page',
    imports: [CommonModule, FormsModule, RouterLink, DropdownComponent, CreationStudioComponent],
    templateUrl: './new-campaign-page.component.html',
    styleUrl: './new-campaign-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewCampaignPageComponent {
    readonly store = inject(DungeonStoreService);
    readonly api = inject(DungeonApiService);
    readonly createPending = signal(false);
    readonly createError = signal('');
    readonly createdCampaignId = signal('');
    readonly inviteEmail = signal('');
    readonly invitePending = signal(false);
    readonly inviteFeedback = signal('');
    readonly attachingCharacterIds = signal<string[]>([]);
    readonly creationMode = signal<CampaignCreationMode>('standard');
    readonly aiTone = signal<'Heroic' | 'Grim' | 'Mystic' | 'Chaotic'>('Heroic');
    readonly aiSettingHint = signal('');
    readonly aiAdditionalDirection = signal('');
    readonly aiGeneratePending = signal(false);
    readonly aiGenerateError = signal('');
    readonly generatedDraft = signal<CampaignDraft | null>(null);
    readonly campaignSeedDraft = signal<CampaignDraft | null>(null);

    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly unassignedCampaignId = '00000000-0000-0000-0000-000000000000';

    readonly toneOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Heroic', label: 'Heroic' },
        { value: 'Grim', label: 'Grim' },
        { value: 'Mystic', label: 'Mystic' },
        { value: 'Chaotic', label: 'Chaotic' }
    ];

    readonly createdCampaign = computed<Campaign | null>(() => {
        const createdId = this.createdCampaignId();
        if (!createdId) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === createdId) ?? null;
    });

    readonly unassignedCharacters = computed(() =>
        this.store.characters().filter((character) => character.campaignId === this.unassignedCampaignId)
    );

    selectCreationMode(mode: CampaignCreationMode): void {
        this.creationMode.set(mode);
        this.aiGenerateError.set('');

        if (mode === 'ai') {
            this.campaignSeedDraft.set(null);
        }
    }

    updateAiSettingHint(value: string): void {
        this.aiSettingHint.set(value);
    }

    updateAiAdditionalDirection(value: string): void {
        this.aiAdditionalDirection.set(value);
    }

    onAiToneChanged(value: string | number): void {
        this.aiTone.set(String(value) as 'Heroic' | 'Grim' | 'Mystic' | 'Chaotic');
    }

    async generateAiCampaignDraft(): Promise<void> {
        if (this.aiGeneratePending()) {
            return;
        }

        this.aiGeneratePending.set(true);
        this.aiGenerateError.set('');
        this.generatedDraft.set(null);
        this.cdr.detectChanges();

        try {
            const generated = await this.api.generateCampaignDraft({
                tone: this.aiTone(),
                settingHint: this.aiSettingHint().trim(),
                additionalDirection: this.aiAdditionalDirection().trim()
            });

            this.generatedDraft.set({
                name: generated.name,
                setting: generated.setting,
                tone: generated.tone,
                hook: generated.hook,
                nextSession: generated.nextSession,
                summary: generated.summary
            });
        } catch {
            this.aiGenerateError.set('Could not generate a campaign draft right now. Please try again.');
        } finally {
            this.aiGeneratePending.set(false);
            this.cdr.detectChanges();
        }
    }

    async createGeneratedCampaign(): Promise<void> {
        const draft = this.generatedDraft();
        if (!draft) {
            return;
        }

        await this.createCampaign(draft);
    }

    editGeneratedCampaignInStandardWizard(): void {
        const draft = this.generatedDraft();
        if (!draft) {
            return;
        }

        this.campaignSeedDraft.set({
            name: draft.name,
            setting: draft.setting,
            tone: draft.tone,
            hook: draft.hook,
            nextSession: draft.nextSession,
            summary: draft.summary
        });
        this.creationMode.set('standard');
    }

    async createCampaign(draft: CampaignDraft): Promise<void> {
        if (this.createPending()) {
            return;
        }

        this.createPending.set(true);
        this.createError.set('');
        this.cdr.detectChanges();

        try {
            const created = await this.store.createCampaign(draft);
            if (!created) {
                this.createError.set('Could not create campaign right now. Please try again.');
                return;
            }

            this.createdCampaignId.set(created.id);
            this.inviteFeedback.set('');
            this.inviteEmail.set('');
        } finally {
            this.createPending.set(false);
            this.cdr.detectChanges();
        }
    }

    updateInviteEmail(value: string): void {
        this.inviteEmail.set(value);
    }

    async invitePlayer(): Promise<void> {
        const campaign = this.createdCampaign();
        const email = this.inviteEmail().trim();
        if (!campaign || !email) {
            return;
        }

        this.invitePending.set(true);
        this.inviteFeedback.set('');
        this.cdr.detectChanges();

        this.store.selectCampaign(campaign.id);
        const invited = await this.store.inviteMember(email);

        this.invitePending.set(false);
        this.inviteFeedback.set(invited ? 'Invite sent.' : 'Could not send invite right now.');
        if (invited) {
            this.inviteEmail.set('');
        }

        this.cdr.detectChanges();
    }

    async attachCharacterToCampaign(characterId: string): Promise<void> {
        const campaign = this.createdCampaign();
        if (!campaign) {
            return;
        }

        this.attachingCharacterIds.update((ids) => [...ids, characterId]);
        this.cdr.detectChanges();

        await this.store.setCharacterCampaign(characterId, campaign.id);

        this.attachingCharacterIds.update((ids) => ids.filter((id) => id !== characterId));
        this.cdr.detectChanges();
    }

    isAttachingCharacter(characterId: string): boolean {
        return this.attachingCharacterIds().includes(characterId);
    }

    async goToCampaignBoard(): Promise<void> {
        const campaign = this.createdCampaign();
        if (!campaign) {
            return;
        }

        await this.router.navigate(['/campaigns'], {
            queryParams: {
                created: campaign.id
            }
        });
    }

    async goToAddCharacter(): Promise<void> {
        await this.router.navigate(['/characters/new']);
    }
}
