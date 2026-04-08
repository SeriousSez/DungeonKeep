import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { SessionService } from '../../state/session.service';

@Component({
    selector: 'app-auth-shell',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './auth-shell.component.html',
    styleUrl: './auth-shell.component.scss'
})
export class AuthShellComponent {
    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly mode = signal<'login' | 'signup' | 'activate'>('login');
    readonly errorMessage = signal('');
    readonly infoMessage = signal('');
    readonly isSubmitting = signal(false);

    readonly loginForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
    });

    readonly signupForm = new FormGroup({
        displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
    });

    readonly activationForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)] })
    });

    setMode(mode: 'login' | 'signup' | 'activate'): void {
        this.mode.set(mode);
        this.errorMessage.set('');
        this.infoMessage.set('');
    }

    async submitLogin(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.infoMessage.set('');

        const result = await this.session.login(
            this.loginForm.controls.email.getRawValue(),
            this.loginForm.controls.password.getRawValue()
        );

        this.isSubmitting.set(false);
        if (!result.ok) {
            this.errorMessage.set(result.error ?? 'Unable to sign in.');
        }

        this.cdr.detectChanges();
    }

    async submitSignup(): Promise<void> {
        if (this.signupForm.invalid) {
            this.signupForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.infoMessage.set('');

        const result = await this.session.signup(
            this.signupForm.controls.displayName.getRawValue(),
            this.signupForm.controls.email.getRawValue(),
            this.signupForm.controls.password.getRawValue()
        );

        this.isSubmitting.set(false);
        if (!result.ok) {
            this.errorMessage.set(result.error ?? 'Unable to create account.');
        } else {
            const email = result.email ?? this.signupForm.controls.email.getRawValue();
            this.activationForm.controls.email.setValue(email);
            this.activationForm.controls.code.setValue('');
            this.loginForm.controls.email.setValue(email);
            this.mode.set('activate');
            this.infoMessage.set(result.message ?? 'Check your email for the activation code.');
        }

        this.cdr.detectChanges();
    }

    async submitActivation(): Promise<void> {
        if (this.activationForm.invalid) {
            this.activationForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.infoMessage.set('');

        const result = await this.session.activateAccount(
            this.activationForm.controls.email.getRawValue(),
            this.activationForm.controls.code.getRawValue()
        );

        this.isSubmitting.set(false);
        if (!result.ok) {
            this.errorMessage.set(result.error ?? 'Unable to activate account.');
        } else {
            const email = result.email ?? this.activationForm.controls.email.getRawValue();
            this.loginForm.controls.email.setValue(email);
            this.mode.set('login');
            this.infoMessage.set(result.message ?? 'Account activated. You can sign in now.');
        }

        this.cdr.detectChanges();
    }

    async resendActivationCode(): Promise<void> {
        const emailControl = this.activationForm.controls.email;
        if (emailControl.invalid) {
            emailControl.markAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.infoMessage.set('');

        const result = await this.session.resendActivationCode(emailControl.getRawValue());

        this.isSubmitting.set(false);
        if (!result.ok) {
            this.errorMessage.set(result.error ?? 'Unable to resend activation code.');
        } else {
            this.infoMessage.set(result.message ?? 'A new activation code was sent.');
        }

        this.cdr.detectChanges();
    }
}