import { Component, ChangeDetectionStrategy, input, output, signal, inject, effect, ElementRef, computed } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

export interface MultiSelectOption {
    value: string;
    label: string;
}

export interface MultiSelectOptionGroup {
    label: string;
    options: Array<string | MultiSelectOption>;
}

@Component({
    selector: 'app-multi-select-dropdown',
    standalone: true,
    imports: [CommonModule],
    host: {
        '[class.msd-host--open]': 'isOpen()'
    },
    templateUrl: './multi-select-dropdown.component.html',
    styleUrl: './multi-select-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDropdownComponent {
    private readonly document = inject(DOCUMENT);
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly defaultPanelMaxHeight = 300;
    private readonly viewportPadding = 12;
    private suppressOutsideCloseUntil = 0;

    readonly groups = input.required<ReadonlyArray<MultiSelectOptionGroup>>();
    readonly value = input<string[]>([]);
    readonly disabledOptions = input<string[]>([]);
    readonly placeholder = input<string>('Select...');
    readonly maxSelections = input<number | null>(null);
    readonly selectionMode = input<'single' | 'multiple'>('multiple');
    readonly changed = output<string[]>();

    readonly isOpen = signal(false);
    readonly opensUpward = signal(false);
    readonly panelAlignment = signal<'start' | 'end'>('start');
    readonly panelMaxHeight = signal(this.defaultPanelMaxHeight);
    readonly panelAvailableWidth = signal<number | null>(null);
    readonly isSingleSelect = computed(() => this.selectionMode() === 'single');
    readonly flatOptions = computed(() => this.groups().flatMap((group) => group.options));
    readonly triggerLabel = computed(() => {
        const values = this.value();
        if (values.length === 0) {
            return this.placeholder();
        }

        const labels = values.map((value) => this.resolveOptionLabel(value));

        return this.isSingleSelect() ? labels[0] : labels.join(', ');
    });
    readonly selectedCountLabel = computed(() => {
        if (this.isSingleSelect()) {
            return '';
        }

        const selectedCount = this.value().length;
        const maxSelections = this.maxSelections();

        if (!maxSelections) {
            return selectedCount > 0 ? `${selectedCount} selected` : '';
        }

        return `${selectedCount} of ${maxSelections} selected`;
    });

    constructor() {
        effect((onCleanup) => {
            if (!this.isOpen()) {
                this.opensUpward.set(false);
                this.panelMaxHeight.set(this.defaultPanelMaxHeight);
                this.panelAlignment.set('start');
                this.panelAvailableWidth.set(null);
                return;
            }

            const view = this.document.defaultView;
            const close = (event: MouseEvent) => {
                if (Date.now() < this.suppressOutsideCloseUntil) {
                    return;
                }

                const target = event.target;
                if (target instanceof Node && !this.el.nativeElement.contains(target)) {
                    this.isOpen.set(false);
                }
            };

            const updatePanelPosition = () => {
                const trigger = this.el.nativeElement.querySelector('.msd-trigger');
                const panel = this.el.nativeElement.querySelector('.msd-panel');

                if (!(trigger instanceof HTMLElement) || !(panel instanceof HTMLElement) || !view) {
                    return;
                }

                const viewportPadding = 12;
                const panelGap = 6;
                const triggerRect = trigger.getBoundingClientRect();
                const desiredPanelHeight = Math.min(panel.scrollHeight, this.defaultPanelMaxHeight);
                const desiredPanelWidth = panel.offsetWidth || panel.scrollWidth || triggerRect.width;
                const availableBelow = Math.max(0, view.innerHeight - triggerRect.bottom - viewportPadding - panelGap);
                const availableAbove = Math.max(0, triggerRect.top - viewportPadding - panelGap);
                const availableRight = Math.max(0, view.innerWidth - viewportPadding - triggerRect.left);
                const availableLeft = Math.max(0, triggerRect.right - viewportPadding);
                const shouldOpenUpward = desiredPanelHeight > availableBelow && availableAbove > availableBelow;
                const availableSpace = shouldOpenUpward ? availableAbove : availableBelow;
                const panelMaxHeight = Math.max(120, Math.min(this.defaultPanelMaxHeight, availableSpace));
                const startOverflow = triggerRect.left + desiredPanelWidth - (view.innerWidth - viewportPadding);
                const endOverflow = viewportPadding - (triggerRect.right - desiredPanelWidth);

                this.opensUpward.set(shouldOpenUpward);
                this.panelMaxHeight.set(panelMaxHeight);

                if (endOverflow > 0 && startOverflow <= 0) {
                    this.panelAlignment.set('end');
                } else if (startOverflow > 0 && endOverflow <= 0) {
                    this.panelAlignment.set('start');
                } else {
                    this.panelAlignment.set(startOverflow < endOverflow ? 'end' : 'start');
                }

                const availableWidth = this.panelAlignment() === 'end' ? availableLeft : availableRight;
                this.panelAvailableWidth.set(Math.max(triggerRect.width, availableWidth));
            };

            const frameId = view?.requestAnimationFrame(updatePanelPosition) ?? 0;
            const timeoutId = view?.setTimeout(() => this.document.addEventListener('click', close), 0) ?? 0;

            view?.addEventListener('resize', updatePanelPosition);
            this.document.addEventListener('scroll', updatePanelPosition, true);

            onCleanup(() => {
                view?.cancelAnimationFrame(frameId);
                view?.clearTimeout(timeoutId);
                view?.removeEventListener('resize', updatePanelPosition);
                this.document.removeEventListener('scroll', updatePanelPosition, true);
                this.document.removeEventListener('click', close);
            });
        });
    }

    isSelected(option: string | MultiSelectOption): boolean {
        return this.value().includes(this.optionValue(option));
    }

    isOptionDisabled(option: string | MultiSelectOption): boolean {
        const optionValue = this.optionValue(option);

        if (this.disabledOptions().includes(optionValue) && !this.isSelected(option)) {
            return true;
        }

        if (this.isSingleSelect()) {
            return false;
        }

        if (this.isSelected(option)) {
            return false;
        }

        const maxSelections = this.maxSelections();
        return maxSelections !== null && this.value().length >= maxSelections;
    }

    toggleOpen(): void {
        this.isOpen.update((open) => {
            const nextOpen = !open;
            if (nextOpen) {
                this.suppressOutsideCloseUntil = Date.now() + 150;
            }

            return nextOpen;
        });
    }

    onToggle(option: string, checked: boolean): void {
        if (this.isSingleSelect()) {
            const next = checked ? [option] : [];
            this.changed.emit(next);
            this.isOpen.set(false);
            return;
        }

        const current = this.value();
        const maxSelections = this.maxSelections();

        if (checked && maxSelections !== null && current.length >= maxSelections && !current.includes(option)) {
            return;
        }

        const next = checked ? [...current, option] : current.filter((value) => value !== option);
        this.changed.emit(next);
    }

    optionValue(option: string | MultiSelectOption): string {
        return typeof option === 'string' ? option : option.value;
    }

    optionLabel(option: string | MultiSelectOption): string {
        return typeof option === 'string' ? option : option.label;
    }

    getPanelMaxWidth(): number | null {
        const availableWidth = this.panelAvailableWidth();
        return availableWidth === null ? null : Math.max(availableWidth, 120);
    }

    private resolveOptionLabel(value: string): string {
        const matched = this.flatOptions().find((option) => this.optionValue(option) === value);
        return matched ? this.optionLabel(matched) : value;
    }
}
