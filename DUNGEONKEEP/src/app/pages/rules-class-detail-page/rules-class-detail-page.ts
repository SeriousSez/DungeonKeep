import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClassCatalogEntry, getClassBySlug } from '../../data/class-catalog.data';

@Component({
    selector: 'app-rules-class-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-class-detail-page.html',
    styleUrl: './rules-class-detail-page.scss',
})
export class RulesClassDetailPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly cls = signal<ClassCatalogEntry | null>(null);
    readonly expandedMilestones = signal<Record<string, boolean>>({});
    readonly expandedNotes = signal<Record<string, boolean>>({});

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const slug = params.get('className') ?? '';
                this.cls.set(getClassBySlug(slug));
                this.expandedMilestones.set({});
                this.expandedNotes.set({});
                this.cdr.detectChanges();
            });
    }

    toggleMilestone(title: string): void {
        this.expandedMilestones.update((prev) => ({ ...prev, [title]: !prev[title] }));
    }

    toggleNote(title: string): void {
        this.expandedNotes.update((prev) => ({ ...prev, [title]: !prev[title] }));
    }
}
