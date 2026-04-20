import { AbilityScores, Campaign, Character, SkillProficiencies } from '../models/dungeon.models';

interface StoredState {
    campaigns: Campaign[];
    characters: Character[];
    selectedCampaignId: string;
}

export interface StoredSessionUser {
    id: string;
    email: string;
    displayName: string;
}

const STORAGE_KEY = 'dungeonkeep.state.v1';
const SESSION_STORAGE_KEY = 'dungeonkeep.session-token.v1';
const SESSION_USER_STORAGE_KEY = 'dungeonkeep.session-user.v1';

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
    religion: false,
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

export function loadSessionToken(): string {
    if (!hasBrowserStorage()) {
        return '';
    }

    return window.localStorage.getItem(SESSION_STORAGE_KEY) ?? '';
}

export function saveSessionToken(token: string): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, token);
    } catch {
        return;
    }
}

export function loadSessionUser(): StoredSessionUser | null {
    if (!hasBrowserStorage()) {
        return null;
    }

    const raw = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<StoredSessionUser>;
        if (!parsed || typeof parsed.id !== 'string' || typeof parsed.email !== 'string' || typeof parsed.displayName !== 'string') {
            return null;
        }

        return {
            id: parsed.id,
            email: parsed.email,
            displayName: parsed.displayName
        };
    } catch {
        return null;
    }
}

export function saveSessionUser(user: StoredSessionUser): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
        return;
    }
}

export function clearSessionUser(): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.removeItem(SESSION_USER_STORAGE_KEY);
    } catch {
        return;
    }
}

export function clearSessionToken(): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        window.localStorage.removeItem(SESSION_USER_STORAGE_KEY);
    } catch {
        return;
    }
}

const THEME_STORAGE_KEY = 'dungeonkeep.theme.v1';

export type StoredTheme = 'system' | 'light' | 'dark';

export function loadTheme(): StoredTheme {
    if (!hasBrowserStorage()) return 'system';
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
}

export function saveTheme(theme: StoredTheme): void {
    if (!hasBrowserStorage()) return;
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        return;
    }
}
