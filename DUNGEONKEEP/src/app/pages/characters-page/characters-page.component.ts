import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PartyRosterComponent } from '../../components/party-roster/party-roster.component';
import type { Character } from '../../models/dungeon.models';
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
    private readonly lastVisibleOwnedCharacters = signal<Character[]>([]);
    readonly displayedOwnedCharacters = computed(() => {
        const owned = this.ownedCharacters();
        if (owned.length > 0) {
            return owned;
        }

        return this.store.isHydrating() ? this.lastVisibleOwnedCharacters() : owned;
    });
    readonly ownedCharacterCount = computed(() => this.displayedOwnedCharacters().length);
    readonly ownedInactiveCharacterCount = computed(
        () => this.displayedOwnedCharacters().filter((character) => character.status === 'Inactive').length
    );

    confirmDeleteId: string | null = null;

    constructor() {
        effect(() => {
            const owned = this.ownedCharacters();
            const hydrating = this.store.isHydrating();

            if (owned.length > 0 || !hydrating) {
                this.lastVisibleOwnedCharacters.set(owned);
            }
        });
    }

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
