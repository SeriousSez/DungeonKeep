import { CustomMonster, MonsterCatalogEntry, MonsterTextSectionEntry } from '../models/monster-reference.models';

function createId(): string {
    return `custom-monster-${crypto.randomUUID()}`;
}

function nowIso(): string {
    return new Date().toISOString();
}

function slugify(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function cloneTextSections(sections: readonly MonsterTextSectionEntry[]): MonsterTextSectionEntry[] {
    return sections.map((section) => ({ title: section.title, text: section.text }));
}

export function createCustomMonsterFromTemplate(template: MonsterCatalogEntry): CustomMonster {
    return {
        id: createId(),
        slug: slugify(template.name) || template.slug,
        isCustom: true,
        templateSlug: template.slug,
        name: template.name,
        sourceUrl: '',
        challengeRating: template.challengeRating,
        creatureType: template.creatureType,
        creatureCategory: template.creatureCategory,
        size: template.size,
        armorClass: template.armorClass,
        hitPoints: template.hitPoints,
        speed: template.speed,
        alignment: template.alignment,
        legendary: template.legendary,
        sourceLabel: 'Custom',
        abilityScores: { ...template.abilityScores },
        savingThrows: template.savingThrows,
        skills: template.skills,
        damageVulnerabilities: template.damageVulnerabilities,
        damageResistances: template.damageResistances,
        damageImmunities: template.damageImmunities,
        conditionImmunities: template.conditionImmunities,
        senses: template.senses,
        languages: template.languages,
        challengeXp: template.challengeXp,
        traits: cloneTextSections(template.traits),
        actions: cloneTextSections(template.actions),
        reactions: cloneTextSections(template.reactions),
        legendaryActions: cloneTextSections(template.legendaryActions),
        notes: '',
        updatedAt: nowIso()
    };
}

export function createBlankCustomMonster(): CustomMonster {
    return {
        id: createId(),
        slug: '',
        isCustom: true,
        templateSlug: '',
        name: '',
        sourceUrl: '',
        challengeRating: '1',
        creatureType: 'Humanoid',
        creatureCategory: 'Humanoid',
        size: 'Medium',
        armorClass: 10,
        hitPoints: 10,
        speed: '30 ft.',
        alignment: 'unaligned',
        legendary: false,
        sourceLabel: 'Custom',
        abilityScores: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        },
        savingThrows: '',
        skills: '',
        damageVulnerabilities: '',
        damageResistances: '',
        damageImmunities: '',
        conditionImmunities: '',
        senses: 'passive Perception 10',
        languages: '',
        challengeXp: '',
        traits: [],
        actions: [],
        reactions: [],
        legendaryActions: [],
        notes: '',
        updatedAt: nowIso()
    };
}

export function duplicateCustomMonster(source: CustomMonster, namesInUse: string[]): CustomMonster {
    const baseName = source.name.trim() || 'New Monster';
    let nextName = `${baseName} Copy`;
    let counter = 2;

    while (namesInUse.some((name) => name.localeCompare(nextName, undefined, { sensitivity: 'accent' }) === 0)) {
        nextName = `${baseName} Copy ${counter}`;
        counter += 1;
    }

    return {
        ...source,
        id: createId(),
        slug: slugify(nextName) || `${source.slug}-copy`,
        name: nextName,
        traits: cloneTextSections(source.traits),
        actions: cloneTextSections(source.actions),
        reactions: cloneTextSections(source.reactions),
        legendaryActions: cloneTextSections(source.legendaryActions),
        updatedAt: nowIso()
    };
}

export function sanitizeCustomMonster(raw: CustomMonster): CustomMonster {
    return {
        ...raw,
        name: raw.name?.trim() ?? '',
        slug: raw.slug?.trim() || slugify(raw.name?.trim() ?? ''),
        creatureType: raw.creatureType?.trim() ?? '',
        creatureCategory: raw.creatureCategory?.trim() ?? '',
        size: raw.size?.trim() ?? 'Medium',
        alignment: raw.alignment?.trim() ?? '',
        challengeRating: raw.challengeRating?.trim() ?? '—',
        challengeXp: raw.challengeXp?.trim() ?? '',
        sourceLabel: raw.sourceLabel?.trim() ?? 'Custom',
        sourceUrl: raw.sourceUrl?.trim() ?? '',
        speed: raw.speed?.trim() ?? '',
        savingThrows: raw.savingThrows?.trim() ?? '',
        skills: raw.skills?.trim() ?? '',
        damageVulnerabilities: raw.damageVulnerabilities?.trim() ?? '',
        damageResistances: raw.damageResistances?.trim() ?? '',
        damageImmunities: raw.damageImmunities?.trim() ?? '',
        conditionImmunities: raw.conditionImmunities?.trim() ?? '',
        senses: raw.senses?.trim() ?? '',
        languages: raw.languages?.trim() ?? '',
        notes: raw.notes?.trim() ?? '',
        abilityScores: {
            strength: raw.abilityScores?.strength ?? null,
            dexterity: raw.abilityScores?.dexterity ?? null,
            constitution: raw.abilityScores?.constitution ?? null,
            intelligence: raw.abilityScores?.intelligence ?? null,
            wisdom: raw.abilityScores?.wisdom ?? null,
            charisma: raw.abilityScores?.charisma ?? null
        },
        traits: (raw.traits ?? []).map((s) => ({ title: s.title?.trim() ?? '', text: s.text?.trim() ?? '' })),
        actions: (raw.actions ?? []).map((s) => ({ title: s.title?.trim() ?? '', text: s.text?.trim() ?? '' })),
        reactions: (raw.reactions ?? []).map((s) => ({ title: s.title?.trim() ?? '', text: s.text?.trim() ?? '' })),
        legendaryActions: (raw.legendaryActions ?? []).map((s) => ({ title: s.title?.trim() ?? '', text: s.text?.trim() ?? '' })),
        updatedAt: raw.updatedAt || new Date().toISOString()
    };
}

export function touchCustomMonster(monster: CustomMonster): CustomMonster {
    return { ...monster, updatedAt: nowIso() };
}

export function filterMonsterLibrary(monsters: readonly CustomMonster[], search: string, type: string): CustomMonster[] {
    const query = search.trim().toLowerCase();
    return monsters.filter((monster) => {
        if (type && type !== 'All' && monster.creatureCategory !== type) {
            return false;
        }

        if (!query) {
            return true;
        }

        return [monster.name, monster.challengeRating, monster.creatureType, monster.creatureCategory, monster.size, monster.alignment]
            .join(' ')
            .toLowerCase()
            .includes(query);
    });
}
