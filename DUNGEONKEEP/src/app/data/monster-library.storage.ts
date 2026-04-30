import { CustomMonster } from '../models/monster-reference.models';

const LIBRARY_STORAGE_KEY = 'dungeonkeep.monster-library.v1';

function hasBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadMonsterLibrary(): CustomMonster[] | null {
    if (!hasBrowserStorage()) {
        return null;
    }

    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CustomMonster[];
    } catch {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
        return null;
    }
}

export function saveMonsterLibrary(monsters: readonly CustomMonster[]): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(monsters));
    } catch {
        return;
    }
}

export function clearMonsterLibrary(): void {
    if (!hasBrowserStorage()) {
        return;
    }

    try {
        window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
    } catch {
        return;
    }
}
