import { Component, ChangeDetectionStrategy, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
}

@Component({
    selector: 'app-dropdown',
    standalone: true,
    imports: [CommonModule],
    host: {
        '(document:click)': 'onDocumentClick($event)'
    },
    templateUrl: './dropdown.component.html',
    styleUrl: './dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
    private readonly hostElement = inject(ElementRef<HTMLElement>);

    readonly id = input<string>('');
    readonly ariaLabel = input<string>('');
    readonly value = input<string | number>('');
    readonly options = input.required<ReadonlyArray<DropdownOption>>();
    readonly placeholder = input<string>('');
    readonly minWidth = input<number | null>(null);
    readonly size = input<'wide' | 'compact' | 'narrow'>('compact');
    readonly disabled = input<boolean>(false);
    readonly searchable = input<boolean>(false);
    readonly searchPlaceholder = input<string>('Search options...');
    readonly changed = output<string | number>();

    readonly isOpen = signal(false);
    readonly searchTerm = signal('');

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

    onValueChange(newValue: string | number): void {
        this.changed.emit(newValue);
    }

    toggleOpen(): void {
        if (this.disabled()) {
            return;
        }

        this.isOpen.update((open) => !open);
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

        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }

        if (!this.hostElement.nativeElement.contains(target)) {
            this.isOpen.set(false);
        }
    }
}
