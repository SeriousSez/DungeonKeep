import { MonsterReferenceEntry } from '../models/monster-reference.models';

const MONSTER_REFERENCE_STORAGE_KEY = 'dungeonkeep.monster-reference.entries';

export function loadMonsterReferenceEntries(): MonsterReferenceEntry[] {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return [];
    }

    const raw = window.localStorage.getItem(MONSTER_REFERENCE_STORAGE_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as MonsterReferenceEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        window.localStorage.removeItem(MONSTER_REFERENCE_STORAGE_KEY);
        return [];
    }
}

export function saveMonsterReferenceEntries(entries: MonsterReferenceEntry[]): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return;
    }

    window.localStorage.setItem(MONSTER_REFERENCE_STORAGE_KEY, JSON.stringify(entries));
}