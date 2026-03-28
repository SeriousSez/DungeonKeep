export type SpellcastingProgression = 'none' | 'full' | 'half' | 'half-late' | 'pact';

export interface ClassSpellOption {
    name: string;
    level: number;
    source: '5E Core Rules' | '5E Expanded Rules';
}

const spellList = (
    source: ClassSpellOption['source'],
    levels: ReadonlyArray<readonly [number, readonly string[]]>
): ReadonlyArray<ClassSpellOption> =>
    levels.flatMap(([level, names]) => names.map((name) => ({ name, level, source })));

const coreSpellList = (...levels: ReadonlyArray<readonly [number, readonly string[]]>): ReadonlyArray<ClassSpellOption> =>
    spellList('5E Core Rules', levels);

const expandedSpellList = (...levels: ReadonlyArray<readonly [number, readonly string[]]>): ReadonlyArray<ClassSpellOption> =>
    spellList('5E Expanded Rules', levels);

export const spellcastingProgressionByClass: Readonly<Record<string, SpellcastingProgression>> = {
    Artificer: 'half',
    Barbarian: 'none',
    Bard: 'full',
    BloodHunter: 'none',
    'Blood Hunter': 'none',
    Cleric: 'full',
    Druid: 'full',
    Fighter: 'none',
    Monk: 'none',
    Paladin: 'half-late',
    Ranger: 'half-late',
    Rogue: 'none',
    Sorcerer: 'full',
    Warlock: 'pact',
    Wizard: 'full'
};

export const classSpellCatalog: Readonly<Record<string, ReadonlyArray<ClassSpellOption>>> = {
    Artificer: expandedSpellList(
        [0, ['Acid Splash', 'Booming Blade', 'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Frostbite', 'Green-Flame Blade', 'Guidance', 'Light', 'Lightning Lure', 'Mage Hand', 'Magic Stone', 'Mending', 'Message', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Resistance', 'Shocking Grasp', 'Spare the Dying', 'Sword Burst', 'Thorn Whip', 'Thunderclap']],
        [1, ['Absorb Elements', 'Alarm', 'Catapult', 'Cure Wounds', 'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'Faerie Fire', 'False Life', 'Feather Fall', 'Grease', 'Identify', 'Jump', 'Longstrider', 'Purify Food and Drink', 'Sanctuary', 'Snare', 'Tasha\'s Caustic Brew']],
        [2, ['Aid', 'Alter Self', 'Arcane Lock', 'Blur', 'Continual Flame', 'Darkvision', 'Enhance Ability', 'Enlarge/Reduce', 'Heat Metal', 'Invisibility', 'Lesser Restoration', 'Levitate', 'Magic Mouth', 'Magic Weapon', 'Protection from Poison', 'Pyrotechnics', 'Rope Trick', 'See Invisibility', 'Skywrite', 'Spider Climb', 'Web']],
        [3, ['Blink', 'Catnap', 'Create Food and Water', 'Dispel Magic', 'Elemental Weapon', 'Flame Arrows', 'Fly', 'Glyph of Warding', 'Haste', 'Intellect Fortress', 'Protection from Energy', 'Revivify', 'Tiny Servant', 'Water Breathing']],
        [4, ['Arcane Eye', 'Elemental Bane', 'Fabricate', 'Fire Shield', 'Freedom of Movement', 'Leomund\'s Secret Chest', 'Mordenkainen\'s Faithful Hound', 'Otiluke\'s Resilient Sphere', 'Stone Shape', 'Summon Construct']],
        [5, ['Animate Objects', 'Bigby\'s Hand', 'Creation', 'Greater Restoration', 'Skill Empowerment', 'Transmute Rock', 'Wall of Stone']]
    ),
    Bard: coreSpellList(
        [0, ['Blade Ward', 'Dancing Lights', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Prestidigitation', 'Starry Wisp', 'Thunderclap', 'True Strike', 'Vicious Mockery']],
        [1, ['Animal Friendship', 'Bane', 'Charm Person', 'Color Spray', 'Command', 'Comprehend Languages', 'Cure Wounds', 'Detect Magic', 'Disguise Self', 'Dissonant Whispers', 'Faerie Fire', 'Feather Fall', 'Healing Word', 'Heroism', 'Identify', 'Illusory Script', 'Longstrider', 'Silent Image', 'Sleep', 'Speak with Animals', 'Tasha\'s Hideous Laughter', 'Thunderwave', 'Unseen Servant']],
        [2, ['Aid', 'Animal Messenger', 'Blindness/Deafness', 'Calm Emotions', 'Cloud of Daggers', 'Crown of Madness', 'Detect Thoughts', 'Enhance Ability', 'Enlarge/Reduce', 'Enthrall', 'Heat Metal', 'Hold Person', 'Invisibility', 'Knock', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Magic Mouth', 'Mirror Image', 'Phantasmal Force', 'See Invisibility', 'Shatter', 'Silence', 'Suggestion', 'Zone of Truth']],
        [3, ['Bestow Curse', 'Clairvoyance', 'Dispel Magic', 'Fear', 'Feign Death', 'Glyph of Warding', 'Hypnotic Pattern', 'Leomund\'s Tiny Hut', 'Major Image', 'Mass Healing Word', 'Nondetection', 'Plant Growth', 'Sending', 'Slow', 'Speak with Dead', 'Speak with Plants', 'Stinking Cloud', 'Tongues']],
        [4, ['Charm Monster', 'Compulsion', 'Confusion', 'Dimension Door', 'Fount of Moonlight', 'Freedom of Movement', 'Greater Invisibility', 'Hallucinatory Terrain', 'Locate Creature', 'Phantasmal Killer', 'Polymorph']],
        [5, ['Animate Objects', 'Awaken', 'Dominate Person', 'Dream', 'Geas', 'Greater Restoration', 'Hold Monster', 'Legend Lore', 'Mass Cure Wounds', 'Mislead', 'Modify Memory', 'Planar Binding', 'Raise Dead', 'Rary\'s Telepathic Bond', 'Scrying', 'Seeming', 'Synaptic Static', 'Teleportation Circle', 'Yolande\'s Regal Presence']],
        [6, ['Eyebite', 'Find the Path', 'Guards and Wards', 'Heroes\' Feast', 'Mass Suggestion', 'Otto\'s Irresistible Dance', 'Programmed Illusion', 'True Seeing']],
        [7, ['Etherealness', 'Forcecage', 'Mirage Arcane', 'Mordenkainen\'s Magnificent Mansion', 'Mordenkainen\'s Sword', 'Power Word Fortify', 'Prismatic Spray', 'Project Image', 'Regenerate', 'Resurrection', 'Symbol', 'Teleport']],
        [8, ['Antipathy/Sympathy', 'Befuddlement', 'Dominate Monster', 'Glibness', 'Mind Blank', 'Power Word Stun']],
        [9, ['Foresight', 'Power Word Heal', 'Power Word Kill', 'Prismatic Wall', 'True Polymorph']]
    ),
    Cleric: coreSpellList(
        [0, ['Guidance', 'Light', 'Mending', 'Resistance', 'Sacred Flame', 'Spare the Dying', 'Thaumaturgy']],
        [1, ['Bane', 'Bless', 'Command', 'Create or Destroy Water', 'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease', 'Guiding Bolt', 'Healing Word', 'Inflict Wounds', 'Protection from Evil and Good', 'Purify Food and Drink', 'Sanctuary', 'Shield of Faith']],
        [2, ['Aid', 'Augury', 'Blindness/Deafness', 'Calm Emotions', 'Continual Flame', 'Enhance Ability', 'Find Traps', 'Gentle Repose', 'Hold Person', 'Lesser Restoration', 'Locate Object', 'Prayer of Healing', 'Protection from Poison', 'Silence', 'Spiritual Weapon', 'Warding Bond', 'Zone of Truth']],
        [3, ['Animate Dead', 'Beacon of Hope', 'Bestow Curse', 'Clairvoyance', 'Create Food and Water', 'Daylight', 'Dispel Magic', 'Glyph of Warding', 'Magic Circle', 'Mass Healing Word', 'Meld into Stone', 'Protection from Energy', 'Remove Curse', 'Revivify', 'Sending', 'Speak with Dead', 'Spirit Guardians', 'Tongues', 'Water Walk']],
        [4, ['Aura of Life', 'Banishment', 'Control Water', 'Death Ward', 'Divination', 'Freedom of Movement', 'Guardian of Faith', 'Locate Creature', 'Stone Shape']],
        [5, ['Commune', 'Contagion', 'Dispel Evil and Good', 'Flame Strike', 'Geas', 'Greater Restoration', 'Hallow', 'Insect Plague', 'Legend Lore', 'Mass Cure Wounds', 'Planar Binding', 'Raise Dead', 'Scrying']],
        [6, ['Blade Barrier', 'Create Undead', 'Find the Path', 'Forbiddance', 'Harm', 'Heal', 'Heroes\' Feast', 'Planar Ally', 'Sunbeam', 'True Seeing', 'Word of Recall']],
        [7, ['Conjure Celestial', 'Divine Word', 'Etherealness', 'Fire Storm', 'Plane Shift', 'Regenerate', 'Resurrection', 'Symbol']],
        [8, ['Antimagic Field', 'Control Weather', 'Earthquake', 'Holy Aura', 'Sunburst']],
        [9, ['Astral Projection', 'Gate', 'Mass Heal', 'True Resurrection']]
    ),
    Druid: coreSpellList(
        [0, ['Druidcraft', 'Elementalism', 'Guidance', 'Mending', 'Message', 'Poison Spray', 'Produce Flame', 'Resistance', 'Shillelagh', 'Spare the Dying', 'Starry Wisp', 'Thorn Whip', 'Thunderclap']],
        [1, ['Animal Friendship', 'Charm Person', 'Create or Destroy Water', 'Cure Wounds', 'Detect Magic', 'Detect Poison and Disease', 'Entangle', 'Faerie Fire', 'Fog Cloud', 'Goodberry', 'Healing Word', 'Ice Knife', 'Jump', 'Longstrider', 'Protection from Evil and Good', 'Purify Food and Drink', 'Speak with Animals', 'Thunderwave']],
        [2, ['Aid', 'Animal Messenger', 'Augury', 'Barkskin', 'Beast Sense', 'Continual Flame', 'Darkvision', 'Enhance Ability', 'Enlarge/Reduce', 'Find Traps', 'Flame Blade', 'Flaming Sphere', 'Gust of Wind', 'Heat Metal', 'Hold Person', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Moonbeam', 'Pass without Trace', 'Protection from Poison', 'Spike Growth', 'Summon Beast']],
        [3, ['Aura of Vitality', 'Call Lightning', 'Conjure Animals', 'Daylight', 'Dispel Magic', 'Elemental Weapon', 'Feign Death', 'Meld into Stone', 'Plant Growth', 'Protection from Energy', 'Revivify', 'Sleet Storm', 'Speak with Plants', 'Summon Fey', 'Water Breathing', 'Water Walk', 'Wind Wall']],
        [4, ['Blight', 'Charm Monster', 'Confusion', 'Conjure Minor Elementals', 'Conjure Woodland Beings', 'Control Water', 'Divination', 'Dominate Beast', 'Fire Shield', 'Fount of Moonlight', 'Freedom of Movement', 'Giant Insect', 'Grasping Vine', 'Hallucinatory Terrain', 'Ice Storm', 'Locate Creature', 'Polymorph', 'Stone Shape', 'Stoneskin', 'Summon Elemental', 'Wall of Fire']],
        [5, ['Antilife Shell', 'Awaken', 'Commune with Nature', 'Cone of Cold', 'Conjure Elemental', 'Contagion', 'Geas', 'Greater Restoration', 'Insect Plague', 'Mass Cure Wounds', 'Planar Binding', 'Reincarnate', 'Scrying', 'Tree Stride', 'Wall of Stone']],
        [6, ['Conjure Fey', 'Find the Path', 'Flesh to Stone', 'Heal', 'Heroes\' Feast', 'Move Earth', 'Sunbeam', 'Transport via Plants', 'Wall of Thorns', 'Wind Walk']],
        [7, ['Fire Storm', 'Mirage Arcane', 'Plane Shift', 'Regenerate', 'Reverse Gravity', 'Symbol']],
        [8, ['Animal Shapes', 'Antipathy/Sympathy', 'Befuddlement', 'Control Weather', 'Earthquake', 'Incendiary Cloud', 'Sunburst', 'Tsunami']],
        [9, ['Foresight', 'Shapechange', 'Storm of Vengeance', 'True Resurrection']]
    ),
    Paladin: coreSpellList(
        [1, ['Bless', 'Command', 'Compelled Duel', 'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease', 'Divine Favor', 'Divine Smite', 'Heroism', 'Protection from Evil and Good', 'Purify Food and Drink', 'Searing Smite', 'Shield of Faith', 'Thunderous Smite', 'Wrathful Smite']],
        [2, ['Aid', 'Find Steed', 'Gentle Repose', 'Lesser Restoration', 'Locate Object', 'Magic Weapon', 'Prayer of Healing', 'Protection from Poison', 'Shining Smite', 'Warding Bond', 'Zone of Truth']],
        [3, ['Aura of Vitality', 'Blinding Smite', 'Create Food and Water', 'Crusader\'s Mantle', 'Daylight', 'Dispel Magic', 'Elemental Weapon', 'Magic Circle', 'Remove Curse', 'Revivify']],
        [4, ['Aura of Life', 'Aura of Purity', 'Banishment', 'Death Ward', 'Locate Creature', 'Staggering Smite']],
        [5, ['Banishing Smite', 'Circle of Power', 'Destructive Wave', 'Dispel Evil and Good', 'Geas', 'Greater Restoration', 'Raise Dead', 'Summon Celestial']]
    ),
    Ranger: coreSpellList(
        [1, ['Alarm', 'Animal Friendship', 'Cure Wounds', 'Detect Magic', 'Detect Poison and Disease', 'Ensnaring Strike', 'Entangle', 'Fog Cloud', 'Goodberry', 'Hail of Thorns', 'Hunter\'s Mark', 'Jump', 'Longstrider', 'Speak with Animals']],
        [2, ['Aid', 'Animal Messenger', 'Barkskin', 'Beast Sense', 'Cordon of Arrows', 'Darkvision', 'Enhance Ability', 'Find Traps', 'Gust of Wind', 'Lesser Restoration', 'Locate Animals or Plants', 'Locate Object', 'Magic Weapon', 'Pass without Trace', 'Protection from Poison', 'Silence', 'Spike Growth', 'Summon Beast']],
        [3, ['Conjure Animals', 'Conjure Barrage', 'Daylight', 'Dispel Magic', 'Elemental Weapon', 'Lightning Arrow', 'Meld into Stone', 'Nondetection', 'Plant Growth', 'Protection from Energy', 'Revivify', 'Speak with Plants', 'Summon Fey', 'Water Breathing', 'Water Walk', 'Wind Wall']],
        [4, ['Conjure Woodland Beings', 'Dominate Beast', 'Freedom of Movement', 'Grasping Vine', 'Locate Creature', 'Stoneskin', 'Summon Elemental']],
        [5, ['Commune with Nature', 'Conjure Volley', 'Greater Restoration', 'Steel Wind Strike', 'Swift Quiver', 'Tree Stride']]
    ),
    Sorcerer: coreSpellList(
        [0, ['Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Elementalism', 'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Mind Sliver', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Sorcerous Burst', 'Thunderclap', 'True Strike']],
        [1, ['Burning Hands', 'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'False Life', 'Feather Fall', 'Fog Cloud', 'Grease', 'Ice Knife', 'Jump', 'Mage Armor', 'Magic Missile', 'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep', 'Thunderwave', 'Witch Bolt']],
        [2, ['Alter Self', 'Arcane Vigor', 'Blindness/Deafness', 'Blur', 'Cloud of Daggers', 'Crown of Madness', 'Darkness', 'Darkvision', 'Detect Thoughts', 'Dragon\'s Breath', 'Enhance Ability', 'Enlarge/Reduce', 'Flame Blade', 'Flaming Sphere', 'Gust of Wind', 'Hold Person', 'Invisibility', 'Knock', 'Levitate', 'Magic Weapon', 'Mind Spike', 'Mirror Image', 'Misty Step', 'Phantasmal Force', 'Scorching Ray', 'See Invisibility', 'Shatter', 'Spider Climb', 'Suggestion', 'Web']],
        [3, ['Blink', 'Clairvoyance', 'Counterspell', 'Daylight', 'Dispel Magic', 'Fear', 'Fireball', 'Fly', 'Gaseous Form', 'Haste', 'Hypnotic Pattern', 'Lightning Bolt', 'Major Image', 'Protection from Energy', 'Sleet Storm', 'Slow', 'Stinking Cloud', 'Tongues', 'Vampiric Touch', 'Water Breathing', 'Water Walk']],
        [4, ['Banishment', 'Blight', 'Charm Monster', 'Confusion', 'Dimension Door', 'Dominate Beast', 'Fire Shield', 'Greater Invisibility', 'Ice Storm', 'Polymorph', 'Stoneskin', 'Vitriolic Sphere', 'Wall of Fire']],
        [5, ['Animate Objects', 'Bigby\'s Hand', 'Cloudkill', 'Cone of Cold', 'Creation', 'Dominate Person', 'Hold Monster', 'Insect Plague', 'Seeming', 'Synaptic Static', 'Telekinesis', 'Teleportation Circle', 'Wall of Stone']],
        [6, ['Arcane Gate', 'Chain Lightning', 'Circle of Death', 'Disintegrate', 'Eyebite', 'Flesh to Stone', 'Globe of Invulnerability', 'Mass Suggestion', 'Move Earth', 'Otiluke\'s Freezing Sphere', 'Sunbeam', 'True Seeing']],
        [7, ['Delayed Blast Fireball', 'Etherealness', 'Finger of Death', 'Fire Storm', 'Plane Shift', 'Prismatic Spray', 'Reverse Gravity', 'Teleport']],
        [8, ['Demiplane', 'Dominate Monster', 'Earthquake', 'Incendiary Cloud', 'Power Word Stun', 'Sunburst']],
        [9, ['Gate', 'Meteor Swarm', 'Power Word Kill', 'Time Stop', 'Wish']]
    ),
    Warlock: coreSpellList(
        [0, ['Blade Ward', 'Chill Touch', 'Eldritch Blast', 'Friends', 'Mage Hand', 'Mind Sliver', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Thunderclap', 'Toll the Dead', 'True Strike']],
        [1, ['Armor of Agathys', 'Arms of Hadar', 'Bane', 'Charm Person', 'Comprehend Languages', 'Detect Magic', 'Expeditious Retreat', 'Hellish Rebuke', 'Hex', 'Illusory Script', 'Protection from Evil and Good', 'Speak with Animals', 'Tasha\'s Hideous Laughter', 'Unseen Servant', 'Witch Bolt']],
        [2, ['Cloud of Daggers', 'Crown of Madness', 'Darkness', 'Enthrall', 'Hold Person', 'Invisibility', 'Mind Spike', 'Mirror Image', 'Misty Step', 'Ray of Enfeeblement', 'Spider Climb', 'Suggestion']],
        [3, ['Counterspell', 'Dispel Magic', 'Fear', 'Fly', 'Gaseous Form', 'Hunger of Hadar', 'Hypnotic Pattern', 'Magic Circle', 'Major Image', 'Remove Curse', 'Summon Fey', 'Summon Undead', 'Tongues', 'Vampiric Touch']],
        [4, ['Banishment', 'Blight', 'Charm Monster', 'Dimension Door', 'Hallucinatory Terrain', 'Summon Aberration']],
        [5, ['Contact Other Plane', 'Dream', 'Hold Monster', 'Jallarzi\'s Storm of Radiance', 'Mislead', 'Planar Binding', 'Scrying', 'Synaptic Static', 'Teleportation Circle']],
        [6, ['Arcane Gate', 'Circle of Death', 'Create Undead', 'Eyebite', 'Summon Fiend', 'Tasha\'s Bubbling Cauldron', 'True Seeing']],
        [7, ['Etherealness', 'Finger of Death', 'Forcecage', 'Plane Shift']],
        [8, ['Befuddlement', 'Demiplane', 'Dominate Monster', 'Glibness', 'Power Word Stun']],
        [9, ['Astral Projection', 'Foresight', 'Gate', 'Imprisonment', 'Power Word Kill', 'True Polymorph', 'Weird']]
    ),
    Wizard: coreSpellList(
        [0, ['Acid Splash', 'Chill Touch', 'Dancing Lights', 'Fire Bolt', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Thunderclap', 'True Strike']],
        [1, ['Alarm', 'Burning Hands', 'Charm Person', 'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self', 'Expeditious Retreat', 'False Life', 'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Grease', 'Identify', 'Illusory Script', 'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile', 'Protection from Evil and Good', 'Shield', 'Silent Image', 'Sleep', 'Thunderwave', 'Unseen Servant']],
        [2, ['Alter Self', 'Arcane Lock', 'Augury', 'Blindness/Deafness', 'Blur', 'Continual Flame', 'Darkness', 'Darkvision', 'Detect Thoughts', 'Enhance Ability', 'Enlarge/Reduce', 'Flaming Sphere', 'Gentle Repose', 'Gust of Wind', 'Hold Person', 'Invisibility', 'Knock', 'Levitate', 'Locate Object', 'Magic Mouth', 'Magic Weapon', 'Mirror Image', 'Misty Step', 'Ray of Enfeeblement', 'Rope Trick', 'Scorching Ray', 'See Invisibility', 'Shatter', 'Spider Climb', 'Suggestion', 'Web']],
        [3, ['Animate Dead', 'Bestow Curse', 'Blink', 'Clairvoyance', 'Counterspell', 'Dispel Magic', 'Fear', 'Fireball', 'Fly', 'Gaseous Form', 'Glyph of Warding', 'Haste', 'Hypnotic Pattern', 'Lightning Bolt', 'Magic Circle', 'Major Image', 'Nondetection', 'Phantom Steed', 'Protection from Energy', 'Remove Curse', 'Sending', 'Sleet Storm', 'Slow', 'Speak with Dead', 'Stinking Cloud', 'Tongues', 'Vampiric Touch', 'Water Breathing']],
        [4, ['Arcane Eye', 'Banishment', 'Blight', 'Confusion', 'Conjure Minor Elementals', 'Control Water', 'Dimension Door', 'Divination', 'Fabricate', 'Fire Shield', 'Greater Invisibility', 'Hallucinatory Terrain', 'Ice Storm', 'Locate Creature', 'Phantasmal Killer', 'Polymorph', 'Stone Shape', 'Stoneskin', 'Wall of Fire']],
        [5, ['Animate Objects', 'Cloudkill', 'Cone of Cold', 'Conjure Elemental', 'Contact Other Plane', 'Creation', 'Dominate Person', 'Dream', 'Geas', 'Hold Monster', 'Legend Lore', 'Mislead', 'Modify Memory', 'Passwall', 'Planar Binding', 'Scrying', 'Seeming', 'Telekinesis', 'Teleportation Circle', 'Wall of Force', 'Wall of Stone']],
        [6, ['Chain Lightning', 'Circle of Death', 'Contingency', 'Create Undead', 'Disintegrate', 'Eyebite', 'Flesh to Stone', 'Globe of Invulnerability', 'Guards and Wards', 'Magic Jar', 'Mass Suggestion', 'Move Earth', 'Programmed Illusion', 'Sunbeam', 'True Seeing', 'Wall of Ice']],
        [7, ['Delayed Blast Fireball', 'Etherealness', 'Finger of Death', 'Forcecage', 'Mirage Arcane', 'Plane Shift', 'Prismatic Spray', 'Project Image', 'Reverse Gravity', 'Sequester', 'Simulacrum', 'Symbol', 'Teleport']],
        [8, ['Antimagic Field', 'Antipathy/Sympathy', 'Clone', 'Control Weather', 'Demiplane', 'Dominate Monster', 'Incendiary Cloud', 'Maze', 'Mind Blank', 'Power Word Stun', 'Sunburst']],
        [9, ['Astral Projection', 'Foresight', 'Gate', 'Imprisonment', 'Meteor Swarm', 'Power Word Kill', 'Prismatic Wall', 'Shapechange', 'Time Stop', 'True Polymorph', 'Weird', 'Wish']]
    )
};