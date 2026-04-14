import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
    levelLabel,
    spellCatalog,
    SpellCatalogEntry,
} from '../../data/spells-catalog.data';

type LevelFilter = 'all' | number;
type SchoolFilter = 'all' | string;

@Component({
    selector: 'app-rules-spells-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './rules-spells-page.html',
    styleUrl: './rules-spells-page.scss',
})
export class RulesSpellsPage {
    readonly allSpells: SpellCatalogEntry[] = spellCatalog;

    readonly searchTerm = signal('');
    readonly levelFilter = signal<LevelFilter>('all');
    readonly schoolFilter = signal<SchoolFilter>('all');

    readonly filteredSpells = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const level = this.levelFilter();
        const school = this.schoolFilter();
        return this.allSpells.filter((s) => {
            const matchesSearch = !term || s.name.toLowerCase().includes(term);
            const matchesLevel = level === 'all' || s.level === level;
            const matchesSchool =
                school === 'all' ||
                s.school.toLowerCase() === (school as string).toLowerCase();
            return matchesSearch && matchesLevel && matchesSchool;
        });
    });

    readonly levelFilters: Array<{ id: LevelFilter; label: string }> = [
        { id: 'all', label: 'All Levels' },
        { id: 0, label: 'Cantrip' },
        { id: 1, label: '1st' },
        { id: 2, label: '2nd' },
        { id: 3, label: '3rd' },
        { id: 4, label: '4th' },
        { id: 5, label: '5th' },
        { id: 6, label: '6th' },
        { id: 7, label: '7th' },
        { id: 8, label: '8th' },
        { id: 9, label: '9th' },
    ];

    readonly schoolFilters: Array<{ id: SchoolFilter; label: string }> = [
        { id: 'all', label: 'All Schools' },
        { id: 'abjuration', label: 'Abjuration' },
        { id: 'conjuration', label: 'Conjuration' },
        { id: 'divination', label: 'Divination' },
        { id: 'enchantment', label: 'Enchantment' },
        { id: 'evocation', label: 'Evocation' },
        { id: 'illusion', label: 'Illusion' },
        { id: 'necromancy', label: 'Necromancy' },
        { id: 'transmutation', label: 'Transmutation' },
    ];

    setLevelFilter(id: LevelFilter): void {
        this.levelFilter.set(id);
    }

    setSchoolFilter(id: SchoolFilter): void {
        this.schoolFilter.set(id);
    }

    clearSearch(): void {
        this.searchTerm.set('');
    }

    levelLabel(level: number): string {
        return levelLabel(level);
    }

    schoolColor(school: string): string {
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
