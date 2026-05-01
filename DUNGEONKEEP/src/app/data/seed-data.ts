import { Campaign, Character, DEFAULT_CAMPAIGN_MAP_GRID_COLOR, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y, DEFAULT_CAMPAIGN_MAP_GRID_ROWS } from '../models/dungeon.models';

export const seedCampaigns: Campaign[] = [
    {
        id: 'crown-of-embers',
        name: 'Crown of Embers',
        setting: 'Ashfall Reach',
        tone: 'Heroic',
        levelStart: 5,
        levelEnd: 8,
        levelRange: 'Levels 5-8',
        summary: 'A frontier kingdom is rebuilding after a dragon siege, but the royal line is still haunted by the pact that saved it.',
        hook: 'Recover the ember crown before three rival houses awaken the furnace beneath Redglass Keep.',
        nextSession: '2026-03-29',
        characterCount: 3,
        sessionCount: 2,
        npcCount: 3,
        openThreadCount: 2,
        detailsLoaded: true,
        partyCharacterIds: ['seraphine', 'brakka', 'ivelios'],
        sessions: [
            {
                id: 'embers-1',
                title: 'Audience at Redglass Keep',
                date: '2026-03-29',
                location: 'Redglass Keep',
                objective: 'Win the trust of the regent and identify the court saboteur.',
                threat: 'Moderate',
                isRevealedToPlayers: false
            },
            {
                id: 'embers-2',
                title: 'Descent into the Furnace',
                date: '2026-04-12',
                location: 'The Cinder Vault',
                objective: 'Seal the breach before the ash wyrmlings hatch.',
                threat: 'Deadly',
                isRevealedToPlayers: false
            }
        ],
        openThreads: [
            {
                id: 'thread-embers-1',
                text: 'The regent wears a warding sigil from the old dragon cult.',
                visibility: 'Party'
            },
            {
                id: 'thread-embers-2',
                text: 'A missing scout was seen entering the soot market under illusion magic.',
                visibility: 'Party'
            }
        ],
        worldNotes: [
            {
                id: 'note-embers-1',
                title: 'Ash Oath of House Veyr',
                category: 'Backstory',
                content: 'The royal house survived the dragon siege by swearing a hidden ash oath to the furnace spirit below Redglass Keep. Only the regent, the ember cathedral, and a vanished court historian know the exact terms.',
                isRevealedToPlayers: false
            },
            {
                id: 'note-embers-2',
                title: 'Soot Market Brokers',
                category: 'Organization',
                content: 'Independent soot brokers trade in salvage, rumors, and warded relic fragments. Rook acts as the least loyal but most informed fixer among them.',
                isRevealedToPlayers: false
            }
        ],
        map: {
            background: 'City',
            backgroundImageUrl: '',
            gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
            gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
            gridColor: DEFAULT_CAMPAIGN_MAP_GRID_COLOR,
            gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
            gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
            strokes: [
                {
                    id: 'map-embers-stroke-1',
                    color: '#4b3a2a',
                    width: 4,
                    points: [
                        { x: 0.16, y: 0.74 },
                        { x: 0.28, y: 0.62 },
                        { x: 0.38, y: 0.53 },
                        { x: 0.52, y: 0.47 },
                        { x: 0.7, y: 0.36 }
                    ]
                }
            ],
            walls: [],
            icons: [
                { id: 'map-embers-icon-1', type: 'Keep', label: 'Redglass Keep', x: 0.62, y: 0.31 },
                { id: 'map-embers-icon-2', type: 'Town', label: 'Soot Market', x: 0.34, y: 0.58 },
                { id: 'map-embers-icon-3', type: 'Dungeon', label: 'Cinder Vault', x: 0.8, y: 0.22 }
            ],
            tokens: [],
            decorations: [],
            labels: [],
            layers: {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            },
            visionMemory: [],
            visionEnabled: true,
            membersCanViewAnytime: true
        },
        maps: [
            {
                id: 'map-board-crown-of-embers',
                name: 'Redglass Marches',
                background: 'City',
                backgroundImageUrl: '',
                gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
                gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
                gridColor: DEFAULT_CAMPAIGN_MAP_GRID_COLOR,
                gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
                gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
                strokes: [
                    {
                        id: 'map-embers-stroke-1',
                        color: '#4b3a2a',
                        width: 4,
                        points: [
                            { x: 0.16, y: 0.74 },
                            { x: 0.28, y: 0.62 },
                            { x: 0.38, y: 0.53 },
                            { x: 0.52, y: 0.47 },
                            { x: 0.7, y: 0.36 }
                        ]
                    }
                ],
                walls: [],
                icons: [
                    { id: 'map-embers-icon-1', type: 'Keep', label: 'Redglass Keep', x: 0.62, y: 0.31 },
                    { id: 'map-embers-icon-2', type: 'Town', label: 'Soot Market', x: 0.34, y: 0.58 },
                    { id: 'map-embers-icon-3', type: 'Dungeon', label: 'Cinder Vault', x: 0.8, y: 0.22 }
                ],
                tokens: [],
                decorations: [],
                labels: [],
                layers: {
                    rivers: [],
                    mountainChains: [],
                    forestBelts: []
                },
                visionMemory: [],
                visionEnabled: true,
                membersCanViewAnytime: true
            }
        ],
        activeMapId: 'map-board-crown-of-embers',
        loot: [{ name: 'Glasssteel buckler' }, { name: 'Map to the Cinder Vault' }, { name: 'Three sealed phoenix feathers' }],
        campaignNpcs: [],
        npcs: ['Regent Maelis', 'Brother Tovin', 'Rook the soot broker']
    },
    {
        id: 'moonwake-ledger',
        name: 'Moonwake Ledger',
        setting: 'The Pearl Coast',
        tone: 'Mystic',
        levelStart: 3,
        levelEnd: 5,
        levelRange: 'Levels 3-5',
        summary: 'A magical storm has begun rewriting ship logs, debts, and family histories across the coast.',
        hook: 'Track the cursed ledger before an entire harbor city forgets who rules it.',
        nextSession: '2026-04-05',
        characterCount: 2,
        sessionCount: 1,
        npcCount: 3,
        openThreadCount: 2,
        detailsLoaded: true,
        partyCharacterIds: ['kael', 'mira'],
        sessions: [
            {
                id: 'moonwake-1',
                title: 'The Ink Tide Auction',
                date: '2026-04-05',
                location: 'Harbor of Saint Vey',
                objective: 'Outbid the ghost cartel for the ledger key.',
                threat: 'High',
                isRevealedToPlayers: false
            }
        ],
        openThreads: [
            {
                id: 'thread-moonwake-1',
                text: 'The harbor master appears in two places in the rewritten records.',
                visibility: 'Party'
            },
            {
                id: 'thread-moonwake-2',
                text: 'A drowned saint is answering divinations in someone else\'s voice.',
                visibility: 'Party'
            }
        ],
        worldNotes: [
            {
                id: 'note-moonwake-1',
                title: 'The Ledger Choir',
                category: 'Enemy',
                content: 'A circle of ghost accountants sings altered debts into storm-soaked ledgers. Their rewritten records can shift inheritance, titles, and civic authority overnight.',
                isRevealedToPlayers: false
            }
        ],
        map: {
            background: 'Coast',
            backgroundImageUrl: '',
            gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
            gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
            gridColor: '#3f667e',
            gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
            gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
            strokes: [
                {
                    id: 'map-moonwake-stroke-1',
                    color: '#385f7a',
                    width: 5,
                    points: [
                        { x: 0.12, y: 0.68 },
                        { x: 0.28, y: 0.61 },
                        { x: 0.44, y: 0.64 },
                        { x: 0.57, y: 0.57 },
                        { x: 0.74, y: 0.6 }
                    ]
                }
            ],
            walls: [],
            icons: [
                { id: 'map-moonwake-icon-1', type: 'Town', label: 'Saint Vey Harbor', x: 0.42, y: 0.49 },
                { id: 'map-moonwake-icon-2', type: 'Portal', label: 'Storm Break', x: 0.76, y: 0.43 },
                { id: 'map-moonwake-icon-3', type: 'Treasure', label: 'Ledger Cache', x: 0.23, y: 0.37 }
            ],
            tokens: [],
            decorations: [],
            labels: [],
            layers: {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            },
            visionMemory: [],
            visionEnabled: true,
            membersCanViewAnytime: true
        },
        maps: [
            {
                id: 'map-board-moonwake-ledger',
                name: 'Moonwake Coastline',
                background: 'Coast',
                backgroundImageUrl: '',
                gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
                gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
                gridColor: '#3f667e',
                gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
                gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
                strokes: [
                    {
                        id: 'map-moonwake-stroke-1',
                        color: '#385f7a',
                        width: 5,
                        points: [
                            { x: 0.12, y: 0.68 },
                            { x: 0.28, y: 0.61 },
                            { x: 0.44, y: 0.64 },
                            { x: 0.57, y: 0.57 },
                            { x: 0.74, y: 0.6 }
                        ]
                    }
                ],
                walls: [],
                icons: [
                    { id: 'map-moonwake-icon-1', type: 'Town', label: 'Saint Vey Harbor', x: 0.42, y: 0.49 },
                    { id: 'map-moonwake-icon-2', type: 'Portal', label: 'Storm Break', x: 0.76, y: 0.43 },
                    { id: 'map-moonwake-icon-3', type: 'Treasure', label: 'Ledger Cache', x: 0.23, y: 0.37 }
                ],
                tokens: [],
                decorations: [],
                labels: [],
                layers: {
                    rivers: [],
                    mountainChains: [],
                    forestBelts: []
                },
                visionMemory: [],
                visionEnabled: true,
                membersCanViewAnytime: true
            }
        ],
        activeMapId: 'map-board-moonwake-ledger',
        loot: [{ name: 'Whisper-shell compass' }, { name: 'Stormglass vial' }],
        campaignNpcs: [],
        npcs: ['Captain Nereza', 'Ledger-Keeper Sol', 'The Lantern Magistrate']
    },
    {
        id: 'wild-below',
        name: 'The Wild Below',
        campaignNpcs: [],
        setting: 'Rootmaze Hollow',
        tone: 'Chaotic',
        levelStart: 1,
        levelEnd: 3,
        levelRange: 'Levels 1-3',
        summary: 'Ancient roots have opened a laughing underworld beneath the village orchards.',
        hook: 'Map the rootmaze before the midsummer fair turns into a fey migration.',
        nextSession: '2026-04-18',
        characterCount: 1,
        sessionCount: 1,
        npcCount: 3,
        openThreadCount: 1,
        detailsLoaded: true,
        partyCharacterIds: ['thistle'],
        sessions: [
            {
                id: 'wild-1',
                title: 'Lanterns Under the Orchard',
                date: '2026-04-18',
                location: 'Bramble Market',
                objective: 'Rescue the missing pie judge from a bargain circle.',
                threat: 'Low',
                isRevealedToPlayers: false
            }
        ],
        openThreads: [
            {
                id: 'thread-wild-1',
                text: 'Every mushroom ring now points toward the mayor\'s cellar.',
                visibility: 'Party'
            }
        ],
        worldNotes: [
            {
                id: 'note-wild-1',
                title: 'Rootmaze Bargains',
                category: 'Lore',
                content: 'The underworld below the orchards trades in memories, festival songs, and unfinished promises. Anything offered there returns changed.',
                isRevealedToPlayers: false
            }
        ],
        map: {
            background: 'Cavern',
            backgroundImageUrl: '',
            gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
            gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
            gridColor: '#4a5f3e',
            gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
            gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
            strokes: [
                {
                    id: 'map-wild-stroke-1',
                    color: '#507255',
                    width: 6,
                    points: [
                        { x: 0.2, y: 0.24 },
                        { x: 0.34, y: 0.36 },
                        { x: 0.3, y: 0.52 },
                        { x: 0.48, y: 0.66 },
                        { x: 0.7, y: 0.62 }
                    ]
                }
            ],
            walls: [],
            icons: [
                { id: 'map-wild-icon-1', type: 'Camp', label: 'Bramble Market', x: 0.25, y: 0.18 },
                { id: 'map-wild-icon-2', type: 'Danger', label: 'Bargain Ring', x: 0.56, y: 0.48 },
                { id: 'map-wild-icon-3', type: 'Portal', label: 'Mayor\'s Cellar', x: 0.74, y: 0.7 }
            ],
            tokens: [],
            decorations: [],
            labels: [],
            layers: {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            },
            visionMemory: [],
            visionEnabled: true,
            membersCanViewAnytime: true
        },
        maps: [
            {
                id: 'map-board-wild-below',
                name: 'Rootmaze Hollow',
                background: 'Cavern',
                backgroundImageUrl: '',
                gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
                gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
                gridColor: '#4a5f3e',
                gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
                gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
                strokes: [
                    {
                        id: 'map-wild-stroke-1',
                        color: '#507255',
                        width: 6,
                        points: [
                            { x: 0.2, y: 0.24 },
                            { x: 0.34, y: 0.36 },
                            { x: 0.3, y: 0.52 },
                            { x: 0.48, y: 0.66 },
                            { x: 0.7, y: 0.62 }
                        ]
                    }
                ],
                walls: [],
                icons: [
                    { id: 'map-wild-icon-1', type: 'Camp', label: 'Bramble Market', x: 0.25, y: 0.18 },
                    { id: 'map-wild-icon-2', type: 'Danger', label: 'Bargain Ring', x: 0.56, y: 0.48 },
                    { id: 'map-wild-icon-3', type: 'Portal', label: 'Mayor\'s Cellar', x: 0.74, y: 0.7 }
                ],
                tokens: [],
                decorations: [],
                labels: [],
                layers: {
                    rivers: [],
                    mountainChains: [],
                    forestBelts: []
                },
                visionMemory: [],
                visionEnabled: true,
                membersCanViewAnytime: true
            }
        ],
        activeMapId: 'map-board-wild-below',
        loot: [{ name: 'Honeyed iron key' }],
        npcs: ['Mayor Fen', 'Pip the pie judge', 'The Moss Matron']
    }
];

export const seedCharacters: Character[] = [
    {
        id: 'seraphine',
        campaignId: 'crown-of-embers',
        name: 'Seraphine Vale',
        playerName: 'Nadia',
        race: 'Tiefling',
        className: 'Paladin',
        level: 7,
        role: 'Tank',
        status: 'Ready',
        background: 'Former inquisitor of the ember cathedral',
        notes: 'Carries a cracked oath seal that reacts to dragonfire.',
        abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 15, charisma: 14 },
        skills: { acrobatics: false, animalHandling: false, arcana: false, athletics: true, deception: false, history: false, insight: true, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 18,
        hitPoints: 50,
        maxHitPoints: 52,
        proficiencyBonus: 3,
        traits: ['Infernal Legacy: Know the Thaumaturgy cantrip', 'Darkvision: Can see in dim light within 60 feet', 'Resistance to Fire: Resistance to fire damage']
    },
    {
        id: 'brakka',
        campaignId: 'crown-of-embers',
        name: 'Brakka Stonehand',
        playerName: 'Luis',
        race: 'Goliath',
        className: 'Fighter',
        level: 6,
        role: 'Striker',
        status: 'Recovering',
        background: 'Arena veteran turned caravan guard',
        notes: 'Wants revenge on the noble house that fixed his final match.',
        abilityScores: { strength: 18, dexterity: 14, constitution: 16, intelligence: 8, wisdom: 10, charisma: 11 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: true, deception: false, history: false, insight: false, intimidation: true, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 16,
        hitPoints: 42,
        maxHitPoints: 47,
        proficiencyBonus: 3,
        traits: ['Stone\'s Endurance: Reduce damage to self by 1d12+CON (once per rest)', 'Powerful Build: Can push/drag 1.5x their carrying capacity', 'Mountain Born: Acclimated to high altitudes']
    },
    {
        id: 'ivelios',
        campaignId: 'crown-of-embers',
        name: 'Ivelios Quill',
        playerName: 'Priya',
        race: 'Elf',
        className: 'Wizard',
        level: 7,
        role: 'Caster',
        status: 'Ready',
        background: 'Royal archivist exiled for reading forbidden flame texts',
        notes: 'Believes the ember crown is sentient and bargaining through dreams.',
        abilityScores: { strength: 8, dexterity: 13, constitution: 12, intelligence: 17, wisdom: 14, charisma: 11 },
        skills: { acrobatics: false, animalHandling: false, arcana: true, athletics: false, deception: false, history: true, insight: false, intimidation: false, investigation: true, medicine: false, nature: true, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 13,
        hitPoints: 31,
        maxHitPoints: 34,
        proficiencyBonus: 3,
        traits: ['Keen Senses: Proficiency in Perception', 'Fey Ancestry: Advantage against being charmed or put to sleep', 'Trance: Meditate instead of sleeping']
    },
    {
        id: 'kael',
        campaignId: 'moonwake-ledger',
        name: 'Kael Drift',
        playerName: 'Jordan',
        race: 'Half-Elf',
        className: 'Rogue',
        level: 5,
        role: 'Scout',
        status: 'Ready',
        background: 'Smuggler with a talent for ghost routes',
        notes: 'Has seen his own name vanish from three customs ledgers.',
        abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 13, charisma: 12 },
        skills: { acrobatics: true, animalHandling: false, arcana: false, athletics: false, deception: true, history: false, insight: false, intimidation: false, investigation: true, medicine: false, nature: false, perception: true, performance: false, persuasion: false, sleightOfHand: true, stealth: true, survival: false },
        armorClass: 14,
        hitPoints: 28,
        maxHitPoints: 31,
        proficiencyBonus: 3,
        traits: ['Fey Ancestry: Advantage against being charmed or put to sleep', 'Versatile Heritage: Proficiency in two skills of choice', 'Darkvision: Can see in dim light within 60 feet']
    },
    {
        id: 'mira',
        campaignId: 'moonwake-ledger',
        name: 'Mira Fen',
        playerName: 'Asha',
        race: 'Human',
        className: 'Cleric',
        level: 4,
        role: 'Support',
        status: 'Resting',
        background: 'Dockside chaplain of the moonwake shrine',
        notes: 'Her prayers are being answered by a voice from the storm wall.',
        abilityScores: { strength: 12, dexterity: 11, constitution: 13, intelligence: 10, wisdom: 16, charisma: 14 },
        skills: { acrobatics: false, animalHandling: true, arcana: false, athletics: false, deception: false, history: false, insight: true, intimidation: false, investigation: false, medicine: true, nature: false, perception: true, performance: false, persuasion: true, sleightOfHand: false, stealth: false, survival: true },
        armorClass: 13,
        hitPoints: 26,
        maxHitPoints: 28,
        proficiencyBonus: 2,
        traits: ['Versatility: +1 to all ability scores', 'Diverse Heritage: can choose any feat at 1st level']
    },
    {
        id: 'thistle',
        campaignId: 'wild-below',
        name: 'Thistle Reed',
        playerName: 'Cam',
        race: 'Halfling',
        className: 'Bard',
        level: 2,
        role: 'Support',
        status: 'Ready',
        background: 'Traveling fiddler and accidental folk hero',
        notes: 'A fey chorus keeps harmonizing with every lie she tells.',
        abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 12, wisdom: 11, charisma: 16 },
        skills: { acrobatics: false, animalHandling: true, arcana: false, athletics: false, deception: true, history: false, insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: true, persuasion: true, sleightOfHand: false, stealth: false, survival: false },
        armorClass: 12,
        hitPoints: 11,
        maxHitPoints: 12,
        proficiencyBonus: 2,
        traits: ['Naturally Stealthy: Can hide even when only lightly obscured', 'Halfling Nimbleness: Can move through larger creatures\' spaces', 'Lucky: Reroll natural 1s on attack rolls']
    }
];
