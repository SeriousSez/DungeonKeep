import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { premadeCharacters, type PremadeCharacter } from '../data/premade-characters.data';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { DungeonStoreService } from '../state/dungeon-store.service';
import { SessionService } from '../state/session.service';

@Component({
    selector: 'app-premade-characters-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './premade-characters-page.component.html',
    styleUrl: './premade-characters-page.component.scss'
})
export class PremadeCharactersPageComponent {
    premades = premadeCharacters;

    private readonly store = inject(DungeonStoreService);
    private readonly session = inject(SessionService);
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';
    constructor(private router: Router) { }

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
