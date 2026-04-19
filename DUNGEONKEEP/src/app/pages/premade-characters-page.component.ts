import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { premadeCharacters, type PremadeCharacter } from '../data/premade-characters.data';
import { Router } from '@angular/router';
import { DungeonStoreService } from '../state/dungeon-store.service';
import { SessionService } from '../state/session.service';
import { DropdownComponent, type DropdownOption } from '../components/dropdown/dropdown.component';
import { classLevelOneFeatures, type ClassFeature } from '../data/class-features.data';
import { subclassFeatureProgressionByClass, subclassOptionsByClass } from '../data/subclass-features.data';

interface PremadeAbilityScoreImprovementChoice {
    mode: 'plus-two' | 'plus-one-plus-one';
    primaryAbility: string;
    secondaryAbility: string;
}

@Component({
    selector: 'app-premade-characters-page',
    standalone: true,
    imports: [CommonModule, DropdownComponent],
    templateUrl: './premade-characters-page.component.html',
    styleUrl: './premade-characters-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PremadeCharactersPageComponent {
    readonly premades = premadeCharacters;
    readonly classSearchTerm = signal('');
    readonly selectedClassFilter = signal('all');
    readonly selectedRoleFilter = signal('all');
    readonly selectedRaceFilter = signal('all');
    readonly selectedBackgroundFilter = signal('all');
    readonly selectedSpellcastingFilter = signal('all');
    readonly selectedComplexityFilter = signal('all');
    readonly selectedPrimaryAbilityFilter = signal('all');
    readonly selectedSearchScope = signal('full');
    readonly selectedPremadeLevel = signal(1);

    readonly searchScopeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'full', label: 'Full Search' },
        { value: 'name', label: 'Name Only' }
    ];

    readonly spellcastingFilterOptions: ReadonlyArray<DropdownOption> = [
        { value: 'all', label: 'All Types' },
        { value: 'spellcaster', label: 'Spellcasters Only' },
        { value: 'martial', label: 'Martials Only' }
    ];

    readonly premadeLevelOptions: ReadonlyArray<DropdownOption> = [
        { value: 1, label: 'Level 1 → Learning' },
        { value: 3, label: 'Level 3 → Subclass identity' },
        { value: 5, label: 'Level 5 → Power spike' },
        { value: 10, label: 'Level 10 → Full build' },
        { value: 20, label: 'Level 20 → Fantasy endgame' }
    ];

    readonly complexityFilterOptions: ReadonlyArray<DropdownOption> = [
        { value: 'all', label: 'All Complexity' },
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'advanced', label: 'Advanced' }
    ];

    readonly primaryAbilityFilterOptions: ReadonlyArray<DropdownOption> = [
        { value: 'all', label: 'All Abilities' },
        { value: 'strength', label: 'STR (Strength)' },
        { value: 'dexterity', label: 'DEX (Dexterity)' },
        { value: 'constitution', label: 'CON (Constitution)' },
        { value: 'intelligence', label: 'INT (Intelligence)' },
        { value: 'wisdom', label: 'WIS (Wisdom)' },
        { value: 'charisma', label: 'CHA (Charisma)' }
    ];

    readonly classFilterOptions = computed<DropdownOption[]>(() => {
        const uniqueClasses = Array.from(new Set(this.premades.map((premade) => premade.className))).sort((left, right) => left.localeCompare(right));
        return [{ value: 'all', label: 'All Classes' }, ...uniqueClasses.map((className) => ({ value: className, label: className }))];
    });

    readonly roleFilterOptions = computed<DropdownOption[]>(() => {
        const uniqueRoles = Array.from(new Set(this.premades.map((premade) => premade.role))).sort((left, right) => left.localeCompare(right));
        return [{ value: 'all', label: 'All Roles' }, ...uniqueRoles.map((role) => ({ value: role, label: role }))];
    });

    readonly raceFilterOptions = computed<DropdownOption[]>(() => {
        const uniqueRaces = Array.from(new Set(this.premades.map((premade) => premade.race))).sort((left, right) => left.localeCompare(right));
        return [{ value: 'all', label: 'All Races' }, ...uniqueRaces.map((race) => ({ value: race, label: race }))];
    });

    readonly backgroundFilterOptions = computed<DropdownOption[]>(() => {
        const uniqueBackgrounds = Array.from(new Set(this.premades.map((premade) => premade.background))).sort((left, right) => left.localeCompare(right));
        return [{ value: 'all', label: 'All Backgrounds' }, ...uniqueBackgrounds.map((background) => ({ value: background, label: background }))];
    });

    readonly filteredPremades = computed(() => {
        const selectedClass = this.selectedClassFilter();
        const selectedRole = this.selectedRoleFilter();
        const selectedRace = this.selectedRaceFilter();
        const selectedBackground = this.selectedBackgroundFilter();
        const selectedSpellcasting = this.selectedSpellcastingFilter();
        const selectedComplexity = this.selectedComplexityFilter();
        const selectedPrimaryAbility = this.selectedPrimaryAbilityFilter();
        const searchScope = this.selectedSearchScope();
        const query = this.classSearchTerm().trim().toLowerCase();

        return this.premades.filter((premade) => {
            const matchesClass = selectedClass === 'all' || premade.className === selectedClass;
            if (!matchesClass) {
                return false;
            }

            const matchesRole = selectedRole === 'all' || premade.role === selectedRole;
            if (!matchesRole) {
                return false;
            }

            const matchesRace = selectedRace === 'all' || premade.race === selectedRace;
            if (!matchesRace) {
                return false;
            }

            const matchesBackground = selectedBackground === 'all' || premade.background === selectedBackground;
            if (!matchesBackground) {
                return false;
            }

            const isSpellcaster = (premade.spells?.length ?? 0) > 0;
            const matchesSpellcasting = selectedSpellcasting === 'all'
                || (selectedSpellcasting === 'spellcaster' && isSpellcaster)
                || (selectedSpellcasting === 'martial' && !isSpellcaster);
            if (!matchesSpellcasting) {
                return false;
            }

            const complexity = this.getCharacterComplexity(premade);
            const matchesComplexity = selectedComplexity === 'all' || complexity === selectedComplexity;
            if (!matchesComplexity) {
                return false;
            }

            const primaryAbility = this.getPrimaryAbility(premade);
            const matchesPrimaryAbility = selectedPrimaryAbility === 'all' || primaryAbility === selectedPrimaryAbility;
            if (!matchesPrimaryAbility) {
                return false;
            }

            if (!query) {
                return true;
            }

            if (searchScope === 'name') {
                return premade.name.toLowerCase().includes(query);
            }

            const searchableText = `${premade.name} ${premade.className} ${premade.race} ${premade.role} ${premade.background} ${premade.notes}`.toLowerCase();
            return searchableText.includes(query);
        });
    });

    readonly hasActiveFilters = computed(() => (
        this.selectedClassFilter() !== 'all'
        || this.selectedRoleFilter() !== 'all'
        || this.selectedRaceFilter() !== 'all'
        || this.selectedBackgroundFilter() !== 'all'
        || this.selectedSpellcastingFilter() !== 'all'
        || this.selectedComplexityFilter() !== 'all'
        || this.selectedPrimaryAbilityFilter() !== 'all'
        || this.selectedSearchScope() !== 'full'
        || this.classSearchTerm().trim().length > 0
    ));

    private readonly router = inject(Router);
    private readonly store = inject(DungeonStoreService);
    private readonly session = inject(SessionService);
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';

    onClassSearchChanged(value: string): void {
        this.classSearchTerm.set(value);
    }

    onClassFilterChanged(value: string | number): void {
        this.selectedClassFilter.set(String(value));
    }

    onRoleFilterChanged(value: string | number): void {
        this.selectedRoleFilter.set(String(value));
    }

    onRaceFilterChanged(value: string | number): void {
        this.selectedRaceFilter.set(String(value));
    }

    onBackgroundFilterChanged(value: string | number): void {
        this.selectedBackgroundFilter.set(String(value));
    }

    onSpellcastingFilterChanged(value: string | number): void {
        this.selectedSpellcastingFilter.set(String(value));
    }

    onComplexityFilterChanged(value: string | number): void {
        this.selectedComplexityFilter.set(String(value));
    }

    onPrimaryAbilityFilterChanged(value: string | number): void {
        this.selectedPrimaryAbilityFilter.set(String(value));
    }

    onSearchScopeChanged(value: string | number): void {
        this.selectedSearchScope.set(String(value));
    }

    onPremadeLevelChanged(value: string | number): void {
        const parsed = Number(value);
        this.selectedPremadeLevel.set(Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.trunc(parsed))) : 1);
    }

    clearFilters(): void {
        this.classSearchTerm.set('');
        this.selectedClassFilter.set('all');
        this.selectedRoleFilter.set('all');
        this.selectedRaceFilter.set('all');
        this.selectedBackgroundFilter.set('all');
        this.selectedSpellcastingFilter.set('all');
        this.selectedComplexityFilter.set('all');
        this.selectedPrimaryAbilityFilter.set('all');
        this.selectedSearchScope.set('full');
    }

    onPremadeImageError(event: Event): void {
        const target = event.target;
        if (!(target instanceof HTMLImageElement) || !target.src.endsWith('.webp')) {
            return;
        }

        target.src = target.src.replace(/\.webp$/i, '.png');
    }

    private getCharacterComplexity(character: PremadeCharacter): string {
        const spellCount = character.spells?.length ?? 0;
        const featureCount = character.classFeatures?.length ?? 0;
        const equipmentCount = character.equipment?.length ?? 0;
        const complexityScore = spellCount + Math.ceil(featureCount / 2) + Math.ceil(equipmentCount / 3);

        if (complexityScore >= 8) {
            return 'advanced';
        }

        if (complexityScore >= 5) {
            return 'medium';
        }

        return 'easy';
    }

    private getPrimaryAbility(character: PremadeCharacter): string {
        const entries = Object.entries(character.abilityScores);
        const [topAbility] = entries.reduce((best, current) => current[1] > best[1] ? current : best, entries[0]);
        return topAbility;
    }

    private createLeveledPremade(character: PremadeCharacter, selectedLevel: number): PremadeCharacter {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(selectedLevel)));
        const conScore = Number(character.abilityScores?.constitution ?? 10);
        const conModifier = Math.floor((conScore - 10) / 2);
        const hitDie = this.getClassHitDie(character.className);
        const averagePerLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);
        const estimatedHitPoints = Math.max(
            normalizedLevel,
            hitDie + conModifier + Math.max(0, normalizedLevel - 1) * averagePerLevel
        );
        const defaultFeatureState = this.buildDefaultFeatureState(character, normalizedLevel);
        const leveledClassFeatures = this.buildLeveledClassFeatures(character, normalizedLevel, defaultFeatureState.selections, defaultFeatureState.abilityChoices);
        const combinedTraits = Array.from(new Set([
            ...(character.traits ?? []),
            ...(character.speciesTraits ?? []),
            ...leveledClassFeatures
        ]));

        return {
            ...character,
            level: normalizedLevel,
            hitPoints: estimatedHitPoints,
            maxHitPoints: estimatedHitPoints,
            classFeatures: leveledClassFeatures,
            traits: combinedTraits
        };
    }

    private getClassHitDie(className: string): number {
        const hitDiceByClass: Record<string, number> = {
            Artificer: 8,
            Barbarian: 12,
            Bard: 8,
            'Blood Hunter': 10,
            Cleric: 8,
            Druid: 8,
            Fighter: 10,
            Gunslinger: 10,
            Monk: 8,
            'Monster Hunter': 10,
            Paladin: 10,
            Ranger: 10,
            Rogue: 8,
            Sorcerer: 6,
            Warlock: 8,
            Wizard: 6
        };

        return hitDiceByClass[className] ?? 8;
    }

    async selectPremade(character: PremadeCharacter) {
        const premade = this.createLeveledPremade(character, this.selectedPremadeLevel());

        // Use the current user's displayName as playerName
        const user = this.session.currentUser();
        const playerName = user?.displayName || 'Player';
        const draft = {
            name: premade.name,
            playerName,
            race: premade.race,
            className: premade.className,
            level: premade.level,
            role: premade.role,
            background: premade.background,
            notes: this.createPersistedNotes(premade),
            abilityScores: premade.abilityScores,
            skills: premade.skills,
            armorClass: premade.armorClass,
            hitPoints: premade.hitPoints,
            maxHitPoints: premade.maxHitPoints,
            gender: premade.gender || '',
            alignment: premade.alignment || '',
            faith: premade.faith || '',
            lifestyle: premade.lifestyle || '',
            classFeatures: premade.classFeatures || [],
            speciesTraits: premade.speciesTraits || [],
            languages: premade.languages || [],
            personalityTraits: premade.personalityTraits || [],
            ideals: premade.ideals || [],
            bonds: premade.bonds || [],
            flaws: premade.flaws || [],
            equipment: premade.equipment || [],
            savingThrows: {},
            combatStats: {},
            spells: premade.spells || [],
            experiencePoints: 0,
            image: premade.image || '',
            goals: '',
            secrets: '',
            sessionHistory: ''
        };
        const created = await this.store.createCharacter(draft);
        if (created) {
            this.router.navigate(['/character', created.id]);
        }
    }

    private getStartingCurrencyForPremade(character: PremadeCharacter): { pp: number; gp: number; ep: number; sp: number; cp: number } {
        const baseByClass: Record<string, { pp: number; gp: number; ep: number; sp: number; cp: number }> = {
            Barbarian: { pp: 0, gp: 9, ep: 0, sp: 4, cp: 6 },
            Bard: { pp: 0, gp: 11, ep: 0, sp: 6, cp: 2 },
            Cleric: { pp: 0, gp: 10, ep: 0, sp: 5, cp: 0 },
            Druid: { pp: 0, gp: 8, ep: 0, sp: 7, cp: 5 },
            Fighter: { pp: 0, gp: 10, ep: 0, sp: 5, cp: 5 },
            Monk: { pp: 0, gp: 7, ep: 0, sp: 8, cp: 4 },
            Paladin: { pp: 0, gp: 12, ep: 0, sp: 3, cp: 0 },
            Ranger: { pp: 0, gp: 9, ep: 0, sp: 6, cp: 8 },
            Rogue: { pp: 0, gp: 8, ep: 0, sp: 9, cp: 1 },
            Sorcerer: { pp: 0, gp: 7, ep: 0, sp: 7, cp: 9 },
            Warlock: { pp: 0, gp: 8, ep: 0, sp: 8, cp: 2 },
            Wizard: { pp: 0, gp: 9, ep: 0, sp: 5, cp: 7 }
        };

        return baseByClass[character.className] ?? { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 };
    }

    private createPersistedNotes(character: PremadeCharacter): string {
        const visibleNotes = character.notes?.trim() || 'No field notes yet.';
        const roleplayLines = [
            `Alignment direction: ${character.alignment || 'Unaligned'}`,
            `Lifestyle direction: ${character.lifestyle || 'Unrecorded'}`,
            `Faith: ${character.faith || 'Unrecorded'}`,
            `Experience: 0 XP`,
            `Emphasize these personality traits: ${(character.personalityTraits ?? []).join(', ') || 'Not recorded'}`,
            `Include these ideals: ${(character.ideals ?? []).join(', ') || 'Not recorded'}`,
            `Include these bonds: ${(character.bonds ?? []).join(', ') || 'Not recorded'}`,
            `Reflect these flaws: ${(character.flaws ?? []).join(', ') || 'Not recorded'}`
        ];

        if (character.appearance) {
            roleplayLines.push(
                `Physical characteristics: Gender: ${character.gender || 'Not set'}; Age: ${character.appearance.age}; Height: ${character.appearance.height}; Weight: ${character.appearance.weight}; Hair: ${character.appearance.hair}; Eyes: ${character.appearance.eyes}; Skin: ${character.appearance.skin}`
            );
        }

        const composedVisibleNotes = `${visibleNotes}\n\n${roleplayLines.join('\n')}`;
        const defaultFeatureState = this.buildDefaultFeatureState(character, character.level || 1);
        const state: Record<string, unknown> = {
            selectedClass: character.className,
            characterLevel: character.level || 1,
            selectedBackgroundName: character.background || '',
            selectedAlignment: character.alignment || '',
            selectedFaith: character.faith || '',
            selectedLifestyle: character.lifestyle || '',
            selectedLanguages: character.languages ?? [],
            selectedSpeciesLanguages: character.languages ?? [],
            selectedSpeciesTraitChoices: character.speciesTraitChoices ?? {},
            classFeatureSelections: defaultFeatureState.selections,
            abilityScoreImprovementChoices: defaultFeatureState.abilityChoices,
            featFollowUpChoices: {},
            inventoryEntries: character.inventoryEntries,
            currency: this.getStartingCurrencyForPremade(character),
            personalityTraits: character.personalityTraits ?? [],
            ideals: character.ideals ?? [],
            bonds: character.bonds ?? [],
            flaws: character.flaws ?? [],
            physicalHair: character.appearance?.hair ?? '',
            physicalSkin: character.appearance?.skin ?? '',
            physicalEyes: character.appearance?.eyes ?? '',
            physicalHeight: character.appearance?.height ?? '',
            physicalWeight: character.appearance?.weight ?? '',
            physicalAge: character.appearance?.age ?? '',
            physicalGender: character.gender ?? ''
        };
        if (character.classPreparedSpells) {
            state['classPreparedSpells'] = character.classPreparedSpells;
        }
        if (character.wizardSpellbookByClass) {
            state['wizardSpellbookByClass'] = character.wizardSpellbookByClass;
        }
        const serializedState = JSON.stringify(state);
        return `${composedVisibleNotes}\n\n${this.builderStateStartTag}\n${serializedState}\n${this.builderStateEndTag}`;
    }

    private buildDefaultFeatureState(character: PremadeCharacter, level: number): {
        selections: Record<string, string[]>;
        abilityChoices: Record<string, PremadeAbilityScoreImprovementChoice>;
    } {
        const className = character.className;
        const selections: Record<string, string[]> = {};
        const abilityChoices: Record<string, PremadeAbilityScoreImprovementChoice> = {};
        const sortedAbilities = this.getSortedAbilityPriority(character);
        const selectedSkills = this.getCharacterSkillLabels(character);
        const equipmentNames = [...(character.equipment ?? []), ...(character.inventoryEntries ?? []).map((entry) => entry.name ?? '')]
            .map((value) => value.trim())
            .filter((value) => value.length > 0);

        for (const levelEntry of classLevelOneFeatures[className] ?? []) {
            if (levelEntry.level > level) {
                continue;
            }

            for (const feature of levelEntry.features) {
                const key = `${className}:${feature.level}:${feature.name}`;

                if (feature.name === 'Ability Score Improvement') {
                    selections[key] = ['Ability Score Improvement'];
                    abilityChoices[key] = {
                        mode: 'plus-two',
                        primaryAbility: sortedAbilities[0] ?? 'Dexterity',
                        secondaryAbility: sortedAbilities[1] ?? sortedAbilities[0] ?? 'Constitution'
                    };
                    continue;
                }

                if (feature.name === 'Epic Boon') {
                    selections[key] = [this.getDefaultEpicBoon(className)];
                    continue;
                }

                if (this.isSubclassSelectionFeature(feature.name)) {
                    const subclassName = this.getDefaultSubclassForClass(className);
                    if (subclassName) {
                        selections[key] = [subclassName];
                    }
                    continue;
                }

                if (!feature.choices) {
                    continue;
                }

                const options = this.getDefaultFeatureOptions(feature, selectedSkills, equipmentNames);
                if (options.length > 0) {
                    selections[key] = options.slice(0, feature.choices.count);
                }
            }
        }

        return { selections, abilityChoices };
    }

    private buildLeveledClassFeatures(
        character: PremadeCharacter,
        level: number,
        selections: Record<string, string[]>,
        abilityChoices: Record<string, PremadeAbilityScoreImprovementChoice>
    ): string[] {
        const className = character.className;
        const featureNames = new Set<string>([...(character.classFeatures ?? [])]);

        for (const levelEntry of classLevelOneFeatures[className] ?? []) {
            if (levelEntry.level > level) {
                continue;
            }

            for (const feature of levelEntry.features) {
                const key = `${className}:${feature.level}:${feature.name}`;

                if (this.isSubclassSelectionFeature(feature.name)) {
                    const selectedSubclass = selections[key]?.[0] ?? this.getDefaultSubclassForClass(className);
                    if (selectedSubclass) {
                        featureNames.add(`${feature.name}: ${selectedSubclass}`);
                        const subclassDetails = subclassFeatureProgressionByClass[className]?.[selectedSubclass]?.[feature.level];
                        const subclassDetailList = Array.isArray(subclassDetails)
                            ? subclassDetails
                            : subclassDetails
                                ? [subclassDetails]
                                : [];
                        subclassDetailList.forEach((detail) => featureNames.add(detail.name));
                    }
                    continue;
                }

                if (feature.name === 'Subclass Feature') {
                    const selectedSubclass = this.getDefaultSubclassForClass(className);
                    const subclassDetails = selectedSubclass ? subclassFeatureProgressionByClass[className]?.[selectedSubclass]?.[feature.level] : null;
                    const subclassDetailList = Array.isArray(subclassDetails)
                        ? subclassDetails
                        : subclassDetails
                            ? [subclassDetails]
                            : [];
                    if (subclassDetailList.length > 0) {
                        subclassDetailList.forEach((detail) => featureNames.add(detail.name));
                    } else {
                        featureNames.add(feature.name);
                    }
                    continue;
                }

                if (feature.name === 'Ability Score Improvement') {
                    const selectedAbility = abilityChoices[key]?.primaryAbility ?? 'Dexterity';
                    featureNames.add(`Ability Score Improvement (+2 ${selectedAbility})`);
                    continue;
                }

                if (feature.name === 'Epic Boon') {
                    featureNames.add(selections[key]?.[0] ?? this.getDefaultEpicBoon(className));
                    continue;
                }

                featureNames.add(feature.name);
            }
        }

        return Array.from(featureNames);
    }

    private getDefaultFeatureOptions(feature: ClassFeature, selectedSkills: string[], equipmentNames: string[]): string[] {
        const optionCount = Math.max(1, feature.choices?.count ?? 1);
        const options = feature.choices?.options ?? [];
        if (!options.length) {
            return [];
        }

        if (feature.name.toLowerCase().includes('skill') || feature.name === 'Expertise') {
            const matches = options.filter((option) => selectedSkills.includes(option));
            if (matches.length >= optionCount) {
                return matches.slice(0, optionCount);
            }
            return Array.from(new Set([...matches, ...options])).slice(0, optionCount);
        }

        if (feature.name.toLowerCase().includes('weapon mastery')) {
            const matches = options.filter((option) => equipmentNames.some((item) => option.toLowerCase().includes(item.toLowerCase())));
            if (matches.length >= optionCount) {
                return matches.slice(0, optionCount);
            }
            return Array.from(new Set([...matches, ...options])).slice(0, optionCount);
        }

        if (feature.name.toLowerCase().includes('fighting style') || feature.name.toLowerCase().includes('combat style')) {
            const prefersArchery = equipmentNames.some((item) => /bow|crossbow|rifle|pistol|musket|shotgun/i.test(item));
            const prefersTwoWeapon = equipmentNames.filter((item) => /dagger|shortsword|scimitar|handaxe/i.test(item)).length >= 2;
            const preferred = prefersArchery
                ? options.find((option) => option.toLowerCase().includes('archery'))
                : prefersTwoWeapon
                    ? options.find((option) => option.toLowerCase().includes('two-weapon'))
                    : options[0];
            return preferred ? [preferred] : options.slice(0, optionCount);
        }

        return options.slice(0, optionCount);
    }

    private getCharacterSkillLabels(character: PremadeCharacter): string[] {
        return Object.entries(character.skills ?? {})
            .filter(([, isSelected]) => !!isSelected)
            .map(([skill]) => this.toSkillLabel(skill));
    }

    private toSkillLabel(skill: string): string {
        return skill
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (value) => value.toUpperCase())
            .trim();
    }

    private getSortedAbilityPriority(character: PremadeCharacter): string[] {
        const labelMap: Record<string, string> = {
            strength: 'Strength',
            dexterity: 'Dexterity',
            constitution: 'Constitution',
            intelligence: 'Intelligence',
            wisdom: 'Wisdom',
            charisma: 'Charisma'
        };

        return Object.entries(character.abilityScores ?? {})
            .sort((left, right) => Number(right[1] ?? 0) - Number(left[1] ?? 0))
            .map(([key]) => labelMap[key] ?? key);
    }

    private isSubclassSelectionFeature(featureName: string): boolean {
        return featureName.includes('Subclass')
            || featureName === 'Blood Hunter Order'
            || featureName === 'Sorcerous Origin'
            || featureName === 'Hunter Order'
            || featureName === 'Gunslinger Style';
    }

    private getDefaultSubclassForClass(className: string): string {
        const options = subclassOptionsByClass[className] ?? [];
        return options[0] ?? '';
    }

    private getDefaultEpicBoon(className: string): string {
        return className === 'Rogue' ? 'Boon of Skill' : 'Boon of Fortitude';
    }
}
