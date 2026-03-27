import { Component, computed, input, output } from '@angular/core';
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
    onClose = output<void>();
    onSubmit = output<string>();

    protected customEntry = '';
    protected searchQuery = '';
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

    protected selectSuggestion(suggestion: CharacteristicSuggestion): void {
        this.onSubmit.emit(suggestion.text);
        this.close();
    }

    protected submitCustomEntry(): void {
        if (this.customEntry.trim()) {
            this.onSubmit.emit(this.customEntry.trim());
            this.close();
        }
    }

    protected close(): void {
        this.onClose.emit();
    }
}
