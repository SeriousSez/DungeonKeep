import { Component, ChangeDetectionStrategy, computed, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
    group?: string;
}

@Component({
    selector: 'app-dropdown',
    standalone: true,
    imports: [CommonModule],
    host: {
        '(document:click)': 'onDocumentClick($event)',
        '[class.app-dropdown-host--open]': 'isOpen()',
        '[class.app-dropdown-host--dense-options]': "optionDensity() === 'dense'"
    },
    templateUrl: './dropdown.component.html',
    styleUrl: './dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
    private readonly hostElement = inject(ElementRef<HTMLElement>);
    private readonly defaultPanelMaxHeight = 300;
    private suppressOutsideCloseUntil = 0;

    readonly id = input<string>('');
    readonly ariaLabel = input<string>('');
    readonly value = input<string | number>('');
    readonly options = input.required<ReadonlyArray<DropdownOption>>();
    readonly placeholder = input<string>('');
    readonly minWidth = input<number | null>(null);
    readonly size = input<'wide' | 'compact' | 'narrow'>('compact');
    readonly optionDensity = input<'regular' | 'dense'>('regular');
    readonly disabled = input<boolean>(false);
    readonly searchable = input<boolean>(false);
    readonly searchPlaceholder = input<string>('Search options...');
    readonly changed = output<string | number>();

    readonly isOpen = signal(false);
    readonly opensUpward = signal(false);
    readonly searchTerm = signal('');
    readonly panelMaxHeight = signal(this.defaultPanelMaxHeight);

    readonly filteredOptions = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        const options = this.options();
        if (!query) {
            return options;
        }

        return options.filter((option) => option.label.toLowerCase().includes(query));
    });

    readonly triggerLabel = computed(() => {
        const selected = this.options().find((option) => String(option.value) === String(this.value()));
        return selected?.label ?? this.placeholder() ?? '';
    });

    readonly selectedDescription = computed(() => {
        const selected = this.options().find((option) => String(option.value) === String(this.value()));
        const description = selected?.description?.trim() ?? '';
        return description;
    });

    readonly showGroupHeaders = computed(() => {
        const hasGroupedOption = this.filteredOptions().some((option) => !!option.group?.trim());
        return hasGroupedOption;
    });

    readonly groupedFilteredOptions = computed(() => {
        if (!this.showGroupHeaders()) {
            return [{ label: '', options: this.filteredOptions() }];
        }

        const groupedMap = new Map<string, DropdownOption[]>();
        for (const option of this.filteredOptions()) {
            const groupLabel = option.group?.trim() || 'Other';
            if (!groupedMap.has(groupLabel)) {
                groupedMap.set(groupLabel, []);
            }

            groupedMap.get(groupLabel)!.push(option);
        }

        return Array.from(groupedMap.entries()).map(([label, options]) => ({ label, options }));
    });

    constructor() {
        effect((onCleanup) => {
            if (!this.isOpen()) {
                this.opensUpward.set(false);
                this.panelMaxHeight.set(this.defaultPanelMaxHeight);
                return;
            }

            const view = globalThis.window;
            if (!view) {
                return;
            }

            const updatePanelPosition = () => {
                const trigger = this.hostElement.nativeElement.querySelector('.app-dropdown-trigger');
                const panel = this.hostElement.nativeElement.querySelector('.app-dropdown-panel');

                if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
                    return;
                }

                const viewportPadding = 12;
                const panelGap = 6;
                const triggerRect = trigger.getBoundingClientRect();
                const desiredPanelHeight = panel.offsetHeight || panel.scrollHeight || this.defaultPanelMaxHeight;
                const availableBelow = Math.max(0, view.innerHeight - triggerRect.bottom - viewportPadding - panelGap);
                const availableAbove = Math.max(0, triggerRect.top - viewportPadding - panelGap);
                const shouldOpenUpward = desiredPanelHeight > availableBelow && availableAbove > availableBelow;
                const availableSpace = shouldOpenUpward ? availableAbove : availableBelow;

                this.opensUpward.set(shouldOpenUpward);
                // Keep the dropdown panel within available viewport space.
                this.panelMaxHeight.set(Math.max(120, Math.min(this.defaultPanelMaxHeight, availableSpace)));
            };

            const frameId = view.requestAnimationFrame(() => {
                updatePanelPosition();
                view.requestAnimationFrame(updatePanelPosition);
            });

            view.addEventListener('resize', updatePanelPosition);
            globalThis.document.addEventListener('scroll', updatePanelPosition, true);

            onCleanup(() => {
                view.cancelAnimationFrame(frameId);
                view.removeEventListener('resize', updatePanelPosition);
                globalThis.document.removeEventListener('scroll', updatePanelPosition, true);
            });
        });
    }

    getOptionsMaxHeight(): number {
        // Reserve vertical space for panel padding/border and optional search input.
        const panelChromeHeight = this.searchable() ? 58 : 18;
        return Math.max(96, this.panelMaxHeight() - panelChromeHeight);
    }

    onValueChange(newValue: string | number): void {
        this.changed.emit(newValue);
    }

    toggleOpen(): void {
        if (this.disabled()) {
            return;
        }

        this.isOpen.update((open) => {
            const nextOpen = !open;
            if (nextOpen) {
                this.suppressOutsideCloseUntil = Date.now() + 150;
            }

            return nextOpen;
        });
    }

    onSearchInput(value: string): void {
        this.searchTerm.set(value);
    }

    onOptionPicked(value: string | number): void {
        this.changed.emit(value);
        this.isOpen.set(false);
        this.searchTerm.set('');
    }

    isOptionSelected(option: DropdownOption): boolean {
        return String(option.value) === String(this.value());
    }

    onDocumentClick(event: MouseEvent): void {
        if (!this.isOpen()) {
            return;
        }

        if (Date.now() < this.suppressOutsideCloseUntil) {
            return;
        }

        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        if (!this.hostElement.nativeElement.contains(target)) {
            this.isOpen.set(false);
        }
    }
}
