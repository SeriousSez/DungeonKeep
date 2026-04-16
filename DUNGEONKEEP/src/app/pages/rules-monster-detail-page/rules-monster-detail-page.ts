import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { monsterCatalog } from '../../data/monster-catalog.generated';
import { MonsterCatalogEntry, MonsterTextSectionEntry } from '../../models/monster-reference.models';

const normalizedMonsterCatalog = monsterCatalog.map((entry) => normalizeMonsterCatalogEntry(entry));

@Component({
  selector: 'app-rules-monster-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rules-monster-detail-page.html',
  styleUrl: './rules-monster-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesMonsterDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly monster = signal<MonsterCatalogEntry | null>(null);

  readonly profileTags = computed(() => {
    const monster = this.monster();
    if (!monster) {
      return [] as string[];
    }

    return [
      monster.challengeRating ? `CR ${monster.challengeRating}` : '',
      monster.sourceLabel,
      monster.legendary ? 'Legendary' : '',
      monster.sourceUrl ? 'Stat Block Link' : ''
    ].filter((value) => value.trim().length > 0);
  });

  readonly abilityRows = computed(() => {
    const monster = this.monster();
    if (!monster) {
      return [] as Array<{ label: string; value: number | null }>;
    }

    return [
      { label: 'STR', value: monster.abilityScores.strength },
      { label: 'DEX', value: monster.abilityScores.dexterity },
      { label: 'CON', value: monster.abilityScores.constitution },
      { label: 'INT', value: monster.abilityScores.intelligence },
      { label: 'WIS', value: monster.abilityScores.wisdom },
      { label: 'CHA', value: monster.abilityScores.charisma }
    ];
  });

  readonly supplementalDetails = computed(() => {
    const monster = this.monster();
    if (!monster) {
      return [] as Array<{ label: string; value: string }>;
    }

    return [
      { label: 'Saving Throws', value: monster.savingThrows },
      { label: 'Skills', value: monster.skills },
      { label: 'Damage Vulnerabilities', value: monster.damageVulnerabilities },
      { label: 'Damage Resistances', value: monster.damageResistances },
      { label: 'Damage Immunities', value: monster.damageImmunities },
      { label: 'Condition Immunities', value: monster.conditionImmunities },
      { label: 'Senses', value: monster.senses },
      { label: 'Languages', value: monster.languages },
      { label: 'XP', value: monster.challengeXp }
    ].filter((item) => item.value.trim().length > 0);
  });

  readonly textSections = computed(() => {
    const monster = this.monster();
    if (!monster) {
      return [] as Array<{ heading: string; entries: MonsterTextSectionEntry[] }>;
    }

    return [
      { heading: 'Traits', entries: monster.traits },
      { heading: 'Actions', entries: monster.actions },
      { heading: 'Reactions', entries: monster.reactions },
      { heading: 'Legendary Actions', entries: monster.legendaryActions }
    ].filter((section) => section.entries.length > 0);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = (params.get('monsterSlug') ?? '').trim().toLowerCase();
        this.monster.set(findMonsterBySlug(slug));
        this.cdr.detectChanges();
      });
  }

  subtitle(): string {
    const monster = this.monster();
    if (!monster) {
      return 'Monster reference';
    }

    const details = [monster.size, monster.creatureType, monster.alignment]
      .map((value) => value.trim())
      .filter(Boolean);

    if (details.length === 0) {
      return 'Monster reference';
    }

    const [size, type, alignment] = details;
    return `${size} ${type}${alignment ? `, ${alignment}` : ''}`;
  }

  armorClassText(): string {
    const monster = this.monster();
    return monster?.armorClass == null ? '—' : String(monster.armorClass);
  }

  hitPointsText(): string {
    const monster = this.monster();
    return monster?.hitPoints == null ? '—' : String(monster.hitPoints);
  }

  speedText(): string {
    const speed = this.monster()?.speed.trim() ?? '';
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

function findMonsterBySlug(slug: string): MonsterCatalogEntry | null {
  if (!slug) {
    return null;
  }

  return normalizedMonsterCatalog.find((entry) => entry.slug === slug || slugifyMonsterName(entry.name) === slug) ?? null;
}

function normalizeMonsterCatalogEntry(entry: MonsterCatalogEntry): MonsterCatalogEntry {
  return {
    ...entry,
    name: sanitizeMonsterName(entry.name, entry.slug),
    creatureType: normalizeCreatureType(entry.creatureType),
    creatureCategory: normalizeLabel(entry.creatureCategory) || deriveCreatureCategory(entry.creatureType),
    size: normalizeLabel(entry.size),
    alignment: entry.alignment.trim(),
    speed: entry.speed.trim(),
    sourceLabel: entry.sourceLabel.trim()
  };
}

function sanitizeMonsterName(value: string, slug: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^\d+(?:\.\d+)?$/.test(trimmed)) {
    return formatMonsterName(slug);
  }

  return trimmed;
}

function formatMonsterName(value: string): string {
  const normalized = value.replace(/[-_]+/g, ' ').trim();
  if (!normalized) {
    return 'Unknown Monster';
  }

  return normalized
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function normalizeLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeCreatureType(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Unknown';
  }

  return trimmed
    .split(',')
    .map((part) => normalizeLabel(part))
    .join(', ');
}

function deriveCreatureCategory(creatureType: string): string {
  const primaryType = creatureType.split(',')[0]?.trim() ?? '';
  return normalizeLabel(primaryType) || 'Other';
}

function slugifyMonsterName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
