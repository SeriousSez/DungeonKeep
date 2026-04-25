import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { CharacterPortraitCropModalComponent } from '../../components/character-portrait-crop-modal/character-portrait-crop-modal.component';
import { CharacterPortraitModalComponent } from '../../components/character-portrait-modal/character-portrait-modal.component';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { MultiSelectDropdownComponent, type MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { classLevelOneFeatures } from '../../data/class-features.data';
import { classProgressionColumns } from '../../data/class-progression.data';
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
import { subclassConfigs, subclassFeatureProgressionByClass } from '../../data/subclass-features.data';
import { normalizePreparedLeveledSpellNames } from '../../rules/spell-preparation.rules';
import { getWizardPreparedSpellLimit, isWizardSpellbookCantripAlwaysPrepared } from '../../rules/wizard-class.rules';
import { featCatalogEntries, type FeatEntry } from '../../data/feats-catalog.data';
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
import {
    ALIGNMENT_DETAILS,
    COMBAT_ACTION_DETAILS,
    CONDITION_DEFINITIONS,
    CONDITION_KEY_ORDER,
    CONDITION_LABEL_LOOKUP,
    DEITY_FAITH_DETAILS,
    EXHAUSTION_LEVEL_RULES,
    LIFESTYLE_COSTS,
    LIFESTYLE_DETAILS,
    SPECIES_LORE_DETAILS,
    XP_THRESHOLDS,
} from './character-detail-page.constants';
import {
    getTieflingGrantedSpellCatalogForLevel,
    getTieflingGrantedSpellNamesForLevel
} from './character-detail-page.tiefling-spells';
import {
    defenseTypeHeading,
    defenseTypeIcon,
    defenseTypeLabel,
    describeDefenseEntry,
    normalizeConditionKey,
    normalizeDefenseEntry,
    normalizeExhaustionLevel
} from './character-detail-page.defenses';
import {
    buildAlignmentDetail,
    buildAppearanceDetail,
    buildBackgroundEntryDetail,
    buildClassLevelDetail,
    buildExperienceDetail,
    buildFaithDetail,
    buildLifestyleDetail,
    buildNameDetail,
    buildRaceDetail,
    getSpeciesInfo,
    getSpeciesLore,
    buildSpeciesAgeDetail,
    buildSpeciesHeightDetail,
    buildSpeciesWeightDetail,
    formatAlignmentValue,
} from './character-detail-page.background-drawers';
import {
    buildBarbarianFeatureDetail,
    buildDruidFeatureDetail,
    buildRogueFeatureDetail,
    getBarbarianFeatureActionLines,
    getBarbarianFeatureInlineTracker,
    getBrutalStrikeActionLines,
    getBrutalStrikeDetailText,
    getDruidFeatureActionLines,
    getDruidFeatureInlineTracker,
    getDruidFeatureInlineTrackers,
    getRogueFeatureActionLines,
    getRogueFeatureInlineTracker,
    getWildShapeDetailText,
    parseFeatureDetailText
} from './character-detail-page.feature-details';
import type {
    AbilityKey,
    ActionFilter,
    BackgroundFilter,
    CombatRow,
    CombatTab,
    ConditionPanelKey,
    DetailBackgroundTheme,
    DetailDrawerContent,
    FeatureListEntry,
    FeaturesFilter,
    InventoryDraftField,
    InventoryFilter,
    LimitedUseEntry,
    MeasurementSystem,
    NotesFilter,
    PersistedBuilderState,
    PersistedConditionKey,
    PersistedCurrencyState,
    PersistedDefenseEntry,
    PersistedDefenseType,
    PersistedExtrasEntry,
    PersistedInventoryEntry,
    RestPopupKind,
    SpeciesTraitEntry,
    SpellFilter,
    SpellManagerTab
} from './character-detail-page.types';

@Component({
    selector: 'app-character-detail-page',
    imports: [CommonModule, RouterLink, DropdownComponent, MultiSelectDropdownComponent, CharacterPortraitModalComponent, CharacterPortraitCropModalComponent],
    templateUrl: './character-detail-page.component.html',
    styleUrl: './character-detail-page.component.scss',
    host: {
        '[attr.data-detail-background]': 'detailBackgroundTheme()',
        '[style.--character-page-custom-bg]': 'detailBackgroundCssValue()',
        '[style.--detail-custom-panel-surface]': 'detailSectionPanelCssValue()',
        '[style.--detail-custom-card-surface]': 'detailSectionCardCssValue()',
        '[style.--detail-custom-text-color]': 'detailTextCssValue()',
        '[style.--detail-custom-border-color]': 'detailBorderCssValue()',
        '[attr.data-detail-panel-custom]': 'detailSectionPanelColor() ? "true" : null',
        '[attr.data-detail-card-custom]': 'detailSectionCardColor() ? "true" : null',
        '[attr.data-detail-text-custom]': 'detailTextColor() ? "true" : null',
        '[attr.data-detail-border-custom]': 'detailBorderColor() ? "true" : null'
    }
})
export class CharacterDetailPageComponent {
    private static readonly UNASSIGNED_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000';

    private readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly document = inject(DOCUMENT);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly campaignHub = inject(CampaignHubService);
    readonly defenseTypeIcon = defenseTypeIcon;
    readonly defenseTypeLabel = defenseTypeLabel;
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
    private readonly featCatalogByName = new Map<string, FeatEntry>(
        featCatalogEntries.map((feat) => [feat.name.trim().toLowerCase(), feat])
    );
    readonly detailBackgroundOptions: ReadonlyArray<DropdownOption> = [
        { value: 'parchment', label: 'Parchment' },
        { value: 'coastal', label: 'Coastal' },
        { value: 'dunes', label: 'Dunes' },
        { value: 'ember', label: 'Ember' },
        { value: 'forest', label: 'Forest' },
        { value: 'moonlit', label: 'Moonlit' },
        { value: 'storm', label: 'Storm' },
        { value: 'tundra', label: 'Tundra' },
        { value: 'underground', label: 'Underground' },
        { value: 'urban', label: 'Urban' },
        { value: 'custom', label: 'Custom Image' }
    ];

    readonly defenseTypeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'resistance', label: 'Resistance' },
        { value: 'immunity', label: 'Immunity' },
        { value: 'vulnerability', label: 'Vulnerability' },
        { value: 'condition-immunity', label: 'Condition Immunity' }
    ];

    readonly damageDefenseSubtypeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Acid', label: 'Acid' },
        { value: 'Bludgeoning', label: 'Bludgeoning' },
        { value: 'Cold', label: 'Cold' },
        { value: 'Fire', label: 'Fire' },
        { value: 'Force', label: 'Force' },
        { value: 'Lightning', label: 'Lightning' },
        { value: 'Necrotic', label: 'Necrotic' },
        { value: 'Piercing', label: 'Piercing' },
        { value: 'Poison', label: 'Poison' },
        { value: 'Psychic', label: 'Psychic' },
        { value: 'Radiant', label: 'Radiant' },
        { value: 'Slashing', label: 'Slashing' },
        { value: 'Thunder', label: 'Thunder' }
    ];

    readonly conditionDefenseSubtypeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Blinded', label: 'Blinded' },
        { value: 'Charmed', label: 'Charmed' },
        { value: 'Deafened', label: 'Deafened' },
        { value: 'Exhaustion', label: 'Exhaustion' },
        { value: 'Frightened', label: 'Frightened' },
        { value: 'Grappled', label: 'Grappled' },
        { value: 'Incapacitated', label: 'Incapacitated' },
        { value: 'Invisible', label: 'Invisible' },
        { value: 'Paralyzed', label: 'Paralyzed' },
        { value: 'Petrified', label: 'Petrified' },
        { value: 'Poisoned', label: 'Poisoned' },
        { value: 'Prone', label: 'Prone' },
        { value: 'Restrained', label: 'Restrained' },
        { value: 'Stunned', label: 'Stunned' },
        { value: 'Unconscious', label: 'Unconscious' }
    ];

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
        religion: 'intelligence',
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
    readonly selectedCampaignAssignments = signal<string[]>([]);
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
    readonly detailBackgroundCachedImageUrl = signal('');
    readonly headerManageOpen = signal(false);
    readonly detailColorsExpanded = signal(false);
    readonly activeRestPopup = signal<RestPopupKind | null>(null);
    readonly isApplyingRest = signal(false);
    readonly restPopupError = signal('');
    readonly restPopupResult = signal('');
    readonly shortRestResetMaxHp = signal(false);
    readonly shortRestAutoHeal = signal(true);
    readonly shortRestUsedHitDieSlots = signal<number[]>([]);
    readonly longRestRule = signal<'recover-half' | 'recover-all'>('recover-half');
    readonly longRestResetMaxHp = signal(true);
    readonly usedSpellSlotsByLevel = signal<Record<number, number>>({});
    readonly limitedUseCounts = signal<Record<string, number>>({});
    readonly rageDetailOption = signal('activate-rage');
    readonly brutalStrikeDetailFeature = signal<'Brutal Strike' | 'Improved Brutal Strike'>('Brutal Strike');
    readonly expandedContainers = signal<Set<string>>(new Set());
    readonly activeDetailDrawer = signal<DetailDrawerContent | null>(null);

    readonly computedDetailDrawer = computed(() => {
        const drawer = this.activeDetailDrawer();
        if (!drawer) return null;
        if (drawer.key === 'armor-class') {
            return this.buildArmorClassDrawerContent();
        }
        return drawer;
    });
    readonly activeExtrasStatEntry = signal<PersistedExtrasEntry | null>(null);
    readonly detailSecondaryExpanded = signal(false);
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
    readonly hpRestoreChoice = signal<'full' | 'one' | null>(null);
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
    readonly defenseManagerOpen = signal(false);
    readonly conditionsManagerOpen = signal(false);
    readonly optimisticConditionKeys = signal<Set<PersistedConditionKey> | null>(null);
    readonly optimisticExhaustionLevel = signal<number | null>(null);
    readonly defenseCustomizeOpen = signal(true);
    readonly expandedConditionKey = signal<ConditionPanelKey | ''>('exhaustion');
    readonly defenseDraftType = signal<PersistedDefenseType>('resistance');
    readonly defenseDraftSubtype = signal('');
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

    readonly rageDetailOptions: ReadonlyArray<DropdownOption> = [
        { value: 'activate-rage', label: 'Activate Rage' },
        { value: 'extend-rage', label: 'Extend Rage' }
    ];

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
        effect(() => {
            const body = this.document?.body;
            if (!body) {
                return;
            }

            body.classList.add('character-detail-page-active');
            body.setAttribute('data-character-page-theme', this.detailBackgroundTheme());

            const cssValue = this.detailBackgroundCssValue();
            if (this.detailBackgroundTheme() === 'custom' && cssValue !== 'none') {
                body.style.setProperty('--character-page-custom-bg', cssValue);
            } else {
                body.style.removeProperty('--character-page-custom-bg');
            }
        });

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
            const body = this.document?.body;
            body?.classList.remove('character-detail-page-active');
            body?.removeAttribute('data-character-page-theme');
            body?.style.removeProperty('--character-page-custom-bg');
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
            const state = this.persistedBuilderState();
            this.limitedUseCounts.set({ ...(state?.limitedUseCounts ?? {}) });
        });

        effect(() => {
            const characterId = this.character()?.id ?? null;
            if (this.lastPortraitSourceCharacterId === characterId) {
                return;
            }

            this.lastPortraitSourceCharacterId = characterId;
            this.portraitOriginalImageUrl.set(characterId ? this.readStoredPortraitOriginalImageUrl(characterId) : '');
            this.detailBackgroundCachedImageUrl.set(characterId ? this.readStoredDetailBackgroundImageUrl(characterId) : '');
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

        effect(() => {
            const char = this.character();
            if (!char) {
                this.selectedCampaignAssignments.set([]);
                return;
            }

            const nextCampaignIds = Array.from(new Set((char.campaignIds ?? []).filter((id) => !!id)));
            this.selectedCampaignAssignments.set(nextCampaignIds);
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (!target.closest('.header-manage-menu')) {
            this.headerManageOpen.set(false);
            this.detailColorsExpanded.set(false);
        }

        if (this.activeRestPopup() && !target.closest('.rest-popup') && !target.closest('.header-rest-actions')) {
            this.closeRestPopup();
        }
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
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.headerManageOpen.set(false);
        this.detailColorsExpanded.set(false);
        this.activeRestPopup.set(null);
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
    readonly conditionDefinitions = CONDITION_DEFINITIONS;
    readonly exhaustionLevelRules = EXHAUSTION_LEVEL_RULES;
    readonly exhaustionLevels = [0, 1, 2, 3, 4, 5, 6];
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
            notes: this.getInventoryWeaponNotes(category, entry.notes, catalogItem?.summary, catalogItem?.notes),
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

    readonly persistedSkillSelectionCounts = computed(() => {
        const state = this.persistedBuilderState();
        const counts = new Map<string, number>();

        if (!state) {
            return counts;
        }

        const addSelections = (values: readonly string[] | undefined | null) => {
            for (const value of values ?? []) {
                for (const skillKey of this.parseSkillTokens(value)) {
                    counts.set(skillKey, (counts.get(skillKey) ?? 0) + 1);
                }
            }
        };

        const selectedBackgroundName = state.selectedBackgroundName?.trim() || this.character()?.background?.trim() || '';
        if (selectedBackgroundName) {
            const backgroundSkills = backgroundDetailOverrides[selectedBackgroundName]?.skillProficiencies
                ?? backgroundSkillProficienciesFallbacks[selectedBackgroundName]
                ?? '';
            addSelections([backgroundSkills]);
        }

        const classSelections = state.classFeatureSelections ?? {};
        for (const pickedValues of Object.values(classSelections)) {
            addSelections(pickedValues ?? []);
        }

        const backgroundSelections = state.backgroundChoiceSelections ?? {};
        addSelections(Object.values(backgroundSelections));

        const featFollowUpChoices = state.featFollowUpChoices ?? {};
        for (const choice of Object.values(featFollowUpChoices)) {
            addSelections(choice?.skilledSelections ?? []);
        }

        return counts;
    });

    readonly persistedSkillProficiencies = computed(() => new Set(this.persistedSkillSelectionCounts().keys()));

    readonly persistedSkillExpertise = computed(() => {
        const expertise = new Set<string>();

        for (const [skillKey, count] of this.persistedSkillSelectionCounts()) {
            if (count >= 2) {
                expertise.add(skillKey);
            }
        }

        return expertise;
    });

    readonly effectiveAbilityScores = computed(() => {
        const char = this.character();
        if (!char) {
            return null;
        }

        const savedScores = char.abilityScores;
        if (savedScores) {
            return savedScores;
        }

        const persistedScores = this.getPersistedAbilityScores(this.persistedBuilderState());
        if (persistedScores) {
            return persistedScores;
        }

        return {
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
    readonly displayPortraitImageUrl = computed(() => this.character()?.image?.trim() || this.portraitOriginalImageUrl().trim() || '');
    readonly detailBackgroundImageUrl = computed(() =>
        this.character()?.detailBackgroundImageUrl?.trim()
        || this.detailBackgroundCachedImageUrl().trim()
        || this.persistedBuilderState()?.detailBackgroundImageUrl?.trim()
        || ''
    );
    readonly detailBackgroundTheme = computed<DetailBackgroundTheme>(() => {
        const persistedTheme = this.persistedBuilderState()?.detailBackgroundTheme;
        if (persistedTheme) {
            return this.normalizeDetailBackgroundTheme(persistedTheme);
        }

        return this.detailBackgroundImageUrl() ? 'custom' : 'parchment';
    });
    readonly detailBackgroundCssValue = computed(() => {
        const imageUrl = this.detailBackgroundImageUrl();
        return imageUrl ? `url("${imageUrl.replace(/"/g, '\\"')}")` : 'none';
    });
    readonly detailSectionPanelColor = computed(() =>
        this.normalizeDetailSectionColor(this.persistedBuilderState()?.detailSectionPanelColor)
    );
    readonly detailSectionCardColor = computed(() =>
        this.normalizeDetailSectionColor(this.persistedBuilderState()?.detailSectionCardColor)
    );
    readonly detailTextColor = computed(() =>
        this.normalizeDetailSectionColor(this.persistedBuilderState()?.detailTextColor)
    );
    readonly detailBorderColor = computed(() =>
        this.normalizeDetailSectionColor(this.persistedBuilderState()?.detailBorderColor)
    );
    readonly detailSectionPanelAlpha = computed(() =>
        this.normalizeDetailAlpha(this.persistedBuilderState()?.detailSectionPanelAlpha)
    );
    readonly detailSectionCardAlpha = computed(() =>
        this.normalizeDetailAlpha(this.persistedBuilderState()?.detailSectionCardAlpha)
    );
    readonly detailTextAlpha = computed(() =>
        this.normalizeDetailAlpha(this.persistedBuilderState()?.detailTextAlpha)
    );
    readonly detailBorderAlpha = computed(() =>
        this.normalizeDetailAlpha(this.persistedBuilderState()?.detailBorderAlpha)
    );
    readonly detailSectionPanelCssValue = computed(() => this.composeDetailColorValue(this.detailSectionPanelColor(), this.detailSectionPanelAlpha()));
    readonly detailSectionCardCssValue = computed(() => this.composeDetailColorValue(this.detailSectionCardColor(), this.detailSectionCardAlpha()));
    readonly detailTextCssValue = computed(() => this.composeDetailColorValue(this.detailTextColor(), this.detailTextAlpha()));
    readonly detailBorderCssValue = computed(() => this.composeDetailColorValue(this.detailBorderColor(), this.detailBorderAlpha()));

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

    readonly assignableCampaignGroups = computed<MultiSelectOptionGroup[]>(() => [
        {
            label: '',
            options: this.assignableCampaignOptions().map((campaign) => ({
                value: String(campaign.value),
                label: campaign.label
            }))
        }
    ]);

    readonly onPortraitPromptDetailsChanged = (value: string) => {
        this.portraitPromptDetails.set(value);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
    };

    readonly toggleHeaderManageMenu = (event?: Event) => {
        event?.stopPropagation();
        const nextOpen = !this.headerManageOpen();
        this.headerManageOpen.set(nextOpen);
        if (!nextOpen) {
            this.detailColorsExpanded.set(false);
        }
    };

    readonly closeHeaderManageMenu = () => {
        this.headerManageOpen.set(false);
        this.detailColorsExpanded.set(false);
    };

    readonly toggleDetailColorsExpanded = () => {
        this.detailColorsExpanded.update((expanded) => !expanded);
    };

    readonly onDetailBackgroundThemeChanged = async (value: string | number) => {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const nextTheme = this.normalizeDetailBackgroundTheme(String(value));
        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        if (currentState.detailBackgroundTheme === nextTheme) {
            return;
        }

        const updatedState: PersistedBuilderState = {
            ...currentState,
            detailBackgroundTheme: nextTheme
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
                maxHitPoints: char.maxHitPoints,
                image: char.image
            });
        } finally {
            this.cdr.detectChanges();
        }
    };

    readonly onDetailBackgroundImageSelected = async (event: Event) => {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file) {
            return;
        }

        try {
            this.campaignUpdateError.set('');

            const imageUrl = await this.readPortraitFile(file);
            this.storeDetailBackgroundImageUrl(this.characterId, imageUrl);
            const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
            const updatedState: PersistedBuilderState = {
                ...currentState,
                detailBackgroundTheme: 'custom'
            };
            delete updatedState.detailBackgroundImageUrl;
            const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

            const updated = await this.store.updateCharacter(this.characterId, {
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
                maxHitPoints: char.maxHitPoints,
                image: char.image,
                detailBackgroundImageUrl: imageUrl
            });

            if (!updated) {
                this.campaignUpdateError.set('Background image saved on this device, but sync is unavailable right now.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to upload that background image right now.';
            this.campaignUpdateError.set(message);
        } finally {
            if (input) {
                input.value = '';
            }

            this.cdr.detectChanges();
        }
    };

    readonly clearDetailBackgroundImage = async () => {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = {
            ...currentState,
            detailBackgroundTheme: 'parchment'
        };
        delete updatedState.detailBackgroundImageUrl;
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        this.storeDetailBackgroundImageUrl(this.characterId, '');

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
            maxHitPoints: char.maxHitPoints,
            image: char.image,
            detailBackgroundImageUrl: ''
        });

        this.cdr.detectChanges();
    };

    readonly onDetailSectionPanelColorChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextColor = this.normalizeDetailSectionColor(input?.value ?? '');
        if (nextColor === this.detailSectionPanelColor()) {
            return;
        }

        await this.persistDetailSectionColors({ detailSectionPanelColor: nextColor || null });
    };

    readonly onDetailSectionCardColorChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextColor = this.normalizeDetailSectionColor(input?.value ?? '');
        if (nextColor === this.detailSectionCardColor()) {
            return;
        }

        await this.persistDetailSectionColors({ detailSectionCardColor: nextColor || null });
    };

    readonly resetDetailSectionColors = async () => {
        if (!this.detailSectionPanelColor() && !this.detailSectionCardColor() && !this.detailTextColor() && !this.detailBorderColor()) {
            return;
        }

        await this.persistDetailSectionColors({
            detailSectionPanelColor: null,
            detailSectionCardColor: null,
            detailTextColor: null,
            detailBorderColor: null,
            detailSectionPanelAlpha: null,
            detailSectionCardAlpha: null,
            detailTextAlpha: null,
            detailBorderAlpha: null
        });
    };

    readonly onDetailTextColorChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextColor = this.normalizeDetailSectionColor(input?.value ?? '');
        if (nextColor === this.detailTextColor()) {
            return;
        }

        await this.persistDetailSectionColors({ detailTextColor: nextColor || null });
    };

    readonly onDetailBorderColorChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextColor = this.normalizeDetailSectionColor(input?.value ?? '');
        if (nextColor === this.detailBorderColor()) {
            return;
        }

        await this.persistDetailSectionColors({ detailBorderColor: nextColor || null });
    };

    readonly onDetailSectionPanelAlphaChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextAlpha = this.parseDetailAlphaPercent(input?.value ?? '100');
        if (nextAlpha === this.detailSectionPanelAlpha()) {
            return;
        }

        await this.persistDetailSectionColors({ detailSectionPanelAlpha: nextAlpha });
    };

    readonly onDetailSectionCardAlphaChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextAlpha = this.parseDetailAlphaPercent(input?.value ?? '100');
        if (nextAlpha === this.detailSectionCardAlpha()) {
            return;
        }

        await this.persistDetailSectionColors({ detailSectionCardAlpha: nextAlpha });
    };

    readonly onDetailTextAlphaChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextAlpha = this.parseDetailAlphaPercent(input?.value ?? '100');
        if (nextAlpha === this.detailTextAlpha()) {
            return;
        }

        await this.persistDetailSectionColors({ detailTextAlpha: nextAlpha });
    };

    readonly onDetailBorderAlphaChanged = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const nextAlpha = this.parseDetailAlphaPercent(input?.value ?? '100');
        if (nextAlpha === this.detailBorderAlpha()) {
            return;
        }

        await this.persistDetailSectionColors({ detailBorderAlpha: nextAlpha });
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
                additionalDirection: this.buildPortraitAdditionalDirection(this.portraitPromptDetails().trim())
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

    private buildPortraitAdditionalDirection(manualDirection: string): string {
        const appearanceDetails = this.appearanceRows()
            .map((row) => ({ label: row.label, value: row.value.trim() }))
            .filter((row) => row.value.length > 0 && row.value.toLowerCase() !== 'not set');

        if (appearanceDetails.length === 0) {
            return manualDirection;
        }

        const appearanceSummary = `Use these known appearance details: ${appearanceDetails.map((row) => `${row.label}: ${row.value}`).join('; ')}`;
        return manualDirection
            ? `${appearanceSummary}\nRequested art direction: ${manualDirection}`
            : appearanceSummary;
    }

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
        if (!char) {
            return 0;
        }

        if (this.isExhaustionDeath()) {
            return 3;
        }

        if (!this.isZeroHp()) {
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
        if (!char) {
            return 0;
        }

        if (this.isExhaustionDeath()) {
            return 0;
        }

        if (!this.isZeroHp()) {
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
            { label: 'Current HP', value: `${this.isExhaustionDeath() ? 0 : char.hitPoints}` },
            { label: 'Max HP', value: `${char.maxHitPoints}` },
            { label: 'Temporary HP', value: `${this.isExhaustionDeath() ? 0 : this.tempHitPoints()}` },
            { label: 'Hit Dice', value: `${char.level}d${hitDie}` },
            { label: 'Death Saves', value: this.isExhaustionDeath() ? 'Dead from exhaustion' : char.status === 'Recovering' ? '1 failure' : '0 failures' }
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
            { name: 'Religion', key: 'religion' },
            { name: 'Sleight of Hand', key: 'sleightOfHand' },
            { name: 'Stealth', key: 'stealth' },
            { name: 'Survival', key: 'survival' }
        ].map((skill) => {
            const abilityKey = this.skillAbilityMap[skill.key as keyof typeof this.skillAbilityMap];
            const abilityScore = this.effectiveAbilityScores()?.[abilityKey] ?? 10;
            const proficient = this.isSkillProficient(skill.key, char.skills);
            const expertise = this.isSkillExpertise(skill.key);
            const modifier = this.getAbilityModifier(abilityScore) + this.getSkillProficiencyBonus(skill.key, char.skills);
            const disadvantageReason = this.getArmorDisadvantageReasonForSkill(skill.key, this.abilityKeyMap[abilityKey]);

            return {
                ...skill,
                ability: this.abilityKeyMap[abilityKey],
                proficient,
                expertise,
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
        const grantedSpellNames = getTieflingGrantedSpellNamesForLevel(char.race, char.level, persisted);
        const knownNames = [...new Set([...(persisted.classKnownSpellsByClass?.[className] ?? []), ...grantedSpellNames])];
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

        selectedNames = [...selectedNames, ...grantedSpellNames];

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
        const persisted = this.persistedBuilderState();

        const catalog = (classSpellCatalog[char.className] ?? [])
            .filter((spell) => spell.level === 0 || spell.level <= maxAllowedSpellLevel)
            .map((spell) => ({
                name: spell.name,
                level: spell.level,
                source: spell.source
            }));

        const mergedByName = new Map(catalog.map((spell) => [spell.name, spell]));
        for (const grantedSpell of getTieflingGrantedSpellCatalogForLevel(char.race, char.level, persisted)) {
            if (!mergedByName.has(grantedSpell.name)) {
                mergedByName.set(grantedSpell.name, grantedSpell);
            }
        }

        return [...mergedByName.values()]
            .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
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
        const char = this.character();
        const className = char?.className;
        const persisted = this.persistedBuilderState();
        if (!className || !char || !persisted) {
            return new Set<string>();
        }

        const known = this.persistedBuilderState()?.classKnownSpellsByClass?.[className] ?? [];
        const granted = getTieflingGrantedSpellNamesForLevel(char.race, char.level, persisted);
        return new Set([...known, ...granted]);
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

    readonly customDefenseEntries = computed(() => {
        const persistedEntries = this.persistedBuilderState()?.defenseEntries ?? [];
        return persistedEntries
            .map((entry) => normalizeDefenseEntry(entry))
            .filter((entry): entry is PersistedDefenseEntry => entry !== null);
    });

    readonly defenseSubtypeOptions = computed<ReadonlyArray<DropdownOption>>(() =>
        this.defenseDraftType() === 'condition-immunity'
            ? this.conditionDefenseSubtypeOptions
            : this.damageDefenseSubtypeOptions
    );

    readonly defenseSubtypePlaceholder = computed(() => `-- Choose a ${defenseTypeLabel(this.defenseDraftType())} --`);

    readonly customDefenseSections = computed(() => {
        const entries = this.customDefenseEntries();
        const orderedTypes: PersistedDefenseType[] = ['resistance', 'immunity', 'vulnerability', 'condition-immunity'];

        return orderedTypes
            .map((type) => {
                const groupedEntries = entries.filter((entry) => entry.type === type);

                return {
                    type,
                    heading: defenseTypeHeading(type),
                    entries: groupedEntries,
                    summaryText: groupedEntries.map((entry) => `${entry.value}*`).join(', ')
                };
            })
            .filter((section) => section.entries.length > 0);
    });

    readonly activeConditionKeys = computed(() => {
        const optimisticKeys = this.optimisticConditionKeys();
        if (optimisticKeys) {
            return optimisticKeys;
        }

        const keys = new Set<PersistedConditionKey>();

        for (const value of this.persistedBuilderState()?.activeConditions ?? []) {
            const normalized = normalizeConditionKey(value);
            if (normalized) {
                keys.add(normalized);
            }
        }

        return keys;
    });

    readonly exhaustionLevel = computed(() => {
        const optimisticLevel = this.optimisticExhaustionLevel();
        if (optimisticLevel !== null) {
            return optimisticLevel;
        }

        return normalizeExhaustionLevel(this.persistedBuilderState()?.exhaustionLevel);
    });

    readonly isExhaustionDeath = computed(() => this.exhaustionLevel() >= 6);

    readonly conditionEntries = computed(() =>
        this.conditionDefinitions.map((entry) => ({
            ...entry,
            active: this.activeConditionKeys().has(entry.key)
        }))
    );

    readonly defenses = computed(() => {
        const char = this.character();
        if (!char) {
            return [] as string[];
        }

        const persistedEntries = this.customDefenseEntries().map((entry) => describeDefenseEntry(entry));
        const traitResistances = (char.traits ?? [])
            .filter((trait) => /resistance|resil|immune|vulnerab/i.test(trait))
            .map((trait) => trait.replace(/^[^:]*:\s*/, '').trim())
            .filter((trait) => trait.length > 0);

        return Array.from(new Set([...persistedEntries, ...traitResistances]));
    });

    readonly conditionSummary = computed(() => {
        const char = this.character();
        if (!char) {
            return 'No active conditions';
        }

        if (this.isExhaustionDeath()) {
            return 'Dead from exhaustion';
        }

        const activeLabels = CONDITION_KEY_ORDER
            .filter((key) => this.activeConditionKeys().has(key))
            .map((key) => CONDITION_LABEL_LOOKUP[key]);

        if (this.exhaustionLevel() > 0) {
            activeLabels.push(`Exhaustion ${this.exhaustionLevel()}`);
        }

        if (activeLabels.length > 0) {
            return activeLabels.join(', ');
        }

        return char.status === 'Recovering' ? 'Recovering from previous encounter' : 'No active conditions';
    });

    readonly training = computed(() => {
        const char = this.character();
        if (!char) {
            return { armor: [] as string[], weapons: [] as string[], tools: [] as string[] };
        }

        const fromState = this.getTrainingFromSelections(this.persistedBuilderState());

        if (fromState.armor.length === 0 && fromState.weapons.length === 0 && fromState.tools.length === 0) {
            return this.getTrainingFromCoreTraits(char.className);
        }

        return fromState;
    });

    readonly languageList = computed(() => {
        const char = this.character();
        const persisted = this.persistedBuilderState();
        const selected = [
            ...(char?.languages ?? []),
            ...(persisted?.selectedLanguages ?? []),
            ...(persisted?.selectedSpeciesLanguages ?? []),
            ...(this.raceInfo()?.languages ?? [])
        ];

        return this.sanitizeLanguageList(selected);
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
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => !entry.isContainer)
            .map(({ entry, index }) => ({
                name: entry.name,
                category: entry.category,
                quantity: entry.quantity,
                weight: entry.weight,
                costGp: entry.costGp,
                notes: entry.notes,
                equipped: entry.equipped,
                sourceIndex: index
            }));

        if (persistedEntries.length > 0) {
            const weapons: string[] = [];
            const armor: string[] = [];
            const gear: string[] = [];

            for (const entry of persistedEntries) {
                const label = entry.quantity > 1 ? `${entry.name} x${entry.quantity}` : entry.name;
                const normalizedCategory = entry.category.toLowerCase();

                if (normalizedCategory.includes('weapon') || normalizedCategory.includes('firearm')) {
                    if (entry.equipped !== false) {
                        weapons.push(label);
                    }
                    continue;
                }

                if (normalizedCategory.includes('armor') || normalizedCategory.includes('shield')) {
                    if (entry.equipped !== false) {
                        armor.push(label);
                    }
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
            items: [] as Array<{ name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string; equipped?: boolean; sourceIndex: number }>
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

    private getUnarmoredSecondaryMod(): { mod: number; label: string } | null {
        const char = this.character();
        if (!char) return null;
        const className = char.className?.toLowerCase();
        const scores = this.effectiveAbilityScores();
        if (className === 'barbarian') {
            return { mod: this.getAbilityModifier(scores?.constitution ?? 10), label: 'Constitution Bonus' };
        }
        if (className === 'monk') {
            return { mod: this.getAbilityModifier(scores?.wisdom ?? 10), label: 'Wisdom Bonus' };
        }
        return null;
    }

    readonly computedArmorClass = computed(() => {
        const char = this.character();
        if (!char) return 0;

        const scores = this.effectiveAbilityScores();
        const dexMod = this.getAbilityModifier(scores?.dexterity ?? 10);
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

        const shieldBonus = hasShield ? 2 : 0;

        if (!armorName) {
            // Unarmored — compute from ability scores
            const secondary = this.getUnarmoredSecondaryMod();
            return 10 + dexMod + (secondary?.mod ?? 0) + shieldBonus;
        }

        const profile = this.getArmorClassProfile(armorName);
        const armorBase = profile?.base ?? 10;
        const dexApplied = profile?.dexCap == null ? dexMod : Math.min(dexMod, profile.dexCap);
        return armorBase + dexApplied + shieldBonus;
    });

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

    private getCompactWeaponNotes(summary?: string, notes?: string): string {
        const compactSummary = summary?.replace(/\s+/g, ' ').trim() ?? '';
        const structuredSummary = compactSummary.match(/^Weapon\s*\(([^)]+)\)\s*,\s*([^.()]+?)(?:\s*\(requires attunement by ([^)]+)\))?\.?$/i);
        if (structuredSummary) {
            const [, weaponType, rarity, attunedBy] = structuredSummary;
            const compactParts = [
                this.toCompactNoteLabel(weaponType),
                this.toCompactNoteLabel(rarity)
            ];

            if (attunedBy) {
                compactParts.push(`Attuned (${this.toCompactNoteLabel(attunedBy.replace(/^(a|an|the)\s+/i, ''))})`);
            }

            return compactParts.filter((value) => value.length > 0).join(', ');
        }

        if (compactSummary) {
            return compactSummary;
        }

        const rawNotes = notes?.replace(/\s+/g, ' ').trim();
        if (!rawNotes) {
            return '—';
        }

        const firstSentence = rawNotes.match(/^.+?[.!?](?=\s|$)/)?.[0]?.trim() ?? rawNotes;
        return firstSentence.length > 140
            ? `${firstSentence.slice(0, 137).trimEnd()}...`
            : firstSentence;
    }

    private getCatalogItemByName(name: string) {
        const normalizedName = name.trim().toLowerCase();
        const normalizedCrossbowName = normalizedName.replace(/^(light|hand|heavy) crossbow$/i, 'crossbow, $1');
        return this.catalogLookup.get(normalizedName) ?? this.catalogLookup.get(normalizedCrossbowName);
    }

    private isWeaponCategory(category: string | undefined): boolean {
        const normalizedCategory = (category ?? '').toLowerCase();
        return normalizedCategory.includes('weapon') || normalizedCategory.includes('firearm');
    }

    private getInventoryWeaponNotes(category: string | undefined, existingNotes?: string, summary?: string, catalogNotes?: string): string | undefined {
        const trimmedNotes = existingNotes?.trim();
        if (!this.isWeaponCategory(category)) {
            return trimmedNotes || catalogNotes?.trim() || undefined;
        }

        if (this.isShortWeaponNote(trimmedNotes)) {
            return trimmedNotes;
        }

        const compactNote = this.getCompactWeaponNotes(summary, catalogNotes ?? trimmedNotes);
        return compactNote !== '—' ? compactNote : trimmedNotes || catalogNotes?.trim() || undefined;
    }

    private getWeaponRangeLabel(weaponName: string, catalogItem?: { notes?: string; summary?: string }): string {
        const sourceText = [catalogItem?.notes ?? '', catalogItem?.summary ?? '']
            .filter((value) => value.trim().length > 0)
            .join(' ');
        const explicitRange = sourceText.match(/Range\s*\(([^)]+)\)/i)?.[1]?.trim();

        if (explicitRange) {
            return `${explicitRange} ft.`;
        }

        return /bow|crossbow|blowgun|sling|pistol|musket|rifle|shotgun|revolver|dart|laser/i.test(weaponName)
            ? 'Ranged'
            : '5 ft.';
    }

    private isShortWeaponNote(value?: string): boolean {
        const trimmed = value?.trim();
        return !!trimmed && trimmed.length <= 90 && !/[.!?]\s/.test(trimmed);
    }

    private getWeaponPopupFooterText(summaryText: string, notes?: string): string | null {
        const cleanNotes = notes?.trim();
        if (!cleanNotes) {
            return null;
        }

        const looksCompact = cleanNotes.length <= 90 && !/[.!?]\s/.test(cleanNotes);
        const footerText = looksCompact ? cleanNotes : this.getCompactWeaponNotes(summaryText, cleanNotes);

        return this.normalizeInventoryDetailText(footerText) === this.normalizeInventoryDetailText(summaryText)
            ? null
            : footerText;
    }

    private toCompactNoteLabel(value: string): string {
        return value
            .trim()
            .split(/\s+/)
            .map((word) => (/^(and|or|of|the|by|to)$/i.test(word)
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
            .join(' ');
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
            const weaponCatalogItem = this.getCatalogItemByName(weaponName);
            const isRanged = /bow|crossbow|sling|blowgun|pistol|musket|rifle|gun/i.test(weaponName);
            const useDexterity = /bow|crossbow|sling|dagger|rapier|shortsword/i.test(weaponName);
            const abilityKey: AbilityKey = useDexterity ? 'dexterity' : 'strength';
            const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
            const bonus = abilityMod + char.proficiencyBonus;
            const damage = this.weaponDamageMap[weaponKey] ?? this.weaponDamageMap[normalizedWeaponKey] ?? '—';
            const catalogNotes = this.getInventoryWeaponNotes(weaponCatalogItem?.category ?? 'Weapon', undefined, weaponCatalogItem?.summary, weaponCatalogItem?.notes) ?? '—';
            const rangeLabel = this.getWeaponRangeLabel(weaponKey, weaponCatalogItem);
            return {
                name: weaponName,
                subtitle: isRanged ? 'Ranged Weapon' : 'Melee Weapon',
                range: rangeLabel,
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

    readonly limitedUseEntries = computed<LimitedUseEntry[]>(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const entries: LimitedUseEntry[] = [];

        if (char.className === 'Barbarian') {
            const rageUsesText = this.getClassProgressionValue('Barbarian', 'Rages', char.level);
            const maxUses = Number.parseInt(rageUsesText, 10);

            if (Number.isFinite(maxUses) && maxUses > 0) {
                entries.push({
                    id: 'barbarian-rage',
                    name: 'Rage',
                    meta: 'Rages • PHB-2024, pg. 51',
                    description: `You can take a Bonus Action to enter Rage if you aren’t wearing Heavy Armor. You can use Rage ${maxUses} times per Long Rest and regain one expended use when you finish a Short Rest.`,
                    choiceLabel: 'Activate Rage',
                    activationLabel: 'Rage (Enter): 1 Bonus Action',
                    maxUses,
                    usedCount: Math.max(0, Math.min(maxUses, this.limitedUseCounts()['barbarian-rage'] ?? 0)),
                    resetLabel: 'Long Rest'
                });
            }
        }

        return entries;
    });

    readonly attacksPerAction = computed(() => {
        const value = Number(this.noteContext().attacksPerAction);
        if (Number.isFinite(value) && value > 0) {
            return Math.trunc(value);
        }

        return Math.max(1, this.weaponCombatRows().length > 0 ? 1 : 0);
    });

    readonly selectedSubclassName = computed(() => {
        const char = this.character();
        if (!char) {
            return '';
        }

        return this.getSelectedSubclassNameForCharacter(char.className, char.level);
    });

    readonly classFeatures = computed<FeatureListEntry[]>(() => {
        const char = this.character();
        const state = this.persistedBuilderState();
        if (!char) {
            return [];
        }

        const allLevels = classLevelOneFeatures[char.className] ?? [];
        const selectedSubclassName = this.getSelectedSubclassNameForCharacter(char.className, char.level);
        const subclassConfig = this.getSubclassConfig(char.className);
        const features: FeatureListEntry[] = [];

        for (const levelGroup of allLevels) {
            if (levelGroup.level > char.level) continue;

            const levelEntries: FeatureListEntry[] = [];
            let hadSubclassPlaceholder = false;

            for (const feature of levelGroup.features) {
                if (selectedSubclassName && this.isSubclassPlaceholderFeature(char.className, feature.name)) {
                    hadSubclassPlaceholder = true;
                    continue;
                }

                const selectedValues = this.getPersistedFeatureSelections(state, char.className, feature.level, feature.name);
                const detailLines: string[] = [
                    ...this.getClassFeatureDynamicDetails(char.className, char.level, feature.name)
                ];
                const summaryBadges = this.getClassFeatureSummaryBadges(char.className, char.level, feature.name);
                let description = this.getClassFeatureSheetDescription(char.className, char.level, feature.name, feature.description ?? '');
                let detailDescription = feature.description ?? description;

                if (feature.choices && selectedValues.length > 0) {
                    detailLines.push(`Chosen: ${selectedValues.join(', ')}`);
                }

                if (selectedSubclassName && this.isSubclassSelectorFeature(char.className, feature.name)) {
                    detailLines.unshift(`Chosen subclass: ${selectedSubclassName}.`);
                    summaryBadges.unshift(selectedSubclassName);
                }

                if (feature.name === 'Ability Score Improvement' || feature.name === 'Epic Boon') {
                    const asiSummary = this.getPersistedAbilityScoreImprovementSummary(state, char.className, feature.level, feature.name);
                    if (asiSummary) {
                        detailLines.push(asiSummary);
                    }
                }

                const followUpLines = this.getPersistedFeatFollowUpSummary(state, char.className, feature.level, feature.name);
                if (followUpLines.length > 0) {
                    detailLines.push(...followUpLines);
                }

                if (detailLines.length > 0) {
                    description = [description, ...detailLines].filter((line) => !!line).join('\n');
                    detailDescription = [detailDescription, ...detailLines].filter((line) => !!line).join('\n');
                }

                levelEntries.push({ name: feature.name, level: feature.level, description, detailDescription, summaryBadges });
            }

            if (selectedSubclassName && subclassConfig && (subclassConfig.milestoneLevels.includes(levelGroup.level) || hadSubclassPlaceholder)) {
                levelEntries.push(...this.getSubclassFeatureEntriesForLevel(char.className, selectedSubclassName, levelGroup.level));
            }

            features.push(...levelEntries);
        }

        for (const rawFeatureName of char.classFeatures ?? []) {
            const featureName = this.normalizeFeatureDisplayName(rawFeatureName);
            if (!featureName) {
                continue;
            }

            if (!features.some((feature) => this.normalizeFeatureLookupKey(feature.name) === this.normalizeFeatureLookupKey(featureName))) {
                features.push({
                    name: featureName,
                    level: char.level,
                    description: '',
                    detailDescription: '',
                    summaryBadges: this.getClassFeatureSummaryBadges(char.className, char.level, featureName)
                });
            }
        }

        return features;
    });

    readonly feats = computed(() => {
        const char = this.character();
        const state = this.persistedBuilderState();
        if (!char) {
            return [] as Array<{ name: string; description: string }>;
        }

        const featItems: Array<{ name: string; description: string }> = [];
        const allLevels = classLevelOneFeatures[char.className] ?? [];
        const speciesSourceLabel = char.race?.trim() || 'Species';
        const backgroundSourceLabel = char.background?.trim() || 'Background';
        const addFeatItem = (name: string, sourceLabel: string, followUpLines: string[] = []) => {
            const trimmedName = this.normalizeFeatureDisplayName(name);
            const lookupKey = this.normalizeFeatureLookupKey(trimmedName);
            if (!trimmedName || featItems.some((entry) => this.normalizeFeatureLookupKey(entry.name) === lookupKey)) {
                return;
            }

            if (trimmedName === 'Ability Score Improvement') {
                return;
            }

            const featEntry = this.featCatalogByName.get(lookupKey);
            if (!featEntry) {
                return;
            }

            const descriptionLines = [
                `From ${sourceLabel}`,
                featEntry.abilityScoreIncrease ? `Feat benefit: Ability Score Increase. ${featEntry.abilityScoreIncrease}` : '',
                ...(featEntry.features?.map((entry) => `${entry.title}. ${entry.text}`) ?? []),
                (!featEntry.features?.length && featEntry.benefit ? featEntry.benefit : ''),
                ...followUpLines
            ].filter((line) => !!line);

            featItems.push({
                name: featEntry.name,
                description: descriptionLines.join('\n')
            });
        };

        for (const levelGroup of allLevels) {
            if (levelGroup.level > char.level) {
                continue;
            }

            for (const feature of levelGroup.features) {
                if (feature.name !== 'Ability Score Improvement' && feature.name !== 'Epic Boon') {
                    continue;
                }

                const selectedValues = this.getPersistedFeatureSelections(state, char.className, feature.level, feature.name);
                for (const selectedValue of selectedValues) {
                    const followUpLines = this.getPersistedFeatFollowUpSummary(state, char.className, feature.level, feature.name);

                    if (selectedValue === 'Ability Score Improvement') {
                        const asiSummary = this.getPersistedAbilityScoreImprovementSummary(state, char.className, feature.level, feature.name)
                            || 'Increase one ability score by 2, or increase two ability scores by 1.';

                        addFeatItem('Ability Score Improvement', char.className, [asiSummary]);
                        continue;
                    }

                    addFeatItem(selectedValue, char.className, followUpLines);
                }
            }
        }

        const choiceEntries = [
            ...this.getFlattenedChoiceValues(state?.selectedSpeciesTraitChoices ?? {}).map((value) => ({ value, sourceLabel: speciesSourceLabel })),
            ...Object.values(state?.backgroundChoiceSelections ?? {})
                .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
                .map((value) => ({ value, sourceLabel: backgroundSourceLabel }))
        ];

        for (const choiceEntry of choiceEntries) {
            addFeatItem(choiceEntry.value, choiceEntry.sourceLabel);
        }

        for (const classFeatureName of char.classFeatures ?? []) {
            addFeatItem(classFeatureName, char.className);
        }

        for (const traitName of [...(char.traits ?? []), ...(char.speciesTraits ?? [])]) {
            addFeatItem(traitName, speciesSourceLabel);
        }

        return featItems;
    });

    readonly speciesTraits = computed<SpeciesTraitEntry[]>(() => {
        const char = this.character();
        if (!char) {
            return [];
        }

        const speciesInfo = getSpeciesInfo(char.race, speciesInfoMap);
        const speciesDetails = speciesInfo?.speciesDetails;
        const baseTraits = [...(char.traits ?? [])];
        const persistedChoiceMap = this.persistedBuilderState()?.selectedSpeciesTraitChoices ?? {};
        const premadeChoiceMap = this.getPremadeCharacter(char)?.speciesTraitChoices ?? {};
        const choiceMap = Object.keys(persistedChoiceMap).length > 0 ? persistedChoiceMap : premadeChoiceMap;
        const entries: SpeciesTraitEntry[] = [];
        const seen = new Set<string>();

        const appendChoiceDetails = (traitTitle: string, lines: string[]): string[] => {
            const selected = (choiceMap[traitTitle] ?? []).filter((value) => value && value.trim().length > 0);
            if (selected.length > 0) {
                lines.push(`Chosen: ${selected.join(', ')}`);
            }

            return lines;
        };

        const addEntry = (name: string, description: string, detailDescription: string): void => {
            const normalizedName = this.normalizeFeatureLookupKey(name);
            if (!normalizedName || seen.has(normalizedName)) {
                return;
            }

            seen.add(normalizedName);
            entries.push({
                name: this.normalizeFeatureDisplayName(name),
                description: description.trim(),
                detailDescription: detailDescription.trim() || description.trim()
            });
        };

        for (const trait of speciesDetails?.coreTraits ?? []) {
            const detailLines = appendChoiceDetails(trait.label, [trait.value]);
            addEntry(trait.label, trait.value, detailLines.join('\n'));
        }

        for (const note of speciesDetails?.traitNotes ?? []) {
            const detailLines = appendChoiceDetails(note.title, [note.summary, note.details].filter((line): line is string => Boolean(line)));
            addEntry(note.title, note.summary || note.details || '', detailLines.join('\n'));
        }

        for (const trait of baseTraits) {
            const separator = trait.indexOf(':');
            const traitTitle = separator >= 0 ? trait.slice(0, separator).trim() : trait.trim();
            const traitText = separator >= 0 ? trait.slice(separator + 1).trim() : '';
            const detailLines = appendChoiceDetails(traitTitle, [traitText].filter((line) => !!line));
            addEntry(traitTitle, traitText, detailLines.join('\n'));
        }

        return entries;
    });

    getLimitedUseEntryForFeature(featureName: string): LimitedUseEntry | null {
        return this.limitedUseEntries().find((entry) => entry.name === featureName) ?? null;
    }

    private normalizeFeatureDisplayName(featureName: string | null | undefined): string {
        return (featureName ?? '')
            .replace(/^(?:level\s*)?\d+\s*:\s*/i, '')
            .trim();
    }

    private normalizeFeatureLookupKey(featureName: string | null | undefined): string {
        return this.normalizeFeatureDisplayName(featureName).toLowerCase();
    }

    private getPersistedFeatureSelectionKey(className: string, level: number, featureName: string): string {
        return `${className}:${level}:${featureName}`;
    }

    private getSubclassConfig(className: string) {
        return subclassConfigs[className] ?? null;
    }

    private isSubclassSelectorFeature(className: string, featureName: string): boolean {
        const config = this.getSubclassConfig(className);
        return !!config && config.selectorFeatureName === featureName;
    }

    private isSubclassPlaceholderFeature(className: string, featureName: string): boolean {
        const config = this.getSubclassConfig(className);
        return !!config && config.placeholderFeatureNames.includes(featureName);
    }

    private getSelectedSubclassNameForCharacter(className: string, characterLevel: number): string {
        const state = this.persistedBuilderState();
        const config = this.getSubclassConfig(className);

        if (config) {
            const selected = this.getPersistedFeatureSelections(state, className, config.selectorLevel, config.selectorFeatureName)[0]?.trim() ?? '';
            if (selected) {
                return selected;
            }
        }

        const knownFeatureNames = new Set((this.character()?.classFeatures ?? [])
            .map((feature) => feature.trim().toLowerCase())
            .filter((feature) => feature.length > 0));

        if (knownFeatureNames.size === 0) {
            return '';
        }

        let bestMatch = '';
        let bestScore = 0;
        let hasTie = false;
        const progressionBySubclass = subclassFeatureProgressionByClass[className] ?? {};

        for (const [subclassName, progression] of Object.entries(progressionBySubclass)) {
            let score = 0;

            for (const [levelText, detailOrList] of Object.entries(progression)) {
                const level = Number(levelText);
                if (!Number.isFinite(level) || level > characterLevel) {
                    continue;
                }

                const details = Array.isArray(detailOrList) ? detailOrList : [detailOrList];
                for (const detail of details) {
                    if (knownFeatureNames.has(detail.name.trim().toLowerCase())) {
                        score += 1;
                    }
                }
            }

            if (score > bestScore) {
                bestMatch = subclassName;
                bestScore = score;
                hasTie = false;
            } else if (score > 0 && score === bestScore) {
                hasTie = true;
            }
        }

        return bestScore > 0 && !hasTie ? bestMatch : '';
    }

    private getSubclassFeatureEntriesForLevel(className: string, subclassName: string, level: number): FeatureListEntry[] {
        const detailOrList = subclassFeatureProgressionByClass[className]?.[subclassName]?.[level];
        if (!detailOrList) {
            return [];
        }

        const details = Array.isArray(detailOrList) ? detailOrList : [detailOrList];
        return details.map((detail) => ({
            name: detail.name,
            level,
            description: detail.description,
            detailDescription: detail.description,
            summaryBadges: [subclassName]
        }));
    }

    private getClassFeatureSheetDescription(className: string, level: number, featureName: string, fallback: string): string {
        if (className === 'Barbarian' && featureName === 'Rage') {
            const rageUses = this.getClassProgressionValue(className, 'Rages', level);
            return `You can take a Bonus Action to enter Rage if you aren’t wearing Heavy Armor. You can use Rage ${rageUses} times per Long Rest and regain one expended use when you finish a Short Rest.`;
        }

        if (className === 'Barbarian' && featureName === 'Brutal Strike') {
            return 'When you use Reckless Attack, you can give up Advantage on one Strength-based attack. On a hit, it deals extra damage and applies one Brutal Strike effect of your choice.';
        }

        if (className === 'Barbarian' && featureName === 'Improved Brutal Strike') {
            return level >= 17
                ? 'Your Brutal Strike now deals extra 2d10 damage and you can apply two Brutal Strike effects to the same hit.'
                : 'You learn two additional Brutal Strike effects: Staggering Blow and Sundering Blow.';
        }

        if (className === 'Rogue' && featureName === 'Stroke of Luck') {
            return 'If you fail a D20 Test, you can turn the roll into a 20. Once you use this feature, you can’t use it again until you finish a Short or Long Rest.';
        }

        return fallback;
    }

    private getClassProgressionValue(className: string, label: string, level: number): string {
        const columns = classProgressionColumns[className] ?? [];
        const column = columns.find((entry) => entry.label === label);
        if (!column) {
            return '';
        }

        const index = Math.max(0, Math.min(column.values.length - 1, level - 1));
        return column.values[index] ?? '';
    }

    private getClassFeatureSummaryBadges(className: string, level: number, featureName: string): string[] {
        const badges: string[] = [];

        if (className === 'Barbarian' && featureName === 'Rage') {
            const rageUses = this.getClassProgressionValue(className, 'Rages', level);
            const rageDamage = this.getClassProgressionValue(className, 'Rage Damage', level);

            if (rageUses) {
                badges.push(`Max ${rageUses} uses`);
            }
            if (rageDamage) {
                badges.push(`Damage ${rageDamage}`);
            }
            badges.push('Duration 10 min');
        }

        if (className === 'Barbarian' && featureName === 'Weapon Mastery') {
            const masteryCount = this.getClassProgressionValue(className, 'Weapon Mastery', level);
            if (masteryCount) {
                badges.push(`${masteryCount} weapon types`);
            }
        }

        if (className === 'Barbarian' && featureName === 'Brutal Strike') {
            badges.push('Extra 1d10');
            badges.push('1 effect');
        }

        if (className === 'Barbarian' && featureName === 'Improved Brutal Strike' && level >= 17) {
            badges.push('Extra 2d10');
            badges.push('2 effects');
        }

        return badges;
    }

    private getClassFeatureDynamicDetails(className: string, level: number, featureName: string): string[] {
        const details: string[] = [];

        if (className === 'Barbarian' && featureName === 'Rage') {
            return details;
        }

        if (className === 'Barbarian' && featureName === 'Weapon Mastery') {
            const masteryCount = this.getClassProgressionValue(className, 'Weapon Mastery', level);
            if (masteryCount) {
                details.push(`Current mastered weapon types: ${masteryCount}.`);
            }
        }

        return details;
    }

    private getPersistedFeatureSelections(state: PersistedBuilderState | null, className: string, level: number, featureName: string): string[] {
        const selections = state?.classFeatureSelections ?? {};
        const keyedSelections = selections[this.getPersistedFeatureSelectionKey(className, level, featureName)] ?? [];
        return Array.isArray(keyedSelections)
            ? keyedSelections.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            : [];
    }

    private getPersistedAbilityScoreImprovementSummary(state: PersistedBuilderState | null, className: string, level: number, featureName: string): string {
        const choices = state?.abilityScoreImprovementChoices ?? {};
        const selectionKey = this.getPersistedFeatureSelectionKey(className, level, featureName);
        const choice = choices[selectionKey];

        if (!choice) {
            return '';
        }

        if (choice.mode === 'plus-two' && choice.primaryAbility) {
            return `Ability increase: +2 ${choice.primaryAbility}.`;
        }

        if (choice.mode === 'plus-one-plus-one' && choice.primaryAbility && choice.secondaryAbility) {
            return `Ability increase: +1 ${choice.primaryAbility}, +1 ${choice.secondaryAbility}.`;
        }

        return '';
    }

    private getPersistedFeatFollowUpSummary(state: PersistedBuilderState | null, className: string, level: number, featureName: string): string[] {
        const followUps = state?.featFollowUpChoices ?? {};
        const selectionKey = this.getPersistedFeatureSelectionKey(className, level, featureName);
        const followUp = followUps[selectionKey];
        if (!followUp) {
            return [];
        }

        const details: string[] = [];

        if (followUp.abilityIncreaseAbility?.trim()) {
            details.push(`Selected ability: ${followUp.abilityIncreaseAbility.trim()}.`);
        }

        if (followUp.weaponMasterWeapon?.trim()) {
            details.push(`Selected weapon: ${followUp.weaponMasterWeapon.trim()}.`);
        }

        if (followUp.grapplerAbility?.trim()) {
            details.push(`Chosen grappler ability: ${followUp.grapplerAbility.trim()}.`);
        }

        if (followUp.magicInitiateAbility?.trim()) {
            details.push(`Spellcasting ability: ${followUp.magicInitiateAbility.trim()}.`);
        }

        if (Array.isArray(followUp.skilledSelections) && followUp.skilledSelections.length > 0) {
            details.push(`Selections: ${followUp.skilledSelections.join(', ')}.`);
        }

        return details;
    }

    private getFlattenedChoiceValues(choiceMap: Record<string, string[]>): string[] {
        return Object.values(choiceMap)
            .flatMap((values) => values ?? [])
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    }

    getLimitedUseCheckboxIndexes(count: number): number[] {
        return Array.from({ length: Math.max(0, count) }, (_, index) => index);
    }

    onLimitedUseCheckboxChanged(entryId: string, boxIndex: number, checked: boolean): void {
        const currentCount = this.limitedUseCounts()[entryId] ?? 0;
        const nextCount = checked
            ? Math.max(currentCount, boxIndex + 1)
            : Math.min(currentCount, boxIndex);

        void this.saveLimitedUseCount(entryId, nextCount);
    }

    private async saveLimitedUseCount(entryId: string, nextCount: number): Promise<void> {
        const char = this.character();
        if (!char) {
            return;
        }

        const nextState = { ...this.limitedUseCounts() };
        if (nextCount > 0) {
            nextState[entryId] = Math.max(0, Math.trunc(nextCount));
        } else {
            delete nextState[entryId];
        }

        this.limitedUseCounts.set(nextState);

        const updatedState: PersistedBuilderState = {
            ...(this.persistedBuilderState() ?? {}),
            limitedUseCounts: nextState
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
            campaignId: char.campaignId
        });
    }

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
        const targetCampaignIds = this.selectedCampaignAssignments();

        if (!char || targetCampaignIds.length === 0 || this.isUpdatingCampaign()) {
            return;
        }

        this.isUpdatingCampaign.set(true);
        this.campaignUpdateError.set('');

        try {
            const didUpdate = await this.store.setCharacterCampaign(char.id, targetCampaignIds);
            if (!didUpdate) {
                this.campaignUpdateError.set('Unable to update campaign assignments right now.');
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

    onCampaignAssignmentChanged(values: string[]): void {
        this.selectedCampaignAssignments.set(values);
        this.campaignUpdateError.set('');
    }

    setCombatTab(tab: CombatTab): void {
        this.activeCombatTab.set(tab);
    }

    closeDetailDrawer(): void {
        this.activeDetailDrawer.set(null);
        this.detailSecondaryExpanded.set(false);
        this.rageDetailOption.set('activate-rage');
    }

    openShortRestPopup(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.closeDetailDrawer();
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.activeExtrasStatEntry.set(null);
        this.headerManageOpen.set(false);
        this.detailColorsExpanded.set(false);
        this.resetShortRestPopup();
        this.activeRestPopup.set('short');
    }

    openLongRestPopup(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.closeDetailDrawer();
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.activeExtrasStatEntry.set(null);
        this.headerManageOpen.set(false);
        this.detailColorsExpanded.set(false);
        this.resetLongRestPopup();
        this.activeRestPopup.set('long');
    }

    closeRestPopup(): void {
        this.activeRestPopup.set(null);
        this.restPopupError.set('');
        this.restPopupResult.set('');
    }

    resetShortRestPopup(): void {
        this.shortRestResetMaxHp.set(false);
        this.shortRestAutoHeal.set(true);
        this.shortRestUsedHitDieSlots.set(this.getSpentHitDieIndexes());
        this.restPopupError.set('');
        this.restPopupResult.set('');
    }

    resetLongRestPopup(): void {
        this.longRestRule.set('recover-half');
        this.longRestResetMaxHp.set(true);
        this.restPopupError.set('');
        this.restPopupResult.set('');
    }

    toggleShortRestHitDie(index: number): void {
        const spentCount = this.getUsedHitDiceCount();
        if (index < spentCount) {
            this.shortRestUsedHitDieSlots.set(this.getSpentHitDieIndexes());
            return;
        }

        this.shortRestUsedHitDieSlots.set(Array.from({ length: Math.max(index + 1, 0) }, (_, currentIndex) => currentIndex));
    }

    onShortRestResetMaxHpChanged(checked: boolean): void {
        this.shortRestResetMaxHp.set(checked);
    }

    onShortRestAutoHealChanged(checked: boolean): void {
        this.shortRestAutoHeal.set(checked);
    }

    onLongRestRuleChanged(rule: 'recover-half' | 'recover-all'): void {
        this.longRestRule.set(rule);
    }

    onLongRestResetMaxHpChanged(checked: boolean): void {
        this.longRestResetMaxHp.set(checked);
    }

    async takeShortRest(): Promise<void> {
        const initialCharacter = this.character();
        if (!initialCharacter?.canEdit || this.isApplyingRest()) {
            return;
        }

        const selectedHitDice = this.shortRestUsedHitDieSlots();
        const spentCount = this.getUsedHitDiceCount();
        const additionalHitDiceCount = Math.max(0, selectedHitDice.length - spentCount);
        if (additionalHitDiceCount === 0) {
            this.restPopupError.set('Select at least one unused Hit Die to spend.');
            this.restPopupResult.set('');
            return;
        }

        this.isApplyingRest.set(true);
        this.restPopupError.set('');
        this.restPopupResult.set('');

        try {
            const hitDie = this.getRestHitDie();
            const conModifier = this.getAbilityModifier(this.effectiveAbilityScores()?.constitution ?? 10);
            const rolls = Array.from({ length: additionalHitDiceCount }, () => Math.floor(Math.random() * hitDie) + 1);
            const healingTotal = rolls.reduce((total, roll) => total + Math.max(0, roll + conModifier), 0);
            const nextUsedHitDiceCount = spentCount + additionalHitDiceCount;

            if (this.shortRestResetMaxHp()) {
                await this.persistHpOverrideState(null);
                this.appliedMaxHpOverride.set(null);
            }

            const currentCharacter = this.character();
            if (!currentCharacter) {
                this.restPopupError.set('Unable to load the updated character right now.');
                return;
            }

            if (!this.shortRestAutoHeal()) {
                const didPersistUsedDice = await this.persistUsedHitDiceCount(nextUsedHitDiceCount);
                if (!didPersistUsedDice) {
                    this.restPopupError.set('Unable to save spent Hit Dice right now.');
                    return;
                }

                this.restPopupResult.set(`Rolled ${rolls.join(', ')} for ${healingTotal} total healing.`);
                return;
            }

            const resolvedMax = currentCharacter.maxHitPoints;
            const nextCurrent = Math.min(resolvedMax, Math.max(0, currentCharacter.hitPoints) + healingTotal);

            await this.persistShortRestHealing(nextCurrent, nextUsedHitDiceCount);

            this.closeRestPopup();
        } catch {
            this.restPopupError.set('Unable to complete a short rest right now.');
        } finally {
            this.isApplyingRest.set(false);
            this.cdr.detectChanges();
        }
    }

    async takeLongRest(): Promise<void> {
        const initialCharacter = this.character();
        if (!initialCharacter?.canEdit || this.isApplyingRest()) {
            return;
        }

        if (initialCharacter.hitPoints < 1) {
            this.restPopupError.set('You must have at least 1 HP to start a long rest.');
            return;
        }

        this.isApplyingRest.set(true);
        this.restPopupError.set('');
        this.restPopupResult.set('');

        try {
            if (this.saveSpellSlotTimeout) {
                clearTimeout(this.saveSpellSlotTimeout);
                this.saveSpellSlotTimeout = null;
            }

            if (this.longRestResetMaxHp()) {
                await this.persistHpOverrideState(null);
                this.appliedMaxHpOverride.set(null);
            }

            const currentCharacter = this.character();
            if (!currentCharacter) {
                this.restPopupError.set('Unable to load the updated character right now.');
                return;
            }

            const nextUsedHitDiceCount = this.getNextLongRestUsedHitDiceCount();
            const nextExhaustionLevel = Math.max(0, this.exhaustionLevel() - 1);
            const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
            const updatedState: PersistedBuilderState = {
                ...currentState,
                usedSpellSlotsByLevel: {},
                limitedUseCounts: {},
                usedHitDiceCount: nextUsedHitDiceCount,
                exhaustionLevel: normalizeExhaustionLevel(nextExhaustionLevel),
                deathSaveFailures: 0,
                deathSaveSuccesses: 0
            };

            delete updatedState.tempHitPoints;
            if (this.longRestResetMaxHp()) {
                delete updatedState.hpMaxOverride;
            }

            const updatedNotes = this.createPersistedNotesString(currentCharacter.notes ?? '', updatedState);
            const updated = await this.store.updateCharacter(this.characterId, {
                name: currentCharacter.name,
                playerName: currentCharacter.playerName,
                race: currentCharacter.race,
                className: currentCharacter.className,
                role: currentCharacter.role,
                level: currentCharacter.level,
                background: currentCharacter.background,
                notes: updatedNotes,
                campaignId: currentCharacter.campaignId,
                hitPoints: currentCharacter.maxHitPoints,
                maxHitPoints: currentCharacter.maxHitPoints,
                deathSaveFailures: 0,
                deathSaveSuccesses: 0
            });

            if (!updated) {
                this.restPopupError.set('Unable to complete a long rest right now.');
                return;
            }

            this.usedSpellSlotsByLevel.set({});
            this.limitedUseCounts.set({});
            this.shortRestUsedHitDieSlots.set(Array.from({ length: nextUsedHitDiceCount }, (_, index) => index));
            this.tempHitPoints.set(0);
            this.hpDraftTemp.set(0);
            this.hpDraftCurrent.set(updated.hitPoints);
            this.hpDraftMax.set(updated.maxHitPoints);
            this.hpDraftDeathSaveFailures.set(0);
            this.hpDraftDeathSaveSuccesses.set(0);
            this.optimisticExhaustionLevel.set(null);

            this.closeRestPopup();
        } catch {
            this.restPopupError.set('Unable to complete a long rest right now.');
        } finally {
            this.isApplyingRest.set(false);
            this.cdr.detectChanges();
        }
    }

    getRestHitDie(): number {
        const char = this.character();
        if (!char) {
            return 8;
        }

        return this.hitDieByClass[char.className] ?? 8;
    }

    getRestHitDieIndexes(): number[] {
        const char = this.character();
        return Array.from({ length: Math.max(char?.level ?? 0, 0) }, (_, index) => index);
    }

    getUsedHitDiceCount(): number {
        const char = this.character();
        const level = Math.max(char?.level ?? 0, 0);
        const persisted = this.persistedBuilderState()?.usedHitDiceCount;
        if (typeof persisted !== 'number' || !Number.isFinite(persisted)) {
            return 0;
        }

        return Math.max(0, Math.min(level, Math.trunc(persisted)));
    }

    getSpentHitDieIndexes(): number[] {
        return Array.from({ length: this.getUsedHitDiceCount() }, (_, index) => index);
    }

    getShortRestAdditionalHitDiceCount(): number {
        return Math.max(0, this.shortRestUsedHitDieSlots().length - this.getUsedHitDiceCount());
    }

    getShortRestPreviewFormula(): string {
        const additionalHitDiceCount = this.getShortRestAdditionalHitDiceCount();
        if (additionalHitDiceCount <= 0) {
            return '';
        }

        const hitDie = this.getRestHitDie();
        const conModifier = this.getAbilityModifier(this.effectiveAbilityScores()?.constitution ?? 10);
        const totalModifier = conModifier * additionalHitDiceCount;

        if (totalModifier > 0) {
            return `${additionalHitDiceCount}d${hitDie}+${totalModifier}`;
        }

        if (totalModifier < 0) {
            return `${additionalHitDiceCount}d${hitDie}${totalModifier}`;
        }

        return `${additionalHitDiceCount}d${hitDie}`;
    }

    getLongRestRecoverableHitDice(): number {
        const char = this.character();
        const level = Math.max(char?.level ?? 1, 1);
        return Math.max(1, Math.floor(level / 2));
    }

    getLongRestHitDiceRecoveryText(): string {
        const char = this.character();
        const level = Math.max(char?.level ?? 1, 1);

        if (this.longRestRule() === 'recover-all') {
            return 'Recover all spent Hit Dice.';
        }

        return `Recover up to ${this.getLongRestRecoverableHitDice()} of ${level} total Hit Dice.`;
    }

    getNextLongRestUsedHitDiceCount(): number {
        const usedHitDiceCount = this.getUsedHitDiceCount();
        if (this.longRestRule() === 'recover-all') {
            return 0;
        }

        return Math.max(0, usedHitDiceCount - this.getLongRestRecoverableHitDice());
    }

    toggleDetailSecondary(): void {
        this.detailSecondaryExpanded.update((value) => !value);
    }

    private openDetailDrawer(content: DetailDrawerContent): void {
        this.requestCloseChat();
        this.hpManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.activeExtrasStatEntry.set(null);
        this.detailSecondaryExpanded.set(content.variant === 'rage-feature' ? false : true);
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
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.hpDraftCurrent.set(char.hitPoints);
        this.hpDraftMax.set(char.maxHitPoints);
        this.hpDraftTemp.set(this.tempHitPoints());
        this.hpDraftDeathSaveFailures.set(this.deathSaveFailures());
        this.hpDraftDeathSaveSuccesses.set(this.deathSaveSuccesses());
        this.hpRestoreChoice.set(null);
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

    selectHpRestoreChoice(choice: 'full' | 'one'): void {
        this.hpRestoreChoice.set(choice);
    }

    resetHpRestoreChoice(): void {
        this.hpRestoreChoice.set(null);
    }

    async confirmHpRestore(): Promise<void> {
        const choice = this.hpRestoreChoice();
        if (choice === 'full') {
            await this.restoreLifeWithFullHp();
            return;
        }

        if (choice === 'one') {
            await this.restoreLifeWithOneHp();
        }
    }

    async restoreLifeWithFullHp(): Promise<void> {
        await this.restoreLife(this.hpResolvedMax());
    }

    async restoreLifeWithOneHp(): Promise<void> {
        await this.restoreLife(1);
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

    private async persistShortRestHealing(nextCurrent: number, nextUsedHitDiceCount: number): Promise<void> {
        const char = this.character();
        if (!char || this.isSavingHp()) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = {
            ...currentState,
            usedHitDiceCount: nextUsedHitDiceCount
        };
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        this.isSavingHp.set(true);
        this.hpDraftCurrent.set(nextCurrent);
        this.hpDraftDeathSaveFailures.set(0);
        this.hpDraftDeathSaveSuccesses.set(0);
        this.shortRestUsedHitDieSlots.set(Array.from({ length: nextUsedHitDiceCount }, (_, index) => index));

        try {
            const updated = await this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: updatedNotes,
                campaignId: char.campaignId,
                hitPoints: nextCurrent,
                maxHitPoints: char.maxHitPoints,
                deathSaveFailures: 0,
                deathSaveSuccesses: 0
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

    private async persistUsedHitDiceCount(nextUsedHitDiceCount: number): Promise<boolean> {
        const char = this.character();
        if (!char) {
            return false;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = {
            ...currentState,
            usedHitDiceCount: nextUsedHitDiceCount
        };
        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        const updated = await this.store.updateCharacter(this.characterId, {
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

        if (!updated) {
            return false;
        }

        this.shortRestUsedHitDieSlots.set(Array.from({ length: nextUsedHitDiceCount }, (_, index) => index));
        return true;
    }

    private async restoreLife(nextCurrent: number): Promise<void> {
        const char = this.character();
        if (!char || this.isSavingHp()) {
            return;
        }

        const restoredHp = Math.max(1, Math.min(this.hpResolvedMax(), nextCurrent));
        const nextExhaustionLevel = this.isExhaustionDeath() ? 5 : this.exhaustionLevel();
        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = {
            ...currentState,
            exhaustionLevel: normalizeExhaustionLevel(nextExhaustionLevel)
        };

        const updatedNotes = this.createPersistedNotesString(char.notes ?? '', updatedState);

        this.isSavingHp.set(true);
        this.hpDraftCurrent.set(restoredHp);
        this.hpDraftDeathSaveFailures.set(0);
        this.hpDraftDeathSaveSuccesses.set(0);

        try {
            const updated = await this.store.updateCharacter(this.characterId, {
                name: char.name,
                playerName: char.playerName,
                race: char.race,
                className: char.className,
                role: char.role,
                level: char.level,
                background: char.background,
                notes: updatedNotes,
                campaignId: char.campaignId,
                hitPoints: restoredHp,
                maxHitPoints: char.maxHitPoints,
                deathSaveFailures: 0,
                deathSaveSuccesses: 0
            });

            if (updated) {
                this.hpDraftCurrent.set(updated.hitPoints);
                this.hpDraftMax.set(updated.maxHitPoints);
            }

            this.hpRestoreChoice.set(null);
            this.optimisticExhaustionLevel.set(null);
        } finally {
            this.isSavingHp.set(false);
            this.cdr.detectChanges();
        }
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

    private readStoredDetailBackgroundImageUrl(characterId: string): string {
        try {
            return globalThis.localStorage?.getItem(`dungeonkeep-detail-background:${characterId}`)?.trim() ?? '';
        } catch {
            return '';
        }
    }

    private async persistDetailSectionColors(update: {
        detailSectionPanelColor?: string | null;
        detailSectionCardColor?: string | null;
        detailTextColor?: string | null;
        detailBorderColor?: string | null;
        detailSectionPanelAlpha?: number | null;
        detailSectionCardAlpha?: number | null;
        detailTextAlpha?: number | null;
        detailBorderAlpha?: number | null;
    }): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState };

        if (Object.prototype.hasOwnProperty.call(update, 'detailSectionPanelColor')) {
            if (update.detailSectionPanelColor) {
                updatedState.detailSectionPanelColor = update.detailSectionPanelColor;
            } else {
                delete updatedState.detailSectionPanelColor;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailSectionCardColor')) {
            if (update.detailSectionCardColor) {
                updatedState.detailSectionCardColor = update.detailSectionCardColor;
            } else {
                delete updatedState.detailSectionCardColor;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailTextColor')) {
            if (update.detailTextColor) {
                updatedState.detailTextColor = update.detailTextColor;
            } else {
                delete updatedState.detailTextColor;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailBorderColor')) {
            if (update.detailBorderColor) {
                updatedState.detailBorderColor = update.detailBorderColor;
            } else {
                delete updatedState.detailBorderColor;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailSectionPanelAlpha')) {
            if (typeof update.detailSectionPanelAlpha === 'number' && Number.isFinite(update.detailSectionPanelAlpha)) {
                updatedState.detailSectionPanelAlpha = this.normalizeDetailAlpha(update.detailSectionPanelAlpha);
            } else {
                delete updatedState.detailSectionPanelAlpha;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailSectionCardAlpha')) {
            if (typeof update.detailSectionCardAlpha === 'number' && Number.isFinite(update.detailSectionCardAlpha)) {
                updatedState.detailSectionCardAlpha = this.normalizeDetailAlpha(update.detailSectionCardAlpha);
            } else {
                delete updatedState.detailSectionCardAlpha;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailTextAlpha')) {
            if (typeof update.detailTextAlpha === 'number' && Number.isFinite(update.detailTextAlpha)) {
                updatedState.detailTextAlpha = this.normalizeDetailAlpha(update.detailTextAlpha);
            } else {
                delete updatedState.detailTextAlpha;
            }
        }

        if (Object.prototype.hasOwnProperty.call(update, 'detailBorderAlpha')) {
            if (typeof update.detailBorderAlpha === 'number' && Number.isFinite(update.detailBorderAlpha)) {
                updatedState.detailBorderAlpha = this.normalizeDetailAlpha(update.detailBorderAlpha);
            } else {
                delete updatedState.detailBorderAlpha;
            }
        }

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
                maxHitPoints: char.maxHitPoints,
                image: char.image,
                detailBackgroundImageUrl: char.detailBackgroundImageUrl
            });
        } finally {
            this.cdr.detectChanges();
        }
    }

    private storeDetailBackgroundImageUrl(characterId: string, imageUrl: string): void {
        const trimmed = imageUrl.trim();
        this.detailBackgroundCachedImageUrl.set(trimmed);

        try {
            if (!trimmed) {
                globalThis.localStorage?.removeItem(`dungeonkeep-detail-background:${characterId}`);
            } else {
                globalThis.localStorage?.setItem(`dungeonkeep-detail-background:${characterId}`, trimmed);
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

    openSkillDetail(skill: { name: string; ability: string; modifierLabel: string; proficient: boolean; expertise?: boolean; hasDisadvantage?: boolean; disadvantageReason?: string | null }): void {
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
        if (skill.expertise) {
            proficiencyNotes.push('Expertise applies: this skill adds double your proficiency bonus.');
        } else if (skill.proficient) {
            proficiencyNotes.push('You add your normal proficiency bonus to checks with this skill.');
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
            subtitle: `${skill.ability} Skill • ${skill.modifierLabel}${skill.expertise ? ' (Expertise)' : skill.proficient ? ' (Proficient)' : ''}${skill.hasDisadvantage ? ' • Disadvantage' : ''}`,
            description: info.description,
            bullets: [...statusBullets, ...info.usedFor, ...referenceBullets]
        });
    }

    openArmorClassDetail(_value: number): void {
        this.openDetailDrawer({ ...this.buildArmorClassDrawerContent(), key: 'armor-class' });
    }

    private buildArmorClassDrawerContent(): DetailDrawerContent {
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
        const secondary = !armorName ? this.getUnarmoredSecondaryMod() : null;
        const secondaryMod = secondary?.mod ?? 0;
        const totalAc = armorBase + dexterityApplied + shieldBonus + secondaryMod;
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

        if (secondary) {
            lineItems.push({ value: this.formatSigned(secondary.mod), label: secondary.label });
        }

        if (hasShield) {
            lineItems.push({ value: '+2', label: 'Shield Bonus' });
        }

        return {
            title: `Armor Class: ${totalAc}`,
            subtitle: 'Defense Breakdown',
            lineItems,
            description: 'Your Armor Class (AC) represents how well your character avoids being wounded in battle. Things that contribute to your AC include the armor you wear, the shield you carry, and your Dexterity modifier. Without armor or a shield, your AC equals 10 + your Dexterity modifier.',
            bullets: armorWarnings
        };
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

    private getDerivedWeaponCombatContext(name: string): { subtitle?: string; range?: string; hitDcLabel?: string; damage?: string } | null {
        const normalizedName = name.trim().toLowerCase();
        return this.weaponCombatRows().find((row) => row.name.trim().toLowerCase() === normalizedName) ?? null;
    }

    private openWeaponDetail(
        item: { name: string; category: string; quantity: number; weight?: number; costGp?: number; notes?: string },
        combatContext?: { subtitle?: string; range?: string; hitDcLabel?: string; damage?: string }
    ): void {
        const catalogItem = this.getCatalogItemByName(item.name);
        const resolvedCombatContext = {
            ...(this.getDerivedWeaponCombatContext(item.name) ?? {}),
            ...(combatContext ?? {})
        };
        const summaryText = catalogItem?.summary?.trim() || item.notes?.trim() || catalogItem?.notes?.trim() || 'Tracked weapon details.';
        const rulesText = this.inventoryItemRulesText(item, summaryText, catalogItem?.notes?.trim());
        const highlights = this.inventoryItemHighlights(catalogItem?.detailLines, summaryText, catalogItem?.sourceLabel, catalogItem?.rarity, catalogItem?.attunement);
        const profileTags = [catalogItem?.rarity?.trim(), catalogItem?.attunement?.trim(), catalogItem?.sourceLabel?.trim()]
            .filter((value): value is string => Boolean(value));

        const facts: Array<{ label: string; value?: string; linkLabel?: string; linkUrl?: string }> = [
            { label: 'Range', value: resolvedCombatContext.range || this.getWeaponRangeLabel(item.name, catalogItem) },
            ...(resolvedCombatContext.hitDcLabel ? [{ label: 'Hit / DC', value: resolvedCombatContext.hitDcLabel }] : []),
            ...(resolvedCombatContext.damage ? [{ label: 'Damage', value: resolvedCombatContext.damage }] : []),
            { label: 'Quantity', value: `${item.quantity}` },
            { label: 'Weight', value: item.weight != null ? `${item.weight} lb.` : (catalogItem?.weight != null ? `${catalogItem.weight} lb.` : '—') },
            { label: 'Cost', value: item.costGp != null ? `${item.costGp} gp` : (catalogItem?.costGp != null ? `${catalogItem.costGp} gp` : '—') },
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
            subtitle: resolvedCombatContext.subtitle || item.category,
            description: summaryText,
            bullets: highlights,
            variant: 'inventory-item',
            metaLine: `Reference • ${item.category.toLowerCase()}`,
            profileTags: profileTags.length > 0 ? profileTags : [item.category],
            facts,
            rulesText
        });
    }

    openActionDetail(action: { name: string; subtitle?: string; range?: string; hitDcLabel?: string; damage?: string; notes?: string }): void {
        const catalogItem = this.getCatalogItemByName(action.name);
        const isWeaponAction = (action.subtitle ?? '').toLowerCase().includes('weapon') || this.isWeaponCategory(catalogItem?.category);

        if (isWeaponAction) {
            this.openWeaponDetail({
                name: action.name,
                category: catalogItem?.category?.trim() || 'Weapon',
                quantity: 1,
                weight: catalogItem?.weight,
                costGp: catalogItem?.costGp,
                notes: action.notes
            }, action);
            return;
        }

        const actionReference = COMBAT_ACTION_DETAILS[action.name.trim().toLowerCase()];
        const resolvedSubtitle = action.subtitle?.trim() || 'Action Detail';
        const bullets = [
            ...(actionReference?.bullets ?? []),
            action.range ? `Range: ${action.range}` : '',
            action.hitDcLabel ? `Hit / DC: ${action.hitDcLabel}` : '',
            action.damage ? `Damage / Effect: ${action.damage}` : '',
            !actionReference && action.notes ? `Notes: ${action.notes}` : ''
        ].filter((entry) => entry.length > 0);

        this.openDetailDrawer({
            title: action.name,
            subtitle: resolvedSubtitle,
            description: actionReference?.description || action.notes || 'Detailed context for this combat option.',
            bullets,
            metaLine: `Combat • ${resolvedSubtitle.toLowerCase()}`,
            profileTags: [resolvedSubtitle],
            rulesText: actionReference?.rulesText || (!actionReference ? action.notes ?? null : null)
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
        if (this.isWeaponCategory(item.category)) {
            this.openWeaponDetail(item);
            return;
        }

        const catalogItem = this.getCatalogItemByName(item.name);
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
        item: { name?: string; category?: string; notes?: string },
        summaryText: string,
        catalogNotes?: string
    ): string | null {
        const notes = this.isWeaponCategory(item.category)
            ? (catalogNotes?.trim() || item.notes?.trim())
            : (item.notes?.trim() || catalogNotes);
        if (!notes) {
            return null;
        }

        if (this.isWeaponCategory(item.category)) {
            return this.getWeaponPopupFooterText(summaryText, notes);
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

    openFeatureDetail(name: string, description: string, category: string, level?: number): void {
        const className = this.character()?.className ?? category;

        const customDetail = this.getCustomFeatureDetail(name, description, category, className, level);
        if (customDetail) {
            this.openDetailDrawer(customDetail);
            return;
        }

        this.openDetailDrawer({
            title: name,
            subtitle: category === 'Class Feature' ? className : category,
            description,
            bullets: [
                'This feature can modify combat, exploration, or roleplay options.',
                'Review trigger conditions and action economy when using it.',
                'Check class/species progression for scaling details.'
            ]
        });
    }

    private readonly backgroundRowHandlers: Readonly<Record<string, (value: string) => void>> = {
        Name: (value) => this.openBackgroundNameDetail(value),
        Race: (value) => this.openBackgroundRaceDetail(value),
        Background: (value) => this.openBackgroundBackgroundDetail(value),
        'Class & Level': (value) => this.openBackgroundClassLevelDetail(value),
        Alignment: (value) => this.openBackgroundAlignmentDetail(value),
        Lifestyle: (value) => this.openBackgroundLifestyleDetail(value),
        Faith: (value) => this.openBackgroundFaithDetail(value),
        Experience: (value) => this.openBackgroundExperienceDetail(value),
        Age: (value) => this.openBackgroundAgeDetail(value),
        Height: (value) => this.openBackgroundHeightDetail(value),
        Weight: (value) => this.openBackgroundWeightDetail(value)
    };

    openBackgroundRowDetail(label: string, value: string): void {
        if (!this.character()) {
            return;
        }

        if (label === 'Gender' || label === 'Hair' || label === 'Eyes' || label === 'Skin') {
            this.openBackgroundAppearanceDetail(label, value);
            return;
        }

        this.backgroundRowHandlers[label]?.(value);
    }

    private openBackgroundNameDetail(value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.openDetailDrawer(buildNameDetail(value, char.className, this.displayBackground(), char.race));
    }

    private openBackgroundRaceDetail(value: string): void {
        const race = this.raceLookup.get(value.toLowerCase());
        const speciesInfo = getSpeciesInfo(value, speciesInfoMap);
        const speciesLore = getSpeciesLore(value, SPECIES_LORE_DETAILS, speciesInfoMap);
        const description = speciesLore?.history ?? speciesInfo?.summary ?? race?.description ?? 'A unique species with its own history, culture, and traits.';
        const lineItems = [
            ...(speciesInfo?.speciesDetails?.coreTraits ?? []).map((item: { value: string; label: string }) => ({ value: item.value, label: item.label }))
        ];
        const bullets = [
            ...(speciesInfo?.speciesDetails?.traitNotes?.map((item: { title: string; summary: string }) => `${item.title}: ${item.summary}`)
                ?? speciesLore?.bullets
                ?? race?.traits
                ?? []),
            ...(speciesLore
                ? [
                    `Adulthood: ${speciesLore.adulthood}`,
                    `Lifespan: ${speciesLore.lifespan}`
                ]
                : [])
        ];
        this.openDetailDrawer(buildRaceDetail(value, description, lineItems, bullets));
    }

    private openBackgroundBackgroundDetail(value: string): void {
        const key = value.trim();
        const backgroundDetail = backgroundDetailOverrides[key];
        const description = key === 'Sage'
            ? 'You spent years learning the lore of the multiverse, studying manuscripts, scrolls, and expert teachers until deep research became part of your identity.'
            : backgroundDetail?.description ?? backgroundDescriptionFallbacks[key] ?? 'A background that shaped who your character was before adventuring.';
        const skills = backgroundDetail?.skillProficiencies ?? backgroundSkillProficienciesFallbacks[key] ?? 'Not recorded';
        const tools = backgroundDetail?.toolProficiencies ?? backgroundToolProficienciesFallbacks[key] ?? 'Not recorded';
        const languages = backgroundDetail?.languages ?? backgroundLanguagesFallbacks[key] ?? 'Not recorded';
        const bullets = key === 'Sage'
            ? [
                'Researcher: if you do not know a piece of lore, you often know where or from whom it can be learned.',
                'Typical specialties include alchemy, astronomy, history, religion, magic theory, and other deep academic fields.',
                'Sages are often driven by knowledge, mystery, scholarship, and the preservation of dangerous or valuable truths.'
            ]
            : (backgroundDetail?.choices ?? []).map((choice) => `${choice.title}: ${choice.description ?? choice.options.slice(0, 3).join(', ')}`);
        this.openDetailDrawer(buildBackgroundEntryDetail(key, description, skills, tools, languages, bullets));
    }

    private openBackgroundClassLevelDetail(_value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        const className = char.className;
        const classKey = Object.keys(classLevelOneFeatures).find((k) => k.toLowerCase() === className.toLowerCase());
        const levelEntries = classKey ? classLevelOneFeatures[classKey] : undefined;
        const levelOneFeatures = levelEntries?.find((e) => e.level === 1)?.features ?? [];
        const classInfo = Object.entries(classInfoMap).find(([key]) => key.toLowerCase() === className.toLowerCase())?.[1] ?? null;
        const classDetail = Object.entries(classDetailFallbacks).find(([key]) => key.toLowerCase() === className.toLowerCase())?.[1] ?? null;
        const description = classDetail?.tagline ?? classInfo?.summary ?? `${className} is a class with distinct combat, exploration, and progression tools.`;
        const lineItems = [
            ...(classDetail?.coreTraits?.slice(0, 4).map((item) => ({ value: item.value, label: item.label })) ?? []),
            ...(classInfo ? [{ value: classInfo.source, label: 'Source' }] : [])
        ];
        const bullets = [
            ...(classInfo?.highlights ?? []),
            ...(classDetail?.levelOneGains?.slice(0, 3) ?? []),
            ...(classDetail?.featureNotes?.slice(0, 3).map((note) => `${note.title}: ${note.summary}`) ?? []),
            ...levelOneFeatures.slice(0, 3).map((feature) => `${feature.name}: ${feature.description ?? 'Signature class feature.'}`)
        ];
        this.openDetailDrawer(buildClassLevelDetail(className, char.level, description, lineItems, bullets));
    }

    private openBackgroundAlignmentDetail(value: string): void {
        const normalized = formatAlignmentValue(value);
        const detail = ALIGNMENT_DETAILS[normalized];
        this.openDetailDrawer(buildAlignmentDetail(normalized, detail));
    }

    private openBackgroundLifestyleDetail(value: string): void {
        const key = value.trim().toLowerCase();
        const detail = LIFESTYLE_DETAILS[key];
        const cost = LIFESTYLE_COSTS[key];
        this.openDetailDrawer(buildLifestyleDetail(value, detail, cost));
    }

    private openBackgroundFaithDetail(value: string): void {
        const normalizedFaith = value.trim().toLowerCase();
        const detail = DEITY_FAITH_DETAILS[normalizedFaith];
        this.openDetailDrawer(buildFaithDetail(value, detail));
    }

    private openBackgroundExperienceDetail(_value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        const currentXp = typeof char.experiencePoints === 'number' ? Math.max(0, Math.trunc(char.experiencePoints)) : null;
        this.openDetailDrawer(buildExperienceDetail(currentXp, XP_THRESHOLDS));
    }

    private openBackgroundAppearanceDetail(label: string, value: string): void {
        this.openDetailDrawer(buildAppearanceDetail(label, value));
    }

    private openBackgroundAgeDetail(value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.openDetailDrawer(buildSpeciesAgeDetail(char.race, value, getSpeciesLore(char.race, SPECIES_LORE_DETAILS, speciesInfoMap)));
    }

    private openBackgroundHeightDetail(value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.openDetailDrawer(buildSpeciesHeightDetail(char.race, value, getSpeciesLore(char.race, SPECIES_LORE_DETAILS, speciesInfoMap)));
    }

    private openBackgroundWeightDetail(value: string): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.openDetailDrawer(buildSpeciesWeightDetail(char.race, value, getSpeciesLore(char.race, SPECIES_LORE_DETAILS, speciesInfoMap)));
    }

    setSpellFilter(filter: SpellFilter): void {
        this.activeSpellFilter.set(filter);
    }

    toggleDefenseCustomize(): void {
        this.defenseCustomizeOpen.update((current) => !current);
    }

    openDefensesPopup(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.activeExtrasStatEntry.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
        this.defenseCustomizeOpen.set(true);
        this.defenseDraftType.set('resistance');
        this.defenseDraftSubtype.set('');
        this.defenseManagerOpen.set(true);
    }

    closeDefensesPopup(): void {
        this.defenseManagerOpen.set(false);
        this.defenseDraftSubtype.set('');
    }

    openConditionsPopup(): void {
        const char = this.character();
        if (!char) {
            return;
        }

        this.requestCloseChat();
        this.activeDetailDrawer.set(null);
        this.activeExtrasStatEntry.set(null);
        this.hpManagerOpen.set(false);
        this.coinManagerOpen.set(false);
        this.spellManagerOpen.set(false);
        this.inventoryManagerOpen.set(false);
        this.extrasManagerOpen.set(false);
        this.defenseManagerOpen.set(false);
        this.expandedConditionKey.set(this.exhaustionLevel() > 0 ? 'exhaustion' : 'blinded');
        this.conditionsManagerOpen.set(true);
    }

    closeConditionsPopup(): void {
        this.conditionsManagerOpen.set(false);
    }

    toggleConditionPanel(key: ConditionPanelKey): void {
        this.expandedConditionKey.update((current) => current === key ? '' : key);
    }

    async toggleCondition(key: PersistedConditionKey): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const nextKeys = new Set(this.activeConditionKeys());
        if (nextKeys.has(key)) {
            nextKeys.delete(key);
        } else {
            nextKeys.add(key);
        }

        this.optimisticConditionKeys.set(new Set(nextKeys));
        await this.persistConditionState([...nextKeys], this.exhaustionLevel());
    }

    async setExhaustionLevel(level: number): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        this.optimisticExhaustionLevel.set(normalizeExhaustionLevel(level));
        await this.persistConditionState([...this.activeConditionKeys()], level);
    }

    onDefenseTypeChanged(value: string | number): void {
        const nextType = String(value);
        if (nextType === 'resistance' || nextType === 'immunity' || nextType === 'vulnerability' || nextType === 'condition-immunity') {
            this.defenseDraftType.set(nextType);
        } else {
            this.defenseDraftType.set('resistance');
        }

        this.defenseDraftSubtype.set('');
    }

    onDefenseSubtypeChanged(value: string | number): void {
        const nextValue = String(value ?? '').trim();
        this.defenseDraftSubtype.set(nextValue);

        if (nextValue) {
            void this.addDefenseEntry();
        }
    }

    async addDefenseEntry(): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const nextEntry = normalizeDefenseEntry({
            type: this.defenseDraftType(),
            value: this.defenseDraftSubtype(),
            note: ''
        });

        if (!nextEntry) {
            return;
        }

        const currentEntries = this.customDefenseEntries();
        const alreadyExists = currentEntries.some((entry) =>
            entry.type === nextEntry.type && entry.value.toLowerCase() === nextEntry.value.toLowerCase()
        );

        if (alreadyExists) {
            this.defenseDraftSubtype.set('');
            return;
        }

        await this.persistDefenseEntries([...currentEntries, nextEntry]);
        this.defenseDraftSubtype.set('');
    }

    async removeDefenseEntry(entryToRemove: PersistedDefenseEntry): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const nextEntries = this.customDefenseEntries().filter((entry) =>
            !(entry.type === entryToRemove.type && entry.value.toLowerCase() === entryToRemove.value.toLowerCase())
        );

        await this.persistDefenseEntries(nextEntries);
    }

    async updateDefenseEntryNote(entryToUpdate: PersistedDefenseEntry, value: string): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const nextNote = value.trim();
        const nextEntries = this.customDefenseEntries().map((entry) =>
            entry.type === entryToUpdate.type && entry.value.toLowerCase() === entryToUpdate.value.toLowerCase()
                ? { ...entry, note: nextNote }
                : entry
        );

        await this.persistDefenseEntries(nextEntries);
    }

    conditionBulletLead(bullet: string): string {
        const normalized = bullet.trim();
        const firstPeriodIndex = normalized.indexOf('.');
        if (firstPeriodIndex <= 0) {
            return '';
        }

        return normalized.slice(0, firstPeriodIndex + 1);
    }

    conditionBulletText(bullet: string): string {
        const normalized = bullet.trim();
        const firstPeriodIndex = normalized.indexOf('.');
        if (firstPeriodIndex <= 0) {
            return normalized;
        }

        return normalized.slice(firstPeriodIndex + 1).trim();
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
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
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

    isTieflingLegacyGrantedSpell(spellName: string): boolean {
        const char = this.character();
        if (!char) {
            return false;
        }

        return getTieflingGrantedSpellNamesForLevel(char.race, char.level, this.persistedBuilderState()).includes(spellName);
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
        if (this.isTieflingLegacyGrantedSpell(spellName)) {
            return;
        }

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
            this.defenseManagerOpen.set(false);
            this.conditionsManagerOpen.set(false);
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
        return this.getInventoryWeaponNotes(item.category, item.notes, catalogItem?.summary, catalogItem?.notes)
            || catalogItem?.summary?.trim()
            || item.notes?.trim()
            || catalogItem?.notes?.trim()
            || 'No additional notes are available for this item yet.';
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
        return this.getInventoryWeaponNotes(item.category, item.notes, item.summary, item.notes)
            || item.summary?.trim()
            || item.notes?.trim()
            || 'No additional notes are available for this item yet.';
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

        if ((item.category ?? '').toLowerCase().includes('weapon')) {
            return this.getWeaponPopupFooterText(summary, notes);
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

    isEquippableItem(entry: PersistedInventoryEntry): boolean {
        const cat = entry.category.toLowerCase();
        return cat.includes('weapon') || cat.includes('firearm') || cat.includes('armor') || cat.includes('shield');
    }

    isItemEquipped(entry: PersistedInventoryEntry): boolean {
        return entry.equipped !== false;
    }

    async toggleInventoryEntryEquipped(index: number): Promise<void> {
        const char = this.character();
        if (!char?.canEdit) {
            return;
        }

        const current = this.normalizedInventoryEntries();
        if (index < 0 || index >= current.length) {
            return;
        }

        const entry = current[index];
        const nextEquipped = entry.equipped === false; // unequipped → equipped; equipped/undefined → unequipped
        await this.persistInventoryEntries(
            current.map((e, i) => i === index ? { ...e, equipped: nextEquipped } : e)
        );
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
        const abilityKey = this.skillAbilityMap[skill];
        const abilityMod = this.getAbilityModifier(this.effectiveAbilityScores()?.[abilityKey] ?? 10);
        return 10 + abilityMod + this.getSkillProficiencyBonus(skill, this.character()?.skills);
    }

    private getSkillProficiencyBonus(skillKey: string, fallbackSkills?: SkillProficiencies): number {
        const char = this.character();
        if (!char || !this.isSkillProficient(skillKey, fallbackSkills)) {
            return 0;
        }

        return char.proficiencyBonus * (this.isSkillExpertise(skillKey) ? 2 : 1);
    }

    private isSkillProficient(skillKey: string, fallbackSkills?: SkillProficiencies): boolean {
        if (this.persistedSkillProficiencies().has(skillKey)) {
            return true;
        }

        return Boolean(fallbackSkills?.[skillKey as keyof SkillProficiencies]);
    }

    private isSkillExpertise(skillKey: string): boolean {
        return this.persistedSkillExpertise().has(skillKey);
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

        return tokens
            .map((token) => this.skillLabelToKey(token))
            .filter((token): token is string => Boolean(token));
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
            'religion': 'religion',
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

    private getTrainingFromCoreTraits(className: string): { armor: string[]; weapons: string[]; tools: string[] } {
        const classDetail = Object.entries(classDetailFallbacks).find(([key]) => key.toLowerCase() === className.toLowerCase())?.[1] ?? null;
        const traits = classDetail?.coreTraits ?? [];

        const armor: string[] = [];
        const weapons: string[] = [];
        const tools: string[] = [];

        for (const trait of traits) {
            const label = trait.label.toLowerCase();
            if (label.includes('armor')) {
                armor.push(trait.value);
            } else if (label.includes('weapon')) {
                weapons.push(trait.value);
            } else if (label.includes('tool')) {
                tools.push(trait.value);
            }
        }

        return { armor, weapons, tools };
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

    private normalizeDetailBackgroundTheme(value: string): DetailBackgroundTheme {
        switch (value) {
            case 'forest':
            case 'ember':
            case 'moonlit':
            case 'storm':
            case 'urban':
            case 'dunes':
            case 'tundra':
            case 'coastal':
            case 'underground':
            case 'custom':
                return value;
            default:
                return 'parchment';
        }
    }

    private normalizeDetailSectionColor(value: string | null | undefined): string {
        const normalized = (value ?? '').trim().toLowerCase();
        if (!normalized) {
            return '';
        }

        const shortHexMatch = normalized.match(/^#([0-9a-f]{3})$/i);
        if (shortHexMatch) {
            const [r, g, b] = shortHexMatch[1].split('');
            return `#${r}${r}${g}${g}${b}${b}`;
        }

        return /^#([0-9a-f]{6})$/i.test(normalized) ? normalized : '';
    }

    private normalizeDetailAlpha(value: number | null | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 1;
        }

        if (value <= 0) {
            return 0;
        }

        if (value >= 1) {
            return 1;
        }

        return Math.round(value * 100) / 100;
    }

    private parseDetailAlphaPercent(value: string): number {
        const parsed = Number.parseFloat(value);
        if (!Number.isFinite(parsed)) {
            return 1;
        }

        return this.normalizeDetailAlpha(parsed / 100);
    }

    private composeDetailColorValue(hexColor: string, alpha: number): string | null {
        if (!hexColor) {
            return null;
        }

        if (alpha >= 1) {
            return hexColor;
        }

        const rgb = this.hexToRgb(hexColor);
        if (!rgb) {
            return hexColor;
        }

        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    private hexToRgb(value: string): { r: number; g: number; b: number } | null {
        const match = value.match(/^#([0-9a-f]{6})$/i);
        if (!match) {
            return null;
        }

        return {
            r: Number.parseInt(match[1].slice(0, 2), 16),
            g: Number.parseInt(match[1].slice(2, 4), 16),
            b: Number.parseInt(match[1].slice(4, 6), 16)
        };
    }

    private sanitizeLanguageList(values: string[]): string[] {
        const seen = new Set<string>();
        const results: string[] = [];

        for (const value of values) {
            const trimmed = value.trim().replace(/\s+/g, ' ');
            if (!trimmed) {
                continue;
            }

            const baseText = trimmed.replace(/^Your character knows\s+/i, '').replace(/\.$/, '');
            const parts = baseText
                .replace(/\s+and\s+/gi, ',')
                .split(/,|;/)
                .map((part) => part.trim())
                .filter((part) => part.length > 0)
                .filter((part) => !/additional language|of your choice|determined by/i.test(part));

            for (const part of parts) {
                const key = part.toLowerCase();
                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                results.push(part);
            }
        }

        return results;
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

    renderDetailRichText(text: string): string {
        return marked.parse(text, { gfm: true, breaks: true }) as string;
    }

    getFeatCardLines(text: string): Array<{ isSource: boolean; text: string; sourceName?: string }> {
        return text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
                const sourceMatch = line.match(/^From\s+(.+)$/i);
                if (sourceMatch) {
                    return {
                        isSource: true,
                        text: 'From',
                        sourceName: sourceMatch[1].trim()
                    };
                }

                return {
                    isSource: false,
                    text: line
                };
            });
    }

    private getCustomFeatureDetail(name: string, description: string, category: string, className: string, level?: number): DetailDrawerContent | null {
        if (name === 'Wild Shape' && className === 'Druid') {
            const maxUses = Number(this.getClassProgressionValue('Druid', 'Wild Shape', this.character()?.level ?? 1)) || 2;
            return {
                title: name,
                subtitle: 'Druid • PHB-2024, pg. 94',
                description: getWildShapeDetailText(),
                actionLines: ['Wild Shape: 1 Bonus Action'],
                tracker: {
                    entryId: 'druid-wild-shape',
                    maxUses,
                    usedCount: Math.max(0, Math.min(maxUses, this.limitedUseCounts()['druid-wild-shape'] ?? 0)),
                    resetLabel: 'Long Rest'
                }
            };
        }

        if (name === 'Rage' && className === 'Barbarian') {
            this.rageDetailOption.set('activate-rage');
            return {
                title: name,
                subtitle: 'Rages • PHB-2024, pg. 51',
                description,
                secondaryHeading: 'Show Details',
                variant: 'rage-feature'
            };
        }

        if ((name === 'Brutal Strike' || name === 'Improved Brutal Strike') && className === 'Barbarian') {
            this.brutalStrikeDetailFeature.set(name === 'Improved Brutal Strike' ? 'Improved Brutal Strike' : 'Brutal Strike');
            return {
                title: name,
                subtitle: 'Brutal Strike effects • PHB-2024, pg. 53',
                description,
                variant: 'brutal-strike-feature'
            };
        }

        if (category !== 'Class Feature') {
            return null;
        }

        const parsed = parseFeatureDetailText(description);
        const title = level ? `${level}: ${name}` : name;
        const usedCounts = this.limitedUseCounts();

        if (className === 'Rogue') {
            return buildRogueFeatureDetail(name, parsed, usedCounts, title);
        }

        if (className === 'Druid') {
            return buildDruidFeatureDetail(name, parsed, usedCounts, Number(this.getClassProgressionValue('Druid', 'Wild Shape', this.character()?.level ?? 1)) || 2, title);
        }

        if (className === 'Barbarian') {
            return buildBarbarianFeatureDetail(name, parsed, usedCounts, title, this.character()?.level ?? 1);
        }

        return null;
    }


    onRageDetailOptionChanged(value: string | number): void {
        this.rageDetailOption.set(String(value));
    }

    getRageSummaryText(): string {
        const char = this.character();
        if (!char || char.className !== 'Barbarian') {
            return '';
        }

        const rageUses = this.getClassProgressionValue('Barbarian', 'Rages', char.level) || '0';
        return `You can take a Bonus action to enter Rage if you aren’t wearing Heavy Armor. You can use Rage ${rageUses} times per Long Rest, and regain one expended use when you finish a Short Rest.`;
    }

    getRageActiveDetailText(): string {
        const char = this.character();
        if (!char || char.className !== 'Barbarian') {
            return '';
        }

        const rageDamage = this.getClassProgressionValue('Barbarian', 'Rage Damage', char.level) || '+2';

        return [
            'While active, your Rage follows these rules:',
            '',
            '- You have Resistance to Bludgeoning, Piercing, and Slashing Damage.',
            `- When you make an attack using Strength and deal damage, you gain a ${rageDamage} bonus to damage.`,
            '- You have Advantage on Strength checks and saving throws.',
            '- You can’t maintain Concentration or cast spells.',
            '',
            'Rage lasts until the end of your next turn, ending early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active, you can extend it by doing one of the following:',
            '',
            '- Make an attack roll against an enemy.',
            '- Force an enemy to make a saving throw.',
            '- Take a Bonus Action to extend your Rage.',
            '',
            'Each time the Rage is extended, it lasts until the end of your next turn. You can maintain a Rage for up to 10 minutes.'
        ].join('\n');
    }

    getRageDetailActionLines(): string[] {
        return this.rageDetailOption() === 'extend-rage'
            ? ['Extend Rage: 1 Bonus Action']
            : ['Rage (Enter): 1 Bonus Action'];
    }

    getBrutalStrikeDetailText(): string {
        const char = this.character();
        if (!char || char.className !== 'Barbarian') {
            return '';
        }

        return getBrutalStrikeDetailText(char.level);
    }

    getBrutalStrikeActionLines(): string[] {
        const char = this.character();
        if (!char || char.className !== 'Barbarian') {
            return [];
        }

        return getBrutalStrikeActionLines(char.level);
    }

    getFeatureInlineActionLines(featureName: string, description: string, level?: number): string[] {
        const char = this.character();
        if (!char) {
            return [];
        }

        const parsed = parseFeatureDetailText(description);

        if (char.className === 'Druid') {
            return getDruidFeatureActionLines(featureName, parsed);
        }

        if (char.className === 'Rogue') {
            return getRogueFeatureActionLines(featureName, parsed);
        }

        if (char.className === 'Barbarian') {
            return getBarbarianFeatureActionLines(featureName, parsed, char.level);
        }

        return [];
    }

    getFeatureInlineTrackers(featureName: string): Array<{ entryId: string; maxUses: number; usedCount: number; resetLabel: string }> {
        const char = this.character();
        const usedCounts = this.limitedUseCounts();

        if (char?.className === 'Druid') {
            const multi = getDruidFeatureInlineTrackers(featureName, usedCounts, Number(this.getClassProgressionValue('Druid', 'Wild Shape', char.level)) || 2);
            if (multi.length > 0) {
                return multi;
            }
        }

        const singleTracker = this.getFeatureInlineTracker(featureName);
        return singleTracker ? [singleTracker] : [];
    }

    getFeatureInlineTrackerAt(featureName: string, index: number): { entryId: string; maxUses: number; usedCount: number; resetLabel: string } | null {
        const trackers = this.getFeatureInlineTrackers(featureName);
        if (featureName === 'Wild Resurgence' && trackers.length === 1) {
            return index === 1 ? trackers[0] : null;
        }

        if (featureName === 'Archdruid' && trackers.length === 1) {
            return index === 1 ? trackers[0] : null;
        }

        return index >= 0 && index < trackers.length ? trackers[index] : null;
    }

    getDetailTrackerAt(detail: DetailDrawerContent, index: number): { entryId: string; maxUses: number; usedCount: number; resetLabel: string } | null {
        const trackers = detail.trackers ?? [];
        if (detail.title === 'Wild Resurgence' && trackers.length === 1) {
            return index === 1 ? trackers[0] : null;
        }

        if (detail.title === 'Archdruid' && trackers.length === 1) {
            return index === 1 ? trackers[0] : null;
        }

        return index >= 0 && index < trackers.length ? trackers[index] : null;
    }

    getFeatureInlineTracker(featureName: string): DetailDrawerContent['tracker'] | null {
        const char = this.character();
        const usedCounts = this.limitedUseCounts();

        if (char?.className === 'Druid') {
            return getDruidFeatureInlineTracker(
                featureName,
                usedCounts,
                Number(this.getClassProgressionValue('Druid', 'Wild Shape', char.level)) || 2
            );
        }

        if (char?.className === 'Rogue') {
            return getRogueFeatureInlineTracker(featureName, usedCounts);
        }

        return getBarbarianFeatureInlineTracker(featureName, usedCounts);
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
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
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
        this.defenseManagerOpen.set(false);
        this.conditionsManagerOpen.set(false);
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

    private async persistDefenseEntries(entries: PersistedDefenseEntry[]): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const normalizedEntries = entries
            .map((entry) => normalizeDefenseEntry(entry))
            .filter((entry): entry is PersistedDefenseEntry => entry !== null);

        const dedupedEntries = normalizedEntries.filter((entry, index, allEntries) =>
            allEntries.findIndex((candidate) =>
                candidate.type === entry.type && candidate.value.toLowerCase() === entry.value.toLowerCase()
            ) === index
        );

        const currentState: PersistedBuilderState = this.persistedBuilderState() ?? {};
        const updatedState: PersistedBuilderState = { ...currentState, defenseEntries: dedupedEntries };
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

    private async persistConditionState(activeKeys: PersistedConditionKey[], exhaustionLevel: number): Promise<void> {
        const char = this.character();
        if (!char || !char.canEdit) {
            return;
        }

        const uniqueKeys = new Set<PersistedConditionKey>();
        for (const key of activeKeys) {
            const normalized = normalizeConditionKey(key);
            if (normalized) {
                uniqueKeys.add(normalized);
            }
        }

        const orderedKeys = CONDITION_KEY_ORDER.filter((key) => uniqueKeys.has(key));
        const normalizedExhaustionLevel = normalizeExhaustionLevel(exhaustionLevel);
        const updatedState: PersistedBuilderState = {
            ...(this.persistedBuilderState() ?? {}),
            activeConditions: orderedKeys,
            exhaustionLevel: normalizedExhaustionLevel
        };

        if (normalizedExhaustionLevel >= 6) {
            delete updatedState.tempHitPoints;
            updatedState.deathSaveFailures = 3;
            updatedState.deathSaveSuccesses = 0;
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
            hitPoints: normalizedExhaustionLevel >= 6 ? 0 : char.hitPoints,
            maxHitPoints: char.maxHitPoints,
            deathSaveFailures: normalizedExhaustionLevel >= 6 ? 3 : char.deathSaveFailures,
            deathSaveSuccesses: normalizedExhaustionLevel >= 6 ? 0 : char.deathSaveSuccesses
        });

        if (normalizedExhaustionLevel >= 6) {
            this.hpDraftCurrent.set(0);
            this.hpDraftTemp.set(0);
            this.tempHitPoints.set(0);
            this.hpDraftDeathSaveFailures.set(3);
            this.hpDraftDeathSaveSuccesses.set(0);
        }

        this.optimisticConditionKeys.set(null);
        this.optimisticExhaustionLevel.set(null);
        this.cdr.detectChanges();
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
