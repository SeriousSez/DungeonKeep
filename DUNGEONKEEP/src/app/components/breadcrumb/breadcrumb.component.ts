import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DungeonStoreService } from '../../state/dungeon-store.service';

export interface Crumb {
    label: string;
    url?: string;
}

@Component({
    selector: 'app-breadcrumb',
    imports: [CommonModule, RouterLink],
    templateUrl: './breadcrumb.component.html',
    styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private store = inject(DungeonStoreService);

    readonly crumbs = signal<Crumb[]>([]);

    constructor() {
        this.updateCrumbs();
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.updateCrumbs());
    }

    private updateCrumbs() {
        let route = this.activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        const data = route.snapshot.data;
        const params = route.snapshot.params;
        const parentCrumbs: Crumb[] = data['parentCrumbs'] ?? [];

        let finalLabel: string = data['breadcrumb'] || '';
        if (params['id']) {
            const character = this.store.characters().find(c => c.id === params['id']);
            if (character) {
                finalLabel = character.name;
            }
        }

        this.crumbs.set(finalLabel ? [...parentCrumbs, { label: finalLabel }] : parentCrumbs);
    }
}
