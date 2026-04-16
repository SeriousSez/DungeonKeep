import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
    readonly aiTone = signal<CampaignDraft['tone']>('Heroic');
    readonly aiLevelStart = signal(1);
    readonly aiLevelEnd = signal(4);
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
        { value: 'Heroic', label: 'Heroic', description: 'Epic quests and triumphant victories against darkness.' },
        { value: 'Grim', label: 'Grim', description: 'Serious stakes where every cost is felt deeply.' },
        { value: 'Mystic', label: 'Mystic', description: 'Secrets, magic, and cosmic mysteries unfold.' },
        { value: 'Chaotic', label: 'Chaotic', description: 'Unpredictable twists and delightful mayhem.' },
        { value: 'Grimdark', label: 'Grimdark', description: 'A harsh world where heroes are morally gray.' },
        { value: 'Gothic', label: 'Gothic', description: 'Oppressive atmosphere with ancient curses and decay.' },
        { value: 'Horror', label: 'Horror', description: 'Creeping dread and unspeakable terrors lurk.' },
        { value: 'Noblebright', label: 'Noblebright', description: 'Hopeful heroism where compassion and courage prevail.' },
        { value: 'Sword-and-Sorcery', label: 'Sword-and-Sorcery', description: 'Gritty adventure, dangerous magic, and personal stakes.' },
        { value: 'Political Intrigue', label: 'Political Intrigue', description: 'Schemes, alliances, and betrayal in halls of power.' },
        { value: 'Mythic', label: 'Mythic', description: 'Legendary destiny arcs and world-shaping deeds.' },
        { value: 'Survival', label: 'Survival', description: 'Scarcity, harsh travel, and endurance against the wild.' },
        { value: 'Pulp Adventure', label: 'Pulp Adventure', description: 'Fast-paced action, cliffhangers, and dramatic reversals.' },
        { value: 'Dark Fantasy', label: 'Dark Fantasy', description: 'Bleak wonder, dangerous magic, and costly victories.' },
        { value: 'Whimsical', label: 'Whimsical', description: 'Playful oddities, charm, and fantastical surprises.' },
        { value: 'Noir', label: 'Noir', description: 'Urban secrets, moral ambiguity, and hard consequences.' },
        { value: 'Epic War', label: 'Epic War', description: 'Front lines, command choices, and large-scale conflict.' },
        { value: 'Cosmic', label: 'Cosmic', description: 'Reality-bending mysteries and incomprehensible forces.' },
        { value: 'Heroic Tragedy', label: 'Heroic Tragedy', description: 'Noble purpose with bittersweet sacrifices and loss.' }
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
        this.aiTone.set(String(value) as CampaignDraft['tone']);
    }

    onAiLevelStartChanged(value: string): void {
        const parsed = Math.trunc(Number(value));
        const levelStart = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 1;
        const levelEnd = Math.max(levelStart, this.aiLevelEnd());

        this.aiLevelStart.set(levelStart);
        this.aiLevelEnd.set(Math.min(levelEnd, 20));
    }

    onAiLevelEndChanged(value: string): void {
        const parsed = Math.trunc(Number(value));
        const levelStart = this.aiLevelStart();
        const levelEnd = Number.isFinite(parsed) ? Math.min(Math.max(parsed, levelStart), 20) : levelStart;

        this.aiLevelEnd.set(levelEnd);
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
                additionalDirection: this.aiAdditionalDirection().trim(),
                levelStart: this.aiLevelStart(),
                levelEnd: this.aiLevelEnd()
            });

            this.generatedDraft.set({
                name: generated.name,
                setting: generated.setting,
                tone: generated.tone,
                levelStart: generated.levelStart,
                levelEnd: generated.levelEnd,
                hook: generated.hook,
                nextSession: '',
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
            levelStart: draft.levelStart,
            levelEnd: draft.levelEnd,
            hook: draft.hook,
            nextSession: '',
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
            await this.router.navigate(['/campaigns', created.id]);
        } catch (error) {
            this.createError.set(this.readApiError(error, 'Could not create campaign right now. Please try again.'));
        } finally {
            this.createPending.set(false);
            this.cdr.detectChanges();
        }
    }

    private readApiError(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                return detail || title || fallback;
            }
        }

        return fallback;
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
