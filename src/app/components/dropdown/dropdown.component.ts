import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-dropdown',
    standalone: true,
    imports: [CommonModule],
    template: `
        <select
            [attr.id]="id()"
            [attr.aria-label]="ariaLabel()"
            [value]="value()"
            (change)="onValueChange($any($event.target).value)"
            [class]="'app-dropdown ' + (size() === 'wide' ? 'app-dropdown--wide' : 'app-dropdown--compact')"
            [disabled]="disabled()"
        >
            @if (placeholder(); as ph) {
            <option value="" [disabled]="true">{{ ph }}</option>
            }
            @for (option of options(); track option.value) {
            <option [value]="option.value" [disabled]="option.disabled || false">{{ option.label }}</option>
            }
        </select>
    `,
    styles: [`
        .app-dropdown {
            min-height: 38px;
            padding: 0 12px;
            border-radius: 8px;
            border: 1px solid var(--panel-border);
            background: var(--surface-raised);
            color: var(--text-main);
            font: inherit;
            cursor: pointer;
            transition: all 150ms ease-out;

            &:hover:not(:disabled) {
                border-color: var(--accent-primary);
                background: color-mix(in srgb, var(--surface-raised) 90%, var(--accent-primary) 10%);
            }

            &:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        .app-dropdown--wide {
            width: 100%;
        }

        .app-dropdown--compact {
            min-width: 120px;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
    readonly id = input<string>('');
    readonly ariaLabel = input<string>('');
    readonly value = input<string | number>('');
    readonly options = input.required<ReadonlyArray<DropdownOption>>();
    readonly placeholder = input<string>('');
    readonly size = input<'wide' | 'compact'>('compact');
    readonly disabled = input<boolean>(false);
    readonly changed = output<string | number>();

    onValueChange(newValue: string | number): void {
        this.changed.emit(newValue);
    }
}
