import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { classCatalogEntries, ClassCatalogEntry } from '../../data/class-catalog.data';

@Component({
    selector: 'app-rules-classes-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './rules-classes-page.html',
    styleUrl: './rules-classes-page.scss',
})
export class RulesClassesPage {
    readonly classes: ClassCatalogEntry[] = classCatalogEntries;
}
