import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PartyRosterComponent } from '../../components/party-roster/party-roster.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-characters-page',
    imports: [CommonModule, RouterLink, PartyRosterComponent],
    templateUrl: './characters-page.component.html',
    styleUrl: './characters-page.component.scss'
})
export class CharactersPageComponent {
    readonly store = inject(DungeonStoreService);
}
