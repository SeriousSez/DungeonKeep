import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PartyRosterComponent } from '../../components/party-roster/party-roster.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

@Component({
    selector: 'app-characters-page',
    imports: [CommonModule, RouterLink, PartyRosterComponent, ConfirmModalComponent],
    templateUrl: './characters-page.component.html',
    styleUrl: './characters-page.component.scss'
})
export class CharactersPageComponent {
    readonly store = inject(DungeonStoreService);
    readonly ownedCharacters = computed(() => this.store.characters().filter((character) => character.canEdit !== false));

    confirmDeleteId: string | null = null;

    handleRequestDelete(characterId: string): void {
        this.confirmDeleteId = characterId;
    }

    async handleDeleteConfirmed(): Promise<void> {
        if (this.confirmDeleteId) {
            await this.store.deleteCharacter(this.confirmDeleteId);
            this.confirmDeleteId = null;
        }
    }

    handleDeleteCancelled(): void {
        this.confirmDeleteId = null;
    }
}
