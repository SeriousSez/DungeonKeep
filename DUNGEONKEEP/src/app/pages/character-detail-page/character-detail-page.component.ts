import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { CharacterPortraitCropModalComponent } from '../../components/character-portrait-crop-modal/character-portrait-crop-modal.component';
import { CharacterPortraitModalComponent } from '../../components/character-portrait-modal/character-portrait-modal.component';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { classLevelOneFeatures } from '../../data/class-features.data';
import { monsterCatalog } from '../../data/monster-catalog.generated';
import { premadeCharacters, type PremadeCharacter } from '../../data/premade-characters.data';
import { classSpellCatalog, spellcastingProgressionByClass } from '../../data/class-spells.data';
import { races } from '../../data/races';
import {
    equipmentCatalog,
    backgroundDescriptionFallbacks,
    backgroundDetailOverrides,
    backgroundLanguagesFallbacks,
    backgroundSkillProficienciesFallbacks,
    backgroundToolProficienciesFallbacks,
    classDetailFallbacks,
    classInfoMap,
    speciesInfoMap
} from '../../data/new-character-standard-page.data';
import { spellDetailsMap } from '../../data/spell-details.data';
import { normalizePreparedLeveledSpellNames } from '../../rules/spell-preparation.rules';
import { getWizardPreparedSpellLimit, isWizardSpellbookCantripAlwaysPrepared } from '../../rules/wizard-class.rules';
import type { SkillProficiencies } from '../../models/dungeon.models';
import type { MonsterCatalogEntry } from '../../models/monster-reference.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { CampaignHubService } from '../../state/campaign-hub.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import {
    extrasCatalogEntries,
    extrasTypeGroups,
    type ExtrasCatalogEntry,
    type ExtrasCatalogType,
    type VehicleStatBlock
} from '../../data/extras-catalog.data';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type CombatTab = 'actions' | 'spells' | 'inventory' | 'features' | 'background' | 'notes' | 'extras';
type SpellFilter = 'all' | '0' | '1' | '2' | '3';
type SpellManagerTab = 'prepared' | 'spellbook' | 'all';
type ActionFilter = 'all' | 'attack' | 'action' | 'bonus-action' | 'reaction' | 'other' | 'limited-use';
type BackgroundFilter = 'all' | 'background' | 'characteristics' | 'appearance';
type InventoryFilter = string; // Can be 'all', 'equipment', 'other', or a container name
type FeaturesFilter = 'all' | 'class-features' | 'species-traits' | 'feats';
type NotesFilter = 'all' | 'orgs' | 'allies' | 'enemies' | 'backstory' | 'other';
type MeasurementSystem = 'imperial' | 'metric';
type InventoryDraftField = 'name' | 'category' | 'quantity' | 'weight' | 'costGp' | 'notes';

interface PersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
    weight?: number;
    costGp?: number;
    notes?: string;
    isContainer?: boolean;
    containedItems?: PersistedInventoryEntry[];
    maxCapacity?: number;
}

interface PersistedCurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

type PersistedAbilityScoreImprovementMode = '' | 'plus-two' | 'plus-one-plus-one';

interface PersistedAbilityScoreImprovementChoice {
    mode: PersistedAbilityScoreImprovementMode;
    primaryAbility: string;
    secondaryAbility: string;
}

interface PersistedFeatFollowUpChoice {
    abilityIncreaseAbility?: string;
}

interface PersistedExtrasEntry {
    uid: string;
    name: string;
    type: ExtrasCatalogType;
    monsterStatBlockName?: string;
    currentHp?: number;
    maxHp?: number;
    customNotes?: string;
}

interface PersistedBuilderState {
    selectedBackgroundName?: string;
    selectedLanguages?: string[];
    selectedSpeciesLanguages?: string[];
    selectedSpeciesTraitChoices?: Record<string, string[]>;
    classFeatureSelections?: Record<string, string[]>;
    abilityScoreImprovementChoices?: Record<string, PersistedAbilityScoreImprovementChoice>;
    featFollowUpChoices?: Record<string, PersistedFeatFollowUpChoice>;
    backgroundChoiceSelections?: Record<string, string>;
    abilityBaseScores?: Record<string, number>;
    abilityOverrideScores?: Record<string, number | null>;
    bgAbilityMode?: string;
    bgAbilityScoreFor2?: string;
    bgAbilityScoreFor1?: string;
    inventoryEntries?: PersistedInventoryEntry[];
    currency?: PersistedCurrencyState;
    lifestyleExpense?: string;
    classPreparedSpells?: Record<string, string[]>;
    classKnownSpellsByClass?: Record<string, string[]>;
    wizardSpellbookByClass?: Record<string, string[]>;
    usedSpellSlotsByLevel?: Record<number, number>;
    hpMaxOverride?: number | null;
    tempHitPoints?: number;
    heroicInspiration?: boolean;
    deathSaveFailures?: number;
    deathSaveSuccesses?: number;
    extrasEntries?: PersistedExtrasEntry[];
}

interface CombatRow {
    name: string;
    subtitle: string;
    range: string;
    hitDcLabel: string;
    damage: string;
    notes: string;
    concentration: boolean;
    ritual: boolean;
}

interface DetailDrawerContent {
    title: string;
    subtitle: string;
    description: string;
    bullets?: string[];
    lineItems?: Array<{ value: string; label: string; note?: string }>;
    secondaryHeading?: string;
    variant?: 'default' | 'inventory-item';
    metaLine?: string;
    profileTags?: string[];
    facts?: Array<{
        label: string;
        value?: string;
        linkLabel?: string;
        linkUrl?: string;
    }>;
    rulesText?: string | null;
}

@Component({
    selector: 'app-character-detail-page',
    imports: [CommonModule, RouterLink, DropdownComponent, CharacterPortraitModalComponent, CharacterPortraitCropModalComponent],
    templateUrl: './character-detail-page.component.html',
    styleUrl: './character-detail-page.component.scss'
})
export class CharacterDetailPageComponent {
    private static readonly UNASSIGNED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000';

    private readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly campaignHub = inject(CampaignHubService);
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';
    private readonly partyCurrencyStartTag = '[DK_PARTY_CURRENCY_START]';
    private readonly partyCurrencyEndTag = '[DK_PARTY_CURRENCY_END]';
    private readonly catalogLookup = new Map(equipmentCatalog.map((item) => [item.name.toLowerCase(), item]));
    private readonly monsterCatalogByName = new Map<string, MonsterCatalogEntry>(
        monsterCatalog.map((monster) => [monster.name.toLowerCase(), monster])
    );
    private readonly premadeCharacterLookup = new Map<string, PremadeCharacter>(
        premadeCharacters.map((character) => [this.getPremadeLookupKey(character), character])
    );

    private readonly weaponDamageMap: Record<string, string> = {
        'club': '1d4 Bludgeoning',
        'dagger': '1d4 Piercing',
        'greatclub': '1d8 Bludgeoning',
        'handaxe': '1d6 Slashing',
        'javelin': '1d6 Piercing',
        'light hammer': '1d4 Bludgeoning',
        'mace': '1d6 Bludgeoning',
        'quarterstaff': '1d6 Bludgeoning',
        'sickle': '1d4 Slashing',
        'spear': '1d6 Piercing',
        'crossbow, light': '1d8 Piercing',
        'shortbow': '1d6 Piercing',
        'longbow': '1d8 Piercing',
        'longsword': '1d8 Slashing',
        'greatsword': '2d6 Slashing',
        'greataxe': '1d12 Slashing',
        'warhammer': '1d8 Bludgeoning',
        'rapier': '1d8 Piercing',
        'scimitar': '1d6 Slashing',
        'battleaxe': '1d8 Slashing',
        'flail': '1d8 Bludgeoning',
        'glaive': '1d10 Slashing',
        'halberd': '1d10 Slashing',
        'lance': '1d10 Piercing',
        'maul': '2d6 Bludgeoning',
        'morningstar': '1d8 Piercing',
        'pike': '1d10 Piercing',
        'shortsword': '1d6 Piercing',
        'trident': '1d8 Piercing',
        'war pick': '1d8 Piercing',
        'whip': '1d4 Slashing',
        'crossbow, hand': '1d6 Piercing',
        'crossbow, heavy': '1d10 Piercing',
        'pistol': '3d4 Piercing',
        'musket': '5d4 Piercing',
        'blunderbuss': '3d8 Piercing',
        'pepperbox': '4d10 Piercing'
    };

    private readonly armorClassProfiles: Record<string, { base: number; dexCap: number | null }> = {
        'padded armor': { base: 11, dexCap: null },
        'leather armor': { base: 11, dexCap: null },
        'studded leather armor': { base: 12, dexCap: null },
        'hide armor': { base: 12, dexCap: 2 },
        'chain shirt': { base: 13, dexCap: 2 },
        'scale mail': { base: 14, dexCap: 2 },
        'breastplate': { base: 14, dexCap: 2 },
        'half plate': { base: 15, dexCap: 2 },
        'ring mail': { base: 14, dexCap: 0 },
        'chain mail': { base: 16, dexCap: 0 },
        'splint armor': { base: 17, dexCap: 0 },
        'plate armor': { base: 18, dexCap: 0 }
    };

    private readonly armorCategoryByName: Record<string, 'light' | 'medium' | 'heavy'> = {
        'padded armor': 'light',
        'leather armor': 'light',
        'studded leather armor': 'light',
        'hide armor': 'medium',
        'chain shirt': 'medium',
        'scale mail': 'medium',
        'breastplate': 'medium',
        'half plate': 'medium',
        'ring mail': 'heavy',
        'chain mail': 'heavy',
        'splint armor': 'heavy',
        'plate armor': 'heavy'
    };

    private readonly stealthDisadvantageArmor = new Set([
        'padded armor',
        'scale mail',
        'half plate',
        'ring mail',
        'chain mail',
        'splint armor',
        'plate armor'
    ]);

    private readonly containerItemNames = new Set([
        'backpack',
        'bag of holding',
        'bag',
        'sack',
        'pouch',
        'chest',
        'quiver',
        'scroll case',
        'map case',
        'satchel',
        'waterskin',
        'vial',
        'flask',
        'bottle',
        'barrel',
        'basket',
        'box',
        'coffer',
        'case'
    ]);

    private readonly raceLookup = new Map(
        races.flatMap((race) => [
            [race.id.toLowerCase(), race],
            [race.name.toLowerCase(), race]
        ])
    );

    private readonly abilityKeyMap: Record<AbilityKey, string> = {
        strength: 'STR',
        dexterity: 'DEX',
        constitution: 'CON',
        intelligence: 'INT',
        wisdom: 'WIS',
        charisma: 'CHA'
    };

    private readonly skillAbilityMap = {
        acrobatics: 'dexterity',
        animalHandling: 'wisdom',
        arcana: 'intelligence',
        athletics: 'strength',
        deception: 'charisma',
        history: 'intelligence',
        insight: 'wisdom',
        intimidation: 'charisma',
        investigation: 'intelligence',
        medicine: 'wisdom',
        nature: 'intelligence',
        perception: 'wisdom',
        performance: 'charisma',
        persuasion: 'charisma',
        sleightOfHand: 'dexterity',
        stealth: 'dexterity',
        survival: 'wisdom'
    } as const;

    private readonly saveProficienciesByClass: Record<string, AbilityKey[]> = {
        Barbarian: ['strength', 'constitution'],
        Bard: ['dexterity', 'charisma'],
        Cleric: ['wisdom', 'charisma'],
        Druid: ['intelligence', 'wisdom'],
        Fighter: ['strength', 'constitution'],
        Monk: ['strength', 'dexterity'],
        Paladin: ['wisdom', 'charisma'],
        Ranger: ['strength', 'dexterity'],
        Rogue: ['dexterity', 'intelligence'],
        Sorcerer: ['constitution', 'charisma'],
        Warlock: ['wisdom', 'charisma'],
        Wizard: ['intelligence', 'wisdom']
    };

    private readonly hitDieByClass: Record<string, number> = {
        Barbarian: 12,
        Bard: 8,
        Cleric: 8,
        Druid: 8,
        Fighter: 10,
        Monk: 8,
        Paladin: 10,
        Ranger: 10,
        Rogue: 8,
        Sorcerer: 6,
        Warlock: 8,
        Wizard: 6
    };

    private readonly casterTypeByClass: Record<string, 'none' | 'full' | 'half'> = {
        Barbarian: 'none',
        Bard: 'full',
        Cleric: 'full',
        Druid: 'full',
        Fighter: 'none',
        Monk: 'none',
        Paladin: 'half',
        Ranger: 'half',
        Rogue: 'none',
        Sorcerer: 'full',
        Warlock: 'full',
        Wizard: 'full'
    };

    private readonly spellcastingAbilityByClass: Partial<Record<string, AbilityKey>> = {
        Bard: 'charisma',
        Cleric: 'wisdom',
        Druid: 'wisdom',
        Paladin: 'charisma',
        Ranger: 'wisdom',
        Sorcerer: 'charisma',
        Warlock: 'charisma',
        Wizard: 'intelligence'
    };


    readonly characterId = this.route.snapshot.paramMap.get('id') || '';
    readonly initialized = computed(() => this.store.initialized());
    readonly activeCombatTab = signal<CombatTab>('actions');
    readonly activeSpellFilter = signal<SpellFilter>('all');
    readonly spellSearchTerm = signal('');
    readonly activeActionFilter = signal<ActionFilter>('all');
    readonly activeBackgroundFilter = signal<BackgroundFilter>('all');
    readonly activeInventoryFilter = signal<InventoryFilter>('all');
    readonly inventorySearchTerm = signal('');
    readonly activeFeaturesFilter = signal<FeaturesFilter>('all');
    readonly activeNotesFilter = signal<NotesFilter>('all');
    readonly selectedCampaignAssignment = signal('');
    readonly isUpdatingCampaign = signal(false);
    readonly campaignUpdateError = signal('');
    readonly portraitPromptDetails = signal('');
    readonly portraitSaveMessage = signal('');
    readonly portraitGenerationError = signal('');
    readonly isSavingPortrait = signal(false);
    readonly isGeneratingPortrait = signal(false);
    readonly portraitModalOpen = signal(false);
    readonly portraitCropModalOpen = signal(false);
    readonly portraitCropSourceImageUrl = signal('');
    readonly portraitOriginalImageUrl = signal('');
    readonly usedSpellSlotsByLevel = signal<Record<number, number>>({});
    readonly expandedContainers = signal<Set<string>>(new Set());
    readonly activeDetailDrawer = signal<DetailDrawerContent | null>(null);
    readonly activeExtrasStatEntry = signal<PersistedExtrasEntry | null>(null);
    readonly detailSecondaryExpanded = signal(true);
    readonly hpManagerOpen = signal(false);
    readonly hpHealingInput = signal('0');
    readonly hpDamageInput = signal('0');
    readonly hpMaxModifierInput = signal('0');
    readonly hpOverrideInput = signal('');
    readonly hpDraftCurrent = signal(0);
    readonly hpDraftMax = signal(0);
    readonly tempHitPoints = signal(0);
    readonly hpDraftTemp = signal(0);
    readonly hpDraftDeathSaveFailures = signal(0);
    readonly hpDraftDeathSaveSuccesses = signal(0);
    readonly appliedMaxHpOverride = signal<number | null>(null);
    readonly isSavingHp = signal(false);
    readonly heroicInspiration = signal(false);
    readonly coinManagerOpen = signal(false);
    readonly spellManagerOpen = signal(false);
    readonly spellManagerTab = signal<SpellManagerTab>('prepared');
    readonly spellManagerSearch = signal('');
    readonly spellManagerLevelFilter = signal<'all' | `${number}`>('all');
    readonly spellManagerExpandedSpellName = signal('');
    readonly inventoryManagerOpen = signal(false);
    readonly inventoryManagerOpening = signal(false);
    readonly inventoryManagerSearch = signal('');
    readonly inventoryCustomItemExpanded = signal(false);
    readonly inventoryCurrentExpanded = signal(true);
    readonly inventoryManagerExpandedSections = signal<Set<string>>(new Set());
    readonly inventoryCatalogExpanded = signal(true);
    readonly inventoryCatalogCategory = signal('All');
    readonly inventoryCatalogExpandedItem = signal('');
    readonly inventoryManagerContainedExpandedItem = signal('');
    readonly inventoryManagerMoveTargets = signal<Record<string, string>>({});
    readonly inventoryDraftAddTarget = signal('equipment');
    readonly inventoryDraftName = signal('');
    readonly inventoryDraftCategory = signal('Adventuring Gear');
    readonly inventoryDraftQuantity = signal('1');
    readonly inventoryDraftWeight = signal('');
    readonly inventoryDraftCostGp = signal('');
    readonly inventoryDraftNotes = signal('');
    readonly extrasManagerOpen = signal(false);
    readonly extrasCatalogType = signal<ExtrasCatalogType>('Familiar');
    readonly extrasCatalogExpandedItem = signal('');
    readonly extrasMonsterSearchTerm = signal('');
    readonly extrasMonsterCrMin = signal('');
    readonly extrasMonsterCrMax = signal('');

    readonly extrasMonsterPickerEnabled = computed(() => {
        const type = this.extrasCatalogType();
        return type === 'Familiar' || type === 'Beast Companion (2014)' || type === 'Wild Shape';
    });

    readonly extrasMonsterCandidateCatalog = computed<ReadonlyArray<MonsterCatalogEntry>>(() => {
        if (!this.extrasMonsterPickerEnabled()) {
            return [];
        }

        const searchTerm = this.extrasMonsterSearchTerm().trim().toLowerCase();
        const minCr = this.parseChallengeRatingValue(this.extrasMonsterCrMin());
        const maxCr = this.parseChallengeRatingValue(this.extrasMonsterCrMax());

        return monsterCatalog.filter((monster) => {
            const challengeValue = this.parseChallengeRatingValue(monster.challengeRating);
            if (minCr !== null && (challengeValue === null || challengeValue < minCr)) {
                return false;
            }

            if (maxCr !== null && (challengeValue === null || challengeValue > maxCr)) {
                return false;
            }

            if (!searchTerm) {
                return true;
            }

            const searchable = [
                monster.name,
                monster.creatureType,
                monster.creatureCategory,
                monster.size,
                monster.challengeRating,
                monster.sourceLabel
            ]
                .map((value) => value.trim().toLowerCase())
                .join(' ');

            return searchable.includes(searchTerm);
        });
    });

    readonly extrasCatalogTypeOptions = computed<ReadonlyArray<DropdownOption>>(() =>
        extrasTypeGroups.flatMap((g) =>
            g.types.map((t) => ({ value: t, label: t, group: g.group }))
        )
    );

    readonly extrasCrOptions: ReadonlyArray<DropdownOption> = [
        { value: '', label: 'Any' },
        { value: '0', label: '0' },
        { value: '1/8', label: '1/8' },
        { value: '1/4', label: '1/4' },
        { value: '1/2', label: '1/2' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
        { value: '9', label: '9' },
        { value: '10', label: '10' },
        { value: '11', label: '11' },
        { value: '12', label: '12' },
        { value: '13', label: '13' },
        { value: '14', label: '14' },
        { value: '15', label: '15' },
        { value: '16', label: '16' },
        { value: '17', label: '17' },
        { value: '18', label: '18' },
        { value: '19', label: '19' },
        { value: '20', label: '20' },
        { value: '21', label: '21' },
        { value: '22', label: '22' },
        { value: '23', label: '23' },
        { value: '24', label: '24' },
        { value: '25', label: '25' },
        { value: '26', label: '26' },
        { value: '27', label: '27' },
        { value: '28', label: '28' },
        { value: '29', label: '29' },
        { value: '30', label: '30' }
    ];

    readonly characterExtrasEntries = computed<PersistedExtrasEntry[]>(() =>
        this.persistedBuilderState()?.extrasEntries ?? []
    );

    readonly characterExtrasByType = computed<Array<{ type: ExtrasCatalogType; entries: PersistedExtrasEntry[] }>>(() => {
        const groups = new Map<ExtrasCatalogType, PersistedExtrasEntry[]>();
        for (const entry of this.characterExtrasEntries()) {
            const list = groups.get(entry.type) ?? [];
            list.push(entry);
            groups.set(entry.type, list);
        }

        return [...groups.entries()].map(([type, entries]) => ({ type, entries }));
    });

    readonly filteredExtrasCatalogItems = computed<ReadonlyArray<ExtrasCatalogEntry>>(() => {
        const type = this.extrasCatalogType();

        if (this.extrasMonsterPickerEnabled()) {
            return [...this.extrasMonsterCandidateCatalog()]
                .sort((left, right) => left.name.localeCompare(right.name))
                .map((monster) => ({
                    name: monster.name,
                    type,
                    monsterStatBlockName: monster.name,
                    subtype: `${monster.size} ${monster.creatureType}`.trim(),
                    source: monster.sourceLabel.trim() || undefined,
                    sourceUrl: monster.sourceUrl.trim() || undefined,
                    summary: `Monster catalog entry for ${type}.`,
                    cr: monster.challengeRating || undefined,
                    size: monster.size || undefined
                }));
        }

        return extrasCatalogEntries.filter((e) => e.type === type);
    });

    readonly coinAdjustInput = signal<PersistedCurrencyState>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
    readonly partyCoinAdjustInput = signal<PersistedCurrencyState>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
    readonly coinLifestyleExpanded = signal(false);
    readonly partyCurrencyExpanded = signal(false);
    readonly selectedLifestyleExpense = signal('modest');
    readonly partyCurrencySaveError = signal('');
    readonly appearanceMeasurementSystem = signal<MeasurementSystem>('imperial');

    private lastCharacterId: string | null = null;
    private lastPortraitSourceCharacterId: string | null = null;
    private saveSpellSlotTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        // Join SignalR campaign group when campaign is available; leave on destroy.
        effect(() => {
            const campaign = this.currentCampaign();
            if (campaign) {
                void this.campaignHub.joinCampaign(campaign.id);
            }
        });

        this.campaignHub.partyCurrencyUpdated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                const campaign = this.currentCampaign();
                if (campaign && event.campaignId === campaign.id) {
                    this.store.patchCampaignSummary(event.campaignId, event.summary);
                    this.cdr.detectChanges();
                }
            });

        this.destroyRef.onDestroy(() => {
            void this.campaignHub.disconnect();
        });

        // Seed usedSpellSlotsByLevel from persisted state whenever the character
        // or their saved data changes (e.g. on first load or navigation).
        effect(() => {
            const initial = this.initialSpellSlots();
            const char = this.character();
            if (!char) return;
            if (this.lastCharacterId !== char.id) {
                this.lastCharacterId = char.id;
                this.usedSpellSlotsByLevel.set({ ...initial });
            }
        });

        effect(() => {
            const characterId = this.character()?.id ?? null;
            if (this.lastPortraitSourceCharacterId === characterId) {
                return;
            }

            this.lastPortraitSourceCharacterId = characterId;
            this.portraitOriginalImageUrl.set(characterId ? this.readStoredPortraitOriginalImageUrl(characterId) : '');
        });

        effect(() => {
            const persistedOverride = this.persistedBuilderState()?.hpMaxOverride;
            if (typeof persistedOverride !== 'number' || !Number.isFinite(persistedOverride)) {
                this.appliedMaxHpOverride.set(null);
                return;
            }

            this.appliedMaxHpOverride.set(Math.max(1, Math.trunc(persistedOverride)));
        });

        effect(() => {
            const persistedTempHp = this.persistedBuilderState()?.tempHitPoints;
            if (typeof persistedTempHp === 'number' && Number.isFinite(persistedTempHp)) {
                this.tempHitPoints.set(Math.max(0, Math.trunc(persistedTempHp)));
            } else {
                this.tempHitPoints.set(0);
            }
        });

        effect(() => {
            this.heroicInspiration.set(this.persistedBuilderState()?.heroicInspiration ?? false);
        });
    }

    @HostListener('document:dungeonkeep-close-popups')
    onClosePopups(): void {
        this.activeDetailDrawer.set(null);
        this.activeExtrasStatEntry.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
    }

    private requestCloseChat(): void {
        globalThis.document?.dispatchEvent(new CustomEvent('dungeonkeep-close-chat', { bubbles: true }));
    }

    readonly combatTabs: Array<{ key: CombatTab; label: string }> = [
        { key: 'actions', label: 'Actions' },
        { key: 'spells', label: 'Spells' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'features', label: 'Features & Traits' },
        { key: 'background', label: 'Background' },
        { key: 'notes', label: 'Notes' },
        { key: 'extras', label: 'Extras' }
    ];

    readonly actionFilters: Array<{ key: ActionFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'attack', label: 'Attack' },
        { key: 'action', label: 'Action' },
        { key: 'bonus-action', label: 'Bonus Action' },
        { key: 'reaction', label: 'Reaction' },
        { key: 'other', label: 'Other' },
        { key: 'limited-use', label: 'Limited Use' }
    ];

    readonly spellFilters: Array<{ key: SpellFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: '0', label: '-0-' },
        { key: '1', label: '1st' },
        { key: '2', label: '2nd' },
        { key: '3', label: '3rd' }
    ];

    readonly backgroundFilters: Array<{ key: BackgroundFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'background', label: 'Background' },
        { key: 'characteristics', label: 'Characteristics' },
        { key: 'appearance', label: 'Appearance' }
    ];

    readonly inventoryFilters = computed(() => {
        const entries = this.normalizedInventoryEntries();
        const containerNames = new Set<string>();

        for (const entry of entries) {
            if (entry.isContainer) {
                containerNames.add(entry.name);
            }
        }

        const filters: Array<{ key: InventoryFilter; label: string }> = [
            { key: 'all', label: 'All' },
            { key: 'equipment', label: 'Equipment' }
        ];

        // Add dynamic container tabs
        for (const containerName of containerNames) {
            filters.push({ key: containerName, label: containerName });
        }

        return filters;
    });

    readonly featuresFilters: Array<{ key: FeaturesFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'class-features', label: 'Class Features' },
        { key: 'species-traits', label: 'Species Traits' },
        { key: 'feats', label: 'Feats' }
    ];

    readonly notesFilters: Array<{ key: NotesFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'orgs', label: 'Orgs' },
        { key: 'allies', label: 'Allies' },
        { key: 'enemies', label: 'Enemies' },
        { key: 'backstory', label: 'Backstory' },
        { key: 'other', label: 'Other' }
    ];

    readonly lifestyleExpenseOptions: ReadonlyArray<DropdownOption> = [
        { value: 'wretched', label: 'Wretched (free, but miserable)' },
        { value: 'squalid', label: 'Squalid (1 SP/day)' },
        { value: 'poor', label: 'Poor (2 SP/day)' },
        { value: 'modest', label: 'Modest (1 GP/day)' },
        { value: 'comfortable', label: 'Comfortable (2 GP/day)' },
        { value: 'wealthy', label: 'Wealthy (4 GP/day)' },
        { value: 'aristocratic', label: 'Aristocratic (10+ GP/day)' }
    ];

    private readonly lifestyleExpenseDescriptions: Readonly<Record<string, string>> = {
        wretched: 'No real cost, but you endure harsh conditions, instability, and constant discomfort.',
        squalid: 'You survive in filthy, unsafe surroundings with only the barest essentials.',
        poor: 'Simple meals and rough lodging keep you going, but comfort and privacy are limited.',
        modest: 'A modest lifestyle keeps you out of the slums and ensures that you can maintain your equipment.',
        comfortable: 'You maintain good lodging, quality meals, and enough means to avoid daily hardship.',
        wealthy: 'You enjoy fine accommodations, quality goods, and influence among well-off circles.',
        aristocratic: 'Lavish living, elite expectations, and expensive appearances define your daily life.'
    };

    readonly STANDARD_COMBAT_ACTIONS = [
        'Attack', 'Dash', 'Disengage', 'Dodge', 'Grapple', 'Help',
        'Hide', 'Improvise', 'Influence', 'Magic', 'Ready', 'Search', 'Shove', 'Study', 'Utilize'
    ];
    readonly STANDARD_BONUS_COMBAT_ACTIONS = ['Two-Weapon Fighting'];
    readonly STANDARD_REACTIONS = ['Opportunity Attack'];
    readonly STANDARD_OTHER_ACTIONS = ['Interact with an Object'];

    private readonly SPELL_LEVEL_LABELS: Record<number, string> = {
        0: 'Cantrip', 1: '1st Level', 2: '2nd Level', 3: '3rd Level',
        4: '4th Level', 5: '5th Level', 6: '6th Level', 7: '7th Level',
        8: '8th Level', 9: '9th Level'
    };

    readonly character = computed(() =>
        this.store.characters().find((item) => item.id === this.characterId) || null
    );

    readonly parsedNotes = computed(() => this.parsePersistedNotes(this.character()?.notes ?? ''));

    readonly persistedBuilderState = computed(() => this.parsedNotes().state);

    readonly normalizedInventoryEntries = computed<PersistedInventoryEntry[]>(() => {
        const entries = this.persistedBuilderState()?.inventoryEntries;
        const sourceEntries = Array.isArray(entries)
            ? entries
            : this.getPremadeInventoryEntries();

        if (sourceEntries.length === 0) {
            return [];
        }

        const normalizedEntries = sourceEntries
            .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.category === 'string')
            .map((entry) => this.normalizeInventoryEntry(entry))
            .filter((entry) => entry.name.length > 0 && entry.category.length > 0);

        return this.expandIndependentContainers(normalizedEntries);
    });

    private expandIndependentContainers(entries: PersistedInventoryEntry[]): PersistedInventoryEntry[] {
        const expanded: PersistedInventoryEntry[] = [];

        for (const entry of entries) {
            if (!entry.isContainer || entry.quantity <= 1) {
                expanded.push(entry);
                continue;
            }

            for (let copyIndex = 0; copyIndex < entry.quantity; copyIndex++) {
                expanded.push({
                    ...entry,
                    quantity: 1,
                    containedItems: copyIndex === 0 ? [...(entry.containedItems ?? [])] : []
                });
            }
        }

        return expanded;
    }

    private normalizeInventoryEntry(entry: PersistedInventoryEntry): PersistedInventoryEntry {
        const name = entry.name.trim();
        const category = entry.category.trim();
        const quantity = Math.max(1, Math.trunc(Number(entry.quantity) || 1));
        const containedItems = Array.isArray(entry.containedItems)
            ? entry.containedItems
                .filter((item) => item && typeof item.name === 'string' && typeof item.category === 'string')
                .map((item) => this.normalizeInventoryEntry(item))
            : [];
        const mergedContainedItems = this.mergeDuplicateContainedItems(containedItems);
        const isContainer = Boolean(entry.isContainer) || this.isContainerItemName(name) || mergedContainedItems.length > 0;
        const catalogItem = this.catalogLookup.get(name.toLowerCase());

        return {
            ...entry,
            name,
            category,
            quantity,
            weight: typeof entry.weight === 'number' ? entry.weight : catalogItem?.weight,
            costGp: typeof entry.costGp === 'number' ? entry.costGp : catalogItem?.costGp,
            notes: entry.notes?.trim() || catalogItem?.notes || undefined,
            isContainer,
            containedItems: mergedContainedItems,
            maxCapacity: entry.maxCapacity ?? (isContainer ? this.getContainerCapacity(name) : undefined)
        };
    }

    private mergeDuplicateContainedItems(entries: PersistedInventoryEntry[]): PersistedInventoryEntry[] {
        if (entries.length <= 1) {
            return entries;
        }

        const mergedByKey = new Map<string, PersistedInventoryEntry>();

        for (const entry of entries) {
            const key = `${entry.name.trim().toLowerCase()}|${entry.category.trim().toLowerCase()}`;
            const existing = mergedByKey.get(key);

            if (!existing) {
                mergedByKey.set(key, { ...entry });
                continue;
            }

            existing.quantity += entry.quantity;
            if (existing.weight == null && entry.weight != null) {
                existing.weight = entry.weight;
            }
            if (existing.costGp == null && entry.costGp != null) {
                existing.costGp = entry.costGp;
            }
            if (!existing.notes && entry.notes) {
                existing.notes = entry.notes;
            }
            if (!existing.maxCapacity && entry.maxCapacity) {
                existing.maxCapacity = entry.maxCapacity;
            }

            const mergedChildren = this.mergeDuplicateContainedItems([
                ...(existing.containedItems ?? []),
                ...(entry.containedItems ?? [])
            ]);
            existing.containedItems = mergedChildren;
            existing.isContainer = existing.isContainer || entry.isContainer || mergedChildren.length > 0;
        }

        return [...mergedByKey.values()];
    }

    private getPremadeInventoryEntries(): PersistedInventoryEntry[] {
        const character = this.character();
        if (!character) {
            return [];
        }

        return this.getPremadeCharacter(character)?.inventoryEntries ?? [];
    }

    private getPremadeCharacter(character: { name: string; race: string; className: string; background: string } | null): PremadeCharacter | null {
        if (!character) {
            return null;
        }

        return this.premadeCharacterLookup.get(this.getPremadeLookupKey(character)) ?? null;
    }

    private getPremadeLookupKey(character: { name: string; race: string; className: string; background: string }): string {
        return [character.name, character.race, character.className, character.background]
            .map((value) => value.trim().toLowerCase())
            .join('|');
    }

    readonly initialSpellSlots = computed(() => {
        const state = this.persistedBuilderState();
        if (state?.usedSpellSlotsByLevel && Object.keys(state.usedSpellSlotsByLevel).length > 0) {
            return { ...state.usedSpellSlotsByLevel };
        }
        return {};
    });

    private saveSpellSlotUsage(): void {
        // Clear any pending save
        if (this.saveSpellSlotTimeout) {
            clearTimeout(this.saveSpellSlotTimeout);
        }

        // Debounce the save by 1 second
        this.saveSpellSlotTimeout = setTimeout(() => {
            const char = this.character();
            if (!char) {
                return;
            }

            const currentState = this.persistedBuilderState() || {};
            const updatedState: PersistedBuilderState = {
                ...currentState,
                usedSpellSlotsByLevel: this.usedSpellSlotsByLevel()
            };

            const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

            this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: updatedNotes,
                campaignId: char.campaignId
            });
        }, 1000);
    }

    private createPersistedNotesString(originalNotes: string, state: PersistedBuilderState): string {
        const cleanedNotes = this.parsePersistedNotes(originalNotes).cleanedNotes;
        const stateJson = JSON.stringify(state);
        return `${cleanedNotes}\n\n${this.builderStateStartTag}${stateJson}${this.builderStateEndTag}`.trim();
    }




    readonly displayBackground = computed(() => {
        const fromBuilder = this.persistedBuilderState()?.selectedBackgroundName?.trim() ?? '';
        if (fromBuilder) {
            return fromBuilder;
        }

        return this.character()?.background || 'Not set';
    });

    readonly persistedSkillProficiencies = computed(() => {
        const state = this.persistedBuilderState();
        if (!state) {
            return new Set<string>();
        }

        const collected = new Set<string>();
        const classSelections = state.classFeatureSelections ?? {};

        for (const pickedValues of Object.values(classSelections)) {
            for (const value of pickedValues ?? []) {
                const parsed = this.parseSkillTokens(value);
                for (const skillKey of parsed) {
                    collected.add(skillKey);
                }
            }
        }

        const backgroundSelections = state.backgroundChoiceSelections ?? {};
        for (const pickedValue of Object.values(backgroundSelections)) {
            for (const skillKey of this.parseSkillTokens(pickedValue)) {
                collected.add(skillKey);
            }
        }

        return collected;
    });

    readonly effectiveAbilityScores = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const persistedScores = this.getPersistedAbilityScores(this.persistedBuilderState());
        if (persistedScores) {
            return persistedScores;
        }

        return char.abilityScores ?? {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };
    });

    readonly campaignName = computed(() => {
        const char = this.character();
        if (!char) {
            return 'Unknown Campaign';
        }

        if (char.campaignId === CharacterDetailPageComponent.UNASSIGNED_CAMPAIGN_ID) {
            return 'Unassigned';
        }

        return this.store.campaigns().find((campaign) => campaign.id === char.campaignId)?.name ?? 'Unassigned';
    });

    readonly currentCampaign = computed(() => {
        const char = this.character();
        if (!char || char.campaignId === CharacterDetailPageComponent.UNASSIGNED_CAMPAIGN_ID) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === char.campaignId) ?? null;
    });

    readonly portraitInitials = computed(() => this.buildCharacterInitials(this.character()?.name ?? ''));

    readonly partyCurrency = computed<PersistedCurrencyState>(() => {
        const campaign = this.currentCampaign();
        if (!campaign) {
            return this.createEmptyCurrencyState();
        }

        return this.parseCampaignPartyCurrency(campaign.summary ?? '').currency;
    });

    readonly canEditPartyCurrency = computed(() => this.currentCampaign()?.currentUserRole === 'Owner');

    readonly assignableCampaignOptions = computed<DropdownOption[]>(() =>
        this.store.campaigns().map((campaign) => ({ value: campaign.id, label: campaign.name }))
    );

    readonly onPortraitPromptDetailsChanged = (value: string) => {
        this.portraitPromptDetails.set(value);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
    };

    readonly openPortraitModal = () => {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        this.portraitModalOpen.set(true);
    };

    readonly closePortraitModal = () => {
        this.portraitModalOpen.set(false);
    };

    readonly closePortraitCropModal = () => {
        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
    };

    readonly openPortraitRecrop = () => {
        const char = this.character();
        const originalImageUrl = this.portraitOriginalImageUrl().trim();
        const fallbackImageUrl = char?.image?.trim() ?? '';
        const sourceImageUrl = originalImageUrl || fallbackImageUrl;
        if (!char?.canEdit || !sourceImageUrl || this.isSavingPortrait() || this.isGeneratingPortrait()) {
            return;
        }

        if (!originalImageUrl) {
            this.storePortraitOriginalImageUrl(char.id, sourceImageUrl);
        }

        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
        this.portraitCropSourceImageUrl.set(sourceImageUrl);
        this.portraitCropModalOpen.set(true);
    };

    readonly onPortraitFileSelected = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file) {
            return;
        }

        try {
            const imageUrl = await this.readPortraitFile(file);
            this.storePortraitOriginalImageUrl(this.characterId, imageUrl);
            this.portraitCropSourceImageUrl.set(imageUrl);
            this.portraitCropModalOpen.set(true);
        } catch (error) {
            this.portraitGenerationError.set(error instanceof Error ? error.message : 'Unable to use that image right now.');
        } finally {
            if (input) {
                input.value = '';
            }

            this.cdr.detectChanges();
        }
    };

    readonly generatePortrait = async () => {
        const char = this.character();
        if (!char || !char.canEdit || this.isGeneratingPortrait()) {
            return;
        }

        this.isGeneratingPortrait.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');

        try {
            const response = await this.api.generateCharacterPortrait({
                name: char.name,
                className: char.className,
                background: char.background,
                species: char.race,
                alignment: char.alignment ?? '',
                gender: char.gender ?? '',
                additionalDirection: this.portraitPromptDetails().trim()
            });

            this.storePortraitOriginalImageUrl(this.characterId, response.imageUrl);
            await this.persistPortrait(response.imageUrl, 'Portrait generated and saved.');
        } catch (error) {
            this.portraitGenerationError.set(this.getPortraitGenerationErrorMessage(error));
        } finally {
            this.isGeneratingPortrait.set(false);
            this.cdr.detectChanges();
        }
    };

    readonly clearPortrait = async () => {
        const char = this.character();
        if (!char || !char.canEdit || this.isSavingPortrait()) {
            return;
        }

        this.storePortraitOriginalImageUrl(this.characterId, '');
        await this.persistPortrait('', 'Portrait removed.');
    };

    readonly applyPortraitCrop = async (croppedImageUrl: string) => {
        const char = this.character();
        const sourceImageUrl = this.portraitOriginalImageUrl().trim()
            || this.portraitCropSourceImageUrl().trim()
            || char?.image?.trim()
            || '';

        if (char && sourceImageUrl) {
            this.storePortraitOriginalImageUrl(char.id, sourceImageUrl);
        }

        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
        await this.persistPortrait(croppedImageUrl, 'Portrait updated.');
    };

    readonly raceInfo = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        return this.raceLookup.get(char.race.toLowerCase()) ?? null;
    });

    readonly basicIdentityRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const noteContext = this.noteContext();
        const premade = this.getPremadeCharacter(char);
        const experiencePoints = char.experiencePoints;

        return [
            { label: 'Name', value: char.name },
            { label: 'Class & Level', value: `${char.className} ${char.level}` },
            { label: 'Race', value: char.race },
            { label: 'Background', value: this.displayBackground() },
            { label: 'Alignment', value: noteContext.alignment || char.alignment || premade?.alignment || 'Not recorded' },
            { label: 'Lifestyle', value: noteContext.lifestyle || char.lifestyle || premade?.lifestyle || 'Not recorded' },
            { label: 'Faith', value: noteContext.faith || char.faith || premade?.faith || 'Not recorded' },
            {
                label: 'Experience',
                value: noteContext.experience
                    || (typeof experiencePoints === 'number' && Number.isFinite(experiencePoints)
                        ? `${Math.max(0, Math.trunc(experiencePoints))} XP`
                        : 'Not recorded')
            }
        ];
    });

    readonly appearanceRows = computed(() => {
        const char = this.character();
        const context = this.noteContext();
        const premade = this.getPremadeCharacter(char);
        const rawHeight = context.physical.height || premade?.appearance?.height || '';
        const rawWeight = context.physical.weight || premade?.appearance?.weight || '';

        return [
            { label: 'Gender', value: context.physical.gender || char?.gender || premade?.gender || 'Not set' },
            { label: 'Age', value: context.physical.age || premade?.appearance?.age || 'Not set' },
            { label: 'Height', value: this.formatHeightForDisplay(rawHeight) },
            { label: 'Weight', value: this.formatWeightForDisplay(rawWeight) },
            { label: 'Hair', value: context.physical.hair || premade?.appearance?.hair || 'Not set' },
            { label: 'Eyes', value: context.physical.eyes || premade?.appearance?.eyes || 'Not set' },
            { label: 'Skin', value: context.physical.skin || premade?.appearance?.skin || 'Not set' }
        ];
    });

    readonly appearanceMeasurementToggleLabel = computed(() =>
        this.appearanceMeasurementSystem() === 'imperial' ? 'Show cm/kg' : 'Show ft/lb'
    );

    readonly speed = computed(() => {
        const char = this.character();
        if (!char) {
            return 30;
        }

        const race = this.raceLookup.get(char.race.toLowerCase());
        return race?.speed ?? 30;
    });

    readonly initiative = computed(() => {
        const scores = this.effectiveAbilityScores();
        if (!scores) {
            return 0;
        }

        return this.getAbilityModifier(scores.dexterity);
    });

    readonly isZeroHp = computed(() => {
        const char = this.character();
        return (char?.hitPoints ?? 0) <= 0;
    });

    readonly hpResolvedMax = computed(() => {
        const overrideValue = this.parseOptionalInteger(this.hpOverrideInput());
        if (overrideValue != null) {
            return Math.max(1, overrideValue);
        }

        const appliedOverride = this.appliedMaxHpOverride();
        if (appliedOverride != null) {
            return appliedOverride;
        }

        const modifier = this.parseInteger(this.hpMaxModifierInput());
        return Math.max(1, this.hpDraftMax() + modifier);
    });

    readonly activeMaxHpOverride = computed(() => {
        const char = this.character();
        const overrideValue = this.appliedMaxHpOverride();
        if (!char || overrideValue == null || overrideValue === char.maxHitPoints) {
            return null;
        }

        return overrideValue;
    });

    readonly hpPreviewAfterHealing = computed(() => {
        const healing = this.parseInteger(this.hpHealingInput());
        return Math.min(this.hpResolvedMax(), Math.max(0, this.hpDraftCurrent() + Math.max(0, healing)));
    });

    readonly hpPreviewAfterDamage = computed(() => {
        const damage = this.parseInteger(this.hpDamageInput());
        return Math.max(0, this.hpDraftCurrent() - Math.max(0, damage));
    });

    readonly hpNetChange = computed(() => {
        const healing = Math.max(0, this.parseInteger(this.hpHealingInput()));
        const damage = Math.max(0, this.parseInteger(this.hpDamageInput()));
        return healing - damage;
    });

    readonly hpPreviewNetResult = computed(() => {
        const healing = Math.max(0, this.parseInteger(this.hpHealingInput()));
        const damage = Math.max(0, this.parseInteger(this.hpDamageInput()));
        // No max cap here — show the raw effect so users can see healing working even at full hp.
        // The cap is applied when the change is actually committed.
        return Math.max(0, this.hpDraftCurrent() + healing - damage);
    });

    readonly hpChangeColor = computed(() => {
        const netChange = this.hpNetChange();
        if (netChange > 0) return 'positive';
        if (netChange < 0) return 'negative';
        return 'neutral';
    });

    readonly deathSaveFailures = computed(() => {
        const char = this.character();
        if (!char || !this.isZeroHp()) {
            return 0;
        }

        const persistedBackendFailures = Number(char.deathSaveFailures);
        if (Number.isFinite(persistedBackendFailures)) {
            return this.clampDeathSaveCount(persistedBackendFailures);
        }

        const persistedFailures = this.persistedBuilderState()?.deathSaveFailures;
        if (typeof persistedFailures === 'number' && Number.isFinite(persistedFailures)) {
            return this.clampDeathSaveCount(persistedFailures);
        }

        return char.status === 'Recovering' ? 1 : 0;
    });

    readonly deathSaveSuccesses = computed(() => {
        const char = this.character();
        if (!char || !this.isZeroHp()) {
            return 0;
        }

        const persistedBackendSuccesses = Number(char.deathSaveSuccesses);
        if (Number.isFinite(persistedBackendSuccesses)) {
            return this.clampDeathSaveCount(persistedBackendSuccesses);
        }

        const persistedSuccesses = this.persistedBuilderState()?.deathSaveSuccesses;
        if (typeof persistedSuccesses === 'number' && Number.isFinite(persistedSuccesses)) {
            return this.clampDeathSaveCount(persistedSuccesses);
        }

        return char.status === 'Ready' ? 1 : 0;
    });

    readonly passivePerception = computed(() => this.getPassiveSkillValue('perception'));
    readonly passiveInvestigation = computed(() => this.getPassiveSkillValue('investigation'));
    readonly passiveInsight = computed(() => this.getPassiveSkillValue('insight'));

    readonly combatDetailRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const hitDie = this.hitDieByClass[char.className] ?? 8;
        return [
            { label: 'Current HP', value: `${char.hitPoints}` },
            { label: 'Max HP', value: `${char.maxHitPoints}` },
            { label: 'Temporary HP', value: `${this.tempHitPoints()}` },
            { label: 'Hit Dice', value: `${char.level}d${hitDie}` },
            { label: 'Death Saves', value: char.status === 'Recovering' ? '1 failure' : '0 failures' }
        ];
    });

    readonly savingThrows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const saveProficiencies = new Set(this.saveProficienciesByClass[char.className] ?? []);
        const scores = this.effectiveAbilityScores() ?? {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        return [
            { key: 'strength', label: 'STR', score: scores.strength },
            { key: 'dexterity', label: 'DEX', score: scores.dexterity },
            { key: 'constitution', label: 'CON', score: scores.constitution },
            { key: 'intelligence', label: 'INT', score: scores.intelligence },
            { key: 'wisdom', label: 'WIS', score: scores.wisdom },
            { key: 'charisma', label: 'CHA', score: scores.charisma }
        ].map((item) => {
            const proficient = saveProficiencies.has(item.key as AbilityKey);
            const base = this.getAbilityModifier(item.score);
            const modifier = base + (proficient ? char.proficiencyBonus : 0);

            return {
                ...item,
                proficient,
                modifierLabel: this.formatSigned(modifier)
            };
        });
    });

    readonly skillRows = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        return [
            { name: 'Acrobatics', key: 'acrobatics' },
            { name: 'Animal Handling', key: 'animalHandling' },
            { name: 'Arcana', key: 'arcana' },
            { name: 'Athletics', key: 'athletics' },
            { name: 'Deception', key: 'deception' },
            { name: 'History', key: 'history' },
            { name: 'Insight', key: 'insight' },
            { name: 'Intimidation', key: 'intimidation' },
            { name: 'Investigation', key: 'investigation' },
            { name: 'Medicine', key: 'medicine' },
            { name: 'Nature', key: 'nature' },
            { name: 'Perception', key: 'perception' },
            { name: 'Performance', key: 'performance' },
            { name: 'Persuasion', key: 'persuasion' },
            { name: 'Sleight of Hand', key: 'sleightOfHand' },
            { name: 'Stealth', key: 'stealth' },
            { name: 'Survival', key: 'survival' }
        ].map((skill) => {
            const abilityKey = this.skillAbilityMap[skill.key as keyof typeof this.skillAbilityMap];
            const abilityScore = this.effectiveAbilityScores()?.[abilityKey] ?? 10;
            const proficient = this.isSkillProficient(skill.key, char.skills);
            const modifier = this.getAbilityModifier(abilityScore) + (proficient ? char.proficiencyBonus : 0);
            const disadvantageReason = this.getArmorDisadvantageReasonForSkill(skill.key, this.abilityKeyMap[abilityKey]);

            return {
                ...skill,
                ability: this.abilityKeyMap[abilityKey],
                proficient,
                modifierLabel: this.formatSigned(modifier),
                hasDisadvantage: disadvantageReason != null,
                disadvantageReason
            };
        });
    });

    readonly abilityCards = computed(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        return [
            { key: 'strength', abbr: 'STR', name: 'Strength', score: this.effectiveAbilityScores()?.strength ?? 10 },
            { key: 'dexterity', abbr: 'DEX', name: 'Dexterity', score: this.effectiveAbilityScores()?.dexterity ?? 10 },
            { key: 'constitution', abbr: 'CON', name: 'Constitution', score: this.effectiveAbilityScores()?.constitution ?? 10 },
            { key: 'intelligence', abbr: 'INT', name: 'Intelligence', score: this.effectiveAbilityScores()?.intelligence ?? 10 },
            { key: 'wisdom', abbr: 'WIS', name: 'Wisdom', score: this.effectiveAbilityScores()?.wisdom ?? 10 },
            { key: 'charisma', abbr: 'CHA', name: 'Charisma', score: this.effectiveAbilityScores()?.charisma ?? 10 }
        ].map((ability) => ({
            ...ability,
            modifierLabel: this.formatSigned(this.getAbilityModifier(ability.score))
        }));
    });

    readonly spellSaveDC = computed(() => {
        const char = this.character();
        if (!char) {
            return 10;
        }

        const castingAbility = this.spellcastingAbilityByClass[char.className];
        if (!castingAbility) {
            return 8 + (char.proficiencyBonus ?? 2);
        }

        const mod = this.getAbilityModifier(this.effectiveAbilityScores()?.[castingAbility] ?? 10);
        return 8 + (char.proficiencyBonus ?? 2) + mod;
    });

    readonly spellAttackBonus = computed(() => {
        const char = this.character();
        if (!char) {
            return '+0';
        }

        const castingAbility = this.spellcastingAbilityByClass[char.className];
        const abilityMod = castingAbility ? this.getAbilityModifier(this.effectiveAbilityScores()?.[castingAbility] ?? 10) : 0;
        return this.formatSigned((char.proficiencyBonus ?? 2) + abilityMod);
    });

    readonly spellcastingProfile = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const casterType = this.casterTypeByClass[char.className] ?? 'none';
        if (casterType === 'none') {
            return null;
        }

        const ability = this.spellcastingAbilityByClass[char.className] ?? 'wisdom';
        const slotValues = this.getSpellSlots(char.level, casterType);
        const slots = slotValues
            .map((count, index) => ({ level: index + 1, count }))
            .filter((slot) => slot.count > 0);

        return {
            ability: this.abilityKeyMap[ability],
            modifierLabel: this.formatSigned(this.getAbilityModifier(this.effectiveAbilityScores()?.[ability] ?? 10)),
            saveDC: this.spellSaveDC(),
            attackBonus: this.spellAttackBonus(),
            slots
        };
    });

    readonly persistedSpellRows = computed(() => {
        const char = this.character();
        const persisted = this.persistedBuilderState();
        if (!char || !persisted) {
            return [] as Array<{ name: string; level: number; castingTime: string; hitDcLabel: string; range: string; damage: string; concentration: boolean; ritual: boolean }>;
        }

        const className = char.className;
        const preparedNames = persisted.classPreparedSpells?.[className] ?? [];
        const knownNames = persisted.classKnownSpellsByClass?.[className] ?? [];
        const wizardSpellbookNames = persisted.wizardSpellbookByClass?.[className] ?? [];
        const ritualKnownNames = knownNames.filter((name) => this.isRitualSpell(name));

        let selectedNames: string[];
        if (className === 'Wizard') {
            const wizardCantrips = wizardSpellbookNames.filter((name) => isWizardSpellbookCantripAlwaysPrepared(
                className,
                name,
                (spellName) => wizardSpellbookNames.includes(spellName),
                (spellName) => this.getSpellLevelForDetails(className, spellName)
            ));
            const preparedLeveled = preparedNames.filter((name) => this.getSpellLevelForDetails(className, name) > 0);
            const ritualFromSpellbook = wizardSpellbookNames.filter((name) => this.isRitualSpell(name) && this.getSpellLevelForDetails(className, name) > 0);
            selectedNames = [...wizardCantrips, ...preparedLeveled, ...ritualFromSpellbook];
        } else if (preparedNames.length > 0) {
            selectedNames = [...preparedNames, ...ritualKnownNames];
        } else {
            selectedNames = knownNames;
        }

        const maxAllowedSpellLevel = this.getMaxSpellLevelForClassLevel(className, char.level);
        const uniqueNames = [...new Set(selectedNames)].filter((name) => {
            const spellLevel = this.getSpellLevelForDetails(className, name);
            return spellLevel === 0 || spellLevel <= maxAllowedSpellLevel;
        });
        const spellBonus = this.spellAttackBonus();
        const saveDC = this.spellSaveDC();

        return uniqueNames
            .map((name) => {
                const details = spellDetailsMap[name];
                const as = details?.attackSave ?? '';
                const hitDcLabel = as.includes('Attack') ? spellBonus
                    : as.includes('Save') ? `DC ${saveDC}`
                        : '—';
                return {
                    name,
                    level: this.getSpellLevelForDetails(className, name),
                    castingTime: details?.castingTime ?? '—',
                    hitDcLabel,
                    range: details?.range ?? '—',
                    damage: 'Spell',
                    concentration: details?.concentration ?? false,
                    ritual: details?.ritual ?? false
                };
            })
            .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
    });

    readonly filteredSpellRows = computed(() => {
        const term = this.spellSearchTerm().trim().toLowerCase();
        if (!term) {
            return this.persistedSpellRows();
        }

        return this.persistedSpellRows().filter((row) => {
            const details = spellDetailsMap[row.name];
            const haystack = [
                row.name,
                row.castingTime,
                row.range,
                row.hitDcLabel,
                row.damage,
                details?.attackSave ?? '',
                details?.components ?? '',
                details?.damageEffect ?? '',
                details?.description ?? ''
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    });

    readonly spellManagerClassCatalog = computed(() => {
        const char = this.character();
        if (!char?.className) {
            return [] as ReadonlyArray<{ name: string; level: number; source: string }>;
        }

        const maxAllowedSpellLevel = this.getMaxSpellLevelForClassLevel(char.className, char.level);

        const catalog = classSpellCatalog[char.className] ?? [];
        return [...catalog]
            .filter((spell) => spell.level === 0 || spell.level <= maxAllowedSpellLevel)
            .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name))
            .map((spell) => ({
                name: spell.name,
                level: spell.level,
                source: spell.source
            }));
    });

    readonly spellManagerAvailableLevelFilters = computed(() => {
        const levels = new Set(this.spellManagerClassCatalog().map((spell) => `${spell.level}` as `${number}`));
        const sortedLevels = [...levels].sort((left, right) => Number(left) - Number(right));

        return [
            { value: 'all' as const, label: 'All' },
            ...sortedLevels.map((level) => ({
                value: level,
                label: Number(level) === 0 ? 'Cantrips' : `Level ${level}`
            }))
        ];
    });

    readonly spellManagerKnownNames = computed(() => {
        const className = this.character()?.className;
        if (!className) {
            return new Set<string>();
        }

        return new Set(this.persistedBuilderState()?.classKnownSpellsByClass?.[className] ?? []);
    });

    readonly spellManagerPreparedNames = computed(() => {
        const className = this.character()?.className;
        if (!className) {
            return new Set<string>();
        }

        return new Set(this.getPreparedLeveledSpellNames(this.persistedBuilderState()?.classPreparedSpells?.[className], className));
    });

    readonly spellManagerSpellbookNames = computed(() => {
        const className = this.character()?.className;
        if (!className) {
            return new Set<string>();
        }

        return new Set(this.persistedBuilderState()?.wizardSpellbookByClass?.[className] ?? []);
    });

    readonly spellManagerFilteredCatalog = computed(() => {
        const term = this.spellManagerSearch().trim().toLowerCase();
        const selectedLevel = this.spellManagerLevelFilter();

        return this.spellManagerClassCatalog().filter((spell) => {
            if (selectedLevel !== 'all' && `${spell.level}` !== selectedLevel) {
                return false;
            }

            if (!term) {
                return true;
            }

            const details = spellDetailsMap[spell.name];
            const haystack = [
                spell.name,
                spell.level === 0 ? 'cantrip' : `level ${spell.level}`,
                spell.source,
                details?.description ?? '',
                details?.attackSave ?? '',
                details?.castingTime ?? '',
                details?.components ?? ''
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    });

    readonly spellManagerPreparedCount = computed(() =>
        this.spellManagerClassCatalog().filter((spell) => spell.level > 0 && this.spellManagerPreparedNames().has(spell.name)).length
    );

    readonly spellManagerPreparedLimit = computed(() => {
        const char = this.character();
        if (!char) {
            return 0;
        }

        return this.getPreparedSpellLimitForClassLevel(char.className, char.level);
    });

    readonly spellManagerPreparedLimitReached = computed(() => {
        const limit = this.spellManagerPreparedLimit();
        if (limit <= 0) {
            return true;
        }

        return this.spellManagerPreparedCount() >= limit;
    });

    readonly spellManagerSpellbookCount = computed(() => {
        const isWizard = this.character()?.className === 'Wizard';
        if (isWizard) {
            return this.spellManagerClassCatalog().filter((spell) => this.spellManagerSpellbookNames().has(spell.name)).length;
        }

        return this.spellManagerClassCatalog().filter((spell) => this.spellManagerKnownNames().has(spell.name)).length;
    });

    readonly spellManagerAllCount = computed(() => this.spellManagerClassCatalog().length);

    readonly spellManagerTabFilteredCatalog = computed(() => {
        const selectedTab = this.spellManagerTab();
        const isWizard = this.character()?.className === 'Wizard';

        return this.spellManagerFilteredCatalog().filter((spell) => {
            if (selectedTab === 'prepared') {
                if (isWizard && spell.level === 0) {
                    return this.isSpellInSpellbook(spell.name);
                }

                return spell.level > 0 && this.spellManagerPreparedNames().has(spell.name);
            }

            if (selectedTab === 'spellbook') {
                return isWizard
                    ? this.spellManagerSpellbookNames().has(spell.name)
                    : this.spellManagerKnownNames().has(spell.name);
            }

            return true;
        });
    });

    readonly spellCantrips = computed(() => {
        return this.filteredSpellRows().filter((row) => row.level === 0);
    });

    readonly spellsByLevel = computed(() => {
        const leveled = this.filteredSpellRows().filter((row) => row.level > 0);
        const groups = new Map<number, typeof leveled>();
        for (const spell of leveled) {
            if (!groups.has(spell.level)) groups.set(spell.level, []);
            groups.get(spell.level)!.push(spell);
        }
        return [...groups.entries()]
            .sort(([a], [b]) => a - b)
            .map(([level, spells]) => ({ level, spells }));
    });

    readonly hasLeveledSpells = computed(() => this.spellsByLevel().length > 0);

    readonly defenses = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const traitResistances = (char.traits ?? [])
            .filter((trait) => /resistance|resil|immune/i.test(trait))
            .map((trait) => trait.replace(/^[^:]*:\s*/, '').trim());

        return traitResistances;
    });

    readonly conditionSummary = computed(() => {
        const char = this.character();
        if (!char) {
            return 'No active conditions';
        }

        return char.status === 'Recovering' ? 'Recovering from previous encounter' : 'No active conditions';
    });

    readonly training = computed(() => {
        const char = this.character();
        if (!char) {
            return { armor: [] as string[], weapons: [] as string[], tools: [] as string[] };
        }

        return this.getTrainingFromSelections(this.persistedBuilderState());
    });

    readonly languageList = computed(() => {
        const char = this.character();
        const persisted = this.persistedBuilderState();
        const selected = [
            ...(char?.languages ?? []),
            ...(persisted?.selectedLanguages ?? []),
            ...(persisted?.selectedSpeciesLanguages ?? []),
            ...(this.raceInfo()?.languages ?? [])
        ]
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);

        return [...new Set(selected)];
    });

    readonly senses = computed(() => {
        const char = this.character();
        if (!char) {
            return ['Passive Perception 10'];
        }

        return [
            `Passive Perception ${this.passivePerception()}`,
            `Passive Investigation ${this.passiveInvestigation()}`,
            `Passive Insight ${this.passiveInsight()}`
        ];
    });

    readonly inventory = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const persistedEntries = this.normalizedInventoryEntries()
            .filter((entry) => !entry.isContainer)
            .map((entry) => ({
                name: entry.name,
                category: entry.category,
                quantity: entry.quantity,
                weight: entry.weight,
                costGp: entry.costGp,
                notes: entry.notes
            }));

        if (persistedEntries.length > 0) {
            const weapons: string[] = [];
            const armor: string[] = [];
            const gear: string[] = [];

            for (const entry of persistedEntries) {
                const label = entry.quantity > 1 ? `${entry.name} x${entry.quantity}` : entry.name;
                const normalizedCategory = entry.category.toLowerCase();

                if (normalizedCategory.includes('weapon')) {
                    weapons.push(label);
                    continue;
                }

                if (normalizedCategory.includes('armor') || normalizedCategory.includes('shield')) {
                    armor.push(label);
                    continue;
                }

                gear.push(label);
            }

            const persistedCurrency = this.persistedBuilderState()?.currency;
            const currency = persistedCurrency
                ? {
                    pp: Number(persistedCurrency.pp) || 0,
                    gp: Number(persistedCurrency.gp) || 0,
                    ep: Number(persistedCurrency.ep) || 0,
                    sp: Number(persistedCurrency.sp) || 0,
                    cp: Number(persistedCurrency.cp) || 0
                }
                : { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

            const totalItemCount = persistedEntries.reduce((sum, item) => sum + item.quantity, 0);

            return {
                weapons,
                armor,
                gear,
                currency,
                totalItemCount,
                items: persistedEntries
            };
        }

        return {
            weapons: [] as string[],
            armor: [] as string[],
            gear: [] as string[],
            currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
            totalItemCount: 0,
            items: [] as Array<{ name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string }>
        };
    });


    readonly inventorySummary = computed(() => {
        const bag = this.inventory();
        if (!bag) {
            return { weight: '0 lb', itemCount: 0, partyWeight: '0 lb' };
        }

        const totalWeight = this.normalizedInventoryEntries().reduce((sum, entry) => sum + this.getInventoryEntryWeight(entry), 0);
        const itemCount = bag.totalItemCount ?? (bag.weapons.length + bag.armor.length + bag.gear.length);
        const weightLabel = totalWeight > 0
            ? `${Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(1)} lb`
            : '0 lb';

        return {
            weight: weightLabel,
            itemCount,
            partyWeight: 'Not tracked'
        };
    });

    readonly selectedLifestyleExpenseDescription = computed(() =>
        this.lifestyleExpenseDescriptions[this.selectedLifestyleExpense()] ?? ''
    );

    readonly filteredInventoryItems = computed(() => {
        const bag = this.inventory();
        if (!bag) {
            return [];
        }

        const term = this.inventorySearchTerm().trim().toLowerCase();
        if (!term) {
            return bag.items;
        }

        return bag.items.filter((item) => {
            const haystack = [
                item.name,
                item.category,
                item.notes ?? '',
                item.costGp != null ? String(item.costGp) : '',
                item.weight != null ? String(item.weight) : ''
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    });

    readonly inventoryManagerRows = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() => {
        const term = this.inventoryManagerSearch().trim().toLowerCase();

        return this.normalizedInventoryEntries()
            .map((entry, index) => ({ entry, index }))
            .filter((row) => {
                if (!term) {
                    return true;
                }

                const haystack = [
                    row.entry.name,
                    row.entry.category,
                    row.entry.notes ?? '',
                    row.entry.costGp != null ? String(row.entry.costGp) : '',
                    row.entry.weight != null ? String(row.entry.weight) : ''
                ].join(' ').toLowerCase();

                return haystack.includes(term);
            });
    });

    readonly inventoryManagerEquipmentRows = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() =>
        this.inventoryManagerRows().filter((row) => !row.entry.isContainer)
    );

    readonly inventoryManagerContainerRows = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() =>
        this.inventoryManagerRows().filter((row) => row.entry.isContainer)
    );

    readonly inventoryManagerContainerBuckets = computed<Array<{ entry: PersistedInventoryEntry; sourceIndex: number; copyIndex: number }>>(() =>
        this.inventoryManagerContainerRows().map((row) => ({
            entry: row.entry,
            sourceIndex: row.index,
            copyIndex: 0
        }))
    );

    readonly inventoryManagerEquipmentWeight = computed(() =>
        this.inventoryManagerEquipmentRows().reduce((sum, row) => sum + this.getInventoryEntryWeight(row.entry), 0)
    );

    readonly inventoryCatalogCategories = computed<string[]>(() => {
        const categories = new Set<string>();

        for (const item of equipmentCatalog) {
            const category = item.category?.trim();
            if (category) {
                categories.add(category);
            }
        }

        return ['All', ...[...categories].sort((left, right) => left.localeCompare(right))];
    });

    readonly filteredInventoryCatalogItems = computed(() => {
        const term = this.inventoryManagerSearch().trim().toLowerCase();
        const selectedCategory = this.inventoryCatalogCategory();

        return equipmentCatalog.filter((item) => {
            if (selectedCategory !== 'All' && item.category !== selectedCategory) {
                return false;
            }

            if (!term) {
                return true;
            }

            const haystack = [
                item.name,
                item.category,
                item.notes ?? '',
                item.summary ?? '',
                item.rarity ?? '',
                item.attunement ?? ''
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    });

    private getInventoryEntryWeight(entry: PersistedInventoryEntry): number {
        const ownWeight = (entry.weight ?? 0) * Math.max(1, entry.quantity || 1);
        const containedWeight = (entry.containedItems ?? []).reduce(
            (sum, contained) => sum + this.getInventoryEntryWeight(contained),
            0
        );
        return ownWeight + containedWeight;
    }

    private createEmptyCurrencyState(): PersistedCurrencyState {
        return { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    }

    private parseNonNegativeInteger(value: string): number {
        return Math.max(0, this.parseInteger(value));
    }

    private normalizeLifestyleExpense(value: string): string {
        const normalized = value.trim().toLowerCase();
        return this.lifestyleExpenseOptions.some((option) => option.value === normalized) ? normalized : 'modest';
    }

    private parseCampaignPartyCurrency(summary: string): { cleanedSummary: string; currency: PersistedCurrencyState } {
        const raw = summary?.trim() ?? '';
        if (!raw) {
            return { cleanedSummary: '', currency: this.createEmptyCurrencyState() };
        }

        const start = raw.indexOf(this.partyCurrencyStartTag);
        const end = raw.indexOf(this.partyCurrencyEndTag);

        if (start === -1 || end === -1 || end < start) {
            return { cleanedSummary: raw, currency: this.createEmptyCurrencyState() };
        }

        const jsonStart = start + this.partyCurrencyStartTag.length;
        const jsonText = raw.slice(jsonStart, end).trim();
        const before = raw.slice(0, start).trimEnd();
        const after = raw.slice(end + this.partyCurrencyEndTag.length).trimStart();
        const cleanedSummary = [before, after].filter((part) => part.length > 0).join('\n\n').trim();

        try {
            const parsed = JSON.parse(jsonText) as Partial<PersistedCurrencyState>;
            return {
                cleanedSummary,
                currency: {
                    pp: this.parseNonNegativeInteger(String(parsed.pp ?? 0)),
                    gp: this.parseNonNegativeInteger(String(parsed.gp ?? 0)),
                    ep: this.parseNonNegativeInteger(String(parsed.ep ?? 0)),
                    sp: this.parseNonNegativeInteger(String(parsed.sp ?? 0)),
                    cp: this.parseNonNegativeInteger(String(parsed.cp ?? 0))
                }
            };
        } catch {
            return { cleanedSummary, currency: this.createEmptyCurrencyState() };
        }
    }

    private createCampaignSummaryWithPartyCurrency(originalSummary: string, currency: PersistedCurrencyState): string {
        const parsed = this.parseCampaignPartyCurrency(originalSummary);
        const stateJson = JSON.stringify(currency);
        return `${parsed.cleanedSummary}\n\n${this.partyCurrencyStartTag}${stateJson}${this.partyCurrencyEndTag}`.trim();
    }

    readonly containersByName = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() => {
        const entries = this.normalizedInventoryEntries();
        const containers = entries.filter((entry) => entry.isContainer);

        return containers.map((entry, index) => ({ entry, index }));
    });

    readonly filteredContainersByName = computed<Array<{ entry: PersistedInventoryEntry; index: number }>>(() => {
        const term = this.inventorySearchTerm().trim().toLowerCase();
        if (!term) {
            return this.containersByName();
        }

        const results: Array<{ entry: PersistedInventoryEntry; index: number }> = [];
        for (const containerItem of this.containersByName()) {
            const matchesContainer = [
                containerItem.entry.name,
                containerItem.entry.category,
                containerItem.entry.notes ?? ''
            ]
                .join(' ')
                .toLowerCase()
                .includes(term);

            const filteredContainedItems = (containerItem.entry.containedItems ?? []).filter((item) => {
                const haystack = [
                    item.name,
                    item.category,
                    item.notes ?? '',
                    item.costGp != null ? String(item.costGp) : '',
                    item.weight != null ? String(item.weight) : ''
                ].join(' ').toLowerCase();
                return haystack.includes(term);
            });

            if (!matchesContainer && filteredContainedItems.length === 0) {
                continue;
            }

            results.push({
                ...containerItem,
                entry: {
                    ...containerItem.entry,
                    containedItems: filteredContainedItems
                }
            });
        }

        return results;
    });

    containerInventoryDisplayName(containerItem: { entry: PersistedInventoryEntry; index: number }): string {
        const matchingContainers = this.containersByName().filter((item) => item.entry.name === containerItem.entry.name);
        if (matchingContainers.length <= 1) {
            return containerItem.entry.name;
        }

        const displayIndex = matchingContainers.findIndex((item) => item.index === containerItem.index && item.entry.name === containerItem.entry.name);
        return `${containerItem.entry.name} ${displayIndex + 1}`;
    }

    containerBucketDisplayName(bucket: { entry: PersistedInventoryEntry; sourceIndex: number; copyIndex: number }): string {
        const matchingBuckets = this.inventoryManagerContainerBuckets().filter((item) => item.entry.name === bucket.entry.name);
        if (matchingBuckets.length <= 1) {
            return bucket.entry.name;
        }

        const displayIndex = matchingBuckets.findIndex((item) => item.sourceIndex === bucket.sourceIndex && item.copyIndex === bucket.copyIndex);
        return `${bucket.entry.name} ${displayIndex + 1}`;
    }


    readonly weaponCombatRows = computed<CombatRow[]>(() => {
        const char = this.character();
        const bag = this.inventory();
        if (!char || !bag) {
            return [];
        }

        return bag.weapons.map((weaponLabel) => {
            const weaponName = weaponLabel.replace(/\s+x\d+$/i, '').trim();
            const weaponKey = weaponName.toLowerCase();
            const normalizedWeaponKey = weaponKey.replace(/^(light|hand|heavy) crossbow$/i, 'crossbow, $1');
            const weaponCatalogItem = this.catalogLookup.get(weaponKey) ?? this.catalogLookup.get(normalizedWeaponKey);
            const isRanged = /bow|crossbow|sling|blowgun|pistol|musket|rifle|gun/i.test(weaponName);
            const useDexterity = /bow|crossbow|sling|dagger|rapier|shortsword/i.test(weaponName);
            const abilityKey: AbilityKey = useDexterity ? 'dexterity' : 'strength';
            const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
            const bonus = abilityMod + char.proficiencyBonus;
            const damage = this.weaponDamageMap[weaponKey] ?? this.weaponDamageMap[normalizedWeaponKey] ?? '—';
            const catalogNotes = weaponCatalogItem?.notes?.trim() || weaponCatalogItem?.summary?.trim() || '—';
            return {
                name: weaponName,
                subtitle: isRanged ? 'Ranged Weapon' : 'Melee Weapon',
                range: isRanged ? 'Ranged' : '5 ft.',
                hitDcLabel: this.formatSigned(bonus),
                damage,
                notes: catalogNotes,
                concentration: false,
                ritual: false
            };
        });
    });

    readonly spellCategoryRows = computed(() => {
        const attack: CombatRow[] = [];
        const action: CombatRow[] = [];
        const bonusAction: CombatRow[] = [];
        const reaction: CombatRow[] = [];
        const other: CombatRow[] = [];

        for (const spell of this.persistedSpellRows()) {
            const details = spellDetailsMap[spell.name];
            const ct = (details?.castingTime ?? '').toLowerCase();
            const as = details?.attackSave ?? '';

            const row: CombatRow = {
                name: spell.name,
                subtitle: this.SPELL_LEVEL_LABELS[spell.level] ?? `Level ${spell.level}`,
                range: spell.range,
                hitDcLabel: spell.hitDcLabel,
                damage: this.formatSpellDamage(details),
                notes: details?.components ?? '—',
                concentration: spell.concentration,
                ritual: spell.ritual
            };

            if (ct.includes('bonus')) bonusAction.push(row);
            else if (ct.includes('reaction')) reaction.push(row);
            else if (ct === '1 action') {
                if (as.includes('Attack')) attack.push(row);
                else action.push(row);
            } else {
                other.push(row);
            }
        }

        return { attack, action, bonusAction, reaction, other };
    });

    readonly attackRows = computed<CombatRow[]>(() => [
        ...this.weaponCombatRows(),
        ...this.spellCategoryRows().attack
    ]);

    readonly actionSpellRows = computed(() => this.spellCategoryRows().action);
    readonly bonusActionSpellRows = computed(() => this.spellCategoryRows().bonusAction);
    readonly reactionSpellRows = computed(() => this.spellCategoryRows().reaction);
    readonly otherSpellRows = computed(() => this.spellCategoryRows().other);

    readonly bonusActionNames = computed(() => this.noteContext().bonusActions);
    readonly reactionNames = computed(() => this.noteContext().reactions);

    readonly attacksPerAction = computed(() => {
        const value = Number(this.noteContext().attacksPerAction);
        if (Number.isFinite(value) && value > 0) {
            return Math.trunc(value);
        }

        return Math.max(1, this.weaponCombatRows().length > 0 ? 1 : 0);
    });

    readonly classFeatures = computed(() => {
        const char = this.character();
        const state = this.persistedBuilderState();
        if (!char || !state) {
            return [];
        }

        const selections = state.classFeatureSelections ?? {};
        const allLevels = classLevelOneFeatures[char.className] ?? [];
        const features: Array<{ name: string; description: string }> = [];

        for (const levelGroup of allLevels) {
            if (levelGroup.level > char.level) continue;
            for (const feature of levelGroup.features) {
                const selectedValues = (selections[feature.name] ?? []).filter(Boolean);
                let description = feature.description ?? '';
                if (feature.choices && selectedValues.length > 0) {
                    description = `${description}${description ? '\n' : ''}Chosen: ${selectedValues.join(', ')}`;
                }
                features.push({ name: feature.name, description });
            }
        }

        return features;
    });

    readonly speciesTraits = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const baseTraits = [...(char.traits ?? [])];
        const persistedChoiceMap = this.persistedBuilderState()?.selectedSpeciesTraitChoices ?? {};
        const premadeChoiceMap = this.getPremadeCharacter(char)?.speciesTraitChoices ?? {};
        const choiceMap = Object.keys(persistedChoiceMap).length > 0 ? persistedChoiceMap : premadeChoiceMap;

        if (Object.keys(choiceMap).length === 0) {
            return baseTraits;
        }

        return baseTraits.map((trait) => {
            const separator = trait.indexOf(':');
            const traitTitle = separator >= 0 ? trait.slice(0, separator).trim() : trait.trim();
            const selected = (choiceMap[traitTitle] ?? []).filter((value) => value && value.trim().length > 0);

            if (selected.length === 0) {
                return trait;
            }

            return `${trait} | Chosen: ${selected.join(', ')}`;
        });
    });

    readonly displayBackstoryText = computed(() => {
        const notes = this.parsedNotes().cleanedNotes.trim();
        if (!notes) return '';
        const builderMarker = notes.search(/(?:^|\n)\s*(Organizations:|Allies:|Enemies:|Other:|Builder class focus:|Species focus:|Alignment direction:|Lifestyle direction:|Emphasize these personality traits:|Include these ideals:|Include these bonds:|Reflect these flaws:|Physical characteristics:|Faith:)/i);
        if (builderMarker > 0) return notes.slice(0, builderMarker).trim();
        return notes;
    });

    readonly formattedBackstoryHtml = computed(() => {
        const backstory = this.displayBackstoryText();
        if (!backstory) return '';
        return this.formatBackstoryRichText(backstory);
    });

    readonly roleplay = computed(() => {
        const char = this.character();
        if (!char) return null;
        const context = this.noteContext();
        const premade = this.getPremadeCharacter(char);

        const personalityFromCharacter = Array.isArray(char.personalityTraits) ? char.personalityTraits.join(', ') : '';
        const idealsFromCharacter = Array.isArray(char.ideals) ? char.ideals.join(', ') : '';
        const bondsFromCharacter = Array.isArray(char.bonds) ? char.bonds.join(', ') : '';
        const flawsFromCharacter = Array.isArray(char.flaws) ? char.flaws.join(', ') : '';

        const personalityFromPremade = Array.isArray(premade?.personalityTraits) ? premade.personalityTraits.join(', ') : '';
        const idealsFromPremade = Array.isArray(premade?.ideals) ? premade.ideals.join(', ') : '';
        const bondsFromPremade = Array.isArray(premade?.bonds) ? premade.bonds.join(', ') : '';
        const flawsFromPremade = Array.isArray(premade?.flaws) ? premade.flaws.join(', ') : '';

        return {
            personality: context.personality || personalityFromCharacter || personalityFromPremade || 'Not recorded',
            ideals: context.ideals || idealsFromCharacter || idealsFromPremade || 'Not recorded',
            bonds: context.bonds || bondsFromCharacter || bondsFromPremade || 'Not recorded',
            flaws: context.flaws || flawsFromCharacter || flawsFromPremade || 'Not recorded',
            backstory: char.notes || ''
        };
    });

    readonly noteContext = computed(() => {
        const notes = this.parsedNotes().cleanedNotes;

        const alignment = this.extractNoteValue(notes, /(^|\n)Alignment direction:\s*(.+?)(?=\n|$)/i);
        const lifestyle = this.extractNoteValue(notes, /(^|\n)Lifestyle direction:\s*(.+?)(?=\n|$)/i);
        const faith = this.extractNoteValue(notes, /(^|\n)Faith:\s*(.+?)(?=\n|$)/i);
        const experience = this.extractNoteValue(notes, /(^|\n)Experience:\s*(.+?)(?=\n|$)/i);
        const personality = this.extractNoteValue(notes, /(^|\n)Emphasize these personality traits:\s*(.+?)(?=\n|$)/i);
        const ideals = this.extractNoteValue(notes, /(^|\n)Include these ideals:\s*(.+?)(?=\n|$)/i);
        const bonds = this.extractNoteValue(notes, /(^|\n)Include these bonds:\s*(.+?)(?=\n|$)/i);
        const flaws = this.extractNoteValue(notes, /(^|\n)Reflect these flaws:\s*(.+?)(?=\n|$)/i);

        const organizations = this.extractNoteList(notes, /(^|\n)Organizations:\s*(.+?)(?=\n|$)/i);
        const allies = this.extractNoteList(notes, /(^|\n)Allies:\s*(.+?)(?=\n|$)/i);
        const enemies = this.extractNoteList(notes, /(^|\n)Enemies:\s*(.+?)(?=\n|$)/i);
        const other = this.extractNoteValue(notes, /(^|\n)Other:\s*(.+?)(?=\n|$)/i);
        const bonusActions = this.extractNoteList(notes, /(^|\n)Bonus Actions?:\s*(.+?)(?=\n|$)/i);
        const reactions = this.extractNoteList(notes, /(^|\n)Reactions?:\s*(.+?)(?=\n|$)/i);
        const attacksPerAction = this.extractNoteValue(notes, /(^|\n)Attacks? per Action:\s*(.+?)(?=\n|$)/i);

        const physicalRaw = this.extractNoteValue(notes, /(^|\n)Physical characteristics:\s*(.+?)(?=\n|$)/i);
        const physical = this.parsePhysicalCharacteristics(physicalRaw);

        return {
            alignment,
            lifestyle,
            faith,
            experience,
            personality,
            ideals,
            bonds,
            flaws,
            organizations,
            allies,
            enemies,
            other,
            bonusActions,
            reactions,
            attacksPerAction,
            physical
        };
    });

    private formatSpellDamage(details: { damageEffect?: string; description?: string } | undefined): string {
        if (!details?.damageEffect) return '—';
        const match = details.description?.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)/);
        const dice = match?.[1] ?? '';
        return dice ? `${dice} ${details.damageEffect}` : details.damageEffect;
    }

    getAbilityModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    async assignCharacterToCampaign(): Promise<void> {
        const char = this.character();
        const targetCampaignId = this.selectedCampaignAssignment();

        if (!char || !targetCampaignId || this.isUpdatingCampaign()) {
            return;
        }

        this.isUpdatingCampaign.set(true);
        this.campaignUpdateError.set('');

        try {
            const didUpdate = await this.store.setCharacterCampaign(char.id, targetCampaignId);
            if (!didUpdate) {
                this.campaignUpdateError.set('Unable to assign character to that campaign right now.');
            }
        } finally {
            this.isUpdatingCampaign.set(false);
            this.cdr.detectChanges();
        }
    }

    async removeCharacterFromCampaign(): Promise<void> {
        const char = this.character();
        if (!char || this.isUpdatingCampaign()) {
            return;
        }

        this.isUpdatingCampaign.set(true);
        this.campaignUpdateError.set('');

        try {
            const didUpdate = await this.store.setCharacterCampaign(char.id, null);
            if (!didUpdate) {
                this.campaignUpdateError.set('Unable to remove character from campaign right now.');
            }
        } finally {
            this.isUpdatingCampaign.set(false);
            this.cdr.detectChanges();
        }
    }

    onCampaignAssignmentChanged(value: string | number): void {
        this.selectedCampaignAssignment.set(String(value));
        this.campaignUpdateError.set('');
    }

    setCombatTab(tab: CombatTab): void {
        this.activeCombatTab.set(tab);
    }

    closeDetailDrawer(): void {
        this.activeDetailDrawer.set(null);
        this.detailSecondaryExpanded.set(true);
    }

    toggleDetailSecondary(): void {
        this.detailSecondaryExpanded.update((value) => !value);
    }

    private openDetailDrawer(content: DetailDrawerContent): void {
        this.requestCloseChat();
        this.hpManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.activeExtrasStatEntry.set(null);
        this.detailSecondaryExpanded.set(true);
        this.activeDetailDrawer.set(content);
    }

    openHpManager(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.hpDraftCurrent.set(char.hitPoints);
        this.hpDraftMax.set(char.maxHitPoints);
        this.hpDraftTemp.set(this.tempHitPoints());
        this.hpDraftDeathSaveFailures.set(this.deathSaveFailures());
        this.hpDraftDeathSaveSuccesses.set(this.deathSaveSuccesses());
        this.hpHealingInput.set('0');
        this.hpDamageInput.set('0');
        this.hpMaxModifierInput.set('0');
        this.hpOverrideInput.set(this.appliedMaxHpOverride()?.toString() ?? '');
        this.hpManagerOpen.set(true);
    }

    closeHpManager(): void {
        this.hpManagerOpen.set(false);
    }

    onHpHealingInputChanged(value: string): void {
        this.hpHealingInput.set(value);
    }

    onHpDamageInputChanged(value: string): void {
        this.hpDamageInput.set(value);
    }

    onHpMaxModifierInputChanged(value: string): void {
        this.hpMaxModifierInput.set(value);
    }

    onHpCurrentInputChanged(value: string): void {
        const previousCurrent = this.hpDraftCurrent();
        const resolvedMax = this.hpResolvedMax();
        const nextCurrent = Math.max(0, Math.min(resolvedMax, this.parseInteger(value)));
        this.hpDraftCurrent.set(nextCurrent);

        if (nextCurrent > 0) {
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
            return;
        }

        if (previousCurrent > 0) {
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
        }
    }

    onHpMaxInputChanged(value: string): void {
        const nextMax = Math.max(1, this.parseInteger(value));
        this.hpDraftMax.set(nextMax);
        this.hpDraftCurrent.set(Math.min(nextMax, this.hpDraftCurrent()));
    }

    onHpTempInputChanged(value: string): void {
        this.hpDraftTemp.set(Math.max(0, this.parseInteger(value)));
    }

    onHpOverrideInputChanged(value: string): void {
        this.hpOverrideInput.set(value);
    }

    async applyHealing(): Promise<void> {
        const amount = Math.max(0, this.parseInteger(this.hpHealingInput()));
        if (amount <= 0) {
            return;
        }

        const nextCurrent = Math.min(this.hpResolvedMax(), this.hpDraftCurrent() + amount);
        await this.persistCurrentHitPoints(nextCurrent);
        if (nextCurrent > 0) {
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
            await this.persistDeathSavesState(0, 0);
        }
        this.hpHealingInput.set('0');
    }

    async applyDamage(): Promise<void> {
        const amount = Math.max(0, this.parseInteger(this.hpDamageInput()));
        if (amount <= 0) {
            return;
        }

        const wasAboveZero = this.hpDraftCurrent() > 0;
        const nextCurrent = Math.max(0, this.hpDraftCurrent() - amount);
        await this.persistCurrentHitPoints(nextCurrent);
        if (nextCurrent === 0 && wasAboveZero) {
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
            await this.persistDeathSavesState(0, 0);
        }
        this.hpDamageInput.set('0');
    }

    async applyMaxHpChanges(): Promise<void> {
        const overrideValue = this.parseOptionalInteger(this.hpOverrideInput());
        if (overrideValue != null) {
            const nextOverride = Math.max(1, overrideValue);
            const nextCurrent = Math.min(nextOverride, this.hpDraftCurrent());
            await this.persistHpOverrideState(nextOverride);
            this.appliedMaxHpOverride.set(nextOverride);
            await this.persistCurrentHitPoints(nextCurrent);
            return;
        }

        if (this.appliedMaxHpOverride() != null) {
            await this.persistHpOverrideState(null);
            this.appliedMaxHpOverride.set(null);
        }

        // Max HP modifier is display-only and does not persist to character data.
        // Cap current HP if needed based on the resolved max (which includes modifier).
        const resolvedMax = this.hpResolvedMax();
        if (this.hpDraftCurrent() > resolvedMax) {
            const nextCurrent = Math.max(0, resolvedMax);
            await this.persistCurrentHitPoints(nextCurrent);
        }
    }

    async applyCurrentAndTempHp(): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const nextCurrent = Math.max(0, Math.min(this.hpResolvedMax(), this.hpDraftCurrent()));
        const nextMax = this.hpDraftMax();
        const nextTemp = Math.max(0, this.hpDraftTemp());

        // If max HP has changed, persist the new max; otherwise just update current HP
        if (nextMax !== char.maxHitPoints) {
            await this.persistHitPoints(nextCurrent, nextMax);
            await this.persistHpOverrideState(nextMax);
            this.appliedMaxHpOverride.set(nextMax);
        } else {
            await this.persistCurrentHitPoints(nextCurrent);
        }

        // Persist temp HP separately
        await this.persistTempHitPoints(nextTemp);
        this.tempHitPoints.set(nextTemp);

        if (nextCurrent > 0) {
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
            await this.persistDeathSavesState(0, 0);
        } else {
            await this.persistDeathSavesState(this.hpDraftDeathSaveFailures(), this.hpDraftDeathSaveSuccesses());
        }
    }

    async toggleHpDeathSaveFailure(pipIndex: number): Promise<void> {
        if (this.hpDraftCurrent() !== 0) {
            return;
        }

        const nextFailures = this.computeNextDeathSaveCount(this.hpDraftDeathSaveFailures(), pipIndex);
        const nextSuccesses = nextFailures >= 3 ? 0 : this.hpDraftDeathSaveSuccesses();

        this.hpDraftDeathSaveFailures.set(nextFailures);
        if (nextFailures >= 3) {
            this.hpDraftDeathSaveSuccesses.set(0);
        }

        await this.persistDeathSavesState(nextFailures, nextSuccesses);
    }

    async toggleHpDeathSaveSuccess(pipIndex: number): Promise<void> {
        if (this.hpDraftCurrent() !== 0) {
            return;
        }

        const nextSuccesses = this.computeNextDeathSaveCount(this.hpDraftDeathSaveSuccesses(), pipIndex);
        const nextFailures = nextSuccesses >= 3 ? 0 : this.hpDraftDeathSaveFailures();

        this.hpDraftDeathSaveSuccesses.set(nextSuccesses);
        if (nextSuccesses >= 3) {
            this.hpDraftDeathSaveFailures.set(0);
        }

        await this.persistDeathSavesState(nextFailures, nextSuccesses);
    }

    private async persistCurrentHitPoints(nextCurrent: number): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        await this.persistHitPoints(nextCurrent, char.maxHitPoints);
    }

    private async persistHpOverrideState(overrideValue: number | null): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState };

        if (overrideValue == null) {
            delete updatedState.hpMaxOverride;
        } else {
            updatedState.hpMaxOverride = overrideValue;
        }

        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);
        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });
    }

    async toggleInspiration(): Promise<void> {
        const char = this.character();
        if (!char) return;

        const next = !this.heroicInspiration();
        this.heroicInspiration.set(next);

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState };
        if (next) {
            updatedState.heroicInspiration = true;
        } else {
            delete updatedState.heroicInspiration;
        }

        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);
        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });
    }

    private async persistTempHitPoints(tempHpValue: number): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState };

        if (tempHpValue > 0) {
            updatedState.tempHitPoints = tempHpValue;
        } else {
            delete updatedState.tempHitPoints;
        }

        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);
        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });
    }

    private async persistCurrencyState(currencyValue: PersistedCurrencyState, lifestyleExpense?: string): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = {
            ...currentState,
            currency: {
                pp: this.parseNonNegativeInteger(String(currencyValue.pp)),
                gp: this.parseNonNegativeInteger(String(currencyValue.gp)),
                ep: this.parseNonNegativeInteger(String(currencyValue.ep)),
                sp: this.parseNonNegativeInteger(String(currencyValue.sp)),
                cp: this.parseNonNegativeInteger(String(currencyValue.cp))
            },
            lifestyleExpense: this.normalizeLifestyleExpense(lifestyleExpense ?? this.selectedLifestyleExpense())
        };

        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        try {
            await this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: updatedNotes,
                campaignId: char.campaignId,
                hitPoints: char.hitPoints,
                maxHitPoints: char.maxHitPoints
            });
        } finally {
            this.cdr.detectChanges();
        }
    }

    private async persistPartyCurrencyState(currencyValue: PersistedCurrencyState): Promise<boolean> {
        const campaign = this.currentCampaign();
        if (!campaign) {
            this.partyCurrencySaveError.set('Assign this character to a campaign first.');
            return false;
        }

        if (!this.canEditPartyCurrency()) {
            this.partyCurrencySaveError.set('Only campaign owners can update party currency.');
            return false;
        }

        const normalizedCurrency: PersistedCurrencyState = {
            pp: this.parseNonNegativeInteger(String(currencyValue.pp)),
            gp: this.parseNonNegativeInteger(String(currencyValue.gp)),
            ep: this.parseNonNegativeInteger(String(currencyValue.ep)),
            sp: this.parseNonNegativeInteger(String(currencyValue.sp)),
            cp: this.parseNonNegativeInteger(String(currencyValue.cp))
        };

        const updatedSummary = this.createCampaignSummaryWithPartyCurrency(campaign.summary ?? '', normalizedCurrency);

        const updated = await this.store.updateCampaign(campaign.id, {
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone,
            levelStart: campaign.levelStart,
            levelEnd: campaign.levelEnd,
            hook: campaign.hook,
            nextSession: campaign.nextSession,
            summary: updatedSummary
        });

        if (!updated) {
            this.partyCurrencySaveError.set('Unable to update party currency right now.');
            return false;
        }

        this.partyCurrencySaveError.set('');
        this.cdr.detectChanges();
        return true;
    }

    private async persistDeathSavesState(failures: number, successes: number): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const clampedFailures = this.clampDeathSaveCount(failures);
        const clampedSuccesses = this.clampDeathSaveCount(successes);
        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: char.notes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints,
            deathSaveFailures: clampedFailures,
            deathSaveSuccesses: clampedSuccesses
        });
    }

    private async persistHitPoints(nextCurrent: number, nextMax: number): Promise<void> {
        const char = this.character();
        if (!char || this.isSavingHp()) {
            return;
        }

        this.isSavingHp.set(true);

        try {
            const updated = await this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                level: char.level,
                role: char.role,
                background: char.background,
                notes: char.notes,
                campaignId: char.campaignId,
                hitPoints: nextCurrent,
                maxHitPoints: nextMax
            });

            if (updated) {
                this.hpDraftCurrent.set(updated.hitPoints);
                this.hpDraftMax.set(updated.maxHitPoints);
            }
        } finally {
            this.isSavingHp.set(false);
            this.cdr.detectChanges();
        }
    }

    private readStoredPortraitOriginalImageUrl(characterId: string): string {
        try {
            return globalThis.localStorage?.getItem(`dungeonkeep-portrait-original:${characterId}`)?.trim() ?? '';
        } catch {
            return '';
        }
    }

    private storePortraitOriginalImageUrl(characterId: string, imageUrl: string): void {
        const trimmed = imageUrl.trim();
        this.portraitOriginalImageUrl.set(trimmed);

        try {
            if (!trimmed) {
                globalThis.localStorage?.removeItem(`dungeonkeep-portrait-original:${characterId}`);
            } else {
                globalThis.localStorage?.setItem(`dungeonkeep-portrait-original:${characterId}`, trimmed);
            }
        } catch {
            // Ignore browser storage failures and fall back to in-memory state.
        }
    }

    private async persistPortrait(imageUrl: string, successMessage: string): Promise<void> {
        const char = this.character();
        if (!char || this.isSavingPortrait()) {
            return;
        }

        this.isSavingPortrait.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');

        try {
            const updated = await this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: char.notes,
                campaignId: char.campaignId,
                hitPoints: char.hitPoints,
                maxHitPoints: char.maxHitPoints,
                image: imageUrl
            });

            this.portraitSaveMessage.set(updated ? successMessage : 'Unable to save portrait right now.');
        } catch {
            this.portraitGenerationError.set('Unable to save portrait right now.');
        } finally {
            this.isSavingPortrait.set(false);
            this.cdr.detectChanges();
        }
    }

    private readPortraitFile(file: File): Promise<string> {
        if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('Choose an image file for the portrait.'));
        }

        if (file.size > 8 * 1024 * 1024) {
            return Promise.reject(new Error('Choose an image smaller than 8 MB.'));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Unable to read that image file.'));
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                if (!result) {
                    reject(new Error('Unable to read that image file.'));
                    return;
                }

                resolve(result);
            };

            reader.readAsDataURL(file);
        });
    }

    private getPortraitGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                if (detail.trim() || title.trim()) {
                    return detail.trim() || title.trim();
                }
            }

            if (error.status === 0) {
                return 'Unable to reach the portrait service right now.';
            }
        }

        return error instanceof Error ? error.message : 'Unable to generate a portrait right now.';
    }

    private buildCharacterInitials(name: string): string {
        const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (parts.length === 0) {
            return 'DK';
        }

        return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    }

    private parseInteger(value: string): number {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    private parseOptionalInteger(value: string): number | null {
        const raw = value.trim();
        if (!raw) {
            return null;
        }

        const parsed = Number.parseInt(raw, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    private parseOptionalNumber(value: string): number | null {
        const raw = value.trim();
        if (!raw) {
            return null;
        }

        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private clampDeathSaveCount(value: number): number {
        return Math.max(0, Math.min(3, Math.trunc(value)));
    }

    private computeNextDeathSaveCount(currentValue: number, pipIndex: number): number {
        return currentValue > pipIndex ? pipIndex : pipIndex + 1;
    }

    openAbilityDetail(ability: { key: string; name: string; score: number; modifierLabel: string }): void {
        const mod = this.getAbilityModifier(ability.score);
        const savingThrowMod = this.formatSigned(mod);
        const char = this.character();
        const profBonus = char?.proficiencyBonus ?? 2;

        const abilityDescriptions: Record<string, { description: string; skills: string[]; usedFor: string[] }> = {
            strength: {
                description: 'Strength measures bodily power, athletic training, and the extent to which you can exert raw physical force. It governs melee weapon attacks, carrying capacity, and feats of physical might.',
                skills: ['Athletics'],
                usedFor: [
                    'Melee weapon attack and damage rolls (unless finesse)',
                    'Athletics checks (climbing, jumping, swimming)',
                    'Carrying, pushing, lifting, or breaking objects',
                    'Strength saving throws'
                ]
            },
            dexterity: {
                description: 'Dexterity measures agility, reflexes, and balance. It affects your ability to avoid harm, move silently, and perform delicate tasks requiring a steady hand.',
                skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
                usedFor: [
                    'Ranged weapon attack and damage rolls',
                    'Finesse melee attack and damage rolls',
                    'Armor Class (when wearing light or no armor)',
                    'Initiative rolls',
                    'Dexterity saving throws'
                ]
            },
            constitution: {
                description: 'Constitution represents your health, stamina, and vital force. It determines your hit point maximum and helps you withstand pain, illness, and hardship.',
                skills: [],
                usedFor: [
                    'Hit point maximum (modifier × level added at character creation)',
                    'Concentration checks to maintain spells',
                    'Endurance-related checks (holding breath, forced marching)',
                    'Constitution saving throws'
                ]
            },
            intelligence: {
                description: 'Intelligence measures mental acuity, accuracy of recall, and the ability to reason through problems. It fuels arcane magic and knowledge-based skills.',
                skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
                usedFor: [
                    'Wizard spellcasting ability',
                    'Knowledge and investigation checks',
                    'Learning additional languages and tool proficiencies',
                    'Intelligence saving throws'
                ]
            },
            wisdom: {
                description: 'Wisdom reflects how attuned you are to the world through perception and intuition. It governs divine magic and the ability to read people and situations.',
                skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
                usedFor: [
                    'Cleric, Druid, and Ranger spellcasting ability',
                    'Passive Perception score (10 + modifier)',
                    'Insight, Perception, Survival checks',
                    'Wisdom saving throws'
                ]
            },
            charisma: {
                description: 'Charisma measures your ability to interact effectively with others. It includes such factors as confidence and eloquence, and can represent a charming or commanding personality.',
                skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
                usedFor: [
                    'Bard, Paladin, Sorcerer, and Warlock spellcasting ability',
                    'Social interaction checks (persuade, deceive, intimidate)',
                    'Performance and leadership situations',
                    'Charisma saving throws'
                ]
            }
        };

        const info = abilityDescriptions[ability.key] ?? {
            description: `${ability.name} influences core rolls tied to this stat and its modifier.`,
            skills: [],
            usedFor: []
        };

        const lineItems: Array<{ value: string; label: string }> = [
            { value: String(ability.score), label: 'Score' },
            { value: this.formatSigned(mod), label: 'Modifier' },
            { value: savingThrowMod, label: 'Saving Throw (no proficiency)' },
            { value: this.formatSigned(mod + profBonus), label: 'Saving Throw (with proficiency)' },
        ];

        const bullets = [
            ...info.usedFor,
            ...(info.skills.length ? [`Related skills: ${info.skills.join(', ')}`] : [])
        ];

        this.openDetailDrawer({
            title: ability.name,
            subtitle: `Score ${ability.score} • Modifier ${ability.modifierLabel}`,
            description: info.description,
            lineItems,
            bullets
        });
    }

    openSensesDetail(): void {
        const darkvisionTrait = (this.character()?.traits ?? []).find((trait) => /darkvision/i.test(trait));
        const darkvisionRangeMatch = darkvisionTrait?.match(/(\d+)\s*feet?|(?:range of\s*)(\d+)/i);
        const darkvisionRange = darkvisionRangeMatch
            ? `${darkvisionRangeMatch[1] ?? darkvisionRangeMatch[2]} ft`
            : 'Not recorded';

        this.openDetailDrawer({
            title: 'Senses',
            subtitle: 'Senses',
            description: "Passive checks are a special kind of ability check that doesn't involve dice rolls. They can represent repeated attempts or checks the DM resolves secretly.",
            lineItems: [
                { value: `${this.passivePerception()}`, label: 'Passive Perception' },
                { value: `${this.passiveInvestigation()}`, label: 'Passive Investigation' },
                { value: `${this.passiveInsight()}`, label: 'Passive Insight' },
                { value: darkvisionRange, label: 'Darkvision' }
            ],
            bullets: [
                'Blindsight: A creature with blindsight can perceive surroundings without relying on sight, within a specific radius.',
                'Darkvision: A creature with darkvision sees in darkness as if it were dim light and in dim light as if it were bright light.',
                'Tremorsense: A creature with tremorsense can detect vibrations through a connected surface within a specific radius.',
                'Truesight: A creature with truesight can see in normal and magical darkness, spot invisible creatures, and perceive illusions.'
            ]
        });
    }

    openProficiencyDetail(): void {
        const char = this.character();
        const proficiencyBonus = char?.proficiencyBonus ?? 2;

        this.openDetailDrawer({
            title: `Proficiency Bonus: +${proficiencyBonus}`,
            subtitle: 'Core Stat',
            description: 'Characters have a proficiency bonus determined by level. This bonus is used for ability checks, saving throws, and attack rolls when proficiency applies.',
            bullets: [
                'Your proficiency bonus cannot be added to a single roll or check more than once, even if multiple rules could apply it.',
                'Some features can multiply or divide your proficiency bonus before applying it (for example, Expertise can double it for certain ability checks).',
                'If a feature would multiply proficiency for a check that does not include proficiency, the result still provides no benefit.',
                'In general, proficiency is not multiplied for attack rolls or saving throws unless a feature explicitly says so.',
                'This bonus is commonly included in proficient skill checks, proficient saving throws, weapon and spell attack rolls, and spell save DC calculations.'
            ]
        });
    }

    openSpeedDetail(): void {
        const walkingSpeed = this.speed();
        const strengthScore = this.effectiveAbilityScores()?.strength ?? 10;
        const strengthModifier = this.getAbilityModifier(strengthScore);
        const longJumpWithRun = strengthScore;
        const longJumpStanding = Math.floor(longJumpWithRun / 2);
        const highJumpWithRun = Math.max(0, 3 + strengthModifier);
        const highJumpStanding = Math.floor(highJumpWithRun / 2);

        this.openDetailDrawer({
            title: `Speed: ${walkingSpeed} ft`,
            subtitle: 'Core Stat',
            description: 'Every character has a speed, which is the distance in feet that the character can walk in one round.',
            lineItems: [
                { value: `${walkingSpeed} ft`, label: 'Walking' },
                { value: `${longJumpWithRun} ft`, label: 'Long Jump (with 10 ft run)' },
                { value: `${longJumpStanding} ft`, label: 'Long Jump (standing)' },
                { value: `${highJumpWithRun} ft`, label: 'High Jump (with 10 ft run)' },
                { value: `${highJumpStanding} ft`, label: 'High Jump (standing)' }
            ],
            bullets: [
                'While climbing or swimming, each foot of movement costs 1 extra foot (2 extra feet in difficult terrain) unless the creature has a climbing or swimming speed.',
                'At the DM\'s option, climbing a slippery vertical surface or one with few handholds requires a Strength (Athletics) check. Gaining distance in rough water might also require a Strength (Athletics) check.',
                'Long Jump: with at least 10 feet of movement immediately before the jump, you can cover feet up to your Strength score. Without the run-up, that distance is halved.',
                'High Jump: with at least 10 feet of movement immediately before the jump, you leap into the air a number of feet equal to 3 + your Strength modifier (minimum 0). Without the run-up, that distance is halved.',
                'Each foot you clear on a jump costs a foot of movement.',
                'When you land in difficult terrain, you must succeed on a DC 10 Dexterity (Acrobatics) check to land on your feet; otherwise, you land prone.',
                'You can extend your arms half your height above yourself during a jump to reach farther upward.'
            ]
        });
    }

    openInitiativeDetail(): void {
        const initiativeModifier = this.initiative();
        const initiativeScore = 10 + initiativeModifier;
        const initiativeWithAdvantage = initiativeScore + 5;
        const initiativeWithDisadvantage = initiativeScore - 5;

        this.openDetailDrawer({
            title: `Initiative: ${this.formatSigned(initiativeModifier)}`,
            subtitle: 'Core Stat',
            description: "Initiative scores can replace rolls at your DM's discretion. Your initiative score equals 10 plus your Dexterity modifier.",
            lineItems: [
                { value: `${initiativeScore}`, label: 'Initiative Score' },
                { value: `${initiativeWithAdvantage}`, label: 'With Advantage (+5)' },
                { value: `${initiativeWithDisadvantage}`, label: 'With Disadvantage (-5)' }
            ],
            bullets: [
                'Initiative determines the order of turns during combat. When combat starts, each participant rolls Initiative using a Dexterity check.',
                'If a combatant is surprised at the start of combat, that combatant has disadvantage on their Initiative roll.',
                'A combatant\'s check total is called their Initiative order, from highest total to lowest.',
                'If two creatures tie, the DM decides order among tied monsters, and players decide order among tied characters.',
                'If your table uses initiative scores instead of rolling, apply +5 for advantage and -5 for disadvantage.'
            ]
        });
    }

    openHeroicInspirationDetail(): void {
        this.openDetailDrawer({
            title: 'Heroic Inspiration',
            subtitle: 'Core Stat',
            description: 'Sometimes the DM or a rule gives you Heroic Inspiration. If you have Heroic Inspiration, you can expend it to reroll a die immediately after rolling it, and you must use the new roll.',
            bullets: [
                'Only One at a Time: You can never have more than one instance of Heroic Inspiration. If something gives you Heroic Inspiration and you already have it, you can give it to a player character in your group who lacks it.',
                'Gaining Heroic Inspiration: Your DM can give you Heroic Inspiration for a variety of reasons, especially for heroic, in-character, or entertaining play.',
                'Other rules might allow your character to gain Heroic Inspiration independent of the DM\'s decision.'
            ]
        });
    }

    openSavingThrowsDetail(): void {
        const rows = this.savingThrows();

        this.openDetailDrawer({
            title: 'Saving Throws',
            subtitle: 'Saving Throw Modifiers',
            lineItems: rows.map((row) => ({
                value: row.modifierLabel,
                label: row.label,
                note: row.proficient ? '(Proficient)' : undefined
            })),
            description: 'A saving throw is a check you make to resist a harmful effect, such as a spell, trap, poison, disease, or another immediate threat.',
            bullets: [
                'To make a saving throw, roll a d20 and add the relevant ability modifier.',
                'Situational bonuses or penalties can modify a save, and saves can be affected by advantage or disadvantage.',
                'Class features grant saving throw proficiencies; when proficient, you add your proficiency bonus to that save.',
                'The save DC is set by the effect causing it (for example, a caster\'s spell save DC for spells).',
                'A successful or failed save has the outcome described by the effect, often reducing or avoiding harm on success.'
            ]
        });
    }

    openDeathSavesDetail(): void {
        const failures = this.deathSaveFailures();
        const successes = this.deathSaveSuccesses();

        this.openDetailDrawer({
            title: 'Death Saving Throws Rules',
            subtitle: 'HP Management',
            lineItems: [
                { value: `${failures}`, label: 'Failures' },
                { value: `${successes}`, label: 'Successes' }
            ],
            description: 'A player character must make a Death Saving Throw if they start their turn with 0 Hit Points.',
            bullets: [
                'When you start your turn with 0 Hit Points, roll a Death Saving Throw to see whether you move closer to death or hang on to life.',
                'Three Successes/Failures: On 10 or higher you succeed; otherwise you fail. On your third success, you become Stable. On your third failure, you die.',
                'Successes and failures do not need to be consecutive. Both reset to zero when you regain any Hit Points or become Stable.',
                'Rolling a 1 or 20: A natural 1 counts as two failures. A natural 20 lets you regain 1 Hit Point.',
                'Damage at 0 Hit Points: If you take damage at 0 HP, you suffer one failure. A critical hit causes two failures. If damage equals or exceeds your Hit Point maximum, you die.'
            ]
        });
    }

    openTrainingDetail(title: string, values: string[]): void {
        const entries = values.length ? values : ['Not recorded'];
        const normalizedTitle = title.trim().toLowerCase();

        const trainingInfo: Record<string, { subtitle: string; description: string; bullets: string[] }> = {
            armor: {
                subtitle: 'Proficiencies & Training',
                description: 'Armor training determines which armor categories you can wear effectively without penalties to key checks and actions.',
                bullets: [
                    'Wearing armor you are not trained for can impose major drawbacks.',
                    'Armor can affect Stealth depending on type.',
                    'Shields are listed separately in many rules references but function as armor equipment.'
                ]
            },
            weapons: {
                subtitle: 'Proficiencies & Training',
                description: 'Weapon proficiencies determine which weapons you can use with proper training in combat.',
                bullets: [
                    'When you are proficient with a weapon, you add your proficiency bonus to its attack roll.',
                    'Simple and Martial categories are common groupings for weapon training.',
                    'Class and background choices often grant additional weapon proficiencies.'
                ]
            },
            tools: {
                subtitle: 'Proficiencies & Training',
                description: 'Tool proficiencies represent practiced training with specialized gear, crafts, vehicles, or kits.',
                bullets: [
                    'Tool proficiency can apply to checks when that tool is relevant.',
                    'The DM decides when a specific tool proficiency is applicable.',
                    'Some tools can overlap with skills; context determines which applies.'
                ]
            },
            languages: {
                subtitle: 'Proficiencies & Training',
                description: 'Languages represent the tongues your character can speak, read, or understand based on origin and training.',
                bullets: [
                    'Languages often come from species, background, or custom choices.',
                    'Knowing a language can unlock social and lore opportunities.',
                    'Some communication may still require interpretation depending on context and literacy.'
                ]
            }
        };

        const info = trainingInfo[normalizedTitle] ?? {
            subtitle: 'Proficiencies & Training',
            description: `These are your current ${title.toLowerCase()} proficiencies.`,
            bullets: []
        };

        this.openDetailDrawer({
            title,
            subtitle: info.subtitle,
            description: info.description,
            bullets: [
                ...entries,
                ...info.bullets
            ]
        });
    }

    openSkillDetail(skill: { name: string; ability: string; modifierLabel: string; proficient: boolean; hasDisadvantage?: boolean; disadvantageReason?: string | null }): void {
        const skillInfo: Record<string, { description: string; usedFor: string[] }> = {
            'Arcana': {
                description: 'Knowledge of magic, spells, magical items, and supernatural phenomena.',
                usedFor: ['Identify spells or magical effects', 'Recall lore about magical traditions (e.g., wizard schools)', 'Understand runes, enchantments, or planar magic']
            },
            'History': {
                description: 'Knowledge of past events, civilizations, wars, and legends.',
                usedFor: ['Recall historical events or famous figures', 'Recognize ancient ruins or artifacts', 'Understand political or cultural context']
            },
            'Investigation': {
                description: 'Logical deduction and careful examination. Key difference from Perception: Investigation is thinking, not just noticing.',
                usedFor: ['Search for hidden objects (clues, traps, compartments)', 'Analyze crime scenes or puzzles', 'Piece together how something happened']
            },
            'Nature': {
                description: 'Understanding of the natural world (non-magical).',
                usedFor: ['Identify plants, animals, terrain', 'Predict weather or natural hazards', 'Recall ecological knowledge']
            },
            'Religion': {
                description: 'Knowledge of gods, cults, rituals, and divine magic.',
                usedFor: ['Identify religious symbols or practices', 'Recall lore about deities or undead', 'Understand divine magic origins']
            },
            'Animal Handling': {
                description: 'Ability to calm, train, or control animals.',
                usedFor: ['Ride mounts effectively', 'Prevent animals from panicking', 'Influence animal behavior']
            },
            'Insight': {
                description: "Reading people's emotions and intentions.",
                usedFor: ['Detect lies or deception', 'Sense motives or hidden agendas', 'Understand emotional states']
            },
            'Medicine': {
                description: 'Practical knowledge of health and anatomy.',
                usedFor: ['Stabilize dying creatures', 'Diagnose illnesses', 'Provide basic treatment']
            },
            'Perception': {
                description: 'Awareness of your surroundings. The most commonly used skill in the game.',
                usedFor: ['Spot hidden enemies or traps', 'Hear distant sounds', 'Notice subtle details in your environment']
            },
            'Survival': {
                description: 'Ability to live off the land and navigate the wilderness.',
                usedFor: ['Track creatures', 'Hunt or forage for food and water', 'Navigate wilderness and predict environmental dangers']
            },
            'Athletics': {
                description: 'Physical power, endurance, and movement.',
                usedFor: ['Climb, swim, or jump', 'Grapple or shove enemies', 'Force open doors or obstacles']
            },
            'Acrobatics': {
                description: 'Balance, agility, and flexibility.',
                usedFor: ['Keep balance on narrow or unstable surfaces', 'Perform flips or rolls', 'Escape grapples']
            },
            'Sleight of Hand': {
                description: 'Fine motor control and trickery.',
                usedFor: ['Pickpocket or plant items on a person', 'Conceal objects on your body', 'Perform small tricks like cheating at cards']
            },
            'Stealth': {
                description: 'Moving unseen and unheard.',
                usedFor: ['Sneak past enemies', 'Hide in shadows or cover', 'Avoid detection during infiltration']
            },
            'Deception': {
                description: 'Lying and misleading others convincingly.',
                usedFor: ['Bluff your way through a situation', 'Create false identities or disguises', 'Mislead enemies or distract guards']
            },
            'Intimidation': {
                description: 'Using fear or dominance to influence others.',
                usedFor: ['Threaten others into cooperation', 'Coerce information from reluctant sources', 'Assert authority through fear']
            },
            'Performance': {
                description: 'Entertaining an audience through art, music, or storytelling.',
                usedFor: ['Act, sing, dance, or tell stories', 'Distract or impress crowds', 'Maintain a persona or disguise through performance']
            },
            'Persuasion': {
                description: 'Influencing others through charm, logic, and tact.',
                usedFor: ['Negotiate deals or agreements', 'Convince others to see your point of view', 'Build alliances and foster goodwill']
            }
        };

        const info = skillInfo[skill.name] ?? {
            description: `This skill uses ${skill.ability}.`,
            usedFor: []
        };

        const commonBoostsByAbility: Record<string, string[]> = {
            'STR': [
                "Enhance Ability (Bull's Strength): advantage on Strength checks",
                'Barbarian Rage: advantage on Strength checks',
            ],
            'DEX': [
                "Enhance Ability (Cat's Grace): advantage on Dexterity checks",
            ],
            'CON': [
                "Enhance Ability (Bear's Endurance): advantage on Constitution checks",
            ],
            'INT': [
                "Enhance Ability (Fox's Cunning): advantage on Intelligence checks",
            ],
            'WIS': [
                "Enhance Ability (Owl's Wisdom): advantage on Wisdom checks",
            ],
            'CHA': [
                "Enhance Ability (Eagle's Splendor): advantage on Charisma checks",
            ],
        };

        const skillSpecificBoosts: Record<string, string[]> = {
            'Stealth': [
                'Pass without Trace: +10 bonus to Stealth checks',
                'Invisibility: often grants advantage on Stealth checks',
            ],
        };

        const commonPenalties = [
            'Hex: disadvantage on checks of one chosen ability score',
            'Bestow Curse: can impose disadvantage on ability checks',
            'Poisoned condition: disadvantage on all ability checks',
            'Exhaustion (Level 1+): disadvantage on all ability checks',
            'Frightened: disadvantage on checks while source of fear is in sight',
            'Blinded: disadvantage on sight-based checks',
        ];

        const proficiencyNotes: string[] = [];
        if (skill.proficient) {
            proficiencyNotes.push('Expertise (if granted): double your proficiency bonus for this skill');
        }

        const referenceBullets = [
            'Guidance: +1d4 to one ability check',
            ...(commonBoostsByAbility[skill.ability] ?? []),
            ...(skillSpecificBoosts[skill.name] ?? []),
            ...proficiencyNotes,
            ...commonPenalties,
        ];

        const statusBullets: string[] = [];
        if (skill.hasDisadvantage && skill.disadvantageReason) {
            statusBullets.push(`Current disadvantage source: ${skill.disadvantageReason}`);
        }

        this.openDetailDrawer({
            title: skill.name,
            subtitle: `${skill.ability} Skill • ${skill.modifierLabel}${skill.proficient ? ' (Proficient)' : ''}${skill.hasDisadvantage ? ' • Disadvantage' : ''}`,
            description: info.description,
            bullets: [...statusBullets, ...info.usedFor, ...referenceBullets]
        });
    }

    openArmorClassDetail(value: number): void {
        const char = this.character();
        const dexterity = this.effectiveAbilityScores()?.dexterity ?? 10;
        const dexterityMod = this.getAbilityModifier(dexterity);
        const armorItems = this.inventory()?.armor ?? [];

        let armorName = '';
        let hasShield = false;
        for (const item of armorItems) {
            const normalized = this.stripInventoryQuantity(item).toLowerCase();
            if (normalized.includes('shield')) {
                hasShield = true;
                continue;
            }

            if (!armorName) {
                armorName = this.stripInventoryQuantity(item);
            }
        }

        const profile = this.getArmorClassProfile(armorName);
        const armorBase = profile?.base ?? 10;
        const dexterityApplied = profile?.dexCap == null
            ? dexterityMod
            : Math.min(dexterityMod, profile.dexCap);
        const shieldBonus = hasShield ? 2 : 0;
        const expectedAc = armorBase + dexterityApplied + shieldBonus;
        const magicBonus = value - expectedAc;
        const armorWarnings: string[] = [];

        const stealthReason = this.getArmorDisadvantageReasonForSkill('stealth', 'DEX');
        if (stealthReason) {
            armorWarnings.push(`Skill impact: ${stealthReason}`);
        }

        const armorCategory = armorName ? this.getArmorCategory(armorName) : null;
        if (armorCategory && !this.hasArmorTrainingForCategory(armorCategory)) {
            armorWarnings.push(`Training impact: while wearing ${armorName}, you have disadvantage on Strength and Dexterity checks.`);
        }

        const lineItems: Array<{ value: string; label: string; note?: string }> = [
            {
                value: `${armorBase}`,
                label: armorName ? `Armor (${armorName})` : 'Base AC (Unarmored)'
            },
            {
                value: this.formatSigned(dexterityApplied),
                label: 'Dexterity Bonus',
                note: profile?.dexCap === 2 ? '(Max 2)' : undefined
            }
        ];

        if (hasShield) {
            lineItems.push({ value: '+2', label: 'Shield Bonus' });
        }

        if (magicBonus !== 0) {
            lineItems.push({ value: this.formatSigned(magicBonus), label: 'Magic Bonus' });
        }

        this.openDetailDrawer({
            title: `Armor Class: ${value}`,
            subtitle: 'Defense Breakdown',
            lineItems,
            description: 'Your Armor Class (AC) represents how well your character avoids being wounded in battle. Things that contribute to your AC include the armor you wear, the shield you carry, and your Dexterity modifier. Without armor or a shield, your AC equals 10 + your Dexterity modifier.',
            bullets: armorWarnings
        });
    }

    private stripInventoryQuantity(label: string): string {
        return label.replace(/\s+x\d+$/i, '').trim();
    }

    private getArmorClassProfile(armorName: string): { base: number; dexCap: number | null } | null {
        if (!armorName) {
            return null;
        }

        const normalized = armorName.trim().toLowerCase();

        if (this.armorClassProfiles[normalized]) {
            return this.armorClassProfiles[normalized];
        }

        const matchedKey = Object.keys(this.armorClassProfiles).find((key) => normalized.includes(key));
        return matchedKey ? this.armorClassProfiles[matchedKey] : null;
    }

    private getEquippedArmorName(): string | null {
        const armorItems = this.inventory()?.armor ?? [];
        for (const item of armorItems) {
            const normalized = this.stripInventoryQuantity(item).toLowerCase();
            if (normalized.includes('shield')) {
                continue;
            }

            return this.stripInventoryQuantity(item);
        }

        return null;
    }

    private getArmorCategory(armorName: string): 'light' | 'medium' | 'heavy' | null {
        if (!armorName) {
            return null;
        }

        const normalized = armorName.trim().toLowerCase();
        const exact = this.armorCategoryByName[normalized];
        if (exact) {
            return exact;
        }

        const matchedKey = Object.keys(this.armorCategoryByName).find((key) => normalized.includes(key));
        return matchedKey ? this.armorCategoryByName[matchedKey] : null;
    }

    private hasArmorTrainingForCategory(category: 'light' | 'medium' | 'heavy'): boolean {
        const values = (this.training().armor ?? []).map((entry) => entry.toLowerCase());
        if (values.length === 0) {
            return false;
        }

        if (values.some((entry) => entry.includes('all armor'))) {
            return true;
        }

        if (category === 'light') {
            return values.some((entry) => entry.includes('light armor'));
        }

        if (category === 'medium') {
            return values.some((entry) => entry.includes('medium armor') || entry.includes('heavy armor'));
        }

        return values.some((entry) => entry.includes('heavy armor'));
    }

    private getArmorDisadvantageReasonForSkill(skillKey: string, abilityAbbr: string): string | null {
        const armorName = this.getEquippedArmorName();
        if (!armorName) {
            return null;
        }

        const normalizedArmor = armorName.toLowerCase();
        const armorCategory = this.getArmorCategory(armorName);
        const reasons: string[] = [];

        if (skillKey === 'stealth' && this.stealthDisadvantageArmor.has(normalizedArmor)) {
            reasons.push(`${armorName} imposes disadvantage on Stealth checks`);
        }

        const isStrengthOrDexterityCheck = abilityAbbr === 'STR' || abilityAbbr === 'DEX';
        if (armorCategory && isStrengthOrDexterityCheck && !this.hasArmorTrainingForCategory(armorCategory)) {
            reasons.push(`not proficient with worn ${armorCategory} armor (${armorName})`);
        }

        return reasons.length > 0 ? reasons.join('; ') : null;
    }

    openActionDetail(action: { name: string; subtitle?: string; range?: string; hitDcLabel?: string; damage?: string; notes?: string }): void {
        const bullets = [
            action.subtitle ? `Type: ${action.subtitle}` : 'Type: Combat option',
            action.range ? `Range: ${action.range}` : '',
            action.hitDcLabel ? `Hit / DC: ${action.hitDcLabel}` : '',
            action.damage ? `Damage / Effect: ${action.damage}` : '',
            action.notes ? `Notes: ${action.notes}` : ''
        ].filter((entry) => entry.length > 0);

        this.openDetailDrawer({
            title: action.name,
            subtitle: 'Action Detail',
            description: 'Detailed context for this combat option.',
            bullets
        });
    }

    openSpellDetail(spell: { name: string; castingTime?: string; range?: string; hitDcLabel?: string; damage?: string }): void {
        const details = spellDetailsMap[spell.name];
        const castingTime = spell.castingTime ?? details?.castingTime;
        const range = spell.range ?? details?.range;
        const hitDcLabel = spell.hitDcLabel ?? details?.attackSave;
        const effect = spell.damage ?? details?.damageEffect;
        this.openDetailDrawer({
            title: spell.name,
            subtitle: 'Spell Detail',
            description: details?.description ?? 'Spell details for this entry.',
            bullets: [
                castingTime ? `Casting Time: ${castingTime}` : '',
                range ? `Range: ${range}` : '',
                hitDcLabel ? `Hit / DC: ${hitDcLabel}` : '',
                effect ? `Effect: ${effect}` : '',
                details?.duration ? `Duration: ${details.duration}` : '',
                details?.components ? `Components: ${details.components}` : ''
            ].filter((entry) => entry.length > 0)
        });
    }

    openInventoryItemDetail(item: { name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string }): void {
        const catalogItem = this.catalogLookup.get(item.name.trim().toLowerCase());
        const summaryText = catalogItem?.summary?.trim() || item.notes?.trim() || catalogItem?.notes?.trim() || 'Tracked inventory item details.';
        const rulesText = this.inventoryItemRulesText(item, summaryText, catalogItem?.notes?.trim());
        const highlights = this.inventoryItemHighlights(catalogItem?.detailLines, summaryText, catalogItem?.sourceLabel, catalogItem?.rarity, catalogItem?.attunement);
        const profileTags = [catalogItem?.rarity?.trim(), catalogItem?.attunement?.trim(), catalogItem?.sourceLabel?.trim()]
            .filter((value): value is string => Boolean(value));

        const facts: Array<{ label: string; value?: string; linkLabel?: string; linkUrl?: string }> = [
            { label: 'Quantity', value: `${item.quantity}` },
            { label: 'Weight', value: item.weight != null ? `${item.weight} lb.` : '—' },
            { label: 'Cost', value: item.costGp != null ? `${item.costGp} gp` : '—' },
            catalogItem?.sourceUrl?.trim()
                ? {
                    label: 'Source',
                    linkLabel: catalogItem.sourceLabel?.trim() || 'Reference link',
                    linkUrl: catalogItem.sourceUrl.trim()
                }
                : { label: 'Source', value: '—' }
        ];

        this.openDetailDrawer({
            title: item.name,
            subtitle: item.category,
            description: summaryText,
            bullets: highlights,
            variant: 'inventory-item',
            metaLine: `Reference • ${item.category.toLowerCase()}`,
            profileTags: profileTags.length > 0 ? profileTags : [item.category],
            facts,
            rulesText
        });
    }

    private inventoryItemRulesText(
        item: { notes?: string },
        summaryText: string,
        catalogNotes?: string
    ): string | null {
        const notes = item.notes?.trim() || catalogNotes;
        if (!notes) {
            return null;
        }

        return this.normalizeInventoryDetailText(notes) === this.normalizeInventoryDetailText(summaryText) ? null : notes;
    }

    private inventoryItemHighlights(
        detailLines: string[] | undefined,
        summaryText: string,
        sourceLabel: string | undefined,
        rarity: string | undefined,
        attunement: string | undefined
    ): string[] {
        const summary = this.normalizeInventoryDetailText(summaryText);
        const seen = new Set<string>();

        return (detailLines ?? []).filter((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                return false;
            }

            if (sourceLabel?.trim() && trimmedLine === `Source group: ${sourceLabel}`) {
                return false;
            }

            if (rarity?.trim() && trimmedLine === `Rarity: ${rarity}`) {
                return false;
            }

            if (attunement?.trim() && trimmedLine === `Attunement: ${attunement}`) {
                return false;
            }

            const normalizedLine = this.normalizeInventoryDetailText(trimmedLine);
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

    openFeatureDetail(name: string, description: string, category: string): void {
        this.openDetailDrawer({
            title: name,
            subtitle: category,
            description,
            bullets: [
                'This feature can modify combat, exploration, or roleplay options.',
                'Review trigger conditions and action economy when using it.',
                'Check class/species progression for scaling details.'
            ]
        });
    }

    private readonly alignmentDetails: Readonly<Record<string, { description: string; bullets: string[] }>> = {
        'Lawful Good': {
            description: 'Lawful good characters combine compassion with duty. They believe mercy, justice, and restraint matter most when they are upheld through honorable action and reliable principles.',
            bullets: [
                'Acts with integrity, discipline, and a strong sense of responsibility toward others.',
                'Favors fair systems, oaths, and institutions when those systems protect the innocent.',
                'Will often sacrifice comfort or safety to do what is right in a principled way.'
            ]
        },
        'Neutral Good': {
            description: 'Neutral good characters focus on helping others without being tightly bound to law or rebellion. Their moral compass is guided by kindness, practicality, and conscience.',
            bullets: [
                'Puts compassion ahead of ideology or rigid codes.',
                'Supports rules when they help people, and ignores them when they cause harm.',
                'Usually seeks the most humane and constructive outcome available.'
            ]
        },
        'Chaotic Good': {
            description: 'Chaotic good characters value freedom, empathy, and self-expression. They resist oppression and prefer to do good on their own terms rather than through imposed systems.',
            bullets: [
                'Distrusts authority that limits liberty or enables cruelty.',
                'Acts from personal conviction rather than obedience.',
                'Often protects others by defying unjust expectations, laws, or traditions.'
            ]
        },
        'Lawful Neutral': {
            description: 'Lawful neutral characters prioritize order, structure, and consistency. They believe systems, discipline, and rules provide stability, even when emotional or moral questions are complicated.',
            bullets: [
                'Values hierarchy, routine, contracts, and procedure.',
                'May choose duty over personal preference or sentiment.',
                'Can be dependable and fair, but also rigid when flexibility is needed.'
            ]
        },
        'True Neutral': {
            description: 'True neutral characters tend toward balance, restraint, or simple pragmatism. They avoid extremes and often respond to situations case by case instead of following a fixed creed.',
            bullets: [
                'Prefers measured choices over ideological commitments.',
                'May act as a mediator, observer, or practical survivor.',
                'Can seem calm and grounded, though sometimes detached.'
            ]
        },
        'Chaotic Neutral': {
            description: 'Chaotic neutral characters are driven by freedom, impulse, and independence. They resist control and prefer to make choices according to their own instincts and desires.',
            bullets: [
                'Protects personal autonomy above conformity or duty.',
                'Can be spontaneous, unpredictable, and hard to manage.',
                'May champion freedom sincerely or simply reject restraint.'
            ]
        },
        'Lawful Evil': {
            description: 'Lawful evil characters use order, hierarchy, and discipline in service of selfish or cruel goals. They are often patient, strategic, and comfortable with systems of control.',
            bullets: [
                'Seeks power through structure, enforcement, and leverage.',
                'Honors rules when they are useful, especially when those rules benefit them.',
                'Can be coldly reliable, but rarely merciful.'
            ]
        },
        'Neutral Evil': {
            description: 'Neutral evil characters are motivated by self-interest above all else. They pursue advantage with little concern for fairness, loyalty, or the suffering left behind.',
            bullets: [
                'Measures choices by profit, safety, or influence.',
                'Will cooperate when useful and betray when convenient.',
                'Often hides ruthlessness behind pragmatism or charm.'
            ]
        },
        'Chaotic Evil': {
            description: 'Chaotic evil characters embrace destruction, cruelty, or violent selfishness without respect for rules or order. Their desires and impulses override stability, trust, and restraint.',
            bullets: [
                'Rejects authority, obligation, and moral restraint.',
                'Frequently acts through fear, rage, or appetite.',
                'Creates danger not only for enemies, but often for allies as well.'
            ]
        }
    };

    private readonly lifestyleDetails: Readonly<Record<string, { description: string; bullets: string[] }>> = {
        wretched: {
            description: 'A wretched lifestyle means almost no shelter, privacy, or security. Survival comes before dignity, and every day is shaped by exposure, hunger, and danger.',
            bullets: [
                'Often sleeps outdoors, in alleys, ruins, or whatever temporary refuge can be found.',
                'Meals are inconsistent and usually poor in quality.',
                'This level of poverty makes illness, exhaustion, and social vulnerability far more common.'
            ]
        },
        squalid: {
            description: 'A squalid lifestyle provides a roof of some kind, but conditions remain filthy, unsafe, and degrading. The character lives with discomfort and constant risk.',
            bullets: [
                'Lodging is cramped, dirty, and often infested or poorly maintained.',
                'Food is cheap and unreliable, and sanitation is poor.',
                'The character is likely familiar with desperate neighborhoods and hard living.'
            ]
        },
        poor: {
            description: 'A poor lifestyle covers basic needs but little else. The character can keep going day to day, though comfort, quality, and social standing remain limited.',
            bullets: [
                'Meals are simple, lodging is crowded, and clothing is practical rather than refined.',
                'Money is watched carefully, with little margin for luxuries or mistakes.',
                'This is stable survival, not true security.'
            ]
        },
        modest: {
            description: 'A modest lifestyle is respectable and sustainable. It provides decent food, reasonable shelter, and enough stability to keep equipment and reputation in order.',
            bullets: [
                'The character can afford ordinary lodging and dependable meals.',
                'This lifestyle avoids obvious hardship without signaling wealth.',
                'It suits many adventurers between expeditions.'
            ]
        },
        comfortable: {
            description: 'A comfortable lifestyle means a clean home or good inn room, quality meals, and the ability to maintain gear and appearances without daily anxiety about coin.',
            bullets: [
                'Living quarters are private or semi-private, well-kept, and socially respectable.',
                'Food, clothing, and services are consistently good rather than merely adequate.',
                'The character has enough means to appear established and competent in most settlements.'
            ]
        },
        wealthy: {
            description: 'A wealthy lifestyle supports fine lodging, excellent meals, and access to influential spaces. The character lives with ease and visible signs of status.',
            bullets: [
                'Can maintain servants, tailored clothing, and premium accommodations.',
                'Has easier access to elite venues, contacts, and comforts.',
                'This lifestyle communicates rank, success, or strong patronage.'
            ]
        },
        aristocratic: {
            description: 'An aristocratic lifestyle reflects the highest level of luxury and prestige. The character is surrounded by servants, ceremony, expensive tastes, and the expectations that come with power.',
            bullets: [
                'Lives among estates, noble courts, or elite circles with significant attention to etiquette.',
                'Enjoys exceptional food, furnishings, fashion, and social access.',
                'This lifestyle carries obligations, reputation pressure, and political scrutiny as well as comfort.'
            ]
        }
    };

    private readonly lifestyleCosts: Readonly<Record<string, { perDay: string; perMonth: string }>> = {
        wretched: { perDay: '—', perMonth: '—' },
        squalid: { perDay: '1 sp/day', perMonth: '3 gp/month' },
        poor: { perDay: '2 sp/day', perMonth: '6 gp/month' },
        modest: { perDay: '1 gp/day', perMonth: '30 gp/month' },
        comfortable: { perDay: '2 gp/day', perMonth: '60 gp/month' },
        wealthy: { perDay: '4 gp/day', perMonth: '120 gp/month' },
        aristocratic: { perDay: '10 gp/day (minimum)', perMonth: '300 gp/month (minimum)' }
    };

    private readonly speciesLoreDetails: Readonly<Record<string, {
        history: string;
        adulthood: string;
        lifespan: string;
        height: string;
        weight: string;
        adulthoodAge: number;
        elderAge: number;
        bullets: string[];
    }>> = {
            Aasimar: {
                history: 'Aasimar carry a trace of celestial heritage that often reveals itself through quiet omens, radiant presence, or a sense of destiny that follows them through life.',
                adulthood: 'Aasimar mature at about the same pace as humans, though many connect adulthood with the first clear sign of their divine calling.',
                lifespan: 'They often live somewhat longer than humans, with some reaching roughly 160 years.',
                height: 'Aasimar usually fall within ordinary human height ranges, though their posture and presence often feel striking or luminous.',
                weight: 'Their builds vary widely, but many appear balanced, healthy, and subtly touched by something otherworldly.',
                adulthoodAge: 18,
                elderAge: 90,
                bullets: [
                    'Many aasimar feel caught between mortal life and a higher purpose.',
                    'Their appearance may include faintly radiant eyes, unusual calm, or an unmistakable sense of grace.',
                    'They are often remembered for presence as much as for physical features.'
                ]
            },
            Dragonborn: {
                history: 'Dragonborn trace their bloodlines to ancient dragons and often carry a strong sense of pride, honor, and lineage in how they present themselves to the world.',
                adulthood: 'Dragonborn grow quickly and are usually considered adults by around age 15.',
                lifespan: 'Most dragonborn live to around 80 years, giving them a shorter but intense sense of legacy.',
                height: 'Dragonborn are typically tall and imposing, often standing well over 6 feet with powerful, upright frames.',
                weight: 'They tend toward dense, muscular builds made heavier by strong bone structure, scales, and draconic features.',
                adulthoodAge: 15,
                elderAge: 50,
                bullets: [
                    'Physical presence matters greatly in many dragonborn cultures.',
                    'Coloration, horns, and scaled features often visually reflect ancestry and temperament.',
                    'Their appearance usually reads as martial, proud, and difficult to ignore.'
                ]
            },
            Dwarf: {
                history: 'Dwarves are shaped by clan, craft, and endurance, with traditions rooted in stone halls, patient labor, and memory that stretches across generations.',
                adulthood: 'Dwarves are generally considered adults around age 50, after years of work, discipline, and family expectation.',
                lifespan: 'They often live 350 years or more, giving them a long relationship with ancestry, grudges, and legacy.',
                height: 'Dwarves are shorter than most humans, commonly between about 4 and 5 feet tall, with compact and formidable posture.',
                weight: 'They are famously broad, dense, and heavy for their height, with sturdy frames built for labor and battle.',
                adulthoodAge: 50,
                elderAge: 220,
                bullets: [
                    'A dwarf often appears solid, grounded, and difficult to move either physically or emotionally.',
                    'Beards, braids, jewelry, and clan marks frequently carry personal and family meaning.',
                    'Their build suggests resilience more than speed.'
                ]
            },
            Elf: {
                history: 'Elves are ancient, fey-touched people tied to magic, artistry, and memory. Their cultures are often associated with old forests, refined learning, and a long view of history that makes human kingdoms feel brief by comparison.',
                adulthood: 'Elves reach physical maturity at roughly the same age as humans, but an elf is not usually regarded as a true adult until around age 100, when experience and identity are considered fully formed.',
                lifespan: 'Elves commonly live to around 750 years, giving them a very different sense of legacy, patience, grief, and long-term obligation than shorter-lived peoples.',
                height: 'Elves are typically slender and graceful, ranging from under 5 feet to over 6 feet tall depending on lineage and individual build.',
                weight: 'Elves usually have lighter, leaner frames than similarly tall humans, emphasizing balance, agility, and a narrow build over bulk.',
                adulthoodAge: 100,
                elderAge: 500,
                bullets: [
                    'Elven culture often prizes artistry, memory, magic, and natural beauty.',
                    'Their long lives can make them patient, reserved, nostalgic, or slow to fully trust quick-moving cultures.',
                    'Many elven traditions balance personal freedom with deep continuity across centuries.'
                ]
            },
            Gnome: {
                history: 'Gnomes are curious, clever, and inventive folk whose communities often blend whimsy, practical skill, and an intense love of discovery.',
                adulthood: 'Gnomes mature more slowly than humans and are often considered adults around age 40.',
                lifespan: 'Many gnomes live from 350 to 500 years, allowing lifetimes of experimentation, craft, and accumulated stories.',
                height: 'Gnomes are small, usually around 3 to 4 feet tall, with lively expressions and compact frames.',
                weight: 'They are light compared with most humanoids, though their posture and energy can make them seem larger than they are.',
                adulthoodAge: 40,
                elderAge: 250,
                bullets: [
                    'Gnomish appearance often reflects personality through bright clothes, tools, keepsakes, and expressive styling.',
                    'They tend to look alert, quick, and intensely engaged with the world around them.',
                    'Even older gnomes often carry a spark of restless curiosity.'
                ]
            },
            Goliath: {
                history: 'Goliaths come from harsh highland traditions shaped by endurance, competition, and the belief that strength should be matched by discipline and self-reliance.',
                adulthood: 'Goliaths mature at about the same pace as humans, with adulthood usually recognized in the later teenage years.',
                lifespan: 'They generally live less than a century, and many experience life as something to be met head-on rather than preserved gently.',
                height: 'Goliaths are notably tall and broad, often towering above other humanoids with long limbs and mountain-hardened frames.',
                weight: 'They are heavily built, with dense muscle and bone that make them feel as solid as the terrain they come from.',
                adulthoodAge: 18,
                elderAge: 60,
                bullets: [
                    'Their physical silhouette often reads as athletic, weathered, and powerful.',
                    'Scars, tattoos, and trophies can serve as records of competition or survival.',
                    'A goliath presence usually suggests resilience before a word is spoken.'
                ]
            },
            Halfling: {
                history: 'Halflings are deeply rooted in home, hospitality, and quiet courage, often building lives around comfort, family, and community rather than grandeur.',
                adulthood: 'Halflings are usually considered adults around age 20.',
                lifespan: 'Many halflings live to around 150 years, giving them a relaxed but enduring view of life.',
                height: 'They are typically around 3 feet tall, with quick movements and easy, balanced posture.',
                weight: 'Halflings are generally light and compact, built for nimbleness rather than reach or raw size.',
                adulthoodAge: 20,
                elderAge: 100,
                bullets: [
                    'Their appearance often feels approachable, grounded, and quietly confident.',
                    'Good food, travel wear, and practical personal comforts often show up in halfling style.',
                    'Small stature rarely translates to small presence.'
                ]
            },
            Human: {
                history: 'Humans are adaptable, ambitious, and astonishingly varied, building cultures everywhere from remote villages to sprawling cities and frontier outposts.',
                adulthood: 'Humans are generally considered adults in their late teens or early twenties.',
                lifespan: 'Most humans live less than a century, which often gives them urgency, drive, and a willingness to change quickly.',
                height: 'Human height varies enormously, from shorter compact builds to tall, long-limbed frames depending on lineage and region.',
                weight: 'Human weight is equally varied, with no single typical build beyond broad adaptability.',
                adulthoodAge: 18,
                elderAge: 60,
                bullets: [
                    'Human appearance is defined more by culture and upbringing than by one common physical mold.',
                    'They often show their identity through clothing, accents, posture, and personal ambition.',
                    'Their versatility is as visible socially as it is physically.'
                ]
            },
            Orc: {
                history: 'Orcs are hardy wanderers and survivors, shaped by demanding environments and traditions that often prize directness, endurance, and decisive action.',
                adulthood: 'Orcs mature quickly and are often recognized as adults in the early teenage years.',
                lifespan: 'They tend to live shorter lives than humans, often seldom reaching far beyond 50 years.',
                height: 'Orcs are usually tall, broad-shouldered, and physically commanding, with a natural look of strength and motion.',
                weight: 'Their builds tend toward heavy muscle and durable frames suited to hard travel and conflict.',
                adulthoodAge: 12,
                elderAge: 35,
                bullets: [
                    'An orc often gives the impression of momentum, force, and durability.',
                    'Tusks, scars, and weathered gear frequently become part of their visual identity.',
                    'Their appearance commonly reflects life lived close to hardship and action.'
                ]
            },
            Tiefling: {
                history: 'Tieflings bear the visible or spiritual marks of fiendish legacy, often living at the intersection of fascination, suspicion, and personal reinvention.',
                adulthood: 'Tieflings generally mature at about the same pace as humans.',
                lifespan: 'Many live slightly longer than humans, though their lives are often shaped more by social pressure than by age alone.',
                height: 'Tieflings usually share human-like height ranges, though horns, tails, and striking features can make their silhouettes memorable.',
                weight: 'Their builds vary like those of humans, with infernal traits adding more distinctiveness than mass.',
                adulthoodAge: 18,
                elderAge: 70,
                bullets: [
                    'Their appearance can range from subtly uncanny to unmistakably infernal.',
                    'Horns, tails, unusual skin tones, and luminous eyes often define first impressions.',
                    'Many tieflings shape their look intentionally as an act of control over how they are seen.'
                ]
            },
            Tabaxi: {
                history: 'Tabaxi are wandering, story-hungry travelers whose lives are often shaped by curiosity, movement, and a deep appetite for novelty.',
                adulthood: 'Tabaxi mature at about the same rate as humans, reaching adulthood in the later teenage years.',
                lifespan: 'They tend to live human-length lives, though their outlook often favors experience over permanence.',
                height: 'Tabaxi are typically human-sized or a bit taller, with long-limbed, feline frames built for balance and speed.',
                weight: 'They usually look lean and spring-loaded rather than bulky, with movement that feels graceful and precise.',
                adulthoodAge: 18,
                elderAge: 60,
                bullets: [
                    'Patterning, fur color, ears, tail, and eye shape make tabaxi visually distinctive at a glance.',
                    'They often seem poised to move even while standing still.',
                    'A tabaxi silhouette usually communicates agility before strength.'
                ]
            },
            Shifter: {
                history: 'Shifters carry bestial heritage that surfaces in instinct, appearance, and bursts of heightened ferocity, often leaving them between worlds rather than fully at home in one.',
                adulthood: 'Shifters mature at about the same pace as humans, though many become socially independent early.',
                lifespan: 'They tend to live slightly shorter lives than humans on average, though this varies by community and lifestyle.',
                height: 'Shifters usually fall within human height ranges, though posture, movement, and features often suggest an animal edge.',
                weight: 'Their builds are commonly wiry, athletic, and ready for sudden motion rather than ornamental stillness.',
                adulthoodAge: 18,
                elderAge: 60,
                bullets: [
                    'Hair, eyes, canines, and body language often carry subtle animal markers even before shifting.',
                    'They frequently look like they are holding energy just under the surface.',
                    'Different shifter lineages can skew more lithe, rugged, or predatory in appearance.'
                ]
            },
            Goblin: {
                history: 'Goblins are quick, adaptable survivors whose communities often value cunning, speed, and practical advantage over comfort or permanence.',
                adulthood: 'Goblins grow up fast and are often considered adults by about age 8.',
                lifespan: 'They rarely live especially long lives, often topping out around 60 years.',
                height: 'Goblins are short, usually between about 3 and 4 feet tall, with sharp features and restless body language.',
                weight: 'They are usually wiry and light, built for squeezing through danger and escaping it just as fast.',
                adulthoodAge: 8,
                elderAge: 40,
                bullets: [
                    'A goblin often looks alert, crafty, and halfway ready to bolt or pounce.',
                    'Their presence tends to emphasize speed, expression, and improvisation over size.',
                    'Gear and clothing frequently look practical, scavenged, or cleverly repurposed.'
                ]
            },
            'Shadar-Kai': {
                history: 'Shadar-kai are shadow-touched elves shaped by loss, duty, and the austere influence of the Raven Queen, often carrying an air of intensity or distance.',
                adulthood: 'Like other elves, shadar-kai mature physically at a human pace but are not usually regarded as fully adult until around age 100.',
                lifespan: 'They share the long elven lifespan, often living for many centuries.',
                height: 'Shadar-kai are usually slender and graceful like other elves, though their bearing often feels more severe or haunted.',
                weight: 'They tend toward lean, light frames, with a visual emphasis on precision and endurance rather than softness.',
                adulthoodAge: 100,
                elderAge: 500,
                bullets: [
                    'Their appearance often carries dark elegance, restraint, and signs of shadowed heritage.',
                    'Muted colors, stark features, and ritual scars or adornments are common visual cues.',
                    'They often seem emotionally contained even when physically still.'
                ]
            },
            Minotaur: {
                history: 'Minotaurs are physically formidable folk often associated with strength, momentum, and proud personal presence, whether in war, travel, or public life.',
                adulthood: 'Minotaurs mature at roughly the same pace as humans, reaching adulthood in the later teenage years.',
                lifespan: 'They often live human-length lives, though their cultures may place greater emphasis on deeds than longevity.',
                height: 'Minotaurs are typically very tall and broad, with powerful shoulders, thick necks, and unmistakable horned silhouettes.',
                weight: 'They are heavy, muscular, and massively built, with weight that reflects raw physical force and stability.',
                adulthoodAge: 17,
                elderAge: 55,
                bullets: [
                    'A minotaur usually reads as imposing even in relaxed posture.',
                    'Horns, stance, and sheer physical width define much of their visual identity.',
                    'Their appearance often suggests impact, confidence, and presence in close quarters.'
                ]
            },
            'Half-Elf': {
                history: 'Half-elves often grow up balancing different cultural worlds, carrying both human adaptability and an elven sense of memory, grace, or distance.',
                adulthood: 'Half-elves mature at about the same pace as humans, though their mixed heritage can shape how adulthood is recognized socially.',
                lifespan: 'They often live considerably longer than humans, with many reaching around 180 years.',
                height: 'Half-elves usually stand within human height ranges, often with a graceful carriage or fine-featured look that hints at elven ancestry.',
                weight: 'Their build varies widely, but many appear balanced and lightly athletic rather than especially heavy.',
                adulthoodAge: 20,
                elderAge: 120,
                bullets: [
                    'Their appearance often blends familiar humanity with a subtly uncanny refinement.',
                    'Many half-elves look adaptable in social spaces because they literally move between worlds.',
                    'Their features can read as elegant without being fragile.'
                ]
            },
            'Half-Orc': {
                history: 'Half-orcs often grow up negotiating strength, identity, and expectation, carrying both the resilience of orcish blood and the flexibility to move between different communities.',
                adulthood: 'Half-orcs mature a little faster than humans and are often considered adults in the mid-teens.',
                lifespan: 'They rarely live as long as humans, often reaching around 75 years at most.',
                height: 'Half-orcs are usually taller and broader than most humans, with an unmistakably powerful physical presence.',
                weight: 'They tend to be heavy-boned and muscular, built for impact and endurance.',
                adulthoodAge: 14,
                elderAge: 45,
                bullets: [
                    'Strength, scars, and force of personality often shape a half-orc first impression.',
                    'Their appearance can range from rough and intimidating to calm and imposing.',
                    'Many carry visible signs of hard-earned resilience.'
                ]
            }
        };

    private readonly deityFaithDetails: Readonly<Record<string, {
        description: string;
        lineItems: Array<{ value: string; label: string; note?: string }>;
        bullets: string[];
    }>> = {
            ilmater: {
                description: 'Ilmater, the Crying God or Broken God, is a lawful good deity of endurance, suffering, martyrdom, and perseverance. His faith teaches compassion, mercy, and the duty to bear burdens so that others may suffer less.',
                lineItems: [
                    { value: 'Lawful Good', label: 'Divine alignment' },
                    { value: 'Portfolio', label: 'Endurance, suffering, martyrdom, perseverance' },
                    { value: 'Life, Twilight', label: 'Associated domains' },
                    { value: 'Hands bound with red cord', label: 'Holy symbol' }
                ],
                bullets: [
                    'Ilmater is closely associated with compassion, patient endurance, and protection of the oppressed, injured, and poor.',
                    'In Forgotten Realms history, he stood beside Tyr and Torm as part of the Triad, a powerful alliance of lawful good deities.',
                    'His clergy are known for relieving suffering, ministering to the weak, and opposing cruelty, torture, and needless pain.'
                ]
            }
        };

    private readonly xpThresholds: ReadonlyArray<[number, number]> = [
        [2, 300], [3, 900], [4, 2700], [5, 6500], [6, 14000],
        [7, 23000], [8, 34000], [9, 48000], [10, 64000],
        [11, 85000], [12, 100000], [13, 120000], [14, 140000],
        [15, 165000], [16, 195000], [17, 225000], [18, 265000],
        [19, 305000], [20, 355000]
    ];

    private getSpeciesInfo(speciesName: string) {
        const match = Object.entries(speciesInfoMap).find(([key]) => key.toLowerCase() === speciesName.trim().toLowerCase());
        return match?.[1] ?? null;
    }

    private getSpeciesLore(speciesName: string) {
        const normalizedName = speciesName.trim();
        const match = Object.entries(this.speciesLoreDetails).find(([key]) => key.toLowerCase() === normalizedName.toLowerCase());
        if (match?.[1]) {
            return match[1];
        }

        const speciesInfo = this.getSpeciesInfo(normalizedName);
        const size = speciesInfo?.speciesDetails?.size?.toLowerCase() ?? '';
        if (!speciesInfo) {
            return null;
        }

        const height = size.includes('small')
            ? `${normalizedName} is typically shorter and more compact than a human, with proportions shaped by Small size and practical movement.`
            : size.includes('medium')
                ? `${normalizedName} usually falls within a human-like height band, though posture, features, and silhouette vary by lineage.`
                : `${normalizedName} has a more unusual silhouette than most humanoids, often standing out immediately in a crowd.`;

        const weight = size.includes('small')
            ? 'Build tends toward light, compact frames that emphasize balance, nimbleness, or efficiency over bulk.'
            : 'Build can range from lean to heavily set depending on heritage, environment, and lifestyle.';

        return {
            history: speciesInfo.summary ?? `${normalizedName} has its own distinct culture, physical presence, and visual identity.`,
            adulthood: `${normalizedName} reaches adulthood according to its own community standards, often tied to independence, training, or social role.`,
            lifespan: `Members of this species follow their own life stages and traditions, though exact lifespan can vary by lineage and setting.`,
            height,
            weight,
            adulthoodAge: 18,
            elderAge: 60,
            bullets: speciesInfo.highlights?.slice(0, 3) ?? []
        };
    }

    private formatAlignmentValue(value: string): string {
        return value
            .trim()
            .replace(/-/g, ' ')
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    private describeSpeciesAge(speciesName: string, value: string): DetailDrawerContent {
        const lore = this.getSpeciesLore(speciesName);
        const parsedAge = Number.parseInt(value, 10);
        const stage = lore && Number.isFinite(parsedAge)
            ? parsedAge < lore.adulthoodAge
                ? `This character is still young by ${speciesName} standards, with much of adult life still ahead.`
                : parsedAge < lore.elderAge
                    ? `This character is in the established adult span typical for ${speciesName}, with identity and reputation likely well formed.`
                    : `This character is older by ${speciesName} standards and may carry deep memory, experience, or a longer view of the world.`
            : null;

        return {
            title: `Age: ${value}`,
            subtitle: `${speciesName} lifespan`,
            lineItems: [
                { label: 'Current recorded age', value }
            ],
            description: lore
                ? `${lore.adulthood} ${lore.lifespan}`
                : 'Age is interpreted through species culture, maturity expectations, and lifespan norms.',
            bullets: [
                stage,
                ...(lore?.bullets ?? [])
            ].filter((entry): entry is string => Boolean(entry))
        };
    }

    private describeSpeciesHeight(speciesName: string, value: string): DetailDrawerContent {
        const lore = this.getSpeciesLore(speciesName);
        return {
            title: `Height: ${value}`,
            subtitle: `${speciesName} physique`,
            lineItems: [
                { label: 'Current recorded height', value }
            ],
            description: lore?.height
                ?? 'Height helps define silhouette, posture, and first-impression presence in scenes and portraits.',
            bullets: lore ? [lore.weight, ...lore.bullets.slice(0, 1)] : ['Height and build often influence movement style, presence, and how equipment or clothing are visualized.']
        };
    }

    private describeSpeciesWeight(speciesName: string, value: string): DetailDrawerContent {
        const lore = this.getSpeciesLore(speciesName);
        return {
            title: `Weight: ${value}`,
            subtitle: `${speciesName} build`,
            lineItems: [
                { label: 'Current recorded weight', value }
            ],
            description: lore?.weight
                ?? 'Weight reflects frame and build, helping describe how the character carries gear and moves through the world.',
            bullets: lore ? [lore.height, ...lore.bullets.slice(0, 1)] : ['Weight can inform how the character moves, appears, and is described in armor or travel gear.']
        };
    }

    openBackgroundRowDetail(label: string, value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        switch (label) {
            case 'Name': {
                this.openDetailDrawer({
                    title: value,
                    subtitle: 'Character Name',
                    description: 'This is the identity your character presents to the world and the name allies, rivals, and legends will remember.',
                    bullets: [
                        `Class: ${char.className}`,
                        `Background: ${this.displayBackground()}`,
                        `Species: ${char.race}`
                    ]
                });
                break;
            }
            case 'Race': {
                const race = this.raceLookup.get(value.toLowerCase());
                const speciesInfo = this.getSpeciesInfo(value);
                const speciesLore = this.getSpeciesLore(value);
                this.openDetailDrawer({
                    title: value,
                    subtitle: 'Species',
                    description: speciesLore?.history ?? speciesInfo?.summary ?? race?.description ?? 'A unique species with its own history, culture, and traits.',
                    lineItems: [
                        ...(speciesInfo?.speciesDetails?.coreTraits ?? []).map((item) => ({ value: item.value, label: item.label }))
                    ],
                    secondaryHeading: 'Notable species traits',
                    bullets: [
                        ...(speciesInfo?.speciesDetails?.traitNotes?.map((item) => `${item.title}: ${item.summary}`)
                            ?? speciesLore?.bullets
                            ?? race?.traits
                            ?? []),
                        ...(speciesLore
                            ? [
                                `Adulthood: ${speciesLore.adulthood}`,
                                `Lifespan: ${speciesLore.lifespan}`
                            ]
                            : [])
                    ]
                });
                break;
            }
            case 'Background': {
                const key = value.trim();
                const backgroundDetail = backgroundDetailOverrides[key];
                const description = key === 'Sage'
                    ? 'You spent years learning the lore of the multiverse, studying manuscripts, scrolls, and expert teachers until deep research became part of your identity.'
                    : backgroundDetail?.description ?? backgroundDescriptionFallbacks[key] ?? 'A background that shaped who your character was before adventuring.';
                const skills = backgroundDetail?.skillProficiencies ?? backgroundSkillProficienciesFallbacks[key] ?? 'Not recorded';
                const tools = backgroundDetail?.toolProficiencies ?? backgroundToolProficienciesFallbacks[key] ?? 'Not recorded';
                const languages = backgroundDetail?.languages ?? backgroundLanguagesFallbacks[key] ?? 'Not recorded';
                this.openDetailDrawer({
                    title: key,
                    subtitle: 'Background',
                    description,
                    lineItems: [
                        { value: skills, label: 'Skill proficiencies' },
                        { value: tools, label: 'Tool proficiencies' },
                        { value: languages, label: 'Languages' }
                    ],
                    secondaryHeading: 'Background details',
                    bullets: key === 'Sage'
                        ? [
                            'Researcher: if you do not know a piece of lore, you often know where or from whom it can be learned.',
                            'Typical specialties include alchemy, astronomy, history, religion, magic theory, and other deep academic fields.',
                            'Sages are often driven by knowledge, mystery, scholarship, and the preservation of dangerous or valuable truths.'
                        ]
                        : (backgroundDetail?.choices ?? []).map((choice) => `${choice.title}: ${choice.description ?? choice.options.slice(0, 3).join(', ')}`)
                });
                break;
            }
            case 'Class & Level': {
                const className = char.className;
                const classKey = Object.keys(classLevelOneFeatures).find((k) => k.toLowerCase() === className.toLowerCase());
                const levelEntries = classKey ? classLevelOneFeatures[classKey] : undefined;
                const levelOneFeatures = levelEntries?.find((e) => e.level === 1)?.features ?? [];
                const classInfo = Object.entries(classInfoMap).find(([key]) => key.toLowerCase() === className.toLowerCase())?.[1] ?? null;
                const classDetail = Object.entries(classDetailFallbacks).find(([key]) => key.toLowerCase() === className.toLowerCase())?.[1] ?? null;
                this.openDetailDrawer({
                    title: className,
                    subtitle: `Level ${char.level} ${className}`,
                    description: classDetail?.tagline ?? classInfo?.summary ?? `${className} is a class with distinct combat, exploration, and progression tools.`,
                    lineItems: [
                        ...(classDetail?.coreTraits?.slice(0, 4).map((item) => ({ value: item.value, label: item.label })) ?? []),
                        ...(classInfo ? [{ value: classInfo.source, label: 'Source' }] : [])
                    ],
                    secondaryHeading: 'Class profile',
                    bullets: [
                        ...(classInfo?.highlights ?? []),
                        ...(classDetail?.levelOneGains?.slice(0, 3) ?? []),
                        ...(classDetail?.featureNotes?.slice(0, 3).map((note) => `${note.title}: ${note.summary}`) ?? []),
                        ...levelOneFeatures.slice(0, 3).map((feature) => `${feature.name}: ${feature.description ?? 'Signature class feature.'}`)
                    ]
                });
                break;
            }
            case 'Alignment': {
                const normalized = this.formatAlignmentValue(value);
                const detail = this.alignmentDetails[normalized];
                this.openDetailDrawer({
                    title: normalized,
                    subtitle: 'Alignment',
                    description: detail?.description ?? 'An ethical and moral outlook that guides how this character thinks and acts in the world.',
                    bullets: detail?.bullets ?? [
                        'Alignment reflects how a character tends to approach duty, freedom, mercy, selfishness, and restraint.',
                        'It is a roleplay tool rather than a prison, and can shift as the character changes.',
                        'Consistent behavior gives the alignment meaning at the table.'
                    ]
                });
                break;
            }
            case 'Lifestyle': {
                const key = value.trim().toLowerCase();
                const detail = this.lifestyleDetails[key];
                const cost = this.lifestyleCosts[key];
                this.openDetailDrawer({
                    title: value,
                    subtitle: 'Lifestyle Expense',
                    description: detail?.description ?? "A chosen lifestyle that determines your character's living standards between adventures.",
                    lineItems: cost
                        ? [
                            { value: cost.perDay, label: 'Typical cost per day' },
                            { value: cost.perMonth, label: 'Typical cost per 30 days' }
                        ]
                        : undefined,
                    bullets: detail?.bullets ?? [
                        'Lifestyle affects lodging, meals, comfort, and how respectable your day-to-day living appears.',
                        'It can change how NPCs perceive your means, manners, and social standing.',
                        'Many campaigns track lifestyle during downtime or long urban stays.'
                    ]
                });
                break;
            }
            case 'Faith': {
                const normalizedFaith = value.trim().toLowerCase();
                const detail = this.deityFaithDetails[normalizedFaith];
                this.openDetailDrawer({
                    title: value,
                    subtitle: 'Faith',
                    description: value && value !== 'Not recorded'
                        ? detail?.description ?? 'This reflects the deity, philosophy, or spiritual path that influences your character\'s worldview and behavior.'
                        : 'No faith or spiritual tradition has been recorded for this character yet.',
                    lineItems: detail?.lineItems,
                    secondaryHeading: detail ? 'Faith and worship' : undefined,
                    bullets: detail?.bullets ?? [
                        'Faith can shape ideals, rituals, oaths, and roleplay choices.',
                        'It may affect relationships with temples, priests, cults, and divine factions.',
                        'Some campaigns also tie faith into downtime, omens, or divine favor.'
                    ]
                });
                break;
            }
            case 'Experience': {
                const currentXp = typeof char.experiencePoints === 'number' ? Math.max(0, Math.trunc(char.experiencePoints)) : null;
                const nextThreshold = currentXp != null ? this.xpThresholds.find(([, xp]) => xp > currentXp) : null;
                const bullets: string[] = [];
                if (currentXp != null && nextThreshold) {
                    const [nextLevel, nextXp] = nextThreshold;
                    const needed = nextXp - currentXp;
                    bullets.push(`${needed.toLocaleString()} XP needed to reach level ${nextLevel}.`);
                    bullets.push(`Next milestone: ${nextXp.toLocaleString()} XP.`);
                } else if (currentXp != null) {
                    bullets.push('You have reached the maximum level — no further XP thresholds apply.');
                }
                bullets.push('XP is typically awarded at the end of an encounter or session by your DM.');
                this.openDetailDrawer({
                    title: 'Experience Points',
                    subtitle: currentXp != null ? `${currentXp.toLocaleString()} XP` : 'Not recorded',
                    description: "Experience points track your character's growth and advancement toward the next level.",
                    bullets
                });
                break;
            }
            case 'Gender':
            case 'Hair':
            case 'Eyes':
            case 'Skin': {
                this.openDetailDrawer({
                    title: `${label}: ${value}`,
                    subtitle: 'Appearance',
                    description: `This appearance detail helps define how the character is perceived at a glance and supports more consistent roleplay and scene description.`,
                    bullets: [
                        'Use appearance details to anchor introductions, disguises, portraits, and witness descriptions.',
                        'These traits can help make recurring NPC interactions and party roleplay feel more grounded.',
                        'Update them as scars, aging, magical changes, or travel wear alter the character over time.'
                    ]
                });
                break;
            }
            case 'Age': {
                this.openDetailDrawer(this.describeSpeciesAge(char.race, value));
                break;
            }
            case 'Height': {
                this.openDetailDrawer(this.describeSpeciesHeight(char.race, value));
                break;
            }
            case 'Weight': {
                this.openDetailDrawer(this.describeSpeciesWeight(char.race, value));
                break;
            }
            default:
                break;
        }
    }

    setSpellFilter(filter: SpellFilter): void {
        this.activeSpellFilter.set(filter);
    }

    openSpellManagerPopup(): void {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.spellManagerTab.set('prepared');
        this.spellManagerSearch.set('');
        this.spellManagerLevelFilter.set('all');
        this.spellManagerExpandedSpellName.set('');
        this.spellManagerOpen.set(true);
        void this.sanitizePreparedSpellsForCurrentClass();
    }

    closeSpellManagerPopup(): void {
        this.spellManagerOpen.set(false);
        this.spellManagerExpandedSpellName.set('');
    }

    onSpellManagerSearchChanged(value: string): void {
        this.spellManagerSearch.set(value);
        this.spellManagerExpandedSpellName.set('');
    }

    setSpellManagerTab(tab: SpellManagerTab): void {
        this.spellManagerTab.set(tab);
        this.spellManagerExpandedSpellName.set('');
    }

    setSpellManagerLevelFilter(filter: 'all' | `${number}`): void {
        this.spellManagerLevelFilter.set(filter);
        this.spellManagerExpandedSpellName.set('');
    }

    getSpellManagerSpellDetail(spellName: string) {
        return spellDetailsMap[spellName] ?? null;
    }

    isSpellManagerSpellExpanded(spellName: string): boolean {
        return this.spellManagerExpandedSpellName() === spellName;
    }

    toggleSpellManagerSpellDetail(spellName: string): void {
        this.spellManagerExpandedSpellName.update((current) => current === spellName ? '' : spellName);
    }

    isSpellKnown(spellName: string): boolean {
        return this.spellManagerKnownNames().has(spellName);
    }

    isSpellPrepared(spellName: string): boolean {
        return this.spellManagerPreparedNames().has(spellName);
    }

    isSpellInSpellbook(spellName: string): boolean {
        return this.spellManagerSpellbookNames().has(spellName);
    }

    isSpellPermanentlyPrepared(spellName: string): boolean {
        const char = this.character();
        if (!char || char.className !== 'Wizard') {
            return false;
        }

        return this.isSpellInSpellbook(spellName) && this.getSpellLevelForDetails(char.className, spellName) === 0;
    }

    canPrepareSpell(spellName: string): boolean {
        const char = this.character();
        if (!char) {
            return false;
        }

        const level = this.getSpellLevelForDetails(char.className, spellName);
        return level > 0;
    }

    isPrepareToggleDisabled(spellName: string): boolean {
        if (!this.canPrepareSpell(spellName)) {
            return true;
        }

        const isPrepared = this.isSpellPrepared(spellName);
        if (isPrepared) {
            return false;
        }

        return this.spellManagerPreparedLimitReached();
    }

    spellLevelLabel(level: number): string {
        return level === 0 ? 'Cantrip' : `Level ${level}`;
    }

    async toggleKnownSpell(spellName: string): Promise<void> {
        await this.persistSpellSelections((state, className) => {
            const nextKnown = this.toggleNameInList(state.classKnownSpellsByClass?.[className], spellName, className);

            const nextPrepared = this.getPreparedLeveledSpellNames(this.removeNameWhenMissing(
                state.classPreparedSpells?.[className],
                spellName,
                nextKnown.includes(spellName),
                className
            ), className);

            const nextSpellbook = this.removeNameWhenMissing(
                state.wizardSpellbookByClass?.[className],
                spellName,
                nextKnown.includes(spellName),
                className
            );

            return {
                ...state,
                classKnownSpellsByClass: {
                    ...(state.classKnownSpellsByClass ?? {}),
                    [className]: nextKnown
                },
                classPreparedSpells: {
                    ...(state.classPreparedSpells ?? {}),
                    [className]: nextPrepared
                },
                wizardSpellbookByClass: {
                    ...(state.wizardSpellbookByClass ?? {}),
                    [className]: nextSpellbook
                }
            };
        });
    }

    async toggleSpellbookSpell(spellName: string): Promise<void> {
        const char = this.character();
        if (!char || char.className !== 'Wizard') {
            return;
        }

        if (this.isSpellPermanentlyPrepared(spellName)) {
            return;
        }

        await this.persistSpellSelections((state, className) => {
            const nextSpellbook = this.toggleNameInList(state.wizardSpellbookByClass?.[className], spellName, className);
            const hasSpell = nextSpellbook.includes(spellName);
            const nextPrepared = this.getPreparedLeveledSpellNames(this.removeNameWhenMissing(state.classPreparedSpells?.[className], spellName, hasSpell, className), className);
            const nextKnown = this.removeNameWhenMissing(state.classKnownSpellsByClass?.[className], spellName, hasSpell, className);

            return {
                ...state,
                wizardSpellbookByClass: {
                    ...(state.wizardSpellbookByClass ?? {}),
                    [className]: nextSpellbook
                },
                classPreparedSpells: {
                    ...(state.classPreparedSpells ?? {}),
                    [className]: nextPrepared
                },
                classKnownSpellsByClass: {
                    ...(state.classKnownSpellsByClass ?? {}),
                    [className]: nextKnown
                }
            };
        });
    }

    async togglePreparedSpell(spellName: string): Promise<void> {
        const char = this.character();
        if (!char || !this.canPrepareSpell(spellName)) {
            return;
        }

        await this.persistSpellSelections((state, className) => {
            const nextPrepared = this.getPreparedLeveledSpellNames(this.toggleNameInList(state.classPreparedSpells?.[className], spellName, className), className);

            let nextKnown = [...(state.classKnownSpellsByClass?.[className] ?? [])];
            let nextSpellbook = [...(state.wizardSpellbookByClass?.[className] ?? [])];

            if (nextPrepared.includes(spellName)) {
                if (!nextKnown.includes(spellName)) {
                    nextKnown = this.sortSpellNamesForClass([...nextKnown, spellName], className);
                }

                if (className === 'Wizard' && !nextSpellbook.includes(spellName)) {
                    nextSpellbook = this.sortSpellNamesForClass([...nextSpellbook, spellName], className);
                }
            }

            return {
                ...state,
                classPreparedSpells: {
                    ...(state.classPreparedSpells ?? {}),
                    [className]: nextPrepared
                },
                classKnownSpellsByClass: {
                    ...(state.classKnownSpellsByClass ?? {}),
                    [className]: nextKnown
                },
                wizardSpellbookByClass: {
                    ...(state.wizardSpellbookByClass ?? {}),
                    [className]: nextSpellbook
                }
            };
        });
    }

    private async sanitizePreparedSpellsForCurrentClass(): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const currentPrepared = this.persistedBuilderState()?.classPreparedSpells?.[char.className] ?? [];
        const normalized = this.getPreparedLeveledSpellNames(currentPrepared, char.className);
        if (this.areStringArraysEqual(currentPrepared, normalized)) {
            return;
        }

        await this.persistSpellSelections((state, className) => ({
            ...state,
            classPreparedSpells: {
                ...(state.classPreparedSpells ?? {}),
                [className]: this.getPreparedLeveledSpellNames(state.classPreparedSpells?.[className], className)
            }
        }));
    }

    private async persistInventoryEntries(entries: PersistedInventoryEntry[]): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const normalizedEntries = this.expandIndependentContainers(entries.map((entry) => this.normalizeInventoryEntry(entry)));
        const updatedState: PersistedBuilderState = {
            ...currentState,
            inventoryEntries: normalizedEntries
        };
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });

        this.cdr.detectChanges();
    }

    private resetInventoryDraft(): void {
        this.inventoryDraftName.set('');
        this.inventoryDraftCategory.set('Adventuring Gear');
        this.inventoryDraftQuantity.set('1');
        this.inventoryDraftWeight.set('');
        this.inventoryDraftCostGp.set('');
        this.inventoryDraftNotes.set('');
    }

    onSpellSearchChanged(value: string): void {
        this.spellSearchTerm.set(value);
    }

    showsSpellLevel(level: number): boolean {
        const filter = this.activeSpellFilter();
        if (filter === 'all') {
            return true;
        }

        return filter === String(level);
    }

    setActionFilter(filter: ActionFilter): void {
        this.activeActionFilter.set(filter);
    }

    setBackgroundFilter(filter: BackgroundFilter): void {
        this.activeBackgroundFilter.set(filter);
    }

    toggleAppearanceMeasurementSystem(): void {
        this.appearanceMeasurementSystem.update((current) => current === 'imperial' ? 'metric' : 'imperial');
    }

    setInventoryFilter(filter: InventoryFilter): void {
        this.activeInventoryFilter.set(filter);
    }

    onInventorySearchChanged(value: string): void {
        this.inventorySearchTerm.set(value);
    }

    openInventoryManagerPopup(): void {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        this.requestCloseChat();
        this.inventoryManagerOpening.set(true);
        this.cdr.detectChanges();

        setTimeout(() => {
            this.activeDetailDrawer.set(null);
            this.hpManagerOpen.set(false);
            this.coinManagerOpen.set(false);
            this.spellManagerOpen.set(false);
            this.extrasManagerOpen.set(false);
            this.inventoryManagerSearch.set('');
            this.inventoryCurrentExpanded.set(true);
            this.inventoryManagerExpandedSections.set(new Set());
            this.inventoryCatalogExpanded.set(true);
            this.inventoryManagerContainedExpandedItem.set('');
            this.inventoryManagerMoveTargets.set({});
            this.inventoryDraftAddTarget.set('equipment');
            this.inventoryCatalogCategory.set('All');
            this.resetInventoryDraft();
            this.inventoryManagerOpening.set(false);
            this.inventoryManagerOpen.set(true);
        }, 0);
    }

    closeInventoryManagerPopup(): void {
        this.inventoryManagerOpen.set(false);
    }

    onInventoryManagerSearchChanged(value: string): void {
        this.inventoryManagerSearch.set(value);
    }

    setInventoryCatalogCategory(category: string): void {
        this.inventoryCatalogCategory.set(category);
    }

    toggleInventoryCatalogItemDetail(name: string): void {
        this.inventoryCatalogExpandedItem.set(this.inventoryCatalogExpandedItem() === name ? '' : name);
    }

    inventoryContainedItemKey(containerIndex: number, copyIndex: number, itemIndex: number): string {
        return `container_${containerIndex}_${copyIndex}_${itemIndex}`;
    }

    toggleInventoryManagerContainedItemDetail(key: string): void {
        this.inventoryManagerContainedExpandedItem.set(this.inventoryManagerContainedExpandedItem() === key ? '' : key);
    }

    inventoryMoveOptions(currentContainerIndex: number | null): DropdownOption[] {
        return this.inventoryContainerTargetOptions(currentContainerIndex);
    }

    inventoryAddOptions(): DropdownOption[] {
        return this.inventoryContainerTargetOptions(null);
    }

    private inventoryContainerTargetOptions(currentContainerIndex: number | null): DropdownOption[] {
        const options: DropdownOption[] = [
            { label: 'Equipment', value: 'equipment' }
        ];

        for (const bucket of this.inventoryManagerContainerBuckets()) {
            options.push({
                label: this.containerBucketDisplayName(bucket),
                value: `container:${bucket.sourceIndex}`
            });
        }

        return options;
    }

    setInventoryDraftAddTarget(value: string | number): void {
        this.inventoryDraftAddTarget.set(String(value || 'equipment'));
    }

    async onInventoryCatalogAddTargetChanged(item: (typeof equipmentCatalog)[number], value: string | number): Promise<void> {
        const target = String(value || 'equipment');
        await this.addInventoryCatalogItem(item, target);
    }

    inventoryDefaultMoveTarget(currentContainerIndex: number | null): string {
        return currentContainerIndex == null ? 'equipment' : `container:${currentContainerIndex}`;
    }

    inventoryMoveTarget(itemKey: string, currentContainerIndex: number | null): string {
        return this.inventoryManagerMoveTargets()[itemKey] ?? this.inventoryDefaultMoveTarget(currentContainerIndex);
    }

    setInventoryMoveTarget(itemKey: string, value: string | number): void {
        const nextValue = String(value || '');
        this.inventoryManagerMoveTargets.update((current) => ({
            ...current,
            [itemKey]: nextValue
        }));
    }

    async onInventoryMoveTargetChanged(index: number, itemKey: string, value: string | number): Promise<void> {
        const nextValue = String(value || '');
        const defaultTarget = this.inventoryDefaultMoveTarget(null);

        if (!nextValue || nextValue === defaultTarget) {
            this.setInventoryMoveTarget(itemKey, '');
            return;
        }

        this.setInventoryMoveTarget(itemKey, nextValue);
        await this.moveInventoryEntry(index, nextValue);
        this.setInventoryMoveTarget(itemKey, '');
    }

    async onContainedInventoryMoveTargetChanged(containerIndex: number, containedIndex: number, itemKey: string, value: string | number): Promise<void> {
        const nextValue = String(value || '');
        const defaultTarget = this.inventoryDefaultMoveTarget(containerIndex);

        if (!nextValue || nextValue === defaultTarget) {
            this.setInventoryMoveTarget(itemKey, '');
            return;
        }

        this.setInventoryMoveTarget(itemKey, nextValue);
        await this.moveContainedInventoryEntry(containerIndex, containedIndex, nextValue);
        this.setInventoryMoveTarget(itemKey, '');
    }

    async moveInventoryEntryToTarget(index: number, itemKey: string): Promise<void> {
        const target = this.inventoryMoveTarget(itemKey, null);
        if (!target) {
            return;
        }

        await this.moveInventoryEntry(index, target);
        this.setInventoryMoveTarget(itemKey, '');
    }

    async moveContainedInventoryEntryToTarget(containerIndex: number, containedIndex: number, itemKey: string): Promise<void> {
        const target = this.inventoryMoveTarget(itemKey, containerIndex);
        if (!target) {
            return;
        }

        await this.moveContainedInventoryEntry(containerIndex, containedIndex, target);
        this.setInventoryMoveTarget(itemKey, '');
    }

    inventoryContainedSummaryText(item: PersistedInventoryEntry): string {
        const catalogItem = this.catalogLookup.get(item.name.trim().toLowerCase());
        return catalogItem?.summary?.trim() || item.notes?.trim() || catalogItem?.notes?.trim() || 'No additional notes are available for this item yet.';
    }

    inventoryContainedRulesText(item: PersistedInventoryEntry): string | null {
        const catalogItem = this.catalogLookup.get(item.name.trim().toLowerCase());
        const summaryText = this.inventoryContainedSummaryText(item);
        return this.inventoryItemRulesText(item, summaryText, catalogItem?.notes?.trim());
    }

    inventoryContainedHighlights(item: PersistedInventoryEntry): string[] {
        const catalogItem = this.catalogLookup.get(item.name.trim().toLowerCase());
        const summaryText = this.inventoryContainedSummaryText(item);
        return this.inventoryItemHighlights(catalogItem?.detailLines, summaryText, catalogItem?.sourceLabel, catalogItem?.rarity, catalogItem?.attunement);
    }

    inventoryContainedRarity(item: PersistedInventoryEntry): string | undefined {
        return this.catalogLookup.get(item.name.trim().toLowerCase())?.rarity?.trim() || undefined;
    }

    inventoryContainedAttunement(item: PersistedInventoryEntry): string | undefined {
        return this.catalogLookup.get(item.name.trim().toLowerCase())?.attunement?.trim() || undefined;
    }

    inventoryContainedSourceUrl(item: PersistedInventoryEntry): string | undefined {
        return this.catalogLookup.get(item.name.trim().toLowerCase())?.sourceUrl?.trim() || undefined;
    }

    inventoryContainedSourceLabel(item: PersistedInventoryEntry): string | undefined {
        return this.catalogLookup.get(item.name.trim().toLowerCase())?.sourceLabel?.trim() || undefined;
    }

    toggleInventoryManagerSection(sectionKey: string): void {
        this.inventoryManagerExpandedSections.update((expanded) => {
            const next = new Set(expanded);
            if (next.has(sectionKey)) {
                next.delete(sectionKey);
            } else {
                next.add(sectionKey);
            }
            return next;
        });
    }

    isInventoryManagerSectionExpanded(sectionKey: string): boolean {
        return this.inventoryManagerExpandedSections().has(sectionKey);
    }

    inventoryManagerContainerItemCount(row: { entry: PersistedInventoryEntry }): number {
        return (row.entry.containedItems ?? []).reduce((sum, item) => sum + Math.max(1, item.quantity || 1), 0);
    }

    inventoryManagerContainerWeight(row: { entry: PersistedInventoryEntry }): string {
        const totalWeight = this.getInventoryEntryWeight(row.entry);
        return totalWeight > 0
            ? `${Number.isInteger(totalWeight) ? totalWeight : totalWeight.toFixed(1)} lb.`
            : '0 lb.';
    }

    inventoryCatalogSummaryText(item: (typeof equipmentCatalog)[number]): string {
        return item.summary?.trim() || item.notes?.trim() || 'No additional notes are available for this item yet.';
    }

    inventoryCatalogRulesText(item: (typeof equipmentCatalog)[number]): string | null {
        const notes = item.notes?.trim();
        if (!notes) {
            return null;
        }

        const summary = item.summary?.trim();
        if (!summary) {
            return null;
        }

        return this.normalizeInventoryDetailText(notes) === this.normalizeInventoryDetailText(summary) ? null : notes;
    }

    private normalizeInventoryDetailText(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[.,;:!?]+/g, '')
            .replace(/\s+/g, ' ');
    }

    onInventoryDraftInputChanged(field: InventoryDraftField, value: string): void {
        switch (field) {
            case 'name':
                this.inventoryDraftName.set(value);
                return;
            case 'category':
                this.inventoryDraftCategory.set(value);
                return;
            case 'quantity':
                this.inventoryDraftQuantity.set(value);
                return;
            case 'weight':
                this.inventoryDraftWeight.set(value);
                return;
            case 'costGp':
                this.inventoryDraftCostGp.set(value);
                return;
            case 'notes':
                this.inventoryDraftNotes.set(value);
                return;
        }
    }

    async addInventoryEntryFromDraft(): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const name = this.inventoryDraftName().trim();
        if (!name) {
            return;
        }

        const category = this.inventoryDraftCategory().trim() || 'Adventuring Gear';
        const quantity = Math.max(1, this.parseInteger(this.inventoryDraftQuantity()));
        const weight = this.parseOptionalNumber(this.inventoryDraftWeight());
        const costGp = this.parseOptionalNumber(this.inventoryDraftCostGp());
        const notes = this.inventoryDraftNotes().trim();
        const isContainer = this.isContainerItemName(name);

        const entry: PersistedInventoryEntry = this.normalizeInventoryEntry({
            name,
            category,
            quantity,
            weight: weight ?? undefined,
            costGp: costGp ?? undefined,
            notes: notes || undefined,
            isContainer,
            containedItems: [],
            maxCapacity: isContainer ? this.getContainerCapacity(name) : undefined
        });

        const target = this.inventoryDraftAddTarget();
        await this.persistInventoryEntries(this.addInventoryEntryToTarget(this.normalizedInventoryEntries(), entry, target));

        this.resetInventoryDraft();
        this.inventoryDraftAddTarget.set('equipment');
    }

    async addInventoryCatalogItem(item: (typeof equipmentCatalog)[number], target = 'equipment'): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const name = item.name.trim();
        if (!name) {
            return;
        }

        const isContainer = this.isContainerItemName(name);
        const entry: PersistedInventoryEntry = this.normalizeInventoryEntry({
            name,
            category: item.category,
            quantity: 1,
            weight: typeof item.weight === 'number' ? item.weight : undefined,
            costGp: typeof item.costGp === 'number' ? item.costGp : undefined,
            notes: item.notes?.trim() || item.summary?.trim() || undefined,
            isContainer,
            containedItems: [],
            maxCapacity: isContainer ? this.getContainerCapacity(name) : undefined
        });

        await this.persistInventoryEntries(this.addInventoryEntryToTarget(this.normalizedInventoryEntries(), entry, target));
    }

    private addInventoryEntryToTarget(entries: PersistedInventoryEntry[], entry: PersistedInventoryEntry, target: string): PersistedInventoryEntry[] {
        const destination = this.parseInventoryMoveTarget(target);
        if (!destination || destination.kind === 'equipment') {
            return [...entries, entry];
        }

        const destinationIndex = destination.containerIndex;
        if (destinationIndex < 0 || destinationIndex >= entries.length) {
            return [...entries, entry];
        }

        return entries.map((currentEntry, currentIndex) => {
            if (currentIndex !== destinationIndex) {
                return currentEntry;
            }

            return {
                ...currentEntry,
                isContainer: true,
                containedItems: this.mergeDuplicateContainedItems([
                    ...(currentEntry.containedItems ?? []),
                    entry
                ]),
                maxCapacity: currentEntry.maxCapacity ?? this.getContainerCapacity(currentEntry.name)
            };
        });
    }

    async removeInventoryEntryByIndex(index: number): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const current = this.normalizedInventoryEntries();
        if (index < 0 || index >= current.length) {
            return;
        }

        await this.persistInventoryEntries(current.filter((_, currentIndex) => currentIndex !== index));
    }

    async adjustInventoryEntryQuantity(index: number, delta: number): Promise<void> {
        const current = this.normalizedInventoryEntries();
        if (index < 0 || index >= current.length) {
            return;
        }

        const currentQuantity = Math.max(1, Math.trunc(Number(current[index].quantity) || 1));
        const nextQuantity = Math.max(1, currentQuantity + Math.trunc(delta || 0));
        if (nextQuantity === currentQuantity) {
            return;
        }

        await this.persistInventoryEntries(
            current.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: nextQuantity } : entry)
        );
    }

    async setInventoryEntryQuantity(index: number, value: string): Promise<void> {
        const current = this.normalizedInventoryEntries();
        if (index < 0 || index >= current.length) {
            return;
        }

        const currentQuantity = Math.max(1, Math.trunc(Number(current[index].quantity) || 1));
        const nextQuantity = Math.max(1, Math.trunc(Number(value) || 1));
        if (nextQuantity === currentQuantity) {
            return;
        }

        await this.persistInventoryEntries(
            current.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: nextQuantity } : entry)
        );
    }

    private async moveInventoryEntry(index: number, target: string): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const destination = this.parseInventoryMoveTarget(target);
        if (!destination || destination.kind === 'equipment') {
            return;
        }

        const current = this.normalizedInventoryEntries();
        if (index < 0 || index >= current.length) {
            return;
        }

        const sourceItem = this.normalizeInventoryEntry(current[index]);
        const destinationIndex = destination.containerIndex;
        if (destinationIndex < 0 || destinationIndex >= current.length || destinationIndex === index) {
            return;
        }

        const entriesWithoutSource = current.filter((_, currentIndex) => currentIndex !== index);
        const adjustedDestinationIndex = destinationIndex > index ? destinationIndex - 1 : destinationIndex;
        if (adjustedDestinationIndex < 0 || adjustedDestinationIndex >= entriesWithoutSource.length) {
            return;
        }

        const updatedEntries = entriesWithoutSource.map((entry, entryIndex) => {
            if (entryIndex !== adjustedDestinationIndex) {
                return entry;
            }

            const nextContained = this.mergeDuplicateContainedItems([
                ...(entry.containedItems ?? []),
                sourceItem
            ]);

            return {
                ...entry,
                isContainer: true,
                containedItems: nextContained,
                maxCapacity: entry.maxCapacity ?? this.getContainerCapacity(entry.name)
            };
        });

        await this.persistInventoryEntries(updatedEntries);
    }

    async removeContainedInventoryEntry(containerIndex: number, containedIndex: number): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const current = this.normalizedInventoryEntries();
        if (containerIndex < 0 || containerIndex >= current.length) {
            return;
        }

        const container = current[containerIndex];
        const containedItems = container.containedItems ?? [];
        if (containedIndex < 0 || containedIndex >= containedItems.length) {
            return;
        }

        const updatedEntries = current.map((entry, entryIndex) => {
            if (entryIndex !== containerIndex) {
                return entry;
            }

            return {
                ...entry,
                containedItems: containedItems.filter((_, itemIndex) => itemIndex !== containedIndex)
            };
        });

        await this.persistInventoryEntries(updatedEntries);
    }

    async adjustContainedInventoryEntryQuantity(containerIndex: number, containedIndex: number, delta: number): Promise<void> {
        const current = this.normalizedInventoryEntries();
        if (containerIndex < 0 || containerIndex >= current.length) {
            return;
        }

        const container = current[containerIndex];
        const containedItems = container.containedItems ?? [];
        if (containedIndex < 0 || containedIndex >= containedItems.length) {
            return;
        }

        const currentQuantity = Math.max(1, Math.trunc(Number(containedItems[containedIndex].quantity) || 1));
        const nextQuantity = Math.max(1, currentQuantity + Math.trunc(delta || 0));
        if (nextQuantity === currentQuantity) {
            return;
        }

        const updatedEntries = current.map((entry, entryIndex) => {
            if (entryIndex !== containerIndex) {
                return entry;
            }

            return {
                ...entry,
                containedItems: containedItems.map((item, itemIndex) => itemIndex === containedIndex ? { ...item, quantity: nextQuantity } : item)
            };
        });

        await this.persistInventoryEntries(updatedEntries);
    }

    async setContainedInventoryEntryQuantity(containerIndex: number, containedIndex: number, value: string): Promise<void> {
        const current = this.normalizedInventoryEntries();
        if (containerIndex < 0 || containerIndex >= current.length) {
            return;
        }

        const container = current[containerIndex];
        const containedItems = container.containedItems ?? [];
        if (containedIndex < 0 || containedIndex >= containedItems.length) {
            return;
        }

        const currentQuantity = Math.max(1, Math.trunc(Number(containedItems[containedIndex].quantity) || 1));
        const nextQuantity = Math.max(1, Math.trunc(Number(value) || 1));
        if (nextQuantity === currentQuantity) {
            return;
        }

        const updatedEntries = current.map((entry, entryIndex) => {
            if (entryIndex !== containerIndex) {
                return entry;
            }

            return {
                ...entry,
                containedItems: containedItems.map((item, itemIndex) => itemIndex === containedIndex ? { ...item, quantity: nextQuantity } : item)
            };
        });

        await this.persistInventoryEntries(updatedEntries);
    }

    private async moveContainedInventoryEntry(containerIndex: number, containedIndex: number, target: string): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const destination = this.parseInventoryMoveTarget(target);
        if (!destination) {
            return;
        }

        const current = this.normalizedInventoryEntries();
        if (containerIndex < 0 || containerIndex >= current.length) {
            return;
        }

        const sourceContainer = current[containerIndex];
        const sourceContainedItems = sourceContainer.containedItems ?? [];
        if (containedIndex < 0 || containedIndex >= sourceContainedItems.length) {
            return;
        }

        const movedItem = this.normalizeInventoryEntry(sourceContainedItems[containedIndex]);

        if (destination.kind === 'container' && destination.containerIndex === containerIndex) {
            return;
        }

        const entriesWithoutContained = current.map((entry, entryIndex) => {
            if (entryIndex !== containerIndex) {
                return entry;
            }

            return {
                ...entry,
                containedItems: sourceContainedItems.filter((_, itemIndex) => itemIndex !== containedIndex)
            };
        });

        if (destination.kind === 'equipment') {
            await this.persistInventoryEntries(this.addToEquipmentEntries(entriesWithoutContained, movedItem));
            return;
        }

        const destinationIndex = destination.containerIndex;
        if (destinationIndex < 0 || destinationIndex >= entriesWithoutContained.length) {
            return;
        }

        const updatedEntries = entriesWithoutContained.map((entry, entryIndex) => {
            if (entryIndex !== destinationIndex) {
                return entry;
            }

            const nextContained = this.mergeDuplicateContainedItems([
                ...(entry.containedItems ?? []),
                movedItem
            ]);

            return {
                ...entry,
                isContainer: true,
                containedItems: nextContained,
                maxCapacity: entry.maxCapacity ?? this.getContainerCapacity(entry.name)
            };
        });

        await this.persistInventoryEntries(updatedEntries);
    }

    private parseInventoryMoveTarget(value: string): { kind: 'equipment' } | { kind: 'container'; containerIndex: number } | null {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        if (trimmed === 'equipment') {
            return { kind: 'equipment' };
        }

        if (!trimmed.startsWith('container:')) {
            return null;
        }

        const containerIndex = Number(trimmed.slice('container:'.length));
        if (!Number.isInteger(containerIndex) || containerIndex < 0) {
            return null;
        }

        return { kind: 'container', containerIndex };
    }

    private addToEquipmentEntries(entries: PersistedInventoryEntry[], item: PersistedInventoryEntry): PersistedInventoryEntry[] {
        const existingIndex = entries.findIndex((entry) =>
            !entry.isContainer && this.hasSameInventoryIdentity(entry, item)
        );

        if (existingIndex < 0) {
            return [...entries, item];
        }

        return entries.map((entry, entryIndex) => {
            if (entryIndex !== existingIndex) {
                return entry;
            }

            const mergedChildren = this.mergeDuplicateContainedItems([
                ...(entry.containedItems ?? []),
                ...(item.containedItems ?? [])
            ]);

            return {
                ...entry,
                quantity: entry.quantity + item.quantity,
                weight: entry.weight ?? item.weight,
                costGp: entry.costGp ?? item.costGp,
                notes: entry.notes ?? item.notes,
                containedItems: mergedChildren,
                isContainer: entry.isContainer || item.isContainer || mergedChildren.length > 0,
                maxCapacity: entry.maxCapacity ?? item.maxCapacity
            };
        });
    }

    private hasSameInventoryIdentity(left: PersistedInventoryEntry, right: PersistedInventoryEntry): boolean {
        return left.name.trim().toLowerCase() === right.name.trim().toLowerCase()
            && left.category.trim().toLowerCase() === right.category.trim().toLowerCase();
    }

    openCurrencyManager(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.hpManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.coinAdjustInput.set(this.createEmptyCurrencyState());
        this.partyCoinAdjustInput.set(this.createEmptyCurrencyState());
        this.coinLifestyleExpanded.set(false);
        this.partyCurrencyExpanded.set(false);
        this.partyCurrencySaveError.set('');
        const persistedLifestyle = this.persistedBuilderState()?.lifestyleExpense ?? 'modest';
        this.selectedLifestyleExpense.set(this.normalizeLifestyleExpense(persistedLifestyle));
        this.coinManagerOpen.set(true);
    }

    closeCurrencyManager(): void {
        this.coinManagerOpen.set(false);
    }

    onCoinAdjustInputChanged(currencyKey: keyof PersistedCurrencyState, value: string): void {
        const sanitizedValue = this.parseNonNegativeInteger(value);
        this.coinAdjustInput.update((current) => ({
            ...current,
            [currencyKey]: sanitizedValue
        }));
    }

    onPartyCoinAdjustInputChanged(currencyKey: keyof PersistedCurrencyState, value: string): void {
        const sanitizedValue = this.parseNonNegativeInteger(value);
        this.partyCoinAdjustInput.update((current) => ({
            ...current,
            [currencyKey]: sanitizedValue
        }));
    }

    toggleLifestyleExpenseDetails(): void {
        this.coinLifestyleExpanded.update((expanded) => !expanded);
    }

    togglePartyCurrencyDetails(): void {
        this.partyCurrencyExpanded.update((expanded) => !expanded);
    }

    async onLifestyleExpenseChanged(value: string | number): Promise<void> {
        const normalized = this.normalizeLifestyleExpense(String(value));
        this.selectedLifestyleExpense.set(normalized);
        await this.persistCurrencyState(this.inventory()?.currency ?? this.createEmptyCurrencyState(), normalized);
    }

    async applyCoinAdjustment(mode: 'add' | 'remove' | 'clear'): Promise<void> {
        if (mode === 'clear') {
            this.coinAdjustInput.set(this.createEmptyCurrencyState());
            return;
        }

        const currentCurrency = this.inventory()?.currency ?? this.createEmptyCurrencyState();
        const adjustment = this.coinAdjustInput();
        const nextCurrency: PersistedCurrencyState = {
            pp: mode === 'add' ? currentCurrency.pp + adjustment.pp : Math.max(0, currentCurrency.pp - adjustment.pp),
            gp: mode === 'add' ? currentCurrency.gp + adjustment.gp : Math.max(0, currentCurrency.gp - adjustment.gp),
            ep: mode === 'add' ? currentCurrency.ep + adjustment.ep : Math.max(0, currentCurrency.ep - adjustment.ep),
            sp: mode === 'add' ? currentCurrency.sp + adjustment.sp : Math.max(0, currentCurrency.sp - adjustment.sp),
            cp: mode === 'add' ? currentCurrency.cp + adjustment.cp : Math.max(0, currentCurrency.cp - adjustment.cp)
        };

        await this.persistCurrencyState(nextCurrency, this.selectedLifestyleExpense());
        this.coinAdjustInput.set(this.createEmptyCurrencyState());
    }

    async applyPartyCoinAdjustment(mode: 'add' | 'remove' | 'clear'): Promise<void> {
        this.partyCurrencySaveError.set('');

        if (mode === 'clear') {
            this.partyCoinAdjustInput.set(this.createEmptyCurrencyState());
            return;
        }

        const currentCurrency = this.partyCurrency();
        const adjustment = this.partyCoinAdjustInput();
        const nextCurrency: PersistedCurrencyState = {
            pp: mode === 'add' ? currentCurrency.pp + adjustment.pp : Math.max(0, currentCurrency.pp - adjustment.pp),
            gp: mode === 'add' ? currentCurrency.gp + adjustment.gp : Math.max(0, currentCurrency.gp - adjustment.gp),
            ep: mode === 'add' ? currentCurrency.ep + adjustment.ep : Math.max(0, currentCurrency.ep - adjustment.ep),
            sp: mode === 'add' ? currentCurrency.sp + adjustment.sp : Math.max(0, currentCurrency.sp - adjustment.sp),
            cp: mode === 'add' ? currentCurrency.cp + adjustment.cp : Math.max(0, currentCurrency.cp - adjustment.cp)
        };

        const didPersist = await this.persistPartyCurrencyState(nextCurrency);
        if (didPersist) {
            this.partyCoinAdjustInput.set(this.createEmptyCurrencyState());
        }
    }

    toggleContainerExpanded(containerName: string): void {
        this.expandedContainers.update((expanded) => {
            const newSet = new Set(expanded);
            if (newSet.has(containerName)) {
                newSet.delete(containerName);
            } else {
                newSet.add(containerName);
            }
            return newSet;
        });
    }

    isContainerExpanded(containerName: string): boolean {
        return this.expandedContainers().has(containerName);
    }

    setFeaturesFilter(filter: FeaturesFilter): void {
        this.activeFeaturesFilter.set(filter);
    }

    setNotesFilter(filter: NotesFilter): void {
        this.activeNotesFilter.set(filter);
    }

    getUsedSpellSlots(level: number, maxSlots: number): number {
        const current = this.usedSpellSlotsByLevel()[level] ?? 0;
        return Math.min(Math.max(current, 0), Math.max(maxSlots, 0));
    }

    cycleUsedSpellSlots(level: number, maxSlots: number): void {
        if (maxSlots <= 0) {
            return;
        }

        // Initialize spell slots from persisted state if character has changed
        const char = this.character();
        if (char && this.lastCharacterId !== char.id) {
            this.lastCharacterId = char.id;
            const initial = this.initialSpellSlots();
            if (Object.keys(initial).length > 0) {
                this.usedSpellSlotsByLevel.set({ ...initial });
            }
        }

        this.usedSpellSlotsByLevel.update((current) => {
            const used = this.getUsedSpellSlots(level, maxSlots);
            const nextUsed = used >= maxSlots ? 0 : used + 1;
            return {
                ...current,
                [level]: nextUsed
            };
        });

        // Save changes
        this.saveSpellSlotUsage();
    }

    private formatSigned(value: number): string {
        return value >= 0 ? `+${value}` : `${value}`;
    }

    private getPassiveSkillValue(skill: 'perception' | 'investigation' | 'insight'): number {
        const char = this.character();
        if (!char) {
            return 10;
        }

        const abilityKey = this.skillAbilityMap[skill];
        const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
        const profBonus = this.isSkillProficient(skill, char.skills)
            ? char.proficiencyBonus
            : 0;
        return 10 + abilityMod + profBonus;
    }

    private isSkillProficient(skillKey: string, fallbackSkills?: SkillProficiencies): boolean {
        if (this.persistedSkillProficiencies().has(skillKey)) {
            return true;
        }

        return Boolean(fallbackSkills?.[skillKey as keyof SkillProficiencies]);
    }

    private parseSkillTokens(raw: string): string[] {
        const text = raw?.trim();
        if (!text) {
            return [];
        }

        const tokens = text
            .split(/[,;/|]/g)
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);

        const normalized = tokens
            .map((token) => this.skillLabelToKey(token))
            .filter((token): token is string => Boolean(token));

        return [...new Set(normalized)];
    }

    private skillLabelToKey(label: string): string | null {
        const normalized = label.trim().toLowerCase();
        const map: Record<string, string> = {
            'acrobatics': 'acrobatics',
            'animal handling': 'animalHandling',
            'arcana': 'arcana',
            'athletics': 'athletics',
            'deception': 'deception',
            'history': 'history',
            'insight': 'insight',
            'intimidation': 'intimidation',
            'investigation': 'investigation',
            'medicine': 'medicine',
            'nature': 'nature',
            'perception': 'perception',
            'performance': 'performance',
            'persuasion': 'persuasion',
            'sleight of hand': 'sleightOfHand',
            'stealth': 'stealth',
            'survival': 'survival'
        };

        return map[normalized] ?? null;
    }

    private getPersistedAbilityScores(state: PersistedBuilderState | null): {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    } | null {
        if (!state) {
            return null;
        }

        const base = state.abilityBaseScores ?? {};
        const overrides = state.abilityOverrideScores ?? {};
        const bonuses = this.getPersistedAbilityBonuses(state);

        const fromKey = (key: AbilityKey): number | null => {
            const titleKey = this.toTitleCaseAbilityKey(key);
            const baseValue = base[titleKey];
            if (typeof baseValue !== 'number' || !Number.isFinite(baseValue)) {
                return null;
            }

            const override = overrides[titleKey];
            if (typeof override === 'number' && Number.isFinite(override)) {
                return Math.trunc(override);
            }

            return Math.min(20, Math.trunc(baseValue) + (bonuses[key] ?? 0));
        };

        const strength = fromKey('strength');
        const dexterity = fromKey('dexterity');
        const constitution = fromKey('constitution');
        const intelligence = fromKey('intelligence');
        const wisdom = fromKey('wisdom');
        const charisma = fromKey('charisma');

        if (
            strength == null
            || dexterity == null
            || constitution == null
            || intelligence == null
            || wisdom == null
            || charisma == null
        ) {
            return null;
        }

        const scores = {
            strength,
            dexterity,
            constitution,
            intelligence,
            wisdom,
            charisma
        };

        return scores;
    }

    private getPersistedAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const total = this.createEmptyAbilityBonusMap();
        const background = this.getPersistedBackgroundAbilityBonuses(state);
        const classFeatures = this.getPersistedClassFeatureAbilityBonuses(state);

        (Object.keys(total) as AbilityKey[]).forEach((key) => {
            total[key] = (background[key] ?? 0) + (classFeatures[key] ?? 0);
        });

        return total;
    }

    private getPersistedBackgroundAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const mode = state.bgAbilityMode?.trim();

        if (mode === 'Increase three scores (+1 / +1 / +1)') {
            const abilities = this.getBackgroundAbilityPool(state);
            abilities.forEach((ability) => this.addAbilityBonus(bonuses, ability, 1));
            return bonuses;
        }

        if (mode === 'Increase two scores (+2 / +1)' || mode === 'plus-two-plus-one') {
            const allowed = new Set(this.getBackgroundAbilityPool(state));
            const plusTwo = this.parseAbilityKey(state.bgAbilityScoreFor2);
            const plusOne = this.parseAbilityKey(state.bgAbilityScoreFor1);

            if (plusTwo && allowed.has(plusTwo)) {
                this.addAbilityBonus(bonuses, plusTwo, 2);
            }

            if (plusOne && plusOne !== plusTwo && allowed.has(plusOne)) {
                this.addAbilityBonus(bonuses, plusOne, 1);
            }
        }

        return bonuses;
    }

    private getPersistedClassFeatureAbilityBonuses(state: PersistedBuilderState): Record<AbilityKey, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const selections = state.classFeatureSelections ?? {};
        const asiChoices = state.abilityScoreImprovementChoices ?? {};
        const featChoices = state.featFollowUpChoices ?? {};

        Object.entries(selections).forEach(([selectionKey, values]) => {
            values.forEach((selectedValue) => {
                if (!selectedValue) {
                    return;
                }

                if (selectedValue === 'Ability Score Improvement') {
                    const asiChoice = asiChoices[selectionKey];
                    if (!asiChoice) {
                        return;
                    }

                    const primary = this.parseAbilityKey(asiChoice.primaryAbility);
                    const secondary = this.parseAbilityKey(asiChoice.secondaryAbility);

                    if (asiChoice.mode === 'plus-two' && primary) {
                        this.addAbilityBonus(bonuses, primary, 2);
                        return;
                    }

                    if (asiChoice.mode === 'plus-one-plus-one' && primary && secondary && primary !== secondary) {
                        this.addAbilityBonus(bonuses, primary, 1);
                        this.addAbilityBonus(bonuses, secondary, 1);
                    }

                    return;
                }

                const validFeatAbilities = this.getFeatAbilityIncreaseChoicesByFeat(selectedValue);
                if (validFeatAbilities.length === 0) {
                    return;
                }

                const selectedAbility = this.parseAbilityKey(featChoices[selectionKey]?.abilityIncreaseAbility);
                if (selectedAbility && validFeatAbilities.includes(selectedAbility)) {
                    this.addAbilityBonus(bonuses, selectedAbility, 1);
                }
            });
        });

        return bonuses;
    }

    private getBackgroundAbilityPool(state: PersistedBuilderState): AbilityKey[] {
        const backgroundName = state.selectedBackgroundName?.trim();
        const map: Partial<Record<string, AbilityKey[]>> = {
            Acolyte: ['intelligence', 'wisdom', 'charisma'],
            Criminal: ['dexterity', 'constitution', 'intelligence'],
            Spy: ['dexterity', 'constitution', 'intelligence'],
            Noble: ['strength', 'dexterity', 'charisma'],
            Knight: ['strength', 'dexterity', 'charisma'],
            Charlatan: ['dexterity', 'constitution', 'charisma'],
            Entertainer: ['strength', 'dexterity', 'charisma'],
            Gladiator: ['strength', 'dexterity', 'charisma'],
            'Folk Hero': ['strength', 'constitution', 'wisdom'],
            'Guild Artisan': ['dexterity', 'intelligence', 'charisma'],
            'Guild Merchant': ['dexterity', 'intelligence', 'charisma'],
            Hermit: ['constitution', 'intelligence', 'wisdom'],
            Outlander: ['strength', 'dexterity', 'constitution'],
            Sage: ['constitution', 'intelligence', 'wisdom'],
            Sailor: ['strength', 'dexterity', 'wisdom'],
            Pirate: ['strength', 'dexterity', 'wisdom'],
            Soldier: ['strength', 'dexterity', 'constitution'],
            'Mercenary Veteran': ['strength', 'dexterity', 'constitution'],
            Urchin: ['strength', 'dexterity', 'intelligence']
        };

        return map[backgroundName ?? ''] ?? ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    }

    private getFeatAbilityIncreaseChoicesByFeat(featName: string): AbilityKey[] {
        switch (featName) {
            case 'Athlete':
            case 'Charger':
            case 'Dual Wielder':
            case 'Grappler':
            case 'Mage Slayer':
            case 'Sentinel':
            case 'Slasher':
            case 'Weapon Master':
                return ['strength', 'dexterity'];
            case 'Defensive Duelist':
            case 'Skulker':
                return ['dexterity'];
            case 'Elemental Adept':
            case 'Spell Sniper':
            case 'War Caster':
                return ['intelligence', 'wisdom', 'charisma'];
            case 'Great Weapon Master':
            case 'Shield Master':
                return ['strength'];
            case 'Heavy Armor Master':
                return ['strength', 'constitution'];
            case 'Speedy':
                return ['dexterity', 'constitution'];
            case 'Inspiring Leader':
                return ['wisdom', 'charisma'];
            case 'Mounted Combatant':
                return ['strength', 'dexterity', 'wisdom'];
            case 'Polearm Master':
                return ['dexterity', 'strength'];
            case 'Resilient':
            case 'Skill Expert':
                return ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            default:
                return [];
        }
    }

    private createEmptyAbilityBonusMap(): Record<AbilityKey, number> {
        return {
            strength: 0,
            dexterity: 0,
            constitution: 0,
            intelligence: 0,
            wisdom: 0,
            charisma: 0
        };
    }

    private addAbilityBonus(target: Record<AbilityKey, number>, ability: AbilityKey, amount: number): void {
        target[ability] = (target[ability] ?? 0) + amount;
    }

    private parseAbilityKey(value: string | undefined): AbilityKey | null {
        const normalized = (value ?? '').trim().toLowerCase();
        switch (normalized) {
            case 'strength':
                return 'strength';
            case 'dexterity':
                return 'dexterity';
            case 'constitution':
                return 'constitution';
            case 'intelligence':
                return 'intelligence';
            case 'wisdom':
                return 'wisdom';
            case 'charisma':
                return 'charisma';
            default:
                return null;
        }
    }

    private toTitleCaseAbilityKey(key: AbilityKey): string {
        return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    }

    private getSpellSlots(level: number, casterType: 'none' | 'full' | 'half'): number[] {
        if (casterType === 'none') {
            return [];
        }

        const fullCasterSlots = [
            [2],
            [3],
            [4, 2],
            [4, 3],
            [4, 3, 2],
            [4, 3, 3],
            [4, 3, 3, 1],
            [4, 3, 3, 2],
            [4, 3, 3, 3, 1],
            [4, 3, 3, 3, 2],
            [4, 3, 3, 3, 2, 1],
            [4, 3, 3, 3, 2, 1],
            [4, 3, 3, 3, 2, 1, 1],
            [4, 3, 3, 3, 2, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 2, 1, 1, 1, 1],
            [4, 3, 3, 3, 3, 1, 1, 1, 1],
            [4, 3, 3, 3, 3, 2, 1, 1, 1],
            [4, 3, 3, 3, 3, 2, 2, 1, 1]
        ];

        const cappedLevel = Math.min(Math.max(level, 1), 20);
        const effectiveLevel = casterType === 'half' ? Math.max(1, Math.floor(cappedLevel / 2)) : cappedLevel;
        return fullCasterSlots[effectiveLevel - 1] ?? [];
    }

    private getSpellLevelForDetails(className: string, spellName: string): number {
        const classCatalog = classSpellCatalog[className] ?? [];
        const classMatch = classCatalog.find((spell) => spell.name === spellName);
        if (classMatch) {
            return classMatch.level;
        }

        const wizardMatch = (classSpellCatalog['Wizard'] ?? []).find((spell) => spell.name === spellName);
        if (wizardMatch) {
            return wizardMatch.level;
        }

        for (const catalog of Object.values(classSpellCatalog)) {
            const fallback = catalog.find((spell) => spell.name === spellName);
            if (fallback) {
                return fallback.level;
            }
        }

        return 1;
    }

    private getMaxSpellLevelForClassLevel(className: string, classLevel: number): number {
        const progression = spellcastingProgressionByClass[className] ?? 'none';
        const safeLevel = Math.max(1, Math.min(20, classLevel));

        switch (progression) {
            case 'none':
                return 0;
            case 'full':
                return Math.min(9, Math.ceil(safeLevel / 2));
            case 'half':
                return Math.max(0, Math.min(5, Math.ceil(safeLevel / 4)));
            case 'half-late':
                if (safeLevel < 2) {
                    return 0;
                }

                return Math.max(1, Math.min(5, Math.ceil((safeLevel - 1) / 4)));
            case 'pact':
                return this.getMaxPactSpellLevel(safeLevel);
            default:
                return 0;
        }
    }

    private getMaxPactSpellLevel(level: number): number {
        if (level >= 17) {
            return 5;
        }

        if (level >= 9) {
            return 5;
        }

        if (level >= 7) {
            return 4;
        }

        if (level >= 5) {
            return 3;
        }

        if (level >= 3) {
            return 2;
        }

        if (level >= 1) {
            return 1;
        }

        return 0;
    }

    private isRitualSpell(spellName: string): boolean {
        return Boolean(spellDetailsMap[spellName]?.ritual);
    }

    private toggleNameInList(current: string[] | undefined, name: string, className: string): string[] {
        const normalized = name.trim();
        if (!normalized) {
            return current ?? [];
        }

        const names = new Set(current ?? []);
        if (names.has(normalized)) {
            names.delete(normalized);
        } else {
            names.add(normalized);
        }

        return this.sortSpellNamesForClass([...names], className);
    }

    private removeNameWhenMissing(current: string[] | undefined, name: string, shouldKeep: boolean, className: string): string[] {
        const names = new Set(current ?? []);
        if (!shouldKeep) {
            names.delete(name);
        }

        return this.sortSpellNamesForClass([...names], className);
    }

    private getPreparedLeveledSpellNames(current: string[] | undefined, className: string): string[] {
        return normalizePreparedLeveledSpellNames(current, {
            getSpellLevel: (spellName) => this.getSpellLevelForDetails(className, spellName),
            sort: (left, right) => this.getSpellLevelForDetails(className, left) - this.getSpellLevelForDetails(className, right) || left.localeCompare(right)
        });
    }

    private getPreparedSpellLimitForClassLevel(className: string, classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        const progression = spellcastingProgressionByClass[className] ?? 'none';
        if (progression === 'none') {
            return 0;
        }

        const spellcastingAbility = this.spellcastingAbilityByClass[className];
        const spellcastingAbilityModifier = spellcastingAbility
            ? this.getAbilityModifier(this.effectiveAbilityScores()?.[spellcastingAbility] ?? 10)
            : 0;

        switch (className) {
            case 'Cleric':
            case 'Druid':
                return Math.max(1, normalizedLevel + spellcastingAbilityModifier);
            case 'Wizard':
                return getWizardPreparedSpellLimit(normalizedLevel, spellcastingAbilityModifier);
            case 'Paladin':
            case 'Ranger':
                return Math.max(1, Math.floor(normalizedLevel / 2) + spellcastingAbilityModifier);
            case 'Artificer':
                return Math.max(1, normalizedLevel + spellcastingAbilityModifier);
            case 'Bard':
            case 'Sorcerer':
            case 'Warlock':
                return 0;
            default:
                if (progression === 'full' || progression === 'pact') {
                    return normalizedLevel;
                }

                if (progression === 'half') {
                    return Math.max(1, Math.ceil(normalizedLevel / 2));
                }

                if (normalizedLevel < 2) {
                    return 0;
                }

                return Math.max(1, Math.floor(normalizedLevel / 2));
        }
    }

    private areStringArraysEqual(left: string[], right: string[]): boolean {
        if (left.length !== right.length) {
            return false;
        }

        return left.every((value, index) => value === right[index]);
    }

    private sortSpellNamesForClass(names: string[], className: string): string[] {
        return [...new Set(names)]
            .sort((left, right) => this.getSpellLevelForDetails(className, left) - this.getSpellLevelForDetails(className, right) || left.localeCompare(right));
    }

    private async persistSpellSelections(
        updater: (state: PersistedBuilderState, className: string) => PersistedBuilderState
    ): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const className = char.className;
        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState = updater({ ...currentState }, className);
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });

        this.cdr.detectChanges();
    }

    private isContainerItemName(name: string): boolean {
        return this.containerItemNames.has(name.trim().toLowerCase());
    }

    private getContainerCapacity(name: string): number | undefined {
        const normalized = name.trim().toLowerCase();
        if (normalized === 'backpack') {
            return 60;
        }
        if (normalized === 'bag of holding') {
            return 500;
        }
        if (normalized === 'quiver') {
            return 20;
        }
        return undefined;
    }

    private parsePersistedNotes(notes: string): { cleanedNotes: string; state: PersistedBuilderState | null } {
        const raw = notes?.trim() ?? '';
        if (!raw) {
            return { cleanedNotes: '', state: null };
        }

        const blockPattern = /\[DK_BUILDER_STATE_START\]([\s\S]*?)\[DK_BUILDER_STATE_END\]/g;
        const matches = [...raw.matchAll(blockPattern)];
        if (matches.length === 0) {
            return { cleanedNotes: raw, state: null };
        }

        const latestJsonText = (matches[matches.length - 1][1] ?? '').trim();
        const cleanedNotes = raw.replace(blockPattern, '').replace(/\n{3,}/g, '\n\n').trim();

        try {
            const parsed = JSON.parse(latestJsonText) as PersistedBuilderState;
            return { cleanedNotes, state: parsed };
        } catch {
            return { cleanedNotes, state: null };
        }
    }

    private extractNoteValue(notes: string, pattern: RegExp): string {
        const match = notes.match(pattern);
        return match?.[2]?.trim() ?? '';
    }

    private extractNoteList(notes: string, pattern: RegExp): string[] {
        const value = this.extractNoteValue(notes, pattern);
        if (!value) {
            return [];
        }

        return value
            .split(/[,;|]/g)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    private getTrainingFromSelections(state: PersistedBuilderState | null): { armor: string[]; weapons: string[]; tools: string[] } {
        if (!state) {
            return { armor: [], weapons: [], tools: [] };
        }

        const armor = new Set<string>();
        const weapons = new Set<string>();
        const tools = new Set<string>();

        const selectedValues: string[] = [];
        const classSelections = state.classFeatureSelections ?? {};
        const backgroundSelections = state.backgroundChoiceSelections ?? {};

        for (const values of Object.values(classSelections)) {
            for (const entry of values ?? []) {
                selectedValues.push(entry);
            }
        }

        for (const value of Object.values(backgroundSelections)) {
            selectedValues.push(value);
        }

        for (const raw of selectedValues) {
            const value = raw.trim();
            if (!value) {
                continue;
            }

            if (/armor|shield/i.test(value)) {
                armor.add(value);
            }

            if (/weapon|bow|crossbow|sword|axe|mace|spear|dagger/i.test(value)) {
                weapons.add(value);
            }

            if (/tool|kit|instrument|thieves'/i.test(value)) {
                tools.add(value);
            }
        }

        return {
            armor: [...armor],
            weapons: [...weapons],
            tools: [...tools]
        };
    }

    private parsePhysicalCharacteristics(input: string): {
        gender: string;
        age: string;
        height: string;
        weight: string;
        hair: string;
        eyes: string;
        skin: string;
    } {
        const parsed: Record<string, string> = {};

        for (const segment of input.split(';')) {
            const [rawKey, ...valueParts] = segment.split(':');
            const key = rawKey?.trim().toLowerCase();
            const value = valueParts.join(':').trim();
            if (!key || !value) {
                continue;
            }

            parsed[key] = value;
        }

        return {
            gender: parsed['gender'] ?? '',
            age: parsed['age'] ?? '',
            height: parsed['height'] ?? '',
            weight: parsed['weight'] ?? '',
            hair: parsed['hair'] ?? '',
            eyes: parsed['eyes'] ?? '',
            skin: parsed['skin'] ?? ''
        };
    }

    private formatHeightForDisplay(rawValue: string): string {
        if (!rawValue) {
            return 'Not set';
        }

        const heightCm = this.parseHeightToCentimeters(rawValue);
        if (heightCm == null) {
            return rawValue;
        }

        if (this.appearanceMeasurementSystem() === 'metric') {
            return `${Math.round(heightCm)} cm`;
        }

        const totalInches = Math.round(heightCm / 2.54);
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        return `${feet} ft ${inches} in`;
    }

    private formatWeightForDisplay(rawValue: string): string {
        if (!rawValue) {
            return 'Not set';
        }

        const weightKg = this.parseWeightToKilograms(rawValue);
        if (weightKg == null) {
            return rawValue;
        }

        if (this.appearanceMeasurementSystem() === 'metric') {
            return `${weightKg.toFixed(1)} kg`;
        }

        const pounds = Math.round(weightKg / 0.45359237);
        return `${pounds} lb`;
    }

    private parseHeightToCentimeters(rawValue: string): number | null {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized) {
            return null;
        }

        const feetInches = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ft|foot|feet|')\s*(\d+(?:\.\d+)?)?\s*(?:in|inch|inches|\")?/i);
        if (feetInches) {
            const feet = Number(feetInches[1]);
            const inches = feetInches[2] ? Number(feetInches[2]) : 0;
            if (Number.isFinite(feet) && Number.isFinite(inches)) {
                return (feet * 12 + inches) * 2.54;
            }
        }

        const inchesOnly = normalized.match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches)/i);
        if (inchesOnly) {
            const inches = Number(inchesOnly[1]);
            if (Number.isFinite(inches)) {
                return inches * 2.54;
            }
        }

        const meters = normalized.match(/(\d+(?:\.\d+)?)\s*(?:m|meter|meters)/i);
        if (meters) {
            const value = Number(meters[1]);
            if (Number.isFinite(value)) {
                return value * 100;
            }
        }

        const centimeters = normalized.match(/(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)/i);
        if (centimeters) {
            const value = Number(centimeters[1]);
            if (Number.isFinite(value)) {
                return value;
            }
        }

        const plainNumber = Number(normalized);
        if (Number.isFinite(plainNumber)) {
            return plainNumber;
        }

        return null;
    }

    private parseWeightToKilograms(rawValue: string): number | null {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized) {
            return null;
        }

        const pounds = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/i);
        if (pounds) {
            const value = Number(pounds[1]);
            if (Number.isFinite(value)) {
                return value * 0.45359237;
            }
        }

        const kilograms = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)/i);
        if (kilograms) {
            const value = Number(kilograms[1]);
            if (Number.isFinite(value)) {
                return value;
            }
        }

        const stone = normalized.match(/(\d+(?:\.\d+)?)\s*(?:st|stone)/i);
        if (stone) {
            const value = Number(stone[1]);
            if (Number.isFinite(value)) {
                return value * 6.35029318;
            }
        }

        const plainNumber = Number(normalized);
        if (Number.isFinite(plainNumber)) {
            return plainNumber;
        }

        return null;
    }

    private formatBackstoryRichText(text: string): string {
        return marked.parse(text, { gfm: true, breaks: true }) as string;
    }

    openExtrasManagerPopup(): void {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        this.requestCloseChat();
        this.activeExtrasStatEntry.set(null);
        this.activeDetailDrawer.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasCatalogType.set('Familiar');
        this.extrasCatalogExpandedItem.set('');
        this.resetExtrasMonsterFilters();
        this.extrasManagerOpen.set(true);
    }

    closeExtrasManagerPopup(): void {
        this.extrasManagerOpen.set(false);
        this.resetExtrasMonsterFilters();
    }

    openExtrasStatPopup(entry: PersistedExtrasEntry): void {
        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.activeExtrasStatEntry.set(entry);
    }

    closeExtrasStatPopup(): void {
        this.activeExtrasStatEntry.set(null);
    }

    setExtrasCatalogType(value: string | number): void {
        this.extrasCatalogType.set(value as ExtrasCatalogType);
        this.extrasCatalogExpandedItem.set('');
        this.resetExtrasMonsterFilters();
    }

    onExtrasMonsterSearchInput(value: string): void {
        this.extrasMonsterSearchTerm.set(value);
        this.extrasCatalogExpandedItem.set('');
    }

    onExtrasMonsterCrMinInput(value: string): void {
        this.extrasMonsterCrMin.set(value);
        const newMin = this.parseChallengeRatingValue(value);
        const currentMax = this.parseChallengeRatingValue(this.extrasMonsterCrMax());
        if (newMin !== null && currentMax !== null && currentMax < newMin) {
            this.extrasMonsterCrMax.set(value);
        }

        this.extrasCatalogExpandedItem.set('');
    }

    onExtrasMonsterCrMaxInput(value: string): void {
        this.extrasMonsterCrMax.set(value);
        const newMax = this.parseChallengeRatingValue(value);
        const currentMin = this.parseChallengeRatingValue(this.extrasMonsterCrMin());
        if (newMax !== null && currentMin !== null && currentMin > newMax) {
            this.extrasMonsterCrMin.set(value);
        }

        this.extrasCatalogExpandedItem.set('');
    }

    toggleExtrasCatalogItemDetail(name: string): void {
        this.extrasCatalogExpandedItem.set(this.extrasCatalogExpandedItem() === name ? '' : name);
    }

    async addExtraToCharacter(entry: ExtrasCatalogEntry): Promise<void> {
        const statBlock = this.extrasCreatureStatBlock(entry);
        const maxHp = statBlock?.hitPoints ?? undefined;
        const newEntry: PersistedExtrasEntry = {
            uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: entry.name,
            type: entry.type as ExtrasCatalogType,
            monsterStatBlockName: entry.monsterStatBlockName,
            currentHp: maxHp,
            maxHp,
            customNotes: ''
        };

        await this.persistExtrasEntries([...this.characterExtrasEntries(), newEntry]);
    }

    async removeExtrasEntry(uid: string): Promise<void> {
        await this.persistExtrasEntries(this.characterExtrasEntries().filter((e) => e.uid !== uid));
    }

    async incrementExtrasHp(uid: string): Promise<void> {
        const updated = this.characterExtrasEntries().map((e) => {
            if (e.uid !== uid || e.maxHp == null) {
                return e;
            }

            return { ...e, currentHp: Math.min((e.currentHp ?? 0) + 1, e.maxHp) };
        });

        await this.persistExtrasEntries(updated);
    }

    async decrementExtrasHp(uid: string): Promise<void> {
        const updated = this.characterExtrasEntries().map((e) => {
            if (e.uid !== uid) {
                return e;
            }

            return { ...e, currentHp: Math.max((e.currentHp ?? 0) - 1, 0) };
        });

        await this.persistExtrasEntries(updated);
    }

    async setExtrasHp(uid: string, rawValue: string): Promise<void> {
        const parsed = parseInt(rawValue, 10);
        if (!Number.isFinite(parsed)) {
            return;
        }

        const updated = this.characterExtrasEntries().map((e) => {
            if (e.uid !== uid) {
                return e;
            }

            const clamped = Math.max(0, e.maxHp != null ? Math.min(parsed, e.maxHp) : parsed);
            return { ...e, currentHp: clamped };
        });

        await this.persistExtrasEntries(updated);
    }

    async setExtrasCustomNotes(uid: string, notes: string): Promise<void> {
        const updated = this.characterExtrasEntries().map((e) =>
            e.uid === uid ? { ...e, customNotes: notes } : e
        );

        await this.persistExtrasEntries(updated);
    }

    extrasStatBlockForEntry(name: string, monsterStatBlockName?: string): MonsterCatalogEntry | null {
        const candidateName = (monsterStatBlockName || name).trim().toLowerCase();
        if (!candidateName) {
            return null;
        }

        return this.monsterCatalogByName.get(candidateName) ?? null;
    }

    extrasCatalogEntryForPersisted(entry: PersistedExtrasEntry): ExtrasCatalogEntry {
        const catalogEntry = extrasCatalogEntries.find((candidate) =>
            candidate.type === entry.type
            && (candidate.name === entry.name || (!!entry.monsterStatBlockName && candidate.monsterStatBlockName === entry.monsterStatBlockName))
        );

        if (catalogEntry) {
            return catalogEntry;
        }

        const statBlock = this.extrasStatBlockForEntry(entry.name, entry.monsterStatBlockName);
        return {
            name: entry.name,
            type: entry.type,
            monsterStatBlockName: entry.monsterStatBlockName,
            subtype: statBlock ? `${statBlock.size} ${statBlock.creatureType}`.trim() : undefined,
            source: statBlock?.sourceLabel.trim() || undefined,
            sourceUrl: statBlock?.sourceUrl.trim() || undefined,
            summary: `Monster catalog entry for ${entry.type}.`,
            cr: statBlock?.challengeRating || undefined,
            size: statBlock?.size || undefined
        };
    }

    private async persistExtrasEntries(entries: PersistedExtrasEntry[]): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState, extrasEntries: entries };
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        await this.store.updateCharacter(this.characterId, {
            name: char.name,
            playerName: char.playerName,
            race: char.race,
            className: char.className,
            role: char.role,
            level: char.level,
            background: char.background,
            notes: updatedNotes,
            campaignId: char.campaignId,
            hitPoints: char.hitPoints,
            maxHitPoints: char.maxHitPoints
        });

        this.cdr.detectChanges();
    }

    private resetExtrasMonsterFilters(): void {
        this.extrasMonsterSearchTerm.set('');
        this.extrasMonsterCrMin.set('');
        this.extrasMonsterCrMax.set('');
    }

    private parseChallengeRatingValue(rawValue: string | null | undefined): number | null {
        const normalized = (rawValue ?? '').trim().toLowerCase();
        if (!normalized || normalized === 'none' || normalized === 'unknown' || normalized === '-') {
            return null;
        }

        if (normalized.includes('/')) {
            const [numeratorText, denominatorText] = normalized.split('/');
            const numerator = Number(numeratorText);
            const denominator = Number(denominatorText);
            if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
                return numerator / denominator;
            }
        }

        const numericValue = Number(normalized);
        if (Number.isFinite(numericValue)) {
            return numericValue;
        }

        return null;
    }

    extrasCreatureStatBlock(entry: ExtrasCatalogEntry): MonsterCatalogEntry | null {
        const candidateName = (entry.monsterStatBlockName || entry.name).trim().toLowerCase();
        if (!candidateName) {
            return null;
        }

        return this.monsterCatalogByName.get(candidateName) ?? null;
    }

    extrasVehicleStatBlock(entry: ExtrasCatalogEntry): VehicleStatBlock | null {
        if (entry.type !== 'Vehicle') {
            return null;
        }

        return entry.vehicleStatBlock ?? null;
    }

    extrasStatSubtitle(monster: MonsterCatalogEntry): string {
        const details = [monster.size, monster.creatureType, monster.alignment]
            .map((value) => value.trim())
            .filter(Boolean);

        if (details.length === 0) {
            return 'Monster reference';
        }

        const [size, type, alignment] = details;
        return `${size} ${type}${alignment ? `, ${alignment}` : ''}`;
    }

    extrasAbilityRows(monster: MonsterCatalogEntry): Array<{ label: string; value: number | null }> {
        return [
            { label: 'STR', value: monster.abilityScores.strength },
            { label: 'DEX', value: monster.abilityScores.dexterity },
            { label: 'CON', value: monster.abilityScores.constitution },
            { label: 'INT', value: monster.abilityScores.intelligence },
            { label: 'WIS', value: monster.abilityScores.wisdom },
            { label: 'CHA', value: monster.abilityScores.charisma }
        ];
    }

    extrasVehicleAbilityRows(vehicle: VehicleStatBlock): Array<{ label: string; value: number | null }> {
        const scores = vehicle.abilityScores;
        if (!scores) {
            return [];
        }

        return [
            { label: 'STR', value: scores.strength },
            { label: 'DEX', value: scores.dexterity },
            { label: 'CON', value: scores.constitution },
            { label: 'INT', value: scores.intelligence },
            { label: 'WIS', value: scores.wisdom },
            { label: 'CHA', value: scores.charisma }
        ];
    }

    extrasStatSections(monster: MonsterCatalogEntry): Array<{ heading: string; entries: MonsterCatalogEntry['traits'] }> {
        return [
            { heading: 'Traits', entries: monster.traits },
            { heading: 'Actions', entries: monster.actions },
            { heading: 'Reactions', entries: monster.reactions },
            { heading: 'Legendary Actions', entries: monster.legendaryActions }
        ].filter((section) => section.entries.length > 0);
    }

    extrasStatScoreText(value: number | null): string {
        return value == null ? '—' : String(value);
    }

    extrasStatModifierText(value: number | null): string {
        if (value == null) {
            return '—';
        }

        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    extrasFormatStatEntryText(value: string): string {
        const escaped = this.extrasEscapeHtml(value);

        return escaped
            .replace(/\b(Melee or Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Melee Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Hit)\s*:/g, '<em>$1</em>:');
    }

    private extrasEscapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
