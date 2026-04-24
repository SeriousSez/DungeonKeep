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
    'Gunslinger', 'Monk', 'Monster Hunter', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
];

const paladinWeaponMasteryOptions: ReadonlyArray<string> = [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear',
    'Crossbow, Light', 'Dart', 'Shortbow', 'Sling',
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar',
    'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip',
    'Blowgun', 'Crossbow, Hand', 'Crossbow, Heavy', 'Longbow', 'Net',
    'Antimatter Rifle', 'Automatic Rifle', 'Hunting Rifle', 'Laser Pistol', 'Laser Rifle', 'Musket', 'Pistol', 'Revolver', 'Shotgun'
];

const barbarianSkillChoiceOptions: ReadonlyArray<string> = [
    'Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'
];

const barbarianWeaponMasteryChoiceOptions: ReadonlyArray<string> = [
    'Club (Slow)', 'Dagger (Nick)', 'Greatclub (Push)', 'Handaxe (Vex)', 'Javelin (Slow)', 'Light Hammer (Nick)', 'Mace (Sap)', 'Quarterstaff (Topple)', 'Sickle (Nick)', 'Spear (Sap)',
    'Battleaxe (Topple)', 'Flail (Sap)', 'Glaive (Graze)', 'Greataxe (Cleave)', 'Greatsword (Graze)', 'Halberd (Cleave)', 'Lance (Topple)', 'Longsword (Sap)', 'Maul (Topple)', 'Morningstar (Sap)',
    'Pike (Push)', 'Rapier (Vex)', 'Scimitar (Nick)', 'Shortsword (Vex)', 'Trident (Topple)', 'War Pick (Sap)', 'Warhammer (Push)', 'Whip (Slow)'
];

const barbarianSubclassOptions: ReadonlyArray<string> = [
    'Path of the Berserker',
    'Path of the Wild Heart',
    'Path of the World Tree',
    'Path of the Zealot'
];

const bloodHunterSubclassOptions: ReadonlyArray<string> = [
    'Order of the Ghostslayer',
    'Order of the Lycan',
    'Order of the Mutant',
    'Order of the Profane Soul'
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
                    description: 'You blend invention, study, and magic item craft into a single discipline, gaining Artificer proficiencies and tool-driven spell support.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand']
                    }
                },
                { name: 'Magical Tinkering', level: 1, description: 'Touch a Tiny nonmagical object and give it a minor magical property such as light, a recorded message, a constant odor or sound, or a small visual effect that lasts until you replace it.' },
                { name: 'Spellcasting', level: 1, description: 'You cast spells using Intelligence and Artificer tools, preparing spells from the Artificer list each day.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Infuse Item', level: 2, description: 'After a Long Rest, turn mundane gear into enhanced magical equipment by applying known infusions. Only a limited number of infused items can stay active at once.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Artificer Specialist', level: 3, description: 'Choose the specialist path that defines your inventions and grants subclass features at later levels.' },
                { name: 'The Right Tool for the Job', level: 3, description: 'With tinkering time, you can produce the exact set of artisan’s tools needed for a task, giving you flexible problem-solving support.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Artificer Specialist Feature', level: 5, description: 'Gain the next feature from your chosen Artificer Specialist.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Tool Expertise', level: 6, description: 'Your practice with tools becomes exceptional, doubling your Proficiency Bonus for checks made with tools you’re proficient with.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Flash of Genius', level: 7, description: 'When you or another creature nearby makes an ability check or saving throw, you can use your reaction to add your Intelligence modifier and turn a near miss into a success.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Artificer Specialist Feature', level: 9, description: 'Gain the next feature from your chosen Artificer Specialist.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Magic Item Adept', level: 10, description: 'Your item craft accelerates, letting you attune more magic items and handle enchanted gear with much greater ease.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Spell-Storing Item', level: 11, description: 'Store a simple prepared spell in an item so it can be produced multiple times without spending your spell slots each use.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Magic Item Savant', level: 14, description: 'Your bond with enchanted gear deepens further, expanding attunement capacity and letting you wield more items effectively.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Artificer Specialist Feature', level: 15, description: 'Gain the next feature from your chosen Artificer Specialist.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Magic Item Master', level: 18, description: 'You reach peak magical-item attunement and can sustain an exceptional number of powerful items at the same time.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Ability Score Improvement', level: 19, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Soul of Artifice', level: 20, description: 'Your life becomes inseparable from your creations, turning attuned items into a major defensive and survivability boost.' }
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
                        options: [...barbarianSkillChoiceOptions]
                    }
                },
                { name: 'Rage', level: 1, description: 'You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience. You can enter it as a Bonus Action if you aren’t wearing Heavy armor.\n\nYou can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\n\nWhile active, your Rage follows the rules below.\n\n**Damage Resistance.** You have Resistance to Bludgeoning, Piercing, and Slashing damage.\n\n**Rage Damage.** When you make an attack using Strength—with either a weapon or an Unarmed Strike—and deal damage to the target, you gain a bonus to the damage that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian Features table.\n\n**Strength Advantage.** You have Advantage on Strength checks and Strength saving throws.\n\n**No Concentration or Spells.** You can’t maintain Concentration, and you can’t cast spells.\n\n**Duration.** The Rage lasts until the end of your next turn, and it ends early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following:\n\n- Make an attack roll against an enemy.\n- Force an enemy to make a saving throw.\n- Take a Bonus Action to extend your Rage.\n\nEach time the Rage is extended, it lasts until the end of your next turn. You can maintain a Rage for up to 10 minutes.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, your AC = 10 + Dexterity modifier + Constitution modifier. You can use a Shield and still gain this benefit.' },
                {
                    name: 'Weapon Mastery',
                    level: 1,
                    description: 'Gain mastery properties for two Simple or Martial Melee weapon types you are proficient with.',
                    choices: {
                        title: 'Choose 2 Weapon Masteries',
                        count: 2,
                        options: [...barbarianWeaponMasteryChoiceOptions]
                    }
                }
            ]
        },
        {
            level: 2, features: [
                { name: 'Reckless Attack', level: 2, description: 'Attack with advantage before your allies take their turns. Attacks against you have advantage until your next turn.' },
                { name: 'Danger Sense', level: 2, description: 'You gain an uncanny sense of when things aren’t as they should be, giving you an edge when you dodge perils. You have Advantage on Dexterity saving throws unless you have the Incapacitated condition.' }
            ]
        },
        {
            level: 3, features: [
                {
                    name: 'Barbarian Subclass',
                    level: 3,
                    description: 'Choose your Barbarian subclass.',
                    choices: {
                        title: 'Choose 1 Subclass',
                        count: 1,
                        options: [...barbarianSubclassOptions]
                    }
                },
                {
                    name: 'Primal Knowledge',
                    level: 3,
                    description: 'Gain proficiency in one additional Barbarian skill.',
                    choices: {
                        title: 'Choose 1 Barbarian Skill Proficiency',
                        count: 1,
                        options: [...barbarianSkillChoiceOptions]
                    }
                }
            ]
        },
        {
            level: 4, features: [
                {
                    name: 'Weapon Mastery',
                    level: 4,
                    description: 'Your training with weapons allows you to use the mastery properties of another kind of Simple or Martial Melee weapons of your choice, such as Greataxes and Handaxes. Whenever you finish a Long Rest, you can practice weapon drills and change one of your chosen weapon choices. \n\nWhen you reach certain Barbarian levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Barbarian Features table.',
                    choices: {
                        title: 'Choose 1 Weapon Mastery',
                        count: 1,
                        options: [...barbarianWeaponMasteryChoiceOptions]
                    }
                },
                { name: 'Ability Score Improvement', level: 4, description: 'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'You can attack twice instead of once whenever you take the Attack action on your turn.' },
                { name: 'Fast Movement', level: 5, description: 'Your speed increases by 10 feet while you aren’t wearing Heavy armor.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Feral Instinct', level: 7, description: 'Your instincts are so honed that you have Advantage on Initiative rolls.' },
                { name: 'Instinctive Pounce', level: 7, description: 'As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 12 and 16.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Brutal Strike', level: 9, description: 'If you use Reckless Attack, you can forgo any Advantage on one Strength-based attack roll of your choice on your turn. The chosen attack roll mustn’t have Disadvantage. If the chosen attack roll hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options. \n\n**Forceful Blow.** The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks. \n\n**Hamstring Blow.** The target’s Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time—the most recent one.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Relentless Rage', level: 11, description: 'Your Rage can keep you fighting despite grievous wounds. If you drop to 0 Hit Points while your Rage is active and don’t die outright, you can make a DC 10 Constitution saving throw. If you succeed, your Hit Points instead change to a number equal to twice your Barbarian level. \n\nEach time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Barbarian level 16.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Improved Brutal Strike', level: 13, description: 'You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options. \n\n**Staggering Blow.** The target has Disadvantage on the next saving throw it makes, and it can’t make Opportunity Attacks until the start of your next turn. \n\n**Sundering Blow.** Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Barbarian subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Persistent Rage', level: 15, description: 'When you roll Initiative, you can regain all expended uses of Rage. After you regain uses of Rage in this way, you can’t do so again until you finish a Long Rest. \n\nIn addition, your Rage is so fierce that it now lasts for 10 minutes without you needing to do anything to extend it from round to round. Your Rage ends early if you have the Unconscious condition (not just the Incapacitated condition) or don Heavy armor.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Improved Brutal Strike', level: 17, description: 'The extra damage of your Brutal Strike increases to 2d10. In addition, you can use two different Brutal Strike effects whenever you use your Brutal Strike feature.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Indomitable Might', level: 18, description: 'If your total for a Strength check or Strength saving throw is less than your Strength score, you can use that score in place of the total.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'You gain an Epic Boon feat or another feat of your choice for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Primal Champion', level: 20, description: 'You embody primal power. Your Strength and Constitution scores increase by 4, and their maximum is now 25.' }
            ]
        }
    ],
    'Blood Hunter': [
        {
            level: 1, features: [
                {
                    name: "Hunter's Bane and Blood Maledict",
                    level: 1,
                    description: 'You pursue monsters through hemocraft, heightened senses, and forbidden discipline, trading safety for lethal supernatural utility.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Insight', 'Investigation', 'Medicine', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Blood Maledict', level: 1, description: 'Invoke blood curses against creatures you can see, twisting hemocraft into debuffs, disruption, and high-pressure utility.' },
                { name: 'Crimson Rite', level: 1, description: 'Sacrifice some of your own vitality to empower a weapon with extra elemental or occult damage for the duration of a fight.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Fighting Style', level: 2, description: 'Adopt a martial style that supports your preferred weapon pattern while your rites and curses ride on top of every attack.' }
            ]
        },
        {
            level: 3, features: [
                {
                    name: 'Blood Hunter Order',
                    level: 3,
                    description: 'Choose the order that defines your hemocraft path and later subclass features.',
                    choices: {
                        title: 'Choose 1 Blood Hunter Order',
                        count: 1,
                        options: [...bloodHunterSubclassOptions]
                    }
                }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'You can attack twice instead of once whenever you take the Attack action on your turn.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Brand of Castigation', level: 6, description: 'When you damage a creature with your Crimson Rite active, you can brand it to track it relentlessly and punish it when it turns its violence back on you.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain the next feature from your Blood Hunter Order.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Grim Psychometry', level: 9, description: 'You can read lingering supernatural traces from objects and places, uncovering hidden lore about violence, curses, and dark events.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Dark Augmentation', level: 10, description: 'Your hemocraft sharpens body and instinct, increasing movement speed and reinforcing physical resilience with your chosen rite stat.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain the next feature from your Blood Hunter Order.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Brand of Tethering', level: 13, description: 'Your Brand becomes harder to escape, locking dangerous prey in place and punishing supernatural movement or sudden retreat.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Hardened Soul', level: 14, description: 'Repeated exposure to darkness steels your mind, granting strong protection against fear and manipulation.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain the next feature from your Blood Hunter Order.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Blood Curse Mastery', level: 18, description: 'Your curses become far more reliable in long adventuring days, letting you lean harder into amplified control and disruption.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Ability Score Improvement', level: 19, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Sanguine Mastery', level: 20, description: 'Your hemocraft reaches its capstone: once per turn you can reroll a hemocraft die, and critical hits with rite-empowered weapons help restore Blood Maledict uses.' }
            ]
        }
    ],
    Bard: [
        {
            level: 1, features: [
                {
                    name: 'Core Bard Traits',
                    level: 1,
                    description: 'You mix magic, performance, and social versatility, gaining broad skill access and the signature support tools of a Bard.',
                    choices: {
                        title: 'Choose 3 Skill Proficiencies from any skill',
                        count: 3,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Bard spells using Charisma, learning cantrips early and preparing spells that shape support, control, and utility.' },
                { name: 'Bardic Inspiration', level: 1, description: 'As a Bonus Action, inspire an ally with a Bardic Inspiration die they can spend to improve an important d20 roll at a crucial moment.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Expertise', level: 2, description: 'Choose key proficiencies and double your Proficiency Bonus with them, becoming exceptionally reliable in your signature talents.' },
                { name: 'Jack of All Trades', level: 2, description: 'Add half your Proficiency Bonus to ability checks that don’t already include your proficiency, making you useful in nearly any situation.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Bard Subclass', level: 3, description: 'Choose the college or path that defines your specialized Bard role and later subclass features.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Font of Inspiration', level: 5, description: 'Your Bardic Inspiration becomes easier to sustain, greatly improving how often you can support allies through an adventuring day.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Bard subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Countercharm', level: 7, description: 'Use music, words, or presence to help protect yourself and companions from disruptive mental effects such as fear or charm.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Expand your mastery by choosing more proficiencies to benefit from Expertise.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Magical Secrets', level: 10, description: 'Learn powerful spells from outside the Bard spell list, letting you fill party gaps with unusual magical options.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain the next feature from your Bard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Inspiration', level: 18, description: 'Even when resources run low, your performance still produces late-combat inspiration and keeps your support engine online.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Words of Creation', level: 20, description: 'Your command of performance and magic reaches its peak, giving your Bardic power a world-shaping capstone effect.' }
            ]
        }
    ],
    Cleric: [
        {
            level: 1, features: [
                {
                    name: 'Core Cleric Traits',
                    level: 1,
                    description: 'You serve a divine power through prayer, armor, and sacred magic, gaining the foundation of a front-line or support-oriented holy caster.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Cleric spells using Wisdom, preparing a flexible mix of healing, protection, control, and radiant offense.' },
                { name: 'Divine Order', level: 1, description: 'Choose the training emphasis that defines your role, such as a more martial priesthood or a more scholarly, spell-focused path.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Channel Divinity', level: 2, description: 'You gain access to holy Channel Divinity options, unleashing bursts of divine power a limited number of times between rests.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Cleric Subclass', level: 3, description: 'Choose your Divine Domain, which grants specialized domain features at later levels.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Sear Undead', level: 5, description: 'Your divine power becomes more dangerous to undead, making your turning effects far more punishing once they fail to resist you.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Cleric subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Blessed Strikes', level: 7, description: 'Your weapon attacks or cantrip offense gain a reliable divine damage boost, improving your turn-by-turn output.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Divine Intervention', level: 10, description: 'Call directly on your deity or sacred power for extraordinary aid beyond your normal spellcasting.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Improved Blessed Strikes', level: 14, description: 'The divine bonus from your Blessed Strikes becomes stronger, keeping your offense relevant in higher-tier play.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain the next feature from your Cleric subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Greater Divine Intervention', level: 20, description: 'Your calls for direct divine aid become dramatically more dependable, representing the full capstone of your sacred service.' }
            ]
        }
    ],
    Druid: [
        {
            level: 1, features: [
                {
                    name: 'Core Druid Traits',
                    level: 1,
                    description: 'You wield primal magic tied to nature, healing, transformation, and the elemental world, with strong flexibility in both exploration and support.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Animal Handling', 'Arcana', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Druid spells using Wisdom, preparing a daily mix of battlefield control, healing, summoning, and nature utility.' },
                { name: 'Druidic', level: 1, description: 'You know Druidic and always have Speak with Animals prepared. You can use Druidic to leave hidden messages. Druids automatically spot those messages, while others only notice their presence with a successful DC 15 Intelligence (Investigation) check and cannot decipher them without magic.' },
                { name: 'Primal Order', level: 1, description: 'Choose the form of druidic training that best matches your role, whether that leans toward martial survival or deeper spell mastery.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Wild Shape', level: 2, description: 'Use primal power to transform into animal forms for scouting, mobility, survival, and sometimes combat utility.' },
                { name: 'Wild Companion', level: 2, description: 'Spend your primal resource to call a temporary companion in the style of a familiar for reconnaissance and utility.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Druid Subclass', level: 3, description: 'Choose your Druid Circle, which defines the special path of nature magic you follow.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Wild Resurgence', level: 5, description: 'Your primal resource engine improves, making Wild Shape and related features easier to recover and use throughout the day.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Druid subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Elemental Fury', level: 7, description: 'Your connection to primal forces sharpens your offense, adding stronger elemental or magical pressure to your core druid play.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain the next feature from your Druid subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain the next feature from your Druid subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Improved Elemental Fury', level: 15, description: 'Your primal offense improves again, keeping your cantrips, attacks, or empowered nature effects effective in high-tier play.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Beast Spells', level: 18, description: 'You can continue spellcasting while in animal form, dramatically expanding the tactical value of Wild Shape.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Archdruid', level: 20, description: 'You reach the peak of primal mastery, becoming extraordinarily efficient with Wild Shape and late-game druid magic.' }
            ]
        }
    ],
    Fighter: [
        {
            level: 1, features: [
                {
                    name: 'Core Fighter Traits',
                    level: 1,
                    description: 'You are defined by disciplined martial training, broad weapon access, and the ability to excel in nearly any combat style.',
                    choices: {
                        title: 'Choose 1 Fighting Style',
                        count: 1,
                        options: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting', 'Blind Fighting', 'Blessed Warrior', 'Mariner', 'Thrown Weapon Fighting', 'Unarmed Fighting']
                    }
                },
                {
                    name: 'Fighting Style',
                    level: 1,
                    description: 'Choose the combat discipline that shapes your strengths, such as ranged accuracy, heavier defense, or stronger melee output.'
                },
                { name: 'Second Wind', level: 1, description: 'Use a Bonus Action to regain hit points and keep yourself in the fight, making you much harder to wear down.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain weapon mastery options that add tactical riders like Push, Sap, Vex, or Topple to your attacks.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Action Surge (one use)', level: 2, description: 'Push beyond normal limits and take one additional action on your turn, enabling explosive round-by-round tempo.' },
                { name: 'Tactical Mind', level: 2, description: 'When you miss an important ability check, you can call on your combat discipline to improve the result and salvage the moment.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Fighter Subclass', level: 3, description: 'Choose the martial archetype that defines your specialized combat identity.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice whenever you take the Attack action on your turn.' },
                { name: 'Tactical Shift', level: 5, description: 'Turn your recovery into mobility, helping you reposition safely and stay on ideal lines of engagement.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Ability Score Improvement', level: 6, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain the next feature from your Fighter subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Indomitable (one use)', level: 9, description: 'Refuse to give in to a failed saving throw by forcing a stronger result when a critical defense matters most.' },
                { name: 'Tactical Master', level: 9, description: 'Your mastery with weapons expands, letting you adapt mastery effects more flexibly from strike to strike.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain the next feature from your Fighter subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Two Extra Attacks', level: 11, description: 'You attack three times whenever you take the Attack action, giving Fighters one of the strongest sustained offense profiles in the game.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Indomitable (two uses)', level: 13, description: 'You gain an additional use of Indomitable, improving your staying power against dangerous effects.' },
                { name: 'Studied Attacks', level: 13, description: 'Missing teaches you immediately; after reading an enemy’s defenses, your next attack becomes more likely to land.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Ability Score Improvement', level: 14, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain the next feature from your Fighter subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Action Surge (two uses)', level: 17, description: 'Gain a second use of Action Surge between rests, allowing multiple encounter-defining turns each day.' },
                { name: 'Indomitable (three uses)', level: 17, description: 'You gain a third use of Indomitable, making you extremely resistant to effects that would stop lesser warriors.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Subclass Feature', level: 18, description: 'Gain the next feature from your Fighter subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Three Extra Attacks', level: 20, description: 'You attack four times whenever you take the Attack action, reaching the Fighter’s maximum sustained martial output.' }
            ]
        }
    ],
    Monk: [
        {
            level: 1, features: [
                {
                    name: 'Core Monk Traits',
                    level: 1,
                    description: 'You fight through discipline, speed, and body control, using mobility and precision instead of heavy armor or brute-force gear.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']
                    }
                },
                { name: 'Martial Arts', level: 1, description: 'Fight effectively with Unarmed Strikes and Monk weapons, mixing agility with fast sequences of attacks.' },
                { name: 'Unarmored Defense', level: 1, description: 'While unarmored, your Armor Class equals 10 plus your Dexterity modifier plus your Wisdom modifier. You cannot gain this benefit while using a Shield.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Monk\'s Focus', level: 2, description: 'Gain Focus Points that power hallmark Monk techniques such as defense, speed bursts, and flurries of strikes.' },
                { name: 'Unarmored Movement', level: 2, description: 'Your speed increases while you aren’t wearing armor or using a shield, reinforcing the Monk’s hit-and-move style.' },
                { name: 'Uncanny Metabolism', level: 2, description: 'Your internal discipline keeps you going under pressure, helping you recover resources when a fight begins to turn serious.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Deflect Attacks', level: 3, description: 'Use your reaction to reduce damage from weapon attacks, and in the right moment turn defense into a counterattack.' },
                { name: 'Monk Subclass', level: 3, description: 'Choose your Monastic Tradition, which defines the special techniques you pursue.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' },
                { name: 'Slow Fall', level: 4, description: 'Use your reaction and body control to greatly reduce falling damage.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice whenever you take the Attack action on your turn.' },
                { name: 'Stunning Strike', level: 5, description: 'Channel focus into a hit to leave a target reeling and potentially Stunned, creating major tactical openings.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Empowered Strikes', level: 6, description: 'Your unarmed attacks count as empowered or magical for overcoming resistances and fighting tougher foes.' },
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Monk subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'When a Dexterity save would let you take half damage, your reflexes can reduce that damage to none on a success.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Acrobatic Movement', level: 9, description: 'Your mobility grows extraordinary, letting you traverse vertical or difficult paths with much greater freedom.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Heightened Focus', level: 10, description: 'Your Focus techniques become more efficient, giving you stronger value from each point you spend.' },
                { name: 'Self-Restoration', level: 10, description: 'Through discipline and breath control, you can recover from several harmful conditions without outside help.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain the next feature from your Monk subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Deflect Energy', level: 13, description: 'Your defensive training expands beyond physical attacks, helping you blunt dangerous elemental or force-based assaults.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Disciplined Survivor', level: 14, description: 'Your spiritual and physical control greatly improves your reliability on important saving throws.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Perfect Focus', level: 15, description: 'When your reserves run low, your inner discipline restores enough Focus to keep your core techniques available.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain the next feature from your Monk subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Superior Defense', level: 18, description: 'Spend focus to become exceptionally hard to bring down, gaining powerful protection in the most dangerous fights.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Body and Mind', level: 20, description: 'Your body and spirit reach perfect unity, granting a powerful capstone boost to your physical and mental mastery.' }
            ]
        }
    ],
    Paladin: [
        {
            level: 1, features: [
                {
                    name: 'Core Paladin Traits',
                    level: 1,
                    description: 'You combine heavy-armored martial skill with divine conviction, standing as a durable front-line protector and radiant striker.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Lay On Hands', level: 1, description: 'Use your healing pool to restore hit points through touch, offering dependable emergency recovery and support.' },
                { name: 'Spellcasting', level: 1, description: 'You cast Paladin spells using Charisma, preparing a mix of support, control, and smite-enhancing magic.' },
                {
                    name: 'Weapon Mastery',
                    level: 1,
                    description: 'Gain weapon mastery options that add tactical riders to the weapons you are trained to wield.',
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
                    description: 'Choose the holy combat style that best fits your oath and battlefield role.',
                    choices: {
                        title: 'Choose 1 Fighting Style Option',
                        count: 1,
                        options: ['Blessed Warrior', 'Fighting Style Feat']
                    }
                },
                {
                    name: 'Blessed Warrior Cantrips',
                    level: 2,
                    description: 'If you choose Blessed Warrior, learn Cleric cantrips that extend your utility and sacred presence beyond weapon combat.',
                    choices: {
                        title: 'Choose 2 Cleric Cantrips',
                        count: 2,
                        options: [...paladinClericCantripOptions]
                    }
                },
                {
                    name: 'Fighting Style Feat',
                    level: 2,
                    description: 'If you choose the feat-based option, select the Fighting Style feat that best supports your preferred weapon plan.',
                    choices: {
                        title: 'Choose 1 Fighting Style Feat',
                        count: 1,
                        options: [...paladinFightingStyleFeatOptions]
                    }
                },
                { name: 'Paladin\'s Smite', level: 2, description: 'Channel divine power through a hit to deliver extra radiant punishment at the moment it matters most.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Channel Divinity', level: 3, description: 'Gain sacred Channel Divinity options powered by your faith and oath.' },
                {
                    name: 'Paladin Subclass',
                    level: 3,
                    description: 'Choose your Sacred Oath, which defines the ideals and special powers you embody.',
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
                    description: 'Increase your ability scores or choose a feat for which you qualify.',
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
                { name: 'Extra Attack', level: 5, description: 'Attack twice whenever you take the Attack action on your turn.' },
                { name: 'Faithful Steed', level: 5, description: 'Call a loyal mount or steed-like ally that improves your mobility, presence, and mounted combat potential.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Aura of Protection', level: 6, description: 'Project a protective aura that helps you and nearby allies resist dangerous saving throw effects.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain the next feature from your Paladin subclass.' }
            ]
        },
        {
            level: 8, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 8,
                    description: 'Increase your ability scores or choose a feat for which you qualify.',
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
                { name: 'Abjure Foes', level: 9, description: 'Use your divine authority to hinder enemies, disrupting their advance and giving your party better battlefield control.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Aura of Courage', level: 10, description: 'Your presence bolsters nearby allies against fear, helping the group stand firm in the face of terror.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Radiant Strikes', level: 11, description: 'Your weapon attacks carry a reliable extra burst of radiant power, increasing your sustained damage.' }
            ]
        },
        {
            level: 12, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 12,
                    description: 'Increase your ability scores or choose a feat for which you qualify.',
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
                { name: 'Restoring Touch', level: 14, description: 'Your divine healing can now clear debilitating conditions as well as mend wounds, greatly improving party support.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain the next feature from your Paladin subclass.' }
            ]
        },
        {
            level: 16, features: [
                {
                    name: 'Ability Score Improvement',
                    level: 16,
                    description: 'Increase your ability scores or choose a feat for which you qualify.',
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
                { name: 'Aura Expansion', level: 18, description: 'Your auras extend farther across the battlefield, increasing the number of allies you can protect at once.' }
            ]
        },
        {
            level: 19, features: [
                {
                    name: 'Epic Boon',
                    level: 19,
                    description: 'Gain an Epic Boon feat or another feat for which you qualify.',
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
                { name: 'Subclass Feature', level: 20, description: 'Gain the final capstone feature from your Paladin subclass.' }
            ]
        }
    ],
    Ranger: [
        {
            level: 1, features: [
                {
                    name: 'Core Ranger Traits',
                    level: 1,
                    description: 'You specialize in hunting, tracking, and surviving in dangerous territory, combining martial skill with wilderness expertise.',
                    choices: {
                        title: 'Choose 3 Skill Proficiencies',
                        count: 3,
                        options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Ranger spells using Wisdom, preparing practical magic for mobility, tracking, and steady weapon support.' },
                { name: 'Favored Enemy', level: 1, description: 'Your training against chosen prey improves your ability to track them and enhances your offensive pressure against priority targets.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain weapon mastery options that add useful tactical effects to your attacks.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Deft Explorer', level: 2, description: 'Your experience in the wild grants improved travel skill, field awareness, and exploration utility.' },
                { name: 'Fighting Style', level: 2, description: 'Choose the combat style that supports your preferred Ranger build, such as archery or two-weapon pressure.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Ranger Subclass', level: 3, description: 'Choose the specialized hunting path that defines your Ranger subclass.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Extra Attack', level: 5, description: 'Attack twice whenever you take the Attack action on your turn.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Roving', level: 6, description: 'Your movement improves, helping you cross difficult terrain and reposition more freely in both exploration and combat.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Subclass Feature', level: 7, description: 'Gain the next feature from your Ranger subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Expertise', level: 9, description: 'Double your Proficiency Bonus with key Ranger proficiencies, making your signature exploration or scouting skills especially reliable.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Tireless', level: 10, description: 'Your stamina and field discipline help you shake off fatigue and keep operating after others would slow down.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Subclass Feature', level: 11, description: 'Gain the next feature from your Ranger subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Relentless Hunter', level: 13, description: 'Once you lock onto prey, your pressure becomes more consistent and much harder for that target to escape.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Nature\'s Veil', level: 14, description: 'Use nature’s cover to vanish or reposition, giving you a strong stealth and survival tool in combat.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Subclass Feature', level: 15, description: 'Gain the next feature from your Ranger subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Precise Hunter', level: 17, description: 'Your accuracy against hunted foes sharpens further, reinforcing your identity as a focused single-target threat.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Feral Senses', level: 18, description: 'Your instincts become so sharp that hidden or unseen enemies are far harder to escape from your notice.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Foe Slayer', level: 20, description: 'You reach the height of the hunter’s art, gaining a capstone that turns chosen prey into much easier kills.' }
            ]
        }
    ],
    Rogue: [
        {
            level: 1, features: [
                {
                    name: 'Core Rogue Traits',
                    level: 1,
                    description: 'You excel at stealth, positioning, precision damage, and skill coverage, thriving whenever leverage and timing matter.',
                    choices: {
                        title: 'Choose 4 Skill Proficiencies from any skills',
                        count: 4,
                        options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival']
                    }
                },
                { name: 'Expertise', level: 1, description: 'Choose important proficiencies and double your Proficiency Bonus with them, giving you elite reliability in your specialty skills.' },
                { name: 'Sneak Attack', level: 1, description: 'Once per turn, deal extra damage when you strike with advantage or when an ally’s positioning leaves the target exposed.' },
                { name: 'Thieves\' Cant', level: 1, description: 'You understand the coded slang and hidden signs used by Rogues and criminal networks.' },
                { name: 'Weapon Mastery', level: 1, description: 'Gain weapon mastery options that let you layer extra tactical value onto precise weapon hits.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Cunning Action', level: 2, description: 'Use your Bonus Action for swift movement, disengaging, or stealth, making it much easier to control position each round.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Rogue Subclass', level: 3, description: 'Choose the archetype that defines your Rogue’s preferred methods and later subclass features.' },
                { name: 'Steady Aim', level: 3, description: 'Sacrifice movement to line up a more dependable attack, greatly improving your chance to trigger Sneak Attack.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Cunning Strike', level: 5, description: 'Convert some Sneak Attack damage into tactical rider effects that hamper or reposition enemies.' },
                { name: 'Uncanny Dodge', level: 5, description: 'Use your reaction to reduce the damage from an attack that hits you, improving your survival against big single hits.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Expertise', level: 6, description: 'Choose additional proficiencies for Expertise and deepen your edge outside combat and during infiltration.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Evasion', level: 7, description: 'Your reflexes let you slip clear of many area effects, taking no damage on a successful Dexterity save where others would take half.' },
                { name: 'Reliable Talent', level: 7, description: 'Your practiced skills become extremely consistent, reducing the chance of low results on checks you’re proficient in.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Subclass Feature', level: 9, description: 'Gain the next feature from your Rogue subclass.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Ability Score Improvement', level: 10, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Improved Cunning Strike', level: 11, description: 'Your Cunning Strike toolkit expands, giving your Sneak Attack turns even more control and disruption value.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Subclass Feature', level: 13, description: 'Gain the next feature from your Rogue subclass.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Devious Strikes', level: 14, description: 'You unlock more advanced strike manipulation, turning precision damage into even nastier tactical outcomes.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Slippery Mind', level: 15, description: 'Your mental defenses harden, making it much more difficult for enemies to control or disable you mentally.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Subclass Feature', level: 17, description: 'Gain the next feature from your Rogue subclass.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Elusive', level: 18, description: 'You become exceptionally difficult to pin down, preventing enemies from easily gaining the upper hand against you.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Stroke of Luck', level: 20, description: 'At the perfect moment, turn a miss into a hit or a failed check into success, reflecting the Rogue’s late-game capstone reliability.' }
            ]
        }
    ],
    Sorcerer: [
        {
            level: 1, features: [
                {
                    name: 'Core Sorcerer Traits',
                    level: 1,
                    description: 'Your magic is innate rather than learned, erupting from bloodline, cosmic accident, or supernatural origin and making you a naturally explosive spellcaster.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Sorcerer spells using Charisma, relying on innate talent rather than books or prayer.' },
                { name: 'Innate Sorcery', level: 1, description: 'As a Bonus Action, enter a heightened magical state that improves the force and reliability of your Sorcerer spellcasting for a full minute.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Font of Magic', level: 2, description: 'Gain Sorcery Points that can fuel special features, power Metamagic, or be converted into spell slots and back again.' },
                { name: 'Metamagic', level: 2, description: 'Choose Metamagic options that reshape how your spells work, such as changing range, targets, timing, or casting conditions.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Sorcerer Subclass', level: 3, description: 'Choose the Sorcerous Origin that explains your power and grants subclass features at later levels.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Sorcerous Restoration', level: 5, description: 'Recover expended Sorcery Points on a Short Rest, improving your magical endurance over a full adventuring day.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Sorcerer subclass.' }
            ]
        },
        {
            level: 7, features: [
                { name: 'Sorcery Incarnate', level: 7, description: 'Your Innate Sorcery evolves, letting you push Metamagic harder and produce stronger bursts of customized spell power.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Metamagic', level: 10, description: 'Learn another Metamagic option, widening the ways you can reshape your spells.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain the next feature from your Sorcerer subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Metamagic', level: 17, description: 'Learn another Metamagic option, giving you even more control over high-level spell delivery.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Subclass Feature', level: 18, description: 'Gain the next feature from your Sorcerer subclass.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Arcane Apotheosis', level: 20, description: 'While your Innate Sorcery is active, you can use a Metamagic option each turn without spending Sorcery Points, representing your capstone magical efficiency.' }
            ]
        }
    ],
    Warlock: [
        {
            level: 1, features: [
                {
                    name: 'Core Warlock Traits',
                    level: 1,
                    description: 'You draw power from a pact with an otherworldly patron, blending limited spell slots with highly customizable eldritch abilities.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Nature', 'Religion']
                    }
                },
                { name: 'Eldritch Invocations', level: 1, description: 'Learn modular magical tricks and passive boons that let you customize your Warlock far more than most spellcasters.' },
                { name: 'Pact Magic', level: 1, description: 'You cast Warlock spells using Charisma through Pact Magic, relying on fewer slots that recharge quickly between rests.' }
            ]
        },
        {
            level: 2, features: [
                { name: 'Magical Cunning', level: 2, description: 'Recover and manage your pact resources more efficiently, helping you keep eldritch power available through longer adventuring days.' }
            ]
        },
        {
            level: 3, features: [
                { name: 'Warlock Subclass', level: 3, description: 'Choose the patron path that defines the nature of your pact and later subclass features.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Warlock subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 9, features: [
                { name: 'Contact Patron', level: 9, description: 'Deepen communion with your patron, gaining a more direct supernatural line to the being that empowers you.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain the next feature from your Warlock subclass.' }
            ]
        },
        {
            level: 11, features: [
                { name: 'Mystic Arcanum (level 6 spell)', level: 11, description: 'Gain a powerful 6th-level spell you can cast once per Long Rest without using your normal pact slots.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 13, features: [
                { name: 'Mystic Arcanum (level 7 spell)', level: 13, description: 'Gain a powerful 7th-level once-per-Long-Rest spell through your pact’s deeper secrets.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain the next feature from your Warlock subclass.' }
            ]
        },
        {
            level: 15, features: [
                { name: 'Mystic Arcanum (level 8 spell)', level: 15, description: 'Gain a powerful 8th-level once-per-Long-Rest spell as your pact reaches truly dangerous heights.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 17, features: [
                { name: 'Mystic Arcanum (level 9 spell)', level: 17, description: 'Gain a powerful 9th-level once-per-Long-Rest spell, representing the highest mysteries your patron shares.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Eldritch Master', level: 20, description: 'You reach the capstone of pact magic control, restoring eldritch resources with remarkable speed and consistency.' }
            ]
        }
    ],
    Wizard: [
        {
            level: 1, features: [
                {
                    name: 'Core Wizard Traits',
                    level: 1,
                    description: 'You master arcane magic through study, preparation, and theory, gaining the broadest spell selection and the strongest spellbook identity in the game.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
                    }
                },
                { name: 'Spellcasting', level: 1, description: 'You cast Wizard spells using Intelligence, storing magical knowledge in a spellbook and preparing spells from it each day.' },
                { name: 'Ritual Adept', level: 1, description: 'Cast spells with the Ritual tag from your spellbook as rituals without needing to prepare them first.' },
                { name: 'Arcane Recovery', level: 1, description: 'After a Short Rest, recover some expended spell-slot levels, helping you keep arcane output online longer than many other casters.' }
            ]
        },
        {
            level: 2, features: [
                {
                    name: 'Scholar',
                    level: 2,
                    description: 'Choose a Wizard-related skill and gain Expertise in it, reflecting the deep academic focus of your magical training.',
                    choices: {
                        title: 'Choose 1 Skill Expertise',
                        count: 1,
                        options: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Religion']
                    }
                }
            ]
        },
        {
            level: 3, features: [
                { name: 'Wizard Subclass', level: 3, description: 'Choose the school or path of magic that defines your Wizard specialization.' }
            ]
        },
        {
            level: 4, features: [
                { name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 5, features: [
                { name: 'Memorize Spell', level: 5, description: 'Your spell preparation grows more flexible, letting you adapt more easily to changing magical needs.' }
            ]
        },
        {
            level: 6, features: [
                { name: 'Subclass Feature', level: 6, description: 'Gain the next feature from your Wizard subclass.' }
            ]
        },
        {
            level: 8, features: [
                { name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 10, features: [
                { name: 'Subclass Feature', level: 10, description: 'Gain the next feature from your Wizard subclass.' }
            ]
        },
        {
            level: 12, features: [
                { name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 14, features: [
                { name: 'Subclass Feature', level: 14, description: 'Gain the next feature from your Wizard subclass.' }
            ]
        },
        {
            level: 16, features: [
                { name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }
            ]
        },
        {
            level: 18, features: [
                { name: 'Spell Mastery', level: 18, description: 'Master select lower-level spells so thoroughly that you can produce them with exceptional efficiency and frequency.' }
            ]
        },
        {
            level: 19, features: [
                { name: 'Epic Boon', level: 19, description: 'Gain an Epic Boon feat or another feat for which you qualify.' }
            ]
        },
        {
            level: 20, features: [
                { name: 'Signature Spells', level: 20, description: 'Choose spells that become the defining expressions of your mastery, representing the Wizard’s capstone spellcasting control.' }
            ]
        }
    ],
    Gunslinger: [
        {
            level: 1, features: [
                {
                    name: 'Core Gunslinger Traits',
                    level: 1,
                    description: 'Gain proficiency with light armor, simple weapons, firearms, and tinker\'s tools.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Acrobatics', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth']
                    }
                },
                { name: 'Grit', level: 1, description: 'Gain Grit points equal to your Wisdom modifier (minimum 1). Spend Grit to perform trick shots and daring maneuvers. Recover 1 Grit on a critical hit or killing blow with a firearm; recover all on a short or long rest.' },
                { name: 'Combat Style', level: 1, description: 'Choose a fighting style (Archery, Dueling, or Two-Weapon Fighting) that defines your approach to ranged and close combat.' }
            ]
        },
        { level: 2, features: [{ name: 'Lucky Break', level: 2, description: 'Spend 1 Grit to regain 1d10 + your Gunslinger level in hit points as a bonus action.' }] },
        { level: 3, features: [{ name: 'Gunslinger Style', level: 3, description: 'Choose your Gunslinger Style subclass, which defines your combat identity through level 20.' }] },
        { level: 4, features: [{ name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 5, features: [{ name: 'Extra Attack', level: 5, description: 'You can attack twice when you take the Attack action.' }, { name: 'Snap Shot', level: 5, description: 'When a creature moves within 5 feet of you, you can use your reaction to make one firearm attack against it.' }] },
        { level: 6, features: [{ name: 'Subclass Feature', level: 6, description: 'Gain a feature from your Gunslinger Style subclass.' }] },
        { level: 7, features: [{ name: 'Quickdraw', level: 7, description: 'Add your proficiency bonus to initiative rolls. You can also stow and draw a firearm as a single object interaction.' }, { name: 'Evasion', level: 7, description: 'When you succeed on a Dexterity saving throw against an effect that deals half damage on a success, you take no damage instead.' }] },
        { level: 8, features: [{ name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 9, features: [{ name: 'Grit Die Growth', level: 9, description: 'Your Grit pool increases and trick shot options expand.' }] },
        { level: 10, features: [{ name: 'Rapid Repair', level: 10, description: 'Spend 1 Grit to attempt to clear a misfired firearm as a bonus action.' }] },
        { level: 11, features: [{ name: 'Honed Shot', level: 11, description: 'Your firearm attacks ignore half cover and three-quarters cover bonuses.' }] },
        { level: 12, features: [{ name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 13, features: [{ name: 'Uncanny Dodge', level: 13, description: 'When an attacker you can see hits you, use your reaction to halve the attack\'s damage.' }] },
        { level: 14, features: [{ name: 'Subclass Feature', level: 14, description: 'Gain a feature from your Gunslinger Style subclass.' }] },
        { level: 15, features: [{ name: 'Elusive', level: 15, description: 'Enemies cannot gain advantage on attack rolls against you unless you are incapacitated.' }] },
        { level: 16, features: [{ name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 17, features: [{ name: 'Subclass Feature', level: 17, description: 'Gain a feature from your Gunslinger Style subclass.' }, { name: 'One Last Bullet', level: 17, description: 'When you are reduced to 0 hit points, you can spend all remaining Grit to make one firearm attack before falling unconscious.' }] },
        { level: 18, features: [{ name: 'Lightning Reload', level: 18, description: 'You can reload any firearm as a bonus action.' }] },
        { level: 19, features: [{ name: 'Ability Score Improvement', level: 19, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 20, features: [{ name: 'Gunslinger Supreme', level: 20, description: 'Your Grit cap increases by 2, you regain 2 Grit whenever you score a critical hit with a firearm, and your firearm attacks score criticals on a 19 or 20.' }] }
    ],
    'Monster Hunter': [
        {
            level: 1, features: [
                {
                    name: 'Core Monster Hunter Traits',
                    level: 1,
                    description: 'Gain proficiency with medium armor, shields, and all simple and martial weapons.',
                    choices: {
                        title: 'Choose 2 Skill Proficiencies',
                        count: 2,
                        options: ['Athletics', 'History', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']
                    }
                },
                { name: 'Monster Lore', level: 1, description: 'Make an Intelligence check to identify a monster type and learn its resistances, immunities, and key vulnerabilities before or during an encounter.' },
                { name: 'Predator\'s Senses', level: 1, description: 'Gain advantage on Perception and Survival checks made to track or detect monsters.' },
                { name: 'Studied Strike', level: 1, description: 'Once per turn when you hit a creature you have successfully identified with Monster Lore, deal an extra 1d6 damage. This die grows as you level.' }
            ]
        },
        { level: 2, features: [{ name: 'Fighting Style', level: 2, description: 'Choose a fighting style: Archery, Defense, Dueling, or Two-Weapon Fighting.' }, { name: 'Slayer\'s Preparation', level: 2, description: 'During a short or long rest you can prepare information on a specific creature type, granting advantage on your first Monster Lore check against it.' }] },
        { level: 3, features: [{ name: 'Hunter Order', level: 3, description: 'Choose your Hunter Order subclass, which defines your specialized approach to monster slaying through level 20.' }] },
        { level: 4, features: [{ name: 'Ability Score Improvement', level: 4, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 5, features: [{ name: 'Extra Attack', level: 5, description: 'You can attack twice when you take the Attack action.' }] },
        { level: 6, features: [{ name: 'Preternatural Senses', level: 6, description: 'Gain advantage on initiative rolls. You cannot be surprised while conscious.' }] },
        { level: 7, features: [{ name: 'Subclass Feature', level: 7, description: 'Gain a feature from your Hunter Order subclass.' }] },
        { level: 8, features: [{ name: 'Ability Score Improvement', level: 8, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 9, features: [{ name: 'Devastating Critical', level: 9, description: 'When you score a critical hit against a creature you have identified with Monster Lore, roll one additional weapon die.' }] },
        { level: 10, features: [{ name: 'Subclass Feature', level: 10, description: 'Gain a feature from your Hunter Order subclass.' }] },
        { level: 11, features: [{ name: 'Monster Slayer Preparation', level: 11, description: 'You can use Slayer\'s Preparation as a free action once per short rest, allowing quicker setup against priority targets.' }] },
        { level: 12, features: [{ name: 'Ability Score Improvement', level: 12, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 13, features: [{ name: 'Subclass Feature', level: 13, description: 'Gain a feature from your Hunter Order subclass.' }] },
        { level: 14, features: [{ name: 'Greater Monster Lore', level: 14, description: 'Monster Lore checks automatically succeed against creature types you have encountered before, and reveal additional tactical information.' }] },
        { level: 15, features: [{ name: 'Relentless', level: 15, description: 'When you are reduced to 0 hit points during combat, you can make one weapon attack before falling unconscious.' }] },
        { level: 16, features: [{ name: 'Ability Score Improvement', level: 16, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 17, features: [{ name: 'Superior Hunter', level: 17, description: 'Studied Strike now applies to all weapon attacks against a studied creature, not just once per turn.' }] },
        { level: 18, features: [{ name: 'Subclass Feature', level: 18, description: 'Gain a feature from your Hunter Order subclass.' }] },
        { level: 19, features: [{ name: 'Ability Score Improvement', level: 19, description: 'Increase your ability scores or choose a feat for which you qualify.' }] },
        { level: 20, features: [{ name: 'Apex Predator', level: 20, description: 'Monster Lore now automatically grants advantage on attack rolls against identified creatures. Your Studied Strike die becomes d12.' }] }
    ]
};


