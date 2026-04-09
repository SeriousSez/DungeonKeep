export interface MonsterReferenceEntry {
    id: string;
    name: string;
    challengeRating: string;
    creatureType: string;
    tags: string[];
    sourceUrl: string;
    sourceLabel: string;
    notes: string;
    lastUpdated: string;
}

export interface MonsterAbilityScores {
    strength: number | null;
    dexterity: number | null;
    constitution: number | null;
    intelligence: number | null;
    wisdom: number | null;
    charisma: number | null;
}

export interface MonsterTextSectionEntry {
    title: string;
    text: string;
}

export interface MonsterCatalogEntry {
    id: string;
    slug: string;
    name: string;
    sourceUrl: string;
    challengeRating: string;
    creatureType: string;
    creatureCategory: string;
    size: string;
    armorClass: number | null;
    hitPoints: number | null;
    speed: string;
    alignment: string;
    legendary: boolean;
    sourceLabel: string;
    abilityScores: MonsterAbilityScores;
    savingThrows: string;
    skills: string;
    damageVulnerabilities: string;
    damageResistances: string;
    damageImmunities: string;
    conditionImmunities: string;
    senses: string;
    languages: string;
    challengeXp: string;
    traits: MonsterTextSectionEntry[];
    actions: MonsterTextSectionEntry[];
    reactions: MonsterTextSectionEntry[];
    legendaryActions: MonsterTextSectionEntry[];
}