import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { raceMap } from '../data/races';
import { AbilityScores, Campaign, CampaignDraft, Character, CharacterDraft, CharacterStatus, SkillProficiencies } from '../models/dungeon.models';
import { ApiCampaignDto, ApiCharacterDto, DungeonApiService } from './dungeon-api.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class DungeonStoreService {

    async deleteCharacter(characterId: string): Promise<void> {
        try {
            await this.api.deleteCharacter(characterId);
            this.characters.update((characters) => characters.filter((c) => c.id !== characterId));
            this.campaigns.update((campaigns) =>
                campaigns.map((campaign) => ({
                    ...campaign,
                    partyCharacterIds: campaign.partyCharacterIds.filter((id) => id !== characterId)
                }))
            );
        } catch {
            // Optionally handle error (e.g., show notice)
        }
    }
    private static readonly UNASSIGNED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000';
    private static readonly BUILDER_STATE_START_TAG = '[DK_BUILDER_STATE_START]';
    private static readonly BUILDER_STATE_END_TAG = '[DK_BUILDER_STATE_END]';

    readonly title = signal('DungeonKeep');
    readonly campaigns = signal<Campaign[]>([]);
    readonly characters = signal<Character[]>([]);
    readonly selectedCampaignId = signal('');

    private readonly api = inject(DungeonApiService);
    private readonly session = inject(SessionService);

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
            const currentUserId = this.session.currentUser()?.id ?? '';

            if (!currentUserId) {
                this.clearState();
                return;
            }

            void this.hydrateFromApi();
        });
    }

    selectCampaign(campaignId: string): void {
        this.selectedCampaignId.set(campaignId);
    }

    addCampaign(draft: CampaignDraft): void {
        void this.createCampaign(draft);
    }

    async createCampaign(draft: CampaignDraft): Promise<Campaign | null> {
        return await this.addCampaignFromApi(draft);
    }

    addCharacter(draft: CharacterDraft): void {
        void this.addCharacterFromApi(draft);
    }

    async createCharacter(draft: CharacterDraft): Promise<Character | null> {
        return await this.addCharacterFromApi(draft);
    }

    async updateCharacter(characterId: string, draft: CharacterDraft): Promise<Character | null> {
        if (!draft.name || !draft.playerName || !draft.className) {
            return null;
        }

        try {
            const updated = await this.api.updateCharacter(characterId, {
                name: draft.name,
                playerName: draft.playerName,
                className: draft.className,
                level: Math.max(1, draft.level),
                background: draft.background || 'Freshly arrived adventurer',
                notes: draft.notes || 'No field notes yet.',
                campaignId: draft.campaignId
            });

            const character = this.mapCharacterFromApi(updated, draft);
            this.characters.update((characters) =>
                characters.map((c) => (c.id === characterId ? character : c))
            );
            return character;
        } catch {
            return null;
        }
    }

    async setCharacterCampaign(characterId: string, campaignId: string | null): Promise<boolean> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || current.canEdit === false) {
            return false;
        }

        try {
            const updated = await this.api.updateCharacterCampaign(characterId, campaignId);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? { ...character, campaignId: updated.campaignId }
                        : character
                )
            );

            this.campaigns.update((campaigns) =>
                campaigns.map((campaign) => {
                    const isCurrentCampaign = campaign.partyCharacterIds.includes(characterId);
                    const shouldContain = campaign.id === updated.campaignId;

                    if (isCurrentCampaign && !shouldContain) {
                        return {
                            ...campaign,
                            partyCharacterIds: campaign.partyCharacterIds.filter((id) => id !== characterId)
                        };
                    }

                    if (!isCurrentCampaign && shouldContain) {
                        return {
                            ...campaign,
                            partyCharacterIds: [...campaign.partyCharacterIds, characterId]
                        };
                    }

                    return campaign;
                })
            );

            return true;
        } catch {
            return false;
        }
    }

    archiveThread(thread: string): void {
        void this.archiveThreadFromApi(thread);
    }

    promoteCharacter(characterId: string): void {
        void this.promoteCharacterFromApi(characterId);
    }

    cycleStatus(characterId: string): void {
        void this.cycleStatusFromApi(characterId);
    }

    inviteMember(email: string): Promise<boolean> {
        return this.inviteMemberFromApi(email);
    }

    async saveCharacterBackstory(characterId: string, backstory: string): Promise<boolean> {
        if (!backstory.trim()) {
            return false;
        }

        const current = this.characters().find((character) => character.id === characterId);
        if (!current || current.canEdit === false) {
            return false;
        }

        try {
            const updated = await this.api.updateCharacterBackstory(characterId, backstory);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? { ...character, notes: this.resolveCharacterNotes(updated, character.notes) }
                        : character
                )
            );
            return true;
        } catch {
            return false;
        }
    }

    private async addCampaignFromApi(draft: CampaignDraft): Promise<Campaign | null> {
        try {
            const created = await this.api.createCampaign({
                name: draft.name,
                setting: draft.setting,
                tone: draft.tone,
                hook: draft.hook,
                nextSession: draft.nextSession,
                summary: draft.summary || 'A newly formed campaign waits for its first legend.'
            });

            const campaign = this.mapCampaignFromApi(created, []);
            this.campaigns.update((campaigns) => [campaign, ...campaigns]);
            this.selectedCampaignId.set(campaign.id);
            return campaign;
        } catch {
            return null;
        }
    }

    private async addCharacterFromApi(draft: CharacterDraft): Promise<Character | null> {
        if (!draft.name || !draft.playerName || !draft.className) {
            return null;
        }

        try {
            const created = await this.api.createCharacter({
                name: draft.name,
                playerName: draft.playerName,
                className: draft.className,
                level: Math.max(1, draft.level),
                background: draft.background || 'Freshly arrived adventurer',
                notes: draft.notes || 'No field notes yet.',
                campaignId: draft.campaignId,
                species: draft.race || '',
                alignment: draft.alignment || '',
                lifestyle: draft.lifestyle || '',
                personalityTraits: Array.isArray(draft.personalityTraits) ? draft.personalityTraits.join(', ') : (draft.personalityTraits || ''),
                ideals: Array.isArray(draft.ideals) ? draft.ideals.join(', ') : (draft.ideals || ''),
                bonds: Array.isArray(draft.bonds) ? draft.bonds.join(', ') : (draft.bonds || ''),
                flaws: Array.isArray(draft.flaws) ? draft.flaws.join(', ') : (draft.flaws || ''),
                equipment: Array.isArray(draft.equipment) ? draft.equipment.join(', ') : (draft.equipment || ''),
                abilityScores: draft.abilityScores ? JSON.stringify(draft.abilityScores) : '',
                skills: draft.skills ? JSON.stringify(draft.skills) : '',
                savingThrows: draft.savingThrows ? JSON.stringify(draft.savingThrows) : '',
                hitPoints: draft.hitPoints ?? 0,
                armorClass: draft.armorClass ?? 0,
                combatStats: draft.combatStats ? JSON.stringify(draft.combatStats) : '',
                spells: Array.isArray(draft.spells) ? draft.spells.join(', ') : (draft.spells || ''),
                experiencePoints: draft.experiencePoints ?? 0,
                portraitUrl: draft.image || '',
                goals: draft.goals || '',
                secrets: draft.secrets || '',
                sessionHistory: draft.sessionHistory || ''
            });

            const character = this.mapCharacterFromApi(created, draft);
            this.characters.update((characters) => [character, ...characters]);

            if (character.campaignId && character.campaignId !== DungeonStoreService.UNASSIGNED_CAMPAIGN_ID) {
                this.campaigns.update((campaigns) =>
                    campaigns.map((campaign) =>
                        campaign.id === character.campaignId
                            ? {
                                ...campaign,
                                partyCharacterIds: [...campaign.partyCharacterIds, character.id]
                            }
                            : campaign
                    )
                );
            }

            return character;
        } catch {
            return null;
        }
    }

    private async hydrateFromApi(): Promise<void> {
        try {
            const campaignDtos = await this.api.getCampaigns();

            const characterPairs = await Promise.all(
                campaignDtos.map(async (campaign) => {
                    const characters = await this.api.getCharacters(campaign.id);
                    return [campaign.id, characters] as const;
                })
            );

            const unassignedDtos = await this.api.getUnassignedCharacters();
            const characterLookup = new Map<string, ApiCharacterDto[]>(characterPairs);
            const allCharacters: Character[] = [];

            const mappedCampaigns = campaignDtos.map((campaignDto) => {
                const apiCharacters = characterLookup.get(campaignDto.id) ?? [];
                const mappedCharacters = apiCharacters.map((characterDto) => this.mapCharacterFromApi(characterDto));
                allCharacters.push(...mappedCharacters);

                return this.mapCampaignFromApi(campaignDto, mappedCharacters.map((character) => character.id));
            });

            const knownCharacterIds = new Set(allCharacters.map((character) => character.id));
            for (const unassignedDto of unassignedDtos) {
                if (!knownCharacterIds.has(unassignedDto.id)) {
                    allCharacters.push(this.mapCharacterFromApi(unassignedDto));
                }
            }

            this.characters.set(allCharacters);
            this.campaigns.set(mappedCampaigns);

            const selected = this.selectedCampaignId();
            if (!mappedCampaigns.some((campaign) => campaign.id === selected)) {
                this.selectedCampaignId.set(mappedCampaigns[0]?.id ?? '');
            }
        } catch {
            this.clearState();
        }
    }

    private mapCampaignFromApi(campaign: ApiCampaignDto, partyCharacterIds: string[]): Campaign {
        return {
            id: campaign.id,
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone ?? 'Heroic',
            levelRange: 'Levels 1-4',
            summary: campaign.summary,
            hook: campaign.hook || 'A new adventure awaits.',
            nextSession: campaign.nextSession || 'TBD',
            partyCharacterIds,
            sessions: [],
            openThreads: campaign.openThreads ?? [],
            loot: ['Starter rumor map'],
            npcs: ['Unrevealed patron'],
            currentUserRole: campaign.currentUserRole,
            members: campaign.members.map((member) => ({
                userId: member.userId,
                email: member.email,
                displayName: member.displayName,
                role: member.role,
                status: member.status
            }))
        };
    }

    private mapCharacterFromApi(character: ApiCharacterDto, draft?: CharacterDraft): Character {
        let abilityScores = this.getDefaultAbilitiesByClass(character.className);
        const raceFromDraft = draft?.race?.trim();
        const race = raceMap.get((raceFromDraft || 'human').toLowerCase());

        if (race) {
            abilityScores = {
                strength: abilityScores.strength + (race.abilityBonuses.strength || 0),
                dexterity: abilityScores.dexterity + (race.abilityBonuses.dexterity || 0),
                constitution: abilityScores.constitution + (race.abilityBonuses.constitution || 0),
                intelligence: abilityScores.intelligence + (race.abilityBonuses.intelligence || 0),
                wisdom: abilityScores.wisdom + (race.abilityBonuses.wisdom || 0),
                charisma: abilityScores.charisma + (race.abilityBonuses.charisma || 0)
            };
        }

        const proficiencyBonus = Math.ceil(Math.max(character.level, 1) / 4) + 1;
        const armorClass = this.calculateAC(character.className, abilityScores.dexterity);
        const fallbackHitPoints = this.calculateHitPoints(character.className, Math.max(character.level, 1), abilityScores.constitution);
        const draftMaxHitPoints = draft?.maxHitPoints ?? draft?.hitPoints;
        const maxHitPoints = Number.isFinite(draftMaxHitPoints)
            ? Math.max(1, Math.trunc(draftMaxHitPoints as number))
            : fallbackHitPoints;
        const draftCurrentHitPoints = draft?.hitPoints;
        const hitPoints = Number.isFinite(draftCurrentHitPoints)
            ? Math.max(0, Math.min(maxHitPoints, Math.trunc(draftCurrentHitPoints as number)))
            : maxHitPoints;

        // Map all available fields from ApiCharacterDto and draft
        return {
            id: character.id,
            campaignId: character.campaignId,
            ownerUserId: character.ownerUserId,
            ownerDisplayName: character.ownerDisplayName || character.playerName,
            canEdit: character.canEdit,
            name: character.name,
            playerName: character.playerName,
            race: (race?.name ?? raceFromDraft) || 'Human',
            className: character.className,
            level: Math.max(character.level, 1),
            role: draft?.role ?? 'Striker',
            status: character.status,
            background: character.background,
            notes: this.resolveCharacterNotes(character, draft?.notes),
            abilityScores,
            skills: draft?.skills ?? this.getDefaultSkillsByClass(character.className),
            armorClass,
            hitPoints,
            maxHitPoints,
            proficiencyBonus,
            traits: race?.traits ?? [],
            gender: (draft?.gender ?? (character as any).gender) || '',
            alignment: (draft?.alignment ?? (character as any).alignment) || '',
            faith: (draft?.faith ?? (character as any).faith) || '',
            lifestyle: (draft?.lifestyle ?? (character as any).lifestyle) || '',
            classFeatures: (draft?.classFeatures ?? (character as any).classFeatures) || [],
            speciesTraits: (draft?.speciesTraits ?? (character as any).speciesTraits) || [],
            languages: (draft?.languages ?? (character as any).languages) || [],
            equipment: (draft?.equipment ?? (character as any).equipment) || [],
            spells: (draft?.spells ?? (character as any).spells) || [],
            image: (draft?.image ?? (character as any).image) || (character as any).portraitUrl || ''
        };
    }

    private resolveCharacterNotes(character: ApiCharacterDto, previousNotes?: string): string {
        const notes = character.notes?.trim() ?? '';
        const backstory = character.backstory?.trim() ?? '';

        if (this.hasBuilderStateBlock(notes)) {
            return notes;
        }

        if (this.hasBuilderStateBlock(backstory)) {
            return backstory;
        }

        if (notes) {
            return notes;
        }

        if (backstory) {
            if (previousNotes && this.hasBuilderStateBlock(previousNotes)) {
                return this.mergeVisibleNotesWithBuilderState(previousNotes, backstory);
            }

            return backstory;
        }

        return previousNotes?.trim() || 'No field notes yet.';
    }

    private hasBuilderStateBlock(text: string): boolean {
        return text.includes(DungeonStoreService.BUILDER_STATE_START_TAG)
            && text.includes(DungeonStoreService.BUILDER_STATE_END_TAG);
    }

    private mergeVisibleNotesWithBuilderState(previousNotes: string, visibleNotes: string): string {
        const start = previousNotes.indexOf(DungeonStoreService.BUILDER_STATE_START_TAG);
        const end = previousNotes.indexOf(DungeonStoreService.BUILDER_STATE_END_TAG);

        if (start === -1 || end === -1 || end < start) {
            return visibleNotes;
        }

        const metadataTail = previousNotes.slice(start).trim();
        const cleanedVisibleNotes = visibleNotes.trim();

        if (!cleanedVisibleNotes) {
            return metadataTail;
        }

        return `${cleanedVisibleNotes}\n\n${metadataTail}`;
    }

    private getDefaultAbilitiesByClass(className: string): AbilityScores {
        const classDefaults: Record<string, AbilityScores> = {
            Barbarian: { strength: 15, dexterity: 13, constitution: 16, intelligence: 8, wisdom: 11, charisma: 10 },
            Bard: { strength: 8, dexterity: 14, constitution: 11, intelligence: 12, wisdom: 13, charisma: 15 },
            Cleric: { strength: 13, dexterity: 10, constitution: 14, intelligence: 12, wisdom: 15, charisma: 13 },
            Druid: { strength: 10, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 15, charisma: 11 },
            Fighter: { strength: 15, dexterity: 14, constitution: 16, intelligence: 10, wisdom: 11, charisma: 10 },
            Monk: { strength: 13, dexterity: 15, constitution: 12, intelligence: 11, wisdom: 14, charisma: 10 },
            Paladin: { strength: 15, dexterity: 10, constitution: 14, intelligence: 12, wisdom: 13, charisma: 15 },
            Ranger: { strength: 13, dexterity: 15, constitution: 13, intelligence: 12, wisdom: 14, charisma: 11 },
            Rogue: { strength: 10, dexterity: 16, constitution: 12, intelligence: 14, wisdom: 11, charisma: 10 },
            Sorcerer: { strength: 8, dexterity: 13, constitution: 14, intelligence: 12, wisdom: 12, charisma: 16 },
            Warlock: { strength: 8, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 12, charisma: 16 },
            Wizard: { strength: 8, dexterity: 12, constitution: 13, intelligence: 16, wisdom: 14, charisma: 11 }
        };

        return classDefaults[className] || classDefaults['Fighter'];
    }

    private getDefaultSkillsByClass(className: string): SkillProficiencies {
        const emptySkills: SkillProficiencies = {
            acrobatics: false,
            animalHandling: false,
            arcana: false,
            athletics: false,
            deception: false,
            history: false,
            insight: false,
            intimidation: false,
            investigation: false,
            medicine: false,
            nature: false,
            perception: false,
            performance: false,
            persuasion: false,
            sleightOfHand: false,
            stealth: false,
            survival: false
        };

        const classDefaults: Record<string, SkillProficiencies> = {
            Barbarian: { ...emptySkills, athletics: true, perception: true, survival: true },
            Bard: { ...emptySkills, deception: true, performance: true, persuasion: true, insight: true },
            Cleric: { ...emptySkills, insight: true, medicine: true, persuasion: true },
            Druid: { ...emptySkills, insight: true, medicine: true, nature: true, perception: true, survival: true },
            Fighter: { ...emptySkills, acrobatics: true, athletics: true, perception: true },
            Monk: { ...emptySkills, acrobatics: true, athletics: true, stealth: true },
            Paladin: { ...emptySkills, athletics: true, insight: true, intimidation: true, persuasion: true },
            Ranger: { ...emptySkills, nature: true, perception: true, stealth: true, survival: true },
            Rogue: { ...emptySkills, acrobatics: true, deception: true, investigation: true, perception: true, sleightOfHand: true, stealth: true },
            Sorcerer: { ...emptySkills, arcana: true, deception: true, insight: true, persuasion: true },
            Warlock: { ...emptySkills, arcana: true, deception: true, insight: true, intimidation: true },
            Wizard: { ...emptySkills, arcana: true, history: true, insight: true, investigation: true }
        };

        return classDefaults[className] || emptySkills;
    }

    private calculateHitPoints(className: string, level: number, constitution: number): number {
        const conMod = Math.floor((constitution - 10) / 2);
        const hitDice: Record<string, number> = {
            Barbarian: 12,
            Bard: 8,
            Cleric: 8,
            Druid: 8,
            Fighter: 10,
            Monk: 8,
            Paladin: 10,
            Ranger: 10,
            Rogue: 8,
            Sorcerer: 6,
            Warlock: 6,
            Wizard: 6
        };
        const max = hitDice[className] || 10;
        const average = Math.ceil(max / 2) + 1;
        return max + (level - 1) * (average + conMod);
    }

    private calculateAC(className: string, dexterity: number): number {
        const dexMod = Math.floor((dexterity - 10) / 2);
        const baseAC: Record<string, number> = {
            Barbarian: 10 + dexMod,
            Bard: 10 + dexMod,
            Cleric: 10 + dexMod,
            Druid: 10 + dexMod,
            Fighter: 10 + dexMod,
            Monk: 10 + dexMod,
            Paladin: 10,
            Ranger: 10 + dexMod,
            Rogue: 10 + dexMod,
            Sorcerer: 10 + dexMod,
            Warlock: 10 + dexMod,
            Wizard: 10 + dexMod
        };
        return baseAC[className] || (10 + dexMod);
    }

    private async archiveThreadFromApi(thread: string): Promise<void> {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign || selectedCampaign.currentUserRole !== 'Owner') {
            return;
        }

        try {
            const updated = await this.api.archiveCampaignThread(selectedCampaign.id, thread);
            this.campaigns.update((campaigns) =>
                campaigns.map((campaign) =>
                    campaign.id === selectedCampaign.id
                        ? this.mapCampaignFromApi(updated, campaign.partyCharacterIds)
                        : campaign
                )
            );
        } catch {
            return;
        }
    }

    private async promoteCharacterFromApi(characterId: string): Promise<void> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || current.canEdit === false) {
            return;
        }

        try {
            const updated = await this.api.promoteCharacter(characterId);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? { ...character, level: updated.level, status: updated.status }
                        : character
                )
            );
        } catch {
            return;
        }
    }

    private async cycleStatusFromApi(characterId: string): Promise<void> {
        const statusOrder: CharacterStatus[] = ['Ready', 'Resting', 'Recovering'];
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || current.canEdit === false) {
            return;
        }

        const currentIndex = statusOrder.indexOf(current.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

        try {
            const updated = await this.api.updateCharacterStatus(characterId, nextStatus);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? { ...character, status: updated.status }
                        : character
                )
            );
        } catch {
            return;
        }
    }

    private async inviteMemberFromApi(email: string): Promise<boolean> {
        const selectedCampaign = this.selectedCampaign();
        if (!selectedCampaign || selectedCampaign.currentUserRole !== 'Owner') {
            return false;
        }

        try {
            const updated = await this.api.inviteCampaignMember(selectedCampaign.id, email);
            this.campaigns.update((campaigns) =>
                campaigns.map((campaign) =>
                    campaign.id === selectedCampaign.id
                        ? this.mapCampaignFromApi(updated, campaign.partyCharacterIds)
                        : campaign
                )
            );
            return true;
        } catch {
            return false;
        }
    }

    private clearState(): void {
        this.campaigns.set([]);
        this.characters.set([]);
        this.selectedCampaignId.set('');
    }
}
