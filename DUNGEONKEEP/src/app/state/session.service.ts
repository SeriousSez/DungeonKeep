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

    async signup(displayName: string, email: string, password: string): Promise<{ ok: boolean; email?: string; message?: string; error?: string }> {
        try {
            const result = await this.api.signup({ displayName, email, password });
            this.initialized.set(true);
            return { ok: true, email: result.email, message: result.message };
        } catch (error) {
            return { ok: false, error: this.readApiError(error, 'Unable to create account with those details.') };
        }
    }

    async activateAccount(email: string, code: string): Promise<{ ok: boolean; email?: string; message?: string; error?: string }> {
        try {
            const result = await this.api.activateAccount({ email, code });
            return { ok: true, email: result.email, message: result.message };
        } catch (error) {
            return { ok: false, error: this.readApiError(error, 'Unable to activate this account right now.') };
        }
    }

    async resendActivationCode(email: string): Promise<{ ok: boolean; email?: string; message?: string; error?: string }> {
        try {
            const result = await this.api.resendActivationCode({ email });
            return { ok: true, email: result.email, message: result.message };
        } catch (error) {
            return { ok: false, error: this.readApiError(error, 'Unable to resend the activation code right now.') };
        }
    }

    async login(email: string, password: string): Promise<{ ok: boolean; activationRequired?: boolean; error?: string }> {
        try {
            const session = await this.api.login({ email, password });
            this.applySession(session);
            this.initialized.set(true);
            return { ok: true };
        } catch (error) {
            const apiError = this.readApiError(error, 'Email or password was invalid.');
            return {
                ok: false,
                activationRequired: this.isActivationRequiredError(error, apiError),
                error: apiError
            };
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

    private readApiError(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                return detail || title || fallback;
            }
        }

        return fallback;
    }

    private isActivationRequiredError(error: unknown, message: string): boolean {
        return error instanceof HttpErrorResponse
            && error.status === 403
            && message.toLowerCase().includes('activate your account');
    }
}