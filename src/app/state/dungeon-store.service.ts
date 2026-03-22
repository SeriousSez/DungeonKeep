import { Injectable, computed, effect, signal } from '@angular/core';

import { loadState, saveState } from '../data/local-storage';
import { seedCampaigns, seedCharacters } from '../data/seed-data';
import { raceMap } from '../data/races';
import { Campaign, CampaignDraft, Character, CharacterDraft, CharacterStatus } from '../models/dungeon.models';

const initialState = loadState(seedCampaigns, seedCharacters);

@Injectable({ providedIn: 'root' })
export class DungeonStoreService {
    readonly title = signal('DungeonKeep');
    readonly campaigns = signal<Campaign[]>(initialState.campaigns);
    readonly characters = signal<Character[]>(initialState.characters);
    readonly selectedCampaignId = signal(initialState.selectedCampaignId);

    readonly selectedCampaign = computed(
        () => this.campaigns().find((campaign) => campaign.id === this.selectedCampaignId()) ?? null
    );

    readonly selectedParty = computed(() => {
        const campaign = this.selectedCampaign();

        if (!campaign) {
            return [] as Character[];
        }

        const characterMap = new Map(this.characters().map((character) => [character.id, character]));

        return campaign.partyCharacterIds
            .map((id) => characterMap.get(id))
            .filter((character): character is Character => Boolean(character));
    });

    readonly campaignCount = computed(() => this.campaigns().length);
    readonly characterCount = computed(() => this.characters().length);
    readonly sessionCount = computed(() =>
        this.campaigns().reduce((total, campaign) => total + campaign.sessions.length, 0)
    );
    readonly openThreadCount = computed(() =>
        this.campaigns().reduce((total, campaign) => total + campaign.openThreads.length, 0)
    );
    readonly readyCharacterCount = computed(
        () => this.characters().filter((character) => character.status === 'Ready').length
    );

    constructor() {
        effect(() => {
            const campaigns = this.campaigns();
            const selectedCampaignId = this.selectedCampaignId();

            if (!campaigns.some((campaign) => campaign.id === selectedCampaignId)) {
                this.selectedCampaignId.set(campaigns[0]?.id ?? '');
            }
        });

        effect(() => {
            saveState({
                campaigns: this.campaigns(),
                characters: this.characters(),
                selectedCampaignId: this.selectedCampaignId()
            });
        });
    }

    selectCampaign(campaignId: string): void {
        this.selectedCampaignId.set(campaignId);
    }

    addCampaign(draft: CampaignDraft): void {
        const campaign: Campaign = {
            id: this.createId(draft.name),
            name: draft.name,
            setting: draft.setting,
            tone: draft.tone,
            levelRange: 'Levels 1-4',
            summary: draft.summary || 'A newly formed campaign waits for its first legend.',
            hook: draft.hook,
            nextSession: draft.nextSession || 'TBD',
            partyCharacterIds: [],
            sessions: [],
            openThreads: ['Define the inciting incident for the first session.'],
            loot: ['Starter rumor map'],
            npcs: ['Unrevealed patron']
        };

        this.campaigns.update((campaigns) => [campaign, ...campaigns]);
        this.selectedCampaignId.set(campaign.id);
    }

    addCharacter(draft: CharacterDraft): void {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign || !draft.name || !draft.playerName || !draft.className) {
            return;
        }

        // Default ability scores based on class
        let abilityScores = draft.abilityScores || this.getDefaultAbilitiesByClass(draft.className);
        const proficiencyBonus = Math.ceil(draft.level / 4) + 1;

        // Apply racial ability bonuses
        const race = raceMap.get((draft.race || 'human').toLowerCase());
        let racialTraits: string[] = [];
        if (race) {
            abilityScores = {
                strength: abilityScores.strength + (race.abilityBonuses.strength || 0),
                dexterity: abilityScores.dexterity + (race.abilityBonuses.dexterity || 0),
                constitution: abilityScores.constitution + (race.abilityBonuses.constitution || 0),
                intelligence: abilityScores.intelligence + (race.abilityBonuses.intelligence || 0),
                wisdom: abilityScores.wisdom + (race.abilityBonuses.wisdom || 0),
                charisma: abilityScores.charisma + (race.abilityBonuses.charisma || 0)
            };
            racialTraits = race.traits;
        }

        // Calculate hit points based on class
        const hitPoints = this.calculateHitPoints(draft.className, draft.level, abilityScores.constitution);
        const maxHitPoints = hitPoints;

        // Calculate AC based on class
        const armorClass = this.calculateAC(draft.className, abilityScores.dexterity);

        const character: Character = {
            id: this.createId(draft.name),
            campaignId: selectedCampaign.id,
            name: draft.name,
            playerName: draft.playerName,
            race: draft.race || 'Human',
            className: draft.className,
            level: Math.max(1, draft.level),
            role: draft.role,
            status: 'Ready',
            background: draft.background || 'Freshly arrived adventurer',
            notes: draft.notes || 'No field notes yet.',
            abilityScores: abilityScores,
            skills: draft.skills || this.getDefaultSkillsByClass(draft.className),
            armorClass: draft.armorClass || armorClass,
            hitPoints: draft.hitPoints || hitPoints,
            maxHitPoints: draft.maxHitPoints || maxHitPoints,
            proficiencyBonus: proficiencyBonus,
            traits: racialTraits
        };

        this.characters.update((characters) => [character, ...characters]);
        this.campaigns.update((campaigns) =>
            campaigns.map((campaign) =>
                campaign.id === selectedCampaign.id
                    ? {
                        ...campaign,
                        partyCharacterIds: [...campaign.partyCharacterIds, character.id]
                    }
                    : campaign
            )
        );
    }

    private getDefaultAbilitiesByClass(className: string) {
        const classDefaults: Record<string, any> = {
            'Barbarian': { strength: 15, dexterity: 13, constitution: 16, intelligence: 8, wisdom: 11, charisma: 10 },
            'Bard': { strength: 8, dexterity: 14, constitution: 11, intelligence: 12, wisdom: 13, charisma: 15 },
            'Cleric': { strength: 13, dexterity: 10, constitution: 14, intelligence: 12, wisdom: 15, charisma: 13 },
            'Druid': { strength: 10, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 15, charisma: 11 },
            'Fighter': { strength: 15, dexterity: 14, constitution: 16, intelligence: 10, wisdom: 11, charisma: 10 },
            'Monk': { strength: 13, dexterity: 15, constitution: 12, intelligence: 11, wisdom: 14, charisma: 10 },
            'Paladin': { strength: 15, dexterity: 10, constitution: 14, intelligence: 12, wisdom: 13, charisma: 15 },
            'Ranger': { strength: 13, dexterity: 15, constitution: 13, intelligence: 12, wisdom: 14, charisma: 11 },
            'Rogue': { strength: 10, dexterity: 16, constitution: 12, intelligence: 14, wisdom: 11, charisma: 10 },
            'Sorcerer': { strength: 8, dexterity: 13, constitution: 14, intelligence: 12, wisdom: 12, charisma: 16 },
            'Warlock': { strength: 8, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 12, charisma: 16 },
            'Wizard': { strength: 8, dexterity: 12, constitution: 13, intelligence: 16, wisdom: 14, charisma: 11 }
        };
        return classDefaults[className] || classDefaults['Fighter'];
    }

    private getDefaultSkillsByClass(className: string) {
        const emptySkills = { acrobatics: false, animalHandling: false, arcana: false, athletics: false, deception: false, history: false, insight: false, intimidation: false, investigation: false, medicine: false, nature: false, perception: false, performance: false, persuasion: false, sleightOfHand: false, stealth: false, survival: false };

        const classDefaults: Record<string, any> = {
            'Barbarian': { ...emptySkills, athletics: true, perception: true, survival: true },
            'Bard': { ...emptySkills, deception: true, performance: true, persuasion: true, insight: true },
            'Cleric': { ...emptySkills, insight: true, medicine: true, persuasion: true, religion: true },
            'Druid': { ...emptySkills, insight: true, medicine: true, nature: true, perception: true, survival: true },
            'Fighter': { ...emptySkills, acrobatics: true, athletics: true, perception: true },
            'Monk': { ...emptySkills, acrobatics: true, athletics: true, stealth: true },
            'Paladin': { ...emptySkills, athletics: true, insight: true, intimidation: true, persuasion: true },
            'Ranger': { ...emptySkills, nature: true, perception: true, stealth: true, survival: true },
            'Rogue': { ...emptySkills, acrobatics: true, deception: true, investigation: true, perception: true, sleightOfHand: true, stealth: true },
            'Sorcerer': { ...emptySkills, arcana: true, deception: true, insight: true, persuasion: true },
            'Warlock': { ...emptySkills, arcana: true, deception: true, insight: true, intimidation: true },
            'Wizard': { ...emptySkills, arcana: true, history: true, insight: true, investigation: true }
        };
        return classDefaults[className] || emptySkills;
    }

    private calculateHitPoints(className: string, level: number, constitution: number): number {
        const conMod = Math.floor((constitution - 10) / 2);
        const hitDice: Record<string, number> = {
            'Barbarian': 12,
            'Bard': 8,
            'Cleric': 8,
            'Druid': 8,
            'Fighter': 10,
            'Monk': 8,
            'Paladin': 10,
            'Ranger': 10,
            'Rogue': 8,
            'Sorcerer': 6,
            'Warlock': 6,
            'Wizard': 6
        };
        const max = hitDice[className] || 10;
        const average = Math.ceil(max / 2) + 1;
        return max + (level - 1) * (average + conMod);
    }

    private calculateAC(className: string, dexterity: number): number {
        const dexMod = Math.floor((dexterity - 10) / 2);
        const baseAC: Record<string, number> = {
            'Barbarian': 10 + dexMod,
            'Bard': 10 + dexMod,
            'Cleric': 10 + dexMod,
            'Druid': 10 + dexMod,
            'Fighter': 10 + dexMod,
            'Monk': 10 + dexMod,
            'Paladin': 10,
            'Ranger': 10 + dexMod,
            'Rogue': 10 + dexMod,
            'Sorcerer': 10 + dexMod,
            'Warlock': 10 + dexMod,
            'Wizard': 10 + dexMod
        };
        return baseAC[className] || (10 + dexMod);
    }

    archiveThread(thread: string): void {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign) {
            return;
        }

        this.campaigns.update((campaigns) =>
            campaigns.map((campaign) =>
                campaign.id === selectedCampaign.id
                    ? {
                        ...campaign,
                        openThreads: campaign.openThreads.filter((item) => item !== thread)
                    }
                    : campaign
            )
        );
    }

    promoteCharacter(characterId: string): void {
        this.characters.update((characters) =>
            characters.map((character) =>
                character.id === characterId
                    ? { ...character, level: Math.min(character.level + 1, 20), status: 'Ready' }
                    : character
            )
        );
    }

    cycleStatus(characterId: string): void {
        const statusOrder: CharacterStatus[] = ['Ready', 'Resting', 'Recovering'];

        this.characters.update((characters) =>
            characters.map((character) => {
                if (character.id !== characterId) {
                    return character;
                }

                const currentIndex = statusOrder.indexOf(character.status);
                const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

                return { ...character, status: nextStatus };
            })
        );
    }

    private createId(value: string): string {
        return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    }
}
