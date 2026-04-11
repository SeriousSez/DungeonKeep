import { Injectable, effect, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiCampaignDto, ApiCampaignMapTokenMovedDto, ApiCampaignMapVisionUpdatedDto } from './dungeon-api.service';
import { DungeonStoreService } from './dungeon-store.service';
import { SessionService } from './session.service';

export interface CampaignMapVisionResetEvent {
    campaignId: string;
    mapId: string;
    key?: string | null;
    initiatedByUserId: string;
    summary: string;
}

export interface CampaignMapTokenMovedEvent extends ApiCampaignMapTokenMovedDto { }
export interface CampaignMapVisionUpdatedEvent extends ApiCampaignMapVisionUpdatedDto { }

@Injectable({ providedIn: 'root' })
export class CampaignRealtimeService {
    private readonly session = inject(SessionService);
    private readonly store = inject(DungeonStoreService);
    private readonly router = inject(Router);
    private connection: HubConnection | null = null;
    private joinedCampaignId = '';
    private connectionToken = '';
    private readonly routeCampaignId = signal(this.extractCampaignId(this.router.url));
    private readonly _campaignMapTokenMoved = new Subject<CampaignMapTokenMovedEvent>();
    private readonly _campaignMapVisionReset = new Subject<CampaignMapVisionResetEvent>();
    private readonly _campaignMapVisionUpdated = new Subject<CampaignMapVisionUpdatedEvent>();

    readonly campaignMapTokenMoved$ = this._campaignMapTokenMoved.asObservable();
    readonly campaignMapVisionReset$ = this._campaignMapVisionReset.asObservable();
    readonly campaignMapVisionUpdated$ = this._campaignMapVisionUpdated.asObservable();

    constructor() {
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.routeCampaignId.set(this.extractCampaignId(event.urlAfterRedirects));
            });

        effect(() => {
            const token = this.session.token();
            void this.syncConnection(token);
        });

        effect(() => {
            const campaignId = this.currentCampaignId();
            const token = this.session.token();
            void this.syncCampaignGroup(campaignId, token);
        });
    }

    private async syncConnection(token: string): Promise<void> {
        if (!token) {
            await this.stopConnection();
            return;
        }

        if (this.connection && this.connectionToken === token) {
            await this.ensureStarted();
            return;
        }

        await this.stopConnection();

        this.connectionToken = token;
        const connection = new HubConnectionBuilder()
            .withUrl(`${this.getHubBaseUrl()}/hubs/campaign`, {
                accessTokenFactory: () => this.session.token()
            })
            .withAutomaticReconnect()
            .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
            .build();

        connection.on('CampaignMapUpdated', (campaign: ApiCampaignDto) => {
            this.store.applyCampaignRealtimeUpdate(campaign);
        });

        connection.on('CampaignMapTokenMoved', (event: ApiCampaignMapTokenMovedDto) => {
            this.store.applyCampaignMapTokenMoved(event);
            this._campaignMapTokenMoved.next(event);
        });

        connection.on('CampaignMapVisionUpdated', (event: ApiCampaignMapVisionUpdatedDto) => {
            this.store.applyCampaignMapVisionUpdated(event);
            this._campaignMapVisionUpdated.next(event);
        });

        connection.on('CampaignMapVisionReset', (event: CampaignMapVisionResetEvent) => {
            this._campaignMapVisionReset.next(event);
        });

        connection.onreconnecting(() => {
            this.joinedCampaignId = '';
        });

        connection.onreconnected(async () => {
            this.joinedCampaignId = '';
            await this.joinCurrentCampaign();
        });

        connection.onclose(() => {
            this.joinedCampaignId = '';
        });

        this.connection = connection;
        await this.ensureStarted();
        await this.joinCurrentCampaign();
    }

    private async syncCampaignGroup(campaignId: string, token: string): Promise<void> {
        if (!token || !this.connection) {
            return;
        }

        await this.ensureStarted();
        if (this.connection.state !== HubConnectionState.Connected) {
            return;
        }

        if (campaignId === this.joinedCampaignId) {
            return;
        }

        if (this.joinedCampaignId) {
            try {
                await this.connection.invoke('LeaveCampaign', this.joinedCampaignId);
            } catch {
                // Ignore leave failures during reconnect or shutdown.
            }
            this.joinedCampaignId = '';
        }

        if (!campaignId) {
            return;
        }

        await this.connection.invoke('JoinCampaign', campaignId, token);
        this.joinedCampaignId = campaignId;
    }

    private async joinCurrentCampaign(): Promise<void> {
        const campaignId = this.currentCampaignId();
        const token = this.session.token();
        if (!campaignId || !token || !this.connection || this.connection.state !== HubConnectionState.Connected) {
            return;
        }

        if (this.joinedCampaignId === campaignId) {
            return;
        }

        if (this.joinedCampaignId) {
            try {
                await this.connection.invoke('LeaveCampaign', this.joinedCampaignId);
            } catch {
                // Ignore leave failures during reconnect.
            }
            this.joinedCampaignId = '';
        }

        await this.connection.invoke('JoinCampaign', campaignId, token);
        this.joinedCampaignId = campaignId;
    }

    private async ensureStarted(): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Disconnected) {
            return;
        }

        try {
            await this.connection.start();
        } catch {
            // Automatic reconnect handles transient failures after startup.
        }
    }

    private async stopConnection(): Promise<void> {
        if (!this.connection) {
            this.joinedCampaignId = '';
            this.connectionToken = '';
            return;
        }

        const connection = this.connection;
        this.connection = null;
        this.joinedCampaignId = '';
        this.connectionToken = '';

        try {
            await connection.stop();
        } catch {
            // Ignore stop failures during logout or navigation changes.
        }
    }

    private getHubBaseUrl(): string {
        return environment.apiBaseUrl.replace(/\/api\/?$/, '');
    }

    private currentCampaignId(): string {
        return this.routeCampaignId() || this.store.selectedCampaignId();
    }

    private extractCampaignId(url: string): string {
        const match = url.match(/\/campaigns\/([^/?#]+)/i);
        return match?.[1]?.trim() ?? '';
    }

}