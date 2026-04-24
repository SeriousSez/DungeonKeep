import type { PersistedConditionKey, PersistedDefenseEntry, PersistedDefenseType } from './character-detail-page.types';

export function defenseTypeLabel(type: PersistedDefenseType): string {
    switch (type) {
        case 'resistance':
            return 'Resistance';
        case 'immunity':
            return 'Immunity';
        case 'vulnerability':
            return 'Vulnerability';
        case 'condition-immunity':
            return 'Condition Immunity';
        default:
            return 'Defense';
    }
}

export function defenseTypeHeading(type: PersistedDefenseType): string {
    switch (type) {
        case 'resistance':
            return 'RESISTANCES';
        case 'immunity':
            return 'IMMUNITIES';
        case 'vulnerability':
            return 'VULNERABILITIES';
        case 'condition-immunity':
            return 'CONDITION IMMUNITIES';
        default:
            return 'DEFENSES';
    }
}

export function defenseTypeIcon(type: PersistedDefenseType): string {
    switch (type) {
        case 'resistance':
            return 'fa-shield-halved';
        case 'immunity':
            return 'fa-shield-check';
        case 'vulnerability':
            return 'fa-shield-exclamation';
        case 'condition-immunity':
            return 'fa-shield-virus';
        default:
            return 'fa-shield';
    }
}

export function normalizeDefenseEntry(entry: PersistedDefenseEntry | null | undefined): PersistedDefenseEntry | null {
    const value = String(entry?.value ?? '').trim();
    if (!value) {
        return null;
    }

    const note = String(entry?.note ?? '').trim();

    switch (entry?.type) {
        case 'resistance':
        case 'immunity':
        case 'vulnerability':
        case 'condition-immunity':
            return {
                type: entry.type,
                value,
                note
            };
        default:
            return null;
    }
}

export function describeDefenseEntry(entry: PersistedDefenseEntry): string {
    return `${defenseTypeLabel(entry.type)}: ${entry.value}`;
}

export function normalizeConditionKey(value: unknown): PersistedConditionKey | null {
    switch (String(value ?? '').trim().toLowerCase()) {
        case 'blinded':
        case 'charmed':
        case 'deafened':
        case 'frightened':
        case 'grappled':
        case 'incapacitated':
        case 'invisible':
        case 'paralyzed':
        case 'petrified':
        case 'poisoned':
        case 'prone':
        case 'restrained':
        case 'stunned':
        case 'unconscious':
            return String(value).trim().toLowerCase() as PersistedConditionKey;
        default:
            return null;
    }
}

export function normalizeExhaustionLevel(value: unknown): number {
    const numeric = Math.trunc(Number(value));
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.min(6, Math.max(0, numeric));
}