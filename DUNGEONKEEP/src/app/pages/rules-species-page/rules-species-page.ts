import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { getSpeciesImagePath, speciesCatalogEntries, type SpeciesCatalogEntry, type SpeciesSourceCategory } from '../../data/species-catalog.data';

const sourceCategoryOrder: Record<string, number> = { phb: 0, expanded: 1, elemental: 2, legacy: 3 };
type SpeciesSourceGroup = 'phb2024' | 'multiverse' | 'spelljammer' | 'ravenloft' | 'setting' | 'elemental' | 'legacy';
const sourceGroupOrder: Record<SpeciesSourceGroup, number> = {
    phb2024: 0,
    multiverse: 1,
    spelljammer: 2,
    ravenloft: 3,
    setting: 4,
    elemental: 5,
    legacy: 6
};
const sourceGroupMeta: Record<SpeciesSourceGroup, { title: string; description: string }> = {
    phb2024: { title: 'Player’s Handbook 2024', description: 'Core species options for most new campaigns' },
    multiverse: { title: 'Monsters of the Multiverse', description: 'Modern expansion species consolidated into a broad official roster' },
    spelljammer: { title: 'Spelljammer and astral species', description: 'Astral and spacefaring options built for cosmic fantasy' },
    ravenloft: { title: 'Ravenloft and horror lineages', description: 'Dark, cursed, and supernatural species with gothic flavor' },
    setting: { title: 'Eberron and setting-specific books', description: 'Campaign-world species from Eberron, Ravnica, Theros, Strixhaven, Dragonlance, and similar books' },
    elemental: { title: 'Elemental Evil', description: 'Element-touched ancestries and strongly planar options' },
    legacy: { title: 'Supplemental and special releases', description: 'Official one-off supplements and niche releases still available in the library' }
};
type SpeciesSourceFilter = 'all' | SpeciesSourceGroup;
type SpeciesSizeFilter = 'all' | 'small' | 'medium' | 'flexible';
type SpeciesFeatureFilter = 'all' | 'darkvision' | 'flight' | 'climb' | 'swim' | 'grounded';

function getSpeciesSourceGroup(species: SpeciesCatalogEntry): SpeciesSourceGroup {
    const source = species.source.toLowerCase();

    if (source.includes("player's handbook 2024")) {
        return 'phb2024';
    }

    if (source.includes('monsters of the multiverse')) {
        return 'multiverse';
    }

    if (source.includes('spelljammer')) {
        return 'spelljammer';
    }

    if (source.includes('van richten')) {
        return 'ravenloft';
    }

    if (source.includes('elemental') || species.sourceCategory === 'elemental') {
        return 'elemental';
    }

    if (
        source.includes('eberron')
        || source.includes('ravnica')
        || source.includes('theros')
        || source.includes('strixhaven')
        || source.includes('dragonlance')
        || source.includes('witchlight')
    ) {
        return 'setting';
    }

    return 'legacy';
}

@Component({
    selector: 'app-rules-species-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent],
    templateUrl: './rules-species-page.html',
    styleUrl: './rules-species-page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesSpeciesPage {
    readonly species: SpeciesCatalogEntry[] = [...speciesCatalogEntries].sort((a, b) => {
        const catDiff = (sourceCategoryOrder[a.sourceCategory] ?? 99) - (sourceCategoryOrder[b.sourceCategory] ?? 99);
        return catDiff !== 0 ? catDiff : a.name.localeCompare(b.name);
    });

    readonly speciesImagePath = getSpeciesImagePath;
    readonly searchTerm = signal('');
    readonly selectedSourceFilter = signal<SpeciesSourceFilter>('all');
    readonly selectedSizeFilter = signal<SpeciesSizeFilter>('all');
    readonly selectedFeatureFilter = signal<SpeciesFeatureFilter>('all');

    readonly sourceFilterOptions: DropdownOption[] = [
        { value: 'all', label: 'All sources', description: 'Show every species source in the library' },
        { value: 'phb2024', label: 'Player’s Handbook 2024', description: 'Core 2024 player options' },
        { value: 'multiverse', label: 'Monsters of the Multiverse', description: 'Modern expansion species roster' },
        { value: 'spelljammer', label: 'Spelljammer', description: 'Astral and spacefaring species' },
        { value: 'ravenloft', label: 'Ravenloft', description: 'Horror-flavored lineages and cursed options' },
        { value: 'setting', label: 'Eberron / setting-specific', description: 'Campaign-world species from non-core books' },
        { value: 'elemental', label: 'Elemental Evil', description: 'Element-touched and planar options' },
        { value: 'legacy', label: 'Supplemental / special releases', description: 'Official one-off supplements and niche source entries' }
    ];

    readonly sizeFilterOptions: DropdownOption[] = [
        { value: 'all', label: 'Any size', description: 'Small, Medium, and flexible options' },
        { value: 'small', label: 'Small', description: 'Show species that can be Small' },
        { value: 'medium', label: 'Medium', description: 'Show species that can be Medium' },
        { value: 'flexible', label: 'Small or Medium', description: 'Species with a size choice at creation' }
    ];

    readonly featureFilterOptions: DropdownOption[] = [
        { value: 'all', label: 'Any feature', description: 'No special trait filter applied' },
        { value: 'darkvision', label: 'Has darkvision', description: 'Species with darkvision or better' },
        { value: 'flight', label: 'Flight', description: 'Species with a listed fly speed' },
        { value: 'climb', label: 'Climb speed', description: 'Species with a listed climb speed' },
        { value: 'swim', label: 'Swim speed', description: 'Species with a listed swim speed' },
        { value: 'grounded', label: 'Ground only', description: 'No special movement speeds listed' }
    ];

    readonly hasActiveFilters = computed(() => Boolean(this.searchTerm().trim())
        || this.selectedSourceFilter() !== 'all'
        || this.selectedSizeFilter() !== 'all'
        || this.selectedFeatureFilter() !== 'all');

    readonly filteredSpecies = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        const sourceFilter = this.selectedSourceFilter();
        const sizeFilter = this.selectedSizeFilter();
        const featureFilter = this.selectedFeatureFilter();

        return this.species.filter((species) => {
            if (sourceFilter !== 'all' && getSpeciesSourceGroup(species) !== sourceFilter) {
                return false;
            }

            const normalizedSize = species.size.toLowerCase();
            if (sizeFilter === 'small' && !normalizedSize.includes('small')) {
                return false;
            }

            if (sizeFilter === 'medium' && !normalizedSize.includes('medium')) {
                return false;
            }

            if (sizeFilter === 'flexible' && !(normalizedSize.includes('small') && normalizedSize.includes('medium'))) {
                return false;
            }

            if (featureFilter === 'darkvision' && species.darkvision <= 0) {
                return false;
            }

            if (featureFilter === 'flight' && (species.flightSpeed ?? 0) <= 0) {
                return false;
            }

            if (featureFilter === 'climb' && (species.climbSpeed ?? 0) <= 0) {
                return false;
            }

            if (featureFilter === 'swim' && (species.swimSpeed ?? 0) <= 0) {
                return false;
            }

            if (featureFilter === 'grounded' && ((species.flightSpeed ?? 0) > 0 || (species.climbSpeed ?? 0) > 0 || (species.swimSpeed ?? 0) > 0)) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [
                species.name,
                species.tagline,
                species.summary,
                species.source,
                species.size,
                ...species.languages,
                ...species.traits.map((trait) => `${trait.name} ${trait.description}`),
                ...species.keyFeatures.map((feature) => `${feature.title} ${feature.summary} ${feature.details}`)
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    });

    readonly groupedSpecies = computed(() => {
        const grouped = new Map<SpeciesSourceGroup, SpeciesCatalogEntry[]>();

        for (const species of this.filteredSpecies()) {
            const groupKey = getSpeciesSourceGroup(species);
            const existing = grouped.get(groupKey) ?? [];
            existing.push(species);
            grouped.set(groupKey, existing);
        }

        return Array.from(grouped.entries())
            .sort(([left], [right]) => (sourceGroupOrder[left] ?? 99) - (sourceGroupOrder[right] ?? 99))
            .map(([key, items]) => ({
                key,
                title: sourceGroupMeta[key].title,
                description: sourceGroupMeta[key].description,
                items
            }));
    });

    readonly resultsSummary = computed(() => {
        const total = this.species.length;
        const filtered = this.filteredSpecies().length;
        return filtered === total
            ? `Showing all ${total} species.`
            : `Showing ${filtered} of ${total} species.`;
    });

    onSearchChanged(value: string): void {
        this.searchTerm.set(value);
    }

    onSourceFilterChanged(value: string | number): void {
        this.selectedSourceFilter.set(String(value) as SpeciesSourceFilter);
    }

    onSizeFilterChanged(value: string | number): void {
        this.selectedSizeFilter.set(String(value) as SpeciesSizeFilter);
    }

    onFeatureFilterChanged(value: string | number): void {
        this.selectedFeatureFilter.set(String(value) as SpeciesFeatureFilter);
    }

    clearFilters(): void {
        this.searchTerm.set('');
        this.selectedSourceFilter.set('all');
        this.selectedSizeFilter.set('all');
        this.selectedFeatureFilter.set('all');
    }
}
