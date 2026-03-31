import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { premadeCharacters } from '../data/premade-characters.data';
import { Router } from '@angular/router';
import { Character } from '../models/dungeon.models';
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
    constructor(private router: Router) { }

    async selectPremade(character: Character) {
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
            notes: character.notes,
            abilityScores: character.abilityScores,
            skills: character.skills,
            armorClass: character.armorClass,
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            alignment: character.alignment || '',
            lifestyle: character.lifestyle || '',
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
}
