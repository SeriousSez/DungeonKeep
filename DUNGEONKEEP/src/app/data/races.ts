import { Race } from '../models/dungeon.models';

export const races: Race[] = [
    {
        id: 'human',
        name: 'Human',
        abilityBonuses: {},
        traits: ['Resourceful: Gain Heroic Inspiration when you finish a Long Rest', 'Skillful: Gain proficiency in one skill of your choice', 'Versatile: Gain one Origin Feat of your choice'],
        size: 'Medium',
        speed: 30,
        languages: ['Common'],
        description: 'Humans are ambitious, inventive, and endlessly versatile. They walk the lands of all the world in great numbers.'
    },
    {
        id: 'dwarf',
        name: 'Dwarf',
        abilityBonuses: {},
        traits: ['Darkvision: You have Darkvision with a range of 120 feet', 'Dwarven Resilience: Advantage on saves against Poisoned; Resistance to poison damage', 'Dwarven Toughness: Your hit point maximum increases by 1 per level', 'Stonecunning: As a Bonus Action, gain Tremorsense for 10 minutes'],
        size: 'Medium',
        speed: 30,
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
        abilityBonuses: {},
        traits: ['Dragon Ancestry: Choose your dragon type', 'Breath Weapon: Exhale destructive energy in a line or cone', 'Damage Resistance: Resistance to your ancestry damage type', 'Darkvision: You have Darkvision with a range of 60 feet', 'Draconic Flight: At 5th level, manifest spectral wings to fly'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Draconic'],
        description: 'Dragonborn descend from dragons, manifesting draconic power and presence.'
    },
    {
        id: 'gnome',
        name: 'Gnome',
        abilityBonuses: {},
        traits: ['Darkvision: You have Darkvision with a range of 60 feet', 'Gnomish Cunning: Advantage on Intelligence, Wisdom, and Charisma saves against magic', 'Gnomish Lineage: Choose a lineage such as Forest, Rock, or Deep Gnome'],
        size: 'Small',
        speed: 30,
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
        abilityBonuses: {},
        traits: ['Relentless Endurance: When reduced to 0 HP, drop to 1 HP instead (once per rest)', 'Savage Attacks: Roll additional damage dice on critical hits', 'Darkvision: Can see in dim light within 60 feet'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Orc'],
        description: 'Half-orcs are the turbulent union of the civilized world and the wild. Their bravery and raw power mark their bloodline.'
    },
    {
        id: 'orc',
        name: 'Orc',
        abilityBonuses: {},
        traits: ['Adrenaline Rush: Take the Dash action as a Bonus Action and gain temporary hit points', 'Darkvision: You have Darkvision with a range of 120 feet', 'Relentless Endurance: When reduced to 0 HP, drop to 1 HP instead (once per Long Rest)'],
        size: 'Medium',
        speed: 30,
        languages: ['Common', 'Orc'],
        description: 'Orcs are equipped with gifts to help them wander great plains, vast caverns, and churning seas.'
    },
    {
        id: 'tiefling',
        name: 'Tiefling',
        abilityBonuses: {},
        traits: ['Darkvision: You have Darkvision with a range of 60 feet', 'Fiendish Legacy: Choose Abyssal, Chthonic, or Infernal legacy spells', 'Otherworldly Presence: You know the Thaumaturgy cantrip'],
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
