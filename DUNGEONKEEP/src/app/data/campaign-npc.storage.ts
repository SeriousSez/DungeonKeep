import { CampaignNpc } from '../models/campaign-npc.models';

const STORAGE_PREFIX = 'dungeonkeep.campaign-npcs.v1';
const LIBRARY_STORAGE_KEY = 'dungeonkeep.npc-library.v1';

function hasBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function storageKey(campaignId: string): string {
    return `${STORAGE_PREFIX}.${campaignId}`;
}

export function loadCampaignNpcDrafts(campaignId: string): CampaignNpc[] | null {
    if (!hasBrowserStorage() || !campaignId) {
        return null;
    }

    const raw = window.localStorage.getItem(storageKey(campaignId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CampaignNpc[];
    } catch {
        window.localStorage.removeItem(storageKey(campaignId));
        return null;
    }
}

export function saveCampaignNpcDrafts(campaignId: string, npcs: readonly CampaignNpc[]): void {
    if (!hasBrowserStorage() || !campaignId) {
        return;
    }

    try {
        window.localStorage.setItem(storageKey(campaignId), JSON.stringify(npcs));
    } catch {
        return;
    }
}

export function clearCampaignNpcDrafts(campaignId: string): void {
    if (!hasBrowserStorage() || !campaignId) {
        return;
    }

    try {
        window.localStorage.removeItem(storageKey(campaignId));
    } catch {
        return;
    }
}

export function loadNpcLibrary(): CampaignNpc[] | null {
    if (!hasBrowserStorage()) {
        return null;
    }

    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CampaignNpc[];
    } catch {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
        return null;
    }
}

export function saveNpcLibrary(npcs: readonly CampaignNpc[]): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(npcs));
    } catch {
        return;
    }
}

export function clearNpcLibrary(): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
    } catch {
        return;
    }
}