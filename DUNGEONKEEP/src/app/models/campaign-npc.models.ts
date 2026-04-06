export interface NpcRelationship {
    id: string;
    targetNpcId: string;
    relationshipType: string;
    description: string;
}

export interface CampaignNpc {
    id: string;
    name: string;
    title: string;
    race: string;
    classOrRole: string;
    faction: string;
    occupation: string;
    age: string;
    gender: string;
    alignment: string;
    currentStatus: string;
    location: string;
    shortDescription: string;
    appearance: string;
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    motivations: string;
    goals: string;
    fears: string;
    secrets: string[];
    mannerisms: string[];
    voiceNotes: string;
    backstory: string;
    notes: string;
    combatNotes: string;
    statBlockReference: string;
    tags: string[];
    relationships: NpcRelationship[];
    questLinks: string[];
    sessionAppearances: string[];
    inventory: string[];
    imageUrl: string;
    hostility: NpcDisposition;
    isAlive: boolean;
    isImportant: boolean;
    updatedAt: string;
}

export type NpcDisposition = 'Friendly' | 'Indifferent' | 'Hostile';
export type NpcLifeFilter = 'All' | 'Alive' | 'Dead';
export type NpcHostilityFilter = 'All' | NpcDisposition;
export type NpcImportanceFilter = 'All' | 'Important' | 'NotImportant';
export type NpcSortField = 'RecentlyUpdated' | 'Name' | 'Location' | 'Faction';

export interface NpcFilters {
    search: string;
    campaignIds: string[];
    faction: string;
    location: string;
    tags: string[];
    lifeState: NpcLifeFilter;
    hostility: NpcHostilityFilter;
    importance: NpcImportanceFilter;
    sortBy: NpcSortField;
}