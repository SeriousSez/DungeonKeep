import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { monsterCatalog } from '../../data/monster-catalog.generated';
import { MonsterCatalogEntry } from '../../models/monster-reference.models';

type MonsterSortOption = 'name' | 'cr-low' | 'cr-high' | 'type';

interface SortPill {
    value: string;
    label: string;
}

interface SourceShortcut {
    label: string;
    description: string;
    url: string;
}

const creatureTypeOptions: DropdownOption[] = [
    { value: 'All', label: 'All Types' },
    { value: 'Aberration', label: 'Aberration' },
    { value: 'Beast', label: 'Beast' },
    { value: 'Celestial', label: 'Celestial' },
    { value: 'Construct', label: 'Construct' },
    { value: 'Dragon', label: 'Dragon' },
    { value: 'Elemental', label: 'Elemental' },
    { value: 'Fey', label: 'Fey' },
    { value: 'Fiend', label: 'Fiend' },
    { value: 'Giant', label: 'Giant' },
    { value: 'Humanoid', label: 'Humanoid' },
    { value: 'Monstrosity', label: 'Monstrosity' },
    { value: 'Ooze', label: 'Ooze' },
    { value: 'Plant', label: 'Plant' },
    { value: 'Undead', label: 'Undead' },
    { value: 'Other', label: 'Other' }
];

const sortOptions: DropdownOption[] = [
    { value: 'name', label: 'Name', description: 'Sort the compendium alphabetically.' },
    { value: 'cr-low', label: 'CR Low to High', description: 'Group easier threats before deadlier ones.' },
    { value: 'cr-high', label: 'CR High to Low', description: 'Bubble boss threats to the top.' },
    { value: 'type', label: 'Creature Type', description: 'Cluster monsters by base creature category.' }
];

const officialSourceShortcuts: SourceShortcut[] = [
    {
        label: 'Browse AideDD Monsters',
        description: 'Open the same stat block directory used by the imported monster links.',
        url: 'https://www.aidedd.org/dnd-filters/monsters.php'
    },
    {
        label: 'Browse D&D Beyond Index',
        description: 'Cross-check the official D&D Beyond monster listing by challenge rating.',
        url: 'https://www.dndbeyond.com/monsters?sort=cr'
    }
];

@Component({
    selector: 'app-monster-reference-page',
    standalone: true,
    imports: [CommonModule, DropdownComponent],
    templateUrl: './monster-reference-page.component.html',
    styleUrl: './monster-reference-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterReferencePageComponent {
    private readonly router = inject(Router);

    readonly officialSourceShortcuts = officialSourceShortcuts;
    readonly sortOptions = sortOptions;

    readonly entries = signal<MonsterCatalogEntry[]>(monsterCatalog.map((entry) => normalizeMonsterCatalogEntry(entry)));
    readonly searchTerm = signal('');
    readonly selectedType = signal('All');
    readonly selectedSource = signal('All sources');
    readonly selectedSort = signal<MonsterSortOption>('name');
    readonly selectedSortPill = signal('');

    readonly creatureTypeOptions = computed<DropdownOption[]>(() => {
        const labels = Array.from(new Set(this.entries().map((entry) => entry.creatureCategory).filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));

        return [
            { value: 'All', label: 'All Types' },
            ...labels.map((label) => ({ value: label, label }))
        ];
    });

    readonly sourceOptions = computed<DropdownOption[]>(() => {
        const labels = Array.from(new Set(this.entries().map((entry) => entry.sourceLabel.trim()).filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));

        return [
            { value: 'All sources', label: 'All Sources' },
            ...labels.map((label) => ({ value: label, label }))
        ];
    });

    readonly baseSortedEntries = computed(() => {
        const selectedType = this.selectedType();
        const selectedSource = this.selectedSource();
        const selectedSort = this.selectedSort();

        const filtered = this.entries()
            .filter((entry) => selectedType === 'All' || entry.creatureCategory === selectedType)
            .filter((entry) => selectedSource === 'All sources' || entry.sourceLabel === selectedSource);

        const sorted = [...filtered];
        switch (selectedSort) {
            case 'type':
                sorted.sort((left, right) => left.creatureCategory.localeCompare(right.creatureCategory) || left.name.localeCompare(right.name));
                break;
            case 'name':
                sorted.sort((left, right) => left.name.localeCompare(right.name));
                break;
            case 'cr-low':
                sorted.sort((left, right) => this.parseChallengeRating(left.challengeRating) - this.parseChallengeRating(right.challengeRating) || left.name.localeCompare(right.name));
                break;
            case 'cr-high':
                sorted.sort((left, right) => this.parseChallengeRating(right.challengeRating) - this.parseChallengeRating(left.challengeRating) || left.name.localeCompare(right.name));
                break;
            default:
                sorted.sort((left, right) => left.name.localeCompare(right.name));
                break;
        }

        return sorted;
    });

    readonly sortedEntries = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        if (!query) {
            return this.baseSortedEntries();
        }

        return this.baseSortedEntries().filter((entry) => {
            const haystack = [
                entry.name,
                entry.challengeRating,
                entry.creatureType,
                entry.creatureCategory,
                entry.size,
                entry.alignment,
                entry.sourceLabel,
                entry.legendary ? 'legendary' : '',
                entry.speed
            ].join(' ').toLowerCase();

            return haystack.includes(query);
        });
    });

    readonly sortPills = computed<SortPill[]>(() => {
        const seen = new Set<string>();
        const pills: SortPill[] = [];

        for (const entry of this.baseSortedEntries()) {
            const value = this.getSortPillValue(entry);
            if (!value || seen.has(value)) {
                continue;
            }

            seen.add(value);
            pills.push({
                value,
                label: this.getSortPillLabel(value)
            });
        }

        return pills;
    });

    readonly filteredEntries = computed(() => {
        const activePill = this.selectedSortPill();
        if (!activePill) {
            return this.sortedEntries();
        }

        return this.sortedEntries().filter((entry) => this.getSortPillValue(entry) === activePill);
    });

    readonly trackedCount = computed(() => this.entries().length);
    readonly linkedStatBlockCount = computed(() => this.entries().filter((entry) => entry.sourceUrl.length > 0).length);
    readonly uniqueTypeCount = computed(() => new Set(this.entries().map((entry) => entry.creatureCategory).filter(Boolean)).size);
    readonly legendaryCount = computed(() => this.entries().filter((entry) => entry.legendary).length);
    readonly selectedSortDescription = computed(() => {
        const selected = this.sortOptions.find((option) => String(option.value) === String(this.selectedSort()));
        return selected?.description?.trim() ?? '';
    });

    updateSearchTerm(value: string): void {
        this.searchTerm.set(value);
    }

    updateSelectedType(value: string | number): void {
        this.selectedType.set(String(value || 'All'));
    }

    updateSelectedSource(value: string | number): void {
        this.selectedSource.set(String(value || 'All sources'));
    }

    updateSelectedSort(value: string | number): void {
        const nextValue = String(value) as MonsterSortOption;
        this.selectedSort.set(nextValue === 'cr-low' || nextValue === 'cr-high' || nextValue === 'type' ? nextValue : 'name');
        this.selectedSortPill.set('');
    }

    toggleSortPill(value: string): void {
        this.selectedSortPill.update((current) => current === value ? '' : value);
    }

    openMonster(entry: MonsterCatalogEntry): void {
        void this.router.navigate(['/rules/monsters', entry.slug]);
    }

    private parseChallengeRating(value: string): number {
        const normalized = value.trim();
        if (!normalized) {
            return -1;
        }

        if (normalized.includes('/')) {
            const [numerator, denominator] = normalized.split('/').map((part) => Number(part));
            return denominator ? numerator / denominator : -1;
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : -1;
    }

    private getSortPillValue(entry: MonsterCatalogEntry): string {
        switch (this.selectedSort()) {
            case 'type':
                return entry.creatureCategory || 'Other';
            case 'cr-low':
            case 'cr-high':
                return entry.challengeRating || 'Unknown';
            case 'name':
            default:
                return getAlphabeticalPill(entry.name);
        }
    }

    private getSortPillLabel(value: string): string {
        if (this.selectedSort() === 'name') {
            return value;
        }

        return value;
    }
}

function getAlphabeticalPill(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
        return '#';
    }

    const character = trimmed.charAt(0).toUpperCase();
    return /[A-Z]/.test(character) ? character : '#';
}

function normalizeMonsterCatalogEntry(entry: MonsterCatalogEntry): MonsterCatalogEntry {
    return {
        ...entry,
        name: sanitizeMonsterName(entry.name, entry.slug),
        creatureType: normalizeCreatureType(entry.creatureType),
        creatureCategory: normalizeLabel(entry.creatureCategory) || deriveCreatureCategory(entry.creatureType),
        size: normalizeLabel(entry.size),
        alignment: entry.alignment.trim(),
        speed: entry.speed.trim(),
        sourceLabel: entry.sourceLabel.trim()
    };
}

function sanitizeMonsterName(value: string, slug: string): string {
    const trimmed = value.trim();
    if (!trimmed || /^\d+(?:\.\d+)?$/.test(trimmed)) {
        return formatMonsterName(slug);
    }

    return trimmed;
}

function formatMonsterName(value: string): string {
    const normalized = value.replace(/[-_]+/g, ' ').trim();
    if (!normalized) {
        return 'Unknown Monster';
    }

    return normalized
        .split(/\s+/)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function normalizeLabel(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeCreatureType(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return 'Unknown';
    }

    return trimmed
        .split(',')
        .map((segment) => normalizeLabel(segment))
        .join(', ');
}

function deriveCreatureCategory(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return 'Other';
    }

    const base = trimmed.split('(')[0].split(',')[0].trim();
    if (!base) {
        return 'Other';
    }

    return base.charAt(0).toUpperCase() + base.slice(1);
}
