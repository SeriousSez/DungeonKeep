import { Character } from '../models/dungeon.models';
import type { InventoryEntry } from './new-character-standard-page.types';

interface PremadeAppearanceProfile {
    age: string;
    height: string;
    weight: string;
    hair: string;
    eyes: string;
    skin: string;
}

export interface PremadeCharacter extends Character {
    inventoryEntries: InventoryEntry[];
    classPreparedSpells?: Record<string, string[]>;
    wizardSpellbookByClass?: Record<string, string[]>;
    speciesTraitChoices?: Record<string, string[]>;
    appearance?: PremadeAppearanceProfile;
}

const classRoleplayDefaults: Record<string, { personalityTraits: string[]; ideals: string[]; bonds: string[]; flaws: string[] }> = {
    Artificer: {
        personalityTraits: ['Always tinkering with something', 'Sees every obstacle as a solvable puzzle'],
        ideals: ['Innovation should improve lives', 'Preparation beats panic'],
        bonds: ['A workshop full of half-finished marvels'],
        flaws: ['Can become obsessed with perfecting a design']
    },
    Barbarian: {
        personalityTraits: ['Direct and fearless', 'Protective of companions'],
        ideals: ['Strength should shield others', 'Freedom over tyranny'],
        bonds: ['Tribe and travel companions'],
        flaws: ['Quick to anger when provoked']
    },
    Bard: {
        personalityTraits: ['Charismatic storyteller', 'Always collecting rumors'],
        ideals: ['Art keeps hope alive', 'Truth can be revealed through song'],
        bonds: ['A mentor performer and old troupe'],
        flaws: ['Can overpromise in the moment']
    },
    Cleric: {
        personalityTraits: ['Calm under pressure', 'Compassionate even to strangers'],
        ideals: ['Service to the vulnerable', 'Faith tempered by wisdom'],
        bonds: ['Sacred vows and temple teachings'],
        flaws: ['Takes others burdens personally']
    },
    'Blood Hunter': {
        personalityTraits: ['Quietly watches for danger', 'Carries old scars without complaint'],
        ideals: ['Monsters must be stopped before they reach the helpless', 'Sacrifice can be necessary'],
        bonds: ['A vow sworn over a past tragedy'],
        flaws: ['Pushes beyond safe limits too easily']
    },
    Druid: {
        personalityTraits: ['Patient observer of nature', 'Speaks in measured words'],
        ideals: ['Balance between civilization and wilds', 'Protect sacred places'],
        bonds: ['An ancient grove and its spirits'],
        flaws: ['Distrusts crowded cities']
    },
    Fighter: {
        personalityTraits: ['Disciplined and practical', 'Keeps gear meticulously maintained'],
        ideals: ['Preparation wins battles', 'Loyalty to the unit'],
        bonds: ['Veteran comrades and old commander'],
        flaws: ['Judges reckless plans harshly']
    },
    Gunslinger: {
        personalityTraits: ['Cool under pressure', 'Always notes exits and sightlines'],
        ideals: ['Precision matters more than bravado', 'Protect the innocent from afar if needed'],
        bonds: ['A trusted sidearm and an old partner'],
        flaws: ['Can mistake confidence for certainty']
    },
    Monk: {
        personalityTraits: ['Centered and deliberate', 'Values restraint'],
        ideals: ['Mastery through practice', 'Self-control before force'],
        bonds: ['Monastery teachings and sworn siblings'],
        flaws: ['Can seem emotionally distant']
    },
    'Monster Hunter': {
        personalityTraits: ['Keeps meticulous notes on threats', 'Rarely underestimates the unknown'],
        ideals: ['Knowledge is the first weapon', 'Evil should be hunted before it spreads'],
        bonds: ['A casebook of slain horrors and unfinished hunts'],
        flaws: ['Struggles to relax when danger might be near']
    },
    Paladin: {
        personalityTraits: ['Noble bearing', 'Speaks with conviction'],
        ideals: ['Justice with mercy', 'Keep every oath'],
        bonds: ['Sacred oath and those under protection'],
        flaws: ['Struggles to forgive personal betrayal']
    },
    Ranger: {
        personalityTraits: ['Quiet tracker', 'Keenly attentive to surroundings'],
        ideals: ['Guard borders of civilization', 'Live lightly on the land'],
        bonds: ['A threatened wilderness and its folk'],
        flaws: ['Reluctant to ask for help']
    },
    Rogue: {
        personalityTraits: ['Quick-witted and sly', 'Always watching exits'],
        ideals: ['Independence above all', 'Outsmart the powerful'],
        bonds: ['A debt to an old accomplice'],
        flaws: ['Keeps too many secrets']
    },
    Sorcerer: {
        personalityTraits: ['Confident in innate power', 'Curious about magical anomalies'],
        ideals: ['Power should be mastered, not feared', 'Freedom to define your own path'],
        bonds: ['Family line touched by magic'],
        flaws: ['Impulsive when emotions run hot']
    },
    Warlock: {
        personalityTraits: ['Clever negotiator', 'Masks fear with humor'],
        ideals: ['Knowledge at any cost', 'Power can be leveraged for good'],
        bonds: ['A dangerous pact and its terms'],
        flaws: ['Tempted by shortcuts']
    },
    Wizard: {
        personalityTraits: ['Methodical scholar', 'Endlessly inquisitive'],
        ideals: ['Knowledge must be preserved', 'Reason over superstition'],
        bonds: ['Spellbook and academic mentor'],
        flaws: ['Overthinks in urgent moments']
    }
};

const raceAppearanceDefaults: Record<string, PremadeAppearanceProfile> = {
    Dwarf: { age: '68', height: '4 ft 6 in', weight: '156 lb', hair: 'Braided auburn', eyes: 'Hazel', skin: 'Weathered tan' },
    Elf: { age: '118', height: '5 ft 10 in', weight: '135 lb', hair: 'Silver-blond', eyes: 'Emerald', skin: 'Pale bronze' },
    Goliath: { age: '29', height: '7 ft 2 in', weight: '322 lb', hair: 'Shaved', eyes: 'Gray-blue', skin: 'Stone-gray' },
    Halfling: { age: '31', height: '3 ft 2 in', weight: '42 lb', hair: 'Chestnut curls', eyes: 'Brown', skin: 'Warm umber' },
    Tiefling: { age: '24', height: '5 ft 8 in', weight: '142 lb', hair: 'Black with copper streaks', eyes: 'Amber', skin: 'Crimson' },
    Human: { age: '26', height: '5 ft 11 in', weight: '174 lb', hair: 'Dark brown', eyes: 'Hazel', skin: 'Olive' },
    Orc: { age: '23', height: '6 ft 5 in', weight: '246 lb', hair: 'Black topknot', eyes: 'Amber', skin: 'Green-gray' },
    Tabaxi: { age: '20', height: '6 ft 1 in', weight: '158 lb', hair: 'Striped tawny fur', eyes: 'Gold', skin: 'Furred coat' },
    Aasimar: { age: '27', height: '6 ft 0 in', weight: '186 lb', hair: 'Platinum blond', eyes: 'Silver', skin: 'Luminous fair' },
    Dragonborn: { age: '24', height: '6 ft 4 in', weight: '236 lb', hair: 'No hair, horn crest', eyes: 'Burnished gold', skin: 'Scarlet scales' },
    Gnome: { age: '63', height: '3 ft 4 in', weight: '38 lb', hair: 'Copper-brown', eyes: 'Violet', skin: 'Tan' },
    Goblin: { age: '19', height: '3 ft 8 in', weight: '43 lb', hair: 'Wiry black', eyes: 'Bright yellow', skin: 'Moss green' },
    Minotaur: { age: '28', height: '6 ft 8 in', weight: '282 lb', hair: 'Dark mane', eyes: 'Umber', skin: 'Russet fur' },
    Shifter: { age: '24', height: '5 ft 9 in', weight: '148 lb', hair: 'Dark sable', eyes: 'Amber', skin: 'Weathered tan with faint fur markings' },
    Autognome: { age: '12', height: '3 ft 5 in', weight: '52 lb', hair: 'Brass-plated crown', eyes: 'Blue crystal', skin: 'Polished copper' },
    'Shadar-Kai': { age: '96', height: '5 ft 9 in', weight: '132 lb', hair: 'Raven black', eyes: 'Pale gray', skin: 'Ashen' },
    Hobgoblin: { age: '34', height: '5 ft 11 in', weight: '188 lb', hair: 'Black military braid', eyes: 'Ember brown', skin: 'Burnished red-brown' },
    Firbolg: { age: '74', height: '7 ft 4 in', weight: '248 lb', hair: 'Moss-brown', eyes: 'Moss green', skin: 'Dusky blue-gray' }
};

function getRoleplayDefaults(character: PremadeCharacter): { personalityTraits: string[]; ideals: string[]; bonds: string[]; flaws: string[] } {
    return classRoleplayDefaults[character.className] ?? {
        personalityTraits: ['Adaptable and determined'],
        ideals: ['Protect the party'],
        bonds: ['Companions on the road'],
        flaws: ['Takes on too much alone']
    };
}

function getAppearanceDefaults(character: PremadeCharacter): PremadeAppearanceProfile {
    return raceAppearanceDefaults[character.race] ?? {
        age: '25',
        height: '5 ft 8 in',
        weight: '160 lb',
        hair: 'Brown',
        eyes: 'Brown',
        skin: 'Fair'
    };
}

function normalizePremadeImagePath(value: string | undefined): string {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return '';
    }

    return trimmed.replace(/\.png$/i, '.webp');
}

function enrichPremade(character: PremadeCharacter): PremadeCharacter {
    const roleplayDefaults = getRoleplayDefaults(character);

    return {
        ...character,
        personalityTraits: character.personalityTraits?.length ? character.personalityTraits : roleplayDefaults.personalityTraits,
        ideals: character.ideals?.length ? character.ideals : roleplayDefaults.ideals,
        bonds: character.bonds?.length ? character.bonds : roleplayDefaults.bonds,
        flaws: character.flaws?.length ? character.flaws : roleplayDefaults.flaws,
        appearance: character.appearance ?? getAppearanceDefaults(character),
        image: normalizePremadeImagePath(character.image)
    };
}

function inventoryItem(name: string, category: string, quantity = 1, extras: Partial<InventoryEntry> = {}): InventoryEntry {
    return {
        name,
        category,
        quantity,
        ...extras
    };
}

function explorerPack(): InventoryEntry {
    return inventoryItem('Backpack', 'Adventuring Gear', 1, {
        isContainer: true,
        maxCapacity: 60,
        containedItems: [
            inventoryItem('Bedroll', 'Adventuring Gear'),
            inventoryItem('Mess Kit', 'Adventuring Gear'),
            inventoryItem('Tinderbox', 'Adventuring Gear'),
            inventoryItem('Torch', 'Adventuring Gear', 10),
            inventoryItem('Rations (1 day)', 'Adventuring Gear', 10),
            inventoryItem('Waterskin', 'Adventuring Gear'),
            inventoryItem('Hempen Rope (50 feet)', 'Adventuring Gear')
        ]
    });
}

function scholarsPack(): InventoryEntry {
    return inventoryItem('Backpack', 'Adventuring Gear', 1, {
        isContainer: true,
        maxCapacity: 60,
        containedItems: [
            inventoryItem('Book of Lore', 'Adventuring Gear'),
            inventoryItem('Ink (1-ounce bottle)', 'Adventuring Gear'),
            inventoryItem('Ink Pen', 'Adventuring Gear'),
            inventoryItem('Parchment (sheet)', 'Adventuring Gear', 10),
            inventoryItem('Little Bag of Sand', 'Adventuring Gear'),
            inventoryItem('Small Knife', 'Adventuring Gear')
        ]
    });
}

function quiverWithArrows(quantity: number): InventoryEntry {
    return inventoryItem('Quiver', 'Adventuring Gear', 1, {
        isContainer: true,
        containedItems: [inventoryItem('Arrow', 'Ammunition', quantity)]
    });
}

function dungeoneersPack(): InventoryEntry {
    return inventoryItem('Backpack', 'Adventuring Gear', 1, {
        isContainer: true,
        maxCapacity: 60,
        containedItems: [
            inventoryItem('Crowbar', 'Adventuring Gear'),
            inventoryItem('Hammer', 'Adventuring Gear'),
            inventoryItem('Piton', 'Adventuring Gear', 10),
            inventoryItem('Torch', 'Adventuring Gear', 10),
            inventoryItem('Tinderbox', 'Adventuring Gear'),
            inventoryItem('Rations (1 day)', 'Adventuring Gear', 10),
            inventoryItem('Waterskin', 'Adventuring Gear'),
            inventoryItem('Hempen Rope (50 feet)', 'Adventuring Gear')
        ]
    });
}

const basePremadeCharacters: PremadeCharacter[] = [
    {
        id: 'premade-dwarf-cleric',
        campaignId: '',
        name: 'Bramla Stoneheart',
        playerName: '',
        race: 'Dwarf',
        className: 'Cleric',
        level: 1,
        role: 'Support',
        status: 'Ready',
        background: 'Acolyte',
        notes: 'Draws power from the realm of gods and harnesses it to work miracles. Channels divine gift to bolster allies and battle foes.',
        abilityScores: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 16, charisma: 12 },
        skills: { acrobatics: false, animalHandling: false, arcana: false, athletics: true, deception: false, history: true, insight: true, intimidation: false, investigation: false, medicine: true, nature: false, perception: false, performance: false, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 17,
        hitPoints: 11,
        maxHitPoints: 11,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Dwarven Resilience', 'Spellcasting', 'Divine Domain: Life'],
        gender: 'Female',
        alignment: 'Lawful Good',
        faith: 'Moradin',
        lifestyle: 'Modest',
        classFeatures: ['Spellcasting', 'Divine Domain: Life', 'Channel Divinity', 'Turn Undead'],
        speciesTraits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'],
        languages: ['Common', 'Dwarvish', 'Celestial', 'Elvish'],
        equipment: ['Mace', 'Scale Mail', 'Shield', 'Holy Symbol', 'Explorer’s Pack'],
        inventoryEntries: [
            inventoryItem('Mace', 'Weapon'),
            inventoryItem('Scale Mail', 'Armor'),
            inventoryItem('Shield', 'Armor'),
            inventoryItem('Holy Symbol', 'Adventuring Gear'),
            explorerPack()
        ],
        spells: ['Sacred Flame', 'Guidance', 'Thaumaturgy', 'Cure Wounds', 'Bless'],
        classPreparedSpells: {
            'Cleric': [
                // Cantrips (3)
                'Sacred Flame', 'Guidance', 'Thaumaturgy',
                // Level 1 prepared — Life Domain auto-prepares Bless & Cure Wounds; additional picks: Guiding Bolt, Healing Word, Shield of Faith
                'Bless', 'Cure Wounds', 'Guiding Bolt', 'Healing Word', 'Shield of Faith'
            ]
        },
        image: '/assets/images/premade/bramla-stoneheart.webp'
    },
    {
        id: 'premade-elf-wizard',
        campaignId: '',
        name: 'Ivelios Starwind',
        playerName: '',
        race: 'Elf',
        className: 'Wizard',
        level: 1,
        role: 'Caster',
        status: 'Ready',
        background: 'Sage',
        notes: 'A scholarly magic-user defined by exhaustive study of magic. Casts spells of explosive fire, arcing lightning, subtle deception, and spectacular transformations.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 13, intelligence: 16, wisdom: 12, charisma: 10 },
        skills: { acrobatics: false, animalHandling: false, arcana: true, athletics: false, deception: false, history: true, insight: false, intimidation: false, investigation: true, medicine: false, nature: true, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 12,
        hitPoints: 7,
        maxHitPoints: 7,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Spellcasting'],
        gender: 'Male',
        alignment: 'Neutral Good',
        faith: 'Corellon Larethian',
        lifestyle: 'Scholar',
        classFeatures: ['Spellcasting', 'Arcane Recovery'],
        speciesTraits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses'],
        speciesTraitChoices: {
            'Elven Lineage': ['High Elf'],
            'Lineage Spellcasting Ability': ['Intelligence']
        },
        languages: ['Common', 'Elvish', 'Draconic', 'Celestial'],
        equipment: ['Quarterstaff', 'Component Pouch', 'Spellbook', 'Scholar’s Pack'],
        inventoryEntries: [
            inventoryItem('Quarterstaff', 'Weapon'),
            inventoryItem('Component Pouch', 'Adventuring Gear'),
            inventoryItem('Spellbook', 'Adventuring Gear'),
            scholarsPack()
        ],
        spells: ['Fire Bolt', 'Prestidigitation', 'Mage Hand', 'Magic Missile', 'Shield'],
        wizardSpellbookByClass: {
            'Wizard': [
                // Cantrips (3)
                'Fire Bolt', 'Prestidigitation', 'Mage Hand',
                // Spellbook entries — 6 level-1 spells (starting allotment)
                'Magic Missile', 'Shield', 'Detect Magic', 'Identify', 'Sleep', 'Thunderwave'
            ]
        },
        classPreparedSpells: {
            'Wizard': [
                // Prepared leveled spells: INT mod (3) + level (1) = 4
                'Magic Missile', 'Shield', 'Detect Magic', 'Identify'
            ]
        },
        image: '/assets/images/premade/ivelios-starwind.webp'
    },
    {
        id: 'premade-goliath-barbarian',
        campaignId: '',
        name: 'Brakka Stoneshield',
        playerName: '',
        race: 'Goliath',
        className: 'Barbarian',
        level: 1,
        role: 'Tank',
        status: 'Ready',
        background: 'Outlander',
        notes: 'A fierce warrior powered by primal forces of the multiverse that manifest as Rage. Charges headlong into danger so others under protection don’t have to.',
        abilityScores: { strength: 16, dexterity: 14, constitution: 15, intelligence: 8, wisdom: 12, charisma: 10 },
        skills: { acrobatics: false, animalHandling: true, arcana: false, athletics: true, deception: false, history: false, insight: false, intimidation: true, investigation: false, medicine: false, nature: true, perception: true, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: true },
        armorClass: 15,
        hitPoints: 15,
        maxHitPoints: 15,
        proficiencyBonus: 2,
        traits: ['Powerful Build', 'Stone’s Endurance', 'Rage', 'Unarmored Defense'],
        gender: 'Male',
        alignment: 'Chaotic Good',
        faith: 'The Stormlord',
        lifestyle: 'Wanderer',
        classFeatures: ['Rage', 'Unarmored Defense'],
        speciesTraits: ['Powerful Build', 'Stone’s Endurance', 'Mountain Born'],
        languages: ['Common', 'Giant'],
        equipment: ['Greataxe', 'Explorer’s Pack', 'Javelin (4)', 'Traveler’s Clothes'],
        inventoryEntries: [
            inventoryItem('Greataxe', 'Weapon'),
            explorerPack(),
            inventoryItem('Javelin', 'Weapon', 4),
            inventoryItem("Traveler's Clothes", 'Adventuring Gear')
        ],
        spells: [],
        image: '/assets/images/premade/brakka-stoneshield.webp'
    },
    {
        id: 'premade-halfling-rogue',
        campaignId: '',
        name: 'Pip Underbough',
        playerName: '',
        race: 'Halfling',
        className: 'Rogue',
        level: 1,
        role: 'Scout',
        status: 'Ready',
        background: 'Criminal',
        notes: 'A dexterous expert that relies on cunning, stealth, and foes’ vulnerabilities to gain the upper hand. Has a knack for finding the solution to just about any problem.',
        abilityScores: { strength: 8, dexterity: 16, constitution: 14, intelligence: 12, wisdom: 10, charisma: 14 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: false, deception: true, history: false, insight: false, intimidation: false, investigation: true, medicine: false, nature: false, perception: true, performance: false, persuasion: false, sleightOfHand: true, stealth: true, survival: false },
        armorClass: 14,
        hitPoints: 10,
        maxHitPoints: 10,
        proficiencyBonus: 2,
        traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Sneak Attack'],
        gender: 'Female',
        alignment: 'Chaotic Neutral',
        faith: 'Brandobaris',
        lifestyle: 'Poor',
        classFeatures: ['Sneak Attack', 'Thieves’ Cant', 'Expertise'],
        speciesTraits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
        languages: ['Common', 'Halfling', 'Thieves’ Cant'],
        equipment: ['Shortsword', 'Shortbow', 'Quiver (20 Arrows)', 'Leather Armor', 'Dagger', 'Thieves’ Tools'],
        inventoryEntries: [
            inventoryItem('Shortsword', 'Weapon'),
            inventoryItem('Shortbow', 'Weapon'),
            quiverWithArrows(20),
            inventoryItem('Leather Armor', 'Armor'),
            inventoryItem('Dagger', 'Weapon'),
            inventoryItem("Thieves' Tools", 'Tools')
        ],
        spells: [],
        image: '/assets/images/premade/pip-underbough.webp'
    },
    // ── Bard ─────────────────────────────────────────────────────────────
    {
        id: 'premade-tiefling-bard',
        campaignId: '',
        name: 'Veshra Ashveil',
        playerName: '',
        race: 'Tiefling',
        className: 'Bard',
        level: 1,
        role: 'Support',
        status: 'Ready',
        background: 'Entertainer',
        notes: 'A silver-tongued performer who weaves magic through music and wit. At home on any stage and in any negotiation, Veshra charms foes and rallies allies with equal flair.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 16 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: false, deception: true, history: true, insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: true, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 12,
        hitPoints: 9,
        maxHitPoints: 9,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Hellish Resistance', 'Bardic Inspiration (d6)', 'Spellcasting', 'Jack of All Trades'],
        gender: 'Female',
        alignment: 'Chaotic Good',
        faith: 'Avandra',
        lifestyle: 'Modest',
        classFeatures: ['Spellcasting', 'Bardic Inspiration (d6)', 'Jack of All Trades'],
        speciesTraits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
        languages: ['Common', 'Infernal'],
        equipment: ['Dagger', 'Shortsword', 'Lute', 'Fine Clothes', "Entertainer's Pack"],
        inventoryEntries: [
            inventoryItem('Dagger', 'Weapon'),
            inventoryItem('Shortsword', 'Weapon'),
            inventoryItem('Lute', 'Adventuring Gear'),
            inventoryItem('Fine Clothes', 'Adventuring Gear'),
            inventoryItem('Backpack', 'Adventuring Gear', 1, {
                isContainer: true,
                maxCapacity: 60,
                containedItems: [
                    inventoryItem('Costume', 'Adventuring Gear', 2),
                    inventoryItem('Candle', 'Adventuring Gear', 5),
                    inventoryItem('Rations (1 day)', 'Adventuring Gear', 5),
                    inventoryItem('Waterskin', 'Adventuring Gear'),
                    inventoryItem('Disguise Kit', 'Tools')
                ]
            })
        ],
        spells: ['Vicious Mockery', 'Minor Illusion', 'Charm Person', 'Cure Wounds', 'Dissonant Whispers', 'Sleep'],
        classPreparedSpells: {
            'Bard': ['Vicious Mockery', 'Minor Illusion', 'Charm Person', 'Cure Wounds', 'Dissonant Whispers', 'Sleep']
        },
        image: '/assets/images/premade/veshra-ashveil.webp'
    },
    // ── Druid ────────────────────────────────────────────────────────────
    {
        id: 'premade-human-druid',
        campaignId: '',
        name: 'Mira Thornwood',
        playerName: '',
        race: 'Human',
        className: 'Druid',
        level: 1,
        role: 'Support',
        status: 'Ready',
        background: 'Hermit',
        notes: 'A guardian of the natural world who communes with ancient forces to heal, protect, and control the battlefield. Patient as the turning seasons and fierce as a forest storm.',
        abilityScores: { strength: 10, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 16, charisma: 10 },
        skills: { acrobatics: false, animalHandling: false, arcana: false, athletics: false, deception: false, history: false, insight: true, intimidation: false, investigation: false, medicine: true, nature: true, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 14,
        hitPoints: 10,
        maxHitPoints: 10,
        proficiencyBonus: 2,
        traits: ['Spellcasting', 'Druidic', 'Wild Shape (level 2)', 'Primal Order: Herbalism'],
        gender: 'Female',
        alignment: 'Neutral Good',
        faith: 'Silvanus',
        lifestyle: 'Modest',
        classFeatures: ['Spellcasting', 'Druidic Language', 'Primal Order: Herbalism'],
        speciesTraits: ['Resourceful', 'Versatile', 'Skilled'],
        languages: ['Common', 'Druidic', 'Sylvan'],
        equipment: ['Scimitar', 'Wooden Shield', 'Leather Armor', 'Druidic Focus', 'Herbalism Kit', "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Scimitar', 'Weapon'),
            inventoryItem('Wooden Shield', 'Armor'),
            inventoryItem('Leather Armor', 'Armor'),
            inventoryItem('Druidic Focus (Totem)', 'Adventuring Gear'),
            inventoryItem('Herbalism Kit', 'Tools'),
            explorerPack()
        ],
        spells: ['Druidcraft', 'Shillelagh', 'Entangle', 'Speak with Animals', 'Cure Wounds', 'Healing Word'],
        classPreparedSpells: {
            'Druid': ['Druidcraft', 'Shillelagh', 'Entangle', 'Speak with Animals', 'Cure Wounds', 'Healing Word']
        },
        image: '/assets/images/premade/mira-thornwood.webp'
    },
    // ── Fighter ──────────────────────────────────────────────────────────
    {
        id: 'premade-orc-fighter',
        campaignId: '',
        name: 'Grommash Ironback',
        playerName: '',
        race: 'Orc',
        className: 'Fighter',
        level: 1,
        role: 'Tank',
        status: 'Ready',
        background: 'Soldier',
        notes: 'A seasoned warrior who has mastered every form of combat. Grommash leads with steel and endures what others cannot, the backbone of any adventuring party.',
        abilityScores: { strength: 17, dexterity: 13, constitution: 16, intelligence: 8, wisdom: 10, charisma: 8 },
        skills: { acrobatics: false, animalHandling: false, arcana: false, athletics: true, deception: false, history: false, insight: false, intimidation: true, investigation: false, medicine: false, nature: false, perception: true, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: true },
        armorClass: 16,
        hitPoints: 13,
        maxHitPoints: 13,
        proficiencyBonus: 2,
        traits: ['Adrenaline Rush', 'Darkvision', 'Relentless Endurance', 'Fighting Style: Great Weapon Fighting', 'Second Wind'],
        gender: 'Male',
        alignment: 'Lawful Neutral',
        faith: 'The Warrior\'s Path',
        lifestyle: 'Comfortable',
        classFeatures: ['Fighting Style: Great Weapon Fighting', 'Second Wind'],
        speciesTraits: ['Darkvision', 'Adrenaline Rush', 'Relentless Endurance'],
        languages: ['Common', 'Orc'],
        equipment: ['Greataxe', 'Chain Mail', 'Light Crossbow', '20 Crossbow Bolts', "Dungeoneer's Pack"],
        inventoryEntries: [
            inventoryItem('Greataxe', 'Weapon'),
            inventoryItem('Chain Mail', 'Armor'),
            inventoryItem('Light Crossbow', 'Weapon'),
            inventoryItem('Crossbow Bolt', 'Ammunition', 20),
            dungeoneersPack()
        ],
        spells: [],
        image: '/assets/images/premade/grommash-ironback.webp'
    },
    // ── Monk ─────────────────────────────────────────────────────────────
    {
        id: 'premade-tabaxi-monk',
        campaignId: '',
        name: 'Kyra Swiftpaw',
        playerName: '',
        race: 'Tabaxi',
        className: 'Monk',
        level: 1,
        role: 'Striker',
        status: 'Ready',
        background: 'Outlander',
        notes: 'A swift and disciplined martial artist who channels ki to perform supernatural feats. Kyra strikes faster than the eye can follow and vanishes before the echo fades.',
        abilityScores: { strength: 12, dexterity: 16, constitution: 14, intelligence: 8, wisdom: 15, charisma: 10 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: true, deception: false, history: false, insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: true, survival: true },
        armorClass: 15,
        hitPoints: 10,
        maxHitPoints: 10,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Feline Agility', "Cat's Claws", 'Martial Arts (d6)', 'Unarmored Defense'],
        gender: 'Female',
        alignment: 'Chaotic Good',
        faith: 'The Open Road',
        lifestyle: 'Wanderer',
        classFeatures: ['Martial Arts (d6)', 'Unarmored Defense'],
        speciesTraits: ['Darkvision', 'Feline Agility', "Cat's Claws", "Cat's Talent"],
        languages: ['Common', 'Tabaxi'],
        equipment: ['Shortsword', 'Dart (10)', "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Shortsword', 'Weapon'),
            inventoryItem('Dart', 'Weapon', 10),
            explorerPack()
        ],
        spells: [],
        image: '/assets/images/premade/kyra-swiftpaw.webp'
    },
    // ── Paladin ──────────────────────────────────────────────────────────
    {
        id: 'premade-aasimar-paladin',
        campaignId: '',
        name: 'Aldric Dawnblade',
        playerName: '',
        race: 'Aasimar',
        className: 'Paladin',
        level: 1,
        role: 'Tank',
        status: 'Ready',
        background: 'Acolyte',
        notes: 'A holy warrior bound by a sacred oath. Aldric strikes down evil with radiant power, shields allies behind divine grace, and is a beacon of hope on the darkest battlefields.',
        abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 12, charisma: 16 },
        skills: { acrobatics: false, animalHandling: false, arcana: false, athletics: true, deception: false, history: true, insight: true, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 18,
        hitPoints: 12,
        maxHitPoints: 12,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Celestial Resistance', 'Healing Hands', 'Divine Sense', 'Lay on Hands (5 HP)', 'Divine Smite', 'Spellcasting'],
        gender: 'Male',
        alignment: 'Lawful Good',
        faith: 'Pelor',
        lifestyle: 'Comfortable',
        classFeatures: ['Divine Sense', 'Lay on Hands (5 HP)', 'Divine Smite', 'Spellcasting'],
        speciesTraits: ['Darkvision', 'Celestial Resistance', 'Healing Hands', 'Light Bearer'],
        languages: ['Common', 'Celestial', 'Elvish', 'Dwarvish'],
        equipment: ['Longsword', 'Shield', 'Chain Mail', 'Holy Symbol', "Priest's Pack"],
        inventoryEntries: [
            inventoryItem('Longsword', 'Weapon'),
            inventoryItem('Shield', 'Armor'),
            inventoryItem('Chain Mail', 'Armor'),
            inventoryItem('Holy Symbol', 'Adventuring Gear'),
            inventoryItem('Backpack', 'Adventuring Gear', 1, {
                isContainer: true,
                maxCapacity: 60,
                containedItems: [
                    inventoryItem('Blanket', 'Adventuring Gear'),
                    inventoryItem('Candle', 'Adventuring Gear', 10),
                    inventoryItem('Tinderbox', 'Adventuring Gear'),
                    inventoryItem('Alms Box', 'Adventuring Gear'),
                    inventoryItem('Incense (2 blocks)', 'Adventuring Gear'),
                    inventoryItem('Censer', 'Adventuring Gear'),
                    inventoryItem('Vestments', 'Adventuring Gear'),
                    inventoryItem('Rations (1 day)', 'Adventuring Gear', 2),
                    inventoryItem('Waterskin', 'Adventuring Gear')
                ]
            })
        ],
        spells: ['Bless', 'Cure Wounds', 'Shield of Faith'],
        classPreparedSpells: {
            'Paladin': ['Bless', 'Cure Wounds', 'Shield of Faith']
        },
        image: '/assets/images/premade/aldric-dawnblade.webp'
    },
    // ── Ranger ───────────────────────────────────────────────────────────
    {
        id: 'premade-shifter-ranger',
        campaignId: '',
        name: 'Sable Quicktrail',
        playerName: '',
        race: 'Shifter',
        className: 'Ranger',
        level: 1,
        role: 'Scout',
        status: 'Ready',
        background: 'Outlander',
        notes: 'A master of the wilderness who hunts with patience and precision. Sable reads the land like a map and is never caught off-guard in terrain she calls home.',
        abilityScores: { strength: 12, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 14, charisma: 8 },
        skills: { acrobatics: true, animalHandling: true, arcana: false, athletics: true, deception: false, history: false, insight: false, intimidation: false, investigation: false, medicine: false, nature: true, perception: true, performance: false, persuasion: false, sleightOfHand: false, stealth: true, survival: true },
        armorClass: 14,
        hitPoints: 12,
        maxHitPoints: 12,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Bestial Instincts', 'Shifting', 'Favored Enemy', 'Natural Explorer', 'Spellcasting'],
        gender: 'Female',
        alignment: 'Neutral Good',
        faith: 'Mielikki',
        lifestyle: 'Wanderer',
        classFeatures: ['Favored Enemy', 'Natural Explorer', 'Spellcasting'],
        speciesTraits: ['Bestial Instincts', 'Darkvision', 'Natural Weapon', 'Shifting'],
        languages: ['Common'],
        equipment: ['Shortsword (2)', 'Longbow', 'Quiver (20 Arrows)', 'Leather Armor', "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Shortsword', 'Weapon', 2),
            inventoryItem('Longbow', 'Weapon'),
            quiverWithArrows(20),
            inventoryItem('Leather Armor', 'Armor'),
            explorerPack()
        ],
        spells: ["Hunter's Mark", 'Ensnaring Strike'],
        classPreparedSpells: {
            'Ranger': ["Hunter's Mark", 'Ensnaring Strike']
        },
        image: '/assets/images/premade/sable-quicktrail.webp'
    },
    // ── Sorcerer ─────────────────────────────────────────────────────────
    {
        id: 'premade-dragonborn-sorcerer',
        campaignId: '',
        name: "Kaz'ra Emberfang",
        playerName: '',
        race: 'Dragonborn',
        className: 'Sorcerer',
        level: 1,
        role: 'Caster',
        status: 'Ready',
        background: 'Noble',
        notes: 'Born with innate magical power flowing through draconic blood. Kaz\'ra shapes raw arcane energy into devastating spells without years of study, and breathes fire when spells run dry.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 10, charisma: 16 },
        skills: { acrobatics: false, animalHandling: false, arcana: true, athletics: false, deception: false, history: true, insight: false, intimidation: true, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 15,
        hitPoints: 9,
        maxHitPoints: 9,
        proficiencyBonus: 2,
        traits: ['Draconic Ancestry (Fire)', 'Breath Weapon', 'Damage Resistance (Fire)', 'Spellcasting', 'Font of Magic', 'Draconic Resilience'],
        gender: 'Female',
        alignment: 'Chaotic Neutral',
        faith: 'None',
        lifestyle: 'Comfortable',
        classFeatures: ['Spellcasting', 'Font of Magic', 'Draconic Bloodline: Red Dragon', 'Draconic Resilience'],
        speciesTraits: ['Draconic Ancestry (Fire)', 'Breath Weapon', 'Damage Resistance (Fire)'],
        languages: ['Common', 'Draconic', 'Elvish'],
        equipment: ['Dagger (2)', 'Component Pouch', "Dungeoneer's Pack"],
        inventoryEntries: [
            inventoryItem('Dagger', 'Weapon', 2),
            inventoryItem('Component Pouch', 'Adventuring Gear'),
            dungeoneersPack()
        ],
        spells: ['Sorcerous Burst', 'Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Chromatic Orb', 'Mage Armor'],
        classPreparedSpells: {
            'Sorcerer': ['Sorcerous Burst', 'Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Chromatic Orb', 'Mage Armor']
        },
        image: "/assets/images/premade/kaz'ra-emberfang.webp"
    },
    // ── Warlock ──────────────────────────────────────────────────────────
    {
        id: 'premade-gnome-warlock',
        campaignId: '',
        name: 'Nym Wickthorn',
        playerName: '',
        race: 'Gnome',
        className: 'Warlock',
        level: 1,
        role: 'Caster',
        status: 'Ready',
        background: 'Charlatan',
        notes: 'A cunning spellcaster who bargained with a powerful fiend for eldritch knowledge. Nym wields unsettling magic far beyond what others expect of someone so small.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 13, intelligence: 14, wisdom: 10, charisma: 16 },
        skills: { acrobatics: false, animalHandling: false, arcana: true, athletics: false, deception: true, history: true, insight: false, intimidation: false, investigation: true, medicine: false, nature: false, perception: false, performance: false, persuasion: false, sleightOfHand: true, stealth: false, survival: false },
        armorClass: 13,
        hitPoints: 9,
        maxHitPoints: 9,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Gnome Cunning', 'Natural Illusionist', 'Pact Magic', "Otherworldly Patron: The Fiend", "Dark One's Blessing"],
        gender: 'Male',
        alignment: 'Chaotic Neutral',
        faith: 'Mephistopheles (Patron)',
        lifestyle: 'Modest',
        classFeatures: ['Pact Magic', "Otherworldly Patron: The Fiend", "Dark One's Blessing"],
        speciesTraits: ['Darkvision', 'Gnome Cunning', 'Natural Illusionist'],
        languages: ['Common', 'Gnomish'],
        equipment: ['Dagger (2)', 'Leather Armor', 'Arcane Focus (Rod)', "Scholar's Pack"],
        inventoryEntries: [
            inventoryItem('Dagger', 'Weapon', 2),
            inventoryItem('Leather Armor', 'Armor'),
            inventoryItem('Arcane Focus (Rod)', 'Adventuring Gear'),
            scholarsPack()
        ],
        spells: ['Eldritch Blast', 'Mage Hand', 'Armor of Agathys', 'Hex'],
        classPreparedSpells: {
            'Warlock': ['Eldritch Blast', 'Mage Hand', 'Armor of Agathys', 'Hex']
        },
        image: '/assets/images/premade/nym-wickthorn.webp'
    },
    // ── Artificer ───────────────────────────────────────────────────────
    {
        id: 'premade-goblin-artificer',
        campaignId: '',
        name: 'Zikka Cogspark',
        playerName: '',
        race: 'Goblin',
        className: 'Artificer',
        level: 1,
        role: 'Support',
        status: 'Ready',
        background: 'Guild Artisan',
        notes: 'A brilliant magical inventor who keeps the party supplied with clever tools, battlefield tricks, and practical healing. Zikka treats every locked door and broken relic as an invitation.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 14, intelligence: 16, wisdom: 12, charisma: 10 },
        skills: { acrobatics: false, animalHandling: false, arcana: true, athletics: false, deception: false, history: true, insight: false, intimidation: false, investigation: true, medicine: false, nature: true, perception: false, performance: false, persuasion: false, sleightOfHand: true, stealth: true, survival: false },
        armorClass: 16,
        hitPoints: 10,
        maxHitPoints: 10,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Fey Ancestry', 'Nimble Escape', 'Magical Tinkering', 'Spellcasting'],
        gender: 'Female',
        alignment: 'Neutral Good',
        faith: 'Gond',
        lifestyle: 'Comfortable',
        classFeatures: ['Magical Tinkering', 'Spellcasting'],
        speciesTraits: ['Darkvision', 'Fey Ancestry', 'Fury of the Small', 'Nimble Escape'],
        languages: ['Common', 'Goblin', 'Dwarvish'],
        equipment: ['Light Crossbow', 'Scale Mail', "Thieves' Tools", "Tinker's Tools", "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Light Crossbow', 'Weapon'),
            inventoryItem('Crossbow Bolt', 'Ammunition', 20),
            inventoryItem('Scale Mail', 'Armor'),
            inventoryItem("Thieves' Tools", 'Tools'),
            inventoryItem("Tinker's Tools", 'Tools'),
            explorerPack()
        ],
        spells: ['Mending', 'Mage Hand', 'Fire Bolt', 'Cure Wounds', 'Faerie Fire'],
        classPreparedSpells: {
            'Artificer': ['Mending', 'Mage Hand', 'Fire Bolt', 'Cure Wounds', 'Faerie Fire']
        },
        image: '/assets/images/premade/zikka-cogspark.webp'
    },
    // ── Blood Hunter ────────────────────────────────────────────────────
    {
        id: 'premade-shadar-kai-blood-hunter',
        campaignId: '',
        name: 'Riven Ashmark',
        playerName: '',
        race: 'Shadar-Kai',
        className: 'Blood Hunter',
        level: 1,
        role: 'Striker',
        status: 'Ready',
        background: 'Haunted One',
        notes: 'A relentless hunter who turned forbidden hemocraft against the creatures that ruined his old life. Riven walks toward horrors others only whisper about.',
        abilityScores: { strength: 10, dexterity: 16, constitution: 14, intelligence: 12, wisdom: 14, charisma: 10 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: true, deception: false, history: false, insight: true, intimidation: true, investigation: false, medicine: false, nature: true, perception: true, performance: false, persuasion: false, sleightOfHand: false, stealth: true, survival: true },
        armorClass: 15,
        hitPoints: 12,
        maxHitPoints: 12,
        proficiencyBonus: 2,
        traits: ['Darkvision', 'Necrotic Resistance', 'Hunter’s Bane', 'Blood Maledict', 'Crimson Rite'],
        gender: 'Male',
        alignment: 'Neutral',
        faith: 'The Raven Queen',
        lifestyle: 'Wanderer',
        classFeatures: ['Hunter’s Bane', 'Blood Maledict', 'Crimson Rite'],
        speciesTraits: ['Blessing of the Raven Queen', 'Darkvision', 'Fey Ancestry', 'Necrotic Resistance', 'Trance'],
        languages: ['Common', 'Elvish', 'Abyssal'],
        equipment: ['Rapier', 'Hand Crossbow', 'Studded Leather', "Monster Hunter's Pack"],
        inventoryEntries: [
            inventoryItem('Rapier', 'Weapon'),
            inventoryItem('Hand Crossbow', 'Weapon'),
            inventoryItem('Crossbow Bolt', 'Ammunition', 20),
            inventoryItem('Studded Leather', 'Armor'),
            explorerPack()
        ],
        spells: [],
        image: '/assets/images/premade/riven-ashmark.webp'
    },
    // ── Gunslinger ──────────────────────────────────────────────────────
    {
        id: 'premade-human-gunslinger',
        campaignId: '',
        name: 'Marra Flintlock',
        playerName: '',
        race: 'Human',
        className: 'Gunslinger',
        level: 1,
        role: 'Striker',
        status: 'Ready',
        background: 'Soldier',
        notes: 'A sharp-eyed marksman who trusts grit, timing, and steady hands more than luck. Marra controls a battlefield by picking the right target at the right second.',
        abilityScores: { strength: 10, dexterity: 16, constitution: 14, intelligence: 12, wisdom: 14, charisma: 12 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: false, deception: true, history: true, insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: true, performance: false, persuasion: true, sleightOfHand: true, stealth: true, survival: false },
        armorClass: 15,
        hitPoints: 10,
        maxHitPoints: 10,
        proficiencyBonus: 2,
        traits: ['Grit', 'Combat Style: Deadeye', 'Firearm Training'],
        gender: 'Female',
        alignment: 'Lawful Neutral',
        faith: 'None',
        lifestyle: 'Modest',
        classFeatures: ['Grit', 'Combat Style: Deadeye', 'Firearm Training'],
        speciesTraits: ['Resourceful', 'Versatile', 'Skilled'],
        languages: ['Common'],
        equipment: ['Pistol', 'Dagger', 'Leather Armor', "Tinker's Tools", "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Pistol', 'Weapon'),
            inventoryItem('Bullet', 'Ammunition', 20),
            inventoryItem('Dagger', 'Weapon'),
            inventoryItem('Leather Armor', 'Armor'),
            inventoryItem("Tinker's Tools", 'Tools'),
            explorerPack()
        ],
        spells: [],
        image: '/assets/images/premade/marra-flintlock.webp'
    },
    // ── Monster Hunter ──────────────────────────────────────────────────
    {
        id: 'premade-minotaur-monster-hunter',
        campaignId: '',
        name: 'Korvak Mazehorn',
        playerName: '',
        race: 'Minotaur',
        className: 'Monster Hunter',
        level: 1,
        role: 'Scout',
        status: 'Ready',
        background: 'Outlander',
        notes: 'A veteran tracker who studies claws, curses, and old ruins before committing to the kill. Korvak thrives when the enemy is something no one else understands.',
        abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 14, wisdom: 12, charisma: 8 },
        skills: { acrobatics: false, animalHandling: true, arcana: false, athletics: true, deception: false, history: false, insight: true, intimidation: true, investigation: true, medicine: false, nature: true, perception: true, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: true },
        armorClass: 16,
        hitPoints: 12,
        maxHitPoints: 12,
        proficiencyBonus: 2,
        traits: ['Charge', 'Hammering Horns', 'Monster Lore', 'Predator’s Senses', 'Studied Strike'],
        gender: 'Male',
        alignment: 'Neutral Good',
        faith: 'Kord',
        lifestyle: 'Wanderer',
        classFeatures: ['Monster Lore', 'Predator’s Senses', 'Studied Strike'],
        speciesTraits: ['Charge', 'Goring Rush', 'Hammering Horns', 'Horns', 'Imposing Presence'],
        languages: ['Common'],
        equipment: ['Longsword', 'Heavy Crossbow', 'Chain Shirt', "Hunter's Kit", "Explorer's Pack"],
        inventoryEntries: [
            inventoryItem('Longsword', 'Weapon'),
            inventoryItem('Heavy Crossbow', 'Weapon'),
            inventoryItem('Crossbow Bolt', 'Ammunition', 20),
            inventoryItem('Chain Shirt', 'Armor'),
            explorerPack()
        ],
        spells: [],
        image: '/assets/images/premade/korvak-mazehorn.webp'
    }
];

export const premadeCharacters: PremadeCharacter[] = basePremadeCharacters.map((character) => enrichPremade(character));
