import { CampaignNpc } from './campaign-npc.models';

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
export type CharacterStatus = 'Ready' | 'Resting' | 'Recovering' | 'Inactive';
export type CampaignMemberRole = 'Owner' | 'Member';
export type CampaignMemberStatus = 'Active' | 'Pending';
export type CampaignThreadVisibility = 'Party' | 'GMOnly';
export type CampaignWorldNoteCategory = 'Backstory' | 'Organization' | 'Ally' | 'Enemy' | 'Location' | 'Lore' | 'Custom';
export type CampaignMapBackground = 'Parchment' | 'Cavern' | 'Coast' | 'City' | 'Battlemap';
export type CampaignMapIconType = 'Keep' | 'Town' | 'Camp' | 'Dungeon' | 'Danger' | 'Treasure' | 'Portal' | 'Tower';
export type CampaignMapDecorationType = 'Forest' | 'Mountain' | 'Hill' | 'Reef' | 'Cave' | 'Ward';
export type CampaignMapLabelTone = 'Region' | 'Feature';
export type CampaignMapLabelFontFamily = 'display' | 'body';
export type CampaignMapLabelFontStyle = 'normal' | 'italic';
export type CampaignMapLabelTextTransform = 'none' | 'uppercase';

export const DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS = 25;
export const DEFAULT_CAMPAIGN_MAP_GRID_ROWS = 17.5;
export const DEFAULT_CAMPAIGN_MAP_GRID_COLOR = '#745338';
export const DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X = 0;
export const DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y = 0;

export interface CampaignLootItem {
    name: string;
    sessionId?: string | null;
}

export interface SessionPrep {
    id: string;
    title: string;
    date: string;
    location: string;
    objective: string;
    threat: ThreatLevel;
    isRevealedToPlayers: boolean;
    detailsJson?: string | null;
    lootAssignmentsJson?: string | null;
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
    isRevealedToPlayers: boolean;
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

export interface CampaignMapWall extends CampaignMapStroke {
    blocksVision: boolean;
    blocksMovement: boolean;
}

export interface CampaignMapIcon {
    id: string;
    type: CampaignMapIconType;
    label: string;
    x: number;
    y: number;
}

export interface CampaignMapToken {
    id: string;
    name: string;
    imageUrl: string;
    x: number;
    y: number;
    size: number;
    note: string;
    assignedUserId?: string | null;
    assignedCharacterId?: string | null;
    moveRevision: number;
}

export interface CampaignMapDecoration {
    id: string;
    type: CampaignMapDecorationType;
    color?: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}

export interface CampaignMapLabelStyle {
    color: string;
    backgroundColor: string;
    borderColor: string;
    fontFamily: CampaignMapLabelFontFamily;
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    fontStyle: CampaignMapLabelFontStyle;
    textTransform: CampaignMapLabelTextTransform;
    borderWidth: number;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    textShadow: string;
    boxShadow: string;
    opacity: number;
}

export interface CampaignMapLabel {
    id: string;
    text: string;
    tone: CampaignMapLabelTone;
    x: number;
    y: number;
    rotation: number;
    style: CampaignMapLabelStyle;
}

export interface CampaignMapLayers {
    rivers: CampaignMapStroke[];
    mountainChains: CampaignMapDecoration[];
    forestBelts: CampaignMapDecoration[];
}

export interface CampaignMapVisionPolygon {
    points: CampaignMapPoint[];
}

export interface CampaignMapVisionMemoryEntry {
    key: string;
    polygons: CampaignMapVisionPolygon[];
    lastOrigin: CampaignMapPoint | null;
    lastPolygonHash: string;
    revision: number;
}

export interface CampaignMap {
    background: CampaignMapBackground;
    backgroundImageUrl: string;
    gridColumns: number;
    gridRows: number;
    gridColor: string;
    gridOffsetX: number;
    gridOffsetY: number;
    visionEnabled: boolean;
    membersCanViewAnytime: boolean;
    strokes: CampaignMapStroke[];
    walls: CampaignMapWall[];
    icons: CampaignMapIcon[];
    tokens: CampaignMapToken[];
    decorations: CampaignMapDecoration[];
    labels: CampaignMapLabel[];
    layers: CampaignMapLayers;
    visionMemory: CampaignMapVisionMemoryEntry[];
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
    characterCount: number;
    sessionCount: number;
    npcCount: number;
    openThreadCount: number;
    detailsLoaded: boolean;
    partyCharacterIds: string[];
    sessions: SessionPrep[];
    openThreads: CampaignThread[];
    worldNotes: CampaignWorldNote[];
    map: CampaignMap;
    maps: CampaignMapBoard[];
    activeMapId: string;
    loot: CampaignLootItem[];
    npcs: string[];
    campaignNpcs: CampaignNpc[];
    currentUserRole?: CampaignMemberRole;
    members?: CampaignMember[];
    customTablesJson?: string;
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
    religion?: boolean;
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
    campaignIds?: string[];
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
    detailBackgroundImageUrl?: string;
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
    campaignIds?: string[];
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
    detailBackgroundImageUrl?: string;
    goals?: string;
    secrets?: string;
    sessionHistory?: string;
}
