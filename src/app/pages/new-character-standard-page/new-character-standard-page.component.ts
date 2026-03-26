import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { classLevelOneFeatures, classOptions as sharedClassOptions, type ClassFeature, type ClassFeaturesForLevel } from '../../data/class-features.data';
import type { ActiveInfoModal, BackgroundDetail, BuilderInfo, CurrencyState, EquipmentItem, InventoryEntry } from '../../data/new-character-standard-page.types';
import { backgroundDetailOverrides, backgroundOptions as sharedBackgroundOptions, backgroundStartingPackages, classDetailFallbacks, classInfoMap, classStartingPackages, classSubclassSnapshots, equipmentCatalog, equipmentSourceLinks, speciesInfoMap, validSteps } from '../../data/new-character-standard-page.data';
import { OptionMenuFilterComponent } from '../../components/option-menu-filter/option-menu-filter.component';
import { NewCharacterInfoModalComponent } from '../../components/new-character-info-modal/new-character-info-modal.component';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { MultiSelectDropdownComponent, type MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type StandardStep = 'home' | 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whats-next';
type AbilityGenerationMethod = '' | 'standard-array' | 'manual-rolled' | 'point-buy';
type ClassSortMode = 'primary-ability' | 'party-role' | 'power-source' | 'complexity' | 'spellcasting' | 'armor';
type SpeciesSortMode = 'lineage' | 'movement' | 'world' | 'complexity';

@Component({
    selector: 'app-new-character-standard-page',
    imports: [CommonModule, RouterLink, NewCharacterInfoModalComponent, DropdownComponent, MultiSelectDropdownComponent, OptionMenuFilterComponent],
    templateUrl: './new-character-standard-page.component.html',
    styleUrl: './new-character-standard-page.component.scss'
})
export class NewCharacterStandardPageComponent {
    readonly Object = Object;
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);

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
    readonly characterLevel = signal<number>(1);
    readonly multiclassList = signal<Record<string, number>>({});
    readonly selectedBackgroundName = signal<string>('');
    readonly selectedBackgroundUrl = signal<string>('');
    readonly selectedSpeciesName = signal<string>('');
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

    readonly standardSteps: ReadonlyArray<{ key: StandardStep; label: string; shortLabel?: string }> = [
        { key: 'home', label: 'Home' },
        { key: 'class', label: 'Class' },
        { key: 'background', label: 'Background' },
        { key: 'species', label: 'Species' },
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
    readonly commonLanguages = ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'];
    readonly exoticLanguages = ['Abyssal', 'Celestial', 'Draconic', 'Druidic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon'];
    readonly otherLanguages = ['Sign Language'];
    readonly allLanguages = [...this.commonLanguages, ...this.exoticLanguages, ...this.otherLanguages];
    readonly selectedLanguages = signal<string[]>([]);
    readonly selectedSpeciesLanguages = signal<string[]>([]);

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
    readonly backgroundDropdownOptions = computed<DropdownOption[]>(() =>
        this.backgroundOptions.map((bg) => ({ value: bg.url, label: bg.name }))
    );
    readonly abilityMethodsDropdown = computed<DropdownOption[]>(() =>
        this.abilityMethods.map((method) => ({ value: method.value, label: method.label }))
    );
    readonly alignmentOptions: ReadonlyArray<DropdownOption> = [
        { value: 'unaligned', label: '-- Choose an Option --' }
    ];
    readonly lifestyleOptions: ReadonlyArray<DropdownOption> = [
        { value: 'comfortable', label: '-- Choose an Option --' }
    ];
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
            description: `${selected.name} has source-specific rules and roleplay flavor. Use the source link to review the complete rules text and optional variants for your table.`,
            skillProficiencies: 'See source entry',
            toolProficiencies: 'See source entry',
            languages: 'See source entry',
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
    readonly speciesLanguageChoiceCount = computed(() => this.selectedSpeciesLanguageTrait()?.choices ?? 0);
    readonly speciesLanguagePlaceholder = computed(() =>
        this.speciesLanguageChoiceCount() === 1 ? 'Choose additional language...' : 'Choose additional languages...'
    );

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

    onAbilityMethodSelectedFromDropdown(value: string | number): void {
        this.onAbilityMethodSelected(String(value) as AbilityGenerationMethod);
    }

    onStandardArraySelectedFromDropdown(ability: string, value: string | number): void {
        this.onStandardArraySelected(ability, String(value));
    }

    onPointBuySelectedFromDropdown(ability: string, value: string | number): void {
        this.onPointBuySelected(ability, String(value));
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

}



