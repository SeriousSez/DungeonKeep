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
    levelStart: number;
    levelEnd: number;
    hook: string;
    nextSession: string;
    summary: string;
}

const emptyCampaignDraft = (): CampaignDraft => ({
    name: '',
    setting: '',
    tone: 'Heroic',
    levelStart: 1,
    levelEnd: 4,
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
        id: 'court-of-knives',
        title: 'Court of Knives',
        setting: 'Velisport Senate',
        tone: 'Political Intrigue',
        levelStart: 3,
        levelEnd: 9,
        hook: 'An heir disappears on the eve of a treaty vote, and every faction claims innocence.',
        nextSession: '',
        summary: 'A social-pressure campaign of spies, leverage, and shifting alliances in a city-state on edge.'
    },
    {
        id: 'last-light-caravan',
        title: 'Last Light Caravan',
        setting: 'The Glass Wastes',
        tone: 'Survival',
        levelStart: 1,
        levelEnd: 7,
        hook: 'The final supply caravan vanishes between waystations, leaving three settlements one storm from collapse.',
        nextSession: '',
        summary: 'A scarcity-driven expedition where weather, routes, and ration choices matter as much as combat.'
    },
    {
        id: 'banner-of-ash',
        title: 'Banner of Ash',
        setting: 'The Ember Front',
        tone: 'Epic War',
        levelStart: 5,
        levelEnd: 12,
        hook: 'A border fortress falls overnight, opening a road straight to the capital unless the line can be rebuilt.',
        nextSession: '',
        summary: 'A theater-scale war campaign with command decisions, supply lines, and decisive battlefield objectives.'
    },
    {
        id: 'starlit-reliquary',
        title: 'Starlit Reliquary',
        setting: 'The Meridian Observatory',
        tone: 'Cosmic',
        levelStart: 7,
        levelEnd: 13,
        hook: 'The night sky shifts into impossible constellations and an observatory vault unlocks itself for the first time in centuries.',
        nextSession: '',
        summary: 'A reality-bending mystery where star lore, ancient engines, and unknowable entities collide.'
    },
    {
        id: 'clockwork-carnival',
        title: 'Clockwork Carnival',
        setting: 'The Wandering Midway',
        tone: 'Whimsical',
        levelStart: 2,
        levelEnd: 8,
        hook: 'A traveling carnival appears between towns overnight, but its attractions begin granting wishes with strange side effects.',
        nextSession: '',
        summary: 'A playful adventure full of odd magic, bright characters, and hidden stakes beneath the spectacle.'
    },
    {
        id: 'black-briar-oath',
        title: 'Black Briar Oath',
        setting: 'Rookhollow Vale',
        tone: 'Gothic',
        levelStart: 4,
        levelEnd: 10,
        hook: 'A noble house breaks a century-old vow, and every grave marker in the valley turns toward their manor.',
        nextSession: '',
        summary: 'A moody curse-driven campaign of ancestral sins, haunted estates, and dangerous old promises.'
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
    readonly campaignAction = input<'create' | 'edit'>('create');

    readonly campaignCreated = output<CampaignDraft>();
    readonly characterCreated = output<CharacterDraft>();

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

    readonly campaignLevelRangeError = computed(() => {
        if (!this.campaignSubmitAttempted()) {
            return '';
        }

        return this.campaignDraft().levelEnd >= this.campaignDraft().levelStart
            ? ''
            : 'Ending level must be greater than or equal to starting level.';
    });

    readonly hasCampaignValidationErrors = computed(
        () =>
            !!this.campaignNameError() ||
            !!this.campaignSettingError() ||
            !!this.campaignHookError() ||
            !!this.campaignLevelRangeError()
    );

    readonly hasIdentityValidationErrors = computed(
        () =>
            !this.campaignDraft().name.trim() ||
            !this.campaignDraft().setting.trim() ||
            this.campaignDraft().levelEnd < this.campaignDraft().levelStart
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

    readonly isEditCampaignMode = computed(() => this.mode() === 'campaign' && this.campaignAction() === 'edit');

    readonly campaignPanelHeading = computed(() => (this.isEditCampaignMode() ? 'Edit campaign' : 'Create new campaign'));

    readonly campaignFormTitle = computed(() => (this.isEditCampaignMode() ? 'Edit campaign' : 'New campaign'));

    readonly campaignSubmitLabel = computed(() => (this.isEditCampaignMode() ? 'Update campaign' : 'Create campaign'));

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
                levelStart: seed.levelStart,
                levelEnd: seed.levelEnd,
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

    onLevelStartChanged(value: string | number): void {
        const parsed = Math.trunc(Number(value));
        const levelStart = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 1;
        const levelEnd = Math.max(levelStart, this.campaignDraft().levelEnd);

        this.campaignDraft.update((draft) => ({
            ...draft,
            levelStart,
            levelEnd: Math.min(levelEnd, 20)
        }));
    }

    onLevelEndChanged(value: string | number): void {
        const parsed = Math.trunc(Number(value));
        const levelStart = this.campaignDraft().levelStart;
        const levelEnd = Number.isFinite(parsed) ? Math.min(Math.max(parsed, levelStart), 20) : levelStart;

        this.updateCampaign('levelEnd', levelEnd);
    }

    onCharacterRoleChanged(value: string | number): void {
        this.updateCharacter('role', String(value) as CharacterDraft['role']);
    }

    goToNextCampaignStep(): void {
        if (!this.canGoToNextStep()) {
            return;
        }

        this.goToCampaignStep(this.campaignStepIndex() + 1);
    }

    goToPreviousCampaignStep(): void {
        if (!this.canGoToPreviousStep()) {
            return;
        }

        this.goToCampaignStep(this.campaignStepIndex() - 1);
    }

    goToCampaignStep(index: number): void {
        const boundedIndex = Math.max(0, Math.min(index, this.campaignStepOrder.length - 1));
        const currentIndex = this.campaignStepIndex();

        if (boundedIndex === currentIndex) {
            return;
        }

        if (boundedIndex < currentIndex) {
            this.campaignStepIndex.set(boundedIndex);
            return;
        }

        this.campaignSubmitAttempted.set(true);

        if (boundedIndex >= 1 && this.hasIdentityValidationErrors()) {
            this.campaignStepIndex.set(0);
            return;
        }

        if (boundedIndex >= 2 && this.hasStoryValidationErrors()) {
            this.campaignStepIndex.set(1);
            return;
        }

        this.campaignStepIndex.set(boundedIndex);
    }

    applyCampaignTemplate(template: CampaignTemplate): void {
        this.selectedTemplateId.set(template.id);
        this.campaignDraft.update((draft) => ({
            ...draft,
            setting: template.setting,
            tone: template.tone,
            levelStart: template.levelStart,
            levelEnd: template.levelEnd,
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
            Chaotic: `A cascade of arcane mishaps in ${setting} forces ${campaignName} into a race against unpredictable fallout.`,
            Grimdark: `A ruthless power in ${setting} offers ${campaignName} a victory that demands an unforgivable price.`,
            Gothic: `Whispers from a ruined manor in ${setting} draw ${campaignName} toward a family curse that refuses to die.`,
            Horror: `Something unseen stalks ${setting}, and ${campaignName} must identify it before the next dawn takes another victim.`,
            Noblebright: `A small community in ${setting} risks everything to defend hope, and ${campaignName} is their last chance.`,
            'Sword-and-Sorcery': `A stolen relic from ${setting} promises fortune and ruin, pulling ${campaignName} into a brutal race for power.`,
            'Political Intrigue': `A fragile pact in ${setting} begins to fracture, and ${campaignName} must expose the hand behind the betrayal.`,
            Mythic: `Ancient prophecies across ${setting} awaken, naming ${campaignName} as key to an age-defining trial.`,
            Survival: `Supplies fail in ${setting} after a sudden catastrophe, forcing ${campaignName} to secure shelter before nightfall.`,
            'Pulp Adventure': `A daring lead in ${setting} launches ${campaignName} from one perilous set-piece to the next.`,
            'Dark Fantasy': `A cursed bargain resurfaces in ${setting}, and ${campaignName} must choose which evil can be endured.`,
            Whimsical: `A delightful impossibility appears in ${setting}, and ${campaignName} soon discovers the playful mystery hides real stakes.`,
            Noir: `A vanished witness in ${setting} leaves clues in smoke and rumor, drawing ${campaignName} into a case no one wants solved.`,
            'Epic War': `War drums echo across ${setting}, and ${campaignName} is tasked with turning one decisive front before dawn.`,
            Cosmic: `Strange patterns in ${setting} hint at minds beyond reality, and ${campaignName} must act before the veil tears.`,
            'Heroic Tragedy': `To save ${setting}, ${campaignName} must pursue a victory that may cost what they value most.`
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
