import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../src/app/data/monster-catalog.generated.ts');
const BESTIARY_INDEX_URL = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/index.json';
const BESTIARY_BASE_URL = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/';

const SOURCE_CODE_MAP = {
    "Volo's Guide to Monsters": ['VGM'],
    "Mordenkainen's Tome of Foes": ['MTF'],
    'Adventures (Tomb of Annihilation)': ['ToA'],
    'Adventures (Descent into Avernus)': ['BGDIA'],
    "Adventures (Storm King's Thunder)": ['SKT'],
    'Monster Manual': ['MM'],
    'Monster Manual (SRD)': ['MM'],
    'Essentials Kit': ['DIP'],
    'Adventures (Dungeon of the Mad Mage)': ['WDMM'],
    'Adventures (Tyranny of Dragons)': ['ToD', 'HotDQ', 'RoT'],
    'Adventures (Princes of the Apocalypse)': ['PotA'],
    'Adventures (Dragon Heist)': ['WDH'],
    'Adventures (Curse of Strahd)': ['CoS']
};

const CR_XP = {
    '0': '10 XP',
    '1/8': '25 XP',
    '1/4': '50 XP',
    '1/2': '100 XP',
    '1': '200 XP',
    '2': '450 XP',
    '3': '700 XP',
    '4': '1100 XP',
    '5': '1800 XP',
    '6': '2300 XP',
    '7': '2900 XP',
    '8': '3900 XP',
    '9': '5000 XP',
    '10': '5900 XP',
    '11': '7200 XP',
    '12': '8400 XP',
    '13': '10000 XP',
    '14': '11500 XP',
    '15': '13000 XP',
    '16': '15000 XP',
    '17': '18000 XP',
    '18': '20000 XP',
    '19': '22000 XP',
    '20': '25000 XP',
    '21': '33000 XP',
    '22': '41000 XP',
    '23': '50000 XP',
    '24': '62000 XP',
    '25': '75000 XP',
    '26': '90000 XP',
    '27': '105000 XP',
    '28': '120000 XP',
    '29': '135000 XP',
    '30': '155000 XP'
};

const source = await readFile(catalogPath, 'utf8');
const arrayStart = source.indexOf('[');
const arrayEnd = source.lastIndexOf('] as const;');

if (arrayStart < 0 || arrayEnd < 0) {
    throw new Error('Could not locate catalog array in generated file.');
}

const entries = JSON.parse(source.slice(arrayStart, arrayEnd + 1));
const allMonsters = await loadAll5eToolsMonsters();

const byName = new Map();
const bySlug = new Map();
for (const monster of allMonsters) {
    const nameKey = normalizeName(monster.name);
    if (!byName.has(nameKey)) {
        byName.set(nameKey, []);
    }
    byName.get(nameKey).push(monster);

    const slugKey = toSlug(monster.name);
    if (!bySlug.has(slugKey)) {
        bySlug.set(slugKey, []);
    }
    bySlug.get(slugKey).push(monster);
}

let updatedCount = 0;
for (const entry of entries) {
    if (!isEntryMissingData(entry)) {
        continue;
    }

    const matched = findBestMonsterMatch(entry, byName, bySlug, allMonsters);
    if (!matched) {
        continue;
    }

    const patch = map5eToolsMonster(matched, entry.slug);

    const before = JSON.stringify(entry);
    mergeMissingFields(entry, patch);
    const after = JSON.stringify(entry);

    if (before !== after) {
        updatedCount += 1;
    }
}

const output = [
    "import type { MonsterCatalogEntry } from '../models/monster-reference.models';",
    '',
    'export const monsterCatalog: ReadonlyArray<MonsterCatalogEntry> =',
    `    ${JSON.stringify(entries, null, 4)} as const;`,
    ''
].join('\n');

await writeFile(catalogPath, output, 'utf8');
console.log(`Backfilled ${updatedCount} monster entries from 5e.tools data.`);

function isEntryMissingData(entry) {
    if (!entry.speed || !entry.challengeXp || !entry.senses || !entry.languages) {
        return true;
    }

    if (Object.values(entry.abilityScores || {}).some((score) => score === null)) {
        return true;
    }

    if (!entry.actions?.length) {
        return true;
    }

    return false;
}

async function loadAll5eToolsMonsters() {
    const indexRes = await fetch(BESTIARY_INDEX_URL);
    if (!indexRes.ok) {
        throw new Error(`Failed to load bestiary index (${indexRes.status}).`);
    }

    const index = await indexRes.json();
    const fileNames = [...new Set(Object.values(index))];

    const all = [];
    for (const fileName of fileNames) {
        const fileRes = await fetch(`${BESTIARY_BASE_URL}${fileName}`);
        if (!fileRes.ok) {
            continue;
        }

        const data = await fileRes.json();
        const monsters = Array.isArray(data.monster) ? data.monster : [];
        for (const monster of monsters) {
            if (!monster?.name || !monster?.source) {
                continue;
            }
            all.push(monster);
        }
    }

    return all;
}

function findBestMonsterMatch(entry, byName, bySlug, allMonsters) {
    const nameMatches = byName.get(normalizeName(entry.name)) ?? [];
    const slugMatches = bySlug.get(entry.slug) ?? [];

    const combined = dedupeMonsters([...slugMatches, ...nameMatches]);
    const preferredSources = SOURCE_CODE_MAP[entry.sourceLabel] ?? [];

    if (!combined.length) {
        const scoped = preferredSources.length
            ? allMonsters.filter((monster) => preferredSources.includes(monster.source))
            : allMonsters;
        return findClosestBySlug(entry.slug, scoped);
    }

    if (preferredSources.length) {
        const sourceMatches = combined.filter((m) => preferredSources.includes(m.source));
        const sourceMatch = sourceMatches.length
            ? findClosestBySlug(entry.slug, sourceMatches)
            : null;
        if (sourceMatch) {
            return sourceMatch;
        }
    }

    return findClosestBySlug(entry.slug, combined) ?? combined[0];
}

function findClosestBySlug(targetSlug, monsters) {
    if (!monsters.length) {
        return null;
    }

    let bestMonster = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const monster of monsters) {
        const distance = levenshtein(targetSlug, toSlug(monster.name));
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMonster = monster;
        }
    }

    if (bestDistance <= 4) {
        return bestMonster;
    }

    return null;
}

function dedupeMonsters(monsters) {
    const seen = new Set();
    const deduped = [];

    for (const monster of monsters) {
        const key = `${monster.name}|${monster.source}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(monster);
    }

    return deduped;
}

function map5eToolsMonster(monster, slug) {
    const traits = [
        ...(monster.trait ?? []),
        ...mapSpellcastingToTraits(monster.spellcasting ?? [])
    ].map(mapSectionEntry).filter((entry) => entry.text);

    return {
        sourceUrl: `https://5e.tools/bestiary/${slug}-${String(monster.source).toLowerCase()}.html`,
        armorClass: parseArmorClass(monster.ac),
        hitPoints: monster.hp?.average ?? null,
        speed: formatSpeed(monster.speed),
        savingThrows: formatBonuses(monster.save, ['str', 'dex', 'con', 'int', 'wis', 'cha']),
        skills: formatBonuses(monster.skill),
        damageVulnerabilities: formatDamageList(monster.vulnerable),
        damageResistances: formatDamageList(monster.resist),
        damageImmunities: formatDamageList(monster.immune),
        conditionImmunities: formatDamageList(monster.conditionImmune),
        senses: formatSenses(monster),
        languages: formatLanguages(monster.languages),
        challengeXp: formatChallengeXp(monster.cr),
        traits,
        actions: (monster.action ?? []).map(mapSectionEntry).filter((entry) => entry.text),
        reactions: (monster.reaction ?? []).map(mapSectionEntry).filter((entry) => entry.text),
        legendaryActions: (monster.legendary ?? []).map(mapSectionEntry).filter((entry) => entry.text),
        abilityScores: {
            strength: monster.str ?? null,
            dexterity: monster.dex ?? null,
            constitution: monster.con ?? null,
            intelligence: monster.int ?? null,
            wisdom: monster.wis ?? null,
            charisma: monster.cha ?? null
        }
    };
}

function parseArmorClass(ac) {
    if (!Array.isArray(ac) || !ac.length) {
        return null;
    }

    const first = ac[0];
    if (typeof first === 'number') {
        return first;
    }

    if (typeof first === 'object' && typeof first.ac === 'number') {
        return first.ac;
    }

    return null;
}

function formatSpeed(speed) {
    if (!speed) {
        return '';
    }

    if (typeof speed === 'string') {
        return cleanupText(speed);
    }

    const parts = [];
    const order = ['walk', 'burrow', 'climb', 'fly', 'swim'];

    for (const key of order) {
        if (!(key in speed)) {
            continue;
        }

        const value = speed[key];
        if (value == null || value === false) {
            continue;
        }

        if (typeof value === 'number') {
            if (key === 'walk') {
                parts.push(`${value} ft.`);
            } else {
                parts.push(`${key} ${value} ft.`);
            }
            continue;
        }

        if (typeof value === 'object' && typeof value.number === 'number') {
            const mode = key === 'walk' ? '' : `${key} `;
            const condition = value.condition ? ` ${cleanupText(value.condition)}` : '';
            parts.push(`${mode}${value.number} ft.${condition}`.trim());
        }
    }

    return parts.join(', ');
}

function formatBonuses(bonuses, orderedKeys) {
    if (!bonuses || typeof bonuses !== 'object') {
        return '';
    }

    const entries = [];

    if (orderedKeys) {
        for (const key of orderedKeys) {
            if (bonuses[key] == null) {
                continue;
            }
            entries.push(`${shortAbility(key)} ${formatSignedNumber(bonuses[key])}`);
        }
    } else {
        for (const [key, value] of Object.entries(bonuses)) {
            entries.push(`${toTitleCase(String(key))} ${formatSignedNumber(value)}`);
        }
    }

    return entries.join(', ');
}

function formatSignedNumber(value) {
    const num = Number(value);
    if (Number.isNaN(num)) {
        const raw = cleanupText(String(value));
        return raw.startsWith('+') || raw.startsWith('-') ? raw : `+${raw}`;
    }

    return num >= 0 ? `+${num}` : `${num}`;
}

function formatDamageList(list) {
    if (!list || !Array.isArray(list) || !list.length) {
        return '';
    }

    return list.map(formatDamageItem).filter(Boolean).join('; ');
}

function formatDamageItem(item) {
    if (typeof item === 'string') {
        return cleanupText(item);
    }

    if (typeof item !== 'object' || item == null) {
        return '';
    }

    if (item.special) {
        return cleanupText(item.special);
    }

    const group = item.resist ?? item.immune ?? item.vulnerable ?? item.conditionImmune;
    const base = Array.isArray(group) ? group.map(formatDamageItem).filter(Boolean).join(', ') : '';
    const note = item.note ? ` ${cleanupText(item.note)}` : '';
    const preNote = item.preNote ? `${cleanupText(item.preNote)} ` : '';

    return `${preNote}${base}${note}`.trim();
}

function formatSenses(monster) {
    const parts = [];

    if (Array.isArray(monster.senses)) {
        parts.push(...monster.senses.map((sense) => cleanupText(String(sense))));
    }

    if (monster.passive != null) {
        parts.push(`passive Perception ${monster.passive}`);
    }

    return parts.filter(Boolean).join(', ');
}

function formatLanguages(languages) {
    if (!languages) {
        return '';
    }

    if (Array.isArray(languages)) {
        return languages.map((lang) => cleanupText(String(lang))).join(', ');
    }

    return cleanupText(String(languages));
}

function formatChallengeXp(cr) {
    if (cr == null) {
        return '';
    }

    if (typeof cr === 'object') {
        if (cr.xp != null) {
            return `${cr.xp} XP`;
        }

        if (cr.cr != null) {
            return CR_XP[String(cr.cr)] ?? '';
        }

        return '';
    }

    return CR_XP[String(cr)] ?? '';
}

function mapSectionEntry(section) {
    const title = cleanupText(String(section?.name ?? '')).replace(/\.$/, '');
    const text = renderEntries(section?.entries ?? []);
    return { title, text };
}

function mapSpellcastingToTraits(spellcastingList) {
    return spellcastingList.map((spellcasting) => {
        const lines = [];

        if (Array.isArray(spellcasting.headerEntries)) {
            lines.push(renderEntries(spellcasting.headerEntries));
        }

        if (spellcasting.spells && typeof spellcasting.spells === 'object') {
            const levels = Object.keys(spellcasting.spells)
                .sort((a, b) => Number(a) - Number(b));

            for (const level of levels) {
                const data = spellcasting.spells[level];
                const spellNames = (data?.spells ?? []).map((spell) => cleanupText(String(spell)));
                if (!spellNames.length) {
                    continue;
                }

                if (level === '0') {
                    lines.push(`Cantrips (at will): ${spellNames.join(', ')}`);
                } else {
                    const slotsLabel = data?.slots != null ? ` (${data.slots} slots)` : '';
                    lines.push(`${toOrdinal(Number(level))} level${slotsLabel}: ${spellNames.join(', ')}`);
                }
            }
        }

        if (Array.isArray(spellcasting.footerEntries)) {
            lines.push(renderEntries(spellcasting.footerEntries));
        }

        return {
            name: spellcasting.name ?? 'Spellcasting',
            entries: [lines.filter(Boolean).join(' ')]
        };
    });
}

function renderEntries(entries) {
    if (entries == null) {
        return '';
    }

    if (typeof entries === 'string') {
        return cleanupText(entries);
    }

    if (!Array.isArray(entries)) {
        return renderEntryObject(entries);
    }

    return entries.map((entry) => {
        if (typeof entry === 'string') {
            return cleanupText(entry);
        }

        return renderEntryObject(entry);
    }).filter(Boolean).join(' ');
}

function renderEntryObject(entry) {
    if (!entry || typeof entry !== 'object') {
        return '';
    }

    if (entry.type === 'list' && Array.isArray(entry.items)) {
        return entry.items.map((item) => renderEntries(item)).filter(Boolean).join(' ');
    }

    if (entry.type === 'item') {
        const label = entry.name ? `${cleanupText(entry.name)}. ` : '';
        return `${label}${renderEntries(entry.entry ?? entry.entries ?? [])}`.trim();
    }

    if (Array.isArray(entry.entries)) {
        return renderEntries(entry.entries);
    }

    if (entry.entry != null) {
        return renderEntries(entry.entry);
    }

    return '';
}

function cleanupText(text) {
    return String(text)
        .replace(/\{@atk\s+([^}]+)\}/gi, (_m, p1) => formatAttackTag(p1))
        .replace(/\{@hit\s+([^}]+)\}/gi, (_m, p1) => {
            const v = String(p1).trim();
            return v.startsWith('+') || v.startsWith('-') ? v : `+${v}`;
        })
        .replace(/\{@h\}/gi, 'Hit: ')
        .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
        .replace(/\{@dice\s+([^}]+)\}/gi, '$1')
        .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
        .replace(/\{@recharge\s*([^}]*)\}/gi, (_m, p1) => {
            const v = String(p1 || '').trim();
            return v ? `(Recharge ${v})` : '(Recharge 6)';
        })
        .replace(/\{@(spell|condition|creature|item|status|sense|skill|filter|quickref|book|hazard|vehicle|class|race|background|feat|object|deity|language|variantrule|trap)\s+([^}]+)\}/gi, (_m, _tag, p2) => {
            return String(p2).split('|')[0];
        })
        .replace(/\{@[^}]+\s+([^}]+)\}/g, (_m, p1) => String(p1).split('|')[0])
        .replace(/\{@[^}]+\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatAttackTag(tagValue) {
    const tag = String(tagValue).trim().toLowerCase();
    const map = {
        mw: 'Melee Weapon Attack:',
        rw: 'Ranged Weapon Attack:',
        'mw,rw': 'Melee or Ranged Weapon Attack:',
        ms: 'Melee Spell Attack:',
        rs: 'Ranged Spell Attack:',
        'ms,rs': 'Melee or Ranged Spell Attack:'
    };

    return map[tag] ?? '';
}

function mergeMissingFields(entry, patch) {
    if (!entry.sourceUrl && patch.sourceUrl) {
        entry.sourceUrl = patch.sourceUrl;
    }

    if (entry.armorClass == null && patch.armorClass != null) {
        entry.armorClass = patch.armorClass;
    }

    if (entry.hitPoints == null && patch.hitPoints != null) {
        entry.hitPoints = patch.hitPoints;
    }

    for (const field of [
        'speed',
        'savingThrows',
        'skills',
        'damageVulnerabilities',
        'damageResistances',
        'damageImmunities',
        'conditionImmunities',
        'senses',
        'languages',
        'challengeXp'
    ]) {
        if (!entry[field] && patch[field]) {
            entry[field] = patch[field];
        }
    }

    if (!entry.languages) {
        entry.languages = patch.languages || '—';
    }

    if (!entry.challengeXp) {
        entry.challengeXp = patch.challengeXp || CR_XP[String(entry.challengeRating)] || '';
    }

    if (!entry.traits?.length && patch.traits?.length) {
        entry.traits = patch.traits;
    }

    if (!entry.actions?.length && patch.actions?.length) {
        entry.actions = patch.actions;
    }

    if (!entry.reactions?.length && patch.reactions?.length) {
        entry.reactions = patch.reactions;
    }

    if (!entry.legendaryActions?.length && patch.legendaryActions?.length) {
        entry.legendaryActions = patch.legendaryActions;
    }

    for (const [ability, value] of Object.entries(patch.abilityScores)) {
        if (entry.abilityScores[ability] == null && value != null) {
            entry.abilityScores[ability] = value;
        }
    }
}

function normalizeName(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function toSlug(name) {
    return String(name)
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function shortAbility(key) {
    const map = {
        str: 'Str',
        dex: 'Dex',
        con: 'Con',
        int: 'Int',
        wis: 'Wis',
        cha: 'Cha'
    };

    return map[key] ?? toTitleCase(key);
}

function toTitleCase(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
}

function toOrdinal(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
}

function levenshtein(a, b) {
    const s = String(a);
    const t = String(b);
    const matrix = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));

    for (let i = 0; i <= s.length; i += 1) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= t.length; j += 1) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= s.length; i += 1) {
        for (let j = 1; j <= t.length; j += 1) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[s.length][t.length];
}
