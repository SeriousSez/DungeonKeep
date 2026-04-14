import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClassCatalogEntry, getClassBySlug } from '../../data/class-catalog.data'; import { proficiencyBonusByLevel } from '../../data/class-progression.data';

export interface ProgressionRow {
    level: number;
    profBonus: string;
    features: string;
    colValues: string[];
}
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

    readonly progressionRows = computed<ProgressionRow[]>(() => {
        const entry = this.cls();
        if (!entry) return [];
        return entry.levelFeatureNames.map((featureNames, i) => ({
            level: i + 1,
            profBonus: proficiencyBonusByLevel[i],
            features: featureNames.length ? featureNames.join(', ') : '—',
            colValues: entry.progressionColumns.map(col => col.values[i]),
        }));
    });

    readonly progressionGroupHeader = computed(() => {
        const entry = this.cls();
        if (!entry || !entry.progressionColumns.some(c => c.group)) return null;
        const groups: { label: string; count: number }[] = [];
        for (const col of entry.progressionColumns) {
            if (!col.group) continue;
            const last = groups.at(-1);
            if (last && last.label === col.group) last.count++;
            else groups.push({ label: col.group, count: 1 });
        }
        return groups;
    });

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
