import { tieflingLegacySpellByLegacy } from './character-detail-page.constants';
import type { PersistedBuilderState, TieflingLegacyName } from './character-detail-page.types';

export interface TieflingGrantedSpellCatalogEntry {
    name: string;
    level: number;
    source: '5E Core Rules' | '5E Expanded Rules';
}

export function getSelectedTieflingLegacyFromState(state: PersistedBuilderState | null): TieflingLegacyName | null {
    const selectedLegacy = (state?.selectedSpeciesTraitChoices?.['Fiendish Legacy']?.[0] ?? '').trim();
    if (selectedLegacy === 'Abyssal' || selectedLegacy === 'Chthonic' || selectedLegacy === 'Infernal') {
        return selectedLegacy;
    }

    return null;
}

export function getTieflingGrantedSpellCatalogForLevel(
    characterRace: string | null | undefined,
    level: number,
    state: PersistedBuilderState | null
): TieflingGrantedSpellCatalogEntry[] {
    if (characterRace !== 'Tiefling') {
        return [];
    }

    const selectedLegacy = getSelectedTieflingLegacyFromState(state);
    if (!selectedLegacy) {
        return [];
    }

    const legacySpells = tieflingLegacySpellByLegacy[selectedLegacy];
    const granted: TieflingGrantedSpellCatalogEntry[] = [
        { name: legacySpells.cantrip, level: 0, source: '5E Expanded Rules' }
    ];

    if (level >= 3) {
        granted.push({ name: legacySpells.level3, level: 1, source: '5E Expanded Rules' });
    }

    if (level >= 5) {
        granted.push({ name: legacySpells.level5, level: 2, source: '5E Expanded Rules' });
    }

    return granted;
}

export function getTieflingGrantedSpellNamesForLevel(
    characterRace: string | null | undefined,
    level: number,
    state: PersistedBuilderState | null
): string[] {
    return getTieflingGrantedSpellCatalogForLevel(characterRace, level, state).map((spell) => spell.name);
}