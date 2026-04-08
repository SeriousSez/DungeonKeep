import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

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

    constructor() {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const mode = params.get('mode');
                const email = params.get('email') ?? '';

                if (mode === 'activate') {
                    this.mode.set('activate');
                    if (email) {
                        this.activationForm.controls.email.setValue(email);
                        this.loginForm.controls.email.setValue(email);
                    }
                } else if (mode === 'signup') {
                    this.mode.set('signup');
                } else {
                    this.mode.set('login');
                    if (email) {
                        this.loginForm.controls.email.setValue(email);
                    }
                }

                this.errorMessage.set('');
            });
    }

    setMode(mode: 'login' | 'signup'): void {
        this.errorMessage.set('');
        this.infoMessage.set('');
        void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: mode === 'signup' ? { mode: 'signup' } : {},
            replaceUrl: true
        });
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
            this.infoMessage.set(result.message ?? 'Check your email for the activation code.');
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { mode: 'activate', email },
                replaceUrl: true
            });
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
            this.infoMessage.set(result.message ?? 'Account activated. You can sign in now.');
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { email },
                replaceUrl: true
            });
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