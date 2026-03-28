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
        castingTime: '1 reaction (when hit by attack or targeted by magic missile)',
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
    }
};
