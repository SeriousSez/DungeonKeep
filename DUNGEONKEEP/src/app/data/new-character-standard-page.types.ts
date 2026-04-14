export type InfoModalType = 'class' | 'species';

export interface BuilderInfo {
    name: string;
    source: string;
    summary: string;
    highlights: string[];
    speciesDetails?: SpeciesDetail;
    details?: {
        tagline: string;
        primaryAbility: string;
        hitPointDie: string;
        saves: string;
        levelOneGains: string[];
        coreTraits: Array<{ label: string; value: string }>;
        levelMilestones: Array<{ title: string; summary: string; details: string }>;
        featureNotes: Array<{ title: string; summary: string; details: string }>;
    };
}

export interface ActiveInfoModal {
    type: InfoModalType;
    info: BuilderInfo;
}

export interface BackgroundChoice {
    key: string;
    title: string;
    subtitle: string;
    description?: string;
    options: string[];
}

export interface BackgroundDetail {
    description: string;
    skillProficiencies: string;
    toolProficiencies: string;
    languages: string;
    choices: BackgroundChoice[];
    sourceUrl: string;
    abilityScores?: string;
    feat?: string;
    equipment?: string;
}

export interface SpeciesDetail {
    tagline: string;
    creatureType: string;
    size: string;
    speed: string;
    sourceUrl: string;
    traits: string[];
    coreTraits: Array<{ label: string; value: string }>;
    traitNotes: Array<{
        title: string;
        summary: string;
        details: string;
        choices?: number;
        choiceLabel?: string;
    }>;
}

export interface EquipmentSource {
    label: string;
    url: string;
    category: string;
}

export interface EquipmentItem {
    name: string;
    category: string;
    sourceUrl: string;
    weight?: number;
    costGp?: number;
    sourceLabel?: string;
    summary?: string;
    notes?: string;
    detailLines?: string[];
    rarity?: string;
    attunement?: string;
}

export interface InventoryEntry {
    name: string;
    category: string;
    quantity: number;
    sourceUrl?: string;
    weight?: number;
    costGp?: number;
    sourceLabel?: string;
    summary?: string;
    notes?: string;
    detailLines?: string[];
    rarity?: string;
    attunement?: string;
    isContainer?: boolean;
    containedItems?: InventoryEntry[];
    maxCapacity?: number;
}

export interface CurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}


