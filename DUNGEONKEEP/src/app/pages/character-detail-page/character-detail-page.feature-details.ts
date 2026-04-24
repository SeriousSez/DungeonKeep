import type { DetailDrawerContent } from './character-detail-page.types';

// ---------------------------------------------------------------------------
// Parsed feature description
// ---------------------------------------------------------------------------

export interface ParsedFeatureText {
    baseDescription: string;
    chosenValues: string[];
    extraLines: string[];
}

export function parseFeatureDetailText(description: string): ParsedFeatureText {
    const chosenValues: string[] = [];
    const extraLines: string[] = [];
    const baseLines: string[] = [];

    for (const rawLine of description.split('\n')) {
        const line = rawLine.trim();
        if (!line) {
            if (baseLines.length > 0 && baseLines[baseLines.length - 1] !== '') {
                baseLines.push('');
            }
            continue;
        }

        if (line.startsWith('Chosen:')) {
            chosenValues.push(line.replace('Chosen:', '').trim());
            continue;
        }

        if (line.startsWith('Ability increase:')) {
            extraLines.push(line);
            continue;
        }

        baseLines.push(line);
    }

    return {
        baseDescription: baseLines.join('\n').trim(),
        chosenValues,
        extraLines
    };
}

// ---------------------------------------------------------------------------
// Wild Shape detail text (static)
// ---------------------------------------------------------------------------

export function getWildShapeDetailText(): string {
    return [
        'The power of nature allows you to assume the form of an animal. As a Bonus Action, you shape-shift into a Beast form you have learned for this feature. You stay in the form for a number of hours equal to half your Druid level or until you use Wild Shape again, have the Incapacitated condition, or die. You can also leave the form early as a Bonus Action.',
        '',
        '**Number of Uses:** You can use Wild Shape twice. You regain an expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain additional uses when you reach certain Druid levels, as shown in the Wild Shape column of the Druid Features table.',
        '',
        '**Known Forms:** You know four Beast forms for this feature, chosen among Beast stat blocks that have a maximum Challenge of 1/4 and a maximum Speed of 30 feet. Whenever you finish a Long Rest, you can replace one of your known forms with another eligible Beast form.',
        '',
        '**Beast Shapes:**',
        '| Druid Level | Known Forms | Max CR | Fly Speed |',
        '| --- | --- | --- | --- |',
        '| 2 | 4 | 1/4 | No |',
        '| 4 | 6 | 1/2 | No |',
        '| 8 | 8 | 1 | Yes |',
        '',
        '**Rules While Shape-Shifted:** While in a form, you retain your personality, memories, and ability to speak, and the following rules apply:',
        '',
        '**Temporary Hit Points.** When you assume a Wild Shape form, you gain a number of Temporary Hit Points equal to your Druid level.',
        '',
        '**Game Statistics.** Your game statistics are replaced by the Beast\'s stat block, but you retain your creature type; Hit Points; Hit Point Dice; Intelligence, Wisdom, and Charisma scores; class features; languages; and feats. You also retain your skill and saving throw proficiencies and use your Proficiency Bonus for them, in addition to gaining the proficiencies of the creature. If a skill or saving throw modifier in the Beast\'s stat block is higher than yours, use the one in the stat block.',
        '',
        '**No Spellcasting.** You can\'t cast spells, but shape-shifting doesn\'t break your Concentration or otherwise interfere with a spell you\'ve already cast.',
        '',
        '**Objects.** Your ability to handle objects is determined by the form\'s limbs rather than your own. In addition, you choose whether your equipment falls to the ground or merges into your new form, is worn by it, or is carried by it. Worn equipment functions as normal, but the DM decides whether it\'s practical for the new form to wear a piece of equipment based on the creature\'s size and shape. Your equipment doesn\'t change size or shape to match the new form, and any equipment that the new form can\'t wear must either fall to the ground or merge with the form. Equipment that merges with the form has no effect while you\'re in that form.'
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Brutal Strike (Barbarian) helpers
// ---------------------------------------------------------------------------

export function getBrutalStrikeDetailText(level: number): string {
    const damageDice = level >= 17 ? '2d10' : '1d10';
    const effectCount = level >= 17 ? 2 : 1;
    const effectLabel = effectCount === 1 ? 'effect' : 'effects';
    const lines = [
        `If you use Reckless Attack, you can forgo Advantage on one Strength-based attack of your choice on your turn. The chosen attack roll must not have Disadvantage. If the chosen attack roll hits, the target takes an extra ${damageDice} damage of the same type dealt by the weapon or Unarmed Strike, and you can cause ${effectCount} Brutal Strike ${effectLabel} of your choice.`,
        '',
        '**Forceful Blow.** The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.',
        '',
        '**Hamstring Blow.** The target\u2019s Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time\u2014the most recent one.'
    ];

    if (level >= 13) {
        lines.push(
            '',
            '**Staggering Blow.** The target has Disadvantage on the next saving throw it makes, and it can\u2019t make Opportunity Attacks until the start of your next turn.',
            '',
            '**Sundering Blow.** Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus.'
        );
    }

    return lines.join('\n');
}

export function getBrutalStrikeActionLines(level: number): string[] {
    const lines = [
        'Brutal Strike: Forceful Blow: 1 Action',
        'Brutal Strike: Hamstring Blow: 1 Action'
    ];

    if (level >= 13) {
        lines.push('Brutal Strike: Staggering Blow: 1 Action');
        lines.push('Brutal Strike: Sundering Blow: 1 Action');
    }

    return lines;
}

// ---------------------------------------------------------------------------
// Tracker entry type alias
// ---------------------------------------------------------------------------

export type TrackerEntry = { entryId: string; maxUses: number; usedCount: number; resetLabel: string };

function clampUse(used: number | undefined, max: number): number {
    return Math.max(0, Math.min(max, used ?? 0));
}

// ---------------------------------------------------------------------------
// Druid feature detail builder
// ---------------------------------------------------------------------------

export function buildDruidFeatureDetail(
    name: string,
    parsed: ParsedFeatureText,
    usedCounts: Record<string, number>,
    wildShapeMaxUses: number,
    title: string
): DetailDrawerContent | null {
    switch (name) {
        case 'Druidic':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 80',
                description: parsed.baseDescription,
                actionLines: ['Leave Druidic Message: Special', 'Speak with Animals IR (1st)']
            };
        case 'Primal Order': {
            const selected = parsed.chosenValues[0] ?? '';
            const defaultLine = selected || 'Magician';
            const lines = [defaultLine];
            if (defaultLine.toLowerCase().includes('magician')) {
                lines.push('Druidcraft (Cantrip)');
            }
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 80',
                description: parsed.baseDescription,
                actionLines: lines
            };
        }
        case 'Wild Companion':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: ['Find Familiar IR (1st)']
            };
        case 'Druid Subclass':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? parsed.chosenValues : []
            };
        case 'Circle of the Land Spells':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 84',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines
            };
        case "Land's Aid":
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 85',
                description: parsed.baseDescription,
                actionLines: ["Land's Aid: Damage: 1 Action", "Land's Aid: Heal: 1 Action"]
            };
        case 'Natural Recovery':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 85',
                description: parsed.baseDescription,
                actionLines: ['Natural Recovery: Recover Spell Slots: Special', 'Natural Recovery: Cast Circle Spell: Special'],
                trackers: [
                    {
                        entryId: 'druid-natural-recovery-recover-slots',
                        maxUses: 1,
                        usedCount: clampUse(usedCounts['druid-natural-recovery-recover-slots'], 1),
                        resetLabel: 'Long Rest'
                    },
                    {
                        entryId: 'druid-natural-recovery-cast-circle-spell',
                        maxUses: 1,
                        usedCount: clampUse(usedCounts['druid-natural-recovery-cast-circle-spell'], 1),
                        resetLabel: 'Long Rest'
                    }
                ]
            };
        case 'Wild Resurgence':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: ['Wild Resurgence: Regain Wild Shape: (No Action)', 'Wild Resurgence: Regain Spell Slot: (No Action)'],
                trackers: [
                    {
                        entryId: 'druid-wild-resurgence-regain-spell-slot',
                        maxUses: 1,
                        usedCount: clampUse(usedCounts['druid-wild-resurgence-regain-spell-slot'], 1),
                        resetLabel: 'Long Rest'
                    }
                ]
            };
        case 'Elemental Fury':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: ['Primal Strike: 1 Action']
            };
        case "Nature's Ward":
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 85',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? parsed.chosenValues : []
            };
        case "Nature's Sanctuary":
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 86',
                description: parsed.baseDescription,
                actionLines: ["Nature's Sanctuary: 1 Action"]
            };
        case 'Improved Elemental Fury':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription
            };
        case 'Ability Score Improvement':
            return {
                title,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines
            };
        case 'Beast Spells':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription
            };
        case 'Epic Boon':
            return {
                title,
                subtitle: 'PHB-2024, pg. 81',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? ['Choose an Epic Boon feat', ...parsed.chosenValues] : []
            };
        case 'Archdruid':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 82',
                description: parsed.baseDescription,
                actionLines: ['Evergreen Wildshape: 1 Action', 'Nature Magician: (No Action)'],
                trackers: [
                    {
                        entryId: 'druid-archdruid-nature-magician',
                        maxUses: 1,
                        usedCount: clampUse(usedCounts['druid-archdruid-nature-magician'], 1),
                        resetLabel: 'Long Rest'
                    }
                ]
            };
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Barbarian feature detail builder
// ---------------------------------------------------------------------------

export function buildBarbarianFeatureDetail(
    name: string,
    parsed: ParsedFeatureText,
    usedCounts: Record<string, number>,
    title: string,
    charLevel: number
): DetailDrawerContent | null {
    switch (name) {
        case 'Relentless Rage':
            return { title: name, subtitle: 'PHB-2024, pg. 53', description: parsed.baseDescription };
        case 'Persistent Rage':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 53',
                description: parsed.baseDescription,
                actionLines: ['Rage: Regain Expended Uses: 1 Action'],
                tracker: {
                    entryId: 'barbarian-persistent-rage',
                    maxUses: 1,
                    usedCount: clampUse(usedCounts['barbarian-persistent-rage'], 1),
                    resetLabel: 'Long Rest'
                }
            };
        case 'Intimidating Presence':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 54',
                description: parsed.baseDescription,
                actionLines: ['Intimidating Presence: 1 Bonus Action'],
                tracker: {
                    entryId: 'barbarian-intimidating-presence',
                    maxUses: 1,
                    usedCount: clampUse(usedCounts['barbarian-intimidating-presence'], 1),
                    resetLabel: 'Long Rest'
                }
            };
        case 'Retaliation':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 54',
                description: parsed.baseDescription,
                actionLines: ['Retaliation: 1 Reaction']
            };
        case 'Instinctive Pounce':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 53',
                description: parsed.baseDescription,
                actionLines: ['Rage (Instinctive Pounce): 1 Bonus Action']
            };
        case 'Frenzy':
            return { title: name, subtitle: 'PHB-2024, pg. 54', description: parsed.baseDescription };
        case 'Primal Knowledge':
            return {
                title: name,
                subtitle: 'PHB-2024, pg. 52',
                description: parsed.baseDescription,
                actionLines: [
                    ...(parsed.chosenValues.length ? parsed.chosenValues : []),
                    'Rage: Primal Knowledge: Special'
                ]
            };
        case 'Weapon Mastery': {
            const selected = parsed.chosenValues[0] ?? '';
            const masteryMatch = selected.match(/^(.*) \((.*)\)$/);
            const actionLine = masteryMatch
                ? `${masteryMatch[2]} (${masteryMatch[1]}): 1 Action`
                : selected ? `${selected}: 1 Action` : '';
            return {
                title,
                subtitle: 'PHB-2024',
                description: parsed.baseDescription,
                actionLines: [selected, actionLine].filter((line) => !!line)
            };
        }
        case 'Ability Score Improvement':
            return {
                title,
                subtitle: 'PHB-2024, pg. 53',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? parsed.chosenValues : (parsed.extraLines.length ? parsed.extraLines : [])
            };
        case 'Epic Boon':
            return {
                title,
                subtitle: 'PHB-2024, pg. 53',
                description: parsed.baseDescription,
                actionLines: parsed.chosenValues.length ? ['Feat', ...parsed.chosenValues] : []
            };
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Rogue feature detail builder
// ---------------------------------------------------------------------------

export function buildRogueFeatureDetail(
    name: string,
    parsed: ParsedFeatureText,
    usedCounts: Record<string, number>,
    title: string
): DetailDrawerContent | null {
    if (name === 'Stroke of Luck') {
        return {
            title,
            subtitle: 'PHB-2024, pg. 131',
            description: parsed.baseDescription || 'If you fail a D20 Test, you can turn the roll into a 20. Once you use this feature, you can\u2019t use it again until you finish a Short or Long Rest.',
            actionLines: ['Stroke of Luck: Special'],
            tracker: {
                entryId: 'rogue-stroke-of-luck',
                maxUses: 1,
                usedCount: clampUse(usedCounts['rogue-stroke-of-luck'], 1),
                resetLabel: 'Short Rest'
            }
        };
    }

    return null;
}

// ---------------------------------------------------------------------------
// Feature inline action lines (pure helpers by class)
// ---------------------------------------------------------------------------

export function getDruidFeatureActionLines(featureName: string, parsed: ParsedFeatureText): string[] {
    switch (featureName) {
        case 'Wild Shape':
            return ['Wild Shape: 1 Bonus Action'];
        case 'Druidic':
            return ['Leave Druidic Message: Special', 'Speak with Animals IR (1st)'];
        case 'Primal Order': {
            const selected = parsed.chosenValues[0] ?? 'Magician';
            return selected.toLowerCase().includes('magician')
                ? [selected, 'Druidcraft (Cantrip)']
                : [selected];
        }
        case 'Wild Companion':
            return ['Find Familiar IR (1st)'];
        case 'Druid Subclass':
            return parsed.chosenValues;
        case 'Circle of the Land Spells':
            return parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines;
        case "Land's Aid":
            return ["Land's Aid: Damage: 1 Action", "Land's Aid: Heal: 1 Action"];
        case 'Natural Recovery':
            return ['Natural Recovery: Recover Spell Slots: Special', 'Natural Recovery: Cast Circle Spell: Special'];
        case 'Wild Resurgence':
            return ['Wild Resurgence: Regain Wild Shape: (No Action)', 'Wild Resurgence: Regain Spell Slot: (No Action)'];
        case 'Elemental Fury':
            return ['Primal Strike: 1 Action'];
        case "Nature's Ward":
            return parsed.chosenValues;
        case "Nature's Sanctuary":
            return ["Nature's Sanctuary: 1 Action"];
        case 'Ability Score Improvement':
            return parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines;
        case 'Epic Boon':
            return parsed.chosenValues;
        case 'Archdruid':
            return ['Evergreen Wildshape: 1 Action', 'Nature Magician: (No Action)'];
        default:
            return [];
    }
}

export function getRogueFeatureActionLines(featureName: string, parsed: ParsedFeatureText): string[] {
    switch (featureName) {
        case 'Cunning Action':
            return ['Cunning Action: 1 Bonus Action'];
        case 'Steady Aim':
            return ['Steady Aim: 1 Bonus Action'];
        case 'Uncanny Dodge':
            return ['Uncanny Dodge: 1 Reaction'];
        case 'Stroke of Luck':
            return ['Stroke of Luck: Special'];
        case 'Ability Score Improvement':
            return parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines;
        case 'Epic Boon':
            return parsed.chosenValues.length ? ['Feat', ...parsed.chosenValues] : [];
        default:
            return [];
    }
}

export function getBarbarianFeatureActionLines(
    featureName: string,
    parsed: ParsedFeatureText,
    charLevel: number
): string[] {
    switch (featureName) {
        case 'Brutal Strike':
        case 'Improved Brutal Strike':
            return getBrutalStrikeActionLines(charLevel);
        case 'Retaliation':
            return ['Retaliation: 1 Reaction'];
        case 'Instinctive Pounce':
            return ['Rage (Instinctive Pounce): 1 Bonus Action'];
        case 'Persistent Rage':
            return ['Rage: Regain Expended Uses: 1 Action'];
        case 'Intimidating Presence':
            return ['Intimidating Presence: 1 Bonus Action'];
        case 'Primal Knowledge':
            return [...parsed.chosenValues, 'Rage: Primal Knowledge: Special'];
        case 'Weapon Mastery': {
            const selected = parsed.chosenValues[0] ?? '';
            const masteryMatch = selected.match(/^(.*) \((.*)\)$/);
            const actionLine = masteryMatch
                ? `${masteryMatch[2]} (${masteryMatch[1]}): 1 Action`
                : selected ? `${selected}: 1 Action` : '';
            return [selected, actionLine].filter((line) => !!line);
        }
        case 'Ability Score Improvement':
            return parsed.chosenValues.length ? parsed.chosenValues : parsed.extraLines;
        case 'Epic Boon':
            return parsed.chosenValues.length ? ['Feat', ...parsed.chosenValues] : [];
        default:
            return [];
    }
}

// ---------------------------------------------------------------------------
// Feature inline tracker builders
// ---------------------------------------------------------------------------

export function getDruidFeatureInlineTrackers(
    featureName: string,
    usedCounts: Record<string, number>,
    wildShapeMaxUses: number
): TrackerEntry[] {
    if (featureName === 'Wild Resurgence') {
        return [{
            entryId: 'druid-wild-resurgence-regain-spell-slot',
            maxUses: 1,
            usedCount: clampUse(usedCounts['druid-wild-resurgence-regain-spell-slot'], 1),
            resetLabel: 'Long Rest'
        }];
    }

    if (featureName === 'Natural Recovery') {
        return [
            {
                entryId: 'druid-natural-recovery-recover-slots',
                maxUses: 1,
                usedCount: clampUse(usedCounts['druid-natural-recovery-recover-slots'], 1),
                resetLabel: 'Long Rest'
            },
            {
                entryId: 'druid-natural-recovery-cast-circle-spell',
                maxUses: 1,
                usedCount: clampUse(usedCounts['druid-natural-recovery-cast-circle-spell'], 1),
                resetLabel: 'Long Rest'
            }
        ];
    }

    return [];
}

export function getDruidFeatureInlineTracker(
    featureName: string,
    usedCounts: Record<string, number>,
    wildShapeMaxUses: number
): TrackerEntry | null {
    if (featureName === 'Wild Shape') {
        return {
            entryId: 'druid-wild-shape',
            maxUses: wildShapeMaxUses,
            usedCount: clampUse(usedCounts['druid-wild-shape'], wildShapeMaxUses),
            resetLabel: 'Long Rest'
        };
    }

    if (featureName === 'Wild Resurgence') {
        return {
            entryId: 'druid-wild-resurgence-regain-spell-slot',
            maxUses: 1,
            usedCount: clampUse(usedCounts['druid-wild-resurgence-regain-spell-slot'], 1),
            resetLabel: 'Long Rest'
        };
    }

    if (featureName === 'Natural Recovery') {
        return {
            entryId: 'druid-natural-recovery-cast-circle-spell',
            maxUses: 1,
            usedCount: clampUse(usedCounts['druid-natural-recovery-cast-circle-spell'], 1),
            resetLabel: 'Long Rest'
        };
    }

    if (featureName === 'Archdruid') {
        return {
            entryId: 'druid-archdruid-nature-magician',
            maxUses: 1,
            usedCount: clampUse(usedCounts['druid-archdruid-nature-magician'], 1),
            resetLabel: 'Long Rest'
        };
    }

    return null;
}

export function getRogueFeatureInlineTracker(
    featureName: string,
    usedCounts: Record<string, number>
): TrackerEntry | null {
    if (featureName === 'Stroke of Luck') {
        return {
            entryId: 'rogue-stroke-of-luck',
            maxUses: 1,
            usedCount: clampUse(usedCounts['rogue-stroke-of-luck'], 1),
            resetLabel: 'Short Rest'
        };
    }

    return null;
}

export function getBarbarianFeatureInlineTracker(
    featureName: string,
    usedCounts: Record<string, number>
): TrackerEntry | null {
    if (featureName === 'Persistent Rage') {
        return {
            entryId: 'barbarian-persistent-rage',
            maxUses: 1,
            usedCount: clampUse(usedCounts['barbarian-persistent-rage'], 1),
            resetLabel: 'Long Rest'
        };
    }

    if (featureName === 'Intimidating Presence') {
        return {
            entryId: 'barbarian-intimidating-presence',
            maxUses: 1,
            usedCount: clampUse(usedCounts['barbarian-intimidating-presence'], 1),
            resetLabel: 'Long Rest'
        };
    }

    return null;
}
