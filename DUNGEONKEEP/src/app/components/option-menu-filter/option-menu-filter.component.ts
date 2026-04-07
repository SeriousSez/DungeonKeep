import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

import type { DropdownOption } from '../dropdown/dropdown.component';

@Component({
    selector: 'app-option-menu-filter',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './option-menu-filter.component.html',
    styleUrl: './option-menu-filter.component.scss'
})
export class OptionMenuFilterComponent {
    private readonly hostElement = inject(ElementRef<HTMLElement>);
    private readonly viewportPadding = 12;

    readonly options = input.required<ReadonlyArray<DropdownOption>>();
    readonly selectedValue = input.required<string>();
    readonly ariaLabel = input('Open class sort options');
    readonly menuLabel = input('Sort classes by');
    readonly changed = output<string | number>();

    readonly menuOpen = signal(false);
    readonly panelAlignment = signal<'start' | 'end'>('end');

    toggleMenu(): void {
        const nextOpen = !this.menuOpen();
        this.menuOpen.set(nextOpen);

        if (nextOpen) {
            globalThis.window?.requestAnimationFrame(() => this.updatePanelAlignment());
        }
    }

    pickOption(value: string | number): void {
        this.changed.emit(value);
        this.menuOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.menuOpen()) {
            return;
        }

        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (!this.hostElement.nativeElement.contains(target)) {
            this.menuOpen.set(false);
        }
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        if (!this.menuOpen()) {
            return;
        }

        this.updatePanelAlignment();
    }

    private updatePanelAlignment(): void {
        const view = globalThis.window;
        if (!view) {
            return;
        }

        const trigger = this.hostElement.nativeElement.querySelector('.class-sort-trigger');
        const panel = this.hostElement.nativeElement.querySelector('.class-sort-popover-panel');

        if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
            return;
        }

        const triggerRect = trigger.getBoundingClientRect();
        const panelWidth = panel.offsetWidth || Math.min(320, Math.floor(view.innerWidth * 0.92));
        const startOverflow = triggerRect.left + panelWidth - (view.innerWidth - this.viewportPadding);
        const endOverflow = this.viewportPadding - (triggerRect.right - panelWidth);

        if (endOverflow > 0 && startOverflow <= 0) {
            this.panelAlignment.set('start');
            return;
        }

        if (startOverflow > 0 && endOverflow <= 0) {
            this.panelAlignment.set('end');
            return;
        }

        this.panelAlignment.set(startOverflow < endOverflow ? 'start' : 'end');
    }
}
