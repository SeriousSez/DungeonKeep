import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NpcManagerComponent } from '../../components/npc-manager/npc-manager.component';

@Component({
    selector: 'app-npc-library-page',
    standalone: true,
    imports: [CommonModule, RouterLink, NpcManagerComponent],
    templateUrl: './npc-library-page.component.html',
    styleUrl: './npc-library-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcLibraryPageComponent {
}