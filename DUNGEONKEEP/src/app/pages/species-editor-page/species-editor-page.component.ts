import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { createBlankCustomSpeciesOption, sanitizeCustomSpeciesOption } from '../../data/custom-character-options.helpers';
import { CustomClassFeatureEffect, CustomClassFeatureEffectScaling, CustomClassFeatureEffectType, CustomSpeciesOption, CustomSpeciesTrait } from '../../models/custom-character-options.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-species-editor-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DropdownComponent],
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
  readonly effectTypeOptions: ReadonlyArray<DropdownOption> = [
    { value: 'ability-score', label: 'Ability Score Bonus' },
    { value: 'skill-bonus', label: 'Skill Check Bonus' },
    { value: 'skill-proficiency', label: 'Skill Proficiency' },
    { value: 'skill-expertise', label: 'Skill Expertise' },
    { value: 'armor-class', label: 'Armor Class Bonus' },
    { value: 'speed', label: 'Speed Bonus' },
    { value: 'max-hit-points', label: 'Maximum Hit Points' },
    { value: 'initiative', label: 'Initiative Bonus' },
    { value: 'saving-throw-bonus', label: 'Saving Throw Bonus' }
  ];
  readonly scalingOptions: ReadonlyArray<DropdownOption> = [
    { value: 'fixed', label: 'Fixed value' },
    { value: 'proficiency-bonus', label: 'Proficiency bonus' }
  ];
  readonly abilityOptions = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map((value) => ({ value, label: value }));
  readonly skillOptions = ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'].map((value) => ({ value, label: value }));

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

  addTrait(): void {
    this.draft.update((current) => ({ ...current, traits: [...current.traits, { name: '', description: '', choiceCount: 0, choiceOptions: [], effects: [] }] }));
  }

  updateTrait(index: number, field: keyof CustomSpeciesTrait, value: string): void {
    this.draft.update((current) => ({
      ...current,
      traits: current.traits.map((trait, traitIndex) => traitIndex === index
        ? { ...trait, [field]: field === 'choiceCount' ? Math.max(0, Math.trunc(Number(value) || 0)) : value }
        : trait)
    }));
  }

  updateTraitChoices(index: number, value: string): void {
    const choiceOptions = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    this.draft.update((current) => ({
      ...current,
      traits: current.traits.map((trait, traitIndex) => traitIndex === index
        ? { ...trait, choiceOptions, choiceCount: Math.min(trait.choiceCount, choiceOptions.length) }
        : trait)
    }));
  }

  removeTrait(index: number): void {
    this.draft.update((current) => ({ ...current, traits: current.traits.filter((_, traitIndex) => traitIndex !== index) }));
  }

  duplicateTrait(index: number): void {
    this.draft.update((current) => {
      const source = current.traits[index];
      if (!source) return current;
      const copy = { ...source, name: `${source.name} Copy`, choiceOptions: [...source.choiceOptions], effects: source.effects.map((effect) => ({ ...effect, targetOptions: [...effect.targetOptions] })) };
      return { ...current, traits: [...current.traits.slice(0, index + 1), copy, ...current.traits.slice(index + 1)] };
    });
  }

  addTraitEffect(traitIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      traits: current.traits.map((trait, index) => index === traitIndex
        ? { ...trait, effects: [...trait.effects, { type: 'skill-proficiency', target: 'Perception', value: 0, scaling: 'fixed', targetOptions: [] }] }
        : trait)
    }));
  }

  updateTraitEffect(traitIndex: number, effectIndex: number, field: keyof CustomClassFeatureEffect, value: string | number): void {
    this.draft.update((current) => ({
      ...current,
      traits: current.traits.map((trait, index) => index === traitIndex
        ? { ...trait, effects: trait.effects.map((effect, effectPosition) => effectPosition === effectIndex ? this.updateEffect(effect, field, value) : effect) }
        : trait)
    }));
  }

  removeTraitEffect(traitIndex: number, effectIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      traits: current.traits.map((trait, index) => index === traitIndex
        ? { ...trait, effects: trait.effects.filter((_, effectPosition) => effectPosition !== effectIndex) }
        : trait)
    }));
  }

  getEffectTargets(type: CustomClassFeatureEffectType): ReadonlyArray<DropdownOption> {
    if (type === 'ability-score' || type === 'saving-throw-bonus') return this.abilityOptions;
    return type.startsWith('skill-') ? this.skillOptions : [];
  }

  effectNeedsTarget(type: CustomClassFeatureEffectType): boolean {
    return this.getEffectTargets(type).length > 0;
  }

  effectUsesValue(type: CustomClassFeatureEffectType): boolean {
    return type !== 'skill-proficiency' && type !== 'skill-expertise';
  }

  private updateEffect(effect: CustomClassFeatureEffect, field: keyof CustomClassFeatureEffect, value: string | number): CustomClassFeatureEffect {
    if (field === 'type') {
      const type = String(value) as CustomClassFeatureEffectType;
      return { ...effect, type, target: String(this.getEffectTargets(type)[0]?.value ?? ''), value: this.effectUsesValue(type) ? effect.value || 1 : 0, targetOptions: [] };
    }
    if (field === 'value') return { ...effect, value: Math.trunc(Number(value) || 0) };
    if (field === 'scaling') return { ...effect, scaling: String(value) as CustomClassFeatureEffectScaling };
    return { ...effect, target: String(value) };
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

    if (this.draft().traits.some((trait) => !trait.name.trim())) {
      this.errorMessage.set('Every species trait needs a name.');
      return;
    }

    if (this.draft().traits.some((trait) => trait.choiceCount > trait.choiceOptions.length)) {
      this.errorMessage.set('A trait cannot require more choices than it offers.');
      return;
    }

    if (this.draft().traits.some((trait) => trait.effects.some((effect) => this.effectNeedsTarget(effect.type) && !effect.target.trim()))) {
      this.errorMessage.set('Choose a target for every mechanical effect.');
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
