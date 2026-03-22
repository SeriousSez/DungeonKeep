import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Character } from '../../models/dungeon.models';

@Component({
    selector: 'app-party-roster',
    imports: [CommonModule, RouterLink],
    templateUrl: './party-roster.component.html',
    styleUrl: './party-roster.component.scss'
})
export class PartyRosterComponent {
    readonly selectedParty = input.required<Character[]>();

    readonly statusCycled = output<string>();
    readonly characterPromoted = output<string>();

    cycleStatus(characterId: string): void {
        this.statusCycled.emit(characterId);
    }

    promoteCharacter(characterId: string): void {
        this.characterPromoted.emit(characterId);
    }

    getPassivePerception(character: Character): number {
        const wisdomMod = Math.floor((character.abilityScores.wisdom - 10) / 2);
        const profBonus = character.skills.perception ? character.proficiencyBonus : 0;
        return 10 + wisdomMod + profBonus;
    }
}
