import { CustomMonster } from '../models/monster-reference.models';

const MONSTER_LIBRARY_KEY = 'dungeonkeep-monster-library';

export function loadMonsterLibrary(): CustomMonster[] | null {
    const storage = globalThis.localStorage;
    if (!storage) {
        return null;
    }

    const raw = storage.getItem(MONSTER_LIBRARY_KEY);
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed as CustomMonster[] : null;
    } catch {
        return null;
    }
}

export function saveMonsterLibrary(monsters: readonly CustomMonster[]): void {
    const storage = globalThis.localStorage;
    if (!storage) {
        return;
    }

    storage.setItem(MONSTER_LIBRARY_KEY, JSON.stringify(Array.isArray(monsters) ? monsters : []));
}

export function clearMonsterLibrary(): void {
    const storage = globalThis.localStorage;
    if (!storage) {
        return;
    }

    storage.removeItem(MONSTER_LIBRARY_KEY);
}
