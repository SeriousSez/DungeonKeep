export interface SubclassFeatureDetail {
    name: string;
    description: string;
}

export const subclassFeatureProgressionByClass: Record<string, Record<string, Record<number, SubclassFeatureDetail | ReadonlyArray<SubclassFeatureDetail>>>> = {
    Artificer: {
        Alchemist: {
            3: { name: 'Experimental Elixirs', description: 'At the end of a Long Rest you brew magical elixirs, and by spending spell slots you can make more that heal, raise AC, boost speed, add a d4 to attacks and saves, grant brief flight, or mimic Alter Self.' },
            5: { name: 'Alchemical Savant', description: 'When you cast through alchemist\'s supplies, add your Intelligence modifier to one healing roll or one acid, fire, necrotic, or poison damage roll.' },
            9: { name: 'Restorative Reagents', description: 'Creatures that drink your elixirs also gain Temporary Hit Points, and you can cast Lesser Restoration for free several times per Long Rest.' },
            15: { name: 'Chemical Mastery', description: 'You gain Resistance to acid and poison, Immunity to the Poisoned condition, and can cast Greater Restoration and Heal without a spell slot once per Long Rest.' }
        },
        Armorer: {
            3: { name: 'Arcane Armor', description: 'You turn a suit of armor into magical Arcane Armor, use it as a focus, ignore its Strength requirement, and choose Guardian or Infiltrator for taunting thunder gauntlets or a lightning launcher with stealth and speed bonuses.' },
            5: { name: 'Extra Attack', description: 'You can attack twice whenever you take the Attack action, letting your armor weapons keep pace in melee or at range.' },
            9: { name: 'Armor Modifications', description: 'Your Arcane Armor splits into multiple infusion slots for the chest, boots, helmet, and special weapon, and your total active infusions increase.' },
            15: { name: 'Perfected Armor', description: 'Guardian armor can yank nearby foes toward you and strike them, while Infiltrator armor lights enemies up, hinders their attacks against you, and sets up your allies\' next hit.' }
        },
        Artillerist: {
            3: { name: 'Eldritch Cannon', description: 'You create a magical cannon that, as a Bonus Action, can fire a force bolt, breathe a 15-foot cone of flame, or grant nearby allies Temporary Hit Points.' },
            5: { name: 'Arcane Firearm', description: 'A carved wand, staff, or rod becomes an Arcane Firearm that adds 1d8 to one damage roll of an artificer spell you cast through it.' },
            9: { name: 'Explosive Cannon', description: 'Your cannon attacks deal an extra 1d8 damage, and you can detonate a cannon to force creatures within 20 feet to take 3d8 Force damage on a failed save.' },
            15: { name: 'Fortified Position', description: 'You can maintain two cannons at once, activate both with one Bonus Action, and creatures near them gain Half Cover from their protective field.' }
        },
        'Battle Smith': {
            3: { name: 'Steel Defender', description: 'You gain martial weapon training, use Intelligence with magic weapons, and command a Steel Defender that can attack on your Bonus Action and impose Disadvantage on attacks against nearby allies.' },
            5: { name: 'Extra Attack', description: 'You can attack twice whenever you take the Attack action, supporting a more martial artificer playstyle.' },
            9: { name: 'Arcane Jolt', description: 'When you or your Steel Defender hit, you can channel magic through the blow to deal an extra 2d6 Force damage or heal a creature or object within 30 feet for 2d6.' },
            15: { name: 'Improved Defender', description: 'Your Steel Defender gains +2 AC, Deflect Attack deals retaliatory force damage, and Arcane Jolt improves to 4d6 damage or healing.' }
        }
    },
    Barbarian: {
        'Path of the Berserker': {
            3: { name: 'Frenzy', description: 'While raging, if you use Reckless Attack, the first Strength-based attack that hits on your turn deals extra damage equal to a number of d6s equal to your Rage Damage bonus.' },
            6: { name: 'Mindless Rage', description: 'While your Rage is active, you have Immunity to the Charmed and Frightened conditions, and those conditions end on you when you enter your Rage.' },
            10: { name: 'Retaliation', description: 'When a creature within 5 feet damages you, you can use your Reaction to make one melee attack against it with a weapon or Unarmed Strike.' },
            14: { name: 'Intimidating Presence', description: 'As a Bonus Action, you can strike terror into others with your menacing presence and primal power. When you do so, each creature of your choice in a 30-foot Emanation originating from you must make a Wisdom saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, a creature has the Frightened condition for 1 minute. At the end of each of the Frightened creature’s turns, the creature repeats the save, ending the effect on itself on a success. \n\nOnce you use this feature, you can’t use it again until you finish a Long Rest unless you expend a use of your Rage (no action required) to restore your use of it.' }
        },
        'Path of the Wild Heart': {
            3: { name: 'Wild Heart Attunement', description: 'Choose a bestial focus to shape how your Rage performs in exploration and combat.' },
            6: { name: 'Wild Heart Adaptation', description: 'Your primal bond evolves, giving you improved movement or environmental resilience.' },
            10: { name: 'Nature Channeling', description: 'You deepen your communion with the wild, gaining stronger utility and battlefield presence.' },
            14: { name: 'Heart of the Wild', description: 'Your primal path reaches full force, amplifying your survivability and encounter impact while raging.' }
        },
        'Path of the World Tree': {
            3: { name: 'Vitality of the Tree', description: 'Rage channels world-root vitality, reinforcing your durability and frontline staying power.' },
            6: { name: 'Branches of the Tree', description: 'You project protective roots that influence positioning and help allies hold the line.' },
            10: { name: 'Battering Roots', description: 'Your strikes and presence become control tools that displace enemies and shape the battlefield.' },
            14: { name: 'Travel Along the Tree', description: 'You tap deeper world-root pathways, gaining powerful mobility and team-support tempo in difficult fights.' }
        },
        'Path of the Zealot': {
            3: { name: 'Divine Fury', description: 'While raging, the first creature you hit with a weapon attack on each of your turns takes extra Radiant or Necrotic damage equal to 1d6 plus half your Barbarian level.' },
            6: { name: 'Fanatical Focus', description: 'Once per Rage, if you fail a saving throw while raging, you can reroll it and must use the new roll.' },
            10: { name: 'Zealous Presence', description: 'As a Bonus Action once per Long Rest, up to 10 other creatures of your choice within 60 feet that can hear you gain Advantage on attack rolls and saving throws until the start of your next turn.' },
            14: { name: 'Rage Beyond Death', description: 'While you are raging, having 0 hit points does not knock you unconscious. You still make death saving throws and still suffer the normal effects of taking damage at 0 hit points, but you do not die from failed death saves until your Rage ends unless you regain hit points first.' }
        }
    },
    'Blood Hunter': {
        'Order of the Ghostslayer': {
            3: [
                { name: 'Curse Specialist', description: 'You learn an additional Blood Curse, and your amplified curses bite especially hard against undead prey.' },
                { name: 'Rite of the Dawn', description: 'Your rite can blaze with Radiant power, helping you burn through sinister creatures and unholy resilience.' }
            ],
            7: { name: 'Ethereal Step', description: 'Step briefly through the Ethereal Plane to slip past threats, hazards, and bad positioning.' },
            11: { name: 'Brand of Sundering', description: 'Your Brand tears harder at extraplanar and spectral foes, making escape and concealment much harder for them.' },
            15: { name: 'Rite Revival', description: 'When you fall in battle, your rite can flare and drag you back up for a desperate final stand.' }
        },
        'Order of the Lycan': {
            3: [
                { name: 'Heightened Senses', description: 'Your predatory instincts sharpen, improving the way you track, read, and corner dangerous prey.' },
                { name: 'Hybrid Transformation', description: 'You assume a bestial hybrid form that boosts speed, resilience, and close-quarters damage at the cost of tighter self-control.' }
            ],
            7: { name: 'Stalker\'s Prowess', description: 'Your hybrid form grows faster and more relentless, making pursuit and melee pressure far more dangerous.' },
            11: { name: 'Advanced Transformation', description: 'Your beast form becomes tougher to stop and hits significantly harder once the hunt is underway.' },
            15: { name: 'Brand of the Voracious', description: 'Branded enemies struggle to flee while your bloodlust turns pursuit into brutal finishing pressure.' }
        },
        'Order of the Mutant': {
            3: [
                { name: 'Mutagencraft', description: 'Brew mutagens that temporarily heighten specific abilities while forcing you to manage meaningful drawbacks.' },
                { name: 'Formulas', description: 'Build a growing library of mutagen recipes so you can adapt yourself to different hunts and environments.' }
            ],
            7: { name: 'Strange Metabolism', description: 'Your altered body shrugs off poison and lets you force through debilitating effects that would stop other hunters.' },
            11: { name: 'Brand of Axiom', description: 'Your Brand pins down shapechangers and strips deceptive transformations from unnatural prey.' },
            15: { name: 'Exalted Mutation', description: 'Push your mutagens beyond ordinary safety limits for powerful late-game adaptations.' }
        },
        'Order of the Profane Soul': {
            3: [
                { name: 'Otherworldly Patron', description: 'Choose the patron influence that shapes your occult abilities and the tone of your blood magic.' },
                { name: 'Pact Magic', description: 'You bind hemocraft to forbidden patron spellcasting, gaining a compact but potent pool of eldritch magic.' }
            ],
            7: { name: 'Mystic Frenzy', description: 'After casting a cantrip, you can immediately follow through with a weapon attack to keep offensive tempo high.' },
            11: { name: 'Brand of the Sapping Scar', description: 'Your Brand drains a foe’s momentum and punishes them for turning their attention toward you or your allies.' },
            15: { name: 'Unsealed Arcana', description: 'Your patron bond deepens into a dramatic once-per-rest surge of occult power.' }
        }
    },
    Bard: {
        'College of Dance': {
            3: { name: 'Battle Dance', description: 'Channel rhythm into movement-based control and evasive team-support positioning.' },
            6: { name: 'Inspirational Flourish', description: 'Your performances blend offense and support with stronger action-tempo payoffs.' },
            14: { name: 'Master Choreography', description: 'You orchestrate encounters with elite mobility and party-wide momentum boosts.' }
        },
        'College of Glamour': {
            3: { name: 'Mantle of Inspiration', description: 'Wrap allies in fey charm to grant repositioning tools and protective tempo.' },
            6: { name: 'Mantle of Majesty', description: 'Project commanding presence to direct enemies and control social or combat flow.' },
            14: { name: 'Unbreakable Majesty', description: 'Your supernatural allure makes it difficult for enemies to target you effectively.' }
        },
        'College of Lore': {
            3: [
                { name: 'Bonus Proficiencies', description: 'Gain proficiency with three skills of your choice.' },
                { name: 'Cutting Words', description: 'When a creature you can see within 60 feet succeeds on an attack roll or ability check or rolls damage, you can use your Reaction and expend Bardic Inspiration to subtract the die from the roll.' }
            ],
            6: { name: 'Magical Discoveries', description: 'Learn two additional always-prepared spells from the Cleric, Druid, or Wizard lists; each can be a cantrip or a spell for which you have spell slots.' },
            14: { name: 'Peerless Skill', description: 'When you fail an ability check or attack roll, you can expend Bardic Inspiration and add the die to the d20; on a failure, the inspiration isn’t spent.' }
        },
        'College of Valor': {
            3: { name: 'Combat Inspiration', description: 'Turn inspiration into defensive or offensive swing power for frontline allies.' },
            6: { name: 'Extra Attack', description: 'Blend martial pressure with spell and support cadence each turn.' },
            14: { name: 'Battle Magic', description: 'Transition seamlessly between spells and weapon strikes in high-pressure rounds.' }
        }
    },
    Cleric: {
        'Life Domain': {
            3: { name: 'Disciple of Life', description: 'Your Life Domain gives you bonus healing power: spells cast with a spell slot restore extra Hit Points equal to 2 plus the slot’s level, and you also gain Life Domain spells and Preserve Life through Channel Divinity.' },
            6: { name: 'Blessed Healer', description: 'After you cast a spell with a spell slot that restores Hit Points to another creature, you regain Hit Points equal to 2 plus the spell slot’s level.' },
            17: { name: 'Supreme Healing', description: 'When your spells or Channel Divinity would roll dice to restore Hit Points, you use the highest number possible on each die instead.' }
        },
        'Light Domain': {
            3: { name: 'Warding Flare', description: 'When a creature you can see attacks, you can use your Reaction to flash divine light and impose Disadvantage on the attack, while your domain also grants extra radiant and fire spell support.' },
            6: { name: 'Improved Flare', description: 'Your Warding Flare can now protect nearby allies as well as yourself.' },
            17: { name: 'Corona of Light', description: 'You radiate bright sunlight, and enemies in the glow have Disadvantage on saving throws against your fire and radiant spells.' }
        },
        'Trickery Domain': {
            3: { name: 'Blessing of the Trickster', description: 'You can grant a willing creature Advantage on Stealth checks, reinforcing infiltration and deception.' },
            6: { name: 'Cloak of Shadows', description: 'As an action, you become Invisible until the end of your next turn or until you attack or cast a spell.' },
            17: { name: 'Improved Duplicity', description: 'Your illusory duplicate magic becomes much stronger, letting you maintain multiple deceptive images at once.' }
        },
        'War Domain': {
            3: { name: 'War Priest', description: 'You gain limited Bonus Action weapon attacks after taking the Attack action, and your war magic helps turn hits into decisive strikes.' },
            6: { name: 'War God\'s Blessing', description: 'As a Reaction, you can grant a large bonus to an ally\'s attack roll after seeing the roll but before the result is known.' },
            17: { name: 'Avatar of Battle', description: 'You gain Resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.' }
        }
    },
    Druid: {
        'Circle of the Land': {
            3: [
                { name: 'Circle of the Land Spells', description: 'Whenever you finish a Long Rest, choose arid, polar, temperate, or tropical land and gain the matching Circle spells prepared for your Druid level.' },
                { name: 'Land\'s Aid', description: 'Expend a use of Wild Shape to create a 10-foot sphere within 60 feet that deals Necrotic damage to chosen creatures and restores Hit Points to one creature in the area.' }
            ],
            6: { name: 'Natural Recovery', description: 'Once per Long Rest, you can cast one prepared Circle spell for free, and after a Short Rest you can recover expended spell slots with a combined level up to half your Druid level.' },
            10: { name: 'Nature\'s Ward', description: 'You are immune to the Poisoned condition and gain Resistance based on your current land choice: Fire, Cold, Lightning, or Poison.' },
            14: { name: 'Nature\'s Sanctuary', description: 'Expend a use of Wild Shape to create a movable spectral grove that grants you and allies Half Cover, and allies inside also gain your current Nature\'s Ward resistance.' }
        },
        'Circle of the Moon': {
            3: { name: 'Combat Wild Shape', description: 'Transform into durable beast forms that thrive in frontline engagement.' },
            6: { name: 'Primal Strike', description: 'Your beast attacks scale better against resilient enemies.' },
            10: { name: 'Elemental Wild Shape', description: 'Adopt elemental forms for stronger control, mobility, and endurance.' },
            14: { name: 'Thousand Forms', description: 'Command broad transformational utility for exploration and tactical play.' }
        },
        'Circle of the Sea': {
            3: { name: 'Oceanic Wrath', description: 'Wield tide and storm themes to control space and pressure clustered foes.' },
            6: { name: 'Undertow Step', description: 'Reposition through flowing movement patterns and aquatic adaptation.' },
            10: { name: 'Tempest Confluence', description: 'Escalate your weather magic into broader encounter-shaping effects.' },
            14: { name: 'Abyssal Surge', description: 'Unleash high-impact sea-forged power as a late-game control specialist.' }
        },
        'Circle of Stars': {
            3: { name: 'Star Map', description: 'Chart celestial guidance to improve spell reliability and tactical foresight.' },
            6: { name: 'Cosmic Omen', description: 'Read stellar signs to tilt key rolls toward favorable outcomes.' },
            10: { name: 'Twinkling Constellations', description: 'Enhance your constellation forms for stronger offense, healing, or control.' },
            14: { name: 'Full of Stars', description: 'Become a luminous anchor with improved survivability while channeling stars.' }
        }
    },
    Fighter: {
        'Battle Master': {
            3: { name: 'Combat Superiority', description: 'Use tactical maneuvers and superiority dice to control duel tempo.' },
            7: { name: 'Know Your Enemy', description: 'Study opponents to identify strengths, weaknesses, and openings.' },
            10: { name: 'Improved Maneuvers', description: 'Expand your tactical toolkit with stronger battlefield options.' },
            15: { name: 'Relentless', description: 'Recover tactical resources to sustain pressure over long fights.' },
            18: { name: 'Master of War', description: 'Reach peak command of maneuver-driven combat and battlefield control.' }
        },
        Champion: {
            3: { name: 'Improved Critical', description: 'Your weapon and Unarmed Strike attacks score a Critical Hit on a roll of 19 or 20, and Remarkable Athlete also boosts your Initiative and Athletics.' },
            7: { name: 'Additional Fighting Style', description: 'You gain another Fighting Style feat of your choice.' },
            10: { name: 'Heroic Warrior', description: 'During combat, whenever you start your turn without Heroic Inspiration, you can give it to yourself.' },
            15: { name: 'Superior Critical', description: 'Your weapon and Unarmed Strike attacks now score a Critical Hit on a roll of 18–20.' },
            18: { name: 'Survivor', description: 'You have Advantage on Death Saving Throws, and while Bloodied and above 0 Hit Points you regain Hit Points at the start of each turn equal to 5 plus your Constitution modifier.' }
        },
        'Eldritch Knight': {
            3: { name: 'War Magic Initiate', description: 'Blend weapons and arcane technique to broaden tactical options.' },
            7: { name: 'War Magic', description: 'Pair cantrips with weapon strikes for efficient turn-by-turn pressure.' },
            10: { name: 'Eldritch Strike', description: 'Prime enemies to fail saves against your follow-up magic.' },
            15: { name: 'Arcane Charge', description: 'Teleport through combat flow to claim stronger attack lines.' },
            18: { name: 'Improved War Magic', description: 'Integrate higher-level spellcasting with elite martial action economy.' }
        },
        'Psi Warrior': {
            3: { name: 'Psionic Power', description: 'Channel telekinetic force into defense, mobility, and strike enhancement.' },
            7: { name: 'Telekinetic Adept', description: 'Gain stronger control over enemy positioning and personal movement.' },
            10: { name: 'Guarded Mind', description: 'Harden your thoughts against hostile mental pressure and debilitation.' },
            15: { name: 'Bulwark of Force', description: 'Project psionic barriers to protect allies during intense encounters.' },
            18: { name: 'Telekinetic Master', description: 'Reach peak battlefield control through sustained psionic dominance.' }
        }
    },
    Gunslinger: {
        Deadshot: {
            3: { name: 'Deadshot Precision', description: 'You specialize in patient, high-accuracy shooting that rewards distance, calm positioning, and perfect sight lines.' },
            6: { name: 'Long-Range Control', description: 'Your shots become better at pinning threats in place and keeping dangerous enemies away from your firing lane.' },
            14: { name: 'Perfect Shot', description: 'You can line up devastating firearm hits against exposed targets and capitalize brutally on clean openings.' },
            17: { name: 'Master Deadshot', description: 'Your precision peaks, turning firearm attacks into reliable finishers even at extreme range.' }
        },
        Desperado: {
            3: { name: 'Desperado Flourish', description: 'You thrive in risky close-quarters gunplay, chaining movement, swagger, and off-hand firearm pressure.' },
            6: { name: 'Close-Quarters Barrage', description: 'You keep firing while surrounded, using daring repositioning and relentless aggression to stay on offense.' },
            14: { name: 'Noon Duelist', description: 'Fast draw speed and nerves of steel let you explode into punishing one-on-one burst turns.' },
            17: { name: 'Legend of the Frontier', description: 'Your reckless gunfighting reaches a capstone rhythm of mobility, intimidation, and nonstop fire.' }
        },
        Maverick: {
            3: { name: 'Maverick Ingenuity', description: 'You solve problems with clever tricks, flexible firearm play, and unexpected battlefield answers.' },
            6: { name: 'Borrowed Technique', description: 'You adapt styles and stunts on the fly, making you harder to predict and easier to fit into any fight.' },
            14: { name: 'Improvised Mastery', description: 'Your creative gunplay turns awkward terrain and strange situations into tactical advantages.' },
            17: { name: 'Ace in the Hole', description: 'At the highest tier, you always seem to have one decisive shot, trick, or escape left in reserve.' }
        },
        Spiritslinger: {
            3: { name: 'Haunted Rounds', description: 'Your shots carry spectral force, layering supernatural pressure onto your firearm attacks.' },
            6: { name: 'Ghost Step', description: 'Spiritual gunplay lets you slip through danger and reposition with eerie speed.' },
            14: { name: 'Grave Mark', description: 'Your bullets haunt struck enemies, weakening them and setting them up for follow-up punishment.' },
            17: { name: 'Death Knell', description: 'Your capstone shots feel like omens of the grave, overwhelming weakened enemies with supernatural finishers.' }
        },
        Undertaker: {
            3: { name: 'Undertaker\'s Mark', description: 'You pick apart the dying and the doomed, thriving when fights turn grim and targets start to fold.' },
            6: { name: 'Final Rites', description: 'You convert fear, collapse, and battlefield momentum into brutal firearm pressure.' },
            14: { name: 'Funeral Pace', description: 'Your cold, methodical tempo keeps wounded enemies from ever regaining control of the fight.' },
            17: { name: 'Last Toll', description: 'By late game, you become a terrifying closer who turns failing enemies into certain kills.' }
        }
    },
    Monk: {
        'Warrior of Mercy': {
            3: { name: 'Hands of Harm and Healing', description: 'Alternate between restorative touch and debilitating strikes with ki precision.' },
            6: { name: 'Physician\'s Touch', description: 'Refine your restorative and disruptive techniques in close combat.' },
            11: { name: 'Flurry of Healing and Harm', description: 'Blend support and offense in rapid sequences to swing key turns.' },
            17: { name: 'Hand of Ultimate Mercy', description: 'Deliver capstone restorative mastery for clutch party-saving plays.' }
        },
        'Warrior of Shadow': {
            3: { name: 'Shadow Arts', description: 'Command darkness and stealth tools to dictate engagement terms.' },
            6: { name: 'Shadow Step', description: 'Teleport between shadows to create unpredictable attack angles.' },
            11: { name: 'Improved Shadow Techniques', description: 'Expand your infiltration and skirmish impact in constrained terrain.' },
            17: { name: 'Shadow Master', description: 'Reach apex stealth control and high-end battlefield repositioning.' }
        },
        'Warrior of the Elements': {
            3: { name: 'Elemental Attunement', description: 'Shape strikes and movement with primal elemental forms.' },
            6: { name: 'Elemental Burst', description: 'Turn ki into area pressure and elemental control.' },
            11: { name: 'Elemental Flow', description: 'Sustain aggressive elemental sequences with better efficiency.' },
            17: { name: 'Avatar of Elements', description: 'Become a high-impact elemental combatant in late-game encounters.' }
        },
        'Warrior of the Open Hand': {
            3: { name: 'Open Hand Technique', description: 'When you hit with a Flurry of Blows attack, you can stop the target from making Opportunity Attacks, push it up to 15 feet, or knock it Prone if it fails a save.' },
            6: { name: 'Wholeness of Body', description: 'As a Bonus Action, heal yourself by rolling your Martial Arts die and adding your Wisdom modifier; you can do this a number of times per Long Rest equal to your Wisdom modifier.' },
            11: { name: 'Fleet Step', description: 'Whenever you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind immediately after it.' },
            17: { name: 'Quivering Palm', description: 'After you hit with an Unarmed Strike, you can spend 4 Focus Points to plant lethal vibrations that you can later trigger for 10d12 Force damage on a failed Constitution save, or half on a success.' }
        }
    },
    'Monster Hunter': {
        'Order of the Inquisitor': {
            3: { name: 'Inquisitor\'s Eye', description: 'You become exceptionally good at reading lies, cult behavior, and supernatural disguises before the fight even begins.' },
            7: { name: 'Pressure the Guilty', description: 'Once you identify prey, your pursuit and questioning style make it much harder for them to hide or recover control.' },
            10: { name: 'Expose Weakness', description: 'Your studied read on a foe lets you crack open defenses and create better attack windows for the whole party.' },
            13: { name: 'Truth-Seeker\'s Pursuit', description: 'You keep relentless track of evasive targets and punish tricks, misdirection, or escape attempts.' },
            18: { name: 'Unerring Verdict', description: 'Your late-game judgment is almost impossible to escape once you have identified a target as prey.' }
        },
        'Order of the Slayer': {
            3: { name: 'Slayer\'s Focus', description: 'You channel raw offensive pressure into your studied target, turning monster knowledge directly into kill speed.' },
            7: { name: 'Executioner Momentum', description: 'Once the hunt is underway, every hit helps you maintain relentless offensive tempo.' },
            10: { name: 'Killer\'s Instinct', description: 'You read finishing angles quickly, hitting harder when wounded or exposed prey starts to slip.' },
            13: { name: 'Merciless Assault', description: 'Your order escalates into a brutal anti-monster style built around constant pressure and collapse.' },
            18: { name: 'Legendary Slayer', description: 'You become a terrifying apex hunter whose focused offense can overwhelm even elite monsters.' }
        },
        'Order of the Unorthodox': {
            3: { name: 'Unorthodox Tools', description: 'You approach the hunt with gadgets, traps, and strange countermeasures instead of clean textbook tactics.' },
            7: { name: 'Adaptive Contraptions', description: 'Your preparations become more flexible, letting you answer odd creatures and battlefields creatively.' },
            10: { name: 'Trap Mastery', description: 'You control space better, turning monster movement and bad positioning into your advantage.' },
            13: { name: 'Improvised Countermeasures', description: 'You quickly produce the right answer to unexpected resistances, hazards, and special monster traits.' },
            18: { name: 'Master of the Unorthodox Hunt', description: 'At the highest tier, your unconventional methods let you out-think and out-position monsters that should be overwhelming.' }
        }
    },
    Paladin: {
        'Oath of Devotion': {
            3: [
                { name: 'Oath of Devotion Spells', description: 'You always have devotion oath spells such as Protection from Evil and Good, Shield of Faith, Aid, and Zone of Truth prepared as you level.' },
                { name: 'Sacred Weapon', description: 'When you take the Attack action, you can expend Channel Divinity to empower a melee weapon for 10 minutes, adding your Charisma modifier to attack rolls and letting its hits deal normal or Radiant damage.' }
            ],
            7: { name: 'Aura of Devotion', description: 'You and allies in your Aura of Protection have Immunity to the Charmed condition.' },
            15: { name: 'Smite of Protection', description: 'Whenever you cast Divine Smite, you and your allies in your Aura of Protection gain Half Cover until the start of your next turn.' },
            20: { name: 'Holy Nimbus', description: 'As a Bonus Action, empower your aura for 10 minutes so fiends and undead are worse at forcing your saves, enemies starting in the aura take Radiant damage, and the area shines with sunlight.' }
        },
        'Oath of Glory': {
            3: { name: 'Peerless Athlete', description: 'Channel legendary heroism into movement and athletic dominance.' },
            7: { name: 'Aura of Alacrity', description: 'Increase party momentum with speed-boosting holy presence.' },
            15: { name: 'Glorious Defense', description: 'Turn enemy hits into opportunities for protection and counterplay.' },
            20: { name: 'Living Legend', description: 'Ascend as a mythic champion with sustained combat excellence.' }
        },
        'Oath of the Ancients': {
            3: { name: 'Nature\'s Wrath', description: 'Bind enemies with primal oath magic tied to life and light.' },
            7: { name: 'Aura of Warding', description: 'Shield allies from harmful magic with ancient protective force.' },
            15: { name: 'Undying Sentinel', description: 'Endure lethal pressure through resilient oath-forged vitality.' },
            20: { name: 'Elder Champion', description: 'Become a living bastion of ancient power in prolonged battles.' }
        },
        'Oath of Vengeance': {
            3: { name: 'Vow of Enmity', description: 'Mark priority targets and pursue decisive single-target elimination.' },
            7: { name: 'Relentless Avenger', description: 'Maintain pressure with pursuit movement after opportunity strikes.' },
            15: { name: 'Soul of Vengeance', description: 'Punish marked foes whenever they attempt to retaliate.' },
            20: { name: 'Avenging Angel', description: 'Assume a terrifying capstone form built for righteous execution.' }
        },
        'Oath of Conquest': {
            3: { name: 'Conquering Presence', description: 'Project oppressive authority to fracture enemy morale and positioning.' },
            7: { name: 'Aura of Conquest', description: 'Lock down frightened enemies and dominate local battlefield space.' },
            15: { name: 'Scornful Rebuke', description: 'Reflect punishment against those who dare strike you in melee.' },
            20: { name: 'Invincible Conqueror', description: 'Embody ruthless battlefield supremacy as your oath capstone.' }
        },
        'Oath of Redemption': {
            3: { name: 'Emissary of Peace', description: 'Lead with restraint, diplomacy, and redirection before violence.' },
            7: { name: 'Aura of the Guardian', description: 'Absorb harm meant for allies and preserve party survivability.' },
            15: { name: 'Protective Spirit', description: 'Regain endurance each round to hold the line through attrition.' },
            20: { name: 'Emissary of Redemption', description: 'Reach a pacifist capstone that punishes aggression against you.' }
        },
        'Oath of the Crown': {
            3: { name: 'Champion Challenge', description: 'Compel foes to confront you and protect your allies from flanking pressure.' },
            7: { name: 'Divine Allegiance', description: 'Intercept incoming harm to defend key teammates under threat.' },
            15: { name: 'Unyielding Spirit', description: 'Resist control effects and remain steadfast in command roles.' },
            20: { name: 'Exalted Champion', description: 'Project sovereign authority as a defensive and offensive battlefield center.' }
        },
        'Oath of the Watchers': {
            3: { name: 'Watcher\'s Will', description: 'Fortify your group against extraplanar influence and mind-affecting effects.' },
            7: { name: 'Aura of the Sentinel', description: 'Sharpen party initiative and readiness against sudden threats.' },
            15: { name: 'Vigilant Rebuke', description: 'Answer hostile magic with retaliatory force and disruption.' },
            20: { name: 'Mortal Bulwark', description: 'Stand as a capstone defender against planar and supernatural foes.' }
        },
        Oathbreaker: {
            3: { name: 'Dreadful Aspect', description: 'Command fear and necrotic power through a fallen oath path.' },
            7: { name: 'Aura of Hate', description: 'Amplify melee damage with dark influence around you.' },
            15: { name: 'Supernatural Resistance', description: 'Gain resilient defenses against nonmagical physical punishment.' },
            20: { name: 'Dread Lord', description: 'Assume a terrifying capstone form that warps nearby combat tempo.' }
        },
        'Oath of the Open Sea (TCSR)': {
            3: { name: 'Marine Layer', description: 'Command sea-mist obscuration and fluid battlefield movement.' },
            7: { name: 'Aura of Liberation', description: 'Protect allies from restraints while preserving team mobility.' },
            15: { name: 'Stormy Waters', description: 'Repel and disrupt enemies that close into your defensive zone.' },
            20: { name: 'Mythic Swashbuckler', description: 'Reach a sea-forged capstone of agile, storm-driven domination.' }
        }
    },
    Ranger: {
        'Beast Master': {
            3: { name: 'Primal Companion', description: 'You summon a Beast of the Land, Sea, or Sky that scales with your Proficiency Bonus and acts on your commands in combat.' },
            7: { name: 'Exceptional Training', description: 'Your companion\'s attacks count as magical, and when you command it, it can also Dash, Disengage, or Help more effectively.' },
            11: { name: 'Bestial Fury', description: 'When you command your companion to attack, it can make two attacks instead of one.' },
            15: { name: 'Share Spells', description: 'When you cast a spell targeting yourself, the same spell can also affect your companion if it is nearby.' }
        },
        'Fey Wanderer': {
            3: { name: 'Dreadful Strikes', description: 'Once on each of your turns, your weapon hits deal extra Psychic damage as fey magic unsettles the target.' },
            7: { name: 'Beguiling Twist', description: 'When a creature resists or ends a charm or fear effect, you can redirect that fey energy to potentially charm or frighten another creature.' },
            11: { name: 'Fey Reinforcements', description: 'You can cast Summon Fey without needing Concentration for that special use, bringing stronger battlefield support.' },
            15: { name: 'Misty Wanderer', description: 'You gain more uses of Misty Step and can bring another willing creature with you when you teleport.' }
        },
        'Gloom Stalker': {
            3: { name: 'Dread Ambusher', description: 'You gain an Initiative boost, improved darkvision and shadow stealth, and on your first turn you make an extra attack that deals bonus damage.' },
            7: { name: 'Iron Mind', description: 'You gain proficiency in Wisdom saving throws, making you much harder to control mentally.' },
            11: { name: 'Stalker\'s Flurry', description: 'Once per turn when you miss with a weapon attack, you can make another weapon attack immediately.' },
            15: { name: 'Shadowy Dodge', description: 'When a creature attacks you, you can use your Reaction to impose Disadvantage on that attack.' }
        },
        Hunter: {
            3: { name: 'Hunter\'s Prey', description: 'Hunter\'s Lore reveals a marked foe’s Immunities, Resistances, and Vulnerabilities, while Hunter\'s Prey lets you choose either an extra 1d8 damage with Colossus Slayer or an extra attack with Horde Breaker.' },
            7: { name: 'Defensive Tactics', description: 'Choose Escape the Horde to impose Disadvantage on Opportunity Attacks against you, or Multiattack Defense to give a creature Disadvantage on its other attacks against you after it hits.' },
            11: { name: 'Superior Hunter\'s Prey', description: 'Once per turn when you deal Hunter\'s Mark damage to a creature, you can also deal that extra damage to a different creature you can see within 30 feet.' },
            15: { name: 'Superior Hunter\'s Defense', description: 'When you take damage, you can use your Reaction to give yourself Resistance to that damage and any other damage of the same type until the end of the turn.' }
        }
    },
    Rogue: {
        'Arcane Trickster': {
            3: { name: 'Mage Hand Legerdemain', description: 'Your Mage Hand becomes invisible and far more precise, letting you pick pockets, open locks, and disarm traps at range.' },
            9: { name: 'Magical Ambush', description: 'When you cast a spell while hidden from a creature, that target has Disadvantage on its saving throw against the spell.' },
            13: { name: 'Versatile Trickster', description: 'As a Bonus Action, your Mage Hand can distract a creature, giving you Advantage on attacks against it.' },
            17: { name: 'Spell Thief', description: 'When a creature casts a spell at you, you can use your Reaction to steal the magic, canceling the spell and temporarily learning it yourself.' }
        },
        Assassin: {
            3: { name: 'Assassinate', description: 'You gain deadly opening-round pressure with Advantage against creatures that haven\'t acted yet, and surprised foes suffer Critical Hits from your attacks.' },
            9: { name: 'Infiltration Expertise', description: 'With downtime and gold, you can create a convincing false identity complete with clothing, papers, and cover story.' },
            13: { name: 'Impostor', description: 'After studying someone, you can mimic their speech, handwriting, and mannerisms to pass yourself off as them.' },
            17: { name: 'Death Strike', description: 'When you hit a surprised creature, it must save or take double the damage from your attack.' }
        },
        Soulknife: {
            3: { name: 'Psionic Power', description: 'You manifest Psychic Blades, gain psionic dice for skill boosts, and can speak telepathically with nearby creatures.' },
            9: { name: 'Soul Blades', description: 'Your psionic dice can turn missed attacks into hits and let you teleport by throwing a Psychic Blade.' },
            13: { name: 'Psychic Veil', description: 'You can become Invisible for an extended time, vanishing until you attack, force a save, or end the effect.' },
            17: { name: 'Rend Mind', description: 'After striking with your Psychic Blades, you can force a target to save or become Stunned by a brutal psychic assault.' }
        },
        Thief: {
            3: [
                { name: 'Fast Hands', description: 'As a Bonus Action, you can pick a lock, disarm a trap, pick a pocket, take the Utilize action, or use a magic item that requires the Magic action.' },
                { name: 'Second-Story Work', description: 'Gain a Climb Speed equal to your Speed, and use Dexterity instead of Strength to determine your jump distance.' }
            ],
            9: { name: 'Supreme Sneak', description: 'Gain the Stealth Attack Cunning Strike option, letting you attack without ending the Hide action’s Invisible condition if you finish the turn behind cover.' },
            13: { name: 'Use Magic Device', description: 'You can attune to up to four magic items, sometimes avoid expending charges on a 6, and use any Spell Scroll with Intelligence as the spellcasting ability.' },
            17: { name: 'Thief\'s Reflexes', description: 'In the first round of combat, you take two turns: one at your normal Initiative and another at Initiative minus 10.' }
        },
    },
    Sorcerer: {
        'Clockwork Sorcery': {
            3: { name: 'Clockwork Magic', description: 'You learn additional order-themed spells and gain Restore Balance, letting you use your Reaction to cancel Advantage or Disadvantage on a creature\'s d20 roll.' },
            6: { name: 'Bastion of Law', description: 'You can spend Sorcery Points to create a ward of d8s that reduces incoming damage against the protected creature.' },
            14: { name: 'Trance of Order', description: 'For 1 minute, your attack rolls, ability checks, and saving throws can\'t roll lower than 10, making your magic unusually reliable.' },
            18: { name: 'Clockwork Cavalcade', description: 'You summon spirits of order to heal creatures, repair objects, and end certain spells in the area as chaos is forcibly set right.' }
        },
        'Draconic Sorcery': {
            3: [
                { name: 'Draconic Resilience', description: 'Your Hit Point maximum increases by 3 and rises by 1 each Sorcerer level, and while unarmored your base Armor Class equals 10 plus your Dexterity and Charisma modifiers.' },
                { name: 'Draconic Spells', description: 'You always have thematic dragon spells such as Alter Self, Chromatic Orb, Command, and Dragon\'s Breath prepared, with more added at higher levels.' }
            ],
            6: { name: 'Elemental Affinity', description: 'Choose Acid, Cold, Fire, Lightning, or Poison; you gain Resistance to that damage type, and spells of that type add your Charisma modifier to one damage roll.' },
            14: { name: 'Dragon Wings', description: 'As a Bonus Action, manifest draconic wings for 1 hour and gain a Fly Speed of 60 feet; you can recharge the feature by spending 3 Sorcery Points.' },
            18: { name: 'Dragon Companion', description: 'You can cast Summon Dragon without its Material component, cast it once per Long Rest for free, and optionally remove its Concentration requirement for that casting.' }
        },
        'Divine Soul Sorcery': {
            3: { name: 'Divine Magic', description: 'Your magic taps divine power, adding Cleric spell options to your spell list and letting Favored by the Gods add 2d4 to a missed attack or failed saving throw once per rest.' },
            6: { name: 'Empowered Healing', description: 'When an ally near you rolls healing dice, you can spend 1 Sorcery Point to reroll any number of those dice once.' },
            14: { name: 'Otherworldly Wings', description: 'As a Bonus Action, you sprout spectral wings and gain a Fly Speed, making aerial spellcasting much easier.' },
            18: { name: 'Unearthly Recovery', description: 'Once per Long Rest, you can use a Bonus Action to regain Hit Points equal to half your maximum.' }
        },
        'Wild Magic Sorcery': {
            3: { name: 'Wild Magic Surge', description: 'After casting leveled spells, chaos can trigger a Wild Magic Surge, and Tides of Chaos lets you gain Advantage on a roll before the DM can force a surge later.' },
            6: { name: 'Bend Luck', description: 'Spend 2 Sorcery Points as a Reaction to add or subtract 1d4 from another creature\'s attack roll, ability check, or saving throw.' },
            14: { name: 'Controlled Chaos', description: 'Whenever you would roll on the Wild Magic table, you can roll twice and choose the result you prefer.' },
            18: { name: 'Spell Bombardment', description: 'When a damage die for one of your spells rolls its highest value, you can roll an extra die of that type and add it to the total.' }
        }
    },
    Warlock: {
        'Archfey Patron': {
            3: { name: 'Fey Presence', description: 'As an action, creatures in a 10-foot cube from you must save or become Charmed or Frightened by you until the end of your next turn.' },
            6: { name: 'Misty Escape', description: 'When you take damage, you can use your Reaction to turn Invisible and teleport up to 60 feet to a space you can see.' },
            10: { name: 'Beguiling Defenses', description: 'You are immune to the Charmed condition, and when a creature tries to charm you, you can reflect that charm back on it.' },
            14: { name: 'Dark Delirium', description: 'You can trap a creature in an illusory realm where it sees only you and the vision, leaving it Charmed or Frightened for up to 1 minute.' }
        },
        'Celestial Patron': {
            3: { name: 'Healing Light', description: 'You gain a pool of d6s equal to 1 plus your Warlock level and can spend them as a Bonus Action to heal a creature you can see within 60 feet.' },
            6: { name: 'Radiant Soul', description: 'You gain Resistance to Radiant damage, and your fire or radiant spells add your Charisma modifier to one damage roll.' },
            10: { name: 'Celestial Resilience', description: 'After a Short or Long Rest, you gain Temporary Hit Points, and you can also grant Temporary Hit Points to up to five nearby creatures.' },
            14: { name: 'Searing Vengeance', description: 'When you are about to make a death save, you can instead rise with half your Hit Points restored and blast nearby foes with radiant light, blinding them until the end of the turn.' }
        },
        'Fiend Patron': {
            3: [
                { name: 'Dark One\'s Blessing', description: 'When you or someone within 10 feet of you reduces an enemy to 0 Hit Points, you gain Temporary Hit Points equal to your Charisma modifier plus your Warlock level.' },
                { name: 'Fiend Spells', description: 'You always have fiendish patron spells such as Burning Hands, Command, Scorching Ray, and Suggestion prepared, with more added as you level.' }
            ],
            6: { name: 'Dark One\'s Own Luck', description: 'When you make an ability check or saving throw, you can add 1d10 after seeing the roll but before its effects occur; you regain uses on a Long Rest.' },
            10: { name: 'Fiendish Resilience', description: 'Whenever you finish a Short or Long Rest, choose a damage type other than Force and gain Resistance to it until you choose again.' },
            14: { name: 'Hurl Through Hell', description: 'Once per turn when you hit with an attack roll, you can force the target to make a Charisma save or vanish through the Lower Planes, taking 8d10 Psychic damage if it isn’t a Fiend and returning Incapacitated at the end of your next turn.' }
        },
        'Great Old One Patron': {
            3: { name: 'Awakened Mind', description: 'You can speak telepathically to a creature you can see within 30 feet, even without sharing a language, as long as it understands one.' },
            6: { name: 'Entropic Ward', description: 'When a creature attacks you, you can use your Reaction to impose Disadvantage, and if it misses, your next attack against it has Advantage.' },
            10: { name: 'Thought Shield', description: 'Your mind can\'t be read unless you allow it, you gain Resistance to Psychic damage, and creatures that deal Psychic damage to you take the same amount back.' },
            14: { name: 'Create Thrall', description: 'By touching an Incapacitated humanoid, you can charm it until Remove Curse or similar magic breaks the bond, and you can communicate with it telepathically across the same plane.' }
        }
    },
    Wizard: {
        'School of Abjuration': {
            3: [
                { name: 'Abjuration Savant', description: 'You copy Abjuration spells into your spellbook for reduced gold and time cost.' },
                { name: 'Arcane Ward', description: 'When you cast an Abjuration spell, you create a magical ward that absorbs incoming damage before your Hit Points do.' }
            ],
            6: { name: 'Projected Ward', description: 'When a creature you can see takes damage, you can use your Reaction to have your Arcane Ward absorb that damage instead.' },
            10: { name: 'Improved Abjuration', description: 'Add your Proficiency Bonus to the ability checks you make as part of Counterspell and Dispel Magic.' },
            14: { name: 'Spell Resistance', description: 'You have Advantage on saving throws against spells and Resistance to damage from spells.' }
        },
        'School of Divination': {
            3: [
                { name: 'Divination Savant', description: 'You copy Divination spells into your spellbook for reduced gold and time cost.' },
                { name: 'Portent', description: 'After a Long Rest, you roll foretelling d20s and can replace attack rolls, saves, or checks with those numbers later.' }
            ],
            6: { name: 'Expert Divination', description: 'When you cast a Divination spell of level 2 or higher, you recover a lower-level spell slot.' },
            10: { name: 'Third Eye', description: 'After a rest, you can choose a special sense such as Darkvision, See Invisibility, Ethereal Sight, or enhanced language understanding.' },
            14: { name: 'Greater Portent', description: 'You gain an additional Portent die, giving you even more control over future rolls.' }
        },
        'School of Evocation': {
            3: [
                { name: 'Evocation Savant', description: 'Add two Evocation spells of level 2 or lower to your spellbook for free, and add another Evocation spell whenever you gain access to a new spell-slot level.' },
                { name: 'Potent Cantrip', description: 'When a creature avoids the full effect of one of your damaging cantrips, it still takes half the cantrip’s damage, though no additional effect applies.' }
            ],
            6: { name: 'Sculpt Spells', description: 'When you cast an Evocation spell that affects other creatures you can see, a number of them equal to 1 plus the spell’s level automatically succeed on the save and take no damage on a successful save.' },
            10: { name: 'Empowered Evocation', description: 'Whenever you cast a Wizard spell from the Evocation school, add your Intelligence modifier to one damage roll of that spell.' },
            14: { name: 'Overchannel', description: 'When you cast a level 1–5 damaging Wizard spell, you can make it deal maximum damage; repeated uses before a Long Rest deal escalating Necrotic damage to you.' }
        },
        'School of Illusion': {
            3: [
                { name: 'Illusion Savant', description: 'You copy Illusion spells into your spellbook for reduced gold and time cost.' },
                { name: 'Improved Minor Illusion', description: 'Your Minor Illusion becomes more flexible, letting you create richer deceptive sound-and-image effects.' }
            ],
            6: { name: 'Malleable Illusions', description: 'You can reshape an active illusion spell with a duration of 1 minute or longer while it remains in effect.' },
            10: { name: 'Illusory Self', description: 'As a Reaction when a creature attacks you, you can make it miss by interposing an illusory duplicate.' },
            14: { name: 'Illusory Reality', description: 'Once when you cast an illusion spell of level 1 or higher, you can make one non-damaging part of the illusion physically real for a minute.' }
        }
    }
};


export interface SubclassConfig {
    selectorFeatureName: string;
    selectorLevel: number;
    placeholderFeatureNames: ReadonlyArray<string>;
    milestoneLevels: ReadonlyArray<number>;
}

export const subclassConfigs: Readonly<Record<string, SubclassConfig>> = {
    Artificer: {
        selectorFeatureName: 'Artificer Specialist',
        selectorLevel: 3,
        placeholderFeatureNames: ['Artificer Specialist Feature'],
        milestoneLevels: [3, 5, 9, 15]
    },
    Barbarian: {
        selectorFeatureName: 'Barbarian Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 10, 14]
    },
    'Blood Hunter': {
        selectorFeatureName: 'Blood Hunter Order',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 7, 11, 15]
    },
    Bard: {
        selectorFeatureName: 'Bard Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 14]
    },
    Cleric: {
        selectorFeatureName: 'Cleric Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 17]
    },
    Druid: {
        selectorFeatureName: 'Druid Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 10, 14]
    },
    Fighter: {
        selectorFeatureName: 'Fighter Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 7, 10, 15, 18]
    },
    Gunslinger: {
        selectorFeatureName: 'Gunslinger Style',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 14, 17]
    },
    Monk: {
        selectorFeatureName: 'Monk Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 11, 17]
    },
    'Monster Hunter': {
        selectorFeatureName: 'Hunter Order',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 7, 10, 13, 18]
    },
    Paladin: {
        selectorFeatureName: 'Paladin Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 7, 15, 20]
    },
    Ranger: {
        selectorFeatureName: 'Ranger Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 7, 11, 15]
    },
    Rogue: {
        selectorFeatureName: 'Rogue Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 9, 13, 17]
    },
    Sorcerer: {
        selectorFeatureName: 'Sorcerer Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 14, 18]
    },
    Warlock: {
        selectorFeatureName: 'Warlock Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 10, 14]
    },
    Wizard: {
        selectorFeatureName: 'Wizard Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 10, 14]
    }
};

export const subclassChoiceTitles: Readonly<Record<string, string>> = {
    Artificer: 'Choose 1 Artificer Specialist',
    Barbarian: 'Choose 1 Subclass',
    'Blood Hunter': 'Choose 1 Blood Hunter Order',
    Bard: 'Choose 1 Bard College',
    Cleric: 'Choose 1 Divine Domain',
    Druid: 'Choose 1 Druid Circle',
    Fighter: 'Choose 1 Martial Archetype',
    Gunslinger: 'Choose 1 Gunslinger Style',
    Monk: 'Choose 1 Monastic Tradition',
    'Monster Hunter': 'Choose 1 Hunter Order',
    Paladin: 'Choose 1 Sacred Oath',
    Ranger: 'Choose 1 Ranger Conclave',
    Rogue: 'Choose 1 Roguish Archetype',
    Sorcerer: 'Choose 1 Sorcerer Subclass',
    Warlock: 'Choose 1 Otherworldly Patron',
    Wizard: 'Choose 1 Arcane Tradition'
};

export const subclassOptionsByClass: Readonly<Record<string, ReadonlyArray<string>>> = {
    Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
    Barbarian: ['Path of the Berserker', 'Path of the Wild Heart', 'Path of the World Tree', 'Path of the Zealot'],
    'Blood Hunter': ['Order of the Ghostslayer', 'Order of the Lycan', 'Order of the Mutant', 'Order of the Profane Soul'],
    Bard: ['College of Dance', 'College of Glamour', 'College of Lore', 'College of Valor'],
    Cleric: ['Life Domain', 'Light Domain', 'Trickery Domain', 'War Domain'],
    Druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of the Sea', 'Circle of Stars'],
    Fighter: ['Battle Master', 'Champion', 'Eldritch Knight', 'Psi Warrior'],
    Gunslinger: ['Deadshot', 'Desperado', 'Maverick', 'Spiritslinger', 'Undertaker'],
    Monk: ['Warrior of Mercy', 'Warrior of Shadow', 'Warrior of the Elements', 'Warrior of the Open Hand'],
    'Monster Hunter': ['Order of the Inquisitor', 'Order of the Slayer', 'Order of the Unorthodox'],
    Paladin: ['Oath of Devotion', 'Oath of Glory', 'Oath of the Ancients', 'Oath of Vengeance', 'Oath of Conquest', 'Oath of Redemption', 'Oath of the Crown', 'Oath of the Watchers', 'Oathbreaker', 'Oath of the Open Sea (TCSR)'],
    Ranger: ['Beast Master', 'Fey Wanderer', 'Gloom Stalker', 'Hunter'],
    Rogue: ['Arcane Trickster', 'Assassin', 'Soulknife', 'Thief'],
    Sorcerer: ['Clockwork Sorcery', 'Draconic Sorcery', 'Divine Soul Sorcery', 'Wild Magic Sorcery'],
    Warlock: ['Archfey Patron', 'Celestial Patron', 'Fiend Patron', 'Great Old One Patron'],
    Wizard: ['School of Abjuration', 'School of Divination', 'School of Evocation', 'School of Illusion']
};

