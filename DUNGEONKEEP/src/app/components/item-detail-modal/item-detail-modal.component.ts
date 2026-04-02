import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import type { InventoryEntry } from '../../data/new-character-standard-page.types';

@Component({
    selector: 'app-item-detail-modal',
    imports: [CommonModule],
    templateUrl: './item-detail-modal.component.html',
    styleUrl: './item-detail-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDetailModalComponent {
    readonly item = input.required<InventoryEntry>();
    readonly closed = output<void>();
    readonly addRequested = output<number>();
    readonly addQuantity = signal(1);

    close(): void {
        this.closed.emit();
    }

    decrementQuantity(): void {
        this.addQuantity.update((value) => Math.max(1, value - 1));
    }

    incrementQuantity(): void {
        this.addQuantity.update((value) => value + 1);
    }

    onQuantityInputChanged(value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.addQuantity.set(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
    }

    requestAdd(): void {
        this.addRequested.emit(this.addQuantity());
    }

    primaryTag(): string {
        const category = this.item().category?.trim();
        return category ? category.toUpperCase() : 'ITEM';
    }
}
