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

    readonly mode = signal<'login' | 'signup'>('login');
    readonly errorMessage = signal('');
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

    setMode(mode: 'login' | 'signup'): void {
        this.mode.set(mode);
        this.errorMessage.set('');
    }

    async submitLogin(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');

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

        const result = await this.session.signup(
            this.signupForm.controls.displayName.getRawValue(),
            this.signupForm.controls.email.getRawValue(),
            this.signupForm.controls.password.getRawValue()
        );

        this.isSubmitting.set(false);
        if (!result.ok) {
            this.errorMessage.set(result.error ?? 'Unable to create account.');
        }

        this.cdr.detectChanges();
    }
}