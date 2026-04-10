import { Injectable, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

export interface PartyCurrencyUpdatedEvent {
    campaignId: string;
    summary: string;
}

@Injectable({ providedIn: 'root' })
export class CampaignHubService {
    private readonly session = inject(SessionService);

    private connection: HubConnection | null = null;
    private joinedCampaignId: string | null = null;

    private readonly _partyCurrencyUpdated = new Subject<PartyCurrencyUpdatedEvent>();
    readonly partyCurrencyUpdated$ = this._partyCurrencyUpdated.asObservable();

    async joinCampaign(campaignId: string): Promise<void> {
        if (this.joinedCampaignId === campaignId && this.connection?.state === HubConnectionState.Connected) {
            return;
        }

        await this.disconnect();

        const hubUrl = environment.apiBaseUrl.replace(/\/api$/, '') + '/hubs/campaign';

        this.connection = new HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => this.session.token() ?? '' })
            .withAutomaticReconnect()
            .build();

        this.connection.on('PartyCurrencyUpdated', (event: PartyCurrencyUpdatedEvent) => {
            this._partyCurrencyUpdated.next(event);
        });

        this.connection.onreconnecting(() => {
            this.joinedCampaignId = null;
        });

        this.connection.onreconnected(async () => {
            const joinedCampaignId = this.joinedCampaignId ?? campaignId;
            this.joinedCampaignId = null;

            if (!joinedCampaignId) {
                return;
            }

            try {
                await this.connection?.invoke('JoinCampaign', joinedCampaignId, this.session.token() ?? '');
                this.joinedCampaignId = joinedCampaignId;
            } catch {
                this.joinedCampaignId = null;
            }
        });

        this.connection.onclose(() => {
            this.joinedCampaignId = null;
        });

        await this.connection.start();
        await this.connection.invoke('JoinCampaign', campaignId, this.session.token() ?? '');
        this.joinedCampaignId = campaignId;
    }

    async disconnect(): Promise<void> {
        if (!this.connection) return;

        try {
            if (this.joinedCampaignId && this.connection.state === HubConnectionState.Connected) {
                await this.connection.invoke('LeaveCampaign', this.joinedCampaignId);
            }
            await this.connection.stop();
        } catch {
            // Ignore teardown errors
        } finally {
            this.connection = null;
            this.joinedCampaignId = null;
        }
    }
}
