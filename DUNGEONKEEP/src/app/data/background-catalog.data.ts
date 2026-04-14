import {
    backgroundOptions,
    backgroundDescriptionFallbacks,
    backgroundSkillProficienciesFallbacks,
    backgroundToolProficienciesFallbacks,
    backgroundLanguagesFallbacks,
    backgroundDetailOverrides,
} from './new-character-standard-page.data';

export type BackgroundSourceCategory = 'phb' | 'scag' | 'supplement' | 'setting' | 'al';

export interface BackgroundCatalogEntry {
    name: string;
    slug: string;
    icon: string;
    source: string;
    sourceCategory: BackgroundSourceCategory;
    description: string;
    skills: string;
    tools: string;
    languages: string;
    hasChoices: boolean;
    wikiUrl: string;
    abilityScores?: string;
    feat?: string;
    equipment?: string;
}

export function backgroundNameToSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

interface SourceMeta {
    source: string;
    category: BackgroundSourceCategory;
}

const backgroundSourceMap: Readonly<Record<string, SourceMeta>> = {
    // Player's Handbook
    Acolyte: { source: "Player's Handbook", category: 'phb' },
    Athlete: { source: "Player's Handbook", category: 'phb' },
    Charlatan: { source: "Player's Handbook", category: 'phb' },
    Criminal: { source: "Player's Handbook", category: 'phb' },
    Entertainer: { source: "Player's Handbook", category: 'phb' },
    'Folk Hero': { source: "Player's Handbook", category: 'phb' },
    Gladiator: { source: "Player's Handbook", category: 'phb' },
    'Guild Artisan': { source: "Player's Handbook", category: 'phb' },
    'Guild Merchant': { source: "Player's Handbook", category: 'phb' },
    Hermit: { source: "Player's Handbook", category: 'phb' },
    Knight: { source: "Player's Handbook", category: 'phb' },
    Noble: { source: "Player's Handbook", category: 'phb' },
    Outlander: { source: "Player's Handbook", category: 'phb' },
    Pirate: { source: "Player's Handbook", category: 'phb' },
    Sage: { source: "Player's Handbook", category: 'phb' },
    Sailor: { source: "Player's Handbook", category: 'phb' },
    Soldier: { source: "Player's Handbook", category: 'phb' },
    Spy: { source: "Player's Handbook", category: 'phb' },
    Urchin: { source: "Player's Handbook", category: 'phb' },
    // Sword Coast Adventurer's Guide
    'City Watch': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Clan Crafter': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Cloistered Scholar': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    Courtier: { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Faction Agent': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Far Traveler': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    Inheritor: { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Investigator (SCAG)': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Knight of the Order': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Mercenary Veteran': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Urban Bounty Hunter': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Uthgardt Tribe Member': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    'Waterdhavian Noble': { source: 'Sword Coast Adv. Guide', category: 'scag' },
    // Published Supplements
    Anthropologist: { source: 'Tomb of Annihilation', category: 'supplement' },
    Archaeologist: { source: 'Tomb of Annihilation', category: 'supplement' },
    Faceless: { source: "Baldur's Gate: Descent into Avernus", category: 'supplement' },
    Feylost: { source: 'The Wild Beyond the Witchlight', category: 'supplement' },
    Fisher: { source: 'Ghosts of Saltmarsh', category: 'supplement' },
    'Giant Foundling': { source: 'Bigby Presents: Glory of the Giants', category: 'supplement' },
    'Haunted One': { source: "Van Richten's Guide to Ravenloft", category: 'supplement' },
    'House Agent': { source: 'Eberron: Rising from the Last War', category: 'supplement' },
    'Investigator (VRGR)': { source: "Van Richten's Guide to Ravenloft", category: 'supplement' },
    Marine: { source: 'Ghosts of Saltmarsh', category: 'supplement' },
    Rewarded: { source: 'Bigby Presents: Glory of the Giants', category: 'supplement' },
    Ruined: { source: 'Bigby Presents: Glory of the Giants', category: 'supplement' },
    'Rune Carver': { source: 'Bigby Presents: Glory of the Giants', category: 'supplement' },
    Shipwright: { source: 'Ghosts of Saltmarsh', category: 'supplement' },
    Smuggler: { source: 'Ghosts of Saltmarsh', category: 'supplement' },
    'Witchlight Hand': { source: 'The Wild Beyond the Witchlight', category: 'supplement' },
    'Knight of Solamnia': { source: 'Dragonlance: Shadow of the Dragon Queen', category: 'supplement' },
    'Mage of High Sorcery': { source: 'Dragonlance: Shadow of the Dragon Queen', category: 'supplement' },
    Grinner: { source: "Explorer's Guide to Wildemount", category: 'supplement' },
    'Volstrucker Agent': { source: "Explorer's Guide to Wildemount", category: 'supplement' },
    'Astral Drifter': { source: 'Spelljammer: Adventures in Space', category: 'supplement' },
    Wildspacer: { source: 'Spelljammer: Adventures in Space', category: 'supplement' },
    'Gate Warden': { source: 'Planescape: Adventures in the Multiverse', category: 'supplement' },
    'Planar Philosopher': { source: 'Planescape: Adventures in the Multiverse', category: 'supplement' },
    Ashari: { source: "Tal'Dorei Campaign Setting Reborn", category: 'supplement' },
    // Setting sourcebooks
    Dissenter: { source: 'Plane Shift: Amonkhet', category: 'setting' },
    Initiate: { source: 'Plane Shift: Amonkhet', category: 'setting' },
    Vizier: { source: 'Plane Shift: Amonkhet', category: 'setting' },
    Inquisitor: { source: 'Plane Shift: Ixalan', category: 'setting' },
    'Azorius Functionary': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Boros Legionnaire': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Dimir Operative': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Golgari Agent': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Gruul Anarch': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Izzet Engineer': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Orzhov Representative': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Rakdos Cultist': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Selesnya Initiate': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Simic Scientist': { source: "Guildmasters' Guide to Ravnica", category: 'setting' },
    'Lorehold Student': { source: 'Strixhaven: A Curriculum of Chaos', category: 'setting' },
    'Prismari Student': { source: 'Strixhaven: A Curriculum of Chaos', category: 'setting' },
    'Quandrix Student': { source: 'Strixhaven: A Curriculum of Chaos', category: 'setting' },
    'Silverquill Student': { source: 'Strixhaven: A Curriculum of Chaos', category: 'setting' },
    'Witherbloom Student': { source: 'Strixhaven: A Curriculum of Chaos', category: 'setting' },
    // Adventurers League
    'Black Fist Double Agent': { source: 'Adventurers League', category: 'al' },
    'Dragon Casualty': { source: 'Adventurers League', category: 'al' },
    'Iron Route Bandit': { source: 'Adventurers League', category: 'al' },
    'Phlan Insurgent': { source: 'Adventurers League', category: 'al' },
    'Stojanow Prisoner': { source: 'Adventurers League', category: 'al' },
    'Ticklebelly Nomad': { source: 'Adventurers League', category: 'al' },
    'Caravan Specialist': { source: 'Adventurers League', category: 'al' },
    'Earthspur Miner': { source: 'Adventurers League', category: 'al' },
    Harborfolk: { source: 'Adventurers League', category: 'al' },
    'Mulmaster Aristocrat': { source: 'Adventurers League', category: 'al' },
    'Phlan Refugee': { source: 'Adventurers League', category: 'al' },
    'Cormanthor Refugee': { source: 'Adventurers League', category: 'al' },
    'Gate Urchin': { source: 'Adventurers League', category: 'al' },
    'Hillsfar Merchant': { source: 'Adventurers League', category: 'al' },
    'Hillsfar Smuggler': { source: 'Adventurers League', category: 'al' },
    'Secret Identity': { source: 'Adventurers League', category: 'al' },
    'Shade Fanatic': { source: 'Adventurers League', category: 'al' },
    'Trade Sheriff': { source: 'Adventurers League', category: 'al' },
    "Celebrity Adventurer's Scion": { source: 'Acquisitions Incorporated', category: 'supplement' },
    'Failed Merchant': { source: 'Acquisitions Incorporated', category: 'supplement' },
    Gambler: { source: 'Adventurers League', category: 'al' },
    Plaintiff: { source: 'Acquisitions Incorporated', category: 'supplement' },
    'Rival Intern': { source: 'Acquisitions Incorporated', category: 'supplement' },
};

const backgroundIconMap: Readonly<Record<string, string>> = {
    Acolyte: 'hands-praying',
    Anthropologist: 'globe-stand',
    Archaeologist: 'shovel',
    Athlete: 'dumbbell',
    Charlatan: 'masks-theater',
    'City Watch': 'shield-check',
    'Clan Crafter': 'anvil',
    'Cloistered Scholar': 'book-open',
    Courtier: 'crown',
    Criminal: 'mask',
    Entertainer: 'music',
    Faceless: 'face-mask',
    'Faction Agent': 'flag',
    'Far Traveler': 'compass',
    Feylost: 'sparkles',
    Fisher: 'fish',
    'Folk Hero': 'shield-heart',
    Gambler: 'dice-d20',
    'Giant Foundling': 'mountain',
    Gladiator: 'sword',
    'Guild Artisan': 'hammer',
    'Guild Merchant': 'coins',
    'Haunted One': 'ghost',
    Hermit: 'tent',
    'House Agent': 'building-columns',
    Inheritor: 'scroll-old',
    'Investigator (SCAG)': 'magnifying-glass',
    'Investigator (VRGR)': 'magnifying-glass',
    Knight: 'chess-knight',
    'Knight of the Order': 'shield-halved',
    'Knight of Solamnia': 'shield-halved',
    Marine: 'anchor',
    'Mercenary Veteran': 'swords',
    Noble: 'crown',
    Outlander: 'tree-deciduous',
    Pirate: 'skull-crossbones',
    Rewarded: 'star',
    Ruined: 'house-crack',
    'Rune Carver': 'rune',
    Sage: 'book-open-cover',
    Sailor: 'ship',
    Shipwright: 'wrench',
    Smuggler: 'box-open-full',
    Soldier: 'helmet-battle',
    Spy: 'eye',
    'Urban Bounty Hunter': 'crosshairs',
    Urchin: 'street-view',
    'Uthgardt Tribe Member': 'totem-pole',
    'Waterdhavian Noble': 'gem',
    'Witchlight Hand': 'wand-sparkles',
    'Black Fist Double Agent': 'user-secret',
    'Dragon Casualty': 'dragon',
    'Iron Route Bandit': 'road',
    'Phlan Insurgent': 'fire',
    'Stojanow Prisoner': 'chains',
    'Ticklebelly Nomad': 'tent',
    'Caravan Specialist': 'cart-flatbed',
    'Earthspur Miner': 'pickaxe',
    Harborfolk: 'anchor',
    'Mulmaster Aristocrat': 'gem',
    'Phlan Refugee': 'person-walking',
    'Cormanthor Refugee': 'tree-deciduous',
    'Gate Urchin': 'door-open',
    'Hillsfar Merchant': 'store',
    'Hillsfar Smuggler': 'box-open-full',
    'Secret Identity': 'face-mask',
    'Shade Fanatic': 'moon',
    'Trade Sheriff': 'star',
    "Celebrity Adventurer's Scion": 'star',
    'Failed Merchant': 'coins',
    Plaintiff: 'scale-balanced',
    'Rival Intern': 'graduation-cap',
    Dissenter: 'person-chalkboard',
    Initiate: 'fire',
    Vizier: 'brain',
    Inquisitor: 'magnifying-glass',
    'Gate Warden': 'door-open',
    'Planar Philosopher': 'infinity',
    'Azorius Functionary': 'scale-balanced',
    'Boros Legionnaire': 'shield-halved',
    'Dimir Operative': 'user-secret',
    'Golgari Agent': 'skull',
    'Gruul Anarch': 'bolt-lightning',
    'Izzet Engineer': 'flask-round-potion',
    'Orzhov Representative': 'coins',
    'Rakdos Cultist': 'fire',
    'Selesnya Initiate': 'tree-deciduous',
    'Simic Scientist': 'dna',
    'Lorehold Student': 'book-sparkles',
    'Prismari Student': 'palette',
    'Quandrix Student': 'infinity',
    'Silverquill Student': 'pen-fancy',
    'Witherbloom Student': 'seedling',
    Grinner: 'masks-theater',
    'Volstrucker Agent': 'user-secret',
    'Astral Drifter': 'stars',
    Wildspacer: 'rocket',
    'Mage of High Sorcery': 'hat-wizard',
    Ashari: 'leaf',
};

export const backgroundCatalogEntries: BackgroundCatalogEntry[] = backgroundOptions.map((opt) => {
    const meta = backgroundSourceMap[opt.name];
    const override = backgroundDetailOverrides[opt.name];
    return {
        name: opt.name,
        slug: backgroundNameToSlug(opt.name),
        icon: backgroundIconMap[opt.name] ?? 'scroll',
        source: meta?.source ?? 'Published Source',
        sourceCategory: meta?.category ?? 'supplement',
        description: override?.description ?? (backgroundDescriptionFallbacks as Record<string, string>)[opt.name] ?? '',
        skills: override?.skillProficiencies ?? backgroundSkillProficienciesFallbacks[opt.name] ?? '',
        tools: override?.toolProficiencies ?? backgroundToolProficienciesFallbacks[opt.name] ?? '',
        languages: override?.languages ?? backgroundLanguagesFallbacks[opt.name] ?? '',
        hasChoices: !!(override?.choices?.length),
        wikiUrl: opt.url,
        abilityScores: override?.abilityScores,
        feat: override?.feat,
        equipment: override?.equipment,
    };
});

export function getBackgroundBySlug(slug: string): BackgroundCatalogEntry | null {
    return backgroundCatalogEntries.find((b) => b.slug === slug) ?? null;
}

export function getBackgroundChoices(name: string) {
    return backgroundDetailOverrides[name]?.choices ?? [];
}
