import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output, input, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ActiveInfoModal } from '../../data/new-character-standard-page.types';
import { classCatalogEntries, type ClassCatalogEntry } from '../../data/class-catalog.data';
import { proficiencyBonusByLevel } from '../../data/class-progression.data';
import { speciesNameToSlug } from '../../data/species-catalog.data';

export interface ModalProgressionRow {
    level: number;
    profBonus: string;
    features: string;
    colValues: string[];
}

@Component({
    selector: 'app-new-character-info-modal',
    imports: [CommonModule, RouterLink],
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

    readonly classEntry = computed<ClassCatalogEntry | null>(() => {
        const m = this.modal();
        if (m.type !== 'class') return null;
        return classCatalogEntries.find(c => c.name === m.info.name) ?? null;
    });

    readonly progressionRows = computed<ModalProgressionRow[]>(() => {
        const entry = this.classEntry();
        if (!entry) return [];
        return entry.levelFeatureNames.map((featureNames, i) => ({
            level: i + 1,
            profBonus: proficiencyBonusByLevel[i],
            features: featureNames.length ? featureNames.join(', ') : '—',
            colValues: entry.progressionColumns.map(col => col.values[i]),
        }));
    });

    readonly progressionGroupHeader = computed(() => {
        const entry = this.classEntry();
        if (!entry || !entry.progressionColumns.some(c => c.group)) return null;
        const groups: { label: string; count: number }[] = [];
        for (const col of entry.progressionColumns) {
            if (!col.group) continue;
            const last = groups.at(-1);
            if (last && last.label === col.group) last.count++;
            else groups.push({ label: col.group, count: 1 });
        }
        return groups;
    });

    readonly speciesRulesLink = computed(() => {
        const modal = this.modal();
        if (modal.type !== 'species') {
            return ['/rules/species'];
        }

        return ['/rules/species', speciesNameToSlug(modal.info.name)];
    });

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
