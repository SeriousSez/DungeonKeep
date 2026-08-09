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
  traits: Array<{ name: string; description: string }>;
  notes: string;
}
