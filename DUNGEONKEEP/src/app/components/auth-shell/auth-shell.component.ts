import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
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
    @ViewChildren('activationDigitInput') private activationDigitInputs?: QueryList<ElementRef<HTMLInputElement>>;

    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly mode = signal<'login' | 'signup' | 'activate'>('login');
    readonly errorMessage = signal('');
    readonly infoMessage = signal('');
    readonly isSubmitting = signal(false);
    readonly activationCodeDigits = signal<string[]>(Array.from({ length: 6 }, () => ''));
    readonly activationCodeSlots = [0, 1, 2, 3, 4, 5] as const;

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
                    this.setActivationCode('');
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
        const email = this.loginForm.controls.email.getRawValue();

        this.isSubmitting.set(false);
        if (!result.ok) {
            if (result.activationRequired) {
                this.activationForm.controls.email.setValue(email);
                this.setActivationCode('');
                this.infoMessage.set(result.error ?? 'Activate your account with the emailed code before signing in.');
                void this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { mode: 'activate', email },
                    replaceUrl: true
                });
                this.cdr.detectChanges();
                return;
            }

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
            this.setActivationCode('');
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

    handleActivationDigitInput(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        const digits = input.value.replace(/\D/g, '');

        if (!digits) {
            this.updateActivationDigit(index, '');
            return;
        }

        this.applyActivationDigits(digits, index);
    }

    handleActivationDigitKeydown(event: KeyboardEvent, index: number): void {
        const input = event.target as HTMLInputElement;

        if (event.key === 'Backspace') {
            if (input.value) {
                this.updateActivationDigit(index, '');
                event.preventDefault();
                return;
            }

            if (index > 0) {
                this.updateActivationDigit(index - 1, '');
                this.focusActivationDigit(index - 1);
                event.preventDefault();
            }

            return;
        }

        if (event.key === 'ArrowLeft' && index > 0) {
            this.focusActivationDigit(index - 1);
            event.preventDefault();
            return;
        }

        if (event.key === 'ArrowRight' && index < this.activationCodeSlots.length - 1) {
            this.focusActivationDigit(index + 1);
            event.preventDefault();
        }
    }

    handleActivationCodePaste(event: ClipboardEvent, index: number): void {
        const pastedValue = event.clipboardData?.getData('text') ?? '';
        const digits = pastedValue.replace(/\D/g, '');

        if (!digits) {
            return;
        }

        event.preventDefault();
        this.applyActivationDigits(digits, index);
    }

    handleActivationDigitFocus(index: number): void {
        const input = this.activationDigitInputs?.get(index)?.nativeElement;
        input?.select();
    }

    private applyActivationDigits(value: string, startIndex: number): void {
        const digits = value.replace(/\D/g, '').slice(0, this.activationCodeSlots.length - startIndex);

        if (!digits) {
            return;
        }

        const nextDigits = [...this.activationCodeDigits()];
        for (let offset = 0; offset < digits.length; offset += 1) {
            nextDigits[startIndex + offset] = digits[offset] ?? '';
        }

        this.activationCodeDigits.set(nextDigits);
        this.syncActivationCodeControl();

        const nextIndex = Math.min(startIndex + digits.length, this.activationCodeSlots.length - 1);
        this.focusActivationDigit(nextIndex);
    }

    private updateActivationDigit(index: number, value: string): void {
        const nextDigits = [...this.activationCodeDigits()];
        nextDigits[index] = value.replace(/\D/g, '').slice(0, 1);
        this.activationCodeDigits.set(nextDigits);
        this.syncActivationCodeControl();
    }

    private syncActivationCodeControl(): void {
        this.activationForm.controls.code.setValue(this.activationCodeDigits().join(''));
    }

    private setActivationCode(code: string): void {
        const normalizedCode = code.replace(/\D/g, '').slice(0, this.activationCodeSlots.length);
        const nextDigits = Array.from({ length: this.activationCodeSlots.length }, (_, index) => normalizedCode[index] ?? '');
        this.activationCodeDigits.set(nextDigits);
        this.activationForm.controls.code.setValue(normalizedCode);
    }

    private focusActivationDigit(index: number): void {
        queueMicrotask(() => {
            const input = this.activationDigitInputs?.get(index)?.nativeElement;
            input?.focus();
            input?.select();
        });
    }
}