import { CustomClassFeature, CustomClassFeatureEffect, CustomClassFeatureEffectScaling, CustomClassFeatureEffectType, CustomClassOption, CustomSpeciesOption, CustomSpeciesTrait } from '../models/custom-character-options.models';
import type { ClassFeaturesForLevel } from './class-features.data';
import type { BuilderInfo } from './new-character-standard-page.types';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeString(entry))
    .filter((entry, index, all) => !!entry && all.findIndex((item) => item.toLowerCase() === entry.toLowerCase()) === index);
}

const customClassFeatureEffectTypes = new Set<CustomClassFeatureEffectType>([
  'ability-score',
  'skill-bonus',
  'skill-proficiency',
  'skill-expertise',
  'armor-class',
  'speed',
  'max-hit-points',
  'initiative',
  'saving-throw-bonus'
]);

const customClassFeatureEffectScalings = new Set<CustomClassFeatureEffectScaling>([
  'fixed',
  'proficiency-bonus',
  'class-level',
  'half-class-level'
]);

const customClassFeatureTargetlessTypes = new Set<CustomClassFeatureEffectType>([
  'armor-class',
  'speed',
  'max-hit-points',
  'initiative'
]);

function normalizeCustomClassFeatureEffects(value: unknown): CustomClassFeatureEffect[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const candidate = (entry ?? {}) as Partial<CustomClassFeatureEffect>;
      const type = normalizeString(candidate.type) as CustomClassFeatureEffectType;
      const scaling = normalizeString(candidate.scaling) as CustomClassFeatureEffectScaling;
      return {
        type,
        target: normalizeString(candidate.target),
        value: Math.trunc(Number(candidate.value) || 0),
        scaling: customClassFeatureEffectScalings.has(scaling) ? scaling : 'fixed',
        targetOptions: normalizeStringArray(candidate.targetOptions)
      };
    })
    .filter((effect) => customClassFeatureEffectTypes.has(effect.type)
      && (customClassFeatureTargetlessTypes.has(effect.type) || !!effect.target || effect.targetOptions.length > 0))
    .map((effect) => ({
      ...effect,
      value: effect.type === 'skill-proficiency' || effect.type === 'skill-expertise' ? 0 : effect.value
    }));
}

export function getCustomClassFeatureEffectValue(effect: CustomClassFeatureEffect, classLevel: number, proficiencyBonus: number): number {
  const multiplier = effect.value || 1;
  switch (effect.scaling) {
    case 'proficiency-bonus':
      return proficiencyBonus * multiplier;
    case 'class-level':
      return Math.max(1, Math.trunc(classLevel)) * multiplier;
    case 'half-class-level':
      return Math.max(1, Math.floor(Math.max(1, Math.trunc(classLevel)) / 2)) * multiplier;
    default:
      return effect.value;
  }
}

function describeCustomClassFeatureEffect(effect: CustomClassFeatureEffect): string {
  const target = effect.targetOptions.length > 0 ? 'your chosen target' : effect.target;
  const scaling = effect.scaling === 'fixed'
    ? `${effect.value >= 0 ? '+' : ''}${effect.value}`
    : `${effect.value || 1} × ${effect.scaling.replaceAll('-', ' ')}`;

  switch (effect.type) {
    case 'ability-score':
      return `${target} score ${scaling}`;
    case 'skill-bonus':
      return `${target} checks ${scaling}`;
    case 'skill-proficiency':
      return `Proficiency in ${target}`;
    case 'skill-expertise':
      return `Expertise in ${target}`;
    case 'armor-class':
      return `Armor Class ${scaling}`;
    case 'speed':
      return `Speed ${scaling} ft.`;
    case 'max-hit-points':
      return `Maximum Hit Points ${scaling}`;
    case 'initiative':
      return `Initiative ${scaling}`;
    case 'saving-throw-bonus':
      return `${target} saving throws ${scaling}`;
  }
}

function normalizeCustomClassFeatures(value: unknown, legacyFeatures: string[]): CustomClassFeature[] {
  const source = Array.isArray(value) && value.length > 0
    ? value
    : legacyFeatures.map((name) => ({ level: 1, name, description: '', effects: [] }));

  return source
    .map((entry) => {
      const candidate = (entry ?? {}) as Partial<CustomClassFeature>;
      return {
        level: Math.min(20, Math.max(1, Math.trunc(Number(candidate.level) || 1))),
        name: normalizeString(candidate.name),
        description: normalizeString(candidate.description),
        effects: normalizeCustomClassFeatureEffects(candidate.effects)
      };
    })
    .filter((entry) => !!entry.name)
    .filter((entry, index, all) => all.findIndex((item) => item.level === entry.level && item.name.toLowerCase() === entry.name.toLowerCase()) === index)
    .sort((left, right) => left.level - right.level);
}

export function sanitizeCustomClassOption(value: unknown): CustomClassOption {
  const candidate = (value ?? {}) as Partial<CustomClassOption>;
  const legacyFeatures = normalizeStringArray(candidate.keyFeatures);
  const features = normalizeCustomClassFeatures(candidate.features, legacyFeatures);
  return {
    id: normalizeString(candidate.id) || makeId('class'),
    name: normalizeString(candidate.name),
    summary: normalizeString(candidate.summary),
    hitDie: normalizeString(candidate.hitDie) || 'd8',
    primaryAbility: normalizeString(candidate.primaryAbility),
    savingThrows: normalizeString(candidate.savingThrows),
    armorTraining: normalizeString(candidate.armorTraining),
    weaponTraining: normalizeString(candidate.weaponTraining),
    toolTraining: normalizeString(candidate.toolTraining),
    keyFeatures: features.map((feature) => feature.name),
    features,
    startingEquipment: normalizeStringArray(candidate.startingEquipment),
    spellcastingNotes: normalizeString(candidate.spellcastingNotes),
    notes: normalizeString(candidate.notes)
  };
}

export function createBlankCustomClassOption(): CustomClassOption {
  return {
    id: makeId('class'),
    name: '',
    summary: '',
    hitDie: 'd8',
    primaryAbility: '',
    savingThrows: '',
    armorTraining: '',
    weaponTraining: '',
    toolTraining: '',
    keyFeatures: [],
    features: [],
    startingEquipment: [],
    spellcastingNotes: '',
    notes: ''
  };
}

export function getCustomClassFeatureProgression(value: unknown): ClassFeaturesForLevel[] {
  const customClass = sanitizeCustomClassOption(value);
  const featuresByLevel = new Map<number, CustomClassFeature[]>();

  for (const feature of customClass.features) {
    const levelFeatures = featuresByLevel.get(feature.level) ?? [];
    levelFeatures.push(feature);
    featuresByLevel.set(feature.level, levelFeatures);
  }

  return Array.from(featuresByLevel.entries())
    .map(([level, features]) => ({
      level,
      features: features.map((feature) => {
        const automaticEffects = feature.effects.map(describeCustomClassFeatureEffect);
        const choiceOptions = [...new Set(feature.effects.flatMap((effect) => effect.targetOptions))];
        const effectSummary = automaticEffects.length > 0
          ? `Automatic: ${automaticEffects.join('; ')}.`
          : '';
        return {
          name: feature.name,
          level: feature.level,
          description: [feature.description, effectSummary].filter(Boolean).join('\n\n'),
          choices: choiceOptions.length > 0
            ? { title: 'Choose Effect Target', count: 1, options: choiceOptions }
            : undefined
        };
      })
    }))
    .sort((left, right) => left.level - right.level);
}

export function getUnlockedCustomClassFeatureEffects(value: unknown, maxLevel: number): CustomClassFeatureEffect[] {
  const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(Number(maxLevel) || 1)));
  return sanitizeCustomClassOption(value).features
    .filter((feature) => feature.level <= normalizedLevel)
    .flatMap((feature) => feature.effects.map((effect) => ({ ...effect })));
}

export function sanitizeCustomSpeciesOption(value: unknown): CustomSpeciesOption {
  const candidate = (value ?? {}) as Partial<CustomSpeciesOption>;
  const traits = Array.isArray(candidate.traits)
    ? candidate.traits
      .map((trait) => {
        const entry = (trait ?? {}) as Partial<CustomSpeciesTrait>;
        const choiceOptions = normalizeStringArray(entry.choiceOptions);
        return {
          name: normalizeString(entry.name),
          description: normalizeString(entry.description),
          choiceCount: Math.min(choiceOptions.length, Math.max(0, Math.trunc(Number(entry.choiceCount) || 0))),
          choiceOptions,
          effects: normalizeCustomClassFeatureEffects(entry.effects)
        };
      })
      .filter((trait) => trait.name || trait.description)
    : [];

  return {
    id: normalizeString(candidate.id) || makeId('species'),
    name: normalizeString(candidate.name),
    summary: normalizeString(candidate.summary),
    size: normalizeString(candidate.size) || 'Medium',
    speed: normalizeString(candidate.speed) || '30 ft.',
    creatureType: normalizeString(candidate.creatureType) || 'Humanoid',
    languages: normalizeStringArray(candidate.languages),
    traits,
    notes: normalizeString(candidate.notes)
  };
}

export function createBlankCustomSpeciesOption(): CustomSpeciesOption {
  return {
    id: makeId('species'),
    name: '',
    summary: '',
    size: 'Medium',
    speed: '30 ft.',
    creatureType: 'Humanoid',
    languages: [],
    traits: [],
    notes: ''
  };
}

export function getCustomSpeciesBuilderInfo(value: unknown): BuilderInfo {
  const species = sanitizeCustomSpeciesOption(value);
  const languageDetails = species.languages.length > 0 ? species.languages.join(', ') : 'None';
  return {
    name: species.name,
    source: 'Custom Species Library',
    summary: species.summary,
    highlights: species.traits.slice(0, 3).map((trait) => trait.name),
    speciesDetails: {
      tagline: species.summary,
      creatureType: species.creatureType,
      size: species.size,
      speed: species.speed,
      sourceUrl: '',
      traits: species.traits.map((trait) => trait.name),
      coreTraits: [
        { label: 'Creature Type', value: species.creatureType },
        { label: 'Size', value: species.size },
        { label: 'Speed', value: species.speed }
      ],
      traitNotes: [
        ...species.traits.map((trait) => {
          const effectSummary = trait.effects.length > 0
            ? `Automatic: ${trait.effects.map(describeCustomClassFeatureEffect).join('; ')}.`
            : '';
          const details = [trait.description, effectSummary].filter(Boolean).join('\n\n');
          return {
            title: trait.name,
            summary: trait.description || effectSummary,
            details,
            choices: trait.choiceCount || undefined,
            choiceLabel: trait.choiceCount > 0 ? 'Choice' : undefined,
            choiceOptions: trait.choiceOptions
          };
        }),
        { title: 'Languages', summary: languageDetails, details: languageDetails }
      ]
    }
  };
}
