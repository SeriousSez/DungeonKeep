import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.resolve(__dirname, '../public/assets/data/dnd_monsters.csv');
const outputPath = path.resolve(__dirname, '../src/app/data/monster-catalog.generated.ts');

const csv = await readFile(csvPath, 'utf8');
const rows = parseCsvRows(csv);

if (rows.length <= 1) {
    throw new Error('Monster CSV did not contain any data rows.');
}

const baseEntries = rows
    .slice(1)
    .map((row) => mapMonsterCatalogRow(row))
    .filter((entry) => entry !== null);

const entries = await mapWithConcurrency(baseEntries, 3, async (entry) => enrichFromSource(entry));
const finalizedEntries = entries.map((entry) => applyManualOverride(entry));

const output = [
    "import type { MonsterCatalogEntry } from '../models/monster-reference.models';",
    '',
    'export const monsterCatalog: ReadonlyArray<MonsterCatalogEntry> = ',
    `${JSON.stringify(finalizedEntries, null, 4)} as const;`,
    ''
].join('\n');

await writeFile(outputPath, output, 'utf8');

async function mapWithConcurrency(items, concurrency, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
    await Promise.all(workers);
    return results;
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichFromSource(entry) {
    const enrichmentUrl = resolveAideddSourceUrl(entry);
    if (!enrichmentUrl) {
        return entry;
    }

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await fetch(enrichmentUrl, {
                headers: {
                    'user-agent': 'DungeonKeep Monster Sync/1.0'
                }
            });

            if (!response.ok) {
                if (attempt < maxAttempts) {
                    await delay(attempt * 300);
                    continue;
                }
                return entry;
            }

            const html = await response.text();
            if (/This creature does not exist/i.test(html)) {
                return entry;
            }

            const stats = parseAideddStats(html);
            if (!stats) {
                if (attempt < maxAttempts) {
                    await delay(attempt * 300);
                    continue;
                }
                return entry;
            }

            return {
                ...entry,
                sourceUrl: entry.sourceUrl || enrichmentUrl,
                armorClass: stats.armorClass ?? entry.armorClass,
                hitPoints: stats.hitPoints ?? entry.hitPoints,
                speed: stats.speed || entry.speed,
                savingThrows: stats.savingThrows || entry.savingThrows,
                skills: stats.skills || entry.skills,
                damageVulnerabilities: stats.damageVulnerabilities || entry.damageVulnerabilities,
                damageResistances: stats.damageResistances || entry.damageResistances,
                damageImmunities: stats.damageImmunities || entry.damageImmunities,
                conditionImmunities: stats.conditionImmunities || entry.conditionImmunities,
                senses: stats.senses || entry.senses,
                languages: stats.languages || entry.languages,
                challengeXp: stats.challengeXp || entry.challengeXp,
                traits: stats.traits.length ? stats.traits : entry.traits,
                actions: stats.actions.length ? stats.actions : entry.actions,
                reactions: stats.reactions.length ? stats.reactions : entry.reactions,
                legendaryActions: stats.legendaryActions.length ? stats.legendaryActions : entry.legendaryActions,
                abilityScores: {
                    strength: stats.abilityScores.strength ?? entry.abilityScores.strength,
                    dexterity: stats.abilityScores.dexterity ?? entry.abilityScores.dexterity,
                    constitution: stats.abilityScores.constitution ?? entry.abilityScores.constitution,
                    intelligence: stats.abilityScores.intelligence ?? entry.abilityScores.intelligence,
                    wisdom: stats.abilityScores.wisdom ?? entry.abilityScores.wisdom,
                    charisma: stats.abilityScores.charisma ?? entry.abilityScores.charisma
                }
            };
        } catch {
            if (attempt < maxAttempts) {
                await delay(attempt * 300);
                continue;
            }
            return entry;
        }
    }

    return entry;
}

function resolveAideddSourceUrl(entry) {
    if (entry.sourceUrl && entry.sourceUrl.includes('aidedd.org')) {
        return entry.sourceUrl;
    }

    if (!entry.slug) {
        return null;
    }

    return `https://www.aidedd.org/dnd/monstres.php?vo=${entry.slug}`;
}

function applyManualOverride(entry) {
    const override = getManualMonsterOverride(entry.slug);
    if (!override) {
        return entry;
    }

    return {
        ...entry,
        ...override,
        abilityScores: {
            ...entry.abilityScores,
            ...(override.abilityScores ?? {})
        },
        traits: override.traits ?? entry.traits,
        actions: override.actions ?? entry.actions,
        reactions: override.reactions ?? entry.reactions,
        legendaryActions: override.legendaryActions ?? entry.legendaryActions
    };
}

function getManualMonsterOverride(slug) {
    if (slug === 'abjurer') {
        return {
            speed: '30 ft.',
            savingThrows: 'Int +8, Wis +5',
            skills: 'Arcana +8, History +8',
            senses: 'passive Perception 11',
            languages: 'any four languages',
            challengeXp: '5,000 XP',
            traits: [
                {
                    title: 'Spellcasting',
                    text: 'The abjurer is a 13th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 16, +8 to hit with spell attacks). It has the following wizard spells prepared: cantrips (at will) blade ward, dancing lights, mending, message, ray of frost; 1st level (4 slots) alarm, mage armor, magic missile, shield; 2nd level (3 slots) arcane lock, invisibility; 3rd level (3 slots) counterspell, dispel magic, fireball; 4th level (3 slots) banishment, stoneskin; 5th level (2 slots) cone of cold, wall of force; 6th level (1 slot) flesh to stone, globe of invulnerability; 7th level (1 slot) symbol, teleport.'
                },
                {
                    title: 'Arcane Ward',
                    text: 'The abjurer has a magical ward with 30 hit points. Whenever it takes damage, the ward takes the damage instead. If the ward is reduced to 0 hit points, the abjurer takes any remaining damage. When the abjurer casts an abjuration spell of 1st level or higher, the ward regains a number of hit points equal to twice the level of the spell.'
                }
            ],
            actions: [
                {
                    title: 'Quarterstaff',
                    text: 'Melee Weapon Attack : +3 to hit, reach 5 ft., one target. Hit : 2 (1d6 - 1) bludgeoning damage, or 3 (1d8 - 1) bludgeoning damage if used with two hands.'
                }
            ],
            abilityScores: {
                strength: 9,
                dexterity: 14,
                constitution: 14,
                intelligence: 18,
                wisdom: 12,
                charisma: 11
            }
        };
    }

    if (slug === 'acolyte') {
        return {
            speed: '30 ft.',
            skills: 'Medicine +4, Religion +2',
            senses: 'passive Perception 12',
            languages: 'any one language (usually Common)',
            challengeXp: '50 XP',
            traits: [
                {
                    title: 'Spellcasting',
                    text: 'The acolyte is a 1st-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). It has the following cleric spells prepared: cantrips (at will) light, sacred flame, thaumaturgy; 1st level (3 slots) bless, cure wounds, sanctuary.'
                }
            ],
            actions: [
                {
                    title: 'Club',
                    text: 'Melee Weapon Attack : +2 to hit, reach 5 ft., one target. Hit : 2 (1d4) bludgeoning damage.'
                }
            ],
            abilityScores: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 14,
                charisma: 11
            }
        };
    }

    if (slug === 'albino-dwarf-warrior') {
        return {
            speed: '25 ft.',
            skills: 'Perception +4, Stealth +3, Survival +4',
            senses: 'Darkvision 60 ft., passive Perception 14',
            languages: 'Common, Dwarvilsh',
            challengeXp: '50 XP',
            damageResistances: 'Poison',
            traits: [
                {
                    title: 'Dwarven Resilience',
                    text: 'The dwarf has advantage on saving throws against poison.'
                }
            ],
            actions: [
                {
                    title: 'Handaxe',
                    text: 'Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) slashing damage.'
                }
            ],
            abilityScores: {
                strength: 13,
                dexterity: 13,
                constitution: 17,
                intelligence: 12,
                wisdom: 14,
                charisma: 11
            }
        };
    }

    if (slug === 'aldani') {
        return {
            speed: '20 ft., Swim 30 ft.',
            skills: 'Perception +4, Survival +4',
            senses: 'Darkvision 60 ft., passive Perception 14',
            languages: 'Common',
            challengeXp: '200 XP',
            traits: [
                {
                    title: 'Amphibious',
                    text: 'The aldani can breathe air and water.'
                }
            ],
            actions: [
                {
                    title: 'Multiattack',
                    text: 'The aldani makes two attacks with its claws.'
                },
                {
                    title: 'Claw',
                    text: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) slashing damage, and the target is grappled (escape DC 11). The aldani has two claws, each of which can grapple only one target.'
                }
            ],
            abilityScores: {
                strength: 13,
                dexterity: 8,
                constitution: 12,
                intelligence: 10,
                wisdom: 14,
                charisma: 10
            }
        };
    }

    return null;
}

function parseAideddStats(html) {
    const text = normalizeHtmlText(html);

    const armorClassMatch = text.match(/Armor Class\s+(\d+)/i);
    const hitPointsMatch = text.match(/Hit Points\s+(\d+)/i);
    const speedMatch = text.match(/Speed\s+(.+?)(?=\s+STR\b|\s+Saving Throws\b|\s+Skills\b|\s+Senses\b|\s+Languages\b|\s+Challenge\b|$)/i);
    const abilityMatch = text.match(/STR\s*(\d+)[\s\S]*?DEX\s*(\d+)[\s\S]*?CON\s*(\d+)[\s\S]*?INT\s*(\d+)[\s\S]*?WIS\s*(\d+)[\s\S]*?CHA\s*(\d+)/i);
    const challengeMatch = text.match(/Challenge\s+([^\s]+)\s*\(([^)]+)\)/i);
    const savingThrows = extractLabeledValue(text, 'Saving Throws', ['Skills', 'Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const skills = extractLabeledValue(text, 'Skills', ['Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const damageVulnerabilities = extractLabeledValue(text, 'Damage Vulnerabilities', ['Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const damageResistances = extractLabeledValue(text, 'Damage Resistances', ['Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const damageImmunities = extractLabeledValue(text, 'Damage Immunities', ['Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const conditionImmunities = extractLabeledValue(text, 'Condition Immunities', ['Senses', 'Languages', 'Challenge']);
    const senses = extractLabeledValue(text, 'Senses', ['Languages', 'Challenge']);
    const languages = extractLabeledValue(text, 'Languages', ['Challenge']);
    const actionsHeadingIndex = html.indexOf("<div class='rub'>Actions</div>");
    const reactionsHeadingIndex = html.indexOf("<div class='rub'>Reactions</div>");
    const legendaryHeadingIndex = html.indexOf("<div class='rub'>Legendary actions</div>");
    const challengeIndex = html.indexOf('<strong>Challenge</strong>');
    const firstTraitParagraphIndex = challengeIndex >= 0 ? html.indexOf('<p>', challengeIndex) : -1;
    const traitsHtml = firstTraitParagraphIndex >= 0 && actionsHeadingIndex > firstTraitParagraphIndex
        ? html.slice(firstTraitParagraphIndex, actionsHeadingIndex)
        : '';
    const actionsHtml = extractRubSectionHtml(html, 'Actions', ['Reactions', 'Legendary actions']);
    const reactionsHtml = extractRubSectionHtml(html, 'Reactions', ['Legendary actions']);
    const legendaryActionsHtml = extractRubSectionHtml(html, 'Legendary actions', []);

    if (!armorClassMatch && !hitPointsMatch && !speedMatch && !abilityMatch) {
        return null;
    }

    return {
        armorClass: armorClassMatch ? Number.parseInt(armorClassMatch[1], 10) : null,
        hitPoints: hitPointsMatch ? Number.parseInt(hitPointsMatch[1], 10) : null,
        speed: speedMatch ? normalizeSpeed(speedMatch[1]) : '',
        savingThrows,
        skills,
        damageVulnerabilities,
        damageResistances,
        damageImmunities,
        conditionImmunities,
        senses,
        languages,
        challengeXp: challengeMatch ? challengeMatch[2].trim() : '',
        traits: parseParagraphEntries(traitsHtml),
        actions: parseParagraphEntries(actionsHtml),
        reactions: parseParagraphEntries(reactionsHtml),
        legendaryActions: parseParagraphEntries(legendaryActionsHtml, true),
        abilityScores: {
            strength: abilityMatch ? Number.parseInt(abilityMatch[1], 10) : null,
            dexterity: abilityMatch ? Number.parseInt(abilityMatch[2], 10) : null,
            constitution: abilityMatch ? Number.parseInt(abilityMatch[3], 10) : null,
            intelligence: abilityMatch ? Number.parseInt(abilityMatch[4], 10) : null,
            wisdom: abilityMatch ? Number.parseInt(abilityMatch[5], 10) : null,
            charisma: abilityMatch ? Number.parseInt(abilityMatch[6], 10) : null
        }
    };
}

function normalizeHtmlText(html) {
    return decodeHtmlEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
    ).trim();
}

function decodeHtmlEntities(value) {
    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&eacute;/gi, 'e')
        .replace(/&egrave;/gi, 'e')
        .replace(/&ecirc;/gi, 'e')
        .replace(/&agrave;/gi, 'a')
        .replace(/&uuml;/gi, 'u')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)));
}

function normalizeSpeed(value) {
    return value
        .replace(/\s*ft\.?/gi, ' ft.')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractLabeledValue(text, label, nextLabels) {
    const nextPattern = nextLabels.map((item) => escapeRegExp(item)).join('|');
    const lookahead = nextPattern ? `(?=\\s+(?:${nextPattern})\\s+|$)` : '(?=$)';
    const pattern = new RegExp(`${escapeRegExp(label)}\\s+([\\s\\S]*?)${lookahead}`, 'i');
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
}

function extractRubSectionHtml(html, heading, nextHeadings) {
    const startMarker = `<div class='rub'>${heading}</div>`;
    const startIndex = html.indexOf(startMarker);
    if (startIndex < 0) {
        return '';
    }

    let endIndex = html.length;
    for (const nextHeading of nextHeadings) {
        const nextMarker = `<div class='rub'>${nextHeading}</div>`;
        const nextIndex = html.indexOf(nextMarker, startIndex + startMarker.length);
        if (nextIndex >= 0 && nextIndex < endIndex) {
            endIndex = nextIndex;
        }
    }

    const descriptionIndex = html.indexOf("<div class='orange'></div>", startIndex + startMarker.length);
    if (descriptionIndex >= 0 && descriptionIndex < endIndex) {
        endIndex = descriptionIndex;
    }

    return html.slice(startIndex + startMarker.length, endIndex);
}

function parseParagraphEntries(sectionHtml, includeUntitledParagraphs = false) {
    if (!sectionHtml) {
        return [];
    }

    const entries = [];
    const paragraphMatches = Array.from(sectionHtml.matchAll(/<p>([\s\S]*?)<\/p>/gi));

    for (const match of paragraphMatches) {
        const paragraphHtml = match[1].trim();
        const titledMatch = paragraphHtml.match(/<strong>(?:<em>)?([\s\S]*?)(?:<\/em>)?<\/strong>\.\s*([\s\S]*)/i);
        if (titledMatch) {
            const title = cleanInlineHtmlText(titledMatch[1]);
            const text = cleanInlineHtmlText(titledMatch[2]);
            if (title && text) {
                entries.push({ title, text });
            }
            continue;
        }

        if (includeUntitledParagraphs) {
            const text = cleanInlineHtmlText(paragraphHtml);
            if (text) {
                entries.push({ title: '', text });
            }
        }
    }

    return entries;
}

function cleanInlineHtmlText(value) {
    return decodeHtmlEntities(
        value
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
    ).trim();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCsvRows(input) {
    const rows = [];
    let currentRow = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < input.length; index += 1) {
        const char = input[index];
        const nextChar = input[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentValue += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }

            continue;
        }

        if (char === ',' && !inQuotes) {
            currentRow.push(currentValue);
            currentValue = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                index += 1;
            }

            currentRow.push(currentValue);
            if (currentRow.some((value) => value.length > 0)) {
                rows.push(currentRow);
            }

            currentRow = [];
            currentValue = '';
            continue;
        }

        currentValue += char;
    }

    if (currentValue.length > 0 || currentRow.length > 0) {
        currentRow.push(currentValue);
        if (currentRow.some((value) => value.length > 0)) {
            rows.push(currentRow);
        }
    }

    return rows;
}

function mapMonsterCatalogRow(row) {
    const slug = (row[0] ?? '').trim();
    if (!slug) {
        return null;
    }

    const sourceUrl = (row[1] ?? '').trim();
    const challengeRating = (row[2] ?? '').trim();
    const rawType = (row[3] ?? '').trim();
    const size = normalizeLabel(row[4] ?? '');
    const armorClass = parseInteger(row[5] ?? '');
    const hitPoints = parseInteger(row[6] ?? '');
    const speed = (row[7] ?? '').trim();
    const alignment = (row[8] ?? '').trim();
    const legendary = (row[9] ?? '').trim().toLowerCase() === 'legendary';
    const sourceLabel = (row[10] ?? '').trim();

    return {
        id: `monster-${slug}`,
        slug,
        name: formatMonsterName(slug),
        sourceUrl,
        challengeRating,
        creatureType: normalizeCreatureType(rawType),
        creatureCategory: deriveCreatureCategory(rawType),
        size,
        armorClass,
        hitPoints,
        speed,
        alignment,
        legendary,
        sourceLabel,
        savingThrows: '',
        skills: '',
        damageVulnerabilities: '',
        damageResistances: '',
        damageImmunities: '',
        conditionImmunities: '',
        senses: '',
        languages: '',
        challengeXp: '',
        traits: [],
        actions: [],
        reactions: [],
        legendaryActions: [],
        abilityScores: {
            strength: parseAbilityScore(row[11] ?? ''),
            dexterity: parseAbilityScore(row[12] ?? ''),
            constitution: parseAbilityScore(row[13] ?? ''),
            intelligence: parseAbilityScore(row[14] ?? ''),
            wisdom: parseAbilityScore(row[15] ?? ''),
            charisma: parseAbilityScore(row[16] ?? '')
        }
    };
}

function formatMonsterName(value) {
    const normalized = value.replace(/[-_]+/g, ' ').trim();
    if (!normalized) {
        return 'Unknown Monster';
    }

    return normalized
        .split(/\s+/)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function normalizeLabel(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeCreatureType(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return 'Unknown';
    }

    return trimmed
        .split(',')
        .map((segment) => normalizeLabel(segment.trim()))
        .join(', ');
}

function deriveCreatureCategory(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return 'Other';
    }

    const base = trimmed.split('(')[0].split(',')[0].trim();
    if (!base) {
        return 'Other';
    }

    return base.charAt(0).toUpperCase() + base.slice(1);
}

function parseInteger(value) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function parseAbilityScore(value) {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}