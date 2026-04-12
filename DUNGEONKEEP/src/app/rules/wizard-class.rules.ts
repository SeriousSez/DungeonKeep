export function normalizeClassLevel(level: number): number {
    return Math.min(20, Math.max(1, Math.trunc(level)));
}

export function isWizardClassName(className: string): boolean {
    return className === 'Wizard';
}

export function getWizardPreparedSpellLimit(classLevel: number, intelligenceModifier: number): number {
    return Math.max(1, normalizeClassLevel(classLevel) + intelligenceModifier);
}

export function getWizardCantripLimit(classLevel: number): number {
    const normalizedLevel = normalizeClassLevel(classLevel);
    if (normalizedLevel >= 10) {
        return 5;
    }

    if (normalizedLevel >= 4) {
        return 4;
    }

    return 3;
}

export function getWizardFreeLeveledSpellLimit(classLevel: number): number {
    return 6 + ((normalizeClassLevel(classLevel) - 1) * 2);
}

export function isWizardSpellbookCantripAlwaysPrepared(
    className: string,
    spellName: string,
    isInSpellbook: (name: string) => boolean,
    getSpellLevel: (name: string) => number | null | undefined
): boolean {
    return isWizardClassName(className) && isInSpellbook(spellName) && (getSpellLevel(spellName) ?? 0) === 0;
}
