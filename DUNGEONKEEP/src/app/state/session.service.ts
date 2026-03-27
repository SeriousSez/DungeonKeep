import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { clearSessionToken, clearSessionUser, loadSessionToken, loadSessionUser, saveSessionToken, saveSessionUser } from '../data/local-storage';
import { ApiAuthSessionDto, ApiAuthUserDto, DungeonApiService } from './dungeon-api.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
    private readonly api = inject(DungeonApiService);

    readonly token = signal(loadSessionToken());
    readonly currentUser = signal<ApiAuthUserDto | null>(loadSessionUser());
    readonly initialized = signal(false);

    constructor() {
        void this.restoreSession();
    }

    async signup(displayName: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> {
        try {
            const session = await this.api.signup({ displayName, email, password });
            this.applySession(session);
            this.initialized.set(true);
            return { ok: true };
        } catch {
            return { ok: false, error: 'Unable to create account with those details.' };
        }
    }

    async login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
        try {
            const session = await this.api.login({ email, password });
            this.applySession(session);
            this.initialized.set(true);
            return { ok: true };
        } catch {
            return { ok: false, error: 'Email or password was invalid.' };
        }
    }

    logout(): void {
        clearSessionToken();
        clearSessionUser();
        this.token.set('');
        this.currentUser.set(null);
        this.initialized.set(true);
    }

    private async restoreSession(): Promise<void> {
        if (!this.token()) {
            this.initialized.set(true);
            return;
        }

        try {
            const user = await this.api.getCurrentSession();
            this.currentUser.set(user);
            saveSessionUser(user);
        } catch (error) {
            if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
                clearSessionToken();
                clearSessionUser();
                this.token.set('');
                this.currentUser.set(null);
            }
        } finally {
            this.initialized.set(true);
        }
    }

    private applySession(session: ApiAuthSessionDto): void {
        saveSessionToken(session.token);
        saveSessionUser(session.user);
        this.token.set(session.token);
        this.currentUser.set(session.user);
    }
}