import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiCampaignDto {
    id: string;
    name: string;
    setting: string;
    summary: string;
    createdAtUtc: string;
    characterCount: number;
    openThreads: string[];
    currentUserRole: 'Owner' | 'Member';
    members: ApiCampaignMemberDto[];
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

@Injectable({ providedIn: 'root' })
export class DungeonApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiBaseUrl;

    async getCampaigns(): Promise<ApiCampaignDto[]> {
        return await firstValueFrom(this.http.get<ApiCampaignDto[]>(`${this.baseUrl}/campaigns`));
    }

    async createCampaign(payload: { name: string; setting: string; summary: string }): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.post<ApiCampaignDto>(`${this.baseUrl}/campaigns`, payload));
    }

    async archiveCampaignThread(campaignId: string, thread: string): Promise<ApiCampaignDto> {
        return await firstValueFrom(this.http.put<ApiCampaignDto>(`${this.baseUrl}/campaigns/${campaignId}/threads/archive`, { thread }));
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
    }): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.post<ApiCharacterDto>(`${this.baseUrl}/characters`, payload));
    }

    async updateCharacterCampaign(characterId: string, campaignId: string | null): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/campaign`, { campaignId }));
    }

    async generateCharacterBackstory(payload: ApiGenerateCharacterBackstoryRequest): Promise<ApiGenerateCharacterBackstoryResponse> {
        return await firstValueFrom(this.http.post<ApiGenerateCharacterBackstoryResponse>(`${this.baseUrl}/characters/backstory/generate`, payload));
    }

    async updateCharacterBackstory(characterId: string, backstory: string): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/backstory`, { backstory }));
    }

    async updateCharacterStatus(characterId: string, status: 'Ready' | 'Resting' | 'Recovering'): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.put<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/status`, { status }));
    }

    async promoteCharacter(characterId: string): Promise<ApiCharacterDto> {
        return await firstValueFrom(this.http.post<ApiCharacterDto>(`${this.baseUrl}/characters/${characterId}/promote`, {}));
    }

    async signup(payload: { displayName: string; email: string; password: string }): Promise<ApiAuthSessionDto> {
        return await firstValueFrom(this.http.post<ApiAuthSessionDto>(`${this.baseUrl}/auth/signup`, payload));
    }

    async login(payload: { email: string; password: string }): Promise<ApiAuthSessionDto> {
        return await firstValueFrom(this.http.post<ApiAuthSessionDto>(`${this.baseUrl}/auth/login`, payload));
    }

    async getCurrentSession(): Promise<ApiAuthUserDto> {
        return await firstValueFrom(this.http.get<ApiAuthUserDto>(`${this.baseUrl}/auth/session`));
    }
}
