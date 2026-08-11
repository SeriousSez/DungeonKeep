import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { sanitizeCustomClassOption } from '../../data/custom-character-options.helpers';
import { CustomClassOption } from '../../models/custom-character-options.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-class-library-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './class-library-page.component.html',
  styleUrl: './class-library-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassLibraryPageComponent {
  readonly store = inject(DungeonStoreService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly searchTerm = signal('');
  readonly deleteCandidate = signal<CustomClassOption | null>(null);

  readonly classes = computed(() => (this.store.userClassLibrary() ?? []).map((item) => sanitizeCustomClassOption(item)));
  readonly filteredClasses = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.classes();
    }

    return this.classes().filter((entry) =>
      entry.name.toLowerCase().includes(query)
      || entry.summary.toLowerCase().includes(query)
      || entry.primaryAbility.toLowerCase().includes(query)
    );
  });

  readonly primaryAbilityCount = computed(() => new Set(this.classes().map((entry) => entry.primaryAbility).filter(Boolean)).size);

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  editClass(entry: CustomClassOption): void {
    void this.router.navigate(['/classes', entry.id, 'edit']);
  }

  requestDelete(entry: CustomClassOption): void {
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

    const next = this.classes().filter((entry) => entry.id !== candidate.id);
    await this.store.saveUserClassLibrary(next);
    this.deleteCandidate.set(null);
    this.cdr.detectChanges();
  }
}
