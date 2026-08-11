import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { sanitizeCustomSpeciesOption } from '../../data/custom-character-options.helpers';
import { CustomSpeciesOption } from '../../models/custom-character-options.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-species-library-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './species-library-page.component.html',
  styleUrl: './species-library-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpeciesLibraryPageComponent {
  readonly store = inject(DungeonStoreService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly searchTerm = signal('');
  readonly deleteCandidate = signal<CustomSpeciesOption | null>(null);

  readonly species = computed(() => (this.store.userSpeciesLibrary() ?? []).map((item) => sanitizeCustomSpeciesOption(item)));
  readonly filteredSpecies = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.species();
    }

    return this.species().filter((entry) =>
      entry.name.toLowerCase().includes(query)
      || entry.summary.toLowerCase().includes(query)
      || entry.creatureType.toLowerCase().includes(query)
    );
  });

  readonly languageCount = computed(() => new Set(this.species().flatMap((entry) => entry.languages)).size);

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  editSpecies(entry: CustomSpeciesOption): void {
    void this.router.navigate(['/species', entry.id, 'edit']);
  }

  requestDelete(entry: CustomSpeciesOption): void {
    this.deleteCandidate.set(entry);
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.deleteCandidate.set(null);
    this.cdr.detectChanges();
  }

  async confirmDelete(): Promise<void> {
    const candidate = this.deleteCandidate();
    if (!candidate) {
      return;
    }

    const next = this.species().filter((entry) => entry.id !== candidate.id);
    await this.store.saveUserSpeciesLibrary(next);
    this.deleteCandidate.set(null);
    this.cdr.detectChanges();
  }
}
