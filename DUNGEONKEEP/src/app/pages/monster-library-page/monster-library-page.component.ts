import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { CustomMonster } from '../../models/monster-reference.models';
import { duplicateCustomMonster, filterMonsterLibrary, sanitizeCustomMonster } from '../../data/monster-library.helpers';
import { loadMonsterLibrary, saveMonsterLibrary } from '../../data/monster-library.storage';
import { DungeonStoreService } from '../../state/dungeon-store.service';

const CREATURE_TYPE_OPTIONS: DropdownOption[] = [
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

@Component({
    selector: 'app-monster-library-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent, ConfirmModalComponent],
    templateUrl: './monster-library-page.component.html',
    styleUrl: './monster-library-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterLibraryPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly monsters = signal<CustomMonster[]>([]);
    readonly searchTerm = signal('');
    readonly selectedType = signal('All');
    readonly deleteCandidate = signal<CustomMonster | null>(null);

    readonly typeOptions = CREATURE_TYPE_OPTIONS;

    readonly filteredMonsters = computed(() =>
        filterMonsterLibrary(this.monsters(), this.searchTerm(), this.selectedType())
    );

    readonly totalCount = computed(() => this.monsters().length);
    readonly legendaryCount = computed(() => this.monsters().filter((m) => m.legendary).length);
    readonly uniqueTypeCount = computed(() => new Set(this.monsters().map((m) => m.creatureCategory).filter(Boolean)).size);

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        const stored = (loadMonsterLibrary() ?? []).map((m) => sanitizeCustomMonster(m));
        this.monsters.set(stored);
    }

    updateSearchTerm(value: string): void {
        this.searchTerm.set(value);
    }

    updateSelectedType(value: string | number): void {
        this.selectedType.set(String(value || 'All'));
    }

    editMonster(monster: CustomMonster): void {
        void this.router.navigate(['/monsters', monster.id, 'edit']);
    }

    navigateToMonster(monster: CustomMonster): void {
        void this.router.navigate(['/monsters', monster.id]);
    }

    duplicateMonster(monster: CustomMonster): void {
        const namesInUse = this.monsters().map((m) => m.name);
        const copy = duplicateCustomMonster(monster, namesInUse);
        const next = [copy, ...this.monsters()];
        this.monsters.set(next);
        saveMonsterLibrary(next);
        this.cdr.detectChanges();
    }

    requestDelete(monster: CustomMonster): void {
        this.deleteCandidate.set(monster);
        this.cdr.detectChanges();
    }

    confirmDelete(): void {
        const candidate = this.deleteCandidate();
        if (!candidate) {
            return;
        }

        const next = this.monsters().filter((m) => m.id !== candidate.id);
        this.monsters.set(next);
        saveMonsterLibrary(next);
        this.deleteCandidate.set(null);
        this.cdr.detectChanges();
    }

    cancelDelete(): void {
        this.deleteCandidate.set(null);
        this.cdr.detectChanges();
    }

    crLabel(cr: string): string {
        return cr ? `CR ${cr}` : 'CR —';
    }

    modifierText(value: number | null): string {
        if (value == null) {
            return '';
        }

        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }
}
