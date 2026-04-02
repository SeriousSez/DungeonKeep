import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { classLevelOneFeatures } from '../../data/class-features.data';
import { premadeCharacters, type PremadeCharacter } from '../../data/premade-characters.data';
import { classSpellCatalog } from '../../data/class-spells.data';
import { races } from '../../data/races';
import { equipmentCatalog } from '../../data/new-character-standard-page.data';
import { spellDetailsMap } from '../../data/spell-details.data';
import type { SkillProficiencies } from '../../models/dungeon.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type CombatTab = 'actions' | 'spells' | 'inventory' | 'features' | 'background' | 'notes' | 'extras';
type SpellFilter = 'all' | '0' | '1' | '2' | '3';
type ActionFilter = 'all' | 'attack' | 'action' | 'bonus-action' | 'reaction' | 'other' | 'limited-use';
type BackgroundFilter = 'all' | 'background' | 'characteristics' | 'appearance';
type InventoryFilter = string; // Can be 'all', 'equipment', 'other', or a container name
type FeaturesFilter = 'all' | 'class-features' | 'species-traits' | 'feats';
type NotesFilter = 'all' | 'orgs' | 'allies' | 'enemies' | 'backstory' | 'other';

interface PersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
    weight?: number;
    costGp?: number;
    notes?: string;
    isContainer?: boolean;
    containedItems?: PersistedInventoryEntry[];
    maxCapacity?: number;
}

interface PersistedCurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

type PersistedAbilityScoreImprovementMode = '' | 'plus-two' | 'plus-one-plus-one';

interface PersistedAbilityScoreImprovementChoice {
    mode: PersistedAbilityScoreImprovementMode;
    primaryAbility: string;
    secondaryAbility: string;
}

interface PersistedFeatFollowUpChoice {
    abilityIncreaseAbility?: string;
}

interface PersistedBuilderState {
    selectedBackgroundName?: string;
    selectedLanguages?: string[];
    selectedSpeciesLanguages?: string[];
    selectedSpeciesTraitChoices?: Record<string, string[]>;
    classFeatureSelections?: Record<string, string[]>;
    abilityScoreImprovementChoices?: Record<string, PersistedAbilityScoreImprovementChoice>;
    featFollowUpChoices?: Record<string, PersistedFeatFollowUpChoice>;
    backgroundChoiceSelections?: Record<string, string>;
    abilityBaseScores?: Record<string, number>;
    abilityOverrideScores?: Record<string, number | null>;
    bgAbilityMode?: string;
    bgAbilityScoreFor2?: string;
    bgAbilityScoreFor1?: string;
    inventoryEntries?: PersistedInventoryEntry[];
    currency?: PersistedCurrencyState;
    classPreparedSpells?: Record<string, string[]>;
    classKnownSpellsByClass?: Record<string, string[]>;
    wizardSpellbookByClass?: Record<string, string[]>;
    usedSpellSlotsByLevel?: Record<number, number>;
}

interface CombatRow {
    name: string;
    subtitle: string;
    range: string;
    hitDcLabel: string;
    damage: string;
    notes: string;
    concentration: boolean;
    ritual: boolean;
}

interface DetailDrawerContent {
    title: string;
    subtitle: string;
    description: string;
    bullets: string[];
}

@Component({
    selector: 'app-character-detail-page',
    imports: [CommonModule, RouterLink, DropdownComponent],
    templateUrl: './character-detail-page.component.html',
    styleUrl: './character-detail-page.component.scss'
})
export class CharacterDetailPageComponent {
    private static readonly UNASSIGNED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000';

    private readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';
    private readonly catalogLookup = new Map(equipmentCatalog.map((item) => [item.name.toLowerCase(), item]));
    private readonly premadeCharacterLookup = new Map<string, PremadeCharacter>(
        premadeCharacters.map((character) => [this.getPremadeLookupKey(character), character])
    );

    private readonly weaponDamageMap: Record<string, string> = {
        'club': '1d4 Bludgeoning',
        'dagger': '1d4 Piercing',
        'greatclub': '1d8 Bludgeoning',
        'handaxe': '1d6 Slashing',
        'javelin': '1d6 Piercing',
        'light hammer': '1d4 Bludgeoning',
        'mace': '1d6 Bludgeoning',
        'quarterstaff': '1d6 Bludgeoning',
        'sickle': '1d4 Slashing',
        'spear': '1d6 Piercing',
        'crossbow, light': '1d8 Piercing',
        'shortbow': '1d6 Piercing',
        'longbow': '1d8 Piercing',
        'longsword': '1d8 Slashing',
        'greatsword': '2d6 Slashing',
        'greataxe': '1d12 Slashing',
        'warhammer': '1d8 Bludgeoning',
        'rapier': '1d8 Piercing',
        'scimitar': '1d6 Slashing',
        'battleaxe': '1d8 Slashing',
        'flail': '1d8 Bludgeoning',
        'glaive': '1d10 Slashing',
        'halberd': '1d10 Slashing',
        'lance': '1d10 Piercing',
        'maul': '2d6 Bludgeoning',
        'morningstar': '1d8 Piercing',
        'pike': '1d10 Piercing',
        'shortsword': '1d6 Piercing',
        'trident': '1d8 Piercing',
        'war pick': '1d8 Piercing',
        'whip': '1d4 Slashing',
        'crossbow, hand': '1d6 Piercing',
        'crossbow, heavy': '1d10 Piercing',
        'pistol': '3d4 Piercing',
        'musket': '5d4 Piercing',
        'blunderbuss': '3d8 Piercing',
        'pepperbox': '4d10 Piercing'
    };

    private readonly containerItemNames = new Set([
        'backpack',
        'bag of holding',
        'bag',
        'sack',
        'pouch',
        'chest',
        'quiver',
        'scroll case',
        'map case',
        'satchel',
        'waterskin',
        'vial',
        'flask',
        'bottle',
        'barrel',
        'basket',
        'box',
        'coffer',
        'case'
    ]);

    private readonly raceLookup = new Map(
        races.flatMap((race) => [
            [race.id.toLowerCase(), race],
            [race.name.toLowerCase(), race]
        ])
    );

    private readonly abilityKeyMap: Record<AbilityKey, string> = {
        strength: 'STR',
        dexterity: 'DEX',
        constitution: 'CON',
        intelligence: 'INT',
        wisdom: 'WIS',
        charisma: 'CHA'
    };

    private readonly skillAbilityMap = {
        acrobatics: 'dexterity',
        animalHandling: 'wisdom',
        arcana: 'intelligence',
        athletics: 'strength',
        deception: 'charisma',
        history: 'intelligence',
        insight: 'wisdom',
        intimidation: 'charisma',
        investigation: 'intelligence',
        medicine: 'wisdom',
        nature: 'intelligence',
        perception: 'wisdom',
        performance: 'charisma',
        persuasion: 'charisma',
        sleightOfHand: 'dexterity',
        stealth: 'dexterity',
        survival: 'wisdom'
    } as const;

    private readonly saveProficienciesByClass: Record<string, AbilityKey[]> = {
        Barbarian: ['strength', 'constitution'],
        Bard: ['dexterity', 'charisma'],
        Cleric: ['wisdom', 'charisma'],
        Druid: ['intelligence', 'wisdom'],
        Fighter: ['strength', 'constitution'],
        Monk: ['strength', 'dexterity'],
        Paladin: ['wisdom', 'charisma'],
        Ranger: ['strength', 'dexterity'],
        Rogue: ['dexterity', 'intelligence'],
        Sorcerer: ['constitution', 'charisma'],
        Warlock: ['wisdom', 'charisma'],
        Wizard: ['intelligence', 'wisdom']
    };

    private readonly hitDieByClass: Record<string, number> = {
        Barbarian: 12,
        Bard: 8,
        Cleric: 8,
        Druid: 8,
        Fighter: 10,
        Monk: 8,
        Paladin: 10,
        Ranger: 10,
        Rogue: 8,
        Sorcerer: 6,
        Warlock: 8,
        Wizard: 6
    };

    private readonly casterTypeByClass: Record<string, 'none' | 'full' | 'half'> = {
        Barbarian: 'none',
        Bard: 'full',
        Cleric: 'full',
        Druid: 'full',
        Fighter: 'none',
        Monk: 'none',
        Paladin: 'half',
        Ranger: 'half',
        Rogue: 'none',
        Sorcerer: 'full',
        Warlock: 'full',
        Wizard: 'full'
    };

    private readonly spellcastingAbilityByClass: Partial<Record<string, AbilityKey>> = {
        Bard: 'charisma',
        Cleric: 'wisdom',
        Druid: 'wisdom',
        Paladin: 'charisma',
        Ranger: 'wisdom',
        Sorcerer: 'charisma',
        Warlock: 'charisma',
        Wizard: 'intelligence'
    };


    readonly characterId = this.route.snapshot.paramMap.get('id') || '';
    readonly activeCombatTab = signal<CombatTab>('actions');
    readonly activeSpellFilter = signal<SpellFilter>('all');
    readonly spellSearchTerm = signal('');
    readonly activeActionFilter = signal<ActionFilter>('all');
    readonly activeBackgroundFilter = signal<BackgroundFilter>('all');
    readonly activeInventoryFilter = signal<InventoryFilter>('all');
    readonly inventorySearchTerm = signal('');
    readonly activeFeaturesFilter = signal<FeaturesFilter>('all');
    readonly activeNotesFilter = signal<NotesFilter>('all');
    readonly selectedCampaignAssignment = signal('');
    readonly isUpdatingCampaign = signal(false);
    readonly campaignUpdateError = signal('');
    readonly usedSpellSlotsByLevel = signal<Record<number, number>>({});
    readonly expandedContainers = signal<Set<string>>(new Set());
    readonly activeDetailDrawer = signal<DetailDrawerContent | null>(null);

    private lastCharacterId: string | null = null;
    private saveSpellSlotTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        // Seed usedSpellSlotsByLevel from persisted state whenever the character
        // or their saved data changes (e.g. on first load or navigation).
        effect(() => {
            const initial = this.initialSpellSlots();
            const char = this.character();
            if (!char) return;
            if (this.lastCharacterId !== char.id) {
                this.lastCharacterId = char.id;
                this.usedSpellSlotsByLevel.set({ ...initial });
            }
        });
    }


    readonly combatTabs: Array<{ key: CombatTab; label: string }> = [
        { key: 'actions', label: 'Actions' },
        { key: 'spells', label: 'Spells' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'features', label: 'Features & Traits' },
        { key: 'background', label: 'Background' },
        { key: 'notes', label: 'Notes' },
        { key: 'extras', label: 'Extras' }
    ];

    readonly actionFilters: Array<{ key: ActionFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'attack', label: 'Attack' },
        { key: 'action', label: 'Action' },
        { key: 'bonus-action', label: 'Bonus Action' },
        { key: 'reaction', label: 'Reaction' },
        { key: 'other', label: 'Other' },
        { key: 'limited-use', label: 'Limited Use' }
    ];

    readonly spellFilters: Array<{ key: SpellFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: '0', label: '-0-' },
        { key: '1', label: '1st' },
        { key: '2', label: '2nd' },
        { key: '3', label: '3rd' }
    ];

    readonly backgroundFilters: Array<{ key: BackgroundFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'background', label: 'Background' },
        { key: 'characteristics', label: 'Characteristics' },
        { key: 'appearance', label: 'Appearance' }
    ];

    readonly inventoryFilters = computed(() => {
        const entries = this.normalizedInventoryEntries();
        const containerNames = new Set<string>();

        for (const entry of entries) {
            if (entry.isContainer) {
                containerNames.add(entry.name);
            }
        }

        const filters: Array<{ key: InventoryFilter; label: string }> = [
            { key: 'all', label: 'All' },
            { key: 'equipment', label: 'Equipment' }
        ];

        // Add dynamic container tabs
        for (const containerName of containerNames) {
            filters.push({ key: containerName, label: containerName });
        }

        return filters;
    });

    readonly featuresFilters: Array<{ key: FeaturesFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'class-features', label: 'Class Features' },
        { key: 'species-traits', label: 'Species Traits' },
        { key: 'feats', label: 'Feats' }
    ];

    readonly notesFilters: Array<{ key: NotesFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'orgs', label: 'Orgs' },
        { key: 'allies', label: 'Allies' },
        { key: 'enemies', label: 'Enemies' },
        { key: 'backstory', label: 'Backstory' },
        { key: 'other', label: 'Other' }
    ];

    readonly STANDARD_COMBAT_ACTIONS = [
        'Attack', 'Dash', 'Disengage', 'Dodge', 'Grapple', 'Help',
        'Hide', 'Improvise', 'Influence', 'Magic', 'Ready', 'Search', 'Shove', 'Study', 'Utilize'
    ];
    readonly STANDARD_BONUS_COMBAT_ACTIONS = ['Two-Weapon Fighting'];
    readonly STANDARD_REACTIONS = ['Opportunity Attack'];
    readonly STANDARD_OTHER_ACTIONS = ['Interact with an Object'];

    private readonly SPELL_LEVEL_LABELS: Record<number, string> = {
        0: 'Cantrip', 1: '1st Level', 2: '2nd Level', 3: '3rd Level',
        4: '4th Level', 5: '5th Level', 6: '6th Level', 7: '7th Level',
        8: '8th Level', 9: '9th Level'
    };

    readonly character = computed(() =>
        this.store.characters().find((item) => item.id === this.characterId) || null
    );

    readonly parsedNotes = computed(() => this.parsePersistedNotes(this.character()?.notes ?? ''));

    readonly persistedBuilderState = computed(() => this.parsedNotes().state);

    readonly normalizedInventoryEntries = computed<PersistedInventoryEntry[]>(() => {
        const entries = this.persistedBuilderState()?.inventoryEntries;
        const sourceEntries = Array.isArray(entries) && entries.length > 0
            ? entries
            : this.getPremadeInventoryEntries();

        if (sourceEntries.length === 0) {
            return [];
        }

        return sourceEntries
            .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.category === 'string')
            .map((entry) => this.normalizeInventoryEntry(entry))
            .filter((entry) => entry.name.length > 0 && entry.category.length > 0);
    });

    private normalizeInventoryEntry(entry: PersistedInventoryEntry): PersistedInventoryEntry {
        const name = entry.name.trim();
        const category = entry.category.trim();
        const quantity = Math.max(1, Math.trunc(Number(entry.quantity) || 1));
        const containedItems = Array.isArray(entry.containedItems)
            ? entry.containedItems
                .filter((item) => item && typeof item.name === 'string' && typeof item.category === 'string')
                .map((item) => this.normalizeInventoryEntry(item))
            : [];
        const isContainer = Boolean(entry.isContainer) || this.isContainerItemName(name) || containedItems.length > 0;
        const catalogItem = this.catalogLookup.get(name.toLowerCase());

        return {
            ...entry,
            name,
            category,
            quantity,
            weight: typeof entry.weight === 'number' ? entry.weight : catalogItem?.weight,
            costGp: typeof entry.costGp === 'number' ? entry.costGp : catalogItem?.costGp,
            notes: entry.notes?.trim() || catalogItem?.notes || undefined,
            isContainer,
            containedItems,
            maxCapacity: entry.maxCapacity ?? (isContainer ? this.getContainerCapacity(name) : undefined)
        };
    }

    private getPremadeInventoryEntries(): PersistedInventoryEntry[] {
        const character = this.character();
        if (!character) {
            return [];
        }

        return this.premadeCharacterLookup.get(this.getPremadeLookupKey(character))?.inventoryEntries ?? [];
    }

    private getPremadeLookupKey(character: { name: string; race: string; className: string; background: string }): string {
        return [character.name, character.race, character.className, character.background]
            .map((value) => value.trim().toLowerCase())
            .join('|');
    }

    readonly initialSpellSlots = computed(() => {
        const state = this.persistedBuilderState();
        if (state?.usedSpellSlotsByLevel && Object.keys(state.usedSpellSlotsByLevel).length > 0) {
            return { ...state.usedSpellSlotsByLevel };
        }
        return {};
    });

    private saveSpellSlotUsage(): void {
        // Clear any pending save
        if (this.saveSpellSlotTimeout) {
            clearTimeout(this.saveSpellSlotTimeout);
        }

        // Debounce the save by 1 second
        this.saveSpellSlotTimeout = setTimeout(() => {
            const char = this.character();
            if (!char) {
                return;
            }

            const currentState = this.persistedBuilderState() || {};
            const updatedState: PersistedBuilderState = {
                ...currentState,
                usedSpellSlotsByLevel: this.usedSpellSlotsByLevel()
            };

            const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

            this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: updatedNotes,
                campaignId: char.campaignId
            });
        }, 1000);
    }

    private createPersistedNotesString(originalNotes: string, state: PersistedBuilderState): string {
        const cleanedNotes = this.parsePersistedNotes(originalNotes).cleanedNotes;
        const stateJson = JSON.stringify(state);
        return `${cleanedNotes}\n\n${this.builderStateStartTag}${stateJson}${this.builderStateEndTag}`.trim();
    }




    readonly displayBackground = computed(() => {
        const fromBuilder = this.persistedBuilderState()?.selectedBackgroundName?.trim() ?? '';
        if (fromBuilder) {
            return fromBuilder;
        }

        return this.character()?.background || 'Not set';
    });

    readonly persistedSkillProficiencies = computed(() => {
        const state = this.persistedBuilderState();
        if (!state) {
            return new Set<string>();
        }

        const collected = new Set<string>();
        const classSelections = state.classFeatureSelections ?? {};

        for (const pickedValues of Object.values(classSelections)) {
            for (const value of pickedValues ?? []) {
                const parsed = this.parseSkillTokens(value);
                for (const skillKey of parsed) {
                    collected.add(skillKey);
                }
            }
        }

        const backgroundSelections = state.backgroundChoiceSelections ?? {};
        for (const pickedValue of Object.values(backgroundSelections)) {
            for (const skillKey of this.parseSkillTokens(pickedValue)) {
                collected.add(skillKey);
            }
        }

        return collected;
    });

    readonly effectiveAbilityScores = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const persistedScores = this.getPersistedAbilityScores(this.persistedBuilderState());
        if (persistedScores) {
            return persistedScores;
        }

        return char.abilityScores ?? {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };
    });

    readonly campaignName = computed(() => {
        const char = this.character();
        if (!char) {
            return 'Unknown Campaign';
        }

        if (char.campaignId === CharacterDetailPageComponent.UNASSIGNED_CAMPAIGN_ID) {
            return 'Unassigned';
        }

        return this.store.campaigns().find((campaign) => campaign.id === char.campaignId)?.name ?? 'Unassigned';
    });

    readonly assignableCampaignOptions = computed<DropdownOption[]>(() =>
        this.store.campaigns().map((campaign) => ({ value: campaign.id, label: campaign.name }))
    );

    readonly raceInfo = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        return this.raceLookup.get(char.race.toLowerCase()) ?? null;
    });

    readonly basicIdentityRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const noteContext = this.noteContext();

        return [
            { label: 'Name', value: char.name },
            { label: 'Class & Level', value: `${char.className} ${char.level}` },
            { label: 'Race', value: char.race },
            { label: 'Background', value: this.displayBackground() },
            { label: 'Alignment', value: noteContext.alignment || 'Not recorded' },
            { label: 'Lifestyle', value: noteContext.lifestyle || 'Not recorded' },
            { label: 'Faith', value: noteContext.faith || 'Not recorded' },
            { label: 'Experience', value: noteContext.experience || 'Not recorded' }
        ];
    });

    readonly appearanceRows = computed(() => {
        const context = this.noteContext();
        return [
            { label: 'Gender', value: context.physical.gender || 'Not set' },
            { label: 'Age', value: context.physical.age || 'Not set' },
            { label: 'Height', value: context.physical.height || 'Not set' },
            { label: 'Weight', value: context.physical.weight || 'Not set' },
            { label: 'Hair', value: context.physical.hair || 'Not set' },
            { label: 'Eyes', value: context.physical.eyes || 'Not set' },
            { label: 'Skin', value: context.physical.skin || 'Not set' }
        ];
    });

    readonly speed = computed(() => {
        const char = this.character();
        if (!char) {
            return 30;
        }

        const race = this.raceLookup.get(char.race.toLowerCase());
        return race?.speed ?? 30;
    });

    readonly initiative = computed(() => {
        const scores = this.effectiveAbilityScores();
        if (!scores) {
            return 0;
        }

        return this.getAbilityModifier(scores.dexterity);
    });

    readonly passivePerception = computed(() => this.getPassiveSkillValue('perception'));
    readonly passiveInvestigation = computed(() => this.getPassiveSkillValue('investigation'));
    readonly passiveInsight = computed(() => this.getPassiveSkillValue('insight'));

    readonly combatDetailRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const hitDie = this.hitDieByClass[char.className] ?? 8;
        return [
            { label: 'Current HP', value: `${char.hitPoints}` },
            { label: 'Max HP', value: `${char.maxHitPoints}` },
            { label: 'Temporary HP', value: '0' },
            { label: 'Hit Dice', value: `${char.level}d${hitDie}` },
            { label: 'Death Saves', value: char.status === 'Recovering' ? '1 failure' : '0 failures' }
        ];
    });

    readonly savingThrows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const saveProficiencies = new Set(this.saveProficienciesByClass[char.className] ?? []);
        const scores = this.effectiveAbilityScores() ?? {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        return [
            { key: 'strength', label: 'STR', score: scores.strength },
            { key: 'dexterity', label: 'DEX', score: scores.dexterity },
            { key: 'constitution', label: 'CON', score: scores.constitution },
            { key: 'intelligence', label: 'INT', score: scores.intelligence },
            { key: 'wisdom', label: 'WIS', score: scores.wisdom },
            { key: 'charisma', label: 'CHA', score: scores.charisma }
        ].map((item) => {
            const proficient = saveProficiencies.has(item.key as AbilityKey);
            const base = this.getAbilityModifier(item.score);
            const modifier = base + (proficient ? char.proficiencyBonus : 0);

            return {
                ...item,
                proficient,
                modifierLabel: this.formatSigned(modifier)
            };
        });
    });

    readonly skillRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        return [
            { name: 'Acrobatics', key: 'acrobatics' },
            { name: 'Animal Handling', key: 'animalHandling' },
            { name: 'Arcana', key: 'arcana' },
            { name: 'Athletics', key: 'athletics' },
            { name: 'Deception', key: 'deception' },
            { name: 'History', key: 'history' },
            { name: 'Insight', key: 'insight' },
            { name: 'Intimidation', key: 'intimidation' },
            { name: 'Investigation', key: 'investigation' },
            { name: 'Medicine', key: 'medicine' },
            { name: 'Nature', key: 'nature' },
            { name: 'Perception', key: 'perception' },
            { name: 'Performance', key: 'performance' },
            { name: 'Persuasion', key: 'persuasion' },
            { name: 'Sleight of Hand', key: 'sleightOfHand' },
            { name: 'Stealth', key: 'stealth' },
            { name: 'Survival', key: 'survival' }
        ].map((skill) => {
            const abilityKey = this.skillAbilityMap[skill.key as keyof typeof this.skillAbilityMap];
            const abilityScore = this.effectiveAbilityScores()?.[abilityKey] ?? 10;
            const proficient = this.isSkillProficient(skill.key, char.skills);
            const modifier = this.getAbilityModifier(abilityScore) + (proficient ? char.proficiencyBonus : 0);

            return {
                ...skill,
                ability: this.abilityKeyMap[abilityKey],
                proficient,
                modifierLabel: this.formatSigned(modifier)
            };
        });
    });

    readonly abilityCards = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        return [
            { key: 'strength', abbr: 'STR', name: 'Strength', score: this.effectiveAbilityScores()?.strength ?? 10 },
            { key: 'dexterity', abbr: 'DEX', name: 'Dexterity', score: this.effectiveAbilityScores()?.dexterity ?? 10 },
            { key: 'constitution', abbr: 'CON', name: 'Constitution', score: this.effectiveAbilityScores()?.constitution ?? 10 },
            { key: 'intelligence', abbr: 'INT', name: 'Intelligence', score: this.effectiveAbilityScores()?.intelligence ?? 10 },
            { key: 'wisdom', abbr: 'WIS', name: 'Wisdom', score: this.effectiveAbilityScores()?.wisdom ?? 10 },
            { key: 'charisma', abbr: 'CHA', name: 'Charisma', score: this.effectiveAbilityScores()?.charisma ?? 10 }
        ].map((ability) => ({
            ...ability,
            modifierLabel: this.formatSigned(this.getAbilityModifier(ability.score))
        }));
    });

    readonly spellSaveDC = computed(() => {
        const char = this.character();
        if (!char) {
            return 10;
        }

        const castingAbility = this.spellcastingAbilityByClass[char.className];
        if (!castingAbility) {
            return 8 + (char.proficiencyBonus ?? 2);
        }

        const mod = this.getAbilityModifier(this.effectiveAbilityScores()?.[castingAbility] ?? 10);
        return 8 + (char.proficiencyBonus ?? 2) + mod;
    });

    readonly spellAttackBonus = computed(() => {
        const char = this.character();
        if (!char) {
            return '+0';
        }

        const castingAbility = this.spellcastingAbilityByClass[char.className];
        const abilityMod = castingAbility ? this.getAbilityModifier(this.effectiveAbilityScores()?.[castingAbility] ?? 10) : 0;
        return this.formatSigned((char.proficiencyBonus ?? 2) + abilityMod);
    });

    readonly spellcastingProfile = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const casterType = this.casterTypeByClass[char.className] ?? 'none';
        if (casterType === 'none') {
            return null;
        }

        const ability = this.spellcastingAbilityByClass[char.className] ?? 'wisdom';
        const slotValues = this.getSpellSlots(char.level, casterType);
        const slots = slotValues
            .map((count, index) => ({ level: index + 1, count }))
            .filter((slot) => slot.count > 0);

        return {
            ability: this.abilityKeyMap[ability],
            modifierLabel: this.formatSigned(this.getAbilityModifier(this.effectiveAbilityScores()?.[ability] ?? 10)),
            saveDC: this.spellSaveDC(),
            attackBonus: this.spellAttackBonus(),
            slots
        };
    });

    readonly persistedSpellRows = computed(() => {
        const char = this.character();
        const persisted = this.persistedBuilderState();
        if (!char || !persisted) {
            return [] as Array<{ name: string; level: number; castingTime: string; hitDcLabel: string; range: string; damage: string; concentration: boolean; ritual: boolean }>;
        }

        const className = char.className;
        const preparedNames = persisted.classPreparedSpells?.[className] ?? [];
        const knownNames = persisted.classKnownSpellsByClass?.[className] ?? [];
        const wizardSpellbookNames = persisted.wizardSpellbookByClass?.[className] ?? [];
        const ritualKnownNames = knownNames.filter((name) => this.isRitualSpell(name));

        let selectedNames: string[];
        if (className === 'Wizard') {
            const wizardCantrips = wizardSpellbookNames.filter((name) => this.getSpellLevelForDetails(className, name) === 0);
            const preparedLeveled = preparedNames.filter((name) => this.getSpellLevelForDetails(className, name) > 0);
            const ritualFromSpellbook = wizardSpellbookNames.filter((name) => this.isRitualSpell(name) && this.getSpellLevelForDetails(className, name) > 0);
            selectedNames = [...wizardCantrips, ...preparedLeveled, ...ritualFromSpellbook];
        } else if (preparedNames.length > 0) {
            selectedNames = [...preparedNames, ...ritualKnownNames];
        } else {
            selectedNames = knownNames;
        }

        const uniqueNames = [...new Set(selectedNames)];
        const spellBonus = this.spellAttackBonus();
        const saveDC = this.spellSaveDC();

        return uniqueNames
            .map((name) => {
                const details = spellDetailsMap[name];
                const as = details?.attackSave ?? '';
                const hitDcLabel = as.includes('Attack') ? spellBonus
                    : as.includes('Save') ? `DC ${saveDC}`
                        : '—';
                return {
                    name,
                    level: this.getSpellLevelForDetails(className, name),
                    castingTime: details?.castingTime ?? '—',
                    hitDcLabel,
                    range: details?.range ?? '—',
                    damage: 'Spell',
                    concentration: details?.concentration ?? false,
                    ritual: details?.ritual ?? false
                };
            })
            .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
    });

    readonly filteredSpellRows = computed(() => {
        const term = this.spellSearchTerm().trim().toLowerCase();
        if (!term) {
            return this.persistedSpellRows();
        }

        return this.persistedSpellRows().filter((row) => {
            const details = spellDetailsMap[row.name];
            const haystack = [
                row.name,
                row.castingTime,
                row.range,
                row.hitDcLabel,
                row.damage,
                details?.attackSave ?? '',
                details?.components ?? '',
                details?.damageEffect ?? '',
                details?.description ?? ''
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    });

    readonly spellCantrips = computed(() => {
        return this.filteredSpellRows().filter((row) => row.level === 0);
    });

    readonly spellsByLevel = computed(() => {
        const leveled = this.filteredSpellRows().filter((row) => row.level > 0);
        const groups = new Map<number, typeof leveled>();
        for (const spell of leveled) {
            if (!groups.has(spell.level)) groups.set(spell.level, []);
            groups.get(spell.level)!.push(spell);
        }
        return [...groups.entries()]
            .sort(([a], [b]) => a - b)
            .map(([level, spells]) => ({ level, spells }));
    });

    readonly hasLeveledSpells = computed(() => this.spellsByLevel().length > 0);

    readonly defenses = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const traitResistances = (char.traits ?? [])
            .filter((trait) => /resistance|resil|immune/i.test(trait))
            .map((trait) => trait.replace(/^[^:]*:\s*/, '').trim());

        return traitResistances;
    });

    readonly conditionSummary = computed(() => {
        const char = this.character();
        if (!char) {
            return 'No active conditions';
        }

        return char.status === 'Recovering' ? 'Recovering from previous encounter' : 'No active conditions';
    });

    readonly training = computed(() => {
        const char = this.character();
        if (!char) {
            return { armor: [] as string[], weapons: [] as string[], tools: [] as string[] };
        }

        return this.getTrainingFromSelections(this.persistedBuilderState());
    });

    readonly languageList = computed(() => {
        const persisted = this.persistedBuilderState();
        const selected = [
            ...(persisted?.selectedLanguages ?? []),
            ...(persisted?.selectedSpeciesLanguages ?? [])
        ]
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);

        const uniqueSelected = [...new Set(selected)];
        if (uniqueSelected.length > 0) {
            return uniqueSelected;
        }

        return this.raceInfo()?.languages ?? [];
    });

    readonly senses = computed(() => {
        const char = this.character();
        if (!char) {
            return ['Passive Perception 10'];
        }

        return [
            `Passive Perception ${this.passivePerception()}`,
            `Passive Investigation ${this.passiveInvestigation()}`,
            `Passive Insight ${this.passiveInsight()}`
        ];
    });

    readonly inventory = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const persistedEntries = this.normalizedInventoryEntries()
            .filter((entry) => !entry.isContainer)
            .map((entry) => ({
                name: entry.name,
                category: entry.category,
                quantity: entry.quantity,
                weight: entry.weight,
                costGp: entry.costGp,
                notes: entry.notes
            }));

        if (persistedEntries.length > 0) {
            const weapons: string[] = [];
            const armor: string[] = [];
            const gear: string[] = [];

            for (const entry of persistedEntries) {
                const label = entry.quantity > 1 ? `${entry.name} x${entry.quantity}` : entry.name;
                const normalizedCategory = entry.category.toLowerCase();

                if (normalizedCategory.includes('weapon')) {
                    weapons.push(label);
                    continue;
                }

                if (normalizedCategory.includes('armor') || normalizedCategory.includes('shield')) {
                    armor.push(label);
                    continue;
                }

                gear.push(label);
            }

            const persistedCurrency = this.persistedBuilderState()?.currency;
            const currency = persistedCurrency
                ? {
                    pp: Number(persistedCurrency.pp) || 0,
                    gp: Number(persistedCurrency.gp) || 0,
                    ep: Number(persistedCurrency.ep) || 0,
                    sp: Number(persistedCurrency.sp) || 0,
                    cp: Number(persistedCurrency.cp) || 0
                }
                : { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

            const totalItemCount = persistedEntries.reduce((sum, item) => sum + item.quantity, 0);

            return {
                weapons,
                armor,
                gear,
                currency,
                totalItemCount,
                items: persistedEntries
            };
        }

        return {
            weapons: [] as string[],
            armor: [] as string[],
            gear: [] as string[],
            currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
            totalItemCount: 0,
            items: [] as Array<{ name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string }>
        };
    });


    readonly inventorySummary = computed(() => {
        const bag = this.inventory();
        if (!bag) {
            return { weight: '0 lb', itemCount: 0, partyWeight: '0 lb' };
        }

        const totalWeight = this.normalizedInventoryEntries().reduce((sum, entry) => sum + this.getInventoryEntryWeight(entry), 0);
        const itemCount = bag.totalItemCount ?? (bag.weapons.length + bag.armor.length + bag.gear.length);
        const weightLabel = totalWeight > 0
            ? `${Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(1)} lb`
            : '0 lb';

        return {
            weight: weightLabel,
            itemCount,
            partyWeight: 'Not tracked'
        };
    });

    readonly filteredInventoryItems = computed(() => {
        const bag = this.inventory();
        if (!bag) {
            return [];
        }

        const term = this.inventorySearchTerm().trim().toLowerCase();
        if (!term) {
            return bag.items;
        }

        return bag.items.filter((item) => {
            const haystack = [
                item.name,
                item.category,
                item.notes ?? '',
                item.costGp != null ? String(item.costGp) : '',
                item.weight != null ? String(item.weight) : ''
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    });

    private getInventoryEntryWeight(entry: PersistedInventoryEntry): number {
        const ownWeight = (entry.weight ?? 0) * Math.max(1, entry.quantity || 1);
        const containedWeight = (entry.containedItems ?? []).reduce(
            (sum, contained) => sum + this.getInventoryEntryWeight(contained),
            0
        );
        return ownWeight + containedWeight;
    }

    readonly containersByName = computed(() => {
        const entries = this.normalizedInventoryEntries();
        const containers = entries.filter((entry) => entry.isContainer);

        // Group containers by name with index for unique identification
        const grouped: Array<{ entry: PersistedInventoryEntry; index: number }> = [];

        for (const container of containers) {
            // Add one entry per quantity (so 2 backpacks = 2 separate expandable containers)
            for (let i = 0; i < container.quantity; i++) {
                grouped.push({ entry: container, index: i });
            }
        }

        return grouped;
    });

    readonly filteredContainersByName = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() => {
        const term = this.inventorySearchTerm().trim().toLowerCase();
        if (!term) {
            return this.containersByName();
        }

        const results: Array<{ entry: PersistedInventoryEntry; index: number }> = [];
        for (const containerItem of this.containersByName()) {
            const matchesContainer = [
                containerItem.entry.name,
                containerItem.entry.category,
                containerItem.entry.notes ?? ''
            ]
                .join(' ')
                .toLowerCase()
                .includes(term);

            const filteredContainedItems = (containerItem.entry.containedItems ?? []).filter((item) => {
                const haystack = [
                    item.name,
                    item.category,
                    item.notes ?? '',
                    item.costGp != null ? String(item.costGp) : '',
                    item.weight != null ? String(item.weight) : ''
                ].join(' ').toLowerCase();
                return haystack.includes(term);
            });

            if (!matchesContainer && filteredContainedItems.length === 0) {
                continue;
            }

            results.push({
                ...containerItem,
                entry: {
                    ...containerItem.entry,
                    containedItems: filteredContainedItems
                }
            });
        }

        return results;
    });


    readonly weaponCombatRows = computed<CombatRow[]>(() => {
        const char = this.character();
        const bag = this.inventory();
        if (!char || !bag) {
            return [];
        }

        return bag.weapons.map((weaponLabel) => {
            const weaponName = weaponLabel.replace(/\s+x\d+$/i, '').trim();
            const weaponKey = weaponName.toLowerCase();
            const isRanged = /bow|crossbow|sling|blowgun|pistol|musket|rifle|gun/i.test(weaponName);
            const useDexterity = /bow|crossbow|sling|dagger|rapier|shortsword/i.test(weaponName);
            const abilityKey: AbilityKey = useDexterity ? 'dexterity' : 'strength';
            const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
            const bonus = abilityMod + char.proficiencyBonus;
            const damage = this.weaponDamageMap[weaponKey] ?? '—';
            const catalogNotes = this.catalogLookup.get(weaponKey)?.notes ?? '—';
            return {
                name: weaponName,
                subtitle: isRanged ? 'Ranged Weapon' : 'Melee Weapon',
                range: isRanged ? 'Ranged' : '5 ft.',
                hitDcLabel: this.formatSigned(bonus),
                damage,
                notes: catalogNotes,
                concentration: false,
                ritual: false
            };
        });
    });

    readonly spellCategoryRows = computed(() => {
        const attack: CombatRow[] = [];
        const action: CombatRow[] = [];
        const bonusAction: CombatRow[] = [];
        const reaction: CombatRow[] = [];
        const other: CombatRow[] = [];

        for (const spell of this.persistedSpellRows()) {
            const details = spellDetailsMap[spell.name];
            const ct = (details?.castingTime ?? '').toLowerCase();
            const as = details?.attackSave ?? '';

            const row: CombatRow = {
                name: spell.name,
                subtitle: this.SPELL_LEVEL_LABELS[spell.level] ?? `Level ${spell.level}`,
                range: spell.range,
                hitDcLabel: spell.hitDcLabel,
                damage: this.formatSpellDamage(details),
                notes: details?.components ?? '—',
                concentration: spell.concentration,
                ritual: spell.ritual
            };

            if (ct.includes('bonus')) bonusAction.push(row);
            else if (ct.includes('reaction')) reaction.push(row);
            else if (ct === '1 action') {
                if (as.includes('Attack')) attack.push(row);
                else action.push(row);
            } else {
                other.push(row);
            }
        }

        return { attack, action, bonusAction, reaction, other };
    });

    readonly attackRows = computed<CombatRow[]>(() => [
        ...this.weaponCombatRows(),
        ...this.spellCategoryRows().attack
    ]);

    readonly actionSpellRows = computed(() => this.spellCategoryRows().action);
    readonly bonusActionSpellRows = computed(() => this.spellCategoryRows().bonusAction);
    readonly reactionSpellRows = computed(() => this.spellCategoryRows().reaction);
    readonly otherSpellRows = computed(() => this.spellCategoryRows().other);

    readonly bonusActionNames = computed(() => this.noteContext().bonusActions);
    readonly reactionNames = computed(() => this.noteContext().reactions);

    readonly attacksPerAction = computed(() => {
        const value = Number(this.noteContext().attacksPerAction);
        if (Number.isFinite(value) && value > 0) {
            return Math.trunc(value);
        }

        return Math.max(1, this.weaponCombatRows().length > 0 ? 1 : 0);
    });

    readonly classFeatures = computed(() => {
        const char = this.character();
        const state = this.persistedBuilderState();
        if (!char || !state) {
            return [];
        }

        const selections = state.classFeatureSelections ?? {};
        const allLevels = classLevelOneFeatures[char.className] ?? [];
        const features: Array<{ name: string; description: string }> = [];

        for (const levelGroup of allLevels) {
            if (levelGroup.level > char.level) continue;
            for (const feature of levelGroup.features) {
                const selectedValues = (selections[feature.name] ?? []).filter(Boolean);
                let description = feature.description ?? '';
                if (feature.choices && selectedValues.length > 0) {
                    description = `${description}${description ? '\n' : ''}Chosen: ${selectedValues.join(', ')}`;
                }
                features.push({ name: feature.name, description });
            }
        }

        return features;
    });

    readonly speciesTraits = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const baseTraits = [...(char.traits ?? [])];
        const choiceMap = this.persistedBuilderState()?.selectedSpeciesTraitChoices ?? {};

        if (Object.keys(choiceMap).length === 0) {
            return baseTraits;
        }

        return baseTraits.map((trait) => {
            const separator = trait.indexOf(':');
            const traitTitle = separator >= 0 ? trait.slice(0, separator).trim() : trait.trim();
            const selected = (choiceMap[traitTitle] ?? []).filter((value) => value && value.trim().length > 0);

            if (selected.length === 0) {
                return trait;
            }

            return `${trait} | Chosen: ${selected.join(', ')}`;
        });
    });

    readonly displayBackstoryText = computed(() => {
        const notes = this.parsedNotes().cleanedNotes.trim();
        if (!notes) return '';
        const builderMarker = notes.search(/(?:^|\n)\s*(Builder class focus:|Species focus:|Alignment direction:|Lifestyle direction:|Emphasize these personality traits:|Include these ideals:|Include these bonds:|Reflect these flaws:|Physical characteristics:|Faith:)/i);
        if (builderMarker > 0) return notes.slice(0, builderMarker).trim();
        return notes;
    });

    readonly formattedBackstoryHtml = computed(() => {
        const backstory = this.displayBackstoryText();
        if (!backstory) return '';
        return this.formatBackstoryRichText(backstory);
    });

    readonly roleplay = computed(() => {
        const char = this.character();
        if (!char) return null;
        const context = this.noteContext();
        return {
            personality: context.personality || 'Not recorded',
            ideals: context.ideals || 'Not recorded',
            bonds: context.bonds || 'Not recorded',
            flaws: context.flaws || 'Not recorded',
            backstory: char.notes || ''
        };
    });

    readonly noteContext = computed(() => {
        const notes = this.parsedNotes().cleanedNotes;

        const alignment = this.extractNoteValue(notes, /(^|\n)Alignment direction:\s*(.+?)(?=\n|$)/i);
        const lifestyle = this.extractNoteValue(notes, /(^|\n)Lifestyle direction:\s*(.+?)(?=\n|$)/i);
        const faith = this.extractNoteValue(notes, /(^|\n)Faith:\s*(.+?)(?=\n|$)/i);
        const experience = this.extractNoteValue(notes, /(^|\n)Experience:\s*(.+?)(?=\n|$)/i);
        const personality = this.extractNoteValue(notes, /(^|\n)Emphasize these personality traits:\s*(.+?)(?=\n|$)/i);
        const ideals = this.extractNoteValue(notes, /(^|\n)Include these ideals:\s*(.+?)(?=\n|$)/i);
        const bonds = this.extractNoteValue(notes, /(^|\n)Include these bonds:\s*(.+?)(?=\n|$)/i);
        const flaws = this.extractNoteValue(notes, /(^|\n)Reflect these flaws:\s*(.+?)(?=\n|$)/i);

        const organizations = this.extractNoteList(notes, /(^|\n)Organizations:\s*(.+?)(?=\n|$)/i);
        const allies = this.extractNoteList(notes, /(^|\n)Allies:\s*(.+?)(?=\n|$)/i);
        const enemies = this.extractNoteList(notes, /(^|\n)Enemies:\s*(.+?)(?=\n|$)/i);
        const bonusActions = this.extractNoteList(notes, /(^|\n)Bonus Actions?:\s*(.+?)(?=\n|$)/i);
        const reactions = this.extractNoteList(notes, /(^|\n)Reactions?:\s*(.+?)(?=\n|$)/i);
        const attacksPerAction = this.extractNoteValue(notes, /(^|\n)Attacks? per Action:\s*(.+?)(?=\n|$)/i);

        const physicalRaw = this.extractNoteValue(notes, /(^|\n)Physical characteristics:\s*(.+?)(?=\n|$)/i);
        const physical = this.parsePhysicalCharacteristics(physicalRaw);

        return {
            alignment,
            lifestyle,
            faith,
            experience,
            personality,
            ideals,
            bonds,
            flaws,
            organizations,
            allies,
            enemies,
            bonusActions,
            reactions,
            attacksPerAction,
            physical
        };
    });

    private formatSpellDamage(details: { damageEffect?: string; description?: string } | undefined): string {
        if (!details?.damageEffect) return '—';
        const match = details.description?.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)/);
        const dice = match?.[1] ?? '';
        return dice ? `${dice} ${details.damageEffect}` : details.damageEffect;
    }

    getAbilityModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    async assignCharacterToCampaign(): Promise<void> {
        const char = this.character();
        const targetCampaignId = this.selectedCampaignAssignment();

        if (!char || !targetCampaignId || this.isUpdatingCampaign()) {
            return;
        }

        this.isUpdatingCampaign.set(true);
        this.campaignUpdateError.set('');

        try {
            const didUpdate = await this.store.setCharacterCampaign(char.id, targetCampaignId);
            if (!didUpdate) {
                this.campaignUpdateError.set('Unable to assign character to that campaign right now.');
            }
        } finally {
            this.isUpdatingCampaign.set(false);
            this.cdr.detectChanges();
        }
    }

    async removeCharacterFromCampaign(): Promise<void> {
        const char = this.character();
        if (!char || this.isUpdatingCampaign()) {
            return;
        }

        this.isUpdatingCampaign.set(true);
        this.campaignUpdateError.set('');

        try {
            const didUpdate = await this.store.setCharacterCampaign(char.id, null);
            if (!didUpdate) {
                this.campaignUpdateError.set('Unable to remove character from campaign right now.');
            }
        } finally {
            this.isUpdatingCampaign.set(false);
            this.cdr.detectChanges();
        }
    }

    onCampaignAssignmentChanged(value: string | number): void {
        this.selectedCampaignAssignment.set(String(value));
        this.campaignUpdateError.set('');
    }

    setCombatTab(tab: CombatTab): void {
        this.activeCombatTab.set(tab);
    }

    closeDetailDrawer(): void {
        this.activeDetailDrawer.set(null);
    }

    openAbilityDetail(ability: { name: string; score: number; modifierLabel: string }): void {
        this.activeDetailDrawer.set({
            title: `${ability.name} (${ability.score})`,
            subtitle: `Ability Score • Modifier ${ability.modifierLabel}`,
            description: `${ability.name} influences core rolls tied to this stat and its modifier.`,
            bullets: [
                'Higher scores improve related checks and saving throws.',
                'Ability modifiers are used in attacks, skills, and class features.',
                'Ability Score Improvements can raise this value over time.'
            ]
        });
    }

    openSenseDetail(label: string, value: number): void {
        this.activeDetailDrawer.set({
            title: `${label}: ${value}`,
            subtitle: 'Senses',
            description: `${label} is your passive awareness for this sense.`,
            bullets: [
                'Passive scores are usually 10 + relevant modifiers.',
                'They apply when the GM checks awareness without an active roll.',
                'Proficiency and expertise can raise passive values.'
            ]
        });
    }

    openTrainingDetail(title: string, values: string[]): void {
        const entries = values.length ? values : ['Not recorded'];
        this.activeDetailDrawer.set({
            title,
            subtitle: 'Proficiencies & Training',
            description: `These are your current ${title.toLowerCase()} proficiencies.`,
            bullets: entries
        });
    }

    openSkillDetail(skill: { name: string; ability: string; modifierLabel: string; proficient: boolean }): void {
        this.activeDetailDrawer.set({
            title: skill.name,
            subtitle: `Skill (${skill.ability}) • ${skill.modifierLabel}`,
            description: `This skill uses ${skill.ability} and ${skill.proficient ? 'includes' : 'does not include'} proficiency bonus.`,
            bullets: [
                'Roll this when attempting related tasks under pressure.',
                'Proficiency adds your proficiency bonus to the check.',
                'Class, species, and background choices can grant skill proficiency.'
            ]
        });
    }

    openArmorClassDetail(value: number): void {
        this.activeDetailDrawer.set({
            title: `Armor Class ${value}`,
            subtitle: 'Core Stat',
            description: 'Armor Class determines how hard you are to hit with attack rolls.',
            bullets: [
                'Attack rolls must meet or exceed your AC to hit.',
                'Armor, shields, Dexterity, and features can affect AC.',
                'Temporary effects may increase or reduce your AC.'
            ]
        });
    }

    openActionDetail(action: { name: string; subtitle?: string; range?: string; hitDcLabel?: string; damage?: string; notes?: string }): void {
        const bullets = [
            action.subtitle ? `Type: ${action.subtitle}` : 'Type: Combat option',
            action.range ? `Range: ${action.range}` : '',
            action.hitDcLabel ? `Hit / DC: ${action.hitDcLabel}` : '',
            action.damage ? `Damage / Effect: ${action.damage}` : '',
            action.notes ? `Notes: ${action.notes}` : ''
        ].filter((entry) => entry.length > 0);

        this.activeDetailDrawer.set({
            title: action.name,
            subtitle: 'Action Detail',
            description: 'Detailed context for this combat option.',
            bullets
        });
    }

    openSpellDetail(spell: { name: string; castingTime?: string; range?: string; hitDcLabel?: string; damage?: string }): void {
        const details = spellDetailsMap[spell.name];
        this.activeDetailDrawer.set({
            title: spell.name,
            subtitle: 'Spell Detail',
            description: details?.description ?? 'Spell details for this entry.',
            bullets: [
                spell.castingTime ? `Casting Time: ${spell.castingTime}` : '',
                spell.range ? `Range: ${spell.range}` : '',
                spell.hitDcLabel ? `Hit / DC: ${spell.hitDcLabel}` : '',
                spell.damage ? `Effect: ${spell.damage}` : '',
                details?.components ? `Components: ${details.components}` : ''
            ].filter((entry) => entry.length > 0)
        });
    }

    openInventoryItemDetail(item: { name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string }): void {
        this.activeDetailDrawer.set({
            title: item.name,
            subtitle: `Inventory • ${item.category}`,
            description: item.notes?.trim() || 'Tracked inventory item details.',
            bullets: [
                `Quantity: ${item.quantity}`,
                `Weight: ${item.weight != null ? `${item.weight} lb` : '—'}`,
                `Cost: ${item.costGp != null ? `${item.costGp} gp` : '—'}`
            ]
        });
    }

    openFeatureDetail(name: string, description: string, category: string): void {
        this.activeDetailDrawer.set({
            title: name,
            subtitle: category,
            description,
            bullets: [
                'This feature can modify combat, exploration, or roleplay options.',
                'Review trigger conditions and action economy when using it.',
                'Check class/species progression for scaling details.'
            ]
        });
    }

    setSpellFilter(filter: SpellFilter): void {
        this.activeSpellFilter.set(filter);
    }

    onSpellSearchChanged(value: string): void {
        this.spellSearchTerm.set(value);
    }

    showsSpellLevel(level: number): boolean {
        const filter = this.activeSpellFilter();
        if (filter === 'all') {
            return true;
        }

        return filter === String(level);
    }

    setActionFilter(filter: ActionFilter): void {
        this.activeActionFilter.set(filter);
    }

    setBackgroundFilter(filter: BackgroundFilter): void {
        this.activeBackgroundFilter.set(filter);
    }

    setInventoryFilter(filter: InventoryFilter): void {
        this.activeInventoryFilter.set(filter);
    }

    onInventorySearchChanged(value: string): void {
        this.inventorySearchTerm.set(value);
    }

    toggleContainerExpanded(containerName: string): void {
        this.expandedContainers.update((expanded) => {
            const newSet = new Set(expanded);
            if (newSet.has(containerName)) {
                newSet.delete(containerName);
            } else {
                newSet.add(containerName);
            }
            return newSet;
        });
    }

    isContainerExpanded(containerName: string): boolean {
        return this.expandedContainers().has(containerName);
    }

    setFeaturesFilter(filter: FeaturesFilter): void {
        this.activeFeaturesFilter.set(filter);
    }

    setNotesFilter(filter: NotesFilter): void {
        this.activeNotesFilter.set(filter);
    }

    getUsedSpellSlots(level: number, maxSlots: number): number {
        const current = this.usedSpellSlotsByLevel()[level] ?? 0;
        return Math.min(Math.max(current, 0), Math.max(maxSlots, 0));
    }

    cycleUsedSpellSlots(level: number, maxSlots: number): void {
        if (maxSlots <= 0) {
            return;
        }

        // Initialize spell slots from persisted state if character has changed
        const char = this.character();
        if (char && this.lastCharacterId !== char.id) {
            this.lastCharacterId = char.id;
            const initial = this.initialSpellSlots();
            if (Object.keys(initial).length > 0) {
                this.usedSpellSlotsByLevel.set({ ...initial });
            }
        }

        this.usedSpellSlotsByLevel.update((current) => {
            const used = this.getUsedSpellSlots(level, maxSlots);
            const nextUsed = used >= maxSlots ? 0 : used + 1;
            return {
                ...current,
                [level]: nextUsed
            };
        });

        // Save changes
        this.saveSpellSlotUsage();
    }

    private formatSigned(value: number): string {
        return value >= 0 ? `+${value}` : `${value}`;
    }

    private getPassiveSkillValue(skill: 'perception' | 'investigation' | 'insight'): number {
        const char = this.character();
        if (!char) {
            return 10;
        }

        const abilityKey = this.skillAbilityMap[skill];
        const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
        const profBonus = this.isSkillProficient(skill, char.skills)
            ? char.proficiencyBonus
            : 0;
        return 10 + abilityMod + profBonus;
    }

    private isSkillProficient(skillKey: string, fallbackSkills?: SkillProficiencies): boolean {
        if (this.persistedSkillProficiencies().has(skillKey)) {
            return true;
        }

        return Boolean(fallbackSkills?.[skillKey as keyof SkillProficiencies]);
    }

    private parseSkillTokens(raw: string): string[] {
        const text = raw?.trim();
        if (!text) {
            return [];
        }

        const tokens = text
            .split(/[,;/|]/g)
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);

        const normalized = tokens
            .map((token) => this.skillLabelToKey(token))
            .filter((token): token is string => Boolean(token));

        return [...new Set(normalized)];
    }

    private skillLabelToKey(label: string): string | null {
        const normalized = label.trim().toLowerCase();
        const map: Record<string, string> = {
            'acrobatics': 'acrobatics',
            'animal handling': 'animalHandling',
            'arcana': 'arcana',
            'athletics': 'athletics',
            'deception': 'deception',
            'history': 'history',
            'insight': 'insight',
            'intimidation': 'intimidation',
            'investigation': 'investigation',
            'medicine': 'medicine',
            'nature': 'nature',
            'perception': 'perception',
            'performance': 'performance',
            'persuasion': 'persuasion',
            'sleight of hand': 'sleightOfHand',
            'stealth': 'stealth',
            'survival': 'survival'
        };

        return map[normalized] ?? null;
    }

    private getPersistedAbilityScores(state: PersistedBuilderState | null): {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    } | null {
        if (!state) {
            return null;
        }

        const base = state.abilityBaseScores ?? {};
        const overrides = state.abilityOverrideScores ?? {};
        const bonuses = this.getPersistedAbilityBonuses(state);

        const fromKey = (key: AbilityKey): number | null => {
            const titleKey = this.toTitleCaseAbilityKey(key);
            const baseValue = base[titleKey];
            if (typeof baseValue !== 'number' || !Number.isFinite(baseValue)) {
                return null;
            }

            const override = overrides[titleKey];
            if (typeof override === 'number' && Number.isFinite(override)) {
                return Math.trunc(override);
            }

            return Math.min(20, Math.trunc(baseValue) + (bonuses[key] ?? 0));
        };

        const strength = fromKey('strength');
        const dexterity = fromKey('dexterity');
        const constitution = fromKey('constitution');
        const intelligence = fromKey('intelligence');
        const wisdom = fromKey('wisdom');
        const charisma = fromKey('charisma');

        if (
            strength == null
            || dexterity == null
            || constitution == null
            || intelligence == null
            || wisdom == null
            || charisma == null
        ) {
            return null;
        }

        const scores = {
            strength,
            dexterity,
            constitution,
            intelligence,
            wisdom,
            charisma
        };

        return scores;
    }

    private getPersistedAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const total = this.createEmptyAbilityBonusMap();
        const background = this.getPersistedBackgroundAbilityBonuses(state);
        const classFeatures = this.getPersistedClassFeatureAbilityBonuses(state);

        (Object.keys(total) as AbilityKey[]).forEach((key) => {
            total[key] = (background[key] ?? 0) + (classFeatures[key] ?? 0);
        });

        return total;
    }

    private getPersistedBackgroundAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const mode = state.bgAbilityMode?.trim();

        if (mode === 'Increase three scores (+1 / +1 / +1)') {
            const abilities = this.getBackgroundAbilityPool(state);
            abilities.forEach((ability) => this.addAbilityBonus(bonuses, ability, 1));
            return bonuses;
        }

        if (mode === 'Increase two scores (+2 / +1)' || mode === 'plus-two-plus-one') {
            const allowed = new Set(this.getBackgroundAbilityPool(state));
            const plusTwo = this.parseAbilityKey(state.bgAbilityScoreFor2);
            const plusOne = this.parseAbilityKey(state.bgAbilityScoreFor1);

            if (plusTwo && allowed.has(plusTwo)) {
                this.addAbilityBonus(bonuses, plusTwo, 2);
            }

            if (plusOne && plusOne !== plusTwo && allowed.has(plusOne)) {
                this.addAbilityBonus(bonuses, plusOne, 1);
            }
        }

        return bonuses;
    }

    private getPersistedClassFeatureAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const selections = state.classFeatureSelections ?? {};
        const asiChoices = state.abilityScoreImprovementChoices ?? {};
        const featChoices = state.featFollowUpChoices ?? {};

        Object.entries(selections).forEach(([selectionKey, values]) => {
            values.forEach((selectedValue) => {
                if (!selectedValue) {
                    return;
                }

                if (selectedValue === 'Ability Score Improvement') {
                    const asiChoice = asiChoices[selectionKey];
                    if (!asiChoice) {
                        return;
                    }

                    const primary = this.parseAbilityKey(asiChoice.primaryAbility);
                    const secondary = this.parseAbilityKey(asiChoice.secondaryAbility);

                    if (asiChoice.mode === 'plus-two' && primary) {
                        this.addAbilityBonus(bonuses, primary, 2);
                        return;
                    }

                    if (asiChoice.mode === 'plus-one-plus-one' && primary && secondary && primary !== secondary) {
                        this.addAbilityBonus(bonuses, primary, 1);
                        this.addAbilityBonus(bonuses, secondary, 1);
                    }

                    return;
                }

                const validFeatAbilities = this.getFeatAbilityIncreaseChoicesByFeat(selectedValue);
                if (validFeatAbilities.length === 0) {
                    return;
                }

                const selectedAbility = this.parseAbilityKey(featChoices[selectionKey]?.abilityIncreaseAbility);
                if (selectedAbility && validFeatAbilities.includes(selectedAbility)) {
                    this.addAbilityBonus(bonuses, selectedAbility, 1);
                }
            });
        });

        return bonuses;
    }

    private getBackgroundAbilityPool(state: PersistedBuilderState): AbilityKey[] {
        const backgroundName = state.selectedBackgroundName?.trim();
        const map: Partial<Record<string, AbilityKey[]>> = {
            Acolyte: ['intelligence', 'wisdom', 'charisma'],
            Criminal: ['dexterity', 'constitution', 'intelligence'],
            Spy: ['dexterity', 'constitution', 'intelligence'],
            Noble: ['strength', 'dexterity', 'charisma'],
            Knight: ['strength', 'dexterity', 'charisma'],
            Charlatan: ['dexterity', 'constitution', 'charisma'],
            Entertainer: ['strength', 'dexterity', 'charisma'],
            Gladiator: ['strength', 'dexterity', 'charisma'],
            'Folk Hero': ['strength', 'constitution', 'wisdom'],
            'Guild Artisan': ['dexterity', 'intelligence', 'charisma'],
            'Guild Merchant': ['dexterity', 'intelligence', 'charisma'],
            Hermit: ['constitution', 'intelligence', 'wisdom'],
            Outlander: ['strength', 'dexterity', 'constitution'],
            Sage: ['constitution', 'intelligence', 'wisdom'],
            Sailor: ['strength', 'dexterity', 'wisdom'],
            Pirate: ['strength', 'dexterity', 'wisdom'],
            Soldier: ['strength', 'dexterity', 'constitution'],
            'Mercenary Veteran': ['strength', 'dexterity', 'constitution'],
            Urchin: ['strength', 'dexterity', 'intelligence']
        };

        return map[backgroundName ?? ''] ?? ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    }

    private getFeatAbilityIncreaseChoicesByFeat(featName: string): AbilityKey[] {
        switch (featName) {
            case 'Athlete':
            case 'Charger':
            case 'Dual Wielder':
            case 'Grappler':
            case 'Mage Slayer':
            case 'Sentinel':
            case 'Slasher':
            case 'Weapon Master':
                return ['strength', 'dexterity'];
            case 'Defensive Duelist':
            case 'Skulker':
                return ['dexterity'];
            case 'Elemental Adept':
            case 'Spell Sniper':
            case 'War Caster':
                return ['intelligence', 'wisdom', 'charisma'];
            case 'Great Weapon Master':
            case 'Shield Master':
                return ['strength'];
            case 'Heavy Armor Master':
                return ['strength', 'constitution'];
            case 'Speedy':
                return ['dexterity', 'constitution'];
            case 'Inspiring Leader':
                return ['wisdom', 'charisma'];
            case 'Mounted Combatant':
                return ['strength', 'dexterity', 'wisdom'];
            case 'Polearm Master':
                return ['dexterity', 'strength'];
            case 'Resilient':
            case 'Skill Expert':
                return ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            default:
                return [];
        }
    }

    private createEmptyAbilityBonusMap(): Record<AbilityKey, number> {
        return {
            strength: 0,
            dexterity: 0,
            constitution: 0,
            intelligence: 0,
            wisdom: 0,
            charisma: 0
        };
    }

    private addAbilityBonus(target: Record<AbilityKey, number>, ability: AbilityKey, amount: number): void {
        target[ability] = (target[ability] ?? 0) + amount;
    }

    private parseAbilityKey(value: string | undefined): AbilityKey | null {
        const normalized = (value ?? '').trim().toLowerCase();
        switch (normalized) {
            case 'strength':
                return 'strength';
            case 'dexterity':
                return 'dexterity';
            case 'constitution':
                return 'constitution';
            case 'intelligence':
                return 'intelligence';
            case 'wisdom':
                return 'wisdom';
            case 'charisma':
                return 'charisma';
            default:
                return null;
        }
    }

    private toTitleCaseAbilityKey(key: AbilityKey): string {
        return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    }

    private getSpellSlots(level: number, casterType: 'none' | 'full' | 'half'): number[] {
        if (casterType === 'none') {
            return [];
        }

        const fullCasterSlots = [
            [2],
            [3],
            [4, 2],
            [4, 3],
            [4, 3, 2],
            [4, 3, 3],
            [4, 3, 3, 1],
            [4, 3, 3, 2],
            [4, 3, 3, 3, 1],
            [4, 3, 3, 3, 2],
            [4, 3, 3, 3, 2, 1],
            [4, 3, 3, 3, 2, 1],
            [4, 3, 3, 3, 2, 1, 1],
            [4, 3, 3, 3, 2, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1, 1],
            [4, 3, 3, 3, 3, 1, 1, 1, 1],
            [4, 3, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 3, 2, 2, 1, 1]
        ];

        const cappedLevel = Math.min(Math.max(level, 1), 20);
        const effectiveLevel = casterType === 'half' ? Math.max(1, Math.floor(cappedLevel / 2)) : cappedLevel;
        return fullCasterSlots[effectiveLevel - 1] ?? [];
    }

    private getSpellLevelForDetails(className: string, spellName: string): number {
        const classCatalog = classSpellCatalog[className] ?? [];
        const classMatch = classCatalog.find((spell) => spell.name === spellName);
        if (classMatch) {
            return classMatch.level;
        }

        const wizardMatch = (classSpellCatalog['Wizard'] ?? []).find((spell) => spell.name === spellName);
        if (wizardMatch) {
            return wizardMatch.level;
        }

        for (const catalog of Object.values(classSpellCatalog)) {
            const fallback = catalog.find((spell) => spell.name === spellName);
            if (fallback) {
                return fallback.level;
            }
        }

        return 1;
    }

    private isRitualSpell(spellName: string): boolean {
        return Boolean(spellDetailsMap[spellName]?.ritual);
    }

    private isContainerItemName(name: string): boolean {
        return this.containerItemNames.has(name.trim().toLowerCase());
    }

    private getContainerCapacity(name: string): number | undefined {
        const normalized = name.trim().toLowerCase();
        if (normalized === 'backpack') {
            return 60;
        }
        if (normalized === 'bag of holding') {
            return 500;
        }
        if (normalized === 'quiver') {
            return 20;
        }
        return undefined;
    }

    private parsePersistedNotes(notes: string): { cleanedNotes: string; state: PersistedBuilderState | null } {
        const raw = notes?.trim() ?? '';
        if (!raw) {
            return { cleanedNotes: '', state: null };
        }

        const start = raw.indexOf(this.builderStateStartTag);
        const end = raw.indexOf(this.builderStateEndTag);

        if (start === -1 || end === -1 || end < start) {
            return { cleanedNotes: raw, state: null };
        }

        const jsonStart = start + this.builderStateStartTag.length;
        const jsonText = raw.slice(jsonStart, end).trim();
        const before = raw.slice(0, start).trimEnd();
        const after = raw.slice(end + this.builderStateEndTag.length).trimStart();
        const cleanedNotes = [before, after].filter((part) => part.length > 0).join('\n\n').trim();

        try {
            const parsed = JSON.parse(jsonText) as PersistedBuilderState;
            return { cleanedNotes, state: parsed };
        } catch {
            return { cleanedNotes: raw, state: null };
        }
    }

    private extractNoteValue(notes: string, pattern: RegExp): string {
        const match = notes.match(pattern);
        return match?.[2]?.trim() ?? '';
    }

    private extractNoteList(notes: string, pattern: RegExp): string[] {
        const value = this.extractNoteValue(notes, pattern);
        if (!value) {
            return [];
        }

        return value
            .split(/[,;|]/g)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    private getTrainingFromSelections(state: PersistedBuilderState | null): { armor: string[]; weapons: string[]; tools: string[] } {
        if (!state) {
            return { armor: [], weapons: [], tools: [] };
        }

        const armor = new Set<string>();
        const weapons = new Set<string>();
        const tools = new Set<string>();

        const selectedValues: string[] = [];
        const classSelections = state.classFeatureSelections ?? {};
        const backgroundSelections = state.backgroundChoiceSelections ?? {};

        for (const values of Object.values(classSelections)) {
            for (const entry of values ?? []) {
                selectedValues.push(entry);
            }
        }

        for (const value of Object.values(backgroundSelections)) {
            selectedValues.push(value);
        }

        for (const raw of selectedValues) {
            const value = raw.trim();
            if (!value) {
                continue;
            }

            if (/armor|shield/i.test(value)) {
                armor.add(value);
            }

            if (/weapon|bow|crossbow|sword|axe|mace|spear|dagger/i.test(value)) {
                weapons.add(value);
            }

            if (/tool|kit|instrument|thieves'/i.test(value)) {
                tools.add(value);
            }
        }

        return {
            armor: [...armor],
            weapons: [...weapons],
            tools: [...tools]
        };
    }

    private parsePhysicalCharacteristics(input: string): {
        gender: string;
        age: string;
        height: string;
        weight: string;
        hair: string;
        eyes: string;
        skin: string;
    } {
        const parsed: Record<string, string> = {};

        for (const segment of input.split(';')) {
            const [rawKey, ...valueParts] = segment.split(':');
            const key = rawKey?.trim().toLowerCase();
            const value = valueParts.join(':').trim();
            if (!key || !value) {
                continue;
            }

            parsed[key] = value;
        }

        return {
            gender: parsed['gender'] ?? '',
            age: parsed['age'] ?? '',
            height: parsed['height'] ?? '',
            weight: parsed['weight'] ?? '',
            hair: parsed['hair'] ?? '',
            eyes: parsed['eyes'] ?? '',
            skin: parsed['skin'] ?? ''
        };
    }

    private formatBackstoryRichText(text: string): string {
        return marked.parse(text, { gfm: true, breaks: true }) as string;
    }
}
