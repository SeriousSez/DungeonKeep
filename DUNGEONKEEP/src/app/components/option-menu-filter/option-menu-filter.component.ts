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

    readonly options = input.required<ReadonlyArray<DropdownOption>>();
    readonly selectedValue = input.required<string>();
    readonly ariaLabel = input('Open class sort options');
    readonly menuLabel = input('Sort classes by');
    readonly changed = output<string | number>();

    readonly menuOpen = signal(false);

    toggleMenu(): void {
        this.menuOpen.update((open) => !open);
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
}
