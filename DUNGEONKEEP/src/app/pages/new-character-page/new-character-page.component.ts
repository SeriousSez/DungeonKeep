import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { classLevelOneFeatures, classOptions } from '../../data/class-features.data';
import { backgroundOptions } from '../../data/new-character-standard-page.data';
import type { InventoryEntry } from '../../data/new-character-standard-page.types';
import { races } from '../../data/races';
import type { AbilityScores, CharacterDraft, PartyRole, SkillProficiencies } from '../../models/dungeon.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { SessionService } from '../../state/session.service';

@Component({
    selector: 'app-new-character-page',
    imports: [CommonModule, RouterLink, DropdownComponent],
    templateUrl: './new-character-page.component.html',
    styleUrl: './new-character-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewCharacterPageComponent {
    private readonly router = inject(Router);
    private readonly store = inject(DungeonStoreService);
    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';

    readonly classOptions: ReadonlyArray<DropdownOption> = classOptions
        .map((className) => ({ value: className, label: className }))
        .sort((left, right) => left.label.localeCompare(right.label));

    readonly speciesOptions: ReadonlyArray<DropdownOption> = races
        .map((race) => ({ value: race.name, label: race.name }))
        .sort((left, right) => left.label.localeCompare(right.label));

    readonly randomClassOptions = computed<ReadonlyArray<DropdownOption>>(() => [
        { value: 'any', label: 'Any Class' },
        ...this.classOptions
    ]);

    readonly levelOptions: ReadonlyArray<DropdownOption> = Array.from({ length: 20 }, (_, index) => ({
        value: index + 1,
        label: `Level ${index + 1}`
    }));

    readonly selectedQuickClass = signal('Fighter');
    readonly selectedQuickSpecies = signal('Human');
    readonly selectedRandomClass = signal('any');
    readonly selectedRandomLevel = signal(1);
    readonly quickBuildPending = signal(false);
    readonly randomBuildPending = signal(false);

    private readonly classRoles: Record<string, PartyRole> = {
        Artificer: 'Support',
        Barbarian: 'Tank',
        'Blood Hunter': 'Striker',
        Bard: 'Support',
        Cleric: 'Support',
        Druid: 'Support',
        Fighter: 'Tank',
        Monk: 'Striker',
        Paladin: 'Tank',
        Ranger: 'Scout',
        Rogue: 'Scout',
        Sorcerer: 'Caster',
        Warlock: 'Caster',
        Wizard: 'Caster'
    };

    private readonly classPrimaryAbilities: Record<string, Array<keyof AbilityScores>> = {
        Artificer: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength'],
        Barbarian: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
        'Blood Hunter': ['dexterity', 'strength', 'constitution', 'wisdom', 'intelligence', 'charisma'],
        Bard: ['charisma', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'strength'],
        Cleric: ['wisdom', 'constitution', 'strength', 'dexterity', 'charisma', 'intelligence'],
        Druid: ['wisdom', 'constitution', 'dexterity', 'intelligence', 'charisma', 'strength'],
        Fighter: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
        Monk: ['dexterity', 'wisdom', 'constitution', 'strength', 'charisma', 'intelligence'],
        Paladin: ['strength', 'charisma', 'constitution', 'wisdom', 'dexterity', 'intelligence'],
        Ranger: ['dexterity', 'wisdom', 'constitution', 'strength', 'charisma', 'intelligence'],
        Rogue: ['dexterity', 'intelligence', 'constitution', 'wisdom', 'charisma', 'strength'],
        Sorcerer: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
        Warlock: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
        Wizard: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength']
    };

    private readonly classHitDie: Record<string, number> = {
        Artificer: 8,
        Barbarian: 12,
        'Blood Hunter': 10,
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

    private readonly classArmorBonus: Record<string, number> = {
        Artificer: 3,
        Barbarian: 2,
        'Blood Hunter': 2,
        Bard: 2,
        Cleric: 4,
        Druid: 3,
        Fighter: 6,
        Monk: 0,
        Paladin: 6,
        Ranger: 3,
        Rogue: 2,
        Sorcerer: 1,
        Warlock: 2,
        Wizard: 1
    };

    private readonly classEquipment: Record<string, string[]> = {
        Artificer: ['Light Crossbow', 'Scale Mail', 'Thieves\' Tools', 'Tinker\'s Tools'],
        Barbarian: ['Greataxe', 'Javelin (4)', 'Explorer\'s Pack'],
        'Blood Hunter': ['Longsword', 'Hand Crossbow', 'Leather Armor', 'Hunter\'s Kit'],
        Bard: ['Rapier', 'Dagger', 'Lute', 'Leather Armor'],
        Cleric: ['Mace', 'Scale Mail', 'Shield', 'Holy Symbol'],
        Druid: ['Scimitar', 'Wooden Shield', 'Leather Armor', 'Druidic Focus'],
        Fighter: ['Longsword', 'Shield', 'Chain Mail', 'Light Crossbow'],
        Monk: ['Shortsword', 'Dart (10)', 'Explorer\'s Pack'],
        Paladin: ['Longsword', 'Shield', 'Chain Mail', 'Holy Symbol'],
        Ranger: ['Longbow', 'Shortsword (2)', 'Leather Armor', 'Explorer\'s Pack'],
        Rogue: ['Shortsword', 'Shortbow', 'Leather Armor', 'Thieves\' Tools'],
        Sorcerer: ['Dagger (2)', 'Arcane Focus', 'Dungeoneer\'s Pack'],
        Warlock: ['Dagger (2)', 'Leather Armor', 'Arcane Focus'],
        Wizard: ['Quarterstaff', 'Spellbook', 'Component Pouch', 'Scholar\'s Pack']
    };

    private readonly classStarterSpells: Record<string, string[]> = {
        Artificer: ['Mending', 'Mage Hand', 'Cure Wounds', 'Faerie Fire'],
        Bard: ['Vicious Mockery', 'Minor Illusion', 'Healing Word', 'Dissonant Whispers'],
        Cleric: ['Sacred Flame', 'Guidance', 'Bless', 'Cure Wounds'],
        Druid: ['Druidcraft', 'Shillelagh', 'Entangle', 'Healing Word'],
        Paladin: ['Bless', 'Cure Wounds', 'Shield of Faith'],
        Ranger: ["Hunter's Mark", 'Ensnaring Strike'],
        Sorcerer: ['Fire Bolt', 'Mage Hand', 'Chromatic Orb', 'Mage Armor'],
        Warlock: ['Eldritch Blast', 'Mage Hand', 'Hex', 'Armor of Agathys'],
        Wizard: ['Fire Bolt', 'Prestidigitation', 'Magic Missile', 'Shield']
    };

    private readonly firstNames = ['Arin', 'Bryn', 'Cael', 'Dara', 'Eldrin', 'Faye', 'Garrick', 'Iria', 'Kael', 'Lyra', 'Merric', 'Nyra', 'Orin', 'Piper', 'Riven', 'Syl', 'Theron', 'Vale'];
    private readonly surnames = ['Ashford', 'Bramble', 'Duskwhisper', 'Emberfall', 'Fenwick', 'Grayshield', 'Hollowbrook', 'Ironwood', 'Moonvale', 'Ravencrest', 'Stonehelm', 'Thornfield', 'Windmere'];

    goToPremades(): void {
        this.router.navigate(['/characters/new/premade']);
    }

    onQuickClassChanged(value: string | number): void {
        this.selectedQuickClass.set(String(value));
    }

    onQuickSpeciesChanged(value: string | number): void {
        this.selectedQuickSpecies.set(String(value));
    }

    onRandomClassChanged(value: string | number): void {
        this.selectedRandomClass.set(String(value));
    }

    onRandomLevelChanged(value: string | number): void {
        const parsed = Number(value);
        this.selectedRandomLevel.set(Number.isFinite(parsed) ? Math.max(1, Math.min(20, parsed)) : 1);
    }

    async createQuickBuild(): Promise<void> {
        if (this.quickBuildPending()) {
            return;
        }

        this.quickBuildPending.set(true);
        this.cdr.detectChanges();
        try {
            const draft = this.buildCharacterDraft({
                className: this.selectedQuickClass(),
                species: this.selectedQuickSpecies(),
                level: 1,
                randomizeAbilityScores: false,
                namePrefix: ''
            });

            const created = await this.store.createCharacter(draft);
            if (created) {
                await this.router.navigate(['/character', created.id]);
            }
        } finally {
            this.quickBuildPending.set(false);
            this.cdr.detectChanges();
        }
    }

    async createRandomBuild(): Promise<void> {
        if (this.randomBuildPending()) {
            return;
        }

        this.randomBuildPending.set(true);
        this.cdr.detectChanges();
        try {
            const chosenClass = this.selectedRandomClass() === 'any'
                ? this.pickRandomValue(classOptions)
                : this.selectedRandomClass();

            const chosenSpecies = this.pickRandomValue(races).name;
            const draft = this.buildCharacterDraft({
                className: chosenClass,
                species: chosenSpecies,
                level: this.selectedRandomLevel(),
                randomizeAbilityScores: true,
                namePrefix: ''
            });

            const created = await this.store.createCharacter(draft);
            if (created) {
                await this.router.navigate(['/character', created.id]);
            }
        } finally {
            this.randomBuildPending.set(false);
            this.cdr.detectChanges();
        }
    }

    private buildCharacterDraft(options: {
        className: string;
        species: string;
        level: number;
        randomizeAbilityScores: boolean;
        namePrefix: string;
    }): CharacterDraft {
        const level = Math.max(1, Math.min(20, options.level));
        const race = races.find((entry) => entry.name === options.species);
        const assignedAbilities = options.randomizeAbilityScores
            ? this.assignRandomAbilitiesByClass(options.className)
            : this.assignStandardArrayByClass(options.className);
        const abilityScores = this.applyRaceBonuses(assignedAbilities, race?.abilityBonuses ?? {});

        const conModifier = this.getAbilityModifier(abilityScores.constitution);
        const dexModifier = this.getAbilityModifier(abilityScores.dexterity);
        const hitDie = this.classHitDie[options.className] ?? 8;
        const armorClass = Math.max(10 + dexModifier + (this.classArmorBonus[options.className] ?? 2), 10);
        const hitPoints = this.estimateHitPoints(hitDie, conModifier, level);

        const role = this.classRoles[options.className] ?? 'Support';
        const equipment = this.classEquipment[options.className] ?? ['Explorer\'s Pack'];
        const spells = this.classStarterSpells[options.className] ?? [];
        const notes = this.createPersistedNotes({
            visibleNotes: `${options.namePrefix} build generated for immediate play.`,
            className: options.className,
            equipment,
            spells
        });
        const classFeatures = (classLevelOneFeatures[options.className]?.[0]?.features ?? [])
            .slice(0, 4)
            .map((feature) => feature.name);

        const backgroundName = this.pickRandomValue(backgroundOptions).name;
        const playerName = this.session.currentUser()?.displayName || 'Player';

        return {
            name: `${options.namePrefix} ${this.generateCharacterName()}`,
            playerName,
            race: options.species,
            className: options.className,
            level,
            role,
            background: backgroundName,
            notes,
            abilityScores,
            skills: this.createEmptySkills(),
            armorClass,
            hitPoints,
            maxHitPoints: hitPoints,
            classFeatures,
            speciesTraits: race?.traits ?? [],
            languages: race?.languages ?? ['Common'],
            equipment,
            spells,
            experiencePoints: 0,
            image: ''
        };
    }

    private createPersistedNotes(payload: {
        visibleNotes: string;
        className: string;
        equipment: string[];
        spells: string[];
    }): string {
        const inventoryEntries = payload.equipment.map((item) => this.toInventoryEntry(item));
        const state: Record<string, unknown> = {
            inventoryEntries,
            currency: this.getStartingCurrencyForClass(payload.className),
            classPreparedSpells: {
                [payload.className]: payload.spells
            }
        };

        if (payload.className === 'Wizard') {
            state['wizardSpellbookByClass'] = {
                [payload.className]: payload.spells
            };
        }

        const serializedState = JSON.stringify(state);
        return `${payload.visibleNotes}\n\n${this.builderStateStartTag}\n${serializedState}\n${this.builderStateEndTag}`;
    }

    private getStartingCurrencyForClass(className: string): { pp: number; gp: number; ep: number; sp: number; cp: number } {
        const baseByClass: Record<string, { pp: number; gp: number; ep: number; sp: number; cp: number }> = {
            Artificer: { pp: 0, gp: 10, ep: 0, sp: 6, cp: 4 },
            Barbarian: { pp: 0, gp: 9, ep: 0, sp: 4, cp: 6 },
            'Blood Hunter': { pp: 0, gp: 10, ep: 0, sp: 5, cp: 2 },
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

        return baseByClass[className] ?? { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 };
    }

    private toInventoryEntry(rawItem: string): InventoryEntry {
        const quantityMatch = rawItem.match(/\((\d+)\)\s*$/);
        const quantity = quantityMatch ? Math.max(1, Number(quantityMatch[1])) : 1;
        const name = rawItem.replace(/\s*\((\d+)\)\s*$/, '').trim();

        return {
            name,
            category: this.guessInventoryCategory(name),
            quantity
        };
    }

    private guessInventoryCategory(name: string): string {
        const lower = name.toLowerCase();

        if (
            lower.includes('sword')
            || lower.includes('bow')
            || lower.includes('crossbow')
            || lower.includes('mace')
            || lower.includes('axe')
            || lower.includes('staff')
            || lower.includes('javelin')
            || lower.includes('dagger')
            || lower.includes('dart')
        ) {
            return 'Weapon';
        }

        if (
            lower.includes('armor')
            || lower.includes('mail')
            || lower.includes('plate')
            || lower.includes('shield')
            || lower.includes('leather')
        ) {
            return 'Armor';
        }

        if (
            lower.includes('tools')
            || lower.includes('kit')
            || lower.includes('focus')
        ) {
            return 'Tools';
        }

        return 'Adventuring Gear';
    }

    private estimateHitPoints(hitDie: number, constitutionModifier: number, level: number): number {
        const firstLevel = hitDie + constitutionModifier;
        if (level <= 1) {
            return Math.max(1, firstLevel);
        }

        const averagePerLevel = Math.floor(hitDie / 2) + 1 + constitutionModifier;
        return Math.max(1, firstLevel + (level - 1) * averagePerLevel);
    }

    private assignStandardArrayByClass(className: string): AbilityScores {
        const priorities = this.classPrimaryAbilities[className] ?? ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        const scores = [15, 14, 13, 12, 10, 8];
        return this.assignScoresByPriority(priorities, scores);
    }

    private assignRandomAbilitiesByClass(className: string): AbilityScores {
        const priorities = this.classPrimaryAbilities[className] ?? ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        const rolls = Array.from({ length: 6 }, () => this.rollAbilityScore()).sort((left, right) => right - left);
        return this.assignScoresByPriority(priorities, rolls);
    }

    private assignScoresByPriority(priorities: Array<keyof AbilityScores>, orderedScores: number[]): AbilityScores {
        const result: AbilityScores = {
            strength: 8,
            dexterity: 8,
            constitution: 8,
            intelligence: 8,
            wisdom: 8,
            charisma: 8
        };

        priorities.forEach((ability, index) => {
            result[ability] = orderedScores[index] ?? 8;
        });

        return result;
    }

    private applyRaceBonuses(scores: AbilityScores, bonuses: Partial<AbilityScores>): AbilityScores {
        return {
            strength: scores.strength + (bonuses.strength ?? 0),
            dexterity: scores.dexterity + (bonuses.dexterity ?? 0),
            constitution: scores.constitution + (bonuses.constitution ?? 0),
            intelligence: scores.intelligence + (bonuses.intelligence ?? 0),
            wisdom: scores.wisdom + (bonuses.wisdom ?? 0),
            charisma: scores.charisma + (bonuses.charisma ?? 0)
        };
    }

    private getAbilityModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    private rollAbilityScore(): number {
        const rolls = Array.from({ length: 4 }, () => this.rollDie(6)).sort((left, right) => left - right);
        return rolls[1] + rolls[2] + rolls[3];
    }

    private rollDie(sides: number): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    private pickRandomValue<T>(values: ReadonlyArray<T>): T {
        return values[Math.floor(Math.random() * values.length)];
    }

    private generateCharacterName(): string {
        return `${this.pickRandomValue(this.firstNames)} ${this.pickRandomValue(this.surnames)}`;
    }

    private createEmptySkills(): SkillProficiencies {
        return {
            acrobatics: false,
            animalHandling: false,
            arcana: false,
            athletics: false,
            deception: false,
            history: false,
            insight: false,
            intimidation: false,
            investigation: false,
            medicine: false,
            nature: false,
            perception: false,
            performance: false,
            persuasion: false,
            sleightOfHand: false,
            stealth: false,
            survival: false
        };
    }
}
