import { Component, HostListener, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    personalityTraits,
    ideals,
    bonds,
    flaws,
    mannerisms,
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
    private static readonly allCategoriesValue = '__all__';

    characteristicType = input.required<'traits' | 'ideals' | 'bonds' | 'flaws' | 'mannerisms'>();
    selectedValues = input<string[]>([]);
    onClose = output<void>();
    onSubmit = output<string[]>();

    protected customEntry = '';
    protected searchQuery = '';
    protected readonly selectedCategory = signal(CharacteristicsModalComponent.allCategoriesValue);
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
            case 'mannerisms':
                return mannerisms;
        }
    });
    protected get categoryPills(): ReadonlyArray<{ label: string; value: string }> {
        const categories = Array.from(new Set(this.allSuggestions().map((suggestion) => suggestion.category?.trim() || this.inferCategory(suggestion.text))));

        return [
            { label: 'All', value: CharacteristicsModalComponent.allCategoriesValue },
            ...categories.map((category) => ({ label: category, value: category }))
        ];
    }

    protected get groupedSuggestions(): ReadonlyArray<{ category: string; suggestions: readonly CharacteristicSuggestion[] }> {
        const suggestions = this.filteredSuggestions;
        const groups = new Map<string, CharacteristicSuggestion[]>();

        for (const suggestion of suggestions) {
            const category = suggestion.category?.trim() || this.inferCategory(suggestion.text);
            const existing = groups.get(category);
            if (existing) {
                existing.push(suggestion);
            } else {
                groups.set(category, [suggestion]);
            }
        }

        return Array.from(groups.entries()).map(([category, suggestions]) => ({
            category,
            suggestions
        }));
    }

    constructor() {
        effect(() => {
            const deduped = Array.from(new Set((this.selectedValues() ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));
            this.selectedSuggestions.set(deduped);
        });

        effect(() => {
            this.characteristicType();
            this.selectedCategory.set(CharacteristicsModalComponent.allCategoriesValue);
        });
    }

    protected get filteredSuggestions(): readonly CharacteristicSuggestion[] {
        const selectedCategory = this.selectedCategory();
        let suggestions = this.allSuggestions();

        if (selectedCategory !== CharacteristicsModalComponent.allCategoriesValue) {
            suggestions = suggestions.filter((suggestion) => (suggestion.category?.trim() || this.inferCategory(suggestion.text)) === selectedCategory);
        }

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
            flaws: 'Flaws',
            mannerisms: 'Mannerisms'
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

    protected selectCategory(value: string): void {
        this.selectedCategory.set(value);
    }

    protected isCategorySelected(value: string): boolean {
        return this.selectedCategory() === value;
    }

    protected applyAndClose(): void {
        this.onSubmit.emit(this.selectedSuggestions());
        this.close();
    }

    @HostListener('document:dungeonkeep-close-overlays')
    protected handleCloseOverlayRequest(): void {
        this.close();
    }

    protected close(): void {
        this.onClose.emit();
    }

    private inferCategory(text: string): string {
        const normalized = text.toLowerCase();

        switch (this.characteristicType()) {
            case 'traits':
                return this.inferTraitCategory(normalized);
            case 'bonds':
                return this.inferBondCategory(normalized);
            case 'flaws':
                return this.inferFlawCategory(normalized);
            default:
                return 'General';
        }
    }

    private inferTraitCategory(text: string): string {
        if (this.includesAny(text, ['god', 'faith', 'temple', 'sacred', 'holy', 'omen', 'cosmic', 'philosoph', 'wise', 'wisdom'])) {
            return 'Beliefs';
        }

        if (this.includesAny(text, ['friend', 'enemy', 'people', 'person', 'talk', 'story', 'gossip', 'romantic', 'love', 'insult', 'polite', 'flattery', 'attention'])) {
            return 'Social';
        }

        if (this.includesAny(text, ['calm', 'optimistic', 'trust', 'bitter', 'serene', 'awkward', 'empat', 'emotion', 'anger', 'angry', 'mood'])) {
            return 'Temperament';
        }

        if (this.includesAny(text, ['animals', 'wolf', 'wilderness', 'owlbear', 'clan', 'survival', 'risk', 'danger', 'battle', 'war', 'fight', 'hands dirty'])) {
            return 'Instincts';
        }

        if (this.includesAny(text, ['perfect', 'perfection', 'destiny', 'action', 'fair play', 'hard work', 'mystery', 'work', 'profession', 'deal', 'value', 'goal'])) {
            return 'Drive';
        }

        return 'General';
    }

    private inferBondCategory(text: string): string {
        if (this.includesAny(text, ['family', 'child', 'sweetheart', 'love', 'paramour', 'home', 'clan', 'tribe', 'house', 'sovereign'])) {
            return 'Family and Love';
        }

        if (this.includesAny(text, ['revenge', 'wrath', 'vengeance', 'destroyed', 'bully', 'heretic', 'enemies', 'ruin', 'confront'])) {
            return 'Revenge';
        }

        if (this.includesAny(text, ['temple', 'faith', 'sacred', 'text', 'library', 'university', 'scriptorium', 'monastery', 'knowledge', 'discovery'])) {
            return 'Faith and Calling';
        }

        if (this.includesAny(text, ['protect', 'defend', 'duty', 'students', 'people', 'served with', 'cannot protect themselves', 'friend behind', 'fight for'])) {
            return 'Duty';
        }

        if (this.includesAny(text, ['guild', 'workshop', 'trade', 'artisan', 'instrument', 'ship', 'captain', 'crew', 'business', 'wealth'])) {
            return 'Craft and Ambition';
        }

        if (this.includesAny(text, ['secret', 'hunting me', 'hide', 'wanted', 'sold my soul', 'disaster', 'terrible', 'wrong hands'])) {
            return 'Burdens';
        }

        return 'Legacy';
    }

    private inferFlawCategory(text: string): string {
        if (this.includesAny(text, ['greedy', 'money', 'gold', 'luxuries', 'valuable', 'rare', 'priceless', 'title', 'pocket', 'drink', 'intoxicants', 'carnal'])) {
            return 'Temptation';
        }

        if (this.includesAny(text, ['pride', 'fame', 'renown', 'beneath me', 'revolve around me', 'tyrant', 'wrong', 'ego', 'superior'])) {
            return 'Pride';
        }

        if (this.includesAny(text, ['run', 'fear', 'quivering', 'coward', 'outnumbered', 'dangerous', 'preserve my own hide'])) {
            return 'Fear';
        }

        if (this.includesAny(text, ['trust', 'suspicious', 'cheat', 'resentment', 'insult', 'threats', 'allies', 'never fully trust'])) {
            return 'Distrust';
        }

        if (this.includesAny(text, ['violent', 'kill', 'fight fair', 'bloodthirsty', 'hatred', 'cruel', 'nature\'s way', 'demon'])) {
            return 'Cruelty';
        }

        if (this.includesAny(text, ['obsessed', 'secret', 'knowledge', 'mystery', 'complicated', 'distracted', 'arguments', 'say anything', 'keep that mistake secret'])) {
            return 'Obsession';
        }

        return 'Recklessness';
    }

    private includesAny(text: string, terms: readonly string[]): boolean {
        return terms.some((term) => text.includes(term));
    }
}
