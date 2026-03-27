export interface ClassFeature {
    name: string;
    level: number;
    description?: string;
    choices?: {
        title: string;
        count: number;
        options: string[];
    };
}

export interface ClassFeaturesForLevel {
    level: number;
    features: ClassFeature[];
}

export const classOptions: ReadonlyArray<string> = [
    'Artificer', 'Barbarian', 'Blood Hunter', 'Bard', 'Cleric', 'Druid', 'Fighter',
    'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
];

const paladinWeaponMasteryOptions: ReadonlyArray<string> = [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear',
    'Crossbow, Light', 'Dart', 'Shortbow', 'Sling',
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar',
    'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip',
    'Blowgun', 'Crossbow, Hand', 'Crossbow, Heavy', 'Longbow', 'Net',
    'Antimatter Rifle', 'Automatic Rifle', 'Hunting Rifle', 'Laser Pistol', 'Laser Rifle', 'Musket', 'Pistol', 'Revolver', 'Shotgun'
];

const paladinClericCantripOptions: ReadonlyArray<string> = [
    'Guidance', 'Light', 'Mending', 'Resistance', 'Sacred Flame', 'Spare the Dying', 'Thaumaturgy'
];

const paladinFightingStyleFeatOptions: ReadonlyArray<string> = [
    'Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Interception', 'Protection', 'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting'
];

const paladinSubclassOptions: ReadonlyArray<string> = [
    'Oath of Devotion', 'Oath of Glory', 'Oath of the Ancients', 'Oath of Vengeance', 'Oath of Conquest',
    'Oath of Redemption', 'Oath of the Crown', 'Oath of the Watchers', 'Oathbreaker', 'Oath of the Open Sea (TCSR)'
];

const paladinFeatOptions: ReadonlyArray<string> = [
    'Ability Score Improvement', 'Alert', 'Athlete', 'Charger', 'Defensive Duelist', 'Dual Wielder', 'Elemental Adept',
    'Great Weapon Master', 'Heavy Armor Master', 'Inspiring Leader', 'Mage Slayer', 'Magic Initiate', 'Mounted Combatant',
    'Polearm Master', 'Resilient', 'Savage Attacker', 'Sentinel', 'Shield Master', 'Skill Expert', 'Skulker', 'Slasher',
    'Speedy', 'Spell Sniper', 'Tavern Brawler', 'Tough', 'War Caster', 'Weapon Master'
];

const paladinEpicBoonOptions: ReadonlyArray<string> = [
    'Boon of Combat Prowess', 'Boon of Dimensional Travel', 'Boon of Energy Resistance', 'Boon of Fate', 'Boon of Fortitude',
    'Boon of Irresistible Offense', 'Boon of Recovery', 'Boon of Skill', 'Boon of Speed', 'Boon of Spell Recall', 'Boon of the Night Spirit', 'Boon of Truesight'
];

export const classLevelOneFeatures: Record<string, ClassFeaturesForLevel[]> = {
    Artificer: [
        {
            level: 1, features: [
                {
                    name: 'Core Artificer Traits',
                    level: 1,
                    description: 'Blend invention and spellcasting through arcane tools.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand']
                    }
                },
                { name: 'Magical Tinkering', level: 1, description: 'Imbue mundane objects with minor magical effects.' },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Intelligence.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Infuse Item', level: 2, description: 'Create and maintain magical infusions on equipment.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Artificer Specialist', level: 3, description: 'Choose your Artificer subclass specialization.' },
                { name: 'The Right Tool for the Job', level: 3, description: 'Conjure the exact artisan tool needed for your work.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Artificer Specialist Feature', level: 5, description: 'Gain a feature from your Artificer specialization.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Tool Expertise', level: 6, description: 'Double your proficiency for selected tool checks.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Flash of Genius', level: 7, description: 'Add your Intelligence modifier to key checks and saves as support.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Artificer Specialist Feature', level: 9, description: 'Gain a feature from your Artificer specialization.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Magic Item Adept', level: 10, description: 'Improve attunement and crafting capacity for magic items.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Spell-Storing Item', level: 11, description: 'Store a prepared spell in an item for repeated use.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Magic Item Savant', level: 14, description: 'Further improve attunement limits and item use.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Artificer Specialist Feature', level: 15, description: 'Gain a feature from your Artificer specialization.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Magic Item Master', level: 18, description: 'Reach peak attunement and magic item mastery.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Ability Score Improvement', level: 19, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Soul of Artifice', level: 20, description: 'Gain your Artificer capstone feature.' }
            ]
        }
    ],
    Barbarian: [
        {
            level: 1, features: [
                {
                    name: 'Core Barbarian Traits',
                    level: 1,
                    description: 'Gain all barbarian proficiencies and hit dice.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']
                    }
                },
                { name: 'Rage', level: 1, description: 'Enter a primal rage 2 times per long rest. You gain advantage on Strength checks/saves and damage resistance while raging.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, your AC = 10 + Dexterity modifier + Constitution modifier.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Reckless Attack', level: 2, description: 'Attack with advantage before your allies take their turns. Attacks against you have advantage until your next turn.' },
                { name: 'Danger Sense', level: 2, description: 'Gain advantage on Dexterity saves you can see coming.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Barbarian Subclass', level: 3, description: 'Choose your Barbarian subclass.' },
                { name: 'Primal Knowledge', level: 3, description: 'Gain primal utility improvements.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action on your turn.' },
                { name: 'Fast Movement', level: 5, description: 'Your speed increases while not wearing heavy armor.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Feral Instinct', level: 7, description: 'Improve initiative and awareness in combat.' },
                { name: 'Instinctive Pounce', level: 7, description: 'Move aggressively when entering rage.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Brutal Strike', level: 9, description: 'Your heavy melee pressure scales upward.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Relentless Rage', level: 11, description: 'You can remain standing after dropping to 0 HP while raging.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Improved Brutal Strike', level: 13, description: 'Your brutal strike options improve.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Persistent Rage', level: 15, description: 'Your rage becomes harder to end early.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Improved Brutal Strike', level: 17, description: 'Your brutal strike options improve again.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Indomitable Might', level: 18, description: 'Your physical prowess becomes exceptionally reliable.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Primal Champion', level: 20, description: 'Reach the Barbarian capstone of primal strength and endurance.' }
            ]
        }
    ],
    'Blood Hunter': [
        {
            level: 1, features: [
                {
                    name: "Hunter's Bane and Blood Maledict",
                    level: 1,
                    description: 'Gain supernatural tracking abilities and blood curses.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Insight', 'Investigation', 'Medicine', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Blood Maledict', level: 1, description: 'Cast blood curses on enemies you can see. You know 1 curse at 1st level.' },
                { name: 'Crimson Rite', level: 1, description: 'Infuse your weapon with elemental power by spending hit points.' }
            ]
        }
    ],
    Bard: [
        {
            level: 1, features: [
                {
                    name: 'Core Bard Traits',
                    level: 1,
                    description: 'Gain spellcasting and bardic inspiration.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies from any skill',
                        count: 2,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma. Know 4 cantrips and have 2 1st-level spell slots.' },
                { name: 'Bardic Inspiration', level: 1, description: 'Grant allies inspiration dice (d6) they can add to ability checks, attack rolls, or saves.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Jack of All Trades', level: 2, description: 'Add half your proficiency bonus to ability checks you don\'t already add proficiency to.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Bard Subclass', level: 3, description: 'Choose your Bard subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Font of Inspiration', level: 5, description: 'Your inspiration engine improves at this tier.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Bard subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Countercharm', level: 7, description: 'Use performance to protect allies from disruptive effects.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Broaden your mastery in chosen proficiencies.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Magical Secrets', level: 10, description: 'Learn spells outside the Bard list.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Bard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Inspiration', level: 18, description: 'Your inspiration support reaches late-tier reliability.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Words of Creation', level: 20, description: 'Gain your Bard capstone feature.' }
            ]
        }
    ],
    Cleric: [
        {
            level: 1, features: [
                {
                    name: 'Core Cleric Traits',
                    level: 1,
                    description: 'Gain divine spellcasting and channel divinity.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Insight', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Divine Order', level: 1, description: 'Choose your divine training focus.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Channel Divinity', level: 2, description: 'Gain Channel Divinity uses and options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Cleric Subclass', level: 3, description: 'Choose your Divine Domain subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Sear Undead', level: 5, description: 'Your anti-undead channeling power increases.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Cleric subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Blessed Strikes', level: 7, description: 'Your divine strikes improve your offense.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Divine Intervention', level: 10, description: 'Call directly on divine aid.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Improved Blessed Strikes', level: 14, description: 'Your blessed strikes gain additional power.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Cleric subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Greater Divine Intervention', level: 20, description: 'Your divine intervention reaches its capstone power.' }
            ]
        }
    ],
    Druid: [
        {
            level: 1, features: [
                {
                    name: 'Core Druid Traits',
                    level: 1,
                    description: 'Gain nature spellcasting and wild shape capability.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Animal Handling', 'Arcana', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Druidic', level: 1, description: 'Learn the Druidic secret language.' },
                { name: 'Primal Order', level: 1, description: 'Choose your primal training focus.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Wild Shape', level: 2, description: 'Transform into beasts.' },
                { name: 'Wild Companion', level: 2, description: 'Summon a temporary familiar-like companion.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Druid Subclass', level: 3, description: 'Choose your Druid Circle.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Wild Resurgence', level: 5, description: 'Improve your wild shape resource cycle.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Elemental Fury', level: 7, description: 'Gain stronger elemental output options.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Druid subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Improved Elemental Fury', level: 15, description: 'Your elemental fury upgrades in late tiers.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Beast Spells', level: 18, description: 'Cast spells while in beast form.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Archdruid', level: 20, description: 'Gain your Druid capstone feature.' }
            ]
        }
    ],
    Fighter: [
        {
            level: 1, features: [
                {
                    name: 'Core Fighter Traits',
                    level: 1,
                    description: 'Master martial combat with weapon and armor proficiency.',
                    choices: {
                        title: 'Choose 1 Fighting Style',
                        count: 1,
                        options: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting', 'Blind Fighting', 'Blessed Warrior', 'Mariner', 'Thrown Weapon Fighting', 'Unarmed Fighting']
                    }
                },
                {
                    name: 'Fighting Style',
                    level: 1,
                    description: 'Gain specific combat bonuses based on your chosen fighting style.'
                },
                { name: 'Second Wind', level: 1, description: 'Recover hit points as a bonus action.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Action Surge (one use)', level: 2, description: 'Take an additional action on your turn.' },
                { name: 'Tactical Mind', level: 2, description: 'Gain tactical combat utility options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Fighter Subclass', level: 3, description: 'Choose your Fighter subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action.' },
                { name: 'Tactical Shift', level: 5, description: 'Gain enhanced battlefield mobility options.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Ability Score Improvement', level: 6, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Indomitable (one use)', level: 9, description: 'Reroll a failed saving throw.' },
                { name: 'Tactical Master', level: 9, description: 'Gain advanced tactical options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Two Extra Attacks', level: 11, description: 'Attack three times when taking the Attack action.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Indomitable (two uses)', level: 13, description: 'Gain an additional Indomitable use.' },
                { name: 'Studied Attacks', level: 13, description: 'Refine your offensive tactical pressure.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Ability Score Improvement', level: 14, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Action Surge (two uses)', level: 17, description: 'Gain an additional Action Surge use.' },
                { name: 'Indomitable (three uses)', level: 17, description: 'Gain a third Indomitable use.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Subclass Feature', level: 18, description: 'Gain a feature from your Fighter subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Three Extra Attacks', level: 20, description: 'Attack four times when taking the Attack action.' }
            ]
        }
    ],
    Monk: [
        {
            level: 1, features: [
                {
                    name: 'Core Monk Traits',
                    level: 1,
                    description: 'Master martial arts with discipline and mobility.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']
                    }
                },
                { name: 'Martial Arts', level: 1, description: 'Use Martial Arts for enhanced unarmed combat.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, AC = 10 + Wisdom modifier + Dexterity modifier.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Monk\'s Focus', level: 2, description: 'Gain your core focus resource engine.' },
                { name: 'Unarmored Movement', level: 2, description: 'Your movement speed increases.' },
                { name: 'Uncanny Metabolism', level: 2, description: 'Gain improved endurance through your monk resource cycle.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Deflect Attacks', level: 3, description: 'Reduce incoming attack damage with monk reactions.' },
                { name: 'Monk Subclass', level: 3, description: 'Choose your Monastic Tradition subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' },
                { name: 'Slow Fall', level: 4, description: 'Reduce falling damage with disciplined movement.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when you take the Attack action.' },
                { name: 'Stunning Strike', level: 5, description: 'Attempt to stun enemies with focused strikes.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Empowered Strikes', level: 6, description: 'Your strikes become empowered for overcoming resistance.' },
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'Improve survivability against area effects.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Acrobatic Movement', level: 9, description: 'Gain advanced movement options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Heightened Focus', level: 10, description: 'Your focus resource utility improves.' },
                { name: 'Self-Restoration', level: 10, description: 'Gain improved self-sustain and recovery.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Deflect Energy', level: 13, description: 'Expand your deflection techniques against energy effects.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Disciplined Survivor', level: 14, description: 'Your discipline reinforces key saving throw resilience.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Perfect Focus', level: 15, description: 'Improve your focus economy in extended adventuring.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Monk subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Defense', level: 18, description: 'Reach late-game defensive mastery.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Body and Mind', level: 20, description: 'Gain your Monk capstone feature.' }
            ]
        }
    ],
    Paladin: [
        {
            level: 1, features: [
                {
                    name: 'Core Paladin Traits',
                    level: 1,
                    description: 'Gain holy warrior training and oath preparation.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Lay On Hands', level: 1, description: 'Restore hit points from your Lay On Hands pool.' },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma.' },
                {
                    name: 'Weapon Mastery',
                    level: 1,
                    description: 'Gain mastery options for selected weapons.',
                    choices: {
                        title: 'Choose 2 Weapon Masteries',
                        count: 2,
                        options: [...paladinWeaponMasteryOptions]
                    }
                }
            ]
        },
        {
            level: 2, features: [
                {
                    name: 'Fighting Style',
                    level: 2,
                    description: 'Choose your holy combat style.',
                    choices: {
                        title: 'Choose 1 Fighting Style Option',
                        count: 1,
                        options: ['Blessed Warrior', 'Fighting Style Feat']
                    }
                },
                {
                    name: 'Blessed Warrior Cantrips',
                    level: 2,
                    description: 'If you choose Blessed Warrior, choose two Cleric cantrips.',
                    choices: {
                        title: 'Choose 2 Cleric Cantrips',
                        count: 2,
                        options: [...paladinClericCantripOptions]
                    }
                },
                {
                    name: 'Fighting Style Feat',
                    level: 2,
                    description: 'If you choose Fighting Style Feat, select one Fighting Style feat.',
                    choices: {
                        title: 'Choose 1 Fighting Style Feat',
                        count: 1,
                        options: [...paladinFightingStyleFeatOptions]
                    }
                },
                { name: 'Paladin\'s Smite', level: 2, description: 'Enhance weapon strikes with divine smites.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Channel Divinity', level: 3, description: 'Gain sacred channel divinity options.' },
                {
                    name: 'Paladin Subclass',
                    level: 3,
                    description: 'Choose your Sacred Oath subclass.',
                    choices: {
                        title: 'Choose 1 Sacred Oath',
                        count: 1,
                        options: [...paladinSubclassOptions]
                    }
                }
            ]
        },
        {
            level: 4, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 4,
                    description: 'Increase your ability scores or take a feat.',
                    choices: {
                        title: 'Choose 1 Feat or Ability Score Improvement',
                        count: 1,
                        options: [...paladinFeatOptions]
                    }
                }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when taking the Attack action.' },
                { name: 'Faithful Steed', level: 5, description: 'Gain your oath-bound mount support feature.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Aura of Protection', level: 6, description: 'Project a protective aura to aid nearby allies.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Paladin subclass.' }
            ]
        },
        {
            level: 8, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 8,
                    description: 'Increase your ability scores or take a feat.',
                    choices: {
                        title: 'Choose 1 Feat or Ability Score Improvement',
                        count: 1,
                        options: [...paladinFeatOptions]
                    }
                }
            ]
        },
        {
            level: 9, features: [
                { name: 'Abjure Foes', level: 9, description: 'Gain stronger anti-foe control options.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Aura of Courage', level: 10, description: 'Bolster allies against fear effects.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Radiant Strikes', level: 11, description: 'Your strikes carry radiant power.' }
            ]
        },
        {
            level: 12, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 12,
                    description: 'Increase your ability scores or take a feat.',
                    choices: {
                        title: 'Choose 1 Feat or Ability Score Improvement',
                        count: 1,
                        options: [...paladinFeatOptions]
                    }
                }
            ]
        },
        {
            level: 14, features: [
                { name: 'Restoring Touch', level: 14, description: 'Gain improved restorative support options.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Paladin subclass.' }
            ]
        },
        {
            level: 16, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 16,
                    description: 'Increase your ability scores or take a feat.',
                    choices: {
                        title: 'Choose 1 Feat or Ability Score Improvement',
                        count: 1,
                        options: [...paladinFeatOptions]
                    }
                }
            ]
        },
        {
            level: 18, features: [
                { name: 'Aura Expansion', level: 18, description: 'Your protective aura extends farther.' }
            ]
        },
        {
            level: 19, features: [
                {
                    name: 'Epic Boon',
                    level: 19,
                    description: 'Gain a powerful epic boon.',
                    choices: {
                        title: 'Choose 1 Epic Boon',
                        count: 1,
                        options: [...paladinEpicBoonOptions]
                    }
                }
            ]
        },
        {
            level: 20, features: [
                { name: 'Subclass Feature', level: 20, description: 'Gain your final Paladin subclass feature.' }
            ]
        }
    ],
    Ranger: [
        {
            level: 1, features: [
                {
                    name: 'Core Ranger Traits',
                    level: 1,
                    description: 'Gain tracking and exploration abilities.',
                    choices: {
                        title: 'Choose 3 Skill Proficiencies',
                        count: 3,
                        options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Wisdom.' },
                { name: 'Favored Enemy', level: 1, description: 'Gain favored enemy tracking and combat benefits.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Deft Explorer', level: 2, description: 'Gain exploration and travel utility upgrades.' },
                { name: 'Fighting Style', level: 2, description: 'Choose your Ranger fighting style.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Ranger Subclass', level: 3, description: 'Choose your Ranger subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice when taking the Attack action.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Roving', level: 6, description: 'Gain improved movement and traversal benefits.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Expand your specialized skill expertise.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Tireless', level: 10, description: 'Gain improved stamina and recovery utility.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Relentless Hunter', level: 13, description: 'Your hunting pressure improves in prolonged encounters.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Nature\'s Veil', level: 14, description: 'Gain concealment and repositioning support.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain a feature from your Ranger subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Precise Hunter', level: 17, description: 'Gain higher-tier precision tools.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Feral Senses', level: 18, description: 'Your awareness becomes exceptionally sharp.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Foe Slayer', level: 20, description: 'Gain your Ranger capstone feature.' }
            ]
        }
    ],
    Rogue: [
        {
            level: 1, features: [
                {
                    name: 'Core Rogue Traits',
                    level: 1,
                    description: 'Master stealth, precision, and deception.',
                    choices: {
                        title: 'Choose 4 Skill Proficiencies from any skills',
                        count: 4,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Expertise', level: 1, description: 'Double proficiency bonus on chosen proficiencies.' },
                { name: 'Sneak Attack', level: 1, description: 'Deal extra damage when conditions are met.' },
                { name: 'Thieves\' Cant', level: 1, description: 'Understand and use rogue cant communication.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain mastery options for selected weapons.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Cunning Action', level: 2, description: 'Use bonus actions for mobility and stealth options.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Rogue Subclass', level: 3, description: 'Choose your Rogue subclass.' },
                { name: 'Steady Aim', level: 3, description: 'Use careful aiming to improve attack reliability.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Cunning Strike', level: 5, description: 'Apply tactical strike riders to sneak attack turns.' },
                { name: 'Uncanny Dodge', level: 5, description: 'Reduce incoming damage using your reaction.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Expertise', level: 6, description: 'Gain additional expertise choices.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'Improve survivability against area effects.' },
                { name: 'Reliable Talent', level: 7, description: 'Increase consistency on proficient checks.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Subclass Feature', level: 9, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Ability Score Improvement', level: 10, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Improved Cunning Strike', level: 11, description: 'Your cunning strike options improve.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Subclass Feature', level: 13, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Devious Strikes', level: 14, description: 'Gain advanced strike manipulation options.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Slippery Mind', level: 15, description: 'Your mental defenses improve.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Rogue subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Elusive', level: 18, description: 'Become extremely difficult to pin down.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Stroke of Luck', level: 20, description: 'Gain your Rogue capstone feature.' }
            ]
        }
    ],
    Sorcerer: [
        {
            level: 1, features: [
                {
                    name: 'Core Sorcerer Traits',
                    level: 1,
                    description: 'Gain innate arcane spellcasting from your bloodline or origin.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Charisma. Know 4 cantrips and have 2 1st-level spell slots.' },
                { name: 'Sorcerous Origin', level: 1, description: 'Choose your Sorcerous Origin, which grants subclass features at levels 1, 6, 14, and 18.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Font of Magic', level: 2, description: 'Gain Sorcery Points (2 at this level) to fuel class features and convert spell slots.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Metamagic', level: 3, description: 'Choose 2 Metamagic options to modify your spells.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 4, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Magical Guidance (Optional)', level: 5, description: 'Optional feature allowing a Sorcery Point to reroll a failed ability check.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Sorcerous Origin Feature', level: 6, description: 'Gain an additional feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 8, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Metamagic', level: 10, description: 'Learn one additional Metamagic option.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 12, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Sorcerous Origin Feature', level: 14, description: 'Gain another feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 16, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Metamagic', level: 17, description: 'Learn one additional Metamagic option.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Sorcerous Origin Feature', level: 18, description: 'Gain your final high-level feature from your chosen Sorcerous Origin.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Ability Score Improvement', level: 19, description: 'Increase one ability score by 2, or two ability scores by 1 each.' },
                { name: 'Sorcerous Versatility (Optional)', level: 19, description: 'Optional class feature allowing flexible spell or cantrip changes.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Sorcerous Restoration', level: 20, description: 'At capstone, recover spent Sorcery Points on short rest as defined by class rules.' }
            ]
        }
    ],
    Warlock: [
        {
            level: 1, features: [
                {
                    name: 'Core Warlock Traits',
                    level: 1,
                    description: 'Form a pact for eldritch power.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Nature', 'Religion']
                    }
                },
                { name: 'Eldritch Invocations', level: 1, description: 'Gain eldritch invocation options.' },
                { name: 'Pact Magic', level: 1, description: 'Cast spells using Warlock pact magic.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Magical Cunning', level: 2, description: 'Improve your pact resource utility.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Warlock Subclass', level: 3, description: 'Choose your Warlock subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Contact Patron', level: 9, description: 'Gain expanded communion with your patron.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Mystic Arcanum (level 6 spell)', level: 11, description: 'Gain a once-per-long-rest 6th-level arcanum spell.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Mystic Arcanum (level 7 spell)', level: 13, description: 'Gain a once-per-long-rest 7th-level arcanum spell.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Warlock subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Mystic Arcanum (level 8 spell)', level: 15, description: 'Gain a once-per-long-rest 8th-level arcanum spell.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Mystic Arcanum (level 9 spell)', level: 17, description: 'Gain a once-per-long-rest 9th-level arcanum spell.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Eldritch Master', level: 20, description: 'Gain your Warlock capstone feature.' }
            ]
        }
    ],
    Wizard: [
        {
            level: 1, features: [
                {
                    name: 'Core Wizard Traits',
                    level: 1,
                    description: 'Gain the broadest arcane spell access through study.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'Cast spells using Intelligence.' },
                { name: 'Ritual Adept', level: 1, description: 'Gain enhanced ritual-casting utility.' },
                { name: 'Arcane Recovery', level: 1, description: 'Recover expended spell resources on short rest.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Scholar', level: 2, description: 'Gain scholarly magical utility improvements.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Wizard Subclass', level: 3, description: 'Choose your Wizard subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Memorize Spell', level: 5, description: 'Gain expanded preparation flexibility.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Wizard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or take a feat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Spell Mastery', level: 18, description: 'Master selected spells for frequent use.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain a powerful epic boon.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Signature Spells', level: 20, description: 'Gain your Wizard capstone feature.' }
            ]
        }
    ]
};


