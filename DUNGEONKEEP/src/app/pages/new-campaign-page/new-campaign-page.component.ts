import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CreationStudioComponent } from '../../components/creation-studio/creation-studio.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-new-campaign-page',
    imports: [CommonModule, RouterLink, CreationStudioComponent],
    templateUrl: './new-campaign-page.component.html',
    styleUrl: './new-campaign-page.component.scss'
})
export class NewCampaignPageComponent {
    readonly store = inject(DungeonStoreService);
}
