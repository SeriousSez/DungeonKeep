import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { MultiSelectDropdownComponent, MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { createBlankCustomClassOption, sanitizeCustomClassOption } from '../../data/custom-character-options.helpers';
import { CustomClassFeature, CustomClassFeatureEffect, CustomClassFeatureEffectScaling, CustomClassFeatureEffectType, CustomClassOption } from '../../models/custom-character-options.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-class-editor-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DropdownComponent, MultiSelectDropdownComponent],
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
  readonly generationBrief = signal('');
  readonly collapsedFeatureIndexes = signal<Set<number>>(new Set());

  readonly isEditing = computed(() => !!this.classId());
  readonly effectTypeOptions: ReadonlyArray<DropdownOption> = [
    { value: 'ability-score', label: 'Ability Score Bonus', description: 'Adds directly to an ability score.' },
    { value: 'skill-bonus', label: 'Skill Check Bonus', description: 'Adds a flat bonus to checks with one skill.' },
    { value: 'skill-proficiency', label: 'Skill Proficiency', description: 'Adds proficiency to one skill.' },
    { value: 'skill-expertise', label: 'Skill Expertise', description: 'Adds double proficiency to one skill.' },
    { value: 'armor-class', label: 'Armor Class Bonus', description: 'Adds to the character’s calculated Armor Class.' },
    { value: 'speed', label: 'Speed Bonus', description: 'Adds feet to walking speed.' },
    { value: 'max-hit-points', label: 'Maximum Hit Points', description: 'Adds to maximum hit points.' },
    { value: 'initiative', label: 'Initiative Bonus', description: 'Adds to initiative checks.' },
    { value: 'saving-throw-bonus', label: 'Saving Throw Bonus', description: 'Adds to one ability saving throw.' }
  ];
  readonly scalingOptions: ReadonlyArray<DropdownOption> = [
    { value: 'fixed', label: 'Fixed value' },
    { value: 'proficiency-bonus', label: 'Proficiency bonus' },
    { value: 'class-level', label: 'Class level' },
    { value: 'half-class-level', label: 'Half class level' }
  ];
  readonly abilityOptions: ReadonlyArray<DropdownOption> = [
    'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'
  ].map((ability) => ({ value: ability, label: ability }));
  readonly skillOptions: ReadonlyArray<DropdownOption> = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation',
    'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand',
    'Stealth', 'Survival'
  ].map((skill) => ({ value: skill, label: skill }));
  readonly abilityTargetGroups: ReadonlyArray<MultiSelectOptionGroup> = [{ label: 'Abilities', options: this.abilityOptions.map((option) => String(option.value)) }];
  readonly skillTargetGroups: ReadonlyArray<MultiSelectOptionGroup> = [{ label: 'Skills', options: this.skillOptions.map((option) => String(option.value)) }];

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
        this.generationBrief.set('');
        this.errorMessage.set('');
        this.cdr.detectChanges();
      });
  }

  updateField(field: keyof CustomClassOption, value: string): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
  }

  addFeature(): void {
    this.draft.update((current) => ({
      ...current,
      features: [...current.features, { level: 1, name: '', description: '', effects: [] }]
    }));
  }

  updateFeature(index: number, field: keyof CustomClassFeature, value: string): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, featureIndex) => featureIndex === index
        ? {
          ...feature,
          [field]: field === 'level'
            ? Math.min(20, Math.max(1, Math.trunc(Number(value) || 1)))
            : value
        }
        : feature)
    }));
  }

  removeFeature(index: number): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.filter((_, featureIndex) => featureIndex !== index)
    }));
  }

  duplicateFeature(index: number): void {
    this.draft.update((current) => {
      const source = current.features[index];
      if (!source) {
        return current;
      }

      const copy: CustomClassFeature = {
        ...source,
        name: `${source.name} Copy`,
        effects: source.effects.map((effect) => ({ ...effect, targetOptions: [...effect.targetOptions] }))
      };
      return { ...current, features: [...current.features.slice(0, index + 1), copy, ...current.features.slice(index + 1)] };
    });
  }

  moveFeature(index: number, direction: -1 | 1): void {
    this.draft.update((current) => {
      const source = current.features[index];
      if (!source) {
        return current;
      }

      const sameLevelIndexes = current.features
        .map((feature, featureIndex) => feature.level === source.level ? featureIndex : -1)
        .filter((featureIndex) => featureIndex >= 0);
      const currentPosition = sameLevelIndexes.indexOf(index);
      const targetIndex = sameLevelIndexes[currentPosition + direction];
      if (targetIndex == null) {
        return current;
      }

      const features = [...current.features];
      [features[index], features[targetIndex]] = [features[targetIndex], features[index]];
      return { ...current, features };
    });
  }

  canMoveFeature(index: number, direction: -1 | 1): boolean {
    const feature = this.draft().features[index];
    if (!feature) {
      return false;
    }

    const sameLevelIndexes = this.draft().features
      .map((entry, featureIndex) => entry.level === feature.level ? featureIndex : -1)
      .filter((featureIndex) => featureIndex >= 0);
    return sameLevelIndexes.indexOf(index) + direction >= 0
      && sameLevelIndexes.indexOf(index) + direction < sameLevelIndexes.length;
  }

  toggleFeatureCollapsed(index: number): void {
    this.collapsedFeatureIndexes.update((current) => {
      const next = new Set(current);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  isFeatureCollapsed(index: number): boolean {
    return this.collapsedFeatureIndexes().has(index);
  }

  addFeatureEffect(featureIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, index) => index === featureIndex
        ? { ...feature, effects: [...feature.effects, { type: 'ability-score', target: 'Charisma', value: 1, scaling: 'fixed', targetOptions: [] }] }
        : feature)
    }));
  }

  updateFeatureEffect(featureIndex: number, effectIndex: number, field: keyof CustomClassFeatureEffect, value: string | number): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, index) => index === featureIndex
        ? {
          ...feature,
          effects: feature.effects.map((effect, indexOfEffect) => indexOfEffect === effectIndex
            ? this.updateEffectValue(effect, field, value)
            : effect)
        }
        : feature)
    }));
  }

  removeFeatureEffect(featureIndex: number, effectIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, index) => index === featureIndex
        ? { ...feature, effects: feature.effects.filter((_, indexOfEffect) => indexOfEffect !== effectIndex) }
        : feature)
    }));
  }

  setEffectTargetChoice(featureIndex: number, effectIndex: number, enabled: boolean): void {
    const effect = this.draft().features[featureIndex]?.effects[effectIndex];
    if (!effect || !this.effectNeedsTarget(effect.type)) {
      return;
    }

    const availableTargets = this.getEffectTargetOptions(effect.type).map((option) => String(option.value));
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, index) => index === featureIndex
        ? {
          ...feature,
          effects: feature.effects.map((entry, indexOfEffect) => indexOfEffect === effectIndex
            ? {
              ...entry,
              target: enabled ? '' : (entry.targetOptions[0] ?? entry.target ?? availableTargets[0] ?? ''),
              targetOptions: enabled ? availableTargets : []
            }
            : entry)
        }
        : feature)
    }));
  }

  updateEffectTargetOptions(featureIndex: number, effectIndex: number, targetOptions: string[]): void {
    this.draft.update((current) => ({
      ...current,
      features: current.features.map((feature, index) => index === featureIndex
        ? {
          ...feature,
          effects: feature.effects.map((effect, indexOfEffect) => indexOfEffect === effectIndex
            ? { ...effect, target: '', targetOptions }
            : effect)
        }
        : feature)
    }));
  }

  getEffectTargetOptions(type: CustomClassFeatureEffectType): ReadonlyArray<DropdownOption> {
    if (type === 'ability-score' || type === 'saving-throw-bonus') {
      return this.abilityOptions;
    }

    return type.startsWith('skill-') ? this.skillOptions : [];
  }

  getEffectTargetGroups(type: CustomClassFeatureEffectType): ReadonlyArray<MultiSelectOptionGroup> {
    return type === 'ability-score' || type === 'saving-throw-bonus' ? this.abilityTargetGroups : this.skillTargetGroups;
  }

  effectNeedsTarget(type: CustomClassFeatureEffectType): boolean {
    return this.getEffectTargetOptions(type).length > 0;
  }

  effectUsesValue(type: CustomClassFeatureEffectType): boolean {
    return type !== 'skill-proficiency' && type !== 'skill-expertise';
  }

  effectValueLabel(scaling: CustomClassFeatureEffectScaling): string {
    return scaling === 'fixed' ? 'Bonus' : 'Multiplier';
  }

  private updateEffectValue(effect: CustomClassFeatureEffect, field: keyof CustomClassFeatureEffect, value: string | number): CustomClassFeatureEffect {
    if (field === 'type') {
      const type = String(value) as CustomClassFeatureEffectType;
      const targetOptions = this.getEffectTargetOptions(type);
      const currentTargetIsValid = targetOptions.some((option) => option.value === effect.target);
      return {
        type,
        target: currentTargetIsValid ? effect.target : String(targetOptions[0]?.value ?? ''),
        value: this.effectUsesValue(type) ? effect.value || 1 : 0,
        scaling: effect.scaling,
        targetOptions: currentTargetIsValid ? effect.targetOptions : []
      };
    }

    if (field === 'value') {
      return { ...effect, value: Math.trunc(Number(value) || 0) };
    }

    if (field === 'scaling') {
      return { ...effect, scaling: String(value) as CustomClassFeatureEffectScaling };
    }

    return { ...effect, target: String(value) };
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
        generationBrief: this.generationBrief(),
        nameHint: this.draft().name,
        themeHint: this.draft().summary,
        roleHint: this.draft().primaryAbility,
        mechanicHint: this.draft().features.map((feature) => feature.name).filter(Boolean).join(', '),
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

    const draft = this.draft();
    const normalized = sanitizeCustomClassOption(draft);
    if (!normalized.name) {
      this.errorMessage.set('Class name is required.');
      return;
    }

    if (draft.features.some((feature) => !feature.name.trim())) {
      this.errorMessage.set('Every class feature needs a name.');
      return;
    }

    const featureKeys = draft.features.map((feature) => `${feature.level}:${feature.name.trim().toLowerCase()}`);
    if (new Set(featureKeys).size !== featureKeys.length) {
      this.errorMessage.set('Feature names must be unique within each level.');
      return;
    }

    const hasIncompleteEffect = draft.features.some((feature) => feature.effects.some((effect) =>
      this.effectNeedsTarget(effect.type) && !effect.target.trim() && effect.targetOptions.length === 0));
    if (hasIncompleteEffect) {
      this.errorMessage.set('Choose a target or allowed player choices for every mechanical effect.');
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
