export type CampaignTone = 'Heroic' | 'Grim' | 'Mystic' | 'Chaotic';
export type ThreatLevel = 'Low' | 'Moderate' | 'High' | 'Deadly';
export type PartyRole = 'Tank' | 'Support' | 'Scout' | 'Striker' | 'Caster';
export type CharacterStatus = 'Ready' | 'Resting' | 'Recovering';
export type CampaignMemberRole = 'Owner' | 'Member';
export type CampaignMemberStatus = 'Active' | 'Pending';

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

export interface Campaign {
    id: string;
    name: string;
    setting: string;
    tone: CampaignTone;
    levelRange: string;
    summary: string;
    hook: string;
    nextSession: string;
    partyCharacterIds: string[];
    sessions: SessionPrep[];
    openThreads: string[];
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
    maxHitPoints: number;
    proficiencyBonus: number;
    traits: string[];
}

export interface CampaignDraft {
    name: string;
    setting: string;
    tone: CampaignTone;
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
    maxHitPoints?: number;
}
