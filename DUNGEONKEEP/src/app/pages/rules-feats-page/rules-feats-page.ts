import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
    featCatalogEntries,
    FeatCategory,
    FeatEntry,
} from '../../data/feats-catalog.data';

type CategoryFilter = 'all' | FeatCategory;

@Component({
    selector: 'app-rules-feats-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './rules-feats-page.html',
    styleUrl: './rules-feats-page.scss',
})
export class RulesFeatsPage {
    readonly allFeats: FeatEntry[] = featCatalogEntries;

    readonly searchTerm = signal('');
    readonly categoryFilter = signal<CategoryFilter>('all');

    readonly filteredFeats = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const category = this.categoryFilter();
        return this.allFeats.filter((f) => {
            const matchesSearch =
                !term ||
                f.name.toLowerCase().includes(term) ||
                f.benefit.toLowerCase().includes(term);
            const matchesCategory =
                category === 'all' || f.category === category;
            return matchesSearch && matchesCategory;
        });
    });

    readonly categoryFilters: Array<{ id: CategoryFilter; label: string }> = [
        { id: 'all', label: 'All Feats' },
        { id: 'origin', label: 'Origin' },
        { id: 'general', label: 'General' },
        { id: 'epic-boon', label: 'Epic Boon' },
    ];

    setCategoryFilter(id: CategoryFilter): void {
        this.categoryFilter.set(id);
    }

    clearSearch(): void {
        this.searchTerm.set('');
    }

    categoryLabel(cat: FeatCategory): string {
        switch (cat) {
            case 'origin':
                return 'Origin';
            case 'general':
                return 'General';
            case 'epic-boon':
                return 'Epic Boon';
        }
    }
}
