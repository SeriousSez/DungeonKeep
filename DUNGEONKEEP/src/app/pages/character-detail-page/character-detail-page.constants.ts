import type { AlignmentDrawerDetail, FaithDrawerDetail, LifestyleCostDetail, LifestyleDrawerDetail, SpeciesLoreDetail } from './character-detail-page.background-drawers';
import type { ConditionDefinition, PersistedConditionKey, TieflingLegacyName } from './character-detail-page.types';

export const tieflingLegacySpellByLegacy: Readonly<Record<TieflingLegacyName, { cantrip: string; level3: string; level5: string }>> = {
    Abyssal: { cantrip: 'Poison Spray', level3: 'Ray of Sickness', level5: 'Hold Person' },
    Chthonic: { cantrip: 'Chill Touch', level3: 'False Life', level5: 'Ray of Enfeeblement' },
    Infernal: { cantrip: 'Fire Bolt', level3: 'Hellish Rebuke', level5: 'Darkness' }
};

export const CONDITION_DEFINITIONS: ReadonlyArray<ConditionDefinition> = [
    {
        key: 'blinded',
        label: 'Blinded',
        icon: 'fa-eye-slash',
        bullets: [
            "You can't see and automatically fail checks that require sight.",
            'Attack rolls against you have advantage.',
            'Your attack rolls have disadvantage.'
        ]
    },
    {
        key: 'charmed',
        label: 'Charmed',
        icon: 'fa-heart',
        bullets: [
            "You can't attack the charmer or target them with harmful effects.",
            'The charmer has advantage on social checks involving you.'
        ]
    },
    {
        key: 'deafened',
        label: 'Deafened',
        icon: 'fa-ear-deaf',
        bullets: [
            "You can't hear.",
            'Checks that require hearing automatically fail.'
        ]
    },
    {
        key: 'frightened',
        label: 'Frightened',
        icon: 'fa-skull',
        bullets: [
            'You have disadvantage on attacks and ability checks while the fear source is in sight.',
            "You can't willingly move closer to the source of fear."
        ]
    },
    {
        key: 'grappled',
        label: 'Grappled',
        icon: 'fa-hand-back-fist',
        bullets: [
            'Your speed becomes 0 and cannot increase.',
            'You have disadvantage on attacks against targets other than the grappler.'
        ]
    },
    {
        key: 'incapacitated',
        label: 'Incapacitated',
        icon: 'fa-user-slash',
        bullets: [
            "You can't take actions, bonus actions, or reactions.",
            'Your concentration ends, and you cannot speak.'
        ]
    },
    {
        key: 'invisible',
        label: 'Invisible',
        icon: 'fa-user-secret',
        bullets: [
            "You can't be seen without magic or a special sense.",
            'Attack rolls against you have disadvantage, and your attacks have advantage.'
        ]
    },
    {
        key: 'paralyzed',
        label: 'Paralyzed',
        icon: 'fa-bolt',
        bullets: [
            'You are incapacitated and your speed is 0.',
            'You automatically fail Strength and Dexterity saves.',
            'Hits from creatures within 5 feet are critical hits.'
        ]
    },
    {
        key: 'petrified',
        label: 'Petrified',
        icon: 'fa-gem',
        bullets: [
            'You turn into an inanimate substance, usually stone.',
            'You are incapacitated, your speed is 0, and attacks against you have advantage.',
            'You gain resistance to all damage.'
        ]
    },
    {
        key: 'poisoned',
        label: 'Poisoned',
        icon: 'fa-skull-crossbones',
        bullets: [
            'You have disadvantage on attack rolls and ability checks.'
        ]
    },
    {
        key: 'prone',
        label: 'Prone',
        icon: 'fa-person-falling',
        bullets: [
            'Your movement is limited to crawling unless you stand up.',
            'You have disadvantage on attacks.',
            'Nearby melee attackers gain advantage against you.'
        ]
    },
    {
        key: 'restrained',
        label: 'Restrained',
        icon: 'fa-hands-bound',
        bullets: [
            'Your speed becomes 0 and cannot increase.',
            'Attacks against you have advantage, and your attacks have disadvantage.',
            'You have disadvantage on Dexterity saving throws.'
        ]
    },
    {
        key: 'stunned',
        label: 'Stunned',
        icon: 'fa-stars',
        bullets: [
            'You are incapacitated.',
            'You automatically fail Strength and Dexterity saves.',
            'Attack rolls against you have advantage.'
        ]
    },
    {
        key: 'unconscious',
        label: 'Unconscious',
        icon: 'fa-bed',
        bullets: [
            'You are incapacitated and prone and drop what you are holding.',
            'Your speed becomes 0, and you are unaware of your surroundings.',
            'Hits from attackers within 5 feet are critical hits.'
        ]
    }
];

export const CONDITION_KEY_ORDER = CONDITION_DEFINITIONS.map((entry) => entry.key) as PersistedConditionKey[];

export const CONDITION_LABEL_LOOKUP = CONDITION_DEFINITIONS.reduce((lookup, entry) => {
    lookup[entry.key] = entry.label;
    return lookup;
}, {} as Record<PersistedConditionKey, string>);

export const EXHAUSTION_LEVEL_RULES: ReadonlyArray<{ level: number; effect: string }> = [
    { level: 1, effect: 'Disadvantage on ability checks.' },
    { level: 2, effect: 'Speed halved.' },
    { level: 3, effect: 'Disadvantage on attack rolls and saving throws.' },
    { level: 4, effect: 'Hit point maximum halved.' },
    { level: 5, effect: 'Speed reduced to 0.' },
    { level: 6, effect: 'Death.' }
];

export const COMBAT_ACTION_DETAILS: Readonly<Record<string, { description: string; bullets: string[]; rulesText?: string }>> = {
    attack: {
        description: 'Make one attack with a weapon or an unarmed strike on your turn.',
        bullets: [
            'You can draw or put away one weapon as part of the attack.',
            'If you have Extra Attack, you can move between those attacks.',
            'An unarmed strike can deal damage, start a grapple, or shove a target.'
        ],
        rulesText: 'Use Attack when you want to directly harm a target or make a physical combat maneuver.'
    },
    dash: {
        description: 'You trade your action for more movement this turn.',
        bullets: [
            'Gain extra movement equal to your current Speed after modifiers.',
            'You can choose a special speed such as Fly or Swim if you have one.'
        ],
        rulesText: 'Dash is ideal for closing distance, retreating, or repositioning across the battlefield.'
    },
    disengage: {
        description: 'Move carefully so enemies cannot make opportunity attacks against you this turn.',
        bullets: [
            'Your movement stops provoking opportunity attacks for the rest of the current turn.',
            'It is the safest way to slip out of melee without teleporting or forcing movement.'
        ]
    },
    dodge: {
        description: 'You focus entirely on defense and awareness until your next turn begins.',
        bullets: [
            'Attack rolls against you have disadvantage if you can see the attacker.',
            'You make Dexterity saving throws with advantage.'
        ],
        rulesText: 'These benefits end early if you become Incapacitated or if your Speed drops to 0.'
    },
    grapple: {
        description: 'Try to seize a nearby creature and hold it in place.',
        bullets: [
            'Usually done as an unarmed strike against a creature within 5 feet.',
            'You need a free hand, and the target cannot be more than one size larger than you.',
            'On a failed Strength or Dexterity save against your escape DC, the target becomes Grappled.'
        ],
        rulesText: 'A Grappled creature has Speed 0 and can use its action to try to escape.'
    },
    help: {
        description: 'You assist an ally with a task or distract an enemy for them.',
        bullets: [
            'Aid a nearby ally on a skill or tool check, granting advantage on their next relevant check.',
            'Or distract a foe within 5 feet so the next allied attack against it has advantage.'
        ],
        rulesText: 'The benefit expires if it is not used before the start of your next turn.'
    },
    hide: {
        description: 'Conceal yourself so enemies lose track of you.',
        bullets: [
            'Make a Dexterity (Stealth) check, typically against DC 15.',
            'You usually need heavy obscurity, strong cover, and to be out of enemy sight.',
            'If you succeed, you count as hidden until something gives you away.'
        ],
        rulesText: 'You stop being hidden if you make more than a whisper of noise, get found, attack, or cast a spell with a verbal component.'
    },
    improvise: {
        description: 'Attempt a creative stunt that does not fit one of the standard action options.',
        bullets: [
            'Describe what your character is trying to do in the scene.',
            'The DM decides whether it needs a check, an attack roll, a saving throw, or another ruling.'
        ],
        rulesText: 'Improvised actions are intentionally flexible and depend on the situation at the table.'
    },
    influence: {
        description: 'Use words, presence, or demeanor to sway a creature during the encounter.',
        bullets: [
            'Deception, Intimidation, Performance, Persuasion, or Animal Handling may apply.',
            'If the creature is hesitant, the default DC is often 15 or its Intelligence score, whichever is higher.'
        ],
        rulesText: 'On a failed attempt, the same approach usually cannot be pressed again for a while unless the situation changes.'
    },
    magic: {
        description: 'Cast a spell or activate a magical feature or item that uses the Magic action.',
        bullets: [
            'Most spells with a casting time of an action use this option.',
            'Longer casts require you to keep taking the Magic action on later turns.',
            'If concentration breaks during that process, the effect fizzles.'
        ]
    },
    ready: {
        description: 'Prepare a response now so you can react to a trigger before your next turn.',
        bullets: [
            'Choose a clear, perceivable trigger.',
            'Choose the action you will take or move up to your Speed when that trigger happens.',
            'You use your Reaction to follow through when the trigger occurs.'
        ],
        rulesText: 'Readied spells are cast in advance and then held with concentration until released.'
    },
    search: {
        description: 'Scan the area or a creature for something that is not immediately obvious.',
        bullets: [
            'This is a Wisdom check guided by what you are trying to detect.',
            'Perception may find hidden creatures or objects, Survival may reveal tracks, and Medicine or Insight can uncover other clues.'
        ]
    },
    shove: {
        description: 'Knock a nearby creature back or send it to the ground.',
        bullets: [
            'Usually performed as part of an unarmed strike.',
            'The target makes a Strength or Dexterity save against your unarmed strike DC.',
            'On a failure, you push it 5 feet away or knock it Prone.'
        ]
    },
    study: {
        description: 'Pause to analyze lore, clues, magic, religion, or a piece of information.',
        bullets: [
            'This is an Intelligence check based on the topic at hand.',
            'Arcana, History, Investigation, Nature, or Religion commonly apply.'
        ],
        rulesText: 'Use Study when the answer depends on knowledge, memory, or careful analysis rather than quick observation.'
    },
    utilize: {
        description: 'Use an item or object when that interaction specifically requires an action.',
        bullets: [
            'Examples include activating gear, pulling mechanisms, or using an object with a listed action cost.',
            'Simple object interactions are often folded into movement or another action instead.'
        ]
    },
    'two-weapon fighting': {
        description: 'Follow up a Light-weapon attack with an off-hand strike as a bonus action.',
        bullets: [
            'You normally need a different Light weapon in the other hand.',
            'The bonus attack is separate from your main attack sequence.'
        ],
        rulesText: 'This is a quick extra attack option for dual-wielding characters.'
    },
    'opportunity attack': {
        description: 'Make a quick melee strike when a creature you can see leaves your reach.',
        bullets: [
            'This uses your Reaction.',
            'The attack happens just before the creature gets away.',
            'You make one melee weapon attack or one unarmed strike.'
        ],
        rulesText: 'Forced movement or teleportation usually does not trigger this response.'
    },
    'interact with an object': {
        description: 'Handle a door, lever, pouch, torch, or similar object during the flow of your turn.',
        bullets: [
            'Many simple interactions are free once per turn when paired with movement or another action.',
            'If the object explicitly needs an action, use Utilize instead.'
        ]
    }
};

export const ALIGNMENT_DETAILS: Readonly<Record<string, AlignmentDrawerDetail>> = {
    'Lawful Good': {
        description: 'Lawful good characters combine compassion with duty. They believe mercy, justice, and restraint matter most when they are upheld through honorable action and reliable principles.',
        bullets: [
            'Acts with integrity, discipline, and a strong sense of responsibility toward others.',
            'Favors fair systems, oaths, and institutions when those systems protect the innocent.',
            'Will often sacrifice comfort or safety to do what is right in a principled way.'
        ]
    },
    'Neutral Good': {
        description: 'Neutral good characters focus on helping others without being tightly bound to law or rebellion. Their moral compass is guided by kindness, practicality, and conscience.',
        bullets: [
            'Puts compassion ahead of ideology or rigid codes.',
            'Supports rules when they help people, and ignores them when they cause harm.',
            'Usually seeks the most humane and constructive outcome available.'
        ]
    },
    'Chaotic Good': {
        description: 'Chaotic good characters value freedom, empathy, and self-expression. They resist oppression and prefer to do good on their own terms rather than through imposed systems.',
        bullets: [
            'Distrusts authority that limits liberty or enables cruelty.',
            'Acts from personal conviction rather than obedience.',
            'Often protects others by defying unjust expectations, laws, or traditions.'
        ]
    },
    'Lawful Neutral': {
        description: 'Lawful neutral characters prioritize order, structure, and consistency. They believe systems, discipline, and rules provide stability, even when emotional or moral questions are complicated.',
        bullets: [
            'Values hierarchy, routine, contracts, and procedure.',
            'May choose duty over personal preference or sentiment.',
            'Can be dependable and fair, but also rigid when flexibility is needed.'
        ]
    },
    'True Neutral': {
        description: 'True neutral characters tend toward balance, restraint, or simple pragmatism. They avoid extremes and often respond to situations case by case instead of following a fixed creed.',
        bullets: [
            'Prefers measured choices over ideological commitments.',
            'May act as a mediator, observer, or practical survivor.',
            'Can seem calm and grounded, though sometimes detached.'
        ]
    },
    'Chaotic Neutral': {
        description: 'Chaotic neutral characters are driven by freedom, impulse, and independence. They resist control and prefer to make choices according to their own instincts and desires.',
        bullets: [
            'Protects personal autonomy above conformity or duty.',
            'Can be spontaneous, unpredictable, and hard to manage.',
            'May champion freedom sincerely or simply reject restraint.'
        ]
    },
    'Lawful Evil': {
        description: 'Lawful evil characters use order, hierarchy, and discipline in service of selfish or cruel goals. They are often patient, strategic, and comfortable with systems of control.',
        bullets: [
            'Seeks power through structure, enforcement, and leverage.',
            'Honors rules when they are useful, especially when those rules benefit them.',
            'Can be coldly reliable, but rarely merciful.'
        ]
    },
    'Neutral Evil': {
        description: 'Neutral evil characters are motivated by self-interest above all else. They pursue advantage with little concern for fairness, loyalty, or the suffering left behind.',
        bullets: [
            'Measures choices by profit, safety, or influence.',
            'Will cooperate when useful and betray when convenient.',
            'Often hides ruthlessness behind pragmatism or charm.'
        ]
    },
    'Chaotic Evil': {
        description: 'Chaotic evil characters embrace destruction, cruelty, or violent selfishness without respect for rules or order. Their desires and impulses override stability, trust, and restraint.',
        bullets: [
            'Rejects authority, obligation, and moral restraint.',
            'Frequently acts through fear, rage, or appetite.',
            'Creates danger not only for enemies, but often for allies as well.'
        ]
    }
};

export const LIFESTYLE_DETAILS: Readonly<Record<string, LifestyleDrawerDetail>> = {
    wretched: {
        description: 'A wretched lifestyle means almost no shelter, privacy, or security. Survival comes before dignity, and every day is shaped by exposure, hunger, and danger.',
        bullets: [
            'Often sleeps outdoors, in alleys, ruins, or whatever temporary refuge can be found.',
            'Meals are inconsistent and usually poor in quality.',
            'This level of poverty makes illness, exhaustion, and social vulnerability far more common.'
        ]
    },
    squalid: {
        description: 'A squalid lifestyle provides a roof of some kind, but conditions remain filthy, unsafe, and degrading. The character lives with discomfort and constant risk.',
        bullets: [
            'Lodging is cramped, dirty, and often infested or poorly maintained.',
            'Food is cheap and unreliable, and sanitation is poor.',
            'The character is likely familiar with desperate neighborhoods and hard living.'
        ]
    },
    poor: {
        description: 'A poor lifestyle covers basic needs but little else. The character can keep going day to day, though comfort, quality, and social standing remain limited.',
        bullets: [
            'Meals are simple, lodging is crowded, and clothing is practical rather than refined.',
            'Money is watched carefully, with little margin for luxuries or mistakes.',
            'This is stable survival, not true security.'
        ]
    },
    modest: {
        description: 'A modest lifestyle is respectable and sustainable. It provides decent food, reasonable shelter, and enough stability to keep equipment and reputation in order.',
        bullets: [
            'The character can afford ordinary lodging and dependable meals.',
            'This lifestyle avoids obvious hardship without signaling wealth.',
            'It suits many adventurers between expeditions.'
        ]
    },
    comfortable: {
        description: 'A comfortable lifestyle means a clean home or good inn room, quality meals, and the ability to maintain gear and appearances without daily anxiety about coin.',
        bullets: [
            'Living quarters are private or semi-private, well-kept, and socially respectable.',
            'Food, clothing, and services are consistently good rather than merely adequate.',
            'The character has enough means to appear established and competent in most settlements.'
        ]
    },
    wealthy: {
        description: 'A wealthy lifestyle supports fine lodging, excellent meals, and access to influential spaces. The character lives with ease and visible signs of status.',
        bullets: [
            'Can maintain servants, tailored clothing, and premium accommodations.',
            'Has easier access to elite venues, contacts, and comforts.',
            'This lifestyle communicates rank, success, or strong patronage.'
        ]
    },
    aristocratic: {
        description: 'An aristocratic lifestyle reflects the highest level of luxury and prestige. The character is surrounded by servants, ceremony, expensive tastes, and the expectations that come with power.',
        bullets: [
            'Lives among estates, noble courts, or elite circles with significant attention to etiquette.',
            'Enjoys exceptional food, furnishings, fashion, and social access.',
            'This lifestyle carries obligations, reputation pressure, and political scrutiny as well as comfort.'
        ]
    }
};

export const LIFESTYLE_COSTS: Readonly<Record<string, LifestyleCostDetail>> = {
    wretched: { perDay: '—', perMonth: '—' },
    squalid: { perDay: '1 sp/day', perMonth: '3 gp/month' },
    poor: { perDay: '2 sp/day', perMonth: '6 gp/month' },
    modest: { perDay: '1 gp/day', perMonth: '30 gp/month' },
    comfortable: { perDay: '2 gp/day', perMonth: '60 gp/month' },
    wealthy: { perDay: '4 gp/day', perMonth: '120 gp/month' },
    aristocratic: { perDay: '10 gp/day (minimum)', perMonth: '300 gp/month (minimum)' }
};

export const DEITY_FAITH_DETAILS: Readonly<Record<string, FaithDrawerDetail>> = {
    ilmater: {
        description: 'Ilmater, the Crying God or Broken God, is a lawful good deity of endurance, suffering, martyrdom, and perseverance. His faith teaches compassion, mercy, and the duty to bear burdens so that others may suffer less.',
        lineItems: [
            { value: 'Lawful Good', label: 'Divine alignment' },
            { value: 'Portfolio', label: 'Endurance, suffering, martyrdom, perseverance' },
            { value: 'Life, Twilight', label: 'Associated domains' },
            { value: 'Hands bound with red cord', label: 'Holy symbol' }
        ],
        bullets: [
            'Ilmater is closely associated with compassion, patient endurance, and protection of the oppressed, injured, and poor.',
            'In Forgotten Realms history, he stood beside Tyr and Torm as part of the Triad, a powerful alliance of lawful good deities.',
            'His clergy are known for relieving suffering, ministering to the weak, and opposing cruelty, torture, and needless pain.'
        ]
    }
};

export const XP_THRESHOLDS: ReadonlyArray<[number, number]> = [
    [2, 300], [3, 900], [4, 2700], [5, 6500], [6, 14000],
    [7, 23000], [8, 34000], [9, 48000], [10, 64000],
    [11, 85000], [12, 100000], [13, 120000], [14, 140000],
    [15, 165000], [16, 195000], [17, 225000], [18, 265000],
    [19, 305000], [20, 355000]
];

export const SPECIES_LORE_DETAILS: Readonly<Record<string, SpeciesLoreDetail>> = {
    Aasimar: {
        history: 'Aasimar carry a trace of celestial heritage that often reveals itself through quiet omens, radiant presence, or a sense of destiny that follows them through life.',
        adulthood: 'Aasimar mature at about the same pace as humans, though many connect adulthood with the first clear sign of their divine calling.',
        lifespan: 'They often live somewhat longer than humans, with some reaching roughly 160 years.',
        height: 'Aasimar usually fall within ordinary human height ranges, though their posture and presence often feel striking or luminous.',
        weight: 'Their builds vary widely, but many appear balanced, healthy, and subtly touched by something otherworldly.',
        adulthoodAge: 18,
        elderAge: 90,
        bullets: [
            'Many aasimar feel caught between mortal life and a higher purpose.',
            'Their appearance may include faintly radiant eyes, unusual calm, or an unmistakable sense of grace.',
            'They are often remembered for presence as much as for physical features.'
        ]
    },
    Dragonborn: {
        history: 'Dragonborn trace their bloodlines to ancient dragons and often carry a strong sense of pride, honor, and lineage in how they present themselves to the world.',
        adulthood: 'Dragonborn grow quickly and are usually considered adults by around age 15.',
        lifespan: 'Most dragonborn live to around 80 years, giving them a shorter but intense sense of legacy.',
        height: 'Dragonborn are typically tall and imposing, often standing well over 6 feet with powerful, upright frames.',
        weight: 'They tend toward dense, muscular builds made heavier by strong bone structure, scales, and draconic features.',
        adulthoodAge: 15,
        elderAge: 50,
        bullets: [
            'Physical presence matters greatly in many dragonborn cultures.',
            'Coloration, horns, and scaled features often visually reflect ancestry and temperament.',
            'Their appearance usually reads as martial, proud, and difficult to ignore.'
        ]
    },
    Dwarf: {
        history: 'Dwarves are shaped by clan, craft, and endurance, with traditions rooted in stone halls, patient labor, and memory that stretches across generations.',
        adulthood: 'Dwarves are generally considered adults around age 50, after years of work, discipline, and family expectation.',
        lifespan: 'They often live 350 years or more, giving them a long relationship with ancestry, grudges, and legacy.',
        height: 'Dwarves are shorter than most humans, commonly between about 4 and 5 feet tall, with compact and formidable posture.',
        weight: 'They are famously broad, dense, and heavy for their height, with sturdy frames built for labor and battle.',
        adulthoodAge: 50,
        elderAge: 220,
        bullets: [
            'A dwarf often appears solid, grounded, and difficult to move either physically or emotionally.',
            'Beards, braids, jewelry, and clan marks frequently carry personal and family meaning.',
            'Their build suggests resilience more than speed.'
        ]
    },
    Elf: {
        history: 'Elves are ancient, fey-touched people tied to magic, artistry, and memory. Their cultures are often associated with old forests, refined learning, and a long view of history that makes human kingdoms feel brief by comparison.',
        adulthood: 'Elves reach physical maturity at roughly the same age as humans, but an elf is not usually regarded as a true adult until around age 100, when experience and identity are considered fully formed.',
        lifespan: 'Elves commonly live to around 750 years, giving them a very different sense of legacy, patience, grief, and long-term obligation than shorter-lived peoples.',
        height: 'Elves are typically slender and graceful, ranging from under 5 feet to over 6 feet tall depending on lineage and individual build.',
        weight: 'Elves usually have lighter, leaner frames than similarly tall humans, emphasizing balance, agility, and a narrow build over bulk.',
        adulthoodAge: 100,
        elderAge: 500,
        bullets: [
            'Elven culture often prizes artistry, memory, magic, and natural beauty.',
            'Their long lives can make them patient, reserved, nostalgic, or slow to fully trust quick-moving cultures.',
            'Many elven traditions balance personal freedom with deep continuity across centuries.'
        ]
    },
    Gnome: {
        history: 'Gnomes are curious, clever, and inventive folk whose communities often blend whimsy, practical skill, and an intense love of discovery.',
        adulthood: 'Gnomes mature more slowly than humans and are often considered adults around age 40.',
        lifespan: 'Many gnomes live from 350 to 500 years, allowing lifetimes of experimentation, craft, and accumulated stories.',
        height: 'Gnomes are small, usually around 3 to 4 feet tall, with lively expressions and compact frames.',
        weight: 'They are light compared with most humanoids, though their posture and energy can make them seem larger than they are.',
        adulthoodAge: 40,
        elderAge: 250,
        bullets: [
            'Gnomish appearance often reflects personality through bright clothes, tools, keepsakes, and expressive styling.',
            'They tend to look alert, quick, and intensely engaged with the world around them.',
            'Even older gnomes often carry a spark of restless curiosity.'
        ]
    },
    Goliath: {
        history: 'Goliaths come from harsh highland traditions shaped by endurance, competition, and the belief that strength should be matched by discipline and self-reliance.',
        adulthood: 'Goliaths mature at about the same pace as humans, with adulthood usually recognized in the later teenage years.',
        lifespan: 'They generally live less than a century, and many experience life as something to be met head-on rather than preserved gently.',
        height: 'Goliaths are notably tall and broad, often towering above other humanoids with long limbs and mountain-hardened frames.',
        weight: 'They are heavily built, with dense muscle and bone that make them feel as solid as the terrain they come from.',
        adulthoodAge: 18,
        elderAge: 60,
        bullets: [
            'Their physical silhouette often reads as athletic, weathered, and powerful.',
            'Scars, tattoos, and trophies can serve as records of competition or survival.',
            'A goliath presence usually suggests resilience before a word is spoken.'
        ]
    },
    Halfling: {
        history: 'Halflings are deeply rooted in home, hospitality, and quiet courage, often building lives around comfort, family, and community rather than grandeur.',
        adulthood: 'Halflings are usually considered adults around age 20.',
        lifespan: 'Many halflings live to around 150 years, giving them a relaxed but enduring view of life.',
        height: 'They are typically around 3 feet tall, with quick movements and easy, balanced posture.',
        weight: 'Halflings are generally light and compact, built for nimbleness rather than reach or raw size.',
        adulthoodAge: 20,
        elderAge: 100,
        bullets: [
            'Their appearance often feels approachable, grounded, and quietly confident.',
            'Good food, travel wear, and practical personal comforts often show up in halfling style.',
            'Small stature rarely translates to small presence.'
        ]
    },
    Human: {
        history: 'Humans are adaptable, ambitious, and astonishingly varied, building cultures everywhere from remote villages to sprawling cities and frontier outposts.',
        adulthood: 'Humans are generally considered adults in their late teens or early twenties.',
        lifespan: 'Most humans live less than a century, which often gives them urgency, drive, and a willingness to change quickly.',
        height: 'Human height varies enormously, from shorter compact builds to tall, long-limbed frames depending on lineage and region.',
        weight: 'Human weight is equally varied, with no single typical build beyond broad adaptability.',
        adulthoodAge: 18,
        elderAge: 60,
        bullets: [
            'Human appearance is defined more by culture and upbringing than by one common physical mold.',
            'They often show their identity through clothing, accents, posture, and personal ambition.',
            'Their versatility is as visible socially as it is physically.'
        ]
    },
    Orc: {
        history: 'Orcs are hardy wanderers and survivors, shaped by demanding environments and traditions that often prize directness, endurance, and decisive action.',
        adulthood: 'Orcs mature quickly and are often recognized as adults in the early teenage years.',
        lifespan: 'They tend to live shorter lives than humans, often seldom reaching far beyond 50 years.',
        height: 'Orcs are usually tall, broad-shouldered, and physically commanding, with a natural look of strength and motion.',
        weight: 'Their builds tend toward heavy muscle and durable frames suited to hard travel and conflict.',
        adulthoodAge: 12,
        elderAge: 35,
        bullets: [
            'An orc often gives the impression of momentum, force, and durability.',
            'Tusks, scars, and weathered gear frequently become part of their visual identity.',
            'Their appearance commonly reflects life lived close to hardship and action.'
        ]
    },
    Tiefling: {
        history: 'Tieflings bear the visible or spiritual marks of fiendish legacy, often living at the intersection of fascination, suspicion, and personal reinvention.',
        adulthood: 'Tieflings generally mature at about the same pace as humans.',
        lifespan: 'Many live slightly longer than humans, though their lives are often shaped more by social pressure than by age alone.',
        height: 'Tieflings usually share human-like height ranges, though horns, tails, and striking features can make their silhouettes memorable.',
        weight: 'Their builds vary like those of humans, with infernal traits adding more distinctiveness than mass.',
        adulthoodAge: 18,
        elderAge: 70,
        bullets: [
            'Their appearance can range from subtly uncanny to unmistakably infernal.',
            'Horns, tails, unusual skin tones, and luminous eyes often define first impressions.',
            'Many tieflings shape their look intentionally as an act of control over how they are seen.'
        ]
    },
    Tabaxi: {
        history: 'Tabaxi are wandering, story-hungry travelers whose lives are often shaped by curiosity, movement, and a deep appetite for novelty.',
        adulthood: 'Tabaxi mature at about the same rate as humans, reaching adulthood in the later teenage years.',
        lifespan: 'They tend to live human-length lives, though their outlook often favors experience over permanence.',
        height: 'Tabaxi are typically human-sized or a bit taller, with long-limbed, feline frames built for balance and speed.',
        weight: 'They usually look lean and spring-loaded rather than bulky, with movement that feels graceful and precise.',
        adulthoodAge: 18,
        elderAge: 60,
        bullets: [
            'Patterning, fur color, ears, tail, and eye shape make tabaxi visually distinctive at a glance.',
            'They often seem poised to move even while standing still.',
            'A tabaxi silhouette usually communicates agility before strength.'
        ]
    },
    Shifter: {
        history: 'Shifters carry bestial heritage that surfaces in instinct, appearance, and bursts of heightened ferocity, often leaving them between worlds rather than fully at home in one.',
        adulthood: 'Shifters mature at about the same pace as humans, though many become socially independent early.',
        lifespan: 'They tend to live slightly shorter lives than humans on average, though this varies by community and lifestyle.',
        height: 'Shifters usually fall within human height ranges, though posture, movement, and features often suggest an animal edge.',
        weight: 'Their builds are commonly wiry, athletic, and ready for sudden motion rather than ornamental stillness.',
        adulthoodAge: 18,
        elderAge: 60,
        bullets: [
            'Hair, eyes, canines, and body language often carry subtle animal markers even before shifting.',
            'They frequently look like they are holding energy just under the surface.',
            'Different shifter lineages can skew more lithe, rugged, or predatory in appearance.'
        ]
    },
    Goblin: {
        history: 'Goblins are quick, adaptable survivors whose communities often value cunning, speed, and practical advantage over comfort or permanence.',
        adulthood: 'Goblins grow up fast and are often considered adults by about age 8.',
        lifespan: 'They rarely live especially long lives, often topping out around 60 years.',
        height: 'Goblins are short, usually between about 3 and 4 feet tall, with sharp features and restless body language.',
        weight: 'They are usually wiry and light, built for squeezing through danger and escaping it just as fast.',
        adulthoodAge: 8,
        elderAge: 40,
        bullets: [
            'A goblin often looks alert, crafty, and halfway ready to bolt or pounce.',
            'Their presence tends to emphasize speed, expression, and improvisation over size.',
            'Gear and clothing frequently look practical, scavenged, or cleverly repurposed.'
        ]
    },
    'Shadar-Kai': {
        history: 'Shadar-kai are shadow-touched elves shaped by loss, duty, and the austere influence of the Raven Queen, often carrying an air of intensity or distance.',
        adulthood: 'Like other elves, shadar-kai mature physically at a human pace but are not usually regarded as fully adult until around age 100.',
        lifespan: 'They share the long elven lifespan, often living for many centuries.',
        height: 'Shadar-kai are usually slender and graceful like other elves, though their bearing often feels more severe or haunted.',
        weight: 'They tend toward lean, light frames, with a visual emphasis on precision and endurance rather than softness.',
        adulthoodAge: 100,
        elderAge: 500,
        bullets: [
            'Their appearance often carries dark elegance, restraint, and signs of shadowed heritage.',
            'Muted colors, stark features, and ritual scars or adornments are common visual cues.',
            'They often seem emotionally contained even when physically still.'
        ]
    },
    Minotaur: {
        history: 'Minotaurs are physically formidable folk often associated with strength, momentum, and proud personal presence, whether in war, travel, or public life.',
        adulthood: 'Minotaurs mature at roughly the same pace as humans, reaching adulthood in the later teenage years.',
        lifespan: 'They often live human-length lives, though their cultures may place greater emphasis on deeds than longevity.',
        height: 'Minotaurs are typically very tall and broad, with powerful shoulders, thick necks, and unmistakable horned silhouettes.',
        weight: 'They are heavy, muscular, and massively built, with weight that reflects raw physical force and stability.',
        adulthoodAge: 17,
        elderAge: 55,
        bullets: [
            'A minotaur usually reads as imposing even in relaxed posture.',
            'Horns, stance, and sheer physical width define much of their visual identity.',
            'Their appearance often suggests impact, confidence, and presence in close quarters.'
        ]
    },
    'Half-Elf': {
        history: 'Half-elves often grow up balancing different cultural worlds, carrying both human adaptability and an elven sense of memory, grace, or distance.',
        adulthood: 'Half-elves mature at about the same pace as humans, though their mixed heritage can shape how adulthood is recognized socially.',
        lifespan: 'They often live considerably longer than humans, with many reaching around 180 years.',
        height: 'Half-elves usually stand within human height ranges, often with a graceful carriage or fine-featured look that hints at elven ancestry.',
        weight: 'Their build varies widely, but many appear balanced and lightly athletic rather than especially heavy.',
        adulthoodAge: 20,
        elderAge: 120,
        bullets: [
            'Their appearance often blends familiar humanity with a subtly uncanny refinement.',
            'Many half-elves look adaptable in social spaces because they literally move between worlds.',
            'Their features can read as elegant without being fragile.'
        ]
    },
    'Half-Orc': {
        history: 'Half-orcs often grow up negotiating strength, identity, and expectation, carrying both the resilience of orcish blood and the flexibility to move between different communities.',
        adulthood: 'Half-orcs mature a little faster than humans and are often considered adults in the mid-teens.',
        lifespan: 'They rarely live as long as humans, often reaching around 75 years at most.',
        height: 'Half-orcs are usually taller and broader than most humans, with an unmistakably powerful physical presence.',
        weight: 'They tend to be heavy-boned and muscular, built for impact and endurance.',
        adulthoodAge: 14,
        elderAge: 45,
        bullets: [
            'Strength, scars, and force of personality often shape a half-orc first impression.',
            'Their appearance can range from rough and intimidating to calm and imposing.',
            'Many carry visible signs of hard-earned resilience.'
        ]
    }
};