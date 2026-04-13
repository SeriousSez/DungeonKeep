import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../src/app/data/monster-catalog.generated.ts');

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
    throw new Error('Catalog array not found.');
}

const entries = JSON.parse(source.slice(arrayStart, arrayEnd + 1));

for (const entry of entries) {
    if (entry.slug.startsWith('expert-lvl-') || entry.slug.startsWith('warrior-lvl-')) {
        entry.challengeXp = CR_XP[String(entry.challengeRating)] || '10 XP';
        continue;
    }

    if (entry.slug.startsWith('spellcaster-healer-lvl-') || entry.slug.startsWith('spellcaster-mage-lvl-')) {
        const isHealer = entry.slug.includes('healer');
        const level = Number(entry.slug.split('-').pop() ?? '1');

        const healerSlots = {
            1: '1st level (2 slots): cure wounds',
            2: '1st level (3 slots): cure wounds, guiding bolt',
            3: '1st level (4 slots): cure wounds, guiding bolt; 2nd level (2 slots): lesser restoration',
            4: '1st level (4 slots): cure wounds, guiding bolt; 2nd level (3 slots): lesser restoration, prayer of healing',
            5: '1st level (4 slots): cure wounds, guiding bolt; 2nd level (3 slots): lesser restoration, prayer of healing; 3rd level (2 slots): revivify',
            6: '1st level (4 slots): cure wounds, guiding bolt; 2nd level (3 slots): lesser restoration, prayer of healing; 3rd level (3 slots): revivify, mass healing word'
        };

        const mageSlots = {
            1: '1st level (2 slots): sleep',
            2: '1st level (3 slots): sleep, magic missile',
            3: '1st level (4 slots): sleep, magic missile; 2nd level (2 slots): scorching ray',
            4: '1st level (4 slots): sleep, magic missile; 2nd level (3 slots): scorching ray, invisibility',
            5: '1st level (4 slots): sleep, magic missile; 2nd level (3 slots): scorching ray, invisibility; 3rd level (2 slots): fireball',
            6: '1st level (4 slots): sleep, magic missile; 2nd level (3 slots): scorching ray, invisibility; 3rd level (3 slots): fireball, lightning bolt'
        };

        entry.sourceUrl = 'https://5e.tools/bestiary/spellcaster-esk.html';
        entry.speed = '30 ft.';
        entry.savingThrows = level >= 5 ? 'Wis +5' : 'Wis +4';
        entry.skills = isHealer
            ? (level >= 5 ? 'Arcana +5, Investigation +5, Religion +5' : 'Arcana +4, Investigation +4, Religion +4')
            : (level >= 5 ? 'Arcana +6, Investigation +6, Religion +6' : level >= 4 ? 'Arcana +5, Investigation +5, Religion +5' : 'Arcana +4, Investigation +4, Religion +4');
        entry.senses = isHealer && level >= 4 ? 'passive Perception 13' : 'passive Perception 12';
        entry.languages = 'Common, plus one of your choice';
        entry.challengeXp = CR_XP[String(entry.challengeRating)] || '10 XP';
        entry.traits = [
            {
                title: 'Magical Role',
                text: isHealer
                    ? 'This sidekick uses the healer role and channels divine magic to support allies.'
                    : 'This sidekick uses the mage role and channels arcane magic to damage and control foes.'
            },
            {
                title: 'Spellcasting',
                text: isHealer
                    ? `The spellcaster's spellcasting ability is Wisdom (spell save DC ${level >= 5 ? '13' : '12'}, ${level >= 5 ? '+5' : '+4'} to hit with spell attacks). It has the following cleric spells prepared: Cantrips (at will): guidance, sacred flame; ${healerSlots[level]}.`
                    : `The spellcaster's spellcasting ability is Intelligence (spell save DC ${level >= 5 ? '13' : '12'}, ${level >= 5 ? '+5' : '+4'} to hit with spell attacks). It has the following wizard spells prepared: Cantrips (at will): fire bolt, light; ${mageSlots[level]}.`
            }
        ];
        entry.actions = [
            {
                title: 'Quarterstaff',
                text: 'Melee Weapon Attack : +2 to hit, reach 5 ft., one target. Hit : 3 (1d6) bludgeoning damage, or 4 (1d8) bludgeoning damage if used with two hands.'
            },
            {
                title: 'Spellcasting',
                text: 'The spellcaster casts one of its prepared spells.'
            }
        ];
        entry.reactions = [];
        entry.legendaryActions = [];

        entry.abilityScores = {
            strength: 10,
            dexterity: 12,
            constitution: 10,
            intelligence: isHealer ? 15 : (level >= 4 ? 17 : 15),
            wisdom: isHealer ? (level >= 4 ? 16 : 14) : 14,
            charisma: 13
        };
        continue;
    }

    if (entry.slug === 'frog') {
        entry.challengeXp = '10 XP';
        if (!entry.actions?.length) {
            entry.actions = [
                {
                    title: 'No Effective Attack',
                    text: 'The frog has no effective attack action.'
                }
            ];
        }
        continue;
    }

    if (entry.slug === 'sea-horse') {
        entry.challengeXp = '10 XP';
        if (!entry.actions?.length) {
            entry.actions = [
                {
                    title: 'No Effective Attack',
                    text: 'The sea horse has no effective attack action.'
                }
            ];
        }
        continue;
    }

    if (entry.slug === 'shrieker') {
        if (!entry.actions?.length) {
            entry.actions = [
                {
                    title: 'Shriek',
                    text: 'When bright light or a creature is within 30 feet of the shrieker, it emits a shriek audible within 300 feet of it. The shrieker continues to shriek until the disturbance moves out of range and for 1d4 of the shrieker\'s turns afterward.'
                }
            ];
        }
        entry.reactions = [];
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
console.log('Filled remaining 27 entries.');
