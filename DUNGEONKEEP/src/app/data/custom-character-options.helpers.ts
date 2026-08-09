import { CustomClassOption, CustomSpeciesOption } from '../models/custom-character-options.models';

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

export function sanitizeCustomClassOption(value: unknown): CustomClassOption {
  const candidate = (value ?? {}) as Partial<CustomClassOption>;
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
    keyFeatures: normalizeStringArray(candidate.keyFeatures),
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
    startingEquipment: [],
    spellcastingNotes: '',
    notes: ''
  };
}

export function sanitizeCustomSpeciesOption(value: unknown): CustomSpeciesOption {
  const candidate = (value ?? {}) as Partial<CustomSpeciesOption>;
  const traits = Array.isArray(candidate.traits)
    ? candidate.traits
      .map((trait) => ({
        name: normalizeString((trait as { name?: unknown }).name),
        description: normalizeString((trait as { description?: unknown }).description)
      }))
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
