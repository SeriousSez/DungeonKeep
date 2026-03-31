export interface SpellDetail {
    school: string;
    castingTime: string;
    range: string;
    components: string;
    duration: string;
    concentration: boolean;
    ritual: boolean;
    description: string;
    higherLevels?: string;
    attackSave?: string;
    damageEffect?: string;
    tags?: string[];
}

export const spellDetailsMap: Readonly<Record<string, SpellDetail>> = {

    // ── Cantrips ────────────────────────────────────────────────────────────

    'Acid Splash': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Acid',
        description: 'You hurl a bubble of acid. Choose one or two creatures you can see within range. If you choose two, they must be within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.',
        higherLevels: 'This spell\'s damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).',
        tags: ['DAMAGE', 'ACID']
    },

    'Arcane Lock': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (gold dust worth at least 25 gp, consumed)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'You touch a closed door, window, gate, chest, or other entryway and it becomes locked for the duration. You and creatures you designate when casting can open it normally. You can set a password that suppresses the spell for 1 minute when spoken within 5 feet. Otherwise, it remains impassable until broken, dispelled, or suppressed. Casting Knock on it suppresses Arcane Lock for 10 minutes. The object is also harder to force open, with the DC to break it or pick locks increased by 10.',
        tags: ['UTILITY', 'WARD']
    },

    'Augury': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V, S, M (marked sticks, bones, cards, or similar tokens worth at least 25 gp)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'By casting divining tools, you receive an omen from an otherworldly entity about a specific course of action you plan to take within the next 30 minutes. The omen is Weal (good), Woe (bad), Weal and Woe (both), or Nothing (neither especially good nor bad). The spell does not account for circumstances that may change the outcome, such as additional spells or allies arriving or leaving.',
        higherLevels: 'If you cast this spell two or more times before your next long rest, each casting after the first has a cumulative 25% chance to return a random reading.',
        tags: ['DIVINATION', 'UTILITY', 'RITUAL']
    },

    'Chill Touch': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: '1 round',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Necrotic',
        description: 'You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature. On a hit, the target takes 1d8 necrotic damage and can\'t regain hit points until the start of your next turn. If you hit an undead target, it also has disadvantage on attack rolls against you until the end of your next turn.',
        higherLevels: 'The spell\'s damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
        tags: ['DAMAGE', 'DEBUFF']
    },

    'Druidcraft': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Whispering to the spirits of nature, you create one of the following effects within range: a tiny, harmless sensory effect that predicts what the weather will be for the next 24 hours; make a flower blossom, a seed pod open, or a leaf bud bloom; create a harmless sensory effect, such as falling leaves, a puff of wind, the sound of a small animal, or the faint odor of skunk; or light or snuff out a candle, a torch, or a small campfire.',
        tags: ['UTILITY', 'NATURE']
    },

    'Eldritch Blast': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Force',
        description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage. The spell creates more than one beam when you reach higher levels — two beams at 5th level, three beams at 11th level, and four beams at 17th level. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.',
        tags: ['DAMAGE', 'FORCE']
    },

    'Fire Bolt': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Fire',
        description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn\'t being worn or carried.',
        higherLevels: 'This spell\'s damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).',
        tags: ['DAMAGE', 'FIRE']
    },

    'Guidance': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends.',
        tags: ['BUFF', 'SUPPORT']
    },

    'Mage Hand': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet from you or if you cast this spell again. You can use your action to control the hand. You can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item, or pour the contents of a vial. The hand can\'t attack, activate magic items, or carry more than 10 pounds.',
        tags: ['UTILITY', 'MANIPULATION']
    },

    'Mending': {
        school: 'Transmutation',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'V, S, M (two lodestones)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'This spell repairs a single break or tear in an object you touch, such as a broken chain link, two halves of a broken key, a torn cloak, or a leaking wineskin. As long as the break or tear is no larger than 1 foot in any dimension, you mend it, leaving no trace of the former damage. This spell can physically repair a magic item or construct, but the spell can\'t restore magic to such an object.',
        tags: ['UTILITY', 'REPAIR']
    },

    'Minor Illusion': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'S, M (a bit of fleece)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'You create a sound or an image of an object within range that lasts for the duration. The illusion also ends if you dismiss it as an action or cast this spell again. If you create a sound, its volume can range from a whisper to a scream. It can be your voice, someone else\'s voice, a lion\'s roar, a beating of drums, or any other sound you choose. The sound continues unabated throughout the duration, or you can make discrete sounds at different times before the spell ends. If you create a visual illusion of an object — such as a chair, muddy footprints, or a small chest — it must be no larger than a 5-foot cube. The image can\'t create sound, light, smell, or any other sensory effect.',
        tags: ['UTILITY', 'ILLUSION']
    },

    'Produce Flame': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Fire',
        description: 'A flickering flame appears in your hand. The flame remains there for the duration and harms neither you nor your equipment. The flame sheds bright light in a 10-foot radius and dim light for an additional 10 feet. The spell ends if you dismiss it as an action or if you cast it again. You can also attack with the flame, although doing so ends the spell. When you cast this spell or as an action on a later turn, you can hurl the flame at a creature within 30 feet of you. Make a ranged spell attack. On a hit, the target takes 1d8 fire damage.',
        higherLevels: 'The damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
        tags: ['DAMAGE', 'FIRE', 'LIGHT']
    },

    'Ray of Frost': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Cold',
        description: 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 cold damage and its speed is reduced by 10 feet until the start of your next turn.',
        higherLevels: 'The spell\'s damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
        tags: ['DAMAGE', 'COLD', 'DEBUFF']
    },

    'Sacred Flame': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Radiant',
        description: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.',
        higherLevels: 'The spell\'s damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
        tags: ['DAMAGE', 'RADIANT']
    },

    'Shillelagh': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V, S, M (mistletoe, a shamrock leaf, and a club or quarterstaff)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'The wood of a club or quarterstaff you are holding is imbued with nature\'s power. For the duration, you can use your spellcasting ability instead of Strength for the attack and damage rolls of melee attacks using that weapon, and the weapon\'s damage die becomes a d8. The weapon also becomes magical if it isn\'t already. The spell ends if you cast it again or if you let go of the weapon.',
        tags: ['BUFF', 'WEAPON']
    },

    'Shocking Grasp': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'Melee Spell Attack',
        damageEffect: 'Lightning',
        description: 'Lightning springs from your hand to deliver a shock to a creature you try to touch. Make a melee spell attack against the target. You have advantage on the attack roll if the target is wearing armor made of metal. On a hit, the target takes 1d8 lightning damage and it can\'t take reactions until the start of its next turn.',
        higherLevels: 'The spell\'s damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
        tags: ['DAMAGE', 'LIGHTNING']
    },

    'Thaumaturgy': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V',
        duration: 'Up to 1 minute',
        concentration: false,
        ritual: false,
        description: 'You manifest a minor wonder, a sign of supernatural power, within range. You create one of the following magical effects within range: your voice booms up to three times as loud as normal; you cause flames to flicker, brighten, dim, or change color; you cause harmless tremors in the ground; you create an instantaneous sound that originates from a point of your choice within range; you instantly cause an unlocked door or window to fly open or slam shut; or you alter the appearance of your eyes for 1 minute. If you cast this spell multiple times, you can have up to three of its 1-minute effects active at a time.',
        tags: ['UTILITY', 'PRESENCE']
    },

    'Vicious Mockery': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'WIS Save',
        damageEffect: 'Psychic',
        description: 'You unleash a string of insults laced with subtle enchantments at a creature you can see within range. If the target can hear you (though it need not understand you), it must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll it makes before the end of its next turn.',
        higherLevels: 'This spell\'s damage increases by 1d4 when you reach 5th level (2d4), 11th level (3d4), and 17th level (4d4).',
        tags: ['DAMAGE', 'PSYCHIC', 'DEBUFF']
    },

    // ── 1st Level ───────────────────────────────────────────────────────────

    'Armor of Agathys': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (a cup of water)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        damageEffect: 'Cold',
        description: 'A protective magical force surrounds you, manifesting as a spectral frost that covers you and your gear. You gain 5 temporary hit points for the duration. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, both the temporary hit points and the cold damage increase by 5 for each slot level above 1st.',
        tags: ['BUFF', 'DEFENSIVE', 'COLD']
    },

    'Arms of Hadar': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Self (10-ft. radius)',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'STR Save',
        damageEffect: 'Necrotic',
        description: 'You invoke the power of Hadar, the Dark Hunger. Tendrils of dark energy erupt from you and batter all creatures within 10 feet of you. Each creature in that area must make a Strength saving throw. On a failed save, a target takes 2d6 necrotic damage and can\'t take reactions until its next turn. On a successful save, the creature takes half damage, but suffers no other effect.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
        tags: ['DAMAGE', 'NECROTIC', 'AOE']
    },

    'Bless': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S, M (a sprinkling of holy water)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
        tags: ['BUFF', 'SUPPORT']
    },

    'Ceremony': {
        school: 'Abjuration',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (25 gp of powdered silver, consumed)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'You perform one of several sacred rites for a willing target you touch, such as Atonement, Bless Water, Coming of Age, Dedication, Funeral Rite, or Wedding. Each rite carries specific roleplay and mechanical effects, including one-time blessings, creating Holy Water, and specialized benefits tied to the rite chosen.',
        tags: ['RITUAL', 'UTILITY', 'DIVINE']
    },

    'Command': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V',
        duration: '1 round',
        concentration: false,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom save or follow the command on its next turn. Typical commands include Approach, Drop, Flee, Grovel, and Halt. The command has no effect if it is directly harmful to the creature.',
        higherLevels: 'When cast with a slot of 2nd level or higher, you can affect one additional creature for each slot level above 1st. Targets must be within 30 feet of each other.',
        tags: ['CONTROL', 'ENCHANTMENT']
    },

    'Compelled Duel': {
        school: 'Enchantment',
        castingTime: '1 bonus action',
        range: '30 ft.',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You attempt to compel a creature into a duel. On a failed Wisdom save, the target has disadvantage on attack rolls against creatures other than you. It must also make a Wisdom save each time it attempts to move farther than 30 feet away from you.',
        tags: ['CONTROL', 'DUEL', 'TAUNT']
    },

    'Burning Hands': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (15-ft. cone)',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire',
        description: 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one. The fire ignites any flammable objects in the area that aren\'t being worn or carried.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
        tags: ['DAMAGE', 'FIRE', 'AOE']
    },

    'Cure Wounds': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.',
        tags: ['HEALING', 'SUPPORT']
    },

    'Detect Evil and Good': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'For the duration, you know whether there is an aberration, celestial, elemental, fey, fiend, or undead within 30 feet of you, and where the creature is located. You also detect locations or objects that are magically consecrated or desecrated.',
        tags: ['DETECTION', 'DIVINATION']
    },

    'Detect Magic': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: true,
        description: 'For the duration, you sense the presence of magic within 30 feet. If you sense magic this way, you can use your action to see a faint aura around visible creatures or objects that bear magic and learn the school of magic, if any.',
        tags: ['DETECTION', 'DIVINATION', 'RITUAL']
    },

    'Detect Poison and Disease': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (a yew leaf)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: true,
        description: 'For the duration, you sense the presence and location of poisons, poisonous creatures, and diseases within 30 feet. You also identify the kind of poison, poisonous creature, or disease in each case.',
        tags: ['DETECTION', 'DIVINATION', 'RITUAL']
    },

    'Dissonant Whispers': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'WIS Save',
        damageEffect: 'Psychic',
        description: 'You whisper a discordant melody that only one creature of your choice within range can hear, wracking it with terrible pain. The target must make a Wisdom saving throw. On a failed save, it takes 3d6 psychic damage and must immediately use its reaction, if available, to move as far as its speed allows away from you. The creature doesn\'t move into obviously deadly ground. On a successful save, the target takes half as much damage and doesn\'t need to move away.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
        tags: ['DAMAGE', 'PSYCHIC', 'CONTROL']
    },

    'Divine Favor': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        damageEffect: 'Radiant',
        description: 'Your prayer empowers you with divine radiance. Until the spell ends, your weapon attacks deal an extra 1d4 radiant damage on a hit.',
        tags: ['BUFF', 'WEAPON', 'RADIANT']
    },

    'Divine Smite': {
        school: 'Evocation',
        castingTime: 'Special (on hit)',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Radiant',
        description: 'When you hit a creature with a melee weapon attack, you can expend a spell slot to deal radiant damage to the target in addition to the weapon\'s damage. The extra damage is 2d8 for a 1st-level spell slot plus 1d8 for each slot level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is a Fiend or an Undead.',
        tags: ['DAMAGE', 'RADIANT', 'SMITE']
    },

    'Heroism': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A willing creature you touch is filled with courage. Until the spell ends, the creature is immune to being frightened and gains temporary hit points equal to your spellcasting ability modifier at the start of each of its turns.',
        higherLevels: 'When cast with a slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
        tags: ['BUFF', 'SUPPORT', 'TEMP HP']
    },

    'Protection from Evil and Good': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (holy water or powdered silver and iron, consumed)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Until the spell ends, one willing creature you touch has protection against aberrations, celestials, elementals, fey, fiends, and undead. Those creatures have disadvantage on attack rolls against the target, and the target cannot be charmed, frightened, or possessed by them.',
        tags: ['BUFF', 'DEFENSIVE', 'WARD']
    },

    'Purify Food and Drink': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '10 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'All nonmagical food and drink within a 5-foot radius sphere centered on a point you choose within range is purified and rendered free of poison and disease.',
        tags: ['UTILITY', 'RITUAL', 'SURVIVAL']
    },

    'Searing Smite': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Fire',
        description: 'The next time you hit a creature with a melee weapon attack during this spell, the attack deals an extra 1d6 fire damage and the target ignites. At the start of each of its turns, it takes 1d6 fire damage until it succeeds on a Constitution saving throw.',
        higherLevels: 'When cast with a slot of 2nd level or higher, the initial extra damage increases by 1d6 for each slot level above 1st.',
        tags: ['DAMAGE', 'FIRE', 'SMITE']
    },

    'Ensnaring Strike': {
        school: 'Conjuration',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'STR Save',
        damageEffect: 'Piercing',
        description: 'The next time you hit a creature with a weapon attack before this spell ends, a writhing mass of thorny vines appears at the point of impact, and the target must succeed on a Strength saving throw or be restrained by the magical vines until the spell ends. A Large or larger creature has advantage on this saving throw. If the target succeeds on the save, the vines shrivel away. While restrained by this spell, the target takes 1d6 piercing damage at the start of each of its turns. A creature restrained by the vines or one that can touch the creature can use its action to make a Strength check against your spell save DC. On a success, the target is freed.',
        higherLevels: 'If you use a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
        tags: ['CONTROL', 'DAMAGE', 'RESTRAIN']
    },

    'Entangle': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '90 ft.',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'STR Save',
        description: 'Grasping weeds and vines sprout from the ground in a 20-foot square starting from a point within range. For the duration, these plants turn the ground in the area into difficult terrain. A creature in the area when you cast the spell must succeed on a Strength saving throw or be restrained by the entangling plants until the spell ends. A creature restrained by the plants can use its action to make a Strength check against your spell save DC. On a success, it frees itself.',
        tags: ['CONTROL', 'RESTRAIN', 'TERRAIN']
    },

    'Faerie Fire': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'DEX Save',
        description: 'Each object in a 20-foot cube within range is outlined in blue, green, or violet light (your choice). Any creature in the area when the spell is cast is also outlined in light if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed dim light in a 10-foot radius. Any attack roll against an affected creature or object has advantage if the attacker can see it, and the affected creature or object can\'t benefit from being invisible.',
        tags: ['BUFF', 'SUPPORT', 'LIGHT', 'CONTROL']
    },

    'Find Familiar': {
        school: 'Conjuration',
        castingTime: '1 hour',
        range: '10 ft.',
        components: 'V, S, M (10 gp worth of charcoal, incense, and herbs that must be consumed by fire in a brass brazier)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'You gain the service of a familiar, a spirit that takes an animal form you choose: bat, cat, crab, frog (toad), hawk, lizard, octopus, owl, poisonous snake, fish (quipper), rat, raven, sea horse, spider, or weasel. Appearing in an unoccupied space within range, the familiar has the statistics of the chosen form, though it is a celestial, fey, or fiend (your choice) instead of a beast. Your familiar acts independently of you, but it always obeys your commands. As an action, you can temporarily dismiss your familiar. It disappears into a pocket dimension. You can communicate telepathically with your familiar.',
        tags: ['UTILITY', 'SUMMON', 'COMPANION']
    },

    'Goodberry': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a sprig of mistletoe)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'Up to ten berries appear in your hand and are infused with magic for the duration. A creature can use its action to eat one berry. Eating a berry restores 1 hit point, and the berry provides enough nourishment to sustain a creature for one day. The berries lose their potency if they have not been consumed within 24 hours of the casting of this spell.',
        tags: ['HEALING', 'UTILITY', 'SUSTENANCE']
    },

    'Grease': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a bit of pork rind or butter)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        description: 'Slick grease covers the ground in a 10-foot square centered on a point within range and turns it into difficult terrain for the duration. When the grease appears, each creature standing in its area must succeed on a Dexterity saving throw or fall prone. A creature that enters the area or ends its turn there must also succeed on a Dexterity saving throw or fall prone.',
        tags: ['CONTROL', 'TERRAIN']
    },

    'Guiding Bolt': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: '1 round',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Radiant',
        description: 'A flash of light streaks toward a creature of your choice within range. Make a ranged spell attack against the target. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage, thanks to the mystical dim light glittering on the target until then.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
        tags: ['DAMAGE', 'RADIANT', 'BUFF']
    },

    'Healing Word': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: '60 ft.',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.',
        tags: ['HEALING', 'SUPPORT']
    },

    'Hex': {
        school: 'Enchantment',
        castingTime: '1 bonus action',
        range: '90 ft.',
        components: 'V, S, M (the petrified eye of a newt)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        damageEffect: 'Necrotic',
        description: 'You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 necrotic damage to the target whenever you hit it with an attack. Also, choose one ability when you cast the spell. The target has disadvantage on ability checks made with the chosen ability. If the target drops to 0 hit points before this spell ends, you can use a bonus action on a subsequent turn of yours to curse a new creature.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain your concentration on the spell for up to 8 hours. When you use a spell slot of 5th level or higher, you can maintain your concentration for up to 24 hours.',
        tags: ['CURSE', 'DAMAGE', 'NECROTIC', 'DEBUFF']
    },

    "Hunter's Mark": {
        school: 'Divination',
        castingTime: '1 bonus action',
        range: '90 ft.',
        components: 'V',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        damageEffect: 'Force',
        description: 'You choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack, and you have advantage on any Wisdom (Perception) or Wisdom (Survival) check you make to find it. If the target drops to 0 hit points before this spell ends, you can use a bonus action on a subsequent turn of yours to mark a new creature.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain your concentration on the spell for up to 8 hours. When you use a spell slot of 5th level or higher, you can maintain your concentration for up to 24 hours.',
        tags: ['DAMAGE', 'TRACKING', 'BUFF']
    },

    'Longstrider': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a pinch of dirt)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch a creature. The target\'s speed increases by 10 feet until the spell ends.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
        tags: ['BUFF', 'MOVEMENT']
    },

    'Mage Armor': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a piece of cured leather)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You touch a willing creature who isn\'t wearing armor, and a protective magical force surrounds it until the spell ends. The target\'s base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss the spell as an action.',
        tags: ['BUFF', 'DEFENSIVE', 'ARMOR']
    },

    'Magic Missile': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Force',
        description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.',
        tags: ['DAMAGE', 'FORCE', 'GUARANTEED HIT']
    },

    'Shield': {
        school: 'Abjuration',
        castingTime: '1 reaction',
        range: 'Self',
        components: 'V, S',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.',
        tags: ['DEFENSIVE', 'REACTIVE', 'ARMOR']
    },

    'Shield of Faith': {
        school: 'Abjuration',
        castingTime: '1 bonus action',
        range: '60 ft.',
        components: 'V, S, M (a small parchment with a bit of holy text)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'A shimmering field appears and surrounds a creature of your choice within range, granting it a +2 bonus to AC for the duration.',
        tags: ['BUFF', 'DEFENSIVE', 'ARMOR']
    },

    'Thunderous Smite': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'STR Save',
        damageEffect: 'Thunder',
        description: 'The first time you hit with a melee weapon attack during this spell, your weapon rings with thunder. The attack deals an extra 2d6 thunder damage, and the target must make a Strength saving throw or be pushed 10 feet away and knocked prone.',
        tags: ['DAMAGE', 'THUNDER', 'SMITE', 'CONTROL']
    },

    'Wrathful Smite': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        damageEffect: 'Psychic',
        description: 'The next time you hit with a melee weapon attack during this spell, the attack deals an extra 1d6 psychic damage. The target must make a Wisdom save or become frightened of you until the spell ends. The target can use an action to attempt a Wisdom check against your spell save DC to end the effect.',
        tags: ['DAMAGE', 'PSYCHIC', 'SMITE', 'FEAR']
    },

    "Tasha's Hideous Laughter": {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S, M (tiny tarts and a feather that is waved in the air)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'A creature of your choice that you can see within range perceives everything as hilariously funny and falls into fits of laughter if this spell affects it. The target must succeed on a Wisdom saving throw or fall prone, becoming incapacitated and unable to stand up for the duration. A creature with an Intelligence score of 4 or less isn\'t affected. At the end of each of its turns, and each time it takes damage, the target can make another Wisdom saving throw. The target has advantage on the saving throw if it\'s triggered by damage.',
        tags: ['CONTROL', 'INCAPACITATE']
    },

    // ── 2nd Level ───────────────────────────────────────────────────────────

    'Aid': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S, M (a tiny strip of white cloth)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'Your spell bolsters your allies with toughness and resolve. Choose up to three creatures within range. Each target\'s hit point maximum and current hit points increase by 5 for the duration.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, a target\'s hit points increase by an additional 5 for each slot level above 2nd.',
        tags: ['HEALING', 'BUFF', 'SUPPORT']
    },

    'Find Steed': {
        school: 'Conjuration',
        castingTime: '10 minutes',
        range: '30 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You summon a spirit that assumes the form of an unusually intelligent, strong, and loyal steed, creating a long-lasting bond with it. Appearing in an unoccupied space within range, the steed takes on a form that you choose: a warhorse, a pony, a camel, an elk, or a mastiff. The steed has the statistics of the chosen form but is a celestial, fey, or fiend (your choice) instead of its normal type. While the steed is within 1 mile of you, you can communicate with it telepathically.',
        tags: ['COMPANION', 'MOUNT', 'UTILITY']
    },

    'Gentle Repose': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (2 copper pieces, placed on the corpse\'s eyes)',
        duration: '10 days',
        concentration: false,
        ritual: true,
        description: 'You touch a corpse or other remains. For the duration, the target is protected from decay and can\'t become undead. The spell also effectively extends the time limit on raising the target from the dead, since days spent under this spell don\'t count against the time limit of spells such as raise dead.',
        tags: ['RITUAL', 'UTILITY', 'DEATH']
    },

    'Flaming Sphere': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a bit of tallow, a pinch of brimstone, and a dusting of powdered iron)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire',
        description: 'A 5-foot-diameter sphere of fire appears in an unoccupied space of your choice within range and lasts for the duration. Any creature that ends its turn within 5 feet of the sphere must make a Dexterity saving throw. The creature takes 2d6 fire damage on a failed save, or half as much damage on a successful one. As a bonus action, you can move the sphere up to 30 feet. If you ram the sphere into a creature, that creature must make the saving throw against the sphere\'s damage, and the sphere stops moving this turn.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot level above 2nd.',
        tags: ['DAMAGE', 'FIRE', 'PERSISTENT']
    },

    'Heat Metal': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a piece of iron and a flame)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Fire',
        description: 'Choose a manufactured metal object, such as a metal weapon or a suit of heavy or medium metal armor, that you can see within range. You cause the object to glow red-hot. Any creature in physical contact with the object takes 2d8 fire damage when you cast the spell. Until the spell ends, you can use a bonus action on each of your subsequent turns to cause this damage again. If a creature is holding or wearing the object and takes the damage from it, the creature must succeed on a Constitution saving throw or drop the object if it can. If it doesn\'t drop the object, it has disadvantage on attack rolls and ability checks until the start of your next turn.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.',
        tags: ['DAMAGE', 'FIRE', 'CONTROL']
    },

    'Invisibility': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (an eyelash encased in gum arabic)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target\'s person. The spell ends for a target that attacks or casts a spell.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.',
        tags: ['STEALTH', 'UTILITY']
    },

    'Lesser Restoration': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You touch a creature and can end either one disease or one condition afflicting it. The condition can be blinded, deafened, paralyzed, or poisoned.',
        tags: ['HEALING', 'SUPPORT', 'CLEANSE']
    },

    'Locate Object': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (a forked twig)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Describe or name an object that is familiar to you. You sense the direction to the object\'s location, as long as that object is within 1,000 feet of you. If the object is in motion, you know the direction of its movement. The spell can locate a specific known object or the nearest object of a particular kind.',
        tags: ['DETECTION', 'DIVINATION', 'UTILITY']
    },

    'Magic Weapon': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You touch a nonmagical weapon. Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack and damage rolls. When you cast this spell using a 4th-level or higher slot, the bonus increases to +2. When you use a 6th-level or higher slot, the bonus increases to +3.',
        tags: ['BUFF', 'WEAPON', 'MAGIC']
    },

    'Protection from Poison': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch a creature. If it is poisoned, you neutralize the poison. If more than one poison afflicts the target, you neutralize one poison that you know is present, or one at random. For the duration, the target has advantage on saving throws against being poisoned and resistance to poison damage.',
        tags: ['BUFF', 'DEFENSIVE', 'POISON']
    },

    'Shining Smite': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        damageEffect: 'Radiant',
        description: 'The next time you hit a creature with a melee weapon attack during this spell, the weapon flares with brilliant light. The attack deals an extra 2d6 radiant damage, and the target sheds bright light in a 5-foot radius and can\'t benefit from the Invisible condition until the spell ends.',
        tags: ['DAMAGE', 'RADIANT', 'SMITE', 'REVEAL']
    },

    'Warding Bond': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a pair of platinum rings worth at least 50 gp each, worn by you and the target)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch another creature and create a mystic connection between you and the target until the spell ends. While the target is within 60 feet of you, it gains a +1 bonus to AC and saving throws, and it has resistance to all damage. Also, each time it takes damage, you take the same amount of damage.',
        tags: ['BUFF', 'DEFENSIVE', 'SUPPORT']
    },

    'Zone of Truth': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        attackSave: 'CHA Save',
        description: 'You create a magical zone that guards against deception in a 15-foot-radius sphere centered on a point of your choice. Until the spell ends, a creature that enters the spell\'s area for the first time on a turn or starts its turn there must make a Charisma saving throw. On a failed save, a creature can\'t speak a deliberate lie while in the radius.',
        tags: ['CONTROL', 'SOCIAL', 'ENCHANTMENT']
    },

    'Misty Step': {
        school: 'Conjuration',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.',
        tags: ['MOVEMENT', 'TELEPORTATION']
    },

    'Moonbeam': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S, M (several seeds of any moonseed plant and a piece of opalescent feldspar)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Radiant',
        description: 'A silvery beam of pale light shines down in a 5-foot-radius, 40-foot-high cylinder centered on a point within range. Until the spell ends, dim light fills the cylinder. When a creature enters the spell\'s area for the first time on a turn or starts its turn there, it is engulfed in ghostly flames that cause searing pain, and it must make a Constitution saving throw. It takes 2d10 radiant damage on a failed save, or half as much on a successful one. A shapechanger makes its saving throw with disadvantage.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d10 for each slot level above 2nd.',
        tags: ['DAMAGE', 'RADIANT', 'PERSISTENT', 'AOE']
    },

    'Pass without Trace': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (ashes from a burned leaf of mistletoe and a sprig of spruce)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'A veil of shadows and silence radiates from you, masking you and your companions from detection. For the duration, each creature you choose within 30 feet of you (including you) has a +10 bonus to Dexterity (Stealth) checks and can\'t be tracked except by magical means. A creature that receives this bonus leaves behind no tracks or other traces of its passage.',
        tags: ['STEALTH', 'UTILITY', 'SUPPORT']
    },

    'Prayer of Healing': {
        school: 'Evocation',
        castingTime: '10 minutes',
        range: '30 ft.',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'Up to six creatures of your choice that you can see within range each regain hit points equal to 2d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, the healing increases by 1d8 for each slot level above 2nd.',
        tags: ['HEALING', 'SUPPORT', 'GROUP']
    },

    'Scorching Ray': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'Ranged Spell Attack',
        damageEffect: 'Fire',
        description: 'You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, you create one additional ray for each slot level above 2nd.',
        tags: ['DAMAGE', 'FIRE']
    },

    'Shatter': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a chip of mica)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Thunder',
        description: 'A sudden loud ringing noise, painfully intense, erupts from a point of your choice within range. Each creature in a 10-foot-radius sphere centered on that point must make a Constitution saving throw. A creature takes 3d8 thunder damage on a failed save, or half as much on a successful one. A creature made of inorganic material such as stone, crystal, or metal has disadvantage on this saving throw. A nonmagical object that isn\'t being worn or carried also takes the damage if it\'s in the spell\'s area.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.',
        tags: ['DAMAGE', 'THUNDER', 'AOE']
    },

    'Spike Growth': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '150 ft.',
        components: 'V, S, M (seven sharp thorns or seven small twigs)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        damageEffect: 'Piercing',
        description: 'The ground in a 20-foot radius centered on a point within range twists and sprouts hard spikes and thorns. The area becomes difficult terrain for the duration. When a creature moves into or within the area, it takes 2d4 piercing damage for every 5 feet it travels. The transformation of the ground is camouflaged to look natural. Any creature that can\'t see the area at the time the spell is cast must make a Wisdom (Perception) check against your spell save DC to recognize the terrain as hazardous before entering it.',
        tags: ['CONTROL', 'DAMAGE', 'TERRAIN']
    },

    'Spiritual Weapon': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: '60 ft.',
        components: 'V, S',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        attackSave: 'Melee Spell Attack',
        damageEffect: 'Force',
        description: 'You create a floating spectral weapon within range that lasts for the duration or until you cast this spell again. When you cast the spell, you can make a melee spell attack against a creature within 5 feet of the weapon. On a hit, the target takes force damage equal to 1d8 + your spellcasting ability modifier. As a bonus action on your turn, you can move the weapon up to 20 feet and repeat the attack against a creature within 5 feet of it. The weapon can take whatever form you choose.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd or 4th level, the damage increases by 1d8 for every two slot levels above 2nd. When you use a spell slot of 5th level or higher, the damage increases by 2d8 for every two slot levels above 4th.',
        tags: ['DAMAGE', 'FORCE', 'PERSISTENT']
    },

    'Suggestion': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, M (a snake\'s tongue and either a bit of honeycomb or a drop of sweet oil)',
        duration: 'Concentration, up to 8 hours',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You suggest a course of activity (limited to a sentence or two) and magically influence a creature you can see within range that can hear and understand you. Creatures that can\'t be charmed are immune to this effect. The suggestion must be worded in such a manner as to make the course of action sound reasonable. The target must make a Wisdom saving throw. On a failed save, it pursues the course of action you described to the best of its ability. The suggested course of action can continue for the entire duration. If the suggested activity can be completed in a shorter time, the spell ends when the subject finishes what it was asked to do.',
        tags: ['CONTROL', 'CHARM', 'SOCIAL']
    },

    // ── 3rd Level ───────────────────────────────────────────────────────────

    'Aura of Vitality': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        damageEffect: 'Healing',
        description: 'Healing energy radiates from you in an aura with a 30-foot radius. Until the spell ends, the aura moves with you, centered on you. You can use a bonus action to cause one creature in the aura (including you) to regain 2d6 hit points.',
        tags: ['HEALING', 'SUPPORT', 'AOE']
    },

    'Beacon of Hope': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'This spell bestows hope and vitality. Choose any number of creatures within range. For the duration, each target has advantage on Wisdom saving throws and death saving throws, and regains the maximum number of hit points possible from any healing.',
        tags: ['BUFF', 'SUPPORT', 'HEALING']
    },

    'Call Lightning': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Lightning',
        description: 'A storm cloud appears in the shape of a cylinder that is 10 feet tall with a 60-foot radius, centered on a point you can see within range above you. Until the spell ends, you can use your action to call down lightning in a 5-foot-radius, 40-foot-tall cylinder centered on a point beneath the cloud. Each creature in that cylinder must make a Dexterity saving throw. A creature takes 3d10 lightning damage on a failed save, or half as much on a successful one. On each of your turns until the spell ends, you can use your action to call down lightning again, targeting the same or a different point.',
        higherLevels: 'When you cast this spell using a spell slot of 4th or higher level, the damage increases by 1d10 for each slot level above 3rd.',
        tags: ['DAMAGE', 'LIGHTNING', 'STORM', 'AOE']
    },

    'Conjure Animals': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You summon fey spirits that take the form of beasts and appear in unoccupied spaces that you can see within range. Choose one of the following options for what appears: one beast of challenge rating 2 or lower, two beasts of challenge rating 1 or lower, four beasts of challenge rating 1/2 or lower, or eight beasts of challenge rating 1/4 or lower. Each beast is also considered fey, and it disappears when it drops to 0 hit points or when the spell ends.',
        higherLevels: 'When you cast this spell using certain higher-level spell slots, you choose one of the summoning options above, and more creatures appear: twice as many with a 5th-level slot, three times as many with a 7th-level slot, and four times as many with a 9th-level slot.',
        tags: ['SUMMON', 'COMBAT', 'CONTROL']
    },

    'Counterspell': {
        school: 'Abjuration',
        castingTime: '1 reaction (when you see a creature casting a spell)',
        range: '60 ft.',
        components: 'S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell\'s level. On a success, the creature\'s spell fails and has no effect.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.',
        tags: ['DEFENSIVE', 'REACTIVE', 'COUNTER']
    },

    "Crusader's Mantle": {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        damageEffect: 'Radiant',
        description: 'Holy power radiates from you in an aura with a 30-foot radius, awakening boldness in friendly creatures. Until the spell ends, the aura moves with you, centered on you. While in the aura, each nonhostile creature in the aura (including you) deals an extra 1d4 radiant damage when it hits with a weapon attack.',
        tags: ['BUFF', 'RADIANT', 'AOE']
    },

    'Dispel Magic': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Choose any creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check using your spellcasting ability. The DC equals 10 + the spell\'s level. On a successful check, the spell ends.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, you automatically end the effects of a spell on the target if the spell\'s level is equal to or less than the level of the spell slot you used.',
        tags: ['UTILITY', 'COUNTER', 'SUPPORT']
    },

    'Fear': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self (30-ft. cone)',
        components: 'V, S, M (a white feather or the heart of a hen)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You project a phantasmal image of a creature\'s worst fears. Each creature in a 30-foot cone must succeed on a Wisdom saving throw or become frightened for the duration. While frightened by this spell, a creature must take the Dash action and move away from you by the safest available route on each of its turns, unless there is nowhere to move. If the creature ends its turn in a location where it doesn\'t have line of sight to you, the creature can make a Wisdom saving throw, ending the effect on itself on a success.',
        tags: ['CONTROL', 'FEAR', 'AOE']
    },

    'Fireball': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 ft.',
        components: 'V, S, M (a tiny ball of bat guano and sulfur)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire',
        description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren\'t being worn or carried.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
        tags: ['DAMAGE', 'FIRE', 'AOE', 'CLASSIC']
    },

    'Fly': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a wing feather from any bird)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd.',
        tags: ['MOVEMENT', 'FLIGHT', 'BUFF']
    },

    'Hypnotic Pattern': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'S, M (a glowing stick of incense or a crystal vial filled with phosphorescent material)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You create a twisting pattern of colors that weaves through the air inside a 30-foot cube within range. The pattern appears for a moment and vanishes. Each creature in the area who sees the pattern must make a Wisdom saving throw. On a failed save, the creature becomes charmed for the duration. While charmed by this spell, the creature is incapacitated and has a speed of 0. The spell ends for an affected creature if it takes any damage or if someone else uses an action to shake the creature out of its stupor.',
        tags: ['CONTROL', 'INCAPACITATE', 'AOE', 'CHARM']
    },

    'Lightning Arrow': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V, S',
        duration: 'Concentration, up to 1 round',
        concentration: true,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Lightning',
        description: 'The next time you make a ranged weapon attack during the spell\'s duration, the weapon\'s ammunition, or the weapon itself if it\'s a thrown weapon, transforms into a bolt of lightning. Make the attack roll as normal. The target takes 4d8 lightning damage on a hit, or half as much damage on a miss, instead of the weapon\'s normal damage. Whether you hit or miss, each creature within 10 feet of the target must make a Dexterity saving throw. Each of these creatures takes 2d8 lightning damage on a failed save, or half as much on a successful one. The piece of ammunition or weapon then returns to its normal form.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage for both effects of the spell increases by 1d8 for each slot level above 3rd.',
        tags: ['DAMAGE', 'LIGHTNING', 'RANGED', 'AOE']
    },

    'Plant Growth': {
        school: 'Transmutation',
        castingTime: '1 action or 8 hours',
        range: '150 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'This spell channels vitality into plants within a specific area. There are two possible uses for the spell. If you cast it using 1 action, choose a point within range. All normal plants in a 100-foot radius centered on that point become thick and overgrown. A creature moving through the area must spend 4 feet of movement for every 1 foot it moves. You can exclude one or more areas of any size within the spell\'s area from being affected. If you cast it over 8 hours, you enrich the land. All plants in a half-mile radius centered on a point within range become enriched for 1 year. The plants yield twice the normal amount of food when harvested.',
        tags: ['CONTROL', 'TERRAIN', 'UTILITY', 'NATURE']
    },

    'Revivify': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (diamonds worth 300 gp, which the spell consumes)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'You touch a creature that has died within the last minute. That creature returns to life with 1 hit point. This spell can\'t return to life a creature that has died of old age, nor can it restore any missing body parts.',
        tags: ['HEALING', 'RESURRECTION', 'SUPPORT']
    },

    'Create Food and Water': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You create 45 pounds of food and 30 gallons of fresh water on the ground or in containers within range, enough to sustain up to fifteen humanoids or five steeds for 24 hours. The food is bland but nourishing and spoils if uneaten after 24 hours.',
        tags: ['UTILITY', 'SURVIVAL', 'CONJURATION']
    },

    'Daylight': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'A 60-foot-radius sphere of bright light spreads out from a point you choose within range. The sphere sheds bright light for an additional 60 feet. If you chose a point on an object you are holding or one that isn\'t being worn or carried, the light shines from the object and moves with it. Covering the source with an opaque object blocks the light.',
        tags: ['LIGHT', 'UTILITY', 'RADIANT']
    },

    'Magic Circle': {
        school: 'Abjuration',
        castingTime: '1 minute',
        range: '10 ft.',
        components: 'V, S, M (holy water or powdered silver and iron worth at least 100 gp, consumed)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You create a 10-foot-radius, 20-foot-tall cylinder of magical energy centered on a point on the ground that you can see within range. Choose one or more creature types: Celestials, Elementals, Fey, Fiends, or Undead. The circle affects a creature of the chosen type in several ways, preventing voluntary entry or escape depending on orientation and imposing disadvantage on its attacks against targets inside.',
        tags: ['WARD', 'CONTROL', 'ABJURATION']
    },

    'Remove Curse': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'At your touch, all curses affecting one creature or object end. If the object is a cursed magic item, its curse remains, but the spell breaks its owner\'s attunement to the object so it can be removed or discarded.',
        tags: ['CLEANSE', 'UTILITY', 'ABJURATION']
    },

    'Spirit Guardians': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Self (15-ft. radius)',
        components: 'V, S, M (a holy symbol)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        damageEffect: 'Radiant or Necrotic',
        description: 'You call forth spirits to protect you. They flit around you to a distance of 15 feet for the duration. If you are good or neutral, their spectral form appears angelic or fey (your choice). If you are evil, they appear fiendish. When you cast this spell, you can designate any number of creatures you can see to be unaffected by it. An affected creature\'s speed is halved in the area, and when the creature enters the area for the first time on a turn or starts its turn there, it must make a Wisdom saving throw. On a failed save, the creature takes 3d8 radiant damage (if you are good or neutral) or 3d8 necrotic damage (if you are evil). On a successful save, the creature takes half as much damage.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d8 for each slot level above 3rd.',
        tags: ['DAMAGE', 'RADIANT', 'NECROTIC', 'AOE', 'PERSISTENT']
    },

    // ── 4th Level ───────────────────────────────────────────────────────────

    'Aura of Life': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Life-preserving energy radiates from you in an aura with a 30-foot radius. Until the spell ends, the aura moves with you, centered on you. Each nonhostile creature in the aura (including you) has resistance to necrotic damage, and its hit point maximum can\'t be reduced. In addition, a nonhostile, living creature regains 1 hit point when it starts its turn in the aura with 0 hit points.',
        tags: ['BUFF', 'AURA', 'DEFENSIVE', 'HEALING']
    },

    'Banishment': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (an item distasteful to the target)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'CHA Save',
        description: 'You attempt to send one creature that you can see within range to another plane of existence. The target must succeed on a Charisma saving throw or be banished. If the target is native to the plane of existence you\'re on, the target is sent to a harmless demiplane. While there, the target is incapacitated. The target remains there until the spell ends, at which point the target reappears in the space it left or in the nearest unoccupied space if that space is occupied. If the target is native to a different plane of existence than the one you\'re on, the target is sent to its home plane of existence.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level or higher, you can target one additional creature for each slot level above 4th.',
        tags: ['CONTROL', 'BANISH']
    },

    'Death Ward': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You touch a creature and grant it a measure of protection from death. The first time the target would drop to 0 hit points as a result of taking damage, the target instead drops to 1 hit point, and the spell ends. If the spell is still in effect when the target is subjected to an effect that would kill it instantaneously without dealing damage, that effect is instead negated against the target, and the spell ends.',
        tags: ['DEFENSIVE', 'PROTECTION', 'BUFF']
    },

    'Locate Creature': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (a bit of fur from a bloodhound)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'Describe or name a creature that is familiar to you. You sense the direction to the creature\'s location, as long as that creature is within 1,000 feet of you. If the creature is moving, you know the direction of its movement. The spell can locate a specific known creature or the nearest creature of a particular kind.',
        tags: ['DETECTION', 'TRACKING', 'DIVINATION']
    },

    'Dimension Door': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '500 ft.',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You teleport yourself from your current location to any other spot within range. You arrive at exactly the spot desired. It can be a place you can see, one you can visualize, or one you can describe by stating distance and direction, such as "200 feet straight downward" or "upward to the northwest at a 45-degree angle, 300 feet." You can bring along objects as long as their weight doesn\'t exceed what you can carry. You can also bring one willing creature of your size or smaller who is carrying gear up to its carrying capacity. If you arrive in a place already occupied by an object or a creature, you and any creature traveling with you each take 4d6 force damage, and the spell fails to teleport you.',
        tags: ['MOVEMENT', 'TELEPORTATION', 'ESCAPE']
    },

    'Freedom of Movement': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a leather strap, bound around the arm or a similar appendage)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch a willing creature. For the duration, the target\'s movement is unaffected by difficult terrain, and spells and other magical effects can neither reduce the target\'s speed nor cause the target to be paralyzed or restrained. The target can also spend 5 feet of movement to automatically escape from nonmagical restraints, such as manacles or a creature that has it grappled. Finally, being underwater imposes no penalties on the target\'s movement or attacks.',
        tags: ['BUFF', 'MOVEMENT', 'UTILITY']
    },

    'Greater Invisibility': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You or a creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target\'s person. Unlike regular invisibility, this spell does not end when the target attacks or casts a spell.',
        tags: ['STEALTH', 'BUFF', 'OFFENSIVE']
    },

    'Guardian of Faith': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '30 ft.',
        components: 'V',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Radiant',
        description: 'A Large spectral guardian appears and hovers for the duration in an unoccupied space of your choice that you can see within range. The guardian occupies that space and is indistinct except for a gleaming sword and shield emblazoned with the symbol of your deity. Any creature hostile to you that moves to a space within 10 feet of the guardian for the first time on a turn must succeed on a Dexterity saving throw. The creature takes 20 radiant damage on a failed save, or half as much on a successful one. The guardian vanishes when it has dealt a total of 60 damage.',
        tags: ['DAMAGE', 'RADIANT', 'PERSISTENT', 'DEFENSIVE']
    },

    'Guardian of Nature': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A nature spirit answers your call and transforms you into a powerful guardian. The transformation lasts until the spell ends. You choose one of the following forms to assume — Primal Beast or Great Tree. Primal Beast: Your size becomes Large. You gain a swimming speed of 20 ft and a climbing speed of 20 ft. All attack rolls made with natural weapons or unarmed strikes have advantage. Great Tree: Your walking speed increases by 10 ft. You have advantage on Constitution saving throws. You can cast Constitution spell without material components. Attacks of opportunity against you have disadvantage.',
        tags: ['TRANSFORMATION', 'BUFF', 'NATURE']
    },

    'Polymorph': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a caterpillar cocoon)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom saving throw to avoid the effect. The spell has no effect on a shapechanger or a creature with 0 hit points. The transformation lasts for the duration, or until the target drops to 0 hit points or dies. The new form can be any beast whose challenge rating is equal to or less than the target\'s (or the target\'s level, if it doesn\'t have a challenge rating).',
        tags: ['CONTROL', 'TRANSFORMATION', 'UTILITY']
    },

    'Shadow of Moil': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (an undead eyeball encased in a gem worth at least 150 gp)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        damageEffect: 'Necrotic',
        description: 'Flame-like shadows wreathe your body until the spell ends, causing you to become heavily obscured to others. The shadows turn dim light within 10 feet of you into darkness, and bright light in the same area to dim light. Until the spell ends, you have resistance to radiant damage. In addition, whenever a creature within 10 feet of you hits you with an attack, the shadows lash out at that creature, dealing it 2d8 necrotic damage.',
        tags: ['DEFENSIVE', 'DAMAGE', 'NECROTIC', 'STEALTH']
    },

    'Stone Shape': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (soft clay, which must be worked into roughly the desired shape of the stone object)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You touch a stone object of Medium size or smaller or a section of stone no more than 5 feet in any dimension and form it into any shape that suits your purpose. So, for example, you could shape a large rock into a weapon, idol, or coffer, or make a small passage through a wall, as long as the wall is less than 5 feet thick. You could also shape a stone door or its frame to seal the door shut.',
        tags: ['UTILITY', 'CRAFTING', 'EXPLORATION']
    },

    'Wall of Fire': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S, M (a small piece of phosphorus)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire',
        description: 'You create a wall of fire on a solid surface within range. The wall can be up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick. The wall is opaque and lasts for the duration. When the wall appears, each creature within its area must make a Dexterity saving throw. On a failed save, a creature takes 5d8 fire damage, or half as much on a successful save. One side of the wall, selected by you when you cast this spell, deals 5d8 fire damage to each creature that ends its turn within 10 feet of that side or inside the wall.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level or higher, the damage increases by 1d8 for each slot level above 4th.',
        tags: ['DAMAGE', 'FIRE', 'CONTROL', 'AOE']
    },

    // ── 5th Level ───────────────────────────────────────────────────────────

    'Animate Objects': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Objects come to life at your command. Choose up to ten nonmagical objects within range that are not being worn or carried. Medium targets count as two objects, Large targets count as four objects, Huge targets count as eight objects. You can\'t animate any object larger than Huge. Each target animates and becomes a creature under your control until the spell ends or until reduced to 0 hit points. As a bonus action, you can mentally command any creature you made with this spell if the creature is within 500 feet of you. They obey any commands you issue.',
        higherLevels: 'If you cast this spell using a spell slot of 6th level or higher, you can animate two additional objects for each slot level above 5th.',
        tags: ['SUMMON', 'CONTROL', 'COMBAT']
    },

    'Circle of Power': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Divine energy radiates from you, distorting and diffusing magical energy within 30 feet of you. Until the spell ends, the sphere moves with you, centered on you. For the duration, each friendly creature in the area (including you) has advantage on saving throws against spells and other magical effects. Additionally, when an affected creature succeeds on a saving throw made against a spell or magical effect that allows it to make a saving throw to take only half damage, it instead takes no damage if it succeeds.',
        tags: ['BUFF', 'DEFENSIVE', 'AOE', 'AURA']
    },

    'Cone of Cold': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (60-ft. cone)',
        components: 'V, S, M (a small crystal or glass cone)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Cold',
        description: 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw. A creature takes 8d8 cold damage on a failed save, or half as much on a successful one. A creature killed by this spell becomes a frozen statue until it thaws.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th.',
        tags: ['DAMAGE', 'COLD', 'AOE']
    },

    'Conjure Volley': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '150 ft.',
        components: 'V, S, M (one piece of ammunition or one thrown weapon)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        description: 'You fire a piece of nonmagical ammunition from a ranged weapon or throw a nonmagical weapon into the air and choose a point within range. Hundreds of duplicates of the ammunition or weapon fall in a volley from above and then disappear. Each creature in a 40-foot-radius, 20-foot-high cylinder centered on that point must make a Dexterity saving throw. A creature takes 8d8 damage on a failed save using the same damage type as the ammunition or weapon. On a successful save, a creature takes half as much damage.',
        tags: ['DAMAGE', 'RANGED', 'AOE']
    },

    'Destructive Wave': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'CON Save',
        damageEffect: 'Thunder and Radiant or Necrotic',
        description: 'You strike the ground, creating a burst of divine energy that ripples outward from you. Each creature you choose within 30 feet of you must succeed on a Constitution saving throw or take 5d6 thunder damage, as well as 5d6 radiant or necrotic damage (your choice), and be knocked prone. A creature that succeeds on its saving throw takes half as much damage and isn\'t knocked prone.',
        tags: ['DAMAGE', 'THUNDER', 'AOE', 'CONTROL']
    },

    'Flame Strike': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (pinch of sulfur)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire and Radiant',
        description: 'A vertical column of divine fire roars down from the heavens in a location you specify. Each creature in a 10-foot-radius, 40-foot-high cylinder centered on a point within range must make a Dexterity saving throw. A creature takes 4d6 fire damage and 4d6 radiant damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the fire damage or the radiant damage (your choice) increases by 1d6 for each slot level above 5th.',
        tags: ['DAMAGE', 'FIRE', 'RADIANT', 'AOE']
    },

    'Greater Restoration': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (diamond dust worth at least 100 gp, which the spell consumes)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You imbue a creature you touch with positive energy to undo a debilitating effect. You can reduce the target\'s exhaustion level by one, or end one of the following effects on the target: one effect that charmed or petrified the target; one curse, including the target\'s attunement to a cursed magic item; any reduction to one of the target\'s ability scores; or one effect reducing the target\'s hit point maximum.',
        tags: ['HEALING', 'SUPPORT', 'CLEANSE']
    },

    'Dispel Evil and Good': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (holy water or powdered silver and iron)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Shimmering energy surrounds and protects you from fey, undead, and creatures originating from beyond the Material Plane. For the duration, Celestials, Elementals, Fey, Fiends, and Undead have disadvantage on attack rolls against you. You can also use special dismissal and break-enchantment actions while the spell lasts.',
        tags: ['WARD', 'DEFENSIVE', 'ABJURATION']
    },

    'Geas': {
        school: 'Enchantment',
        castingTime: '1 minute',
        range: '60 ft.',
        components: 'V',
        duration: '30 days',
        concentration: false,
        ritual: false,
        attackSave: 'WIS Save',
        damageEffect: 'Psychic',
        description: 'You place a magical command on a creature that you can see within range, forcing it to carry out some service or refrain from some action or course of activity as you decide. If the creature can understand you, it must succeed on a Wisdom saving throw or become Charmed by you for the duration. Whenever it acts contrary to your instructions, it takes 5d10 psychic damage once each day.',
        higherLevels: 'When you cast this spell using a 7th- or 8th-level slot, the duration becomes 1 year. When you cast it using a 9th-level slot, the spell lasts until it is ended by remove curse, greater restoration, or wish.',
        tags: ['CONTROL', 'CHARM', 'PSYCHIC']
    },

    'Hold Monster': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '90 ft.',
        components: 'V, S, M (a small, straight piece of iron)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'Choose a creature that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. This spell has no effect on undead. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, you can target one additional creature for each slot level above 5th. The creatures must be within 30 feet of each other when you target them.',
        tags: ['CONTROL', 'PARALYZE']
    },

    'Mass Cure Wounds': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'A wave of healing energy washes out from a point of your choice within range. Choose up to six creatures in a 30-foot-radius sphere centered on that point. Each target regains hit points equal to 3d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the healing increases by 1d8 for each slot level above 5th.',
        tags: ['HEALING', 'SUPPORT', 'GROUP', 'AOE']
    },

    'Raise Dead': {
        school: 'Necromancy',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (a diamond worth at least 500 gp, which the spell consumes)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'You return a dead creature you touch to life, provided that it has been dead no longer than 10 days. If the creature\'s soul is both willing and at liberty to rejoin the body, the creature returns to life with 1 hit point. This spell also neutralizes any poisons and cures nonmagical diseases that affected the creature at the time it died. This spell doesn\'t remove magical diseases, curses, or similar effects; if these aren\'t first removed prior to casting the spell, they take effect when the creature returns to life. The spell can\'t return an undead creature to life.',
        tags: ['HEALING', 'RESURRECTION', 'SUPPORT']
    },

    'Swift Quiver': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Touch',
        components: 'V, S, M (a quiver containing at least one piece of ammunition)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You transmute your quiver so it produces an endless supply of nonmagical ammunition, which seems to leap into your hand when you reach for it. On each of your turns until the spell ends, you can use a bonus action to make two attacks with a weapon that uses ammunition from the quiver. Each time you make such a ranged attack, your quiver magically replaces the piece of ammunition you used, so you always have ammunition available as long as the quiver can hold it.',
        tags: ['BUFF', 'RANGED', 'COMBAT']
    },

    'Synaptic Static': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'INT Save',
        damageEffect: 'Psychic',
        description: 'You choose a point within range and cause psychic energy to explode there. Each creature in a 20-foot-radius sphere centered on that point must make an Intelligence saving throw. A creature with an Intelligence score of 2 or lower can\'t be affected by this spell. A target takes 8d6 psychic damage on a failed save, or half as much on a successful one. On a failed save, the target also has muddled thoughts for 1 minute. During that time, it rolls a d6 and subtracts the number rolled from all its attack rolls and ability checks, as well as its Constitution saving throws to maintain concentration. The target can make an Intelligence saving throw at the end of each of its turns, ending the effect on itself on a success.',
        tags: ['DAMAGE', 'PSYCHIC', 'DEBUFF', 'AOE']
    },

    'Tree Stride': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You gain the ability to enter a tree and move from inside it to inside another tree of the same kind within 500 feet. Both trees must be living and at least the same size as you. You must use 5 feet of movement to enter a tree. You instantly know the location of all other trees of the same kind within 500 feet and, as part of the move used to enter the tree, can either pass into one of those trees or step out of the tree you\'re in.',
        tags: ['MOVEMENT', 'TELEPORTATION', 'NATURE']
    },

    'Wall of Force': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 ft.',
        components: 'V, S, M (a pinch of powder made by crushing a clear gemstone)',
        duration: 'Concentration, up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'An invisible wall of force springs into existence at a point you choose within range. The wall appears in any orientation you choose, as a horizontal or vertical barrier or at an angle. It can be free-floating or resting on a solid surface. You can form it into a hemispherical dome or a sphere with a radius of up to 10 feet, or you can shape a flat surface made up of ten 10-foot-by-10-foot panels. Each panel must be contiguous with another panel. In any form, the wall is 1/4 inch thick. It lasts for the duration. The wall is immune to all damage and can\'t be dispelled by dispel magic. A disintegrate spell destroys the wall instantly.',
        tags: ['CONTROL', 'BARRIER', 'DEFENSIVE']
    },

    // ── 6th Level ───────────────────────────────────────────────────────────

    'Chain Lightning': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 ft.',
        components: 'V, S, M (a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Lightning',
        description: 'You create a bolt of lightning that arcs toward a target of your choice that you can see within range. Three bolts then leap from that target to as many as three other targets, each of which must be within 30 feet of the first target. A target can be a creature or an object and can be targeted by only one of the bolts. A target must make a Dexterity saving throw. The target takes 10d8 lightning damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, one additional bolt leaps from the first target to another target for each slot level above 6th.',
        tags: ['DAMAGE', 'LIGHTNING', 'AOE']
    },

    'Disintegrate': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S, M (a lodestone and a pinch of dust)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Force',
        description: 'A thin green ray springs from your pointing finger to a target you designate within range. The target can be a creature, an object, or a creation of magical force, such as the wall created by wall of force. A creature targeted by this spell must make a Dexterity saving throw. On a failed save, the target takes 10d6 + 40 force damage. The target is disintegrated if this damage leaves it with 0 hit points. A disintegrated creature and everything it is wearing and carrying are reduced to a pile of fine gray dust. The creature can be restored to life only by means of a true resurrection or a wish spell.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the damage increases by 3d6 for each slot level above 6th.',
        tags: ['DAMAGE', 'FORCE', 'DESTRUCTIVE']
    },

    'Globe of Invulnerability': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self (10-ft. radius)',
        components: 'V, S, M (a glass or crystal bead that shatters when the spell ends)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'An immobile, faintly shimmering barrier springs into existence in a 10-foot radius around you and remains for the duration. Any spell of 5th level or lower cast from outside the barrier can\'t affect creatures or objects within it, even if the spell is cast using a higher level spell slot. Such a spell can target creatures and objects within the barrier, but the spell has no effect on them. Similarly, the area within the barrier is excluded from the areas affected by such spells.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the barrier blocks spells of one level higher for each slot level above 6th.',
        tags: ['DEFENSIVE', 'BARRIER', 'AOE']
    },

    'Heal': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'Choose a creature that you can see within range. A surge of positive energy washes through the creature, causing it to regain 70 hit points. This spell also ends blindness, deafness, and any diseases affecting the target. This spell has no effect on constructs or undead.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the amount of healing increases by 10 for each slot level above 6th.',
        tags: ['HEALING', 'SUPPORT', 'CLEANSE']
    },

    'Mass Suggestion': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, M (a snake\'s tongue and either a bit of honeycomb or a drop of sweet oil)',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        attackSave: 'WIS Save',
        description: 'You suggest a course of activity (limited to a sentence or two) and magically influence up to twelve creatures of your choice that you can see within range and that can hear and understand you. Creatures that can\'t be charmed are immune to this effect. The suggestion must be worded in such a manner as to make the course of action sound reasonable. Each target must make a Wisdom saving throw. On a failed save, it pursues the course of action you described to the best of its ability for the duration. The suggested course of action can continue for the entire duration.',
        higherLevels: 'When you cast this spell using a 7th-level spell slot, the duration is 10 days. With an 8th-level slot, the duration is 30 days. With a 9th-level slot, the duration is a year and a day.',
        tags: ['CONTROL', 'CHARM', 'SOCIAL', 'AOE']
    },

    // ── 7th Level ───────────────────────────────────────────────────────────

    'Fire Storm': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire',
        description: 'A storm made up of sheets of roaring flame appears in a location you choose within range. The area of the storm consists of up to ten 10-foot cubes, which you can arrange as you wish. Each cube must have at least one face adjacent to the face of another cube. Each creature in the area must make a Dexterity saving throw. It takes 7d10 fire damage on a failed save, or half as much on a successful one. The fire damages objects in the area and ignites flammable objects that aren\'t being worn or carried. If you choose, plant life in the area is unaffected by this spell.',
        tags: ['DAMAGE', 'FIRE', 'AOE']
    },

    'Forcecage': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '100 ft.',
        components: 'V, S, M (ruby dust worth 1,500 gp)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'An immobile, invisible, cube-shaped prison composed of magical force springs into existence around an area you choose within range. The prison can be a cage or a solid box, as you choose. A prison in the shape of a cage can be up to 20 feet on a side and is made from 1/2-inch diameter bars spaced 1/2 inch apart. A prison in the shape of a box can be up to 10 feet on a side, creating a solid barrier that prevents any matter from passing through it. When you cast the spell, any creature that is completely inside the cage\'s area is trapped. Creatures only partially inside are pushed outside the cage. A creature inside the cage can\'t leave it by nonmagical means.',
        tags: ['CONTROL', 'TRAP', 'IMPRISONMENT']
    },

    'Plane Shift': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (a forked, metal rod worth at least 250 gp, attuned to a specific plane of existence)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'CHA Save',
        description: 'You and up to eight willing creatures who link hands in a circle are transported to a different plane of existence. You can specify a target destination in general terms, such as the City of Brass on the Elemental Plane of Fire or the palace of Dispater on the second level of the Nine Hells, and you appear in or near that destination. Alternatively, if you know the sigil sequence of a teleportation circle on another plane of existence, you can use that circle as your destination. As an action, you can use the rod to banish an unwilling creature you touch, sending it to the plane of existence it is attuned to.',
        tags: ['PLANAR', 'BANISH', 'TRANSPORT']
    },

    'Resurrection': {
        school: 'Necromancy',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (a diamond worth at least 1,000 gp, which the spell consumes)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'You touch a dead creature that has been dead for no more than a century, that didn\'t die of old age, and that isn\'t undead. If its soul is free and willing, the target returns to life with all its hit points. This spell neutralizes any poisons and cures normal diseases afflicting the creature when it died. It doesn\'t, however, remove magical diseases, curses, and the like; if such effects aren\'t removed prior to casting the spell, they afflict the target on its return to life. The spell closes all mortal wounds and restores any missing body parts.',
        tags: ['HEALING', 'RESURRECTION', 'SUPPORT']
    },

    // ── 8th Level ───────────────────────────────────────────────────────────

    'Earthquake': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '500 ft.',
        components: 'V, S, M (a pinch of dirt, a piece of rock, and a lump of clay)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        attackSave: 'DEX/CON/STR Save (varies)',
        description: 'You create a seismic disturbance at a point on the ground you can see within range. For the duration, an intense tremor rips through the ground in a 100-foot-radius circle centered on that point. Each creature on the ground in that area must make a Dexterity saving throw. On a failed save, the creature is knocked prone. The tremor creates difficult terrain for the duration. Additionally, concentration must be checked; creature can fall into sinkholes, and structures can collapse.',
        tags: ['DAMAGE', 'CONTROL', 'AOE', 'TERRAIN']
    },

    'Holy Aura': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self (30-ft. radius)',
        components: 'V, S, M (a tiny reliquary worth at least 1,000 gp containing a sacred relic)',
        duration: 'Concentration, up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Divine light washes out from you and coalesces in a soft radiance in a 30-foot radius around you. Creatures of your choice in that radius when you cast this spell shed dim light in a 5-foot radius and have advantage on all saving throws. Other creatures have disadvantage on attack rolls against them until the spell ends. In addition, when a fiend or an undead hits an affected creature with a melee attack, the aura flashes with brilliant light. The attacker must succeed on a Constitution saving throw or be blinded until the spell ends.',
        tags: ['BUFF', 'DEFENSIVE', 'AURA', 'AOE']
    },

    'Power Word Stun': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V',
        duration: 'Until ended by a saving throw',
        concentration: false,
        ritual: false,
        attackSave: 'CON Save (ongoing)',
        description: 'You speak a word of power that overwhelms the mind of one creature you can see within range, leaving it dumbfounded. If the target has 150 hit points or fewer, it is stunned. Otherwise, the spell has no effect. The stunned target must make a Constitution saving throw at the end of each of its turns. On a successful save, the stunning effect ends.',
        tags: ['CONTROL', 'STUN']
    },

    // ── 9th Level ───────────────────────────────────────────────────────────

    'Foresight': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'V, S, M (a hummingbird feather)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You touch a willing creature and bestow a limited ability to see into the immediate future. For the duration, the target can\'t be surprised and has advantage on attack rolls, ability checks, and saving throws. Additionally, other creatures have disadvantage on attack rolls against the target for the duration. This spell immediately ends if you cast it again before its duration ends.',
        tags: ['BUFF', 'DIVINATION', 'LONG DURATION']
    },

    'Mass Heal': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft.',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        damageEffect: 'Healing',
        description: 'A flood of healing energy flows from you into injured creatures around you. You restore up to 700 hit points, divided as you choose among any number of creatures that you can see within range. Creatures healed by this spell are also cured of all diseases and any effect making them blinded or deafened. This spell has no effect on undead or constructs.',
        tags: ['HEALING', 'SUPPORT', 'GROUP', 'AOE']
    },

    'Meteor Swarm': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '1 mile',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        attackSave: 'DEX Save',
        damageEffect: 'Fire and Bludgeoning',
        description: 'Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius sphere centered on each point you choose must make a Dexterity saving throw. The sphere spreads around corners. A creature takes 20d6 fire damage and 20d6 bludgeoning damage on a failed save, or half as much damage on a successful one. A creature in the area of more than one fiery burst is affected only once. The spell damages objects in the area and ignites flammable objects that aren\'t being worn or carried.',
        tags: ['DAMAGE', 'FIRE', 'AOE', 'DESTRUCTIVE']
    },

    'Shapechange': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (a jade circlet worth at least 1,500 gp)',
        duration: 'Concentration, up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You assume the form of a different creature for the duration. The new form can be of any creature with a challenge rating equal to your level or lower. The creature can\'t be a construct or an undead, and you must have seen the sort of creature at least once. You transform into an average example of that creature, one without any class levels or the Spellcasting trait. Your game statistics are replaced by the statistics of the chosen creature, though you retain your alignment and Intelligence, Wisdom, and Charisma scores.',
        tags: ['TRANSFORMATION', 'UTILITY', 'COMBAT']
    },

    'Wish': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in accord with your desires. The basic use of this spell is to duplicate any other spell of 8th level or lower. Alternatively, you can create one of the following effects of your choice: you create one object of up to 25,000 gp in value; you allow up to 20 creatures that you can see to regain all hit points and end all effects on them; you grant up to 10 creatures that you can see resistance to a damage type; you grant up to 10 creatures immunity to a single spell or other magical effect; you undo a single recent event. The DM might allow you to request a different effect, but the more powerful the wish, the more likely something goes wrong.',
        tags: ['LEGENDARY', 'UTILITY', 'REALITY']
    },

    // Auto-generated compendium coverage entries
    'Absorb Elements': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Absorb Elements is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Alarm': {
        school: 'Abjuration',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S, M (A tiny bell and a piece of fine silver wire.)',
        duration: '8 hours',
        concentration: false,
        ritual: true,
        description: 'You set an alarm against unwanted intrusion. Choose a door, a window, or an area within range that is no larger than a 20-foot cube. Until the spell ends, an alarm alerts you whenever a Tiny or larger creature touches or enters the warded area. When you cast the spell, you can designate creatures that won\'t set off the alarm. You also choose whether the alarm is mental or audible. A mental alarm alerts you with a ping in your mind if you are within 1 mile of the warded area. This ping awakens you if you are sleeping. An audible alarm produces the sound of a hand bell for 10 seconds within 60 feet.',
        tags: ['ABJURATION', 'RITUAL']
    },
    'Alter Self': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You assume a different form. When you cast the spell, choose one of the following options, the effects of which last for the duration of the spell. While the spell lasts, you can end one option as an action to gain the benefits of a different one. ***Aquatic Adaptation.*** You adapt your body to an aquatic environment, sprouting gills and growing webbing between your fingers. You can breathe underwater and gain a swimming speed equal to your walking speed. ***Change Appearance.*** You transform your appearance. You decide what you look like, including your height, weight, facial features, sound of your voice, hair length, coloration, and distinguishing characteristics, if any. You can make yourself appear as a member of another race, though none of your statistics change. You also can\'t appear as a creature of a different size than you, and your basic shape stays the same; if you\'re bipedal, you can\'t use this spell to become quadrupedal, for instance. At any time for the duration of the spell, you can use your action to change your appearance in this way again. ***Natural Weapons.*** You grow claws, fangs, spines, horns, or a different natural weapon of your choice. Your unarmed strikes deal 1d6 bludgeoning, piercing, or slashing damage, as appropriate to the natural weapon you chose, and you are proficient with your unarmed strikes. Finally, the natural weapon is magic and you have a +1 bonus to the attack and damage rolls you make using it.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Animal Friendship': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A morsel of food.)',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        description: 'This spell lets you convince a beast that you mean it no harm. Choose a beast that you can see within range. It must see and hear you. If the beast\'s Intelligence is 4 or higher, the spell fails. Otherwise, the beast must succeed on a wisdom saving throw or be charmed by you for the spell\'s duration. If you or one of your companions harms the target, the spells ends.',
        tags: ['ENCHANTMENT', 'SAVE']
    },
    'Animal Messenger': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A morsel of food.)',
        duration: '24 hours',
        concentration: false,
        ritual: true,
        description: 'By means of this spell, you use an animal to deliver a message. Choose a Tiny beast you can see within range, such as a squirrel, a blue jay, or a bat. You specify a location, which you must have visited, and a recipient who matches a general description, such as "a man or woman dressed in the uniform of the town guard" or "a red-haired dwarf wearing a pointed hat." You also speak a message of up to twenty-five words. The target beast travels for the duration of the spell toward the specified location, covering about 50 miles per 24 hours for a flying messenger, or 25 miles for other animals. When the messenger arrives, it delivers your message to the creature that you described, replicating the sound of your voice. The messenger speaks only to a creature matching the description you gave. If the messenger doesn\'t reach its destination before the spell ends, the message is lost, and the beast makes its way back to where you cast this spell.',
        higherLevels: 'If you cast this spell using a spell slot of 3nd level or higher, the duration of the spell increases by 48 hours for each slot level above 2nd.',
        tags: ['ENCHANTMENT', 'RITUAL', 'UTILITY']
    },
    'Animal Shapes': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: 'Up to 24 hours',
        concentration: true,
        ritual: false,
        description: 'Your magic turns others into beasts. Choose any number of willing creatures that you can see within range. You transform each target into the form of a Large or smaller beast with a challenge rating of 4 or lower. On subsequent turns, you can use your action to transform affected creatures into new forms. The transformation lasts for the duration for each target, or until the target drops to 0 hit points or dies. You can choose a different form for each target. A target\'s game statistics are replaced by the statistics of the chosen beast, though the target retains its alignment and Intelligence, Wisdom, and Charisma scores. The target assumes the hit points of its new form, and when it reverts to its normal form, it returns to the number of hit points it had before it transformed. If it reverts as a result of dropping to 0 hit points, any excess damage carries over to its normal form. As long as the excess damage doesn\'t reduce the creature\'s normal form to 0 hit points, it isn\'t knocked unconscious. The creature is limited in the actions it can perform by the nature of its new form, and it can\'t speak or cast spells. The target\'s gear melds into the new form. The target can\'t activate, wield, or otherwise benefit from any of its equipment.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'DAMAGE']
    },
    'Animate Dead': {
        school: 'Necromancy',
        castingTime: '1 minute',
        range: '10 feet',
        components: 'V, S, M (A drop of blood, a piece of flesh, and a pinch of bone dust.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'This spell creates an undead servant. Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature. The target becomes a skeleton if you chose bones or a zombie if you chose a corpse (the GM has the creature\'s game statistics). On each of your turns, you can use a bonus action to mentally command any creature you made with this spell if the creature is within 60 feet of you (if you control multiple creatures, you can command any or all of them at the same time, issuing the same command to each one). You decide what action the creature will take and where it will move during its next turn, or you can issue a general command, such as to guard a particular chamber or corridor. If you issue no commands, the creature only defends itself against hostile creatures. Once given an order, the creature continues to follow it until its task is complete. The creature is under your control for 24 hours, after which it stops obeying any command you\'ve given it. To maintain control of the creature for another 24 hours, you must cast this spell on the creature again before the current 24-hour period ends. This use of the spell reasserts your control over up to four creatures you have animated with this spell, rather than animating a new one.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, you animate or reassert control over two additional undead creatures for each slot level above 3rd. Each of the creatures must come from a different corpse or pile of bones.',
        tags: ['NECROMANCY', 'UTILITY']
    },
    'Antilife Shell': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'A shimmering barrier extends out from you in a 10-foot radius and moves with you, remaining centered on you and hedging out creatures other than undead and constructs. The barrier lasts for the duration. The barrier prevents an affected creature from passing or reaching through. An affected creature can cast spells or make attacks with ranged or reach weapons through the barrier. If you move so that an affected creature is forced to pass through the barrier, the spell ends.',
        tags: ['ABJURATION', 'CONCENTRATION', 'DAMAGE', 'UTILITY']
    },
    'Antimagic Field': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A pinch of powdered iron or iron filings.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'A 10-foot-radius invisible sphere of antimagic surrounds you. This area is divorced from the magical energy that suffuses the multiverse. Within the sphere, spells can\'t be cast, summoned creatures disappear, and even magic items become mundane. Until the spell ends, the sphere moves with you, centered on you. Spells and other magical effects, except those created by an artifact or a deity, are suppressed in the sphere and can\'t protrude into it. A slot expended to cast a suppressed spell is consumed. While an effect is suppressed, it doesn\'t function, but the time it spends suppressed counts against its duration. ***Targeted Effects.*** Spells and other magical effects, such as magic missile and charm person, that target a creature or an object in the sphere have no effect on that target. ***Areas of Magic.*** The area of another spell or magical effect, such as fireball, can\'t extend into the sphere. If the sphere overlaps an area of magic, the part of the area that is covered by the sphere is suppressed. For example, the flames created by a wall of fire are suppressed within the sphere, creating a gap in the wall if the overlap is large enough. ***Spells.*** Any active spell or other magical effect on a creature or an object in the sphere is suppressed while the creature or object is in it. ***Magic Items.*** The properties and powers of magic items are suppressed in the sphere. For example, a +1 longsword in the sphere functions as a nonmagical longsword. A magic weapon\'s properties and powers are suppressed if it is used against a target in the sphere or wielded by an attacker in the sphere. If a magic weapon or a piece of magic ammunition fully leaves the sphere (for example, if you fire a magic arrow or throw a magic spear at a target outside the sphere), the magic of the item ceases to be suppressed as soon as it exits. ***Magical Travel.*** Teleportation and planar travel fail to work in the sphere, whether the sphere is the destination or the departure point for such magical travel. A portal to another location, world, or plane of existence, as well as an opening to an extradimensional space such as that created by the rope trick spell, temporarily closes while in the sphere. ***Creatures and Objects.*** A creature or object summoned or created by magic temporarily winks out of existence in the sphere. Such a creature instantly reappears once the space the creature occupied is no longer within the sphere. ***Dispel Magic.*** Spells and magical effects such as dispel magic have no effect on the sphere. Likewise, the spheres created by different antimagic field spells don\'t nullify each other.',
        tags: ['ABJURATION', 'CONCENTRATION', 'DAMAGE', 'SUMMONING', 'UTILITY']
    },
    'Antipathy/Sympathy': {
        school: 'Enchantment',
        castingTime: '1 hour',
        range: '60 feet',
        components: 'V, S, M (Either a lump of alum soaked in vinegar for the antipathy effect or a drop of honey for the sympathy effect.)',
        duration: '10 days',
        concentration: false,
        ritual: false,
        description: 'This spell attracts or repels creatures of your choice. You target something within range, either a Huge or smaller object or creature or an area that is no larger than a 200-foot cube. Then specify a kind of intelligent creature, such as red dragons, goblins, or vampires. You invest the target with an aura that either attracts or repels the specified creatures for the duration. Choose antipathy or sympathy as the aura\'s effect. ***Antipathy.*** The enchantment causes creatures of the kind you designated to feel an intense urge to leave the area and avoid the target. When such a creature can see the target or comes within 60 feet of it, the creature must succeed on a wisdom saving throw or become frightened. The creature remains frightened while it can see the target or is within 60 feet of it. While frightened by the target, the creature must use its movement to move to the nearest safe spot from which it can\'t see the target. If the creature moves more than 60 feet from the target and can\'t see it, the creature is no longer frightened, but the creature becomes frightened again if it regains sight of the target or moves within 60 feet of it. ***Sympathy.*** The enchantment causes the specified creatures to feel an intense urge to approach the target while within 60 feet of it or able to see it. When such a creature can see the target or comes within 60 feet of it, the creature must succeed on a wisdom saving throw or use its movement on each of its turns to enter the area or move within reach of the target. When the creature has done so, it can\'t willingly move away from the target. If the target damages or otherwise harms an affected creature, the affected creature can make a wisdom saving throw to end the effect, as described below. ***Ending the Effect.*** If an affected creature ends its turn while not within 60 feet of the target or able to see it, the creature makes a wisdom saving throw. On a successful save, the creature is no longer affected by the target and recognizes the feeling of repugnance or attraction as magical. In addition, a creature affected by the spell is allowed another wisdom saving throw every 24 hours while the spell persists. A creature that successfully saves against this effect is immune to it for 1 minute, after which time it can be affected again.',
        tags: ['ENCHANTMENT', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Arcane Eye': {
        school: 'Divination',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A bit of bat fur.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You create an invisible, magical eye within range that hovers in the air for the duration. You mentally receive visual information from the eye, which has normal vision and darkvision out to 30 feet. The eye can look in every direction. As an action, you can move the eye up to 30 feet in any direction. There is no limit to how far away from you the eye can move, but it can\'t enter another plane of existence. A solid barrier blocks the eye\'s movement, but the eye can pass through an opening as small as 1 inch in diameter.',
        tags: ['DIVINATION', 'CONCENTRATION', 'UTILITY']
    },
    'Arcane Gate': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Arcane Gate is a 6-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Arcane Vigor': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Arcane Vigor is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Astral Projection': {
        school: 'Necromancy',
        castingTime: '1 hour',
        range: '10 feet',
        components: 'V, S, M (For each creature you affect with this spell, you must provide one jacinth worth at least 1,000gp and one ornately carved bar of silver worth at least 100gp, all of which the spell consumes.)',
        duration: 'Special',
        concentration: false,
        ritual: false,
        description: 'You and up to eight willing creatures within range project your astral bodies into the Astral Plane (the spell fails and the casting is wasted if you are already on that plane). The material body you leave behind is unconscious and in a state of suspended animation; it doesn\'t need food or air and doesn\'t age. Your astral body resembles your mortal form in almost every way, replicating your game statistics and possessions. The principal difference is the addition of a silvery cord that extends from between your shoulder blades and trails behind you, fading to invisibility after 1 foot. This cord is your tether to your material body. As long as the tether remains intact, you can find your way home. If the cord is cut--something that can happen only when an effect specifically states that it does--your soul and body are separated, killing you instantly. Your astral form can freely travel through the Astral Plane and can pass through portals there leading to any other plane. If you enter a new plane or return to the plane you were on when casting this spell, your body and possessions are transported along the silver cord, allowing you to re-enter your body as you enter the new plane. Your astral form is a separate incarnation. Any damage or other effects that apply to it have no effect on your physical body, nor do they persist when you return to it. The spell ends for you and your companions when you use your action to dismiss it. When the spell ends, the affected creature returns to its physical body, and it awakens. The spell might also end early for you or one of your companions. A successful dispel magic spell used against an astral or physical body ends the spell for that creature. If a creature\'s original body or its astral form drops to 0 hit points, the spell ends for that creature. If the spell ends and the silver cord is intact, the cord pulls the creature\'s astral form back to its body, ending its state of suspended animation. If you are returned to your body prematurely, your companions remain in their astral forms and must find their own way back to their bodies, usually by dropping to 0 hit points.',
        tags: ['NECROMANCY', 'HEALING', 'DAMAGE', 'UTILITY']
    },
    'Aura of Purity': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Aura of Purity is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Awaken': {
        school: 'Transmutation',
        castingTime: '8 hours',
        range: 'Touch',
        components: 'V, S, M (An agate worth at least 1,000 gp, which the spell consumes.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'After spending the casting time tracing magical pathways within a precious gemstone, you touch a Huge or smaller beast or plant. The target must have either no Intelligence score or an Intelligence of 3 or less. The target gains an Intelligence of 10. The target also gains the ability to speak one language you know. If the target is a plant, it gains the ability to move its limbs, roots, vines, creepers, and so forth, and it gains senses similar to a human\'s. Your GM chooses statistics appropriate for the awakened plant, such as the statistics for the awakened shrub or the awakened tree. The awakened beast or plant is charmed by you for 30 days or until you or your companions do anything harmful to it. When the charmed condition ends, the awakened creature chooses whether to remain friendly to you, based on how you treated it while it was charmed.',
        tags: ['TRANSMUTATION', 'UTILITY']
    },
    'Bane': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A drop of blood.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Up to three creatures of your choice that you can see within range must make charisma saving throws. Whenever a target that fails this saving throw makes an attack roll or a saving throw before the spell ends, the target must roll a d4 and subtract the number rolled from the attack roll or saving throw.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Banishing Smite': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Banishing Smite is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Barkskin': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A handful of oak bark.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You touch a willing creature. Until the spell ends, the target\'s skin has a rough, bark-like appearance, and the target\'s AC can\'t be less than 16, regardless of what kind of armor it is wearing.',
        tags: ['TRANSMUTATION', 'CONCENTRATION']
    },
    'Beast Sense': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Beast Sense is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Befuddlement': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Befuddlement is a 8-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Bestow Curse': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You touch a creature, and that creature must succeed on a wisdom saving throw or become cursed for the duration of the spell. When you cast this spell, choose the nature of the curse from the following options: - Choose one ability score. While cursed, the target has disadvantage on ability checks and saving throws made with that ability score. - While cursed, the target has disadvantage on attack rolls against you. - While cursed, the target must make a wisdom saving throw at the start of each of its turns. If it fails, it wastes its action that turn doing nothing. - While the target is cursed, your attacks and spells deal an extra 1d8 necrotic damage to the target. A remove curse spell ends this effect. At the GM\'s option, you may choose an alternative curse effect, but it should be no more powerful than those described above. The GM has final say on such a curse\'s effect.',
        higherLevels: 'If you cast this spell using a spell slot of 4th level or higher, the duration is concentration, up to 10 minutes. If you use a spell slot of 5th level or higher, the duration is 8 hours. If you use a spell slot of 7th level or higher, the duration is 24 hours. If you use a 9th level spell slot, the spell lasts until it is dispelled. Using a spell slot of 5th level or higher grants a duration that doesn\'t require concentration.',
        tags: ['NECROMANCY', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Bigby\'s Hand': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Bigby\'s Hand is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Blade Barrier': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '90 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create a vertical wall of whirling, razor-sharp blades made of magical energy. The wall appears within range and lasts for the duration. You can make a straight wall up to 100 feet long, 20 feet high, and 5 feet thick, or a ringed wall up to 60 feet in diameter, 20 feet high, and 5 feet thick. The wall provides three-quarters cover to creatures behind it, and its space is difficult terrain. When a creature enters the wall\'s area for the first time on a turn or starts its turn there, the creature must make a dexterity saving throw. On a failed save, the creature takes 6d10 slashing damage. On a successful save, the creature takes half as much damage.',
        tags: ['EVOCATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Blade Ward': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Blade Ward is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Blight': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Necromantic energy washes over a creature of your choice that you can see within range, draining moisture and vitality from it. The target must make a constitution saving throw. The target takes 8d8 necrotic damage on a failed save, or half as much damage on a successful one. The spell has no effect on undead or constructs. If you target a plant creature or a magical plant, it makes the saving throw with disadvantage, and the spell deals maximum damage to it. If you target a nonmagical plant that isn\'t a creature, such as a tree or shrub, it doesn\'t make a saving throw; it simply withers and dies.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level of higher, the damage increases by 1d8 for each slot level above 4th.',
        tags: ['NECROMANCY', 'DAMAGE', 'SAVE']
    },
    'Blinding Smite': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Blinding Smite is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Blindness/Deafness': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'You can blind or deafen a foe. Choose one creature that you can see within range to make a constitution saving throw. If it fails, the target is either blinded or deafened (your choice) for the duration. At the end of each of its turns, the target can make a constitution saving throw. On a success, the spell ends.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.',
        tags: ['NECROMANCY', 'SAVE']
    },
    'Blink': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'Roll a d20 at the end of each of your turns for the duration of the spell. On a roll of 11 or higher, you vanish from your current plane of existence and appear in the Ethereal Plane (the spell fails and the casting is wasted if you were already on that plane). At the start of your next turn, and when the spell ends if you are on the Ethereal Plane, you return to an unoccupied space of your choice that you can see within 10 feet of the space you vanished from. If no unoccupied space is available within that range, you appear in the nearest unoccupied space (chosen at random if more than one space is equally near). You can dismiss this spell as an action. While on the Ethereal Plane, you can see and hear the plane you originated from, which is cast in shades of gray, and you can\'t see anything there more than 60 feet away. You can only affect and be affected by other creatures on the Ethereal Plane. Creatures that aren\'t there can\'t perceive you or interact with you, unless they have the ability to do so.',
        tags: ['TRANSMUTATION', 'UTILITY']
    },
    'Blur': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: 'V',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Your body becomes blurred, shifting and wavering to all who can see you. For the duration, any creature has disadvantage on attack rolls against you. An attacker is immune to this effect if it doesn\'t rely on sight, as with blindsight, or can see through illusions, as with truesight.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE']
    },
    'Booming Blade': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Booming Blade is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Calm Emotions': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You attempt to suppress strong emotions in a group of people. Each humanoid in a 20-foot-radius sphere centered on a point you choose within range must make a charisma saving throw; a creature can choose to fail this saving throw if it wishes. If a creature fails its saving throw, choose one of the following two effects. You can suppress any effect causing a target to be charmed or frightened. When this spell ends, any suppressed effect resumes, provided that its duration has not expired in the meantime. Alternatively, you can make a target indifferent about creatures of your choice that it is hostile toward. This indifference ends if the target is attacked or harmed by a spell or if it witnesses any of its friends being harmed. When the spell ends, the creature becomes hostile again, unless the GM rules otherwise.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Catapult': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Catapult is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Catnap': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Catnap is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Charm Monster': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Charm Monster is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Charm Person': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You attempt to charm a humanoid you can see within range. It must make a wisdom saving throw, and does so with advantage if you or your companions are fighting it. If it fails the saving throw, it is charmed by you until the spell ends or until you or your companions do anything harmful to it. The charmed creature regards you as a friendly acquaintance. When the spell ends, the creature knows it was charmed by you.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st. The creatures must be within 30 feet of each other when you target them.',
        tags: ['ENCHANTMENT', 'SAVE']
    },
    'Chromatic Orb': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Chromatic Orb is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Circle of Death': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '150 feet',
        components: 'V, S, M (The powder of a crushed black pearl worth at least 500 gp.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'A sphere of negative energy ripples out in a 60-foot radius sphere from a point within range. Each creature in that area must make a constitution saving throw. A target takes 8d6 necrotic damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the damage increases by 2d6 for each slot level above 6th.',
        tags: ['NECROMANCY', 'DAMAGE', 'SAVE']
    },
    'Clairvoyance': {
        school: 'Divination',
        castingTime: '10 minutes',
        range: '1 mile',
        components: 'V, S, M (A focus worth at least 100gp, either a jeweled horn for hearing or a glass eye for seeing.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create an invisible sensor within range in a location familiar to you (a place you have visited or seen before) or in an obvious location that is unfamiliar to you (such as behind a door, around a corner, or in a grove of trees). The sensor remains in place for the duration, and it can\'t be attacked or otherwise interacted with. When you cast the spell, you choose seeing or hearing. You can use the chosen sense through the sensor as if you were in its space. As your action, you can switch between seeing and hearing. A creature that can see the sensor (such as a creature benefiting from see invisibility or truesight) sees a luminous, intangible orb about the size of your fist.',
        tags: ['DIVINATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Clone': {
        school: 'Necromancy',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (A diamond worth at least 1,000 gp and at least 1 cubic inch of flesh of the creature that is to be cloned, which the spell consumes, and a vessel worth at least 2,000 gp that has a sealable lid and is large enough to hold a Medium creature, such as a huge urn, coffin, mud-filled cyst in the ground, or crystal container filled with salt water.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'This spell grows an inert duplicate of a living creature as a safeguard against death. This clone forms inside a sealed vessel and grows to full size and maturity after 120 days; you can also choose to have the clone be a younger version of the same creature. It remains inert and endures indefinitely, as long as its vessel remains undisturbed. At any time after the clone matures, if the original creature dies, its soul transfers to the clone, provided that the soul is free and willing to return. The clone is physically identical to the original and has the same personality, memories, and abilities, but none of the original\'s equipment. The original creature\'s physical remains, if they still exist, become inert and can\'t thereafter be restored to life, since the creature\'s soul is elsewhere.',
        tags: ['NECROMANCY', 'HEALING']
    },
    'Cloud of Daggers': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Cloud of Daggers is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Cloudkill': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create a 20-foot-radius sphere of poisonous, yellow-green fog centered on a point you choose within range. The fog spreads around corners. It lasts for the duration or until strong wind disperses the fog, ending the spell. Its area is heavily obscured. When a creature enters the spell\'s area for the first time on a turn or starts its turn there, that creature must make a constitution saving throw. The creature takes 5d8 poison damage on a failed save, or half as much damage on a successful one. Creatures are affected even if they hold their breath or don\'t need to breathe. The fog moves 10 feet away from you at the start of each of your turns, rolling along the surface of the ground. The vapors, being heavier than air, sink to the lowest level of the land, even pouring down openings.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Color Spray': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A pinch of powder or sand that is colored red, yellow, and blue.)',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'A dazzling array of flashing, colored light springs from your hand. Roll 6d10; the total is how many hit points of creatures this spell can effect. Creatures in a 15-foot cone originating from you are affected in ascending order of their current hit points (ignoring unconscious creatures and creatures that can\'t see). Starting with the creature that has the lowest current hit points, each creature affected by this spell is blinded until the spell ends. Subtract each creature\'s hit points from the total before moving on to the creature with the next lowest hit points. A creature\'s hit points must be equal to or less than the remaining total for that creature to be affected.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d10 for each slot level above 1st.',
        tags: ['ILLUSION', 'HEALING']
    },
    'Commune': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V, S, M (Incense and a vial of holy or unholy water.)',
        duration: '1 minute',
        concentration: false,
        ritual: true,
        description: 'You contact your deity or a divine proxy and ask up to three questions that can be answered with a yes or no. You must ask your questions before the spell ends. You receive a correct answer for each question. Divine beings aren\'t necessarily omniscient, so you might receive "unclear" as an answer if a question pertains to information that lies beyond the deity\'s knowledge. In a case where a one-word answer could be misleading or contrary to the deity\'s interests, the GM might offer a short phrase as an answer instead. If you cast the spell two or more times before finishing your next long rest, there is a cumulative 25 percent chance for each casting after the first that you get no answer. The GM makes this roll in secret.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Commune with Nature': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'You briefly become one with nature and gain knowledge of the surrounding territory. In the outdoors, the spell gives you knowledge of the land within 3 miles of you. In caves and other natural underground settings, the radius is limited to 300 feet. The spell doesn\'t function where nature has been replaced by construction, such as in dungeons and towns. You instantly gain knowledge of up to three facts of your choice about any of the following subjects as they relate to the area: - terrain and bodies of water - prevalent plants, minerals, animals, or peoples - powerful celestials, fey, fiends, elementals, or undead - influence from other planes of existence - buildings For example, you could determine the location of powerful undead in the area, the location of major sources of safe drinking water, and the location of any nearby towns.',
        tags: ['DIVINATION', 'RITUAL', 'UTILITY']
    },
    'Comprehend Languages': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A pinch of soot and salt.)',
        duration: '1 hour',
        concentration: false,
        ritual: true,
        description: 'For the duration, you understand the literal meaning of any spoken language that you hear. You also understand any written language that you see, but you must be touching the surface on which the words are written. It takes about 1 minute to read one page of text. This spell doesn\'t decode secret messages in a text or a glyph, such as an arcane sigil, that isn\'t part of a written language.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Compulsion': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Creatures of your choice that you can see within range and that can hear you must make a wisdom saving throw. A target automatically succeeds on this saving throw if it can\'t be charmed. On a failed save, a target is affected by this spell. Until the spell ends, you can use a bonus action on each of your turns to designate a direction that is horizontal to you. Each affected target must use as much of its movement as possible to move in that direction on its next turn. It can take any action before it moves. After moving in this way, it can make another Wisdom save to try to end the effect. A target isn\'t compelled to move into an obviously deadly hazard, such as a fire or a pit, but it will provoke opportunity attacks to move in the designated direction.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Confusion': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '90 feet',
        components: 'V, S, M (Three walnut shells.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'This spell assaults and twists creatures\' minds, spawning delusions and provoking uncontrolled action. Each creature in a 10-foot-radius sphere centered on a point you choose within range must succeed on a Wisdom saving throw when you cast this spell or be affected by it. An affected target can\'t take reactions and must roll a d10 at the start of each of its turns to determine its behavior for that turn. | d10 | Behavior | |---|---| | 1 | The creature uses all its movement to move in a random direction. To determine the direction, roll a d8 and assign a direction to each die face. The creature doesn\'t take an action this turn. | | 2-6 | The creature doesn\'t move or take actions this turn. | | 7-8 | The creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn. | | 9-10 | The creature can act and move normally. | At the end of each of its turns, an affected target can make a Wisdom saving throw. If it succeeds, this effect ends for that target.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level or higher, the radius of the sphere increases by 5 feet for each slot level above 4th.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Conjure Barrage': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Conjure Barrage is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Conjure Celestial': {
        school: 'Conjuration',
        castingTime: '1 minute',
        range: '90 feet',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You summon a celestial of challenge rating 4 or lower, which appears in an unoccupied space that you can see within range. The celestial disappears when it drops to 0 hit points or when the spell ends. The celestial is friendly to you and your companions for the duration. Roll initiative for the celestial, which has its own turns. It obeys any verbal commands that you issue to it (no action required by you), as long as they don\'t violate its alignment. If you don\'t issue any commands to the celestial, it defends itself from hostile creatures but otherwise takes no actions. The GM has the celestial\'s statistics.',
        higherLevels: 'When you cast this spell using a 9th-level spell slot, you summon a celestial of challenge rating 5 or lower.',
        tags: ['CONJURATION', 'CONCENTRATION', 'HEALING', 'SUMMONING']
    },
    'Conjure Elemental': {
        school: 'Conjuration',
        castingTime: '1 minute',
        range: '90 feet',
        components: 'V, S, M (Burning incense for air, soft clay for earth, sulfur and phosphorus for fire, or water and sand for water.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You call forth an elemental servant. Choose an area of air, earth, fire, or water that fills a 10-foot cube within range. An elemental of challenge rating 5 or lower appropriate to the area you chose appears in an unoccupied space within 10 feet of it. For example, a fire elemental emerges from a bonfire, and an earth elemental rises up from the ground. The elemental disappears when it drops to 0 hit points or when the spell ends. The elemental is friendly to you and your companions for the duration. Roll initiative for the elemental, which has its own turns. It obeys any verbal commands that you issue to it (no action required by you). If you don\'t issue any commands to the elemental, it defends itself from hostile creatures but otherwise takes no actions. If your concentration is broken, the elemental doesn\'t disappear. Instead, you lose control of the elemental, it becomes hostile toward you and your companions, and it might attack. An uncontrolled elemental can\'t be dismissed by you, and it disappears 1 hour after you summoned it. The GM has the elemental\'s statistics.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the challenge rating increases by 1 for each slot level above 5th.',
        tags: ['CONJURATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'SUMMONING']
    },
    'Conjure Fey': {
        school: 'Conjuration',
        castingTime: '1 minute',
        range: '90 feet',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You summon a fey creature of challenge rating 6 or lower, or a fey spirit that takes the form of a beast of challenge rating 6 or lower. It appears in an unoccupied space that you can see within range. The fey creature disappears when it drops to 0 hit points or when the spell ends. The fey creature is friendly to you and your companions for the duration. Roll initiative for the creature, which has its own turns. It obeys any verbal commands that you issue to it (no action required by you), as long as they don\'t violate its alignment. If you don\'t issue any commands to the fey creature, it defends itself from hostile creatures but otherwise takes no actions. If your concentration is broken, the fey creature doesn\'t disappear. Instead, you lose control of the fey creature, it becomes hostile toward you and your companions, and it might attack. An uncontrolled fey creature can\'t be dismissed by you, and it disappears 1 hour after you summoned it. The GM has the fey creature\'s statistics.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the challenge rating increases by 1 for each slot level above 6th.',
        tags: ['CONJURATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'SUMMONING']
    },
    'Conjure Minor Elementals': {
        school: 'Conjuration',
        castingTime: '1 minute',
        range: '90 feet',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You summon elementals that appear in unoccupied spaces that you can see within range. You choose one the following options for what appears: - One elemental of challenge rating 2 or lower - Two elementals of challenge rating 1 or lower - Four elementals of challenge rating 1/2 or lower - Eight elementals of challenge rating 1/4 or lower. An elemental summoned by this spell disappears when it drops to 0 hit points or when the spell ends. The summoned creatures are friendly to you and your companions. Roll initiative for the summoned creatures as a group, which has its own turns. They obey any verbal commands that you issue to them (no action required by you). If you don\'t issue any commands to them, they defend themselves from hostile creatures, but otherwise take no actions. The GM has the creatures\' statistics.',
        higherLevels: 'When you cast this spell using certain higher-level spell slots, you choose one of the summoning options above, and more creatures appear: twice as many with a 6th-level slot and three times as many with an 8th-level slot.',
        tags: ['CONJURATION', 'CONCENTRATION', 'HEALING', 'SUMMONING']
    },
    'Conjure Woodland Beings': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (One holly berry per creature summoned.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You summon fey creatures that appear in unoccupied spaces that you can see within range. Choose one of the following options for what appears: - One fey creature of challenge rating 2 or lower - Two fey creatures of challenge rating 1 or lower - Four fey creatures of challenge rating 1/2 or lower - Eight fey creatures of challenge rating 1/4 or lower A summoned creature disappears when it drops to 0 hit points or when the spell ends. The summoned creatures are friendly to you and your companions. Roll initiative for the summoned creatures as a group, which have their own turns. They obey any verbal commands that you issue to them (no action required by you). If you don\'t issue any commands to them, they defend themselves from hostile creatures, but otherwise take no actions. The GM has the creatures\' statistics.',
        higherLevels: 'When you cast this spell using certain higher-level spell slots, you choose one of the summoning options above, and more creatures appear: twice as many with a 6th-level slot and three times as many with an 8th-level slot.',
        tags: ['CONJURATION', 'CONCENTRATION', 'HEALING', 'SUMMONING']
    },
    'Contact Other Plane': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V',
        duration: '1 minute',
        concentration: false,
        ritual: true,
        description: 'You mentally contact a demigod, the spirit of a long-dead sage, or some other mysterious entity from another plane. Contacting this extraplanar intelligence can strain or even break your mind. When you cast this spell, make a DC 15 intelligence saving throw. On a failure, you take 6d6 psychic damage and are insane until you finish a long rest. While insane, you can\'t take actions, can\'t understand what other creatures say, can\'t read, and speak only in gibberish. A greater restoration spell cast on you ends this effect. On a successful save, you can ask the entity up to five questions. You must ask your questions before the spell ends. The GM answers each question with one word, such as "yes," "no," "maybe," "never," "irrelevant," or "unclear" (if the entity doesn\'t know the answer to the question). If a one-word answer would be misleading, the GM might instead offer a short phrase as an answer.',
        tags: ['DIVINATION', 'RITUAL', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Contagion': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: '7 days',
        concentration: false,
        ritual: false,
        description: 'Your touch inflicts disease. Make a melee spell attack against a creature within your reach. On a hit, you afflict the creature with a disease of your choice from any of the ones described below. At the end of each of the target\'s turns, it must make a constitution saving throw. After failing three of these saving throws, the disease\'s effects last for the duration, and the creature stops making these saves. After succeeding on three of these saving throws, the creature recovers from the disease, and the spell ends. Since this spell induces a natural disease in its target, any effect that removes a disease or otherwise ameliorates a disease\'s effects apply to it. ***Blinding Sickness.*** Pain grips the creature\'s mind, and its eyes turn milky white. The creature has disadvantage on wisdom checks and wisdom saving throws and is blinded. ***Filth Fever.*** A raging fever sweeps through the creature\'s body. The creature has disadvantage on strength checks, strength saving throws, and attack rolls that use Strength. ***Flesh Rot.*** The creature\'s flesh decays. The creature has disadvantage on Charisma checks and vulnerability to all damage. ***Mindfire.*** The creature\'s mind becomes feverish. The creature has disadvantage on intelligence checks and intelligence saving throws, and the creature behaves as if under the effects of the confusion spell during combat. ***Seizure.*** The creature is overcome with shaking. The creature has disadvantage on dexterity checks, dexterity saving throws, and attack rolls that use Dexterity. ***Slimy Doom.*** The creature begins to bleed uncontrollably. The creature has disadvantage on constitution checks and constitution saving throws. In addition, whenever the creature takes damage, it is stunned until the end of its next turn.',
        tags: ['NECROMANCY', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Contingency': {
        school: 'Evocation',
        castingTime: '10 minutes',
        range: 'Self',
        components: 'V, S, M (A statuette of yourself carved from ivory and decorated with gems worth at least 1,500 gp.)',
        duration: '10 days',
        concentration: false,
        ritual: false,
        description: 'Choose a spell of 5th level or lower that you can cast, that has a casting time of 1 action, and that can target you. You cast that spell--called the contingent spell--as part of casting contingency, expending spell slots for both, but the contingent spell doesn\'t come into effect. Instead, it takes effect when a certain circumstance occurs. You describe that circumstance when you cast the two spells. For example, a contingency cast with water breathing might stipulate that water breathing comes into effect when you are engulfed in water or a similar liquid. The contingent spell takes effect immediately after the circumstance is met for the first time, whether or not you want it to. and then contingency ends. The contingent spell takes effect only on you, even if it can normally target others. You can use only one contingency spell at a time. If you cast this spell again, the effect of another contingency spell on you ends. Also, contingency ends on you if its material component is ever not on your person.',
        tags: ['EVOCATION']
    },
    'Continual Flame': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (Ruby dust worth 50 gp, which the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'A flame, equivalent in brightness to a torch, springs forth from an object that you touch. The effect looks like a regular flame, but it creates no heat and doesn\'t use oxygen. A continual flame can be covered or hidden but not smothered or quenched.',
        tags: ['EVOCATION']
    },
    'Control Water': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '300 feet',
        components: 'V, S, M (A drop of water and a pinch of dust.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Until the spell ends, you control any freestanding water inside an area you choose that is a cube up to 100 feet on a side. You can choose from any of the following effects when you cast this spell. As an action on your turn, you can repeat the same effect or choose a different one. ***Flood.*** You cause the water level of all standing water in the area to rise by as much as 20 feet. If the area includes a shore, the flooding water spills over onto dry land. If you choose an area in a large body of water, you instead create a 20-foot tall wave that travels from one side of the area to the other and then crashes down. Any Huge or smaller vehicles in the wave\'s path are carried with it to the other side. Any Huge or smaller vehicles struck by the wave have a 25 percent chance of capsizing. The water level remains elevated until the spell ends or you choose a different effect. If this effect produced a wave, the wave repeats on the start of your next turn while the flood effect lasts. ***Part Water.*** You cause water in the area to move apart and create a trench. The trench extends across the spell\'s area, and the separated water forms a wall to either side. The trench remains until the spell ends or you choose a different effect. The water then slowly fills in the trench over the course of the next round until the normal water level is restored. ***Redirect Flow.*** You cause flowing water in the area to move in a direction you choose, even if the water has to flow over obstacles, up walls, or in other unlikely directions. The water in the area moves as you direct it, but once it moves beyond the spell\'s area, it resumes its flow based on the terrain conditions. The water continues to move in the direction you chose until the spell ends or you choose a different effect. ***Whirlpool.*** This effect requires a body of water at least 50 feet square and 25 feet deep. You cause a whirlpool to form in the center of the area. The whirlpool forms a vortex that is 5 feet wide at the base, up to 50 feet wide at the top, and 25 feet tall. Any creature or object in the water and within 25 feet of the vortex is pulled 10 feet toward it. A creature can swim away from the vortex by making a Strength (Athletics) check against your spell save DC. When a creature enters the vortex for the first time on a turn or starts its turn there, it must make a strength saving throw. On a failed save, the creature takes 2d8 bludgeoning damage and is caught in the vortex until the spell ends. On a successful save, the creature takes half damage, and isn\'t caught in the vortex. A creature caught in the vortex can use its action to try to swim away from the vortex as described above, but has disadvantage on the Strength (Athletics) check to do so. The first time each turn that an object enters the vortex, the object takes 2d8 bludgeoning damage; this damage occurs each round it remains in the vortex.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Control Weather': {
        school: 'Transmutation',
        castingTime: '10 minutes',
        range: 'Self',
        components: 'V, S, M (Burning incense and bits of earth and wood mixed in water.)',
        duration: 'Up to 8 hours',
        concentration: true,
        ritual: false,
        description: 'You take control of the weather within 5 miles of you for the duration. You must be outdoors to cast this spell. Moving to a place where you don\'t have a clear path to the sky ends the spell early. When you cast the spell, you change the current weather conditions, which are determined by the GM based on the climate and season. You can change precipitation, temperature, and wind. It takes 1d4 x 10 minutes for the new conditions to take effect. Once they do so, you can change the conditions again. When the spell ends, the weather gradually returns to normal. When you change the weather conditions, find a current condition on the following tables and change its stage by one, up or down. When changing the wind, you can change its direction. ##### Precipitation | Stage | Condition | |---|---| | 1 | Clear | | 2 | Light clouds | | 3 | Overcast or ground fog | | 4 | Rain, hail, or snow | | 5 | Torrential rain, driving hail, or blizzard | ##### Temperature | Stage | Condition | |---|---| | 1 | Unbearable heat | | 2 | Hot | | 3 | Warm | | 4 | Cool | | 5 | Cold | | 6 | Arctic cold | ##### Wind | Stage | Condition | |---|---| | 1 | Calm | | 2 | Moderate wind | | 3 | Strong wind | | 4 | Gale | | 5 | Storm |',
        tags: ['TRANSMUTATION', 'CONCENTRATION']
    },
    'Cordon of Arrows': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Cordon of Arrows is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Create Bonfire': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Create Bonfire is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Create or Destroy Water': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A drop of water if creating water, or a few grains of sand if destroying it.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You either create or destroy water. ***Create Water.*** You create up to 10 gallons of clean water within range in an open container. Alternatively, the water falls as rain in a 30-foot cube within range. ***Destroy Water.*** You destroy up to 10 gallons of water in an open container within range. Alternatively, you destroy fog in a 30-foot cube within range.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you create or destroy 10 additional gallons of water, or the size of the cube increases by 5 feet, for each slot level above 1st.',
        tags: ['TRANSMUTATION']
    },
    'Create Undead': {
        school: 'Necromancy',
        castingTime: '1 minute',
        range: '10 feet',
        components: 'V, S, M (One clay pot filled with grave dirt, one clay pot filled with brackish water, and one 150 gp black onyx stone for each corpse.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You can cast this spell only at night. Choose up to three corpses of Medium or Small humanoids within range. Each corpse becomes a ghoul under your control. (The GM has game statistics for these creatures.) As a bonus action on each of your turns, you can mentally command any creature you animated with this spell if the creature is within 120 feet of you (if you control multiple creatures, you can command any or all of them at the same time, issuing the same command to each one). You decide what action the creature will take and where it will move during its next turn, or you can issue a general command, such as to guard a particular chamber or corridor. If you issue no commands, the creature only defends itself against hostile creatures. Once given an order, the creature continues to follow it until its task is complete. The creature is under your control for 24 hours, after which it stops obeying any command you have given it. To maintain control of the creature for another 24 hours, you must cast this spell on the creature before the current 24-hour period ends. This use of the spell reasserts your control over up to three creatures you have animated with this spell, rather than animating new ones.',
        higherLevels: 'When you cast this spell using a 7th-level spell slot, you can animate or reassert control over four ghouls. When you cast this spell using an 8th-level spell slot, you can animate or reassert control over five ghouls or two ghasts or wights. When you cast this spell using a 9th-level spell slot, you can animate or reassert control over six ghouls, three ghasts or wights, or two mummies.',
        tags: ['NECROMANCY', 'UTILITY']
    },
    'Creation': {
        school: 'Illusion',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S, M (A tiny piece of matter of the same type of the item you plan to create.)',
        duration: 'Special',
        concentration: false,
        ritual: false,
        description: 'You pull wisps of shadow material from the Shadowfell to create a nonliving object of vegetable matter within range: soft goods, rope, wood, or something similar. You can also use this spell to create mineral objects such as stone, crystal, or metal. The object created must be no larger than a 5-foot cube, and the object must be of a form and material that you have seen before. The duration depends on the object\'s material. If the object is composed of multiple materials, use the shortest duration. | Material | Duration | |---|---| | Vegetable matter | 1 day | | Stone or crystal | 12 hours | | Precious metals | 1 hour | | Gems | 10 minutes | | Adamantine or mithral | 1 minute | Using any material created by this spell as another spell\'s material component causes that spell to fail.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the cube increases by 5 feet for each slot level above 5th.',
        tags: ['ILLUSION']
    },
    'Crown of Madness': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Crown of Madness is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Dancing Lights': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A bit of phosphorus or wychwood, or a glowworm.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You create up to four torch-sized lights within range, making them appear as torches, lanterns, or glowing orbs that hover in the air for the duration. You can also combine the four lights into one glowing vaguely humanoid form of Medium size. Whichever form you choose, each light sheds dim light in a 10-foot radius. As a bonus action on your turn, you can move the lights up to 60 feet to a new spot within range. A light must be within 20 feet of another light created by this spell, and a light winks out if it exceeds the spell\'s range.',
        tags: ['EVOCATION', 'CONCENTRATION', 'UTILITY']
    },
    'Darkness': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, M (Bat fur and a drop of pitch or piece of coal.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Magical darkness spreads from a point you choose within range to fill a 15-foot-radius sphere for the duration. The darkness spreads around corners. A creature with darkvision can\'t see through this darkness, and nonmagical light can\'t illuminate it. If the point you choose is on an object you are holding or one that isn\'t being worn or carried, the darkness emanates from the object and moves with it. Completely covering the source of the darkness with an opaque object, such as a bowl or a helm, blocks the darkness. If any of this spell\'s area overlaps with an area of light created by a spell of 2nd level or lower, the spell that created the light is dispelled.',
        tags: ['EVOCATION', 'CONCENTRATION', 'UTILITY']
    },
    'Darkvision': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (Either a pinch of dried carrot or an agate.)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You touch a willing creature to grant it the ability to see in the dark. For the duration, that creature has darkvision out to a range of 60 feet.',
        tags: ['TRANSMUTATION']
    },
    'Delayed Blast Fireball': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 feet',
        components: 'V, S, M (A tiny ball of bat guano and sulfur.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A beam of yellow light flashes from your pointing finger, then condenses to linger at a chosen point within range as a glowing bead for the duration. When the spell ends, either because your concentration is broken or because you decide to end it, the bead blossoms with a low roar into an explosion of flame that spreads around corners. Each creature in a 20-foot-radius sphere centered on that point must make a dexterity saving throw. A creature takes fire damage equal to the total accumulated damage on a failed save, or half as much damage on a successful one. The spell\'s base damage is 12d6. If at the end of your turn the bead has not yet detonated, the damage increases by 1d6. If the glowing bead is touched before the interval has expired, the creature touching it must make a dexterity saving throw. On a failed save, the spell ends immediately, causing the bead to erupt in flame. On a successful save, the creature can throw the bead up to 40 feet. When it strikes a creature or a solid object, the spell ends, and the bead explodes. The fire damages objects in the area and ignites flammable objects that aren\'t being worn or carried.',
        higherLevels: 'When you cast this spell using a spell slot of 8th level or higher, the base damage increases by 1d6 for each slot level above 7th.',
        tags: ['EVOCATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Demiplane': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You create a shadowy door on a flat solid surface that you can see within range. The door is large enough to allow Medium creatures to pass through unhindered. When opened, the door leads to a demiplane that appears to be an empty room 30 feet in each dimension, made of wood or stone. When the spell ends, the door disappears, and any creatures or objects inside the demiplane remain trapped there, as the door also disappears from the other side. Each time you cast this spell, you can create a new demiplane, or have the shadowy door connect to a demiplane you created with a previous casting of this spell. Additionally, if you know the nature and contents of a demiplane created by a casting of this spell by another creature, you can have the shadowy door connect to its demiplane instead.',
        tags: ['CONJURATION', 'UTILITY']
    },
    'Detect Thoughts': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A copper coin.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'For the duration, you can read the thoughts of certain creatures. When you cast the spell and as your action on each turn until the spell ends, you can focus your mind on any one creature that you can see within 30 feet of you. If the creature you choose has an Intelligence of 3 or lower or doesn\'t speak any language, the creature is unaffected. You initially learn the surface thoughts of the creature - what is most on its mind in that moment. As an action, you can either shift your attention to another creature\'s thoughts or attempt to probe deeper into the same creature\'s mind. If you probe deeper, the target must make a Wisdom saving throw. If it fails, you gain insight into its reasoning (if any), its emotional state, and something that looms large in its mind (such as something it worries over, loves, or hates). If it succeeds, the spell ends. Either way, the target knows that you are probing into its mind, and unless you shift your attention to another creature\'s thoughts, the creature can use its action on its turn to make an Intelligence check contested by your Intelligence check; if it succeeds, the spell ends. Questions verbally directed at the target creature naturally shape the course of its thoughts, so this spell is particularly effective as part of an interrogation. You can also use this spell to detect the presence of thinking creatures you can\'t see. When you cast the spell or as your action during the duration, you can search for thoughts within 30 feet of you. The spell can penetrate barriers, but 2 feet of rock, 2 inches of any metal other than lead, or a thin sheet of lead blocks you. You can\'t detect a creature with an Intelligence of 3 or lower or one that doesn\'t speak any language. Once you detect the presence of a creature in this way, you can read its thoughts for the rest of the duration as described above, even if you can\'t see it, but it must still be within range.',
        tags: ['DIVINATION', 'CONCENTRATION', 'SAVE']
    },
    'Disguise Self': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You make yourself--including your clothing, armor, weapons, and other belongings on your person--look different until the spell ends or until you use your action to dismiss it. You can seem 1 foot shorter or taller and can appear thin, fat, or in between. You can\'t change your body type, so you must adopt a form that has the same basic arrangement of limbs. Otherwise, the extent of the illusion is up to you. The changes wrought by this spell fail to hold up to physical inspection. For example, if you use this spell to add a hat to your outfit, objects pass through the hat, and anyone who touches it would feel nothing or would feel your head and hair. If you use this spell to appear thinner than you are, the hand of someone who reaches out to touch you would bump into you while it was seemingly still in midair. To discern that you are disguised, a creature can use its action to inspect your appearance and must succeed on an Intelligence (Investigation) check against your spell save DC.',
        tags: ['ILLUSION', 'SAVE']
    },
    'Divination': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (Incense and a sacrificial offering appropriate to your religion, together worth at least 25gp, which the spell consumes.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'Your magic and an offering put you in contact with a god or a god\'s servants. You ask a single question concerning a specific goal, event, or activity to occur within 7 days. The GM offers a truthful reply. The reply might be a short phrase, a cryptic rhyme, or an omen. The spell doesn\'t take into account any possible circumstances that might change the outcome, such as the casting of additional spells or the loss or gain of a companion. If you cast the spell two or more times before finishing your next long rest, there is a cumulative 25 percent chance for each casting after the first that you get a random reading. The GM makes this roll in secret.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Divine Word': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: '30 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You utter a divine word, imbued with the power that shaped the world at the dawn of creation. Choose any number of creatures you can see within range. Each creature that can hear you must make a Charisma saving throw. On a failed save, a creature suffers an effect based on its current hit points: - 50 hit points or fewer: deafened for 1 minute - 40 hit points or fewer: deafened and blinded for 10 minutes - 30 hit points or fewer: blinded, deafened, and stunned for 1 hour - 20 hit points or fewer: killed instantly Regardless of its current hit points, a celestial, an elemental, a fey, or a fiend that fails its save is forced back to its plane of origin (if it isn\'t there already) and can\'t return to your current plane for 24 hours by any means short of a wish spell.',
        tags: ['EVOCATION', 'HEALING', 'UTILITY', 'SAVE']
    },
    'Dominate Beast': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You attempt to beguile a creature that you can see within range. It must succeed on a wisdom saving throw or be charmed by you for the duration. If you or creatures that are friendly to you are fighting it, it has advantage on the saving throw. While the creature is charmed, you have a telepathic link with it as long as the two of you are on the same plane of existence. You can use this telepathic link to issue commands to the creature while you are conscious (no action required), which it does its best to obey. You can specify a simple and general course of action, such as "Attack that creature," "Run over there," or "Fetch that object." If the creature completes the order and doesn\'t receive further direction from you, it defends and preserves itself to the best of its ability. You can use your action to take total and precise control of the target. Until the end of your next turn, the creature takes only the actions you choose, and doesn\'t do anything that you don\'t allow it to do. During this time, you can also cause the creature to use a reaction, but this requires you to use your own reaction as well. Each time the target takes damage, it makes a new wisdom saving throw against the spell. If the saving throw succeeds, the spell ends.',
        higherLevels: 'When you cast this spell with a 9th level spell slot, the duration is concentration, up to 8 hours.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Dominate Monster': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You attempt to beguile a creature that you can see within range. It must succeed on a wisdom saving throw or be charmed by you for the duration. If you or creatures that are friendly to you are fighting it, it has advantage on the saving throw. While the creature is charmed, you have a telepathic link with it as long as the two of you are on the same plane of existence. You can use this telepathic link to issue commands to the creature while you are conscious (no action required), which it does its best to obey. You can specify a simple and general course of action, such as "Attack that creature," "Run over there," or "Fetch that object." If the creature completes the order and doesn\'t receive further direction from you, it defends and preserves itself to the best of its ability. You can use your action to take total and precise control of the target. Until the end of your next turn, the creature takes only the actions you choose, and doesn\'t do anything that you don\'t allow it to do. During this time, you can also cause the creature to use a reaction, but this requires you to use your own reaction as well. Each time the target takes damage, it makes a new wisdom saving throw against the spell. If the saving throw succeeds, the spell ends.',
        higherLevels: 'When you cast this spell with a 9th-level spell slot, the duration is concentration, up to 8 hours.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Dominate Person': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You attempt to beguile a humanoid that you can see within range. It must succeed on a wisdom saving throw or be charmed by you for the duration. If you or creatures that are friendly to you are fighting it, it has advantage on the saving throw. While the target is charmed, you have a telepathic link with it as long as the two of you are on the same plane of existence. You can use this telepathic link to issue commands to the creature while you are conscious (no action required), which it does its best to obey. You can specify a simple and general course of action, such as "Attack that creature," "Run over there," or "Fetch that object." If the creature completes the order and doesn\'t receive further direction from you, it defends and preserves itself to the best of its ability. You can use your action to take total and precise control of the target. Until the end of your next turn, the creature takes only the actions you choose, and doesn\'t do anything that you don\'t allow it to do. During this time you can also cause the creature to use a reaction, but this requires you to use your own reaction as well. Each time the target takes damage, it makes a new wisdom saving throw against the spell. If the saving throw succeeds, the spell ends.',
        higherLevels: 'When you cast this spell using a 6th-level spell slot, the duration is concentration, up to 10 minutes. When you use a 7th-level spell slot, the duration is concentration, up to 1 hour. When you use a spell slot of 8th level or higher, the duration is concentration, up to 8 hours.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Dragon\'s Breath': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Dragon\'s Breath is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Dream': {
        school: 'Illusion',
        castingTime: '1 minute',
        range: 'Special',
        components: 'V, S, M (A handful of sand, a dab of ink, and a writing quill plucked from a sleeping bird.)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'This spell shapes a creature\'s dreams. Choose a creature known to you as the target of this spell. The target must be on the same plane of existence as you. Creatures that don\'t sleep, such as elves, can\'t be contacted by this spell. You, or a willing creature you touch, enters a trance state, acting as a messenger. While in the trance, the messenger is aware of his or her surroundings, but can\'t take actions or move. If the target is asleep, the messenger appears in the target\'s dreams and can converse with the target as long as it remains asleep, through the duration of the spell. The messenger can also shape the environment of the dream, creating landscapes, objects, and other images. The messenger can emerge from the trance at any time, ending the effect of the spell early. The target recalls the dream perfectly upon waking. If the target is awake when you cast the spell, the messenger knows it, and can either end the trance (and the spell) or wait for the target to fall asleep, at which point the messenger appears in the target\'s dreams. You can make the messenger appear monstrous and terrifying to the target. If you do, the messenger can deliver a message of no more than ten words and then the target must make a wisdom saving throw. On a failed save, echoes of the phantasmal monstrosity spawn a nightmare that lasts the duration of the target\'s sleep and prevents the target from gaining any benefit from that rest. In addition, when the target wakes up, it takes 3d6 psychic damage. If you have a body part, lock of hair, clipping from a nail, or similar portion of the target\'s body, the target makes its saving throw with disadvantage.',
        tags: ['ILLUSION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Elemental Bane': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Elemental Bane is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Elemental Weapon': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Elemental Weapon is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Elementalism': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Elementalism is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Enhance Ability': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (Fur or a feather from a beast.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You touch a creature and bestow upon it a magical enhancement. Choose one of the following effects; the target gains that effect until the spell ends. ***Bear\'s Endurance.*** The target has advantage on constitution checks. It also gains 2d6 temporary hit points, which are lost when the spell ends. ***Bull\'s Strength.*** The target has advantage on strength checks, and his or her carrying capacity doubles. ***Cat\'s Grace.*** The target has advantage on dexterity checks. It also doesn\'t take damage from falling 20 feet or less if it isn\'t incapacitated. ***Eagle\'s Splendor.*** The target has advantage on Charisma checks. ***Fox\'s Cunning.*** The target has advantage on intelligence checks. ***Owl\'s Wisdom.*** The target has advantage on wisdom checks.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'DAMAGE']
    },
    'Enlarge/Reduce': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A pinch iron powder.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You cause a creature or an object you can see within range to grow larger or smaller for the duration. Choose either a creature or an object that is neither worn nor carried. If the target is unwilling, it can make a Constitution saving throw. On a success, the spell has no effect. If the target is a creature, everything it is wearing and carrying changes size with it. Any item dropped by an affected creature returns to normal size at once. ***Enlarge.*** The target\'s size doubles in all dimensions, and its weight is multiplied by eight. This growth increases its size by one category-from Medium to Large, for example. If there isn\'t enough room for the target to double its size, the creature or object attains the maximum possible size in the space available. Until the spell ends, the target also has advantage on Strength checks and Strength saving throws. The target\'s weapons also grow to match its new size. While these weapons are enlarged, the target\'s attacks with them deal 1d4 extra damage. ***Reduce.*** The target\'s size is halved in all dimensions, and its weight is reduced to one-eighth of normal. This reduction decreases its size by one category-from Medium to Small, for example. Until the spell ends, the target also has disadvantage on Strength checks and Strength saving throws. The target\'s weapons also shrink to match its new size. While these weapons are reduced, the target\'s attacks with them deal 1d4 less damage (this can\'t reduce the damage below 1).',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Enthrall': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'You weave a distracting string of words, causing creatures of your choice that you can see within range and that can hear you to make a wisdom saving throw. Any creature that can\'t be charmed succeeds on this saving throw automatically, and if you or your companions are fighting a creature, it has advantage on the save. On a failed save, the target has disadvantage on Wisdom (Perception) checks made to perceive any creature other than you until the spell ends or until the target can no longer hear you. The spell ends if you are incapacitated or can no longer speak.',
        tags: ['ENCHANTMENT', 'SAVE']
    },
    'Etherealness': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You step into the border regions of the Ethereal Plane, in the area where it overlaps with your current plane. You remain in the Border Ethereal for the duration or until you use your action to dismiss the spell. During this time, you can move in any direction. If you move up or down, every foot of movement costs an extra foot. You can see and hear the plane you originated from, but everything there looks gray, and you can\'t see anything more than 60 feet away. While on the Ethereal Plane, you can only affect and be affected by other creatures on that plane. Creatures that aren\'t on the Ethereal Plane can\'t perceive you and can\'t interact with you, unless a special ability or magic has given them the ability to do so. You ignore all objects and effects that aren\'t on the Ethereal Plane, allowing you to move through objects you perceive on the plane you originated from. When the spell ends, you immediately return to the plane you originated from in the spot you currently occupy. If you occupy the same spot as a solid object or creature when this happens, you are immediately shunted to the nearest unoccupied space that you can occupy and take force damage equal to twice the number of feet you are moved. This spell has no effect if you cast it while you are on the Ethereal Plane or a plane that doesn\'t border it, such as one of the Outer Planes.',
        higherLevels: 'When you cast this spell using a spell slot of 8th level or higher, you can target up to three willing creatures (including you) for each slot level above 7th. The creatures must be within 10 feet of you when you cast the spell.',
        tags: ['TRANSMUTATION', 'DAMAGE', 'UTILITY']
    },
    'Expeditious Retreat': {
        school: 'Transmutation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'This spell allows you to move at an incredible pace. When you cast this spell, and then as a bonus action on each of your turns until the spell ends, you can take the Dash action.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY']
    },
    'Eyebite': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'For the spell\'s duration, your eyes become an inky void imbued with dread power. One creature of your choice within 60 feet of you that you can see must succeed on a wisdom saving throw or be affected by one of the following effects of your choice for the duration. On each of your turns until the spell ends, you can use your action to target another creature but can\'t target a creature again if it has succeeded on a saving throw against this casting of eyebite. ***Asleep.*** The target falls unconscious. It wakes up if it takes any damage or if another creature uses its action to shake the sleeper awake. ***Panicked.*** The target is frightened of you. On each of its turns, the frightened creature must take the Dash action and move away from you by the safest and shortest available route, unless there is nowhere to move. If the target moves to a place at least 60 feet away from you where it can no longer see you, this effect ends. ***Sickened.*** The target has disadvantage on attack rolls and ability checks. At the end of each of its turns, it can make another wisdom saving throw. If it succeeds, the effect ends.',
        tags: ['NECROMANCY', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Fabricate': {
        school: 'Transmutation',
        castingTime: '10 minutes',
        range: '120 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You convert raw materials into products of the same material. For example, you can fabricate a wooden bridge from a clump of trees, a rope from a patch of hemp, and clothes from flax or wool. Choose raw materials that you can see within range. You can fabricate a Large or smaller object (contained within a 10-foot cube, or eight connected 5-foot cubes), given a sufficient quantity of raw material. If you are working with metal, stone, or another mineral substance, however, the fabricated object can be no larger than Medium (contained within a single 5-foot cube). The quality of objects made by the spell is commensurate with the quality of the raw materials. Creatures or magic items can\'t be created or transmuted by this spell. You also can\'t use it to create items that ordinarily require a high degree of craftsmanship, such as jewelry, weapons, glass, or armor, unless you have proficiency with the type of artisan\'s tools used to craft such objects.',
        tags: ['TRANSMUTATION']
    },
    'False Life': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A small amount of alcohol or distilled spirits.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'Bolstering yourself with a necromantic facsimile of life, you gain 1d4 + 4 temporary hit points for the duration.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you gain 5 additional temporary hit points for each slot level above 1st.',
        tags: ['NECROMANCY', 'HEALING']
    },
    'Feather Fall': {
        school: 'Transmutation',
        castingTime: '1 reaction',
        range: '60 feet',
        components: 'V, M (A small feather or a piece of down.)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'Choose up to five falling creatures within range. A falling creature\'s rate of descent slows to 60 feet per round until the spell ends. If the creature lands before the spell ends, it takes no falling damage and can land on its feet, and the spell ends for that creature.',
        tags: ['TRANSMUTATION', 'DAMAGE']
    },
    'Feign Death': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Feign Death is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Find the Path': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V, S, M (A set of divinatory tools--such as bones, ivory sticks, cards, teeth, or carved runes--worth 100gp and an object from the location you wish to find.)',
        duration: 'Up to 24 hours',
        concentration: true,
        ritual: false,
        description: 'This spell allows you to find the shortest, most direct physical route to a specific fixed location that you are familiar with on the same plane of existence. If you name a destination on another plane of existence, a destination that moves (such as a mobile fortress), or a destination that isn\'t specific (such as "a green dragon\'s lair"), the spell fails. For the duration, as long as you are on the same plane of existence as the destination, you know how far it is and in what direction it lies. While you are traveling there, whenever you are presented with a choice of paths along the way, you automatically determine which path is the shortest and most direct route (but not necessarily the safest route) to the destination.',
        tags: ['DIVINATION', 'CONCENTRATION', 'UTILITY']
    },
    'Find Traps': {
        school: 'Divination',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You sense the presence of any trap within range that is within line of sight. A trap, for the purpose of this spell, includes anything that would inflict a sudden or unexpected effect you consider harmful or undesirable, which was specifically intended as such by its creator. Thus, the spell would sense an area affected by the alarm spell, a glyph of warding, or a mechanical pit trap, but it would not reveal a natural weakness in the floor, an unstable ceiling, or a hidden sinkhole. This spell merely reveals that a trap is present. You don\'t learn the location of each trap, but you do learn the general nature of the danger posed by a trap you sense.',
        tags: ['DIVINATION']
    },
    'Finger of Death': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You send negative energy coursing through a creature that you can see within range, causing it searing pain. The target must make a constitution saving throw. It takes 7d8 + 30 necrotic damage on a failed save, or half as much damage on a successful one. A humanoid killed by this spell rises at the start of your next turn as a zombie that is permanently under your command, following your verbal orders to the best of its ability.',
        tags: ['NECROMANCY', 'DAMAGE', 'SAVE']
    },
    'Fire Shield': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A little phosphorus or a firefly.)',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        description: 'Thin and vaporous flame surround your body for the duration of the spell, radiating a bright light bright light in a 10-foot radius and dim light for an additional 10 feet. You can end the spell using an action to make it disappear. The flames are around you a heat shield or cold, your choice. The heat shield gives you cold damage resistance and the cold resistance to fire damage. In addition, whenever a creature within 5 feet of you hits you with a melee attack, flames spring from the shield. The attacker then suffers 2d8 points of fire damage or cold, depending on the model.',
        tags: ['EVOCATION', 'DAMAGE']
    },
    'Flame Arrows': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Flame Arrows is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Flame Blade': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: 'Self',
        components: 'V, S, M (Leaf of sumac.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You evoke a fiery blade in your free hand. The blade is similar in size and shape to a scimitar, and it lasts for the duration. If you let go of the blade, it disappears, but you can evoke the blade again as a bonus action. You can use your action to make a melee spell attack with the fiery blade. On a hit, the target takes 3d6 fire damage. The flaming blade sheds bright light in a 10-foot radius and dim light for an additional 10 feet.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for every two slot levels above 2nd.',
        tags: ['EVOCATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Flesh to Stone': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A pinch of lime, water, and earth.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You attempt to turn one creature that you can see within range into stone. If the target\'s body is made of flesh, the creature must make a constitution saving throw. On a failed save, it is restrained as its flesh begins to harden. On a successful save, the creature isn\'t affected. A creature restrained by this spell must make another constitution saving throw at the end of each of its turns. If it successfully saves against this spell three times, the spell ends. If it fails its saves three times, it is turned to stone and subjected to the petrified condition for the duration. The successes and failures don\'t need to be consecutive; keep track of both until the target collects three of a kind. If the creature is physically broken while petrified, it suffers from similar deformities if it reverts to its original state. If you maintain your concentration on this spell for the entire possible duration, the creature is turned to stone until the effect is removed.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY', 'SAVE']
    },
    'Fog Cloud': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners, and its area is heavily obscured. It lasts for the duration or until a wind of moderate or greater speed (at least 10 miles per hour) disperses it.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the radius of the fog increases by 20 feet for each slot level above 1st.',
        tags: ['CONJURATION', 'CONCENTRATION']
    },
    'Forbiddance': {
        school: 'Abjuration',
        castingTime: '10 minutes',
        range: 'Touch',
        components: 'V, S, M (A sprinkling of holy water, rare incense, and powdered ruby worth at least 1,000 gp.)',
        duration: '24 hours',
        concentration: false,
        ritual: true,
        description: 'You create a ward against magical travel that protects up to 40,000 square feet of floor space to a height of 30 feet above the floor. For the duration, creatures can\'t teleport into the area or use portals, such as those created by the gate spell, to enter the area. The spell proofs the area against planar travel, and therefore prevents creatures from accessing the area by way of the Astral Plane, Ethereal Plane, Feywild, Shadowfell, or the plane shift spell. In addition, the spell damages types of creatures that you choose when you cast it. Choose one or more of the following: celestials, elementals, fey, fiends, and undead. When a chosen creature enters the spell\'s area for the first time on a turn or starts its turn there, the creature takes 5d10 radiant or necrotic damage (your choice when you cast this spell). When you cast this spell, you can designate a password. A creature that speaks the password as it enters the area takes no damage from the spell. The spell\'s area can\'t overlap with the area of another forbiddance spell. If you cast forbiddance every day for 30 days in the same location, the spell lasts until it is dispelled, and the material components are consumed on the last casting.',
        tags: ['ABJURATION', 'RITUAL', 'DAMAGE', 'UTILITY']
    },
    'Fount of Moonlight': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Fount of Moonlight is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Friends': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Friends is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Frostbite': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Frostbite is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Gaseous Form': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A bit of gauze and a wisp of smoke.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You transform a willing creature you touch, along with everything it\'s wearing and carrying, into a misty cloud for the duration. The spell ends if the creature drops to 0 hit points. An incorporeal creature isn\'t affected. While in this form, the target\'s only method of movement is a flying speed of 10 feet. The target can enter and occupy the space of another creature. The target has resistance to nonmagical damage, and it has advantage on Strength, Dexterity, and constitution saving throws. The target can pass through small holes, narrow openings, and even mere cracks, though it treats liquids as though they were solid surfaces. The target can\'t fall and remains hovering in the air even when stunned or otherwise incapacitated. While in the form of a misty cloud, the target can\'t talk or manipulate objects, and any objects it was carrying or holding can\'t be dropped, used, or otherwise interacted with. The target can\'t attack or cast spells.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Gate': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A diamond worth at least 5,000gp.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You conjure a portal linking an unoccupied space you can see within range to a precise location on a different plane of existence. The portal is a circular opening, which you can make 5 to 20 feet in diameter. You can orient the portal in any direction you choose. The portal lasts for the duration. The portal has a front and a back on each plane where it appears. Travel through the portal is possible only by moving through its front. Anything that does so is instantly transported to the other plane, appearing in the unoccupied space nearest to the portal. Deities and other planar rulers can prevent portals created by this spell from opening in their presence or anywhere within their domains. When you cast this spell, you can speak the name of a specific creature (a pseudonym, title, or nickname doesn\'t work). If that creature is on a plane other than the one you are on, the portal opens in the named creature\'s immediate vicinity and draws the creature through it to the nearest unoccupied space on your side of the portal. You gain no special power over the creature, and it is free to act as the GM deems appropriate. It might leave, attack you, or help you.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'SUMMONING', 'UTILITY']
    },
    'Giant Insect': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You transform up to ten centipedes, three spiders, five wasps, or one scorpion within range into giant versions of their natural forms for the duration. A centipede becomes a giant centipede, a spider becomes a giant spider, a wasp becomes a giant wasp, and a scorpion becomes a giant scorpion. Each creature obeys your verbal commands, and in combat, they act on your turn each round. The GM has the statistics for these creatures and resolves their actions and movement. A creature remains in its giant size for the duration, until it drops to 0 hit points, or until you use an action to dismiss the effect on it. The GM might allow you to choose different targets. For example, if you transform a bee, its giant version might have the same statistics as a giant wasp.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'UTILITY']
    },
    'Glibness': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'Until the spell ends, when you make a Charisma check, you can replace the number you roll with a 15. Additionally, no matter what you say, magic that would determine if you are telling the truth indicates that you are being truthful.',
        tags: ['TRANSMUTATION']
    },
    'Glyph of Warding': {
        school: 'Abjuration',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (Incense and powdered diamond worth at least 200 gp, which the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'When you cast this spell, you inscribe a glyph that harms other creatures, either upon a surface (such as a table or a section of floor or wall) or within an object that can be closed (such as a book, a scroll, or a treasure chest) to conceal the glyph. If you choose a surface, the glyph can cover an area of the surface no larger than 10 feet in diameter. If you choose an object, that object must remain in its place; if the object is moved more than 10 feet from where you cast this spell, the glyph is broken, and the spell ends without being triggered. The glyph is nearly invisible and requires a successful Intelligence (Investigation) check against your spell save DC to be found. You decide what triggers the glyph when you cast the spell. For glyphs inscribed on a surface, the most typical triggers include touching or standing on the glyph, removing another object covering the glyph, approaching within a certain distance of the glyph, or manipulating the object on which the glyph is inscribed. For glyphs inscribed within an object, the most common triggers include opening that object, approaching within a certain distance of the object, or seeing or reading the glyph. Once a glyph is triggered, this spell ends. You can further refine the trigger so the spell activates only under certain circumstances or according to physical characteristics (such as height or weight), creature kind (for example, the ward could be set to affect aberrations or drow), or alignment. You can also set conditions for creatures that don\'t trigger the glyph, such as those who say a certain password. When you inscribe the glyph, choose *explosive runes* or a *spell glyph*. ***Explosive Runes.*** When triggered, the glyph erupts with magical energy in a 20-foot-radius sphere centered on the glyph. The sphere spreads around corners. Each creature in the area must make a Dexterity saving throw. A creature takes 5d8 acid, cold, fire, lightning, or thunder damage on a failed saving throw (your choice when you create the glyph), or half as much damage on a successful one. ***Spell Glyph.*** You can store a prepared spell of 3rd level or lower in the glyph by casting it as part of creating the glyph. The spell must target a single creature or an area. The spell being stored has no immediate effect when cast in this way. When the glyph is triggered, the stored spell is cast. If the spell has a target, it targets the creature that triggered the glyph. If the spell affects an area, the area is centered on that creature. If the spell summons hostile creatures or creates harmful objects or traps, they appear as close as possible to the intruder and attack it. If the spell requires concentration, it lasts until the end of its full duration.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage of an explosive runes glyph increases by 1d8 for each slot level above 3rd. If you create a spell glyph, you can store any spell of up to the same level as the slot you use for the glyph of warding.',
        tags: ['ABJURATION', 'DAMAGE', 'SUMMONING', 'UTILITY', 'SAVE']
    },
    'Grasping Vine': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Grasping Vine is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Green-Flame Blade': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Green-Flame Blade is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Guards and Wards': {
        school: 'Abjuration',
        castingTime: '10 minutes',
        range: 'Touch',
        components: 'V, S, M (Burning incense, a small measure of brimstone and oil, a knotted string, a small amount of umber hulk blood, and a small silver rod worth at least 10 gp.)',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        description: 'You create a ward that protects up to 2,500 square feet of floor space (an area 50 feet square, or one hundred 5-foot squares or twenty-five 10-foot squares). The warded area can be up to 20 feet tall, and shaped as you desire. You can ward several stories of a stronghold by dividing the area among them, as long as you can walk into each contiguous area while you are casting the spell. When you cast this spell, you can specify individuals that are unaffected by any or all of the effects that you choose. You can also specify a password that, when spoken aloud, makes the speaker immune to these effects. Guards and wards creates the following effects within the warded area. ***Corridors.*** Fog fills all the warded corridors, making them heavily obscured. In addition, at each intersection or branching passage offering a choice of direction, there is a 50 percent chance that a creature other than you will believe it is going in the opposite direction from the one it chooses. ***Doors.*** All doors in the warded area are magically locked, as if sealed by an arcane lock spell. In addition, you can cover up to ten doors with an illusion (equivalent to the illusory object function of the minor illusion spell) to make them appear as plain sections of wall. ***Stairs.*** Webs fill all stairs in the warded area from top to bottom, as the web spell. These strands regrow in 10 minutes if they are burned or torn away while guards and wards lasts. ***Other Spell Effect.*** You can place your choice of one of the following magical effects within the warded area of the stronghold. - Place dancing lights in four corridors. You can designate a simple program that the lights repeat as long as guards and wards lasts. - Place magic mouth in two locations. - Place stinking cloud in two locations. The vapors appear in the places you designate; they return within 10 minutes if dispersed by wind while guards and wards lasts. - Place a constant gust of wind in one corridor or room. - Place a suggestion in one location. You select an area of up to 5 feet square, and any creature that enters or passes through the area receives the suggestion mentally. The whole warded area radiates magic. A dispel magic cast on a specific effect, if successful, removes only that effect. You can create a permanently guarded and warded structure by casting this spell there every day for one year.',
        tags: ['ABJURATION', 'UTILITY']
    },
    'Gust of Wind': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A legume seed.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A line of strong wind 60 feet long and 10 feet wide blasts from you in a direction you choose for the spell\'s duration. Each creature that starts its turn in the line must succeed on a strength saving throw or be pushed 15 feet away from you in a direction following the line. Any creature in the line must spend 2 feet of movement for every 1 foot it moves when moving closer to you. The gust disperses gas or vapor, and it extinguishes candles, torches, and similar unprotected flames in the area. It causes protected flames, such as those of lanterns, to dance wildly and has a 50 percent chance to extinguish them. As a bonus action on each of your turns before the spell ends, you can change the direction in which the line blasts from you.',
        tags: ['EVOCATION', 'CONCENTRATION', 'UTILITY', 'SAVE']
    },
    'Hail of Thorns': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Hail of Thorns is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Hallow': {
        school: 'Evocation',
        castingTime: '24 hours',
        range: 'Touch',
        components: 'V, S, M (Herbs, oils, and incense worth at least 1,000 gp, which the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'You touch a point and infuse an area around it with holy (or unholy) power. The area can have a radius up to 60 feet, and the spell fails if the radius includes an area already under the effect a hallow spell. The affected area is subject to the following effects. First, celestials, elementals, fey, fiends, and undead can\'t enter the area, nor can such creatures charm, frighten, or possess creatures within it. Any creature charmed, frightened, or possessed by such a creature is no longer charmed, frightened, or possessed upon entering the area. You can exclude one or more of those types of creatures from this effect. Second, you can bind an extra effect to the area. Choose the effect from the following list, or choose an effect offered by the GM. Some of these effects apply to creatures in the area; you can designate whether the effect applies to all creatures, creatures that follow a specific deity or leader, or creatures of a specific sort, such as ores or trolls. When a creature that would be affected enters the spell\'s area for the first time on a turn or starts its turn there, it can make a charisma saving throw. On a success, the creature ignores the extra effect until it leaves the area. ***Courage.*** Affected creatures can\'t be frightened while in the area. ***Darkness.*** Darkness fills the area. Normal light, as well as magical light created by spells of a lower level than the slot you used to cast this spell, can\'t illuminate the area. ***Daylight.*** Bright light fills the area. Magical darkness created by spells of a lower level than the slot you used to cast this spell can\'t extinguish the light. ***Energy Protection.*** Affected creatures in the area have resistance to one damage type of your choice, except for bludgeoning, piercing, or slashing. ***Energy Vulnerability.*** Affected creatures in the area have vulnerability to one damage type of your choice, except for bludgeoning, piercing, or slashing. ***Everlasting Rest.*** Dead bodies interred in the area can\'t be turned into undead. ***Extradimensional Interference.*** Affected creatures can\'t move or travel using teleportation or by extradimensional or interplanar means. ***Fear.*** Affected creatures are frightened while in the area. ***Silence.*** No sound can emanate from within the area, and no sound can reach into it. ***Tongues.*** Affected creatures can communicate with any other creature in the area, even if they don\'t share a common language.',
        tags: ['EVOCATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Hallucinatory Terrain': {
        school: 'Illusion',
        castingTime: '10 minutes',
        range: '300 feet',
        components: 'V, S, M (A stone, a twig, and a bit of green plant.)',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        description: 'You make natural terrain in a 150-foot cube in range look, sound, and smell like some other sort of natural terrain. Thus, open fields or a road can be made to resemble a swamp, hill, crevasse, or some other difficult or impassable terrain. A pond can be made to seem like a grassy meadow, a precipice like a gentle slope, or a rock-strewn gully like a wide and smooth road. Manufactured structures, equipment, and creatures within the area aren\'t changed in appearance. The tactile characteristics of the terrain are unchanged, so creatures entering the area are likely to see through the illusion. If the difference isn\'t obvious by touch, a creature carefully examining the illusion can attempt an Intelligence (Investigation) check against your spell save DC to disbelieve it. A creature who discerns the illusion for what it is, sees it as a vague image superimposed on the terrain.',
        tags: ['ILLUSION', 'SAVE']
    },
    'Harm': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You unleash a virulent disease on a creature that you can see within range. The target must make a constitution saving throw. On a failed save, it takes 14d6 necrotic damage, or half as much damage on a successful save. The damage can\'t reduce the target\'s hit points below 1. If the target fails the saving throw, its hit point maximum is reduced for 1 hour by an amount equal to the necrotic damage it took. Any effect that removes a disease allows a creature\'s hit point maximum to return to normal before that time passes.',
        tags: ['NECROMANCY', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Haste': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A shaving of licorice root.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Choose a willing creature that you can see within range. Until the spell ends, the target\'s speed is doubled, it gains a +2 bonus to AC, it has advantage on dexterity saving throws, and it gains an additional action on each of its turns. That action can be used only to take the Attack (one weapon attack only), Dash, Disengage, Hide, or Use an Object action. When the spell ends, the target can\'t move or take actions until after its next turn, as a wave of lethargy sweeps over it.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Hellish Rebuke': {
        school: 'Evocation',
        castingTime: '1 reaction',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You point your finger, and the creature that damaged you is momentarily surrounded by hellish flames. The creature must make a dexterity saving throw. It takes 2d10 fire damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d10 for each slot level above 1st.',
        tags: ['EVOCATION', 'DAMAGE', 'SAVE']
    },
    'Heroes\' Feast': {
        school: 'Conjuration',
        castingTime: '10 minutes',
        range: '30 feet',
        components: 'V, S, M (A gem-encrusted bowl worth at least 1,000gp, which the spell consumes.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You bring forth a great feast, including magnificent food and drink. The feast takes 1 hour to consume and disappears at the end of that time, and the beneficial effects don\'t set in until this hour is over. Up to twelve other creatures can partake of the feast. A creature that partakes of the feast gains several benefits. The creature is cured of all diseases and poison, becomes immune to poison and being frightened, and makes all wisdom saving throws with advantage. Its hit point maximum also increases by 2d10, and it gains the same number of hit points. These benefits last for 24 hours.',
        tags: ['CONJURATION', 'HEALING', 'SAVE']
    },
    'Hold Person': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A small, straight piece of iron.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Choose a humanoid that you can see within range. The target must succeed on a wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another wisdom saving throw. On a success, the spell ends on the target.',
        higherLevels: 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd. The humanoids must be within 30 feet of each other when you target them.',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'SAVE']
    },
    'Hunger of Hadar': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Hunger of Hadar is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Ice Knife': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Ice Knife is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Ice Storm': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '300 feet',
        components: 'V, S, M (A pinch of dust and a few drops of water.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'A hail of rock-hard ice pounds to the ground in a 20-foot-radius, 40-foot-high cylinder centered on a point within range. Each creature in the cylinder must make a dexterity saving throw. A creature takes 2d8 bludgeoning damage and 4d6 cold damage on a failed save, or half as much damage on a successful one. Hailstones turn the storm\'s area of effect into difficult terrain until the end of your next turn.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level or higher, the bludgeoning damage increases by 1d8 for each slot level above 4th.',
        tags: ['EVOCATION', 'DAMAGE', 'SAVE']
    },
    'Identify': {
        school: 'Divination',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'V, S, M (A pearl worth at least 100gp and an owl feather.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'You choose one object that you must touch throughout the casting of the spell. If it is a magic item or some other magic-imbued object, you learn its properties and how to use them, whether it requires attunement to use, and how many charges it has, if any. You learn whether any spells are affecting the item and what they are. If the item was created by a spell, you learn which spell created it. If you instead touch a creature throughout the casting, you learn what spells, if any, are currently affecting it.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Illusory Script': {
        school: 'Illusion',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'S, M (A lead-based ink worth at least 10gp, which this spell consumes.)',
        duration: '10 days',
        concentration: false,
        ritual: true,
        description: 'You write on parchment, paper, or some other suitable writing material and imbue it with a potent illusion that lasts for the duration. To you and any creatures you designate when you cast the spell, the writing appears normal, written in your hand, and conveys whatever meaning you intended when you wrote the text. To all others, the writing appears as if it were written in an unknown or magical script that is unintelligible. Alternatively, you can cause the writing to appear to be an entirely different message, written in a different hand and language, though the language must be one you know. Should the spell be dispelled, the original script and the illusion both disappear. A creature with truesight can read the hidden message.',
        tags: ['ILLUSION', 'RITUAL']
    },
    'Imprisonment': {
        school: 'Abjuration',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S, M (A vellum depiction or a carved statuette in the likeness of the target, and a special component that varies according to the version of the spell you choose, worth at least 500gp per Hit Die of the target.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'You create a magical restraint to hold a creature that you can see within range. The target must succeed on a wisdom saving throw or be bound by the spell; if it succeeds, it is immune to this spell if you cast it again. While affected by this spell, the creature doesn\'t need to breathe, eat, or drink, and it doesn\'t age. Divination spells can\'t locate or perceive the target. When you cast the spell, you choose one of the following forms of imprisonment. ***Burial.*** The target is entombed far beneath the earth in a sphere of magical force that is just large enough to contain the target. Nothing can pass through the sphere, nor can any creature teleport or use planar travel to get into or out of it. The special component for this version of the spell is a small mithral orb. ***Chaining.*** Heavy chains, firmly rooted in the ground, hold the target in place. The target is restrained until the spell ends, and it can\'t move or be moved by any means until then. The special component for this version of the spell is a fine chain of precious metal. ***Hedged Prison.*** The spell transports the target into a tiny demiplane that is warded against teleportation and planar travel. The demiplane can be a labyrinth, a cage, a tower, or any similar confined structure or area of your choice. The special component for this version of the spell is a miniature representation of the prison made from jade. ***Minimus Containment.*** The target shrinks to a height of 1 inch and is imprisoned inside a gemstone or similar object. Light can pass through the gemstone normally (allowing the target to see out and other creatures to see in), but nothing else can pass through, even by means of teleportation or planar travel. The gemstone can\'t be cut or broken while the spell remains in effect. The special component for this version of the spell is a large, transparent gemstone, such as a corundum, diamond, or ruby. ***Slumber.*** The target falls asleep and can\'t be awoken. The special component for this version of the spell consists of rare soporific herbs. ***Ending the Spell.*** During the casting of the spell, in any of its versions, you can specify a condition that will cause the spell to end and release the target. The condition can be as specific or as elaborate as you choose, but the GM must agree that the condition is reasonable and has a likelihood of coming to pass. The conditions can be based on a creature\'s name, identity, or deity but otherwise must be based on observable actions or qualities and not based on intangibles such as level, class, or hit points. A dispel magic spell can end the spell only if it is cast as a 9th-level spell, targeting either the prison or the special component used to create it. You can use a particular special component to create only one prison at a time. If you cast the spell again using the same component, the target of the first casting is immediately freed from its binding.',
        tags: ['ABJURATION', 'HEALING', 'UTILITY', 'SAVE']
    },
    'Incendiary Cloud': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '150 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A swirling cloud of smoke shot through with white-hot embers appears in a 20-foot-radius sphere centered on a point within range. The cloud spreads around corners and is heavily obscured. It lasts for the duration or until a wind of moderate or greater speed (at least 10 miles per hour) disperses it. When the cloud appears, each creature in it must make a dexterity saving throw. A creature takes 10d8 fire damage on a failed save, or half as much damage on a successful one. A creature must also make this saving throw when it enters the spell\'s area for the first time on a turn or ends its turn there. The cloud moves 10 feet directly away from you in a direction that you choose at the start of each of your turns.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Inflict Wounds': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Make a melee spell attack against a creature you can reach. On a hit, the target takes 3d10 necrotic damage.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d10 for each slot level above 1st.',
        tags: ['NECROMANCY', 'DAMAGE']
    },
    'Insect Plague': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '300 feet',
        components: 'V, S, M (A few grains of sugar, some kernels of grain, and a smear of fat.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'Swarming, biting locusts fill a 20-foot-radius sphere centered on a point you choose within range. The sphere spreads around corners. The sphere remains for the duration, and its area is lightly obscured. The sphere\'s area is difficult terrain. When the area appears, each creature in it must make a constitution saving throw. A creature takes 4d10 piercing damage on a failed save, or half as much damage on a successful one. A creature must also make this saving throw when it enters the spell\'s area for the first time on a turn or ends its turn there.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d10 for each slot level above 5th.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Intellect Fortress': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Intellect Fortress is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Jallarzi\'s Storm of Radiance': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Jallarzi\'s Storm of Radiance is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Jump': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A grasshopper\'s hind leg.)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'You touch a creature. The creature\'s jump distance is tripled until the spell ends.',
        tags: ['TRANSMUTATION']
    },
    'Knock': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Choose an object that you can see within range. The object can be a door, a box, a chest, a set of manacles, a padlock, or another object that contains a mundane or magical means that prevents access. A target that is held shut by a mundane lock or that is stuck or barred becomes unlocked, unstuck, or unbarred. If the object has multiple locks, only one of them is unlocked. If you choose a target that is held shut with arcane lock, that spell is suppressed for 10 minutes, during which time the target can be opened and shut normally. When you cast the spell, a loud knock, audible from as far away as 300 feet, emanates from the target object.',
        tags: ['TRANSMUTATION']
    },
    'Legend Lore': {
        school: 'Divination',
        castingTime: '10 minutes',
        range: 'Self',
        components: 'V, S, M (Incense worth at least 250 gp, which the spell consumes, and four ivory strips worth at least 50 gp each.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Name or describe a person, place, or object. The spell brings to your mind a brief summary of the significant lore about the thing you named. The lore might consist of current tales, forgotten stories, or even secret lore that has never been widely known. If the thing you named isn\'t of legendary importance, you gain no information. The more information you already have about the thing, the more precise and detailed the information you receive is. The information you learn is accurate but might be couched in figurative language. For example, if you have a mysterious magic axe on hand the spell might yield this information: "Woe to the evildoer whose hand touches the axe, for even the haft slices the hand of the evil ones. Only a true Child of Stone, lover and beloved of Moradin, may awaken the true powers of the axe, and only with the sacred word *Rudnogg* on the lips."',
        tags: ['DIVINATION']
    },
    'Leomund\'s Secret Chest': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Leomund\'s Secret Chest is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Leomund\'s Tiny Hut': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Leomund\'s Tiny Hut is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Levitate': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (Either a small leather loop or a piece of golden wire bent into a cup shape with a long shank on one end.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'One creature or object of your choice that you can see within range rises vertically, up to 20 feet, and remains suspended there for the duration. The spell can levitate a target that weighs up to 500 pounds. An unwilling creature that succeeds on a constitution saving throw is unaffected. The target can move only by pushing or pulling against a fixed object or surface within reach (such as a wall or a ceiling), which allows it to move as if it were climbing. You can change the target\'s altitude by up to 20 feet in either direction on your turn. If you are the target, you can move up or down as part of your move. Otherwise, you can use your action to move the target, which must remain within the spell\'s range. When the spell ends, the target floats gently to the ground if it is still aloft.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY', 'SAVE']
    },
    'Light': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, M (A firefly or phosphorescent moss.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action. If you target an object held or worn by a hostile creature, that creature must succeed on a dexterity saving throw to avoid the spell.',
        tags: ['EVOCATION', 'SAVE']
    },
    'Lightning Bolt': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A bit of fur and a rod of amber, crystal, or glass.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one. The lightning ignites flammable objects in the area that aren\'t being worn or carried.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
        tags: ['EVOCATION', 'DAMAGE', 'SAVE']
    },
    'Lightning Lure': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Lightning Lure is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Locate Animals or Plants': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A bit of fur from a bloodhound.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: true,
        description: 'Describe or name a specific kind of beast or plant. Concentrating on the voice of nature in your surroundings, you learn the direction and distance to the closest creature or plant of that kind within 5 miles, if any are present.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Magic Jar': {
        school: 'Necromancy',
        castingTime: '1 minute',
        range: 'Self',
        components: 'V, S, M (A gem, crystal, reliquary, or some other ornamental container worth at least 500 gp.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'Your body falls into a catatonic state as your soul leaves it and enters the container you used for the spell\'s material component. While your soul inhabits the container, you are aware of your surroundings as if you were in the container\'s space. You can\'t move or use reactions. The only action you can take is to project your soul up to 100 feet out of the container, either returning to your living body (and ending the spell) or attempting to possess a humanoids body. You can attempt to possess any humanoid within 100 feet of you that you can see (creatures warded by a protection from evil and good or magic circle spell can\'t be possessed). The target must make a charisma saving throw. On a failure, your soul moves into the target\'s body, and the target\'s soul becomes trapped in the container. On a success, the target resists your efforts to possess it, and you can\'t attempt to possess it again for 24 hours. Once you possess a creature\'s body, you control it. Your game statistics are replaced by the statistics of the creature, though you retain your alignment and your Intelligence, Wisdom, and Charisma scores. You retain the benefit of your own class features. If the target has any class levels, you can\'t use any of its class features. Meanwhile, the possessed creature\'s soul can perceive from the container using its own senses, but it can\'t move or take actions at all. While possessing a body, you can use your action to return from the host body to the container if it is within 100 feet of you, returning the host creature\'s soul to its body. If the host body dies while you\'re in it, the creature dies, and you must make a charisma saving throw against your own spellcasting DC. On a success, you return to the container if it is within 100 feet of you. Otherwise, you die. If the container is destroyed or the spell ends, your soul immediately returns to your body. If your body is more than 100 feet away from you or if your body is dead when you attempt to return to it, you die. If another creature\'s soul is in the container when it is destroyed, the creature\'s soul returns to its body if the body is alive and within 100 feet. Otherwise, that creature dies. When the spell ends, the container is destroyed.',
        tags: ['NECROMANCY', 'UTILITY', 'SAVE']
    },
    'Magic Mouth': {
        school: 'Illusion',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S, M (A honeycomb and jade dust of at least 10 inches, the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: true,
        description: 'You plant a message to an object in the range of the spell. The message is verbalized when the trigger conditions are met. Choose an object that you see, and that is not worn or carried by another creature. Then say the message, which should not exceed 25 words but listening can take up to 10 minutes. Finally, establish the circumstances that trigger the spell to deliver your message. When these conditions are satisfied, a magical mouth appears on the object and it articulates the message imitating your voice, the same tone used during implantation of the message. If the selected object has a mouth or something that approaches such as the mouth of a statue, the magic mouth come alive at this point, giving the illusion that the words come from the mouth of the object. When you cast this spell, you may decide that the spell ends when the message is delivered or it can persist and repeat the message whenever circumstances occur. The triggering circumstance can be as general or as detailed as you like, though it must be based on visual or audible conditions that occur within 30 feet of the object. For example, you could instruct the mouth to speak when any creature moves within 30 feet of the object or when a silver bell rings within 30 feet of it.',
        tags: ['ILLUSION', 'RITUAL', 'UTILITY']
    },
    'Magic Stone': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Magic Stone is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Major Image': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A bit of fleece.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 20-foot cube. The image appears at a spot that you can see within range and lasts for the duration. It seems completely real, including sounds, smells, and temperature appropriate to the thing depicted. You can\'t create sufficient heat or cold to cause damage, a sound loud enough to deal thunder damage or deafen a creature, or a smell that might sicken a creature (like a troglodyte\'s stench). As long as you are within range of the illusion, you can use your action to cause the image to move to any other spot within range. As the image changes location, you can alter its appearance so that its movements appear natural for the image. For example, if you create an image of a creature and move it, you can alter the image so that it appears to be walking. Similarly, you can cause the illusion to make different sounds at different times, even making it carry on a conversation, for example. Physical interaction with the image reveals it to be an illusion, because things can pass through it. A creature that uses its action to examine the image can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the creature can see through the image, and its other sensory qualities become faint to the creature.',
        higherLevels: 'When you cast this spell using a spell slot of 6th level or higher, the spell lasts until dispelled, without requiring your concentration.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Mass Healing Word': {
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: '60 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'As you call out words of restoration, up to six creatures of your choice that you can see within range regain hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the healing increases by 1d4 for each slot level above 3rd.',
        tags: ['EVOCATION', 'HEALING']
    },
    'Maze': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You banish a creature that you can see within range into a labyrinthine demiplane. The target remains there for the duration or until it escapes the maze. The target can use its action to attempt to escape. When it does so, it makes a DC 20 Intelligence check. If it succeeds, it escapes, and the spell ends (a minotaur or goristro demon automatically succeeds). When the spell ends, the target reappears in the space it left or, if that space is occupied, in the nearest unoccupied space.',
        tags: ['CONJURATION', 'CONCENTRATION', 'UTILITY']
    },
    'Meld into Stone': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: '8 hours',
        concentration: false,
        ritual: true,
        description: 'You step into a stone object or surface large enough to fully contain your body, melding yourself and all the equipment you carry with the stone for the duration. Using your movement, you step into the stone at a point you can touch. Nothing of your presence remains visible or otherwise detectable by nonmagical senses. While merged with the stone, you can\'t see what occurs outside it, and any Wisdom (Perception) checks you make to hear sounds outside it are made with disadvantage. You remain aware of the passage of time and can cast spells on yourself while merged in the stone. You can use your movement to leave the stone where you entered it, which ends the spell. You otherwise can\'t move. Minor physical damage to the stone doesn\'t harm you, but its partial destruction or a change in its shape (to the extent that you no longer fit within it) expels you and deals 6d6 bludgeoning damage to you. The stone\'s complete destruction (or transmutation into a different substance) expels you and deals 50 bludgeoning damage to you. If expelled, you fall prone in an unoccupied space closest to where you first entered.',
        tags: ['TRANSMUTATION', 'RITUAL', 'DAMAGE', 'UTILITY']
    },
    'Message': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A short piece of copper wire.)',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'You point your finger toward a creature within range and whisper a message. The target (and only the target) hears the message and can reply in a whisper that only you can hear. You can cast this spell through solid objects if you are familiar with the target and know it is beyond the barrier. Magical silence, 1 foot of stone, 1 inch of common metal, a thin sheet of lead, or 3 feet of wood blocks the spell. The spell doesn\'t have to follow a straight line and can travel freely around corners or through openings.',
        tags: ['TRANSMUTATION', 'UTILITY']
    },
    'Mind Blank': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        description: 'Until the spell ends, one willing creature you touch is immune to psychic damage, any effect that would sense its emotions or read its thoughts, divination spells, and the charmed condition. The spell even foils wish spells and spells or effects of similar power used to affect the target\'s mind or to gain information about the target.',
        tags: ['ABJURATION', 'DAMAGE']
    },
    'Mind Sliver': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Mind Sliver is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Mind Spike': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Mind Spike is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Mirage Arcane': {
        school: 'Illusion',
        castingTime: '10 minutes',
        range: 'Sight',
        components: 'V, S',
        duration: '10 days',
        concentration: false,
        ritual: false,
        description: 'You make terrain in an area up to 1 mile square look, sound, smell, and even feel like some other sort of terrain. The terrain\'s general shape remains the same, however. Open fields or a road could be made to resemble a swamp, hill, crevasse, or some other difficult or impassable terrain. A pond can be made to seem like a grassy meadow, a precipice like a gentle slope, or a rock-strewn gully like a wide and smooth road. Similarly, you can alter the appearance of structures, or add them where none are present. The spell doesn\'t disguise, conceal, or add creatures. The illusion includes audible, visual, tactile, and olfactory elements, so it can turn clear ground into difficult terrain (or vice versa) or otherwise impede movement through the area. Any piece of the illusory terrain (such as a rock or stick) that is removed from the spell\'s area disappears immediately. Creatures with truesight can see through the illusion to the terrain\'s true form; however, all other elements of the illusion remain, so while the creature is aware of the illusion\'s presence, the creature can still physically interact with the illusion.',
        tags: ['ILLUSION', 'UTILITY']
    },
    'Mirror Image': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'Three illusory duplicates of yourself appear in your space. Until the spell ends, the duplicates move with you and mimic your actions, shifting position so it\'s impossible to track which image is real. You can use your action to dismiss the illusory duplicates. Each time a creature targets you with an attack during the spell\'s duration, roll a d20 to determine whether the attack instead targets one of your duplicates. If you have three duplicates, you must roll a 6 or higher to change the attack\'s target to a duplicate. With two duplicates, you must roll an 8 or higher. With one duplicate, you must roll an 11 or higher. A duplicate\'s AC equals 10 + your Dexterity modifier. If an attack hits a duplicate, the duplicate is destroyed. A duplicate can be destroyed only by an attack that hits it. It ignores all other damage and effects. The spell ends when all three duplicates are destroyed. A creature is unaffected by this spell if it can\'t see, if it relies on senses other than sight, such as blindsight, or if it can perceive illusions as false, as with truesight.',
        tags: ['ILLUSION', 'DAMAGE', 'UTILITY']
    },
    'Mislead': {
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: 'S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You become invisible at the same time that an illusory double of you appears where you are standing. The double lasts for the duration, but the invisibility ends if you attack or cast a spell. You can use your action to move your illusory double up to twice your speed and make it gesture, speak, and behave in whatever way you choose. You can see through its eyes and hear through its ears as if you were located where it is. On each of your turns as a bonus action, you can switch from using its senses to using your own, or back again. While you are using its senses, you are blinded and deafened in regard to your own surroundings.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE', 'UTILITY']
    },
    'Modify Memory': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You attempt to reshape another creature\'s memories. One creature that you can see must make a wisdom saving throw. If you are fighting the creature, it has advantage on the saving throw. On a failed save, the target becomes charmed by you for the duration. The charmed target is incapacitated and unaware of its surroundings, though it can still hear you. If it takes any damage or is targeted by another spell, this spell ends, and none of the target\'s memories are modified. While this charm lasts, you can affect the target\'s memory of an event that it experienced within the last 24 hours and that lasted no more than 10 minutes. You can permanently eliminate all memory of the event, allow the target to recall the event with perfect clarity and exacting detail, change its memory of the details of the event, or create a memory of some other event. You must speak to the target to describe how its memories are affected, and it must be able to understand your language for the modified memories to take root. Its mind fills in any gaps in the details of your description. If the spell ends before you have finished describing the modified memories, the creature\'s memory isn\'t altered. Otherwise, the modified memories take hold when the spell ends. A modified memory doesn\'t necessarily affect how a creature behaves, particularly if the memory contradicts the creature\'s natural inclinations, alignment, or beliefs. An illogical modified memory, such as implanting a memory of how much the creature enjoyed dousing itself in acid, is dismissed, perhaps as a bad dream. The GM might deem a modified memory too nonsensical to affect a creature in a significant manner. A remove curse or greater restoration spell cast on the target restores the creature\'s true memory.',
        higherLevels: 'If you cast this spell using a spell slot of 6th level or higher, you can alter the target\'s memories of an event that took place up to 7 days ago (6th level), 30 days ago (7th level), 1 year ago (8th level), or any time in the creature\'s past (9th level).',
        tags: ['ENCHANTMENT', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Mordenkainen\'s Faithful Hound': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Mordenkainen\'s Faithful Hound is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Mordenkainen\'s Magnificent Mansion': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Mordenkainen\'s Magnificent Mansion is a 7-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Mordenkainen\'s Sword': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Mordenkainen\'s Sword is a 7-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Move Earth': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (An iron blade and a small bag containing a mixture of soils--clay, loam, and sand.)',
        duration: 'Up to 2 hours',
        concentration: true,
        ritual: false,
        description: 'Choose an area of terrain no larger than 40 feet on a side within range. You can reshape dirt, sand, or clay in the area in any manner you choose for the duration. You can raise or lower the area\'s elevation, create or fill in a trench, erect or flatten a wall, or form a pillar. The extent of any such changes can\'t exceed half the area\'s largest dimension. So, if you affect a 40-foot square, you can create a pillar up to 20 feet high, raise or lower the square\'s elevation by up to 20 feet, dig a trench up to 20 feet deep, and so on. It takes 10 minutes for these changes to complete. At the end of every 10 minutes you spend concentrating on the spell, you can choose a new area of terrain to affect. Because the terrain\'s transformation occurs slowly, creatures in the area can\'t usually be trapped or injured by the ground\'s movement. This spell can\'t manipulate natural stone or stone construction. Rocks and structures shift to accommodate the new terrain. If the way you shape the terrain would make a structure unstable, it might collapse. Similarly, this spell doesn\'t directly affect plant growth. The moved earth carries any plants along with it.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY']
    },
    'Nondetection': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A pinch of diamond dust worth 25 gp sprinkled over the target, which the spell consumes.)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'For the duration, you hide a target that you touch from divination magic. The target can be a willing creature or a place or an object no larger than 10 feet in any dimension. The target can\'t be targeted by any divination magic or perceived through magical scrying sensors.',
        tags: ['ABJURATION']
    },
    'Otiluke\'s Freezing Sphere': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Otiluke\'s Freezing Sphere is a 6-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Otiluke\'s Resilient Sphere': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Otiluke\'s Resilient Sphere is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Otto\'s Irresistible Dance': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Otto\'s Irresistible Dance is a 6-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Passwall': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A pinch of sesame seeds.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'A passage appears at a point of your choice that you can see on a wooden, plaster, or stone surface (such as a wall, a ceiling, or a floor) within range, and lasts for the duration. You choose the opening\'s dimensions: up to 5 feet wide, 8 feet tall, and 20 feet deep. The passage creates no instability in a structure surrounding it. When the opening disappears, any creatures or objects still in the passage created by the spell are safely ejected to an unoccupied space nearest to the surface on which you cast the spell.',
        tags: ['TRANSMUTATION']
    },
    'Phantasmal Force': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Phantasmal Force is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Phantasmal Killer': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You tap into the nightmares of a creature you can see within range and create an illusory manifestation of its deepest fears, visible only to that creature. The target must make a wisdom saving throw. On a failed save, the target becomes frightened for the duration. At the start of each of the target\'s turns before the spell ends, the target must succeed on a wisdom saving throw or take 4d10 psychic damage. On a successful save, the spell ends.',
        higherLevels: 'When you cast this spell using a spell slot of 5th level or higher, the damage increases by 1d10 for each slot level above 4th.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Phantom Steed': {
        school: 'Illusion',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: true,
        description: 'A Large quasi-real, horselike creature appears on the ground in an unoccupied space of your choice within range. You decide the creature\'s appearance, but it is equipped with a saddle, bit, and bridle. Any of the equipment created by the spell vanishes in a puff of smoke if it is carried more than 10 feet away from the steed. For the duration, you or a creature you choose can ride the steed. The creature uses the statistics for a riding horse, except it has a speed of 100 feet and can travel 10 miles in an hour, or 13 miles at a fast pace. When the spell ends, the steed gradually fades, giving the rider 1 minute to dismount. The spell ends if you use an action to dismiss it or if the steed takes any damage.',
        tags: ['ILLUSION', 'RITUAL', 'DAMAGE', 'UTILITY']
    },
    'Planar Ally': {
        school: 'Conjuration',
        castingTime: '10 minutes',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You beseech an otherworldly entity for aid. The being must be known to you: a god, a primordial, a demon prince, or some other being of cosmic power. That entity sends a celestial, an elemental, or a fiend loyal to it to aid you, making the creature appear in an unoccupied space within range. If you know a specific creature\'s name, you can speak that name when you cast this spell to request that creature, though you might get a different creature anyway (GM\'s choice). When the creature appears, it is under no compulsion to behave in any particular way. You can ask the creature to perform a service in exchange for payment, but it isn\'t obliged to do so. The requested task could range from simple (fly us across the chasm, or help us fight a battle) to complex (spy on our enemies, or protect us during our foray into the dungeon). You must be able to communicate with the creature to bargain for its services. Payment can take a variety of forms. A celestial might require a sizable donation of gold or magic items to an allied temple, while a fiend might demand a living sacrifice or a gift of treasure. Some creatures might exchange their service for a quest undertaken by you. As a rule of thumb, a task that can be measured in minutes requires a payment worth 100 gp per minute. A task measured in hours requires 1,000 gp per hour. And a task measured in days (up to 10 days) requires 10,000 gp per day. The GM can adjust these payments based on the circumstances under which you cast the spell. If the task is aligned with the creature\'s ethos, the payment might be halved or even waived. Nonhazardous tasks typically require only half the suggested payment, while especially dangerous tasks might require a greater gift. Creatures rarely accept tasks that seem suicidal. After the creature completes the task, or when the agreed-upon duration of service expires, the creature returns to its home plane after reporting back to you, if appropriate to the task and if possible. If you are unable to agree on a price for the creature\'s service, the creature immediately returns to its home plane. A creature enlisted to join your group counts as a member of it, receiving a full share of experience points awarded.',
        tags: ['CONJURATION', 'UTILITY']
    },
    'Planar Binding': {
        school: 'Abjuration',
        castingTime: '1 hour',
        range: '60 feet',
        components: 'V, S, M (A jewel worth at least 1,000 gp, which the spell consumes.)',
        duration: '24 hours',
        concentration: false,
        ritual: false,
        description: 'With this spell, you attempt to bind a celestial, an elemental, a fey, or a fiend to your service. The creature must be within range for the entire casting of the spell. (Typically, the creature is first summoned into the center of an inverted magic circle in order to keep it trapped while this spell is cast.) At the completion of the casting, the target must make a charisma saving throw. On a failed save, it is bound to serve you for the duration. If the creature was summoned or created by another spell, that spell\'s duration is extended to match the duration of this spell. A bound creature must follow your instructions to the best of its ability. You might command the creature to accompany you on an adventure, to guard a location, or to deliver a message. The creature obeys the letter of your instructions, but if the creature is hostile to you, it strives to twist your words to achieve its own objectives. If the creature carries out your instructions completely before the spell ends, it travels to you to report this fact if you are on the same plane of existence. If you are on a different plane of existence, it returns to the place where you bound it and remains there until the spell ends.',
        higherLevels: 'When you cast this spell using a spell slot of a higher level, the duration increases to 10 days with a 6th-level slot, to 30 days with a 7th-level slot, to 180 days with an 8th-level slot, and to a year and a day with a 9th-level spell slot.',
        tags: ['ABJURATION', 'SUMMONING', 'UTILITY', 'SAVE']
    },
    'Poison Spray': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '10 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You extend your hand toward a creature you can see within range and project a puff of noxious gas from your palm. The creature must succeed on a constitution saving throw or take 1d12 poison damage. This spell\'s damage increases by 1d12 when you reach 5th level (2d12), 11th level (3d12), and 17th level (4d12).',
        tags: ['CONJURATION', 'DAMAGE', 'SAVE']
    },
    'Power Word Fortify': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Power Word Fortify is a 7-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Power Word Heal': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Power Word Heal is a 9-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'HEALING']
    },
    'Power Word Kill': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You utter a word of power that can compel one creature you can see within range to die instantly. If the creature you choose has 100 hit points or fewer, it dies. Otherwise, the spell has no effect.',
        tags: ['ENCHANTMENT', 'HEALING']
    },
    'Prestidigitation': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '10 feet',
        components: 'V, S',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within \'range\': You create an instantaneous, harmless sensory effect, such as a shower of sparks, a puff of wind, faint musical notes, or an odd odor. You instantaneously light or snuff out a candle, a torch, or a small campfire. You instantaneously clean or soil an object no larger than 1 cubic foot. You chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. You make a color, a small mark, or a symbol appear on an object or a surface for 1 hour. You create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn. If you cast this spell multiple times, you can have up to three of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action.',
        tags: ['TRANSMUTATION']
    },
    'Prismatic Spray': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Eight multicolored rays of light flash from your hand. Each ray is a different color and has a different power and purpose. Each creature in a 60-foot cone must make a dexterity saving throw. For each target, roll a d8 to determine which color ray affects it. ***1. Red.*** The target takes 10d6 fire damage on a failed save, or half as much damage on a successful one. ***2. Orange.*** The target takes 10d6 acid damage on a failed save, or half as much damage on a successful one. ***3. Yellow.*** The target takes 10d6 lightning damage on a failed save, or half as much damage on a successful one. ***4. Green.*** The target takes 10d6 poison damage on a failed save, or half as much damage on a successful one. ***5. Blue.*** The target takes 10d6 cold damage on a failed save, or half as much damage on a successful one. ***6. Indigo.*** On a failed save, the target is restrained. It must then make a constitution saving throw at the end of each of its turns. If it successfully saves three times, the spell ends. If it fails its save three times, it permanently turns to stone and is subjected to the petrified condition. The successes and failures don\'t need to be consecutive; keep track of both until the target collects three of a kind. ***7. Violet.*** On a failed save, the target is blinded. It must then make a wisdom saving throw at the start of your next turn. A successful save ends the blindness. If it fails that save, the creature is transported to another plane of existence of the GM\'s choosing and is no longer blinded. (Typically, a creature that is on a plane that isn\'t its home plane is banished home, while other creatures are usually cast into the Astral or Ethereal planes.) ***8. Special.*** The target is struck by two rays. Roll twice more, rerolling any 8.',
        tags: ['EVOCATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Prismatic Wall': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        description: 'A shimmering, multicolored plane of light forms a vertical opaque wall--up to 90 feet long, 30 feet high, and 1 inch thick--centered on a point you can see within range. Alternatively, you can shape the wall into a sphere up to 30 feet in diameter centered on a point you choose within range. The wall remains in place for the duration. If you position the wall so that it passes through a space occupied by a creature, the spell fails, and your action and the spell slot are wasted. The wall sheds bright light out to a range of 100 feet and dim light for an additional 100 feet. You and creatures you designate at the time you cast the spell can pass through and remain near the wall without harm. If another creature that can see the wall moves to within 20 feet of it or starts its turn there, the creature must succeed on a constitution saving throw or become blinded for 1 minute. The wall consists of seven layers, each with a different color. When a creature attempts to reach into or pass through the wall, it does so one layer at a time through all the wall\'s layers. As it passes or reaches through each layer, the creature must make a dexterity saving throw or be affected by that layer\'s properties as described below. The wall can be destroyed, also one layer at a time, in order from red to violet, by means specific to each layer. Once a layer is destroyed, it remains so for the duration of the spell. A rod of cancellation destroys a prismatic wall, but an antimagic field has no effect on it. ***1. Red.*** The creature takes 10d6 fire damage on a failed save, or half as much damage on a successful one. While this layer is in place, nonmagical ranged attacks can\'t pass through the wall. The layer can be destroyed by dealing at least 25 cold damage to it. ***2. Orange.*** The creature takes 10d6 acid damage on a failed save, or half as much damage on a successful one. While this layer is in place, magical ranged attacks can\'t pass through the wall. The layer is destroyed by a strong wind. ***3. Yellow.*** The creature takes 10d6 lightning damage on a failed save, or half as much damage on a successful one. This layer can be destroyed by dealing at least 60 force damage to it. ***4. Green.*** The creature takes 10d6 poison damage on a failed save, or half as much damage on a successful one. A passwall spell, or another spell of equal or greater level that can open a portal on a solid surface, destroys this layer. ***5. Blue.*** The creature takes 10d6 cold damage on a failed save, or half as much damage on a successful one. This layer can be destroyed by dealing at least 25 fire damage to it. ***6. Indigo.*** On a failed save, the creature is restrained. It must then make a constitution saving throw at the end of each of its turns. If it successfully saves three times, the spell ends. If it fails its save three times, it permanently turns to stone and is subjected to the petrified condition. The successes and failures don\'t need to be consecutive; keep track of both until the creature collects three of a kind. While this layer is in place, spells can\'t be cast through the wall. The layer is destroyed by bright light shed by a daylight spell or a similar spell of equal or higher level. ***7. Violet.*** On a failed save, the creature is blinded. It must then make a wisdom saving throw at the start of your next turn. A successful save ends the blindness. If it fails that save, the creature is transported to another plane of the GM\'s choosing and is no longer blinded. (Typically, a creature that is on a plane that isn\'t its home plane is banished home, while other creatures are usually cast into the Astral or Ethereal planes.) This layer is destroyed by a dispel magic spell or a similar spell of equal or higher level that can end spells and magical effects.',
        tags: ['ABJURATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Programmed Illusion': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A bit of fleece and jade dust worth at least 25 gp.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'You create an illusion of an object, a creature, or some other visible phenomenon within range that activates when a specific condition occurs. The illusion is imperceptible until then. It must be no larger than a 30-foot cube, and you decide when you cast the spell how the illusion behaves and what sounds it makes. This scripted performance can last up to 5 minutes. When the condition you specify occurs, the illusion springs into existence and performs in the manner you described. Once the illusion finishes performing, it disappears and remains dormant for 10 minutes. After this time, the illusion can be activated again. The triggering condition can be as general or as detailed as you like, though it must be based on visual or audible conditions that occur within 30 feet of the area. For example, you could create an illusion of yourself to appear and warn off others who attempt to open a trapped door, or you could set the illusion to trigger only when a creature says the correct word or phrase. Physical interaction with the image reveals it to be an illusion, because things can pass through it. A creature that uses its action to examine the image can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the creature can see through the image, and any noise it makes sounds hollow to the creature.',
        tags: ['ILLUSION', 'SAVE']
    },
    'Project Image': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '500 miles',
        components: 'V, S, M (A small replica of you made from materials worth at least 5 gp.)',
        duration: 'Up to 24 hours',
        concentration: true,
        ritual: false,
        description: 'You create an illusory copy of yourself that lasts for the duration. The copy can appear at any location within range that you have seen before, regardless of intervening obstacles. The illusion looks and sounds like you but is intangible. If the illusion takes any damage, it disappears, and the spell ends. You can use your action to move this illusion up to twice your speed, and make it gesture, speak, and behave in whatever way you choose. It mimics your mannerisms perfectly. You can see through its eyes and hear through its ears as if you were in its space. On your turn as a bonus action, you can switch from using its senses to using your own, or back again. While you are using its senses, you are blinded and deafened in regard to your own surroundings. Physical interaction with the image reveals it to be an illusion, because things can pass through it. A creature that uses its action to examine the image can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the creature can see through the image, and any noise it makes sounds hollow to the creature.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Protection from Energy': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'For the duration, the willing creature you touch has resistance to one damage type of your choice: acid, cold, fire, lightning, or thunder.',
        tags: ['ABJURATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Pyrotechnics': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Pyrotechnics is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Rary\'s Telepathic Bond': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Rary\'s Telepathic Bond is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Ray of Enfeeblement': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A black beam of enervating energy springs from your finger toward a creature within range. Make a ranged spell attack against the target. On a hit, the target deals only half damage with weapon attacks that use Strength until the spell ends. At the end of each of the target\'s turns, it can make a constitution saving throw against the spell. On a success, the spell ends.',
        tags: ['NECROMANCY', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Ray of Sickness': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Ray of Sickness is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Regenerate': {
        school: 'Transmutation',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'V, S, M (A prayer wheel and holy water.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch a creature and stimulate its natural healing ability. The target regains 4d8 + 15 hit points. For the duration of the spell, the target regains 1 hit point at the start of each of its turns (10 hit points each minute). The target\'s severed body members (fingers, legs, tails, and so on), if any, are restored after 2 minutes. If you have the severed part and hold it to the stump, the spell instantaneously causes the limb to knit to the stump.',
        tags: ['TRANSMUTATION', 'HEALING']
    },
    'Reincarnate': {
        school: 'Transmutation',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (Rare oils and unguents worth at least 1,000 gp, which the spell consumes.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You touch a dead humanoid or a piece of a dead humanoid. Provided that the creature has been dead no longer than 10 days, the spell forms a new adult body for it and then calls the soul to enter that body. If the target\'s soul isn\'t free or willing to do so, the spell fails. The magic fashions a new body for the creature to inhabit, which likely causes the creature\'s race to change. The GM rolls a d 100 and consults the following table to determine what form the creature takes when restored to life, or the GM chooses a form. | d100 | Race | |---|---| | 01-04 | Dragonborn | | 05-13 | Dwarf, hill | | 14-21 | Dwarf, mountain | | 22-25 | Elf, dark | | 26-34 | Elf, high | | 35-42 | Elf, wood | | 43-46 | Gnome, forest | | 47-52 | Gnome, rock | | 53-56 | Half-elf | | 57-60 | Half-orc | | 61-68 | Halfling, lightfoot | | 69-76 | Halfling, stout | | 77-96 | Human | | 97-00 | Tiefling | The reincarnated creature recalls its former life and experiences. It retains the capabilities it had in its original form, except it exchanges its original race for the new one and changes its racial traits accordingly.',
        tags: ['TRANSMUTATION', 'HEALING']
    },
    'Resistance': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A miniature cloak.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one saving throw of its choice. It can roll the die before or after making the saving throw. The spell then ends.',
        tags: ['ABJURATION', 'CONCENTRATION', 'SAVE']
    },
    'Reverse Gravity': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '100 feet',
        components: 'V, S, M (A lodestone and iron filings.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'This spell reverses gravity in a 50-foot-radius, 100-foot high cylinder centered on a point within range. All creatures and objects that aren\'t somehow anchored to the ground in the area fall upward and reach the top of the area when you cast this spell. A creature can make a dexterity saving throw to grab onto a fixed object it can reach, thus avoiding the fall. If some solid object (such as a ceiling) is encountered in this fall, falling objects and creatures strike it just as they would during a normal downward fall. If an object or creature reaches the top of the area without striking anything, it remains there, oscillating slightly, for the duration. At the end of the duration, affected objects and creatures fall back down.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'SAVE']
    },
    'Rope Trick': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (Powdered corn extract and a twisted loop of parchment.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'You touch a length of rope that is up to 60 feet long. One end of the rope then rises into the air until the whole rope hangs perpendicular to the ground. At the upper end of the rope, an invisible entrance opens to an extradimensional space that lasts until the spell ends. The extradimensional space can be reached by climbing to the top of the rope. The space can hold as many as eight Medium or smaller creatures. The rope can be pulled into the space, making the rope disappear from view outside the space. Attacks and spells can\'t cross through the entrance into or out of the extradimensional space, but those inside can see out of it as if through a 3-foot-by-5-foot window centered on the rope. Anything inside the extradimensional space drops out when the spell ends.',
        tags: ['TRANSMUTATION', 'DAMAGE']
    },
    'Sanctuary': {
        school: 'Abjuration',
        castingTime: '1 bonus action',
        range: '30 feet',
        components: 'V, S, M (A small silver mirror.)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'You ward a creature within range against attack. Until the spell ends, any creature who targets the warded creature with an attack or a harmful spell must first make a wisdom saving throw. On a failed save, the creature must choose a new target or lose the attack or spell. This spell doesn\'t protect the warded creature from area effects, such as the explosion of a fireball. If the warded creature makes an attack or casts a spell that affects an enemy creature, this spell ends.',
        tags: ['ABJURATION', 'DAMAGE', 'SAVE']
    },
    'Scrying': {
        school: 'Divination',
        castingTime: '10 minutes',
        range: 'Self',
        components: 'V, S, M (A focus worth at least 1,000 gp, such as a crystal ball, a silver mirror, or a font filled with holy water.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You can see and hear a particular creature you choose that is on the same plane of existence as you. The target must make a wisdom saving throw, which is modified by how well you know the target and the sort of physical connection you have to it. If a target knows you\'re casting this spell, it can fail the saving throw voluntarily if it wants to be observed. | Knowledge | Save Modifier | |---|---| | Secondhand (you have heard of the target) | +5 | | Firsthand (you have met the target) | +0 | | Familiar (you know the target well) | -5 | | Connection | Save Modifier | |---|---| | Likeness or picture | -2 | | Possession or garment | -4 | | Body part, lock of hair, bit of nail, or the like | -10 | On a successful save, the target isn\'t affected, and you can\'t use this spell against it again for 24 hours. On a failed save, the spell creates an invisible sensor within 10 feet of the target. You can see and hear through the sensor as if you were there. The sensor moves with the target, remaining within 10 feet of it for the duration. A creature that can see invisible objects sees the sensor as a luminous orb about the size of your fist. Instead of targeting a creature, you can choose a location you have seen before as the target of this spell. When you do, the sensor appears at that location and doesn\'t move.',
        tags: ['DIVINATION', 'CONCENTRATION', 'UTILITY', 'SAVE']
    },
    'See Invisibility': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A dash of talc and a small amount of silver powder.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'For the duration of the spell, you see invisible creatures and objects as if they were visible, and you can see through Ethereal. The ethereal objects and creatures appear ghostly translucent.',
        tags: ['DIVINATION']
    },
    'Seeming': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'This spell allows you to change the appearance of any number of creatures that you can see within range. You give each target you choose a new, illusory appearance. An unwilling target can make a charisma saving throw, and if it succeeds, it is unaffected by this spell. The spell disguises physical appearance as well as clothing, armor, weapons, and equipment. You can make each creature seem 1 foot shorter or taller and appear thin, fat, or in between. You can\'t change a target\'s body type, so you must choose a form that has the same basic arrangement of limbs. Otherwise, the extent of the illusion is up to you. The spell lasts for the duration, unless you use your action to dismiss it sooner. The changes wrought by this spell fail to hold up to physical inspection. For example, if you use this spell to add a hat to a creature\'s outfit, objects pass through the hat, and anyone who touches it would feel nothing or would feel the creature\'s head and hair. If you use this spell to appear thinner than you are, the hand of someone who reaches out to touch you would bump into you while it was seemingly still in midair. A creature can use its action to inspect a target and make an Intelligence (Investigation) check against your spell save DC. If it succeeds, it becomes aware that the target is disguised.',
        tags: ['ILLUSION', 'SAVE']
    },
    'Sending': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Unlimited',
        components: 'V, S, M (A short piece of fine copper wire.)',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'You send a short message of twenty-five words or less to a creature with which you are familiar. The creature hears the message in its mind, recognizes you as the sender if it knows you, and can answer in a like manner immediately. The spell enables creatures with Intelligence scores of at least 1 to understand the meaning of your message. You can send the message across any distance and even to other planes of existence, but if the target is on a different plane than you, there is a 5 percent chance that the message doesn\'t arrive.',
        tags: ['EVOCATION', 'UTILITY']
    },
    'Sequester': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A powder composed of diamond, emerald, ruby, and sapphire dust worth at least 5,000 gp, which the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'By means of this spell, a willing creature or an object can be hidden away, safe from detection for the duration. When you cast the spell and touch the target, it becomes invisible and can\'t be targeted by divination spells or perceived through scrying sensors created by divination spells. If the target is a creature, it falls into a state of suspended animation. Time ceases to flow for it, and it doesn\'t grow older. You can set a condition for the spell to end early. The condition can be anything you choose, but it must occur or be visible within 1 mile of the target. Examples include "after 1,000 years" or "when the tarrasque awakens." This spell also ends if the target takes any damage.',
        tags: ['TRANSMUTATION', 'DAMAGE']
    },
    'Silence': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: true,
        description: 'For the duration, no sound can be created within or pass through a 20-foot-radius sphere centered on a point you choose within range. Any creature or object entirely inside the sphere is immune to thunder damage, and creatures are deafened while entirely inside it. Casting a spell that includes a verbal component is impossible there.',
        tags: ['ILLUSION', 'RITUAL', 'CONCENTRATION', 'DAMAGE']
    },
    'Silent Image': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A bit of fleece.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create the image of an object, a creature, or some other visible phenomenon that is no larger than a 15-foot cube. The image appears at a spot within range and lasts for the duration. The image is purely visual; it isn\'t accompanied by sound, smell, or other sensory effects. You can use your action to cause the image to move to any spot within range. As the image changes location, you can alter its appearance so that its movements appear natural for the image. For example, if you create an image of a creature and move it, you can alter the image so that it appears to be walking. Physical interaction with the image reveals it to be an illusion, because things can pass through it. A creature that uses its action to examine the image can determine that it is an illusion with a successful Intelligence (Investigation) check against your spell save DC. If a creature discerns the illusion for what it is, the creature can see through the image.',
        tags: ['ILLUSION', 'CONCENTRATION', 'UTILITY', 'SAVE']
    },
    'Simulacrum': {
        school: 'Illusion',
        castingTime: '12 hours',
        range: 'Touch',
        components: 'V, S, M (Snow or ice in quantities sufficient to made a life-size copy of the duplicated creature; some hair, fingernail clippings, or other piece of that creature\'s body placed inside the snow or ice; and powdered ruby worth 1,500 gp, sprinkled over the duplicate and consumed by the spell.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'You shape an illusory duplicate of one beast or humanoid that is within range for the entire casting time of the spell. The duplicate is a creature, partially real and formed from ice or snow, and it can take actions and otherwise be affected as a normal creature. It appears to be the same as the original, but it has half the creature\'s hit point maximum and is formed without any equipment. Otherwise, the illusion uses all the statistics of the creature it duplicates. The simulacrum is friendly to you and creatures you designate. It obeys your spoken commands, moving and acting in accordance with your wishes and acting on your turn in combat. The simulacrum lacks the ability to learn or become more powerful, so it never increases its level or other abilities, nor can it regain expended spell slots. If the simulacrum is damaged, you can repair it in an alchemical laboratory, using rare herbs and minerals worth 100 gp per hit point it regains. The simulacrum lasts until it drops to 0 hit points, at which point it reverts to snow and melts instantly. If you cast this spell again, any currently active duplicates you created with this spell are instantly destroyed.',
        tags: ['ILLUSION', 'HEALING', 'DAMAGE']
    },
    'Skill Empowerment': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Skill Empowerment is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Skywrite': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Skywrite is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Sleep': {
        school: 'Enchantment',
        castingTime: '1 action',
        range: '90 feet',
        components: 'V, S, M (A pinch of fine sand, rose petals, or a cricket.)',
        duration: '1 minute',
        concentration: false,
        ritual: false,
        description: 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose within range are affected in ascending order of their current hit points (ignoring unconscious creatures). Starting with the creature that has the lowest current hit points, each creature affected by this spell falls unconscious until the spell ends, the sleeper takes damage, or someone uses an action to shake or slap the sleeper awake. Subtract each creature\'s hit points from the total before moving on to the creature with the next lowest hit points. A creature\'s hit points must be equal to or less than the remaining total for that creature to be affected. Undead and creatures immune to being charmed aren\'t affected by this spell.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d8 for each slot level above 1st.',
        tags: ['ENCHANTMENT', 'HEALING', 'DAMAGE']
    },
    'Sleet Storm': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '150 feet',
        components: 'V, S, M (A pinch of dust and a few drops of water.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Until the spell ends, freezing rain and sleet fall in a 20-foot-tall cylinder with a 40-foot radius centered on a point you choose within range. The area is heavily obscured, and exposed flames in the area are doused. The ground in the area is covered with slick ice, making it difficult terrain. When a creature enters the spell\'s area for the first time on a turn or starts its turn there, it must make a dexterity saving throw. On a failed save, it falls prone. If a creature is concentrating in the spell\'s area, the creature must make a successful constitution saving throw against your spell save DC or lose concentration.',
        tags: ['CONJURATION', 'CONCENTRATION', 'SAVE']
    },
    'Slow': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A drop of molasses.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You alter time around up to six creatures of your choice in a 40-foot cube within range. Each target must succeed on a wisdom saving throw or be affected by this spell for the duration. An affected target\'s speed is halved, it takes a -2 penalty to AC and dexterity saving throws, and it can\'t use reactions. On its turn, it can use either an action or a bonus action, not both. Regardless of the creature\'s abilities or magic items, it can\'t make more than one melee or ranged attack during its turn. If the creature attempts to cast a spell with a casting time of 1 action, roll a d20. On an 11 or higher, the spell doesn\'t take effect until the creature\'s next turn, and the creature must use its action on that turn to complete the spell. If it can\'t, the spell is wasted. A creature affected by this spell makes another wisdom saving throw at the end of its turn. On a successful save, the effect ends for it.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Snare': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Snare is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Sorcerous Burst': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Sorcerous Burst is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Spare the Dying': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You touch a living creature that has 0 hit points. The creature becomes stable. This spell has no effect on undead or constructs.',
        tags: ['NECROMANCY', 'HEALING']
    },
    'Speak with Animals': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '10 minutes',
        concentration: false,
        ritual: true,
        description: 'You gain the ability to comprehend and verbally communicate with beasts for the duration. The knowledge and awareness of many beasts is limited by their intelligence, but at a minimum, beasts can give you information about nearby locations and monsters, including whatever they can perceive or have perceived within the past day. You might be able to persuade a beast to perform a small favor for you, at the GM\'s discretion.',
        tags: ['DIVINATION', 'RITUAL']
    },
    'Speak with Dead': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: '10 feet',
        components: 'V, S, M (Burning incense.)',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        description: 'You grant the semblance of life and intelligence to a corpse of your choice within range, allowing it to answer the questions you pose. The corpse must still have a mouth and can\'t be undead. The spell fails if the corpse was the target of this spell within the last 10 days. Until the spell ends, you can ask the corpse up to five questions. The corpse knows only what it knew in life, including the languages it knew. Answers are usually brief, cryptic, or repetitive, and the corpse is under no compulsion to offer a truthful answer if you are hostile to it or it recognizes you as an enemy. This spell doesn\'t return the creature\'s soul to its body, only its animating spirit. Thus, the corpse can\'t learn new information, doesn\'t comprehend anything that has happened since it died, and can\'t speculate about future events.',
        tags: ['NECROMANCY']
    },
    'Speak with Plants': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: '10 minutes',
        concentration: false,
        ritual: false,
        description: 'You imbue plants within 30 feet of you with limited sentience and animation, giving them the ability to communicate with you and follow your simple commands. You can question plants about events in the spell\'s area within the past day, gaining information about creatures that have passed, weather, and other circumstances. You can also turn difficult terrain caused by plant growth (such as thickets and undergrowth) into ordinary terrain that lasts for the duration. Or you can turn ordinary terrain where plants are present into difficult terrain that lasts for the duration, causing vines and branches to hinder pursuers, for example. Plants might be able to perform other tasks on your behalf, at the GM\'s discretion. The spell doesn\'t enable plants to uproot themselves and move about, but they can freely move branches, tendrils, and stalks. If a plant creature is in the area, you can communicate with it as if you shared a common language, but you gain no magical ability to influence it. This spell can cause the plants created by the entangle spell to release a restrained creature.',
        tags: ['TRANSMUTATION', 'UTILITY']
    },
    'Spider Climb': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (A drop of bitumen and a spider.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces and upside down along ceilings, while leaving its hands free. The target also gains a climbing speed equal to its walking speed.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY']
    },
    'Staggering Smite': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Staggering Smite is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Starry Wisp': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Starry Wisp is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Steel Wind Strike': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Steel Wind Strike is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Stinking Cloud': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '90 feet',
        components: 'V, S, M (A rotten egg or several skunk cabbage leaves.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'You create a 20-foot-radius sphere of yellow, nauseating gas centered on a point within range. The cloud spreads around corners, and its area is heavily obscured. The cloud lingers in the air for the duration. Each creature that is completely within the cloud at the start of its turn must make a constitution saving throw against poison. On a failed save, the creature spends its action that turn retching and reeling. Creatures that don\'t need to breathe or are immune to poison automatically succeed on this saving throw. A moderate wind (at least 10 miles per hour) disperses the cloud after 4 rounds. A strong wind (at least 20 miles per hour) disperses it after 1 round.',
        tags: ['CONJURATION', 'CONCENTRATION', 'SAVE']
    },
    'Stoneskin': {
        school: 'Abjuration',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (Diamond dust worth 100 gp, which the spell consumes.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'This spell turns the flesh of a willing creature you touch as hard as stone. Until the spell ends, the target has resistance to nonmagical bludgeoning, piercing, and slashing damage.',
        tags: ['ABJURATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Storm of Vengeance': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: 'Sight',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A churning storm cloud forms, centered on a point you can see and spreading to a radius of 360 feet. Lightning flashes in the area, thunder booms, and strong winds roar. Each creature under the cloud (no more than 5,000 feet beneath the cloud) when it appears must make a constitution saving throw. On a failed save, a creature takes 2d6 thunder damage and becomes deafened for 5 minutes. Each round you maintain concentration on this spell, the storm produces additional effects on your turn. ***Round 2.*** Acidic rain falls from the cloud. Each creature and object under the cloud takes 1d6 acid damage. ***Round 3.*** You call six bolts of lightning from the cloud to strike six creatures or objects of your choice beneath the cloud. A given creature or object can\'t be struck by more than one bolt. A struck creature must make a dexterity saving throw. The creature takes 10d6 lightning damage on a failed save, or half as much damage on a successful one. ***Round 4.*** Hailstones rain down from the cloud. Each creature under the cloud takes 2d6 bludgeoning damage. ***Round 5-10.*** Gusts and freezing rain assail the area under the cloud. The area becomes difficult terrain and is heavily obscured. Each creature there takes 1d6 cold damage. Ranged weapon attacks in the area are impossible. The wind and rain count as a severe distraction for the purposes of maintaining concentration on spells. Finally, gusts of strong wind (ranging from 20 to 50 miles per hour) automatically disperse fog, mists, and similar phenomena in the area, whether mundane or magical.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Summon Aberration': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Aberration is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Beast': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Beast is a 2-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Celestial': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Celestial is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Construct': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Construct is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Elemental': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Elemental is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Fey': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Fey is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Fiend': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Fiend is a 6-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Summon Undead': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Summon Undead is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN', 'SUMMONING']
    },
    'Sunbeam': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S, M (A magnifying glass.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A beam of brilliant light flashes out from your hand in a 5-foot-wide, 60-foot-long line. Each creature in the line must make a constitution saving throw. On a failed save, a creature takes 6d8 radiant damage and is blinded until your next turn. On a successful save, it takes half as much damage and isn\'t blinded by this spell. Undead and oozes have disadvantage on this saving throw. You can create a new line of radiance as your action on any turn until the spell ends. For the duration, a mote of brilliant radiance shines in your hand. It sheds bright light in a 30-foot radius and dim light for an additional 30 feet. This light is sunlight.',
        tags: ['EVOCATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Sunburst': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 feet',
        components: 'V, S, M (Fire and a piece of sunstone.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'Brilliant sunlight flashes in a 60-foot radius centered on a point you choose within range. Each creature in that light must make a constitution saving throw. On a failed save, a creature takes 12d6 radiant damage and is blinded for 1 minute. On a successful save, it takes half as much damage and isn\'t blinded by this spell. Undead and oozes have disadvantage on this saving throw. A creature blinded by this spell makes another constitution saving throw at the end of each of its turns. On a successful save, it is no longer blinded. This spell dispels any darkness in its area that was created by a spell.',
        tags: ['EVOCATION', 'DAMAGE', 'SAVE']
    },
    'Sword Burst': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Sword Burst is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Symbol': {
        school: 'Abjuration',
        castingTime: '1 minute',
        range: 'Touch',
        components: 'V, S, M (Mercury, phosphorus, and powdered diamond and opal with a total value of at least 1,000 gp, which the spell consumes.)',
        duration: 'Until dispelled',
        concentration: false,
        ritual: false,
        description: 'When you cast this spell, you inscribe a harmful glyph either on a surface (such as a section of floor, a wall, or a table) or within an object that can be closed to conceal the glyph (such as a book, a scroll, or a treasure chest). If you choose a surface, the glyph can cover an area of the surface no larger than 10 feet in diameter. If you choose an object, that object must remain in its place; if the object is moved more than 10 feet from where you cast this spell, the glyph is broken, and the spell ends without being triggered. The glyph is nearly invisible, requiring an Intelligence (Investigation) check against your spell save DC to find it. You decide what triggers the glyph when you cast the spell. For glyphs inscribed on a surface, the most typical triggers include touching or stepping on the glyph, removing another object covering it, approaching within a certain distance of it, or manipulating the object that holds it. For glyphs inscribed within an object, the most common triggers are opening the object, approaching within a certain distance of it, or seeing or reading the glyph. You can further refine the trigger so the spell is activated only under certain circumstances or according to a creature\'s physical characteristics (such as height or weight), or physical kind (for example, the ward could be set to affect hags or shapechangers). You can also specify creatures that don\'t trigger the glyph, such as those who say a certain password. When you inscribe the glyph, choose one of the options below for its effect. Once triggered, the glyph glows, filling a 60-foot-radius sphere with dim light for 10 minutes, after which time the spell ends. Each creature in the sphere when the glyph activates is targeted by its effect, as is a creature that enters the sphere for the first time on a turn or ends its turn there. ***Death.*** Each target must make a constitution saving throw, taking 10d 10 necrotic damage on a failed save, or half as much damage on a successful save. ***Discord.*** Each target must make a constitution saving throw. On a failed save, a target bickers and argues with other creatures for 1 minute. During this time, it is incapable of meaningful communication and has disadvantage on attack rolls and ability checks. ***Fear.*** Each target must make a wisdom saving throw and becomes frightened for 1 minute on a failed save. While frightened, the target drops whatever it is holding and must move at least 30 feet away from the glyph on each of its turns, if able. ***Hopelessness.*** Each target must make a charisma saving throw. On a failed save, the target is overwhelmed with despair for 1 minute. During this time, it can\'t attack or target any creature with harmful abilities, spells, or other magical effects. ***Insanity.*** Each target must make an intelligence saving throw. On a failed save, the target is driven insane for 1 minute. An insane creature can\'t take actions, can\'t understand what other creatures say, can\'t read, and speaks only in gibberish. The GM controls its movement, which is erratic. ***Pain.*** Each target must make a constitution saving throw and becomes incapacitated with excruciating pain for 1 minute on a failed save. ***Sleep.*** Each target must make a wisdom saving throw and falls unconscious for 10 minutes on a failed save. A creature awakens if it takes damage or if someone uses an action to shake or slap it awake. ***Stunning.*** Each target must make a wisdom saving throw and becomes stunned for 1 minute on a failed save.',
        tags: ['ABJURATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Tasha\'s Bubbling Cauldron': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Tasha\'s Bubbling Cauldron is a 6-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Tasha\'s Caustic Brew': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Tasha\'s Caustic Brew is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Telekinesis': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You gain the ability to move or manipulate creatures or objects by thought. When you cast the spell, and as your action each round for the duration, you can exert your will on one creature or object that you can see within range, causing the appropriate effect below. You can affect the same target round after round, or choose a new one at any time. If you switch targets, the prior target is no longer affected by the spell. ***Creature.*** You can try to move a Huge or smaller creature. Make an ability check with your spellcasting ability contested by the creature\'s Strength check. If you win the contest, you move the creature up to 30 feet in any direction, including upward but not beyond the range of this spell. Until the end of your next turn, the creature is restrained in your telekinetic grip. A creature lifted upward is suspended in mid-air. On subsequent rounds, you can use your action to attempt to maintain your telekinetic grip on the creature by repeating the contest. ***Object.*** You can try to move an object that weighs up to 1,000 pounds. If the object isn\'t being worn or carried, you automatically move it up to 30 feet in any direction, but not beyond the range of this spell. If the object is worn or carried by a creature, you must make an ability check with your spellcasting ability contested by that creature\'s Strength check. If you succeed, you pull the object away from that creature and can move it up to 30 feet in any direction but not beyond the range of this spell. You can exert fine control on objects with your telekinetic grip, such as manipulating a simple tool, opening a door or a container, stowing or retrieving an item from an open container, or pouring the contents from a vial.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'UTILITY']
    },
    'Teleport': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '10 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'This spell instantly transports you and up to eight willing creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select. If you target an object, it must be able to fit entirely inside a 10-foot cube, and it can\'t be held or carried by an unwilling creature. The destination you choose must be known to you, and it must be on the same plane of existence as you. Your familiarity with the destination determines whether you arrive there successfully. The GM rolls d100 and consults the table. | Familiarity | Mishap | Similar Area | Off Target | On Target | |---|---|---|---|---| | Permanent circle | -- | -- | -- | 01-100 | | Associated object | -- | -- | -- | 01-100 | | Very familiar | 01-05 | 06-13 | 14-24 | 25-100 | | Seen casually | 01-33 | 34-43 | 44-53 | 54-100 | | Viewed once | 01-43 | 44-53 | 54-73 | 74-100 | | Description | 01-43 | 44-53 | 54-73 | 74-100 | | False destination | 01-50 | 51-100 | -- | -- | ***Familiarity.*** "Permanent circle" means a permanent teleportation circle whose sigil sequence you know. "Associated object" means that you possess an object taken from the desired destination within the last six months, such as a book from a wizard\'s library, bed linen from a royal suite, or a chunk of marble from a lich\'s secret tomb. "Very familiar" is a place you have been very often, a place you have carefully studied, or a place you can see when you cast the spell. "Seen casually" is someplace you have seen more than once but with which you aren\'t very familiar. "Viewed once" is a place you have seen once, possibly using magic. "Description" is a place whose location and appearance you know through someone else\'s description, perhaps from a map. "False destination" is a place that doesn\'t exist. Perhaps you tried to scry an enemy\'s sanctum but instead viewed an illusion, or you are attempting to teleport to a familiar location that no longer exists. ***On Target.*** You and your group (or the target object) appear where you want to. ***Off Target.*** You and your group (or the target object) appear a random distance away from the destination in a random direction. Distance off target is 1d10 x 1d10 percent of the distance that was to be traveled. For example, if you tried to travel 120 miles, landed off target, and rolled a 5 and 3 on the two d10s, then you would be off target by 15 percent, or 18 miles. The GM determines the direction off target randomly by rolling a d8 and designating 1 as north, 2 as northeast, 3 as east, and so on around the points of the compass. If you were teleporting to a coastal city and wound up 18 miles out at sea, you could be in trouble. ***Similar Area.*** You and your group (or the target object) wind up in a different area that\'s visually or thematically similar to the target area. If you are heading for your home laboratory, for example, you might wind up in another wizard\'s laboratory or in an alchemical supply shop that has many of the same tools and implements as your laboratory. Generally, you appear in the closest similar place, but since the spell has no range limit, you could conceivably wind up anywhere on the plane. ***Mishap.*** The spell\'s unpredictable magic results in a difficult journey. Each teleporting creature (or the target object) takes 3d10 force damage, and the GM rerolls on the table to see where you wind up (multiple mishaps can occur, dealing damage each time).',
        tags: ['CONJURATION', 'DAMAGE', 'UTILITY']
    },
    'Teleportation Circle': {
        school: 'Conjuration',
        castingTime: '1 minute',
        range: '10 feet',
        components: 'V, M (Rare chalks and inks infused with precious gems with 50 gp, which the spell consumes.)',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'As you cast the spell, you draw a 10-foot-diameter circle on the ground inscribed with sigils that link your location to a permanent teleportation circle of your choice whose sigil sequence you know and that is on the same plane of existence as you. A shimmering portal opens within the circle you drew and remains open until the end of your next turn. Any creature that enters the portal instantly appears within 5 feet of the destination circle or in the nearest unoccupied space if that space is occupied. Many major temples, guilds, and other important places have permanent teleportation circles inscribed somewhere within their confines. Each such circle includes a unique sigil sequence--a string of magical runes arranged in a particular pattern. When you first gain the ability to cast this spell, you learn the sigil sequences for two destinations on the Material Plane, determined by the GM. You can learn additional sigil sequences during your adventures. You can commit a new sigil sequence to memory after studying it for 1 minute. You can create a permanent teleportation circle by casting this spell in the same location every day for one year. You need not use the circle to teleport when you cast the spell in this way.',
        tags: ['CONJURATION', 'UTILITY']
    },
    'Thorn Whip': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Thorn Whip is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Thunderclap': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Thunderclap is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Thunderwave': {
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn\'t pushed. In addition, unsecured objects that are completely within the area of effect are automatically pushed 10 feet away from you by the spell\'s effect, and the spell emits a thunderous boom audible out to 300 feet.',
        higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.',
        tags: ['EVOCATION', 'DAMAGE', 'SAVE']
    },
    'Time Stop': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You briefly stop the flow of time for everyone but yourself. No time passes for other creatures, while you take 1d4 + 1 turns in a row, during which you can use actions and move as normal. This spell ends if one of the actions you use during this period, or any effects that you create during this period, affects a creature other than you or an object being worn or carried by someone other than you. In addition, the spell ends if you move to a place more than 1,000 feet from the location where you cast it.',
        tags: ['TRANSMUTATION', 'UTILITY']
    },
    'Tiny Servant': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Tiny Servant is a 3-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Toll the Dead': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Toll the Dead is a cantrip spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Tongues': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, M (A small clay model of a ziggurat.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'This spell grants the creature you touch the ability to understand any spoken language it hears. Moreover, when the target speaks, any creature that knows at least one language and can hear the target understands what it says.',
        tags: ['DIVINATION']
    },
    'Transmute Rock': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Transmute Rock is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Transport via Plants': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '10 feet',
        components: 'V, S',
        duration: '1 round',
        concentration: false,
        ritual: false,
        description: 'This spell creates a magical link between a Large or larger inanimate plant within range and another plant, at any distance, on the same plane of existence. You must have seen or touched the destination plant at least once before. For the duration, any creature can step into the target plant and exit from the destination plant by using 5 feet of movement.',
        tags: ['CONJURATION', 'UTILITY']
    },
    'True Polymorph': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A drop of mercury, a dollop of gum arabic, and a wisp of smoke.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'Choose one creature or nonmagical object that you can see within range. You transform the creature into a different creature, the creature into an object, or the object into a creature (the object must be neither worn nor carried by another creature). The transformation lasts for the duration, or until the target drops to 0 hit points or dies. If you concentrate on this spell for the full duration, the transformation becomes permanent. Shapechangers aren\'t affected by this spell. An unwilling creature can make a wisdom saving throw, and if it succeeds, it isn\'t affected by this spell. ***Creature into Creature.*** If you turn a creature into another kind of creature, the new form can be any kind you choose whose challenge rating is equal to or less than the target\'s (or its level, if the target doesn\'t have a challenge rating). The target\'s game statistics, including mental ability scores, are replaced by the statistics of the new form. It retains its alignment and personality. The target assumes the hit points of its new form, and when it reverts to its normal form, the creature returns to the number of hit points it had before it transformed. If it reverts as a result of dropping to 0 hit points, any excess damage carries over to its normal form. As long as the excess damage doesn\'t reduce the creature\'s normal form to 0 hit points, it isn\'t knocked unconscious. The creature is limited in the actions it can perform by the nature of its new form, and it can\'t speak, cast spells, or take any other action that requires hands or speech unless its new form is capable of such actions. The target\'s gear melds into the new form. The creature can\'t activate, use, wield, or otherwise benefit from any of its equipment. ***Object into Creature.*** You can turn an object into any kind of creature, as long as the creature\'s size is no larger than the object\'s size and the creature\'s challenge rating is 9 or lower. The creature is friendly to you and your companions. It acts on each of your turns. You decide what action it takes and how it moves. The GM has the creature\'s statistics and resolves all of its actions and movement. If the spell becomes permanent, you no longer control the creature. It might remain friendly to you, depending on how you have treated it. ***Creature into Object.*** If you turn a creature into an object, it transforms along with whatever it is wearing and carrying into that form. The creature\'s statistics become those of the object, and the creature has no memory of time spent in this form, after the spell ends and it returns to its normal form.',
        tags: ['TRANSMUTATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'True Resurrection': {
        school: 'Necromancy',
        castingTime: '1 hour',
        range: 'Touch',
        components: 'V, S, M (A sprinkle of holy water and diamonds worth at least 25,000gp, which the spell consumes.)',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You touch a creature that has been dead for no longer than 200 years and that died for any reason except old age. If the creature\'s soul is free and willing, the creature is restored to life with all its hit points. This spell closes all wounds, neutralizes any poison, cures all diseases, and lifts any curses affecting the creature when it died. The spell replaces damaged or missing organs and limbs. The spell can even provide a new body if the original no longer exists, in which case you must speak the creature\'s name. The creature then appears in an unoccupied space you choose within 10 feet of you.',
        tags: ['NECROMANCY', 'HEALING', 'DAMAGE']
    },
    'True Seeing': {
        school: 'Divination',
        castingTime: '1 action',
        range: 'Touch',
        components: 'V, S, M (An ointment for the eyes that costs 25gp; is made from mushroom powder, saffron, and fat; and is consumed by the spell.)',
        duration: '1 hour',
        concentration: false,
        ritual: false,
        description: 'This spell gives the willing creature you touch the ability to see things as they actually are. For the duration, the creature has truesight, notices secret doors hidden by magic, and can see into the Ethereal Plane, all out to a range of 120 feet.',
        tags: ['DIVINATION', 'UTILITY']
    },
    'True Strike': {
        school: 'Divination',
        castingTime: '1 action',
        range: '30 feet',
        components: 'S',
        duration: 'Up to 1 round',
        concentration: true,
        ritual: false,
        description: 'You extend your hand and point a finger at a target in range. Your magic grants you a brief insight into the target\'s defenses. On your next turn, you gain advantage on your first attack roll against the target, provided that this spell hasn\'t ended.',
        tags: ['DIVINATION', 'CONCENTRATION', 'DAMAGE']
    },
    'Tsunami': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Tsunami is a 8-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Unseen Servant': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A piece of string and a bit of wood.)',
        duration: '1 hour',
        concentration: false,
        ritual: true,
        description: 'This spell creates an invisible, mindless, shapeless force that performs simple tasks at your command until the spell ends. The servant springs into existence in an unoccupied space on the ground within range. It has AC 10, 1 hit point, and a Strength of 2, and it can\'t attack. If it drops to 0 hit points, the spell ends. Once on each of your turns as a bonus action, you can mentally command the servant to move up to 15 feet and interact with an object. The servant can perform simple tasks that a human servant could do, such as fetching things, cleaning, mending, folding clothes, lighting fires, serving food, and pouring wine. Once you give the command, the servant performs the task to the best of its ability until it completes the task, then waits for your next command. If you command the servant to perform a task that would move it more than 60 feet away from you, the spell ends.',
        tags: ['CONJURATION', 'RITUAL', 'HEALING', 'DAMAGE', 'UTILITY']
    },
    'Vampiric Touch': {
        school: 'Necromancy',
        castingTime: '1 action',
        range: 'Self',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'The touch of your shadow-wreathed hand can siphon life force from others to heal your wounds. Make a melee spell attack against a creature within your reach. On a hit, the target takes 3d6 necrotic damage, and you regain hit points equal to half the amount of necrotic damage dealt. Until the spell ends, you can make the attack again on each of your turns as an action.',
        higherLevels: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
        tags: ['NECROMANCY', 'CONCENTRATION', 'HEALING', 'DAMAGE']
    },
    'Vitriolic Sphere': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Vitriolic Sphere is a 4-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Wall of Ice': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A small piece of quartz.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create a wall of ice on a solid surface within range. You can form it into a hemispherical dome or a sphere with a radius of up to 10 feet, or you can shape a flat surface made up of ten 10-foot-square panels. Each panel must be contiguous with another panel. In any form, the wall is 1 foot thick and lasts for the duration. If the wall cuts through a creature\'s space when it appears, the creature within its area is pushed to one side of the wall and must make a dexterity saving throw. On a failed save, the creature takes 10d6 cold damage, or half as much damage on a successful save. The wall is an object that can be damaged and thus breached. It has AC 12 and 30 hit points per 10-foot section, and it is vulnerable to fire damage. Reducing a 10-foot section of wall to 0 hit points destroys it and leaves behind a sheet of frigid air in the space the wall occupied. A creature moving through the sheet of frigid air for the first time on a turn must make a constitution saving throw. That creature takes 5d6 cold damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, the damage the wall deals when it appears increases by 2d6, and the damage from passing through the sheet of frigid air increases by 1d6, for each slot level above 6th.',
        tags: ['EVOCATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'SAVE']
    },
    'Wall of Stone': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A small block of granite.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'A nonmagical wall of solid stone springs into existence at a point you choose within range. The wall is 6 inches thick and is composed of ten 10-foot-by-10-foot panels. Each panel must be contiguous with at least one other panel. Alternatively, you can create 10-foot-by-20-foot panels that are only 3 inches thick. If the wall cuts through a creature\'s space when it appears, the creature is pushed to one side of the wall (your choice). If a creature would be surrounded on all sides by the wall (or the wall and another solid surface), that creature can make a dexterity saving throw. On a success, it can use its reaction to move up to its speed so that it is no longer enclosed by the wall. The wall can have any shape you desire, though it can\'t occupy the same space as a creature or object. The wall doesn\'t need to be vertical or rest on any firm foundation. It must, however, merge with and be solidly supported by existing stone. Thus, you can use this spell to bridge a chasm or create a ramp. If you create a span greater than 20 feet in length, you must halve the size of each panel to create supports. You can crudely shape the wall to create crenellations, battlements, and so on. The wall is an object made of stone that can be damaged and thus breached. Each panel has AC 15 and 30 hit points per inch of thickness. Reducing a panel to 0 hit points destroys it and might cause connected panels to collapse at the GM\'s discretion. If you maintain your concentration on this spell for its whole duration, the wall becomes permanent and can\'t be dispelled. Otherwise, the wall disappears when the spell ends.',
        tags: ['EVOCATION', 'CONCENTRATION', 'HEALING', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Wall of Thorns': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A handful of thorns.)',
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: 'You create a wall of tough, pliable, tangled brush bristling with needle-sharp thorns. The wall appears within range on a solid surface and lasts for the duration. You choose to make the wall up to 60 feet long, 10 feet high, and 5 feet thick or a circle that has a 20-foot diameter and is up to 20 feet high and 5 feet thick. The wall blocks line of sight. When the wall appears, each creature within its area must make a dexterity saving throw. On a failed save, a creature takes 7d8 piercing damage, or half as much damage on a successful save. A creature can move through the wall, albeit slowly and painfully. For every 1 foot a creature moves through the wall, it must spend 4 feet of movement. Furthermore, the first time a creature enters the wall on a turn or ends its turn there, the creature must make a dexterity saving throw. It takes 7d8 slashing damage on a failed save, or half as much damage on a successful one.',
        higherLevels: 'When you cast this spell using a spell slot of 7th level or higher, both types of damage increase by 1d8 for each slot level above 6th.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'UTILITY', 'SAVE']
    },
    'Water Breathing': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A short piece of reed or straw.)',
        duration: '24 hours',
        concentration: false,
        ritual: true,
        description: 'This spell gives a maximum of ten willing creatures within range and you can see, the ability to breathe underwater until the end of its term. Affected creatures also retain their normal breathing pattern.',
        tags: ['TRANSMUTATION', 'RITUAL']
    },
    'Water Walk': {
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: 'V, S, M (A piece of cork.)',
        duration: '1 hour',
        concentration: false,
        ritual: true,
        description: 'This spell grants the ability to move across any liquid surface--such as water, acid, mud, snow, quicksand, or lava--as if it were harmless solid ground (creatures crossing molten lava can still take damage from the heat). Up to ten willing creatures you can see within range gain this ability for the duration. If you target a creature submerged in a liquid, the spell carries the target to the surface of the liquid at a rate of 60 feet per round.',
        tags: ['TRANSMUTATION', 'RITUAL', 'DAMAGE', 'UTILITY']
    },
    'Web': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S, M (A bit of spiderweb.)',
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: 'You conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube from that point for the duration. The webs are difficult terrain and lightly obscure their area. If the webs aren\'t anchored between two solid masses (such as walls or trees) or layered across a floor, wall, or ceiling, the conjured web collapses on itself, and the spell ends at the start of your next turn. Webs layered over a flat surface have a depth of 5 feet. Each creature that starts its turn in the webs or that enters them during its turn must make a dexterity saving throw. On a failed save, the creature is restrained as long as it remains in the webs or until it breaks free. A creature restrained by the webs can use its action to make a Strength check against your spell save DC. If it succeeds, it is no longer restrained. The webs are flammable. Any 5-foot cube of webs exposed to fire burns away in 1 round, dealing 2d4 fire damage to any creature that starts its turn in the fire.',
        tags: ['CONJURATION', 'CONCENTRATION', 'DAMAGE', 'SUMMONING', 'SAVE']
    },
    'Weird': {
        school: 'Illusion',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'Drawing on the deepest fears of a group of creatures, you create illusory creatures in their minds, visible only to them. Each creature in a 30-foot-radius sphere centered on a point of your choice within range must make a wisdom saving throw. On a failed save, a creature becomes frightened for the duration. The illusion calls on the creature\'s deepest fears, manifesting its worst nightmares as an implacable threat. At the start of each of the frightened creature\'s turns, it must succeed on a wisdom saving throw or take 4d10 psychic damage. On a successful save, the spell ends for that creature.',
        tags: ['ILLUSION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Wind Walk': {
        school: 'Transmutation',
        castingTime: '1 minute',
        range: '30 feet',
        components: 'V, S, M (Fire and holy water.)',
        duration: '8 hours',
        concentration: false,
        ritual: false,
        description: 'You and up to ten willing creatures you can see within range assume a gaseous form for the duration, appearing as wisps of cloud. While in this cloud form, a creature has a flying speed of 300 feet and has resistance to damage from nonmagical weapons. The only actions a creature can take in this form are the Dash action or to revert to its normal form. Reverting takes 1 minute, during which time a creature is incapacitated and can\'t move. Until the spell ends, a creature can revert to cloud form, which also requires the 1-minute transformation. If a creature is in cloud form and flying when the effect ends, the creature descends 60 feet per round for 1 minute until it lands, which it does safely. If it can\'t land after 1 minute, the creature falls the remaining distance.',
        tags: ['TRANSMUTATION', 'DAMAGE', 'UTILITY']
    },
    'Wind Wall': {
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: 'V, S, M (A tiny fan and a feather of exotic origin.)',
        duration: 'Up to 1 minute',
        concentration: true,
        ritual: false,
        description: 'A wall of strong wind rises from the ground at a point you choose within range. You can make the wall up to 50 feet long, 15 feet high, and 1 foot thick. You can shape the wall in any way you choose so long as it makes one continuous path along the ground. The wall lasts for the duration. When the wall appears, each creature within its area must make a strength saving throw. A creature takes 3d8 bludgeoning damage on a failed save, or half as much damage on a successful one. The strong wind keeps fog, smoke, and other gases at bay. Small or smaller flying creatures or objects can\'t pass through the wall. Loose, lightweight materials brought into the wall fly upward. Arrows, bolts, and other ordinary projectiles launched at targets behind the wall are deflected upward and automatically miss. (Boulders hurled by giants or siege engines, and similar projectiles, are unaffected.) Creatures in gaseous form can\'t pass through it.',
        tags: ['EVOCATION', 'CONCENTRATION', 'DAMAGE', 'SAVE']
    },
    'Witch Bolt': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Witch Bolt is a 1-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },
    'Word of Recall': {
        school: 'Conjuration',
        castingTime: '1 action',
        range: '5 feet',
        components: 'V',
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: 'You and up to five willing creatures within 5 feet of you instantly teleport to a previously designated sanctuary. You and any creatures that teleport with you appear in the nearest unoccupied space to the spot you designated when you prepared your sanctuary (see below). If you cast this spell without first preparing a sanctuary, the spell has no effect. You must designate a sanctuary by casting this spell within a location, such as a temple, dedicated to or strongly linked to your deity. If you attempt to cast the spell in this manner in an area that isn\'t dedicated to your deity, the spell has no effect.',
        tags: ['CONJURATION', 'UTILITY']
    },
    'Yolande\'s Regal Presence': {
        school: 'Unknown',
        castingTime: 'See official rules',
        range: 'See official rules',
        components: 'See official rules',
        duration: 'See official rules',
        concentration: false,
        ritual: false,
        description: 'Yolande\'s Regal Presence is a 5-level spell in the current catalog. Detailed local rules text is not yet available; use the source reference link for complete wording.',
        tags: ['UNKNOWN']
    },

};
