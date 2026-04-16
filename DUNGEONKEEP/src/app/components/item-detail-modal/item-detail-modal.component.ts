import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';

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
    readonly showAddAction = input(true);
    readonly closed = output<void>();
    readonly addRequested = output<number>();
    readonly addQuantity = signal(1);

    close(): void {
        this.closed.emit();
    }

    @HostListener('document:dungeonkeep-close-overlays')
    handleCloseOverlayRequest(): void {
        this.close();
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

    summaryText(): string {
        return this.item().summary?.trim() || this.item().notes?.trim() || 'No additional notes are available for this item yet.';
    }

    itemHighlights(): string[] {
        const summary = this.normalizeText(this.summaryText());
        const seen = new Set<string>();

        return (this.item().detailLines ?? []).filter((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                return false;
            }

            if (trimmedLine === `Source group: ${this.item().sourceLabel}`) {
                return false;
            }

            if (trimmedLine === `Rarity: ${this.item().rarity}`) {
                return false;
            }

            if (trimmedLine === `Attunement: ${this.item().attunement}`) {
                return false;
            }

            const normalizedLine = this.normalizeText(trimmedLine);
            if (!normalizedLine || summary.includes(normalizedLine)) {
                return false;
            }

            if (seen.has(normalizedLine)) {
                return false;
            }

            seen.add(normalizedLine);
            return true;
        });
    }

    rulesText(): string | null {
        const notes = this.item().notes?.trim();
        if (!notes) {
            return null;
        }

        return this.normalizeText(notes) === this.normalizeText(this.summaryText()) ? null : notes;
    }

    itemMetaTags(): string[] {
        const tags = [this.item().rarity, this.item().attunement, this.item().sourceLabel]
            .filter((value): value is string => Boolean(value?.trim()))
            .map((value) => value.trim());

        return tags.length > 0 ? tags : [this.primaryTag()];
    }

    primaryTag(): string {
        const category = this.item().category?.trim();
        return category ? category.toUpperCase() : 'ITEM';
    }

    private normalizeText(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[.,;:!?]+/g, '')
            .replace(/\s+/g, ' ');
    }
}
