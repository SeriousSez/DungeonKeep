import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-dashboard-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard-page.component.html',
    styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
    readonly store = inject(DungeonStoreService);
}
