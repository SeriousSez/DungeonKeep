export type CampaignTone =
    | 'Heroic'
    | 'Grim'
    | 'Mystic'
    | 'Chaotic'
    | 'Grimdark'
    | 'Gothic'
    | 'Horror'
    | 'Noblebright'
    | 'Sword-and-Sorcery'
    | 'Political Intrigue'
    | 'Mythic'
    | 'Survival'
    | 'Pulp Adventure'
    | 'Dark Fantasy'
    | 'Whimsical'
    | 'Noir'
    | 'Epic War'
    | 'Cosmic'
    | 'Heroic Tragedy';
export type ThreatLevel = 'Low' | 'Moderate' | 'High' | 'Deadly';
export type PartyRole = 'Tank' | 'Support' | 'Scout' | 'Striker' | 'Caster';
export type CharacterStatus = 'Ready' | 'Resting' | 'Recovering';
export type CampaignMemberRole = 'Owner' | 'Member';
export type CampaignMemberStatus = 'Active' | 'Pending';
export type CampaignThreadVisibility = 'Party' | 'GMOnly';
export type CampaignWorldNoteCategory = 'Backstory' | 'Organization' | 'Ally' | 'Enemy' | 'Location' | 'Lore' | 'Custom';
export type CampaignMapBackground = 'Parchment' | 'Cavern' | 'Coast' | 'City';
export type CampaignMapIconType = 'Keep' | 'Town' | 'Camp' | 'Dungeon' | 'Danger' | 'Treasure' | 'Portal' | 'Tower';
export type CampaignMapDecorationType = 'Forest' | 'Mountain' | 'Hill' | 'Reef' | 'Cave' | 'Ward';
export type CampaignMapLabelTone = 'Region' | 'Feature';

export interface SessionPrep {
    id: string;
    title: string;
    date: string;
    location: string;
    objective: string;
    threat: ThreatLevel;
}

export interface CampaignMember {
    userId: string | null;
    email: string;
    displayName: string;
    role: CampaignMemberRole;
    status: CampaignMemberStatus;
}

export interface CampaignThread {
    id: string;
    text: string;
    visibility: CampaignThreadVisibility;
}

export interface CampaignWorldNote {
    id: string;
    title: string;
    category: CampaignWorldNoteCategory;
    content: string;
}

export interface CampaignMapPoint {
    x: number;
    y: number;
}

export interface CampaignMapStroke {
    id: string;
    color: string;
    width: number;
    points: CampaignMapPoint[];
}

export interface CampaignMapIcon {
    id: string;
    type: CampaignMapIconType;
    label: string;
    x: number;
    y: number;
}

export interface CampaignMapDecoration {
    id: string;
    type: CampaignMapDecorationType;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}

export interface CampaignMapLabel {
    id: string;
    text: string;
    tone: CampaignMapLabelTone;
    x: number;
    y: number;
    rotation: number;
}

export interface CampaignMapLayers {
    rivers: CampaignMapStroke[];
    mountainChains: CampaignMapDecoration[];
    forestBelts: CampaignMapDecoration[];
}

export interface CampaignMap {
    background: CampaignMapBackground;
    backgroundImageUrl: string;
    strokes: CampaignMapStroke[];
    icons: CampaignMapIcon[];
    decorations: CampaignMapDecoration[];
    labels: CampaignMapLabel[];
    layers: CampaignMapLayers;
}

export interface CampaignMapBoard extends CampaignMap {
    id: string;
    name: string;
}

export interface Campaign {
    id: string;
    name: string;
    setting: string;
    tone: CampaignTone;
    levelStart: number;
    levelEnd: number;
    levelRange: string;
    summary: string;
    hook: string;
    nextSession: string;
    partyCharacterIds: string[];
    sessions: SessionPrep[];
    openThreads: CampaignThread[];
    worldNotes: CampaignWorldNote[];
    map: CampaignMap;
    maps: CampaignMapBoard[];
    activeMapId: string;
    loot: string[];
    npcs: string[];
    currentUserRole?: CampaignMemberRole;
    members?: CampaignMember[];
}

export interface AbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface SkillProficiencies {
    acrobatics: boolean;
    animalHandling: boolean;
    arcana: boolean;
    athletics: boolean;
    deception: boolean;
    history: boolean;
    insight: boolean;
    intimidation: boolean;
    investigation: boolean;
    medicine: boolean;
    nature: boolean;
    perception: boolean;
    performance: boolean;
    persuasion: boolean;
    sleightOfHand: boolean;
    stealth: boolean;
    survival: boolean;
}

export interface RaceAbilityBonuses {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
}

export interface Race {
    id: string;
    name: string;
    abilityBonuses: RaceAbilityBonuses;
    traits: string[];
    size: string;
    speed: number;
    languages: string[];
    description: string;
}

export interface Character {
    id: string;
    campaignId: string;
    ownerUserId?: string | null;
    ownerDisplayName?: string;
    canEdit?: boolean;
    name: string;
    playerName: string;
    race: string;
    className: string;
    level: number;
    role: PartyRole;
    status: CharacterStatus;
    background: string;
    notes: string;
    abilityScores: AbilityScores;
    skills: SkillProficiencies;
    armorClass: number;
    hitPoints: number;
    deathSaveFailures?: number;
    deathSaveSuccesses?: number;
    maxHitPoints: number;
    proficiencyBonus: number;
    traits: string[];
    gender?: string;
    alignment?: string;
    faith?: string;
    lifestyle?: string;
    classFeatures?: string[];
    speciesTraits?: string[];
    languages?: string[];
    personalityTraits?: string[];
    ideals?: string[];
    bonds?: string[];
    flaws?: string[];
    equipment?: string[];
    spells?: string[];
    experiencePoints?: number;
    image?: string;
}

export interface CampaignDraft {
    name: string;
    setting: string;
    tone: CampaignTone;
    levelStart: number;
    levelEnd: number;
    hook: string;
    nextSession: string;
    summary: string;
}

export interface CharacterDraft {
    name: string;
    playerName: string;
    race: string;
    className: string;
    level: number;
    role: PartyRole;
    background: string;
    notes: string;
    campaignId?: string;
    abilityScores?: AbilityScores;
    skills?: SkillProficiencies;
    armorClass?: number;
    hitPoints?: number;
    deathSaveFailures?: number;
    deathSaveSuccesses?: number;
    maxHitPoints?: number;
    gender?: string;
    alignment?: string;
    faith?: string;
    lifestyle?: string;
    classFeatures?: string[];
    speciesTraits?: string[];
    languages?: string[];
    personalityTraits?: string[];
    ideals?: string[];
    bonds?: string[];
    flaws?: string[];
    equipment?: string[];
    savingThrows?: Record<string, boolean>;
    combatStats?: Record<string, any>;
    spells?: string[];
    experiencePoints?: number;
    image?: string;
    goals?: string;
    secrets?: string;
    sessionHistory?: string;
}
