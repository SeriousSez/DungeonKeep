export interface Deity {
    name: string;
    domain: string;
    pantheon: string;
}

export const deitiesList: ReadonlyArray<Deity> = [
    // Core Human Deities – Greater
    { name: 'Boccob', domain: 'Magic, Arcane Knowledge, Balance', pantheon: 'Core' },
    { name: 'Corellon Larethian', domain: 'Elves, Magic, Music, Arts', pantheon: 'Core' },
    { name: 'Garl Glittergold', domain: 'Gnomes, Humor, Gemcutting', pantheon: 'Core' },
    { name: 'Gruumsh', domain: 'Orcs, Conquest, Strength', pantheon: 'Core' },
    { name: 'Lolth', domain: 'Drow, Spiders, Evil, Darkness', pantheon: 'Core' },
    { name: 'Moradin', domain: 'Dwarves, Creation, Smithing', pantheon: 'Core' },
    { name: 'Nerull', domain: 'Death, Darkness, Murder', pantheon: 'Core' },
    { name: 'Pelor', domain: 'Sun, Light, Strength, Healing', pantheon: 'Core' },
    { name: 'Yondalla', domain: 'Halflings, Family, Law, Protection', pantheon: 'Core' },

    // Core Human Deities – Intermediate
    { name: 'Ehlonna', domain: 'Forests, Woodlands, Flora & Fauna', pantheon: 'Core' },
    { name: 'Erythnul', domain: 'Hate, Envy, Malice, Panic, Slaughter', pantheon: 'Core' },
    { name: 'Fharlanghn', domain: 'Horizons, Distance, Travel, Roads', pantheon: 'Core' },
    { name: 'Heironeous', domain: 'Chivalry, Justice, Honor, War, Valor', pantheon: 'Core' },
    { name: 'Hextor', domain: 'War, Discord, Massacres, Tyranny', pantheon: 'Core' },
    { name: 'Kord', domain: 'Athletics, Sports, Brawling, Strength', pantheon: 'Core' },
    { name: 'Obad-Hai', domain: 'Nature, Woodlands, Freedom, Hunting', pantheon: 'Core' },
    { name: 'Olidammara', domain: 'Music, Revels, Wine, Rogues, Trickery', pantheon: 'Core' },
    { name: 'Saint Cuthbert', domain: 'Common Sense, Wisdom, Honesty, Law', pantheon: 'Core' },
    { name: 'Wee Jas', domain: 'Magic, Death, Vanity, Law', pantheon: 'Core' },

    // Core Human Deities – Lesser
    { name: 'Vecna', domain: 'Destructive Secrets, Undead, Evil', pantheon: 'Core' },

    // Additional Core
    { name: 'Bahamut', domain: 'Good Dragons, Justice, Wind', pantheon: 'Core' },
    { name: 'Tiamat', domain: 'Evil Dragons, Conquest, Greed', pantheon: 'Core' },
    { name: 'Iuz', domain: 'Deceit, Pain, Oppression, Evil', pantheon: 'Core' },
    { name: 'Tharizdun', domain: 'Eternal Darkness, Decay, Entropy, Insanity', pantheon: 'Core' },
    { name: 'Trithereon', domain: 'Individuality, Liberty, Retribution', pantheon: 'Core' },
    { name: 'Pholtus', domain: 'Light, Resolution, Law, Order', pantheon: 'Core' },
    { name: 'Istus', domain: 'Fate, Destiny, Divination, Future', pantheon: 'Core' },
    { name: 'Celestian', domain: 'Stars, Space, Wanderers', pantheon: 'Core' },
    { name: 'Procan', domain: 'Seas, Sea Life, Navigation', pantheon: 'Core' },

    // Dwarven Deities
    { name: 'Abbathor', domain: 'Greed', pantheon: 'Dwarven' },
    { name: 'Berronar Truesilver', domain: 'Safety, Truth, Home, Healing', pantheon: 'Dwarven' },
    { name: 'Clanggedin Silverbeard', domain: 'Battle, War', pantheon: 'Dwarven' },
    { name: 'Dumathoin', domain: 'Exploration, Mining, Lost Secrets', pantheon: 'Dwarven' },
    { name: 'Vergadain', domain: 'Wealth, Luck, Trade', pantheon: 'Dwarven' },

    // Elven Deities
    { name: 'Aerdrie Faenya', domain: 'Air, Weather, Avians, Rain', pantheon: 'Elven' },
    { name: 'Deep Sashelas', domain: 'Aquatic Elves, Oceans, Knowledge', pantheon: 'Elven' },
    { name: 'Erevan Ilesere', domain: 'Mischief, Change, Rogues', pantheon: 'Elven' },
    { name: 'Hanali Celanil', domain: 'Love, Romance, Beauty, Fine Art', pantheon: 'Elven' },
    { name: 'Labelas Enoreth', domain: 'Time, Longevity, History', pantheon: 'Elven' },
    { name: 'Rillifane Rallathil', domain: 'Wood Elves, Woodlands, Nature', pantheon: 'Elven' },
    { name: 'Sehanine Moonbow', domain: 'Mysticism, Dreams, Death, Moon', pantheon: 'Elven' },
    { name: 'Solonor Thelandira', domain: 'Archery, Hunting, Wilderness Survival', pantheon: 'Elven' },

    // Gnome Deities
    { name: 'Baervan Wildwanderer', domain: 'Forests, Nature, Travel', pantheon: 'Gnome' },
    { name: 'Flandal Steelskin', domain: 'Mining, Smithing, Fitness', pantheon: 'Gnome' },
    { name: 'Segojan Earthcaller', domain: 'Earth, Nature', pantheon: 'Gnome' },

    // Halfling Deities
    { name: 'Arvoreen', domain: 'Protection, Vigilance, War', pantheon: 'Halfling' },
    { name: 'Brandobaris', domain: 'Stealth, Thieves, Adventuring', pantheon: 'Halfling' },
    { name: 'Cyrrollalee', domain: 'Friendship, Trust, Home', pantheon: 'Halfling' },
    { name: 'Sheela Peryroyl', domain: 'Nature, Agriculture, Weather', pantheon: 'Halfling' },

    // Forgotten Realms – The Faerûnian Pantheon
    { name: 'Ao', domain: 'Overseer of the Gods', pantheon: 'Forgotten Realms' },
    { name: 'Bane', domain: 'Strife, Hatred, Tyranny', pantheon: 'Forgotten Realms' },
    { name: 'Bhaal', domain: 'Murder, Death', pantheon: 'Forgotten Realms' },
    { name: 'Chauntea', domain: 'Agriculture, Plants, Seasons', pantheon: 'Forgotten Realms' },
    { name: 'Cyric', domain: 'Lies, Murder, Illusion', pantheon: 'Forgotten Realms' },
    { name: 'Deneir', domain: 'Glyphs, Images, Literature', pantheon: 'Forgotten Realms' },
    { name: 'Eldath', domain: 'Peace, Quiet Places, Streams', pantheon: 'Forgotten Realms' },
    { name: 'Gond', domain: 'Craft, Smithing, Engineering', pantheon: 'Forgotten Realms' },
    { name: 'Helm', domain: 'Guardians, Protection, Duty', pantheon: 'Forgotten Realms' },
    { name: 'Ilmater', domain: 'Endurance, Suffering, Martyrs', pantheon: 'Forgotten Realms' },
    { name: 'Kelemvor', domain: 'Death, the Dead, the Judgement', pantheon: 'Forgotten Realms' },
    { name: 'Lathander', domain: 'Dawn, Birth, Renewal, Youth', pantheon: 'Forgotten Realms' },
    { name: 'Malar', domain: 'Hunters, Evil Lycanthropes, Bloodlust', pantheon: 'Forgotten Realms' },
    { name: 'Mielikki', domain: 'Forests, Rangers, Dryads', pantheon: 'Forgotten Realms' },
    { name: 'Milil', domain: 'Song, Poetry, Eloquence', pantheon: 'Forgotten Realms' },
    { name: 'Myrkul', domain: 'Death, Decay, Old Age', pantheon: 'Forgotten Realms' },
    { name: 'Mystra', domain: 'Magic, Spells, the Weave', pantheon: 'Forgotten Realms' },
    { name: 'Oghma', domain: 'Knowledge, Invention, Inspiration', pantheon: 'Forgotten Realms' },
    { name: 'Selûne', domain: 'Moon, Stars, Navigation, Lycanthropes', pantheon: 'Forgotten Realms' },
    { name: 'Silvanus', domain: 'Nature, Wild, Druids', pantheon: 'Forgotten Realms' },
    { name: 'Sune', domain: 'Love, Beauty, Passion', pantheon: 'Forgotten Realms' },
    { name: 'Talona', domain: 'Disease, Poison', pantheon: 'Forgotten Realms' },
    { name: 'Talos', domain: 'Storms, Destruction, Rebellion', pantheon: 'Forgotten Realms' },
    { name: 'Tempus', domain: 'War, Battle, Warriors', pantheon: 'Forgotten Realms' },
    { name: 'Torm', domain: 'Duty, Loyalty, Righteousness', pantheon: 'Forgotten Realms' },
    { name: 'Tymora', domain: 'Good Fortune, Skill, Victory', pantheon: 'Forgotten Realms' },
    { name: 'Tyr', domain: 'Justice, Fair Trials, Law', pantheon: 'Forgotten Realms' },
    { name: 'Umberlee', domain: 'Sea, Currents, Waves, Wrath', pantheon: 'Forgotten Realms' },
    { name: 'Waukeen', domain: 'Trade, Money, Wealth', pantheon: 'Forgotten Realms' },

    // Non-deity Powers (commonly worshipped)
    { name: 'Asmodeus', domain: 'Domination, Tyranny, the Nine Hells', pantheon: 'Infernal' },
    { name: 'Demogorgon', domain: 'Chaos, Madness, the Abyss', pantheon: 'Abyssal' },
    { name: 'Orcus', domain: 'Undead, Death, Darkness', pantheon: 'Abyssal' },
];
