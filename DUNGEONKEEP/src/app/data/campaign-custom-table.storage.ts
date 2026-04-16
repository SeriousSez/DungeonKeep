import { CampaignCustomTable } from '../models/campaign-custom-table.models';

const STORAGE_PREFIX = 'dungeonkeep.campaign-custom-tables.v1';
const LIBRARY_STORAGE_KEY = 'dungeonkeep.custom-table-library.v1';

function hasBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function storageKey(campaignId: string): string {
    return `${STORAGE_PREFIX}.${campaignId}`;
}

export function loadCampaignCustomTables(campaignId: string): CampaignCustomTable[] | null {
    if (!hasBrowserStorage() || !campaignId) {
        return null;
    }

    const raw = window.localStorage.getItem(storageKey(campaignId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CampaignCustomTable[];
    } catch {
        window.localStorage.removeItem(storageKey(campaignId));
        return null;
    }
}

export function saveCampaignCustomTables(campaignId: string, tables: readonly CampaignCustomTable[]): void {
    if (!hasBrowserStorage() || !campaignId) {
        return;
    }

    try {
        window.localStorage.setItem(storageKey(campaignId), JSON.stringify(tables));
    } catch {
        return;
    }
}

export function clearCampaignCustomTables(campaignId: string): void {
    if (!hasBrowserStorage() || !campaignId) {
        return;
    }

    try {
        window.localStorage.removeItem(storageKey(campaignId));
    } catch {
        return;
    }
}

export function loadCustomTableLibrary(): CampaignCustomTable[] | null {
    if (!hasBrowserStorage()) {
        return null;
    }

    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CampaignCustomTable[];
    } catch {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
        return null;
    }
}

export function saveCustomTableLibrary(tables: readonly CampaignCustomTable[]): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(tables));
    } catch {
        return;
    }
}

export function clearCustomTableLibrary(): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
    } catch {
        return;
    }
}
