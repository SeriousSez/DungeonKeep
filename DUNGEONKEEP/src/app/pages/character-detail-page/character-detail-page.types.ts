import type { ExtrasCatalogType } from '../../data/extras-catalog.data';

export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export type CombatTab = 'actions' | 'spells' | 'inventory' | 'features' | 'background' | 'notes' | 'extras';
export type SpellFilter = 'all' | '0' | '1' | '2' | '3';
export type SpellManagerTab = 'prepared' | 'spellbook' | 'all';
export type ActionFilter = 'all' | 'attack' | 'action' | 'bonus-action' | 'reaction' | 'other' | 'limited-use';
export type BackgroundFilter = 'all' | 'background' | 'characteristics' | 'appearance';
export type InventoryFilter = string;
export type FeaturesFilter = 'all' | 'class-features' | 'species-traits' | 'feats';
export type NotesFilter = 'all' | 'orgs' | 'allies' | 'enemies' | 'backstory' | 'other';
export type MeasurementSystem = 'imperial' | 'metric';
export type InventoryDraftField = 'name' | 'category' | 'quantity' | 'weight' | 'costGp' | 'notes';
export type DetailBackgroundTheme = 'parchment' | 'forest' | 'ember' | 'moonlit' | 'storm' | 'urban' | 'dunes' | 'tundra' | 'coastal' | 'underground' | 'custom';
export type TieflingLegacyName = 'Abyssal' | 'Chthonic' | 'Infernal';

export interface PersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
    weight?: number;
    costGp?: number;
    notes?: string;
    isContainer?: boolean;
    containedItems?: PersistedInventoryEntry[];
    maxCapacity?: number;
    equipped?: boolean;
}

export interface PersistedCurrencyState {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
}

export type PersistedAbilityScoreImprovementMode = '' | 'plus-two' | 'plus-one-plus-one';

export interface PersistedAbilityScoreImprovementChoice {
    mode: PersistedAbilityScoreImprovementMode;
    primaryAbility: string;
    secondaryAbility: string;
}

export interface PersistedFeatFollowUpChoice {
    abilityIncreaseAbility?: string;
    weaponMasterWeapon?: string;
    grapplerAbility?: string;
    magicInitiateAbility?: string;
    skilledSelections?: string[];
}

export interface PersistedExtrasEntry {
    uid: string;
    name: string;
    type: ExtrasCatalogType;
    monsterStatBlockName?: string;
    currentHp?: number;
    maxHp?: number;
    customNotes?: string;
}

export type PersistedDefenseType = 'resistance' | 'immunity' | 'vulnerability' | 'condition-immunity';
export type PersistedConditionKey = 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious';
export type ConditionPanelKey = PersistedConditionKey | 'exhaustion';

export interface PersistedDefenseEntry {
    type: PersistedDefenseType;
    value: string;
    note?: string;
}

export interface ConditionDefinition {
    key: PersistedConditionKey;
    label: string;
    icon: string;
    bullets: string[];
}

export interface PersistedBuilderState {
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
    limitedUseCounts?: Record<string, number>;
    usedHitDiceCount?: number;
    hpMaxOverride?: number | null;
    tempHitPoints?: number;
    heroicInspiration?: boolean;
    deathSaveFailures?: number;
    deathSaveSuccesses?: number;
    extrasEntries?: PersistedExtrasEntry[];
    defenseEntries?: PersistedDefenseEntry[];
    activeConditions?: PersistedConditionKey[];
    exhaustionLevel?: number;
    detailBackgroundTheme?: DetailBackgroundTheme;
    detailBackgroundImageUrl?: string;
    detailSectionPanelColor?: string;
    detailSectionCardColor?: string;
    detailTextColor?: string;
    detailBorderColor?: string;
    detailSectionPanelAlpha?: number;
    detailSectionCardAlpha?: number;
    detailTextAlpha?: number;
    detailBorderAlpha?: number;
}

export interface CombatRow {
    name: string;
    subtitle: string;
    range: string;
    hitDcLabel: string;
    damage: string;
    notes: string;
    concentration: boolean;
    ritual: boolean;
}

export interface FeatureListEntry {
    name: string;
    level: number;
    description: string;
    detailDescription: string;
    summaryBadges: string[];
}

export interface SpeciesTraitEntry {
    name: string;
    description: string;
    detailDescription: string;
}

export interface LimitedUseEntry {
    id: string;
    name: string;
    meta: string;
    description: string;
    choiceLabel: string;
    activationLabel: string;
    maxUses: number;
    usedCount: number;
    resetLabel: string;
}

export interface DetailTracker {
    entryId: string;
    maxUses: number;
    usedCount: number;
    resetLabel: string;
}

export interface DetailDrawerContent {
    title: string;
    subtitle: string;
    description: string;
    key?: string;
    bullets?: string[];
    lineItems?: Array<{ value: string; label: string; note?: string }>;
    secondaryHeading?: string;
    variant?: 'default' | 'inventory-item' | 'rage-feature' | 'brutal-strike-feature';
    actionLines?: string[];
    tracker?: DetailTracker;
    trackers?: DetailTracker[];
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

export type RestPopupKind = 'short' | 'long';