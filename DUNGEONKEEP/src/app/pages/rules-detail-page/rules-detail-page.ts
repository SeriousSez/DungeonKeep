import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RulesLink, getRulesEntryBySlug } from '../../data/rules-links';

@Component({
  selector: 'app-rules-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rules-detail-page.html',
  styleUrl: './rules-detail-page.scss',
})
export class RulesDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly entry = signal<RulesLink | null>(null);
  readonly relatedEntries = computed(() => {
    const currentEntry = this.entry();

    if (!currentEntry) {
      return [];
    }

    return currentEntry.relatedSlugs
      .map((slug) => getRulesEntryBySlug(slug))
      .filter((entry): entry is RulesLink => entry !== null);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paramMap) => {
        const slug = paramMap.get('slug');
        this.entry.set(slug ? getRulesEntryBySlug(slug) : null);
        this.cdr.detectChanges();
      });
  }
}
