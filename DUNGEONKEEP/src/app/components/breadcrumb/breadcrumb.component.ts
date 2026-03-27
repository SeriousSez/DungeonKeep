import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-breadcrumb',
    imports: [CommonModule, RouterLink],
    templateUrl: './breadcrumb.component.html',
    styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);

    breadcrumbLabel = signal('Dashboard');

    constructor() {
        this.updateLabel();
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.updateLabel());
    }

    private updateLabel() {
        let route = this.activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }
        this.breadcrumbLabel.set(route.snapshot.data['breadcrumb'] || 'Dashboard');
    }
}
