export interface ExtrasCatalogEntry {
    name: string;
    type: string;
    monsterStatBlockName?: string;
    vehicleStatBlock?: VehicleStatBlock;
    subtype?: string;
    source?: string;
    sourceUrl?: string;
    summary?: string;
    notes?: string;
    detailLines?: string[];
    cr?: string;
    size?: string;
}

export interface VehicleStatBlockAbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface VehicleStatBlockFact {
    label: string;
    value: string;
}

export interface VehicleStatBlockSection {
    heading: string;
    paragraphs?: string[];
    facts?: VehicleStatBlockFact[];
}

export interface VehicleStatBlock {
    subtitle: string;
    travelPace?: string;
    creatureCapacity?: string;
    cargoCapacity?: string;
    abilityScores?: VehicleStatBlockAbilityScores;
    damageImmunities?: string;
    conditionImmunities?: string;
    sections: VehicleStatBlockSection[];
}

export const extrasCatalogEntries: ReadonlyArray<ExtrasCatalogEntry> = [
    // ── Battle Smith Defender ───────────────────────────────────────────────
    {
        name: 'Steel Defender',
        type: 'Battle Smith Defender',
        subtype: 'Construct (Artificer)',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/steel-defender',
        cr: 'N/A',
        size: 'Medium',
        summary: 'A mechanical construct created by a Battle Smith Artificer to serve as a loyal protector.',
        notes: 'The Steel Defender is a magical construct you create. It has HP equal to five times your Artificer level + your Intelligence modifier. It uses your proficiency bonus for attack rolls and saving throws.',
        detailLines: [
            'Acts on its own turn and can use Deflect Attack reaction to impose disadvantage on an attack.',
            'Can be repaired using a spell slot or by being repaired during a short rest.',
            'Disappears if you die or if you create a new one.'
        ]
    },

    // ── Beast Companion (2014) ──────────────────────────────────────────────
    {
        name: 'Ranger Beast Companion (2014)',
        type: 'Beast Companion (2014)',
        subtype: 'Beast (Ranger – 2014)',
        source: "Player's Handbook 2014",
        sourceUrl: 'https://www.dndbeyond.com/classes/ranger',
        cr: 'N/A',
        summary: 'A beast bonded to a Beast Master Ranger as a loyal companion.',
        notes: 'The beast companion must be CR 1/4 or lower at ranger level 3, scaling over time. It acts on your turn and gains bonus HP and proficiency bonuses.',
        detailLines: [
            'Must be a beast with CR 1/4 or lower (CR 1/2 at level 7, CR 1 at level 11).',
            'Gains HP equal to your ranger HP when you take a long rest.',
            'Uses Multiattack at level 11 (two attacks per turn).',
            'Cannot use reactions, bonus actions, or legendary actions.'
        ]
    },
    {
        name: 'Primal Companion – Beast of the Land',
        type: 'Beast Companion (2014)',
        subtype: 'Beast (Ranger – Optional)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/ranger',
        cr: 'N/A',
        size: 'Medium',
        summary: 'A primal beast of the land bonded to a Ranger via the Primal Companion optional feature.',
        notes: 'Stat block scales with ranger level. Acts on its own initiative.',
        detailLines: [
            'Higher HP and stats than standard beast companion.',
            'Can move and take actions freely on its turn.',
            'Maul: two attacks on same or different targets.'
        ]
    },
    {
        name: 'Primal Companion – Beast of the Sea',
        type: 'Beast Companion (2014)',
        subtype: 'Beast (Ranger – Optional)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/ranger',
        cr: 'N/A',
        size: 'Medium',
        summary: 'A primal aquatic beast bonded to a Ranger via the Primal Companion optional feature.',
        notes: 'Amphibious, swimming speed 30 ft. Can restrain creatures on a hit.',
        detailLines: [
            'Amphibious and has swim speed 30 ft.',
            'Binding Strike: target is restrained until the start of your next turn.',
            'Scales with ranger level.'
        ]
    },
    {
        name: 'Primal Companion – Beast of the Sky',
        type: 'Beast Companion (2014)',
        subtype: 'Beast (Ranger – Optional)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/ranger',
        cr: 'N/A',
        size: 'Small',
        summary: 'A primal flying beast bonded to a Ranger via the Primal Companion optional feature.',
        notes: 'Flying speed 60 ft. Can distract enemies to give your attacks advantage.',
        detailLines: [
            'Flying speed 60 ft.',
            'Disrupting Strike: your attacks against the same target have advantage.',
            'Scales with ranger level.'
        ]
    },

    // ── Familiar ────────────────────────────────────────────────────────────
    {
        name: 'Bat',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/bat',
        cr: '0', size: 'Tiny',
        summary: 'A bat familiar for casters using Find Familiar.',
        notes: 'Echolocation, blindsight 60 ft. Keen Hearing advantage on Perception checks.',
        detailLines: ['Echolocation (can\'t use blindsight while deafened).', 'Keen Hearing.']
    },
    {
        name: 'Cat',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/cat',
        cr: '0', size: 'Tiny',
        summary: 'A cat familiar for casters using Find Familiar.',
        notes: 'Keen Smell and Keen Hearing. Can take the Help action.',
        detailLines: ['Keen Hearing and Smell.']
    },
    {
        name: 'Crab',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/crab',
        cr: '0', size: 'Tiny',
        summary: 'A crab familiar. Amphibious.',
        detailLines: ['Amphibious.', 'Blindsight 30 ft.']
    },
    {
        name: 'Frog',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/frog',
        cr: '0', size: 'Tiny',
        summary: 'A frog familiar. Amphibious.',
        detailLines: ['Amphibious.', 'Standing Leap: can leap 10 ft. long, 5 ft. high.']
    },
    {
        name: 'Hawk',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/hawk',
        cr: '0', size: 'Tiny',
        summary: 'A hawk familiar with Keen Eyesight.',
        detailLines: ['Keen Sight: advantage on Perception (sight).', 'Flyby: no opportunity attacks when flying away.']
    },
    {
        name: 'Lizard',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/lizard',
        cr: '0', size: 'Tiny',
        summary: 'A small lizard familiar.',
        detailLines: ['Darkvision 30 ft.']
    },
    {
        name: 'Octopus',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/octopus',
        cr: '0', size: 'Tiny',
        summary: 'An octopus familiar. Can breathe water and use Ink Cloud.',
        detailLines: ['Hold Breath 30 min.', 'Ink Cloud (1/day): heavily obscured cloud.', 'Underwater Camouflage: advantage on Stealth while submerged.']
    },
    {
        name: 'Owl',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/owl',
        cr: '0', size: 'Tiny',
        summary: 'An owl familiar. Flyby and silent flight.',
        detailLines: ['Flyby: no opportunity attacks when flying away.', 'Keen Hearing and Sight.', 'Silent wings — no noise penalty to Stealth.']
    },
    {
        name: 'Poisonous Snake',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/poisonous-snake',
        cr: '1/8', size: 'Tiny',
        summary: 'A poisonous snake familiar. Deals poison on a bite.',
        detailLines: ['Bite: 1 piercing + 3 (1d6) poison damage on failed DC 10 CON save.', 'Blindsight 10 ft.']
    },
    {
        name: 'Quipper (Fish)',
        type: 'Familiar',
        monsterStatBlockName: 'Quipper',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/quipper',
        cr: '0', size: 'Tiny',
        summary: 'A fierce little fish familiar. Blood Frenzy.',
        detailLines: ['Blood Frenzy: advantage on attacks against bloodied (below half HP) creatures.', 'Waterbreathing only.']
    },
    {
        name: 'Rat',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/rat',
        cr: '0', size: 'Tiny',
        summary: 'A rat familiar with Keen Smell.',
        detailLines: ['Keen Smell.']
    },
    {
        name: 'Raven',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/raven',
        cr: '0', size: 'Tiny',
        summary: 'A raven familiar that can mimic sounds and speech.',
        detailLines: ['Mimicry: can mimic simple sounds and voices.']
    },
    {
        name: 'Sea Horse',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/sea-horse',
        cr: '0', size: 'Tiny',
        summary: 'A sea horse familiar. Water-only movement.',
        detailLines: ['Underwater only. Swim speed 20 ft.', 'Water Breathing.']
    },
    {
        name: 'Spider',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/spider',
        cr: '0', size: 'Tiny',
        summary: 'A spider familiar. Can climb walls and ceilings.',
        detailLines: ['Spider Climb: climb any surface including ceilings.', 'Web Sense and Web Walker.']
    },
    {
        name: 'Weasel',
        type: 'Familiar',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/weasel',
        cr: '0', size: 'Tiny',
        summary: 'A weasel familiar with Keen Senses.',
        detailLines: ['Keen Hearing and Smell.']
    },
    {
        name: 'Imp',
        type: 'Familiar',
        subtype: 'Tiny Fiend (Devil)',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/imp',
        cr: '1', size: 'Tiny',
        summary: 'An imp familiar for warlocks. Can turn invisible and sting for poison.',
        notes: 'Available via Pact of the Chain. More powerful than standard familiars.',
        detailLines: ['Shapechanger: can turn into a rat, raven, or spider.', 'Invisibility at will.', 'Sting: 1d4+3 piercing + 3d6 poison.', 'Devil\'s Sight: can see in magical darkness.']
    },
    {
        name: 'Pseudodragon',
        type: 'Familiar',
        subtype: 'Tiny Dragon',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/pseudodragon',
        cr: '1/4', size: 'Tiny',
        summary: 'A pseudodragon familiar. Has Keen Senses and magic resistance.',
        notes: 'Available via Pact of the Chain. One of the best scout familiars.',
        detailLines: ['Keen Senses: advantage on all Perception checks.', 'Magic Resistance: advantage on saves vs. spells.', 'Sting: 1d4+2 piercing + sleep poison.', 'Telepathic Bond: telepathy 100 ft.']
    },
    {
        name: 'Quasit',
        type: 'Familiar',
        subtype: 'Tiny Fiend (Demon)',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/quasit',
        cr: '1', size: 'Tiny',
        summary: 'A quasit familiar for warlocks. Shapeshifter and poisonous.',
        notes: 'Available via Pact of the Chain.',
        detailLines: ['Shapeshifter: can transform into a bat, centipede, or toad.', 'Scare once per day.', 'Claw: 1d4+3 piercing + poison (DC 10 Con or frightened).', 'Invisibility at will.']
    },
    {
        name: 'Sprite',
        type: 'Familiar',
        subtype: 'Tiny Fey',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/sprite',
        cr: '1/4', size: 'Tiny',
        summary: 'A sprite familiar. Can turn invisible and read hearts.',
        notes: 'Available via Pact of the Chain.',
        detailLines: ['Heart Sight: perceive creature\'s emotional state and alignment.', 'Invisibility at will.', 'Shortbow: poisoned target falls unconscious for 1 minute.']
    },

    // ── Infusion ────────────────────────────────────────────────────────────
    {
        name: 'Homunculus Servant',
        type: 'Infusion',
        monsterStatBlockName: 'Homunculus',
        subtype: 'Tiny Construct',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/homunculus-servant',
        cr: 'N/A', size: 'Tiny',
        summary: 'An Artificer infusion that creates a tiny construct familiar.',
        notes: 'The homunculus serves and obeys you; it can deliver touch-range spells on your behalf.',
        detailLines: [
            'Evasion: no damage on successful DEX save, half on failed.',
            'Channel Magic: can deliver touch spells as your action if it takes the Magic action.',
            'HP = 1 + your INT modifier + your artificer level.',
            'Only one can exist at a time.'
        ]
    },

    // ── Sidekick ────────────────────────────────────────────────────────────
    {
        name: 'Expert Sidekick',
        type: 'Sidekick',
        subtype: 'Any Creature (Expert)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/expert-sidekick',
        cr: 'N/A',
        summary: 'A skilled NPC companion specializing in skills, tools, and cleverness.',
        detailLines: ['Bonus proficiencies in chosen skills and tools.', 'Helpful: can use Help as a bonus action.', 'Evasion at higher levels.']
    },
    {
        name: 'Spellcaster Sidekick',
        type: 'Sidekick',
        subtype: 'Any Creature (Spellcaster)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/spellcaster-sidekick',
        cr: 'N/A',
        summary: 'An NPC companion who learns spells and supports the party with magic.',
        detailLines: ['Spellcasting: learns cleric, druid, or wizard spells.', 'Spellcasting Focus: can use a focus.', 'Abilities scale with levels.']
    },
    {
        name: 'Warrior Sidekick',
        type: 'Sidekick',
        subtype: 'Any Creature (Warrior)',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/classes/warrior-sidekick',
        cr: 'N/A',
        summary: 'A martial NPC companion that fights alongside adventurers.',
        detailLines: ['Martial Role: gains attack, extra attacks, fighting style.', 'Second Wind and Action Surge at higher levels.', 'Critical Hits deal extra damage dice.']
    },

    // ── Mount ───────────────────────────────────────────────────────────────
    {
        name: 'Warhorse',
        type: 'Mount',
        monsterStatBlockName: 'Warhorse',
        subtype: 'Large Beast · CR 1/2',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/warhorse',
        cr: '1/2', size: 'Large',
        summary: 'A battle-trained warhorse mount. Can attack while being ridden.',
        detailLines: ['Hooves attack: 2d6+4 bludgeoning.', 'Can be trained to fight in battle alongside rider.']
    },
    {
        name: 'Horse',
        type: 'Mount',
        monsterStatBlockName: 'Riding Horse',
        subtype: 'Large Beast · CR 1/4',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/riding-horse',
        cr: '1/4', size: 'Large',
        summary: 'A riding horse for travel. Speed 60 ft.',
        detailLines: ['Speed: 60 ft.', 'Hooves: 2d4+4 bludgeoning.']
    },
    {
        name: 'Camel',
        type: 'Mount',
        monsterStatBlockName: 'Camel',
        subtype: 'Large Beast · CR 1/8',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/camel',
        cr: '1/8', size: 'Large',
        summary: 'A desert mount well-suited to long journeys without water.',
        detailLines: ['Speed: 50 ft.', 'Bite attack.']
    },
    {
        name: 'Mastiff',
        type: 'Mount',
        monsterStatBlockName: 'Mastiff',
        subtype: 'Medium Beast · CR 1/8',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/mastiff',
        cr: '1/8', size: 'Medium',
        summary: 'A loyal dog mount. Keen Hearing and Smell.',
        detailLines: ['Keen Hearing and Smell: advantage on Perception.', 'Bite: DC 11 STR or target knocked prone.']
    },
    {
        name: 'Pony',
        type: 'Mount',
        monsterStatBlockName: 'Pony',
        subtype: 'Medium Beast · CR 1/8',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/pony',
        cr: '1/8', size: 'Medium',
        summary: 'A small mount appropriate for light characters.',
        detailLines: ['Speed: 40 ft.']
    },
    {
        name: 'Elephant',
        type: 'Mount',
        monsterStatBlockName: 'Elephant',
        subtype: 'Huge Beast · CR 4',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/elephant',
        cr: '4', size: 'Huge',
        summary: 'A massive elephant mount with a powerful Trampling Charge.',
        detailLines: ['Trampling Charge: if it moves 20 ft. towards a target, it can knock prone.', 'Gore and Stomp attacks.']
    },
    {
        name: 'Giant Eagle',
        type: 'Mount',
        monsterStatBlockName: 'Giant Eagle',
        subtype: 'Large Beast · CR 1',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/giant-eagle',
        cr: '1', size: 'Large',
        summary: 'A flying eagle mount. Speed 80 ft. flying.',
        detailLines: ['Flying speed 80 ft.', 'Keen Sight.', 'Can carry a Medium or smaller rider.']
    },
    {
        name: 'Pegasus',
        type: 'Mount',
        monsterStatBlockName: 'Pegasus',
        subtype: 'Large Celestial · CR 2',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/pegasus',
        cr: '2', size: 'Large',
        summary: 'A magnificent flying horse. Flying speed 90 ft.',
        detailLines: ['Fly speed 90 ft.', 'Hooves: 2d6+3 bludgeoning.', 'Immunity to disease.']
    },
    {
        name: 'Hippogriff',
        type: 'Mount',
        monsterStatBlockName: 'Hippogriff',
        subtype: 'Large Monstrosity · CR 1',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/hippogriff',
        cr: '1', size: 'Large',
        summary: 'A half-eagle, half-horse flying mount.',
        detailLines: ['Fly speed 60 ft.', 'Keen Sight.', 'Claws and beak attacks.']
    },
    {
        name: 'Griffon',
        type: 'Mount',
        monsterStatBlockName: 'Griffon',
        subtype: 'Large Monstrosity · CR 2',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/griffon',
        cr: '2', size: 'Large',
        summary: 'A powerful griffon mount used by elite cavalry.',
        detailLines: ['Fly speed 80 ft.', 'Keensight Advantage on Perception.', 'Multiattack: beak and claw.']
    },

    // ── Pet ──────────────────────────────────────────────────────────────────
    {
        name: 'Dog',
        type: 'Pet',
        monsterStatBlockName: 'Mastiff',
        subtype: 'Small–Medium Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/mastiff',
        cr: '1/8', size: 'Medium',
        summary: 'A loyal dog. Not a full combat companion but can bark and alert.',
        detailLines: ['Keen Hearing and Smell.', 'Non-combat role primarily.']
    },
    {
        name: 'Cat',
        type: 'Pet',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/cat',
        cr: '0', size: 'Tiny',
        summary: 'A pet cat. Good for scouting tight spaces and morale.',
        detailLines: ['Keen Hearing and Smell.', 'Darkvision 30 ft.']
    },
    {
        name: 'Parrot',
        type: 'Pet',
        monsterStatBlockName: 'Raven',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/parrot',
        cr: '0', size: 'Tiny',
        summary: 'A parrot that can mimic simple sounds.',
        detailLines: ['Mimicry: can mimic sounds it has heard. DC 14 Insight to distinguish.']
    },
    {
        name: 'Raven',
        type: 'Pet',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/raven',
        cr: '0', size: 'Tiny',
        summary: 'An intelligent raven pet that can mimic words.',
        detailLines: ['Mimicry: can mimic simple sounds and speech.']
    },
    {
        name: 'Toad',
        type: 'Pet',
        monsterStatBlockName: 'Frog',
        subtype: 'Tiny Beast',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/toad',
        cr: '0', size: 'Tiny',
        summary: 'A harmless toad pet. Amphibious.',
        detailLines: ['Amphibious.']
    },

    // ── Summoned ─────────────────────────────────────────────────────────────
    {
        name: 'Summon Undead Spirit',
        type: 'Summoned',
        subtype: 'Undead Spirit',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/summon-undead',
        cr: 'N/A',
        summary: 'An undead spirit summoned by the Summon Undead spell.',
        detailLines: ['Ghostly, Putrid, or Skeletal form.', 'HP and attack scale with spell level.', 'Can use Deathly Touch or Grave Bolt.']
    },
    {
        name: 'Summon Fey Spirit',
        type: 'Summoned',
        subtype: 'Fey Spirit',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/summon-fey',
        cr: 'N/A',
        summary: 'A fey spirit summoned by the Summon Fey spell.',
        detailLines: ['Fuming, Mirthful, or Tricksy form.', 'HP scales with spell level.', 'Fey Step: teleport up to 30 ft. as a bonus action.']
    },
    {
        name: 'Summon Construct Spirit',
        type: 'Summoned',
        subtype: 'Construct Spirit',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/summon-construct',
        cr: 'N/A',
        summary: 'A construct spirit summoned by the Summon Construct spell.',
        detailLines: ['Clay, Metal, or Stone form.', 'HP and AC scale with spell level.', 'Bludgeoning slam attack.']
    },
    {
        name: 'Summon Beast Spirit',
        type: 'Summoned',
        subtype: 'Beast Spirit',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/summon-beast',
        cr: 'N/A',
        summary: 'A beast spirit summoned by the Summon Beast spell.',
        detailLines: ['Air, Land, or Water form.', 'HP scales with spell level.', 'Flyby form gives advantage on attack from afar.']
    },
    {
        name: 'Summon Elemental Spirit',
        type: 'Summoned',
        subtype: 'Elemental Spirit',
        source: "Tasha's Cauldron of Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/summon-elemental',
        cr: 'N/A',
        summary: 'An elemental spirit summoned by the Summon Elemental spell.',
        detailLines: ['Air, Earth, Fire, or Water form.', 'Elemental damage and resistances.', 'Scales with spell level.']
    },
    {
        name: 'Find Steed',
        type: 'Summoned',
        monsterStatBlockName: 'Warhorse',
        subtype: 'Celestial, Fey, or Fiend Mount',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/spells/find-steed',
        cr: 'N/A',
        summary: 'A magical steed called by the Find Steed paladin spell.',
        detailLines: ['Appears as a warhorse, pony, camel, elk, or mastiff.', 'Shares spell slots with paladin.', 'If slain, can be re-summoned with another casting.']
    },
    {
        name: 'Find Greater Steed',
        type: 'Summoned',
        monsterStatBlockName: 'Pegasus',
        subtype: 'Magical Mount',
        source: "Xanathar's Guide to Everything",
        sourceUrl: 'https://www.dndbeyond.com/spells/find-greater-steed',
        cr: 'N/A',
        summary: 'A greater magical steed: griffon, pegasus, peryton, dire wolf, rhinoceros, or saber-toothed tiger.',
        detailLines: ['Higher CR options available.', 'Can communicate telepathically.', 'Shares spell slots with the summoner.']
    },
    {
        name: 'Unseen Servant',
        type: 'Summoned',
        subtype: 'Force Construct',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/spells/unseen-servant',
        cr: 'N/A',
        summary: 'An invisible mindless force servant created by the Unseen Servant spell.',
        detailLines: ['Invisible, no stats of its own.', 'Can perform simple tasks (carry, clean, fetch).', 'Lasts 1 hour.']
    },

    // ── Misc ─────────────────────────────────────────────────────────────────
    {
        name: 'Shield Guardian',
        type: 'Misc',
        subtype: 'Large Construct',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/shield-guardian',
        cr: '7', size: 'Large',
        summary: 'A bound construct protector that can store and cast a spell.',
        detailLines: ['Bound: defender returns to the amulet holder if dismissed.', 'Spell Storing: can hold one spell for the holder.', 'Shield: reaction to take the damage a nearby master takes.']
    },
    {
        name: 'Awakened Tree',
        type: 'Misc',
        subtype: 'Huge Plant',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/awakened-tree',
        cr: '2', size: 'Huge',
        summary: 'A tree given sentience and loyal service via the Awaken spell.',
        detailLines: ['False Appearance: looks like an ordinary tree while motionless.', 'Slam: 3d6+4 bludgeoning.']
    },
    {
        name: 'Iron Golem',
        type: 'Misc',
        subtype: 'Large Construct',
        source: "Player's Handbook",
        sourceUrl: 'https://www.dndbeyond.com/monsters/iron-golem',
        cr: '16', size: 'Large',
        summary: 'A powerful iron construct guardian.',
        detailLines: ['Immutable Form: immune to any spell that would alter its form.', 'Poison Breath.', 'Multiattack: two Slam attacks.']
    },

    // ── Vehicle (Object) ────────────────────────────────────────────────────
    {
        name: 'Galley',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A large oar-and-sail driven warship with full crew and weapons.',
        notes: 'Speed 4 mph (rowing) or up to 8 mph (sailing). Can carry approximately 150 crew and passengers. Equipped with ballistas and mangonels.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (130 ft. by 20 ft.)',
            travelPace: '4 miles per hour (96 miles per day)',
            creatureCapacity: '80 crew, 40 passengers',
            cargoCapacity: '150 tons',
            abilityScores: {
                strength: 24,
                dexterity: 4,
                constitution: 20,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the galley can take 3 actions, choosing from the options below. It can take only 2 actions if it has fewer than forty crew and only 1 action if it has fewer than twenty. It can't take these actions if it has fewer than three crew.",
                        'Fire Ballistas. The galley can fire its ballistas (DMG, ch. 8).',
                        'Fire Mangonels. The galley can fire its mangonels (DMG, ch. 8).',
                        'Move. The galley can use its helm to move with its oars or sails. As part of this move, it can use its naval ram.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '500 (damage threshold 20)' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '16' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of one of the ship's movement components, with one 90-degree turn. If the helm is destroyed, the galley can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Oars',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -5 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '30 ft. (requires at least 40 crew)' }
                    ]
                },
                {
                    heading: 'Movement: Sails',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -10 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '35 ft.; 15 ft. while sailing into the wind; 50 ft. while sailing with the wind' }
                    ]
                },
                {
                    heading: 'Weapon: Ballista (4)',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '50 each' }
                    ],
                    paragraphs: ['Ranged Weapon Attack: +6 to hit, range 120/480 ft., one target. Hit: 16 (3d10) piercing damage.']
                },
                {
                    heading: 'Weapon: Mangonel (2)',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '100 each' }
                    ],
                    paragraphs: ["Ranged Weapon Attack: +5 to hit, range 200/800 ft. (can't hit targets within 60 ft. of it), one target. Hit: 27 (5d10) bludgeoning damage."]
                },
                {
                    heading: 'Weapon: Naval Ram',
                    facts: [
                        { label: 'Armor Class', value: '20' },
                        { label: 'Hit Points', value: '100 (damage threshold 10)' }
                    ],
                    paragraphs: [
                        'The galley has advantage on all saving throws relating to crashing when it crashes into a creature or an object. Any damage it takes from the crash is applied to the naval ram rather than to the ship. These benefits do not apply if another vessel crashes into the galley.'
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 500. AC 15. Damage Threshold 20.',
            'Speed: 4 mph (rowing), 8 mph (sailing).',
            'Crew: 80 required, 40 minimum.',
            '2 × Ballista (frontside) + 2 × Mangonels.'
        ]
    },
    {
        name: 'Keelboat',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A versatile sailing vessel well-suited for river and coastal travel.',
        notes: 'Speed 1 mph (rowing) or up to 3 mph (sailing). Typically used for cargo.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (60 ft. by 20 ft.)',
            travelPace: '3 miles per hour (72 miles per day)',
            creatureCapacity: '3 crew, 4 passengers',
            cargoCapacity: '1000 lb.',
            abilityScores: {
                strength: 16,
                dexterity: 7,
                constitution: 13,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the keelboat can take 2 actions, choosing from the options below. It can take only 1 action if it has only one crew. It can't take these actions if it has no crew.",
                        'Fire Ballistas. The keelboat can fire its ballistas (DMG, ch. 8).',
                        'Move. The keelboat can use its helm to move with its oars or sails.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '100 (damage threshold 10)' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of one of the ship's movement components, with one 90-degree turn. If the helm is destroyed, the keelboat can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Oars',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -5 ft. speed per 20 damage taken' },
                        { label: 'Speed (Water)', value: '20 ft.' }
                    ]
                },
                {
                    heading: 'Movement: Sails',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '50; -5 ft. speed per 20 damage taken' },
                        { label: 'Speed (Water)', value: '25 ft.; 15 ft. while sailing into the wind; 35 ft. while sailing with the wind' }
                    ]
                },
                {
                    heading: 'Weapon: Ballista',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '50' }
                    ],
                    paragraphs: [
                        'Ranged Weapon Attack: +6 to hit, range 120/480 ft., one target. Hit: 16 (3d10) piercing damage.',
                        'Keelboats typically include a ballista (DMG, ch. 8) only when they are equipped for combat.'
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 100. AC 15. Damage Threshold 10.',
            'Speed: 1 mph (rowing), 3 mph (sailing).',
            'Crew: 3 required, 1 minimum.',
            'Cargo: 0.5 tons.'
        ]
    },
    {
        name: 'Longship',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A fast Viking-style raiding ship powered by both oars and sail.',
        notes: 'Speed 3 mph (rowing) or up to 7 mph (sailing). Used for raiding and coastal assault.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (70 ft. by 20 ft.)',
            travelPace: '5 miles per hour (120 miles per day)',
            creatureCapacity: '40 crew, 100 passengers',
            cargoCapacity: '10 tons',
            abilityScores: {
                strength: 20,
                dexterity: 6,
                constitution: 17,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the longship can take the move action below. It can't take this action if it has no crew.",
                        'Move. The longship can use its helm to move with its oars or sails.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '300 (damage threshold 15)' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '16' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of one of the ship's movement components, with one 90-degree turn. If the helm is destroyed, the longship can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Oars',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -5 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '20 ft. (requires at least 20 crew)' }
                    ]
                },
                {
                    heading: 'Movement: Sails',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -10 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '45 ft.; 15 ft. while sailing into the wind; 60 ft. while sailing with the wind' }
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 300. AC 15. Damage Threshold 15.',
            'Speed: 3 mph (rowing), 7 mph (sailing).',
            'Crew: 40 required, 20 minimum.',
            '2 × Ballistas.'
        ]
    },
    {
        name: 'Rowboat',
        type: 'Vehicle',
        subtype: 'Large Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A small wooden rowboat ideal for rivers and short coastal trips.',
        notes: 'Speed 1.5 mph (rowing). Carries up to 3 passengers without oarsmen.',
        vehicleStatBlock: {
            subtitle: 'Large Vehicle (10 ft. by 5 ft.)',
            travelPace: '3 miles per hour (24 miles per day)',
            creatureCapacity: '2 crew, 2 passengers',
            cargoCapacity: '500 lb.',
            abilityScores: {
                strength: 11,
                dexterity: 8,
                constitution: 11,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the rowboat can take the move action below. It can't take this action if it has no crew.",
                        'Move. The rowboat can move using its oars.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '11' },
                        { label: 'Hit Points', value: '50' }
                    ]
                },
                {
                    heading: 'Control and Movement: Oars',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '25' },
                        { label: 'Speed (Water)', value: '15 ft.' }
                    ],
                    paragraphs: [
                        "Move up to the ship's speed, with one 90-degree turn. Without oars, the rowboat's speed is 0."
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 50. AC 11.',
            'Speed: 3 mph (rowing).',
            'Crew: 2 required, 2 passengers.',
            'Cargo: 500 lb.'
        ]
    },
    {
        name: 'Sailing Ship',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A versatile ocean-going sailing vessel used for trade and exploration.',
        notes: 'Speed up to 2 mph (sailing). Reliable for long ocean voyages.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (100 ft. by 20 ft.)',
            travelPace: '5 miles per hour (120 miles per day)',
            creatureCapacity: '30 crew, 20 passengers',
            cargoCapacity: '100 tons',
            abilityScores: {
                strength: 20,
                dexterity: 7,
                constitution: 17,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the ship can take 3 actions, choosing from the options below. It can take only 2 actions if it has fewer than twenty crew and only 1 action if it has fewer than ten. It can't take these actions if it has fewer than three crew.",
                        'Fire Ballistas. The ship can fire its ballista (DMG, ch. 8).',
                        'Fire Mangonel. The ship can fire its mangonel (DMG, ch. 8).',
                        'Move. The ship can use its helm to move with its sails.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '300 (damage threshold 15)' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '18' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of one of the ship's sails, with one 90-degree turn. If the helm is destroyed, the ship can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Sails',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -5 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '45 ft.; 15 ft. while sailing into the wind; 60 ft. while sailing with the wind' }
                    ]
                },
                {
                    heading: 'Weapon: Ballista',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '50' }
                    ],
                    paragraphs: ['Ranged Weapon Attack: +6 to hit, range 120/480 ft., one target. Hit: 16 (3d10) piercing damage.']
                },
                {
                    heading: 'Weapon: Mangonel',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '100' }
                    ],
                    paragraphs: ["Ranged Weapon Attack: +5 to hit, range 200/800 ft. (can't hit targets within 60 ft. of it), one target. Hit: 27 (5d10) bludgeoning damage."]
                }
            ]
        },
        detailLines: [
            'HP: 300. AC 15. Damage Threshold 15.',
            'Speed: 5 mph (sailing).',
            'Crew: 30 required, 20 passengers.',
            'Ballista + Mangonel. Cargo: 100 tons.'
        ]
    },
    {
        name: 'Warship',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Water)',
        source: 'Ghosts of Saltmarsh',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/gos',
        summary: 'A heavily armed warship built for naval combat.',
        notes: 'Speed 2.5 mph (rowing) or up to 2.5 mph (sailing). Formidable at sea.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (100 ft. by 20 ft.)',
            travelPace: '4 miles per hour (96 miles per day)',
            creatureCapacity: '40 crew, 60 passengers',
            cargoCapacity: '200 tons',
            abilityScores: {
                strength: 20,
                dexterity: 4,
                constitution: 20,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Actions',
                    paragraphs: [
                        "On its turn, the warship can take 3 actions, choosing from the options below. It can take only 2 actions if it has fewer than twenty crew and only 1 action if it has fewer than ten. It can't take these actions if it has fewer than three crew.",
                        'Fire Ballistas. The warship can fire its ballistas (DMG, ch. 8).',
                        'Fire Mangonels. The warship can fire its mangonels (DMG, ch. 8).',
                        'Move. The warship can use its helm to move with its oars or sails. As part of this move, it can use its naval ram.'
                    ]
                },
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '500 (damage threshold 20)' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '18' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of one of the ship's movement components, with one 90-degree turn. If the helm is destroyed, the warship can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Oars',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -5 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '20 ft. (requires at least 20 crew)' }
                    ]
                },
                {
                    heading: 'Movement: Sails',
                    facts: [
                        { label: 'Armor Class', value: '12' },
                        { label: 'Hit Points', value: '100; -10 ft. speed per 25 damage taken' },
                        { label: 'Speed (Water)', value: '35 ft.; 15 ft. while sailing into the wind; 50 ft. while sailing with the wind' }
                    ]
                },
                {
                    heading: 'Weapon: Ballista (2)',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '50 each' }
                    ],
                    paragraphs: ['Ranged Weapon Attack: +6 to hit, range 120/480 ft., one target. Hit: 16 (3d10) piercing damage.']
                },
                {
                    heading: 'Weapon: Mangonel (2)',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '100 each' }
                    ],
                    paragraphs: ["Ranged Weapon Attack: +5 to hit, range 200/800 ft. (can't hit targets within 60 ft. of it), one target. Hit: 27 (5d10) bludgeoning damage."]
                },
                {
                    heading: 'Weapon: Naval Ram',
                    facts: [
                        { label: 'Armor Class', value: '20' },
                        { label: 'Hit Points', value: '100 (damage threshold 10)' }
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 500. AC 15. Damage Threshold 20.',
            'Speed: 4 mph.',
            'Crew: 40 required, 60 passengers.',
            '2 × Ballistae, 2 × Mangonels, Naval Ram. Cargo: 200 tons.'
        ]
    },
    {
        name: 'Airship',
        type: 'Vehicle',
        subtype: 'Gargantuan Vehicle (Air)',
        source: "Eberron: Rising from the Last War",
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/erlftlw',
        summary: 'A magically powered flying vessel kept aloft by an elemental ring.',
        vehicleStatBlock: {
            subtitle: 'Gargantuan Vehicle (80 ft. by 20 ft.)',
            travelPace: '9 miles per hour (216 miles per day)',
            creatureCapacity: '20 crew, 10 passengers',
            cargoCapacity: '1 ton',
            abilityScores: {
                strength: 14,
                dexterity: 14,
                constitution: 12,
                intelligence: 0,
                wisdom: 0,
                charisma: 0
            },
            damageImmunities: 'Poison, Psychic',
            conditionImmunities: 'Blinded, Charmed, Deafened, Exhaustion, Frightened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Stunned, Unconscious',
            sections: [
                {
                    heading: 'Hull',
                    facts: [
                        { label: 'Armor Class', value: '13' },
                        { label: 'Hit Points', value: '300' }
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '16' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Control', value: "Move up to the speed of its elemental engine, with one 90-degree turn. If the helm is destroyed, the airship can't turn." }
                    ]
                },
                {
                    heading: 'Movement: Elemental Engine',
                    facts: [
                        { label: 'Armor Class', value: '18' },
                        { label: 'Hit Points', value: '100; -20 ft. speed per 25 damage taken' },
                        { label: 'Locomotion (Air)', value: 'Elemental power, speed 80 ft. If the engine is destroyed, the ship immediately crashes.' }
                    ]
                },
                {
                    heading: 'Weapons: Ballistas (4)',
                    facts: [
                        { label: 'Armor Class', value: '15' },
                        { label: 'Hit Points', value: '50 each' }
                    ],
                    paragraphs: ['Ranged Weapon Attack: +6 to hit, range 120/480 ft., one target. Hit: 16 (3d10) piercing damage.']
                },
                {
                    heading: 'Actions',
                    paragraphs: [
                        'On its turn, the airship can use its helm to move using its elemental engine. It can also fire its ballistas. If it has half its crew or fewer, it can fire only two of the ballistas.'
                    ]
                }
            ]
        },
        detailLines: [
            'HP: 300. AC 13.',
            'Speed: 9 mph (216 miles per day).',
            'Crew: 20 required, 10 passengers.',
            '4 × Ballistae. Cargo: 1 ton.'
        ]
    },
    {
        name: 'Spelljammer Helm',
        type: 'Vehicle',
        subtype: 'Spelljamming Ship Component',
        source: 'Spelljammer: Adventures in Space',
        sourceUrl: 'https://www.dndbeyond.com/sources/dnd/aais',
        summary: 'A magical helm that propels a spelljamming vessel through wildspace.',
        vehicleStatBlock: {
            subtitle: 'Vehicle Control Component (Spelljamming Helm)',
            travelPace: 'Spelljamming speed for interplanetary and interstellar travel',
            sections: [
                {
                    heading: 'Activation',
                    paragraphs: [
                        'A creature seated in the helm can activate it by expending a spell slot of level 1 or higher.',
                        'Once activated, the helm bonds to that pilot until they leave the helm, become incapacitated, or die.'
                    ]
                },
                {
                    heading: 'Pilot Effects',
                    facts: [
                        { label: 'Spellcasting', value: 'The pilot cannot cast spells while actively piloting.' },
                        { label: 'Spell Slots', value: 'Spell slots are suppressed while piloting but are not consumed by this suppression.' },
                        { label: 'Concentration', value: 'The pilot can maintain concentration while piloting.' }
                    ]
                },
                {
                    heading: 'Movement Modes',
                    facts: [
                        { label: 'Tactical Speed', value: '35 mph (used for combat and close-range maneuvering)' },
                        { label: 'Spelljamming Speed', value: '100,000,000 miles per day (used for long-distance travel)' }
                    ],
                    paragraphs: [
                        'Spelljamming speed cannot be used while the ship is near a Large or bigger object, such as a planet, moon, asteroid, or another ship.'
                    ]
                },
                {
                    heading: 'Control Rules',
                    paragraphs: [
                        'The pilot must remain seated in the helm to control movement.',
                        'If the pilot leaves the helm, becomes incapacitated, or dies, the ship immediately stops moving under helm power until a new pilot activates the helm.'
                    ]
                },
                {
                    heading: 'Control: Helm',
                    facts: [
                        { label: 'Armor Class', value: '16' },
                        { label: 'Hit Points', value: '50' },
                        { label: 'Failure', value: 'If the helm is destroyed, the ship cannot move under spelljamming power.' }
                    ]
                },
                {
                    heading: 'Action Economy',
                    facts: [
                        { label: 'Activate Helm', value: 'Action (when first bonding to the helm)' },
                        { label: 'Piloting', value: 'Passive while seated after activation' }
                    ],
                    paragraphs: [
                        'The pilot controls speed and heading as part of the ship\'s movement rather than by spending additional actions each round.'
                    ]
                }
            ]
        },
        detailLines: [
            'Pilot must sit in the helm and attune to it.',
            'Moves at tactical speed of 35 mph in space.',
            'Cannot pilot if not a spellcaster.',
            'Requires expending a level 1+ spell slot to activate.',
            'If pilot leaves or helm is destroyed, ship cannot move.'
        ]
    }
];

export type ExtrasCatalogType = 'Battle Smith Defender' | 'Beast Companion (2014)' | 'Familiar' | 'Infusion' | 'Sidekick' | 'Wild Shape' | 'Mount' | 'Pet' | 'Summoned' | 'Misc' | 'Vehicle';

export const extrasTypeGroups: ReadonlyArray<{ group: string; types: ReadonlyArray<ExtrasCatalogType> }> = [
    {
        group: 'Creature',
        types: ['Battle Smith Defender', 'Beast Companion (2014)', 'Familiar', 'Infusion', 'Sidekick', 'Wild Shape', 'Mount', 'Pet', 'Summoned', 'Misc']
    },
    {
        group: 'Object',
        types: ['Vehicle']
    }
];
