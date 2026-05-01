import { HttpErrorResponse } from '@angular/common/http';
import { extractApiError } from './extract-api-error';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { CampaignNpc } from '../models/campaign-npc.models';
import { raceMap } from '../data/races';
import { AbilityScores, Campaign, CampaignDraft, CampaignMap, CampaignMapBackground, CampaignMapBoard, CampaignMapDecorationType, CampaignMapIconType, CampaignMapLabelStyle, CampaignMapLabelTone, CampaignMapToken, CampaignThreadVisibility, CampaignWorldNoteCategory, Character, CharacterDraft, CharacterStatus, DEFAULT_CAMPAIGN_MAP_GRID_COLOR, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y, DEFAULT_CAMPAIGN_MAP_GRID_ROWS, SkillProficiencies, ThreatLevel } from '../models/dungeon.models';
import { ApiCampaignDto, ApiCampaignMapBoardDto, ApiCampaignMapDecorationDto, ApiCampaignMapDto, ApiCampaignMapLabelDto, ApiCampaignMapLabelStyleDto, ApiCampaignMapLibraryDto, ApiCampaignMapTokenDto, ApiCampaignMapTokenMovedDto, ApiCampaignMapVisionMemoryDto, ApiCampaignMapVisionUpdatedDto, ApiCampaignNpcDto, ApiCampaignSummaryDto, ApiCampaignWorldNoteDto, ApiCharacterDto, DungeonApiService, UserLibrariesDto } from './dungeon-api.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class DungeonStoreService {
    readonly lastError = signal('');
    private readonly latestTokenMoveRequestSequence = new Map<string, number>();
    private readonly latestKnownTokenMoveRevision = new Map<string, number>();

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
            this.lastError.set('');
        } catch (error) {
            this.lastError.set(extractApiError(error, 'Could not delete character.'));
        }
    }
    private static readonly UNASSIGNED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000';
    private static readonly BUILDER_STATE_START_TAG = '[DK_BUILDER_STATE_START]';
    private static readonly BUILDER_STATE_END_TAG = '[DK_BUILDER_STATE_END]';

    readonly title = signal('DungeonKeep');
    readonly campaigns = signal<Campaign[]>([]);
    readonly characters = signal<Character[]>([]);
    readonly userNpcLibrary = signal<unknown[]>([]);
    readonly userCustomTableLibrary = signal<unknown[]>([]);
    readonly userMonsterLibrary = signal<unknown[]>([]);
    readonly userMonsterReference = signal<unknown[]>([]);
    readonly selectedCampaignId = signal('');
    readonly initialized = signal(false);
    readonly isHydrating = signal(false);
    readonly loadingCampaignDetails = signal<string[]>([]);

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
        this.campaigns().reduce((total, campaign) => total + campaign.sessionCount, 0)
    );
    readonly openThreadCount = computed(() =>
        this.campaigns().reduce((total, campaign) => total + campaign.openThreadCount, 0)
    );
    readonly readyCharacterCount = computed(
        () => this.characters().filter((character) => character.status === 'Ready').length
    );

    constructor() {
        effect(() => {
            const campaigns = this.campaigns();
            const selectedCampaignId = this.selectedCampaignId();

            if (!selectedCampaignId) {
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

    hasCampaignDetails(campaignId: string): boolean {
        return this.campaigns().some((campaign) => campaign.id === campaignId && campaign.detailsLoaded);
    }

    isCampaignDetailsLoading(campaignId: string): boolean {
        return this.loadingCampaignDetails().includes(campaignId);
    }

    async ensureCampaignLoaded(campaignId: string): Promise<void> {
        if (!campaignId || this.hasCampaignDetails(campaignId) || this.isCampaignDetailsLoading(campaignId)) {
            return;
        }

        await this.loadCampaignDetails(campaignId);
    }

    async refreshCampaignLoaded(campaignId: string): Promise<void> {
        if (!campaignId || this.isCampaignDetailsLoading(campaignId)) {
            return;
        }

        await this.loadCampaignDetails(campaignId);
    }

    async refreshCampaignMapLibrary(campaignId: string): Promise<void> {
        if (!campaignId) {
            return;
        }

        try {
            const library = await this.api.getCampaignMapLibrary(campaignId);
            const maps = (library.maps?.length
                ? library.maps.map((map) => this.mapCampaignMapBoardFromApi(map))
                : [this.createEmptyCampaignMapBoard()]);
            const activeMapId = library.activeMapId?.trim() || maps[0]?.id || '';
            const activeMap = maps.find((map) => map.id === activeMapId) ?? maps[0] ?? this.createEmptyCampaignMapBoard();

            this.campaigns.update((campaigns) => campaigns.map((campaign) => campaign.id === campaignId
                ? {
                    ...campaign,
                    maps,
                    activeMapId: activeMap.id,
                    map: this.mapCampaignMapFromApi(activeMap)
                }
                : campaign));
        } catch {
            // Preserve the currently loaded campaign state on map-library load failures.
        }
    }

    async refreshCampaignSummaries(): Promise<void> {
        try {
            const [campaignDtos, accessibleCharacterDtos] = await Promise.all([
                this.api.getCampaignSummaries(),
                this.api.getAccessibleCharacters()
            ]);

            const characterMap = new Map<string, Character>();
            const characterLookup = new Map<string, string[]>();

            for (const characterDto of accessibleCharacterDtos) {
                const mappedCharacter = this.mapCharacterFromApi(characterDto);
                const existing = characterMap.get(mappedCharacter.id);

                if (!existing) {
                    characterMap.set(mappedCharacter.id, mappedCharacter);
                } else {
                    const mergedCampaignIds = Array.from(new Set([...(existing.campaignIds ?? []), ...(mappedCharacter.campaignIds ?? [])]));
                    characterMap.set(mappedCharacter.id, { ...existing, ...mappedCharacter, campaignIds: mergedCampaignIds });
                }

                const ids = mappedCharacter.campaignIds ?? (mappedCharacter.campaignId ? [mappedCharacter.campaignId] : []);
                for (const cid of ids) {
                    const arr = characterLookup.get(cid) ?? [];
                    arr.push(mappedCharacter.id);
                    characterLookup.set(cid, arr);
                }
            }

            this.characters.set(Array.from(characterMap.values()));

            const incomingIds = new Set(campaignDtos.map((c) => c.id));
            const existing = this.campaigns();

            const merged = campaignDtos.map((dto) => {
                const partyCharacterIds = characterLookup.get(dto.id) ?? [];
                const existingCampaign = existing.find((c) => c.id === dto.id);

                const summary = this.mapCampaignSummaryFromApi(dto, partyCharacterIds);

                if (!existingCampaign?.detailsLoaded) {
                    return summary;
                }

                // Preserve already-loaded details; only update summary-level fields
                return {
                    ...existingCampaign,
                    name: summary.name,
                    setting: summary.setting,
                    tone: summary.tone,
                    levelStart: summary.levelStart,
                    levelEnd: summary.levelEnd,
                    levelRange: summary.levelRange,
                    summary: summary.summary,
                    hook: summary.hook,
                    nextSession: summary.nextSession,
                    characterCount: summary.characterCount,
                    sessionCount: summary.sessionCount,
                    npcCount: summary.npcCount,
                    openThreadCount: summary.openThreadCount,
                    currentUserRole: summary.currentUserRole,
                    partyCharacterIds
                };
            });

            this.campaigns.set(merged);
        } catch {
            // Keep existing state on error
        }
    }

    async refreshCampaignCharacters(campaignId?: string): Promise<void> {
        try {
            const accessibleCharacterDtos = await this.api.getAccessibleCharacters();
            const characterMap = new Map<string, Character>();

            for (const characterDto of accessibleCharacterDtos) {
                const mappedCharacter = this.mapCharacterFromApi(characterDto);
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

            const nextCharacters = Array.from(characterMap.values());
            this.characters.set(nextCharacters);
            this.campaigns.update((campaigns) => campaigns.map((campaign) => {
                if (campaignId && campaign.id !== campaignId) {
                    return campaign;
                }

                const partyCharacterIds = nextCharacters
                    .filter((character) => character.campaignIds?.includes(campaign.id) || character.campaignId === campaign.id)
                    .map((character) => character.id);

                return {
                    ...campaign,
                    partyCharacterIds
                };
            }));
        } catch {
        }
    }

    private async loadCampaignDetails(campaignId: string): Promise<void> {
        if (!campaignId || this.isCampaignDetailsLoading(campaignId)) {
            return;
        }

        this.loadingCampaignDetails.update((ids) => [...ids, campaignId]);

        try {
            const campaign = await this.api.getCampaign(campaignId);
            const partyCharacterIds = this.characters()
                .filter((character) => character.campaignIds?.includes(campaignId) || character.campaignId === campaignId)
                .map((character) => character.id);

            this.campaigns.update((campaigns) => {
                const mapped = this.mapCampaignFromApi(campaign, partyCharacterIds);
                const existingIndex = campaigns.findIndex((entry) => entry.id === campaignId);

                if (existingIndex === -1) {
                    return [mapped, ...campaigns];
                }

                const next = [...campaigns];
                next[existingIndex] = mapped;
                return next;
            });
        } catch {
        } finally {
            this.loadingCampaignDetails.update((ids) => ids.filter((id) => id !== campaignId));
        }
    }

    applyCampaignRealtimeUpdate(updated: ApiCampaignDto): void {
        const partyCharacterIds = this.characters()
            .filter((character) => character.campaignIds?.includes(updated.id) || character.campaignId === updated.id)
            .map((character) => character.id);

        this.campaigns.update((campaigns) => {
            const existingIndex = campaigns.findIndex((campaign) => campaign.id === updated.id);
            const existingCampaign = existingIndex >= 0 ? campaigns[existingIndex] : null;
            const mapped = this.mapCampaignFromApi(updated, partyCharacterIds);
            const normalized = existingCampaign
                ? {
                    ...mapped,
                    currentUserRole: existingCampaign.currentUserRole ?? mapped.currentUserRole
                }
                : mapped;

            this.syncKnownTokenMoveRevisions(normalized);

            if (existingIndex === -1) {
                return [normalized, ...campaigns];
            }

            const next = [...campaigns];
            next[existingIndex] = normalized;
            return next;
        });
    }

    applyCampaignMapTokenMoved(event: ApiCampaignMapTokenMovedDto): void {
        const mappedToken = this.mapCampaignTokenFromApi(event.token);
        const requestKey = this.tokenMoveRequestKey(event.campaignId, event.mapId, mappedToken.id);
        this.latestKnownTokenMoveRevision.set(
            requestKey,
            Math.max(this.latestKnownTokenMoveRevision.get(requestKey) ?? 0, mappedToken.moveRevision)
        );

        this.campaigns.update((campaigns) => campaigns.map((campaign) => {
            if (campaign.id !== event.campaignId) {
                return campaign;
            }

            const maps = campaign.maps.map((map) => map.id === event.mapId
                ? {
                    ...map,
                    tokens: this.upsertMapToken(map.tokens, mappedToken)
                }
                : map);
            const shouldUpdatePrimaryMap = campaign.maps.length === 0 || campaign.activeMapId === event.mapId;

            return {
                ...campaign,
                map: shouldUpdatePrimaryMap
                    ? {
                        ...campaign.map,
                        tokens: this.upsertMapToken(campaign.map.tokens, mappedToken)
                    }
                    : campaign.map,
                maps
            };
        }));
    }

    applyCampaignMapVisionUpdated(event: ApiCampaignMapVisionUpdatedDto): void {
        const mappedMemory = this.mapCampaignVisionMemoryFromApi(event.memory);

        this.campaigns.update((campaigns) => campaigns.map((campaign) => {
            if (campaign.id !== event.campaignId) {
                return campaign;
            }

            const maps = campaign.maps.map((map) => map.id === event.mapId
                ? {
                    ...map,
                    visionMemory: this.upsertMapVisionMemory(map.visionMemory, mappedMemory)
                }
                : map);
            const shouldUpdatePrimaryMap = campaign.maps.length === 0 || campaign.activeMapId === event.mapId;

            return {
                ...campaign,
                map: shouldUpdatePrimaryMap
                    ? {
                        ...campaign.map,
                        visionMemory: this.upsertMapVisionMemory(campaign.map.visionMemory, mappedMemory)
                    }
                    : campaign.map,
                maps
            };
        }));
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
        const playerName = draft.playerName?.trim() || this.session.currentUser()?.displayName || 'Player';
        const currentCharacter = this.characters().find((character) => character.id === characterId);
        const currentNotes = currentCharacter?.notes?.trim() ?? '';
        const requestedNotes = draft.notes?.trim() ?? '';

        const notesForSave = this.hasBuilderStateBlock(requestedNotes)
            ? requestedNotes
            : this.hasBuilderStateBlock(currentNotes)
                ? this.mergeVisibleNotesWithBuilderState(currentNotes, requestedNotes)
                : (requestedNotes || 'No field notes yet.');

        const resolvedClassName = this.resolveClassNameForSave(draft.className, notesForSave, currentCharacter?.className);
        const resolvedLevel = this.resolveCharacterLevelForSave(draft.level, notesForSave, currentCharacter?.level);

        if (!draft.name || !resolvedClassName) {
            return null;
        }

        const campaignIds = draft.campaignIds ?? (draft.campaignId ? [draft.campaignId] : undefined);

        try {
            const updated = await this.api.updateCharacter(characterId, {
                name: draft.name,
                playerName,
                className: resolvedClassName,
                level: resolvedLevel,
                background: draft.background || 'Freshly arrived adventurer',
                notes: notesForSave,
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
                detailBackgroundImageUrl: draft.detailBackgroundImageUrl,
                goals: draft.goals,
                secrets: draft.secrets,
                sessionHistory: draft.sessionHistory
            });

            const draftForMapping: CharacterDraft = {
                ...draft,
                notes: notesForSave,
                maxHitPoints: typeof draft.maxHitPoints === 'number'
                    ? draft.maxHitPoints
                    : currentCharacter?.maxHitPoints
            };

            const character = this.mapCharacterFromApi(updated, draftForMapping);
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
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.createCampaignSession(campaignId, draft);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignSession(campaignId: string, sessionId: string, draft: { title: string; date: string; location: string; objective: string; threat: ThreatLevel }): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.updateCampaignSession(campaignId, sessionId, draft);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async saveSessionDetails(campaignId: string, sessionId: string, payload: { detailsJson: string | null; lootAssignmentsJson: string | null }): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.saveSessionDetails(campaignId, sessionId, payload);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async saveCampaignCustomTables(campaignId: string, tables: unknown[]): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.saveCampaignCustomTables(campaignId, JSON.stringify(Array.isArray(tables) ? tables : []));
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async saveUserNpcLibrary(items: unknown[]): Promise<boolean> {
        try {
            const libraries = await this.api.saveUserNpcLibrary(JSON.stringify(Array.isArray(items) ? items : []));
            this.applyUserLibraries(libraries);
            return true;
        } catch {
            return false;
        }
    }

    async saveUserCustomTableLibrary(items: unknown[]): Promise<boolean> {
        try {
            const libraries = await this.api.saveUserCustomTableLibrary(JSON.stringify(Array.isArray(items) ? items : []));
            this.applyUserLibraries(libraries);
            return true;
        } catch {
            return false;
        }
    }

    async saveUserMonsterLibrary(items: unknown[]): Promise<boolean> {
        try {
            const libraries = await this.api.saveUserMonsterLibrary(JSON.stringify(Array.isArray(items) ? items : []));
            this.applyUserLibraries(libraries);
            return true;
        } catch {
            return false;
        }
    }

    async saveUserMonsterReference(items: unknown[]): Promise<boolean> {
        try {
            const libraries = await this.api.saveUserMonsterReference(JSON.stringify(Array.isArray(items) ? items : []));
            this.applyUserLibraries(libraries);
            return true;
        } catch {
            return false;
        }
    }

    async deleteCampaignSession(campaignId: string, sessionId: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.deleteCampaignSession(campaignId, sessionId);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignNpc(campaignId: string, name: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.addCampaignNpc(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCampaignNpc(campaignId: string, name: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.removeCampaignNpc(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            this.lastError.set('');
            return true;
        } catch (error) {
            this.lastError.set(extractApiError(error, 'Could not remove NPC.'));
            return false;
        }
    }

    async saveCampaignNpc(campaignId: string, npc: CampaignNpc): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.saveCampaignNpc(campaignId, this.mapCampaignNpcToApi(npc));
            this.replaceCampaignFromApi(campaignId, updated);
            this.lastError.set('');
            return true;
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                return await this.syncCampaignNpcNameFallback(campaignId, npc);
            }
            this.lastError.set(extractApiError(error, 'Could not save NPC.'));
            return false;
        }
    }

    async deleteCampaignNpc(campaignId: string, npcId: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.deleteCampaignNpc(campaignId, npcId);
            this.replaceCampaignFromApi(campaignId, updated);
            this.lastError.set('');
            return true;
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                const campaign = this.campaigns().find((entry) => entry.id === campaignId) ?? null;
                const npc = campaign?.campaignNpcs.find((entry) => entry.id === npcId) ?? null;
                if (!npc) {
                    return false;
                }
                return await this.removeCampaignNpc(campaignId, npc.name);
            }
            this.lastError.set(extractApiError(error, 'Could not delete NPC.'));
            return false;
        }
    }

    async addCampaignLoot(campaignId: string, name: string, sessionId?: string | null): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.addCampaignLoot(campaignId, name, sessionId);
            this.replaceCampaignFromApi(campaignId, updated);
            this.lastError.set('');
            return true;
        } catch (error) {
            this.lastError.set(extractApiError(error, 'Could not add loot.'));
            return false;
        }
    }

    async removeCampaignLoot(campaignId: string, name: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.removeCampaignLoot(campaignId, name);
            this.replaceCampaignFromApi(campaignId, updated);
            this.lastError.set('');
            return true;
        } catch (error) {
            this.lastError.set(extractApiError(error, 'Could not remove loot.'));
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

    async removeCampaignMember(campaignId: string, userId: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId) || !userId) {
            return false;
        }

        try {
            const updated = await this.api.removeCampaignMember(campaignId, userId);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async addCampaignWorldNote(campaignId: string, payload: { title: string; category: CampaignWorldNoteCategory; content: string }): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.createCampaignWorldNote(campaignId, payload);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignWorldNote(campaignId: string, noteId: string, payload: { title: string; category: CampaignWorldNoteCategory; content: string }): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.updateCampaignWorldNote(campaignId, noteId, payload);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCampaignWorldNote(campaignId: string, noteId: string): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.deleteCampaignWorldNote(campaignId, noteId);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async setSessionVisibility(campaignId: string, sessionId: string, isRevealedToPlayers: boolean): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.setSessionVisibility(campaignId, sessionId, isRevealedToPlayers);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async setWorldNoteVisibility(campaignId: string, noteId: string, isRevealedToPlayers: boolean): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.setWorldNoteVisibility(campaignId, noteId, isRevealedToPlayers);
            this.replaceCampaignFromApi(campaignId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignMap(campaignId: string, payload: { activeMapId: string; maps: CampaignMapBoard[] }): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            const updated = await this.api.updateCampaignMap(campaignId, this.mapCampaignMapLibraryToApi(payload));
            this.replaceCampaignFromApi(campaignId, updated);
            await this.refreshCampaignMapLibrary(campaignId);
            return true;
        } catch {
            return false;
        }
    }

    async moveCampaignMapToken(
        campaignId: string,
        mapId: string,
        tokenId: string,
        position: { x: number; y: number },
        visionMemory?: CampaignMap['visionMemory'][number] | null
    ): Promise<boolean> {
        const requestKey = this.tokenMoveRequestKey(campaignId, mapId, tokenId);
        const requestSequence = (this.latestTokenMoveRequestSequence.get(requestKey) ?? 0) + 1;
        const moveRevision = this.nextTokenMoveRevision(campaignId, mapId, tokenId);
        this.latestTokenMoveRequestSequence.set(requestKey, requestSequence);

        try {
            const updated = await this.api.moveCampaignMapToken(campaignId, tokenId, {
                mapId,
                x: position.x,
                y: position.y,
                moveRevision,
                visionMemory: visionMemory
                    ? {
                        key: visionMemory.key.trim(),
                        polygons: visionMemory.polygons.map((polygon) => ({
                            points: polygon.points.map((point) => ({
                                x: this.normalizeMapCoordinate(point.x),
                                y: this.normalizeMapCoordinate(point.y)
                            }))
                        })),
                        lastOrigin: visionMemory.lastOrigin
                            ? {
                                x: this.normalizeMapCoordinate(visionMemory.lastOrigin.x),
                                y: this.normalizeMapCoordinate(visionMemory.lastOrigin.y)
                            }
                            : null,
                        lastPolygonHash: visionMemory.lastPolygonHash,
                        revision: this.normalizeMapVisionRevision(visionMemory.revision)
                    }
                    : null
            });

            if (!this.isLatestTokenMoveRequest(requestKey, requestSequence)) {
                return true;
            }

            this.applyCampaignMapTokenMoved(updated);
            return true;
        } catch {
            return !this.isLatestTokenMoveRequest(requestKey, requestSequence);
        } finally {
            if (this.isLatestTokenMoveRequest(requestKey, requestSequence)) {
                this.latestTokenMoveRequestSequence.delete(requestKey);
            }
        }
    }

    async resetCampaignMapVision(campaignId: string, mapId: string, key?: string | null): Promise<boolean> {
        if (!this.canManageCampaignContent(campaignId)) {
            return false;
        }

        try {
            await this.api.resetCampaignMapVision(campaignId, { mapId, key: key?.trim() || null });
            return true;
        } catch {
            return false;
        }
    }

    async updateCampaignMapVision(campaignId: string, mapId: string, memory: CampaignMap['visionMemory'][number]): Promise<'ok' | 'not-found' | 'error'> {
        try {
            await this.api.updateCampaignMapVision(campaignId, {
                mapId,
                memory: {
                    key: memory.key.trim(),
                    polygons: memory.polygons.map((polygon) => ({
                        points: polygon.points.map((point) => ({
                            x: this.normalizeMapCoordinate(point.x),
                            y: this.normalizeMapCoordinate(point.y)
                        }))
                    })),
                    lastOrigin: memory.lastOrigin
                        ? {
                            x: this.normalizeMapCoordinate(memory.lastOrigin.x),
                            y: this.normalizeMapCoordinate(memory.lastOrigin.y)
                        }
                        : null,
                    lastPolygonHash: memory.lastPolygonHash,
                    revision: this.normalizeMapVisionRevision(memory.revision)
                }
            });
            return 'ok';
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                return 'not-found';
            }

            return 'error';
        }
    }

    async generateCampaignMapArtAi(campaignId: string, payload: { background: CampaignMapBackground; mapName: string; separateLabels?: boolean; settlementScale?: 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis'; parchmentLayout?: 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular'; cavernLayout?: 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes'; battlemapLocale?: 'TownStreet' | 'BuildingInterior' | 'ForestClearing' | 'Roadside' | 'Cliffside' | 'Riverside' | 'Ruins' | 'DungeonRoom' | 'Tavern'; lighting?: 'Day' | 'Dusk' | 'Night'; settlementNames?: string[]; regionNames?: string[]; ruinNames?: string[]; cavernNames?: string[]; additionalDirection?: string }): Promise<{ backgroundImageUrl: string; labels: Campaign['map']['labels'] } | null> {
        try {
            const generated = await this.api.generateCampaignMapArtAi(campaignId, {
                background: this.normalizeMapBackground(payload.background),
                mapName: payload.mapName.trim(),
                separateLabels: payload.separateLabels,
                settlementScale: payload.settlementScale,
                parchmentLayout: payload.parchmentLayout,
                cavernLayout: payload.cavernLayout,
                battlemapLocale: payload.battlemapLocale,
                lighting: payload.lighting,
                settlementNames: payload.settlementNames,
                regionNames: payload.regionNames,
                ruinNames: payload.ruinNames,
                cavernNames: payload.cavernNames,
                additionalDirection: payload.additionalDirection?.trim() || undefined
            });

            const labels = this.spreadGeneratedMapLabels((generated.labels ?? []).map((label) => ({
                id: label.id,
                text: label.text,
                tone: this.normalizeMapLabelTone(label.tone),
                x: this.normalizeMapCoordinate(label.x),
                y: this.normalizeMapCoordinate(label.y),
                rotation: Math.max(-180, Math.min(180, Number(label.rotation) || 0)),
                style: this.normalizeMapLabelStyle(label.style, label.tone)
            })));

            return {
                backgroundImageUrl: this.normalizeMapBackgroundImageUrl(generated.backgroundImageUrl),
                labels
            };
        } catch {
            return null;
        }
    }

    async updateCampaign(campaignId: string, draft: CampaignDraft): Promise<Campaign | null> {
        if (!this.canManageCampaignContent(campaignId)) {
            return null;
        }

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
            this.lastError.set('');

            return campaign;
        } catch (error) {
            this.lastError.set(extractApiError(error, 'Could not update campaign.'));
            return null;
        }
    }

    patchCampaignSummary(campaignId: string, summary: string): void {
        this.campaigns.update((campaigns) =>
            campaigns.map((c) => (c.id === campaignId ? { ...c, summary } : c))
        );
    }

    async setCharacterCampaign(characterId: string, campaignId: string | string[] | null): Promise<boolean> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || !this.canManageCharacterInCampaign(current)) {
            return false;
        }

        const nextCampaignIds = Array.isArray(campaignId)
            ? Array.from(new Set(campaignId.filter((id) => !!id)))
            : campaignId
                ? [campaignId]
                : [];

        try {
            const updated = await this.api.updateCharacterCampaign(characterId, nextCampaignIds);
            this.applyCharacterCampaignUpdate(characterId, updated);
            return true;
        } catch {
            return false;
        }
    }

    async removeCharacterFromCampaign(characterId: string, campaignId: string): Promise<boolean> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || !campaignId || !this.canManageCharacterInCampaign(current)) {
            return false;
        }

        const nextCampaignIds = Array.from(
            new Set([current.campaignId, ...(current.campaignIds ?? [])].filter((id): id is string => Boolean(id) && id !== campaignId))
        );

        try {
            const updated = await this.api.updateCharacterCampaign(characterId, nextCampaignIds);
            this.applyCharacterCampaignUpdate(characterId, updated);
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

    async setCharacterStatus(characterId: string, status: CharacterStatus): Promise<boolean> {
        return await this.setCharacterStatusFromApi(characterId, status);
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
        const playerName = draft.playerName?.trim() || this.session.currentUser()?.displayName || 'Player';

        if (!draft.name || !draft.className) {
            return null;
        }

        const campaignIds = draft.campaignIds ?? (draft.campaignId ? [draft.campaignId] : undefined);

        try {
            const created = await this.api.createCharacter({
                name: draft.name,
                playerName,
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
                detailBackgroundImageUrl: draft.detailBackgroundImageUrl || '',
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
            const [campaignDtos, accessibleCharacterDtos, libraries] = await Promise.all([
                this.api.getCampaignSummaries(),
                this.api.getAccessibleCharacters(),
                this.api.getUserLibraries()
            ]);

            this.applyUserLibraries(libraries);

            const characterMap = new Map<string, Character>();
            const characterLookup = new Map<string, ApiCharacterDto[]>();

            for (const characterDto of accessibleCharacterDtos) {
                const campaignIds = characterDto.campaignIds?.length
                    ? characterDto.campaignIds
                    : (characterDto.campaignId && characterDto.campaignId !== DungeonStoreService.UNASSIGNED_CAMPAIGN_ID
                        ? [characterDto.campaignId]
                        : []);

                for (const campaignId of campaignIds) {
                    const existingCharacters = characterLookup.get(campaignId) ?? [];
                    existingCharacters.push(characterDto);
                    characterLookup.set(campaignId, existingCharacters);
                }
            }

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

                return this.mapCampaignSummaryFromApi(campaignDto, mappedCharacters.map((character) => character.id));
            });

            for (const accessibleCharacterDto of accessibleCharacterDtos) {
                if (!characterMap.has(accessibleCharacterDto.id)) {
                    characterMap.set(accessibleCharacterDto.id, this.mapCharacterFromApi(accessibleCharacterDto));
                }
            }

            this.characters.set(Array.from(characterMap.values()));

            const existingCampaigns = this.campaigns();
            const mergedCampaigns = mappedCampaigns.map((mapped) => {
                const existing = existingCampaigns.find((c) => c.id === mapped.id);
                if (!existing?.detailsLoaded) {
                    return mapped;
                }

                return {
                    ...existing,
                    name: mapped.name,
                    setting: mapped.setting,
                    tone: mapped.tone,
                    levelStart: mapped.levelStart,
                    levelEnd: mapped.levelEnd,
                    levelRange: mapped.levelRange,
                    summary: mapped.summary,
                    hook: mapped.hook,
                    nextSession: mapped.nextSession,
                    characterCount: mapped.characterCount,
                    sessionCount: mapped.sessionCount,
                    npcCount: mapped.npcCount,
                    openThreadCount: mapped.openThreadCount,
                    currentUserRole: mapped.currentUserRole,
                    partyCharacterIds: mapped.partyCharacterIds
                };
            });
            this.campaigns.set(mergedCampaigns);

            const selected = this.selectedCampaignId();
            if (!selected) {
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
        const members = Array.isArray(campaign.members) ? campaign.members : [];

        const activeMapId = campaign.activeMapId?.trim() || campaign.maps?.[0]?.id?.trim() || '';
        const activeMapFromApi = this.mapCampaignMapFromApi(campaign.map);
        const maps = (campaign.maps?.length
            ? campaign.maps.map((map) => {
                const mappedBoard = this.mapCampaignMapBoardFromApi(map);
                return mappedBoard.id === activeMapId
                    ? {
                        ...mappedBoard,
                        ...activeMapFromApi
                    }
                    : mappedBoard;
            })
            : [{
                id: activeMapId || crypto.randomUUID(),
                name: 'Main Map',
                ...activeMapFromApi
            }]);
        const resolvedActiveMapId = activeMapId || maps[0]?.id || '';
        const activeMap = maps.find((map) => map.id === resolvedActiveMapId) ?? maps[0] ?? this.createEmptyCampaignMapBoard();

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
            characterCount: Math.max(campaign.characterCount ?? partyCharacterIds.length, partyCharacterIds.length),
            sessionCount: campaign.sessions?.length ?? 0,
            npcCount: Math.max(campaign.npcs?.length ?? 0, campaign.campaignNpcs?.length ?? 0),
            openThreadCount: campaign.openThreads?.length ?? 0,
            detailsLoaded: true,
            partyCharacterIds,
            sessions: (campaign.sessions ?? []).map((session) => ({
                id: session.id,
                title: session.title,
                date: session.date,
                location: session.location,
                objective: session.objective,
                threat: session.threat,
                isRevealedToPlayers: session.isRevealedToPlayers ?? false,
                detailsJson: session.detailsJson ?? null,
                lootAssignmentsJson: session.lootAssignmentsJson ?? null
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
                content: note.content,
                isRevealedToPlayers: note.isRevealedToPlayers ?? false
            })),
            map: this.mapCampaignMapFromApi(activeMap),
            maps,
            activeMapId: activeMap.id,
            loot: (campaign.loot ?? []).map((item) =>
                typeof item === 'string'
                    ? { name: item as string, sessionId: null }
                    : { name: (item as { name: string; sessionId?: string | null }).name, sessionId: (item as { name: string; sessionId?: string | null }).sessionId ?? null }
            ),
            npcs: [...(campaign.npcs ?? [])],
            campaignNpcs: (campaign.campaignNpcs ?? []).map((npc) => this.mapCampaignNpcFromApi(npc)),
            currentUserRole: campaign.currentUserRole ?? 'Member',
            members: members.map((member) => ({
                userId: member.userId,
                email: member.email,
                displayName: member.displayName,
                role: member.role,
                status: member.status
            })),
            customTablesJson: campaign.customTablesJson ?? '[]'
        };
    }

    private mapCampaignSummaryFromApi(campaign: ApiCampaignSummaryDto, partyCharacterIds: string[]): Campaign {
        const levelStart = Math.min(Math.max(Math.trunc(campaign.levelStart ?? 1), 1), 20);
        const levelEnd = Math.min(Math.max(Math.trunc(campaign.levelEnd ?? 4), levelStart), 20);
        const emptyMap = this.createEmptyCampaignMapBoard();

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
            characterCount: Math.max(campaign.characterCount ?? partyCharacterIds.length, partyCharacterIds.length),
            sessionCount: Math.max(0, campaign.sessionCount ?? 0),
            npcCount: Math.max(0, campaign.npcCount ?? 0),
            openThreadCount: Math.max(0, campaign.openThreadCount ?? 0),
            detailsLoaded: false,
            partyCharacterIds,
            sessions: [],
            openThreads: [],
            worldNotes: [],
            map: emptyMap,
            maps: [],
            activeMapId: '',
            loot: [],
            npcs: [],
            campaignNpcs: [],
            currentUserRole: campaign.currentUserRole,
            members: []
        };
    }

    private replaceCampaignFromApi(campaignId: string, updated: ApiCampaignDto): void {
        this.campaigns.update((campaigns) =>
            campaigns.map((campaign) => {
                if (campaign.id !== campaignId) {
                    return campaign;
                }

                const mapped = this.mapCampaignFromApi(updated, campaign.partyCharacterIds);
                this.syncKnownTokenMoveRevisions(mapped);
                return mapped;
            })
        );
    }

    private mapCampaignNpcFromApi(npc: ApiCampaignNpcDto): CampaignNpc {
        return {
            id: npc.id,
            name: npc.name,
            title: npc.title,
            race: npc.race,
            classOrRole: npc.classOrRole,
            faction: npc.faction,
            occupation: npc.occupation,
            age: npc.age,
            gender: npc.gender,
            alignment: npc.alignment,
            currentStatus: npc.currentStatus,
            location: npc.location,
            shortDescription: npc.shortDescription,
            appearance: npc.appearance,
            personalityTraits: [...(npc.personalityTraits ?? [])],
            ideals: [...(npc.ideals ?? [])],
            bonds: [...(npc.bonds ?? [])],
            flaws: [...(npc.flaws ?? [])],
            motivations: npc.motivations,
            goals: npc.goals,
            fears: npc.fears,
            secrets: [...(npc.secrets ?? [])],
            mannerisms: [...(npc.mannerisms ?? [])],
            voiceNotes: npc.voiceNotes,
            backstory: npc.backstory,
            notes: npc.notes,
            combatNotes: npc.combatNotes,
            statBlockReference: npc.statBlockReference,
            tags: [...(npc.tags ?? [])],
            relationships: (Array.isArray(npc.relationships) ? npc.relationships : []).map((relationship) => ({
                id: relationship.id,
                targetNpcId: relationship.targetNpcId,
                relationshipType: relationship.relationshipType,
                description: relationship.description
            })),
            questLinks: [...(npc.questLinks ?? [])],
            sessionAppearances: [...(npc.sessionAppearances ?? [])],
            inventory: [...(npc.inventory ?? [])],
            imageUrl: npc.imageUrl ?? '',
            hostility: npc.hostility === 'Friendly' || npc.hostility === 'Hostile' ? npc.hostility : 'Indifferent',
            isAlive: npc.isAlive ?? true,
            isImportant: npc.isImportant ?? false,
            updatedAt: npc.updatedAt ?? ''
        };
    }

    private mapCampaignNpcToApi(npc: CampaignNpc): ApiCampaignNpcDto {
        return {
            ...npc,
            id: this.toNpcApiId(npc.id),
            relationships: npc.relationships.map((relationship) => ({
                id: this.toNpcApiId(relationship.id),
                targetNpcId: this.toNpcApiId(relationship.targetNpcId),
                relationshipType: relationship.relationshipType,
                description: relationship.description
            }))
        };
    }

    private toNpcApiId(id: string): string {
        if (id.startsWith('npc-rel-')) return id.slice('npc-rel-'.length);
        if (id.startsWith('npc-')) return id.slice('npc-'.length);
        return id;
    }

    private async syncCampaignNpcNameFallback(campaignId: string, npc: CampaignNpc): Promise<boolean> {
        const campaign = this.campaigns().find((entry) => entry.id === campaignId) ?? null;
        const existingNpc = campaign?.campaignNpcs.find((entry) => entry.id === npc.id)
            ?? campaign?.campaignNpcs.find((entry) => entry.name.trim().toLowerCase() === npc.name.trim().toLowerCase())
            ?? null;

        if (!existingNpc) {
            return await this.addCampaignNpc(campaignId, npc.name);
        }

        if (existingNpc.name === npc.name) {
            return true;
        }

        const added = await this.addCampaignNpc(campaignId, npc.name);
        if (!added) {
            return false;
        }

        const removed = await this.removeCampaignNpc(campaignId, existingNpc.name);
        if (!removed) {
            await this.removeCampaignNpc(campaignId, npc.name);
            return false;
        }

        return true;
    }

    private tokenMoveRequestKey(campaignId: string, mapId: string, tokenId: string): string {
        return `${campaignId}:${mapId}:${tokenId}`;
    }

    private nextTokenMoveRevision(campaignId: string, mapId: string, tokenId: string): number {
        const requestKey = this.tokenMoveRequestKey(campaignId, mapId, tokenId);
        const knownRevision = Math.max(
            this.findTokenMoveRevision(campaignId, mapId, tokenId),
            this.latestKnownTokenMoveRevision.get(requestKey) ?? 0
        );
        const nextRevision = knownRevision + 1;
        this.latestKnownTokenMoveRevision.set(requestKey, nextRevision);
        return nextRevision;
    }

    private findTokenMoveRevision(campaignId: string, mapId: string, tokenId: string): number {
        const campaign = this.campaigns().find((entry) => entry.id === campaignId);
        if (!campaign) {
            return 0;
        }

        const map = campaign.maps.find((entry) => entry.id === mapId);
        const token = (map?.tokens ?? campaign.map.tokens).find((entry) => entry.id === tokenId);
        return token?.moveRevision ?? 0;
    }

    private isLatestTokenMoveRequest(requestKey: string, requestSequence: number): boolean {
        return this.latestTokenMoveRequestSequence.get(requestKey) === requestSequence;
    }

    private mapCampaignTokenFromApi(token: ApiCampaignMapTokenDto): CampaignMapToken {
        return {
            id: token.id,
            name: token.name?.trim() || 'Token',
            imageUrl: this.normalizeMapBackgroundImageUrl(token.imageUrl),
            x: this.normalizeMapCoordinate(token.x),
            y: this.normalizeMapCoordinate(token.y),
            size: this.normalizeMapTokenSize(token.size),
            note: token.note?.trim() || '',
            assignedUserId: token.assignedUserId?.trim() || null,
            assignedCharacterId: token.assignedCharacterId?.trim() || null,
            moveRevision: this.normalizeMapTokenMoveRevision(token.moveRevision)
        };
    }

    private mapCampaignVisionMemoryFromApi(entry: ApiCampaignMapVisionMemoryDto): CampaignMap['visionMemory'][number] {
        return {
            key: entry.key?.trim() || '',
            polygons: (entry.polygons ?? []).map((polygon) => ({
                points: (polygon.points ?? []).map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                }))
            })).filter((polygon) => polygon.points.length > 0),
            lastOrigin: entry.lastOrigin
                ? {
                    x: this.normalizeMapCoordinate(entry.lastOrigin.x),
                    y: this.normalizeMapCoordinate(entry.lastOrigin.y)
                }
                : null,
            lastPolygonHash: entry.lastPolygonHash?.trim() || '',
            revision: this.normalizeMapVisionRevision(entry.revision)
        };
    }

    private upsertMapToken(tokens: CampaignMapToken[], updatedToken: CampaignMapToken): CampaignMapToken[] {
        const existingIndex = tokens.findIndex((token) => token.id === updatedToken.id);
        if (existingIndex === -1) {
            return [...tokens, updatedToken];
        }

        const existingToken = tokens[existingIndex];
        if ((existingToken.moveRevision ?? 0) > updatedToken.moveRevision) {
            return tokens;
        }

        const next = [...tokens];
        next[existingIndex] = updatedToken;
        return next;
    }

    private upsertMapVisionMemory(entries: CampaignMap['visionMemory'], updatedEntry: CampaignMap['visionMemory'][number]): CampaignMap['visionMemory'] {
        const existingIndex = entries.findIndex((entry) => entry.key === updatedEntry.key);
        if (existingIndex === -1) {
            return [...entries, updatedEntry];
        }

        const existingEntry = entries[existingIndex];
        if ((existingEntry.revision ?? 0) > updatedEntry.revision) {
            return entries;
        }

        const next = [...entries];
        next[existingIndex] = updatedEntry;
        return next;
    }

    private syncKnownTokenMoveRevisions(campaign: Campaign): void {
        for (const map of campaign.maps) {
            for (const token of map.tokens) {
                const requestKey = this.tokenMoveRequestKey(campaign.id, map.id, token.id);
                this.latestKnownTokenMoveRevision.set(
                    requestKey,
                    Math.max(this.latestKnownTokenMoveRevision.get(requestKey) ?? 0, token.moveRevision ?? 0)
                );
            }
        }
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
            gridColumns: this.normalizeMapGridCount(map?.gridColumns, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS),
            gridRows: this.normalizeMapGridCount(map?.gridRows, DEFAULT_CAMPAIGN_MAP_GRID_ROWS),
            gridColor: this.normalizeMapGridColor(map?.gridColor, map?.background),
            gridOffsetX: this.normalizeMapGridOffset(map?.gridOffsetX, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X),
            gridOffsetY: this.normalizeMapGridOffset(map?.gridOffsetY, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y),
            membersCanViewAnytime: map?.membersCanViewAnytime ?? false,
            strokes: (map?.strokes ?? []).map((stroke) => ({
                id: stroke.id,
                color: this.normalizeMapColor(stroke.color),
                width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                points: (stroke.points ?? []).map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                }))
            })).filter((stroke) => stroke.points.length > 0),
            walls: (map?.walls ?? []).map((wall) => ({
                id: wall.id,
                color: this.normalizeMapColor(wall.color),
                width: Math.max(2, Math.min(18, Math.trunc(wall.width || 4))),
                points: (wall.points ?? []).map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                })),
                blocksVision: wall.blocksVision ?? true,
                blocksMovement: wall.blocksMovement ?? true
            })).filter((wall) => wall.points.length > 0),
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
                size: this.normalizeMapTokenSize(token.size),
                note: token.note?.trim() || '',
                assignedUserId: token.assignedUserId?.trim() || null,
                assignedCharacterId: token.assignedCharacterId?.trim() || null,
                moveRevision: this.normalizeMapTokenMoveRevision(token.moveRevision)
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
                rotation: this.normalizeMapRotation(label.rotation),
                style: this.normalizeMapLabelStyle(label.style, label.tone)
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
            },
            visionMemory: (map?.visionMemory ?? []).map((entry) => ({
                key: entry.key?.trim() || '',
                polygons: (entry.polygons ?? []).map((polygon) => ({
                    points: (polygon.points ?? []).map((point) => ({
                        x: this.normalizeMapCoordinate(point.x),
                        y: this.normalizeMapCoordinate(point.y)
                    }))
                })).filter((polygon) => polygon.points.length > 0),
                lastOrigin: entry.lastOrigin
                    ? {
                        x: this.normalizeMapCoordinate(entry.lastOrigin.x),
                        y: this.normalizeMapCoordinate(entry.lastOrigin.y)
                    }
                    : null,
                lastPolygonHash: entry.lastPolygonHash?.trim() || '',
                revision: this.normalizeMapVisionRevision(entry.revision)
            })).filter((entry) => !!entry.key && entry.polygons.length > 0),
            visionEnabled: map?.visionEnabled ?? true
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
            gridColumns: this.normalizeMapGridCount(map.gridColumns, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS),
            gridRows: this.normalizeMapGridCount(map.gridRows, DEFAULT_CAMPAIGN_MAP_GRID_ROWS),
            gridColor: this.normalizeMapGridColor(map.gridColor, map.background),
            gridOffsetX: this.normalizeMapGridOffset(map.gridOffsetX, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X),
            gridOffsetY: this.normalizeMapGridOffset(map.gridOffsetY, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y),
            membersCanViewAnytime: map.membersCanViewAnytime,
            strokes: map.strokes.map((stroke) => ({
                id: stroke.id,
                color: this.normalizeMapColor(stroke.color),
                width: Math.max(2, Math.min(18, Math.trunc(stroke.width || 4))),
                points: stroke.points.map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                }))
            })),
            walls: map.walls.map((wall) => ({
                id: wall.id,
                color: this.normalizeMapColor(wall.color),
                width: Math.max(2, Math.min(18, Math.trunc(wall.width || 4))),
                points: wall.points.map((point) => ({
                    x: this.normalizeMapCoordinate(point.x),
                    y: this.normalizeMapCoordinate(point.y)
                })),
                blocksVision: wall.blocksVision,
                blocksMovement: wall.blocksMovement
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
                size: this.normalizeMapTokenSize(token.size),
                note: token.note?.trim() || '',
                assignedUserId: token.assignedUserId?.trim() || null,
                assignedCharacterId: token.assignedCharacterId?.trim() || null,
                moveRevision: this.normalizeMapTokenMoveRevision(token.moveRevision)
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
                rotation: this.normalizeMapRotation(label.rotation),
                style: this.normalizeMapLabelStyleToApi(label.style, label.tone)
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
            },
            visionMemory: map.visionMemory.map((entry) => ({
                key: entry.key.trim(),
                polygons: entry.polygons.map((polygon) => ({
                    points: polygon.points.map((point) => ({
                        x: this.normalizeMapCoordinate(point.x),
                        y: this.normalizeMapCoordinate(point.y)
                    }))
                })).filter((polygon) => polygon.points.length > 0),
                lastOrigin: entry.lastOrigin
                    ? {
                        x: this.normalizeMapCoordinate(entry.lastOrigin.x),
                        y: this.normalizeMapCoordinate(entry.lastOrigin.y)
                    }
                    : null,
                lastPolygonHash: entry.lastPolygonHash,
                revision: this.normalizeMapVisionRevision(entry.revision)
            })).filter((entry) => !!entry.key && entry.polygons.length > 0),
            visionEnabled: map.visionEnabled
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
        const draftMaxHitPoints = typeof draft?.maxHitPoints === 'number' && Number.isFinite(draft.maxHitPoints)
            ? draft.maxHitPoints
            : undefined;
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
            image: draft?.image || character.portraitUrl || '',
            detailBackgroundImageUrl: draft?.detailBackgroundImageUrl || character.detailBackgroundImageUrl || ''
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
                religion: Boolean(parsed.religion),
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
            case 'Battlemap':
                return background;
            default:
                return 'Parchment';
        }
    }

    private normalizeMapBackgroundImageUrl(value: string | undefined): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private normalizeMapGridCount(value: number | undefined, fallback: number): number {
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
            return fallback;
        }

        return Math.max(8, Math.min(60, Math.round(Number(value) * 2) / 2));
    }

    private normalizeMapGridColor(value: string | undefined, background: string | undefined): string {
        const normalizedBackground = this.normalizeMapBackground(background);
        const trimmed = value?.trim().toLowerCase();

        if (trimmed && /^#[0-9a-f]{6}$/i.test(trimmed)) {
            return trimmed;
        }

        return this.defaultGridColorForBackground(normalizedBackground);
    }

    private normalizeMapGridOffset(value: number | undefined, fallback: number): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(-1, Math.min(1, Math.round(Number(value) * 20) / 20));
    }

    private defaultGridColorForBackground(background: CampaignMapBackground): string {
        switch (background) {
            case 'Coast':
                return '#3f667e';
            case 'City':
                return '#594532';
            case 'Cavern':
                return '#4a5f3e';
            case 'Battlemap':
                return '#584f43';
            default:
                return DEFAULT_CAMPAIGN_MAP_GRID_COLOR;
        }
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

    private normalizeMapLabelStyle(style: ApiCampaignMapLabelStyleDto | CampaignMapLabelStyle | undefined, tone: ApiCampaignMapLabelDto['tone'] | string | undefined): CampaignMapLabelStyle {
        const normalizedTone = this.normalizeMapLabelTone(tone);
        const defaults = this.defaultMapLabelStyle(normalizedTone);

        return {
            color: this.normalizeMapLabelColor(style?.color, normalizedTone),
            backgroundColor: this.normalizeMapLabelBackgroundColor(style?.backgroundColor, normalizedTone),
            borderColor: this.normalizeMapLabelBorderColor(style?.borderColor, normalizedTone),
            fontFamily: this.normalizeMapLabelFontFamily(style?.fontFamily, normalizedTone),
            fontSize: this.normalizeMapLabelFontSize(style?.fontSize, normalizedTone),
            fontWeight: this.normalizeMapLabelFontWeight(style?.fontWeight, normalizedTone),
            letterSpacing: this.normalizeMapLabelLetterSpacing(style?.letterSpacing, normalizedTone),
            fontStyle: style?.fontStyle === 'italic' ? 'italic' : defaults.fontStyle,
            textTransform: style?.textTransform === 'none' ? 'none' : defaults.textTransform,
            borderWidth: this.normalizeMapLabelBorderWidth(style?.borderWidth, normalizedTone),
            borderRadius: this.normalizeMapLabelBorderRadius(style?.borderRadius, normalizedTone),
            paddingX: this.normalizeMapLabelPaddingX(style?.paddingX, normalizedTone),
            paddingY: this.normalizeMapLabelPaddingY(style?.paddingY, normalizedTone),
            textShadow: this.normalizeMapLabelTextShadow(style?.textShadow, normalizedTone),
            boxShadow: this.normalizeMapLabelBoxShadow(style?.boxShadow, normalizedTone),
            opacity: this.normalizeMapLabelOpacity(style?.opacity, normalizedTone)
        };
    }

    private normalizeMapLabelStyleToApi(style: CampaignMapLabelStyle | undefined, tone: CampaignMapLabelTone): ApiCampaignMapLabelStyleDto {
        const normalized = this.normalizeMapLabelStyle(style, tone);

        return {
            color: normalized.color,
            backgroundColor: normalized.backgroundColor,
            borderColor: normalized.borderColor,
            fontFamily: normalized.fontFamily,
            fontSize: normalized.fontSize,
            fontWeight: normalized.fontWeight,
            letterSpacing: normalized.letterSpacing,
            fontStyle: normalized.fontStyle,
            textTransform: normalized.textTransform,
            borderWidth: normalized.borderWidth,
            borderRadius: normalized.borderRadius,
            paddingX: normalized.paddingX,
            paddingY: normalized.paddingY,
            textShadow: normalized.textShadow,
            boxShadow: normalized.boxShadow,
            opacity: normalized.opacity
        };
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

    private normalizeMapLabelColor(color: string | undefined, tone: CampaignMapLabelTone): string {
        return this.normalizeMapLabelCssColor(color, this.defaultMapLabelStyle(tone).color);
    }

    private normalizeMapLabelBackgroundColor(color: string | undefined, tone: CampaignMapLabelTone): string {
        return this.normalizeMapLabelCssColor(color, this.defaultMapLabelStyle(tone).backgroundColor);
    }

    private normalizeMapLabelBorderColor(color: string | undefined, tone: CampaignMapLabelTone): string {
        return this.normalizeMapLabelCssColor(color, this.defaultMapLabelStyle(tone).borderColor);
    }

    private normalizeMapLabelFontFamily(fontFamily: ApiCampaignMapLabelStyleDto['fontFamily'] | CampaignMapLabelStyle['fontFamily'] | undefined, tone: CampaignMapLabelTone): CampaignMapLabelStyle['fontFamily'] {
        if (fontFamily === 'body' || fontFamily === 'display') {
            return fontFamily;
        }

        return this.defaultMapLabelStyle(tone).fontFamily;
    }

    private normalizeMapLabelFontSize(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).fontSize;
        }

        return Math.max(0.72, Math.min(2.4, Number(value)));
    }

    private normalizeMapLabelFontWeight(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).fontWeight;
        }

        return Math.max(400, Math.min(800, Math.round(Number(value) / 50) * 50));
    }

    private normalizeMapLabelLetterSpacing(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).letterSpacing;
        }

        return Math.max(-0.04, Math.min(0.32, Number(value)));
    }

    private normalizeMapLabelBorderWidth(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).borderWidth;
        }

        return Math.max(0, Math.min(6, Number(value)));
    }

    private normalizeMapLabelBorderRadius(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).borderRadius;
        }

        return Math.max(0, Math.min(32, Number(value)));
    }

    private normalizeMapLabelPaddingX(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).paddingX;
        }

        return Math.max(0, Math.min(24, Number(value)));
    }

    private normalizeMapLabelPaddingY(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).paddingY;
        }

        return Math.max(0, Math.min(16, Number(value)));
    }

    private normalizeMapLabelTextShadow(value: string | undefined, tone: CampaignMapLabelTone): string {
        return this.normalizeMapLabelCssEffect(value, this.defaultMapLabelStyle(tone).textShadow);
    }

    private normalizeMapLabelBoxShadow(value: string | undefined, tone: CampaignMapLabelTone): string {
        return this.normalizeMapLabelCssEffect(value, this.defaultMapLabelStyle(tone).boxShadow);
    }

    private normalizeMapLabelOpacity(value: number | undefined, tone: CampaignMapLabelTone): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return this.defaultMapLabelStyle(tone).opacity;
        }

        return Math.max(0.45, Math.min(1, Number(value)));
    }

    private defaultMapLabelStyle(tone: CampaignMapLabelTone): CampaignMapLabelStyle {
        if (tone === 'Feature') {
            return {
                color: '#f6ead8',
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                fontFamily: 'body',
                fontSize: 0.84,
                fontWeight: 600,
                letterSpacing: 0.08,
                fontStyle: 'italic',
                textTransform: 'none',
                borderWidth: 0,
                borderRadius: 8,
                paddingX: 0,
                paddingY: 0,
                textShadow: '0 1px 0 rgba(43, 28, 19, 0.72), 0 2px 10px rgba(0, 0, 0, 0.34)',
                boxShadow: 'none',
                opacity: 0.98
            };
        }

        return {
            color: '#fff4e5',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            fontFamily: 'display',
            fontSize: 1,
            fontWeight: 650,
            letterSpacing: 0.18,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            borderWidth: 0,
            borderRadius: 8,
            paddingX: 0,
            paddingY: 0,
            textShadow: '0 1px 0 rgba(43, 28, 19, 0.78), 0 2px 12px rgba(0, 0, 0, 0.4)',
            boxShadow: 'none',
            opacity: 1
        };
    }

    private normalizeMapLabelCssColor(value: string | undefined, fallback: string): string {
        const trimmed = value?.trim();
        if (!trimmed) {
            return fallback;
        }

        return /^(transparent|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(trimmed)
            ? trimmed
            : fallback;
    }

    private normalizeMapLabelCssEffect(value: string | undefined, fallback: string): string {
        const trimmed = value?.trim();
        if (!trimmed) {
            return fallback;
        }

        return trimmed.length <= 120 && /^(none|[a-z0-9#(),.%\s+-]+)$/i.test(trimmed)
            ? trimmed
            : fallback;
    }

    private normalizeMapCoordinate(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0.5;
        }

        return Math.max(0, Math.min(1, value));
    }

    private spreadGeneratedMapLabels(labels: Campaign['map']['labels']): Campaign['map']['labels'] {
        if (labels.length < 2) {
            return labels;
        }

        const spread = labels.map((label) => ({ ...label, style: { ...label.style } }));

        for (let iteration = 0; iteration < 12; iteration += 1) {
            let moved = false;

            for (let index = 0; index < spread.length; index += 1) {
                for (let compareIndex = index + 1; compareIndex < spread.length; compareIndex += 1) {
                    const current = spread[index];
                    const other = spread[compareIndex];
                    const currentBox = this.estimateGeneratedMapLabelFootprint(current);
                    const otherBox = this.estimateGeneratedMapLabelFootprint(other);
                    const deltaX = other.x - current.x;
                    const deltaY = other.y - current.y;
                    const minDeltaX = (currentBox.width + otherBox.width) * 0.5;
                    const minDeltaY = (currentBox.height + otherBox.height) * 0.5;

                    if (Math.abs(deltaX) >= minDeltaX || Math.abs(deltaY) >= minDeltaY) {
                        continue;
                    }

                    const fallbackX = index % 2 === 0 ? -1 : 1;
                    const fallbackY = compareIndex % 2 === 0 ? -1 : 1;
                    const directionX = Math.abs(deltaX) < 0.0001 ? fallbackX : Math.sign(deltaX);
                    const directionY = Math.abs(deltaY) < 0.0001 ? fallbackY : Math.sign(deltaY);
                    const pushX = ((minDeltaX - Math.abs(deltaX)) * 0.5) + 0.008;
                    const pushY = ((minDeltaY - Math.abs(deltaY)) * 0.5) + 0.008;

                    current.x = this.clampGeneratedLabelCoordinate(current.x - (directionX * pushX));
                    other.x = this.clampGeneratedLabelCoordinate(other.x + (directionX * pushX));
                    current.y = this.clampGeneratedLabelCoordinate(current.y - (directionY * pushY));
                    other.y = this.clampGeneratedLabelCoordinate(other.y + (directionY * pushY));
                    moved = true;
                }
            }

            if (!moved) {
                break;
            }
        }

        return spread;
    }

    private estimateGeneratedMapLabelFootprint(label: Campaign['map']['labels'][number]): { width: number; height: number } {
        const characterWidth = label.tone === 'Feature' ? 0.0105 : 0.0125;
        const width = Math.min(
            0.34,
            0.034 + (label.text.trim().length * label.style.fontSize * characterWidth) + (label.style.paddingX * 0.0032)
        );
        const height = Math.min(
            0.095,
            0.024 + (label.style.fontSize * 0.028) + (label.style.paddingY * 0.0042) + (label.style.borderWidth * 0.002)
        );

        return { width, height };
    }

    private clampGeneratedLabelCoordinate(value: number): number {
        return Math.max(0.08, Math.min(0.92, value));
    }

    private normalizeMapScale(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 1;
        }

        return Math.max(0.55, Math.min(1.8, value));
    }

    private normalizeMapTokenSize(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 1;
        }

        const tokenGridSpans = [0.5, 1, 2, 4] as const;

        return tokenGridSpans.reduce((closest, span) => {
            return Math.abs(span - value) < Math.abs(closest - value) ? span : closest;
        }, tokenGridSpans[0]);
    }

    private normalizeMapTokenMoveRevision(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.trunc(value));
    }

    private normalizeMapVisionRevision(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.trunc(value));
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
        const previous = previousNotes?.trim() ?? '';
        const hasPreviousBuilderState = previous.length > 0 && this.hasBuilderStateBlock(previous);

        if (this.hasBuilderStateBlock(notes)) {
            return notes;
        }

        if (this.hasBuilderStateBlock(backstory)) {
            return backstory;
        }

        if (notes) {
            if (hasPreviousBuilderState) {
                return this.mergeVisibleNotesWithBuilderState(previous, notes);
            }

            return notes;
        }

        if (backstory) {
            if (hasPreviousBuilderState) {
                return this.mergeVisibleNotesWithBuilderState(previous, backstory);
            }

            return backstory;
        }

        return previous || 'No field notes yet.';
    }

    private hasBuilderStateBlock(text: string): boolean {
        return text.includes(DungeonStoreService.BUILDER_STATE_START_TAG)
            && text.includes(DungeonStoreService.BUILDER_STATE_END_TAG);
    }

    private parseBuilderStateFromNotes(notes: string): Record<string, unknown> | null {
        if (!this.hasBuilderStateBlock(notes)) {
            return null;
        }

        const start = notes.indexOf(DungeonStoreService.BUILDER_STATE_START_TAG);
        const end = notes.indexOf(DungeonStoreService.BUILDER_STATE_END_TAG);
        if (start === -1 || end === -1 || end < start) {
            return null;
        }

        const jsonText = notes
            .slice(start + DungeonStoreService.BUILDER_STATE_START_TAG.length, end)
            .trim();

        if (!jsonText) {
            return null;
        }

        try {
            const parsed = JSON.parse(jsonText);
            return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
        } catch {
            return null;
        }
    }

    private resolveClassNameForSave(draftClassName: string, notes: string, fallbackClassName?: string): string {
        const normalizedDraftClassName = draftClassName.trim();
        if (normalizedDraftClassName) {
            return normalizedDraftClassName;
        }

        const parsedState = this.parseBuilderStateFromNotes(notes);
        const stateClassName = typeof parsedState?.['selectedClass'] === 'string'
            ? parsedState['selectedClass'].trim()
            : '';

        return stateClassName || fallbackClassName?.trim() || '';
    }

    private resolveCharacterLevelForSave(draftLevel: number, notes: string, fallbackLevel?: number): number {
        if (Number.isFinite(draftLevel) && draftLevel > 0) {
            return Math.min(20, Math.max(1, Math.trunc(draftLevel)));
        }

        const parsedState = this.parseBuilderStateFromNotes(notes);

        const directStateLevel = parsedState?.['characterLevel'];
        if (typeof directStateLevel === 'number' && Number.isFinite(directStateLevel)) {
            return Math.min(20, Math.max(1, Math.trunc(directStateLevel)));
        }

        const multiclassList = parsedState?.['multiclassList'];
        if (multiclassList && typeof multiclassList === 'object') {
            const levels = Object.values(multiclassList as Record<string, unknown>)
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0);

            if (levels.length > 0) {
                return Math.min(20, Math.max(1, Math.trunc(levels[0] as number)));
            }
        }

        if (Number.isFinite(fallbackLevel) && (fallbackLevel ?? 0) > 0) {
            return Math.min(20, Math.max(1, Math.trunc(fallbackLevel as number)));
        }

        return 1;
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
            religion: false,
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
        if (!current || !this.canManageCharacterInCampaign(current)) {
            return;
        }

        const normalizedCurrentStatus = current.status === 'Inactive' ? 'Ready' : current.status;
        const currentIndex = statusOrder.indexOf(normalizedCurrentStatus);
        const nextStatus = statusOrder[(currentIndex + 1 + statusOrder.length) % statusOrder.length];
        await this.setCharacterStatusFromApi(characterId, nextStatus);
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

    private applyCharacterCampaignUpdate(characterId: string, updated: ApiCharacterDto): void {
        const nextCampaignIds = updated.campaignIds ?? (updated.campaignId ? [updated.campaignId] : []);

        this.characters.update((characters) =>
            characters.map((character) =>
                character.id === characterId
                    ? {
                        ...character,
                        campaignId: updated.campaignId,
                        campaignIds: nextCampaignIds
                    }
                    : character
            )
        );

        this.campaigns.update((campaigns) =>
            campaigns.map((campaign) => {
                const isCurrentCampaign = campaign.partyCharacterIds.includes(characterId);
                const shouldContain = nextCampaignIds.includes(campaign.id);

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
    }

    private canManageCharacterInCampaign(character: Character): boolean {
        if (character.canEdit !== false) {
            return true;
        }

        const campaignIds = Array.from(new Set([character.campaignId, ...(character.campaignIds ?? [])].filter(Boolean)));
        return campaignIds.some((campaignId) => this.canManageCampaignContent(campaignId));
    }

    private async setCharacterStatusFromApi(characterId: string, status: CharacterStatus): Promise<boolean> {
        const current = this.characters().find((character) => character.id === characterId);
        if (!current || !this.canManageCharacterInCampaign(current)) {
            return false;
        }

        try {
            const updated = await this.api.updateCharacterStatus(characterId, status);
            this.characters.update((characters) =>
                characters.map((character) =>
                    character.id === characterId
                        ? { ...character, status: updated.status as CharacterStatus }
                        : character
                )
            );
            return true;
        } catch {
            return false;
        }
    }

    private clearState(): void {
        this.latestTokenMoveRequestSequence.clear();
        this.latestKnownTokenMoveRevision.clear();
        this.campaigns.set([]);
        this.characters.set([]);
        this.userNpcLibrary.set([]);
        this.userCustomTableLibrary.set([]);
        this.userMonsterLibrary.set([]);
        this.userMonsterReference.set([]);
        this.selectedCampaignId.set('');
    }

    private applyUserLibraries(libraries: UserLibrariesDto): void {
        this.userNpcLibrary.set(this.parseJsonArray(libraries.npcLibraryJson));
        this.userCustomTableLibrary.set(this.parseJsonArray(libraries.customTableLibraryJson));
        this.userMonsterLibrary.set(this.parseJsonArray(libraries.monsterLibraryJson));
        this.userMonsterReference.set(this.parseJsonArray(libraries.monsterReferenceJson));
    }

    private parseJsonArray(json: string): unknown[] {
        if (!json?.trim()) {
            return [];
        }

        try {
            const parsed = JSON.parse(json);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private canManageCampaignContent(campaignId: string): boolean {
        if (!campaignId) {
            return false;
        }

        return this.campaigns().some((campaign) => campaign.id === campaignId && campaign.currentUserRole === 'Owner');
    }
}
