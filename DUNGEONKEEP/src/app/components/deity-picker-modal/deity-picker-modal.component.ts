import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, effect, input, output, signal } from '@angular/core';

import type { Deity } from '../../data/deities.data';

@Component({
    selector: 'app-deity-picker-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './deity-picker-modal.component.html',
    styleUrl: './deity-picker-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeityPickerModalComponent {
    readonly deities = input.required<ReadonlyArray<Deity>>();
    readonly currentFaith = input<string>('');

    readonly closed = output<void>();
    readonly confirmed = output<string>();

    readonly searchTerm = signal('');
    readonly selectedDeityName = signal('');
    readonly expandedDeityName = signal('');

    readonly filteredDeities = computed(() => {
        const query = this.searchTerm().trim().toLowerCase();
        const deities = this.deities();
        if (!query) {
            return deities;
        }

        return deities.filter((deity) =>
            deity.name.toLowerCase().includes(query)
            || deity.domain.toLowerCase().includes(query)
            || deity.pantheon.toLowerCase().includes(query)
            || deity.summary?.toLowerCase().includes(query)
            || deity.titles?.some((title) => title.toLowerCase().includes(query))
        );
    });

    constructor() {
        effect(() => {
            this.selectedDeityName.set(this.currentFaith());
        });
    }

    onSearchChanged(value: string): void {
        this.searchTerm.set(value);
    }

    toggleDeityDetails(deityName: string): void {
        this.selectedDeityName.set(deityName);
        this.expandedDeityName.update((current) => current === deityName ? '' : deityName);
    }

    useDeity(deityName: string): void {
        this.selectedDeityName.set(deityName);
    }

    getDeityWikiUrl(deityName: string): string {
        const slug = deityName.trim().replace(/\s+/g, '_');
        return `https://dungeonsdragons.fandom.com/wiki/${encodeURIComponent(slug)}`;
    }

    getDeitySummary(deity: Deity): string {
        if (deity.summary?.trim()) {
            return deity.summary;
        }

        return `${deity.name} is a ${deity.pantheon} deity associated with ${deity.domain.toLowerCase()}.`;
    }

    getDeityDoctrine(deity: Deity): string {
        if (deity.dogma?.trim()) {
            return deity.dogma;
        }

        const tags = this.getPortfolioTags(deity.domain).slice(0, 3).map((entry) => entry.toLowerCase());
        if (tags.length === 0) {
            return `${deity.name}'s faithful typically build their customs around service, identity, and shared ritual.`;
        }

        return `${deity.name}'s faithful usually center their rites around ${tags.join(', ')}, shaping daily conduct and vows around these ideals.`;
    }

    getDeityRelationships(deity: Deity): string {
        if (deity.relationships?.trim()) {
            return deity.relationships;
        }

        return `${deity.name} is most often invoked alongside other ${deity.pantheon} powers, while naturally conflicting with rivals tied to opposing portfolios.`;
    }

    getPrimaryLoreUrl(deity: Deity): string {
        return deity.sourceUrl ?? this.getDeityWikiUrl(deity.name);
    }

    getPrimaryLoreLabel(deity: Deity): string {
        return deity.sourceLabel ?? 'D&D Lore Wiki';
    }

    hasSecondarySource(deity: Deity): boolean {
        return !!deity.alternateSourceUrl?.trim();
    }

    getMetadataEntries(deity: Deity): ReadonlyArray<{ label: string; value: string }> {
        return [
            { label: 'Pantheon', value: deity.pantheon },
            { label: 'Domains', value: deity.domain },
            { label: 'Alignment', value: deity.alignment ?? '' },
            { label: 'Symbol', value: deity.symbol ?? '' },
            { label: 'Realm', value: deity.realm ?? '' },
            { label: 'Worshipers', value: deity.worshipers ?? '' },
            { label: 'Favored Weapon', value: deity.favoredWeapon ?? '' }
        ].filter((entry) => entry.value.trim().length > 0);
    }

    getPortfolioTags(domain: string): string[] {
        return domain
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    isExpanded(deityName: string): boolean {
        return this.expandedDeityName() === deityName;
    }

    isSelected(deityName: string): boolean {
        return this.selectedDeityName() === deityName;
    }

    close(): void {
        this.closed.emit();
    }

    @HostListener('document:dungeonkeep-close-overlays')
    handleCloseOverlayRequest(): void {
        this.close();
    }

    confirmSelection(): void {
        if (!this.selectedDeityName().trim()) {
            return;
        }

        this.confirmed.emit(this.selectedDeityName().trim());
    }
}
