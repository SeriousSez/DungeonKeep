export interface SubclassFeatureDetail {
    name: string;
    description: string;
}

export const subclassFeatureProgressionByClass: Record<string, Record<string, Record<number, SubclassFeatureDetail | ReadonlyArray<SubclassFeatureDetail>>>> = {
    Artificer: {
        Alchemist: {
            3: { name: 'Experimental Elixirs', description: 'Craft magical elixirs to support allies with healing, mobility, and combat boosts.' },
            5: { name: 'Alchemical Savant', description: 'Your alchemical formulas amplify restorative and elemental spell effects.' },
            9: { name: 'Restorative Reagents', description: 'Improve emergency healing tempo and reinforce your party between exchanges.' },
            15: { name: 'Chemical Mastery', description: 'Gain advanced resilience and high-end alchemical control in difficult encounters.' }
        },
        Armorer: {
            3: { name: 'Arcane Armor', description: 'Integrate armor as your core invention and choose a combat configuration.' },
            5: { name: 'Extra Attack', description: 'Your armored combat rhythm scales with improved weapon or gauntlet output.' },
            9: { name: 'Armor Modifications', description: 'Expand your armor infusions to tailor defense, utility, and tactical pressure.' },
            15: { name: 'Perfected Armor', description: 'Your armor reaches its peak form with stronger control, defense, or burst options.' }
        },
        Artillerist: {
            3: { name: 'Eldritch Cannon', description: 'Deploy arcane artillery for force damage, area pressure, or protective support.' },
            5: { name: 'Arcane Firearm', description: 'Channel spell damage through an enhanced focus to improve offensive casting.' },
            9: { name: 'Explosive Cannon', description: 'Your cannons hit harder and create stronger battlefield swing moments.' },
            15: { name: 'Fortified Position', description: 'Anchor fights with resilient artillery placements and team-oriented cover pressure.' }
        },
        'Battle Smith': {
            3: { name: 'Steel Defender', description: 'Command a durable construct companion that protects allies and pressures enemies.' },
            5: { name: 'Extra Attack', description: 'Blend martial pacing with invention-driven utility each round.' },
            9: { name: 'Arcane Jolt', description: 'Infuse weapon strikes or defender actions with restorative or damaging bursts.' },
            15: { name: 'Improved Defender', description: 'Your construct gains stronger survivability and sharper combat utility.' }
        }
    },
    Barbarian: {
        'Path of the Berserker': {
            3: { name: 'Frenzy', description: 'While your Rage is active, Reckless Attack adds extra damage on your first Strength-based hit each turn.' },
            6: { name: 'Mindless Rage', description: 'Your raging focus hardens your mind, helping you ignore fear and other control effects that would break your momentum.' },
            10: { name: 'Intimidating Presence', description: 'Your battle fury can unsettle foes, letting you project threat and force enemies to hesitate or retreat.' },
            14: { name: 'Retaliation', description: 'When enemies hurt you in melee, you can answer immediately with a punishing counterattack.' }
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
            3: { name: 'Divine Fury', description: 'Your Rage carries sacred wrath, adding divine damage to your attacks on each turn.' },
            6: { name: 'Fanatical Focus', description: 'Unshakable conviction helps you stay active through effects that would normally stop you.' },
            10: { name: 'Zealous Presence', description: 'Your fervor surges outward, empowering nearby allies with offensive momentum.' },
            14: { name: 'Rage Beyond Death', description: 'Your devotion sustains you even at the edge of defeat, letting your rage carry on through lethal pressure.' }
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
            3: { name: 'Cutting Words', description: 'Use precision wit to reduce enemy effectiveness at key moments.' },
            6: { name: 'Additional Magical Secrets', description: 'Broaden your spell toolkit beyond the bard list for strategic versatility.' },
            14: { name: 'Peerless Skill', description: 'Spend inspiration to dominate crucial checks and narrative turning points.' }
        },
        'College of Valor': {
            3: { name: 'Combat Inspiration', description: 'Turn inspiration into defensive or offensive swing power for frontline allies.' },
            6: { name: 'Extra Attack', description: 'Blend martial pressure with spell and support cadence each turn.' },
            14: { name: 'Battle Magic', description: 'Transition seamlessly between spells and weapon strikes in high-pressure rounds.' }
        }
    },
    Cleric: {
        'Life Domain': {
            3: { name: 'Disciple of Life', description: 'Your healing magic gains stronger baseline restoration for every encounter.' },
            6: { name: 'Blessed Healer', description: 'When you heal others, you also sustain yourself and stabilize the frontline.' },
            17: { name: 'Supreme Healing', description: 'Your restorative spells reach peak reliability in high-stakes battles.' }
        },
        'Light Domain': {
            3: { name: 'Warding Flare', description: 'Flash radiant light to impose pressure on incoming attacks.' },
            6: { name: 'Improved Flare', description: 'Extend your protective radiance to shield allies under threat.' },
            17: { name: 'Corona of Light', description: 'Create a radiant zone that magnifies your team\'s offensive spell output.' }
        },
        'Trickery Domain': {
            3: { name: 'Blessing of the Trickster', description: 'Grant stealth leverage and misdirection for infiltration and skirmish setups.' },
            6: { name: 'Cloak of Shadows', description: 'Slip into invisibility to reset positioning and outmaneuver enemies.' },
            17: { name: 'Improved Duplicity', description: 'Your illusions become decisive control tools in complex encounters.' }
        },
        'War Domain': {
            3: { name: 'War Priest', description: 'Channel divine zeal into direct martial pressure and decisive strikes.' },
            6: { name: 'War God\'s Blessing', description: 'Boost ally attack success at critical moments of combat tempo.' },
            17: { name: 'Avatar of Battle', description: 'Become a resilient battlefield anchor with enhanced holy warcraft.' }
        }
    },
    Druid: {
        'Circle of the Land': {
            3: { name: 'Land\'s Aid', description: 'Invoke terrain-aligned magic to support healing, control, and sustained casting.' },
            6: { name: 'Natural Recovery', description: 'Regain spell resources to maintain strategic pressure over longer adventuring days.' },
            10: { name: 'Nature\'s Ward', description: 'Gain stronger resilience against environmental and magical disruption.' },
            14: { name: 'Nature\'s Sanctuary', description: 'Your presence enforces calm over beasts and battlefield chaos alike.' }
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
            3: { name: 'Improved Critical', description: 'Land critical hits more often through pure martial precision.' },
            7: { name: 'Remarkable Athlete', description: 'Gain enhanced physical prowess across checks, movement, and initiative play.' },
            10: { name: 'Additional Fighting Style', description: 'Add another style layer to sharpen your core combat identity.' },
            15: { name: 'Superior Critical', description: 'Further increase critical pressure in sustained weapon combat.' },
            18: { name: 'Survivor', description: 'Regenerate through attrition and outlast enemies in extended fights.' }
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
            3: { name: 'Open Hand Technique', description: 'Convert flurry strikes into knockdown, push, and control pressure.' },
            6: { name: 'Wholeness of Body', description: 'Recover through disciplined self-restoration during prolonged fights.' },
            11: { name: 'Tranquility', description: 'Create defensive poise that disrupts enemy aggression patterns.' },
            17: { name: 'Quivering Palm', description: 'Apply devastating precision pressure to single high-priority targets.' }
        }
    },
    Paladin: {
        'Oath of Devotion': {
            3: { name: 'Sacred Weapon', description: 'Empower your weapon with radiant conviction for reliable frontline accuracy.' },
            7: { name: 'Aura of Devotion', description: 'Project steadfast will that protects allies from manipulative effects.' },
            15: { name: 'Purity of Spirit', description: 'Gain heightened resistance to corruption and hostile influence.' },
            20: { name: 'Holy Nimbus', description: 'Unleash radiant presence as a capstone of unwavering devotion.' }
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
            3: { name: 'Primal Companion', description: 'Fight alongside a bonded beast that scales with your ranger tactics.' },
            7: { name: 'Exceptional Training', description: 'Your companion gains better coordination and combat reliability.' },
            11: { name: 'Bestial Fury', description: 'Increase companion offense to maintain pace in mid-tier fights.' },
            15: { name: 'Share Spells', description: 'Extend your spell strategy through your companion for flexible synergy.' }
        },
        'Fey Wanderer': {
            3: { name: 'Dreadful Strikes', description: 'Infuse attacks with fey pressure that chips enemies each round.' },
            7: { name: 'Beguiling Twist', description: 'Turn charm and fear effects into reactive battlefield control.' },
            11: { name: 'Fey Reinforcements', description: 'Call fey aid for utility, pressure, and encounter shaping.' },
            15: { name: 'Misty Wanderer', description: 'Teleport allies and yourself for elite positional control.' }
        },
        'Gloom Stalker': {
            3: { name: 'Dread Ambusher', description: 'Dominate opening rounds through burst damage and initiative leverage.' },
            7: { name: 'Iron Mind', description: 'Harden mental defenses to stay effective under magical pressure.' },
            11: { name: 'Stalker\'s Flurry', description: 'Sustain offense by converting misses into renewed attack pressure.' },
            15: { name: 'Shadowy Dodge', description: 'Force enemy misses through reactive darkness-honed evasiveness.' }
        },
        Hunter: {
            3: { name: 'Hunter\'s Prey', description: 'Choose a prey style that defines your tactical approach to targets.' },
            7: { name: 'Defensive Tactics', description: 'Adopt survival techniques tailored to your preferred engagement range.' },
            11: { name: 'Multiattack', description: 'Gain superior multi-target pressure in crowded encounters.' },
            15: { name: 'Superior Hunter\'s Defense', description: 'Reach advanced defensive options to outlast elite threats.' }
        }
    },
    Rogue: {
        'Arcane Trickster': {
            3: { name: 'Mage Hand Legerdemain', description: 'Manipulate objects and traps with subtle arcane finesse.' },
            9: { name: 'Magical Ambush', description: 'Your spells become harder to resist when launched from stealth.' },
            13: { name: 'Versatile Trickster', description: 'Convert mage hand utility into stronger offensive setup opportunities.' },
            17: { name: 'Spell Thief', description: 'Steal magical momentum and turn enemy spellcraft to your advantage.' }
        },
        Assassin: {
            3: { name: 'Assassinate', description: 'Exploit surprise and initiative to deliver devastating opener pressure.' },
            9: { name: 'Infiltration Expertise', description: 'Build layered identities and access routes for precision operations.' },
            13: { name: 'Impostor', description: 'Mimic personas and social patterns to bypass high-security obstacles.' },
            17: { name: 'Death Strike', description: 'Punish surprised targets with lethal capstone burst potential.' }
        },
        Soulknife: {
            3: { name: 'Psionic Power', description: 'Manifest psychic blades and subtle psionic utility in and out of combat.' },
            9: { name: 'Soul Blades', description: 'Expand psionic blade techniques for mobility and accuracy pressure.' },
            13: { name: 'Psychic Veil', description: 'Become unseen through focused psionic concealment.' },
            17: { name: 'Rend Mind', description: 'Overload enemies with concentrated psychic disruption.' }
        },
        Thief: {
            3: { name: 'Fast Hands', description: 'Accelerate item interactions, utility actions, and opportunistic play.' },
            9: { name: 'Supreme Sneak', description: 'Improve stealth consistency in active infiltration and pursuit scenes.' },
            13: { name: 'Use Magic Device', description: 'Unlock broader item utility through adaptive rogue ingenuity.' },
            17: { name: 'Thief\'s Reflexes', description: 'Gain explosive opening tempo with capstone initiative advantages.' }
        }
    },
    Sorcerer: {
        'Clockwork Sorcery': {
            3: { name: 'Clockwork Magic', description: 'Anchor your spellcasting in cosmic order and disciplined utility.' },
            6: { name: 'Bastion of Law', description: 'Convert sorcery points into protective wards that blunt incoming damage.' },
            14: { name: 'Trance of Order', description: 'Stabilize outcomes and cast with superior consistency under pressure.' },
            18: { name: 'Clockwork Cavalcade', description: 'Summon capstone order magic to restore structure across chaotic battlefields.' }
        },
        'Draconic Sorcery': {
            3: { name: 'Draconic Resilience', description: 'Gain hardened scales and draconic durability from your bloodline.' },
            6: { name: 'Elemental Affinity', description: 'Amplify spells tied to your draconic element and improve resistance play.' },
            14: { name: 'Dragon Wings', description: 'Take flight to claim superior lines of sight and safer casting positions.' },
            18: { name: 'Dragon Companion', description: 'Call a draconic ally and sustain pressure through apex draconic magic.' }
        },
        'Divine Soul Sorcery': {
            3: { name: 'Divine Magic', description: 'Blend arcane and sacred spell access for hybrid support and offense.' },
            6: { name: 'Empowered Healing', description: 'Improve party sustain by refining healing outcomes through sorcery.' },
            14: { name: 'Otherworldly Wings', description: 'Manifest celestial mobility to reposition and cast from safety.' },
            18: { name: 'Unearthly Recovery', description: 'Activate a capstone self-restoration surge during critical encounters.' }
        },
        'Wild Magic Sorcery': {
            3: { name: 'Wild Magic Surge', description: 'Tap chaotic spell surges for unpredictable but powerful outcomes.' },
            6: { name: 'Bend Luck', description: 'Nudge crucial rolls up or down by channeling volatile magical flux.' },
            14: { name: 'Controlled Chaos', description: 'Improve surge reliability while retaining wild-magic volatility.' },
            18: { name: 'Spell Bombardment', description: 'Spike damage ceilings with capstone surges in explosive turns.' }
        }
    },
    Warlock: {
        'Archfey Patron': {
            3: { name: 'Fey Presence', description: 'Disrupt enemy formations with charm and fear effects.' },
            6: { name: 'Misty Escape', description: 'Vanish and reposition when threatened to preserve your casting line.' },
            10: { name: 'Beguiling Defenses', description: 'Turn charm pressure back against opponents and resist mental control.' },
            14: { name: 'Dark Delirium', description: 'Trap a target in fey nightmare logic for high-impact control.' }
        },
        'Celestial Patron': {
            3: { name: 'Healing Light', description: 'Deliver emergency ranged healing while maintaining warlock pressure.' },
            6: { name: 'Radiant Soul', description: 'Boost radiant and fire spell effectiveness with divine patronage.' },
            10: { name: 'Celestial Resilience', description: 'Raise party durability through temporary hit point reinforcement.' },
            14: { name: 'Searing Vengeance', description: 'Return from collapse in radiant force to swing back hard.' }
        },
        'Fiend Patron': {
            3: { name: 'Dark One\'s Blessing', description: 'Harvest temporary vitality from defeated foes to sustain momentum.' },
            6: { name: 'Dark One\'s Own Luck', description: 'Boost key checks and saves with infernal fortune.' },
            10: { name: 'Fiendish Resilience', description: 'Adapt resistances for stronger survivability in dangerous encounters.' },
            14: { name: 'Hurl Through Hell', description: 'Banish enemies through terrifying infernal punishment.' }
        },
        'Great Old One Patron': {
            3: { name: 'Awakened Mind', description: 'Project telepathic influence to coordinate and unsettle from range.' },
            6: { name: 'Entropic Ward', description: 'Warp probability to foil attacks and create retaliatory openings.' },
            10: { name: 'Thought Shield', description: 'Deflect psychic pressure and punish mental intrusion.' },
            14: { name: 'Create Thrall', description: 'Impose long-term domination over vulnerable minds.' }
        }
    },
    Wizard: {
        'School of Abjuration': {
            3: [
                { name: 'Abjuration Savant', description: 'Add Abjuration spells to your spellbook more efficiently as your studies deepen.' },
                { name: 'Arcane Ward', description: 'Create a protective ward that absorbs incoming damage.' }
            ],
            6: { name: 'Projected Ward', description: 'Extend your ward to shield allies at critical moments.' },
            10: { name: 'Improved Abjuration', description: 'Counter and suppress hostile magic with greater reliability.' },
            14: { name: 'Spell Resistance', description: 'Gain capstone resilience against enemy spell pressure.' }
        },
        'School of Divination': {
            3: [
                { name: 'Divination Savant', description: 'Add Divination spells to your spellbook with improved efficiency as your practice advances.' },
                { name: 'Portent', description: 'Bank future dice outcomes and deploy them at decisive moments.' }
            ],
            6: { name: 'Expert Divination', description: 'Recover resources while casting divination magic.' },
            10: { name: 'Third Eye', description: 'Gain elevated perception tools for scouting and magical awareness.' },
            14: { name: 'Greater Portent', description: 'Expand your fate-manipulation control for late-game encounters.' }
        },
        'School of Evocation': {
            3: [
                { name: 'Evocation Savant', description: 'Choose two Evocation spells and add them to your spellbook, then add one Evocation spell whenever you gain access to a new spell-slot level.' },
                { name: 'Potent Cantrip', description: 'Your damaging cantrips still deal half damage when a target avoids the full effect.' }
            ],
            6: { name: 'Sculpt Spells', description: 'Shape area spells to spare allies while preserving offensive pressure.' },
            10: { name: 'Empowered Evocation', description: 'Increase damage output on your core evocation spells.' },
            14: { name: 'Overchannel', description: 'Push selected spells to capstone power when maximum burst is required.' }
        },
        'School of Illusion': {
            3: [
                { name: 'Illusion Savant', description: 'Add Illusion spells to your spellbook more efficiently as your illusion studies mature.' },
                { name: 'Improved Minor Illusion', description: 'Expand deceptive utility through richer illusion construction.' }
            ],
            6: { name: 'Malleable Illusions', description: 'Retune active illusions dynamically as the encounter evolves.' },
            10: { name: 'Illusory Self', description: 'Negate key attacks through expertly timed illusion doubles.' },
            14: { name: 'Illusory Reality', description: 'Temporarily make illusions tangible for elite control plays.' }
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
    Monk: {
        selectorFeatureName: 'Monk Subclass',
        selectorLevel: 3,
        placeholderFeatureNames: ['Subclass Feature'],
        milestoneLevels: [3, 6, 11, 17]
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
    Bard: 'Choose 1 Bard College',
    Cleric: 'Choose 1 Divine Domain',
    Druid: 'Choose 1 Druid Circle',
    Fighter: 'Choose 1 Martial Archetype',
    Monk: 'Choose 1 Monastic Tradition',
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

