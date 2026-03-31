import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { premadeCharacters, type PremadeCharacter } from '../data/premade-characters.data';
import { Router } from '@angular/router';
import { DungeonStoreService } from '../state/dungeon-store.service';
import { SessionService } from '../state/session.service';
import { DropdownComponent, type DropdownOption } from '../components/dropdown/dropdown.component';

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

    readonly searchScopeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'full', label: 'Full Search' },
        { value: 'name', label: 'Name Only' }
    ];

    readonly spellcastingFilterOptions: ReadonlyArray<DropdownOption> = [
        { value: 'all', label: 'All Types' },
        { value: 'spellcaster', label: 'Spellcasters Only' },
        { value: 'martial', label: 'Martials Only' }
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

    async selectPremade(character: PremadeCharacter) {
        // Use the current user's displayName as playerName
        const user = this.session.currentUser();
        const playerName = user?.displayName || 'Player';
        const draft = {
            name: character.name,
            playerName,
            race: character.race,
            className: character.className,
            level: character.level,
            role: character.role,
            background: character.background,
            notes: this.createPersistedNotes(character),
            abilityScores: character.abilityScores,
            skills: character.skills,
            armorClass: character.armorClass,
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            gender: character.gender || '',
            alignment: character.alignment || '',
            faith: character.faith || '',
            lifestyle: character.lifestyle || '',
            classFeatures: character.classFeatures || [],
            speciesTraits: character.speciesTraits || [],
            languages: character.languages || [],
            personalityTraits: [],
            ideals: [],
            bonds: [],
            flaws: [],
            equipment: character.equipment || [],
            savingThrows: {},
            combatStats: {},
            spells: character.spells || [],
            experiencePoints: 0,
            image: character.image || '',
            goals: '',
            secrets: '',
            sessionHistory: ''
        };
        const created = await this.store.createCharacter(draft);
        if (created) {
            this.router.navigate(['/characters', created.id]);
        }
    }

    private createPersistedNotes(character: PremadeCharacter): string {
        const visibleNotes = character.notes?.trim() || 'No field notes yet.';
        const state: Record<string, unknown> = {
            inventoryEntries: character.inventoryEntries
        };
        if (character.classPreparedSpells) {
            state['classPreparedSpells'] = character.classPreparedSpells;
        }
        if (character.wizardSpellbookByClass) {
            state['wizardSpellbookByClass'] = character.wizardSpellbookByClass;
        }
        const serializedState = JSON.stringify(state);
        return `${visibleNotes}\n\n${this.builderStateStartTag}\n${serializedState}\n${this.builderStateEndTag}`;
    }
}
