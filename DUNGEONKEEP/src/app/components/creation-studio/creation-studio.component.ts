import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CampaignDraft, CharacterDraft } from '../../models/dungeon.models';
import { DropdownComponent, type DropdownOption } from '../dropdown/dropdown.component';
import { ThemedDatepickerComponent } from '../themed-datepicker/themed-datepicker.component';

type CampaignWizardStep = 'identity' | 'story' | 'review';

interface CampaignTemplate {
    id: string;
    title: string;
    setting: string;
    tone: CampaignDraft['tone'];
    hook: string;
    nextSession: string;
    summary: string;
}

const emptyCampaignDraft = (): CampaignDraft => ({
    name: '',
    setting: '',
    tone: 'Heroic',
    hook: '',
    nextSession: '',
    summary: ''
});

const emptyCharacterDraft = (): CharacterDraft => ({
    name: '',
    playerName: '',
    race: '',
    className: '',
    level: 1,
    role: 'Striker',
    background: '',
    notes: ''
});

const campaignTemplates: ReadonlyArray<CampaignTemplate> = [
    {
        id: 'urban-intrigue',
        title: 'Urban Intrigue',
        setting: 'Crownspire City',
        tone: 'Mystic',
        hook: 'A missing magistrate leaves coded notes tied to three rival guilds.',
        nextSession: '',
        summary: 'A layered city conspiracy where social leverage matters as much as steel.'
    },
    {
        id: 'frontier-hexcrawl',
        title: 'Frontier Hexcrawl',
        setting: 'The Ashen Marches',
        tone: 'Heroic',
        hook: 'Surveyors vanished beyond the last waypoint and the frontier map keeps changing overnight.',
        nextSession: '',
        summary: 'Exploration-driven campaign focused on dangerous wilderness, landmarks, and hard choices.'
    },
    {
        id: 'horror-mystery',
        title: 'Horror Mystery',
        setting: 'Mourningfen',
        tone: 'Grim',
        hook: 'Each midnight, one villager forgets their own name and wakes with muddy footprints at the old crypt.',
        nextSession: '',
        summary: 'Investigation-heavy story with escalating dread and unreliable witness accounts.'
    },
    {
        id: 'planar-chaos',
        title: 'Planar Chaos',
        setting: 'The Fractured Axis',
        tone: 'Chaotic',
        hook: 'Planar rifts appear above busy trade routes, spitting out relics and raiders in equal measure.',
        nextSession: '',
        summary: 'Fast-moving, high-variance campaign with faction politics across unstable portals.'
    }
];

const campaignStepOrder: ReadonlyArray<CampaignWizardStep> = ['identity', 'story', 'review'];

@Component({
    selector: 'app-creation-studio',
    imports: [CommonModule, FormsModule, DropdownComponent, ThemedDatepickerComponent],
    templateUrl: './creation-studio.component.html',
    styleUrl: './creation-studio.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreationStudioComponent {
    readonly mode = input<'both' | 'campaign' | 'character'>('both');
    readonly campaignSeedDraft = input<CampaignDraft | null>(null);

    readonly campaignCreated = output<CampaignDraft>();
    readonly characterCreated = output<CharacterDraft>();

    readonly toneOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Heroic', label: 'Heroic' },
        { value: 'Grim', label: 'Grim' },
        { value: 'Mystic', label: 'Mystic' },
        { value: 'Chaotic', label: 'Chaotic' }
    ];

    readonly roleOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Tank', label: 'Tank' },
        { value: 'Support', label: 'Support' },
        { value: 'Scout', label: 'Scout' },
        { value: 'Striker', label: 'Striker' },
        { value: 'Caster', label: 'Caster' }
    ];

    readonly campaignTemplates = campaignTemplates;
    readonly campaignStepOrder = campaignStepOrder;
    readonly campaignDraft = signal<CampaignDraft>(emptyCampaignDraft());
    readonly characterDraft = signal<CharacterDraft>(emptyCharacterDraft());
    readonly campaignSubmitAttempted = signal(false);
    readonly campaignStepIndex = signal(0);

    readonly currentCampaignStep = computed(() => this.campaignStepOrder[this.campaignStepIndex()]);
    readonly canGoToPreviousStep = computed(() => this.campaignStepIndex() > 0);
    readonly canGoToNextStep = computed(() => this.campaignStepIndex() < this.campaignStepOrder.length - 1);
    readonly selectedTemplateId = signal('');

    readonly campaignNameError = computed(() => {
        if (!this.campaignSubmitAttempted()) {
            return '';
        }

        return this.campaignDraft().name.trim() ? '' : 'Campaign name is required.';
    });

    readonly campaignSettingError = computed(() => {
        if (!this.campaignSubmitAttempted()) {
            return '';
        }

        return this.campaignDraft().setting.trim() ? '' : 'Setting is required.';
    });

    readonly campaignHookError = computed(() => {
        if (!this.campaignSubmitAttempted()) {
            return '';
        }

        return this.campaignDraft().hook.trim() ? '' : 'Hook is required.';
    });

    readonly hasCampaignValidationErrors = computed(
        () => !!this.campaignNameError() || !!this.campaignSettingError() || !!this.campaignHookError()
    );

    readonly hasIdentityValidationErrors = computed(
        () => !this.campaignDraft().name.trim() || !this.campaignDraft().setting.trim()
    );

    readonly hasStoryValidationErrors = computed(() => !this.campaignDraft().hook.trim());

    readonly previewTitle = computed(() => {
        const name = this.campaignDraft().name.trim();
        return name || 'Untitled Campaign';
    });

    readonly previewHook = computed(() => {
        const hook = this.campaignDraft().hook.trim();
        return hook || 'Define your inciting event to focus the first few sessions.';
    });

    readonly previewNextSession = computed(() => {
        const nextSession = this.campaignDraft().nextSession.trim();
        return nextSession || 'Not scheduled yet';
    });

    readonly previewSummary = computed(() => {
        const summary = this.campaignDraft().summary.trim();
        return summary || 'No campaign summary yet.';
    });

    constructor() {
        effect(() => {
            const seed = this.campaignSeedDraft();
            if (!seed) {
                return;
            }

            this.campaignDraft.set({
                name: seed.name,
                setting: seed.setting,
                tone: seed.tone,
                hook: seed.hook,
                nextSession: seed.nextSession,
                summary: seed.summary
            });
            this.campaignSubmitAttempted.set(false);
            this.campaignStepIndex.set(0);
            this.selectedTemplateId.set('');
        });
    }

    updateCampaign<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]): void {
        this.campaignDraft.update((draft) => ({ ...draft, [key]: value }));
    }

    updateCharacter<K extends keyof CharacterDraft>(key: K, value: CharacterDraft[K]): void {
        this.characterDraft.update((draft) => ({ ...draft, [key]: value }));
    }

    onToneChanged(value: string | number): void {
        const tone = String(value) as CampaignDraft['tone'];
        this.updateCampaign('tone', tone);
    }

    onCharacterRoleChanged(value: string | number): void {
        this.updateCharacter('role', String(value) as CharacterDraft['role']);
    }

    goToNextCampaignStep(): void {
        if (!this.canGoToNextStep()) {
            return;
        }

        this.campaignSubmitAttempted.set(true);

        if (this.currentCampaignStep() === 'identity' && this.hasIdentityValidationErrors()) {
            return;
        }

        if (this.currentCampaignStep() === 'story' && this.hasStoryValidationErrors()) {
            return;
        }

        this.campaignStepIndex.update((step) => Math.min(step + 1, this.campaignStepOrder.length - 1));
    }

    goToPreviousCampaignStep(): void {
        if (!this.canGoToPreviousStep()) {
            return;
        }

        this.campaignStepIndex.update((step) => Math.max(step - 1, 0));
    }

    applyCampaignTemplate(template: CampaignTemplate): void {
        this.selectedTemplateId.set(template.id);
        this.campaignDraft.update((draft) => ({
            ...draft,
            setting: template.setting,
            tone: template.tone,
            hook: template.hook,
            nextSession: template.nextSession,
            summary: template.summary
        }));
    }

    suggestCampaignHook(): void {
        const setting = this.campaignDraft().setting.trim() || 'your setting';
        const campaignName = this.campaignDraft().name.trim() || 'this campaign';
        const tone = this.campaignDraft().tone;

        const hookByTone: Record<CampaignDraft['tone'], string> = {
            Heroic: `A desperate messenger arrives from ${setting} with a plea that only ${campaignName} can answer.`,
            Grim: `A trusted ally in ${setting} vanishes after uncovering a buried atrocity tied to ${campaignName}.`,
            Mystic: `Ancient omens flare across ${setting}, pointing to a sealed secret at the heart of ${campaignName}.`,
            Chaotic: `A cascade of arcane mishaps in ${setting} forces ${campaignName} into a race against unpredictable fallout.`
        };

        this.updateCampaign('hook', hookByTone[tone]);
    }

    addCampaign(): void {
        this.campaignSubmitAttempted.set(true);

        const draft = {
            ...this.campaignDraft(),
            name: this.campaignDraft().name.trim(),
            setting: this.campaignDraft().setting.trim(),
            hook: this.campaignDraft().hook.trim(),
            nextSession: this.campaignDraft().nextSession.trim(),
            summary: this.campaignDraft().summary.trim()
        };

        if (!draft.name || !draft.setting || !draft.hook) {
            if (!draft.name || !draft.setting) {
                this.campaignStepIndex.set(0);
                return;
            }

            this.campaignStepIndex.set(1);
            return;
        }

        this.campaignCreated.emit(draft);
        this.campaignDraft.set(emptyCampaignDraft());
        this.campaignSubmitAttempted.set(false);
        this.campaignStepIndex.set(0);
        this.selectedTemplateId.set('');
    }

    addCharacter(): void {
        const draft = {
            ...this.characterDraft(),
            name: this.characterDraft().name.trim(),
            playerName: this.characterDraft().playerName.trim(),
            race: this.characterDraft().race.trim(),
            className: this.characterDraft().className.trim(),
            background: this.characterDraft().background.trim(),
            notes: this.characterDraft().notes.trim()
        };

        if (!draft.name || !draft.playerName || !draft.className) {
            return;
        }

        this.characterCreated.emit(draft);
        this.characterDraft.set(emptyCharacterDraft());
    }
}
