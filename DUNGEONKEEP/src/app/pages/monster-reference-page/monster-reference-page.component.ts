import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { loadMonsterReferenceEntries, saveMonsterReferenceEntries } from '../../data/monster-reference.storage';
import { MonsterReferenceEntry } from '../../models/monster-reference.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';

type MonsterSortOption = 'recent' | 'name' | 'cr-low' | 'cr-high';

interface MonsterReferenceDraft {
    name: string;
    challengeRating: string;
    creatureType: string;
    sourceUrl: string;
    sourceLabel: string;
    tags: string;
    notes: string;
}

interface SourceShortcut {
    label: string;
    description: string;
    url: string;
}

const creatureTypeOptions: DropdownOption[] = [
    { value: 'All', label: 'All Types' },
    { value: 'Aberration', label: 'Aberration' },
    { value: 'Beast', label: 'Beast' },
    { value: 'Celestial', label: 'Celestial' },
    { value: 'Construct', label: 'Construct' },
    { value: 'Dragon', label: 'Dragon' },
    { value: 'Elemental', label: 'Elemental' },
    { value: 'Fey', label: 'Fey' },
    { value: 'Fiend', label: 'Fiend' },
    { value: 'Giant', label: 'Giant' },
    { value: 'Humanoid', label: 'Humanoid' },
    { value: 'Monstrosity', label: 'Monstrosity' },
    { value: 'Ooze', label: 'Ooze' },
    { value: 'Plant', label: 'Plant' },
    { value: 'Undead', label: 'Undead' },
    { value: 'Other', label: 'Other' }
];

const sortOptions: DropdownOption[] = [
    { value: 'recent', label: 'Recently Updated', description: 'Show the most recently edited monsters first.' },
    { value: 'name', label: 'Name', description: 'Sort the catalog alphabetically.' },
    { value: 'cr-low', label: 'CR Low to High', description: 'Group easier threats before deadlier ones.' },
    { value: 'cr-high', label: 'CR High to Low', description: 'Bubble boss threats to the top.' }
];

const officialSourceShortcuts: SourceShortcut[] = [
    {
        label: 'Browse All Monsters',
        description: 'Open the official D&D Beyond monster index sorted by challenge rating.',
        url: 'https://www.dndbeyond.com/monsters?sort=cr'
    },
    {
        label: 'Open SRD Reference',
        description: 'Cross-check open rules material when you only need the free-reference subset.',
        url: 'https://www.dndbeyond.com/srd'
    }
];

@Component({
    selector: 'app-monster-reference-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent, ConfirmModalComponent],
    templateUrl: './monster-reference-page.component.html',
    styleUrl: './monster-reference-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterReferencePageComponent {
    readonly officialSourceShortcuts = officialSourceShortcuts;
    readonly creatureTypeOptions = creatureTypeOptions;
    readonly sortOptions = sortOptions;

    readonly entries = signal<MonsterReferenceEntry[]>(loadMonsterReferenceEntries());
    readonly searchTerm = signal('');
    readonly selectedType = signal('All');
    readonly selectedSource = signal('All sources');
    readonly selectedSort = signal<MonsterSortOption>('recent');
    readonly editingEntryId = signal<string | null>(null);
    readonly pendingDelete = signal<MonsterReferenceEntry | null>(null);
    readonly draftError = signal('');
    readonly draftMessage = signal('');
    readonly draft = signal<MonsterReferenceDraft>(this.createEmptyDraft());

    readonly sourceOptions = computed<DropdownOption[]>(() => {
        const labels = Array.from(new Set(this.entries().map((entry) => entry.sourceLabel.trim()).filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));

        return [
            { value: 'All sources', label: 'All Sources' },
            ...labels.map((label) => ({ value: label, label }))
        ];
    });

    readonly filteredEntries = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        const selectedType = this.selectedType();
        const selectedSource = this.selectedSource();
        const selectedSort = this.selectedSort();

        const filtered = this.entries()
            .filter((entry) => selectedType === 'All' || entry.creatureType === selectedType)
            .filter((entry) => selectedSource === 'All sources' || entry.sourceLabel === selectedSource)
            .filter((entry) => {
                if (!query) {
                    return true;
                }

                const haystack = [
                    entry.name,
                    entry.challengeRating,
                    entry.creatureType,
                    entry.sourceLabel,
                    entry.notes,
                    entry.tags.join(' ')
                ].join(' ').toLowerCase();

                return haystack.includes(query);
            });

        const sorted = [...filtered];
        switch (selectedSort) {
            case 'name':
                sorted.sort((left, right) => left.name.localeCompare(right.name));
                break;
            case 'cr-low':
                sorted.sort((left, right) => this.parseChallengeRating(left.challengeRating) - this.parseChallengeRating(right.challengeRating) || left.name.localeCompare(right.name));
                break;
            case 'cr-high':
                sorted.sort((left, right) => this.parseChallengeRating(right.challengeRating) - this.parseChallengeRating(left.challengeRating) || left.name.localeCompare(right.name));
                break;
            case 'recent':
            default:
                sorted.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated) || left.name.localeCompare(right.name));
                break;
        }

        return sorted;
    });

    readonly trackedCount = computed(() => this.entries().length);
    readonly notedCount = computed(() => this.entries().filter((entry) => entry.notes.trim().length > 0).length);
    readonly uniqueTypeCount = computed(() => new Set(this.entries().map((entry) => entry.creatureType).filter(Boolean)).size);
    readonly uniqueTagCount = computed(() => new Set(this.entries().flatMap((entry) => entry.tags)).size);
    readonly isEditing = computed(() => this.editingEntryId() !== null);
    readonly deleteModalOpen = computed(() => this.pendingDelete() !== null);
    readonly deleteModalMessage = computed(() => {
        const pending = this.pendingDelete();
        if (!pending) {
            return 'Remove this monster reference?';
        }

        return `Remove ${pending.name} from your personal monster catalog? Notes and tags saved for it on this device will be lost.`;
    });

    updateSearchTerm(value: string): void {
        this.searchTerm.set(value);
    }

    updateSelectedType(value: string | number): void {
        this.selectedType.set(String(value || 'All'));
    }

    updateSelectedSource(value: string | number): void {
        this.selectedSource.set(String(value || 'All sources'));
    }

    updateSelectedSort(value: string | number): void {
        const nextValue = String(value) as MonsterSortOption;
        this.selectedSort.set(nextValue === 'name' || nextValue === 'cr-low' || nextValue === 'cr-high' ? nextValue : 'recent');
    }

    updateDraftField(field: keyof MonsterReferenceDraft, value: string): void {
        this.draft.update((draft) => ({ ...draft, [field]: value }));
    }

    updateDraftCreatureType(value: string | number): void {
        this.updateDraftField('creatureType', String(value));
    }

    saveDraft(): void {
        const draft = this.draft();
        const normalizedName = draft.name.trim();
        const normalizedUrl = draft.sourceUrl.trim();

        if (!normalizedName) {
            this.draftError.set('Monster name is required.');
            this.draftMessage.set('');
            return;
        }

        if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) {
            this.draftError.set('Add a valid official source URL so this entry can open the canonical monster page.');
            this.draftMessage.set('');
            return;
        }

        const timestamp = new Date().toISOString();
        const editingId = this.editingEntryId();
        const nextEntry: MonsterReferenceEntry = {
            id: editingId ?? this.generateId('monster-ref'),
            name: normalizedName,
            challengeRating: draft.challengeRating.trim(),
            creatureType: draft.creatureType.trim() || 'Other',
            tags: this.normalizeTags(draft.tags),
            sourceUrl: normalizedUrl,
            sourceLabel: draft.sourceLabel.trim() || this.deriveSourceLabel(normalizedUrl),
            notes: draft.notes.trim(),
            lastUpdated: timestamp
        };

        const updatedEntries = editingId
            ? this.entries().map((entry) => entry.id === editingId ? nextEntry : entry)
            : [nextEntry, ...this.entries()];

        this.entries.set(updatedEntries);
        saveMonsterReferenceEntries(updatedEntries);
        this.editingEntryId.set(null);
        this.draft.set(this.createEmptyDraft());
        this.draftError.set('');
        this.draftMessage.set(editingId ? 'Monster reference updated.' : 'Monster reference saved.');
    }

    editEntry(entryId: string): void {
        const entry = this.entries().find((item) => item.id === entryId);
        if (!entry) {
            return;
        }

        this.editingEntryId.set(entry.id);
        this.draft.set({
            name: entry.name,
            challengeRating: entry.challengeRating,
            creatureType: entry.creatureType,
            sourceUrl: entry.sourceUrl,
            sourceLabel: entry.sourceLabel,
            tags: entry.tags.join(', '),
            notes: entry.notes
        });
        this.draftError.set('');
        this.draftMessage.set('Editing monster reference.');
    }

    cancelEdit(): void {
        this.editingEntryId.set(null);
        this.draft.set(this.createEmptyDraft());
        this.draftError.set('');
        this.draftMessage.set('');
    }

    requestDelete(entryId: string): void {
        const entry = this.entries().find((item) => item.id === entryId) ?? null;
        this.pendingDelete.set(entry);
    }

    confirmDelete(): void {
        const pending = this.pendingDelete();
        if (!pending) {
            return;
        }

        const updatedEntries = this.entries().filter((entry) => entry.id !== pending.id);
        this.entries.set(updatedEntries);
        saveMonsterReferenceEntries(updatedEntries);
        if (this.editingEntryId() === pending.id) {
            this.cancelEdit();
        }

        this.pendingDelete.set(null);
        this.draftMessage.set('Monster reference removed.');
        this.draftError.set('');
    }

    closeDeleteModal(): void {
        this.pendingDelete.set(null);
    }

    private createEmptyDraft(): MonsterReferenceDraft {
        return {
            name: '',
            challengeRating: '',
            creatureType: 'Humanoid',
            sourceUrl: '',
            sourceLabel: 'D&D Beyond',
            tags: '',
            notes: ''
        };
    }

    private normalizeTags(value: string): string[] {
        return Array.from(new Set(
            value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
        )).sort((left, right) => left.localeCompare(right));
    }

    private deriveSourceLabel(url: string): string {
        try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            return hostname === 'dndbeyond.com' ? 'D&D Beyond' : hostname;
        } catch {
            return 'Reference Link';
        }
    }

    private parseChallengeRating(value: string): number {
        const normalized = value.trim();
        if (!normalized) {
            return -1;
        }

        if (normalized.includes('/')) {
            const [numerator, denominator] = normalized.split('/').map((part) => Number(part));
            return denominator ? numerator / denominator : -1;
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : -1;
    }

    private generateId(prefix: string): string {
        return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    }
}