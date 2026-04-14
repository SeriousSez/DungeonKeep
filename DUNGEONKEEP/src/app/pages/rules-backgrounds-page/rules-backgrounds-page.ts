import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
    backgroundCatalogEntries,
    BackgroundCatalogEntry,
    BackgroundSourceCategory,
} from '../../data/background-catalog.data';

type SourceFilter = 'all' | BackgroundSourceCategory;

@Component({
    selector: 'app-rules-backgrounds-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './rules-backgrounds-page.html',
    styleUrl: './rules-backgrounds-page.scss',
})
export class RulesBackgroundsPage {
    readonly allBackgrounds: BackgroundCatalogEntry[] = backgroundCatalogEntries;

    readonly searchTerm = signal('');
    readonly sourceFilter = signal<SourceFilter>('all');

    readonly filteredBackgrounds = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const source = this.sourceFilter();
        return this.allBackgrounds.filter((b) => {
            const matchesSearch = !term || b.name.toLowerCase().includes(term);
            const matchesSource = source === 'all' || b.sourceCategory === source;
            return matchesSearch && matchesSource;
        });
    });

    readonly sourceFilters: Array<{ id: SourceFilter; label: string }> = [
        { id: 'all', label: 'All Sources' },
        { id: 'phb', label: "Player's Handbook" },
        { id: 'scag', label: 'Sword Coast' },
        { id: 'supplement', label: 'Supplements' },
        { id: 'setting', label: 'Settings' },
        { id: 'al', label: 'Adventurers League' },
    ];

    setSourceFilter(id: SourceFilter): void {
        this.sourceFilter.set(id);
    }

    clearSearch(): void {
        this.searchTerm.set('');
    }
}
