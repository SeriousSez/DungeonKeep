import { Component, ChangeDetectionStrategy, input, output, signal, inject, effect, ElementRef, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface MultiSelectOptionGroup {
    label: string;
    options: string[];
}

@Component({
    selector: 'app-multi-select-dropdown',
    standalone: true,
    templateUrl: './multi-select-dropdown.component.html',
    styleUrl: './multi-select-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDropdownComponent {
    private readonly document = inject(DOCUMENT);
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly defaultPanelMaxHeight = 300;

    readonly groups = input.required<ReadonlyArray<MultiSelectOptionGroup>>();
    readonly value = input<string[]>([]);
    readonly disabledOptions = input<string[]>([]);
    readonly placeholder = input<string>('Select...');
    readonly maxSelections = input<number | null>(null);
    readonly selectionMode = input<'single' | 'multiple'>('multiple');
    readonly changed = output<string[]>();

    readonly isOpen = signal(false);
    readonly opensUpward = signal(false);
    readonly panelMaxHeight = signal(this.defaultPanelMaxHeight);
    readonly isSingleSelect = computed(() => this.selectionMode() === 'single');
    readonly triggerLabel = computed(() => {
        const values = this.value();
        if (values.length === 0) {
            return this.placeholder();
        }

        return this.isSingleSelect() ? values[0] : values.join(', ');
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
                return;
            }

            const view = this.document.defaultView;
            const close = (event: MouseEvent) => {
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
                const triggerRect = trigger.getBoundingClientRect();
                const desiredPanelHeight = Math.min(panel.scrollHeight, this.defaultPanelMaxHeight);
                const availableBelow = Math.max(0, view.innerHeight - triggerRect.bottom - viewportPadding);
                const availableAbove = Math.max(0, triggerRect.top - viewportPadding);
                const shouldOpenUpward = desiredPanelHeight > availableBelow && availableAbove > availableBelow;
                const availableSpace = shouldOpenUpward ? availableAbove : availableBelow;

                this.opensUpward.set(shouldOpenUpward);
                this.panelMaxHeight.set(Math.max(0, Math.min(this.defaultPanelMaxHeight, availableSpace)));
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

    isSelected(option: string): boolean {
        return this.value().includes(option);
    }

    isOptionDisabled(option: string): boolean {
        if (this.disabledOptions().includes(option) && !this.isSelected(option)) {
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
        this.isOpen.update((open) => !open);
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
}
