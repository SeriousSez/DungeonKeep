import type { DetailDrawerContent } from './character-detail-page.types';

export interface SpeciesLoreDetail {
    history: string;
    adulthood: string;
    lifespan: string;
    height: string;
    weight: string;
    adulthoodAge: number;
    elderAge: number;
    bullets: string[];
}

export interface SpeciesInfoDetail {
    summary?: string;
    highlights?: string[];
    speciesDetails?: {
        size?: string;
        coreTraits?: Array<{ value: string; label: string }>;
        traitNotes?: Array<{ title: string; summary: string; details?: string }>;
    };
}

export interface AlignmentDrawerDetail {
    description: string;
    bullets: string[];
}

export interface LifestyleDrawerDetail {
    description: string;
    bullets: string[];
}

export interface LifestyleCostDetail {
    perDay: string;
    perMonth: string;
}

export interface FaithDrawerDetail {
    description: string;
    bullets: string[];
    lineItems?: Array<{ value: string; label: string; note?: string }>;
}

export function formatAlignmentValue(value: string): string {
    return value
        .trim()
        .replace(/-/g, ' ')
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function getSpeciesInfo(speciesName: string, speciesInfoLookup: Record<string, SpeciesInfoDetail>): SpeciesInfoDetail | null {
    const match = Object.entries(speciesInfoLookup).find(([key]) => key.toLowerCase() === speciesName.trim().toLowerCase());
    return match?.[1] ?? null;
}

export function getSpeciesLore(
    speciesName: string,
    speciesLoreLookup: Record<string, SpeciesLoreDetail>,
    speciesInfoLookup: Record<string, SpeciesInfoDetail>
): SpeciesLoreDetail | null {
    const normalizedName = speciesName.trim();
    const match = Object.entries(speciesLoreLookup).find(([key]) => key.toLowerCase() === normalizedName.toLowerCase());
    if (match?.[1]) {
        return match[1];
    }

    const speciesInfo = getSpeciesInfo(normalizedName, speciesInfoLookup);
    const size = speciesInfo?.speciesDetails?.size?.toLowerCase() ?? '';
    if (!speciesInfo) {
        return null;
    }

    const height = size.includes('small')
        ? `${normalizedName} is typically shorter and more compact than a human, with proportions shaped by Small size and practical movement.`
        : size.includes('medium')
            ? `${normalizedName} usually falls within a human-like height band, though posture, features, and silhouette vary by lineage.`
            : `${normalizedName} has a more unusual silhouette than most humanoids, often standing out immediately in a crowd.`;

    const weight = size.includes('small')
        ? 'Build tends toward light, compact frames that emphasize balance, nimbleness, or efficiency over bulk.'
        : 'Build can range from lean to heavily set depending on heritage, environment, and lifestyle.';

    return {
        history: speciesInfo.summary ?? `${normalizedName} has its own distinct culture, physical presence, and visual identity.`,
        adulthood: `${normalizedName} reaches adulthood according to its own community standards, often tied to independence, training, or social role.`,
        lifespan: `Members of this species follow their own life stages and traditions, though exact lifespan can vary by lineage and setting.`,
        height,
        weight,
        adulthoodAge: 18,
        elderAge: 60,
        bullets: speciesInfo.highlights?.slice(0, 3) ?? []
    };
}

export function buildSpeciesAgeDetail(speciesName: string, value: string, lore: SpeciesLoreDetail | null): DetailDrawerContent {
    const parsedAge = Number.parseInt(value, 10);
    const stage = lore && Number.isFinite(parsedAge)
        ? parsedAge < lore.adulthoodAge
            ? `This character is still young by ${speciesName} standards, with much of adult life still ahead.`
            : parsedAge < lore.elderAge
                ? `This character is in the established adult span typical for ${speciesName}, with identity and reputation likely well formed.`
                : `This character is older by ${speciesName} standards and may carry deep memory, experience, or a longer view of the world.`
        : null;

    return {
        title: `Age: ${value}`,
        subtitle: `${speciesName} lifespan`,
        lineItems: [
            { label: 'Current recorded age', value }
        ],
        description: lore
            ? `${lore.adulthood} ${lore.lifespan}`
            : 'Age is interpreted through species culture, maturity expectations, and lifespan norms.',
        bullets: [
            stage,
            ...(lore?.bullets ?? [])
        ].filter((entry): entry is string => Boolean(entry))
    };
}

export function buildSpeciesHeightDetail(speciesName: string, value: string, lore: SpeciesLoreDetail | null): DetailDrawerContent {
    return {
        title: `Height: ${value}`,
        subtitle: `${speciesName} physique`,
        lineItems: [
            { label: 'Current recorded height', value }
        ],
        description: lore?.height
            ?? 'Height helps define silhouette, posture, and first-impression presence in scenes and portraits.',
        bullets: lore ? [lore.weight, ...lore.bullets.slice(0, 1)] : ['Height and build often influence movement style, presence, and how equipment or clothing are visualized.']
    };
}

export function buildSpeciesWeightDetail(speciesName: string, value: string, lore: SpeciesLoreDetail | null): DetailDrawerContent {
    return {
        title: `Weight: ${value}`,
        subtitle: `${speciesName} build`,
        lineItems: [
            { label: 'Current recorded weight', value }
        ],
        description: lore?.weight
            ?? 'Weight reflects frame and build, helping describe how the character carries gear and moves through the world.',
        bullets: lore ? [lore.height, ...lore.bullets.slice(0, 1)] : ['Weight can inform how the character moves, appears, and is described in armor or travel gear.']
    };
}

export function buildAlignmentDetail(normalizedValue: string, detail: AlignmentDrawerDetail | undefined): DetailDrawerContent {
    return {
        title: normalizedValue,
        subtitle: 'Alignment',
        description: detail?.description ?? 'An ethical and moral outlook that guides how this character thinks and acts in the world.',
        bullets: detail?.bullets ?? [
            'Alignment reflects how a character tends to approach duty, freedom, mercy, selfishness, and restraint.',
            'It is a roleplay tool rather than a prison, and can shift as the character changes.',
            'Consistent behavior gives the alignment meaning at the table.'
        ]
    };
}

export function buildLifestyleDetail(value: string, detail: LifestyleDrawerDetail | undefined, cost: LifestyleCostDetail | undefined): DetailDrawerContent {
    return {
        title: value,
        subtitle: 'Lifestyle Expense',
        description: detail?.description ?? "A chosen lifestyle that determines your character's living standards between adventures.",
        lineItems: cost
            ? [
                { value: cost.perDay, label: 'Typical cost per day' },
                { value: cost.perMonth, label: 'Typical cost per 30 days' }
            ]
            : undefined,
        bullets: detail?.bullets ?? [
            'Lifestyle affects lodging, meals, comfort, and how respectable your day-to-day living appears.',
            'It can change how NPCs perceive your means, manners, and social standing.',
            'Many campaigns track lifestyle during downtime or long urban stays.'
        ]
    };
}

export function buildFaithDetail(value: string, detail: FaithDrawerDetail | undefined): DetailDrawerContent {
    return {
        title: value,
        subtitle: 'Faith',
        description: value && value !== 'Not recorded'
            ? detail?.description ?? 'This reflects the deity, philosophy, or spiritual path that influences your character\'s worldview and behavior.'
            : 'No faith or spiritual tradition has been recorded for this character yet.',
        lineItems: detail?.lineItems,
        secondaryHeading: detail ? 'Faith and worship' : undefined,
        bullets: detail?.bullets ?? [
            'Faith can shape ideals, rituals, oaths, and roleplay choices.',
            'It may affect relationships with temples, priests, cults, and divine factions.',
            'Some campaigns also tie faith into downtime, omens, or divine favor.'
        ]
    };
}

export function buildExperienceDetail(currentXp: number | null, xpThresholds: ReadonlyArray<[number, number]>): DetailDrawerContent {
    const nextThreshold = currentXp != null ? xpThresholds.find(([, xp]) => xp > currentXp) : null;
    const bullets: string[] = [];

    if (currentXp != null && nextThreshold) {
        const [nextLevel, nextXp] = nextThreshold;
        const needed = nextXp - currentXp;
        bullets.push(`${needed.toLocaleString()} XP needed to reach level ${nextLevel}.`);
        bullets.push(`Next milestone: ${nextXp.toLocaleString()} XP.`);
    } else if (currentXp != null) {
        bullets.push('You have reached the maximum level - no further XP thresholds apply.');
    }

    bullets.push('XP is typically awarded at the end of an encounter or session by your DM.');

    return {
        title: 'Experience Points',
        subtitle: currentXp != null ? `${currentXp.toLocaleString()} XP` : 'Not recorded',
        description: "Experience points track your character's growth and advancement toward the next level.",
        bullets
    };
}

export function buildAppearanceDetail(label: string, value: string): DetailDrawerContent {
    return {
        title: `${label}: ${value}`,
        subtitle: 'Appearance',
        description: 'This appearance detail helps define how the character is perceived at a glance and supports more consistent roleplay and scene description.',
        bullets: [
            'Use appearance details to anchor introductions, disguises, portraits, and witness descriptions.',
            'These traits can help make recurring NPC interactions and party roleplay feel more grounded.',
            'Update them as scars, aging, magical changes, or travel wear alter the character over time.'
        ]
    };
}

export function buildNameDetail(value: string, className: string, backgroundName: string, speciesName: string): DetailDrawerContent {
    return {
        title: value,
        subtitle: 'Character Name',
        description: 'This is the identity your character presents to the world and the name allies, rivals, and legends will remember.',
        bullets: [
            `Class: ${className}`,
            `Background: ${backgroundName}`,
            `Species: ${speciesName}`
        ]
    };
}

export function buildRaceDetail(
    value: string,
    description: string,
    lineItems: Array<{ value: string; label: string }>,
    bullets: string[]
): DetailDrawerContent {
    return {
        title: value,
        subtitle: 'Species',
        description,
        lineItems,
        secondaryHeading: 'Notable species traits',
        bullets
    };
}

export function buildBackgroundEntryDetail(
    key: string,
    description: string,
    skills: string,
    tools: string,
    languages: string,
    bullets: string[]
): DetailDrawerContent {
    return {
        title: key,
        subtitle: 'Background',
        description,
        lineItems: [
            { value: skills, label: 'Skill proficiencies' },
            { value: tools, label: 'Tool proficiencies' },
            { value: languages, label: 'Languages' }
        ],
        secondaryHeading: 'Background details',
        bullets
    };
}

export function buildClassLevelDetail(
    className: string,
    level: number,
    description: string,
    lineItems: Array<{ value: string; label: string }>,
    bullets: string[]
): DetailDrawerContent {
    return {
        title: className,
        subtitle: `Level ${level} ${className}`,
        description,
        lineItems,
        secondaryHeading: 'Class profile',
        bullets
    };
}