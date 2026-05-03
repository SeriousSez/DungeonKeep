import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly store = inject(DungeonStoreService);
    private readonly destroyRef = inject(DestroyRef);

    readonly crumbs = signal<Crumb[]>([]);

    constructor() {
        effect(() => {
            this.store.campaigns();
            this.store.characters();
            this.updateCrumbs();
        });

        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => this.updateCrumbs());
    }

    private updateCrumbs() {
        let route = this.activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        const data = route.snapshot.data;
        const params = this.collectRouteParams(route);
        const routePath = route.snapshot.routeConfig?.path ?? '';

        const campaign = params['id']
            ? this.store.campaigns().find(c => c.id === params['id'])
            : null;
        const character = params['id']
            ? this.store.characters().find(c => c.id === params['id'])
            : null;

        const parentCrumbs = ((data['parentCrumbs'] ?? []) as Crumb[]).map((crumb) => {
            const resolvedUrl = crumb.url ? this.resolveRouteTemplate(crumb.url, params) : undefined;
            return {
                label: this.resolveEntityCrumbLabel(crumb.label, resolvedUrl, campaign?.name ?? '', character?.name ?? ''),
                url: resolvedUrl
            };
        });

        if (campaign && routePath === 'campaigns/:id/maps/new') {
            this.crumbs.set([...parentCrumbs, { label: 'Create' }]);
            return;
        }

        if (campaign && params['mapId']) {
            const map = campaign.maps.find(entry => entry.id === params['mapId']);
            if (map) {
                const mapCrumb = {
                    label: map.name,
                    url: `/campaigns/${campaign.id}/maps/${map.id}`
                };

                if (routePath === 'campaigns/:id/maps/:mapId/edit') {
                    this.crumbs.set([...parentCrumbs, mapCrumb, { label: 'Edit' }]);
                    return;
                }

                if (routePath === 'campaigns/:id/maps/:mapId') {
                    this.crumbs.set([...parentCrumbs, { label: map.name }]);
                    return;
                }
            }
        }

        const finalLabel = this.resolveEntityCrumbLabel(
            String(data['breadcrumb'] || ''),
            undefined,
            campaign?.name ?? '',
            character?.name ?? ''
        );

        this.crumbs.set(finalLabel ? [...parentCrumbs, { label: finalLabel }] : parentCrumbs);
    }

    private resolveEntityCrumbLabel(label: string, url: string | undefined, campaignName: string, characterName: string): string {
        if (label === 'Campaign' && campaignName) {
            return campaignName;
        }

        if (label === 'Character' && characterName) {
            return characterName;
        }

        if (url?.startsWith('/campaigns/') && !url.includes('/maps') && /\/campaigns\/[^/]+$/.test(url) && campaignName) {
            return campaignName;
        }

        if ((url?.startsWith('/characters/') && /\/characters\/[^/]+$/.test(url) && characterName)
            || (url?.startsWith('/characters/') && /\/characters\/[^/]+$/.test(url) && characterName)) {
            return characterName;
        }

        return label;
    }

    private collectRouteParams(route: ActivatedRoute): Record<string, string> {
        return route.pathFromRoot.reduce<Record<string, string>>((allParams, currentRoute) => {
            for (const [key, value] of Object.entries(currentRoute.snapshot.params)) {
                allParams[key] = String(value);
            }

            return allParams;
        }, {});
    }

    private resolveRouteTemplate(url: string, params: Record<string, string>): string {
        return url.replace(/:([A-Za-z0-9_]+)/g, (_match, paramName: string) => params[paramName] ?? `:${paramName}`);
    }
}
