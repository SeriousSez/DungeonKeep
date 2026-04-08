import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

type ApiCampaignTone =
    | 'Heroic'
    | 'Grim'
    | 'Mystic'
    | 'Chaotic'
    | 'Grimdark'
    | 'Gothic'
    | 'Horror'
    | 'Noblebright'
    | 'Sword-and-Sorcery'
    | 'Political Intrigue'
    | 'Mythic'
    | 'Survival'
    | 'Pulp Adventure'
    | 'Dark Fantasy'
    | 'Whimsical'
    | 'Noir'
    | 'Epic War'
    | 'Cosmic'
    | 'Heroic Tragedy';

export interface ApiCampaignDto {
    id: string;
    name: string;
    setting: string;
    tone: ApiCampaignTone;
    levelStart: number;
    levelEnd: number;
    hook: string;
    nextSession: string;
    summary: string;
    createdAtUtc: string;
    characterCount: number;
    sessions: ApiCampaignSessionDto[];
    npcs: string[];
    loot: string[];
    openThreads: ApiCampaignThreadDto[];
    worldNotes: ApiCampaignWorldNoteDto[];
    map: ApiCampaignMapDto;
    maps: ApiCampaignMapBoardDto[];
    activeMapId: string;
    currentUserRole: 'Owner' | 'Member';
    members: ApiCampaignMemberDto[];
}

export interface ApiCampaignSessionDto {
    id: string;
    title: string;
    date: string;
    location: string;
    objective: string;
    threat: 'Low' | 'Moderate' | 'High' | 'Deadly';
}

export interface ApiCampaignThreadDto {
    id: string;
    text: string;
    visibility: 'Party' | 'GMOnly';
}

export interface ApiCampaignWorldNoteDto {
    id: string;
    title: string;
    category: 'Backstory' | 'Organization' | 'Ally' | 'Enemy' | 'Location' | 'Lore' | 'Custom';
    content: string;
}

export interface ApiCampaignMapDto {
    background: 'Parchment' | 'Cavern' | 'Coast' | 'City';
    backgroundImageUrl: string;
    strokes: ApiCampaignMapStrokeDto[];
    icons: ApiCampaignMapIconDto[];
    tokens: ApiCampaignMapTokenDto[];
    decorations: ApiCampaignMapDecorationDto[];
    labels: ApiCampaignMapLabelDto[];
    layers: ApiCampaignMapLayersDto;
}

export interface ApiCampaignMapBoardDto extends ApiCampaignMapDto {
    id: string;
    name: string;
}

export interface ApiCampaignMapLibraryDto {
    activeMapId: string;
    maps: ApiCampaignMapBoardDto[];
}

export interface ApiGenerateCampaignMapArtRequest {
    background: ApiCampaignMapDto['background'];
    mapName: string;
    separateLabels?: boolean;
    settlementScale?: 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis';
    parchmentLayout?: 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular';
    cavernLayout?: 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes';
    preferredPlaceNames?: string[];
    settlementNames?: string[];
    regionNames?: string[];
    ruinNames?: string[];
    cavernNames?: string[];
    additionalDirection?: string;
}

export interface ApiGenerateCampaignMapArtResponse {
    backgroundImageUrl: string;
    labels: ApiCampaignMapLabelDto[];
}

export interface ApiCampaignMapStrokeDto {
    id: string;
    color: string;
    width: number;
    points: ApiCampaignMapPointDto[];
}

export interface ApiCampaignMapPointDto {
    x: number;
    y: number;
}

export interface ApiCampaignMapIconDto {
    id: string;
    type: 'Keep' | 'Town' | 'Camp' | 'Dungeon' | 'Danger' | 'Treasure' | 'Portal' | 'Tower';
    label: string;
    x: number;
    y: number;
}

export interface ApiCampaignMapTokenDto {
    id: string;
    name: string;
    imageUrl: string;
    x: number;
    y: number;
    size: number;
    note: string;
}

export interface ApiCampaignMapDecorationDto {
    id: string;
    type: 'Forest' | 'Mountain' | 'Hill' | 'Reef' | 'Cave' | 'Ward';
    color?: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}

export interface ApiCampaignMapLabelDto {
    id: string;
    text: string;
    tone: 'Region' | 'Feature';
    x: number;
    y: number;
    rotation: number;
    style?: ApiCampaignMapLabelStyleDto;
}

export interface ApiCampaignMapLabelStyleDto {
    color: string;
    backgroundColor: string;
    borderColor: string;
    fontFamily: 'display' | 'body';
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    fontStyle: 'normal' | 'italic';
    textTransform: 'none' | 'uppercase';
    borderWidth: number;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    textShadow: string;
    boxShadow: string;
    opacity: number;
}

export interface ApiCampaignMapLayersDto {
    rivers: ApiCampaignMapStrokeDto[];
    mountainChains: ApiCampaignMapDecorationDto[];
    forestBelts: ApiCampaignMapDecorationDto[];
}

export interface ApiCampaignMemberDto {
    userId: string | null;
    email: string;
    displayName: string;
    role: 'Owner' | 'Member';
    status: 'Active' | 'Pending';
}

export interface ApiCharacterDto {
    id: string;
    campaignId: string;
    campaignIds: string[];
    ownerUserId: string | null;
    ownerDisplayName: string;
    name: string;
    playerName: string;
    className: string;
    level: number;
    status: 'Ready' | 'Resting' | 'Recovering';
    background: string;
    notes: string;
    backstory: string;
    species: string;
    alignment: string;
    lifestyle: string;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    equipment: string;
    abilityScores: string;
    skills: string;
    savingThrows: string;
    hitPoints: number;
    deathSaveFailures: number;
    deathSaveSuccesses: number;
    armorClass: number;
    combatStats: string;
    spells: string;
    experiencePoints: number;
    portraitUrl: string;
    goals: string;
    secrets: string;
    sessionHistory: string;
    createdAtUtc: string;
    canEdit: boolean;
}

export interface ApiAuthUserDto {
    id: string;
    email: string;
    displayName: string;
}

export interface ApiAuthSessionDto {
    token: string;
    user: ApiAuthUserDto;
}

export interface ApiSignupPendingActivationDto {
    email: string;
    message: string;
}

export interface ApiActivationResultDto {
    email: string;
    message: string;
}

export interface ApiGenerateCharacterBackstoryRequest {
    className: string;
    background: string;
    species: string;
    alignment: string;
    lifestyle: string;
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    additionalDirection: string;
}

export interface ApiGenerateCharacterBackstoryResponse {
    backstory: string;
}

export interface ApiDndChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ApiDndChatCharacterContext {
    id: string;
    name: string;
    playerName: string;
    race: string;
    className: string;
    level: number;
    role: string;
    status: string;
    background: string;
    armorClass: number;
    hitPoints: number;
    maxHitPoints: number;
    proficiencyBonus: number;
    backstory: string;
    abilityScores: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    raceTraits: string[];
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
}

export interface ApiDndChatCampaignPartyMemberContext {
    id: string;
    name: string;
    race: string;
    className: string;
    level: number;
    role: string;
    status: string;
    background: string;
    backstory: string;
    raceTraits: string[];
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
}

export interface ApiDndChatCampaignSessionContext {
    id: string;
    title: string;
    date: string;
    location: string;
    objective: string;
    threat: string;
}

export interface ApiDndChatCampaignWorldNoteContext {
    id: string;
    title: string;
    category: string;
    content: string;
}

export interface ApiDndChatCampaignMemberContext {
    userId?: string | null;
    email: string;
    displayName: string;
    role: string;
    status: string;
}

export interface ApiDndChatCampaignMapContext {
    id: string;
    name: string;
    background: string;
    locationLabels: string[];
    tokenNames: string[];
    iconLabels: string[];
}

export interface ApiDndChatCampaignContext {
    id: string;
    name: string;
    setting: string;
    tone: string;
    levelRange: string;
    summary: string;
    hook: string;
    nextSession: string;
    currentUserRole?: string;
    playerCount: number;
    party: ApiDndChatCampaignPartyMemberContext[];
    sessions: ApiDndChatCampaignSessionContext[];
    openThreads: string[];
    worldNotes: ApiDndChatCampaignWorldNoteContext[];
    npcs: string[];
    loot: string[];
    members: ApiDndChatCampaignMemberContext[];
    maps: ApiDndChatCampaignMapContext[];
    activeMapId: string;
}

export interface ApiDndChatSessionContext {
    id: string;
    title: string;
    date: string;
    location: string;
    objective: string;
    threat: string;
    shortDescription: string;
    estimatedLength: string;
    notes: string;
    scenes: string[];
    npcs: string[];
    monsters: string[];
    locations: string[];
    loot: string[];
    skillChecks: string[];
    secrets: string[];
    branchingPaths: string[];
    nextSessionHooks: string[];
}

export interface ApiDndChatNpcRelationshipContext {
    target: string;
    type: string;
    description: string;
}

export interface ApiDndChatNpcContext {
    id: string;
    name: string;
    title: string;
    race: string;
    classOrRole: string;
    faction: string;
    occupation: string;
    alignment: string;
    currentStatus: string;
    location: string;
    shortDescription: string;
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    motivations: string;
    goals: string;
    fears: string;
    secrets: string[];
    mannerisms: string[];
    voiceNotes: string;
    backstory: string;
    notes: string;
    combatNotes: string;
    tags: string[];
    relationships: ApiDndChatNpcRelationshipContext[];
    questLinks: string[];
    sessionAppearances: string[];
    inventory: string[];
    hostility: string;
    isAlive: boolean;
    isImportant: boolean;
}

export interface ApiDndChatPageContext {
    route: string;
    pageType: string;
    character?: ApiDndChatCharacterContext;
    campaign?: ApiDndChatCampaignContext;
    session?: ApiDndChatSessionContext;
    npc?: ApiDndChatNpcContext;
}

export interface ApiDndChatRequest {
    message: string;
    history?: ApiDndChatMessage[];
    pageContext?: ApiDndChatPageContext;
}

export interface ApiDndChatResponse {
    reply: string;
}

export interface ApiGenerateCampaignDraftRequest {
    tone: ApiCampaignTone;
    settingHint: string;
    additionalDirection: string;
    levelStart: number;
    levelEnd: number;
}

export interface ApiGenerateCampaignDraftResponse {
    name: string;
    setting: string;
    tone: ApiCampaignTone;
    levelStart: number;
    levelEnd: number;
    hook: string;
    nextSession: string;
    summary: string;
}

export interface ApiGenerateSessionDraftRequest {
    titleHint: string;
    shortDescriptionHint: string;
    locationHint: string;
    estimatedLengthHint: string;
    markdownNotesHint: string;
}

export interface ApiGenerateSessionSceneResponse {
    title: string;
    description: string;
    trigger: string;
    keyEvents: string[];
    possibleOutcomes: string[];
}

export interface ApiGenerateSessionNpcResponse {
    name: string;
    role: string;
    personality: string;
    motivation: string;
    voiceNotes: string;
}

export interface ApiGenerateSessionMonsterResponse {
    name: string;
    type: string;
    challengeRating: string;
    hp: number;
    keyAbilities: string;
    notes: string;
}

export interface ApiGenerateSessionLocationResponse {
    name: string;
    description: string;
    secrets: string;
    encounters: string;
}

export interface ApiGenerateSessionLootItemResponse {
    name: string;
    type: string;
    quantity: number;
    notes: string;
}

export interface ApiGenerateSessionSkillCheckResponse {
    situation: string;
    skill: string;
    dc: number;
    successOutcome: string;
    failureOutcome: string;
}

export interface ApiGenerateSessionDraftResponse {
    title: string;
    shortDescription: string;
    date: string;
    inGameLocation: string;
    estimatedLength: string;
    markdownNotes: string;
    scenes: ApiGenerateSessionSceneResponse[];
    npcs: ApiGenerateSessionNpcResponse[];
    monsters: ApiGenerateSessionMonsterResponse[];
    locations: ApiGenerateSessionLocationResponse[];
    loot: ApiGenerateSessionLootItemResponse[];
    skillChecks: ApiGenerateSessionSkillCheckResponse[];
    secrets: string[];
    branchingPaths: string[];
    nextSessionHooks: string[];
}

export interface ApiGenerateNpcDraftRequest {
    campaignId?: string;
    nameHint: string;
    titleHint: string;
    raceHint: string;
    roleHint: string;
    factionHint: string;
    locationHint: string;
    motivationHint: string;
    notesHint: string;
    existingNpcNames: string[];
}

export interface ApiGenerateNpcDraftResponse {
    name: string;
    title: string;
    race: string;
    classOrRole: string;
    faction: string;
    occupation: string;
    age: string;
    gender: string;
    alignment: string;
    currentStatus: string;
    location: string;
    shortDescription: string;
    appearance: string;
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    motivations: string;
    goals: string;
    fears: string;
    secrets: string[];
    mannerisms: string[];
    voiceNotes: string;
    backstory: string;
    notes: string;
    combatNotes: string;
    statBlockReference: string;
    tags: string[];
    questLinks: string[];
    sessionAppearances: string[];
    inventory: string[];
    imageUrl: string;
    isHostile: boolean;
    isAlive: boolean;
    isImportant: boolean;
}

@Injectable({ providedIn: 'root' })
export class DungeonApiService {

    async deleteCharacter(characterId: string): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(`${this.baseUrl}/characters/${characterId}`));
        } catch (error) {
            // Some hosts or middleware block DELETE and return 405; retry via a delete action endpoint.
            if (error instanceof HttpErrorResponse && error.status === 405) {
                await firstValueFrom(this.http.post(`${this.baseUrl}/characters/${characterId}/delete`, {}));
                return;
            }

            throw error;
        }
    }
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiBaseUrl;

    async getCampaigns(): Promise<ApiCampaignDto[]> {
        return await firstValueFrom(this.http.get<ApiCampaignDto[]>(`${this.baseUrl}/campaigns`));
    }

    async createCampaign(payload: { name: string; setting: string; tone: ApiCampaignTone; levelStart: number; levelEnd: number; hook: string; nextSession: string; summary: string }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns`, payload));
    }

    async generateCampaignDraft(payload: ApiGenerateCampaignDraftRequest): Promise<ApiGenerateCampaignDraftResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateCampaignDraftResponse>(`${this.baseUrl}/campaigns/generate-draft`, payload));
    }

    async deleteCampaign(campaignId: string): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(`${this.baseUrl}/campaigns/${campaignId}`));
        } catch (error: any) {
            // Some hosts or middleware block DELETE and return 405; retry via a delete action endpoint.
            if (error.status === 405) {
                await firstValueFrom(this.http.post(`${this.baseUrl}/campaigns/${campaignId}/delete`, {}));
            } else {
                throw error;
            }
        }
    }

    async updateCampaign(campaignId: string, payload: { name: string; setting: string; tone: ApiCampaignTone; levelStart: number; levelEnd: number; hook: string; nextSession: string; summary: string }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}`, payload));
    }

    async createCampaignSession(campaignId: string, payload: { title: string; date: string; location: string; objective: string; threat: 'Low' | 'Moderate' | 'High' | 'Deadly' }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/sessions`, payload));
    }

    async updateCampaignSession(campaignId: string, sessionId: string, payload: { title: string; date: string; location: string; objective: string; threat: 'Low' | 'Moderate' | 'High' | 'Deadly' }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/sessions/${sessionId}`, payload));
    }

    async generateSessionDraft(campaignId: string, payload: ApiGenerateSessionDraftRequest): Promise<ApiGenerateSessionDraftResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateSessionDraftResponse>(`${this.baseUrl}/campaigns/${campaignId}/sessions/generate-draft`, payload));
    }

    async deleteCampaignSession(campaignId: string, sessionId: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/sessions/${sessionId}/delete`, {}));
    }

    async addCampaignNpc(campaignId: string, name: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/npcs`, { name }));
    }

    async removeCampaignNpc(campaignId: string, name: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/npcs/remove`, { name }));
    }

    async generateNpcDraft(payload: ApiGenerateNpcDraftRequest): Promise<ApiGenerateNpcDraftResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateNpcDraftResponse>(`${this.baseUrl}/campaigns/npcs/generate-draft`, payload));
    }

    async addCampaignLoot(campaignId: string, name: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/loot`, { name }));
    }

    async removeCampaignLoot(campaignId: string, name: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/loot/remove`, { name }));
    }

    async leaveCampaign(campaignId: string): Promise<void> {
        await firstValueFrom(this.http.post(`${this.baseUrl}/campaigns/${campaignId}/leave`, {}));
    }

    async createCampaignThread(campaignId: string, payload: { text: string; visibility: 'Party' | 'GMOnly' }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/threads`, payload));
    }

    async updateCampaignThread(campaignId: string, threadId: string, payload: { text: string; visibility: 'Party' | 'GMOnly' }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/threads/${threadId}`, payload));
    }

    async archiveCampaignThread(campaignId: string, threadId: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/threads/${threadId}/archive`, {}));
    }

    async createCampaignWorldNote(campaignId: string, payload: { title: string; category: ApiCampaignWorldNoteDto['category']; content: string }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/world-notes`, payload));
    }

    async updateCampaignWorldNote(campaignId: string, noteId: string, payload: { title: string; category: ApiCampaignWorldNoteDto['category']; content: string }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/world-notes/${noteId}`, payload));
    }

    async deleteCampaignWorldNote(campaignId: string, noteId: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/world-notes/${noteId}/delete`, {}));
    }

    async updateCampaignMap(campaignId: string, payload: ApiCampaignMapLibraryDto): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/map`, { library: payload }));
    }

    async generateCampaignMapArtAi(campaignId: string, payload: ApiGenerateCampaignMapArtRequest): Promise<ApiGenerateCampaignMapArtResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateCampaignMapArtResponse>(`${this.baseUrl}/campaigns/${campaignId}/map/generate-ai-art`, payload));
    }

    async inviteCampaignMember(campaignId: string, email: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/invites`, { email }));
    }

    async getCharacters(campaignId: string): Promise<ApiCharacterDto[]> {
        return await firstValueFrom(this.http.get<ApiCharacterDto[]>(`${this.baseUrl}/campaigns/${campaignId}/characters`));
    }

    async getUnassignedCharacters(): Promise<ApiCharacterDto[]> {
        return await firstValueFrom(this.http.get<ApiCharacterDto[]>(`${this.baseUrl}/characters/mine/unassigned`));
    }


    async createCharacter(payload: {
        name: string;
        playerName: string;
        className: string;
        level: number;
        background: string;
        notes: string;
        campaignId?: string;
        campaignIds?: string[];
        species?: string;
        alignment?: string;
        lifestyle?: string;
        personalityTraits?: string;
        ideals?: string;
        bonds?: string;
        flaws?: string;
        equipment?: string;
        abilityScores?: string;
        skills?: string;
        savingThrows?: string;
        hitPoints?: number;
        deathSaveFailures?: number;
        deathSaveSuccesses?: number;
        armorClass?: number;
        combatStats?: string;
        spells?: string;
        experiencePoints?: number;
        portraitUrl?: string;
        goals?: string;
        secrets?: string;
        sessionHistory?: string;
    }): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.post<ApiCharacterDto>(`${this.baseUrl}/characters`, payload));
    }

    async updateCharacter(characterId: string, payload: {
        name: string;
        playerName: string;
        className: string;
        level: number;
        background: string;
        notes: string;
        campaignId?: string;
        campaignIds?: string[];
        species?: string;
        alignment?: string;
        lifestyle?: string;
        personalityTraits?: string;
        ideals?: string;
        bonds?: string;
        flaws?: string;
        equipment?: string;
        abilityScores?: string;
        skills?: string;
        savingThrows?: string;
        hitPoints?: number;
        deathSaveFailures?: number;
        deathSaveSuccesses?: number;
        armorClass?: number;
        combatStats?: string;
        spells?: string;
        experiencePoints?: number;
        portraitUrl?: string;
        goals?: string;
        secrets?: string;
        sessionHistory?: string;
    }): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}`, payload));
    }

    async updateCharacterCampaign(characterId: string, campaignIds: string[]): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/campaign`, {
            campaignId: campaignIds[0] ?? null,
            campaignIds
        }));
    }

    async generateCharacterBackstory(payload: ApiGenerateCharacterBackstoryRequest): Promise<ApiGenerateCharacterBackstoryResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateCharacterBackstoryResponse>(`${this.baseUrl}/characters/backstory/generate`, payload));
    }

    async updateCharacterBackstory(characterId: string, backstory: string): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/backstory`, { backstory }));
    }

    async askDndQuestion(payload: ApiDndChatRequest): Promise<ApiDndChatResponse> {
        return await firstValueFrom(this.http.post<ApiDndChatResponse>(`${this.baseUrl}/assistant/dnd-chat`, payload));
    }

    async updateCharacterStatus(characterId: string, status: 'Ready' | 'Resting' | 'Recovering'): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/status`, { status }));
    }

    async promoteCharacter(characterId: string): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.post<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/promote`, {}));
    }

    async signup(payload: { displayName: string; email: string; password: string }): Promise<ApiSignupPendingActivationDto> {
        return await firstValueFrom(this.http.post<ApiSignupPendingActivationDto>(`${this.baseUrl}/auth/signup`, payload));
    }

    async activateAccount(payload: { email: string; code: string }): Promise<ApiActivationResultDto> {
        return await firstValueFrom(this.http.post<ApiActivationResultDto>(`${this.baseUrl}/auth/activate`, payload));
    }

    async resendActivationCode(payload: { email: string }): Promise<ApiActivationResultDto> {
        return await firstValueFrom(this.http.post<ApiActivationResultDto>(`${this.baseUrl}/auth/resend-activation`, payload));
    }

    async login(payload: { email: string; password: string }): Promise<ApiAuthSessionDto> {
        return await firstValueFrom(this.http.post<ApiAuthSessionDto>(`${this.baseUrl}/auth/login`, payload));
    }

    async getCurrentSession(): Promise<ApiAuthUserDto> {
        return await firstValueFrom(this.http.get<ApiAuthUserDto>(`${this.baseUrl}/auth/session`));
    }
}

