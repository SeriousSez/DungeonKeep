import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { races } from '../../data/races';
import type { SkillProficiencies } from '../../models/dungeon.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type ActionType = 'attack' | 'save';
type CombatTab = 'actions' | 'spells' | 'inventory' | 'features' | 'background' | 'notes' | 'extras';
type ActionFilter = 'all' | 'attack' | 'action' | 'bonus-action' | 'reaction' | 'other' | 'limited-use';

interface PersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
}

interface PersistedCurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

interface PersistedBuilderState {
    selectedBackgroundName?: string;
    selectedLanguages?: string[];
    selectedSpeciesLanguages?: string[];
    classFeatureSelections?: Record<string, string[]>;
    backgroundChoiceSelections?: Record<string, string>;
    abilityBaseScores?: Record<string, number>;
    abilityOverrideScores?: Record<string, number | null>;
    bgAbilityMode?: string;
    bgAbilityScoreFor2?: string;
    bgAbilityScoreFor1?: string;
    inventoryEntries?: PersistedInventoryEntry[];
    currency?: PersistedCurrencyState;
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

    private readonly classTrainingMap: Record<string, { armor: string[]; weapons: string[]; tools: string[] }> = {
        Barbarian: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'], tools: [] },
        Bard: { armor: ['Light Armor'], weapons: ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'], tools: ['Three musical instruments'] },
        Cleric: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons'], tools: [] },
        Druid: { armor: ['Light Armor', 'Medium Armor', 'Shields (non-metal)'], weapons: ['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'], tools: ['Herbalism Kit'] },
        Fighter: { armor: ['All Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'], tools: [] },
        Monk: { armor: [], weapons: ['Simple Weapons', 'Shortswords'], tools: ['One artisan tool or one musical instrument'] },
        Paladin: { armor: ['All Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'], tools: [] },
        Ranger: { armor: ['Light Armor', 'Medium Armor', 'Shields'], weapons: ['Simple Weapons', 'Martial Weapons'], tools: [] },
        Rogue: { armor: ['Light Armor'], weapons: ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'], tools: ["Thieves' Tools"] },
        Sorcerer: { armor: [], weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'], tools: [] },
        Warlock: { armor: ['Light Armor'], weapons: ['Simple Weapons'], tools: [] },
        Wizard: { armor: [], weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'], tools: [] }
    };

    private readonly classActionTemplates: Record<string, Array<{ name: string; type: ActionType; ability: AbilityKey; damage: string; note: string }>> = {
        Barbarian: [
            { name: 'Greataxe', type: 'attack', ability: 'strength', damage: '1d12 + STR', note: 'Melee heavy weapon' },
            { name: 'Javelin', type: 'attack', ability: 'strength', damage: '1d6 + STR', note: 'Thrown (30/120)' }
        ],
        Bard: [
            { name: 'Rapier', type: 'attack', ability: 'dexterity', damage: '1d8 + DEX', note: 'Finesse melee attack' },
            { name: 'Vicious Mockery', type: 'save', ability: 'charisma', damage: '1d4 psychic', note: 'WIS save' }
        ],
        Cleric: [
            { name: 'Mace', type: 'attack', ability: 'strength', damage: '1d6 + STR', note: 'Melee attack' },
            { name: 'Sacred Flame', type: 'save', ability: 'wisdom', damage: '1d8 radiant', note: 'DEX save' }
        ],
        Druid: [
            { name: 'Scimitar', type: 'attack', ability: 'dexterity', damage: '1d6 + DEX', note: 'Finesse melee attack' },
            { name: 'Produce Flame', type: 'attack', ability: 'wisdom', damage: '1d8 fire', note: 'Ranged spell attack' }
        ],
        Fighter: [
            { name: 'Longsword', type: 'attack', ability: 'strength', damage: '1d8 + STR', note: 'Melee versatile weapon' },
            { name: 'Longbow', type: 'attack', ability: 'dexterity', damage: '1d8 + DEX', note: 'Ranged (150/600)' }
        ],
        Monk: [
            { name: 'Unarmed Strike', type: 'attack', ability: 'dexterity', damage: '1d6 + DEX', note: 'Martial Arts' },
            { name: 'Shortsword', type: 'attack', ability: 'dexterity', damage: '1d6 + DEX', note: 'Finesse melee attack' }
        ],
        Paladin: [
            { name: 'Longsword', type: 'attack', ability: 'strength', damage: '1d8 + STR', note: 'Melee versatile weapon' },
            { name: 'Javelin', type: 'attack', ability: 'strength', damage: '1d6 + STR', note: 'Thrown (30/120)' }
        ],
        Ranger: [
            { name: 'Longbow', type: 'attack', ability: 'dexterity', damage: '1d8 + DEX', note: 'Ranged (150/600)' },
            { name: 'Shortsword', type: 'attack', ability: 'dexterity', damage: '1d6 + DEX', note: 'Finesse melee attack' }
        ],
        Rogue: [
            { name: 'Rapier', type: 'attack', ability: 'dexterity', damage: '1d8 + DEX', note: 'Sneak Attack eligible' },
            { name: 'Shortbow', type: 'attack', ability: 'dexterity', damage: '1d6 + DEX', note: 'Ranged (80/320)' }
        ],
        Sorcerer: [
            { name: 'Fire Bolt', type: 'attack', ability: 'charisma', damage: '1d10 fire', note: 'Ranged spell attack' },
            { name: 'Ray of Frost', type: 'attack', ability: 'charisma', damage: '1d8 cold', note: 'Ranged spell attack' }
        ],
        Warlock: [
            { name: 'Eldritch Blast', type: 'attack', ability: 'charisma', damage: '1d10 force', note: 'Ranged spell attack' },
            { name: 'Chill Touch', type: 'attack', ability: 'charisma', damage: '1d8 necrotic', note: 'Ranged spell attack' }
        ],
        Wizard: [
            { name: 'Fire Bolt', type: 'attack', ability: 'intelligence', damage: '1d10 fire', note: 'Ranged spell attack' },
            { name: 'Chromatic Orb', type: 'attack', ability: 'intelligence', damage: '3d8 elemental', note: 'Ranged spell attack' }
        ]
    };

    private readonly knownCantripNames = new Set<string>([
        'Vicious Mockery',
        'Sacred Flame',
        'Produce Flame',
        'Fire Bolt',
        'Ray of Frost',
        'Eldritch Blast',
        'Chill Touch'
    ]);

    private readonly classBonusActionMap: Record<string, string> = {
        Barbarian: 'Enter Rage',
        Bard: 'Bardic Inspiration',
        Cleric: 'Spiritual Weapon (if prepared)',
        Druid: 'Wild Shape (circle feature dependent)',
        Fighter: 'Second Wind',
        Monk: 'Flurry of Blows',
        Paladin: 'Misty Step (if prepared)',
        Ranger: "Hunter's Mark (move mark)",
        Rogue: 'Cunning Action',
        Sorcerer: 'Quickened Spell (Metamagic)',
        Warlock: 'Hex (move curse)',
        Wizard: 'Misty Step (if prepared)'
    };

    private readonly classReactionMap: Record<string, string> = {
        Barbarian: 'Opportunity Attack',
        Bard: 'Cutting Words (subclass dependent)',
        Cleric: 'Opportunity Attack',
        Druid: 'Opportunity Attack',
        Fighter: 'Opportunity Attack',
        Monk: 'Deflect Missiles',
        Paladin: 'Opportunity Attack',
        Ranger: 'Opportunity Attack',
        Rogue: 'Uncanny Dodge (if available)',
        Sorcerer: 'Shield (if known)',
        Warlock: 'Hellish Rebuke (if known)',
        Wizard: 'Shield / Counterspell (if prepared)'
    };

    private readonly classFeatureMap: Record<string, Array<{ name: string; minLevel: number; description: string }>> = {
        Barbarian: [
            { name: 'Rage', minLevel: 1, description: 'Bonus damage and resistance to physical damage while raging.' },
            { name: 'Reckless Attack', minLevel: 2, description: 'Advantage on STR melee attacks, but attacks against you have advantage.' },
            { name: 'Danger Sense', minLevel: 2, description: 'Advantage on Dex saves against visible effects.' }
        ],
        Bard: [
            { name: 'Bardic Inspiration', minLevel: 1, description: 'Grant allies inspiration dice.' },
            { name: 'Jack of All Trades', minLevel: 2, description: 'Half proficiency bonus on checks without proficiency.' },
            { name: 'Song of Rest', minLevel: 2, description: 'Extra healing during short rests.' }
        ],
        Cleric: [
            { name: 'Divine Domain', minLevel: 1, description: 'Domain powers and spell options.' },
            { name: 'Channel Divinity', minLevel: 2, description: 'Harness divine energy for domain effects.' },
            { name: 'Turn Undead', minLevel: 2, description: 'Force undead to flee.' }
        ],
        Druid: [
            { name: 'Druidic', minLevel: 1, description: 'Secret druid language.' },
            { name: 'Wild Shape', minLevel: 2, description: 'Transform into beasts.' },
            { name: 'Druid Circle', minLevel: 2, description: 'Choose a druid specialization.' }
        ],
        Fighter: [
            { name: 'Second Wind', minLevel: 1, description: 'Recover HP as a bonus action.' },
            { name: 'Action Surge', minLevel: 2, description: 'Take one additional action.' },
            { name: 'Martial Archetype', minLevel: 3, description: 'Choose a fighter specialization.' }
        ],
        Monk: [
            { name: 'Martial Arts', minLevel: 1, description: 'Unarmed combat features.' },
            { name: 'Ki', minLevel: 2, description: 'Spend Ki points for combat techniques.' },
            { name: 'Unarmored Movement', minLevel: 2, description: 'Faster movement while unarmored.' }
        ],
        Paladin: [
            { name: 'Divine Sense', minLevel: 1, description: 'Detect celestial, fiend, and undead presence.' },
            { name: 'Lay on Hands', minLevel: 1, description: 'Healing pool for allies.' },
            { name: 'Divine Smite', minLevel: 2, description: 'Spend spell slots for radiant damage.' }
        ],
        Ranger: [
            { name: 'Favored Enemy', minLevel: 1, description: 'Tracking and lore benefits vs selected enemies.' },
            { name: 'Natural Explorer', minLevel: 1, description: 'Travel and exploration benefits in favored terrain.' },
            { name: 'Fighting Style', minLevel: 2, description: 'Choose a combat style.' }
        ],
        Rogue: [
            { name: 'Sneak Attack', minLevel: 1, description: 'Extra damage once per turn.' },
            { name: 'Cunning Action', minLevel: 2, description: 'Dash, Disengage, or Hide as bonus action.' },
            { name: 'Roguish Archetype', minLevel: 3, description: 'Choose rogue specialization.' }
        ],
        Sorcerer: [
            { name: 'Sorcerous Origin', minLevel: 1, description: 'Bloodline-based magical powers.' },
            { name: 'Font of Magic', minLevel: 2, description: 'Convert between spell slots and sorcery points.' },
            { name: 'Metamagic', minLevel: 3, description: 'Modify spell casting effects.' }
        ],
        Warlock: [
            { name: 'Otherworldly Patron', minLevel: 1, description: 'Pact powers from your patron.' },
            { name: 'Pact Magic', minLevel: 1, description: 'Short-rest spell slots.' },
            { name: 'Eldritch Invocations', minLevel: 2, description: 'Custom magical augmentations.' }
        ],
        Wizard: [
            { name: 'Spellbook', minLevel: 1, description: 'Prepare and expand known spells.' },
            { name: 'Arcane Recovery', minLevel: 1, description: 'Recover spell slots on short rest once/day.' },
            { name: 'Arcane Tradition', minLevel: 2, description: 'Choose a magical school specialization.' }
        ]
    };

    private readonly classEquipmentMap: Record<string, { weapons: string[]; armor: string[]; gear: string[] }> = {
        Barbarian: { weapons: ['Greataxe', 'Javelins'], armor: ['Explorer clothes', 'Shield (optional)'], gear: ["Explorer's Pack", 'Bedroll', 'Rations'] },
        Bard: { weapons: ['Rapier', 'Dagger'], armor: ['Leather Armor'], gear: ['Lute', "Diplomat's Pack", 'Ink & Quill'] },
        Cleric: { weapons: ['Mace', 'Light Crossbow'], armor: ['Chain Shirt', 'Shield'], gear: ['Holy Symbol', "Priest's Pack", 'Incense'] },
        Druid: { weapons: ['Scimitar', 'Dagger'], armor: ['Leather Armor', 'Wooden Shield'], gear: ['Druidic Focus', "Explorer's Pack", 'Herbalism Kit'] },
        Fighter: { weapons: ['Longsword', 'Longbow'], armor: ['Chain Mail', 'Shield'], gear: ["Explorer's Pack", 'Whetstone', 'Rope'] },
        Monk: { weapons: ['Shortsword', 'Quarterstaff'], armor: ['Unarmored Defense'], gear: ["Explorer's Pack", 'Prayer Beads', 'Waterskin'] },
        Paladin: { weapons: ['Longsword', 'Javelins'], armor: ['Chain Mail', 'Shield'], gear: ['Holy Symbol', "Priest's Pack", "Traveler's Cloak"] },
        Ranger: { weapons: ['Longbow', 'Shortswords'], armor: ['Scale Mail'], gear: ["Explorer's Pack", 'Hunting Trap', 'Rope'] },
        Rogue: { weapons: ['Rapier', 'Shortbow'], armor: ['Leather Armor'], gear: ["Thieves' Tools", "Burglar's Pack", 'Ball Bearings'] },
        Sorcerer: { weapons: ['Quarterstaff', 'Dagger'], armor: ['No armor proficiency'], gear: ['Arcane Focus', "Dungeoneer's Pack", 'Spell Components'] },
        Warlock: { weapons: ['Light Crossbow', 'Dagger'], armor: ['Leather Armor'], gear: ['Arcane Focus', "Scholar's Pack", 'Book of Shadows'] },
        Wizard: { weapons: ['Quarterstaff', 'Dagger'], armor: ['No armor proficiency'], gear: ['Spellbook', 'Arcane Focus', "Scholar's Pack"] }
    };

    readonly characterId = this.route.snapshot.paramMap.get('id') || '';
    readonly activeCombatTab = signal<CombatTab>('actions');
    readonly activeActionFilter = signal<ActionFilter>('all');
    readonly selectedCampaignAssignment = signal('');
    readonly isUpdatingCampaign = signal(false);
    readonly campaignUpdateError = signal('');
    readonly usedSpellSlotsByLevel = signal<Record<number, number>>({});

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

    readonly character = computed(() =>
        this.store.characters().find((item) => item.id === this.characterId) || null
    );

    readonly parsedNotes = computed(() => this.parsePersistedNotes(this.character()?.notes ?? ''));

    readonly persistedBuilderState = computed(() => this.parsedNotes().state);

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
            { label: 'Alignment', value: noteContext.alignment || 'Unaligned' },
            { label: 'Lifestyle', value: noteContext.lifestyle || 'Not set' },
            { label: 'Faith', value: noteContext.faith || 'Not set' },
            { label: 'Experience', value: `${this.getXpForLevel(char.level).toLocaleString()} XP` }
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

    readonly spellCantrips = computed(() => {
        const rows = this.actionRows();
        return rows.filter((row) => this.knownCantripNames.has(row.name));
    });

    readonly spellLevelOne = computed(() => {
        const rows = this.actionRows();
        return rows.filter((row) => {
            if (this.knownCantripNames.has(row.name)) {
                return false;
            }

            // Spell rows include save-based spells and explicit spell attacks.
            return row.type === 'save' || /spell/i.test(row.note);
        });
    });

    readonly defenses = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const traitResistances = (char.traits ?? [])
            .filter((trait) => /resistance|resil|immune/i.test(trait))
            .map((trait) => trait.replace(/^[^:]*:\s*/, '').trim());

        return traitResistances.length ? traitResistances : ['No explicit resistances recorded'];
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

        return this.classTrainingMap[char.className] ?? {
            armor: ['Light Armor'],
            weapons: ['Simple Weapons'],
            tools: []
        };
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

        return this.raceInfo()?.languages ?? ['Common'];
    });

    readonly senses = computed(() => {
        const char = this.character();
        if (!char) {
            return ['Passive Perception 10'];
        }

        const hasDarkvision = (char.traits ?? []).some((trait) => /darkvision/i.test(trait));
        const entries = [
            `Passive Perception ${this.passivePerception()}`,
            `Passive Investigation ${this.passiveInvestigation()}`,
            `Passive Insight ${this.passiveInsight()}`
        ];

        if (hasDarkvision) {
            entries.push('Darkvision 60 ft');
        }

        return entries;
    });

    readonly inventory = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const persisted = this.persistedBuilderState();
        const persistedEntries = Array.isArray(persisted?.inventoryEntries)
            ? persisted.inventoryEntries
                .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.category === 'string')
                .map((entry) => ({
                    name: entry.name.trim(),
                    category: entry.category.trim(),
                    quantity: Math.max(1, Math.trunc(Number(entry.quantity) || 1))
                }))
                .filter((entry) => entry.name.length > 0)
            : [];

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
                    gp: (Number(persistedCurrency.pp) || 0) * 10 + (Number(persistedCurrency.gp) || 0) + (Number(persistedCurrency.ep) || 0) * 0.5,
                    sp: Number(persistedCurrency.sp) || 0,
                    cp: Number(persistedCurrency.cp) || 0
                }
                : { gp: 0, sp: 0, cp: 0 };

            const totalItemCount = persistedEntries.reduce((sum, item) => sum + item.quantity, 0);

            return {
                weapons,
                armor,
                gear,
                currency,
                totalItemCount
            };
        }

        const defaults = this.classEquipmentMap[char.className] ?? {
            weapons: ['Simple Weapon'],
            armor: ['Travel Clothes'],
            gear: ['Backpack']
        };

        return {
            ...defaults,
            magicItems: [] as string[],
            currency: { gp: 12, sp: 8, cp: 5 },
            totalItemCount: defaults.weapons.length + defaults.armor.length + defaults.gear.length
        };
    });

    readonly inventorySummary = computed(() => {
        const bag = this.inventory();
        if (!bag) {
            return { weight: '0 lb', itemCount: 0, partyWeight: '0 lb' };
        }

        const itemCount = bag.totalItemCount ?? (bag.weapons.length + bag.armor.length + bag.gear.length);
        return {
            weight: `${Math.max(10, itemCount * 3)} lb`,
            itemCount,
            partyWeight: `${Math.max(40, itemCount * 7)} lb`
        };
    });

    readonly actionRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const templates = this.classActionTemplates[char.className] ?? [
            { name: 'Weapon Attack', type: 'attack' as ActionType, ability: 'strength' as AbilityKey, damage: '1d8 + STR', note: 'Basic attack' }
        ];

        return templates.map((action) => {
            const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[action.ability] ?? 10);
            const bonus = abilityMod + (char.proficiencyBonus ?? 2);
            return {
                ...action,
                bonusLabel: this.formatSigned(bonus)
            };
        });
    });

    readonly filteredActionRows = computed(() => {
        const filter = this.activeActionFilter();
        const rows = this.actionRows();

        if (filter === 'all') {
            return rows;
        }

        if (filter === 'attack') {
            return rows.filter((row) => row.type === 'attack');
        }

        if (filter === 'action') {
            return rows.filter((row) => row.type === 'save');
        }

        return [];
    });

    readonly attacksPerAction = computed(() => 1);

    readonly quickActions = computed(() => {
        const char = this.character();
        if (!char) {
            return { actions: [], bonusActions: [] as string[], reactions: [] as string[] };
        }

        return {
            actions: this.actionRows(),
            bonusActions: [this.classBonusActionMap[char.className] ?? 'Class bonus action'],
            reactions: [this.classReactionMap[char.className] ?? 'Opportunity Attack']
        };
    });

    readonly classFeatures = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        return (this.classFeatureMap[char.className] ?? []).filter((feature) => char.level >= feature.minLevel);
    });

    readonly displayBackstoryText = computed(() => {
        const notes = this.parsedNotes().cleanedNotes.trim();
        if (!notes) {
            return '';
        }

        const builderMarker = notes.search(/(?:^|\n)\s*(Builder class focus:|Species focus:|Alignment direction:|Lifestyle direction:|Emphasize these personality traits:|Include these ideals:|Include these bonds:|Reflect these flaws:|Physical characteristics:|Faith:)/i);
        if (builderMarker > 0) {
            return notes.slice(0, builderMarker).trim();
        }

        return notes;
    });

    readonly formattedBackstoryHtml = computed(() => {
        const backstory = this.displayBackstoryText();
        if (!backstory) {
            return '';
        }

        return this.formatBackstoryRichText(backstory);
    });

    readonly roleplay = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const context = this.noteContext();

        return {
            personality: context.personality || 'Not set',
            ideals: context.ideals || 'Not set',
            bonds: context.bonds || 'Not set',
            flaws: context.flaws || 'Not set',
            backstory: char.notes || 'Backstory not yet documented.'
        };
    });

    readonly noteContext = computed(() => {
        const notes = this.parsedNotes().cleanedNotes;

        const alignment = this.extractNoteValue(notes, /(^|\n)Alignment direction:\s*(.+?)(?=\n|$)/i);
        const lifestyle = this.extractNoteValue(notes, /(^|\n)Lifestyle direction:\s*(.+?)(?=\n|$)/i);
        const faith = this.extractNoteValue(notes, /(^|\n)Faith:\s*(.+?)(?=\n|$)/i);
        const personality = this.extractNoteValue(notes, /(^|\n)Emphasize these personality traits:\s*(.+?)(?=\n|$)/i);
        const ideals = this.extractNoteValue(notes, /(^|\n)Include these ideals:\s*(.+?)(?=\n|$)/i);
        const bonds = this.extractNoteValue(notes, /(^|\n)Include these bonds:\s*(.+?)(?=\n|$)/i);
        const flaws = this.extractNoteValue(notes, /(^|\n)Reflect these flaws:\s*(.+?)(?=\n|$)/i);

        const physicalRaw = this.extractNoteValue(notes, /(^|\n)Physical characteristics:\s*(.+?)(?=\n|$)/i);
        const physical = this.parsePhysicalCharacteristics(physicalRaw);

        return {
            alignment,
            lifestyle,
            faith,
            personality,
            ideals,
            bonds,
            flaws,
            physical
        };
    });

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

    setActionFilter(filter: ActionFilter): void {
        this.activeActionFilter.set(filter);
    }

    getUsedSpellSlots(level: number, maxSlots: number): number {
        const current = this.usedSpellSlotsByLevel()[level] ?? 0;
        return Math.min(Math.max(current, 0), Math.max(maxSlots, 0));
    }

    cycleUsedSpellSlots(level: number, maxSlots: number): void {
        if (maxSlots <= 0) {
            return;
        }

        this.usedSpellSlotsByLevel.update((current) => {
            const used = this.getUsedSpellSlots(level, maxSlots);
            const nextUsed = used >= maxSlots ? 0 : used + 1;
            return {
                ...current,
                [level]: nextUsed
            };
        });
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

        const fromKey = (key: AbilityKey): number | null => {
            const titleKey = this.toTitleCaseAbilityKey(key);
            const override = overrides[titleKey];
            if (typeof override === 'number' && Number.isFinite(override)) {
                return Math.trunc(override);
            }

            const baseValue = base[titleKey];
            if (typeof baseValue === 'number' && Number.isFinite(baseValue)) {
                return Math.trunc(baseValue);
            }

            return null;
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

        const mode = state.bgAbilityMode?.trim();
        if (mode === 'plus-two-plus-one') {
            const plusTwo = this.parseAbilityKey(state.bgAbilityScoreFor2);
            const plusOne = this.parseAbilityKey(state.bgAbilityScoreFor1);

            if (plusTwo) {
                scores[plusTwo] = Math.min(20, scores[plusTwo] + 2);
            }

            if (plusOne) {
                scores[plusOne] = Math.min(20, scores[plusOne] + 1);
            }
        }

        return scores;
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

    private getXpForLevel(level: number): number {
        const thresholds = [
            0,
            300,
            900,
            2700,
            6500,
            14000,
            23000,
            34000,
            48000,
            64000,
            85000,
            100000,
            120000,
            140000,
            165000,
            195000,
            225000,
            265000,
            305000,
            355000
        ];

        return thresholds[Math.min(Math.max(level, 1), 20) - 1] ?? 0;
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
