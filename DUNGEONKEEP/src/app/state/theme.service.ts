import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { StoredTheme, loadTheme, saveTheme } from '../data/local-storage';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly document = inject(DOCUMENT);

    readonly theme = signal<StoredTheme>(loadTheme());

    constructor() {
        // Apply theme immediately on construction.
        this.applyTheme(this.theme());

        // Re-apply whenever the signal changes.
        effect(() => {
            const t = this.theme();
            saveTheme(t);
            this.applyTheme(t);
        });

        // Listen for OS-level changes when in 'system' mode.
        this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', () => {
                if (this.theme() === 'system') {
                    this.applyTheme('system');
                }
            });
    }

    setTheme(theme: StoredTheme): void {
        this.theme.set(theme);
    }

    private applyTheme(theme: StoredTheme): void {
        const prefersDark = this.document.defaultView
            ?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;

        const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
        this.document.documentElement.classList.toggle('theme-dark', useDark);
    }
}
