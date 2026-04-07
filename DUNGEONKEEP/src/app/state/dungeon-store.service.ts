import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { raceMap } from '../data/races';
import { AbilityScores, Campaign, CampaignDraft, CampaignMap, CampaignMapBackground, CampaignMapBoard, CampaignMapDecorationType, CampaignMapIconType, CampaignMapLabelTone, CampaignThreadVisibility, CampaignWorldNoteCategory, Character, CharacterDraft, CharacterStatus, SkillProficiencies, ThreatLevel } from '../models/dungeon.models';
import { ApiCampaignDto, ApiCampaignMapBoardDto, ApiCampaignMapDecorationDto, ApiCampaignMapDto, ApiCampaignMapLabelDto, ApiCampaignMapLibraryDto, ApiCampaignWorldNoteDto, ApiCharacterDto, DungeonApiService } from './dungeon-api.service';
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
    readonly initialized = signal(false);
    readonly isHydrating = signal(false);

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
                this.isHydrating.set(false);
                this.initialized.set(true);
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

        const campaignIds = draft.campaignIds ?? (draft.campaignId ? [draft.campaignId] : undefined);

        try {
            const updated = await this.api.updateCharacter(characterId, {
                name: draft.name,
                playerName: draft.playerName,
                className: draft.className,
                level: Math.max(1, draft.level),
                background: draft.background || 'Freshly arrived adventurer',
                notes: draft.notes || 'No field notes yet.',
                campaignId: campaignIds?.[0],
                campaignIds,
                species: draft.race,
                alignment: draft.alignment,
                lifestyle: draft.lifestyle,
                personalityTraits: Array.isArray(draft.personalityTraits) ? draft.personalityTraits.join(', ') : undefined,
                ideals: Array.isArray(draft.ideals) ? draft.ideals.join(', ') : undefined,
                bonds: Array.isArray(draft.bonds) ? draft.bonds.join(', ') : undefined,
                flaws: Array.isArray(draft.flaws) ? draft.flaws.join(', ') : undefined,
                equipment: Array.isArray(draft.equipment) ? draft.equipment.join(', ') : undefined,
                abilityScores: draft.abilityScores ? JSON.stringify(draft.abilityScores) : undefined,
                skills: draft.skills ? JSON.stringify(draft.skills) : undefined,
                savingThrows: draft.savingThrows ? JSON.stringify(draft.savingThrows) : undefined,
                hitPoints: typeof draft.hitPoints === 'number' ? Math.max(0, Math.trunc(draft.hitPoints)) : undefined,
                deathSaveFailures: typeof draft.deathSaveFailures === 'number' ? Math.max(0, Math.min(3, Math.trunc(draft.deathSaveFailures))) : undefined,
                deathSaveSuccesses: typeof draft.deathSaveSuccesses === 'number' ? Math.max(0, Math.min(3, Math.trunc(draft.deathSaveSuccesses))) : undefined,
                armorClass: typeof draft.armorClass === 'number' ? Math.max(0, Math.trunc(draft.armorClass)) : undefined,
                combatStats: draft.combatStats ? JSON.stringify(draft.combatStats) : undefined,
                spells: Array.isArray(draft.spells) ? draft.spells.join(', ') : undefined,
                experiencePoints: typeof draft.experiencePoints === 'number' ? Math.max(0, Math.trunc(draft.experiencePoints)) : undefined,
                portraitUrl: draft.image,
                goals: draft.goals,
                secrets: draft.secrets,
                sessionHistory: draft.sessionHistory
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

    async deleteCampaign(campaignId: string): Promise<void> {
        try {
            await this.api.deleteCampaign(campaignId);
            this.campaigns.update((campaigns) => campaigns.filter((c) => c.id !== campaignId));

            // If the deleted campaign was selected, select the first remaining campaign
            if (this.selectedCampaignId() === campaignId) {
                const remaining = this.campaigns();
                this.selectedCampaignId.set(remaining[0]?.id ?? '');
            }
        } catch {
            // Optionally handle error (e.g., show notice)
        }
    }

    async leaveCampaign(campaignId: string): Promise<boolean> {
        try {
            await this.api.leaveCampaign(campaignId);
            await this.hydrateFromApi();
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignSession(campaignId: string, draft: { title: string; date: string; location: string; objective: string; threat: ThreatLevel }): Promise<boolean> {
        try {
            const updated = await this.api.createCampaignSession(campaignId, draft);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignSession(campaignId: string, sessionId: string, draft: { title: string; date: string; location: string; objective: string; threat: ThreatLevel }): Promise<boolean> {
        try {
            const updated = await this.api.updateCampaignSession(campaignId, sessionId, draft);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async deleteCampaignSession(campaignId: string, sessionId: string): Promise<boolean> {
        try {
            const updated = await this.api.deleteCampaignSession(campaignId, sessionId);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignNpc(campaignId: string, name: string): Promise<boolean> {
        try {
            const updated = await this.api.addCampaignNpc(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCampaignNpc(campaignId: string, name: string): Promise<boolean> {
        try {
            const updated = await this.api.removeCampaignNpc(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignLoot(campaignId: string, name: string): Promise<boolean> {
        try {
            const updated = await this.api.addCampaignLoot(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCampaignLoot(campaignId: string, name: string): Promise<boolean> {
        try {
            const updated = await this.api.removeCampaignLoot(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async inviteCampaignMember(campaignId: string, email: string): Promise<boolean> {
        try {
            const updated = await this.api.inviteCampaignMember(campaignId, email);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignWorldNote(campaignId: string, payload: { title: string; category: CampaignWorldNoteCategory; content: string }): Promise<boolean> {
        try {
            const updated = await this.api.createCampaignWorldNote(campaignId, payload);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignWorldNote(campaignId: string, noteId: string, payload: { title: string; category: CampaignWorldNoteCategory; content: string }): Promise<boolean> {
        try {
            const updated = await this.api.updateCampaignWorldNote(campaignId, noteId, payload);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCampaignWorldNote(campaignId: string, noteId: string): Promise<boolean> {
        try {
            const updated = await this.api.deleteCampaignWorldNote(campaignId, noteId);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignMap(campaignId: string, payload: { activeMapId: string; maps: CampaignMapBoard[] }): Promise<boolean> {
        try {
            const updated = await this.api.updateCampaignMap(campaignId, this.mapCampaignMapLibraryToApi(payload));
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async generateCampaignMapArtAi(campaignId: string, payload: { background: CampaignMapBackground; mapName: string; settlementScale?: 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis'; parchmentLayout?: 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular'; cavernLayout?: 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes'; settlementNames?: string[]; regionNames?: string[]; ruinNames?: string[]; cavernNames?: string[]; additionalDirection?: string }): Promise<string | null> {
        try {
            const generated = await this.api.generateCampaignMapArtAi(campaignId, {
                background: this.normalizeMapBackground(payload.background),
                mapName: payload.mapName.trim(),
                settlementScale: payload.settlementScale,
                parchmentLayout: payload.parchmentLayout,
                cavernLayout: payload.cavernLayout,
                settlementNames: payload.settlementNames,
                regionNames: payload.regionNames,
                ruinNames: payload.ruinNames,
                cavernNames: payload.cavernNames,
                additionalDirection: payload.additionalDirection?.trim() || undefined
            });

            return this.normalizeMapBackgroundImageUrl(generated.backgroundImageUrl);
        } catch {
            return null;
        }
    }

    async updateCampaign(campaignId: string, draft: CampaignDraft): Promise<Campaign | null> {
        const campaignData = {
            name: draft.name.trim(),
            setting: draft.setting.trim(),
            tone: (draft.tone ?? 'Heroic') as CampaignDraft['tone'],
            levelStart: Math.max(1, Math.min(20, Math.floor(draft.levelStart))),
            levelEnd: Math.max(
                Math.floor(draft.levelStart),
                Math.min(20, Math.floor(draft.levelEnd))
            ),
            hook: draft.hook.trim(),
            nextSession: draft.nextSession.trim(),
            summary: draft.summary.trim()
        };

        try {
            const updated = await this.api.updateCampaign(campaignId, campaignData);
            const campaign = this.mapCampaignFromApi(updated, updated.members.map(m => m.userId).filter(Boolean) as string[]);

            this.campaigns.update((campaigns) =>
                campaigns.map((c) => (c.id === campaignId ? campaign : c))
            );

            return campaign;
        } catch {
            return null;
        }
    }

    patchCampaignSummary(campaignId: string, summary: string): void {
        this.campaigns.update((campaigns) =>
            campaigns.map((c) => (c.id === campaignId ? { ...c, summary } : c))
        );
    }

    async setCharacterCampaign(characterId: string, campaignId: string | null): Promise<boolean> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || current.canEdit === false) {
            return false;
        }

        try {
            const updated = await this.api.updateCharacterCampaign(characterId, campaignId ? [campaignId] : []);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? {
                            ...character,
                            campaignId: updated.campaignId,
                            campaignIds: updated.campaignIds
                        }
                        : character
                )
            );

            this.campaigns.update((campaigns) =>
                campaigns.map((campaign) => {
                    const isCurrentCampaign = campaign.partyCharacterIds.includes(characterId);
                    const shouldContain = updated.campaignIds.includes(campaign.id);

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

    addThread(text: string, visibility: CampaignThreadVisibility): void {
        void this.addThreadFromApi(text, visibility);
    }

    updateThread(threadId: string, text: string, visibility: CampaignThreadVisibility): void {
        void this.updateThreadFromApi(threadId, text, visibility);
    }

    archiveThread(threadId: string): void {
        void this.archiveThreadFromApi(threadId);
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
        const created = await this.api.createCampaign({
            name: draft.name,
            setting: draft.setting,
            tone: draft.tone,
            levelStart: Math.min(Math.max(Math.trunc(draft.levelStart), 1), 20),
            levelEnd: Math.min(Math.max(Math.trunc(draft.levelEnd), Math.min(Math.max(Math.trunc(draft.levelStart), 1), 20)), 20),
            hook: draft.hook,
            nextSession: draft.nextSession,
            summary: draft.summary || 'A newly formed campaign waits for its first legend.'
        });

        const campaign = this.mapCampaignFromApi(created, []);
        this.campaigns.update((campaigns) => [campaign, ...campaigns]);
        this.selectedCampaignId.set(campaign.id);
        return campaign;
    }

    private async addCharacterFromApi(draft: CharacterDraft): Promise<Character | null> {
        if (!draft.name || !draft.playerName || !draft.className) {
            return null;
        }

        const campaignIds = draft.campaignIds ?? (draft.campaignId ? [draft.campaignId] : undefined);

        try {
            const created = await this.api.createCharacter({
                name: draft.name,
                playerName: draft.playerName,
                className: draft.className,
                level: Math.max(1, draft.level),
                background: draft.background || 'Freshly arrived adventurer',
                notes: draft.notes || 'No field notes yet.',
                campaignId: campaignIds?.[0],
                campaignIds,
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
                deathSaveFailures: typeof draft.deathSaveFailures === 'number' ? Math.max(0, Math.min(3, Math.trunc(draft.deathSaveFailures))) : 0,
                deathSaveSuccesses: typeof draft.deathSaveSuccesses === 'number' ? Math.max(0, Math.min(3, Math.trunc(draft.deathSaveSuccesses))) : 0,
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

            if ((character.campaignIds?.length ?? 0) > 0) {
                this.campaigns.update((campaigns) =>
                    campaigns.map((campaign) =>
                        character.campaignIds?.includes(campaign.id)
                            ? {
                                ...campaign,
                                partyCharacterIds: campaign.partyCharacterIds.includes(character.id)
                                    ? campaign.partyCharacterIds
                                    : [...campaign.partyCharacterIds, character.id]
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
        this.isHydrating.set(true);
        this.initialized.set(false);

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
            const characterMap = new Map<string, Character>();

            const mappedCampaigns = campaignDtos.map((campaignDto) => {
                const apiCharacters = characterLookup.get(campaignDto.id) ?? [];
                const mappedCharacters = apiCharacters.map((characterDto) => this.mapCharacterFromApi(characterDto));

                for (const mappedCharacter of mappedCharacters) {
                    const existing = characterMap.get(mappedCharacter.id);
                    if (!existing) {
                        characterMap.set(mappedCharacter.id, mappedCharacter);
                        continue;
                    }

                    const mergedCampaignIds = Array.from(new Set([...(existing.campaignIds ?? []), ...(mappedCharacter.campaignIds ?? [])]));
                    characterMap.set(mappedCharacter.id, {
                        ...existing,
                        ...mappedCharacter,
                        campaignId: mergedCampaignIds[0] ?? DungeonStoreService.UNASSIGNED_CAMPAIGN_ID,
                        campaignIds: mergedCampaignIds
                    });
                }

                return this.mapCampaignFromApi(campaignDto, mappedCharacters.map((character) => character.id));
            });

            for (const unassignedDto of unassignedDtos) {
                if (!characterMap.has(unassignedDto.id)) {
                    characterMap.set(unassignedDto.id, this.mapCharacterFromApi(unassignedDto));
                }
            }

            this.characters.set(Array.from(characterMap.values()));
            this.campaigns.set(mappedCampaigns);

            const selected = this.selectedCampaignId();
            if (!mappedCampaigns.some((campaign) => campaign.id === selected)) {
                this.selectedCampaignId.set(mappedCampaigns[0]?.id ?? '');
            }
        } catch {
            this.clearState();
        } finally {
            this.isHydrating.set(false);
            this.initialized.set(true);
        }
    }

    private mapCampaignFromApi(campaign: ApiCampaignDto, partyCharacterIds: string[]): Campaign {
        const levelStart = Math.min(Math.max(Math.trunc(campaign.levelStart ?? 1), 1), 20);
        const levelEnd = Math.min(Math.max(Math.trunc(campaign.levelEnd ?? 4), levelStart), 20);

        const maps = (campaign.maps?.length
            ? campaign.maps.map((map) => this.mapCampaignMapBoardFromApi(map))
            : [{
                id: campaign.activeMapId?.trim() || crypto.randomUUID(),
                name: 'Main Map',
                ...this.mapCampaignMapFromApi(campaign.map)
            }]);
        const activeMapId = campaign.activeMapId?.trim() || maps[0]?.id || '';
        const activeMap = maps.find((map) => map.id === activeMapId) ?? maps[0] ?? this.createEmptyCampaignMapBoard();

        return {
            id: campaign.id,
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone ?? 'Heroic',
            levelStart,
            levelEnd,
            levelRange: `Levels ${levelStart}-${levelEnd}`,
            summary: campaign.summary,
            hook: campaign.hook || 'A new adventure awaits.',
            nextSession: campaign.nextSession || 'TBD',
            partyCharacterIds,
            sessions: (campaign.sessions ?? []).map((session) => ({
                id: session.id,
                title: session.title,
                date: session.date,
                location: session.location,
                objective: session.objective,
                threat: session.threat
            })),
            openThreads: (campaign.openThreads ?? []).map((thread) => ({
                id: thread.id,
                text: thread.text,
                visibility: thread.visibility
            })),
            worldNotes: (campaign.worldNotes ?? []).map((note) => ({
                id: note.id,
                title: note.title,
                category: this.normalizeWorldNoteCategory(note.category),
                content: note.content
            })),
            map: this.mapCampaignMapFromApi(activeMap),
            maps,
            activeMapId: activeMap.id,
            loot: [...(campaign.loot ?? [])],
            npcs: [...(campaign.npcs ?? [])],
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

    private replaceCampaignFromApi(campaignId: string, updated: ApiCampaignDto): void {
        this.campaigns.update((campaigns) =>
            campaigns.map((campaign) =>
                campaign.id === campaignId
                    ? this.mapCampaignFromApi(updated, campaign.partyCharacterIds)
                    : campaign
            )
        );
    }

    private createEmptyCampaignMapBoard(): CampaignMapBoard {
        return {
            id: crypto.randomUUID(),
            name: 'Untitled Map',
            ...this.mapCampaignMapFromApi()
        };
    }

    private mapCampaignMapFromApi(map?: ApiCampaignMapDto): CampaignMap {
        return {
            background: this.normalizeMapBackground(map?.background),
            backgroundImageUrl: this.normalizeMapBackgroundImageUrl(map?.backgroundImageUrl),
            strokes: (map?.strokes ?? []).map((stroke) => ({
                id: stroke.id,
                color: this.normalizeMapColor(stroke.color),
                width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                points: (stroke.points ?? []).map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                }))
            })).filter((stroke) => stroke.points.length > 0),
            icons: (map?.icons ?? []).map((icon) => ({
                id: icon.id,
                type: this.normalizeMapIconType(icon.type),
                label: icon.label?.trim() || this.defaultMapIconLabel(icon.type),
                x: this.normalizeMapCoordinate(icon.x),
                y: this.normalizeMapCoordinate(icon.y)
            })),
            tokens: (map?.tokens ?? []).map((token) => ({
                id: token.id,
                name: token.name?.trim() || 'Token',
                imageUrl: this.normalizeMapBackgroundImageUrl(token.imageUrl),
                x: this.normalizeMapCoordinate(token.x),
                y: this.normalizeMapCoordinate(token.y),
                size: this.normalizeMapScale(token.size),
                note: token.note?.trim() || ''
            })).filter((token) => !!token.imageUrl),
            decorations: (map?.decorations ?? []).map((decoration) => ({
                id: decoration.id,
                type: this.normalizeMapDecorationType(decoration.type),
                color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                x: this.normalizeMapCoordinate(decoration.x),
                y: this.normalizeMapCoordinate(decoration.y),
                scale: this.normalizeMapScale(decoration.scale),
                rotation: this.normalizeMapRotation(decoration.rotation),
                opacity: this.normalizeMapOpacity(decoration.opacity)
            })),
            labels: (map?.labels ?? []).map((label) => ({
                id: label.id,
                text: label.text?.trim() || 'Unnamed Reach',
                tone: this.normalizeMapLabelTone(label.tone),
                x: this.normalizeMapCoordinate(label.x),
                y: this.normalizeMapCoordinate(label.y),
                rotation: this.normalizeMapRotation(label.rotation)
            })),
            layers: {
                rivers: (map?.layers?.rivers ?? []).map((stroke) => ({
                    id: stroke.id,
                    color: this.normalizeMapColor(stroke.color),
                    width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                    points: (stroke.points ?? []).map((point) => ({
                        x: this.normalizeMapCoordinate(point.x),
                        y: this.normalizeMapCoordinate(point.y)
                    }))
                })).filter((stroke) => stroke.points.length > 0),
                mountainChains: (map?.layers?.mountainChains ?? []).map((decoration) => ({
                    id: decoration.id,
                    type: this.normalizeMapDecorationType(decoration.type),
                    color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                    x: this.normalizeMapCoordinate(decoration.x),
                    y: this.normalizeMapCoordinate(decoration.y),
                    scale: this.normalizeMapScale(decoration.scale),
                    rotation: this.normalizeMapRotation(decoration.rotation),
                    opacity: this.normalizeMapOpacity(decoration.opacity)
                })),
                forestBelts: (map?.layers?.forestBelts ?? []).map((decoration) => ({
                    id: decoration.id,
                    type: this.normalizeMapDecorationType(decoration.type),
                    color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                    x: this.normalizeMapCoordinate(decoration.x),
                    y: this.normalizeMapCoordinate(decoration.y),
                    scale: this.normalizeMapScale(decoration.scale),
                    rotation: this.normalizeMapRotation(decoration.rotation),
                    opacity: this.normalizeMapOpacity(decoration.opacity)
                }))
            }
        };
    }

    private mapCampaignMapBoardFromApi(map?: ApiCampaignMapBoardDto): CampaignMapBoard {
        return {
            id: map?.id?.trim() || crypto.randomUUID(),
            name: map?.name?.trim() || 'Untitled Map',
            ...this.mapCampaignMapFromApi(map)
        };
    }

    private mapCampaignMapToApi(map: CampaignMap): ApiCampaignMapDto {
        return {
            background: this.normalizeMapBackground(map.background),
            backgroundImageUrl: this.normalizeMapBackgroundImageUrl(map.backgroundImageUrl),
            strokes: map.strokes.map((stroke) => ({
                id: stroke.id,
                color: this.normalizeMapColor(stroke.color),
                width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                points: stroke.points.map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                }))
            })),
            icons: map.icons.map((icon) => ({
                id: icon.id,
                type: this.normalizeMapIconType(icon.type),
                label: icon.label?.trim() || this.defaultMapIconLabel(icon.type),
                x: this.normalizeMapCoordinate(icon.x),
                y: this.normalizeMapCoordinate(icon.y)
            })),
            tokens: map.tokens.map((token) => ({
                id: token.id,
                name: token.name?.trim() || 'Token',
                imageUrl: this.normalizeMapBackgroundImageUrl(token.imageUrl),
                x: this.normalizeMapCoordinate(token.x),
                y: this.normalizeMapCoordinate(token.y),
                size: this.normalizeMapScale(token.size),
                note: token.note?.trim() || ''
            })).filter((token) => !!token.imageUrl),
            decorations: map.decorations.map((decoration) => ({
                id: decoration.id,
                type: this.normalizeMapDecorationType(decoration.type),
                color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                x: this.normalizeMapCoordinate(decoration.x),
                y: this.normalizeMapCoordinate(decoration.y),
                scale: this.normalizeMapScale(decoration.scale),
                rotation: this.normalizeMapRotation(decoration.rotation),
                opacity: this.normalizeMapOpacity(decoration.opacity)
            })),
            labels: map.labels.map((label) => ({
                id: label.id,
                text: label.text?.trim() || 'Unnamed Reach',
                tone: this.normalizeMapLabelTone(label.tone),
                x: this.normalizeMapCoordinate(label.x),
                y: this.normalizeMapCoordinate(label.y),
                rotation: this.normalizeMapRotation(label.rotation)
            })),
            layers: {
                rivers: map.layers.rivers.map((stroke) => ({
                    id: stroke.id,
                    color: this.normalizeMapColor(stroke.color),
                    width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                    points: stroke.points.map((point) => ({
                        x: this.normalizeMapCoordinate(point.x),
                        y: this.normalizeMapCoordinate(point.y)
                    }))
                })),
                mountainChains: map.layers.mountainChains.map((decoration) => ({
                    id: decoration.id,
                    type: this.normalizeMapDecorationType(decoration.type),
                    color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                    x: this.normalizeMapCoordinate(decoration.x),
                    y: this.normalizeMapCoordinate(decoration.y),
                    scale: this.normalizeMapScale(decoration.scale),
                    rotation: this.normalizeMapRotation(decoration.rotation),
                    opacity: this.normalizeMapOpacity(decoration.opacity)
                })),
                forestBelts: map.layers.forestBelts.map((decoration) => ({
                    id: decoration.id,
                    type: this.normalizeMapDecorationType(decoration.type),
                    color: this.normalizeMapDecorationColor(decoration.type, decoration.color),
                    x: this.normalizeMapCoordinate(decoration.x),
                    y: this.normalizeMapCoordinate(decoration.y),
                    scale: this.normalizeMapScale(decoration.scale),
                    rotation: this.normalizeMapRotation(decoration.rotation),
                    opacity: this.normalizeMapOpacity(decoration.opacity)
                }))
            }
        };
    }

    private mapCampaignMapBoardToApi(map: CampaignMapBoard): ApiCampaignMapBoardDto {
        return {
            id: map.id,
            name: map.name.trim() || 'Untitled Map',
            ...this.mapCampaignMapToApi(map)
        };
    }

    private mapCampaignMapLibraryToApi(payload: { activeMapId: string; maps: CampaignMapBoard[] }): ApiCampaignMapLibraryDto {
        const maps = payload.maps.length > 0 ? payload.maps : [this.createEmptyCampaignMapBoard()];
        const activeMapId = maps.some((map) => map.id === payload.activeMapId) ? payload.activeMapId : maps[0].id;

        return {
            activeMapId,
            maps: maps.map((map) => this.mapCampaignMapBoardToApi(map))
        };
    }

    private mapCharacterFromApi(character: ApiCharacterDto, draft?: CharacterDraft): Character {
        const raceFromApi = (character.species ?? '').trim();
        const raceFromDraft = draft?.race?.trim();
        const normalizedRaceKey = (raceFromApi || raceFromDraft || 'human').toLowerCase();
        const race = raceMap.get(normalizedRaceKey)
            ?? [...raceMap.values()].find((entry) => entry.name.toLowerCase() === normalizedRaceKey)
            ?? null;
        let abilityScores = this.parseAbilityScores(character.abilityScores)
            ?? draft?.abilityScores
            ?? this.getDefaultAbilitiesByClass(character.className);
        const resolvedNotes = this.resolveCharacterNotes(character, draft?.notes);

        const proficiencyBonus = Math.ceil(Math.max(character.level, 1) / 4) + 1;
        const armorClass = Number.isFinite(Number(character.armorClass))
            ? Math.max(0, Math.trunc(Number(character.armorClass)))
            : this.calculateAC(character.className, abilityScores.dexterity);
        const fallbackHitPoints = this.calculateHitPoints(character.className, Math.max(character.level, 1), abilityScores.constitution);
        const persistedMaxHpOverride = this.extractPersistedHpMaxOverride(resolvedNotes);
        const draftMaxHitPoints = draft?.maxHitPoints ?? draft?.hitPoints;
        const maxHitPoints = Number.isFinite(draftMaxHitPoints)
            ? Math.max(1, Math.trunc(draftMaxHitPoints as number))
            : Number.isFinite(persistedMaxHpOverride)
                ? Math.max(1, Math.trunc(persistedMaxHpOverride as number))
                : fallbackHitPoints;
        const draftCurrentHitPoints = draft?.hitPoints;
        const apiCurrentHitPoints = Number(character.hitPoints);
        const hitPoints = Number.isFinite(draftCurrentHitPoints)
            ? Math.max(0, Math.min(maxHitPoints, Math.trunc(draftCurrentHitPoints as number)))
            : Number.isFinite(apiCurrentHitPoints)
                ? Math.max(0, Math.min(maxHitPoints, Math.trunc(apiCurrentHitPoints)))
                : maxHitPoints;
        const deathSaveFailures = Number.isFinite(draft?.deathSaveFailures)
            ? Math.max(0, Math.min(3, Math.trunc(draft!.deathSaveFailures as number)))
            : Math.max(0, Math.min(3, Math.trunc(Number(character.deathSaveFailures) || 0)));
        const deathSaveSuccesses = Number.isFinite(draft?.deathSaveSuccesses)
            ? Math.max(0, Math.min(3, Math.trunc(draft!.deathSaveSuccesses as number)))
            : Math.max(0, Math.min(3, Math.trunc(Number(character.deathSaveSuccesses) || 0)));

        // Map all available fields from ApiCharacterDto and draft
        return {
            id: character.id,
            campaignId: character.campaignId,
            campaignIds: character.campaignIds?.length
                ? character.campaignIds
                : character.campaignId && character.campaignId !== DungeonStoreService.UNASSIGNED_CAMPAIGN_ID
                    ? [character.campaignId]
                    : [],
            ownerUserId: character.ownerUserId,
            ownerDisplayName: character.ownerDisplayName || character.playerName,
            canEdit: character.canEdit,
            name: character.name,
            playerName: character.playerName,
            race: race?.name || raceFromApi || raceFromDraft || 'Human',
            className: character.className,
            level: Math.max(character.level, 1),
            role: draft?.role ?? 'Striker',
            status: character.status,
            background: character.background,
            notes: resolvedNotes,
            abilityScores,
            skills: this.parseSkillProficiencies(character.skills)
                ?? draft?.skills
                ?? this.getDefaultSkillsByClass(character.className),
            armorClass,
            hitPoints,
            deathSaveFailures,
            deathSaveSuccesses,
            maxHitPoints,
            proficiencyBonus,
            traits: race?.traits ?? [],
            gender: (draft?.gender ?? (character as any).gender) || '',
            alignment: draft?.alignment ?? character.alignment ?? '',
            faith: (draft?.faith ?? (character as any).faith) || '',
            lifestyle: draft?.lifestyle ?? character.lifestyle ?? '',
            classFeatures: (draft?.classFeatures ?? (character as any).classFeatures) || [],
            speciesTraits: (draft?.speciesTraits ?? (character as any).speciesTraits) || [],
            languages: (draft?.languages ?? (character as any).languages) || [],
            personalityTraits: Array.isArray(draft?.personalityTraits)
                ? draft.personalityTraits
                : this.parseDelimitedValues(character.personalityTraits),
            ideals: Array.isArray(draft?.ideals)
                ? draft.ideals
                : this.parseDelimitedValues(character.ideals),
            bonds: Array.isArray(draft?.bonds)
                ? draft.bonds
                : this.parseDelimitedValues(character.bonds),
            flaws: Array.isArray(draft?.flaws)
                ? draft.flaws
                : this.parseDelimitedValues(character.flaws),
            equipment: draft?.equipment ?? this.parseDelimitedValues(character.equipment),
            spells: draft?.spells ?? this.parseDelimitedValues(character.spells),
            experiencePoints: Number.isFinite(draft?.experiencePoints)
                ? Math.max(0, Math.trunc(draft!.experiencePoints as number))
                : Math.max(0, Math.trunc(Number(character.experiencePoints) || 0)),
            image: draft?.image || character.portraitUrl || ''
        };
    }

    private parseAbilityScores(raw: string | null | undefined): AbilityScores | null {
        if (!raw || !raw.trim()) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<AbilityScores>;
            const values = {
                strength: Number(parsed.strength),
                dexterity: Number(parsed.dexterity),
                constitution: Number(parsed.constitution),
                intelligence: Number(parsed.intelligence),
                wisdom: Number(parsed.wisdom),
                charisma: Number(parsed.charisma)
            };

            if (Object.values(values).every((value) => Number.isFinite(value))) {
                return {
                    strength: Math.trunc(values.strength),
                    dexterity: Math.trunc(values.dexterity),
                    constitution: Math.trunc(values.constitution),
                    intelligence: Math.trunc(values.intelligence),
                    wisdom: Math.trunc(values.wisdom),
                    charisma: Math.trunc(values.charisma)
                };
            }
        } catch {
            return null;
        }

        return null;
    }

    private parseSkillProficiencies(raw: string | null | undefined): SkillProficiencies | null {
        if (!raw || !raw.trim()) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<SkillProficiencies>;
            return {
                acrobatics: Boolean(parsed.acrobatics),
                animalHandling: Boolean(parsed.animalHandling),
                arcana: Boolean(parsed.arcana),
                athletics: Boolean(parsed.athletics),
                deception: Boolean(parsed.deception),
                history: Boolean(parsed.history),
                insight: Boolean(parsed.insight),
                intimidation: Boolean(parsed.intimidation),
                investigation: Boolean(parsed.investigation),
                medicine: Boolean(parsed.medicine),
                nature: Boolean(parsed.nature),
                perception: Boolean(parsed.perception),
                performance: Boolean(parsed.performance),
                persuasion: Boolean(parsed.persuasion),
                sleightOfHand: Boolean(parsed.sleightOfHand),
                stealth: Boolean(parsed.stealth),
                survival: Boolean(parsed.survival)
            };
        } catch {
            return null;
        }
    }

    private extractPersistedHpMaxOverride(notes: string): number | null {
        const start = notes.indexOf(DungeonStoreService.BUILDER_STATE_START_TAG);
        const end = notes.indexOf(DungeonStoreService.BUILDER_STATE_END_TAG);

        if (start === -1 || end === -1 || end < start) {
            return null;
        }

        const jsonStart = start + DungeonStoreService.BUILDER_STATE_START_TAG.length;
        const rawJson = notes.slice(jsonStart, end).trim();
        if (!rawJson) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawJson) as { hpMaxOverride?: unknown };
            if (typeof parsed.hpMaxOverride === 'number' && Number.isFinite(parsed.hpMaxOverride)) {
                return parsed.hpMaxOverride;
            }
        } catch {
            return null;
        }

        return null;
    }

    private normalizeWorldNoteCategory(category: ApiCampaignWorldNoteDto['category'] | string | null | undefined): CampaignWorldNoteCategory {
        switch (category) {
            case 'Backstory':
            case 'Organization':
            case 'Ally':
            case 'Enemy':
            case 'Location':
            case 'Lore':
            case 'Custom':
                return category;
            default:
                return 'Lore';
        }
    }

    private normalizeMapBackground(background: string | undefined): CampaignMapBackground {
        switch (background) {
            case 'Cavern':
            case 'Coast':
            case 'City':
                return background;
            default:
                return 'Parchment';
        }
    }

    private normalizeMapBackgroundImageUrl(value: string | undefined): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private normalizeMapIconType(iconType: string | undefined): CampaignMapIconType {
        switch (iconType) {
            case 'Town':
            case 'Camp':
            case 'Dungeon':
            case 'Danger':
            case 'Treasure':
            case 'Portal':
            case 'Tower':
                return iconType;
            default:
                return 'Keep';
        }
    }

    private defaultMapIconLabel(iconType: string | undefined): string {
        switch (this.normalizeMapIconType(iconType)) {
            case 'Town':
                return 'Town';
            case 'Camp':
                return 'Camp';
            case 'Dungeon':
                return 'Dungeon';
            case 'Danger':
                return 'Hazard';
            case 'Treasure':
                return 'Cache';
            case 'Portal':
                return 'Gate';
            case 'Tower':
                return 'Tower';
            default:
                return 'Keep';
        }
    }

    private normalizeMapDecorationType(type: ApiCampaignMapDecorationDto['type'] | string | undefined): CampaignMapDecorationType {
        switch (type) {
            case 'Mountain':
            case 'Hill':
            case 'Reef':
            case 'Cave':
            case 'Ward':
                return type;
            default:
                return 'Forest';
        }
    }

    private normalizeMapLabelTone(tone: ApiCampaignMapLabelDto['tone'] | string | undefined): CampaignMapLabelTone {
        switch (tone) {
            case 'Feature':
                return 'Feature';
            default:
                return 'Region';
        }
    }

    private normalizeMapDecorationColor(type: ApiCampaignMapDecorationDto['type'] | string | undefined, color: string | undefined): string {
        const normalizedType = this.normalizeMapDecorationType(type);

        switch (color) {
            case '#4b3a2a':
            case '#8a5a2b':
            case '#507255':
            case '#385f7a':
            case '#a03d2f':
                return color;
            default:
                return this.defaultMapDecorationColor(normalizedType);
        }
    }

    private defaultMapDecorationColor(type: CampaignMapDecorationType): string {
        switch (type) {
            case 'Mountain':
                return '#4b3a2a';
            case 'Forest':
                return '#507255';
            case 'Reef':
                return '#385f7a';
            case 'Ward':
                return '#a03d2f';
            default:
                return '#8a5a2b';
        }
    }

    private normalizeMapColor(color: string | undefined): string {
        switch (color) {
            case '#4b3a2a':
            case '#8a5a2b':
            case '#507255':
            case '#385f7a':
            case '#a03d2f':
                return color;
            default:
                return '#8a5a2b';
        }
    }

    private normalizeMapCoordinate(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0.5;
        }

        return Math.max(0, Math.min(1, value));
    }

    private normalizeMapScale(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 1;
        }

        return Math.max(0.55, Math.min(1.8, value));
    }

    private normalizeMapRotation(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(-180, Math.min(180, value));
    }

    private normalizeMapOpacity(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0.75;
        }

        return Math.max(0.24, Math.min(1, value));
    }

    private parseDelimitedValues(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
        }

        if (typeof value !== 'string' || value.trim().length === 0) {
            return [];
        }

        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
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

    private async addThreadFromApi(text: string, visibility: CampaignThreadVisibility): Promise<void> {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign || selectedCampaign.currentUserRole !== 'Owner' || !text.trim()) {
            return;
        }

        try {
            const updated = await this.api.createCampaignThread(selectedCampaign.id, {
                text: text.trim(),
                visibility
            });
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

    private async updateThreadFromApi(threadId: string, text: string, visibility: CampaignThreadVisibility): Promise<void> {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign || selectedCampaign.currentUserRole !== 'Owner' || !threadId || !text.trim()) {
            return;
        }

        try {
            const updated = await this.api.updateCampaignThread(selectedCampaign.id, threadId, {
                text: text.trim(),
                visibility
            });
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

    private async archiveThreadFromApi(threadId: string): Promise<void> {
        const selectedCampaign = this.selectedCampaign();

        if (!selectedCampaign || selectedCampaign.currentUserRole !== 'Owner' || !threadId) {
            return;
        }

        try {
            const updated = await this.api.archiveCampaignThread(selectedCampaign.id, threadId);
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
