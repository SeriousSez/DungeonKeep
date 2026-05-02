import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

interface VoiceParticipantDto {
    connectionId: string;
    userId: string;
    displayName: string;
    microphoneMuted: boolean;
}

interface VoiceJoinResult {
    connectionId: string;
    participants: VoiceParticipantDto[];
}

interface VoiceOfferPayload {
    fromConnectionId: string;
    sdp: string;
}

interface VoiceAnswerPayload {
    fromConnectionId: string;
    sdp: string;
}

interface VoiceIceCandidatePayload {
    fromConnectionId: string;
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
}

interface VoiceParticipantLeft {
    connectionId: string;
}

interface VoiceParticipantMicrophoneUpdated {
    connectionId: string;
    microphoneMuted: boolean;
}

interface VoiceLocalPreference {
    muted: boolean;
    volume: number;
}

export interface VoiceParticipant {
    connectionId: string;
    userId: string;
    displayName: string;
    microphoneMuted: boolean;
}

const VOICE_PREFS_STORAGE_KEY = 'dungeonkeep.voice.local-preferences';

@Injectable({ providedIn: 'root' })
export class VoiceChatService {
    private readonly session = inject(SessionService);

    private connection: HubConnection | null = null;
    private joinedCampaignId = '';
    private joinedMapId = '';
    private selfConnectionId = '';
    private localStream: MediaStream | null = null;
    private readonly peerConnections = new Map<string, RTCPeerConnection>();
    private readonly remoteAudioElements = new Map<string, HTMLAudioElement>();

    readonly participants = signal<VoiceParticipant[]>([]);
    readonly connectionState = signal<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    readonly microphoneMuted = signal(false);
    readonly errorMessage = signal('');
    readonly localPreferences = signal<Record<string, VoiceLocalPreference>>(this.readStoredPreferences());
    readonly isJoined = computed(() => this.connectionState() === 'connected' && this.joinedCampaignId.length > 0 && this.joinedMapId.length > 0);

    constructor() {
        effect(() => {
            const token = this.session.token();
            if (!token && this.connectionState() !== 'idle') {
                void this.leave();
            }
        });
    }

    async join(campaignId: string, mapId: string): Promise<void> {
        if (!campaignId || !mapId) {
            return;
        }

        if (this.joinedCampaignId === campaignId && this.joinedMapId === mapId && this.connectionState() === 'connected') {
            return;
        }

        const token = this.session.token();
        if (!token) {
            this.connectionState.set('error');
            this.errorMessage.set('Sign in again to use voice chat.');
            return;
        }

        this.connectionState.set('connecting');
        this.errorMessage.set('');

        try {
            await this.ensureLocalStream();
            await this.ensureConnection();

            if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
                throw new Error('Voice signaling connection is not available.');
            }

            if (this.joinedCampaignId && this.joinedMapId) {
                await this.connection.invoke('LeaveVoiceRoom');
            }

            this.teardownPeers();

            const result = await this.connection.invoke<VoiceJoinResult>('JoinVoiceRoom', campaignId, mapId, token);

            this.selfConnectionId = result.connectionId;
            this.joinedCampaignId = campaignId;
            this.joinedMapId = mapId;
            this.participants.set(this.sortParticipants(result.participants));
            this.applyMicrophoneMutedState();
            this.connectionState.set('connected');

            for (const participant of result.participants) {
                if (participant.connectionId === result.connectionId) {
                    continue;
                }

                await this.createOfferForParticipant(participant.connectionId);
            }
        } catch {
            this.connectionState.set('error');
            this.errorMessage.set('Could not join voice chat. Check your microphone permissions and try again.');
        }
    }

    async syncRoom(campaignId: string, mapId: string): Promise<void> {
        if (!this.isJoined()) {
            return;
        }

        if (this.joinedCampaignId === campaignId && this.joinedMapId === mapId) {
            return;
        }

        await this.join(campaignId, mapId);
    }

    async leave(): Promise<void> {
        const currentConnection = this.connection;
        this.connection = null;

        this.connectionState.set('idle');
        this.errorMessage.set('');
        this.participants.set([]);
        this.joinedCampaignId = '';
        this.joinedMapId = '';
        this.selfConnectionId = '';

        this.teardownPeers();
        this.stopLocalStream();

        if (!currentConnection) {
            return;
        }

        try {
            if (currentConnection.state === HubConnectionState.Connected) {
                await currentConnection.invoke('LeaveVoiceRoom');
            }
        } catch {
            // Ignore leave failures while disconnecting.
        }

        try {
            await currentConnection.stop();
        } catch {
            // Ignore stop failures.
        }
    }

    async toggleMicrophoneMuted(): Promise<void> {
        const nextMuted = !this.microphoneMuted();
        this.microphoneMuted.set(nextMuted);
        this.applyMicrophoneMutedState();

        if (!this.connection || this.connection.state !== HubConnectionState.Connected || !this.isJoined()) {
            return;
        }

        try {
            await this.connection.invoke('UpdateMicrophoneMuted', nextMuted);
        } catch {
            this.errorMessage.set('Could not update microphone status for other participants.');
        }
    }

    setParticipantMuted(userId: string, muted: boolean): void {
        if (!userId) {
            return;
        }

        const current = this.localPreferences();
        const existing = current[userId] ?? { muted: false, volume: 1 };
        const next = { ...current, [userId]: { ...existing, muted } };
        this.localPreferences.set(next);
        this.storePreferences(next);
        this.applyPreferencesToAllRemoteAudio();
    }

    setParticipantVolume(userId: string, volume: number): void {
        if (!userId || !Number.isFinite(volume)) {
            return;
        }

        const clampedVolume = Math.max(0, Math.min(1, volume));
        const current = this.localPreferences();
        const existing = current[userId] ?? { muted: false, volume: 1 };
        const next = { ...current, [userId]: { ...existing, volume: clampedVolume } };
        this.localPreferences.set(next);
        this.storePreferences(next);
        this.applyPreferencesToAllRemoteAudio();
    }

    isParticipantMutedLocally(userId: string): boolean {
        return this.localPreferences()[userId]?.muted === true;
    }

    participantVolume(userId: string): number {
        return this.localPreferences()[userId]?.volume ?? 1;
    }

    private async ensureLocalStream(): Promise<void> {
        if (this.localStream) {
            return;
        }

        this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        this.applyMicrophoneMutedState();
    }

    private applyMicrophoneMutedState(): void {
        const stream = this.localStream;
        if (!stream) {
            return;
        }

        const enabled = !this.microphoneMuted();
        for (const track of stream.getAudioTracks()) {
            track.enabled = enabled;
        }
    }

    private async ensureConnection(): Promise<void> {
        if (this.connection && this.connection.state === HubConnectionState.Connected) {
            return;
        }

        if (!this.connection) {
            const connection = new HubConnectionBuilder()
                .withUrl(`${this.getHubBaseUrl()}/hubs/voice`, {
                    accessTokenFactory: () => this.session.token()
                })
                .withAutomaticReconnect()
                .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
                .build();

            connection.on('VoiceParticipantJoined', (participant: VoiceParticipantDto) => {
                this.upsertParticipant(participant);
            });

            connection.on('VoiceParticipantLeft', (event: VoiceParticipantLeft) => {
                this.removeParticipant(event.connectionId);
            });

            connection.on('VoiceParticipantMicrophoneUpdated', (event: VoiceParticipantMicrophoneUpdated) => {
                this.updateParticipantMicrophoneState(event.connectionId, event.microphoneMuted);
            });

            connection.on('VoiceOfferReceived', (payload: VoiceOfferPayload) => {
                void this.handleVoiceOffer(payload);
            });

            connection.on('VoiceAnswerReceived', (payload: VoiceAnswerPayload) => {
                void this.handleVoiceAnswer(payload);
            });

            connection.on('VoiceIceCandidateReceived', (payload: VoiceIceCandidatePayload) => {
                void this.handleVoiceIceCandidate(payload);
            });

            connection.onreconnecting(() => {
                this.connectionState.set(this.isJoined() ? 'connecting' : 'idle');
            });

            connection.onreconnected(() => {
                if (!this.joinedCampaignId || !this.joinedMapId) {
                    return;
                }

                void this.rejoinCurrentRoom();
            });

            connection.onclose(() => {
                if (this.joinedCampaignId || this.joinedMapId) {
                    this.connectionState.set('error');
                    this.errorMessage.set('Voice chat disconnected. Use Join Voice to reconnect.');
                }
            });

            this.connection = connection;
        }

        if (this.connection.state === HubConnectionState.Disconnected) {
            await this.connection.start();
        }
    }

    private async rejoinCurrentRoom(): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
            return;
        }

        const campaignId = this.joinedCampaignId;
        const mapId = this.joinedMapId;
        const token = this.session.token();
        if (!campaignId || !mapId || !token) {
            return;
        }

        this.teardownPeers();

        try {
            const result = await this.connection.invoke<VoiceJoinResult>('JoinVoiceRoom', campaignId, mapId, token);
            this.selfConnectionId = result.connectionId;
            this.participants.set(this.sortParticipants(result.participants));
            this.connectionState.set('connected');
            this.applyMicrophoneMutedState();

            for (const participant of result.participants) {
                if (participant.connectionId === this.selfConnectionId) {
                    continue;
                }

                await this.createOfferForParticipant(participant.connectionId);
            }
        } catch {
            this.connectionState.set('error');
            this.errorMessage.set('Could not rejoin voice chat after reconnecting.');
        }
    }

    private upsertParticipant(participant: VoiceParticipantDto): void {
        const current = this.participants();
        const existingIndex = current.findIndex((entry) => entry.connectionId === participant.connectionId);
        const normalized = this.normalizeParticipant(participant);

        if (existingIndex < 0) {
            this.participants.set(this.sortParticipants([...current, normalized]));
            return;
        }

        const next = [...current];
        next[existingIndex] = normalized;
        this.participants.set(this.sortParticipants(next));
    }

    private removeParticipant(connectionId: string): void {
        this.participants.update((participants) => participants.filter((participant) => participant.connectionId !== connectionId));
        this.teardownPeer(connectionId);
    }

    private updateParticipantMicrophoneState(connectionId: string, microphoneMuted: boolean): void {
        this.participants.update((participants) => participants.map((participant) => participant.connectionId === connectionId
            ? { ...participant, microphoneMuted }
            : participant));
    }

    private normalizeParticipant(participant: VoiceParticipantDto): VoiceParticipant {
        return {
            connectionId: participant.connectionId,
            userId: participant.userId,
            displayName: participant.displayName,
            microphoneMuted: participant.microphoneMuted
        };
    }

    private sortParticipants(participants: VoiceParticipantDto[] | VoiceParticipant[]): VoiceParticipant[] {
        return participants
            .map((participant) => this.normalizeParticipant(participant as VoiceParticipantDto))
            .sort((left, right) => left.displayName.localeCompare(right.displayName));
    }

    private async createOfferForParticipant(targetConnectionId: string): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
            return;
        }

        const peer = this.getOrCreatePeer(targetConnectionId);
        const offer = await peer.createOffer({
            offerToReceiveAudio: true
        });

        await peer.setLocalDescription(offer);
        if (!offer.sdp) {
            return;
        }

        await this.connection.invoke('SendVoiceOffer', targetConnectionId, offer.sdp);
    }

    private async handleVoiceOffer(payload: VoiceOfferPayload): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
            return;
        }

        const peer = this.getOrCreatePeer(payload.fromConnectionId);
        await peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        if (!answer.sdp) {
            return;
        }

        await this.connection.invoke('SendVoiceAnswer', payload.fromConnectionId, answer.sdp);
    }

    private async handleVoiceAnswer(payload: VoiceAnswerPayload): Promise<void> {
        const peer = this.peerConnections.get(payload.fromConnectionId);
        if (!peer) {
            return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }));
    }

    private async handleVoiceIceCandidate(payload: VoiceIceCandidatePayload): Promise<void> {
        const peer = this.getOrCreatePeer(payload.fromConnectionId);
        await peer.addIceCandidate(new RTCIceCandidate({
            candidate: payload.candidate,
            sdpMid: payload.sdpMid ?? undefined,
            sdpMLineIndex: typeof payload.sdpMLineIndex === 'number' ? payload.sdpMLineIndex : undefined
        }));
    }

    private getOrCreatePeer(connectionId: string): RTCPeerConnection {
        const existing = this.peerConnections.get(connectionId);
        if (existing) {
            return existing;
        }

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        const localStream = this.localStream;
        if (localStream) {
            for (const track of localStream.getTracks()) {
                peer.addTrack(track, localStream);
            }
        }

        peer.onicecandidate = (event) => {
            const candidate = event.candidate;
            if (!candidate || !this.connection || this.connection.state !== HubConnectionState.Connected) {
                return;
            }

            void this.connection.invoke('SendVoiceIceCandidate', connectionId, candidate.candidate, candidate.sdpMid, candidate.sdpMLineIndex);
        };

        peer.ontrack = (event) => {
            const [stream] = event.streams;
            if (!stream) {
                return;
            }

            const audio = this.getOrCreateRemoteAudioElement(connectionId);
            audio.srcObject = stream;
            this.applyPreferencesToAudioElement(connectionId, audio);
            void audio.play().catch(() => {
                // Playback can be blocked by autoplay policy until user interacts.
            });
        };

        peer.onconnectionstatechange = () => {
            const state = peer.connectionState;
            if (state === 'failed' || state === 'closed') {
                this.teardownPeer(connectionId);
            }
        };

        this.peerConnections.set(connectionId, peer);
        return peer;
    }

    private getOrCreateRemoteAudioElement(connectionId: string): HTMLAudioElement {
        const existing = this.remoteAudioElements.get(connectionId);
        if (existing) {
            return existing;
        }

        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.dataset['voiceConnectionId'] = connectionId;
        audio.style.display = 'none';
        document.body.appendChild(audio);

        this.remoteAudioElements.set(connectionId, audio);
        return audio;
    }

    private applyPreferencesToAllRemoteAudio(): void {
        for (const [connectionId, audio] of this.remoteAudioElements.entries()) {
            this.applyPreferencesToAudioElement(connectionId, audio);
        }
    }

    private applyPreferencesToAudioElement(connectionId: string, audio: HTMLAudioElement): void {
        const participant = this.participants().find((entry) => entry.connectionId === connectionId);
        if (!participant) {
            audio.volume = 1;
            return;
        }

        const preference = this.localPreferences()[participant.userId] ?? { muted: false, volume: 1 };
        audio.volume = preference.muted ? 0 : Math.max(0, Math.min(1, preference.volume));
    }

    private teardownPeers(): void {
        for (const connectionId of Array.from(this.peerConnections.keys())) {
            this.teardownPeer(connectionId);
        }
    }

    private teardownPeer(connectionId: string): void {
        const peer = this.peerConnections.get(connectionId);
        if (peer) {
            try {
                peer.close();
            } catch {
                // Ignore close failures.
            }
            this.peerConnections.delete(connectionId);
        }

        const audio = this.remoteAudioElements.get(connectionId);
        if (audio) {
            audio.pause();
            audio.srcObject = null;
            audio.remove();
            this.remoteAudioElements.delete(connectionId);
        }
    }

    private stopLocalStream(): void {
        const stream = this.localStream;
        this.localStream = null;

        if (!stream) {
            return;
        }

        for (const track of stream.getTracks()) {
            track.stop();
        }
    }

    private readStoredPreferences(): Record<string, VoiceLocalPreference> {
        try {
            const raw = globalThis.localStorage?.getItem(VOICE_PREFS_STORAGE_KEY);
            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw) as Record<string, Partial<VoiceLocalPreference>>;
            const normalized: Record<string, VoiceLocalPreference> = {};

            for (const [userId, preference] of Object.entries(parsed)) {
                if (!userId) {
                    continue;
                }

                normalized[userId] = {
                    muted: preference.muted === true,
                    volume: Number.isFinite(preference.volume) ? Math.max(0, Math.min(1, Number(preference.volume))) : 1
                };
            }

            return normalized;
        } catch {
            return {};
        }
    }

    private storePreferences(preferences: Record<string, VoiceLocalPreference>): void {
        try {
            globalThis.localStorage?.setItem(VOICE_PREFS_STORAGE_KEY, JSON.stringify(preferences));
        } catch {
            // Ignore storage failures and keep in-memory preferences.
        }
    }

    private getHubBaseUrl(): string {
        return environment.apiBaseUrl.replace(/\/api\/?$/, '');
    }
}
