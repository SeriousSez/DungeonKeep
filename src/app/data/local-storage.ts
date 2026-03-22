import { AbilityScores, Campaign, Character, SkillProficiencies } from '../models/dungeon.models';

interface StoredState {
    campaigns: Campaign[];
    characters: Character[];
    selectedCampaignId: string;
}

const STORAGE_KEY = 'dungeonkeep.state.v1';

const defaultAbilityScores: AbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
};

const defaultSkills: SkillProficiencies = {
    acrobatics: false,
    animalHandling: false,
    arcana: false,
    athletics: false,
    deception: false,
    history: false,
    insight: false,
    intimidation: false,
    investigation: false,
    medicine: false,
    nature: false,
    perception: false,
    performance: false,
    persuasion: false,
    sleightOfHand: false,
    stealth: false,
    survival: false
};

function normalizeCharacter(character: Character): Character {
    const safeAbilityScores = {
        ...defaultAbilityScores,
        ...(character.abilityScores ?? {})
    };

    const safeSkills = {
        ...defaultSkills,
        ...(character.skills ?? {})
    };

    const maxHitPoints = typeof character.maxHitPoints === 'number' ? character.maxHitPoints : 1;
    const hitPoints = typeof character.hitPoints === 'number' ? character.hitPoints : maxHitPoints;

    return {
        ...character,
        abilityScores: safeAbilityScores,
        skills: safeSkills,
        armorClass: typeof character.armorClass === 'number' ? character.armorClass : 10,
        hitPoints,
        maxHitPoints,
        proficiencyBonus: typeof character.proficiencyBonus === 'number' ? character.proficiencyBonus : 2,
        traits: Array.isArray(character.traits) ? character.traits : []
    };
}

function hasBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function parseStoredState(raw: string | null): Partial<StoredState> | null {
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as Partial<StoredState>;
    } catch {
        return null;
    }
}

export function loadState(seedCampaigns: Campaign[], seedCharacters: Character[]): StoredState {
    if (!hasBrowserStorage()) {
        return {
            campaigns: seedCampaigns,
            characters: seedCharacters,
            selectedCampaignId: seedCampaigns[0]?.id ?? ''
        };
    }

    const parsed = parseStoredState(window.localStorage.getItem(STORAGE_KEY));
    const campaigns = Array.isArray(parsed?.campaigns) && parsed.campaigns.length ? parsed.campaigns : seedCampaigns;
    const characters = Array.isArray(parsed?.characters) && parsed.characters.length
        ? parsed.characters.map((character) => normalizeCharacter(character))
        : seedCharacters;
    const selectedCampaignId =
        typeof parsed?.selectedCampaignId === 'string' && campaigns.some((campaign) => campaign.id === parsed.selectedCampaignId)
            ? parsed.selectedCampaignId
            : campaigns[0]?.id ?? '';

    return {
        campaigns,
        characters,
        selectedCampaignId
    };
}

export function saveState(state: StoredState): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        return;
    }
}
