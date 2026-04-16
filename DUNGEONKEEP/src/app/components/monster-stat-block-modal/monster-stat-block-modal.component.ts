import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, input, output } from '@angular/core';

import { MonsterCatalogEntry, MonsterTextSectionEntry } from '../../models/monster-reference.models';

@Component({
    selector: 'app-monster-stat-block-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './monster-stat-block-modal.component.html',
    styleUrl: './monster-stat-block-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterStatBlockModalComponent {
    readonly monster = input.required<MonsterCatalogEntry>();
    readonly closed = output<void>();

    readonly profileTags = computed(() => {
        const tags = [
            this.monster().challengeRating ? `CR ${this.monster().challengeRating}` : '',
            this.monster().sourceLabel,
            this.monster().legendary ? 'Legendary' : '',
            this.monster().sourceUrl ? 'Stat Block Link' : ''
        ].filter((value) => value.trim().length > 0);

        return tags;
    });

    readonly abilityRows = computed(() => [
        { label: 'STR', value: this.monster().abilityScores.strength },
        { label: 'DEX', value: this.monster().abilityScores.dexterity },
        { label: 'CON', value: this.monster().abilityScores.constitution },
        { label: 'INT', value: this.monster().abilityScores.intelligence },
        { label: 'WIS', value: this.monster().abilityScores.wisdom },
        { label: 'CHA', value: this.monster().abilityScores.charisma }
    ]);

    readonly supplementalDetails = computed(() => [
        { label: 'Saving Throws', value: this.monster().savingThrows },
        { label: 'Skills', value: this.monster().skills },
        { label: 'Damage Vulnerabilities', value: this.monster().damageVulnerabilities },
        { label: 'Damage Resistances', value: this.monster().damageResistances },
        { label: 'Damage Immunities', value: this.monster().damageImmunities },
        { label: 'Condition Immunities', value: this.monster().conditionImmunities },
        { label: 'Senses', value: this.monster().senses },
        { label: 'Languages', value: this.monster().languages },
        { label: 'XP', value: this.monster().challengeXp }
    ].filter((item) => item.value.trim().length > 0));

    readonly textSections = computed(() => [
        { heading: 'Traits', entries: this.monster().traits },
        { heading: 'Actions', entries: this.monster().actions },
        { heading: 'Reactions', entries: this.monster().reactions },
        { heading: 'Legendary Actions', entries: this.monster().legendaryActions }
    ].filter((section) => section.entries.length > 0));

    close(): void {
        this.closed.emit();
    }

    @HostListener('document:dungeonkeep-close-overlays')
    handleCloseOverlayRequest(): void {
        this.close();
    }

    subtitle(): string {
        const details = [this.monster().size, this.monster().creatureType, this.monster().alignment]
            .map((value) => value.trim())
            .filter(Boolean);

        if (details.length === 0) {
            return 'Monster reference';
        }

        const [size, type, alignment] = details;
        return `${size} ${type}${alignment ? `, ${alignment}` : ''}`;
    }

    armorClassText(): string {
        return this.monster().armorClass == null ? '—' : String(this.monster().armorClass);
    }

    hitPointsText(): string {
        return this.monster().hitPoints == null ? '—' : String(this.monster().hitPoints);
    }

    speedText(): string {
        const speed = this.monster().speed.trim();
        return speed || '—';
    }

    scoreText(value: number | null): string {
        return value == null ? '—' : String(value);
    }

    modifierText(value: number | null): string {
        if (value == null) {
            return '—';
        }

        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    trackTextSection(index: number, section: { heading: string; entries: MonsterTextSectionEntry[] }): string {
        return `${section.heading}-${index}`;
    }

    formatEntryText(value: string): string {
        const escaped = this.escapeHtml(value);

        return escaped
            .replace(/\b(Melee or Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Melee Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Hit)\s*:/g, '<em>$1</em>:');
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}