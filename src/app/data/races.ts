import { Race } from '../models/dungeon.models';

export const races: Race[] = [
    {
        id: 'human',
        name: 'Human',
        abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
        traits: ['Versatility: +1 to all ability scores', 'Diverse Heritage: can choose any feat at 1st level'],
        size: 'Medium',
        speed: 30,
        languages: ['Common'],
        description: 'Humans are ambitious, inventive, and endlessly versatile. They walk the lands of all the world in great numbers.'
    },
    {
        id: 'dwarf',
        name: 'Dwarf',
        abilityBonuses: { constitution: 2, wisdom: 1 },
        traits: ['Dwarven Resilience: Resistance to poison damage', 'Dwarven Combat Training: Proficiency with axes and hammers', 'Stonecunning: Advantage on Architecture checks related to stone'],
        size: 'Medium',
        speed: 25,
        languages: ['Common', 'Dwarvish'],
        description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.'
    },
    {
        id: 'elf',
        name: 'Elf',
        abilityBonuses: { dexterity: 2, intelligence: 1 },
        traits: ['Keen Senses: Proficiency in Perception', 'Fey Ancestry: Advantage against being charmed or put to sleep', 'Trance: Meditate instead of sleeping'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Elvish'],
        description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it.'
    },
    {
        id: 'halfling',
        name: 'Halfling',
        abilityBonuses: { dexterity: 2, charisma: 1 },
        traits: ['Naturally Stealthy: Can hide even when only lightly obscured', 'Halfling Nimbleness: Can move through larger creatures\' spaces', 'Lucky: Reroll natural 1s on attack rolls'],
        size: 'Small',
        speed: 25,
        languages: ['Common', 'Halfling'],
        description: 'The diminutive halflings have inhabited the edges of the known world. They prefer quiet lives in peaceful communities.'
    },
    {
        id: 'dragonborn',
        name: 'Dragonborn',
        abilityBonuses: { strength: 2, charisma: 1 },
        traits: ['Draconic Ancestry: Choose a dragon type for resistances', 'Breath Weapon: Exhale destructive energy (3d6 at 1st level)', 'Damage Resistance: Resistance to damage type matching your ancestry'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Draconic'],
        description: 'Dragonborn descend from dragons, manifesting draconic power and presence.'
    },
    {
        id: 'gnome',
        name: 'Gnome',
        abilityBonuses: { intelligence: 2, wisdom: 1 },
        traits: ['Gnome Cunning: Advantage on INT, WIS, CHA saves against spells', 'Natural Tinker: Can create small devices', 'Darkvision: Can see in dim light within 60 feet'],
        size: 'Small',
        speed: 25,
        languages: ['Common', 'Gnomish'],
        description: 'The arrival of humans meant the departure of gnomes from the world. Gnomes were not heard of again for many years.'
    },
    {
        id: 'half-elf',
        name: 'Half-Elf',
        abilityBonuses: { charisma: 2, dexterity: 1, intelligence: 1 },
        traits: ['Fey Ancestry: Advantage against being charmed or put to sleep', 'Versatile Heritage: Proficiency in two skills of choice', 'Darkvision: Can see in dim light within 60 feet'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Elvish'],
        description: 'Half-elves walk between worlds, accepted in neither. They live as bridges between cultures.'
    },
    {
        id: 'half-orc',
        name: 'Half-Orc',
        abilityBonuses: { strength: 2, constitution: 1, intelligence: -1 },
        traits: ['Relentless Endurance: When reduced to 0 HP, drop to 1 HP instead (once per rest)', 'Savage Attacks: Roll additional damage dice on critical hits', 'Darkvision: Can see in dim light within 60 feet'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Orc'],
        description: 'Half-orcs are the turbulent union of the civilized world and the wild. Their bravery and raw power mark their bloodline.'
    },
    {
        id: 'tiefling',
        name: 'Tiefling',
        abilityBonuses: { intelligence: 1, charisma: 2 },
        traits: ['Infernal Legacy: Know the Thaumaturgy cantrip', 'Darkvision: Can see in dim light within 60 feet', 'Resistance to Fire: Resistance to fire damage', 'Hellish Resistance: Innate magical abilities reflecting infernal heritage'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Infernal'],
        description: 'Tieflings are touched by infernal power, bearing visible marks of their bloodline.'
    },
    {
        id: 'goliath',
        name: 'Goliath',
        abilityBonuses: { strength: 2, constitution: 1, wisdom: 1 },
        traits: ['Stone\'s Endurance: Reduce damage to self by 1d12+CON (once per rest)', 'Powerful Build: Can push/drag 1.5x their carrying capacity', 'Mountain Born: Acclimated to high altitudes'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Giant'],
        description: 'Goliaths are considered rare and unusual. Mountain born, they are natural athletes and warriors.'
    },
    {
        id: 'aasimar',
        name: 'Aasimar',
        abilityBonuses: { charisma: 2, wisdom: 1 },
        traits: ['Celestial Resistance: Resistance to necrotic and radiant damage', 'Heavenly Step: Can cast Lesser Restoration once per long rest', 'Light Bearer: Know the Light cantrip', 'Radiant Soul: Can manifest wings and fly for 1 minute (once per long rest)'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Celestial'],
        description: 'Aasimar are descended from celestial beings, bearing a spark of heavenly light.'
    },
    {
        id: 'firbolg',
        name: 'Firbolg',
        abilityBonuses: { wisdom: 2, strength: 1, constitution: 1 },
        traits: ['Firbolg Magic: Cast Detect Magic once per long rest', 'Hidden Step: Turn invisible until end of turn (once per short rest)', 'Powerful Build: Count as one size larger for carrying capacity', 'Speech of Beast and Leaf: Communicate simply with beasts and plants'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Sylvan'],
        description: 'Firbolgs are cautious and protective of civilizations they observe from afar, preferring to remain hidden.'
    },
    {
        id: 'genasi',
        name: 'Genasi (Air)',
        abilityBonuses: { dexterity: 2, constitution: 1 },
        traits: ['Air Affinity: Cast Feather Fall once per long rest', 'Unending Wind: Can hold breath indefinitely while not incapacitated', 'Mingle with the Wind: Cast Levitate once per long rest'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Primordial'],
        description: 'Air genasi carry the power of elemental air, light-footed and swift.'
    },
    {
        id: 'tortle',
        name: 'Tortle',
        abilityBonuses: { strength: 2, wisdom: 1 },
        traits: ['Natural Armor: AC 15+DEX (with shield)', 'Shell Defense: Retreat into shell to gain +4 to AC against ranged attacks', 'Aquatic Adeptness: Can hold breath up to 1 hour'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Aquan'],
        description: 'Tortles are long-lived, patient reptilians who believe in personal honor and self-improvement.'
    }
];

export const raceMap = new Map(races.map(r => [r.id, r]));
