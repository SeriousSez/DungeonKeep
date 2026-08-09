import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { createBlankCustomClassOption, sanitizeCustomClassOption } from '../../data/custom-character-options.helpers';
import { CustomClassOption } from '../../models/custom-character-options.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-class-editor-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './class-editor-page.component.html',
  styleUrl: './class-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassEditorPageComponent {
  private readonly store = inject(DungeonStoreService);
  private readonly api = inject(DungeonApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly classId = signal('');
  readonly draft = signal<CustomClassOption>(createBlankCustomClassOption());
  readonly saveBusy = signal(false);
  readonly draftBusy = signal(false);
  readonly errorMessage = signal('');

  readonly isEditing = computed(() => !!this.classId());

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const classId = params.get('classId') ?? '';
        this.classId.set(classId);

        const existing = (this.store.userClassLibrary() ?? [])
          .map((item) => sanitizeCustomClassOption(item))
          .find((item) => item.id === classId);

        this.draft.set(existing ?? createBlankCustomClassOption());
        this.errorMessage.set('');
        this.cdr.detectChanges();
      });
  }

  updateField(field: keyof CustomClassOption, value: string): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
  }

  updateKeyFeatures(value: string): void {
    const next = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    this.draft.update((current) => ({ ...current, keyFeatures: next }));
  }

  updateStartingEquipment(value: string): void {
    const next = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    this.draft.update((current) => ({ ...current, startingEquipment: next }));
  }

  async generateDraft(): Promise<void> {
    if (this.draftBusy()) {
      return;
    }

    this.draftBusy.set(true);
    this.errorMessage.set('');

    try {
      const existingNames = (this.store.userClassLibrary() ?? [])
        .map((item) => sanitizeCustomClassOption(item).name)
        .filter(Boolean);

      const generated = await this.api.generateClassDraft({
        nameHint: this.draft().name,
        themeHint: this.draft().summary,
        roleHint: this.draft().primaryAbility,
        mechanicHint: this.draft().keyFeatures.join(', '),
        notesHint: this.draft().notes,
        existingClassNames: existingNames
      });

      this.draft.update((current) => sanitizeCustomClassOption({ ...current, ...generated }));
    } catch {
      this.errorMessage.set('Could not generate a class draft right now.');
    } finally {
      this.draftBusy.set(false);
      this.cdr.detectChanges();
    }
  }

  async save(): Promise<void> {
    if (this.saveBusy()) {
      return;
    }

    const normalized = sanitizeCustomClassOption(this.draft());
    if (!normalized.name) {
      this.errorMessage.set('Class name is required.');
      return;
    }

    this.saveBusy.set(true);
    this.errorMessage.set('');

    try {
      const library = (this.store.userClassLibrary() ?? []).map((item) => sanitizeCustomClassOption(item));
      const existingIndex = library.findIndex((item) => item.id === normalized.id);
      const next = existingIndex >= 0
        ? library.map((item, index) => index === existingIndex ? normalized : item)
        : [normalized, ...library];

      const saved = await this.store.saveUserClassLibrary(next);
      if (!saved) {
        this.errorMessage.set('Could not save class right now.');
        return;
      }

      await this.router.navigate(['/classes']);
    } finally {
      this.saveBusy.set(false);
      this.cdr.detectChanges();
    }
  }
}
