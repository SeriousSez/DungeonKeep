export type RulesCategory = 'browse' | 'resource';

export interface RulesQuickFact {
    label: string;
    value: string;
}

export interface RulesHighlight {
    title: string;
    text: string;
}

export interface RulesSectionEntry {
    label: string;
    text: string;
}

export interface RulesSection {
    heading: string;
    intro: string;
    entries?: readonly RulesSectionEntry[];
    bullets?: readonly string[];
}

export interface RulesLink {
    slug: string;
    routePath: string;
    label: string;
    icon: string;
    category: RulesCategory;
    description: string;
    eyebrow: string;
    heroTitle: string;
    heroSummary: string;
    quickFacts: readonly RulesQuickFact[];
    highlights: readonly RulesHighlight[];
    sections: readonly RulesSection[];
    relatedSlugs: readonly string[];
}

export const rulesEntries = [
    {
        slug: 'classes',
        routePath: '/rules/classes',
        label: 'Classes',
        icon: 'hat-wizard',
        category: 'browse',
        description: 'Class roles, primary abilities, party jobs, and starter guidance for every major class archetype.',
        eyebrow: 'Character Build',
        heroTitle: 'Classes define what your character does best every round.',
        heroSummary: 'Your class sets the tone of the character sheet: how you solve problems, what resources you manage, and where you naturally shine in the party. DungeonKeep uses this page as a practical overview, not a rules dump, so players can make fast choices before diving into a builder.',
        quickFacts: [
            { label: 'Current roster', value: '15 classes including all 12 core 2024 classes, Artificer, and two third-party classes: Gunslinger and Monster Hunter.' },
            { label: 'Main decision', value: 'Pick a class for role, tempo, and resource style before you worry about optimization.' },
            { label: 'Stat pressure', value: 'Primary abilities tell you which scores should lead your build.' },
            { label: 'Table impact', value: 'Classes shape your turn loop far more than gear or flavor text.' }
        ],
        highlights: [
            { title: 'Front-line anchors', text: 'Barbarian, Fighter, Monk, Paladin, and many Rangers want to be close to the action and define space on the battlefield.' },
            { title: 'Control and support', text: 'Bard, Cleric, Druid, Wizard, and several Sorcerer or Warlock builds reshape encounters with positioning, buffs, and denial.' },
            { title: 'Precision specialists', text: 'Rogue, Artificer, and skill-focused hybrids often win scenes by setup, scouting, and solving problems that are not pure damage races.' }
        ],
        sections: [
            {
                heading: 'Core class roster',
                intro: 'Use this as a first-pass filter before comparing subclasses or spell lists.',
                entries: [
                    { label: 'Artificer', text: 'Inventive half-caster built around tools, item support, and utility planning.' },
                    { label: 'Gunslinger', text: 'Grit-fueled firearm specialist from Valda\'s Spire of Secrets — punishes aggression with trick shots, quick reflexes, and explosive burst damage.' },
                    { label: 'Barbarian', text: 'Durable melee bruiser that trades finesse for pressure, toughness, and momentum.' },
                    { label: 'Bard', text: 'Flexible support caster with strong social play, control, and party-wide boosts.' },
                    { label: 'Cleric', text: 'Divine caster that can heal, defend, blast, or command the field depending on build.' },
                    { label: 'Druid', text: 'Nature-focused caster with control, summoning, scouting, and form-shifting angles.' },
                    { label: 'Fighter', text: 'Weapon master with reliable action economy and room to specialize into almost any combat lane.' },
                    { label: 'Monk', text: 'Mobile skirmisher that rewards positioning, timing, and repeated tactical pressure.' },
                    { label: 'Monster Hunter', text: 'Intelligence-driven martial hunter from Grim Hollow \u2014 exploits monster weaknesses through preparation, monster lore, and devastating studied strikes.' },
                    { label: 'Paladin', text: 'Armored oath-bound striker who mixes defense, team support, and explosive burst.' },
                    { label: 'Ranger', text: 'Scout-hunter hybrid with mobility, exploration strength, and focused damage.' },
                    { label: 'Rogue', text: 'Skill-heavy opportunist that thrives on stealth, leverage, and precise hits.' },
                    { label: 'Sorcerer', text: 'Innate caster with a smaller toolkit but strong burst and spell-shaping identity.' },
                    { label: 'Warlock', text: 'Pact caster with repeatable offense, unusual features, and short-rest style pacing.' },
                    { label: 'Wizard', text: 'Broadest pure arcane toolkit, best when you want answers, planning, and spell breadth.' }
                ]
            },
            {
                heading: 'How classes feel at the table',
                intro: 'The right class is often the one whose turn pattern you enjoy repeating for months.',
                bullets: [
                    'If you want simple but high-impact turns, start with Fighter, Barbarian, or Paladin.',
                    'If you enjoy solving problems with creativity and spell text, look at Bard, Druid, Cleric, Wizard, Sorcerer, or Warlock.',
                    'If you like mobility, scouting, and picking moments carefully, Rogue, Monk, Ranger, and Artificer are usually better fits.',
                    'A class with fewer prepared options is often easier for new players than a class with a huge spellbook or transformation menu.'
                ]
            },
            {
                heading: 'Fast pick guide',
                intro: 'Use this shortcut if the group wants to get moving quickly.',
                bullets: [
                    'Choose Paladin if you want armor, leadership, durability, and obvious heroic beats.',
                    'Choose Rogue if you want stealth, skill coverage, and a very readable damage plan.',
                    'Choose Cleric if you want to keep allies standing without locking yourself into a pure healer role.',
                    'Choose Wizard if you want the deepest toolbox and do not mind homework between sessions.'
                ]
            }
        ],
        relatedSlugs: ['backgrounds', 'species', 'feats']
    },
    {
        slug: 'backgrounds',
        routePath: '/rules/backgrounds',
        label: 'Backgrounds',
        icon: 'scroll-old',
        category: 'browse',
        description: 'Origin choices, skills, feat ties, social leverage, and story hooks that explain who your character was before adventuring.',
        eyebrow: 'Character Origins',
        heroTitle: 'Backgrounds explain the life your character had before the first quest.',
        heroSummary: 'A background is more than a paragraph of flavor. It is the fastest way to anchor roleplay, justify proficiencies, and hand the DM obvious hooks for allies, debts, rivals, and downtime scenes. In newer rules, backgrounds also carry real build weight through feats and origin framing.',
        quickFacts: [
            { label: 'Identity first', value: 'Backgrounds answer where your character learned habits, contacts, and confidence.' },
            { label: 'Build impact', value: 'Modern backgrounds often package feat access and tighter origin scaffolding.' },
            { label: 'Scene value', value: 'They matter most in social play, travel, investigation, and downtime.' },
            { label: 'DM utility', value: 'Every good background gives the table ready-made hooks for future sessions.' }
        ],
        highlights: [
            { title: 'Social leverage', text: 'Good backgrounds naturally create doors into temples, guilds, courts, military structures, markets, and criminal circles.' },
            { title: 'Roleplay consistency', text: 'When a player stalls, background is the fastest way to answer how the character would react.' },
            { title: 'Lightweight complexity', text: 'They add depth without asking the player to memorize a second subsystem.' }
        ],
        sections: [
            {
                heading: 'What backgrounds usually carry',
                intro: 'Different rule eras package them differently, but these are the parts that matter at the table.',
                bullets: [
                    'A strong fiction hook: faith, trade, hardship, scholarship, service, crime, nobility, or wandering life.',
                    'Useful proficiencies, tools, languages, or comparable exploration and social advantages.',
                    'A signature perk, contact network, or modern feat tie that keeps the origin relevant after level 1.',
                    'Clear implications for gear, obligations, enemies, and what kind of rumors your character notices first.'
                ]
            },
            {
                heading: 'Reliable starting backgrounds',
                intro: 'These concepts are easy for new players to roleplay and easy for DMs to pay off.',
                entries: [
                    { label: 'Acolyte', text: 'Great if you want faith, ritual knowledge, and obvious institutions tied to the campaign world.' },
                    { label: 'Criminal', text: 'Useful for stealthy characters, urban games, and players who like contacts, secrets, and pressure.' },
                    { label: 'Farmer', text: 'Grounded and approachable origin that sells humility, resilience, and practical competence.' },
                    { label: 'Guard', text: 'Ideal for duty-driven builds and gives DMs a natural chain of command to pull on.' },
                    { label: 'Guide', text: 'Excellent in wilderness or travel campaigns where pathfinding and local knowledge matter.' },
                    { label: 'Merchant', text: 'Supports negotiation, logistics, and campaign plots tied to money or supply routes.' },
                    { label: 'Noble', text: 'Works when the player wants status, expectations, political obligations, and family complications.' },
                    { label: 'Sage', text: 'Strong fit for puzzle-solvers, wizards, clerics, and anyone who likes information scenes.' },
                    { label: 'Soldier', text: 'Immediately useful in conflict-heavy campaigns with rank, discipline, and battlefield instincts.' },
                    { label: 'Wayfarer', text: 'A flexible traveler origin that supports broad campaign movement and social adaptability.' }
                ]
            },
            {
                heading: 'How to choose well',
                intro: 'Pick the background that creates action, not just the one that sounds dramatic on paper.',
                bullets: [
                    'Choose a background that gives your character someone to call, somewhere to return, and something to avoid.',
                    'If two backgrounds offer similar mechanics, keep the one that gives the DM better hooks.',
                    'Avoid vague backstories that explain everything and commit to one or two pressures the table can actually use.',
                    'Ask what your background teaches you to notice first in a scene: danger, lies, rituals, markets, or social rank.'
                ]
            }
        ],
        relatedSlugs: ['classes', 'species', 'character-sheets']
    },
    {
        slug: 'species',
        routePath: '/rules/species',
        label: 'Species',
        icon: 'dragon',
        category: 'browse',
        description: 'Core species options, signature traits, senses, movement, and what each one tends to contribute to play.',
        eyebrow: 'Character Origins',
        heroTitle: 'Species choices shape your senses, movement, and baseline fantasy identity.',
        heroSummary: 'Species is the part of character creation that players notice immediately in fiction. It influences how NPCs react, what your character naturally does well, and what visual language the party brings into the campaign. Mechanically, species usually deliver movement options, senses, innate resistances, or signature powers.',
        quickFacts: [
            { label: 'Current core list', value: 'The current Player\'s Handbook species page highlights Aasimar, Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, and Tiefling.' },
            { label: 'Common wins', value: 'Darkvision, movement perks, resistances, and once-per-rest features are the biggest early differentiators.' },
            { label: 'Story weight', value: 'Species often shapes culture, assumptions, and first impressions long before subclass choices appear.' },
            { label: 'Best use', value: 'Choose for fantasy identity first, then check whether the traits reinforce your class plan.' }
        ],
        highlights: [
            { title: 'Mobility and senses', text: 'Climb, flight, larger movement footprints, or extra senses change exploration more than many new players expect.' },
            { title: 'Durability packages', text: 'Resistances, recovery tools, and toughness traits can smooth out risky early levels.' },
            { title: 'Instant roleplay texture', text: 'Species gives the table visual shorthand and cultural tension before your first long backstory speech.' }
        ],
        sections: [
            {
                heading: 'Core species snapshot',
                intro: 'These one-line reads are enough to get a player to the next decision.',
                entries: [
                    { label: 'Aasimar', text: 'Celestial-themed option with radiant identity and a naturally heroic tone.' },
                    { label: 'Dragonborn', text: 'Breath weapon and draconic resilience make this a direct, visible combat pick.' },
                    { label: 'Dwarf', text: 'Reliable toughness, darkvision, and grounded martial or craft-heavy flavor.' },
                    { label: 'Elf', text: 'Graceful, perceptive, and often associated with speed, senses, or magical heritage.' },
                    { label: 'Gnome', text: 'Clever, quirky, and usually strongest when paired with problem-solving or trickery.' },
                    { label: 'Goliath', text: 'Large-frame energy with powerful physical identity and rugged survivability.' },
                    { label: 'Halfling', text: 'Steady, lucky, and excellent for players who like agility with a low-key heroic feel.' },
                    { label: 'Human', text: 'Flexible and easy to roleplay, often best when you want the class to do the loudest work.' },
                    { label: 'Orc', text: 'Aggressive, durable, and well suited to players who want momentum and stubborn staying power.' },
                    { label: 'Tiefling', text: 'Fiend-touched identity with strong flavor, darkvision, and a built-in dramatic hook.' }
                ]
            },
            {
                heading: 'How species traits matter in play',
                intro: 'Small trait differences become important because they come up every session.',
                bullets: [
                    'Darkvision changes how often darkness is a real obstacle for the party.',
                    'Movement perks define who climbs first, who reaches pressure points, and who can break formation safely.',
                    'Damage resistance matters most in repeated attrition, not only in boss fights.',
                    'Innate powers are easiest to value when they solve a recurring problem rather than add a niche trick.'
                ]
            },
            {
                heading: 'Best pairing mindset',
                intro: 'Think reinforcement, not perfection.',
                bullets: [
                    'Match species to the kind of scenes you want to enjoy, not just to spreadsheets.',
                    'A mobile species pairs well with classes that already care about positioning, like Monk, Rogue, or Ranger.',
                    'A durable species gives fragile casters room to make mistakes while learning the system.',
                    'If the story fantasy is strong enough, it is usually worth more than a narrow numerical upgrade.'
                ]
            }
        ],
        relatedSlugs: ['classes', 'backgrounds', 'feats']
    },
    {
        slug: 'feats',
        routePath: '/rules/feats',
        label: 'Feats',
        icon: 'sparkles',
        category: 'browse',
        description: 'Feat families, high-impact picks, progression timing, and how to choose options that change play instead of cluttering it.',
        eyebrow: 'Character Growth',
        heroTitle: 'Feats are where a build starts to feel unmistakably yours.',
        heroSummary: 'A feat should change what you can do, what you notice, or how your turns are shaped. The best picks are not the ones that look flashy in isolation, but the ones that keep paying you back every session. Use this page to sort feats by job and by table impact before you chase edge-case combos.',
        quickFacts: [
            { label: 'Core families', value: '2024 feat structure splits options into Origin, General, Fighting Style, and Epic Boon groups.' },
            { label: 'Best timing', value: 'Take feats that solve a recurring weakness or sharpen a turn pattern you already use.' },
            { label: 'Common trap', value: 'A feat that only matters in rare scenes often feels worse than a quieter pick with weekly value.' },
            { label: 'Build rule', value: 'Look for identity, reliability, and action economy before chasing ceiling damage.' }
        ],
        highlights: [
            { title: 'Origin feats', text: 'These define how the character enters play and often feel impactful immediately.' },
            { title: 'General feats', text: 'Most customization lives here: defense, control, mobility, utility, concentration support, and weapon mastery.' },
            { title: 'Epic boons', text: 'Late-game feats should feel transformational and are best treated as capstone identity statements.' }
        ],
        sections: [
            {
                heading: 'Useful feat buckets',
                intro: 'Sorting by job is faster than reading alphabetically.',
                entries: [
                    { label: 'Initiative and awareness', text: 'Alert, Observant, and similar picks reward players who hate being caught flat-footed.' },
                    { label: 'Spell support', text: 'Magic Initiate, War Caster, Ritual Caster, Fey Touched, and Shadow Touched broaden casters or hybrid builds.' },
                    { label: 'Weapon pressure', text: 'Great Weapon Master, Polearm Master, Sharpshooter, Sentinel, and Crusher-style picks reshape combat choices.' },
                    { label: 'Survivability', text: 'Tough, Resilient, Heavy Armor Master, and mobility tools keep characters active across long adventuring days.' },
                    { label: 'Skill and utility', text: 'Skill Expert, Skilled, Lucky, Chef, Crafter, and similar options often provide the widest session-to-session value.' }
                ]
            },
            {
                heading: 'How to pick better feats',
                intro: 'Ask what the feat changes in your actual turn loop.',
                bullets: [
                    'Pick feats that trigger often enough for you to remember using them without prompting.',
                    'Do not take two or three setup-heavy feats unless you know the campaign pace supports them.',
                    'If concentration keeps failing, solve that first before adding more spell variety.',
                    'If your build already hits hard, look for battlefield control or survivability instead of more of the same.'
                ]
            },
            {
                heading: 'Starter recommendations by player type',
                intro: 'These are not universally best. They are consistently readable.',
                bullets: [
                    'New martial players usually enjoy Tough, Alert, Sentinel, or a fighting-style-adjacent feat more than highly conditional combo pieces.',
                    'New caster players get reliable value from Magic Initiate, War Caster, Ritual Caster, or skill-support feats.',
                    'Players who love utility scenes should rarely regret Lucky, Skilled, Skill Expert, or a feat that adds rituals or languages.',
                    'If a feat only looks good when you assume advantage, perfect positioning, and surprise, it is probably not the first feat to take.'
                ]
            }
        ],
        relatedSlugs: ['classes', 'backgrounds', 'spells']
    },
    {
        slug: 'spells',
        routePath: '/rules/spells',
        label: 'Spells',
        icon: 'wand-sparkles',
        category: 'browse',
        description: 'Spell anatomy, schools, concentration pressure, and practical guidance for picking a useful spell loadout.',
        eyebrow: 'Magic System',
        heroTitle: 'Spells reward preparation more than memorization.',
        heroSummary: 'A good spell list gives you answers to the kinds of scenes your campaign actually runs. The most reliable casters are not the ones who memorize the most spell text; they are the ones who know when to spend a slot, when to hold concentration, and which tools are solving the group\'s real problems.',
        quickFacts: [
            { label: 'Spell ladder', value: 'Magic spans cantrips through 9th-level spells.' },
            { label: 'Eight schools', value: 'Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, and Transmutation all signal different jobs.' },
            { label: 'Big limiter', value: 'Concentration is often the real balancing rule for strong ongoing magic.' },
            { label: 'Best habit', value: 'Carry a mix of offense, defense, mobility, and one spell that solves a noncombat problem.' }
        ],
        highlights: [
            { title: 'Reliable baseline', text: 'Cantrips, reactions, and low-level utility spells usually define how a caster feels in ordinary rounds.' },
            { title: 'Concentration wins fights', text: 'The right sustained effect often matters more than one bigger damage roll.' },
            { title: 'Range and action cost matter', text: 'A spell can be good on paper and still feel bad if the timing or placement is awkward in real encounters.' }
        ],
        sections: [
            {
                heading: 'How to read a spell quickly',
                intro: 'These are the details that decide whether a spell is practical.',
                bullets: [
                    'Check casting time first. Reactions and bonus actions are often easier to justify than another full action spell.',
                    'Check range and area next. Many powerful spells fail because the battlefield never lines up for them.',
                    'Check duration and concentration. If it competes with your best ongoing effect, its real cost is higher than the slot says.',
                    'Check save or attack pattern. Pick magic that covers different defenses instead of overloading one lane.'
                ]
            },
            {
                heading: 'School overview',
                intro: 'School names are not flavor only. They usually hint at tactical identity.',
                entries: [
                    { label: 'Abjuration', text: 'Protection, shielding, negation, and magical safety tools.' },
                    { label: 'Conjuration', text: 'Summoning, movement, creation, and battlefield repositioning.' },
                    { label: 'Divination', text: 'Information, prediction, detection, and seeing what others miss.' },
                    { label: 'Enchantment', text: 'Mind influence, charm, fear, and social or combat control.' },
                    { label: 'Evocation', text: 'Direct energy output, explosive effects, and reliable damage delivery.' },
                    { label: 'Illusion', text: 'Misdirection, concealment, and indirect problem-solving.' },
                    { label: 'Necromancy', text: 'Life force manipulation, attrition, and grim utility or offense.' },
                    { label: 'Transmutation', text: 'Alteration of bodies, matter, movement, or battlefield properties.' }
                ]
            },
            {
                heading: 'Practical loadout advice',
                intro: 'Aim for coverage, not a stack of similar effects.',
                bullets: [
                    'Carry one defensive reaction, one concentration centerpiece, one mobility or escape tool, and one broad utility spell whenever possible.',
                    'Do not fill the whole list with damage. Someone who can end restraint, see through a problem, or cross a gap often saves more resources.',
                    'Prepared casters should swap spells toward the next session\'s likely terrain and social pressures instead of leaving lists static forever.',
                    'If you regularly forget a spell exists, replace it with something that fits your natural decision-making better.'
                ]
            }
        ],
        relatedSlugs: ['classes', 'feats', 'rules-glossary']
    },
    {
        slug: 'equipment',
        routePath: '/rules/equipment',
        label: 'Equipment',
        icon: 'backpack',
        category: 'browse',
        description: 'Weapons, armor, tools, coin, packs, and practical shopping advice for staying useful between rests.',
        eyebrow: 'Gear and Logistics',
        heroTitle: 'Equipment decides how prepared you are when the spell slots run dry.',
        heroSummary: 'Smart equipment choices make the whole party more consistent. Gear is not just a shopping list. It controls survival, travel speed, backup plans, and whether a character still contributes when magic is unavailable or the battlefield gets messy.',
        quickFacts: [
            { label: 'Main categories', value: 'Weapons, armor, tools, adventuring gear, mounts and vehicles, services, and crafting supplies make up most shopping decisions.' },
            { label: 'Coin flow', value: 'Copper, silver, electrum, gold, and platinum still matter for tracking downtime and resupply.' },
            { label: 'Mastery matters', value: 'Weapon mastery and armor training decisions define the feel of martial characters.' },
            { label: 'Best mindset', value: 'Buy for recurring problems: light, range, rope, healing, travel, and carrying capacity.' }
        ],
        highlights: [
            { title: 'Weapons shape turns', text: 'Range, properties, mastery, and damage type all matter more than raw price tags.' },
            { title: 'Armor shapes risk', text: 'AC changes how often the healer spends resources on you and how aggressively you can position.' },
            { title: 'Tools win scenes', text: 'A cheap kit or utility item often solves more problems than an expensive upgrade that only affects damage.' }
        ],
        sections: [
            {
                heading: 'Equipment families worth knowing',
                intro: 'Players usually need only this overview to shop intelligently.',
                entries: [
                    { label: 'Weapons', text: 'Choose for reach, range, mastery, handedness, and how often you can realistically attack with them.' },
                    { label: 'Armor and shields', text: 'These trade cost, stealth profile, and training requirements for survivability.' },
                    { label: 'Tools', text: 'Tool kits unlock crafting, profession flavor, downtime leverage, and clever scene solutions.' },
                    { label: 'Adventuring gear', text: 'Rope, torches, rations, bedrolls, mirrors, chalk, and containers keep sessions moving.' },
                    { label: 'Mounts and vehicles', text: 'These matter whenever the campaign is broad, fast-moving, or logistics-heavy.' },
                    { label: 'Services', text: 'Transport, lodging, labor, and information are often stronger investments than one more niche item.' }
                ]
            },
            {
                heading: 'What to buy early',
                intro: 'Starter purchases should increase reliability, not just fantasy flair.',
                bullets: [
                    'Make sure every character can see, carry basics, and survive a short separation from the rest of the party.',
                    'Buy a ranged option unless your build has a clear reason not to.',
                    'Give someone in the party navigation, light, climbing, and first-aid coverage before buying luxury items.',
                    'Track who carries rope, spare ammunition, rations, and utility containers so the party is not assuming invisible inventory.'
                ]
            },
            {
                heading: 'Logistics habits that pay off',
                intro: 'These are the boring details that prevent table friction.',
                bullets: [
                    'Review ammo, torches, rations, and healing consumables after long travel or difficult dungeons.',
                    'Use packs and containers intentionally so the group knows who can hand over what in a pinch.',
                    'If the campaign is using weight or carry limits, consolidate low-value clutter early.',
                    'Let equipment reflect character identity, but do not skip the dull items that keep the group alive.'
                ]
            }
        ],
        relatedSlugs: ['magic-items', 'character-sheets', 'basic-rules']
    },
    {
        slug: 'magic-items',
        routePath: '/rules/magic-items',
        label: 'Magic Items',
        icon: 'gem',
        category: 'browse',
        description: 'Rarity, attunement, item categories, and a DM-friendly way to introduce treasure without breaking party balance.',
        eyebrow: 'Treasure and Rewards',
        heroTitle: 'Magic items are strongest when they create stories, not just number bumps.',
        heroSummary: 'A memorable magic item gives a player a new lever, a new problem, or a new ritual at the table. The best treasure rewards are usually broad enough to feel exciting and narrow enough that they do not erase the rest of the party. This page is written to help both DMs and players evaluate that balance quickly.',
        quickFacts: [
            { label: 'Rarity ladder', value: 'Common, Uncommon, Rare, Very Rare, Legendary, and Artifact frame expected power.' },
            { label: 'Attunement cap', value: 'A creature can normally stay attuned to only three magic items at once.' },
            { label: 'Common categories', value: 'Armor, potions, rings, rods, scrolls, staves, wands, weapons, and wondrous items cover most treasure tables.' },
            { label: 'DM rule', value: 'Give items that support class identity instead of replacing it.' }
        ],
        highlights: [
            { title: 'Attunement is a draft', text: 'Strong items compete with each other, which keeps long campaigns interesting.' },
            { title: 'Consumables move pacing', text: 'Potions and scrolls change encounter confidence without permanently spiking power.' },
            { title: 'Wondrous items tell stories', text: 'The most memorable treasure is often the item with a weird use case, not the one with the biggest bonus.' }
        ],
        sections: [
            {
                heading: 'Category snapshot',
                intro: 'Different item types create different expectations at the table.',
                entries: [
                    { label: 'Weapons and armor', text: 'Most direct upgrade path for martial characters, but easiest to over-tune if stacked carelessly.' },
                    { label: 'Wands, rods, and staves', text: 'Often give casters extra reach, extra casts, or a stronger identity through a signature theme.' },
                    { label: 'Rings and wondrous items', text: 'Best place for niche but unforgettable effects that change exploration or social scenes.' },
                    { label: 'Potions and scrolls', text: 'Low-risk way to introduce variety because they do not permanently lock in power.' }
                ]
            },
            {
                heading: 'Attunement and rarity in practice',
                intro: 'These two labels should shape your expectations immediately.',
                bullets: [
                    'Attunement items should feel worth a slot. If a character forgets it exists, it is probably not attunement-worthy at your table.',
                    'Rarity is a rough guideline, not a guarantee. Some uncommon items warp campaigns more than rare ones in the wrong environment.',
                    'A party with several utility items often becomes more creative than a party stacked only with damage upgrades.',
                    'DMs should watch stacking defenses and repeatable movement effects more carefully than one-off treasure spikes.'
                ]
            },
            {
                heading: 'Awarding magic well',
                intro: 'Treasure works best when it changes choices without solving every problem automatically.',
                bullets: [
                    'Reward player behavior, campaign themes, or faction ties so treasure feels earned instead of random.',
                    'Mix durable rewards with consumables to keep future loot exciting.',
                    'Ask whether an item creates one cool new option or completely replaces a class feature. Favor the first.',
                    'Use cursed or story-bound items carefully and only when the table enjoys negotiation around risk.'
                ]
            }
        ],
        relatedSlugs: ['equipment', 'monsters', 'srd']
    },
    {
        slug: 'monsters',
        routePath: '/rules/monsters',
        label: 'Monsters',
        icon: 'skull',
        category: 'browse',
        description: 'Creature types, stat block anatomy, challenge rating, and encounter-reading guidance for players and DMs.',
        eyebrow: 'Encounter Design',
        heroTitle: 'Monsters are not just bags of hit points. They are rules packages with agendas.',
        heroSummary: 'A useful monster reference helps you understand what a creature is built to do before initiative is even rolled. For DMs, that means picking threats that ask different questions. For players, it means learning how to read battlefield tells, resistances, movement, and action economy before the situation spirals.',
        quickFacts: [
            { label: 'Creature types', value: 'Aberration, Beast, Celestial, Construct, Dragon, Elemental, Fey, Fiend, Giant, Humanoid, Monstrosity, Ooze, Plant, and Undead are the main categories.' },
            { label: 'Threat gauge', value: 'Challenge Rating is a starting estimate, not a promise of fairness.' },
            { label: 'Block essentials', value: 'AC, HP, initiative, speed, senses, traits, actions, and CR are the fastest-read fields.' },
            { label: 'Real difficulty', value: 'Terrain, number of enemies, surprise, and support effects usually matter more than CR alone.' }
        ],
        highlights: [
            { title: 'Stat blocks are stories', text: 'Traits, movement, and senses tell you where the creature wants the fight to happen.' },
            { title: 'Creature type matters', text: 'Type-based spells, lore checks, and resistances make this more than flavor text.' },
            { title: 'Encounter texture matters', text: 'Two medium monsters plus terrain can be more dangerous than one high-CR brute in an empty room.' }
        ],
        sections: [
            {
                heading: 'How to read a stat block fast',
                intro: 'These are the lines that matter before the first attack roll.',
                entries: [
                    { label: 'AC and HP', text: 'Tell you whether the monster is evasive, durable, or both.' },
                    { label: 'Initiative and speed', text: 'Reveal whether the creature wants to close distance, kite, fly, burrow, or ambush.' },
                    { label: 'Senses and languages', text: 'Hint at stealth pressure, darkness play, and whether negotiation is on the table.' },
                    { label: 'Traits, actions, and reactions', text: 'Show the monster\'s actual plan, especially if it punishes movement or action economy.' },
                    { label: 'Resistances and immunities', text: 'These fields often determine whether the party must change tactics instead of repeating the same turn.' }
                ]
            },
            {
                heading: 'Creature family expectations',
                intro: 'These patterns are not universal, but they help players form a first read.',
                entries: [
                    { label: 'Beasts', text: 'Usually straightforward instincts, mobility, and clear physical attack patterns.' },
                    { label: 'Constructs', text: 'Often resilient, literal-minded, and difficult to influence or disable through normal social means.' },
                    { label: 'Dragons and giants', text: 'Big personalities, big spaces, and battles that reward positioning and respect for reach.' },
                    { label: 'Fey and fiends', text: 'Often trickier, more mobile, and more likely to punish assumptions or bargain aggressively.' },
                    { label: 'Humanoids', text: 'Best for tactics, terrain use, and believable morale shifts.' },
                    { label: 'Undead', text: 'Often pressure endurance, fear, attrition, or unusual damage responses.' }
                ]
            },
            {
                heading: 'Encounter judgment for DMs',
                intro: 'Use CR as a draft, then pressure-test the scene around it.',
                bullets: [
                    'Ask how many meaningful actions the enemy side takes each round, not just how much HP it has.',
                    'Give monsters a reason to move, defend, call for help, or retreat so encounters feel alive.',
                    'Do not pair save-or-suffer effects with impossible terrain unless the table has counterplay.',
                    'When in doubt, add information and exits before adding more damage.'
                ]
            }
        ],
        relatedSlugs: ['basic-rules', 'rules-glossary', 'magic-items']
    },
    {
        slug: 'how-to-play',
        routePath: '/rules/how-to-play',
        label: 'How to Play D&D',
        icon: 'book-open-reader',
        category: 'resource',
        description: 'A plain-language walkthrough of the player, DM, and party loop so new tables can start quickly.',
        eyebrow: 'Getting Started',
        heroTitle: 'D&D starts with conversation, choices, and a group willing to imagine the same danger together.',
        heroSummary: 'New players do not need to know every rule to start. They need a table rhythm: describe intent, roll when the outcome is uncertain, accept consequences, and keep the story moving. This page is written as a practical onboarding route for a brand-new group using DungeonKeep during prep.',
        quickFacts: [
            { label: 'Core roles', value: 'Players portray adventurers, the DM runs the world, and the party decides how to face problems.' },
            { label: 'Core loop', value: 'Describe, adjudicate, roll if needed, narrate outcome, and repeat.' },
            { label: 'First milestone', value: 'A table is ready once everyone can explain what their character wants in the opening scene.' },
            { label: 'Best habit', value: 'Make choices out loud so the group can build momentum together.' }
        ],
        highlights: [
            { title: 'Players roleplay a hero', text: 'You decide what the character attempts, what they risk, and how they react when plans fail.' },
            { title: 'The DM tells the world back', text: 'The DM presents locations, consequences, NPCs, and pressure without deciding your choices for you.' },
            { title: 'The party is the engine', text: 'Most great sessions come from characters making plans together, not from perfect individual turns.' }
        ],
        sections: [
            {
                heading: 'What players actually do',
                intro: 'Forget the jargon for a moment. Players mostly do four things.',
                bullets: [
                    'State what their characters attempt and why.',
                    'React to new information, danger, and social pressure as the story changes.',
                    'Use abilities, gear, and spells to solve uncertain problems.',
                    'Support the group by sharing spotlight, information, and risk.'
                ]
            },
            {
                heading: 'What the DM actually does',
                intro: 'The DM is not opposing the table. The DM is curating pressure and consequence.',
                bullets: [
                    'Describe environments, NPCs, threats, and opportunities clearly enough for players to make informed choices.',
                    'Ask for checks, saves, or attacks when success is uncertain and failure would matter.',
                    'Keep pace by cutting between scenes, clarifying stakes, and saying what changes in the world after the players act.',
                    'Protect fun by matching challenge to the group and keeping expectations visible.'
                ]
            },
            {
                heading: 'Launch a first session fast',
                intro: 'You do not need a perfect campaign bible to begin.',
                bullets: [
                    'Start with a clear premise, one location, one complication, and one reason the party already works together.',
                    'Ask each player for a goal, a fear, and one relationship hook that the DM can use immediately.',
                    'Keep early fights readable and give new players a few turns to learn the action economy before adding layered hazards.',
                    'End the session with a concrete next destination so the second session begins with momentum.'
                ]
            }
        ],
        relatedSlugs: ['basic-rules', 'character-sheets', 'classes']
    },
    {
        slug: 'basic-rules',
        routePath: '/rules/basic-rules',
        label: 'D&D Basic Rules',
        icon: 'book',
        category: 'resource',
        description: 'A guided map of the free 2024 rules, including the best reading order for players and DMs.',
        eyebrow: 'Reference Map',
        heroTitle: 'The Basic Rules are the fastest complete starting point for a new table.',
        heroSummary: 'The free rules are broad enough to teach the rhythm of play, character creation, combat, conditions, monsters, and DM basics without requiring a full product library. The trick is knowing what to read first. Most groups do better with a guided path than with a cover-to-cover trudge.',
        quickFacts: [
            { label: 'Major sections', value: 'Players, Dungeon Masters, Monsters, and the Rules Glossary form the main structure.' },
            { label: 'Player essentials', value: 'Playing the Game, Character Creation, Character Classes, Character Origins, Feats, Equipment, and Spells are the highest-value chapters.' },
            { label: 'DM essentials', value: 'The Basics, the DM\'s Toolbox, and Magic Items cover early campaign needs.' },
            { label: 'Best approach', value: 'Read in role-based passes instead of trying to absorb everything at once.' }
        ],
        highlights: [
            { title: 'Players chapter flow', text: 'Start with how the game works before studying your own build choices.' },
            { title: 'DM chapter flow', text: 'Read session prep and encounter tools before worrying about deep edge cases.' },
            { title: 'Glossary backup', text: 'When a keyword is unclear, the glossary is often the cleanest answer.' }
        ],
        sections: [
            {
                heading: 'Recommended reading order for players',
                intro: 'This path gets new players table-ready without overload.',
                entries: [
                    { label: 'Playing the Game', text: 'Learn the basic loop, d20 tests, actions, combat, and conditions first.' },
                    { label: 'Character Creation', text: 'Understand how level, progression, and the sheet fit together.' },
                    { label: 'Classes and Origins', text: 'Choose the broad identity of the character before finer optimization.' },
                    { label: 'Feats, Equipment, and Spells', text: 'Use these chapters as build support once the core identity is locked in.' },
                    { label: 'Glossary', text: 'Return here when a keyword or condition is blocking play.' }
                ]
            },
            {
                heading: 'Recommended reading order for DMs',
                intro: 'DMs need confidence in pacing and consequences more than encyclopedic memory.',
                entries: [
                    { label: 'The Basics', text: 'Focus on what a DM does, how to prepare a session, and how to keep the table fun.' },
                    { label: 'DM\'s Toolbox', text: 'Use this for travel, hazards, traps, and other adventure scaffolding.' },
                    { label: 'Monsters', text: 'Learn how stat blocks are structured before choosing encounter threats.' },
                    { label: 'Magic Items', text: 'Use later, when the campaign starts handing out meaningful treasure.' }
                ]
            },
            {
                heading: 'When to open the Basic Rules mid-session',
                intro: 'Treat it as a reference document, not a script.',
                bullets: [
                    'Open it when a keyword determines stakes, such as concentration, grapple, cover, or a condition.',
                    'Do not freeze play for every edge case. Make a ruling, note it, and verify after the scene if needed.',
                    'If the same issue returns every session, add a quick table note in DungeonKeep rather than re-reading the whole chapter.',
                    'Use chapter structure to narrow your search before jumping directly into the glossary.'
                ]
            }
        ],
        relatedSlugs: ['how-to-play', 'rules-glossary', 'character-sheets']
    },
    {
        slug: 'rules-glossary',
        routePath: '/rules/rules-glossary',
        label: 'Rules Glossary',
        icon: 'list-tree',
        category: 'resource',
        description: 'Definitions for actions, conditions, movement, cover, concentration, and other terms that decide how scenes resolve.',
        eyebrow: 'Keyword Reference',
        heroTitle: 'The glossary is where vague table arguments become clear mechanical language.',
        heroSummary: 'Most rules confusion is really terminology confusion. If the table agrees on what a condition, action, or timing phrase means, play speeds up immediately. This page does not try to restate every glossary entry. It shows you how to use the glossary, which entries matter most, and what terms repeatedly decide outcomes.',
        quickFacts: [
            { label: 'Purpose', value: 'The glossary defines current rules terms only and cross-links related entries.' },
            { label: 'Action value', value: 'Many of the most important entries describe actions, conditions, cover, movement, and concentration.' },
            { label: 'Reading pattern', value: 'Check the keyword, then follow any see-also terms that affect the same moment.' },
            { label: 'Table payoff', value: 'Knowing the glossary saves more time than memorizing niche edge cases.' }
        ],
        highlights: [
            { title: 'Actions are a family', text: 'Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Magic, Ready, Search, Study, and Utilize all frame what a turn can really look like.' },
            { title: 'Conditions are leverage', text: 'Blinded, Frightened, Grappled, Invisible, Prone, Restrained, Stunned, and others shape encounters harder than raw damage math.' },
            { title: 'Timing words matter', text: 'Reaction, bonus action, concentration, and opportunity attack all decide whether a plan is legal before it is clever.' }
        ],
        sections: [
            {
                heading: 'High-value glossary entries',
                intro: 'These are the terms that come up constantly at ordinary tables.',
                entries: [
                    { label: 'Concentration', text: 'Vital for casters because it determines which ongoing effect survives incoming damage and future casting.' },
                    { label: 'Cover', text: 'Often forgotten, but it changes attack math and positioning decisions immediately.' },
                    { label: 'Grappled and Prone', text: 'Common battlefield states that alter movement, attacks, and escape options.' },
                    { label: 'Hide and Invisible', text: 'These explain stealth outcomes better than vague table intuition alone.' },
                    { label: 'Opportunity Attack and Reaction', text: 'These control movement risk and punish careless retreat.' },
                    { label: 'Search and Study', text: 'Useful reminders that investigation and perception are not the same scene function.' }
                ]
            },
            {
                heading: 'Action economy shortcuts',
                intro: 'Most mid-combat questions are really action-economy questions.',
                bullets: [
                    'One action does not mean one thing. Attack, Magic, Help, Ready, and other actions support very different plans.',
                    'Bonus actions are not always available; you only get one when a rule gives you one.',
                    'Reactions refresh at the start of your next turn, so timing matters more than many players realize.',
                    'If a turn feels too good to be true, check whether it is trying to spend an action, bonus action, and reaction in an illegal sequence.'
                ]
            },
            {
                heading: 'Condition awareness for players',
                intro: 'Players who track these well make better tactical decisions immediately.',
                entries: [
                    { label: 'Frightened', text: 'Line of sight matters and can lock movement in ways that surprise unprepared players.' },
                    { label: 'Restrained', text: 'This is brutal because it punishes both defense and offense at once.' },
                    { label: 'Stunned and Paralyzed', text: 'These are emergency-level conditions because they crush turns and invite punishment.' },
                    { label: 'Exhaustion', text: 'Small levels snowball across travel and repeated failure, so do not ignore it.' }
                ]
            }
        ],
        relatedSlugs: ['basic-rules', 'spells', 'monsters']
    },
    {
        slug: 'character-sheets',
        routePath: '/rules/character-sheets',
        label: 'D&D Character Sheets',
        icon: 'file-lines',
        category: 'resource',
        description: 'What belongs on a sheet, how to maintain it between sessions, and which fields matter most during play.',
        eyebrow: 'Table Tools',
        heroTitle: 'A clean character sheet keeps your turn fast and your roleplay grounded.',
        heroSummary: 'The sheet is the table-facing version of the character. If it is organized, turns move faster, rests are easier to track, and players spend less time re-deriving information they already earned. This page is written to help players maintain a usable sheet, not just fill every box once.',
        quickFacts: [
            { label: 'Core fields', value: 'Ability scores, proficiencies, HP, armor class, speed, attacks, gear, spells, and notes should always be current.' },
            { label: 'Turn speed', value: 'The most-used information belongs in easy reach: attack bonuses, save DC, key resources, and common actions.' },
            { label: 'Rest rhythm', value: 'Hit points, spell slots, limited uses, and consumables should be updated after every meaningful rest.' },
            { label: 'Best practice', value: 'If you keep checking the same rule every session, add a short note directly to the sheet.' }
        ],
        highlights: [
            { title: 'Front-load the essentials', text: 'Put action economy, attack math, and passive numbers where you can see them instantly.' },
            { title: 'Track what changes', text: 'A sheet becomes unreliable when temporary values and one-use resources are left floating.' },
            { title: 'Notes are mechanics too', text: 'Contacts, oaths, debts, and signatures from your background belong on the sheet if they change play.' }
        ],
        sections: [
            {
                heading: 'How to structure a useful sheet',
                intro: 'Think in terms of table decisions, not form fields.',
                entries: [
                    { label: 'Identity block', text: 'Name, class, background, species, and a one-line motivation help roleplay stay visible.' },
                    { label: 'Combat block', text: 'HP, AC, speed, initiative, attacks, save DC, and limited-use class features belong together.' },
                    { label: 'Exploration and social block', text: 'Passive Perception, languages, tools, and standout proficiencies should be easy to reference.' },
                    { label: 'Inventory block', text: 'Weapons, armor, consumables, money, and utility gear need current counts.' },
                    { label: 'Spell block', text: 'Prepared list, slots, concentration reminders, and favorite reactions should be clearly marked.' }
                ]
            },
            {
                heading: 'Between-session upkeep',
                intro: 'Five minutes of maintenance prevents fifteen minutes of table delay later.',
                bullets: [
                    'Update hit points, slots, and limited uses after rests before the next session starts.',
                    'Write down new items, debts, NPC names, and promises while the session is fresh.',
                    'Remove clutter from inventory and notes so the important pieces stay visible.',
                    'If leveling happened, rewrite attack bonuses and save DCs clearly instead of trusting memory.'
                ]
            },
            {
                heading: 'Fast-turn checklist',
                intro: 'Use this if a player freezes during combat.',
                bullets: [
                    'Where are you standing and what threatens you right now?',
                    'What can you do with your action, bonus action, and movement this turn?',
                    'Is concentration already active, and do you need to protect it?',
                    'Which option helps the party objective, not just your personal damage total?'
                ]
            }
        ],
        relatedSlugs: ['how-to-play', 'basic-rules', 'equipment']
    },
    {
        slug: 'srd',
        routePath: '/rules/srd',
        label: 'System Reference Document (SRD)',
        icon: 'books',
        category: 'resource',
        description: 'What the SRD is for, what 5.2.1 covers, and why creators, DMs, and advanced players should care.',
        eyebrow: 'Open Rules Reference',
        heroTitle: 'The SRD is the open rules foundation, not the full branded game library.',
        heroSummary: 'The System Reference Document exists so creators and advanced groups can work with a legally open slice of D&D rules content. It is powerful, but it is intentionally incomplete. This page focuses on what the SRD is for, what changed in 5.2.x, and when it matters to ordinary table play inside DungeonKeep.',
        quickFacts: [
            { label: 'Current version', value: 'D&D Beyond lists SRD v5.2.1 as the latest English release.' },
            { label: 'License', value: 'SRD 5.2.x is published under Creative Commons Attribution 4.0.' },
            { label: 'Best use', value: 'Reference it for open content, creator work, conversions, and legal clarity.' },
            { label: 'Important limit', value: 'It does not include every class, species, spell, item, or monster from the core branded books.' }
        ],
        highlights: [
            { title: 'Open, not exhaustive', text: 'The SRD gives a robust playable foundation without reproducing all protected D&D identity elements.' },
            { title: 'Creator-friendly', text: 'It is the cleanest route for people building compatible material who need clarity about what is open.' },
            { title: 'Mechanically current', text: 'The 5.2 series reflects 5.5e wording and adds newer glossary and rules structure support.' }
        ],
        sections: [
            {
                heading: 'What the SRD includes',
                intro: 'Think of it as an open toolkit with boundaries.',
                entries: [
                    { label: 'Core rules content', text: 'Gameplay structure, character creation support, classes, origins, feats, equipment, spells, monsters, and a rules glossary.' },
                    { label: 'Creator guidance value', text: 'It provides a stable base for compatible products without requiring a private license agreement.' },
                    { label: 'Version history', text: 'Older SRD versions remain available, which matters for published projects and conversions.' }
                ]
            },
            {
                heading: 'Notable 5.2.x changes',
                intro: 'These updates are relevant even if you are not publishing anything.',
                bullets: [
                    'SRD 5.2 adds a rules glossary and aligns wording with the newer 5.5e rules presentation.',
                    'It expands backgrounds, feats, equipment support, spells, magic items, and monsters compared with older SRD baselines.',
                    'Some names differ from the full core books because the SRD avoids protected identity terms where needed.',
                    'Not every beloved option is present, so players should not assume SRD completeness when building from memory.'
                ]
            },
            {
                heading: 'When this matters at the table',
                intro: 'The SRD is not only for publishers.',
                bullets: [
                    'DMs can use it to separate open rules structure from setting-specific assumptions.',
                    'Homebrew-minded groups can check whether a reference is broadly open before building on it.',
                    'Players using third-party material should understand that some options are open equivalents rather than one-to-one branded reproductions.',
                    'If your campaign notes may become public reference material, the SRD is the safer rules vocabulary to lean on.'
                ]
            }
        ],
        relatedSlugs: ['basic-rules', 'magic-items', 'playtest']
    },
    {
        slug: 'playtest',
        routePath: '/rules/playtest',
        label: 'Unearthed Arcana',
        icon: 'flask-round-poison',
        category: 'resource',
        description: 'How to evaluate playtest material, communicate table expectations, and keep experimental content from derailing a campaign.',
        eyebrow: 'Experimental Material',
        heroTitle: 'Playtest content works best when the table treats it as a living draft.',
        heroSummary: 'Unearthed Arcana and other playtest-style releases are exciting because they offer new ideas early. They are risky for the same reason. Features can change, disappear, or prove unstable in actual campaign play. This page gives DungeonKeep groups a simple policy for trying experiments without letting them quietly rewrite the campaign every two weeks.',
        quickFacts: [
            { label: 'Status', value: 'Playtest content is provisional and should never be assumed final.' },
            { label: 'Table rule', value: 'Use it only with clear DM approval and explicit group expectations.' },
            { label: 'Main risk', value: 'Balance, wording, and future compatibility can all shift during feedback cycles.' },
            { label: 'Best use', value: 'Short arcs, one-shots, or tightly reviewed campaign experiments.' }
        ],
        highlights: [
            { title: 'Consent matters', text: 'A group should know whether experimental material may be revised or replaced mid-campaign.' },
            { title: 'Documentation matters', text: 'Track which draft is being used so future disputes are about choices, not memory.' },
            { title: 'Revisions are normal', text: 'If a playtest option changes, that is not a betrayal. It is the point of playtesting.' }
        ],
        sections: [
            {
                heading: 'How to evaluate a playtest option',
                intro: 'Do not ask only whether it looks fun. Ask whether it is stable in your campaign.',
                bullets: [
                    'Check whether the option creates repeatable advantage, extra actions, or unusual resource refunds.',
                    'Ask how much table time it consumes compared with an ordinary official option in the same role.',
                    'Decide whether the campaign can survive a rewrite if the option proves awkward after three sessions.',
                    'Look for wording gaps that force the DM to invent new rules every time the feature appears.'
                ]
            },
            {
                heading: 'Recommended table policy',
                intro: 'A simple policy prevents future resentment.',
                bullets: [
                    'Record the source and version date of the experimental option in the campaign notes.',
                    'Agree up front that the DM may adjust, replace, or retire the option if it harms play.',
                    'Offer rebuild windows so the player does not feel punished for trying something creative.',
                    'Review the option after a few sessions instead of waiting for it to become a long-running argument.'
                ]
            },
            {
                heading: 'Best places to use playtest material',
                intro: 'Some campaign structures absorb experimentation better than others.',
                entries: [
                    { label: 'One-shots', text: 'Best environment for bold ideas because the consequences are contained.' },
                    { label: 'Mini-campaigns', text: 'Good compromise when the group wants to learn whether the option has legs.' },
                    { label: 'Long campaigns', text: 'Only use if the group is comfortable revisiting the decision openly and without drama.' },
                    { label: 'Public-facing notes or guides', text: 'Mark playtest content clearly so other readers do not mistake it for settled rules.' }
                ]
            }
        ],
        relatedSlugs: ['srd', 'basic-rules', 'how-to-play']
    }
] as const satisfies readonly RulesLink[];

export const rulesBrowseLinks = rulesEntries.filter((entry) => entry.category === 'browse');

export const rulesResourceLinks = rulesEntries.filter((entry) => entry.category === 'resource');

export function getRulesEntryBySlug(slug: string): RulesLink | null {
    return rulesEntries.find((entry) => entry.slug === slug) ?? null;
}