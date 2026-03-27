import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { classLevelOneFeatures, classOptions as sharedClassOptions, type ClassFeature, type ClassFeaturesForLevel } from '../../data/class-features.data';
import type { ActiveInfoModal, BackgroundDetail, BuilderInfo, CurrencyState, EquipmentItem, InventoryEntry } from '../../data/new-character-standard-page.types';
import { backgroundDescriptionFallbacks, backgroundDetailOverrides, backgroundLanguagesFallbacks, backgroundOptions as sharedBackgroundOptions, backgroundSkillProficienciesFallbacks, backgroundStartingPackages, backgroundToolProficienciesFallbacks, classDetailFallbacks, classInfoMap, classStartingPackages, classSubclassSnapshots, equipmentCatalog, equipmentSourceLinks, magicInitiateSpellsByAbility, speciesInfoMap, validSteps } from '../../data/new-character-standard-page.data';
import type { CharacterDraft } from '../../models/dungeon.models';
import { OptionMenuFilterComponent } from '../../components/option-menu-filter/option-menu-filter.component';
import { NewCharacterInfoModalComponent } from '../../components/new-character-info-modal/new-character-info-modal.component';
import { CharacteristicsModalComponent } from '../../components/characteristics-modal/characteristics-modal.component';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { MultiSelectDropdownComponent, type MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { SessionService } from '../../state/session.service';

type StandardStep = 'home' | 'class' | 'species' | 'background' | 'abilities' | 'equipment' | 'whats-next';
type AbilityGenerationMethod = '' | 'standard-array' | 'manual-rolled' | 'point-buy';
type ClassSortMode = 'primary-ability' | 'party-role' | 'power-source' | 'complexity' | 'spellcasting' | 'armor';
type SpeciesSortMode = 'lineage' | 'movement' | 'world' | 'complexity';

@Component({
    selector: 'app-new-character-standard-page',
    imports: [CommonModule, RouterLink, NewCharacterInfoModalComponent, CharacteristicsModalComponent, DropdownComponent, MultiSelectDropdownComponent, OptionMenuFilterComponent],
    templateUrl: './new-character-standard-page.component.html',
    styleUrl: './new-character-standard-page.component.scss'
})
export class NewCharacterStandardPageComponent {
    readonly Object = Object;
    readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);

    private readonly routeStep = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('step') as StandardStep | null)),
        { initialValue: null }
    );

    readonly activeStandardStep = computed<StandardStep>(() => {
        const step = this.routeStep();
        return step && validSteps.has(step) ? step : 'home';
    });

    readonly activeInfoModal = signal<ActiveInfoModal | null>(null);
    readonly selectedClass = signal<string>('');
    readonly classSearchTerm = signal('');
    readonly characterLevel = signal<number>(1);
    readonly multiclassList = signal<Record<string, number>>({});
    readonly selectedBackgroundName = signal<string>('');
    readonly selectedBackgroundUrl = signal<string>('');
    readonly selectedSpeciesName = signal<string>('');
    readonly speciesSearchTerm = signal('');
    readonly openTraitKeys = signal<Set<string>>(new Set<string>());
    readonly classFeatureSelections = signal<Record<string, string[]>>({});
    readonly backgroundChoiceSelections = signal<Record<string, string>>({});
    readonly selectedAbilityMethod = signal<AbilityGenerationMethod>('');
    readonly abilityBaseScores = signal<Record<string, number>>({
        Strength: 10,
        Dexterity: 10,
        Constitution: 10,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 10
    });
    readonly abilityOtherModifiers = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly abilityOverrideScores = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly standardArraySelections = signal<Record<string, number | null>>({
        Strength: null,
        Dexterity: null,
        Constitution: null,
        Intelligence: null,
        Wisdom: null,
        Charisma: null
    });
    readonly rolledValues = signal<Array<number | null>>([null, null, null, null, null, null]);
    readonly rolledAssignments = signal<Record<number, string>>({});
    readonly manualRollGroupCount = signal(1);
    readonly diceRollGroupOpen = signal(true);

    readonly activeCharacteristicModal = signal<'traits' | 'ideals' | 'bonds' | 'flaws' | null>(null);
    readonly personalityTraits = signal<string[]>([]);
    readonly ideals = signal<string[]>([]);
    readonly bonds = signal<string[]>([]);
    readonly flaws = signal<string[]>([]);
    readonly showBackstoryGenerator = signal(false);
    readonly backstoryPromptDetails = signal('');
    readonly generatedBackstory = signal('');
    readonly isGeneratingBackstory = signal(false);
    readonly backstoryGenerationError = signal('');
    readonly isSavingGeneratedBackstory = signal(false);
    readonly backstorySaveMessage = signal('');
    readonly backstoryTargetCharacter = computed(() => this.store.selectedParty()[0] ?? null);

    readonly standardSteps: ReadonlyArray<{ key: StandardStep; label: string; shortLabel?: string }> = [
        { key: 'home', label: 'Home' },
        { key: 'class', label: 'Class' },
        { key: 'species', label: 'Species' },
        { key: 'background', label: 'Background' },
        { key: 'abilities', label: 'Abilities' },
        { key: 'equipment', label: 'Equipment' },
        { key: 'whats-next', label: "What's Next" }
    ];

    readonly classOptions = sharedClassOptions;
    readonly backgroundOptions = sharedBackgroundOptions;
    readonly selectedClassSortMode = signal<ClassSortMode>('primary-ability');
    readonly classSortOptions: ReadonlyArray<DropdownOption> = [
        { value: 'primary-ability', label: 'Primary Ability' },
        { value: 'party-role', label: 'Party Role' },
        { value: 'power-source', label: 'Power Source' },
        { value: 'complexity', label: 'Complexity' },
        { value: 'spellcasting', label: 'Spellcasting Type' },
        { value: 'armor', label: 'Armor & Survivability' }
    ];
    readonly classCategorySets: Readonly<Record<ClassSortMode, ReadonlyArray<{ label: string; source: string; classes: ReadonlyArray<string> }>>> = {
        'primary-ability': [
            { label: 'Strength-Based', source: 'Primary Ability', classes: ['Barbarian', 'Fighter', 'Paladin'] },
            { label: 'Dexterity-Based', source: 'Primary Ability', classes: ['Monk', 'Ranger', 'Rogue'] },
            { label: 'Intelligence-Based', source: 'Primary Ability', classes: ['Artificer', 'Wizard'] },
            { label: 'Wisdom-Based', source: 'Primary Ability', classes: ['Cleric', 'Druid'] },
            { label: 'Charisma-Based', source: 'Primary Ability', classes: ['Bard', 'Sorcerer', 'Warlock'] },
            { label: 'Flexible / Hybrid', source: 'Primary Ability', classes: ['Blood Hunter'] }
        ],
        'party-role': [
            { label: 'Frontline', source: 'Party Role', classes: ['Barbarian', 'Fighter', 'Paladin'] },
            { label: 'Skirmisher / Scout', source: 'Party Role', classes: ['Rogue', 'Monk', 'Ranger', 'Blood Hunter'] },
            { label: 'Support / Control Casters', source: 'Party Role', classes: ['Bard', 'Cleric', 'Druid', 'Wizard'] },
            { label: 'Blaster / Utility Casters', source: 'Party Role', classes: ['Sorcerer', 'Warlock', 'Artificer'] }
        ],
        'power-source': [
            { label: 'Martial', source: 'Power Source', classes: ['Barbarian', 'Fighter', 'Rogue', 'Monk'] },
            { label: 'Divine', source: 'Power Source', classes: ['Cleric', 'Paladin'] },
            { label: 'Primal', source: 'Power Source', classes: ['Druid', 'Ranger'] },
            { label: 'Arcane', source: 'Power Source', classes: ['Wizard', 'Sorcerer', 'Bard', 'Warlock', 'Artificer'] },
            { label: 'Occult / Hunter', source: 'Power Source', classes: ['Blood Hunter'] }
        ],
        'complexity': [
            { label: 'Beginner-Friendly', source: 'Complexity', classes: ['Fighter', 'Barbarian', 'Rogue'] },
            { label: 'Intermediate', source: 'Complexity', classes: ['Ranger', 'Paladin', 'Warlock', 'Sorcerer', 'Bard', 'Blood Hunter'] },
            { label: 'Advanced', source: 'Complexity', classes: ['Cleric', 'Druid', 'Wizard', 'Artificer', 'Monk'] }
        ],
        'spellcasting': [
            { label: 'Non / Low Caster', source: 'Spellcasting Type', classes: ['Barbarian', 'Fighter', 'Rogue', 'Monk', 'Blood Hunter'] },
            { label: 'Half Caster', source: 'Spellcasting Type', classes: ['Paladin', 'Ranger', 'Artificer'] },
            { label: 'Full Caster', source: 'Spellcasting Type', classes: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'] }
        ],
        'armor': [
            { label: 'Heavy / Very Durable', source: 'Armor & Survivability', classes: ['Fighter', 'Paladin', 'Cleric'] },
            { label: 'Medium / Mobile', source: 'Armor & Survivability', classes: ['Barbarian', 'Ranger', 'Artificer', 'Blood Hunter', 'Druid'] },
            { label: 'Light / Unarmored', source: 'Armor & Survivability', classes: ['Rogue', 'Monk', 'Bard', 'Sorcerer', 'Warlock', 'Wizard'] }
        ]
    };
    readonly classCategories = computed(() => this.classCategorySets[this.selectedClassSortMode()]);
    readonly filteredClassCategories = computed(() => {
        const query = this.classSearchTerm().trim().toLowerCase();
        if (!query) {
            return this.classCategories();
        }

        return this.classCategories()
            .map((category) => ({
                ...category,
                classes: category.classes.filter((className) => className.toLowerCase().includes(query))
            }))
            .filter((category) => category.classes.length > 0);
    });

    readonly currentBgAbilityScores = computed<readonly string[]>(() => {
        const name = this.selectedBackground()?.name ?? '';
        return this.backgroundAbilityScoresMap[name] ?? this.abilityTiles;
    });
    readonly bgAbilityContextText = computed<string>(() => {
        const bgName = this.selectedBackground()?.name ?? 'This background';
        const abilities = this.currentBgAbilityScores();
        const last = abilities[abilities.length - 1];
        const front = abilities.slice(0, -1).join(', ');
        const abilitiesList = front ? `${front} and ${last}` : last;
        return `The ${bgName} Background allows you to choose between ${abilitiesList}. Increase one of these scores by 2 and another one by 1, or increase all three by 1. None of these increases can raise a score above 20.`;
    });
    readonly bgAbility2Options = computed<DropdownOption[]>(() =>
        this.currentBgAbilityScores().map((s) => ({ value: s, label: s }))
    );
    readonly bgAbility1Options = computed<DropdownOption[]>(() => {
        const picked2 = this.bgAbilityScoreFor2();
        return this.currentBgAbilityScores()
            .filter((s) => s !== picked2)
            .map((s) => ({ value: s, label: s }));
    });
    readonly magicInitiateCantrips = computed<DropdownOption[]>(() => {
        const ability = this.magicInitiateAbility();
        const data = magicInitiateSpellsByAbility[ability];
        if (!data) return [];
        return data.cantrips.map((s) => ({ value: s, label: s }));
    });
    readonly magicInitiateLevel1Spells = computed<DropdownOption[]>(() => {
        const ability = this.magicInitiateAbility();
        const data = magicInitiateSpellsByAbility[ability];
        if (!data) return [];
        return data.level1Spells.map((s) => ({ value: s, label: s }));
    });
    readonly commonLanguages = ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'];
    readonly exoticLanguages = ['Abyssal', 'Celestial', 'Draconic', 'Druidic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon'];
    readonly otherLanguages = ['Sign Language'];
    readonly allLanguages = [...this.commonLanguages, ...this.exoticLanguages, ...this.otherLanguages];
    readonly selectedLanguages = signal<string[]>([]);
    readonly selectedSpeciesLanguages = signal<string[]>([]);
    readonly completionCharacterName = signal('');
    readonly completionPlayerName = signal('');
    readonly assignToCurrentCampaignOnCreate = signal(false);
    readonly completionError = signal('');
    readonly isCompletingCharacter = signal(false);

    // Magic Initiate feat state
    readonly magicInitiateAbility = signal('');
    readonly magicInitiateCantrip1 = signal('');
    readonly magicInitiateCantrip2 = signal('');
    readonly magicInitiateSpell1 = signal('');

    // Background ability score increase state
    readonly bgAbilityMode = signal('');
    readonly bgAbilityScoreFor2 = signal('');
    readonly bgAbilityScoreFor1 = signal('');

    readonly languageGroups: ReadonlyArray<MultiSelectOptionGroup> = [
        { label: 'Common', options: ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'] },
        { label: 'Exotic', options: ['Abyssal', 'Celestial', 'Draconic', 'Druidic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon'] },
        { label: 'Other', options: ['Sign Language'] }
    ];

    // Dropdown options
    readonly levelOptions: ReadonlyArray<DropdownOption> = Array.from({ length: 20 }, (_, i) => ({
        value: i + 1,
        label: `Level ${i + 1}`
    }));
    readonly spellcasterAbilityOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Intelligence', label: 'Intelligence' },
        { value: 'Wisdom', label: 'Wisdom' },
        { value: 'Charisma', label: 'Charisma' }
    ];
    private readonly backgroundAbilityScoresMap: Readonly<Record<string, readonly string[]>> = {
        Acolyte: ['Intelligence', 'Wisdom', 'Charisma'],
        Criminal: ['Dexterity', 'Constitution', 'Intelligence'],
        Spy: ['Dexterity', 'Constitution', 'Intelligence'],
        Noble: ['Strength', 'Dexterity', 'Charisma'],
        Knight: ['Strength', 'Dexterity', 'Charisma'],
        Charlatan: ['Dexterity', 'Constitution', 'Charisma'],
        Entertainer: ['Strength', 'Dexterity', 'Charisma'],
        Gladiator: ['Strength', 'Dexterity', 'Charisma'],
        'Folk Hero': ['Strength', 'Constitution', 'Wisdom'],
        'Guild Artisan': ['Dexterity', 'Intelligence', 'Charisma'],
        'Guild Merchant': ['Dexterity', 'Intelligence', 'Charisma'],
        Hermit: ['Constitution', 'Intelligence', 'Wisdom'],
        Outlander: ['Strength', 'Dexterity', 'Constitution'],
        Sage: ['Constitution', 'Intelligence', 'Wisdom'],
        Sailor: ['Strength', 'Dexterity', 'Wisdom'],
        Pirate: ['Strength', 'Dexterity', 'Wisdom'],
        Soldier: ['Strength', 'Dexterity', 'Constitution'],
        'Mercenary Veteran': ['Strength', 'Dexterity', 'Constitution'],
        Urchin: ['Strength', 'Dexterity', 'Intelligence']
    };
    private readonly coreBackgrounds = new Set([
        'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit',
        'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'
    ]);
    private readonly coreVariantBackgrounds = new Set([
        'Gladiator', 'Guild Merchant', 'Knight', 'Pirate', 'Spy'
    ]);
    private readonly forgottenRealmsBackgrounds = new Set([
        'City Watch', 'Clan Crafter', 'Cloistered Scholar', 'Courtier', 'Faction Agent', 'Far Traveler',
        'Inheritor', 'Investigator (SCAG)', 'Knight of the Order', 'Marine', 'Mercenary Veteran',
        'Urban Bounty Hunter', 'Uthgardt Tribe Member', 'Waterdhavian Noble', 'Black Fist Double Agent',
        'Dragon Casualty', 'Iron Route Bandit', 'Phlan Insurgent', 'Stojanow Prisoner', 'Ticklebelly Nomad',
        'Caravan Specialist', 'Earthspur Miner', 'Harborfolk', 'Mulmaster Aristocrat', 'Phlan Refugee',
        'Cormanthor Refugee', 'Gate Urchin', 'Hillsfar Merchant', 'Hillsfar Smuggler', 'Secret Identity',
        'Shade Fanatic', 'Trade Sheriff'
    ]);
    private readonly settingBackgrounds = new Set([
        'Azorius Functionary', 'Boros Legionnaire', 'Dimir Operative', 'Golgari Agent', 'Gruul Anarch',
        'Izzet Engineer', 'Orzhov Representative', 'Rakdos Cultist', 'Selesnya Initiate', 'Simic Scientist',
        'Lorehold Student', 'Prismari Student', 'Quandrix Student', 'Silverquill Student', 'Witherbloom Student',
        'Knight of Solamnia', 'Mage of High Sorcery', 'Astral Drifter', 'Wildspacer', 'House Agent',
        'Dissenter', 'Initiate', 'Vizier', 'Inquisitor', 'Gate Warden', 'Planar Philosopher'
    ]);
    private readonly adventureBackgrounds = new Set([
        'Anthropologist', 'Archaeologist', 'Athlete', 'Faceless', 'Feylost', 'Fisher', 'Giant Foundling',
        'Haunted One', 'Rewarded', 'Ruined', 'Rune Carver', 'Witchlight Hand', 'Celebrity Adventurer\'s Scion',
        'Failed Merchant', 'Gambler', 'Plaintiff', 'Rival Intern', 'Grinner', 'Volstrucker Agent', 'Ashari'
    ]);
    readonly backgroundDropdownOptions = computed<DropdownOption[]>(() =>
        this.backgroundOptions.map((bg) => ({
            value: bg.url,
            label: bg.name,
            group: this.getBackgroundGroup(bg.name)
        }))
    );
    readonly abilityMethodsDropdown = computed<DropdownOption[]>(() =>
        this.abilityMethods.map((method) => ({ value: method.value, label: method.label }))
    );
    readonly alignmentOptions: ReadonlyArray<DropdownOption> = [
        { value: 'chaotic-evil', label: 'Chaotic Evil' },
        { value: 'chaotic-good', label: 'Chaotic Good' },
        { value: 'chaotic-neutral', label: 'Chaotic Neutral' },
        { value: 'lawful-evil', label: 'Lawful Evil' },
        { value: 'lawful-good', label: 'Lawful Good' },
        { value: 'lawful-neutral', label: 'Lawful Neutral' },
        { value: 'neutral-good', label: 'Neutral Good' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'neutral-evil', label: 'Neutral Evil' },
        { value: 'true-neutral', label: 'True Neutral' }
    ];
    readonly selectedAlignment = signal('');
    readonly selectedFaith = signal('');
    readonly lifestyleOptions: ReadonlyArray<DropdownOption> = [
        { value: 'wretched', label: 'Wretched (free, but miserable)' },
        { value: 'squalid', label: 'Squalid (1 SP/day)' },
        { value: 'poor', label: 'Poor (2 SP/day)' },
        { value: 'modest', label: 'Modest (1 GP/day)' },
        { value: 'comfortable', label: 'Comfortable (2 GP/day)' },
        { value: 'wealthy', label: 'Wealthy (4 GP/day)' },
        { value: 'aristocratic', label: 'Aristocratic (10+ GP/day)' }
    ];
    readonly selectedLifestyle = signal('');
    readonly physicalHair = signal('');
    readonly physicalSkin = signal('');
    readonly physicalEyes = signal('');
    readonly physicalHeight = signal('');
    readonly physicalWeight = signal('');
    readonly physicalAge = signal('');
    readonly physicalGender = signal('');
    readonly selectedSpeciesSortMode = signal<SpeciesSortMode>('lineage');
    readonly speciesSortOptions: ReadonlyArray<DropdownOption> = [
        { value: 'lineage', label: 'Lineage Group' },
        { value: 'movement', label: 'Movement Profile' },
        { value: 'world', label: 'World Affinity' },
        { value: 'complexity', label: 'Complexity' }
    ];
    readonly speciesCategorySets: Readonly<Record<SpeciesSortMode, ReadonlyArray<{ label: string; source: string; species: ReadonlyArray<string> }>>> = {
        lineage: [
            {
                label: 'Core Species',
                source: "Player's Handbook",
                species: ['Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human', 'Tiefling']
            },
            {
                label: 'Expanded Lineages',
                source: 'Expanded Lineages',
                species: [
                    'Aarakocra', 'Aasimar', 'Changeling', 'Deep Gnome', 'Duergar', 'Eladrin', 'Fairy', 'Firbolg',
                    'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Githyanki', 'Githzerai',
                    'Goliath', 'Harengon', 'Kenku', 'Locathah', 'Owlin', 'Satyr', 'Sea Elf', 'Shadar-Kai', 'Tabaxi',
                    'Tortle', 'Triton', 'Verdan'
                ]
            },
            {
                label: 'Monstrous Ancestries',
                source: 'Expanded Lineages',
                species: ['Bugbear', 'Centaur', 'Goblin', 'Grung', 'Hobgoblin', 'Kobold', 'Lizardfolk', 'Minotaur', 'Orc', 'Shifter', 'Yuan-Ti']
            }
        ],
        movement: [
            {
                label: 'Natural Flyers',
                source: 'Movement Profile',
                species: ['Aarakocra', 'Fairy', 'Owlin']
            },
            {
                label: 'Aquatic & Amphibious',
                source: 'Movement Profile',
                species: ['Locathah', 'Sea Elf', 'Triton', 'Grung', 'Lizardfolk']
            },
            {
                label: 'Fast Movers',
                source: 'Movement Profile',
                species: ['Centaur', 'Tabaxi', 'Harengon']
            },
            {
                label: 'Standard Grounded',
                source: 'Movement Profile',
                species: [
                    'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human', 'Tiefling',
                    'Aasimar', 'Changeling', 'Deep Gnome', 'Duergar', 'Eladrin', 'Firbolg', 'Genasi (Air)',
                    'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Githyanki', 'Githzerai', 'Goliath',
                    'Kenku', 'Satyr', 'Shadar-Kai', 'Tortle', 'Verdan', 'Bugbear', 'Goblin', 'Hobgoblin',
                    'Kobold', 'Minotaur', 'Orc', 'Shifter', 'Yuan-Ti'
                ]
            }
        ],
        world: [
            {
                label: 'Civilized Realms',
                source: 'World Affinity',
                species: ['Human', 'Dwarf', 'Elf', 'Gnome', 'Halfling', 'Half-Elf', 'Dragonborn', 'Tiefling']
            },
            {
                label: 'Fey & Planar',
                source: 'World Affinity',
                species: ['Eladrin', 'Fairy', 'Satyr', 'Shadar-Kai', 'Aasimar', 'Githyanki', 'Githzerai', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)']
            },
            {
                label: 'Wildlands & Frontiers',
                source: 'World Affinity',
                species: ['Firbolg', 'Goliath', 'Harengon', 'Tabaxi', 'Tortle', 'Shifter', 'Orc', 'Half-Orc', 'Centaur']
            },
            {
                label: 'Underdark & Shadow',
                source: 'World Affinity',
                species: ['Deep Gnome', 'Duergar', 'Kobold', 'Goblin', 'Hobgoblin', 'Bugbear', 'Yuan-Ti']
            },
            {
                label: 'Seas & Coasts',
                source: 'World Affinity',
                species: ['Locathah', 'Sea Elf', 'Triton', 'Grung', 'Lizardfolk']
            },
            {
                label: 'Nomads & Outsiders',
                source: 'World Affinity',
                species: ['Changeling', 'Kenku', 'Minotaur', 'Owlin', 'Verdan']
            }
        ],
        complexity: [
            {
                label: 'Beginner Friendly',
                source: 'Complexity',
                species: ['Human', 'Dwarf', 'Halfling', 'Half-Orc', 'Goliath', 'Orc', 'Tortle']
            },
            {
                label: 'Intermediate',
                source: 'Complexity',
                species: [
                    'Dragonborn', 'Elf', 'Gnome', 'Half-Elf', 'Tiefling', 'Aarakocra', 'Aasimar', 'Firbolg',
                    'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Harengon', 'Tabaxi',
                    'Sea Elf', 'Triton', 'Bugbear', 'Centaur', 'Goblin', 'Hobgoblin', 'Lizardfolk', 'Minotaur',
                    'Shifter', 'Yuan-Ti', 'Locathah', 'Owlin', 'Satyr'
                ]
            },
            {
                label: 'Advanced',
                source: 'Complexity',
                species: ['Changeling', 'Deep Gnome', 'Duergar', 'Eladrin', 'Fairy', 'Githyanki', 'Githzerai', 'Kenku', 'Shadar-Kai', 'Verdan', 'Grung', 'Kobold']
            }
        ]
    };
    readonly speciesCategories = computed(() => this.speciesCategorySets[this.selectedSpeciesSortMode()]);
    readonly filteredSpeciesCategories = computed(() => {
        const query = this.speciesSearchTerm().trim().toLowerCase();
        if (!query) {
            return this.speciesCategories();
        }

        return this.speciesCategories()
            .map((category) => ({
                ...category,
                species: category.species.filter((speciesName) => speciesName.toLowerCase().includes(query))
            }))
            .filter((category) => category.species.length > 0);
    });
    readonly abilityTiles = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
    readonly abilityAbbreviations: Record<string, string> = {
        Strength: 'STR',
        Dexterity: 'DEX',
        Constitution: 'CON',
        Intelligence: 'INT',
        Wisdom: 'WIS',
        Charisma: 'CHA'
    };
    readonly abilityMethods: ReadonlyArray<{ value: AbilityGenerationMethod; label: string }> = [
        { value: '', label: '-- Choose a Generation Method --' },
        { value: 'standard-array', label: 'Standard Array' },
        { value: 'manual-rolled', label: 'Manual/Rolled' },
        { value: 'point-buy', label: 'Point Buy' }
    ];
    readonly standardArrayValues: ReadonlyArray<number> = [15, 14, 13, 12, 10, 8];
    readonly pointBuyValues: ReadonlyArray<number> = [8, 9, 10, 11, 12, 13, 14, 15];
    readonly pointBuyBudget = 27;
    readonly equipmentSources = equipmentSourceLinks;
    readonly equipmentSearchTerm = signal('');
    readonly selectedEquipmentSourceUrl = signal('');
    readonly selectedClassStartingOption = signal<'A' | 'B' | ''>('A');
    readonly selectedBackgroundStartingOption = signal<'A' | 'B' | ''>('A');
    readonly inventoryEntries = signal<InventoryEntry[]>([]);
    readonly currency = signal<CurrencyState>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });

    readonly filteredEquipmentItems = computed(() => {
        const term = this.equipmentSearchTerm().trim().toLowerCase();
        const selectedSourceUrl = this.selectedEquipmentSourceUrl();

        return equipmentCatalog.filter((item) => {
            const sourceMatches = selectedSourceUrl ? item.sourceUrl === selectedSourceUrl : true;
            const termMatches = term
                ? item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
                : true;
            return sourceMatches && termMatches;
        });
    });

    readonly inventoryItemCount = computed(() => this.inventoryEntries().reduce((total, entry) => total + entry.quantity, 0));
    readonly totalCurrencyInGp = computed(() => {
        const value = this.currency();
        return (value.pp * 10) + value.gp + (value.ep * 0.5) + (value.sp * 0.1) + (value.cp * 0.01);
    });

    readonly selectedBackground = computed(() => {
        const selectedUrl = this.selectedBackgroundUrl();
        if (!selectedUrl) {
            return null;
        }

        return this.backgroundOptions.find((background) => background.url === selectedUrl) ?? null;
    });

    readonly selectedBackgroundDetail = computed<BackgroundDetail | null>(() => {
        const selected = this.selectedBackground();
        if (!selected) {
            return null;
        }

        const override = backgroundDetailOverrides[selected.name];
        if (override) {
            return { ...override, sourceUrl: selected.url };
        }

        return {
            description: backgroundDescriptionFallbacks[selected.name] ?? `${selected.name} shaped your life before adventuring, influencing your worldview, practical talents, and the story hooks you bring to the table.`,
            skillProficiencies: backgroundSkillProficienciesFallbacks[selected.name] ?? 'See source entry',
            toolProficiencies: backgroundToolProficienciesFallbacks[selected.name] ?? 'See source entry',
            languages: backgroundLanguagesFallbacks[selected.name] ?? 'See source entry',
            choices: [
                {
                    key: 'ability-scores',
                    title: 'Ability Scores',
                    subtitle: '1 Choice',
                    options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
                },
                {
                    key: 'background-feature',
                    title: 'Background Feature',
                    subtitle: `${selected.name} feature`,
                    description: 'Choose how your background feature most often appears in play.',
                    options: ['Social Access', 'Travel/Exploration Utility', 'Downtime Advantage']
                },
                {
                    key: 'characteristics-focus',
                    title: 'Suggested Characteristics',
                    subtitle: 'Traits, Ideals, Bonds, Flaws',
                    options: ['Roleplay Flavor Focus', 'Party Utility Focus', 'Story Hook Focus']
                }
            ],
            sourceUrl: selected.url
        };
    });

    readonly pointBuySpent = computed(() => {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return 0;
        }

        return this.abilityTiles.reduce((total, ability) => {
            const score = this.abilityBaseScores()[ability] ?? 8;
            return total + this.getPointBuyCost(score);
        }, 0);
    });

    readonly pointBuyRemaining = computed(() => this.pointBuyBudget - this.pointBuySpent());

    openClassModal(className: string): void {
        const info = classInfoMap[className];
        if (!info) {
            return;
        }

        const fallbackDetails = classDetailFallbacks[className];
        const details = info.details ?? fallbackDetails;

        if (!details) {
            this.activeInfoModal.set({ type: 'class', info });
            return;
        }

        const subclassSnapshot = classSubclassSnapshots[className];
        const baseFeatureNotes = details.featureNotes.map((note) => ({ ...note }));
        const hasSnapshotNote = baseFeatureNotes.some((note) => note.title === 'Published Subclass Snapshot');

        if (subclassSnapshot && !hasSnapshotNote) {
            baseFeatureNotes.push({
                title: 'Published Subclass Snapshot',
                summary: subclassSnapshot.summary,
                details: subclassSnapshot.details
            });
        }

        const enrichedInfo: BuilderInfo = {
            ...info,
            details: {
                ...details,
                levelOneGains: [...details.levelOneGains],
                coreTraits: details.coreTraits.map((trait) => ({ ...trait })),
                levelMilestones: details.levelMilestones.map((milestone) => ({ ...milestone })),
                featureNotes: baseFeatureNotes
            }
        };

        this.activeInfoModal.set({ type: 'class', info: enrichedInfo });
    }

    readonly selectedSpeciesInfo = computed(() => {
        const name = this.selectedSpeciesName();
        return name ? speciesInfoMap[name] : null;
    });
    readonly selectedSpeciesLanguageTrait = computed(() =>
        this.selectedSpeciesInfo()?.speciesDetails?.traitNotes.find((trait) => trait.title === 'Languages') ?? null
    );
    readonly speciesKnownLanguages = computed(() => this.extractKnownLanguages(this.selectedSpeciesLanguageTrait()?.details ?? ''));
    readonly speciesLanguageChoiceCount = computed(() => this.selectedSpeciesLanguageTrait()?.choices ?? 0);
    readonly speciesLanguagePlaceholder = computed(() =>
        this.speciesLanguageChoiceCount() === 1 ? 'Choose additional language...' : 'Choose additional languages...'
    );
    readonly backgroundLanguageChoiceCount = computed(() => this.getLanguageChoiceCount(this.selectedBackgroundDetail()?.languages ?? ''));
    readonly backgroundLanguageChoiceInChoices = computed(() =>
        this.selectedBackgroundDetail()?.choices.some((c) => this.isLanguageChoiceKey(c.key)) ?? false
    );
    readonly speciesLanguageDisabledOptions = computed(() =>
        this.selectedLanguages().filter((language) => !this.selectedSpeciesLanguages().includes(language))
    );
    readonly backgroundLanguageDisabledOptions = computed(() =>
        this.selectedSpeciesLanguages().filter((language) => !this.selectedLanguages().includes(language))
    );
    readonly suggestedPlayerName = computed(() => this.session.currentUser()?.displayName ?? '');
    readonly canCompleteCharacter = computed(() => {
        const hasName = this.completionCharacterName().trim().length > 0;
        const hasClass = this.getPrimaryClassName().length > 0;
        return hasName && hasClass;
    });

    selectSpecies(name: string): void {
        this.selectedSpeciesName.set(name);
        this.selectedSpeciesLanguages.set([]);
        this.openTraitKeys.set(new Set<string>());
    }

    changeSpecies(): void {
        this.selectedSpeciesName.set('');
        this.selectedSpeciesLanguages.set([]);
    }

    toggleTrait(key: string): void {
        this.openTraitKeys.update((keys) => {
            const next = new Set(keys);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    isTraitOpen(key: string): boolean {
        return this.openTraitKeys().has(key);
    }

    openSpeciesModal(speciesName: string): void {
        const info = speciesInfoMap[speciesName];
        if (!info) {
            return;
        }

        this.activeInfoModal.set({ type: 'species', info });
    }

    closeInfoModal(): void {
        this.activeInfoModal.set(null);
    }

    onInfoModalConfirmed(modal: ActiveInfoModal): void {
        if (modal.type === 'class') {
            this.selectClass(modal.info.name);
            return;
        }

        if (modal.type === 'species') {
            this.selectSpecies(modal.info.name);
            this.closeInfoModal();
            return;
        }

        this.selectBackground(modal.info.name);
    }

    selectClass(className: string): void {
        const current = this.multiclassList();
        this.multiclassList.set({
            ...current,
            [className]: 1
        });
        this.selectedClass.set('');
        this.closeInfoModal();
    }

    selectBackground(backgroundName: string): void {
        this.selectedBackgroundName.set(backgroundName);
        this.closeInfoModal();
    }

    updateClassFeatureSelection(featureName: string, chosenValues: string[]): void {
        this.classFeatureSelections.update((current) => ({
            ...current,
            [featureName]: chosenValues
        }));
    }

    onFeatureChoiceChange(featureName: string, option: string, isChecked: boolean, maxChoices: number): void {
        this.classFeatureSelections.update((current) => {
            const currentSelections = current[featureName] || [];
            if (isChecked) {
                // Add option if not at limit
                if (currentSelections.length < maxChoices) {
                    return { ...current, [featureName]: [...currentSelections, option] };
                }
            } else {
                // Remove option
                return { ...current, [featureName]: currentSelections.filter((s: string) => s !== option) };
            }
            return current;
        });
    }

    getClassFeatures(className: string, maxLevel: number = 1): ClassFeaturesForLevel[] {
        const seededFeatures = classLevelOneFeatures[className] || [];
        const hasSeededProgression = seededFeatures.some((featureGroup) => featureGroup.level > 1);

        if (hasSeededProgression) {
            return [...seededFeatures]
                .sort((a, b) => a.level - b.level)
                .filter((featureLevel) => featureLevel.level <= maxLevel);
        }

        const milestoneFeatures = this.getClassFeaturesFromMilestones(className);
        const mergedByLevel = new Map<number, ClassFeature[]>();

        for (const featureGroup of [...seededFeatures, ...milestoneFeatures]) {
            const current = mergedByLevel.get(featureGroup.level) || [];
            for (const feature of featureGroup.features) {
                const exists = current.some((entry) => entry.name.toLowerCase() === feature.name.toLowerCase());
                if (!exists) {
                    current.push(feature);
                }
            }
            mergedByLevel.set(featureGroup.level, current);
        }

        return Array.from(mergedByLevel.entries())
            .map(([level, features]) => ({ level, features }))
            .sort((a, b) => a.level - b.level)
            .filter((featureLevel) => featureLevel.level <= maxLevel);
    }

    private getClassFeaturesFromMilestones(className: string): ClassFeaturesForLevel[] {
        const details = classInfoMap[className]?.details ?? classDetailFallbacks[className];
        if (!details?.levelMilestones?.length) {
            return [];
        }

        return details.levelMilestones
            .map((milestone) => {
                const level = this.extractMilestoneLevel(milestone.title);
                if (!level) {
                    return null;
                }

                return {
                    level,
                    features: [{
                        name: milestone.summary,
                        level,
                        description: milestone.details
                    }]
                } as ClassFeaturesForLevel;
            })
            .filter((value): value is ClassFeaturesForLevel => value !== null);
    }

    private extractMilestoneLevel(title: string): number | null {
        const levelMatch = title.match(/level\s*(\d+)/i);
        if (levelMatch) {
            return Number(levelMatch[1]);
        }

        const rangedMatch = title.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (rangedMatch) {
            return Number(rangedMatch[1]);
        }

        return null;
    }

    addClass(className: string, level: number): void {
        const current = this.multiclassList();
        this.multiclassList.set({
            ...current,
            [className]: level
        });
        this.selectedClass.set('');
        this.characterLevel.set(1);
    }

    removeClass(className: string): void {
        const current = this.multiclassList();
        const updated = { ...current };
        delete updated[className];
        this.multiclassList.set(updated);
    }

    updateClassLevel(className: string, level: number): void {
        const current = this.multiclassList();
        current[className] = level;
        this.multiclassList.set({ ...current });
    }

    startMulticlass(): void {
        this.selectedClass.set('__MULTICLASS_SELECTOR__');
    }

    onBackgroundSelected(url: string): void {
        this.selectedBackgroundUrl.set(url);
        this.backgroundChoiceSelections.set({});
        this.selectedLanguages.set([]);
        this.magicInitiateAbility.set('');
        this.magicInitiateCantrip1.set('');
        this.magicInitiateCantrip2.set('');
        this.magicInitiateSpell1.set('');
        this.bgAbilityMode.set('');
        this.bgAbilityScoreFor2.set('');
        this.bgAbilityScoreFor1.set('');
    }

    getBackgroundChoiceSelection(choiceKey: string): string {
        const selected = this.selectedBackground();
        if (!selected) {
            return '';
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        return this.backgroundChoiceSelections()[compositeKey] ?? '';
    }

    onBackgroundChoiceSelected(choiceKey: string, value: string): void {
        const selected = this.selectedBackground();
        if (!selected) {
            return;
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        this.backgroundChoiceSelections.update((current) => ({
            ...current,
            [compositeKey]: value
        }));

        if (this.isLanguageChoiceKey(choiceKey)) {
            const normalized = value.trim();
            this.onBackgroundLanguagesChanged(normalized ? [normalized] : []);
        }
    }

    onEquipmentSearchChanged(value: string): void {
        this.equipmentSearchTerm.set(value);
    }

    onEquipmentSourceSelected(url: string): void {
        this.selectedEquipmentSourceUrl.update((current) => (current === url ? '' : url));
    }

    onClassStartingOptionChanged(value: string): void {
        this.selectedClassStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    onBackgroundStartingOptionChanged(value: string): void {
        this.selectedBackgroundStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    canAddStartingEquipment(): boolean {
        return this.selectedClassStartingOption() !== '' && this.selectedBackgroundStartingOption() !== '';
    }

    addStartingEquipment(): void {
        if (!this.canAddStartingEquipment()) {
            return;
        }

        const classKey = this.selectedClassStartingOption() as 'A' | 'B';
        const backgroundKey = this.selectedBackgroundStartingOption() as 'A' | 'B';
        const classPackage = classStartingPackages[classKey];
        const backgroundPackage = backgroundStartingPackages[backgroundKey];

        classPackage.items.forEach((item) => this.addInventoryItem(item));
        backgroundPackage.items.forEach((item) => this.addInventoryItem(item));

        this.addCurrency('gp', classPackage.currency.gp ?? 0);
        this.addCurrency('gp', backgroundPackage.currency.gp ?? 0);
    }

    clearEquipmentSelections(): void {
        this.inventoryEntries.set([]);
        this.currency.set({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
    }

    addEquipmentItemToInventory(item: EquipmentItem): void {
        this.addInventoryItem({
            name: item.name,
            category: item.category,
            quantity: 1,
            sourceUrl: item.sourceUrl
        });
    }

    onCurrencyInputChanged(key: keyof CurrencyState, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        this.currency.update((current) => ({ ...current, [key]: safeValue }));
    }

    private addInventoryItem(item: InventoryEntry): void {
        this.inventoryEntries.update((entries) => {
            const index = entries.findIndex((entry) => entry.name === item.name);
            if (index === -1) {
                return [...entries, { ...item }];
            }

            const next = [...entries];
            next[index] = {
                ...next[index],
                quantity: next[index].quantity + item.quantity
            };
            return next;
        });
    }

    private addCurrency(key: keyof CurrencyState, amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.currency.update((current) => ({ ...current, [key]: current[key] + amount }));
    }

    onAbilityMethodSelected(method: AbilityGenerationMethod): void {
        this.selectedAbilityMethod.set(method);
        const nullRecord = { Strength: null, Dexterity: null, Constitution: null, Intelligence: null, Wisdom: null, Charisma: null };
        this.abilityOtherModifiers.set({ ...nullRecord });
        this.abilityOverrideScores.set({ ...nullRecord });

        if (method === 'standard-array') {
            this.standardArraySelections.set({
                Strength: null,
                Dexterity: null,
                Constitution: null,
                Intelligence: null,
                Wisdom: null,
                Charisma: null
            });
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            return;
        }

        if (method === 'point-buy') {
            this.abilityBaseScores.set({
                Strength: 8,
                Dexterity: 8,
                Constitution: 8,
                Intelligence: 8,
                Wisdom: 8,
                Charisma: 8
            });
            return;
        }

        if (method === 'manual-rolled') {
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            this.rolledValues.set([null, null, null, null, null, null]);
            this.rolledAssignments.set({});
            this.manualRollGroupCount.set(1);
            return;
        }

        this.abilityBaseScores.set({
            Strength: 10,
            Dexterity: 10,
            Constitution: 10,
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10
        });
    }

    onAbilityScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        const method = this.selectedAbilityMethod();
        const min = method === 'point-buy' ? 8 : 3;
        const max = method === 'point-buy' ? 15 : 20;
        const clamped = Math.max(min, Math.min(max, parsed));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: clamped
        }));
    }

    onStandardArraySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const nextValue = Number.isNaN(parsed) ? null : parsed;

        this.standardArraySelections.update((current) => ({
            ...current,
            [ability]: nextValue
        }));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: nextValue ?? 0
        }));
    }

    getStandardArraySelection(ability: string): string {
        const value = this.standardArraySelections()[ability];
        return value == null ? '' : String(value);
    }

    getStandardArrayOptions(ability: string): ReadonlyArray<number> {
        const selections = this.standardArraySelections();
        const ownValue = selections[ability];
        const takenValues = new Set(
            Object.entries(selections)
                .filter(([key, val]) => key !== ability && val != null)
                .map(([, val]) => val as number)
        );
        return this.standardArrayValues.filter((v) => !takenValues.has(v) || v === ownValue);
    }

    onPointBuySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: parsed
        }));
    }

    getPointBuySelection(ability: string): string {
        return String(this.getAbilityBaseScore(ability));
    }

    isPointBuyOptionDisabled(ability: string, candidate: number): boolean {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return false;
        }

        const currentScore = this.getAbilityBaseScore(ability);
        const nextSpent = this.pointBuySpent() - this.getPointBuyCost(currentScore) + this.getPointBuyCost(candidate);
        return nextSpent > this.pointBuyBudget;
    }

    addManualRollGroup(): void {
        this.manualRollGroupCount.update((count) => count + 1);
    }

    rollAbilitySlot(index: number): void {
        const rolls = [
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6)
        ];
        rolls.sort((a, b) => b - a);
        const total = rolls[0] + rolls[1] + rolls[2];

        this.rolledValues.update((current) => {
            const next = [...current];
            next[index] = total;
            return next;
        });
    }

    resetManualRollGroup(): void {
        this.rolledValues.set([null, null, null, null, null, null]);
        this.rolledAssignments.set({});
    }

    applyManualRolledScores(): void {
        const nextScores: Record<string, number> = {
            Strength: 0,
            Dexterity: 0,
            Constitution: 0,
            Intelligence: 0,
            Wisdom: 0,
            Charisma: 0
        };

        this.rolledValues().forEach((value, index) => {
            const abilityName = this.abilityTiles[index];
            if (abilityName && value != null) {
                nextScores[abilityName] = value;
            }
        });

        this.abilityBaseScores.set(nextScores);
    }

    getManualRolledDisplay(index: number): string {
        const value = this.rolledValues()[index];
        return value == null ? '--' : String(value);
    }

    getAbilityBaseScore(ability: string): number {
        return this.abilityBaseScores()[ability] ?? 10;
    }

    getTotalScore(ability: string): number {
        return this.abilityOverrideScores()[ability] ?? this.getAbilityBaseScore(ability);
    }

    getTotalModifier(ability: string): string {
        const score = this.getTotalScore(ability);
        const base = Math.floor((score - 10) / 2);
        const other = this.abilityOtherModifiers()[ability] ?? 0;
        const total = base + other;
        return total >= 0 ? `+${total}` : `${total}`;
    }

    getOtherModifierDisplay(ability: string): string {
        const val = this.abilityOtherModifiers()[ability];
        return val == null ? '' : String(val);
    }

    getOverrideScoreDisplay(ability: string): string {
        const val = this.abilityOverrideScores()[ability];
        return val == null ? '' : String(val);
    }

    onOtherModifierInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOtherModifiers.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    onOverrideScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOverrideScores.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    getAbilityModifier(score: number): string {
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    getPointBuyCost(score: number): number {
        if (score <= 8) {
            return 0;
        }
        if (score <= 13) {
            return score - 8;
        }
        if (score === 14) {
            return 7;
        }
        return 9;
    }

    getPointBuyOptionLabel(value: number): string {
        const cost = this.getPointBuyCost(value);
        if (cost === 0) {
            return String(value);
        }
        const unit = cost === 1 ? 'Point' : 'Points';
        return `${value} (-${cost} ${unit})`;
    }

    onLanguageToggle(language: string, checked: boolean): void {
        this.selectedLanguages.update((current) => {
            if (checked) {
                return current.includes(language) ? current : [...current, language];
            } else {
                return current.filter((lang) => lang !== language);
            }
        });
    }

    isLanguageSelected(language: string): boolean {
        return this.selectedLanguages().includes(language);
    }

    getStandardArrayDropdownOptions(ability: string): DropdownOption[] {
        const selected = this.standardArraySelections();
        const available = new Set(this.standardArrayValues);
        const currentValue = selected[ability];

        if (currentValue) {
            available.add(Number(currentValue));
        }

        return Array.from(available)
            .sort((a, b) => b - a)
            .map((value) => ({ value: String(value), label: String(value) }));
    }

    readonly openCharacteristicModal = (type: 'traits' | 'ideals' | 'bonds' | 'flaws') => {
        this.activeCharacteristicModal.set(type);
    };

    readonly closeCharacteristicModal = () => {
        this.activeCharacteristicModal.set(null);
    };

    readonly getActiveCharacteristicValues = (): string[] => {
        const type = this.activeCharacteristicModal();
        if (!type) {
            return [];
        }

        switch (type) {
            case 'traits':
                return this.personalityTraits();
            case 'ideals':
                return this.ideals();
            case 'bonds':
                return this.bonds();
            case 'flaws':
                return this.flaws();
        }
    };

    readonly onCharacteristicSubmit = (values: string[]) => {
        const type = this.activeCharacteristicModal();
        if (!type) {
            this.closeCharacteristicModal();
            return;
        }

        const normalizedValues = Array.from(new Set((values ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));

        switch (type) {
            case 'traits':
                this.personalityTraits.set(normalizedValues);
                break;
            case 'ideals':
                this.ideals.set(normalizedValues);
                break;
            case 'bonds':
                this.bonds.set(normalizedValues);
                break;
            case 'flaws':
                this.flaws.set(normalizedValues);
                break;
        }

        this.closeCharacteristicModal();
    };

    readonly removeCharacteristic = (type: 'traits' | 'ideals' | 'bonds' | 'flaws', index: number) => {
        switch (type) {
            case 'traits':
                this.personalityTraits.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'ideals':
                this.ideals.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'bonds':
                this.bonds.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'flaws':
                this.flaws.update((current) => current.filter((_, i) => i !== index));
                break;
        }
    };

    readonly toggleBackstoryGenerator = () => {
        const nextOpen = !this.showBackstoryGenerator();
        this.showBackstoryGenerator.set(nextOpen);

        if (nextOpen && !this.backstoryPromptDetails().trim()) {
            this.backstoryPromptDetails.set(this.buildAutoBackstoryDirection());
        }

        this.backstoryGenerationError.set('');
        this.backstorySaveMessage.set('');
    };

    readonly onBackstoryPromptDetailsChanged = (value: string) => {
        this.backstoryPromptDetails.set(value);
    };

    formatBackstoryRichText(text: string): string {
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return withBold.replace(/\r?\n/g, '<br />');
    }

    readonly clearGeneratedBackstory = () => {
        this.generatedBackstory.set('');
        this.backstorySaveMessage.set('');
    };

    readonly saveGeneratedBackstoryToCharacter = async () => {
        const backstory = this.generatedBackstory().trim();
        const target = this.backstoryTargetCharacter();
        if (!backstory || !target || this.isSavingGeneratedBackstory()) {
            return;
        }

        this.isSavingGeneratedBackstory.set(true);
        this.backstorySaveMessage.set('');

        try {
            const persisted = await this.store.saveCharacterBackstory(target.id, backstory);
            this.backstorySaveMessage.set(
                persisted
                    ? `Saved to ${target.name}.`
                    : `Could not save to ${target.name}.`
            );
        } catch {
            this.backstorySaveMessage.set('Could not save backstory at this time.');
        } finally {
            this.isSavingGeneratedBackstory.set(false);
            this.cdr.detectChanges();
        }
    };

    readonly generateBackstory = async () => {
        if (this.isGeneratingBackstory()) {
            return;
        }

        this.isGeneratingBackstory.set(true);
        this.backstoryGenerationError.set('');
        this.backstorySaveMessage.set('');
        this.generatedBackstory.set('');

        try {
            const response = await this.api.generateCharacterBackstory({
                className: this.getCurrentClassSummary(),
                background: this.selectedBackgroundName() || 'Unknown background',
                species: this.selectedSpeciesName() || 'Unknown species',
                alignment: this.selectedAlignment() || 'Unchosen alignment',
                lifestyle: this.selectedLifestyle() || 'Unchosen lifestyle',
                personalityTraits: this.personalityTraits().slice(0, 3),
                ideals: this.ideals().slice(0, 2),
                bonds: this.bonds().slice(0, 2),
                flaws: this.flaws().slice(0, 2),
                additionalDirection: this.backstoryPromptDetails().trim()
            });

            this.generatedBackstory.set(response.backstory);
        } catch (error) {
            this.backstoryGenerationError.set(this.getBackstoryGenerationErrorMessage(error));
        } finally {
            this.isGeneratingBackstory.set(false);
            this.cdr.detectChanges();
        }
    };

    private getCurrentClassSummary(): string {
        const selected = this.selectedClass();
        if (selected && selected !== '__MULTICLASS_SELECTOR__') {
            return selected;
        }

        const multiClasses = Object.keys(this.multiclassList());
        if (multiClasses.length > 0) {
            return multiClasses.join(', ');
        }

        return 'Unknown class';
    }

    private getPrimaryClassName(): string {
        const selected = this.selectedClass();
        if (selected && selected !== '__MULTICLASS_SELECTOR__') {
            return selected;
        }

        const classes = Object.keys(this.multiclassList());
        return classes[0]?.trim() ?? '';
    }

    private getPrimaryClassLevel(): number {
        const primaryClass = this.getPrimaryClassName();
        if (!primaryClass) {
            return 1;
        }

        const level = this.multiclassList()[primaryClass];
        return level && level > 0 ? level : 1;
    }

    private buildCompletionDraft(): CharacterDraft | null {
        const characterName = this.completionCharacterName().trim();
        const playerName = this.completionPlayerName().trim() || this.suggestedPlayerName().trim();
        const className = this.getPrimaryClassName();

        if (!characterName || !playerName || !className) {
            return null;
        }

        const background = this.selectedBackgroundName() || this.selectedBackground()?.name || 'Freshly arrived adventurer';
        const faith = this.selectedFaith().trim();
        const notesParts = [this.generatedBackstory().trim(), this.backstoryPromptDetails().trim()];
        if (faith) {
            notesParts.push(`Faith: ${faith}`);
        }

        const notes = notesParts.filter((part) => part.length > 0).join('\n\n') || 'No field notes yet.';
        const selectedCampaignId = this.store.selectedCampaign()?.id;

        return {
            name: characterName,
            playerName,
            race: this.selectedSpeciesName() || 'Human',
            className,
            level: this.getPrimaryClassLevel(),
            role: 'Striker',
            background,
            notes,
            campaignId: this.assignToCurrentCampaignOnCreate() ? selectedCampaignId : undefined
        };
    }

    readonly onCompletionCharacterNameChanged = (value: string) => {
        this.completionCharacterName.set(value);
        this.completionError.set('');
    };

    readonly onCompletionPlayerNameChanged = (value: string) => {
        this.completionPlayerName.set(value);
        this.completionError.set('');
    };

    readonly completeCharacterCreation = async () => {
        if (this.isCompletingCharacter()) {
            return;
        }

        const draft = this.buildCompletionDraft();
        if (!draft) {
            this.completionError.set('Add a character name, player name, and class before completing creation.');
            return;
        }

        this.isCompletingCharacter.set(true);
        this.completionError.set('');

        try {
            const createdCharacter = await this.store.createCharacter(draft);
            if (!createdCharacter) {
                this.completionError.set('Unable to complete character creation right now.');
                return;
            }

            await this.router.navigate(['/character', createdCharacter.id]);
        } catch {
            this.completionError.set('Unable to complete character creation right now.');
        } finally {
            this.isCompletingCharacter.set(false);
            this.cdr.detectChanges();
        }
    };

    private getBackstoryGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error;
            }

            if (error.error && typeof error.error.detail === 'string' && error.error.detail.trim()) {
                return error.error.detail;
            }

            if (error.status === 0) {
                return 'Unable to reach the backstory service right now.';
            }
        }

        return error instanceof Error ? error.message : 'Unable to generate a backstory right now.';
    }

    private buildAutoBackstoryDirection(): string {
        const target = this.backstoryTargetCharacter();
        const lines: string[] = [];

        if (target) {
            lines.push(`Character: ${target.name}`);
            lines.push(`Current class and level: ${target.className} ${target.level}`);
            lines.push(`Known background: ${target.background || 'Unknown background'}`);
            if (target.notes?.trim()) {
                lines.push(`Existing notes to honor: ${target.notes.trim()}`);
            }
        }

        lines.push(`Builder class focus: ${this.getCurrentClassSummary()}`);

        if (this.selectedSpeciesName()) {
            lines.push(`Species focus: ${this.selectedSpeciesName()}`);
        }

        if (this.selectedBackgroundName()) {
            lines.push(`Background focus: ${this.selectedBackgroundName()}`);
        }

        if (this.selectedAlignment()) {
            lines.push(`Alignment direction: ${this.selectedAlignment()}`);
        }

        if (this.selectedLifestyle()) {
            lines.push(`Lifestyle direction: ${this.selectedLifestyle()}`);
        }

        const physicalDetails = [
            ['Gender', this.physicalGender().trim()],
            ['Age', this.physicalAge().trim()],
            ['Height', this.physicalHeight().trim()],
            ['Weight', this.physicalWeight().trim()],
            ['Hair', this.physicalHair().trim()],
            ['Eyes', this.physicalEyes().trim()],
            ['Skin', this.physicalSkin().trim()]
        ].filter(([, value]) => value.length > 0);

        if (physicalDetails.length > 0) {
            lines.push(`Physical characteristics: ${physicalDetails.map(([label, value]) => `${label}: ${value}`).join('; ')}`);
        }

        const traits = this.personalityTraits().slice(0, 3);
        if (traits.length > 0) {
            lines.push(`Emphasize these personality traits: ${traits.join('; ')}`);
        }

        const ideals = this.ideals().slice(0, 2);
        if (ideals.length > 0) {
            lines.push(`Include these ideals: ${ideals.join('; ')}`);
        }

        const bonds = this.bonds().slice(0, 2);
        if (bonds.length > 0) {
            lines.push(`Include these bonds: ${bonds.join('; ')}`);
        }

        const flaws = this.flaws().slice(0, 2);
        if (flaws.length > 0) {
            lines.push(`Reflect these flaws: ${flaws.join('; ')}`);
        }

        lines.push('Keep details grounded in campaign play and avoid contradicting known notes.');

        return lines.join('\n');
    }

    getPointBuyDropdownOptions(ability: string): DropdownOption[] {
        return this.pointBuyValues.map((value) => ({
            value: String(value),
            label: this.getPointBuyOptionLabel(value),
            disabled: this.isPointBuyOptionDisabled(ability, value)
        }));
    }

    choiceOptionsToDropdown(options: string[]): DropdownOption[] {
        return options.map((option) => ({ value: option, label: option }));
    }

    singleSelectValue(value: string): string[] {
        return value ? [value] : [];
    }

    singleSelectGroupsFromStrings(options: readonly string[]): MultiSelectOptionGroup[] {
        return [{ label: '', options: [...options] }];
    }

    singleSelectGroupsFromDropdownOptions(options: ReadonlyArray<DropdownOption>): MultiSelectOptionGroup[] {
        return [{
            label: '',
            options: options
                .filter((option) => !option.disabled)
                .map((option) => String(option.value))
        }];
    }

    // Dropdown event handlers - accept string | number from dropdown and convert to correct types
    onClassLevelChanged(className: string, value: string | number): void {
        this.updateClassLevel(className, Number(value));
    }

    onBackgroundSelectedFromDropdown(value: string | number): void {
        this.onBackgroundSelected(String(value));
    }

    onBackgroundChoiceSelectedFromDropdown(key: string, value: string | number): void {
        this.onBackgroundChoiceSelected(key, String(value));
    }

    onBackgroundChoiceSelectedFromMultiSelect(key: string, value: string[]): void {
        this.onBackgroundChoiceSelected(key, value[0] ?? '');
    }

    onAbilityMethodSelectedFromDropdown(value: string | number): void {
        this.onAbilityMethodSelected(String(value) as AbilityGenerationMethod);
    }

    onStandardArraySelectedFromDropdown(ability: string, value: string | number): void {
        this.onStandardArraySelected(ability, String(value));
    }

    onPointBuySelectedFromDropdown(ability: string, value: string | number): void {
        this.onPointBuySelected(ability, String(value));
    }

    onClassSearchChanged(value: string): void {
        this.classSearchTerm.set(value);
    }

    onSpeciesSearchChanged(value: string): void {
        this.speciesSearchTerm.set(value);
    }

    onBackgroundLanguagesChanged(values: string[]): void {
        const blockedBySpecies = new Set(this.selectedSpeciesLanguages());
        const maxCount = this.backgroundLanguageChoiceCount() || 1;
        const nextValues = values
            .filter((value) => !blockedBySpecies.has(value))
            .slice(0, maxCount);

        this.selectedLanguages.set(nextValues);
        this.syncBackgroundLanguageChoiceSelections(nextValues);
    }

    onSpeciesLanguagesChanged(values: string[]): void {
        const blockedByBackground = new Set(this.selectedLanguages());
        this.selectedSpeciesLanguages.set(values.filter((value) => !blockedByBackground.has(value)));
    }

    onClassSortModeChanged(value: string | number): void {
        const next = String(value) as ClassSortMode;
        if (Object.prototype.hasOwnProperty.call(this.classCategorySets, next)) {
            this.selectedClassSortMode.set(next);
        }
    }

    onSpeciesSortModeChanged(value: string | number): void {
        const next = String(value) as SpeciesSortMode;
        if (Object.prototype.hasOwnProperty.call(this.speciesCategorySets, next)) {
            this.selectedSpeciesSortMode.set(next);
        }
    }

    onMagicInitiateAbilityChanged(value: string | number): void {
        this.magicInitiateAbility.set(String(value));
        this.magicInitiateCantrip1.set('');
        this.magicInitiateCantrip2.set('');
        this.magicInitiateSpell1.set('');
    }

    onMagicInitiateAbilitySelectionChanged(value: string[]): void {
        this.onMagicInitiateAbilityChanged(value[0] ?? '');
    }

    onMagicInitiateCantrip1Changed(value: string | number): void {
        this.magicInitiateCantrip1.set(String(value));
    }

    onMagicInitiateCantrip2Changed(value: string | number): void {
        this.magicInitiateCantrip2.set(String(value));
    }

    onMagicInitiateSpell1Changed(value: string | number): void {
        this.magicInitiateSpell1.set(String(value));
    }

    onBgAbilityModeChanged(value: string | number): void {
        this.bgAbilityMode.set(String(value));
        this.bgAbilityScoreFor2.set('');
        this.bgAbilityScoreFor1.set('');
    }

    onBgAbilityModeSelectionChanged(value: string[]): void {
        this.onBgAbilityModeChanged(value[0] ?? '');
    }

    onBgAbilityScore2Changed(value: string | number): void {
        const next = String(value);
        this.bgAbilityScoreFor2.set(next);
        if (this.bgAbilityScoreFor1() === next) {
            this.bgAbilityScoreFor1.set('');
        }
    }

    onBgAbilityScore2SelectionChanged(value: string[]): void {
        this.onBgAbilityScore2Changed(value[0] ?? '');
    }

    onBgAbilityScore1Changed(value: string | number): void {
        this.bgAbilityScoreFor1.set(String(value));
    }

    onBgAbilityScore1SelectionChanged(value: string[]): void {
        this.onBgAbilityScore1Changed(value[0] ?? '');
    }

    private getBackgroundGroup(name: string): string {
        if (this.coreBackgrounds.has(name)) {
            return 'Core Backgrounds';
        }

        if (this.coreVariantBackgrounds.has(name)) {
            return 'Core Variants';
        }

        if (this.forgottenRealmsBackgrounds.has(name)) {
            return 'Forgotten Realms';
        }

        if (this.settingBackgrounds.has(name)) {
            return 'Setting Books';
        }

        if (this.adventureBackgrounds.has(name)) {
            return 'Adventures & Expansions';
        }

        return 'Other';
    }

    isLanguageChoiceKey(choiceKey: string): boolean {
        return choiceKey.toLowerCase().includes('language');
    }

    getBackgroundChoiceDisabledOptions(choiceKey: string): string[] {
        if (!this.isLanguageChoiceKey(choiceKey)) {
            return [];
        }

        const current = this.getBackgroundChoiceSelection(choiceKey);
        const blockedBySpecies = this.selectedSpeciesLanguages();
        return this.selectedLanguages()
            .filter((language) => language !== current)
            .concat(blockedBySpecies.filter((language) => language !== current));
    }

    onAssignToCurrentCampaignChanged(isChecked: boolean): void {
        this.assignToCurrentCampaignOnCreate.set(isChecked);
    }

    onFaithChanged(value: string): void {
        this.selectedFaith.set(value);
    }

    onPhysicalCharacteristicChanged(field: 'hair' | 'skin' | 'eyes' | 'height' | 'weight' | 'age' | 'gender', value: string): void {
        switch (field) {
            case 'hair':
                this.physicalHair.set(value);
                break;
            case 'skin':
                this.physicalSkin.set(value);
                break;
            case 'eyes':
                this.physicalEyes.set(value);
                break;
            case 'height':
                this.physicalHeight.set(value);
                break;
            case 'weight':
                this.physicalWeight.set(value);
                break;
            case 'age':
                this.physicalAge.set(value);
                break;
            case 'gender':
                this.physicalGender.set(value);
                break;
        }
    }

    private syncBackgroundLanguageChoiceSelections(values: string[]): void {
        const selected = this.selectedBackground();
        const detail = this.selectedBackgroundDetail();
        if (!selected || !detail) {
            return;
        }

        const languageChoice = detail.choices.find((choice) => this.isLanguageChoiceKey(choice.key));
        if (!languageChoice) {
            return;
        }

        const compositeKey = `${selected.name}:${languageChoice.key}`;
        this.backgroundChoiceSelections.update((current) => {
            const next = values[0] ?? '';
            if ((current[compositeKey] ?? '') === next) {
                return current;
            }

            return {
                ...current,
                [compositeKey]: next
            };
        });
    }

    private getLanguageChoiceCount(languageRule: string): number {
        const normalized = languageRule.toLowerCase();
        if (normalized.includes('two')) {
            return 2;
        }

        if (normalized.includes('three')) {
            return 3;
        }

        if (normalized.includes('one')) {
            return 1;
        }

        return 1;
    }

    private extractKnownLanguages(details: string): string[] {
        const normalized = details.trim();
        if (!normalized) {
            return [];
        }

        const knownMatch = normalized.match(/Your character knows\s+(.+?)\./i);
        const rawKnown = (knownMatch?.[1] ?? '').trim();
        if (!rawKnown) {
            return [];
        }

        return rawKnown
            .replace(/\s+and\s+/gi, ',')
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }

}



