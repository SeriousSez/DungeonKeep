export type CustomClassFeatureEffectType =
  | 'ability-score'
  | 'skill-bonus'
  | 'skill-proficiency'
  | 'skill-expertise'
  | 'armor-class'
  | 'speed'
  | 'max-hit-points'
  | 'initiative'
  | 'saving-throw-bonus';

export type CustomClassFeatureEffectScaling = 'fixed' | 'proficiency-bonus' | 'class-level' | 'half-class-level';

export interface CustomClassFeatureEffect {
  type: CustomClassFeatureEffectType;
  target: string;
  value: number;
  scaling: CustomClassFeatureEffectScaling;
  targetOptions: string[];
}

export interface CustomClassFeature {
  level: number;
  name: string;
  description: string;
  effects: CustomClassFeatureEffect[];
}

export interface CustomClassOption {
  id: string;
  name: string;
  summary: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string;
  armorTraining: string;
  weaponTraining: string;
  toolTraining: string;
  keyFeatures: string[];
  features: CustomClassFeature[];
  startingEquipment: string[];
  spellcastingNotes: string;
  notes: string;
}

export interface CustomSpeciesOption {
  id: string;
  name: string;
  summary: string;
  size: string;
  speed: string;
  creatureType: string;
  languages: string[];
  traits: CustomSpeciesTrait[];
  notes: string;
}

export interface CustomSpeciesTrait {
  name: string;
  description: string;
  choiceCount: number;
  choiceOptions: string[];
  effects: CustomClassFeatureEffect[];
}
