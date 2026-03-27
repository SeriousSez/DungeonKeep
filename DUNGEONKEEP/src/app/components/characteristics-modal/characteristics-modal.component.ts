import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    personalityTraits,
    ideals,
    bonds,
    flaws,
    CharacteristicSuggestion
} from '../../data/characteristics.data';

@Component({
    selector: 'app-characteristics-modal',
    templateUrl: './characteristics-modal.component.html',
    styleUrl: './characteristics-modal.component.scss',
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class CharacteristicsModalComponent {
    characteristicType = input.required<'traits' | 'ideals' | 'bonds' | 'flaws'>();
    selectedValues = input<string[]>([]);
    onClose = output<void>();
    onSubmit = output<string[]>();

    protected customEntry = '';
    protected searchQuery = '';
    protected selectedSuggestions = signal<string[]>([]);
    protected readonly allSuggestions = computed<readonly CharacteristicSuggestion[]>(() => {
        switch (this.characteristicType()) {
            case 'traits':
                return personalityTraits;
            case 'ideals':
                return ideals;
            case 'bonds':
                return bonds;
            case 'flaws':
                return flaws;
        }
    });

    constructor() {
        effect(() => {
            const deduped = Array.from(new Set((this.selectedValues() ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));
            this.selectedSuggestions.set(deduped);
        });
    }

    protected get filteredSuggestions(): readonly CharacteristicSuggestion[] {
        const suggestions = this.allSuggestions();
        if (!this.searchQuery.trim()) {
            return suggestions;
        }
        const query = this.searchQuery.toLowerCase();
        return suggestions.filter((s) => s.text.toLowerCase().includes(query));
    }

    protected get displayTitle(): string {
        const typeLabels: Record<string, string> = {
            traits: 'Personality Traits',
            ideals: 'Ideals',
            bonds: 'Bonds',
            flaws: 'Flaws'
        };
        return typeLabels[this.characteristicType()] || 'Characteristics';
    }

    protected toggleSuggestion(suggestion: CharacteristicSuggestion): void {
        const value = suggestion.text.trim();
        this.selectedSuggestions.update((current) => {
            if (current.includes(value)) {
                return current.filter((entry) => entry !== value);
            }

            return [...current, value];
        });
    }

    protected addCustomEntry(): void {
        if (this.customEntry.trim()) {
            const value = this.customEntry.trim();
            this.selectedSuggestions.update((current) => {
                if (current.includes(value)) {
                    return current;
                }

                return [...current, value];
            });
            this.customEntry = '';
        }
    }

    protected isSuggestionSelected(suggestion: CharacteristicSuggestion): boolean {
        return this.selectedSuggestions().includes(suggestion.text.trim());
    }

    protected applyAndClose(): void {
        this.onSubmit.emit(this.selectedSuggestions());
        this.close();
    }

    protected close(): void {
        this.onClose.emit();
    }
}
