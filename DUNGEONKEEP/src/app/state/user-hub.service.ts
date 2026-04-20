import { Injectable, effect, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

export interface NewMessageReceivedEvent {
    threadId: string;
}

@Injectable({ providedIn: 'root' })
export class UserHubService {
    private readonly session = inject(SessionService);

    private connection: HubConnection | null = null;
    private connectionToken = '';
    private joinedGroup = false;

    private readonly _newMessageReceived = new Subject<NewMessageReceivedEvent>();
    private readonly _newNotificationReceived = new Subject<void>();

    readonly newMessageReceived$ = this._newMessageReceived.asObservable();
    readonly newNotificationReceived$ = this._newNotificationReceived.asObservable();

    constructor() {
        effect(() => {
            const token = this.session.token();
            void this.syncConnection(token);
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
            .withUrl(`${this.getHubBaseUrl()}/hubs/user`, {
                accessTokenFactory: () => this.session.token()
            })
            .withAutomaticReconnect()
            .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
            .build();

        connection.on('NewMessageReceived', (event: NewMessageReceivedEvent) => {
            this._newMessageReceived.next(event);
        });

        connection.on('NewNotificationReceived', () => {
            this._newNotificationReceived.next();
        });

        connection.onreconnecting(() => {
            this.joinedGroup = false;
        });

        connection.onreconnected(async () => {
            this.joinedGroup = false;
            await this.joinUserGroup();
        });

        connection.onclose(() => {
            this.joinedGroup = false;
        });

        this.connection = connection;
        await this.ensureStarted();
        await this.joinUserGroup();
    }

    private async joinUserGroup(): Promise<void> {
        const token = this.connectionToken;
        if (!token || !this.connection || this.connection.state !== HubConnectionState.Connected || this.joinedGroup) {
            return;
        }

        try {
            await this.connection.invoke('JoinUserGroup', token);
            this.joinedGroup = true;
        } catch {
            // Reconnect logic will retry.
        }
    }

    private async ensureStarted(): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Disconnected) {
            return;
        }

        try {
            await this.connection.start();
            await this.joinUserGroup();
        } catch {
            // Automatic reconnect handles transient failures.
        }
    }

    private async stopConnection(): Promise<void> {
        if (!this.connection) {
            this.joinedGroup = false;
            this.connectionToken = '';
            return;
        }

        const connection = this.connection;
        this.connection = null;
        this.joinedGroup = false;
        this.connectionToken = '';

        try {
            await connection.stop();
        } catch {
            // Ignore stop failures.
        }
    }

    private getHubBaseUrl(): string {
        return environment.apiBaseUrl.replace(/\/api\/?$/, '');
    }
}
