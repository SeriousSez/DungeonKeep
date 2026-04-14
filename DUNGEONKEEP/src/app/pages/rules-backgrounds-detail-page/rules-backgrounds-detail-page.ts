import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    BackgroundCatalogEntry,
    getBackgroundBySlug,
    getBackgroundChoices,
} from '../../data/background-catalog.data';

@Component({
    selector: 'app-rules-backgrounds-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-backgrounds-detail-page.html',
    styleUrl: './rules-backgrounds-detail-page.scss',
})
export class RulesBackgroundsDetailPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly background = signal<BackgroundCatalogEntry | null>(null);
    readonly choices = signal<ReturnType<typeof getBackgroundChoices>>([]);
    readonly expandedChoices = signal<Record<string, boolean>>({});

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const slug = params.get('backgroundName') ?? '';
                const bg = getBackgroundBySlug(slug);
                this.background.set(bg);
                this.choices.set(bg ? getBackgroundChoices(bg.name) : []);
                this.expandedChoices.set({});
                this.cdr.detectChanges();
            });
    }

    toggleChoice(key: string): void {
        this.expandedChoices.update((prev) => ({ ...prev, [key]: !prev[key] }));
    }
}
