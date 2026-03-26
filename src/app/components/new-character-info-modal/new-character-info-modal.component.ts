import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, input, signal } from '@angular/core';

import type { ActiveInfoModal } from '../../data/new-character-standard-page.types';

@Component({
    selector: 'app-new-character-info-modal',
    imports: [CommonModule],
    templateUrl: './new-character-info-modal.component.html',
    styleUrl: './new-character-info-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewCharacterInfoModalComponent {
    readonly modal = input.required<ActiveInfoModal>();
    readonly closed = output<void>();
    readonly confirmed = output<ActiveInfoModal>();

    readonly showExtendedInfo = signal(false);
    readonly expandedMilestoneIndexes = signal<Set<number>>(new Set<number>());
    readonly expandedFeatureNoteIndexes = signal<Set<number>>(new Set<number>());

    close(): void {
        this.closed.emit();
    }

    confirm(): void {
        this.confirmed.emit(this.modal());
    }

    toggleExtendedInfo(): void {
        this.showExtendedInfo.update((value) => !value);
    }

    toggleMilestone(index: number): void {
        const next = new Set(this.expandedMilestoneIndexes());
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        this.expandedMilestoneIndexes.set(next);
    }

    toggleFeatureNote(index: number): void {
        const next = new Set(this.expandedFeatureNoteIndexes());
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        this.expandedFeatureNoteIndexes.set(next);
    }

    isMilestoneExpanded(index: number): boolean {
        return this.expandedMilestoneIndexes().has(index);
    }

    isFeatureNoteExpanded(index: number): boolean {
        return this.expandedFeatureNoteIndexes().has(index);
    }

    visibleMilestoneCount(total: number): number {
        return this.showExtendedInfo() ? total : Math.min(6, total);
    }

    visibleFeatureNoteCount(total: number): number {
        return this.showExtendedInfo() ? total : Math.min(4, total);
    }
}
