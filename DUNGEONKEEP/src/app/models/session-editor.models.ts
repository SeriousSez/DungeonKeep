import { ThreatLevel } from './dungeon.models';

export interface SessionTextEntry {
    id: string;
    text: string;
}

export interface SessionScene {
    id: string;
    title: string;
    description: string;
    trigger: string;
    keyEvents: string[];
    possibleOutcomes: string[];
}

export interface SessionNpc {
    id: string;
    name: string;
    role: string;
    personality: string;
    motivation: string;
    voiceNotes: string;
}

export interface SessionMonster {
    id: string;
    name: string;
    type: string;
    challengeRating: string;
    hp: number;
    keyAbilities: string;
    notes: string;
}

export interface SessionLocation {
    id: string;
    name: string;
    description: string;
    secrets: string;
    encounters: string;
}

export interface SessionLootItem {
    id: string;
    name: string;
    type: string;
    quantity: number;
    notes: string;
}

export interface SessionSkillCheck {
    id: string;
    situation: string;
    skill: string;
    dc: number;
    successOutcome: string;
    failureOutcome: string;
}

export interface SessionEditorDraft {
    id: string;
    title: string;
    shortDescription: string;
    sessionNumber: number;
    threatLevel?: ThreatLevel;
    campaignId: string;
    date: string;
    inGameLocation: string;
    estimatedLength: string;
    markdownNotes: string;
    scenes: SessionScene[];
    npcs: SessionNpc[];
    monsters: SessionMonster[];
    locations: SessionLocation[];
    loot: SessionLootItem[];
    skillChecks: SessionSkillCheck[];
    secrets: SessionTextEntry[];
    branchingPaths: SessionTextEntry[];
    nextSessionHooks: SessionTextEntry[];
}