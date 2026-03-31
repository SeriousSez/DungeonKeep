
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Character } from '../../models/dungeon.models';

@Component({
    selector: 'app-party-roster',
    imports: [CommonModule, RouterLink],
    templateUrl: './party-roster.component.html',
    styleUrl: './party-roster.component.scss'
})

export class PartyRosterComponent {
    @Input() selectedParty: Character[] = [];
    @Input() eyebrow: string = 'Party roster';
    @Input() title: string = 'Characters in play';
    @Input() countLabel: string = 'assigned';
    @Input() emptyTitle: string = 'No party members assigned';
    @Input() emptyMessage: string = 'Add a character below to give this campaign a roster.';

    @Output() statusCycled = new EventEmitter<string>();
    @Output() characterPromoted = new EventEmitter<string>();
    @Output() requestDelete = new EventEmitter<string>();

    deleteCharacterClicked(characterId: string, event: Event): void {
        event.stopPropagation();
        this.requestDelete.emit(characterId);
    }


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
