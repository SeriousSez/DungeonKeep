import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getSpeciesImagePath, speciesCatalogEntries, SpeciesCatalogEntry } from '../../data/species-catalog.data';

const sourceCategoryOrder: Record<string, number> = { phb: 0, elemental: 1, expanded: 2 };

@Component({
    selector: 'app-rules-species-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-species-page.html',
    styleUrl: './rules-species-page.scss',
})
export class RulesSpeciesPage {
    readonly species: SpeciesCatalogEntry[] = [...speciesCatalogEntries].sort((a, b) => {
        const catDiff = (sourceCategoryOrder[a.sourceCategory] ?? 99) - (sourceCategoryOrder[b.sourceCategory] ?? 99);
        return catDiff !== 0 ? catDiff : a.name.localeCompare(b.name);
    });

    readonly speciesImagePath = getSpeciesImagePath;
}
