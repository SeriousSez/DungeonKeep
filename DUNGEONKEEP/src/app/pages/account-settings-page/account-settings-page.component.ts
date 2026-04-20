import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../state/session.service';
import { ThemeService } from '../../state/theme.service';

type SettingsTab = 'profile' | 'security' | 'preferences';

@Component({
    selector: 'app-account-settings-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './account-settings-page.component.html',
    styleUrl: './account-settings-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountSettingsPageComponent {
    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly themeService = inject(ThemeService);

    readonly activeTab = signal<SettingsTab>('profile');
    readonly savePending = signal(false);
    readonly saveSuccess = signal(false);
    readonly saveError = signal('');

    readonly displayName = signal(this.session.currentUser()?.displayName ?? '');
    readonly email = signal(this.session.currentUser()?.email ?? '');

    // Security fields
    readonly currentPassword = signal('');
    readonly newPassword = signal('');
    readonly confirmPassword = signal('');
    readonly passwordPending = signal(false);
    readonly passwordSuccess = signal(false);
    readonly passwordError = signal('');

    // Preferences — backed by ThemeService
    readonly theme = this.themeService.theme;
    readonly compactMode = signal(false);

    readonly currentUser = this.session.currentUser;

    setTab(tab: SettingsTab): void {
        this.activeTab.set(tab);
        this.saveSuccess.set(false);
        this.saveError.set('');
    }

    async saveProfile(): Promise<void> {
        const displayName = this.displayName().trim();
        const email = this.email().trim();
        if (!displayName || !email) {
            this.saveError.set('Display name and email are required.');
            return;
        }
        this.savePending.set(true);
        this.saveSuccess.set(false);
        this.saveError.set('');
        const result = await this.session.updateProfile(displayName, email);
        this.savePending.set(false);
        if (result.ok) {
            this.saveSuccess.set(true);
        } else {
            this.saveError.set(result.error ?? 'Could not save profile.');
        }
        this.cdr.detectChanges();
    }

    async savePassword(): Promise<void> {
        if (this.newPassword() !== this.confirmPassword()) {
            this.passwordError.set('New passwords do not match.');
            return;
        }
        if (this.newPassword().length < 8) {
            this.passwordError.set('Password must be at least 8 characters.');
            return;
        }
        this.passwordPending.set(true);
        this.passwordError.set('');
        this.passwordSuccess.set(false);
        const result = await this.session.changePassword(this.currentPassword(), this.newPassword());
        this.passwordPending.set(false);
        if (result.ok) {
            this.passwordSuccess.set(true);
            this.currentPassword.set('');
            this.newPassword.set('');
            this.confirmPassword.set('');
        } else {
            this.passwordError.set(result.error ?? 'Could not change password.');
        }
        this.cdr.detectChanges();
    }

    readonly prefSaveSuccess = signal(false);

    savePreferences(): void {
        // Theme is already applied live via ThemeService.
        // Compact mode is local-only for now.
        this.prefSaveSuccess.set(true);
        setTimeout(() => {
            this.prefSaveSuccess.set(false);
            this.cdr.detectChanges();
        }, 2500);
        this.cdr.detectChanges();
    }
}
