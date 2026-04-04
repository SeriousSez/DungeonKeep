import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePages = [
  { key: 'adventuring-gear', url: 'https://dnd5e.wikidot.com/adventuring-gear' },
  { key: 'armor', url: 'https://dnd5e.wikidot.com/armor' },
  { key: 'trinkets', url: 'https://dnd5e.wikidot.com/trinkets' },
  { key: 'weapons', url: 'https://dnd5e.wikidot.com/weapons' },
  { key: 'firearms', url: 'https://dnd5e.wikidot.com/firearms' },
  { key: 'explosives', url: 'https://dnd5e.wikidot.com/explosives' },
  { key: 'wondrous-items', url: 'https://dnd5e.wikidot.com/wondrous-items' },
  { key: 'poisons', url: 'https://dnd5e.wikidot.com/poisons' },
  { key: 'tools', url: 'https://dnd5e.wikidot.com/tools' },
  { key: 'siege-equipment', url: 'https://dnd5e.wikidot.com/siege-equipment' }
];

const namedEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['quot', '"'],
  ['lt', '<'],
  ['gt', '>'],
  ['nbsp', ' '],
  ['mdash', '-'],
  ['ndash', '-'],
  ['frac14', '1/4'],
  ['frac12', '1/2'],
  ['frac34', '3/4']
]);

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => namedEntities.get(name.toLowerCase()) ?? match)
    .replace(/[\u00a0\u200b]/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeInline(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCaseWords(value) {
  return value
    .split(/\s+/)
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word)
    .join(' ')
    .replace(/\b([A-Za-z]+),\s([a-z])/g, (_, left, right) => `${left}, ${right.toUpperCase()}`);
}

function lowercaseFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function ensureSentence(value) {
  if (!value) {
    return value;
  }

  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function stripTrailingPunctuation(value) {
  return value.replace(/[.!?]+$/g, '').trim();
}

function firstSentence(value) {
  const match = value.match(/(.+?[.!?])(?:\s|$)/);
  return match ? match[1].trim() : ensureSentence(value.trim());
}

function splitNarrativeClauses(text) {
  const normalized = normalizeInline(text)
    .replace(/\bThis\b\s+/i, '')
    .replace(/\bThese\b\s+/i, '')
    .trim();

  const primarySegments = normalized
    .split(/(?<=[.!?;])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const clauses = [];
  for (const segment of primarySegments) {
    const secondarySegments = segment
      .split(/\s+and\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);

    if (secondarySegments.length > 1 && segment.length > 60) {
      clauses.push(...secondarySegments.map((part) => ensureSentence(stripTrailingPunctuation(part))));
      continue;
    }

    clauses.push(ensureSentence(stripTrailingPunctuation(segment)));
  }

  return [...new Set(clauses.filter(Boolean))].slice(0, 6);
}

function describeCategory(item) {
  const rarity = item.rarity ? `${item.rarity.toLowerCase()} ` : '';
  return `${rarity}${item.category.toLowerCase()}`.trim();
}

function buildFallbackSummary(item) {
  return `${item.name} is a ${describeCategory(item)} with a dedicated rules entry in its source material.`;
}

function isWeakBulletSummary(value) {
  return /minor beneficial properties|major beneficial properties|minor detrimental properties|major detrimental properties|random properties/i.test(value);
}

function buildFallbackNotes(item) {
  if (item.notes) {
    return item.notes;
  }

  switch (item.category) {
    case 'Weapon':
      return 'Weapon entry used for direct combat, with exact damage and handling rules defined on its source page.';
    case 'Armor':
      return 'Armor entry built around Armor Class, wear requirements, and survivability tradeoffs listed in its source material.';
    case 'Adventuring Gear':
      return 'General-purpose adventuring supply used for travel logistics, camp tasks, storage, light, climbing, or field utility.';
    case 'Tools':
      return 'Specialized tool set used for proficiency checks, crafting, trade work, downtime activity, or class-feature support.';
    case 'Poison':
      return 'Hazardous toxin meant to be applied or delivered to inflict damage, conditions, or hostile saving throw effects.';
    case 'Explosive':
      return 'Single-use explosive or alchemical charge built for burst damage, demolition, or forcing enemies out of position.';
    case 'Siege Equipment':
      return 'Large-scale battlefield engine or breaching device intended for crews, fortifications, and war-scene utility.';
    case 'Wondrous Item':
      return 'Specialized magic item whose activation, limits, and benefits are defined in its source entry.';
    case 'Ring':
      return 'Wearable magic ring that grants passive or activated supernatural benefits while worn.';
    case 'Rod':
      return 'Focused magical rod that channels a narrow set of command-word or activation-based powers.';
    case 'Staff':
      return 'Powerful magical staff commonly tied to stored charges, spellcasting utility, or themed magical effects.';
    case 'Wand':
      return 'Compact magical wand built for repeated activations or spell-like projections.';
    case 'Potion':
      return 'Consumable magic item whose effect is usually triggered by drinking or administering it.';
    case 'Scroll':
      return 'Single-use inscribed magic that releases a stored spell or supernatural effect when activated.';
    case 'Trinket':
      return 'Narrative curiosity or keepsake with stronger story flavor than direct mechanical impact.';
    default:
      return `${item.name} has a dedicated catalog entry sourced from official reference material.`;
  }
}

function buildFallbackDetailLines(item, notes) {
  const lines = [];
  const narrativeClauses = splitNarrativeClauses(notes);
  if (narrativeClauses.length > 0) {
    lines.push(...narrativeClauses);
  }

  if (lines.length === 0 && item.sourceLabel) {
    lines.push(`Source group: ${item.sourceLabel}`);
  }

  if (lines.length === 0 && item.rarity) {
    lines.push(`Rarity: ${item.rarity}`);
  }

  return [...new Set(lines)].slice(0, 8);
}

function extractPageContentHtml(html) {
  const contentMatch = html.match(/<div id="page-content"[^>]*>([\s\S]*?)<div class="page-tags"/i)
    ?? html.match(/<div id="page-content"[^>]*>([\s\S]*?)<div class="creditRate"/i)
    ?? html.match(/<div id="page-content"[^>]*>([\s\S]*?)<div class="options"/i);

  return contentMatch?.[1] ?? '';
}

function filterPageText(value, item) {
  const normalized = normalizeInline(value)
    .replace(/^\u2022\s*/u, '')
    .trim();

  if (!normalized) {
    return false;
  }

  if (normalized === item.name) {
    return false;
  }

  if (/^Source:/i.test(normalized)) {
    return false;
  }

  if (/^(weapon|armor|wondrous item|ring|rod|staff|wand|potion|scroll|poison),/i.test(normalized)) {
    return false;
  }

  if (/^Random Properties\.?$/i.test(normalized) || /^Properties of /i.test(normalized) || /^Destroying the /i.test(normalized)) {
    return true;
  }

  return !/^(Help|Terms of Service|Privacy|Report a bug)$/i.test(normalized);
}

function extractPageAuthoredContent(html, item) {
  const contentHtml = extractPageContentHtml(html);
  if (!contentHtml) {
    return null;
  }

  const paragraphs = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => decodeHtml(match[1]))
    .map((value) => normalizeInline(value))
    .filter((value) => filterPageText(value, item));

  const bulletLines = [...contentHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => decodeHtml(match[1]))
    .map((value) => normalizeInline(value))
    .filter((value) => filterPageText(value, item))
    .map((value) => ensureSentence(stripTrailingPunctuation(value)));

  if (paragraphs.length === 0 && bulletLines.length === 0) {
    return null;
  }

  const notes = paragraphs.length > 0 ? paragraphs.join(' ') : undefined;
  const openingSentence = paragraphs.length > 0 ? firstSentence(paragraphs[0]) : undefined;
  const preferredBullet = bulletLines.find((line) => !isWeakBulletSummary(line));
  const summary = openingSentence && !/^This\b/i.test(openingSentence) && !/^These\b/i.test(openingSentence)
    ? openingSentence
    : preferredBullet
      ? `${item.name} is a ${describeCategory(item)} whose source entry grants ${lowercaseFirst(stripTrailingPunctuation(preferredBullet))}.`
      : buildFallbackSummary(item);
  const detailLines = bulletLines.length > 0 ? [...new Set(bulletLines)] : buildFallbackDetailLines(item, notes ?? buildFallbackNotes(item));

  return {
    summary,
    notes,
    detailLines
  };
}

function authorItem(item, pageHtmlByUrl, sourcePageUrlSet) {
  const pageHtml = !sourcePageUrlSet.has(item.sourceUrl) ? pageHtmlByUrl.get(item.sourceUrl) : undefined;
  const pageAuthored = pageHtml ? extractPageAuthoredContent(pageHtml, item) : null;
  const notes = pageAuthored?.notes ?? buildFallbackNotes(item);
  const summary = pageAuthored?.summary ?? buildFallbackSummary(item);
  const detailLines = (pageAuthored?.detailLines?.length ? pageAuthored.detailLines : buildFallbackDetailLines(item, notes));

  return createItem({
    ...item,
    summary,
    notes,
    detailLines
  });
}

async function fetchHtmlMap(urls, concurrency = 8) {
  const results = new Map();
  const pending = [...urls];

  async function worker() {
    while (pending.length > 0) {
      const url = pending.shift();
      if (!url) {
        return;
      }

      results.set(url, await fetchHtml(url));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, () => worker()));
  return results;
}

function parseCostToGp(text) {
  const normalized = normalizeInline(text).replace(/,/g, '');
  if (!normalized || normalized === '-') {
    return undefined;
  }

  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/4)?|[0-9]+\/[0-9]+)\s*(cp|sp|ep|gp|pp)/i);
  if (!match) {
    return undefined;
  }

  const amount = parseFractionalNumber(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'cp':
      return roundNumber(amount / 100);
    case 'sp':
      return roundNumber(amount / 10);
    case 'ep':
      return roundNumber(amount / 2);
    case 'gp':
      return roundNumber(amount);
    case 'pp':
      return roundNumber(amount * 10);
    default:
      return undefined;
  }
}

function parseFractionalNumber(value) {
  const normalized = value
    .replace(/½/g, ' 1/2')
    .replace(/¼/g, ' 1/4')
    .replace(/¾/g, ' 3/4')
    .trim();

  if (normalized.includes(' ')) {
    return normalized.split(/\s+/).reduce((sum, part) => sum + parseFractionalNumber(part), 0);
  }

  if (normalized.includes('/')) {
    const [left, right] = normalized.split('/').map(Number);
    if (Number.isFinite(left) && Number.isFinite(right) && right !== 0) {
      return left / right;
    }
  }

  return Number.parseFloat(normalized);
}

function parseWeightLb(text) {
  const normalized = normalizeInline(text);
  if (!normalized || normalized === '-') {
    return undefined;
  }

  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?(?:\s*[1-3]\/4)?|[0-9]+\/[0-9]+|[0-9]+½|[0-9]+¼|[0-9]+¾)\s*lb/i);
  if (!match) {
    return undefined;
  }

  return roundNumber(parseFractionalNumber(match[1]));
}

function roundNumber(value) {
  return Math.round(value * 1000) / 1000;
}

function extractTables(html) {
  return [...html.matchAll(/<table class="wiki-content-table">([\s\S]*?)<\/table>/g)].map((match) => match[1]);
}

function parseTable(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((match) => match[1]);
  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = [...rows[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((match) => normalizeInline(decodeHtml(match[1])));
  const parsedRows = rows.slice(1).map((rowHtml) => {
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => ({
      rawHtml: match[1],
      text: decodeHtml(match[1])
    }));

    return cells;
  }).filter((cells) => cells.length > 0);

  return { headers, rows: parsedRows };
}

function splitNameAndDetails(cellText) {
  const lines = cellText.split('\n').map((line) => normalizeInline(line)).filter(Boolean);
  const [name = '', ...rest] = lines;
  const details = rest.join(' ').replace(/^\*\s*/, '').trim();
  return { name, details };
}

function cleanImportedName(name) {
  return normalizeInline(name)
    .replace(/\*+$/g, '')
    .replace(/\s+\*$/g, '')
    .trim();
}

function createItem(item) {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined && value !== ''));
}

function weaponAlias(name) {
  const aliases = new Map([
    ['Crossbow, light', 'Crossbow, Light'],
    ['Crossbow, hand', 'Crossbow, Hand'],
    ['Crossbow, heavy', 'Crossbow, Heavy'],
    ['Light hammer', 'Light Hammer'],
    ['War pick', 'War Pick'],
    ['Crossbow bolts (20)', 'Crossbow Bolts (20)']
  ]);
  return aliases.get(name) ?? name;
}

function armorAlias(name) {
  const aliases = new Map([
    ['Padded', 'Padded Armor'],
    ['Leather', 'Leather Armor'],
    ['Studded Leather', 'Studded Leather Armor'],
    ['Halfplate', 'Half Plate'],
    ['Plate', 'Plate Armor'],
    ['Splint', 'Splint Armor']
  ]);
  return aliases.get(name) ?? name;
}

function parseAdventuringGear(html, url) {
  const items = [];
  for (const tableHtml of extractTables(html)) {
    const table = parseTable(tableHtml);
    const firstHeader = table.headers[0] ?? '';
    if (!firstHeader) {
      continue;
    }

    for (const row of table.rows) {
      const firstCell = row[0]?.text ?? '';
      const { name, details } = splitNameAndDetails(firstCell);
      if (!name) {
        continue;
      }

      const lowerHeader = firstHeader.toLowerCase();
      const costCell = row.find((cell, index) => /cost|price/i.test(table.headers[index] ?? ''))?.text;
      const weightCell = row.find((cell, index) => /weight/i.test(table.headers[index] ?? ''))?.text;

      items.push(createItem({
        name: cleanImportedName(name),
        category: lowerHeader.includes('trinket') ? 'Trinket' : 'Adventuring Gear',
        sourceUrl: url,
        costGp: parseCostToGp(costCell ?? ''),
        weight: parseWeightLb(weightCell ?? ''),
        notes: details || undefined
      }));
    }
  }

  return items;
}

function parseTrinkets(html, url) {
  const items = [];
  for (const tableHtml of extractTables(html)) {
    const table = parseTable(tableHtml);
    if (table.headers.length < 2) {
      continue;
    }

    for (const row of table.rows) {
      const name = normalizeInline(row[1]?.text ?? '');
      if (!name) {
        continue;
      }

      items.push(createItem({
        name: cleanImportedName(name),
        category: 'Trinket',
        sourceUrl: url
      }));
    }
  }

  return items;
}

function parseArmor(html, url) {
  const items = [];
  for (const tableHtml of extractTables(html)) {
    const table = parseTable(tableHtml);
    if (!table.headers.includes('Name')) {
      continue;
    }

    for (const row of table.rows) {
      const rawName = normalizeInline(row[0]?.text ?? '');
      if (!rawName) {
        continue;
      }

      const ac = normalizeInline(row[1]?.text ?? '');
      const strength = normalizeInline(row[2]?.text ?? '');
      const stealth = normalizeInline(row[3]?.text ?? '');
      const weight = parseWeightLb(row[4]?.text ?? '');
      const costGp = parseCostToGp(row[5]?.text ?? '');
      const noteParts = [];
      if (ac) noteParts.push(`AC ${ac}`);
      if (strength && strength !== '-') noteParts.push(`Str ${strength}`);
      if (stealth && stealth !== '-') noteParts.push(`Stealth ${stealth}`);

      items.push(createItem({
        name: armorAlias(rawName),
        category: 'Armor',
        sourceUrl: url,
        weight,
        costGp,
        notes: noteParts.join(', ') || undefined
      }));
    }
  }

  return items;
}

function parseWeaponsLike(html, url, category) {
  const items = [];
  for (const tableHtml of extractTables(html)) {
    const table = parseTable(tableHtml);
    if (!(table.headers.includes('Name') || table.headers.includes('Equipment Pack') || table.headers.includes('Ammunition'))) {
      continue;
    }

    for (const row of table.rows) {
      const { name, details } = splitNameAndDetails(row[0]?.text ?? '');
      if (!name) {
        continue;
      }

      const weight = row.find((cell, index) => /weight/i.test(table.headers[index] ?? ''))?.text;
      const cost = row.find((cell, index) => /cost|price/i.test(table.headers[index] ?? ''))?.text;
      const noteParts = [];
      for (let index = 1; index < row.length; index += 1) {
        const header = table.headers[index] ?? '';
        const value = normalizeInline(row[index]?.text ?? '');
        if (!value || value === '-') {
          continue;
        }
        if (/cost|price|weight/i.test(header)) {
          continue;
        }

        noteParts.push(header ? `${header}: ${value}` : value);
      }

      if (details) {
        noteParts.unshift(details);
      }

      items.push(createItem({
        name: cleanImportedName(weaponAlias(name)),
        category,
        sourceUrl: url,
        weight: parseWeightLb(weight ?? ''),
        costGp: parseCostToGp(cost ?? ''),
        notes: noteParts.join(', ') || undefined
      }));
    }
  }

  return items;
}

function parsePoisons(html, url) {
  return parseWeaponsLike(html, url, 'Poison');
}

function parseTools(html, url) {
  return parseWeaponsLike(html, url, 'Tools');
}

function parseSiegeEquipment(html, url) {
  return parseWeaponsLike(html, url, 'Siege Equipment');
}

function parseWondrousItems(html) {
  const rarityLabels = [...html.matchAll(/<li[^>]*><a href="javascript:;"><em>(.*?)<\/em><\/a><\/li>/g)]
    .map((match) => normalizeInline(decodeHtml(match[1])));
  const contentStart = html.indexOf('<div class="yui-content">');
  const tabTables = extractTables(contentStart >= 0 ? html.slice(contentStart) : html).slice(0, rarityLabels.length);

  const items = [];
  for (let index = 0; index < tabTables.length; index += 1) {
    const rarity = rarityLabels[index];
    const table = parseTable(tabTables[index]);
    for (const row of table.rows) {
      const anchorMatch = row[0]?.rawHtml.match(/href="([^"]+)"/i);
      const name = normalizeInline(row[0]?.text ?? '');
      if (!name) {
        continue;
      }

      const href = anchorMatch?.[1]?.startsWith('http') ? anchorMatch[1] : `https://dnd5e.wikidot.com${anchorMatch?.[1] ?? ''}`;
      const attuned = normalizeInline(row[2]?.text ?? '');
      items.push(createItem({
        name,
        category: normalizeInline(row[1]?.text ?? 'Wondrous Item'),
        sourceUrl: href || 'https://dnd5e.wikidot.com/wondrous-items',
        sourceLabel: normalizeInline(row[3]?.text ?? '') || undefined,
        rarity: rarity || undefined,
        attunement: attuned && attuned !== '-' ? attuned : undefined
      }));
    }
  }

  return items;
}

function uniqueByKey(items) {
  const byKey = new Map();
  for (const item of items) {
    byKey.set(`${item.category}::${item.name}`.toLowerCase(), item);
  }
  return [...byKey.values()];
}

function sortItems(items) {
  return [...items].sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));
}

function serializeItem(item) {
  return `    ${JSON.stringify(item)}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DungeonKeep Catalog Sync'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const pages = Object.fromEntries(await Promise.all(sourcePages.map(async (source) => [source.key, await fetchHtml(source.url)])));

  const parsedItems = uniqueByKey(sortItems([
    ...parseAdventuringGear(pages['adventuring-gear'], 'https://dnd5e.wikidot.com/adventuring-gear'),
    ...parseArmor(pages['armor'], 'https://dnd5e.wikidot.com/armor'),
    ...parseTrinkets(pages['trinkets'], 'https://dnd5e.wikidot.com/trinkets'),
    ...parseWeaponsLike(pages['weapons'], 'https://dnd5e.wikidot.com/weapons', 'Weapon'),
    ...parseWeaponsLike(pages['firearms'], 'https://dnd5e.wikidot.com/firearms', 'Firearm'),
    ...parseWeaponsLike(pages['explosives'], 'https://dnd5e.wikidot.com/explosives', 'Explosive'),
    ...parseWondrousItems(pages['wondrous-items']),
    ...parsePoisons(pages['poisons'], 'https://dnd5e.wikidot.com/poisons'),
    ...parseTools(pages['tools'], 'https://dnd5e.wikidot.com/tools'),
    ...parseSiegeEquipment(pages['siege-equipment'], 'https://dnd5e.wikidot.com/siege-equipment')
  ]));

  const sourcePageUrlSet = new Set(sourcePages.map((source) => source.url));
  const itemPageUrls = [...new Set(parsedItems
    .map((item) => item.sourceUrl)
    .filter((url) => url && !sourcePageUrlSet.has(url)))];
  const pageHtmlByUrl = await fetchHtmlMap(itemPageUrls);
  const generatedItems = sortItems(parsedItems.map((item) => authorItem(item, pageHtmlByUrl, sourcePageUrlSet)));

  const output = `import type { EquipmentItem } from './new-character-standard-page.types';\n\nexport const officialWikidotEquipmentCatalog: ReadonlyArray<EquipmentItem> = [\n${generatedItems.map(serializeItem).join(',\n')}\n];\n`;
  const outputPath = resolve('src/app/data/wikidot-items.generated.ts');
  await writeFile(outputPath, output, 'utf8');
  console.log(`Wrote ${generatedItems.length} items to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
