import type { BuilderInfo } from './new-character-standard-page.types';
import { classInfoMap, classDetailFallbacks, classSubclassSnapshots } from './new-character-standard-page.data';
import { subclassOptionsByClass } from './subclass-features.data';

export type ClassSourceCategory = 'phb' | 'expanded' | 'critical-role' | 'third-party';

export interface ClassCatalogEntry {
    name: string;
    slug: string;
    source: string;
    icon: string;
    sourceCategory: ClassSourceCategory;
    tagline: string;
    summary: string;
    primaryAbility: string;
    hitPointDie: string;
    saves: string;
    levelOneGains: string[];
    coreTraits: Array<{ label: string; value: string }>;
    levelMilestones: Array<{ title: string; summary: string; details: string }>;
    featureNotes: Array<{ title: string; summary: string; details: string }>;
    subclasses: ReadonlyArray<string>;
    subclassSnapshot: { summary: string; details: string } | null;
}

const classIconMap: Record<string, string> = {
    Artificer: 'gear',
    Barbarian: 'axe-battle',
    Bard: 'music',
    'Blood Hunter': 'droplet',
    Cleric: 'cross',
    Druid: 'leaf',
    Fighter: 'sword',
    Gunslinger: 'gun',
    Monk: 'hand-fist',
    'Monster Hunter': 'skull',
    Paladin: 'shield-halved',
    Ranger: 'bow-arrow',
    Rogue: 'mask',
    Sorcerer: 'fire-flame-curved',
    Warlock: 'eye',
    Wizard: 'hat-wizard',
};

const classSourceCategoryMap: Record<string, ClassSourceCategory> = {
    Artificer: 'expanded',
    'Blood Hunter': 'critical-role',
    Gunslinger: 'third-party',
    'Monster Hunter': 'third-party',
};

export function classNameToSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
}

type ClassDetails = NonNullable<BuilderInfo['details']>;
const detailFallbacks = classDetailFallbacks as Record<string, ClassDetails | undefined>;

export const classCatalogEntries: ClassCatalogEntry[] = Object.keys(classInfoMap)
    .sort()
    .map((name) => {
        const info = classInfoMap[name];
        const details: ClassDetails | undefined = info?.details ?? detailFallbacks[name];
        return {
            name,
            slug: classNameToSlug(name),
            source: info?.source ?? '',
            icon: classIconMap[name] ?? 'book',
            sourceCategory: classSourceCategoryMap[name] ?? 'phb',
            tagline: details?.tagline ?? info?.summary ?? '',
            summary: info?.summary ?? '',
            primaryAbility: details?.primaryAbility ?? '',
            hitPointDie: details?.hitPointDie ?? '',
            saves: details?.saves ?? '',
            levelOneGains: details?.levelOneGains ?? [],
            coreTraits: details?.coreTraits ?? [],
            levelMilestones: details?.levelMilestones ?? [],
            featureNotes: details?.featureNotes ?? [],
            subclasses: subclassOptionsByClass[name] ?? [],
            subclassSnapshot: classSubclassSnapshots[name] ?? null,
        };
    });

export function getClassBySlug(slug: string): ClassCatalogEntry | null {
    return classCatalogEntries.find((c) => c.slug === slug) ?? null;
}
