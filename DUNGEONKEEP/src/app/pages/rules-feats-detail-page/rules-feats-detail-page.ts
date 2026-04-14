import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FeatEntry, getFeatBySlug } from '../../data/feats-catalog.data';

@Component({
    selector: 'app-rules-feats-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-feats-detail-page.html',
    styleUrl: './rules-feats-detail-page.scss',
})
export class RulesFeatsDetailPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly feat = signal<FeatEntry | null>(null);

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const slug = params.get('featSlug') ?? '';
                this.feat.set(getFeatBySlug(slug) ?? null);
                this.cdr.detectChanges();
            });
    }

    categoryLabel(cat: string): string {
        switch (cat) {
            case 'origin':
                return 'Origin Feat';
            case 'general':
                return 'General Feat';
            case 'epic-boon':
                return 'Epic Boon';
            default:
                return 'Feat';
        }
    }

    categoryIcon(cat: string): string {
        switch (cat) {
            case 'origin':
                return 'fa-seedling';
            case 'general':
                return 'fa-star';
            case 'epic-boon':
                return 'fa-crown';
            default:
                return 'fa-star';
        }
    }
}
