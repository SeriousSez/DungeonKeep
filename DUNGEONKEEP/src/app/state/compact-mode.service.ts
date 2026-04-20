import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { loadCompactMode, saveCompactMode } from '../data/local-storage';

@Injectable({ providedIn: 'root' })
export class CompactModeService {
    private readonly document = inject(DOCUMENT);

    readonly compactMode = signal<boolean>(loadCompactMode());

    constructor() {
        this.document.documentElement.classList.toggle('layout-compact', this.compactMode());

        effect(() => {
            const compact = this.compactMode();
            saveCompactMode(compact);
            this.document.documentElement.classList.toggle('layout-compact', compact);
        });
    }
}
