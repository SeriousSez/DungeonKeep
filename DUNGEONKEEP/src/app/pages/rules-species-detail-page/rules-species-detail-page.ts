import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getSpeciesImagePath, SpeciesCatalogEntry, getSpeciesBySlug } from '../../data/species-catalog.data';

@Component({
    selector: 'app-rules-species-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-species-detail-page.html',
    styleUrl: './rules-species-detail-page.scss',
})
export class RulesSpeciesDetailPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly species = signal<SpeciesCatalogEntry | null>(null);
    readonly expandedTraits = signal<Record<string, boolean>>({});
    readonly expandedFeatures = signal<Record<string, boolean>>({});

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const slug = params.get('speciesName') ?? '';
                this.species.set(getSpeciesBySlug(slug));
                this.expandedTraits.set({});
                this.expandedFeatures.set({});
                this.cdr.detectChanges();
            });
    }

    toggleTrait(name: string): void {
        this.expandedTraits.update((prev) => ({ ...prev, [name]: !prev[name] }));
    }

    toggleFeature(title: string): void {
        this.expandedFeatures.update((prev) => ({ ...prev, [title]: !prev[title] }));
    }

    readonly speciesImagePath = getSpeciesImagePath;

    onSpeciesImageError(event: Event, slug: string): void {
        const target = event.target;
        if (!(target instanceof HTMLImageElement)) {
            return;
        }

        const pngPath = this.speciesImagePath(slug, 'png');
        if (!pngPath || target.src.endsWith('.png')) {
            return;
        }

        target.src = pngPath;
    }
}
