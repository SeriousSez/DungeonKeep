import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getSpellBySlug, levelLabel, SpellCatalogEntry } from '../../data/spells-catalog.data';

@Component({
    selector: 'app-rules-spell-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-spell-detail-page.html',
    styleUrl: './rules-spell-detail-page.scss',
})
export class RulesSpellDetailPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly spell = signal<SpellCatalogEntry | null>(null);

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const slug = params.get('spellSlug') ?? '';
                this.spell.set(getSpellBySlug(slug) ?? null);
                this.cdr.detectChanges();
            });
    }

    levelLabel(level: number): string {
        return levelLabel(level);
    }

    schoolIcon(school: string): string {
        const map: Record<string, string> = {
            abjuration: 'fa-shield-halved',
            conjuration: 'fa-sparkles',
            divination: 'fa-eye',
            enchantment: 'fa-heart',
            evocation: 'fa-bolt',
            illusion: 'fa-wand-magic',
            necromancy: 'fa-skull',
            transmutation: 'fa-flask',
        };
        return map[school.toLowerCase()] ?? 'fa-star';
    }

    schoolColorClass(school: string): string {
        const map: Record<string, string> = {
            abjuration: 'school-abj',
            conjuration: 'school-con',
            divination: 'school-div',
            enchantment: 'school-enc',
            evocation: 'school-evo',
            illusion: 'school-ill',
            necromancy: 'school-nec',
            transmutation: 'school-tra',
        };
        return map[school.toLowerCase()] ?? 'school-other';
    }
}
