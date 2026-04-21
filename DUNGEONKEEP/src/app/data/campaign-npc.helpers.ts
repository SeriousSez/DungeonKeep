import { CampaignNpc, NpcDisposition, NpcFilters, NpcRelationship } from '../models/campaign-npc.models';

type StoredCampaignNpc = Omit<CampaignNpc, 'hostility'> & {
    hostility?: NpcDisposition | string;
    isHostile?: boolean;
};

function createId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
    return new Date().toISOString();
}

function normalizeStringArray(values: string[]): string[] {
    return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeRelationshipArray(relationships: NpcRelationship[]): NpcRelationship[] {
    return relationships.map((relationship) => ({
        id: relationship.id || createId('npc-rel'),
        targetNpcId: relationship.targetNpcId.trim(),
        relationshipType: relationship.relationshipType.trim(),
        description: relationship.description.trim()
    }));
}

export function createDefaultNpc(name = ''): CampaignNpc {
    return {
        id: createId('npc'),
        name,
        title: '',
        race: '',
        classOrRole: '',
        faction: '',
        occupation: '',
        age: '',
        gender: '',
        alignment: '',
        currentStatus: '',
        location: '',
        shortDescription: '',
        appearance: '',
        personalityTraits: [],
        ideals: [],
        bonds: [],
        flaws: [],
        motivations: '',
        goals: '',
        fears: '',
        secrets: [],
        mannerisms: [],
        voiceNotes: '',
        backstory: '',
        notes: '',
        combatNotes: '',
        statBlockReference: '',
        tags: [],
        relationships: [],
        questLinks: [],
        sessionAppearances: [],
        inventory: [],
        imageUrl: '',
        hostility: 'Indifferent',
        isAlive: true,
        isImportant: false,
        updatedAt: nowIso()
    };
}

export function createNpcFromLegacyName(name: string): CampaignNpc {
    return createDefaultNpc(name.trim());
}

export function touchNpc(npc: CampaignNpc): CampaignNpc {
    return {
        ...npc,
        updatedAt: nowIso()
    };
}

export function sanitizeNpc(npc: StoredCampaignNpc): CampaignNpc {
    return {
        ...npc,
        name: npc.name.trim(),
        title: npc.title.trim(),
        race: npc.race.trim(),
        classOrRole: npc.classOrRole.trim(),
        faction: npc.faction.trim(),
        occupation: npc.occupation.trim(),
        age: npc.age.trim(),
        gender: npc.gender.trim(),
        alignment: npc.alignment.trim(),
        currentStatus: npc.currentStatus.trim(),
        location: npc.location.trim(),
        shortDescription: npc.shortDescription.trim(),
        appearance: npc.appearance.trim(),
        personalityTraits: normalizeStringArray(npc.personalityTraits),
        ideals: normalizeStringArray(npc.ideals),
        bonds: normalizeStringArray(npc.bonds),
        flaws: normalizeStringArray(npc.flaws),
        motivations: npc.motivations.trim(),
        goals: npc.goals.trim(),
        fears: npc.fears.trim(),
        secrets: normalizeStringArray(npc.secrets),
        mannerisms: normalizeStringArray(npc.mannerisms),
        voiceNotes: npc.voiceNotes.trim(),
        backstory: npc.backstory.trim(),
        notes: npc.notes.trim(),
        combatNotes: npc.combatNotes.trim(),
        statBlockReference: npc.statBlockReference.trim(),
        tags: normalizeStringArray(npc.tags),
        relationships: normalizeRelationshipArray(npc.relationships),
        questLinks: normalizeStringArray(npc.questLinks),
        sessionAppearances: normalizeStringArray(npc.sessionAppearances),
        inventory: normalizeStringArray(npc.inventory),
        imageUrl: npc.imageUrl.trim(),
        hostility: normalizeNpcHostility(npc),
        updatedAt: npc.updatedAt || nowIso()
    };
}

function normalizeNpcHostility(npc: Pick<StoredCampaignNpc, 'hostility' | 'isHostile'>): NpcDisposition {
    if (npc.hostility === 'Friendly' || npc.hostility === 'Indifferent' || npc.hostility === 'Hostile') {
        return npc.hostility;
    }

    if (npc.isHostile === true) {
        return 'Hostile';
    }

    if (npc.isHostile === false) {
        return 'Friendly';
    }

    return 'Indifferent';
}

export function duplicateNpc(source: CampaignNpc, namesInUse: string[]): CampaignNpc {
    const baseName = source.name.trim() || 'New NPC';
    let nextName = `${baseName} Copy`;
    let counter = 2;

    while (namesInUse.some((name) => name.localeCompare(nextName, undefined, { sensitivity: 'accent' }) === 0)) {
        nextName = `${baseName} Copy ${counter}`;
        counter += 1;
    }

    return touchNpc({
        ...source,
        id: createId('npc'),
        name: nextName,
        relationships: source.relationships.map((relationship) => ({
            ...relationship,
            id: createId('npc-rel')
        }))
    });
}

export function cloneNpcForCampaign(source: CampaignNpc, namesInUse: string[]): CampaignNpc {
    const baseName = source.name.trim() || 'Imported NPC';
    let nextName = baseName;
    let counter = 2;

    while (namesInUse.some((name) => name.localeCompare(nextName, undefined, { sensitivity: 'accent' }) === 0)) {
        nextName = `${baseName} ${counter}`;
        counter += 1;
    }

    return touchNpc({
        ...source,
        id: createId('npc'),
        name: nextName,
        relationships: source.relationships.map((relationship) => ({
            ...relationship,
            id: createId('npc-rel')
        }))
    });
}

export function mergeStoredNpcDrafts(legacyNames: readonly string[], storedNpcs: readonly CampaignNpc[]): CampaignNpc[] {
    return mergeCampaignNpcSources(legacyNames, [], storedNpcs);
}

export function mergeCampaignNpcSources(
    legacyNames: readonly string[],
    persistedNpcs: readonly CampaignNpc[],
    draftNpcs: readonly CampaignNpc[]
): CampaignNpc[] {
    const normalizedPersisted = persistedNpcs.map((npc) => sanitizeNpc(npc));
    const normalizedDrafts = draftNpcs.map((npc) => sanitizeNpc(npc));
    const combinedById = new Map<string, CampaignNpc>();
    const combinedByName = new Map<string, CampaignNpc>();

    for (const npc of normalizedPersisted) {
        combinedById.set(npc.id, npc);
        combinedByName.set(npc.name.toLowerCase(), npc);
    }

    for (const npc of normalizedDrafts) {
        const existing = combinedById.get(npc.id);
        combinedById.set(npc.id, npc);
        combinedByName.set(npc.name.toLowerCase(), npc);
        if (existing) {
            combinedByName.set(existing.name.toLowerCase(), npc);
        }
    }

    const combined = [...combinedById.values()];
    const merged: CampaignNpc[] = [];
    const usedIds = new Set<string>();

    for (const legacyName of legacyNames) {
        const key = legacyName.trim().toLowerCase();
        const existing = combinedByName.get(key);
        if (existing) {
            merged.push(existing);
            usedIds.add(existing.id);
        } else if (legacyName.trim()) {
            merged.push(createNpcFromLegacyName(legacyName));
        }
    }

    for (const npc of combined) {
        if (!usedIds.has(npc.id)) {
            merged.push(npc);
            usedIds.add(npc.id);
        }
    }

    return merged.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function hasNpcNameConflict(npcs: readonly CampaignNpc[], candidate: CampaignNpc): boolean {
    const normalizedName = candidate.name.trim().toLowerCase();
    if (!normalizedName) {
        return false;
    }

    return npcs.some((npc) => npc.id !== candidate.id && npc.name.trim().toLowerCase() === normalizedName);
}

export function filterAndSortNpcs(npcs: readonly CampaignNpc[], filters: NpcFilters): CampaignNpc[] {
    const search = filters.search.trim().toLowerCase();

    const filtered = npcs.filter((npc) => {
        if (filters.faction && npc.faction !== filters.faction) {
            return false;
        }

        if (filters.location && npc.location !== filters.location) {
            return false;
        }

        if (filters.tags.length > 0 && !filters.tags.every((tag) => npc.tags.includes(tag))) {
            return false;
        }

        if (filters.lifeState === 'Alive' && !npc.isAlive) {
            return false;
        }

        if (filters.lifeState === 'Dead' && npc.isAlive) {
            return false;
        }

        if (filters.hostility !== 'All' && npc.hostility !== filters.hostility) {
            return false;
        }

        if (filters.importance === 'Important' && !npc.isImportant) {
            return false;
        }

        if (filters.importance === 'NotImportant' && npc.isImportant) {
            return false;
        }

        if (!search) {
            return true;
        }

        const haystack = [
            npc.name,
            npc.title,
            npc.classOrRole,
            npc.faction,
            npc.location,
            npc.shortDescription,
            ...npc.tags
        ].join(' ').toLowerCase();

        return haystack.includes(search);
    });

    return filtered.sort((left, right) => {
        switch (filters.sortBy) {
            case 'Name':
                return left.name.localeCompare(right.name);
            case 'Location':
                return (left.location || 'Unknown').localeCompare(right.location || 'Unknown');
            case 'Faction':
                return (left.faction || 'Independent').localeCompare(right.faction || 'Independent');
            case 'RecentlyUpdated':
            default:
                return right.updatedAt.localeCompare(left.updatedAt);
        }
    });
}