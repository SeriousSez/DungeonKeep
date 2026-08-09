import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { createBlankCustomSpeciesOption, sanitizeCustomSpeciesOption } from '../../data/custom-character-options.helpers';
import { CustomSpeciesOption } from '../../models/custom-character-options.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-species-editor-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './species-editor-page.component.html',
  styleUrl: './species-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpeciesEditorPageComponent {
  private readonly store = inject(DungeonStoreService);
  private readonly api = inject(DungeonApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly speciesId = signal('');
  readonly draft = signal<CustomSpeciesOption>(createBlankCustomSpeciesOption());
  readonly saveBusy = signal(false);
  readonly draftBusy = signal(false);
  readonly errorMessage = signal('');

  readonly isEditing = computed(() => !!this.speciesId());

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const speciesId = params.get('speciesId') ?? '';
        this.speciesId.set(speciesId);

        const existing = (this.store.userSpeciesLibrary() ?? [])
          .map((item) => sanitizeCustomSpeciesOption(item))
          .find((item) => item.id === speciesId);

        this.draft.set(existing ?? createBlankCustomSpeciesOption());
        this.errorMessage.set('');
        this.cdr.detectChanges();
      });
  }

  updateField(field: keyof CustomSpeciesOption, value: string): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
  }

  updateLanguages(value: string): void {
    const next = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    this.draft.update((current) => ({ ...current, languages: next }));
  }

  updateTraits(value: string): void {
    const traits = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...desc] = line.split(':');
        return { name: name?.trim() ?? '', description: desc.join(':').trim() };
      })
      .filter((trait) => trait.name || trait.description);

    this.draft.update((current) => ({ ...current, traits }));
  }

  traitsText(): string {
    return this.draft().traits.map((trait) => `${trait.name}: ${trait.description}`.trim()).join('\n');
  }

  async generateDraft(): Promise<void> {
    if (this.draftBusy()) {
      return;
    }

    this.draftBusy.set(true);
    this.errorMessage.set('');

    try {
      const existingNames = (this.store.userSpeciesLibrary() ?? [])
        .map((item) => sanitizeCustomSpeciesOption(item).name)
        .filter(Boolean);

      const generated = await this.api.generateSpeciesDraft({
        nameHint: this.draft().name,
        originHint: this.draft().summary,
        cultureHint: this.draft().creatureType,
        traitHint: this.traitsText(),
        notesHint: this.draft().notes,
        existingSpeciesNames: existingNames
      });

      this.draft.update((current) => sanitizeCustomSpeciesOption({ ...current, ...generated }));
    } catch {
      this.errorMessage.set('Could not generate a species draft right now.');
    } finally {
      this.draftBusy.set(false);
      this.cdr.detectChanges();
    }
  }

  async save(): Promise<void> {
    if (this.saveBusy()) {
      return;
    }

    const normalized = sanitizeCustomSpeciesOption(this.draft());
    if (!normalized.name) {
      this.errorMessage.set('Species name is required.');
      return;
    }

    this.saveBusy.set(true);
    this.errorMessage.set('');

    try {
      const library = (this.store.userSpeciesLibrary() ?? []).map((item) => sanitizeCustomSpeciesOption(item));
      const existingIndex = library.findIndex((item) => item.id === normalized.id);
      const next = existingIndex >= 0
        ? library.map((item, index) => index === existingIndex ? normalized : item)
        : [normalized, ...library];

      const saved = await this.store.saveUserSpeciesLibrary(next);
      if (!saved) {
        this.errorMessage.set('Could not save species right now.');
        return;
      }

      await this.router.navigate(['/species']);
    } finally {
      this.saveBusy.set(false);
      this.cdr.detectChanges();
    }
  }
}
