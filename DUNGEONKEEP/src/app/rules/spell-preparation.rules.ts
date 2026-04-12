export interface NormalizePreparedSpellOptions {
    getSpellLevel: (spellName: string) => number;
    includeSpell?: (spellName: string) => boolean;
    sort?: (left: string, right: string) => number;
}

export function normalizePreparedLeveledSpellNames(
    spellNames: string[] | undefined,
    options: NormalizePreparedSpellOptions
): string[] {
    const unique = [...new Set((spellNames ?? [])
        .map((spellName) => spellName.trim())
        .filter((spellName) => spellName.length > 0))];

    const filtered = unique.filter((spellName) => {
        if (options.includeSpell && !options.includeSpell(spellName)) {
            return false;
        }

        return options.getSpellLevel(spellName) > 0;
    });

    if (options.sort) {
        return [...filtered].sort(options.sort);
    }

    return filtered;
}

export function countPreparedSpellsForLimit(
    preparedLeveledSpellNames: readonly string[],
    isRitualSpell: (spellName: string) => boolean
): number {
    return preparedLeveledSpellNames.filter((spellName) => !isRitualSpell(spellName)).length;
}
