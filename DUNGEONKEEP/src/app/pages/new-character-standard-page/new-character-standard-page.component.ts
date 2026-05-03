import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectorRef, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { marked } from 'marked';

import { classLevelOneFeatures, classOptions as sharedClassOptions, type ClassFeature, type ClassFeaturesForLevel } from '../../data/class-features.data';
import type { ActiveInfoModal, BackgroundDetail, BuilderInfo, CurrencyState, EquipmentItem, InventoryEntry } from '../../data/new-character-standard-page.types';
import { backgroundDescriptionFallbacks, backgroundDetailOverrides, backgroundLanguagesFallbacks, backgroundOptions as sharedBackgroundOptions, backgroundSkillProficienciesFallbacks, backgroundStartingPackages, backgroundToolProficienciesFallbacks, classDetailFallbacks, classInfoMap, classStartingPackages, classSubclassSnapshots, equipmentCatalog, magicInitiateSpellsByAbility, speciesInfoMap, validSteps } from '../../data/new-character-standard-page.data';
import type { Character, CharacterDraft } from '../../models/dungeon.models';
import { OptionMenuFilterComponent } from '../../components/option-menu-filter/option-menu-filter.component';
import { NewCharacterInfoModalComponent } from '../../components/new-character-info-modal/new-character-info-modal.component';
import { CharacteristicsModalComponent } from '../../components/characteristics-modal/characteristics-modal.component';
import { CharacterPortraitCropModalComponent } from '../../components/character-portrait-crop-modal/character-portrait-crop-modal.component';
import { DeityPickerModalComponent } from '../../components/deity-picker-modal/deity-picker-modal.component';
import { ItemDetailModalComponent } from '../../components/item-detail-modal/item-detail-modal.component';
import { ChoiceBadgeComponent } from '../../components/choice-badge/choice-badge';
import { DropdownComponent, type DropdownOption } from '../../components/dropdown/dropdown.component';
import { HitPointManagerModalComponent } from '../../components/hit-point-manager-modal/hit-point-manager-modal.component';
import { MultiSelectDropdownComponent, type MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { SessionService } from '../../state/session.service';
import { classSpellCatalog, type ClassSpellOption, spellcastingProgressionByClass, type SpellcastingProgression } from '../../data/class-spells.data';
import { spellDetailsMap, type SpellDetail } from '../../data/spell-details.data';
import { featCatalogEntries, type FeatEntry } from '../../data/feats-catalog.data';
import { normalizePreparedLeveledSpellNames } from '../../rules/spell-preparation.rules';
import { getWizardCantripLimit, getWizardFreeLeveledSpellLimit, getWizardPreparedSpellLimit, isWizardClassName, isWizardSpellbookCantripAlwaysPrepared } from '../../rules/wizard-class.rules';
import { deitiesList, type Deity } from '../../data/deities.data';
import { classProgressionColumns } from '../../data/class-progression.data';
import { subclassFeatureProgressionByClass as sharedSubclassFeatureProgressionByClass, subclassConfigs as sharedSubclassConfigs, subclassChoiceTitles as sharedSubclassChoiceTitles, subclassOptionsByClass as sharedSubclassOptionsByClass, type SubclassConfig } from '../../data/subclass-features.data';
import { premadeCharacters, type PremadeCharacter } from '../../data/premade-characters.data';
import { getSpeciesImagePath, speciesNameToSlug } from '../../data/species-catalog.data';

type StandardStep = 'home' | 'class' | 'species' | 'background' | 'abilities' | 'equipment' | 'whats-next';
type AbilityGenerationMethod = '' | 'standard-array' | 'manual-rolled' | 'point-buy';
type ClassSortMode = 'primary-ability' | 'party-role' | 'power-source' | 'complexity' | 'spellcasting' | 'armor';
type SpeciesSortMode = 'source' | 'lineage' | 'movement' | 'world' | 'complexity';
type ClassPanelTab = 'class-features' | 'spells' | 'core-traits';
type WizardSpellSubTab = 'prepared' | 'spellbook' | 'catalog';
type AbilityScoreImprovementMode = '' | 'plus-two' | 'plus-one-plus-one';
type HitPointMode = 'fixed' | 'rolled';
type HeightUnit = 'cm' | 'm' | 'ft' | 'in';
type WeightUnit = 'kg' | 'lb';
type CharacterNoteListKey = 'organizations' | 'allies' | 'enemies';
type NoteSectionKey = CharacterNoteListKey | 'other';

type TieflingLegacyName = 'Abyssal' | 'Chthonic' | 'Infernal';

const equipmentRarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Unique', '???'] as const;

const tieflingLegacySpellByLegacy: Readonly<Record<TieflingLegacyName, { cantrip: string; level3: string; level5: string }>> = {
    Abyssal: { cantrip: 'Poison Spray', level3: 'Ray of Sickness', level5: 'Hold Person' },
    Chthonic: { cantrip: 'Chill Touch', level3: 'False Life', level5: 'Ray of Enfeeblement' },
    Infernal: { cantrip: 'Fire Bolt', level3: 'Hellish Rebuke', level5: 'Darkness' }
};

const weaponMasteryDescriptions: Readonly<Record<string, string>> = {
    Cleave: 'If you hit a creature with a melee attack roll using this weapon, you can make a melee attack roll with it against a second creature within 5 feet of the first and within your reach. On a hit, the second creature takes the weapon’s normal damage, but you don’t add your ability modifier unless that modifier is negative.',
    Graze: 'If your attack misses a creature, you can still deal damage to that creature equal to the ability modifier used to make the attack roll.',
    Nick: 'When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.',
    Push: 'If you hit a creature with this weapon, you can push that creature up to 10 feet straight away from yourself if it is Large or smaller.',
    Sap: 'If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.',
    Slow: 'If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. You can use this property only once per turn.',
    Topple: 'If you hit a Large or smaller creature with this weapon, you can force it to make a Constitution saving throw or have the Prone condition.',
    Vex: 'If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.'
};

const weaponMasteryByWeapon: Readonly<Record<string, string>> = {
    'Club': 'Slow',
    'Dagger': 'Nick',
    'Greatclub': 'Push',
    'Handaxe': 'Vex',
    'Javelin': 'Slow',
    'Light Hammer': 'Nick',
    'Mace': 'Sap',
    'Quarterstaff': 'Topple',
    'Sickle': 'Nick',
    'Spear': 'Sap',
    'Crossbow, Light': 'Slow',
    'Dart': 'Vex',
    'Shortbow': 'Vex',
    'Sling': 'Slow',
    'Battleaxe': 'Topple',
    'Flail': 'Sap',
    'Glaive': 'Graze',
    'Greataxe': 'Cleave',
    'Greatsword': 'Graze',
    'Halberd': 'Cleave',
    'Lance': 'Topple',
    'Longsword': 'Sap',
    'Maul': 'Topple',
    'Morningstar': 'Sap',
    'Pike': 'Push',
    'Rapier': 'Vex',
    'Scimitar': 'Nick',
    'Shortsword': 'Vex',
    'Trident': 'Topple',
    'War Pick': 'Sap',
    'Warhammer': 'Push',
    'Whip': 'Slow',
    'Blowgun': 'Vex',
    'Crossbow, Hand': 'Vex',
    'Crossbow, Heavy': 'Slow',
    'Longbow': 'Slow',
    'Net': 'Slow',
    'Musket': 'Slow',
    'Pistol': 'Vex'
};

function getSpeciesImageObjectPosition(slug: string): string {
    if (slug === 'centaur') {
        return 'center 25%';
    }

    if (['yuan-ti', 'grung'].includes(slug)) {
        return 'center 20%';
    }

    if (['kobold', 'owlin', 'dwarf', 'deep-gnome', 'duergar', 'fairy', 'harengon', 'triton', 'astral-elf', 'autognome', 'verdan'].includes(slug)) {
        return 'center 15%';
    }

    if (['lizardfolk', 'changeling', 'kenku', 'dragonborn', 'githyanki', 'locathah', 'shifter', 'dhampir', 'giff', 'hadozee', 'kender', 'leonin', 'loxodon', 'plasmoid', 'warforged'].includes(slug)) {
        return 'center 10%';
    }

    if (['githzerai', 'hobgoblin', 'satyr', 'gnome', 'eladrin', 'sea-elf', 'shadar-kai', 'kalashtar', 'reborn', 'simic-hybrid', 'thri-kreen'].includes(slug)) {
        return 'center 5%';
    }

    return 'center top';
}

interface AbilityScoreImprovementChoice {
    mode: AbilityScoreImprovementMode;
    primaryAbility: string;
    secondaryAbility: string;
}

interface FeatFollowUpChoice {
    abilityIncreaseAbility: string;
    weaponMasterWeapon: string;
    grapplerAbility: string;
    magicInitiateAbility: string;
    skilledSelections: string[];
}

interface AbilityScoreImprovementFeatBenefit {
    title: string;
    description: string;
}

interface AbilityScoreImprovementFeatDetail {
    classification: string;
    intro: string;
    benefits: ReadonlyArray<AbilityScoreImprovementFeatBenefit>;
}

interface BarbarianSubclassDetail {
    sourceText: string;
    tagline: string;
    description: string;
    progressionNote: string;
}

interface StartingEquipmentPackage {
    label: string;
    items: ReadonlyArray<InventoryEntry>;
    currency: { gp?: number };
}

type StartingPackName =
    | "Burglar's Pack"
    | "Dungeoneer's Pack"
    | "Entertainer's Pack"
    | "Explorer's Pack"
    | "Priest's Pack"
    | "Scholar's Pack";

interface PersistedBuilderState {
    selectedClass?: string;
    characterLevel?: number;
    multiclassList?: Record<string, number>;
    selectedBackgroundName: string;
    selectedBackgroundUrl: string;
    selectedAlignment: string;
    selectedFaith: string;
    selectedLifestyle: string;
    selectedLanguages: string[];
    selectedSpeciesLanguages: string[];
    selectedSpeciesTraitChoices: Record<string, string[]>;
    classFeatureSelections: Record<string, string[]>;
    abilityScoreImprovementChoices: Record<string, AbilityScoreImprovementChoice>;
    featFollowUpChoices: Record<string, FeatFollowUpChoice>;
    backgroundChoiceSelections: Record<string, string>;
    selectedAbilityMethod: AbilityGenerationMethod;
    abilityBaseScores: Record<string, number>;
    abilityOtherModifiers: Record<string, number | null>;
    abilityOverrideScores: Record<string, number | null>;
    standardArraySelections: Record<string, number | null>;
    rolledValues: Array<number | null>;
    rolledAssignments: Record<number, string>;
    manualRollGroupCount: number;
    bgAbilityMode: string;
    bgAbilityScoreFor2: string;
    bgAbilityScoreFor1: string;
    hitPointMode: HitPointMode;
    rolledHitPointTotal: number | null;
    selectedClassStartingOption: 'A' | 'B' | '';
    selectedBackgroundStartingOption: 'A' | 'B' | '';
    inventoryEntries: InventoryEntry[];
    currency: CurrencyState;
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
    physicalHair: string;
    physicalSkin: string;
    physicalEyes: string;
    physicalHeight: string;
    physicalHeightUnit: HeightUnit;
    physicalWeight: string;
    physicalWeightUnit: WeightUnit;
    physicalAge: string;
    physicalGender: string;
    noteOrganizations: string[];
    noteAllies: string[];
    noteEnemies: string[];
    otherNotes: string;
    classPreparedSpells: Record<string, string[]>;
    classKnownSpellsByClass: Record<string, string[]>;
    wizardSpellbookByClass: Record<string, string[]>;
    wizardLevelUpLearnedSpellsByClass: Record<string, string[]>;
    wizardSpellSubTabByClass: Record<string, WizardSpellSubTab>;
}

interface BuilderSessionSnapshot {
    completionCharacterName: string;
    selectedSpeciesName: string;
    selectedCampaignIdsOnCreate: string[];
    generatedBackstory: string;
    completionPortraitImageUrl: string;
    completionPortraitOriginalImageUrl: string;
    notes: string;
}

@Component({
    selector: 'app-new-character-standard-page',
    imports: [CommonModule, RouterLink, NewCharacterInfoModalComponent, CharacteristicsModalComponent, DeityPickerModalComponent, ItemDetailModalComponent, ChoiceBadgeComponent, DropdownComponent, HitPointManagerModalComponent, MultiSelectDropdownComponent, OptionMenuFilterComponent, CharacterPortraitCropModalComponent],
    templateUrl: './new-character-standard-page.component.html',
    styleUrl: './new-character-standard-page.component.scss'
})
export class NewCharacterStandardPageComponent {
    readonly Object = Object;
    readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly session = inject(SessionService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly document = inject(DOCUMENT);
    private faithInputElement: HTMLInputElement | null = null;
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';
    private readonly builderSessionStoragePrefix = 'dk-standard-builder-session:';

    private readonly routeStep = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('step') as StandardStep | null)),
        { initialValue: this.route.snapshot.paramMap.get('step') as StandardStep | null }
    );
    private readonly routeCharacterIdParam = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
        { initialValue: this.route.snapshot.paramMap.get('id') ?? '' }
    );
    private readonly routeCharacterId = toSignal(
        this.route.queryParamMap.pipe(map((params) => params.get('characterId') ?? '')),
        { initialValue: this.route.snapshot.queryParamMap.get('characterId') ?? '' }
    );
    private readonly hydratedCharacterId = signal('');
    private readonly navigationEditLevel = signal<number | null>(this.resolveNavigationEditLevel());

    readonly activeStandardStep = computed<StandardStep>(() => {
        const step = this.routeStep();
        return step && validSteps.has(step) ? step : 'class';
    });
    readonly activeBuilderCharacterId = computed(() => this.routeCharacterIdParam() || this.routeCharacterId());
    readonly builderSkeletonStepSlots = [0, 1, 2, 3, 4, 5, 6] as const;
    readonly builderSkeletonOptionRows = [0, 1, 2, 3] as const;
    readonly showBuilderSkeleton = computed(() => {
        const sessionInitialized = this.session.initialized();
        const storeInitialized = this.store.initialized();
        const characterId = this.activeBuilderCharacterId();

        if (!sessionInitialized || !storeInitialized) {
            return true;
        }

        if (this.store.isHydrating() && this.store.characters().length === 0) {
            return true;
        }

        if (!characterId) {
            return false;
        }

        if (this.store.isHydrating() && !this.store.characters().some((entry) => entry.id === characterId)) {
            return true;
        }

        return false;
    });

    constructor() {
        afterNextRender(() => {
            const view = this.document.defaultView;
            if (!view) {
                this.cdr.detectChanges();
                return;
            }

            view.requestAnimationFrame(() => this.cdr.detectChanges());
        });

        effect((onCleanup) => {
            this.session.initialized();
            this.store.initialized();
            this.store.isHydrating();
            this.store.characters();
            this.activeBuilderCharacterId();
            this.hydratedCharacterId();

            const view = this.document.defaultView;
            if (!view) {
                this.cdr.detectChanges();
                return;
            }

            const frameId = view.requestAnimationFrame(() => this.cdr.detectChanges());
            onCleanup(() => view.cancelAnimationFrame(frameId));
        });

        effect(() => {
            if (this.routeStep() !== null) {
                return;
            }

            void this.router.navigate(this.getBuilderStepRoute('class'), {
                queryParamsHandling: 'preserve',
                replaceUrl: true,
                state: this.getBuilderRouteState()
            });
        });

        effect(() => {
            const campaigns = this.store.campaigns();
            const availableCampaignIds = new Set(campaigns.map((campaign) => campaign.id));
            const currentSelection = this.selectedCampaignIdsOnCreate();
            const filteredSelection = currentSelection.filter((campaignId) => availableCampaignIds.has(campaignId));

            if (filteredSelection.length !== currentSelection.length || filteredSelection.some((campaignId, index) => campaignId !== currentSelection[index])) {
                this.selectedCampaignIdsOnCreate.set(filteredSelection);
            }
        });

        effect(() => {
            if (this.bgAbilityMode() !== 'Increase two scores (+2 / +1)') {
                return;
            }

            const primary = this.normalizeAbilityName(this.bgAbilityScoreFor2());
            const secondary = this.normalizeAbilityName(this.bgAbilityScoreFor1());
            const safePrimary = this.isBackgroundAbilityOptionValid(primary, 2) ? primary : '';

            if (safePrimary !== this.bgAbilityScoreFor2()) {
                this.bgAbilityScoreFor2.set(safePrimary);
                return;
            }

            const safeSecondary = this.isBackgroundAbilityOptionValid(secondary, 1, safePrimary) ? secondary : '';
            if (safeSecondary !== this.bgAbilityScoreFor1()) {
                this.bgAbilityScoreFor1.set(safeSecondary);
            }
        });

        effect(() => {
            this.session.initialized();
            this.store.initialized();

            if (this.store.isHydrating()) {
                return;
            }

            const campaigns = this.getNoteSourceCampaigns();
            if (campaigns.length === 0) {
                return;
            }

            for (const campaign of campaigns) {
                if (!campaign.detailsLoaded && !this.store.isCampaignDetailsLoading(campaign.id)) {
                    void this.store.ensureCampaignLoaded(campaign.id);
                }
            }
        });

        effect(() => {
            const characterId = this.activeBuilderCharacterId();
            if (!characterId) {
                return;
            }

            if (this.hydratedCharacterId() === characterId) {
                return;
            }

            const character = this.store.characters().find((entry) => entry.id === characterId && entry.canEdit !== false);
            if (!character) {
                return;
            }

            this.hydrateBuilderFromCharacter(character, this.navigationEditLevel() ?? Number.NaN);
            this.hydratedCharacterId.set(characterId);
            this.cdr.detectChanges();
        });

        effect(() => {
            this.store.initialized();
            if (this.store.isHydrating()) {
                return;
            }

            this.saveBuilderSessionSnapshot();
        });

        this.restorePremadeSelectionFromNavigation();

        effect(() => {
            if (!this.showBackstoryGenerator() || this.backstoryPromptUserEdited()) {
                return;
            }
            this.backstoryPromptDetails.set(this.buildAutoBackstoryDirection());
        });

        effect((onCleanup) => {
            if (!this.faithDropdownOpen()) {
                return;
            }

            const view = this.document.defaultView;
            if (!view) {
                return;
            }

            const update = () => this.updateFaithSuggestionOverlayPosition();
            const frameId = view.requestAnimationFrame(update);

            view.addEventListener('resize', update);
            this.document.addEventListener('scroll', update, true);

            onCleanup(() => {
                view.cancelAnimationFrame(frameId);
                view.removeEventListener('resize', update);
                this.document.removeEventListener('scroll', update, true);
            });
        });
    }

    @HostListener('document:dungeonkeep-close-popups')
    onClosePopups(): void {
        this.faithDropdownOpen.set(false);
    }

    private restorePremadeSelectionFromNavigation(): void {
        const queryParams = this.route.snapshot.queryParams;
        const premadeId = typeof queryParams['premade'] === 'string' ? queryParams['premade'] : '';

        if (premadeId) {
            const premade = premadeCharacters.find((entry) => entry.id === premadeId);
            if (premade) {
                const requestedLevel = Number(queryParams['level']);
                const premadeLevel = Number.isFinite(requestedLevel)
                    ? Math.min(20, Math.max(1, Math.trunc(requestedLevel)))
                    : Math.max(1, premade.level || 1);

                this.populateFromPremade({ ...premade, level: premadeLevel });
                localStorage.removeItem('selectedPremadeCharacter');
                return;
            }
        }

        const premadeRaw = localStorage.getItem('selectedPremadeCharacter');
        if (!premadeRaw) {
            return;
        }

        try {
            const premade: Character = JSON.parse(premadeRaw);
            this.populateFromPremade(premade);
        } catch {
            // Ignore invalid local storage payloads.
        } finally {
            localStorage.removeItem('selectedPremadeCharacter');
        }
    }

    private requestCloseChat(): void {
        this.document.dispatchEvent(new CustomEvent('dungeonkeep-close-chat', { bubbles: true }));
    }

    populateFromPremade(premade: Character) {
        const matchedPremade = this.findMatchingPremadeCharacter(premade);
        const appearance = this.resolvePremadeAppearance(premade, matchedPremade);

        this.multiclassList.set({ [premade.className]: Math.max(1, premade.level || 1) });
        this.setClassPanelTab(premade.className, 'class-features');
        this.syncPreparedSpellsForClass(premade.className, Math.max(1, premade.level || 1));
        this.selectedClass.set(premade.className);
        this.selectedSpeciesName.set(premade.race);
        this.selectedBackgroundName.set(premade.background);
        const backgroundOption = this.backgroundOptions.find((entry) => entry.name.toLowerCase() === premade.background.toLowerCase());
        this.selectedBackgroundUrl.set(backgroundOption?.url ?? '');
        this.characterLevel.set(Math.max(1, premade.level || 1));
        this.completionCharacterName.set(premade.name);
        this.selectedAlignment.set(this.normalizeAlignmentSelection((premade.alignment || matchedPremade?.alignment || '').trim()));
        this.selectedFaith.set((premade.faith || matchedPremade?.faith || '').trim());
        this.selectedLifestyle.set(this.normalizeLifestyleSelection((premade.lifestyle || matchedPremade?.lifestyle || '').trim()));
        this.classFeatureSelections.set(this.inferClassFeatureSelectionsFromCharacter(premade));
        const inferredBackgroundState = this.inferBackgroundStateFromCharacter(premade);
        this.selectedLanguages.set(inferredBackgroundState.selectedLanguages);
        this.selectedSpeciesLanguages.set(inferredBackgroundState.selectedSpeciesLanguages);
        this.selectedSpeciesTraitChoices.set(matchedPremade?.speciesTraitChoices ?? {});
        this.backgroundChoiceSelections.set(inferredBackgroundState.backgroundChoiceSelections);
        this.bgAbilityMode.set(inferredBackgroundState.bgAbilityMode);
        this.bgAbilityScoreFor2.set(inferredBackgroundState.bgAbilityScoreFor2);
        this.bgAbilityScoreFor1.set(inferredBackgroundState.bgAbilityScoreFor1);
        this.selectedAbilityMethod.set('manual-rolled');
        this.abilityBaseScores.set(this.inferAbilityBaseScoresFromCharacter(premade));
        this.personalityTraits.set(matchedPremade?.personalityTraits || premade.personalityTraits || []);
        this.ideals.set(matchedPremade?.ideals || premade.ideals || []);
        this.bonds.set(matchedPremade?.bonds || premade.bonds || []);
        this.flaws.set(matchedPremade?.flaws || premade.flaws || []);
        this.physicalHair.set(appearance?.hair ?? '');
        this.physicalSkin.set(appearance?.skin ?? '');
        this.physicalEyes.set(appearance?.eyes ?? '');
        this.physicalHeight.set(appearance?.height ?? '');
        this.physicalWeight.set(appearance?.weight ?? '');
        this.physicalAge.set(appearance?.age ?? '');
        this.physicalGender.set(premade.gender ?? matchedPremade?.gender ?? '');
        this.generatedBackstory.set(this.extractVisibleBackstory(premade.notes || ''));
        this.inventoryEntries.set((matchedPremade?.inventoryEntries ?? []).map((entry) => this.createEnrichedInventoryItem(entry)));
        this.expandedInventoryContainers.set(new Set());
        this.cdr.detectChanges();
    }

    getBuilderStepRoute(step: StandardStep): string[] {
        const characterId = this.activeBuilderCharacterId();
        if (characterId) {
            return ['/characters', characterId, 'builder', step, 'manage'];
        }

        return ['/characters/new/standard', step];
    }

    getBuilderRouteState(): { editLevel: number } {
        return {
            editLevel: this.getPrimaryClassLevel()
        };
    }

    readonly activeStepIndex = computed(() => {
        const activeStep = this.activeStandardStep();
        const index = this.standardSteps.findIndex((step) => step.key === activeStep);
        return index < 0 ? 0 : index;
    });

    readonly canGoToPreviousStep = computed(() => this.activeStepIndex() > 0);

    readonly canGoToNextStep = computed(() => this.activeStepIndex() < this.standardSteps.length - 1);

    async goToAdjacentStep(direction: -1 | 1): Promise<void> {
        const targetIndex = this.activeStepIndex() + direction;
        if (targetIndex < 0 || targetIndex >= this.standardSteps.length) {
            return;
        }

        const target = this.standardSteps[targetIndex];
        await this.router.navigate(this.getBuilderStepRoute(target.key), {
            queryParamsHandling: 'preserve',
            state: this.getBuilderRouteState()
        });
    }

    readonly activeInfoModal = signal<ActiveInfoModal | null>(null);
    readonly activeItemDetailModal = signal<InventoryEntry | null>(null);
    readonly selectedClass = signal<string>('');
    readonly classSearchTerm = signal('');
    readonly spellSearchTermByClass = signal<Record<string, string>>({});
    readonly characterLevel = signal<number>(1);
    readonly multiclassList = signal<Record<string, number>>({});
    readonly selectedBackgroundName = signal<string>('');
    readonly selectedBackgroundUrl = signal<string>('');
    readonly selectedSpeciesName = signal<string>('');
    readonly speciesSearchTerm = signal('');
    readonly openTraitKeys = signal<Set<string>>(new Set<string>());
    readonly classFeatureSelections = signal<Record<string, string[]>>({});
    readonly abilityScoreImprovementChoices = signal<Record<string, AbilityScoreImprovementChoice>>({});
    readonly featFollowUpChoices = signal<Record<string, FeatFollowUpChoice>>({});
    readonly classPanelTabsByClass = signal<Record<string, ClassPanelTab>>({});
    readonly classPreparedSpells = signal<Record<string, string[]>>({});
    readonly classKnownSpellsByClass = signal<Record<string, string[]>>({});
    readonly wizardSpellbookByClass = signal<Record<string, string[]>>({});
    readonly wizardLevelUpLearnedSpellsByClass = signal<Record<string, string[]>>({});
    readonly wizardSpellSubTabByClass = signal<Record<string, WizardSpellSubTab>>({});
    readonly selectedSpellByClass = signal<Record<string, string>>({});
    readonly backgroundChoiceSelections = signal<Record<string, string>>({});
    readonly selectedAbilityMethod = signal<AbilityGenerationMethod>('');
    readonly abilityBaseScores = signal<Record<string, number>>({
        Strength: 10,
        Dexterity: 10,
        Constitution: 10,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 10
    });
    readonly abilityOtherModifiers = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly abilityOverrideScores = signal<Record<string, number | null>>({
        Strength: null, Dexterity: null, Constitution: null,
        Intelligence: null, Wisdom: null, Charisma: null
    });
    readonly standardArraySelections = signal<Record<string, number | null>>({
        Strength: null,
        Dexterity: null,
        Constitution: null,
        Intelligence: null,
        Wisdom: null,
        Charisma: null
    });
    readonly rolledValues = signal<Array<number | null>>([null, null, null, null, null, null]);
    readonly rolledAssignments = signal<Record<number, string>>({});
    readonly manualRollGroupCount = signal(1);
    readonly diceRollGroupOpen = signal(true);
    readonly hitPointMode = signal<HitPointMode>('fixed');
    readonly rolledHitPointTotal = signal<number | null>(null);
    readonly hitPointManagerOpen = signal(false);

    readonly activeCharacteristicModal = signal<'traits' | 'ideals' | 'bonds' | 'flaws' | null>(null);
    readonly deityPickerOpen = signal(false);
    readonly personalityTraits = signal<string[]>([]);
    readonly ideals = signal<string[]>([]);
    readonly bonds = signal<string[]>([]);
    readonly flaws = signal<string[]>([]);
    readonly showBackstoryGenerator = signal(false);
    readonly backstoryPromptDetails = signal('');
    private readonly backstoryPromptUserEdited = signal(false);
    readonly generatedBackstory = signal('');
    private readonly backstorySnapshot = signal<{ className: string; species: string; background: string } | null>(null);
    readonly isBackstoryStale = computed(() => {
        const snapshot = this.backstorySnapshot();
        if (!snapshot || !this.generatedBackstory()) {
            return false;
        }
        return (
            snapshot.className !== this.getCurrentClassSummary() ||
            snapshot.species !== (this.selectedSpeciesName() || 'Unknown species') ||
            snapshot.background !== (this.selectedBackgroundName() || 'Unknown background')
        );
    });
    readonly isGeneratingBackstory = signal(false);
    readonly backstoryGenerationError = signal('');
    readonly isSavingGeneratedBackstory = signal(false);
    readonly backstorySaveMessage = signal('');
    readonly noteOrganizations = signal<string[]>([]);
    readonly noteAllies = signal<string[]>([]);
    readonly noteEnemies = signal<string[]>([]);
    readonly otherNotes = signal('');
    readonly openNoteSections = signal<Record<NoteSectionKey, boolean>>({
        organizations: false,
        allies: false,
        enemies: false,
        other: false
    });
    readonly noteCustomDrafts = signal<Record<CharacterNoteListKey, string>>({
        organizations: '',
        allies: '',
        enemies: ''
    });
    readonly organizationNoteGroups = computed<MultiSelectOptionGroup[]>(() => {
        const campaigns = this.getNoteSourceCampaigns();

        return campaigns
            .map((campaign) => ({
                label: campaign.name,
                options: this.uniqueNoteEntries(
                    (campaign.worldNotes ?? [])
                        .filter((note) => note.category === 'Organization')
                        .map((note) => note.title?.trim() || '')
                        .filter((value) => value.length > 0)
                )
            }))
            .filter((group) => group.options.length > 0);
    });
    readonly relationshipNoteGroups = computed<MultiSelectOptionGroup[]>(() => {
        const campaigns = this.getNoteSourceCampaigns();
        const characters = this.store.characters();
        const activeCharacterId = this.activeBuilderCharacterId();
        const currentName = this.completionCharacterName().trim().toLowerCase();

        return campaigns.flatMap((campaign) => {
            const partyCharacterIds = new Set(campaign.partyCharacterIds ?? []);
            const characterOptions = this.uniqueNoteEntries(
                characters
                    .filter((character) => {
                        const isInCampaign = partyCharacterIds.has(character.id)
                            || character.campaignId === campaign.id
                            || (character.campaignIds ?? []).includes(campaign.id);

                        if (!isInCampaign) {
                            return false;
                        }

                        if (activeCharacterId && character.id === activeCharacterId) {
                            return false;
                        }

                        if (currentName && character.name.trim().toLowerCase() === currentName) {
                            return false;
                        }

                        return true;
                    })
                    .map((character) => character.name?.trim() || '')
                    .filter((value) => value.length > 0)
            );
            const npcOptions = this.uniqueNoteEntries(
                (campaign.npcs ?? [])
                    .map((name) => name.trim())
                    .filter((value) => value.length > 0)
            );
            const groups: MultiSelectOptionGroup[] = [];

            if (characterOptions.length > 0) {
                groups.push({
                    label: `${campaign.name} · Characters`,
                    options: characterOptions
                });
            }

            if (npcOptions.length > 0) {
                groups.push({
                    label: `${campaign.name} · NPCs`,
                    options: npcOptions
                });
            }

            return groups;
        });
    });
    readonly backstoryTargetCharacter = computed(() => {
        const activeBuilderCharacterId = this.activeBuilderCharacterId();
        if (!activeBuilderCharacterId) {
            return null;
        }

        return this.store.characters().find((entry) => entry.id === activeBuilderCharacterId) ?? null;
    });

    readonly standardSteps: ReadonlyArray<{ key: StandardStep; label: string; shortLabel?: string }> = [
        { key: 'home', label: 'Home' },
        { key: 'class', label: 'Class' },
        { key: 'species', label: 'Species' },
        { key: 'background', label: 'Background' },
        { key: 'abilities', label: 'Abilities' },
        { key: 'equipment', label: 'Equipment' },
        { key: 'whats-next', label: "What's Next" }
    ];

    readonly classOptions = sharedClassOptions;
    readonly backgroundOptions = sharedBackgroundOptions;
    readonly selectedClassSortMode = signal<ClassSortMode>('primary-ability');
    readonly classSortOptions: ReadonlyArray<DropdownOption> = [
        { value: 'primary-ability', label: 'Primary Ability' },
        { value: 'party-role', label: 'Party Role' },
        { value: 'power-source', label: 'Power Source' },
        { value: 'complexity', label: 'Complexity' },
        { value: 'spellcasting', label: 'Spellcasting Type' },
        { value: 'armor', label: 'Armor & Survivability' }
    ];
    readonly classCategorySets: Readonly<Record<ClassSortMode, ReadonlyArray<{ label: string; source: string; classes: ReadonlyArray<string> }>>> = {
        'primary-ability': [
            { label: 'Strength-Based', source: 'Primary Ability', classes: ['Barbarian', 'Fighter', 'Paladin'] },
            { label: 'Dexterity-Based', source: 'Primary Ability', classes: ['Gunslinger', 'Monk', 'Ranger', 'Rogue'] },
            { label: 'Intelligence-Based', source: 'Primary Ability', classes: ['Artificer', 'Wizard'] },
            { label: 'Wisdom-Based', source: 'Primary Ability', classes: ['Cleric', 'Druid'] },
            { label: 'Charisma-Based', source: 'Primary Ability', classes: ['Bard', 'Sorcerer', 'Warlock'] },
            { label: 'Flexible / Hybrid', source: 'Primary Ability', classes: ['Blood Hunter', 'Monster Hunter'] }
        ],
        'party-role': [
            { label: 'Frontline', source: 'Party Role', classes: ['Barbarian', 'Fighter', 'Paladin'] },
            { label: 'Skirmisher / Scout', source: 'Party Role', classes: ['Gunslinger', 'Monster Hunter', 'Rogue', 'Monk', 'Ranger', 'Blood Hunter'] },
            { label: 'Support / Control Casters', source: 'Party Role', classes: ['Bard', 'Cleric', 'Druid', 'Wizard'] },
            { label: 'Blaster / Utility Casters', source: 'Party Role', classes: ['Sorcerer', 'Warlock', 'Artificer'] }
        ],
        'power-source': [
            { label: 'Martial', source: 'Power Source', classes: ['Barbarian', 'Fighter', 'Gunslinger', 'Rogue', 'Monk'] },
            { label: 'Divine', source: 'Power Source', classes: ['Cleric', 'Paladin'] },
            { label: 'Primal', source: 'Power Source', classes: ['Druid', 'Ranger'] },
            { label: 'Arcane', source: 'Power Source', classes: ['Wizard', 'Sorcerer', 'Bard', 'Warlock', 'Artificer'] },
            { label: 'Occult / Hunter', source: 'Power Source', classes: ['Blood Hunter', 'Monster Hunter'] }
        ],
        'complexity': [
            { label: 'Beginner-Friendly', source: 'Complexity', classes: ['Fighter', 'Barbarian', 'Rogue'] },
            { label: 'Intermediate', source: 'Complexity', classes: ['Gunslinger', 'Monster Hunter', 'Ranger', 'Paladin', 'Warlock', 'Sorcerer', 'Bard', 'Blood Hunter'] },
            { label: 'Advanced', source: 'Complexity', classes: ['Cleric', 'Druid', 'Wizard', 'Artificer', 'Monk'] }
        ],
        'spellcasting': [
            { label: 'Non / Low Caster', source: 'Spellcasting Type', classes: ['Barbarian', 'Fighter', 'Gunslinger', 'Monster Hunter', 'Rogue', 'Monk', 'Blood Hunter'] },
            { label: 'Half Caster', source: 'Spellcasting Type', classes: ['Paladin', 'Ranger', 'Artificer'] },
            { label: 'Full Caster', source: 'Spellcasting Type', classes: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'] }
        ],
        'armor': [
            { label: 'Heavy / Very Durable', source: 'Armor & Survivability', classes: ['Fighter', 'Paladin', 'Cleric'] },
            { label: 'Medium / Mobile', source: 'Armor & Survivability', classes: ['Barbarian', 'Monster Hunter', 'Ranger', 'Artificer', 'Blood Hunter', 'Druid'] },
            { label: 'Light / Unarmored', source: 'Armor & Survivability', classes: ['Gunslinger', 'Rogue', 'Monk', 'Bard', 'Sorcerer', 'Warlock', 'Wizard'] }
        ]
    };
    readonly classCategories = computed(() => this.classCategorySets[this.selectedClassSortMode()]);
    readonly filteredClassCategories = computed(() => {
        const query = this.classSearchTerm().trim().toLowerCase();
        if (!query) {
            return this.classCategories();
        }

        return this.classCategories()
            .map((category) => ({
                ...category,
                classes: category.classes.filter((className) => className.toLowerCase().includes(query))
            }))
            .filter((category) => category.classes.length > 0);
    });

    private readonly spellcastingProgressionByClass = spellcastingProgressionByClass;

    private readonly classSpellCatalog = classSpellCatalog;

    readonly currentBgAbilityScores = computed<readonly string[]>(() => {
        const name = this.selectedBackground()?.name ?? '';
        return this.backgroundAbilityScoresMap[name] ?? this.abilityTiles;
    });
    readonly bgAbilityContextText = computed<string>(() => {
        const bgName = this.selectedBackground()?.name ?? 'This background';
        const abilities = this.currentBgAbilityScores();
        const last = abilities[abilities.length - 1];
        const front = abilities.slice(0, -1).join(', ');
        const abilitiesList = front ? `${front} and ${last}` : last;
        return `The ${bgName} Background allows you to choose between ${abilitiesList}. Increase one of these scores by 2 and another one by 1, or increase all three by 1. None of these increases can raise a score above 20.`;
    });
    readonly bgAbility2Options = computed<DropdownOption[]>(() => {
        const currentValue = this.normalizeAbilityName(this.bgAbilityScoreFor2());
        return this.currentBgAbilityScores().map((s) => ({
            value: s,
            label: s,
            disabled: !this.canApplyBackgroundAbilityIncrease(s, 2) && s !== currentValue
        }));
    });
    readonly bgAbility1Options = computed<DropdownOption[]>(() => {
        const picked2 = this.normalizeAbilityName(this.bgAbilityScoreFor2());
        const currentValue = this.normalizeAbilityName(this.bgAbilityScoreFor1());
        return this.currentBgAbilityScores()
            .filter((s) => s !== picked2)
            .map((s) => ({
                value: s,
                label: s,
                disabled: !this.canApplyBackgroundAbilityIncrease(s, 1) && s !== currentValue
            }));
    });
    readonly magicInitiateCantrips = computed<DropdownOption[]>(() => {
        const ability = this.magicInitiateAbility();
        const data = magicInitiateSpellsByAbility[ability];
        if (!data) return [];
        return data.cantrips.map((s) => ({ value: s, label: s }));
    });
    readonly magicInitiateLevel1Spells = computed<DropdownOption[]>(() => {
        const ability = this.magicInitiateAbility();
        const data = magicInitiateSpellsByAbility[ability];
        if (!data) return [];
        return data.level1Spells.map((s) => ({ value: s, label: s }));
    });
    readonly commonLanguages = ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'];
    readonly exoticLanguages = ['Abyssal', 'Celestial', 'Draconic', 'Druidic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon'];
    readonly otherLanguages = ['Sign Language'];
    readonly allLanguages = [...this.commonLanguages, ...this.exoticLanguages, ...this.otherLanguages];
    readonly selectedLanguages = signal<string[]>([]);
    readonly selectedSpeciesLanguages = signal<string[]>([]);
    readonly selectedSpeciesTraitChoices = signal<Record<string, string[]>>({});
    readonly completionCharacterName = signal('');
    readonly completionPortraitImageUrl = signal('');
    readonly completionPortraitCropModalOpen = signal(false);
    readonly completionPortraitCropSourceImageUrl = signal('');
    readonly completionPortraitOriginalImageUrl = signal('');
    readonly completionPortraitPromptDetails = signal('');
    readonly selectedCampaignIdsOnCreate = signal<string[]>([]);
    readonly hasTouchedCompletionCampaignSelection = signal(false);
    readonly completionError = signal('');
    readonly isCompletingCharacter = signal(false);
    readonly isGeneratingCompletionPortrait = signal(false);
    readonly completionPortraitInitials = computed(() => this.buildInitials(this.completionCharacterName().trim() || 'Character'));
    readonly completionCampaignGroups = computed<MultiSelectOptionGroup[]>(() => {
        const campaigns = this.store.campaigns();

        if (campaigns.length === 0) {
            return [];
        }

        return [{
            label: '',
            options: campaigns.map((campaign) => ({
                value: campaign.id,
                label: campaign.name
            }))
        }];
    });

    // Magic Initiate feat state
    readonly magicInitiateAbility = signal('');
    readonly magicInitiateCantrip1 = signal('');
    readonly magicInitiateCantrip2 = signal('');
    readonly magicInitiateSpell1 = signal('');

    // Background ability score increase state
    readonly bgAbilityMode = signal('');
    readonly bgAbilityScoreFor2 = signal('');
    readonly bgAbilityScoreFor1 = signal('');

    readonly languageGroups: ReadonlyArray<MultiSelectOptionGroup> = [
        { label: 'Common', options: ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'] },
        { label: 'Exotic', options: ['Abyssal', 'Celestial', 'Draconic', 'Druidic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon'] },
        { label: 'Other', options: ['Sign Language'] }
    ];

    // Dropdown options
    readonly levelOptions: ReadonlyArray<DropdownOption> = Array.from({ length: 20 }, (_, i) => ({
        value: i + 1,
        label: `Level ${i + 1}`
    }));
    readonly rageFeatureOptions: ReadonlyArray<DropdownOption> = [
        { value: 'activate-rage', label: 'Activate Rage' }
    ];
    readonly selectedRageFeatureOption = signal('activate-rage');
    readonly rageFeatureDetailsExpanded = signal(false);
    readonly rageFeatureUsedCount = signal(0);
    readonly hitPointModeOptions: ReadonlyArray<DropdownOption> = [
        { value: 'fixed', label: 'Use Fixed HP (Average)' },
        { value: 'rolled', label: 'Use Rolled HP Total' }
    ];
    readonly spellcasterAbilityOptions: ReadonlyArray<DropdownOption> = [
        { value: 'Intelligence', label: 'Intelligence' },
        { value: 'Wisdom', label: 'Wisdom' },
        { value: 'Charisma', label: 'Charisma' }
    ];
    private readonly backgroundAbilityScoresMap: Readonly<Record<string, readonly string[]>> = {
        Acolyte: ['Intelligence', 'Wisdom', 'Charisma'],
        Criminal: ['Dexterity', 'Constitution', 'Intelligence'],
        Spy: ['Dexterity', 'Constitution', 'Intelligence'],
        Noble: ['Strength', 'Dexterity', 'Charisma'],
        Knight: ['Strength', 'Dexterity', 'Charisma'],
        Charlatan: ['Dexterity', 'Constitution', 'Charisma'],
        Entertainer: ['Strength', 'Dexterity', 'Charisma'],
        Gladiator: ['Strength', 'Dexterity', 'Charisma'],
        'Folk Hero': ['Strength', 'Constitution', 'Wisdom'],
        'Guild Artisan': ['Dexterity', 'Intelligence', 'Charisma'],
        'Guild Merchant': ['Dexterity', 'Intelligence', 'Charisma'],
        Hermit: ['Constitution', 'Intelligence', 'Wisdom'],
        Outlander: ['Strength', 'Dexterity', 'Constitution'],
        Sage: ['Constitution', 'Intelligence', 'Wisdom'],
        Sailor: ['Strength', 'Dexterity', 'Wisdom'],
        Pirate: ['Strength', 'Dexterity', 'Wisdom'],
        Soldier: ['Strength', 'Dexterity', 'Constitution'],
        'Mercenary Veteran': ['Strength', 'Dexterity', 'Constitution'],
        Urchin: ['Strength', 'Dexterity', 'Intelligence']
    };
    private readonly coreBackgrounds = new Set([
        'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit',
        'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'
    ]);
    private readonly coreVariantBackgrounds = new Set([
        'Gladiator', 'Guild Merchant', 'Knight', 'Pirate', 'Spy'
    ]);
    private readonly forgottenRealmsBackgrounds = new Set([
        'City Watch', 'Clan Crafter', 'Cloistered Scholar', 'Courtier', 'Faction Agent', 'Far Traveler',
        'Inheritor', 'Investigator (SCAG)', 'Knight of the Order', 'Marine', 'Mercenary Veteran',
        'Urban Bounty Hunter', 'Uthgardt Tribe Member', 'Waterdhavian Noble', 'Black Fist Double Agent',
        'Dragon Casualty', 'Iron Route Bandit', 'Phlan Insurgent', 'Stojanow Prisoner', 'Ticklebelly Nomad',
        'Caravan Specialist', 'Earthspur Miner', 'Harborfolk', 'Mulmaster Aristocrat', 'Phlan Refugee',
        'Cormanthor Refugee', 'Gate Urchin', 'Hillsfar Merchant', 'Hillsfar Smuggler', 'Secret Identity',
        'Shade Fanatic', 'Trade Sheriff'
    ]);
    private readonly settingBackgrounds = new Set([
        'Azorius Functionary', 'Boros Legionnaire', 'Dimir Operative', 'Golgari Agent', 'Gruul Anarch',
        'Izzet Engineer', 'Orzhov Representative', 'Rakdos Cultist', 'Selesnya Initiate', 'Simic Scientist',
        'Lorehold Student', 'Prismari Student', 'Quandrix Student', 'Silverquill Student', 'Witherbloom Student',
        'Knight of Solamnia', 'Mage of High Sorcery', 'Astral Drifter', 'Wildspacer', 'House Agent',
        'Dissenter', 'Initiate', 'Vizier', 'Inquisitor', 'Gate Warden', 'Planar Philosopher'
    ]);
    private readonly adventureBackgrounds = new Set([
        'Anthropologist', 'Archaeologist', 'Athlete', 'Faceless', 'Feylost', 'Fisher', 'Giant Foundling',
        'Haunted One', 'Rewarded', 'Ruined', 'Rune Carver', 'Witchlight Hand', 'Celebrity Adventurer\'s Scion',
        'Failed Merchant', 'Gambler', 'Plaintiff', 'Rival Intern', 'Grinner', 'Volstrucker Agent', 'Ashari'
    ]);
    readonly backgroundDropdownOptions = computed<DropdownOption[]>(() =>
        this.backgroundOptions.map((bg) => ({
            value: bg.url,
            label: bg.name,
            group: this.getBackgroundGroup(bg.name)
        }))
    );
    readonly abilityMethodsDropdown = computed<DropdownOption[]>(() =>
        this.abilityMethods.map((method) => ({ value: method.value, label: method.label }))
    );
    readonly alignmentOptions: ReadonlyArray<DropdownOption> = [
        { value: 'chaotic-evil', label: 'Chaotic Evil' },
        { value: 'chaotic-good', label: 'Chaotic Good' },
        { value: 'chaotic-neutral', label: 'Chaotic Neutral' },
        { value: 'lawful-evil', label: 'Lawful Evil' },
        { value: 'lawful-good', label: 'Lawful Good' },
        { value: 'lawful-neutral', label: 'Lawful Neutral' },
        { value: 'neutral-good', label: 'Neutral Good' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'neutral-evil', label: 'Neutral Evil' },
        { value: 'true-neutral', label: 'True Neutral' }
    ];
    private readonly alignmentDescriptions: Readonly<Record<string, string>> = {
        'chaotic-evil': 'Driven by personal desire and domination, with little respect for law or mercy.',
        'chaotic-good': 'Values freedom and compassion, helping others while resisting oppressive authority.',
        'chaotic-neutral': 'Follows personal conviction and independence above order, duty, or strict morality.',
        'lawful-evil': 'Uses order, hierarchy, and rules as tools to gain control and personal power.',
        'lawful-good': 'Acts with honor, fairness, and duty to protect others and uphold just laws.',
        'lawful-neutral': 'Believes structure, tradition, and consistency matter more than personal sentiment.',
        'neutral-good': 'Tries to do what is right and kind without being bound to law or rebellion.',
        neutral: 'Pragmatic and balanced, avoiding ideological extremes in both morality and order.',
        'neutral-evil': 'Pursues self-interest without loyalty to law or chaos and without concern for harm caused.',
        'true-neutral': 'Seeks balance or simply lives without strong pull toward moral or ethical extremes.'
    };
    readonly selectedAlignment = signal('');
    readonly selectedAlignmentDescription = computed(() => this.alignmentDescriptions[this.selectedAlignment()] ?? '');
    readonly selectedFaith = signal('');
    readonly allDeities = deitiesList;
    readonly selectedFaithDescription = computed(() => {
        const faith = this.selectedFaith().trim();
        if (!faith) {
            return '';
        }

        const deity = this.allDeities.find((entry) => entry.name.toLowerCase() === faith.toLowerCase());
        if (!deity) {
            return 'A personal belief, philosophy, or lesser power that influences your character\'s values and choices.';
        }

        if (deity.summary?.trim()) {
            return deity.summary;
        }

        return `${deity.name} is associated with ${deity.domain} in the ${deity.pantheon} pantheon.`;
    });
    readonly faithDropdownOpen = signal(false);
    readonly faithOpensUpward = signal(false);
    readonly faithSuggestionsStyle = signal<Record<string, string>>({});
    readonly faithSuggestions = computed(() => {
        const query = this.selectedFaith().trim().toLowerCase();
        if (!query) return [];
        return deitiesList
            .filter((deity) => this.getDeitySearchableText(deity).includes(query))
            .slice(0, 8);
    });
    readonly lifestyleOptions: ReadonlyArray<DropdownOption> = [
        { value: 'wretched', label: 'Wretched (free, but miserable)' },
        { value: 'squalid', label: 'Squalid (1 SP/day)' },
        { value: 'poor', label: 'Poor (2 SP/day)' },
        { value: 'modest', label: 'Modest (1 GP/day)' },
        { value: 'comfortable', label: 'Comfortable (2 GP/day)' },
        { value: 'wealthy', label: 'Wealthy (4 GP/day)' },
        { value: 'aristocratic', label: 'Aristocratic (10+ GP/day)' }
    ];
    private readonly lifestyleDescriptions: Readonly<Record<string, string>> = {
        wretched: 'No real cost, but you endure harsh conditions, instability, and constant discomfort.',
        squalid: 'You survive in filthy, unsafe surroundings with only the barest essentials.',
        poor: 'Simple meals and rough lodging keep you going, but comfort and privacy are limited.',
        modest: 'A steady common lifestyle with reliable food, shelter, and basic social standing.',
        comfortable: 'You maintain good lodging, quality meals, and enough means to avoid daily hardship.',
        wealthy: 'You enjoy fine accommodations, quality goods, and influence among well-off circles.',
        aristocratic: 'Lavish living, elite expectations, and expensive appearances define your daily life.'
    };
    readonly selectedLifestyle = signal('');
    readonly selectedLifestyleDescription = computed(() => this.lifestyleDescriptions[this.selectedLifestyle()] ?? '');

    private getDeitySearchableText(deity: Deity): string {
        return [
            deity.name,
            deity.domain,
            deity.pantheon,
            deity.summary,
            deity.alignment,
            deity.symbol,
            deity.realm,
            deity.worshipers,
            deity.dogma,
            deity.relationships,
            deity.favoredWeapon,
            ...(deity.titles ?? [])
        ]
            .filter((value): value is string => !!value?.trim())
            .join(' ')
            .toLowerCase();
    }

    readonly heightUnitOptions: ReadonlyArray<DropdownOption> = [
        { value: 'ft', label: 'ft' },
        { value: 'in', label: 'in' },
        { value: 'cm', label: 'cm' },
        { value: 'm', label: 'm' }
    ];
    readonly weightUnitOptions: ReadonlyArray<DropdownOption> = [
        { value: 'lb', label: 'lb' },
        { value: 'kg', label: 'kg' }
    ];
    readonly physicalHair = signal('');
    readonly physicalSkin = signal('');
    readonly physicalEyes = signal('');
    readonly physicalHeight = signal('');
    readonly physicalHeightUnit = signal<HeightUnit>('ft');
    readonly physicalWeight = signal('');
    readonly physicalWeightUnit = signal<WeightUnit>('lb');
    readonly physicalAge = signal('');
    readonly physicalGender = signal('');
    readonly selectedSpeciesSortMode = signal<SpeciesSortMode>('source');
    readonly speciesSortOptions: ReadonlyArray<DropdownOption> = [
        { value: 'source', label: 'Source Book' },
        { value: 'lineage', label: 'Theme / Lineage' },
        { value: 'movement', label: 'Movement Profile' },
        { value: 'world', label: 'World Affinity' },
        { value: 'complexity', label: 'Complexity' }
    ];
    readonly speciesCategorySets: Readonly<Record<SpeciesSortMode, ReadonlyArray<{ label: string; source: string; species: ReadonlyArray<string> }>>> = {
        source: [
            {
                label: "Player's Handbook 2024",
                source: 'Core rules species',
                species: ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']
            },
            {
                label: 'Monsters of the Multiverse',
                source: 'Modern expansion roster',
                species: [
                    'Aarakocra', 'Bugbear', 'Centaur', 'Changeling', 'Deep Gnome', 'Duergar', 'Eladrin', 'Fairy',
                    'Firbolg', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Githyanki',
                    'Githzerai', 'Goblin', 'Harengon', 'Hobgoblin', 'Kenku', 'Kobold', 'Lizardfolk', 'Minotaur',
                    'Satyr', 'Sea Elf', 'Shadar-Kai', 'Tabaxi', 'Tortle', 'Triton', 'Yuan-Ti'
                ]
            },
            {
                label: 'Spelljammer and astral species',
                source: 'Wildspace and cosmic fantasy',
                species: ['Astral Elf', 'Autognome', 'Giff', 'Hadozee', 'Owlin', 'Plasmoid', 'Thri-Kreen']
            },
            {
                label: 'Ravenloft and horror lineages',
                source: 'Gothic and cursed options',
                species: ['Dhampir', 'Hexblood', 'Reborn']
            },
            {
                label: 'Eberron and setting-specific books',
                source: 'Campaign-world species',
                species: ['Kalashtar', 'Kender', 'Leonin', 'Loxodon', 'Shifter', 'Simic Hybrid', 'Warforged']
            },
            {
                label: 'Supplemental and special releases',
                source: 'Niche official releases',
                species: ['Grung', 'Locathah', 'Verdan']
            }
        ],
        lineage: [
            {
                label: 'Core Species',
                source: "Player's Handbook 2024",
                species: ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']
            },
            {
                label: 'Planar and mystical lineages',
                source: 'Celestial, fey, shadow, and psionic picks',
                species: ['Astral Elf', 'Eladrin', 'Fairy', 'Githyanki', 'Githzerai', 'Hexblood', 'Kalashtar', 'Reborn', 'Shadar-Kai']
            },
            {
                label: 'Wild and travel-ready folk',
                source: 'Scouts, sailors, and wanderers',
                species: ['Aarakocra', 'Firbolg', 'Giff', 'Hadozee', 'Harengon', 'Kenku', 'Leonin', 'Locathah', 'Owlin', 'Sea Elf', 'Tabaxi', 'Tortle', 'Triton']
            },
            {
                label: 'Adaptive and altered bodies',
                source: 'Shapeshifters, constructs, and uncanny options',
                species: ['Autognome', 'Changeling', 'Dhampir', 'Loxodon', 'Plasmoid', 'Shifter', 'Simic Hybrid', 'Verdan', 'Warforged']
            },
            {
                label: 'Monstrous ancestries',
                source: 'Martial, primal, and underdark pressure',
                species: [
                    'Bugbear', 'Centaur', 'Deep Gnome', 'Duergar', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)',
                    'Genasi (Water)', 'Goblin', 'Grung', 'Hobgoblin', 'Kender', 'Kobold', 'Lizardfolk', 'Minotaur',
                    'Satyr', 'Thri-Kreen', 'Yuan-Ti'
                ]
            }
        ],
        movement: [
            {
                label: 'Natural Flyers',
                source: 'Built-in flight or glide-heavy play',
                species: ['Aarakocra', 'Fairy', 'Owlin']
            },
            {
                label: 'Aquatic and amphibious',
                source: 'Swim speed or water survival',
                species: ['Genasi (Water)', 'Grung', 'Lizardfolk', 'Locathah', 'Sea Elf', 'Simic Hybrid', 'Tortle', 'Triton']
            },
            {
                label: 'Climbers and infiltrators',
                source: 'Wall movement, squeezing, or stealth mobility',
                species: ['Changeling', 'Dhampir', 'Hadozee', 'Plasmoid', 'Tabaxi', 'Thri-Kreen']
            },
            {
                label: 'Fast movers',
                source: 'Burst speed and battlefield repositioning',
                species: ['Centaur', 'Goliath', 'Harengon', 'Leonin', 'Satyr']
            },
            {
                label: 'Standard grounded',
                source: 'Balanced pace with other standout perks',
                species: [
                    'Aasimar', 'Astral Elf', 'Autognome', 'Bugbear', 'Deep Gnome', 'Dragonborn', 'Duergar', 'Dwarf',
                    'Eladrin', 'Elf', 'Firbolg', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Giff', 'Githyanki',
                    'Githzerai', 'Gnome', 'Goblin', 'Halfling', 'Hexblood', 'Hobgoblin', 'Human', 'Kalashtar', 'Kender',
                    'Kenku', 'Kobold', 'Loxodon', 'Minotaur', 'Orc', 'Reborn', 'Shadar-Kai', 'Shifter', 'Tiefling',
                    'Verdan', 'Warforged', 'Yuan-Ti'
                ]
            }
        ],
        world: [
            {
                label: 'Civilized Realms',
                source: 'Classic fantasy settlements and courts',
                species: ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']
            },
            {
                label: 'Astral and Wildspace',
                source: 'Spelljammer crews and cosmic travelers',
                species: ['Astral Elf', 'Autognome', 'Giff', 'Githyanki', 'Githzerai', 'Hadozee', 'Owlin', 'Plasmoid', 'Thri-Kreen']
            },
            {
                label: 'Fey and Shadow',
                source: 'Feywild charm and darker echoes',
                species: ['Eladrin', 'Fairy', 'Harengon', 'Hexblood', 'Reborn', 'Satyr', 'Shadar-Kai']
            },
            {
                label: 'Eberron and psionic paths',
                source: 'Telepathy, identity, and constructed lives',
                species: ['Changeling', 'Kalashtar', 'Shifter', 'Warforged']
            },
            {
                label: 'Wildlands and frontiers',
                source: 'Hunters, scouts, and giant-touched adventurers',
                species: ['Aarakocra', 'Firbolg', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Kenku', 'Leonin', 'Loxodon', 'Tabaxi', 'Tortle']
            },
            {
                label: 'Underdark and monstrous',
                source: 'Caverns, ambushers, and hard edges',
                species: ['Bugbear', 'Centaur', 'Deep Gnome', 'Duergar', 'Goblin', 'Grung', 'Hobgoblin', 'Kobold', 'Lizardfolk', 'Minotaur', 'Yuan-Ti']
            },
            {
                label: 'Seas and coasts',
                source: 'Oceanic and amphibious cultures',
                species: ['Locathah', 'Sea Elf', 'Simic Hybrid', 'Triton']
            },
            {
                label: 'Nomads and outsiders',
                source: 'One-off wanderers and unusual social roles',
                species: ['Dhampir', 'Kender', 'Verdan']
            }
        ],
        complexity: [
            {
                label: 'Beginner Friendly',
                source: 'Easy to run and easy to explain',
                species: ['Dwarf', 'Goliath', 'Halfling', 'Human', 'Leonin', 'Orc', 'Tortle', 'Warforged']
            },
            {
                label: 'Intermediate',
                source: 'A few moving parts with clear payoffs',
                species: [
                    'Aarakocra', 'Aasimar', 'Autognome', 'Dragonborn', 'Elf', 'Firbolg', 'Giff', 'Gnome', 'Harengon',
                    'Hadozee', 'Kalashtar', 'Kender', 'Lizardfolk', 'Locathah', 'Loxodon', 'Sea Elf', 'Shifter',
                    'Simic Hybrid', 'Tabaxi', 'Triton'
                ]
            },
            {
                label: 'Advanced',
                source: 'Unusual rules or identity-heavy play',
                species: [
                    'Astral Elf', 'Bugbear', 'Centaur', 'Changeling', 'Deep Gnome', 'Dhampir', 'Duergar', 'Eladrin',
                    'Fairy', 'Genasi (Air)', 'Genasi (Earth)', 'Genasi (Fire)', 'Genasi (Water)', 'Githyanki',
                    'Githzerai', 'Goblin', 'Grung', 'Hexblood', 'Hobgoblin', 'Kenku', 'Kobold', 'Minotaur', 'Owlin',
                    'Plasmoid', 'Reborn', 'Satyr', 'Shadar-Kai', 'Thri-Kreen', 'Tiefling', 'Verdan', 'Yuan-Ti'
                ]
            }
        ]
    };
    readonly speciesCategories = computed(() => this.speciesCategorySets[this.selectedSpeciesSortMode()]);
    readonly filteredSpeciesCategories = computed(() => {
        const query = this.speciesSearchTerm().trim().toLowerCase();
        if (!query) {
            return this.speciesCategories();
        }

        return this.speciesCategories()
            .map((category) => ({
                ...category,
                species: category.species.filter((speciesName) => speciesName.toLowerCase().includes(query))
            }))
            .filter((category) => category.species.length > 0);
    });
    readonly abilityTiles = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
    private readonly speciesSkillChoiceOptions: ReadonlyArray<string> = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation',
        'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
        'Sleight of Hand', 'Stealth', 'Survival'
    ];
    private readonly speciesOriginFeatOptions: ReadonlyArray<string> = [
        'Alert', 'Crafter', 'Healer', 'Lucky', 'Magic Initiate', 'Musician', 'Savage Attacker',
        'Sentinel', 'Sharpshooter', 'Skilled', 'Tavern Brawler', 'Tough'
    ];
    readonly abilityScoreImprovementOptions = this.buildAbilityScoreImprovementFeatOptions();
    private readonly barbarianSubclassDetails: Readonly<Record<string, BarbarianSubclassDetail>> = {
        'Path of the Berserker': {
            sourceText: 'Character options from the 5.5e Player\'s Handbook, Dungeon Master\'s Guide, Monster Manual, and D&D Beyond Basic Rules.',
            tagline: 'Channel Rage into Violent Fury',
            description: 'Barbarians who walk the Path of the Berserker direct their rage primarily toward violence. Their path is one of untrammeled fury, and they thrive in the chaos of battle as they let their rage seize and empower them.',
            progressionNote: 'At levels 3, 6, 10, and 14, this path emphasizes relentless offense, fear pressure, and punishing counterattacks.'
        },
        'Path of the Wild Heart': {
            sourceText: 'Character options from the 5.5e Player\'s Handbook, Dungeon Master\'s Guide, Monster Manual, and D&D Beyond Basic Rules.',
            tagline: 'Bond with Primal Animal Spirits',
            description: 'This path channels bestial instincts and adapts rage through totem-like aspects of the wild. It supports resilient frontlining, pursuit pressure, and flexible responses to changing encounters.',
            progressionNote: 'At levels 3, 6, 10, and 14, this path adds mobility, survivability, and nature-aligned utility to your rage turns.'
        },
        'Path of the World Tree': {
            sourceText: 'Character options from the 5.5e Player\'s Handbook, Dungeon Master\'s Guide, Monster Manual, and D&D Beyond Basic Rules.',
            tagline: 'Fight as a Living Pillar of the World',
            description: 'World Tree barbarians draw on cosmic roots to anchor allies and control space. Their rage blends durability with battlefield influence, making them strong protectors and disruptive frontliners.',
            progressionNote: 'At levels 3, 6, 10, and 14, this path deepens your control tools, ally support, and positional dominance.'
        },
        'Path of the Zealot': {
            sourceText: 'Character options from the 5.5e Player\'s Handbook, Dungeon Master\'s Guide, Monster Manual, and D&D Beyond Basic Rules.',
            tagline: 'Burn with Divine Fury',
            description: 'Zealot barbarians channel sacred conviction through their rage, dealing forceful strikes and refusing to fall. This path pushes high-tempo aggression while staying difficult to remove from the fight.',
            progressionNote: 'At levels 3, 6, 10, and 14, this path strengthens burst damage, endurance, and faith-driven combat momentum.'
        }
    };
    private readonly subclassFeatureProgressionByClass = sharedSubclassFeatureProgressionByClass;
    private readonly subclassConfigs = sharedSubclassConfigs;
    private readonly subclassChoiceTitles = sharedSubclassChoiceTitles;
    private readonly subclassOptionsByClass = sharedSubclassOptionsByClass;
    private readonly abilityScoreImprovementFeatDescriptions: Readonly<Record<string, string>> = {
        'Ability Score Improvement': 'Increase one ability score by 2, or increase two ability scores by 1 each. You cannot raise a score above 20 with this feat.',
        'Alert': 'You gain +5 initiative, can swap initiative with a willing ally at the start of combat, and no longer grant advantage to unseen attackers.',
        'Athlete': 'Increase Strength or Dexterity by 1 (max 20), gain better climbing and jumping mobility, and stand from prone with less movement.',
        'Charger': 'When you Dash, your movement powers up your next strike this turn with extra damage or forced movement options.',
        'Defensive Duelist': 'When wielding a finesse weapon, you can use your reaction to increase AC against one melee hit and potentially cause it to miss.',
        'Dual Wielder': 'You gain a boost while dual-wielding and can draw or stow two one-handed weapons more efficiently.',
        'Elemental Adept': 'Pick an element and your spells with that damage type ignore resistance; damage dice rolls of 1 are treated as 2.',
        'Grappler': 'Increase Strength or Dexterity by 1 (max 20), gain advantage on attack rolls against a creature you are grappling, and improve your grapple control.',
        'Great Weapon Master': 'Gain a heavy-weapon combat rider that rewards committed offense with stronger damage output and extra pressure.',
        'Healer': 'Gain stronger use of healer kits and improve emergency nonmagical healing for yourself and allies.',
        'Heavy Armor Master': 'Increase Strength or Constitution by 1 (max 20) and gain damage reduction against nonmagical physical hits while in heavy armor.',
        'Inspiring Leader': 'After a short speech, grant temporary hit points to your party based on your level and Charisma modifier.',
        'Mage Slayer': 'Gain anti-caster tools that help you pressure enemy spellcasters in close combat and disrupt their magic.',
        'Magic Initiate (Cleric)': 'Choose cantrips and a 1st-level Cleric spell to learn; the spell can be cast once for free per long rest and then with spell slots.',
        'Magic Initiate (Druid)': 'Choose cantrips and a 1st-level Druid spell to learn; the spell can be cast once for free per long rest and then with spell slots.',
        'Magic Initiate (Wizard)': 'Choose cantrips and a 1st-level Wizard spell to learn; the spell can be cast once for free per long rest and then with spell slots.',
        'Mounted Combatant': 'Gain offensive and defensive mounted benefits, including better control over your mount in dangerous combat.',
        'Polearm Master': 'Gain extra action economy and battlefield control when fighting with polearms and similar reach weapons.',
        'Resilient': 'Increase one ability score by 1 (max 20) and gain proficiency in saving throws for that same ability.',
        'Savage Attacker': 'Once per turn, reroll your weapon damage and use either total, making your key hits more consistent.',
        'Sentinel': 'Lock enemies down in melee with stronger opportunity attacks and movement denial when they try to escape.',
        'Shield Master': 'Gain defensive shield benefits and tactical shove options that improve frontline control and survivability.',
        'Skilled': 'Gain proficiency in three different skills or tools of your choice.',
        'Skill Expert': 'Increase one ability score by 1 (max 20), gain one skill proficiency, and gain expertise in one skill you are proficient with.',
        'Skulker': 'Improve your stealth in combat with stronger concealment interactions and stealth persistence after ranged attacks.',
        'Slasher': 'Increase Strength or Dexterity by 1 (max 20) and apply movement-slowing or crit-based pressure when dealing slashing damage.',
        'Speedy': 'Increase mobility with a speed boost and movement-related benefits for faster battlefield positioning.',
        'Spell Sniper': 'Improve long-range spell attacks and ignore certain cover while casting attack spells at distant targets.',
        'Tavern Brawler': 'Increase Strength or Constitution by 1 (max 20), improve improvised/unarmed combat, and gain bonus grapple pressure after a hit.',
        'Tough': 'Increase maximum hit points by 2 per level to significantly improve your durability.',
        'War Caster': 'Strengthen concentration and reaction casting, making it easier to sustain spells in melee combat.',
        'Weapon Master': 'Increase Strength or Dexterity by 1 (max 20) and gain mastery with additional weapon options.'
    };
    private readonly abilityScoreImprovementFeatDetails: Readonly<Record<string, AbilityScoreImprovementFeatDetail>> = {
        'Ability Score Improvement': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase one ability score by 2, or increase two ability scores by 1 each. This canâ€™t raise a score above 20.' },
                { title: 'Repeatable', description: 'You can take this feat more than once.' }
            ]
        },
        'Alert': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Initiative Proficiency', description: 'When you roll Initiative, add your Proficiency Bonus.' },
                { title: 'Initiative Swap', description: 'After rolling Initiative, you can swap with one willing ally who is not Incapacitated.' }
            ]
        },
        'Athlete': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Climb Speed', description: 'You gain a Climb Speed equal to your Speed.' },
                { title: 'Hop Up', description: 'If you are Prone, you can stand using only 5 feet of movement.' },
                { title: 'Jumping', description: 'You can make running Long and High Jumps after moving only 5 feet.' }
            ]
        },
        'Charger': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Improved Dash', description: 'When you take the Dash action, your Speed increases by 10 feet for that action.' },
                { title: 'Charge Attack', description: 'After moving at least 10 feet in a straight line, your next melee hit can add damage or push the target once per turn.' }
            ]
        },
        'Defensive Duelist': {
            classification: 'General Feat (Prerequisite: Level 4+, Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Dexterity score by 1, to a maximum of 20.' },
                { title: 'Parry', description: 'While holding a Finesse weapon, use your Reaction to add Proficiency Bonus to AC against melee attacks until your next turn.' }
            ]
        },
        'Dual Wielder': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Enhanced Dual Wielding', description: 'After attacking with a Light weapon, you can make a Bonus Action attack with a different qualifying melee weapon.' },
                { title: 'Quick Draw', description: 'You can draw or stow two qualifying weapons when you would normally draw or stow one.' }
            ]
        },
        'Elemental Adept': {
            classification: 'General Feat (Prerequisite: Level 4+, Spellcasting or Pact Magic Feature)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.' },
                { title: 'Energy Mastery', description: 'Choose Acid, Cold, Fire, Lightning, or Thunder. Your spells ignore Resistance to that type, and 1s on damage dice can become 2s.' },
                { title: 'Repeatable', description: 'You can take this feat more than once, choosing a different damage type each time.' }
            ]
        },
        'Grappler': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Punch and Grab', description: 'When you hit with an Unarmed Strike as part of the Attack action, you can use both the Damage and Grapple options once per turn.' },
                { title: 'Attack Advantage', description: 'You have Advantage on attack rolls against creatures Grappled by you.' },
                { title: 'Fast Wrestler', description: 'You donâ€™t spend extra movement to move creatures Grappled by you if they are your size or smaller.' }
            ]
        },
        'Great Weapon Master': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength score by 1, to a maximum of 20.' },
                { title: 'Heavy Weapon Mastery', description: 'When you hit with a Heavy weapon during the Attack action, it deals extra damage equal to your Proficiency Bonus.' },
                { title: 'Hew', description: 'After a Critical Hit or reducing a creature to 0 HP with a melee weapon, you can make one Bonus Action attack with that weapon.' }
            ]
        },
        'Healer': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Battle Medic', description: 'Using a Healerâ€™s Kit, you can let a nearby creature spend a Hit Die and regain HP equal to the roll plus your Proficiency Bonus.' },
                { title: 'Healing Rerolls', description: 'When you roll healing dice from spells or Battle Medic, you can reroll 1s.' }
            ]
        },
        'Heavy Armor Master': {
            classification: 'General Feat (Prerequisite: Level 4+, Heavy Armor Training)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Constitution or Strength score by 1, to a maximum of 20.' },
                { title: 'Damage Reduction', description: 'While wearing Heavy armor, reduce incoming Bludgeoning, Piercing, and Slashing damage from attacks by your Proficiency Bonus.' }
            ]
        },
        'Inspiring Leader': {
            classification: 'General Feat (Prerequisite: Level 4+, Wisdom or Charisma 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Wisdom or Charisma score by 1, to a maximum of 20.' },
                { title: 'Bolstering Performance', description: 'After a Short or Long Rest, grant Temporary Hit Points to up to six creatures based on level plus your chosen ability modifier.' }
            ]
        },
        'Mage Slayer': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Concentration Breaker', description: 'Creatures you damage have Disadvantage on Concentration saves.' },
                { title: 'Guarded Mind', description: 'If you fail an Intelligence, Wisdom, or Charisma save, you can succeed instead once per Short or Long Rest.' }
            ]
        },
        'Magic Initiate (Cleric)': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Two Cantrips', description: 'Learn two cantrips from the Cleric list. Choose Intelligence, Wisdom, or Charisma as your casting ability for this feat.' },
                { title: 'Level 1 Spell', description: 'Learn one level 1 Cleric spell. You always have it prepared, can cast it once per Long Rest without a slot, and can cast it with slots.' },
                { title: 'Spell Change', description: 'When you gain a level, you can replace one chosen spell with another of the same level from the same list.' },
                { title: 'Repeatable', description: 'You can take this feat again, choosing a different spell list.' }
            ]
        },
        'Magic Initiate (Druid)': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Two Cantrips', description: 'Learn two cantrips from the Druid list. Choose Intelligence, Wisdom, or Charisma as your casting ability for this feat.' },
                { title: 'Level 1 Spell', description: 'Learn one level 1 Druid spell. You always have it prepared, can cast it once per Long Rest without a slot, and can cast it with slots.' },
                { title: 'Spell Change', description: 'When you gain a level, you can replace one chosen spell with another of the same level from the same list.' },
                { title: 'Repeatable', description: 'You can take this feat again, choosing a different spell list.' }
            ]
        },
        'Magic Initiate (Wizard)': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Two Cantrips', description: 'Learn two cantrips from the Wizard list. Choose Intelligence, Wisdom, or Charisma as your casting ability for this feat.' },
                { title: 'Level 1 Spell', description: 'Learn one level 1 Wizard spell. You always have it prepared, can cast it once per Long Rest without a slot, and can cast it with slots.' },
                { title: 'Spell Change', description: 'When you gain a level, you can replace one chosen spell with another of the same level from the same list.' },
                { title: 'Repeatable', description: 'You can take this feat again, choosing a different spell list.' }
            ]
        },
        'Mounted Combatant': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength, Dexterity, or Wisdom score by 1, to a maximum of 20.' },
                { title: 'Mounted Strike', description: 'While mounted, you have Advantage on attacks against nearby unmounted creatures smaller than your mount.' },
                { title: 'Leap Aside', description: 'Your mount takes no damage on successful Dexterity saves and half on failed saves against qualifying effects while conditions are met.' },
                { title: 'Veer', description: 'While mounted, you can redirect a hit from your mount to yourself if you are not Incapacitated.' }
            ]
        },
        'Polearm Master': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Dexterity or Strength score by 1, to a maximum of 20.' },
                { title: 'Pole Strike', description: 'After attacking with a qualifying polearm, you can make a Bonus Action attack with the opposite end of the weapon.' },
                { title: 'Reactive Strike', description: 'While holding a qualifying weapon, you can make a Reaction attack against a creature entering your reach.' }
            ]
        },
        'Resilient': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Choose one ability in which you lack saving throw proficiency and increase that ability score by 1, to a maximum of 20.' },
                { title: 'Saving Throw Proficiency', description: 'You gain saving throw proficiency with that chosen ability.' }
            ]
        },
        'Savage Attacker': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefit.',
            benefits: [
                { title: 'Savage Attacker', description: 'Once per turn when you hit with a weapon, roll the weaponâ€™s damage dice twice and use either roll.' }
            ]
        },
        'Sentinel': {
            classification: 'General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Guardian', description: 'When nearby creatures Disengage or hit targets other than you, you can make an Opportunity Attack against them.' },
                { title: 'Halt', description: 'When you hit with an Opportunity Attack, the targetâ€™s Speed becomes 0 for the rest of the turn.' }
            ]
        },
        'Shield Master': {
            classification: 'General Feat (Prerequisite: Level 4+, Shield Training)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength score by 1, to a maximum of 20.' },
                { title: 'Shield Bash', description: 'After a qualifying melee weapon hit, you can force a Strength save to push a target or knock it Prone once per turn.' },
                { title: 'Interpose Shield', description: 'If an effect allows half damage on a successful Dexterity save, you can use your Reaction to take no damage on a success while holding a Shield.' }
            ]
        },
        'Skilled': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Three Proficiencies', description: 'Gain proficiency in any combination of three skills or tools of your choice.' },
                { title: 'Repeatable', description: 'You can take this feat more than once.' }
            ]
        },
        'Skill Expert': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase one ability score of your choice by 1, to a maximum of 20.' },
                { title: 'Skill Proficiency', description: 'You gain proficiency in one skill of your choice.' },
                { title: 'Expertise', description: 'Choose one skill in which you have proficiency but lack Expertise; you gain Expertise in that skill.' }
            ]
        },
        'Skulker': {
            classification: 'General Feat (Prerequisite: Level 4+, Dexterity 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Dexterity score by 1, to a maximum of 20.' },
                { title: 'Blindsight', description: 'You have Blindsight with a range of 10 feet.' },
                { title: 'Fog of War', description: 'In combat, you gain Advantage on Dexterity (Stealth) checks made as part of the Hide action.' },
                { title: 'Sniper', description: 'If you make an attack roll while hidden and miss, that attack doesnâ€™t reveal your location.' }
            ]
        },
        'Slasher': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Hamstring', description: 'Once per turn, when you hit with Slashing damage, reduce the targetâ€™s Speed by 10 feet until the start of your next turn.' },
                { title: 'Enhanced Critical', description: 'When you score a Critical Hit with Slashing damage, the target has Disadvantage on attack rolls until the start of your next turn.' }
            ]
        },
        'Speedy': {
            classification: 'General Feat (Prerequisite: Level 4+, Dexterity or Constitution 13+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Dexterity or Constitution score by 1, to a maximum of 20.' },
                { title: 'Speed Increase', description: 'Your Speed increases by 10 feet.' },
                { title: 'Dash over Difficult Terrain', description: 'When you Dash, Difficult Terrain doesnâ€™t cost extra movement for the rest of that turn.' },
                { title: 'Agile Movement', description: 'Opportunity Attacks have Disadvantage against you.' }
            ]
        },
        'Spell Sniper': {
            classification: 'General Feat (Prerequisite: Level 4+, Spellcasting or Pact Magic Feature)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.' },
                { title: 'Bypass Cover', description: 'Your spell attack rolls ignore Half Cover and Three-Quarters Cover.' },
                { title: 'Casting in Melee', description: 'Being within 5 feet of enemies doesnâ€™t impose Disadvantage on your spell attack rolls.' },
                { title: 'Increased Range', description: 'When you cast a spell with at least 10-foot range that requires an attack roll, you can increase its range by 60 feet.' }
            ]
        },
        'Tavern Brawler': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Enhanced Unarmed Strike', description: 'When your Unarmed Strike hits and deals damage, you can deal 1d4 + Strength modifier Bludgeoning damage instead of normal Unarmed Strike damage.' },
                { title: 'Damage Rerolls', description: 'When you roll damage for your Unarmed Strike, you can reroll 1s.' },
                { title: 'Improvised Weaponry', description: 'You have proficiency with improvised weapons.' },
                { title: 'Push', description: 'Once per turn, when your Unarmed Strike hits during the Attack action, you can deal damage and also push the target 5 feet.' }
            ]
        },
        'Tough': {
            classification: 'Origin Feat',
            intro: 'You gain the following benefit.',
            benefits: [
                { title: 'Hit Point Maximum Increase', description: 'Your HP maximum increases by twice your level when you take this feat, and by 2 more each time you gain a level thereafter.' }
            ]
        },
        'War Caster': {
            classification: 'General Feat (Prerequisite: Level 4+, Spellcasting or Pact Magic Feature)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.' },
                { title: 'Concentration', description: 'You have Advantage on Constitution saving throws made to maintain Concentration.' },
                { title: 'Reactive Spell', description: 'When a creature provokes your Opportunity Attack by leaving your reach, you can cast a qualifying one-action spell that targets only that creature instead.' },
                { title: 'Somatic Components', description: 'You can perform Somatic components even when your hands are occupied by weapons or a Shield.' }
            ]
        },
        'Weapon Master': {
            classification: 'General Feat (Prerequisite: Level 4+)',
            intro: 'You gain the following benefits.',
            benefits: [
                { title: 'Ability Score Increase', description: 'Increase your Strength or Dexterity score by 1, to a maximum of 20.' },
                { title: 'Mastery Property', description: 'Gain access to one chosen weapon mastery property for an eligible weapon type you are proficient with; you can change the type after a Long Rest.' }
            ]
        }
    };
    readonly abilityAbbreviations: Record<string, string> = {
        Strength: 'STR',
        Dexterity: 'DEX',
        Constitution: 'CON',
        Intelligence: 'INT',
        Wisdom: 'WIS',
        Charisma: 'CHA'
    };
    readonly abilityMethods: ReadonlyArray<{ value: AbilityGenerationMethod; label: string }> = [
        { value: '', label: '-- Choose a Generation Method --' },
        { value: 'standard-array', label: 'Standard Array' },
        { value: 'manual-rolled', label: 'Manual/Rolled' },
        { value: 'point-buy', label: 'Point Buy' }
    ];
    readonly standardArrayValues: ReadonlyArray<number> = [15, 14, 13, 12, 10, 8];
    readonly pointBuyValues: ReadonlyArray<number> = [8, 9, 10, 11, 12, 13, 14, 15];
    readonly pointBuyBudget = 27;
    readonly equipmentSearchTerm = signal('');
    readonly selectedEquipmentCategory = signal('All');
    readonly selectedEquipmentRarity = signal('All');
    readonly selectedClassStartingOption = signal<'A' | 'B' | ''>('A');
    readonly selectedBackgroundStartingOption = signal<'A' | 'B' | ''>('A');
    readonly selectedInventoryDestination = signal('inventory');
    readonly inventoryEntries = signal<InventoryEntry[]>([]);
    readonly expandedInventoryContainers = signal<Set<string>>(new Set());
    readonly currency = signal<CurrencyState>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });

    readonly equipmentCategories = computed(() => {
        return ['All', ...new Set(equipmentCatalog.map((item) => item.category).sort((left, right) => left.localeCompare(right)))];
    });
    readonly isWondrousEquipmentCategory = computed(() => this.selectedEquipmentCategory() === 'Wondrous Item');
    readonly equipmentRarities = computed(() => {
        const availableRarities = [...new Set(
            equipmentCatalog
                .filter((item) => item.category === 'Wondrous Item')
                .map((item) => item.rarity?.trim())
                .filter((rarity): rarity is string => Boolean(rarity))
        )];
        const rankedRarities = equipmentRarityOrder.filter((rarity) => availableRarities.includes(rarity));
        const unrankedRarities = availableRarities
            .filter((rarity) => !equipmentRarityOrder.includes(rarity as typeof equipmentRarityOrder[number]))
            .sort((left, right) => left.localeCompare(right));

        return ['All', ...rankedRarities, ...unrankedRarities];
    });

    readonly inventoryDestinationOptions = computed<DropdownOption[]>(() => {
        const options: DropdownOption[] = [{ value: 'inventory', label: 'Equipment' }];
        const containers = this.inventoryEntries().filter((entry) => entry.isContainer);

        for (const container of containers) {
            const suffix = container.quantity > 1 ? ` (x${container.quantity})` : '';
            options.push({ value: container.name, label: `${container.name}${suffix}` });
        }

        return options;
    });
    readonly hasAdditionalInventoryContainers = computed(() => this.inventoryDestinationOptions().length > 1);

    readonly filteredEquipmentItems = computed(() => {
        const term = this.equipmentSearchTerm().trim().toLowerCase();
        const selectedCategory = this.selectedEquipmentCategory();
        const selectedRarity = this.selectedEquipmentRarity();

        return equipmentCatalog.filter((item) => {
            const categoryMatches = selectedCategory === 'All' || item.category === selectedCategory;
            const rarityMatches = selectedCategory !== 'Wondrous Item' || selectedRarity === 'All' || item.rarity === selectedRarity;
            const termMatches = term
                ? item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
                : true;
            return categoryMatches && rarityMatches && termMatches;
        });
    });

    readonly inventoryItemCount = computed(() => this.inventoryEntries().reduce((total, entry) => total + entry.quantity, 0));
    readonly totalInventoryWeight = computed(() => {
        const total = this.inventoryEntries().reduce((sum, entry) => sum + this.getInventoryEntryTotalWeight(entry), 0);
        return Math.round(total * 100) / 100;
    });
    readonly totalCurrencyInGp = computed(() => {
        const value = this.currency();
        const total = (value.pp * 10) + value.gp + (value.ep * 0.5) + (value.sp * 0.1) + (value.cp * 0.01);
        return Math.round(total * 100) / 100;
    });

    private readonly classStartingPackagePresets: Readonly<Record<string, Readonly<Record<'A' | 'B', StartingEquipmentPackage>>>> = {
        Artificer: {
            A: {
                label: 'Leather Armor, Light Crossbow, Bolts (20), Thieves\' Tools, Tinker\'s Tools, Dungeoneer\'s Pack, and 5 GP',
                items: [
                    { name: 'Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Light Crossbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Crossbow Bolts (20)', category: 'Ammunition', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Tinker's Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '100 GP',
                items: [],
                currency: { gp: 100 }
            }
        },
        Barbarian: {
            A: {
                label: 'Greataxe, 4 Handaxes, Explorer\'s Pack, and 15 GP',
                items: classStartingPackages.A.items,
                currency: classStartingPackages.A.currency
            },
            B: {
                label: '75 GP',
                items: classStartingPackages.B.items,
                currency: classStartingPackages.B.currency
            }
        },
        Bard: {
            A: {
                label: 'Leather Armor, Dagger, Musical Instrument, Entertainer\'s Pack, and 19 GP',
                items: [
                    { name: 'Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Lute', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Entertainer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 19 }
            },
            B: {
                label: '90 GP',
                items: [],
                currency: { gp: 90 }
            }
        },
        Cleric: {
            A: {
                label: 'Mace, Scale Mail, Shield, Holy Symbol, Priest\'s Pack, and 7 GP',
                items: [
                    { name: 'Mace', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Scale Mail', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Shield', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Holy Symbol', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Priest's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 7 }
            },
            B: {
                label: '110 GP',
                items: [],
                currency: { gp: 110 }
            }
        },
        Druid: {
            A: {
                label: 'Leather Armor, Shield, Scimitar, Druidic Focus, Explorer\'s Pack, and 9 GP',
                items: [
                    { name: 'Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Shield', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Scimitar', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Druidic Focus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Explorer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 9 }
            },
            B: {
                label: '55 GP',
                items: [],
                currency: { gp: 55 }
            }
        },
        Fighter: {
            A: {
                label: 'Chain Mail, Longsword, Shield, Light Crossbow, Bolts (20), Dungeoneer\'s Pack, and 5 GP',
                items: [
                    { name: 'Chain Mail', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Shield', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Light Crossbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Crossbow Bolts (20)', category: 'Ammunition', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '155 GP',
                items: [],
                currency: { gp: 155 }
            }
        },
        Monk: {
            A: {
                label: 'Spear, Dungeoneer\'s Pack, and 11 GP',
                items: [
                    { name: 'Spear', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 11 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Paladin: {
            A: {
                label: 'Chain Mail, Longsword, Shield, Javelin (5), Holy Symbol, Priest\'s Pack, and 14 GP',
                items: [
                    { name: 'Chain Mail', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Shield', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Javelin', category: 'Weapon', quantity: 5, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Holy Symbol', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Priest's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 14 }
            },
            B: {
                label: '150 GP',
                items: [],
                currency: { gp: 150 }
            }
        },
        Ranger: {
            A: {
                label: 'Studded Leather Armor, Scimitar, Shortsword, Longbow, Arrows (20), Quiver, Explorer\'s Pack, and 7 GP',
                items: [
                    { name: 'Studded Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Scimitar', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Shortsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Longbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Arrow', category: 'Ammunition', quantity: 20, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Quiver', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Explorer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 7 }
            },
            B: {
                label: '150 GP',
                items: [],
                currency: { gp: 150 }
            }
        },
        Rogue: {
            A: {
                label: 'Leather Armor, 2 Daggers, Shortsword, Shortbow, Arrows (20), Thieves\' Tools, Burglar\'s Pack, and 8 GP',
                items: [
                    { name: 'Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Dagger', category: 'Weapon', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Shortsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Shortbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Arrow', category: 'Ammunition', quantity: 20, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Burglar's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 8 }
            },
            B: {
                label: '100 GP',
                items: [],
                currency: { gp: 100 }
            }
        },
        Sorcerer: {
            A: {
                label: 'Quarterstaff, Arcane Focus, Dungeoneer\'s Pack, and 28 GP',
                items: [
                    { name: 'Quarterstaff', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Arcane Focus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 28 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Warlock: {
            A: {
                label: 'Leather Armor, Sickle, Dagger, Arcane Focus, Scholar\'s Pack, and 15 GP',
                items: [
                    { name: 'Leather Armor', category: 'Armor', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/armor' },
                    { name: 'Sickle', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Arcane Focus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Scholar's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '100 GP',
                items: [],
                currency: { gp: 100 }
            }
        },
        Wizard: {
            A: {
                label: 'Quarterstaff, Dagger, Arcane Focus, Scholar\'s Pack, Spellbook, and 5 GP',
                items: [
                    { name: 'Quarterstaff', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Arcane Focus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Scholar's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Spellbook', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '55 GP',
                items: [],
                currency: { gp: 55 }
            }
        }
    };

    private readonly backgroundStartingPackagePresets: Readonly<Record<string, Readonly<Record<'A' | 'B', StartingEquipmentPackage>>>> = {
        Acolyte: {
            A: {
                label: 'Calligrapher\'s Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP',
                items: backgroundStartingPackages.A.items,
                currency: backgroundStartingPackages.A.currency
            },
            B: {
                label: '50 GP',
                items: backgroundStartingPackages.B.items,
                currency: backgroundStartingPackages.B.currency
            }
        },
        Sage: {
            A: {
                label: 'Ink (1-ounce bottle), Ink Pen, Lamp, Oil (2 flasks), Paper (10 sheets), Scholar\'s Pack, and 8 GP',
                items: [
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lamp', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Oil (flask)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Paper (sheet)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Scholar's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 8 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Anthropologist: {
            A: {
                label: 'Abacus, Book of Lore, Bedroll, Rope (50 feet), Waterskin, and 10 GP',
                items: [
                    { name: 'Abacus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: 'Abacus, Book of Lore, Bedroll, Rope (50 feet), Waterskin, and 50 GP',
                items: [
                    { name: 'Abacus', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 50 }
            }
        },
        Archaeologist: {
            A: {
                label: 'Bedroll, Book of Lore, Brush (fine), Crowbar, Lantern, Oil (2 flasks), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lantern, Hooded', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Oil (flask)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: 'Bedroll, Book of Lore, Brush (fine), Crowbar, Lantern, Oil (2 flasks), and 50 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lantern, Hooded', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Oil (flask)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 50 }
            }
        },
        Athlete: {
            A: {
                label: 'Bedroll, Blanket, Costume, Rope (50 feet), Towel, Waterskin, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Charlatan: {
            A: {
                label: 'Disguise Kit, Fine Clothes, Forgery Kit, Tools of the Con, and 15 GP',
                items: [
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Forgery Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'City Watch': {
            A: {
                label: 'Blue and Silver Uniform, Bedroll, Belted Longsword, Canvas Backpack, Common Clothes, and 17 GP',
                items: [
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 17 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Clan Crafter': {
            A: {
                label: 'Artisan\'s Tools (choice), Common Clothes, Crowbar, Dungeoneer\'s Pack, Locket, and 5 GP',
                items: [
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Cloistered Scholar': {
            A: {
                label: 'Book of Lore, Bottle of Black Ink, Common Clothes, Ink Pen, Letter from Dead Colleague, Quill, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Paper (sheet)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Courtier: {
            A: {
                label: 'Bedroll, Candlelight Courtesan\'s Outfit, Common Clothes, Fine Clothes, Ink Pen, and 25 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Criminal: {
            A: {
                label: 'Crowbar, Dark Common Clothes (with hood), Pouch, Thieves\' Tools, and 15 GP',
                items: [
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Entertainer: {
            A: {
                label: 'Costume, Disguise Kit, Favor from Admirer, Musical Instrument (choice), and 15 GP',
                items: [
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Lute', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Faceless: {
            A: {
                label: 'Bedroll, Common Clothes, Dark Outfit with Hood, Dungeoneer\'s Pack, Mask, and 14 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 14 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Faction Agent': {
            A: {
                label: 'Bedroll, Bottle of Invisible Ink, Cipher Text, Clothes, Faction Insignia, Forgery Kit, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Forgery Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Far Traveler': {
            A: {
                label: 'Bedroll, Book (cultural stories), Common Clothes, Costume, Cursed Talisman, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Feylost: {
            A: {
                label: 'Bedroll, Bottle of Invisible Ink, Common Clothes, Fey Trinket, Shortbow, and 8 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Shortbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 8 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Fisher: {
            A: {
                label: 'Bedroll, Fishing Tackle, Mess Kit, Net, Rope (50 feet), Waterskin, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fishing Tackle', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Mess Kit', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Folk Hero': {
            A: {
                label: 'Artisan\'s Tools (choice), Common Clothes, Dungeoneer\'s Pack, Iron Pot, Shovel, and 10 GP',
                items: [
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Shovel', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Giant Foundling': {
            A: {
                label: 'Bedroll, Common Clothes (oversized), Dungeoneer\'s Pack, Grappling Hook, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Grappling Hook', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Gladiator: {
            A: {
                label: 'Costume, Disguise Kit, Favor from Admirer, Unusual Weapon (choice), and 15 GP',
                items: [
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Guild Artisan': {
            A: {
                label: 'Artisan\'s Tools (choice), Backpack, Book of Lore, Common Clothes, Guild Membership Pack, Ink Pen, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Guild Merchant': {
            A: {
                label: 'Artisan\'s Tools (choice), Backpack, Brass Scale, Common Clothes, Letter of Introduction, Rope (50 feet), and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Haunted One': {
            A: {
                label: 'Bedroll, Caltrops (20), Common Clothes, Crossbow Bolts (20), Crowbar, Dungeon Pack, Light Crossbow, Rope (50 feet), and 8 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Caltrops (Bag of 20)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Light Crossbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Crossbow Bolts (20)', category: 'Ammunition', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 8 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Hermit: {
            A: {
                label: 'Backpack, Bedroll, Bottle of Scented Oil, Bowl, Common Clothes, Fishing Tackle, Mess Kit, Rope (50 feet), Tent, Tinderbox, Torch, and an Herbalism Kit',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fishing Tackle', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Mess Kit', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Torch', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'House Agent': {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Dungeoneer\'s Pack, Hooded Lantern, Oil (2 flasks), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lantern, Hooded', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Oil (flask)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Inheritor: {
            A: {
                label: 'Backpack, Bedroll, Book of Lore, Common Clothes, Entertainer\'s Pack, Fine Clothes, Trinket, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Entertainer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Investigator (SCAG)': {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Disguise Kit, Forgery Kit, Grappling Hook, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Forgery Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Grappling Hook', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Investigator (VRGR)': {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Disguise Kit, Forgery Kit, Grappling Hook, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Forgery Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: 'Grappling Hook', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Knight: {
            A: {
                label: 'Battlefield Scavenger, Fine Clothes, Longsword, Signet Ring, and 25 GP',
                items: [
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Knight of the Order': {
            A: {
                label: 'Bedroll, Book (Order history), Common Clothes, Dungeoneer\'s Pack, Fine Clothes, Longsword, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Marine: {
            A: {
                label: 'Bedroll, Belted Scimitar, Canteen, Common Clothes, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Scimitar', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Mercenary Veteran': {
            A: {
                label: 'Bedroll, Brass Dice, Common Clothes, Dungeoneer\'s Pack, Longsword, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Noble: {
            A: {
                label: 'Clothes, Fine, Letter of Introduction, Purse, Signet Ring, and 25 GP',
                items: [
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Outlander: {
            A: {
                label: 'Backpack, Bedroll, Blanket, Common Clothes, Dagger, Dungeoneer\'s Pack, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Pirate: {
            A: {
                label: 'Bedroll, Common Clothes, Crossbow Bolts (20), Dagger, Light Crossbow, Pearl (100 gp value), Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crossbow Bolts (20)', category: 'Ammunition', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Light Crossbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Pearl (100 gp)', category: 'Gemstone', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Rewarded: {
            A: {
                label: 'Backpack, Book of Lore, Calligrapher\'s Supplies, Common Clothes, Fine Clothes, Ink Pen, and 50 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 50 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Ruined: {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Crowbar, Dungeoneer\'s Pack, Rope (50 feet), and 1 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 1 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Rune Carver': {
            A: {
                label: 'Bedroll, Carver\'s Tools, Common Clothes, Gaming Set, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Sailor: {
            A: {
                label: 'Bedroll, Belted Scimitar, Canteen, Common Clothes, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Scimitar', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Shipwright: {
            A: {
                label: 'Artisan\'s Tools (Woodcarver\'s), Common Clothes, Hooded Lantern, Miner\'s Pick, Rope (50 feet), and 10 GP',
                items: [
                    { name: "Miner's Pick", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Hooded Lantern', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Smuggler: {
            A: {
                label: 'Bedroll, Boat (tiny), Common Clothes, Crowbar, Dungeoneer\'s Pack, Thieves\' Tools, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Soldier: {
            A: {
                label: 'Backpack, Bedroll, Common Clothes, Insignia, Longsword, Mess Kit, and 10 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Mess Kit', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Spy: {
            A: {
                label: 'Crowbar, Dark Common Clothes (with hood), Pouch, Thieves\' Tools, and 15 GP',
                items: [
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Urban Bounty Hunter': {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Crossbow Bolts (20), Light Crossbow, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crossbow Bolts (20)', category: 'Ammunition', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Light Crossbow', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Urchin: {
            A: {
                label: 'Bedroll, Common Clothes, Crowbar, Dagger, Dungeoneer\'s Pack, and 5 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Uthgardt Tribe Member': {
            A: {
                label: 'Bedroll, Common Clothes, Explorer\'s Pack, Hunting Trap, Insignia, Spear, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Explorer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Hunting Trap', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Spear', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Waterdhavian Noble': {
            A: {
                label: 'Fine Clothes, Letter of Introduction, Purse, Signet Ring, and 25 GP',
                items: [
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Witchlight Hand': {
            A: {
                label: 'Bedroll, Common Clothes, Disguise Kit, Dungeoneer\'s Pack, Mask, Pouch, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Black Fist Double Agent': {
            A: {
                label: 'Badge, Book (false identity), Common Clothes, Dungeoneer\'s Pack, Signet Ring, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Dragon Casualty': {
            A: {
                label: 'Bedroll, Common Clothes, Crowbar, Dungeoneer\'s Pack, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Iron Route Bandit': {
            A: {
                label: 'Bedroll, Common Clothes, Crowbar, Dungeoneer\'s Pack, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Phlan Insurgent': {
            A: {
                label: 'Bedroll, Common Clothes, Dagger, Dungeoneer\'s Pack, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Stojanow Prisoner': {
            A: {
                label: 'Bedroll, Common Clothes, Dagger, Dungeoneer\'s Pack, and 5 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Ticklebelly Nomad': {
            A: {
                label: 'Bedroll, Common Clothes, Dungeoneer\'s Pack, Goat, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Caravan Specialist': {
            A: {
                label: 'Bedroll, Common Clothes, Dungeoneer\'s Pack, Map, and 15 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Earthspur Miner': {
            A: {
                label: "Bedroll, Common Clothes, Dungeoneer's Pack, Miner's Pick, and 10 GP",
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Miner's Pick", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Harborfolk: {
            A: {
                label: 'Bedroll, Common Clothes, Dungeoneer\'s Pack, Fishing Tackle, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fishing Tackle', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Mulmaster Aristocrat': {
            A: {
                label: 'Fine Clothes, Letter of Introduction, Purse, Signet Ring, and 25 GP',
                items: [
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Phlan Refugee': {
            A: {
                label: 'Backpack, Bedroll, Common Clothes, Crowbar, Dungeoneer\'s Pack, and 1 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 1 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Cormanthor Refugee': {
            A: {
                label: 'Backpack, Bedroll, Common Clothes, Dungeoneer\'s Pack, and 1 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 1 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Gate Urchin': {
            A: {
                label: 'Bedroll, Common Clothes, Crowbar, Dagger, Dungeoneer\'s Pack, and 5 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Hillsfar Merchant': {
            A: {
                label: 'Backpack, Book of Lore, Common Clothes, Dungeoneer\'s Pack, Gaming Set, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Hillsfar Smuggler': {
            A: {
                label: 'Backpack, Common Clothes, Crowbar, Dungeoneer\'s Pack, Thieves\' Tools, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Secret Identity': {
            A: {
                label: 'Book (false identity), Common Clothes, Disguise Kit, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Shade Fanatic': {
            A: {
                label: 'Book (forbidden dark knowledge), Common Clothes, Disguise Kit, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Trade Sheriff': {
            A: {
                label: 'Badge, Book of Lore, Common Clothes, Dungeoneer\'s Pack, Longsword, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        "Celebrity Adventurer's Scion": {
            A: {
                label: 'Book of Lore, Common Clothes, Costume, Fine Clothes, and 25 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 25 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Failed Merchant': {
            A: {
                label: 'Backpack, Book of Lore, Common Clothes, Dungeoneer\'s Pack, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Gambler: {
            A: {
                label: 'Backpack, Common Clothes, Costume, Dice Set, Fine Clothes, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Plaintiff: {
            A: {
                label: 'Backpack, Book of Lore, Common Clothes, Fine Clothes, Ink Pen, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Rival Intern': {
            A: {
                label: 'Backpack, Book of Lore, Common Clothes, Dungeoneer\'s Pack, and 15 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Dissenter: {
            A: {
                label: 'Book (religious or philosophical), Common Clothes, Disguise Kit, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Initiate: {
            A: {
                label: 'Common Clothes, Holy Symbol, Mace, Prayer Book, and 15 GP',
                items: [
                    { name: 'Mace', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Vizier: {
            A: {
                label: 'Book of Lore, Common Clothes, Fine Clothes, Ink Pen, Lantern, and 20 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lantern, Hooded', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 20 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Knight of Solamnia': {
            A: {
                label: 'Bedroll, Book of Lore, Common Clothes, Dungeoneer\'s Pack, Longsword, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Mage of High Sorcery': {
            A: {
                label: 'Book of Lore, Common Clothes, Dagger, Fine Clothes, Ink Pen, Spellbook, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Spellbook', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Inquisitor: {
            A: {
                label: 'Book (holy text), Common Clothes, Dagger, Holy Symbol, and 15 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Gate Warden': {
            A: {
                label: 'Backpack, Book of Lore, Common Clothes, Dungeoneer\'s Pack, Lantern, and 10 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Lantern, Hooded', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Planar Philosopher': {
            A: {
                label: 'Book of Lore, Common Clothes, Ink Pen, Ink Vial, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Azorius Functionary': {
            A: {
                label: 'Book of Lore, Common Clothes, Fine Clothes, Ink Pen, and 20 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 20 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Boros Legionnaire': {
            A: {
                label: 'Common Clothes, Dungeoneer\'s Pack, Insignia, Longsword, and 10 GP',
                items: [
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Longsword', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Dimir Operative': {
            A: {
                label: 'Common Clothes, Dagger, Disguise Kit, Dungeoneer\'s Pack, Thieves\' Tools, and 10 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Thieves' Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Golgari Agent': {
            A: {
                label: 'Common Clothes, Dagger, Disguise Kit, Dungeoneer\'s Pack, Rope (50 feet), and 10 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Gruul Anarch': {
            A: {
                label: 'Common Clothes, Dagger, Dungeoneer\'s Pack, Handaxe, and 10 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Handaxe', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Izzet Engineer': {
            A: {
                label: 'Book of Lore, Common Clothes, Dungeoneer\'s Pack, Ink Pen, Tinker\'s Tools, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Tinker's Tools", category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Orzhov Representative': {
            A: {
                label: 'Common Clothes, Fine Clothes, Ink Pen, Ledger, and 20 GP',
                items: [
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 20 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Rakdos Cultist': {
            A: {
                label: 'Common Clothes, Dagger, Dungeoneer\'s Pack, Scimitar, and 10 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Scimitar', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Selesnya Initiate': {
            A: {
                label: 'Common Clothes, Dagger, Dungeoneer\'s Pack, Holy Symbol, and 10 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Simic Scientist': {
            A: {
                label: 'Book of Lore, Common Clothes, Dungeoneer\'s Pack, Ink Pen, Ink Vial, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Lorehold Student': {
            A: {
                label: 'Book of Lore, Common Clothes, Dagger, Dungeoneer\'s Pack, Ink Pen, and 15 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Prismari Student': {
            A: {
                label: 'Colored Ink Vials, Common Clothes, Cosmetic Wand, Dagger, Entertainers\'s Pack, and 15 GP',
                items: [
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Entertainer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Quandrix Student': {
            A: {
                label: 'Book of Lore, Common Clothes, Dagger, Dungeoneer\'s Pack, Ink Pen, and 15 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Silverquill Student': {
            A: {
                label: 'Book of Lore, Common Clothes, Dagger, Fine Clothes, Ink Pen, and 15 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Fine Clothes', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Witherbloom Student': {
            A: {
                label: 'Book of Lore, Common Clothes, Dagger, Herbalism Kit, and 15 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' }
                ],
                currency: { gp: 15 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Grinner: {
            A: {
                label: 'Common Clothes, Costume, Disguise Kit, Entertainers\'s Pack, and 10 GP',
                items: [
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Entertainer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Volstrucker Agent': {
            A: {
                label: 'Black or Dark Red Clothes, Book (false identity), Dagger, Disguise Kit, Dungeoneer\'s Pack, and 10 GP',
                items: [
                    { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Dagger', category: 'Weapon', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/weapons' },
                    { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        'Astral Drifter': {
            A: {
                label: 'Backpack, Bedroll, Common Clothes, Dungeoneer\'s Pack, Map, and 5 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Wildspacer: {
            A: {
                label: 'Backpack, Bedroll, Common Clothes, Dungeoneer\'s Pack, Rope (50 feet), and 5 GP',
                items: [
                    { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: 'Rope, Hempen (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 5 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        },
        Ashari: {
            A: {
                label: 'Bedroll, Common Clothes, Dungeoneer\'s Pack, Holy Symbol, Ki-ichigo, and 10 GP',
                items: [
                    { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' },
                    { name: "Dungeoneer's Pack", category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear' }
                ],
                currency: { gp: 10 }
            },
            B: {
                label: '50 GP',
                items: [],
                currency: { gp: 50 }
            }
        }
    };

    private readonly containerItemNames = new Set<string>([
        'Backpack',
        'Bag of Holding',
        'Bag of Tricks',
        'Handy Haversack',
        'Portable Hole',
        'Bandolier',
        'Belt Pouch',
        'Chest',
        'Pouch',
        'Sack',
        'Waterskin',
        'Barrel',
        'Barrel',
        'Basket',
        'Bottle',
        'Bucket',
        'Crate',
        'Jug',
        'Keg',
        'Quiver'
    ]);

    private readonly containerCapacities: Record<string, number> = {
        'Backpack': 60,
        'Bag of Holding': 500,
        'Bag of Tricks': 65,
        'Handy Haversack': 80,
        'Portable Hole': 500,
        'Bandolier': 15,
        'Belt Pouch': 5,
        'Chest': 100,
        'Pouch': 5,
        'Sack': 20,
        'Waterskin': 1,
        'Barrel': 50,
        'Basket': 30,
        'Bottle': 0.5,
        'Bucket': 15,
        'Crate': 100,
        'Jug': 2,
        'Keg': 75,
        'Quiver': 2
    };

    private readonly equipmentLookupAliases: Readonly<Record<string, readonly string[]>> = {
        'hempen rope 50 feet': ['rope hempen 50 feet'],
        'hooded lantern': ['lantern hooded'],
        'piton': ['pitons 10'],
        'ball bearings bag': ['ball bearings bag of 1000'],
        'parchment 10 sheets': ['parchment sheet'],
        'book prayers': ['book of lore'],
        'book holy text': ['book of lore'],
        'prayer book': ['book of lore'],
        'holy symbol': ['amulet'],
        'robe': ['robes']
    };

    private isContainerItem(itemName: string): boolean {
        return this.containerItemNames.has(itemName);
    }

    private getContainerCapacity(itemName: string): number {
        return this.containerCapacities[itemName] ?? 50;
    }

    private readonly startingPackContents: Readonly<Record<StartingPackName, ReadonlyArray<InventoryEntry>>> = {
        "Explorer's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 7, costGp: 1, notes: 'Sleep comfort, outdoors rest' },
            { name: 'Mess Kit', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.02, notes: 'Tin cup, fork, knife, and plate' },
            { name: 'Tinderbox', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.05, notes: 'Utility, Exploration, start fires' },
            { name: 'Torch', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: '1 hour, 20-ft bright / 20-ft dim light, 1 fire damage' },
            { name: 'Rations (1 day)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
            { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' },
            { name: 'Hempen Rope (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 10, costGp: 1, notes: 'AC 11, 2 HP, supports up to 500 lb, Utility, Exploration' }
        ],
        "Dungeoneer's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Advantage on Strength checks requiring leverage' },
            { name: 'Hammer', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 3, costGp: 1, notes: 'Drive pitons, basic repairs' },
            { name: 'Piton', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.25, costGp: 0.05, notes: 'Iron spike for climbing anchors' },
            { name: 'Torch', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.01, notes: '1 hour, 20-ft bright / 20-ft dim light, 1 fire damage' },
            { name: 'Tinderbox', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.05, notes: 'Utility, Exploration, start fires' },
            { name: 'Rations (1 day)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
            { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' },
            { name: 'Hempen Rope (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 10, costGp: 1, notes: 'AC 11, 2 HP, supports up to 500 lb, Utility, Exploration' }
        ],
        "Scholar's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Book of Lore', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 25, notes: 'Reference, blank or filled with academic knowledge' },
            { name: 'Ink (1-ounce bottle)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 10, notes: 'Writing supply' },
            { name: 'Ink Pen', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.02, notes: 'Writing tool' },
            { name: 'Parchment (sheet)', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.1, notes: 'Writing surface' },
            { name: 'Little Bag of Sand', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.5, costGp: 0, notes: 'Dry ink on fresh writing' },
            { name: 'Small Knife', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.5, costGp: 0, notes: 'Utility cutting tool' }
        ],
        "Priest's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Blanket', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 3, costGp: 0.5, notes: 'Warmth and comfort during rest' },
            { name: 'Candle', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.01, notes: '1 hour, 5-ft bright / 5-ft dim light' },
            { name: 'Tinderbox', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.05, notes: 'Utility, Exploration, start fires' },
            { name: 'Alms Box', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.5, costGp: 0, notes: 'Collect charitable donations' },
            { name: 'Block of Incense', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.1, notes: 'Ritual, ceremonial burning' },
            { name: 'Censer', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0, notes: 'Vessel for burning incense during rituals' },
            { name: 'Vestments', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 4, costGp: 1, notes: 'Religious ceremonial clothing' },
            { name: 'Rations (1 day)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
            { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' }
        ],
        "Burglar's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Ball Bearings (bag)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.1, notes: '1000 bearings, DC 10 Dex or fall prone in 10-ft area' },
            { name: 'String (10 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0, notes: 'Utility, traps, signals' },
            { name: 'Bell', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.1, notes: 'Alarm trigger, signal device' },
            { name: 'Candle', category: 'Adventuring Gear', quantity: 5, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.01, notes: '1 hour, 5-ft bright / 5-ft dim light' },
            { name: 'Crowbar', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Advantage on Strength checks requiring leverage' },
            { name: 'Hammer', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 3, costGp: 1, notes: 'Drive pitons, basic repairs' },
            { name: 'Piton', category: 'Adventuring Gear', quantity: 10, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0.25, costGp: 0.05, notes: 'Iron spike for climbing anchors' },
            { name: 'Hooded Lantern', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 5, notes: '30-ft bright / 60-ft dim light, concealable beam' },
            { name: 'Oil (flask)', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.1, notes: 'Fuel for lanterns; throwable for 5 fire damage' },
            { name: 'Rations (1 day)', category: 'Adventuring Gear', quantity: 5, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
            { name: 'Tinderbox', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 1, costGp: 0.05, notes: 'Utility, Exploration, start fires' },
            { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' },
            { name: 'Hempen Rope (50 feet)', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 10, costGp: 1, notes: 'AC 11, 2 HP, supports up to 500 lb, Utility, Exploration' }
        ],
        "Entertainer's Pack": [
            { name: 'Backpack', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 2, notes: 'Container, 30 lb / 1 cu. ft. capacity' },
            { name: 'Bedroll', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 7, costGp: 1, notes: 'Sleep comfort, outdoors rest' },
            { name: 'Costume', category: 'Adventuring Gear', quantity: 2, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 4, costGp: 5, notes: 'Performance attire, disguise base' },
            { name: 'Candle', category: 'Adventuring Gear', quantity: 5, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 0, costGp: 0.01, notes: '1 hour, 5-ft bright / 5-ft dim light' },
            { name: 'Rations (1 day)', category: 'Adventuring Gear', quantity: 5, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 2, costGp: 0.5, notes: 'Consumable, dried food for one day' },
            { name: 'Waterskin', category: 'Adventuring Gear', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/adventuring-gear', weight: 5, costGp: 0.02, notes: 'Holds 4 pints of liquid' },
            { name: 'Disguise Kit', category: 'Tools', quantity: 1, sourceUrl: 'https://dnd5e.wikidot.com/tools', weight: 3, costGp: 25, notes: 'Alter appearance, create costumes' }
        ]
    };

    readonly equipmentClassName = computed(() => this.getPrimaryClassName() || 'Class');
    readonly equipmentBackgroundName = computed(() => this.selectedBackground()?.name || this.selectedBackgroundName() || 'Background');
    readonly hasClassStartingPackageData = computed(() => !!this.classStartingPackagePresets[this.equipmentClassName()]);
    readonly hasBackgroundStartingPackageData = computed(() => !!this.backgroundStartingPackagePresets[this.equipmentBackgroundName()]);

    readonly resolvedClassStartingPackages = computed<Readonly<Record<'A' | 'B', StartingEquipmentPackage>>>(() =>
        this.classStartingPackagePresets[this.equipmentClassName()] ?? {
            A: { label: 'Class package data is not configured for this class yet.', items: [], currency: {} },
            B: { label: 'Class gold alternative is not configured for this class yet.', items: [], currency: {} }
        }
    );

    readonly resolvedBackgroundStartingPackages = computed<Readonly<Record<'A' | 'B', StartingEquipmentPackage>>>(() =>
        this.backgroundStartingPackagePresets[this.equipmentBackgroundName()] ?? {
            A: { label: 'Background package data is not configured for this background yet.', items: [], currency: {} },
            B: { label: 'Background gold alternative is not configured for this background yet.', items: [], currency: {} }
        }
    );

    readonly selectedBackground = computed(() => {
        const selectedUrl = this.selectedBackgroundUrl();
        if (!selectedUrl) {
            return null;
        }

        return this.backgroundOptions.find((background) => background.url === selectedUrl) ?? null;
    });

    readonly selectedBackgroundDetail = computed<BackgroundDetail | null>(() => {
        const selected = this.selectedBackground();
        if (!selected) {
            return null;
        }

        const override = backgroundDetailOverrides[selected.name];
        if (override) {
            return { ...override, sourceUrl: selected.url };
        }

        return {
            description: backgroundDescriptionFallbacks[selected.name] ?? `${selected.name} shaped your life before adventuring, influencing your worldview, practical talents, and the story hooks you bring to the table.`,
            skillProficiencies: backgroundSkillProficienciesFallbacks[selected.name] ?? 'See source entry',
            toolProficiencies: backgroundToolProficienciesFallbacks[selected.name] ?? 'See source entry',
            languages: backgroundLanguagesFallbacks[selected.name] ?? 'See source entry',
            choices: [
                {
                    key: 'ability-scores',
                    title: 'Ability Scores',
                    subtitle: '1 Choice',
                    options: ['Increase three scores (+1 / +1 / +1)', 'Increase two scores (+2 / +1)']
                },
                {
                    key: 'background-feature',
                    title: 'Background Feature',
                    subtitle: `${selected.name} feature`,
                    description: 'Choose how your background feature most often appears in play.',
                    options: ['Social Access', 'Travel/Exploration Utility', 'Downtime Advantage']
                },
                {
                    key: 'characteristics-focus',
                    title: 'Suggested Characteristics',
                    subtitle: 'Traits, Ideals, Bonds, Flaws',
                    options: ['Roleplay Flavor Focus', 'Party Utility Focus', 'Story Hook Focus']
                }
            ],
            sourceUrl: selected.url
        };
    });

    readonly backgroundSkillProficiencies = computed(() => {
        const detail = this.selectedBackgroundDetail();
        if (!detail) {
            return [];
        }
        return detail.skillProficiencies
            .split(',')
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0 && skill !== 'See source entry');
    });

    readonly pointBuySpent = computed(() => {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return 0;
        }

        return this.abilityTiles.reduce((total, ability) => {
            const score = this.abilityBaseScores()[ability] ?? 8;
            return total + this.getPointBuyCost(score);
        }, 0);
    });

    readonly pointBuyRemaining = computed(() => this.pointBuyBudget - this.pointBuySpent());

    openClassModal(className: string): void {
        const info = classInfoMap[className];
        if (!info) {
            return;
        }

        const fallbackDetails = classDetailFallbacks[className];
        const details = info.details ?? fallbackDetails;

        if (!details) {
            this.activeInfoModal.set({ type: 'class', info });
            return;
        }

        const subclassSnapshot = classSubclassSnapshots[className];
        const baseFeatureNotes = details.featureNotes.map((note) => ({ ...note }));
        const hasSnapshotNote = baseFeatureNotes.some((note) => note.title === 'Published Subclass Snapshot');

        if (subclassSnapshot && !hasSnapshotNote) {
            baseFeatureNotes.push({
                title: 'Published Subclass Snapshot',
                summary: subclassSnapshot.summary,
                details: subclassSnapshot.details
            });
        }

        const enrichedInfo: BuilderInfo = {
            ...info,
            details: {
                ...details,
                levelOneGains: [...details.levelOneGains],
                coreTraits: details.coreTraits.map((trait) => ({ ...trait })),
                levelMilestones: details.levelMilestones.map((milestone) => ({ ...milestone })),
                featureNotes: baseFeatureNotes
            }
        };

        this.activeInfoModal.set({ type: 'class', info: enrichedInfo });
    }

    readonly selectedSpeciesInfo = computed(() => {
        const name = this.selectedSpeciesName();
        return name ? speciesInfoMap[name] : null;
    });
    readonly selectedSpeciesSlug = computed(() => {
        const name = this.selectedSpeciesName();
        return name ? speciesNameToSlug(name) : '';
    });
    readonly selectedSpeciesImagePath = computed(() => {
        const slug = this.selectedSpeciesSlug();
        return slug ? getSpeciesImagePath(slug) : null;
    });
    readonly selectedSpeciesImageObjectPosition = computed(() => getSpeciesImageObjectPosition(this.selectedSpeciesSlug()));
    readonly selectedSpeciesRulesLink = computed(() => {
        const slug = this.selectedSpeciesSlug();
        return slug ? ['/rules/species', slug] : ['/rules/species'];
    });
    readonly selectedSpeciesLanguageTrait = computed(() =>
        this.selectedSpeciesInfo()?.speciesDetails?.traitNotes.find((trait) => trait.title === 'Languages') ?? null
    );
    readonly speciesKnownLanguages = computed(() => this.extractKnownLanguages(this.selectedSpeciesLanguageTrait()?.details ?? ''));
    readonly speciesLanguageChoiceCount = computed(() => this.selectedSpeciesLanguageTrait()?.choices ?? 0);
    readonly speciesLanguagePlaceholder = computed(() =>
        this.speciesLanguageChoiceCount() === 1 ? 'Choose additional language...' : 'Choose additional languages...'
    );
    readonly backgroundLanguageChoiceCount = computed(() => this.getLanguageChoiceCount(this.selectedBackgroundDetail()?.languages ?? ''));
    readonly backgroundLanguageChoiceInChoices = computed(() =>
        this.selectedBackgroundDetail()?.choices.some((c) => this.isLanguageChoiceKey(c.key)) ?? false
    );
    readonly backgroundLanguagePlaceholder = computed(() => {
        const rule = this.selectedBackgroundDetail()?.languages ?? '';
        return /standard language/i.test(rule)
            ? 'Choose a standard language...'
            : this.backgroundLanguageChoiceCount() === 1
                ? 'Choose an additional language...'
                : 'Choose additional languages...';
    });
    readonly backgroundLanguageGroups = computed(() => this.getLanguageGroupsForRule(this.selectedBackgroundDetail()?.languages ?? ''));
    readonly speciesLanguageDisabledOptions = computed(() => this.getLanguageDisabledOptions(this.selectedSpeciesLanguages()));
    readonly backgroundLanguageDisabledOptions = computed(() => this.getLanguageDisabledOptions(this.selectedLanguages()));
    readonly suggestedPlayerName = computed(() => this.session.currentUser()?.displayName ?? 'Player');
    readonly canCompleteCharacter = computed(() => {
        const hasName = this.completionCharacterName().trim().length > 0;
        const hasClass = this.getPrimaryClassName().length > 0;
        return hasName && hasClass;
    });

    selectSpecies(name: string): void {
        this.selectedSpeciesName.set(name);
        this.selectedSpeciesLanguages.set([]);
        this.selectedSpeciesTraitChoices.set({});
        this.openTraitKeys.set(new Set<string>());
    }

    changeSpecies(): void {
        this.selectedSpeciesName.set('');
        this.selectedSpeciesLanguages.set([]);
        this.selectedSpeciesTraitChoices.set({});
    }

    getSpeciesTraitChoiceIndexes(count: number): number[] {
        return Array.from({ length: Math.max(1, count) }, (_, index) => index);
    }

    getSpeciesTraitChoiceValue(traitTitle: string, choiceIndex: number): string {
        return this.selectedSpeciesTraitChoices()[traitTitle]?.[choiceIndex] ?? '';
    }

    getSpeciesTraitChoicePlaceholder(traitTitle: string): string {
        if (traitTitle === 'Skillful') {
            return '- Choose a Skill -';
        }

        if (traitTitle === 'Versatile') {
            return '- Choose an Origin Feat -';
        }

        if (traitTitle === 'Draconic Ancestry') {
            return '- Choose a Draconic Ancestry -';
        }

        if (traitTitle === 'Elven Lineage') {
            return '- Choose an Elven Lineage -';
        }

        if (traitTitle === 'Lineage Spellcasting Ability') {
            return '- Choose a Spellcasting Ability -';
        }

        if (traitTitle === 'Fiendish Legacy') {
            return '- Choose a Fiendish Legacy -';
        }

        return '- Choose an Option -';
    }

    getSpeciesTraitChoiceOptions(traitTitle: string, choiceIndex: number): DropdownOption[] {
        const pool = traitTitle === 'Skillful'
            ? this.speciesSkillChoiceOptions
            : traitTitle === 'Versatile'
                ? this.speciesOriginFeatOptions
                : traitTitle === 'Draconic Ancestry'
                    ? ['Black (Acid)', 'Blue (Lightning)', 'Brass (Fire)', 'Bronze (Lightning)', 'Copper (Acid)', 'Gold (Fire)', 'Green (Poison)', 'Red (Fire)', 'Silver (Cold)', 'White (Cold)']
                    : traitTitle === 'Elven Lineage'
                        ? ['Drow', 'High Elf', 'Wood Elf']
                        : traitTitle === 'Lineage Spellcasting Ability'
                            ? ['Intelligence', 'Wisdom', 'Charisma']
                            : traitTitle === 'Fiendish Legacy'
                                ? ['Abyssal', 'Chthonic', 'Infernal']
                                : [];

        const selected = this.selectedSpeciesTraitChoices()[traitTitle] ?? [];

        return pool.map((option) => ({
            value: option,
            label: option,
            disabled: selected.some((value, index) => value === option && index !== choiceIndex)
        }));
    }

    onSpeciesTraitChoiceChanged(traitTitle: string, choiceIndex: number, value: string | number): void {
        const nextValue = String(value);
        this.selectedSpeciesTraitChoices.update((current) => {
            const existing = [...(current[traitTitle] ?? [])];
            existing[choiceIndex] = nextValue;
            const compact = existing.filter((entry) => entry && entry.trim().length > 0);
            return {
                ...current,
                [traitTitle]: compact
            };
        });
    }

    getSpeciesTraitChoiceSelectionText(traitTitle: string, selectedValue: string): string {
        const normalizedTrait = traitTitle.trim();
        const normalizedValue = selectedValue.trim();

        if (!normalizedTrait || !normalizedValue) {
            return '';
        }

        if (normalizedTrait !== 'Fiendish Legacy') {
            return '';
        }

        if (normalizedValue === 'Abyssal') {
            return 'Abyssal Legacy: You have Resistance to Poison damage. You know Poison Spray. At level 3, you learn Ray of Sickness. At level 5, you learn Hold Person.';
        }

        if (normalizedValue === 'Chthonic') {
            return 'Chthonic Legacy: You have Resistance to Necrotic damage. You know Chill Touch. At level 3, you learn False Life. At level 5, you learn Ray of Enfeeblement.';
        }

        if (normalizedValue === 'Infernal') {
            return 'Infernal Legacy: You have Resistance to Fire damage. You know Fire Bolt. At level 3, you learn Hellish Rebuke. At level 5, you learn Darkness.';
        }

        return '';
    }

    toggleTrait(key: string): void {
        this.openTraitKeys.update((keys) => {
            const next = new Set(keys);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    isTraitOpen(key: string): boolean {
        return this.openTraitKeys().has(key);
    }

    openSpeciesModal(speciesName: string): void {
        const info = speciesInfoMap[speciesName];
        if (!info) {
            return;
        }

        this.activeInfoModal.set({ type: 'species', info });
    }

    closeInfoModal(): void {
        this.activeInfoModal.set(null);
    }

    onInfoModalConfirmed(modal: ActiveInfoModal): void {
        if (modal.type === 'class') {
            this.selectClass(modal.info.name);
            return;
        }

        if (modal.type === 'species') {
            this.selectSpecies(modal.info.name);
            this.closeInfoModal();
            return;
        }

        this.selectBackground(modal.info.name);
    }

    selectClass(className: string): void {
        const current = this.multiclassList();
        const preservedLevel = Math.min(20, Math.max(1, Math.trunc(current[className] ?? this.characterLevel() ?? 1)));

        this.multiclassList.set({
            ...current,
            [className]: preservedLevel
        });
        this.setClassPanelTab(className, 'class-features');
        this.syncPreparedSpellsForClass(className, preservedLevel);
        this.characterLevel.set(preservedLevel);
        this.navigationEditLevel.set(preservedLevel);
        this.selectedClass.set('');
        this.closeInfoModal();
    }

    selectBackground(backgroundName: string): void {
        this.selectedBackgroundName.set(backgroundName);
        const option = this.backgroundOptions.find((entry) => entry.name.toLowerCase() === backgroundName.toLowerCase());
        this.selectedBackgroundUrl.set(option?.url ?? '');
        this.closeInfoModal();
    }

    updateClassFeatureSelection(featureName: string, chosenValues: string[]): void {
        this.classFeatureSelections.update((current) => ({
            ...current,
            [featureName]: chosenValues
        }));
    }

    onFeatureChoiceChange(featureName: string, option: string, isChecked: boolean, maxChoices: number): void {
        this.classFeatureSelections.update((current) => {
            const currentSelections = current[featureName] || [];
            if (isChecked) {
                // Add option if not at limit
                if (currentSelections.length < maxChoices) {
                    return { ...current, [featureName]: [...currentSelections, option] };
                }
            } else {
                // Remove option
                return { ...current, [featureName]: currentSelections.filter((s: string) => s !== option) };
            }
            return current;
        });
    }

    getFeatureChoiceIndexes(count: number): number[] {
        return Array.from({ length: Math.max(1, count) }, (_, index) => index);
    }

    getFeatureChoiceIndexesForFeature(feature: ClassFeature): number[] {
        if (this.isEpicBoonFeature(feature)) {
            return [0];
        }

        return this.getFeatureChoiceIndexes(feature.choices?.count ?? 1);
    }

    getFeatureChoiceStatusText(className: string, feature: ClassFeature): string {
        const choices = feature.choices;
        if (!choices) {
            return '';
        }

        const key = this.getFeatureSelectionKey(className, feature);
        const selected = this.classFeatureSelections()[key] ?? [];
        const selectedCount = selected.length;
        const targetCount = this.isEpicBoonFeature(feature) ? 1 : choices.count;

        if (selectedCount === 0) {
            return `Selected 0/${targetCount}`;
        }

        if (this.isAbilityScoreImprovementFeature(feature) && selected[0] === 'Ability Score Improvement') {
            const asiChoice = this.getAbilityScoreImprovementChoice(className, feature);
            if (asiChoice.mode === 'plus-two' && asiChoice.primaryAbility) {
                return `Selected 1/${targetCount}: Ability Score Improvement (+2 ${asiChoice.primaryAbility})`;
            }

            if (asiChoice.mode === 'plus-one-plus-one' && asiChoice.primaryAbility && asiChoice.secondaryAbility) {
                return `Selected 1/${targetCount}: Ability Score Improvement (+1 ${asiChoice.primaryAbility}, +1 ${asiChoice.secondaryAbility})`;
            }
        }

        const summary = selected.join(', ');
        return `Selected ${Math.min(selectedCount, targetCount)}/${targetCount}: ${summary}`;
    }

    getFeatureChoiceInfoText(feature: ClassFeature): string {
        switch (feature.name) {
            case 'Weapon Mastery':
            case '4: Weapon Mastery':
                return 'Choose weapon types you regularly attack with so mastery options matter in your core combat loop.';
            case 'Fighting Style':
                return 'Pick Blessed Warrior for cantrips, or Fighting Style Feat for martial specialization.';
            case 'Blessed Warrior Cantrips':
                return 'These cantrips count as Paladin spells for you, and Charisma is your spellcasting ability.';
            case 'Fighting Style Feat':
                return 'Pick the style that best matches your primary weapon setup.';
            case 'Barbarian Subclass':
                return 'Your path defines subclass features at levels 3, 6, 10, and 14.';
            case 'Blood Hunter Order':
                return 'Your order grants subclass features at levels 3, 7, 11, and 15.';
            case 'Artificer Specialist':
                return 'Your specialist grants subclass features at levels 3, 5, 9, and 15.';
            case 'Bard Subclass':
                return 'Your bard college grants subclass features at levels 3, 6, and 14.';
            case 'Cleric Subclass':
                return 'Your divine domain grants subclass features at levels 3, 6, and 17.';
            case 'Druid Subclass':
                return 'Your druid circle grants subclass features at levels 3, 6, 10, and 14.';
            case 'Fighter Subclass':
                return 'Your martial archetype grants subclass features at levels 3, 7, 10, 15, and 18.';
            case 'Gunslinger Style':
                return 'Your style grants subclass features at levels 3, 6, 14, and 17.';
            case 'Monk Subclass':
                return 'Your monastic tradition grants subclass features at levels 3, 6, 11, and 17.';
            case 'Hunter Order':
                return 'Your order grants subclass features at levels 3, 7, 10, 13, and 18.';
            case 'Primal Knowledge':
                return 'Choose one additional Barbarian skill proficiency.';
            case 'Paladin Subclass':
                return 'Your Sacred Oath defines subclass features at levels 3, 7, 15, and 20.';
            case 'Ranger Subclass':
                return 'Your ranger conclave grants subclass features at levels 3, 7, 11, and 15.';
            case 'Rogue Subclass':
                return 'Your roguish archetype grants subclass features at levels 3, 9, 13, and 17.';
            case 'Sorcerous Origin':
            case 'Sorcerer Subclass':
                return 'Your sorcerer subclass grants features at levels 3, 6, 14, and 18.';
            case 'Warlock Subclass':
                return 'Your patron grants subclass features at levels 3, 6, 10, and 14.';
            case 'Wizard Subclass':
                return 'Your arcane tradition grants subclass features at levels 3, 6, 10, and 14.';
            case 'Ability Score Improvement':
                return 'You can pick a feat or take a standard Ability Score Improvement. These increases can’t raise an ability score above 20.';
            case 'Epic Boon':
                return 'Epic Boons are high-level feats with strong late-game bonuses.';
            default:
                return '';
        }
    }

    getFeatureChoiceSourceUrl(feature: ClassFeature): string {
        switch (feature.name) {
            case 'Weapon Mastery':
            case '4: Weapon Mastery':
                return 'https://roll20.net/compendium/dnd5e/Weapons#content';
            case 'Barbarian Subclass':
                return 'https://www.dndbeyond.com/classes/barbarian';
            case 'Artificer Specialist':
                return 'https://www.dndbeyond.com/classes/artificer';
            case 'Bard Subclass':
                return 'https://www.dndbeyond.com/classes/bard';
            case 'Cleric Subclass':
                return 'https://www.dndbeyond.com/classes/cleric';
            case 'Druid Subclass':
                return 'https://www.dndbeyond.com/classes/druid';
            case 'Fighter Subclass':
                return 'https://www.dndbeyond.com/classes/fighter';
            case 'Monk Subclass':
                return 'https://www.dndbeyond.com/classes/monk';
            case 'Paladin Subclass':
                return 'https://www.dndbeyond.com/classes/paladin';
            case 'Ranger Subclass':
                return 'https://www.dndbeyond.com/classes/ranger';
            case 'Rogue Subclass':
                return 'https://www.dndbeyond.com/classes/rogue';
            case 'Sorcerous Origin':
            case 'Sorcerer Subclass':
                return 'https://www.dndbeyond.com/classes/sorcerer';
            case 'Warlock Subclass':
                return 'https://www.dndbeyond.com/classes/warlock';
            case 'Wizard Subclass':
                return 'https://www.dndbeyond.com/classes/wizard';
            case 'Ability Score Improvement':
            case 'Epic Boon':
            case 'Fighting Style Feat':
                return 'https://www.dndbeyond.com/feats';
            default:
                return '';
        }
    }

    getFeatureChoiceValue(className: string, feature: ClassFeature, choiceIndex: number): string {
        const key = this.getFeatureSelectionKey(className, feature);
        return this.classFeatureSelections()[key]?.[choiceIndex] ?? '';
    }

    getFeatureChoiceDropdownId(className: string, feature: ClassFeature, choiceIndex: number): string {
        const normalizedClass = className.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const normalizedName = feature.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `feature-choice-${normalizedClass}-${feature.level}-${normalizedName}-${choiceIndex}`;
    }

    getFeatureChoiceTitle(feature: ClassFeature): string {
        if (!feature.choices) {
            return '';
        }

        if (feature.name === 'Epic Boon') {
            return 'Choose 1 Epic Boon';
        }

        return feature.choices.title;
    }

    getFeatureChoiceBadgeCount(feature: ClassFeature): number {
        const count = feature.choices?.count ?? 0;
        if (feature.name === 'Epic Boon') {
            return 1;
        }

        return Math.max(1, count);
    }

    getFeatureChoicePlaceholder(feature: ClassFeature): string {
        if (this.isWizardSavantFeature(feature.name)) {
            return '- Choose a Spell -';
        }

        if (feature.name === 'Epic Boon') {
            return '- Choose an Epic Boon -';
        }

        if (this.isWeaponMasteryFeature(feature)) {
            return '- Choose a Weapon Mastery -';
        }

        if (feature.name.includes('Subclass')) {
            return '- Choose a Subclass -';
        }

        return '- Choose an Option -';
    }

    getFeatureChoiceDropdownOptions(className: string, feature: ClassFeature, choiceIndex: number): DropdownOption[] {
        const choices = feature.choices;
        if (!choices) {
            return [];
        }

        const key = this.getFeatureSelectionKey(className, feature);
        const selectedValues = this.classFeatureSelections()[key] ?? [];
        const currentValue = selectedValues[choiceIndex] ?? '';
        const selectedElsewhere = new Set(
            selectedValues.filter((value, index) => index !== choiceIndex && value)
        );

        if (this.isWeaponMasteryFeature(feature)) {
            for (const selectedMastery of this.getSelectedWeaponMasteries(className, feature, choiceIndex)) {
                selectedElsewhere.add(selectedMastery);
            }
        }

        if (this.isEpicBoonFeature(feature)) {
            for (const selectedBoon of this.getSelectedEpicBoons(className, feature, choiceIndex)) {
                selectedElsewhere.add(selectedBoon);
            }
        }

        return choices.options.map((option) => {
            const repeatCount = this.getSelectedRepeatableSkillChoiceCount(option, {
                source: 'classFeature',
                key,
                index: choiceIndex
            });

            return {
                value: option,
                label: option,
                disabled: this.isRepeatableSkillChoice(option)
                    ? repeatCount >= 2 && option !== currentValue
                    : selectedElsewhere.has(option) && option !== currentValue
            };
        });
    }

    onFeatureChoiceDropdownChanged(className: string, feature: ClassFeature, choiceIndex: number, value: string | number): void {
        const choices = feature.choices;
        if (!choices) {
            return;
        }

        const key = this.getFeatureSelectionKey(className, feature);
        const normalized = String(value ?? '').trim();

        if (normalized && this.isWeaponMasteryFeature(feature)) {
            const selectedWeaponMasteries = this.getSelectedWeaponMasteries(className, feature, choiceIndex);
            if (selectedWeaponMasteries.has(normalized)) {
                return;
            }
        }

        if (normalized && this.isEpicBoonFeature(feature)) {
            const selectedEpicBoons = this.getSelectedEpicBoons(className, feature, choiceIndex);
            if (selectedEpicBoons.has(normalized)) {
                return;
            }
        }

        this.classFeatureSelections.update((current) => {
            const nextSelections = [...(current[key] ?? [])];

            if (!normalized) {
                nextSelections.splice(choiceIndex, 1);
            } else if (this.isRepeatableSkillChoice(normalized)) {
                const repeatCount = this.getSelectedRepeatableSkillChoiceCount(normalized, {
                    source: 'classFeature',
                    key,
                    index: choiceIndex
                });

                if (repeatCount >= 2) {
                    return current;
                }

                nextSelections[choiceIndex] = normalized;
            } else {
                const duplicateIndex = nextSelections.findIndex((entry, index) => entry === normalized && index !== choiceIndex);
                if (duplicateIndex >= 0) {
                    nextSelections.splice(duplicateIndex, 1);
                }
                nextSelections[choiceIndex] = normalized;
            }

            const compactSelections = nextSelections
                .map((entry) => entry?.trim())
                .filter((entry): entry is string => !!entry)
                .slice(0, choices.count);

            if (!compactSelections.length) {
                const { [key]: _, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [key]: compactSelections
            };
        });
        if ((this.isAbilityScoreImprovementFeature(feature) || this.isEpicBoonFeature(feature)) && choiceIndex === 0) {
            const selectedValue = String(value ?? '').trim();

            if (this.isAbilityScoreImprovementFeature(feature) && selectedValue !== 'Ability Score Improvement') {
                this.abilityScoreImprovementChoices.update((current) => {
                    const { [key]: _, ...rest } = current;
                    return rest;
                });
            }

            if (!this.requiresFeatFollowUpChoice(selectedValue)) {
                this.featFollowUpChoices.update((current) => {
                    const { [key]: _, ...rest } = current;
                    return rest;
                });
            } else {
                const validAbilityOptions = this.getFeatAbilityIncreaseChoicesByFeat(selectedValue);
                this.featFollowUpChoices.update((current) => {
                    const existing = current[key];
                    if (!existing) {
                        return current;
                    }

                    const nextAbility = validAbilityOptions.includes(existing.abilityIncreaseAbility)
                        ? existing.abilityIncreaseAbility
                        : '';

                    return {
                        ...current,
                        [key]: {
                            ...existing,
                            abilityIncreaseAbility: nextAbility
                        }
                    };
                });
            }
        }
    }

    getFeatureChoiceSpellCatalogOption(className: string, spellName: string): ClassSpellOption | null {
        const normalized = spellName.trim();
        if (!normalized) {
            return null;
        }

        const catalog = this.classSpellCatalog[className] ?? [];
        return catalog.find((entry) => entry.name === normalized) ?? null;
    }

    shouldShowAbilityScoreImprovementPickers(className: string, feature: ClassFeature): boolean {
        if (!this.isAbilityScoreImprovementFeature(feature)) {
            return false;
        }

        const key = this.getFeatureSelectionKey(className, feature);
        const selectedValue = this.classFeatureSelections()[key]?.[0] ?? '';
        return selectedValue === 'Ability Score Improvement';
    }

    getAbilityScoreImprovementModeOptions(): DropdownOption[] {
        return [
            { value: 'plus-two', label: '+2 to one ability score' },
            { value: 'plus-one-plus-one', label: '+1 to two ability scores' }
        ];
    }

    getSelectedAbilityScoreImprovementFeat(className: string, feature: ClassFeature): string {
        const key = this.getFeatureSelectionKey(className, feature);
        return this.classFeatureSelections()[key]?.[0] ?? '';
    }

    getSelectedAbilityScoreImprovementFeatDescription(className: string, feature: ClassFeature): string {
        if (!this.isAbilityScoreImprovementFeature(feature)) {
            return '';
        }

        const selectedFeat = this.getSelectedAbilityScoreImprovementFeat(className, feature);
        if (!selectedFeat) {
            return '';
        }

        return this.abilityScoreImprovementFeatDescriptions[selectedFeat]
            ?? `${selectedFeat}: choose this feat to add a focused combat, utility, or survivability benefit.`;
    }

    getSelectedAbilityScoreImprovementFeatClassification(className: string, feature: ClassFeature): string {
        if (!this.isAbilityScoreImprovementFeature(feature)) {
            return '';
        }

        const selectedFeat = this.getSelectedAbilityScoreImprovementFeat(className, feature);
        if (!selectedFeat) {
            return '';
        }

        return this.abilityScoreImprovementFeatDetails[selectedFeat]?.classification ?? '';
    }

    getSelectedAbilityScoreImprovementFeatIntro(className: string, feature: ClassFeature): string {
        if (!this.isAbilityScoreImprovementFeature(feature)) {
            return '';
        }

        const selectedFeat = this.getSelectedAbilityScoreImprovementFeat(className, feature);
        if (!selectedFeat) {
            return '';
        }

        return this.abilityScoreImprovementFeatDetails[selectedFeat]?.intro ?? '';
    }

    getSelectedAbilityScoreImprovementFeatBenefits(className: string, feature: ClassFeature): ReadonlyArray<AbilityScoreImprovementFeatBenefit> {
        if (!this.isAbilityScoreImprovementFeature(feature)) {
            return [];
        }

        const selectedFeat = this.getSelectedAbilityScoreImprovementFeat(className, feature);
        if (!selectedFeat) {
            return [];
        }

        return this.abilityScoreImprovementFeatDetails[selectedFeat]?.benefits ?? [];
    }

    getSelectedBarbarianSubclassDetail(className: string, feature: ClassFeature): BarbarianSubclassDetail | null {
        if (className !== 'Barbarian' || feature.name !== 'Barbarian Subclass') {
            return null;
        }

        const selected = this.getFeatureChoiceValue(className, feature, 0);
        if (!selected) {
            return null;
        }

        return this.barbarianSubclassDetails[selected] ?? null;
    }

    getSelectedEpicBoonClassification(className: string, feature: ClassFeature): string {
        const selectedBoon = this.getSelectedEpicBoon(className, feature);
        if (!selectedBoon) {
            return '';
        }

        return `Epic Boon Feat (Prerequisite: ${selectedBoon.prerequisite ?? 'Level 19+'})`;
    }

    getSelectedEpicBoonIntro(className: string, feature: ClassFeature): string {
        return this.getSelectedEpicBoon(className, feature) ? 'You gain the following benefits.' : '';
    }

    getSelectedEpicBoonBenefits(className: string, feature: ClassFeature): ReadonlyArray<AbilityScoreImprovementFeatBenefit> {
        const selectedBoon = this.getSelectedEpicBoon(className, feature);
        if (!selectedBoon) {
            return [];
        }

        const benefits: AbilityScoreImprovementFeatBenefit[] = [];

        if (selectedBoon.abilityScoreIncrease?.trim()) {
            benefits.push({
                title: 'Ability Score Increase',
                description: this.describeEpicBoonAbilityIncrease(selectedBoon.abilityScoreIncrease)
            });
        }

        if (selectedBoon.features?.length) {
            benefits.push(
                ...selectedBoon.features.map((entry) => ({
                    title: entry.title,
                    description: entry.text
                }))
            );
        } else if (selectedBoon.benefit.trim()) {
            benefits.push({ title: 'Benefit', description: selectedBoon.benefit.trim() });
        }

        return benefits;
    }

    shouldShowGrapplerPicker(className: string, feature: ClassFeature): boolean {
        return this.getSelectedAbilityScoreImprovementFeat(className, feature) === 'Grappler';
    }

    shouldShowFeatAbilityIncreasePicker(className: string, feature: ClassFeature): boolean {
        const selected = this.getSelectedAbilityIncreaseSourceName(className, feature);
        if (!selected || selected === 'Ability Score Improvement') {
            return false;
        }

        return this.getFeatAbilityIncreaseChoicesByFeat(selected).length > 0;
    }

    shouldShowWeaponMasterPicker(className: string, feature: ClassFeature): boolean {
        return this.getSelectedAbilityScoreImprovementFeat(className, feature) === 'Weapon Master';
    }

    getFeatAbilityIncreasePlaceholder(className: string, feature: ClassFeature): string {
        const selected = this.getSelectedAbilityIncreaseSourceName(className, feature);
        if (selected === 'Grappler') {
            return '- Choose Strength or Dexterity -';
        }

        return '- Choose an Ability Score -';
    }

    getFeatAbilityIncreaseOptions(className: string, feature: ClassFeature): DropdownOption[] {
        const selected = this.getSelectedAbilityIncreaseSourceName(className, feature);
        const currentValue = this.getFeatAbilityIncreaseValue(className, feature);

        return this.getFeatAbilityIncreaseChoicesByFeat(selected).map((ability) => ({
            value: ability,
            label: `${ability} Score`,
            disabled: !this.canApplyAbilityIncrease(className, feature, ability, 1) && ability !== currentValue
        }));
    }

    getFeatAbilityIncreaseValue(className: string, feature: ClassFeature): string {
        return this.getFeatFollowUpChoice(className, feature).abilityIncreaseAbility;
    }

    getWeaponMasterOptions(): DropdownOption[] {
        return this.buildWeaponMasterOptions().map((weapon) => ({
            value: weapon,
            label: weapon
        }));
    }

    getWeaponMasterValue(className: string, feature: ClassFeature): string {
        return this.getFeatFollowUpChoice(className, feature).weaponMasterWeapon;
    }

    onWeaponMasterChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextValue = String(value ?? '').trim();

        this.featFollowUpChoices.update((current) => ({
            ...current,
            [key]: {
                ...this.getFeatFollowUpChoice(className, feature),
                weaponMasterWeapon: nextValue
            }
        }));
    }

    onFeatAbilityIncreaseChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextValue = this.normalizeAbilityName(String(value ?? '').trim());

        if (nextValue && !this.canApplyAbilityIncrease(className, feature, nextValue, 1)) {
            return;
        }

        this.featFollowUpChoices.update((current) => ({
            ...current,
            [key]: {
                ...this.getFeatFollowUpChoice(className, feature),
                abilityIncreaseAbility: nextValue
            }
        }));
    }

    shouldShowMagicInitiatePicker(className: string, feature: ClassFeature): boolean {
        const selected = this.getSelectedAbilityScoreImprovementFeat(className, feature);
        return selected.startsWith('Magic Initiate (');
    }

    shouldShowSkilledPickers(className: string, feature: ClassFeature): boolean {
        return this.getSelectedAbilityScoreImprovementFeat(className, feature) === 'Skilled';
    }

    getGrapplerAbilityOptions(): DropdownOption[] {
        return [
            { value: 'Strength', label: 'Strength Score' },
            { value: 'Dexterity', label: 'Dexterity Score' }
        ];
    }

    getMagicInitiateAbilityOptions(): DropdownOption[] {
        return [
            { value: 'Charisma', label: 'Charisma' },
            { value: 'Intelligence', label: 'Intelligence' },
            { value: 'Wisdom', label: 'Wisdom' }
        ];
    }

    getSkilledOptions(className: string, feature: ClassFeature, slotIndex: number): DropdownOption[] {
        const key = this.getFeatureSelectionKey(className, feature);
        const selected = this.getFeatFollowUpChoice(className, feature).skilledSelections;
        const currentValue = selected[slotIndex] ?? '';
        const selectedElsewhere = new Set(selected.filter((entry, index) => index !== slotIndex && entry));

        return this.buildSkilledSelectionOptions().map((option) => {
            const repeatCount = this.getSelectedRepeatableSkillChoiceCount(option, {
                source: 'featFollowUp',
                key,
                index: slotIndex
            });

            return {
                value: option,
                label: option,
                disabled: this.isRepeatableSkillChoice(option)
                    ? repeatCount >= 2 && option !== currentValue
                    : selectedElsewhere.has(option) && option !== currentValue
            };
        });
    }

    getGrapplerAbilityValue(className: string, feature: ClassFeature): string {
        return this.getFeatFollowUpChoice(className, feature).grapplerAbility;
    }

    onGrapplerAbilityChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextValue = String(value ?? '').trim();

        this.featFollowUpChoices.update((current) => ({
            ...current,
            [key]: {
                ...this.getFeatFollowUpChoice(className, feature),
                grapplerAbility: nextValue
            }
        }));
    }

    getMagicInitiateAbilityValue(className: string, feature: ClassFeature): string {
        return this.getFeatFollowUpChoice(className, feature).magicInitiateAbility;
    }

    onMagicInitiateAbilityForFeatChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextValue = String(value ?? '').trim();

        this.featFollowUpChoices.update((current) => ({
            ...current,
            [key]: {
                ...this.getFeatFollowUpChoice(className, feature),
                magicInitiateAbility: nextValue
            }
        }));
    }

    getSkilledValue(className: string, feature: ClassFeature, slotIndex: number): string {
        return this.getFeatFollowUpChoice(className, feature).skilledSelections[slotIndex] ?? '';
    }

    onSkilledSelectionChanged(className: string, feature: ClassFeature, slotIndex: number, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextValue = String(value ?? '').trim();

        this.featFollowUpChoices.update((current) => {
            const existing = this.getFeatFollowUpChoice(className, feature);
            const nextSelections = [...existing.skilledSelections];

            if (!nextValue) {
                nextSelections.splice(slotIndex, 1);
            } else if (this.isRepeatableSkillChoice(nextValue)) {
                const repeatCount = this.getSelectedRepeatableSkillChoiceCount(nextValue, {
                    source: 'featFollowUp',
                    key,
                    index: slotIndex
                });

                if (repeatCount >= 2) {
                    return current;
                }

                nextSelections[slotIndex] = nextValue;
            } else {
                const duplicateIndex = nextSelections.findIndex((entry, index) => entry === nextValue && index !== slotIndex);
                if (duplicateIndex >= 0) {
                    nextSelections.splice(duplicateIndex, 1);
                }

                nextSelections[slotIndex] = nextValue;
            }

            const compact = nextSelections
                .map((entry) => entry?.trim())
                .filter((entry): entry is string => !!entry)
                .slice(0, 3);

            return {
                ...current,
                [key]: {
                    ...existing,
                    skilledSelections: compact
                }
            };
        });
    }

    getAbilityScoreImprovementMode(className: string, feature: ClassFeature): AbilityScoreImprovementMode {
        return this.getAbilityScoreImprovementChoice(className, feature).mode;
    }

    onAbilityScoreImprovementModeChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const mode = String(value ?? '') as AbilityScoreImprovementMode;
        const safeMode: AbilityScoreImprovementMode = (mode === 'plus-two' || mode === 'plus-one-plus-one') ? mode : '';

        this.abilityScoreImprovementChoices.update((current) => ({
            ...current,
            [key]: {
                mode: safeMode,
                primaryAbility: '',
                secondaryAbility: ''
            }
        }));
    }

    getAbilityScoreImprovementPrimaryValue(className: string, feature: ClassFeature): string {
        return this.getAbilityScoreImprovementChoice(className, feature).primaryAbility;
    }

    getAbilityScoreImprovementSecondaryValue(className: string, feature: ClassFeature): string {
        return this.getAbilityScoreImprovementChoice(className, feature).secondaryAbility;
    }

    onAbilityScoreImprovementPrimaryChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextPrimary = this.normalizeAbilityName(String(value ?? '').trim());

        this.abilityScoreImprovementChoices.update((current) => {
            const existing = current[key] ?? { mode: '', primaryAbility: '', secondaryAbility: '' };
            const increaseAmount = existing.mode === 'plus-two' ? 2 : 1;

            if (nextPrimary && !this.canApplyAbilityIncrease(className, feature, nextPrimary, increaseAmount)) {
                return current;
            }

            const secondary = existing.secondaryAbility === nextPrimary ? '' : existing.secondaryAbility;
            return {
                ...current,
                [key]: {
                    ...existing,
                    primaryAbility: nextPrimary,
                    secondaryAbility: secondary
                }
            };
        });
    }

    onAbilityScoreImprovementSecondaryChanged(className: string, feature: ClassFeature, value: string | number): void {
        const key = this.getFeatureSelectionKey(className, feature);
        const nextSecondary = this.normalizeAbilityName(String(value ?? '').trim());

        this.abilityScoreImprovementChoices.update((current) => {
            const existing = current[key] ?? { mode: '', primaryAbility: '', secondaryAbility: '' };

            if (nextSecondary && !this.canApplyAbilityIncrease(className, feature, nextSecondary, 1)) {
                return current;
            }

            return {
                ...current,
                [key]: {
                    ...existing,
                    secondaryAbility: nextSecondary === existing.primaryAbility ? '' : nextSecondary
                }
            };
        });
    }

    getAbilityScoreImprovementAbilityOptions(className: string, feature: ClassFeature, slot: 'primary' | 'secondary'): DropdownOption[] {
        const choice = this.getAbilityScoreImprovementChoice(className, feature);
        const currentValue = slot === 'primary' ? choice.primaryAbility : choice.secondaryAbility;
        const increaseAmount = choice.mode === 'plus-two' ? 2 : 1;

        return this.abilityTiles.map((ability) => ({
            value: ability,
            label: `${ability} Score`,
            disabled: ((slot === 'secondary' ? ability === choice.primaryAbility : false)
                || (!this.canApplyAbilityIncrease(className, feature, ability, increaseAmount) && ability !== currentValue))
        }));
    }

    shouldShowAbilityScoreImprovementPrimary(className: string, feature: ClassFeature): boolean {
        const mode = this.getAbilityScoreImprovementMode(className, feature);
        return mode === 'plus-two' || mode === 'plus-one-plus-one';
    }

    shouldShowAbilityScoreImprovementSecondary(className: string, feature: ClassFeature): boolean {
        return this.getAbilityScoreImprovementMode(className, feature) === 'plus-one-plus-one';
    }

    private normalizeAbilityName(ability: string): string {
        const normalized = ability.trim().replace(/\s+score$/i, '');
        return this.abilityTiles.find((entry) => entry.toLowerCase() === normalized.toLowerCase()) ?? normalized;
    }

    private canApplyBackgroundAbilityIncrease(ability: string, amount: number): boolean {
        const normalizedAbility = this.normalizeAbilityName(ability);
        if (!normalizedAbility || !this.currentBgAbilityScores().includes(normalizedAbility)) {
            return false;
        }

        const currentScore = this.getAbilityScoreBeforeBackgroundIncrease(normalizedAbility);
        return currentScore + amount <= 20;
    }

    private isBackgroundAbilityOptionValid(ability: string, amount: number, disallowedAbility = ''): boolean {
        const normalizedAbility = this.normalizeAbilityName(ability);
        if (!normalizedAbility || (disallowedAbility && normalizedAbility === disallowedAbility)) {
            return false;
        }

        return this.canApplyBackgroundAbilityIncrease(normalizedAbility, amount);
    }

    private getAbilityScoreBeforeBackgroundIncrease(ability: string): number {
        const normalizedAbility = this.normalizeAbilityName(ability);
        const overrideScore = this.abilityOverrideScores()[normalizedAbility];
        if (overrideScore != null) {
            return overrideScore;
        }

        const baseScore = this.getAbilityBaseScore(normalizedAbility);
        const classFeatureBonus = this.getClassFeatureAbilityBonuses()[normalizedAbility] ?? 0;
        return Math.min(20, baseScore + classFeatureBonus);
    }

    private canApplyAbilityIncrease(className: string, feature: ClassFeature, ability: string, amount: number): boolean {
        const normalizedAbility = this.normalizeAbilityName(ability);
        if (!normalizedAbility) {
            return false;
        }

        const currentScore = this.getAbilityScoreBeforePendingIncrease(className, feature, normalizedAbility);
        const scoreCap = feature.name === 'Epic Boon' ? 30 : 20;
        return currentScore + amount <= scoreCap;
    }

    private getAbilityScoreBeforePendingIncrease(className: string, feature: ClassFeature, ability: string): number {
        const normalizedAbility = this.normalizeAbilityName(ability);
        const selectionKey = this.getFeatureSelectionKey(className, feature);
        const overrideScore = this.abilityOverrideScores()[normalizedAbility];
        if (overrideScore != null) {
            return overrideScore;
        }

        const baseScore = this.getAbilityBaseScore(normalizedAbility);
        const backgroundBonus = this.getBackgroundAbilityBonuses()[normalizedAbility] ?? 0;
        const classFeatureBonus = this.getClassFeatureAbilityBonuses(selectionKey)[normalizedAbility] ?? 0;
        const maxScore = this.getAbilityScoreMaximum(normalizedAbility);
        return Math.min(maxScore, baseScore + backgroundBonus + classFeatureBonus);
    }

    private isAbilityScoreImprovementFeature(feature: ClassFeature): boolean {
        return feature.name === 'Ability Score Improvement';
    }

    private getSelectedAbilityIncreaseSourceName(className: string, feature: ClassFeature): string {
        if (this.isAbilityScoreImprovementFeature(feature) || this.isEpicBoonFeature(feature)) {
            return this.getFeatureChoiceValue(className, feature, 0);
        }

        return '';
    }

    private getSelectedEpicBoon(className: string, feature: ClassFeature): FeatEntry | null {
        if (!this.isEpicBoonFeature(feature)) {
            return null;
        }

        const selected = this.getFeatureChoiceValue(className, feature, 0);
        if (!selected) {
            return null;
        }

        return featCatalogEntries.find((entry) => entry.category === 'epic-boon' && entry.name === selected) ?? null;
    }

    private describeEpicBoonAbilityIncrease(abilityScoreIncrease: string): string {
        const normalized = abilityScoreIncrease.trim();
        if (!normalized) {
            return '';
        }

        if (/to any ability score/i.test(normalized)) {
            return 'Increase one ability score of your choice by 1, to a maximum of 30.';
        }

        if (/strength, dexterity, or constitution/i.test(normalized)) {
            return 'Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 30.';
        }

        if (/strength or dexterity/i.test(normalized)) {
            return 'Increase your Strength or Dexterity score by 1, to a maximum of 30.';
        }

        if (/constitution/i.test(normalized) && !/or/i.test(normalized) && !/,/i.test(normalized)) {
            return 'Increase your Constitution score by 1, to a maximum of 30.';
        }

        if (/dexterity/i.test(normalized) && !/or/i.test(normalized) && !/,/i.test(normalized)) {
            return 'Increase your Dexterity score by 1, to a maximum of 30.';
        }

        return normalized;
    }

    private getAbilityScoreImprovementChoice(className: string, feature: ClassFeature): AbilityScoreImprovementChoice {
        const key = this.getFeatureSelectionKey(className, feature);
        const existing = this.abilityScoreImprovementChoices()[key] ?? {
            mode: '',
            primaryAbility: '',
            secondaryAbility: ''
        };

        const primaryAbility = this.normalizeAbilityName(existing.primaryAbility ?? '');
        const secondaryAbility = this.normalizeAbilityName(existing.secondaryAbility ?? '');
        const primaryIncreaseAmount = existing.mode === 'plus-two' ? 2 : 1;

        return {
            mode: existing.mode,
            primaryAbility: primaryAbility && this.canApplyAbilityIncrease(className, feature, primaryAbility, primaryIncreaseAmount)
                ? primaryAbility
                : '',
            secondaryAbility: secondaryAbility
                && secondaryAbility !== primaryAbility
                && this.canApplyAbilityIncrease(className, feature, secondaryAbility, 1)
                ? secondaryAbility
                : ''
        };
    }

    private getFeatFollowUpChoice(className: string, feature: ClassFeature): FeatFollowUpChoice {
        const key = this.getFeatureSelectionKey(className, feature);
        const existing = this.featFollowUpChoices()[key];
        const normalizedAbilityIncrease = this.normalizeAbilityName(existing?.abilityIncreaseAbility ?? '');

        return {
            abilityIncreaseAbility: normalizedAbilityIncrease && this.canApplyAbilityIncrease(className, feature, normalizedAbilityIncrease, 1)
                ? normalizedAbilityIncrease
                : '',
            weaponMasterWeapon: existing?.weaponMasterWeapon ?? '',
            grapplerAbility: existing?.grapplerAbility ?? '',
            magicInitiateAbility: existing?.magicInitiateAbility ?? '',
            skilledSelections: existing?.skilledSelections ?? []
        };
    }

    private requiresFeatFollowUpChoice(featName: string): boolean {
        return this.getFeatAbilityIncreaseChoicesByFeat(featName).length > 0
            || featName === 'Weapon Master'
            || featName.startsWith('Magic Initiate (')
            || featName === 'Skilled';
    }

    private buildWeaponMasterOptions(): string[] {
        return [
            'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear',
            'Crossbow, Light', 'Dart', 'Shortbow', 'Sling',
            'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar',
            'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip',
            'Blowgun', 'Crossbow, Hand', 'Crossbow, Heavy', 'Longbow', 'Net', 'Musket', 'Pistol'
        ];
    }

    private getFeatAbilityIncreaseChoicesByFeat(featName: string): string[] {
        switch (featName) {
            case 'Athlete':
            case 'Charger':
            case 'Dual Wielder':
            case 'Grappler':
            case 'Mage Slayer':
            case 'Sentinel':
            case 'Slasher':
            case 'Weapon Master':
            case 'Boon of Irresistible Offense':
                return ['Strength', 'Dexterity'];
            case 'Defensive Duelist':
            case 'Skulker':
            case 'Boon of Peerless Aim':
                return ['Dexterity'];
            case 'Elemental Adept':
            case 'Spell Sniper':
            case 'War Caster':
                return ['Intelligence', 'Wisdom', 'Charisma'];
            case 'Great Weapon Master':
            case 'Shield Master':
                return ['Strength'];
            case 'Boon of Recovery':
                return ['Constitution'];
            case 'Boon of Combat Prowess':
                return ['Strength', 'Dexterity', 'Constitution'];
            case 'Heavy Armor Master':
                return ['Strength', 'Constitution'];
            case 'Speedy':
                return ['Dexterity', 'Constitution'];
            case 'Inspiring Leader':
                return ['Wisdom', 'Charisma'];
            case 'Mounted Combatant':
                return ['Strength', 'Dexterity', 'Wisdom'];
            case 'Polearm Master':
                return ['Dexterity', 'Strength'];
            case 'Resilient':
            case 'Skill Expert':
            case 'Boon of Dimensional Travel':
            case 'Boon of Energy Resistance':
            case 'Boon of Fate':
            case 'Boon of Fortitude':
            case 'Boon of Night Spirit':
            case 'Boon of Skill':
            case 'Boon of Spell Recall':
            case 'Boon of Truesight':
                return ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
            default:
                return [];
        }
    }

    private readonly repeatableSkillChoiceLabels = new Set<string>([
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
        'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
    ]);

    private isRepeatableSkillChoice(option: string): boolean {
        return this.repeatableSkillChoiceLabels.has(option.trim());
    }

    private getSelectedRepeatableSkillChoiceCount(
        option: string,
        exclude?: { source: 'classFeature' | 'featFollowUp' | 'backgroundChoice'; key: string; index?: number }
    ): number {
        const normalized = option.trim();
        if (!this.isRepeatableSkillChoice(normalized)) {
            return 0;
        }

        let count = 0;

        for (const [key, values] of Object.entries(this.classFeatureSelections())) {
            values.forEach((value, index) => {
                if (exclude?.source === 'classFeature' && exclude.key === key && exclude.index === index) {
                    return;
                }

                if (value?.trim() === normalized) {
                    count++;
                }
            });
        }

        for (const [key, value] of Object.entries(this.backgroundChoiceSelections())) {
            if (exclude?.source === 'backgroundChoice' && exclude.key === key) {
                continue;
            }

            if (value?.trim() === normalized) {
                count++;
            }
        }

        for (const [key, choice] of Object.entries(this.featFollowUpChoices())) {
            (choice?.skilledSelections ?? []).forEach((value, index) => {
                if (exclude?.source === 'featFollowUp' && exclude.key === key && exclude.index === index) {
                    return;
                }

                if (value?.trim() === normalized) {
                    count++;
                }
            });
        }

        return count;
    }

    private buildSkilledSelectionOptions(): string[] {
        return [
            'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
            'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival',
            "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils",
            "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools",
            "Weaver's Tools", "Woodcarver's Tools", 'Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Horn', 'Pan Flute', 'Shawm', 'Viol', "Navigator's Tools",
            "Poisoner's Kit", "Thieves' Tools", "Disguise Kit", "Forgery Kit", "Herbalism Kit", "Gaming Set (Dice)", "Gaming Set (Cards)", 'Vehicles (Land)', 'Vehicles (Water)'
        ];
    }

    private getFeatureSelectionKey(className: string, feature: ClassFeature): string {
        return `${className}:${feature.level}:${feature.name}`;
    }

    private isWeaponMasteryFeature(feature: Pick<ClassFeature, 'name'>): boolean {
        return feature.name === 'Weapon Mastery' || feature.name === '4: Weapon Mastery';
    }

    private isEpicBoonFeature(feature: Pick<ClassFeature, 'name'>): boolean {
        return feature.name === 'Epic Boon';
    }

    getWeaponMasterySelectionText(selectedChoice: string): string {
        const normalizedChoice = selectedChoice.trim();
        if (!normalizedChoice) {
            return '';
        }

        const matchedChoice = normalizedChoice.match(/^(.*?)\s*\(([^)]+)\)$/);
        const weaponName = matchedChoice?.[1]?.trim() || normalizedChoice;
        const masteryName = matchedChoice?.[2]?.trim() || weaponMasteryByWeapon[weaponName];

        if (!masteryName) {
            return '';
        }

        const masteryDescription = weaponMasteryDescriptions[masteryName];
        if (!masteryDescription) {
            return '';
        }

        return `Your training with weapons allows you to use the mastery property of ${weaponName}:\n\n**${masteryName}.** ${masteryDescription}`;
    }

    private getSelectedWeaponMasteries(className: string, feature: ClassFeature, choiceIndex: number): Set<string> {
        const currentKey = this.getFeatureSelectionKey(className, feature);
        const selectedMasteries = new Set<string>();

        for (const [key, values] of Object.entries(this.classFeatureSelections())) {
            if (!key.startsWith(`${className}:`) || !key.toLowerCase().includes('weapon mastery')) {
                continue;
            }

            values.forEach((value, index) => {
                const normalizedValue = value.trim();
                if (!normalizedValue) {
                    return;
                }

                if (key === currentKey && index === choiceIndex) {
                    return;
                }

                selectedMasteries.add(normalizedValue);
            });
        }

        return selectedMasteries;
    }

    private getSelectedEpicBoons(className: string, feature: ClassFeature, choiceIndex: number): Set<string> {
        const currentKey = this.getFeatureSelectionKey(className, feature);
        const selectedBoons = new Set<string>();

        for (const [key, values] of Object.entries(this.classFeatureSelections())) {
            if (!key.startsWith(`${className}:`) || !key.toLowerCase().includes('epic boon')) {
                continue;
            }

            values.forEach((value, index) => {
                const normalizedValue = value.trim();
                if (!normalizedValue) {
                    return;
                }

                if (key === currentKey && index === choiceIndex) {
                    return;
                }

                selectedBoons.add(normalizedValue);
            });
        }

        return selectedBoons;
    }

    private getSubclassConfig(className: string): SubclassConfig | null {
        return this.subclassConfigs[className] ?? null;
    }

    private getSelectedSubclassName(className: string): string {
        const config = this.getSubclassConfig(className);
        if (!config) {
            return '';
        }

        const key = `${className}:${config.selectorLevel}:${config.selectorFeatureName}`;
        return this.classFeatureSelections()[key]?.[0] ?? '';
    }

    private getSubclassFeaturesForLevel(className: string, subclassName: string, level: number): ClassFeature[] {
        const detailOrList = this.subclassFeatureProgressionByClass[className]?.[subclassName]?.[level];
        if (detailOrList) {
            const details = Array.isArray(detailOrList) ? detailOrList : [detailOrList];
            return details.map((detail) => ({
                name: detail.name,
                level,
                description: detail.description
            }));
        }

        return [
            {
                name: `${subclassName} Feature`,
                level,
                description: `Subclass feature unlocked by ${subclassName} at level ${level}.`
            }
        ];
    }

    private applySubclassFeatureProgression(className: string, featureLevel: ClassFeaturesForLevel): ClassFeaturesForLevel {
        const subclassConfig = this.getSubclassConfig(className);
        if (!subclassConfig) {
            return featureLevel;
        }

        const selectedSubclass = this.getSelectedSubclassName(className);
        if (!selectedSubclass) {
            return featureLevel;
        }

        const isMilestoneLevel = subclassConfig.milestoneLevels.includes(featureLevel.level);
        const hasSubclassPlaceholder = featureLevel.features.some((feature) => subclassConfig.placeholderFeatureNames.includes(feature.name));
        if (!isMilestoneLevel && !hasSubclassPlaceholder) {
            return featureLevel;
        }

        const subclassFeatures = this.getSubclassFeaturesForLevel(className, selectedSubclass, featureLevel.level);
        if (subclassFeatures.length === 0) {
            return featureLevel;
        }

        const withoutPlaceholder = featureLevel.features.filter((feature) => !subclassConfig.placeholderFeatureNames.includes(feature.name));
        const existingNames = new Set(withoutPlaceholder.map((feature) => feature.name.toLowerCase()));
        const featuresToApply = subclassFeatures.filter((feature) => !existingNames.has(feature.name.toLowerCase()));

        return {
            ...featureLevel,
            features: [...withoutPlaceholder, ...featuresToApply]
        };
    }

    getClassFeatures(className: string, maxLevel: number = 1): ClassFeaturesForLevel[] {
        const seededFeatures = classLevelOneFeatures[className] || [];
        const hasSeededProgression = seededFeatures.some((featureGroup) => featureGroup.level > 1);

        if (hasSeededProgression) {
            return [...seededFeatures]
                .sort((a, b) => a.level - b.level)
                .map((featureLevel) => this.applySubclassFeatureProgression(className, featureLevel))
                .map((featureLevel) => ({
                    ...featureLevel,
                    features: featureLevel.features.map((feature) => this.resolveFeatureChoices(className, feature))
                }))
                .filter((featureLevel) => featureLevel.level <= maxLevel);
        }

        const milestoneFeatures = this.getClassFeaturesFromMilestones(className);
        const mergedByLevel = new Map<number, ClassFeature[]>();

        for (const featureGroup of [...seededFeatures, ...milestoneFeatures]) {
            const current = mergedByLevel.get(featureGroup.level) || [];
            for (const feature of featureGroup.features) {
                const resolvedFeature = this.resolveFeatureChoices(className, feature);
                const exists = current.some((entry) => entry.name.toLowerCase() === feature.name.toLowerCase());
                if (!exists) {
                    current.push(resolvedFeature);
                }
            }
            mergedByLevel.set(featureGroup.level, current);
        }

        return Array.from(mergedByLevel.entries())
            .map(([level, features]) => ({ level, features }))
            .map((featureLevel) => this.applySubclassFeatureProgression(className, featureLevel))
            .map((featureLevel) => ({
                ...featureLevel,
                features: featureLevel.features.map((feature) => this.resolveFeatureChoices(className, feature))
            }))
            .sort((a, b) => a.level - b.level)
            .filter((featureLevel) => featureLevel.level <= maxLevel);
    }

    private resolveFeatureChoices(className: string, feature: ClassFeature): ClassFeature {
        if (feature.choices) {
            return feature;
        }

        if (className === 'Wizard' && this.isWizardSavantFeature(feature.name)) {
            return {
                ...feature,
                choices: {
                    title: 'Choose 2 Wizard Spells',
                    count: 2,
                    options: this.getWizardSavantSpellOptions()
                }
            };
        }

        const subclassConfig = this.getSubclassConfig(className);
        const subclassOptions = this.subclassOptionsByClass[className];
        if (subclassConfig && subclassOptions && feature.name === subclassConfig.selectorFeatureName) {
            return {
                ...feature,
                choices: {
                    title: this.subclassChoiceTitles[className] ?? 'Choose 1 Subclass',
                    count: 1,
                    options: [...subclassOptions]
                }
            };
        }

        if (feature.name === 'Ability Score Improvement') {
            return {
                ...feature,
                choices: {
                    title: 'Choose 1 Feat',
                    count: 1,
                    options: this.abilityScoreImprovementOptions
                }
            };
        }

        if (feature.name === 'Epic Boon') {
            return {
                ...feature,
                choices: {
                    title: 'Choose 1 Epic Boon',
                    count: 1,
                    options: this.buildEpicBoonOptions()
                }
            };
        }

        return feature;
    }

    private isWizardSavantFeature(featureName: string): boolean {
        return featureName.endsWith('Savant');
    }

    private getWizardSavantSpellOptions(): string[] {
        const wizardSpells = this.classSpellCatalog['Wizard'] ?? [];
        return wizardSpells
            .filter((spell) => spell.level >= 1 && spell.level <= 2)
            .map((spell) => spell.name)
            .filter((name, index, all) => all.indexOf(name) === index)
            .sort((a, b) => a.localeCompare(b));
    }

    private buildAbilityScoreImprovementFeatOptions(): string[] {
        return [
            'Ability Score Improvement',
            'Alert',
            'Athlete',
            'Charger',
            'Defensive Duelist',
            'Dual Wielder',
            'Elemental Adept',
            'Grappler',
            'Great Weapon Master',
            'Healer',
            'Heavy Armor Master',
            'Inspiring Leader',
            'Mage Slayer',
            'Magic Initiate (Cleric)',
            'Magic Initiate (Druid)',
            'Magic Initiate (Wizard)',
            'Mounted Combatant',
            'Polearm Master',
            'Resilient',
            'Savage Attacker',
            'Sentinel',
            'Shield Master',
            'Skilled',
            'Skill Expert',
            'Skulker',
            'Slasher',
            'Speedy',
            'Spell Sniper',
            'Tavern Brawler',
            'Tough',
            'War Caster',
            'Weapon Master'
        ];
    }

    private buildEpicBoonOptions(): string[] {
        return [
            'Boon of Combat Prowess',
            'Boon of Dimensional Travel',
            'Boon of Energy Resistance',
            'Boon of Fate',
            'Boon of Fortitude',
            'Boon of Irresistible Offense',
            'Boon of Night Spirit',
            'Boon of Peerless Aim',
            'Boon of Recovery',
            'Boon of Skill',
            'Boon of Speed',
            'Boon of Spell Recall',
            'Boon of Truesight'
        ];
    }

    private getClassFeaturesFromMilestones(className: string): ClassFeaturesForLevel[] {
        const details = classInfoMap[className]?.details ?? classDetailFallbacks[className];
        if (!details?.levelMilestones?.length) {
            return [];
        }

        return details.levelMilestones
            .map((milestone) => {
                const level = this.extractMilestoneLevel(milestone.title);
                if (!level) {
                    return null;
                }

                return {
                    level,
                    features: [{
                        name: milestone.summary,
                        level,
                        description: milestone.details
                    }]
                } as ClassFeaturesForLevel;
            })
            .filter((value): value is ClassFeaturesForLevel => value !== null);
    }

    private extractMilestoneLevel(title: string): number | null {
        const levelMatch = title.match(/level\s*(\d+)/i);
        if (levelMatch) {
            return Number(levelMatch[1]);
        }

        const rangedMatch = title.match(/(\d+)\s*[-â€“]\s*(\d+)/);
        if (rangedMatch) {
            return Number(rangedMatch[1]);
        }

        return null;
    }

    addClass(className: string, level: number): void {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(level)));
        const current = this.multiclassList();
        this.multiclassList.set({
            ...current,
            [className]: normalizedLevel
        });
        this.setClassPanelTab(className, 'class-features');
        this.syncPreparedSpellsForClass(className, normalizedLevel);
        this.selectedClass.set('');
        this.characterLevel.set(normalizedLevel);
        this.navigationEditLevel.set(normalizedLevel);
    }

    removeClass(className: string): void {
        const current = this.multiclassList();
        const updated = { ...current };
        delete updated[className];
        this.multiclassList.set(updated);
        this.classPanelTabsByClass.update((tabs) => {
            const next = { ...tabs };
            delete next[className];
            return next;
        });
        this.classPreparedSpells.update((entries) => {
            const next = { ...entries };
            delete next[className];
            return next;
        });

        const remainingClasses = Object.keys(updated);
        const nextLevel = remainingClasses.length > 0 ? Math.max(1, updated[remainingClasses[0]] || 1) : 1;
        this.characterLevel.set(nextLevel);
        this.navigationEditLevel.set(nextLevel);
    }

    updateClassLevel(className: string, level: number): void {
        if (!Number.isFinite(level)) {
            return;
        }

        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(level)));
        this.multiclassList.update((current) => ({
            ...current,
            [className]: normalizedLevel
        }));

        if (this.getPrimaryClassName() === className || Object.keys(this.multiclassList()).length === 1) {
            this.characterLevel.set(normalizedLevel);
            this.navigationEditLevel.set(normalizedLevel);
        }

        this.syncPreparedSpellsForClass(className, normalizedLevel);
    }

    getClassHitDie(className: string): number {
        const hitDice: Record<string, number> = {
            Artificer: 8,
            Barbarian: 12,
            Bard: 8,
            BloodHunter: 10,
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

        return hitDice[className.replace(/\s+/g, '')] ?? 10;
    }

    getConModifierForHitPoints(): number {
        return Math.floor((this.getTotalScore('Constitution') - 10) / 2);
    }

    getConModifierForHitPointsDisplay(): string {
        return this.toSignedNumber(this.getConModifierForHitPoints());
    }

    getFixedHitPointTotal(className: string, level: number): number {
        const normalizedLevel = Math.max(1, Math.trunc(level || 1));
        const hitDie = this.getClassHitDie(className);
        const conMod = this.getConModifierForHitPoints();
        const average = Math.ceil(hitDie / 2) + 1;
        const total = hitDie + ((normalizedLevel - 1) * (average + conMod));
        return Math.max(normalizedLevel, total);
    }

    getResolvedHitPointTotal(className: string, level: number): number {
        if (this.hitPointMode() === 'rolled') {
            const rolled = this.rolledHitPointTotal();
            if (typeof rolled === 'number' && Number.isFinite(rolled) && rolled > 0) {
                return Math.trunc(rolled);
            }
        }

        return this.getFixedHitPointTotal(className, level);
    }

    getRolledHitPointTotalDisplay(): string {
        const value = this.rolledHitPointTotal();
        return value == null ? '' : String(value);
    }

    getHitPointManagerClassName(): string {
        return this.getPrimaryClassName();
    }

    getHitPointManagerClassLevel(): number {
        return this.getPrimaryClassLevel();
    }

    canManageHitPoints(): boolean {
        return this.getHitPointManagerClassName().length > 0;
    }

    openHitPointManager(): void {
        if (!this.canManageHitPoints()) {
            return;
        }

        this.requestCloseChat();
        this.hitPointManagerOpen.set(true);
    }

    closeHitPointManager(): void {
        this.hitPointManagerOpen.set(false);
    }

    onHitPointModeChanged(value: string | number): void {
        const mode = String(value).trim() === 'rolled' ? 'rolled' : 'fixed';
        this.hitPointMode.set(mode);
    }

    onRolledHitPointTotalInput(value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.rolledHitPointTotal.set(Number.isNaN(parsed) ? null : Math.max(1, parsed));
    }

    getActiveClassPanelTab(className: string): ClassPanelTab {
        return this.classPanelTabsByClass()[className] ?? 'class-features';
    }

    getClassCoreTraits(className: string): { label: string; value: string }[] {
        return classInfoMap[className]?.details?.coreTraits ?? [];
    }

    setClassPanelTab(className: string, tab: ClassPanelTab): void {
        this.classPanelTabsByClass.update((current) => ({
            ...current,
            [className]: tab
        }));
    }

    classSupportsSpells(className: string, classLevel: number): boolean {
        return this.getAvailableClassSpells(className, classLevel).length > 0;
    }

    private isSubclassSpellcaster(className: string): boolean {
        const selectedSubclass = this.getSelectedSubclassName(className);
        return (className === 'Fighter' && selectedSubclass === 'Eldritch Knight')
            || (className === 'Rogue' && selectedSubclass === 'Arcane Trickster');
    }

    private getThirdCasterMaxSpellLevel(classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        if (normalizedLevel < 3) return 0;
        if (normalizedLevel < 7) return 1;
        if (normalizedLevel < 13) return 2;
        if (normalizedLevel < 19) return 3;
        return 4;
    }

    getAvailableClassSpells(className: string, classLevel: number): ClassSpellOption[] {
        if (this.isSubclassSpellcaster(className)) {
            const catalog = this.classSpellCatalog['Wizard'] ?? [];
            const maxSpellLevel = this.getThirdCasterMaxSpellLevel(classLevel);
            return catalog.filter((spell) => spell.level === 0 || spell.level <= maxSpellLevel);
        }

        const catalog = this.classSpellCatalog[className] ?? [];
        if (!catalog.length) {
            return [];
        }

        const maxSpellLevel = this.getMaxSpellLevelForClass(className, classLevel);
        return catalog.filter((spell) => spell.level === 0 || spell.level <= maxSpellLevel);
    }

    isKnownOnlyCaster(className: string): boolean {
        return className === 'Bard'
            || className === 'Sorcerer'
            || className === 'Warlock'
            || this.isSubclassSpellcaster(className);
    }

    getKnownCantripLimitForClass(className: string, classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        switch (className) {
            case 'Bard':
                return normalizedLevel >= 10 ? 4 : (normalizedLevel >= 4 ? 3 : 2);
            case 'Sorcerer':
                return normalizedLevel >= 10 ? 6 : (normalizedLevel >= 4 ? 5 : 4);
            case 'Warlock':
                return normalizedLevel >= 10 ? 4 : (normalizedLevel >= 4 ? 3 : 2);
            case 'Fighter':
                return normalizedLevel >= 10 ? 3 : 2;
            case 'Rogue':
                return normalizedLevel >= 10 ? 4 : 3;
            default:
                return Number.MAX_SAFE_INTEGER;
        }
    }

    getKnownSpellLimitForClass(className: string, classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        switch (className) {
            case 'Bard':
                return this.getTableValueForClassLevel(className, normalizedLevel, [
                    4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
                    15, 15, 16, 18, 19, 19, 20, 22, 22, 22
                ]);
            case 'Sorcerer':
                return this.getTableValueForClassLevel(className, normalizedLevel, [
                    2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                    12, 12, 13, 13, 14, 14, 15, 15, 15, 15
                ]);
            case 'Warlock':
                return this.getTableValueForClassLevel(className, normalizedLevel, [
                    2, 3, 4, 5, 6, 7, 8, 9, 10, 10,
                    11, 11, 12, 12, 13, 13, 14, 14, 15, 15
                ]);
            case 'Fighter':
            case 'Rogue':
                if (!this.isSubclassSpellcaster(className) || normalizedLevel < 3) {
                    return 0;
                }

                return this.getTableValueForClassLevel(className, normalizedLevel, [
                    0, 0, 3, 4, 4, 4, 5, 6, 6, 7,
                    8, 8, 9, 10, 10, 11, 11, 11, 12, 13
                ]);
            default:
                return 0;
        }
    }

    isKnownSpellLimitReached(className: string, classLevel: number): boolean {
        return this.getKnownLeveledSpellCount(className, classLevel) >= this.getKnownSpellLimitForClass(className, classLevel);
    }

    isKnownCantripLimitReached(className: string, classLevel: number): boolean {
        return this.getKnownCantripCount(className, classLevel) >= this.getKnownCantripLimitForClass(className, classLevel);
    }

    getKnownLeveledSpellCount(className: string, classLevel: number): number {
        return this.getKnownClassSpells(className, classLevel)
            .filter((spell) => !this.isSpeciesGrantedKnownSpell(className, spell.name, classLevel))
            .filter((spell) => spell.level > 0)
            .length;
    }

    getKnownCantripCount(className: string, classLevel: number): number {
        return this.getKnownClassSpells(className, classLevel)
            .filter((spell) => !this.isSpeciesGrantedKnownSpell(className, spell.name, classLevel))
            .filter((spell) => spell.level === 0)
            .length;
    }

    getKnownClassSpells(className: string, classLevel: number): ClassSpellOption[] {
        if (this.isWizardClass(className)) {
            return this.getSpellbookSpells(className, classLevel);
        }

        if (this.isKnownOnlyCaster(className)) {
            const available = this.getAvailableClassSpells(className, classLevel);
            const knownNames = this.classKnownSpellsByClass()[className] ?? [];
            const availableByName = new Map(available.map((spell) => [spell.name, spell]));
            const learnedSpells = knownNames
                .map((spellName) => availableByName.get(spellName))
                .filter((spell): spell is ClassSpellOption => !!spell);

            const grantedSpells = this.getSpeciesGrantedKnownSpells(className, classLevel);
            const mergedByName = new Map<string, ClassSpellOption>();
            for (const spell of learnedSpells) {
                mergedByName.set(spell.name, spell);
            }
            for (const spell of grantedSpells) {
                mergedByName.set(spell.name, spell);
            }

            return [...mergedByName.values()];
        }

        return this.getAvailableClassSpells(className, classLevel);
    }

    getKnownUnlearnedClassSpells(className: string, classLevel: number): ClassSpellOption[] {
        const knownNames = new Set(this.getKnownClassSpells(className, classLevel).map((spell) => spell.name));
        return this.getAvailableClassSpells(className, classLevel).filter((spell) => !knownNames.has(spell.name));
    }

    getPreparedClassSpells(className: string, classLevel: number): ClassSpellOption[] {
        const knownByName = new Map(this.getKnownClassSpells(className, classLevel).map((spell) => [spell.name, spell]));
        const prepared = this.classPreparedSpells()[className] ?? [];
        const preparedLimit = this.getPreparedSpellLimitForClass(className, classLevel);

        const mergedPreparedByName = new Map<string, ClassSpellOption>();
        prepared
            .map((spellName) => knownByName.get(spellName))
            .filter((spell): spell is ClassSpellOption => !!spell)
            .forEach((spell) => mergedPreparedByName.set(spell.name, spell));

        const mergedPrepared = [...mergedPreparedByName.values()];

        if (this.isWizardClass(className)) {
            const spellbookCantrips = this.getSpellbookSpells(className, classLevel).filter((spell) => spell.level === 0);
            const leveled = this.limitPreparedLeveledSpellsForDisplay(
                mergedPrepared.filter((spell) => spell.level > 0),
                preparedLimit
            );
            return [...spellbookCantrips, ...leveled];
        }

        return this.limitPreparedLeveledSpellsForDisplay(
            mergedPrepared.filter((spell) => spell.level > 0),
            preparedLimit
        );
    }

    getPreparedSpellLimitForClass(className: string, classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        const progression = this.spellcastingProgressionByClass[className] ?? 'none';
        if (progression === 'none') {
            return 0;
        }

        const spellcastingAbilityModifier = this.getSpellcastingAbilityModifierForClass(className);

        switch (className) {
            case 'Cleric':
            case 'Druid':
                return Math.max(1, normalizedLevel + spellcastingAbilityModifier);
            case 'Wizard':
                return getWizardPreparedSpellLimit(normalizedLevel, spellcastingAbilityModifier);
            case 'Paladin':
                return Math.max(1, Math.floor(normalizedLevel / 2) + spellcastingAbilityModifier);
            case 'Artificer':
                return Math.max(1, normalizedLevel + spellcastingAbilityModifier);
            case 'Bard':
            case 'Sorcerer':
            case 'Warlock':
                return 0;
            case 'Ranger':
                return Math.max(1, Math.floor(normalizedLevel / 2) + spellcastingAbilityModifier);
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

    isPreparedSpellLimitReached(className: string, classLevel: number): boolean {
        const limit = this.getPreparedSpellLimitForClass(className, classLevel);
        if (limit <= 0) {
            return true;
        }

        return this.getPreparedSpellCountForLimit(className, classLevel) >= limit;
    }

    getPreparedLeveledSpellCount(className: string, classLevel: number): number {
        return this.getPreparedSpellCountForLimit(className, classLevel);
    }

    getKnownUnpreparedClassSpells(className: string, classLevel: number): ClassSpellOption[] {
        const prepared = new Set(this.getPreparedClassSpells(className, classLevel).map((spell) => spell.name));
        return this.getKnownClassSpells(className, classLevel).filter((spell) => !prepared.has(spell.name));
    }

    isWizardClass(className: string): boolean {
        return isWizardClassName(className);
    }

    getWizardSpellSubTab(className: string): WizardSpellSubTab {
        return this.wizardSpellSubTabByClass()[className] ?? 'prepared';
    }

    setWizardSpellSubTab(className: string, tab: WizardSpellSubTab): void {
        this.wizardSpellSubTabByClass.update((current) => ({ ...current, [className]: tab }));
    }

    getSpellSearchTerm(className: string): string {
        return this.spellSearchTermByClass()[className] ?? '';
    }

    onSpellSearchChanged(className: string, value: string): void {
        this.spellSearchTermByClass.update((current) => ({
            ...current,
            [className]: value ?? ''
        }));
    }

    getFilteredSpells(className: string, spells: readonly ClassSpellOption[]): ClassSpellOption[] {
        const query = this.getSpellSearchTerm(className).trim().toLowerCase();
        if (!query) {
            return [...spells];
        }

        return spells.filter((spell) => this.spellMatchesSearchQuery(spell, query));
    }

    hasVisibleSpellResultsForPanel(className: string, classLevel: number): boolean {
        const query = this.getSpellSearchTerm(className).trim();
        if (!query) {
            return true;
        }

        if (this.isWizardClass(className)) {
            switch (this.getWizardSpellSubTab(className)) {
                case 'spellbook':
                    return this.getFilteredSpells(className, this.getSpellbookSpells(className, classLevel)).length > 0;
                case 'catalog':
                    return this.getFilteredSpells(className, this.getCatalogSpellsNotInSpellbook(className, classLevel)).length > 0;
                case 'prepared':
                default:
                    return this.getFilteredSpells(className, this.getPreparedClassSpells(className, classLevel)).length > 0;
            }
        }

        if (this.isKnownOnlyCaster(className)) {
            return this.getFilteredSpells(className, this.getKnownClassSpells(className, classLevel)).length > 0
                || this.getFilteredSpells(className, this.getKnownUnlearnedClassSpells(className, classLevel)).length > 0;
        }

        return this.getFilteredSpells(className, this.getPreparedClassSpells(className, classLevel)).length > 0
            || this.getFilteredSpells(className, this.getKnownUnpreparedClassSpells(className, classLevel)).length > 0;
    }

    private spellMatchesSearchQuery(spell: ClassSpellOption, query: string): boolean {
        const detail = this.getSpellDetail(spell.name);
        const haystack = [
            spell.name,
            spell.source,
            this.getSpellLevelLabel(spell.level),
            detail?.school ?? '',
            detail?.description ?? '',
            detail?.higherLevels ?? '',
            detail?.attackSave ?? '',
            detail?.damageEffect ?? '',
            detail?.tags?.join(' ') ?? '',
            detail?.ritual ? 'ritual' : '',
            detail?.concentration ? 'concentration' : ''
        ].join(' ').toLowerCase();

        return haystack.includes(query);
    }

    getSpellbookSpells(className: string, classLevel: number): ClassSpellOption[] {
        const catalog = this.classSpellCatalog[className] ?? [];
        const maxSpellLevel = this.getMaxSpellLevelForClass(className, classLevel);
        const spellbookNames = new Set(this.wizardSpellbookByClass()[className] ?? []);
        const byName = new Map(catalog.map((s) => [s.name, s]));
        return [...spellbookNames]
            .map((name) => byName.get(name))
            .filter((spell): spell is ClassSpellOption => !!spell && (spell.level === 0 || spell.level <= maxSpellLevel));
    }

    getCatalogSpellsNotInSpellbook(className: string, classLevel: number): ClassSpellOption[] {
        const spellbookNames = new Set(this.wizardSpellbookByClass()[className] ?? []);
        return this.getAvailableClassSpells(className, classLevel).filter((s) => !spellbookNames.has(s.name));
    }

    getWizardCantripLimit(classLevel: number): number {
        return getWizardCantripLimit(classLevel);
    }

    getWizardLearnedCantripCount(className: string, classLevel: number): number {
        return this.getSpellbookSpells(className, classLevel).filter((spell) => spell.level === 0).length;
    }

    getWizardFreeLeveledSpellLimit(classLevel: number): number {
        return getWizardFreeLeveledSpellLimit(classLevel);
    }

    getWizardLevelUpLearnedSpellCount(className: string): number {
        return (this.wizardLevelUpLearnedSpellsByClass()[className] ?? []).length;
    }

    isWizardLevelUpLeveledSpellLimitReached(className: string, classLevel: number): boolean {
        return this.getWizardLevelUpLearnedSpellCount(className) >= this.getWizardFreeLeveledSpellLimit(classLevel);
    }

    isWizardCantripLimitReached(className: string, classLevel: number): boolean {
        return this.getWizardLearnedCantripCount(className, classLevel) >= this.getWizardCantripLimit(classLevel);
    }

    canLearnSpellToWizardSpellbook(
        className: string,
        classLevel: number,
        spellName: string,
        source: 'level-up' | 'copied' = 'level-up'
    ): boolean {
        if (!this.isWizardClass(className)) {
            return true;
        }

        if (this.isSpellInSpellbook(className, spellName)) {
            return false;
        }

        const spell = this.getAvailableClassSpells(className, classLevel).find((entry) => entry.name === spellName);
        if (!spell) {
            return false;
        }

        if (spell.level !== 0) {
            if (source === 'copied') {
                return true;
            }

            return !this.isWizardLevelUpLeveledSpellLimitReached(className, classLevel);
        }

        return !this.isWizardCantripLimitReached(className, classLevel);
    }

    private addWizardLevelUpLearnedSpell(className: string, spellName: string): void {
        this.wizardLevelUpLearnedSpellsByClass.update((current) => {
            const levelUpSpells = current[className] ?? [];
            if (levelUpSpells.includes(spellName)) {
                return current;
            }

            return {
                ...current,
                [className]: [...levelUpSpells, spellName]
            };
        });
    }

    private removeWizardLevelUpLearnedSpell(className: string, spellName: string): void {
        this.wizardLevelUpLearnedSpellsByClass.update((current) => {
            const levelUpSpells = current[className] ?? [];
            const nextLevelUpSpells = levelUpSpells.filter((entry) => entry !== spellName);
            if (!nextLevelUpSpells.length) {
                const { [className]: _, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [className]: nextLevelUpSpells
            };
        });
    }

    addSpellToSpellbook(
        className: string,
        classLevel: number,
        spellName: string,
        source: 'level-up' | 'copied' = 'level-up'
    ): void {
        if (!this.canLearnSpellToWizardSpellbook(className, classLevel, spellName, source)) {
            return;
        }

        const spell = this.getAvailableClassSpells(className, classLevel).find((entry) => entry.name === spellName);
        if (!spell) {
            return;
        }

        this.wizardSpellbookByClass.update((current) => {
            const book = current[className] ?? [];
            if (book.includes(spellName)) {
                return current;
            }

            return { ...current, [className]: [...book, spellName] };
        });

        if (source === 'level-up' && spell.level > 0) {
            this.addWizardLevelUpLearnedSpell(className, spellName);
        }

        // Wizard cantrips are always prepared by virtue of being in the spellbook.
    }

    removeFromSpellbook(className: string, spellName: string): void {
        this.unprepareClassSpell(className, spellName);
        this.removeWizardLevelUpLearnedSpell(className, spellName);
        this.wizardSpellbookByClass.update((current) => {
            const book = current[className] ?? [];
            const nextBook = book.filter((n) => n !== spellName);
            if (!nextBook.length) {
                const { [className]: _, ...rest } = current;
                return rest;
            }

            return { ...current, [className]: nextBook };
        });
    }

    isSpellInSpellbook(className: string, spellName: string): boolean {
        return (this.wizardSpellbookByClass()[className] ?? []).includes(spellName);
    }

    isSpellPreparedForClass(className: string, spellName: string): boolean {
        const classLevel = this.multiclassList()[className] ?? 1;
        if (isWizardSpellbookCantripAlwaysPrepared(
            className,
            spellName,
            (name) => this.isSpellInSpellbook(className, name),
            (name) => (this.classSpellCatalog['Wizard'] ?? []).find((spell) => spell.name === name)?.level
        )) {
            return true;
        }

        return this.getPreparedLeveledSpellNames(className, classLevel).includes(spellName);
    }

    prepareFromSpellbook(className: string, classLevel: number, spellName: string): void {
        if (!this.isSpellInSpellbook(className, spellName)) {
            return;
        }

        const spell = this.getSpellbookSpells(className, classLevel).find((entry) => entry.name === spellName);
        if (!spell) {
            return;
        }

        if (spell.level === 0) {
            // Wizard cantrips are always prepared by virtue of being in the spellbook.
            return;
        }

        const preparedLimit = this.getPreparedSpellLimitForClass(className, classLevel);
        const preparedCount = this.getPreparedSpellCountForLimit(className, classLevel);
        if (preparedLimit <= 0 || preparedCount >= preparedLimit) {
            return;
        }

        this.classPreparedSpells.update((current) => {
            const prepared = current[className] ?? [];
            if (prepared.includes(spellName)) {
                return current;
            }

            return { ...current, [className]: [...prepared, spellName] };
        });
    }

    getSpellLevels(spells: readonly ClassSpellOption[]): number[] {
        return [...new Set(spells.map((spell) => spell.level))].sort((left, right) => left - right);
    }

    getSpellsForLevel(spells: readonly ClassSpellOption[], level: number): ClassSpellOption[] {
        return spells.filter((spell) => spell.level === level);
    }

    learnKnownClassSpell(className: string, classLevel: number, spellName: string): void {
        if (!this.isKnownOnlyCaster(className)) {
            return;
        }

        const availableNames = new Set(this.getAvailableClassSpells(className, classLevel).map((spell) => spell.name));
        if (!availableNames.has(spellName)) {
            return;
        }

        const selectedSpell = this.getAvailableClassSpells(className, classLevel).find((spell) => spell.name === spellName);
        if (!selectedSpell) {
            return;
        }

        if (selectedSpell.level === 0 && this.isKnownCantripLimitReached(className, classLevel)) {
            return;
        }

        if (selectedSpell.level > 0 && this.isKnownSpellLimitReached(className, classLevel)) {
            return;
        }

        this.classKnownSpellsByClass.update((current) => {
            const known = current[className] ?? [];
            if (known.includes(spellName)) {
                return current;
            }

            return {
                ...current,
                [className]: [...known, spellName]
            };
        });
    }

    forgetKnownClassSpell(className: string, spellName: string): void {
        if (this.isSpeciesGrantedKnownSpell(className, spellName, this.multiclassList()[className] ?? this.getPrimaryClassLevel())) {
            return;
        }

        this.classKnownSpellsByClass.update((current) => {
            const known = current[className] ?? [];
            const nextKnown = known.filter((entry) => entry !== spellName);
            if (!nextKnown.length) {
                const { [className]: _, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [className]: nextKnown
            };
        });
    }

    getSpeciesGrantedKnownSpellCount(className: string, classLevel: number): number {
        return this.getSpeciesGrantedKnownSpells(className, classLevel).length;
    }

    isSpeciesGrantedKnownSpell(className: string, spellName: string, classLevel: number): boolean {
        return this.getSpeciesGrantedKnownSpells(className, classLevel)
            .some((spell) => spell.name === spellName);
    }

    private getSpeciesGrantedKnownSpells(className: string, classLevel: number): ClassSpellOption[] {
        if ((this.selectedSpeciesName() ?? '').trim() !== 'Tiefling') {
            return [];
        }

        const selectedLegacy = this.getSelectedTieflingLegacy();
        if (!selectedLegacy) {
            return [];
        }

        const legacySpells = tieflingLegacySpellByLegacy[selectedLegacy];
        const grantedSpellNames: string[] = [legacySpells.cantrip];

        if (classLevel >= 3) {
            grantedSpellNames.push(legacySpells.level3);
        }

        if (classLevel >= 5) {
            grantedSpellNames.push(legacySpells.level5);
        }

        const available = this.getAvailableClassSpells(className, classLevel);
        const availableByName = new Map(available.map((spell) => [spell.name, spell]));

        return grantedSpellNames
            .map((spellName) => {
                const existing = availableByName.get(spellName);
                if (existing) {
                    return existing;
                }

                const fallbackSpell: ClassSpellOption = {
                    name: spellName,
                    level: spellName === legacySpells.cantrip ? 0 : (spellName === legacySpells.level3 ? 1 : 2),
                    source: '5E Expanded Rules'
                };

                return fallbackSpell;
            })
            .filter((spell, index, array) => array.findIndex((entry) => entry.name === spell.name) === index);
    }

    private getSelectedTieflingLegacy(): TieflingLegacyName | null {
        const selectedLegacy = (this.selectedSpeciesTraitChoices()['Fiendish Legacy']?.[0] ?? '').trim();
        if (selectedLegacy === 'Abyssal' || selectedLegacy === 'Chthonic' || selectedLegacy === 'Infernal') {
            return selectedLegacy;
        }

        return null;
    }

    learnClassSpell(className: string, classLevel: number, spellName: string): void {
        if (this.isKnownOnlyCaster(className)) {
            return;
        }

        const known = new Set(this.getKnownClassSpells(className, classLevel).map((spell) => spell.name));
        if (!known.has(spellName)) {
            return;
        }

        const preparedLimit = this.getPreparedSpellLimitForClass(className, classLevel);
        const preparedCount = this.getPreparedSpellCountForLimit(className, classLevel);
        if (preparedLimit <= 0 || preparedCount >= preparedLimit) {
            return;
        }

        this.classPreparedSpells.update((current) => {
            const prepared = current[className] ?? [];
            if (prepared.includes(spellName)) {
                return current;
            }

            return {
                ...current,
                [className]: [...prepared, spellName]
            };
        });
    }

    unprepareClassSpell(className: string, spellName: string): void {
        if (isWizardSpellbookCantripAlwaysPrepared(
            className,
            spellName,
            (name) => this.isSpellInSpellbook(className, name),
            (name) => (this.classSpellCatalog['Wizard'] ?? []).find((spell) => spell.name === name)?.level
        )) {
            return;
        }

        this.classPreparedSpells.update((current) => {
            const prepared = current[className] ?? [];
            const nextPrepared = prepared.filter((entry) => entry !== spellName);
            if (!nextPrepared.length) {
                const { [className]: _, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [className]: nextPrepared
            };
        });
    }

    getSpellLevelLabel(level: number): string {
        if (level <= 0) {
            return 'Cantrip';
        }

        if (level === 1) {
            return '1st-level';
        }

        if (level === 2) {
            return '2nd-level';
        }

        if (level === 3) {
            return '3rd-level';
        }

        return `${level}th-level`;
    }

    getSpellDetail(spellName: string): SpellDetail | null {
        return spellDetailsMap[spellName] ?? null;
    }

    getSelectedSpellForClass(className: string): string {
        return this.selectedSpellByClass()[className] ?? '';
    }

    getSpellItemId(className: string, spellName: string, listType: 'prepared' | 'known' | 'spellbook' | 'catalog'): string {
        const slug = `${className}-${spellName}-${listType}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return `spell-item-${slug}`;
    }

    toggleSpellDetail(className: string, spellName: string, listType: 'prepared' | 'known' | 'spellbook' | 'catalog'): void {
        const isClosing = this.selectedSpellByClass()[className] === spellName;
        this.selectedSpellByClass.update((current) => {
            const same = current[className] === spellName;
            return { ...current, [className]: same ? '' : spellName };
        });

        if (isClosing) {
            return;
        }

        this.cdr.detectChanges();

        requestAnimationFrame(() => {
            const target = this.document.getElementById(this.getSpellItemId(className, spellName, listType));
            if (!(target instanceof HTMLElement)) {
                return;
            }

            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            const detailPane = target.querySelector('.spell-detail-pane.spell-detail-pane--open');
            if (detailPane instanceof HTMLElement) {
                detailPane.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    startMulticlass(): void {
        this.selectedClass.set('__MULTICLASS_SELECTOR__');
    }

    onBackgroundSelected(url: string): void {
        this.selectedBackgroundUrl.set(url);
        const selected = this.backgroundOptions.find((background) => background.url === url);
        this.selectedBackgroundName.set(selected?.name ?? '');
        this.backgroundChoiceSelections.set({});
        this.selectedLanguages.set([]);
        this.magicInitiateAbility.set('');
        this.magicInitiateCantrip1.set('');
        this.magicInitiateCantrip2.set('');
        this.magicInitiateSpell1.set('');
        this.bgAbilityMode.set('');
        this.bgAbilityScoreFor2.set('');
        this.bgAbilityScoreFor1.set('');
    }

    getBackgroundChoiceSelection(choiceKey: string): string {
        const selected = this.selectedBackground();
        if (!selected) {
            return '';
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        return this.backgroundChoiceSelections()[compositeKey] ?? '';
    }

    onBackgroundChoiceSelected(choiceKey: string, value: string): void {
        const selected = this.selectedBackground();
        if (!selected) {
            return;
        }

        const compositeKey = `${selected.name}:${choiceKey}`;
        this.backgroundChoiceSelections.update((current) => ({
            ...current,
            [compositeKey]: value
        }));

        if (this.isLanguageChoiceKey(choiceKey)) {
            const normalized = value.trim();
            this.onBackgroundLanguagesChanged(normalized ? [normalized] : []);
        }
    }

    onEquipmentSearchChanged(value: string): void {
        this.equipmentSearchTerm.set(value);
    }

    onEquipmentCategorySelected(category: string): void {
        this.selectedEquipmentCategory.set(this.equipmentCategories().includes(category) ? category : 'All');
        this.selectedEquipmentRarity.set('All');
    }

    onEquipmentRaritySelected(rarity: string): void {
        this.selectedEquipmentRarity.set(this.equipmentRarities().includes(rarity) ? rarity : 'All');
    }

    onInventoryDestinationChanged(value: string | number): void {
        this.selectedInventoryDestination.set(String(value));
    }

    onInventoryAddDestinationSelected(item: EquipmentItem, value: string | number): void {
        const destination = String(value || 'inventory');
        this.selectedInventoryDestination.set(destination);
        this.addEquipmentItemToInventory(item, destination);
    }

    onClassStartingOptionChanged(value: string): void {
        this.selectedClassStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    onBackgroundStartingOptionChanged(value: string): void {
        this.selectedBackgroundStartingOption.set((value === 'A' || value === 'B') ? value : '');
    }

    canAddStartingEquipment(): boolean {
        return this.selectedClassStartingOption() !== ''
            && this.selectedBackgroundStartingOption() !== ''
            && this.hasClassStartingPackageData()
            && this.hasBackgroundStartingPackageData();
    }

    addStartingEquipment(): void {
        if (!this.canAddStartingEquipment()) {
            return;
        }

        const classKey = this.selectedClassStartingOption() as 'A' | 'B';
        const backgroundKey = this.selectedBackgroundStartingOption() as 'A' | 'B';
        const classPackage = this.resolvedClassStartingPackages()[classKey];
        const backgroundPackage = this.resolvedBackgroundStartingPackages()[backgroundKey];
        const expandedClassItems = this.expandStartingPackItems(classPackage.items);
        const expandedBackgroundItems = this.expandStartingPackItems(backgroundPackage.items);

        expandedClassItems.forEach((item) => this.addInventoryItem(item));
        expandedBackgroundItems.forEach((item) => this.addInventoryItem(item));

        this.addCurrency('gp', classPackage.currency.gp ?? 0);
        this.addCurrency('gp', backgroundPackage.currency.gp ?? 0);
    }

    private expandStartingPackItems(items: ReadonlyArray<InventoryEntry>): InventoryEntry[] {
        const expanded: InventoryEntry[] = [];

        for (const item of items) {
            const packItems = this.startingPackContents[item.name as StartingPackName];
            if (!packItems) {
                expanded.push(item);
                continue;
            }

            // Create a container (backpack) with nested items
            const backpackItem = packItems.find((p) => p.name === 'Backpack' || p.name.toLowerCase().includes('backpack'));
            const nestedItems = packItems.filter((p) => p.name !== 'Backpack' && !p.name.toLowerCase().includes('backpack'));

            if (backpackItem) {
                expanded.push({
                    name: backpackItem.name,
                    category: backpackItem.category,
                    quantity: backpackItem.quantity * Math.max(1, item.quantity),
                    sourceUrl: backpackItem.sourceUrl,
                    weight: backpackItem.weight,
                    costGp: backpackItem.costGp,
                    notes: backpackItem.notes,
                    isContainer: true,
                    maxCapacity: 60, // Standard backpack capacity in lbs (50-60 lbs based on D&D 5e)
                    containedItems: nestedItems.map((nestedItem) => ({
                        ...nestedItem,
                        quantity: nestedItem.quantity * Math.max(1, item.quantity)
                    }))
                });
            } else {
                // If no backpack, just add all items normally
                for (const packItem of packItems) {
                    expanded.push({
                        ...packItem,
                        quantity: packItem.quantity * Math.max(1, item.quantity)
                    });
                }
            }
        }

        return expanded;
    }

    clearEquipmentSelections(): void {
        this.inventoryEntries.set([]);
        this.currency.set({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
        this.selectedInventoryDestination.set('inventory');
    }

    addEquipmentItemToInventory(item: EquipmentItem, destinationOverride?: string): void {
        const destination = destinationOverride ?? this.selectedInventoryDestination();
        const inventoryEntry: InventoryEntry = {
            name: item.name,
            category: item.category,
            quantity: 1,
            sourceUrl: item.sourceUrl,
            weight: item.weight,
            costGp: item.costGp,
            sourceLabel: item.sourceLabel,
            summary: item.summary,
            notes: item.notes,
            detailLines: item.detailLines,
            rarity: item.rarity,
            attunement: item.attunement
        };

        const expandedPackItems = this.expandStartingPackItems([inventoryEntry]);
        if (expandedPackItems.length > 1 || (expandedPackItems.length === 1 && expandedPackItems[0].name !== inventoryEntry.name)) {
            expandedPackItems.forEach((expandedItem) => this.addInventoryItem(expandedItem, destination));
            return;
        }

        this.addInventoryItem(inventoryEntry, destination);
    }

    removeInventoryEntry(name: string): void {
        this.inventoryEntries.update((entries) => entries.filter((entry) => entry.name !== name));

        if (this.selectedInventoryDestination() === name) {
            this.selectedInventoryDestination.set('inventory');
        }

        this.expandedInventoryContainers.update((expanded) => {
            const next = new Set(expanded);
            next.delete(name);
            return next;
        });
    }

    toggleInventoryContainerExpanded(name: string): void {
        this.expandedInventoryContainers.update((expanded) => {
            const next = new Set(expanded);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    }

    isInventoryContainerExpanded(name: string): boolean {
        return this.expandedInventoryContainers().has(name);
    }

    removeContainedInventoryEntry(containerName: string, itemName: string): void {
        this.inventoryEntries.update((entries) => entries.map((entry) => {
            if (!entry.isContainer || entry.name !== containerName) {
                return entry;
            }

            return {
                ...entry,
                containedItems: (entry.containedItems ?? []).filter((contained) => contained.name !== itemName)
            };
        }));
    }

    onCurrencyInputChanged(key: keyof CurrencyState, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        this.currency.update((current) => ({ ...current, [key]: safeValue }));
    }

    private getInventoryEntryTotalWeight(entry: InventoryEntry): number {
        const quantity = Math.max(1, entry.quantity || 1);
        const ownWeight = (entry.weight ?? 0) * quantity;
        const containedWeight = (entry.containedItems ?? []).reduce((sum, item) => sum + this.getInventoryEntryTotalWeight(item), 0);
        return ownWeight + containedWeight;
    }

    private addInventoryItem(item: InventoryEntry, destination = 'inventory'): void {
        this.inventoryEntries.update((entries) => {
            const enrichedItem = this.createEnrichedInventoryItem(item);

            if (destination !== 'inventory') {
                const containerIndex = entries.findIndex((entry) => entry.isContainer && entry.name === destination);
                if (containerIndex !== -1) {
                    const next = [...entries];
                    const targetContainer = next[containerIndex];
                    const containedItems = [...(targetContainer.containedItems ?? [])];
                    const nestedIndex = containedItems.findIndex((entry) => entry.name === enrichedItem.name);

                    if (nestedIndex === -1) {
                        containedItems.push({ ...enrichedItem });
                    } else {
                        containedItems[nestedIndex] = {
                            ...containedItems[nestedIndex],
                            quantity: containedItems[nestedIndex].quantity + enrichedItem.quantity,
                            weight: containedItems[nestedIndex].weight ?? enrichedItem.weight,
                            costGp: containedItems[nestedIndex].costGp ?? enrichedItem.costGp,
                            sourceLabel: containedItems[nestedIndex].sourceLabel ?? enrichedItem.sourceLabel,
                            summary: containedItems[nestedIndex].summary ?? enrichedItem.summary,
                            notes: containedItems[nestedIndex].notes || enrichedItem.notes,
                            detailLines: containedItems[nestedIndex].detailLines ?? enrichedItem.detailLines,
                            rarity: containedItems[nestedIndex].rarity ?? enrichedItem.rarity,
                            attunement: containedItems[nestedIndex].attunement ?? enrichedItem.attunement,
                            isContainer: enrichedItem.isContainer,
                            maxCapacity: enrichedItem.maxCapacity,
                            containedItems: enrichedItem.containedItems ?? containedItems[nestedIndex].containedItems
                        };
                    }

                    next[containerIndex] = {
                        ...targetContainer,
                        containedItems
                    };
                    return next;
                }
            }

            const index = entries.findIndex((entry) => entry.name === item.name);
            if (index === -1) {
                return [...entries, { ...enrichedItem }];
            }

            const next = [...entries];
            next[index] = {
                ...next[index],
                quantity: next[index].quantity + enrichedItem.quantity,
                weight: next[index].weight ?? enrichedItem.weight,
                costGp: next[index].costGp ?? enrichedItem.costGp,
                sourceLabel: next[index].sourceLabel ?? enrichedItem.sourceLabel,
                summary: next[index].summary ?? enrichedItem.summary,
                notes: next[index].notes || enrichedItem.notes,
                detailLines: next[index].detailLines ?? enrichedItem.detailLines,
                rarity: next[index].rarity ?? enrichedItem.rarity,
                attunement: next[index].attunement ?? enrichedItem.attunement,
                isContainer: enrichedItem.isContainer,
                maxCapacity: enrichedItem.maxCapacity,
                containedItems: enrichedItem.containedItems ?? next[index].containedItems
            };
            return next;
        });
    }

    private createEnrichedInventoryItem(item: InventoryEntry): InventoryEntry {
        const isContainer = this.isContainerItem(item.name);
        const catalogItem = this.findEquipmentCatalogItem(item);
        const trimmedNotes = item.notes?.trim();
        const shouldUseCatalogNotes = this.shouldUseCatalogNotes(item, catalogItem, trimmedNotes);

        return {
            ...item,
            sourceUrl: item.sourceUrl ?? catalogItem?.sourceUrl,
            weight: item.weight ?? catalogItem?.weight,
            costGp: typeof item.costGp === 'number' ? item.costGp : catalogItem?.costGp,
            sourceLabel: item.sourceLabel ?? catalogItem?.sourceLabel,
            summary: item.summary?.trim() || catalogItem?.summary,
            notes: shouldUseCatalogNotes ? catalogItem?.notes : trimmedNotes,
            detailLines: item.detailLines?.length ? item.detailLines : catalogItem?.detailLines,
            rarity: item.rarity ?? catalogItem?.rarity,
            attunement: item.attunement ?? catalogItem?.attunement,
            isContainer: item.isContainer ?? isContainer,
            maxCapacity: item.maxCapacity ?? (isContainer ? this.getContainerCapacity(item.name) : undefined),
            containedItems: (item.containedItems ?? []).map((containedItem) => this.createEnrichedInventoryItem(containedItem))
        };
    }

    private findEquipmentCatalogItem(item: Pick<InventoryEntry, 'name' | 'category' | 'sourceUrl'>): EquipmentItem | undefined {
        const candidateNames = this.getEquipmentLookupCandidates(item.name);

        return equipmentCatalog.find((catalogItem) => {
            if (catalogItem.category !== item.category) {
                return false;
            }

            if (item.sourceUrl && catalogItem.sourceUrl !== item.sourceUrl) {
                return false;
            }

            return candidateNames.includes(this.normalizeEquipmentLookupName(catalogItem.name));
        });
    }

    private shouldUseCatalogNotes(item: InventoryEntry, catalogItem: EquipmentItem | undefined, trimmedNotes: string | undefined): boolean {
        if (!catalogItem?.notes?.trim()) {
            return false;
        }

        if (!trimmedNotes) {
            return true;
        }

        const hasStructuredLocalContent = Boolean(item.summary?.trim() || item.detailLines?.length);
        const hasStructuredCatalogContent = Boolean(catalogItem.summary?.trim() || catalogItem.detailLines?.length);

        return !hasStructuredLocalContent && hasStructuredCatalogContent;
    }

    private getEquipmentLookupCandidates(name: string): string[] {
        const normalizedName = this.normalizeEquipmentLookupName(name);
        const aliases = this.equipmentLookupAliases[normalizedName] ?? [];
        return [normalizedName, ...aliases];
    }

    private normalizeEquipmentLookupName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[()]/g, ' ')
            .replace(/,/g, ' ')
            .replace(/[-/]/g, ' ')
            .replace(/'/g, '')
            .replace(/\bof\b/g, ' ')
            .replace(/\bthe\b/g, ' ')
            .replace(/\bfilled\b/g, ' ')
            .replace(/\blit\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .sort()
            .join(' ');
    }

    private addCurrency(key: keyof CurrencyState, amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.currency.update((current) => ({ ...current, [key]: current[key] + amount }));
    }

    onAbilityMethodSelected(method: AbilityGenerationMethod): void {
        this.selectedAbilityMethod.set(method);
        const nullRecord = { Strength: null, Dexterity: null, Constitution: null, Intelligence: null, Wisdom: null, Charisma: null };
        this.abilityOtherModifiers.set({ ...nullRecord });
        this.abilityOverrideScores.set({ ...nullRecord });

        if (method === 'standard-array') {
            this.standardArraySelections.set({
                Strength: null,
                Dexterity: null,
                Constitution: null,
                Intelligence: null,
                Wisdom: null,
                Charisma: null
            });
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            return;
        }

        if (method === 'point-buy') {
            this.abilityBaseScores.set({
                Strength: 8,
                Dexterity: 8,
                Constitution: 8,
                Intelligence: 8,
                Wisdom: 8,
                Charisma: 8
            });
            return;
        }

        if (method === 'manual-rolled') {
            this.abilityBaseScores.set({
                Strength: 0,
                Dexterity: 0,
                Constitution: 0,
                Intelligence: 0,
                Wisdom: 0,
                Charisma: 0
            });
            this.rolledValues.set([null, null, null, null, null, null]);
            this.rolledAssignments.set({});
            this.manualRollGroupCount.set(1);
            return;
        }

        this.abilityBaseScores.set({
            Strength: 10,
            Dexterity: 10,
            Constitution: 10,
            Intelligence: 10,
            Wisdom: 10,
            Charisma: 10
        });
    }

    onAbilityScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        // Allow natural typing (e.g. entering 17) without immediate clamping.
        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: parsed
        }));
    }

    onAbilityScoreCommit(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        const method = this.selectedAbilityMethod();
        const min = method === 'point-buy' ? 8 : 3;
        const max = method === 'point-buy' ? 15 : 20;
        const clamped = Math.max(min, Math.min(max, parsed));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: clamped
        }));
    }

    onStandardArraySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        const nextValue = Number.isNaN(parsed) ? null : parsed;

        this.standardArraySelections.update((current) => ({
            ...current,
            [ability]: nextValue
        }));

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: nextValue ?? 0
        }));
    }

    getStandardArraySelection(ability: string): string {
        const value = this.standardArraySelections()[ability];
        return value == null ? '' : String(value);
    }

    getStandardArrayOptions(ability: string): ReadonlyArray<number> {
        const selections = this.standardArraySelections();
        const ownValue = selections[ability];
        const takenValues = new Set(
            Object.entries(selections)
                .filter(([key, val]) => key !== ability && val != null)
                .map(([, val]) => val as number)
        );
        return this.standardArrayValues.filter((v) => !takenValues.has(v) || v === ownValue);
    }

    onPointBuySelected(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return;
        }

        this.abilityBaseScores.update((current) => ({
            ...current,
            [ability]: parsed
        }));
    }

    getPointBuySelection(ability: string): string {
        return String(this.getAbilityBaseScore(ability));
    }

    isPointBuyOptionDisabled(ability: string, candidate: number): boolean {
        if (this.selectedAbilityMethod() !== 'point-buy') {
            return false;
        }

        const currentScore = this.getAbilityBaseScore(ability);
        const nextSpent = this.pointBuySpent() - this.getPointBuyCost(currentScore) + this.getPointBuyCost(candidate);
        return nextSpent > this.pointBuyBudget;
    }

    addManualRollGroup(): void {
        this.manualRollGroupCount.update((count) => count + 1);
    }

    rollAbilitySlot(index: number): void {
        const rolls = [
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6)
        ];
        rolls.sort((a, b) => b - a);
        const total = rolls[0] + rolls[1] + rolls[2];

        this.rolledValues.update((current) => {
            const next = [...current];
            next[index] = total;
            return next;
        });
    }

    resetManualRollGroup(): void {
        this.rolledValues.set([null, null, null, null, null, null]);
        this.rolledAssignments.set({});
    }

    applyManualRolledScores(): void {
        const nextScores: Record<string, number> = {
            Strength: 0,
            Dexterity: 0,
            Constitution: 0,
            Intelligence: 0,
            Wisdom: 0,
            Charisma: 0
        };

        this.rolledValues().forEach((value, index) => {
            const abilityName = this.abilityTiles[index];
            if (abilityName && value != null) {
                nextScores[abilityName] = value;
            }
        });

        this.abilityBaseScores.set(nextScores);
    }

    getManualRolledDisplay(index: number): string {
        const value = this.rolledValues()[index];
        return value == null ? '--' : String(value);
    }

    getAbilityBaseScore(ability: string): number {
        return this.abilityBaseScores()[ability] ?? 10;
    }

    getCalculatedAbilityScoreBonus(ability: string): number {
        const background = this.getBackgroundAbilityBonuses()[ability] ?? 0;
        const classFeatures = this.getClassFeatureAbilityBonuses()[ability] ?? 0;
        return background + classFeatures;
    }

    getCalculatedAbilityScoreBonusDisplay(ability: string): string {
        return this.toSignedNumber(this.getCalculatedAbilityScoreBonus(ability));
    }

    getSetScoreDisplay(ability: string): string {
        const override = this.abilityOverrideScores()[ability];
        return override == null ? '--' : String(override);
    }

    getStackingBonusDisplay(ability: string): string {
        return this.toSignedNumber(this.abilityOtherModifiers()[ability] ?? 0);
    }

    getTotalScore(ability: string): number {
        const maxScore = this.getAbilityScoreMaximum(ability);
        const overrideScore = this.abilityOverrideScores()[ability];
        if (overrideScore != null) {
            return Math.min(maxScore, overrideScore);
        }

        const total = this.getAbilityBaseScore(ability) + this.getCalculatedAbilityScoreBonus(ability);
        return Math.min(maxScore, total);
    }

    getTotalModifier(ability: string): string {
        const score = this.getTotalScore(ability);
        const base = Math.floor((score - 10) / 2);
        const other = this.getStackingModifier(ability);
        const total = base + other;
        return this.toSignedNumber(total);
    }

    getOtherModifierDisplay(ability: string): string {
        const val = this.abilityOtherModifiers()[ability];
        return val == null ? '' : String(val);
    }

    getOverrideScoreDisplay(ability: string): string {
        const val = this.abilityOverrideScores()[ability];
        return val == null ? '' : String(val);
    }

    onOtherModifierInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOtherModifiers.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    onOverrideScoreInput(ability: string, value: string): void {
        const parsed = Number.parseInt(value, 10);
        this.abilityOverrideScores.update((c) => ({ ...c, [ability]: Number.isNaN(parsed) ? null : parsed }));
    }

    private getStackingModifier(ability: string): number {
        return this.abilityOtherModifiers()[ability] ?? 0;
    }

    private getAbilityScoreMaximum(ability: string): number {
        let maxScore = 20;

        const barbarianLevel = Number(this.multiclassList()['Barbarian'] ?? 0);
        if (barbarianLevel >= 20 && (ability === 'Strength' || ability === 'Constitution')) {
            maxScore = 25;
        }

        if (this.isAbilityRaisedByEpicBoon(ability)) {
            maxScore = Math.max(maxScore, 30);
        }

        return maxScore;
    }

    private isAbilityRaisedByEpicBoon(ability: string): boolean {
        const selections = this.classFeatureSelections();
        const featChoices = this.featFollowUpChoices();

        return Object.entries(selections).some(([selectionKey, selectedValues]) => {
            if (!selectionKey.toLowerCase().includes('epic boon')) {
                return false;
            }

            return selectedValues.some((selectedValue) => {
                if (!selectedValue) {
                    return false;
                }

                const validChoices = this.getFeatAbilityIncreaseChoicesByFeat(selectedValue);
                if (!validChoices.includes(ability)) {
                    return false;
                }

                const selectedAbility = featChoices[selectionKey]?.abilityIncreaseAbility ?? '';
                return selectedAbility === ability;
            });
        });
    }

    private getBackgroundAbilityBonuses(): Record<string, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const mode = this.bgAbilityMode();

        if (mode === 'Increase three scores (+1 / +1 / +1)') {
            this.currentBgAbilityScores().forEach((ability) => {
                this.addAbilityBonus(bonuses, ability, 1);
            });
            return bonuses;
        }

        if (mode === 'Increase two scores (+2 / +1)') {
            const allowed = new Set(this.currentBgAbilityScores());
            const primary = this.bgAbilityScoreFor2();
            const secondary = this.bgAbilityScoreFor1();

            if (allowed.has(primary)) {
                this.addAbilityBonus(bonuses, primary, 2);
            }

            if (allowed.has(secondary) && secondary !== primary) {
                this.addAbilityBonus(bonuses, secondary, 1);
            }
        }

        return bonuses;
    }

    private getClassFeatureAbilityBonuses(excludedSelectionKey: string | null = null): Record<string, number> {
        const bonuses = this.createEmptyAbilityBonusMap();
        const selections = this.classFeatureSelections();
        const asiChoices = this.abilityScoreImprovementChoices();
        const featChoices = this.featFollowUpChoices();

        if (Number(this.multiclassList()['Barbarian'] ?? 0) >= 20) {
            this.addAbilityBonus(bonuses, 'Strength', 4);
            this.addAbilityBonus(bonuses, 'Constitution', 4);
        }

        Object.entries(selections).forEach(([selectionKey, selectedValues]) => {
            if (excludedSelectionKey && selectionKey === excludedSelectionKey) {
                return;
            }

            selectedValues.forEach((selectedValue) => {
                if (!selectedValue) {
                    return;
                }

                if (selectedValue === 'Ability Score Improvement') {
                    const asiChoice = asiChoices[selectionKey];
                    if (!asiChoice) {
                        return;
                    }

                    if (asiChoice.mode === 'plus-two' && asiChoice.primaryAbility) {
                        this.addAbilityBonus(bonuses, asiChoice.primaryAbility, 2);
                        return;
                    }

                    if (
                        asiChoice.mode === 'plus-one-plus-one'
                        && asiChoice.primaryAbility
                        && asiChoice.secondaryAbility
                        && asiChoice.primaryAbility !== asiChoice.secondaryAbility
                    ) {
                        this.addAbilityBonus(bonuses, asiChoice.primaryAbility, 1);
                        this.addAbilityBonus(bonuses, asiChoice.secondaryAbility, 1);
                    }

                    return;
                }

                const validChoices = this.getFeatAbilityIncreaseChoicesByFeat(selectedValue);
                if (validChoices.length === 0) {
                    return;
                }

                const selectedAbility = featChoices[selectionKey]?.abilityIncreaseAbility ?? '';
                if (validChoices.includes(selectedAbility)) {
                    this.addAbilityBonus(bonuses, selectedAbility, 1);
                }
            });
        });

        return bonuses;
    }

    private createEmptyAbilityBonusMap(): Record<string, number> {
        return this.abilityTiles.reduce<Record<string, number>>((current, ability) => {
            current[ability] = 0;
            return current;
        }, {});
    }

    private addAbilityBonus(target: Record<string, number>, ability: string, amount: number): void {
        if (!ability || !Object.prototype.hasOwnProperty.call(target, ability)) {
            return;
        }

        target[ability] = (target[ability] ?? 0) + amount;
    }

    private toSignedNumber(value: number): string {
        return value >= 0 ? `+${value}` : `${value}`;
    }

    getAbilityModifier(score: number): string {
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    getPointBuyCost(score: number): number {
        if (score <= 8) {
            return 0;
        }
        if (score <= 13) {
            return score - 8;
        }
        if (score === 14) {
            return 7;
        }
        return 9;
    }

    getPointBuyOptionLabel(value: number): string {
        const cost = this.getPointBuyCost(value);
        if (cost === 0) {
            return String(value);
        }
        const unit = cost === 1 ? 'Point' : 'Points';
        return `${value} (-${cost} ${unit})`;
    }

    onLanguageToggle(language: string, checked: boolean): void {
        this.selectedLanguages.update((current) => {
            if (checked) {
                return current.includes(language) ? current : [...current, language];
            } else {
                return current.filter((lang) => lang !== language);
            }
        });
    }

    isLanguageSelected(language: string): boolean {
        return this.selectedLanguages().includes(language);
    }

    getStandardArrayDropdownOptions(ability: string): DropdownOption[] {
        const selected = this.standardArraySelections();
        const available = new Set(this.standardArrayValues);
        const currentValue = selected[ability];

        if (currentValue) {
            available.add(Number(currentValue));
        }

        return Array.from(available)
            .sort((a, b) => b - a)
            .map((value) => ({ value: String(value), label: String(value) }));
    }

    readonly openCharacteristicModal = (type: 'traits' | 'ideals' | 'bonds' | 'flaws') => {
        this.activeCharacteristicModal.set(type);
    };

    readonly closeCharacteristicModal = () => {
        this.activeCharacteristicModal.set(null);
    };

    readonly getActiveCharacteristicValues = (): string[] => {
        const type = this.activeCharacteristicModal();
        if (!type) {
            return [];
        }

        switch (type) {
            case 'traits':
                return this.personalityTraits();
            case 'ideals':
                return this.ideals();
            case 'bonds':
                return this.bonds();
            case 'flaws':
                return this.flaws();
        }
    };

    readonly onCharacteristicSubmit = (values: string[]) => {
        const type = this.activeCharacteristicModal();
        if (!type) {
            this.closeCharacteristicModal();
            return;
        }

        const normalizedValues = Array.from(new Set((values ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));

        switch (type) {
            case 'traits':
                this.personalityTraits.set(normalizedValues);
                break;
            case 'ideals':
                this.ideals.set(normalizedValues);
                break;
            case 'bonds':
                this.bonds.set(normalizedValues);
                break;
            case 'flaws':
                this.flaws.set(normalizedValues);
                break;
        }

        this.closeCharacteristicModal();
    };

    readonly removeCharacteristic = (type: 'traits' | 'ideals' | 'bonds' | 'flaws', index: number) => {
        switch (type) {
            case 'traits':
                this.personalityTraits.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'ideals':
                this.ideals.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'bonds':
                this.bonds.update((current) => current.filter((_, i) => i !== index));
                break;
            case 'flaws':
                this.flaws.update((current) => current.filter((_, i) => i !== index));
                break;
        }
    };

    readonly toggleNoteSection = (section: NoteSectionKey) => {
        this.openNoteSections.update((current) => ({
            ...current,
            [section]: !current[section]
        }));
    };

    readonly isNoteSectionOpen = (section: NoteSectionKey): boolean => this.openNoteSections()[section];

    readonly getNoteEntries = (section: CharacterNoteListKey): string[] => {
        switch (section) {
            case 'organizations':
                return this.noteOrganizations();
            case 'allies':
                return this.noteAllies();
            case 'enemies':
                return this.noteEnemies();
        }
    };

    readonly getNoteCustomDraft = (section: CharacterNoteListKey): string => this.noteCustomDrafts()[section] ?? '';

    readonly onNoteEntriesChanged = (section: CharacterNoteListKey, values: string[]) => {
        this.setNoteEntries(section, this.uniqueNoteEntries(values));
    };

    readonly onNoteCustomDraftChanged = (section: CharacterNoteListKey, value: string) => {
        this.noteCustomDrafts.update((current) => ({
            ...current,
            [section]: value
        }));
    };

    readonly addCustomNoteEntry = (section: CharacterNoteListKey) => {
        const draft = this.getNoteCustomDraft(section).trim();
        if (!draft) {
            return;
        }

        this.setNoteEntries(section, [...this.getNoteEntries(section), draft]);
        this.onNoteCustomDraftChanged(section, '');
    };

    readonly removeNoteEntry = (section: CharacterNoteListKey, index: number) => {
        this.setNoteEntries(
            section,
            this.getNoteEntries(section).filter((_, currentIndex) => currentIndex !== index)
        );
    };

    readonly onOtherNotesChanged = (value: string) => {
        this.otherNotes.set(value);
    };

    readonly toggleBackstoryGenerator = () => {
        const nextOpen = !this.showBackstoryGenerator();
        this.showBackstoryGenerator.set(nextOpen);

        if (nextOpen) {
            this.backstoryPromptUserEdited.set(false);
            this.backstoryPromptDetails.set(this.buildAutoBackstoryDirection());
        }

        this.backstoryGenerationError.set('');
        this.backstorySaveMessage.set('');
    };

    readonly onBackstoryPromptDetailsChanged = (value: string) => {
        this.backstoryPromptUserEdited.set(true);
        this.backstoryPromptDetails.set(value);
    };

    formatFeatureRichText(text: string): string {
        return String(marked.parse(text || '', { gfm: true, breaks: true }));
    }

    isBarbarianRageFeature(className: string, feature: ClassFeature): boolean {
        return className === 'Barbarian' && feature.name === 'Rage';
    }

    getBarbarianRageActiveText(description: string): string {
        const marker = 'While active, your Rage follows the rules below.';
        const startIndex = description.indexOf(marker);
        return startIndex >= 0 ? description.slice(startIndex) : description;
    }

    toggleRageFeatureDetails(): void {
        this.rageFeatureDetailsExpanded.update((value) => !value);
    }

    onRageFeatureOptionChanged(value: string | number): void {
        this.selectedRageFeatureOption.set(String(value));
    }

    getRageFeatureUses(className: string): number {
        const currentLevel = Number(this.multiclassList()[className] ?? 1);
        const usesText = this.getClassProgressionCell(className, 'Rages', currentLevel);
        const parsedUses = Number.parseInt(usesText, 10);
        return Number.isFinite(parsedUses) && parsedUses > 0 ? parsedUses : 0;
    }

    getRageFeatureCheckboxIndexes(className: string): number[] {
        return Array.from({ length: this.getRageFeatureUses(className) }, (_, index) => index);
    }

    onRageFeatureCheckboxChanged(boxIndex: number, checked: boolean): void {
        this.rageFeatureUsedCount.set(checked ? boxIndex + 1 : boxIndex);
    }

    private getClassProgressionCell(className: string, label: string, level: number): string {
        const columns = classProgressionColumns[className] ?? [];
        const column = columns.find((entry) => entry.label === label);
        if (!column) {
            return '';
        }

        const index = Math.max(0, Math.min(column.values.length - 1, level - 1));
        return column.values[index] ?? '';
    }

    formatBackstoryRichText(text: string): string {
        return String(marked.parse(text || '', { gfm: true, breaks: true }));
    }

    readonly clearGeneratedBackstory = () => {
        this.generatedBackstory.set('');
        this.backstorySaveMessage.set('');
        this.backstorySnapshot.set(null);
    };

    readonly saveGeneratedBackstoryToCharacter = async () => {
        const backstory = this.generatedBackstory().trim();
        const target = this.backstoryTargetCharacter();
        if (!backstory || !target || this.isSavingGeneratedBackstory()) {
            return;
        }

        this.isSavingGeneratedBackstory.set(true);
        this.backstorySaveMessage.set('');

        try {
            const persisted = await this.store.saveCharacterBackstory(target.id, backstory);
            this.backstorySaveMessage.set(
                persisted
                    ? `Saved to ${target.name}.`
                    : `Could not save to ${target.name}.`
            );
        } catch {
            this.backstorySaveMessage.set('Could not save backstory at this time.');
        } finally {
            this.isSavingGeneratedBackstory.set(false);
            this.cdr.detectChanges();
        }
    };

    readonly generateBackstory = async () => {
        if (this.isGeneratingBackstory()) {
            return;
        }

        this.isGeneratingBackstory.set(true);
        this.backstoryGenerationError.set('');
        this.backstorySaveMessage.set('');
        this.generatedBackstory.set('');

        try {
            const response = await this.api.generateCharacterBackstory({
                className: this.getCurrentClassSummary(),
                background: this.selectedBackgroundName() || 'Unknown background',
                species: this.selectedSpeciesName() || 'Unknown species',
                alignment: this.selectedAlignment() || 'Unchosen alignment',
                lifestyle: this.selectedLifestyle() || 'Unchosen lifestyle',
                personalityTraits: this.personalityTraits().slice(0, 3),
                ideals: this.ideals().slice(0, 2),
                bonds: this.bonds().slice(0, 2),
                flaws: this.flaws().slice(0, 2),
                additionalDirection: this.backstoryPromptDetails().trim()
            });

            this.generatedBackstory.set(response.backstory);
            this.backstorySnapshot.set({
                className: this.getCurrentClassSummary(),
                species: this.selectedSpeciesName() || 'Unknown species',
                background: this.selectedBackgroundName() || 'Unknown background'
            });
        } catch (error) {
            this.backstoryGenerationError.set(this.getBackstoryGenerationErrorMessage(error));
        } finally {
            this.isGeneratingBackstory.set(false);
            this.cdr.detectChanges();
        }
    };

    private getCurrentClassSummary(): string {
        const selected = this.selectedClass();
        if (selected && selected !== '__MULTICLASS_SELECTOR__') {
            return selected;
        }

        const multiClasses = Object.keys(this.multiclassList());
        if (multiClasses.length > 0) {
            return multiClasses.join(', ');
        }

        return 'Unknown class';
    }

    isPrimaryClass(className: string): boolean {
        return this.getPrimaryClassName() === className;
    }

    private getPrimaryClassName(): string {
        const selected = this.selectedClass();
        if (selected && selected !== '__MULTICLASS_SELECTOR__') {
            return selected;
        }

        const classes = Object.keys(this.multiclassList());
        if (classes.length > 0) {
            return classes[0]?.trim() ?? '';
        }

        return this.backstoryTargetCharacter()?.className?.trim() ?? '';
    }

    private getPrimaryClassLevel(): number {
        const primaryClass = this.getPrimaryClassName();
        if (primaryClass) {
            const level = this.multiclassList()[primaryClass];
            if (Number.isFinite(level) && (level ?? 0) > 0) {
                return Math.min(20, Math.max(1, Math.trunc(level as number)));
            }
        }

        const currentLevel = this.characterLevel();
        if (Number.isFinite(currentLevel) && currentLevel > 0) {
            return Math.min(20, Math.max(1, Math.trunc(currentLevel)));
        }

        return Math.min(20, Math.max(1, Math.trunc(this.backstoryTargetCharacter()?.level ?? 1)));
    }

    private buildCompletionDraft(): CharacterDraft | null {
        const characterName = this.completionCharacterName().trim();
        const playerName = this.suggestedPlayerName().trim() || 'Player';
        const className = this.getPrimaryClassName();

        if (!characterName || !className) {
            return null;
        }

        const background = this.selectedBackgroundName() || this.selectedBackground()?.name || 'Freshly arrived adventurer';
        const notes = this.buildPersistedNotes();
        const selectedCampaignId = this.selectedCampaignIdsOnCreate()[0] || undefined;
        const level = this.getPrimaryClassLevel();
        const maxHitPoints = this.getResolvedHitPointTotal(className, level);
        const savedLanguages = this.uniqueNoteEntries([
            ...this.speciesKnownLanguages(),
            ...this.selectedSpeciesLanguages(),
            ...this.selectedLanguages()
        ]);

        return {
            name: characterName,
            playerName,
            race: this.selectedSpeciesName() || 'Human',
            className,
            level,
            role: 'Striker',
            background,
            notes,
            campaignId: selectedCampaignId,
            campaignIds: this.selectedCampaignIdsOnCreate(),
            abilityScores: {
                strength: this.getTotalScore('Strength'),
                dexterity: this.getTotalScore('Dexterity'),
                constitution: this.getTotalScore('Constitution'),
                intelligence: this.getTotalScore('Intelligence'),
                wisdom: this.getTotalScore('Wisdom'),
                charisma: this.getTotalScore('Charisma')
            },
            hitPoints: maxHitPoints,
            maxHitPoints,
            image: this.completionPortraitImageUrl(),
            gender: this.physicalGender().trim(),
            alignment: this.getSelectedAlignmentLabel(),
            faith: this.selectedFaith().trim(),
            lifestyle: this.getSelectedLifestyleLabel(),
            languages: savedLanguages,
            personalityTraits: this.personalityTraits(),
            ideals: this.ideals(),
            bonds: this.bonds(),
            flaws: this.flaws()
        };
    }

    readonly onCompletionCharacterNameChanged = (value: string) => {
        this.completionCharacterName.set(value);
        this.completionError.set('');
    };

    readonly onCompletionPortraitPromptChanged = (value: string) => {
        this.completionPortraitPromptDetails.set(value);
        this.completionError.set('');
    };

    readonly onCompletionPortraitFileSelected = async (event: Event) => {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file) {
            return;
        }

        try {
            const imageUrl = await this.readImageFile(file);
            this.completionPortraitOriginalImageUrl.set(imageUrl);
            this.completionPortraitCropSourceImageUrl.set(imageUrl);
            this.completionPortraitCropModalOpen.set(true);
            this.completionError.set('');
        } catch (error) {
            this.completionError.set(error instanceof Error ? error.message : 'Unable to use that image right now.');
        } finally {
            if (input) {
                input.value = '';
            }

            this.cdr.detectChanges();
        }
    };

    readonly closeCompletionPortraitCropModal = () => {
        this.completionPortraitCropModalOpen.set(false);
        this.completionPortraitCropSourceImageUrl.set('');
    };

    readonly applyCompletionPortraitCrop = (croppedImageUrl: string) => {
        const originalImageUrl = this.completionPortraitOriginalImageUrl().trim()
            || this.completionPortraitCropSourceImageUrl().trim()
            || this.completionPortraitImageUrl().trim();

        if (originalImageUrl) {
            this.completionPortraitOriginalImageUrl.set(originalImageUrl);
        }

        this.completionPortraitImageUrl.set(croppedImageUrl);
        this.completionPortraitCropModalOpen.set(false);
        this.completionPortraitCropSourceImageUrl.set('');
        this.completionError.set('');
    };

    readonly recropCompletionPortrait = () => {
        const originalImageUrl = this.completionPortraitOriginalImageUrl().trim();
        const fallbackImageUrl = this.completionPortraitImageUrl().trim();
        const imageUrl = originalImageUrl || fallbackImageUrl;
        if (!imageUrl || this.isCompletingCharacter()) {
            return;
        }

        if (!originalImageUrl && fallbackImageUrl) {
            this.completionPortraitOriginalImageUrl.set(fallbackImageUrl);
        }

        this.completionPortraitCropSourceImageUrl.set(imageUrl);
        this.completionPortraitCropModalOpen.set(true);
        this.completionError.set('');
    };

    readonly clearCompletionPortrait = () => {
        if (this.isCompletingCharacter()) {
            return;
        }

        this.completionPortraitImageUrl.set('');
        this.completionPortraitOriginalImageUrl.set('');
        this.completionPortraitCropSourceImageUrl.set('');
        this.completionPortraitCropModalOpen.set(false);
        this.completionError.set('');
    };

    readonly generateCompletionPortrait = async () => {
        if (this.isCompletingCharacter() || this.isGeneratingCompletionPortrait()) {
            return;
        }

        const className = this.getPrimaryClassName();
        if (!className) {
            this.completionError.set('Choose a class before generating a portrait.');
            return;
        }

        this.isGeneratingCompletionPortrait.set(true);
        this.completionError.set('');

        try {
            const response = await this.api.generateCharacterPortrait({
                name: this.completionCharacterName().trim() || 'Unnamed adventurer',
                className,
                background: this.selectedBackgroundName() || this.selectedBackground()?.name || 'Freshly arrived adventurer',
                species: this.selectedSpeciesName() || 'Human',
                alignment: this.selectedAlignment() || '',
                gender: this.physicalGender() || '',
                additionalDirection: this.buildCompletionPortraitDirection(this.completionPortraitPromptDetails().trim())
            });

            this.completionPortraitOriginalImageUrl.set(response.imageUrl);
            this.completionPortraitImageUrl.set(response.imageUrl);
        } catch (error) {
            this.completionError.set(this.getPortraitGenerationErrorMessage(error));
        } finally {
            this.isGeneratingCompletionPortrait.set(false);
            this.cdr.detectChanges();
        }
    };

    private buildCompletionPortraitDirection(manualDirection: string): string {
        const appearanceDetails = [
            ['Gender', this.physicalGender().trim()],
            ['Age', this.physicalAge().trim()],
            ['Height', this.formatPhysicalMeasurement(this.physicalHeight().trim(), this.physicalHeightUnit())],
            ['Weight', this.formatPhysicalMeasurement(this.physicalWeight().trim(), this.physicalWeightUnit())],
            ['Hair', this.physicalHair().trim()],
            ['Eyes', this.physicalEyes().trim()],
            ['Skin', this.physicalSkin().trim()]
        ].filter(([, value]) => value.length > 0);

        if (appearanceDetails.length === 0) {
            return manualDirection;
        }

        const appearanceSummary = `Use these known appearance details: ${appearanceDetails.map(([label, value]) => `${label}: ${value}`).join('; ')}`;
        return manualDirection
            ? `${appearanceSummary}\nRequested art direction: ${manualDirection}`
            : appearanceSummary;
    }

    private readImageFile(file: File): Promise<string> {
        if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('Choose an image file for the portrait.'));
        }

        if (file.size > 20 * 1024 * 1024) {
            return Promise.reject(new Error('Image must be under 20 MB. For best performance, images under 8 MB are recommended.'));
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

    private buildInitials(name: string): string {
        const parts = name
            .split(/\s+/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);

        if (parts.length === 0) {
            return 'DK';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }

    readonly completeCharacterCreation = async () => {
        if (this.isCompletingCharacter()) {
            return;
        }

        const draft = this.buildCompletionDraft();
        if (!draft) {
            this.completionError.set('Add a character name and class before completing creation.');
            return;
        }

        this.isCompletingCharacter.set(true);
        this.completionError.set('');

        try {
            const existingId = this.activeBuilderCharacterId();
            const resultCharacter = existingId
                ? await this.store.updateCharacter(existingId, draft)
                : await this.store.createCharacter(draft);

            if (!resultCharacter) {
                this.completionError.set('Unable to complete character creation right now.');
                return;
            }

            this.clearBuilderSessionSnapshot(existingId || resultCharacter.id);
            if (!existingId) {
                this.clearBuilderSessionSnapshot();
            }

            await this.router.navigate(['/characters', resultCharacter.id]);
        } catch {
            this.completionError.set('Unable to complete character creation right now.');
        } finally {
            this.isCompletingCharacter.set(false);
            this.cdr.detectChanges();
        }
    };

    private getBackstoryGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error;
            }

            if (error.error && typeof error.error.detail === 'string' && error.error.detail.trim()) {
                return error.error.detail;
            }

            if (error.status === 0) {
                return 'Unable to reach the backstory service right now.';
            }
        }

        return error instanceof Error ? error.message : 'Unable to generate a backstory right now.';
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

    private hydrateBuilderFromCharacter(character: Character, levelOverride: number = Number.NaN): void {
        const sessionSnapshot = this.readBuilderSessionSnapshot();
        const resolvedLevel = Number.isFinite(levelOverride)
            ? Math.min(20, Math.max(1, Math.trunc(levelOverride)))
            : Math.max(character.level, 1);

        this.completionCharacterName.set(sessionSnapshot?.completionCharacterName?.trim() || character.name);
        this.completionPortraitImageUrl.set(sessionSnapshot?.completionPortraitImageUrl?.trim() || character.image || '');
        this.completionPortraitOriginalImageUrl.set(sessionSnapshot?.completionPortraitOriginalImageUrl?.trim() || '');
        this.multiclassList.set({ [character.className]: resolvedLevel });
        this.setClassPanelTab(character.className, 'class-features');
        this.syncPreparedSpellsForClass(character.className, resolvedLevel);
        this.characterLevel.set(resolvedLevel);
        this.navigationEditLevel.set(resolvedLevel);
        this.selectedClass.set('');

        const matchedPremade = this.findMatchingPremadeCharacter(character);
        const premadeAppearance = this.resolvePremadeAppearance(character, matchedPremade);

        this.selectedSpeciesName.set(sessionSnapshot?.selectedSpeciesName?.trim() || character.race);
        this.selectedAlignment.set(this.normalizeAlignmentSelection((character.alignment || matchedPremade?.alignment || '').trim()));
        this.selectedFaith.set((character.faith || matchedPremade?.faith || '').trim());
        this.selectedLifestyle.set(this.normalizeLifestyleSelection((character.lifestyle || matchedPremade?.lifestyle || '').trim()));
        this.physicalGender.set(character.gender || matchedPremade?.gender || '');

        const backgroundName = character.background.trim();
        if (backgroundName) {
            this.selectedBackgroundName.set(backgroundName);
            const option = this.backgroundOptions.find((entry) => entry.name.toLowerCase() === backgroundName.toLowerCase());
            this.selectedBackgroundUrl.set(option?.url ?? '');
        }

        const linkedCampaignIds = Array.from(new Set(
            [character.campaignId, ...(character.campaignIds ?? [])]
                .filter((campaignId): campaignId is string => typeof campaignId === 'string' && campaignId.trim().length > 0)
        ));
        const sessionCampaignIds = Array.isArray(sessionSnapshot?.selectedCampaignIdsOnCreate)
            ? sessionSnapshot.selectedCampaignIdsOnCreate.filter((campaignId) => typeof campaignId === 'string' && campaignId.trim().length > 0)
            : [];
        const nextCampaignIds = sessionCampaignIds.length > 0 ? sessionCampaignIds : linkedCampaignIds;
        if (nextCampaignIds.length > 0) {
            this.selectedCampaignIdsOnCreate.set(nextCampaignIds);
        }

        const parsedCharacterNotes = this.parsePersistedNotes(character.notes ?? '');
        const parsedSessionNotes = this.parsePersistedNotes(sessionSnapshot?.notes?.trim() || '');
        const parsedNotes = {
            cleanedNotes: (parsedSessionNotes.cleanedNotes.trim() || parsedCharacterNotes.cleanedNotes.trim()),
            state: this.mergePersistedBuilderStates(parsedCharacterNotes.state, parsedSessionNotes.state)
        };
        const notes = parsedNotes.cleanedNotes.trim();
        const parsedOrganizations = this.extractNoteListFromText(notes, 'Organizations');
        const parsedAllies = this.extractNoteListFromText(notes, 'Allies');
        const parsedEnemies = this.extractNoteListFromText(notes, 'Enemies');
        const parsedOtherNotes = this.extractOtherNotes(notes);
        const parsedPhysical = this.extractPhysicalCharacteristicsFromText(notes);
        this.generatedBackstory.set(sessionSnapshot?.generatedBackstory?.trim() || this.extractVisibleBackstory(notes));

        const persisted = parsedNotes.state;
        if (persisted) {
            const persistedClassLevels = persisted.multiclassList && typeof persisted.multiclassList === 'object'
                ? Object.fromEntries(
                    Object.entries(persisted.multiclassList)
                        .filter(([className]) => typeof className === 'string' && className.trim().length > 0)
                        .map(([className, level]) => [className.trim(), Math.min(20, Math.max(1, Math.trunc(Number(level) || 1)))])
                )
                : null;

            if (persistedClassLevels && Object.keys(persistedClassLevels).length > 0) {
                this.multiclassList.set(persistedClassLevels);
                const restoredPrimaryClass = persisted.selectedClass?.trim() || Object.keys(persistedClassLevels)[0] || character.className;
                const restoredPrimaryLevel = Math.max(1, persistedClassLevels[restoredPrimaryClass] || resolvedLevel);
                this.setClassPanelTab(restoredPrimaryClass, 'class-features');
                this.syncPreparedSpellsForClass(restoredPrimaryClass, restoredPrimaryLevel);
                this.characterLevel.set(restoredPrimaryLevel);
                this.navigationEditLevel.set(restoredPrimaryLevel);
                this.selectedClass.set('');
            } else if (typeof persisted.characterLevel === 'number' && Number.isFinite(persisted.characterLevel)) {
                const persistedLevel = Math.min(20, Math.max(1, Math.trunc(persisted.characterLevel)));
                this.multiclassList.set({ [character.className]: persistedLevel });
                this.setClassPanelTab(character.className, 'class-features');
                this.syncPreparedSpellsForClass(character.className, persistedLevel);
                this.characterLevel.set(persistedLevel);
                this.navigationEditLevel.set(persistedLevel);
            }

            if (persisted.selectedBackgroundName?.trim()) {
                this.selectedBackgroundName.set(persisted.selectedBackgroundName.trim());
            }

            if (persisted.selectedBackgroundUrl?.trim()) {
                this.selectedBackgroundUrl.set(persisted.selectedBackgroundUrl.trim());
            }

            this.selectedAlignment.set(this.normalizeAlignmentSelection((persisted.selectedAlignment || this.selectedAlignment() || matchedPremade?.alignment || '').trim()));
            this.selectedLifestyle.set(this.normalizeLifestyleSelection((persisted.selectedLifestyle || this.selectedLifestyle() || matchedPremade?.lifestyle || '').trim()));
            this.selectedFaith.set((persisted.selectedFaith || this.extractFaithFromNotes(notes) || this.selectedFaith() || matchedPremade?.faith || '').trim());

            const inferredBackgroundState = this.inferBackgroundStateFromCharacter(character);
            const restoredBackgroundLanguages = Array.isArray(persisted.selectedLanguages)
                ? this.uniqueNoteEntries(persisted.selectedLanguages).filter((language) => !this.speciesKnownLanguages().includes(language))
                : inferredBackgroundState.selectedLanguages;
            const restoredSpeciesLanguages = Array.isArray(persisted.selectedSpeciesLanguages)
                ? this.uniqueNoteEntries(persisted.selectedSpeciesLanguages).filter((language) =>
                    !this.speciesKnownLanguages().includes(language) && !restoredBackgroundLanguages.includes(language)
                )
                : inferredBackgroundState.selectedSpeciesLanguages.filter((language) => !restoredBackgroundLanguages.includes(language));

            this.selectedLanguages.set(restoredBackgroundLanguages);
            this.selectedSpeciesLanguages.set(restoredSpeciesLanguages);
            const persistedSpeciesTraitChoices = persisted.selectedSpeciesTraitChoices;
            this.selectedSpeciesTraitChoices.set(
                persistedSpeciesTraitChoices && Object.keys(persistedSpeciesTraitChoices).length > 0
                    ? persistedSpeciesTraitChoices
                    : (matchedPremade?.speciesTraitChoices ?? {})
            );

            const restoredClassLevels = persistedClassLevels && Object.keys(persistedClassLevels).length > 0
                ? persistedClassLevels
                : { [character.className]: this.getPrimaryClassLevel() };
            const inferredFeatureSelections = this.inferClassFeatureSelectionsFromCharacter(character);
            const persistedFeatureSelections = this.normalizePersistedFeatureSelections(restoredClassLevels, persisted.classFeatureSelections ?? {});
            this.classFeatureSelections.set({
                ...inferredFeatureSelections,
                // Spread raw persisted first so dynamically-resolved features (subclass,
                // ASI, Epic Boon) whose raw data has no 'choices' keep their saved values.
                ...(persisted.classFeatureSelections ?? {}),
                // Then override with normalized values for features present in raw data.
                ...persistedFeatureSelections
            });
            this.abilityScoreImprovementChoices.set(persisted.abilityScoreImprovementChoices ?? {});
            this.featFollowUpChoices.set(persisted.featFollowUpChoices ?? {});
            this.backgroundChoiceSelections.set({
                ...inferredBackgroundState.backgroundChoiceSelections,
                ...(persisted.backgroundChoiceSelections ?? {})
            });

            const persistedAbilityMethod = persisted.selectedAbilityMethod as AbilityGenerationMethod;
            this.selectedAbilityMethod.set(
                persistedAbilityMethod === 'standard-array' || persistedAbilityMethod === 'point-buy' || persistedAbilityMethod === 'manual-rolled'
                    ? persistedAbilityMethod
                    : 'manual-rolled'
            );
            this.abilityOtherModifiers.set(persisted.abilityOtherModifiers ?? this.abilityOtherModifiers());
            this.abilityOverrideScores.set(persisted.abilityOverrideScores ?? this.abilityOverrideScores());
            this.standardArraySelections.set(persisted.standardArraySelections ?? this.standardArraySelections());
            this.rolledValues.set(Array.isArray(persisted.rolledValues) ? persisted.rolledValues : this.rolledValues());
            this.rolledAssignments.set(persisted.rolledAssignments ?? this.rolledAssignments());
            this.manualRollGroupCount.set(
                Number.isFinite(persisted.manualRollGroupCount)
                    ? Math.max(1, Math.trunc(persisted.manualRollGroupCount))
                    : this.manualRollGroupCount()
            );

            this.bgAbilityMode.set(persisted.bgAbilityMode || inferredBackgroundState.bgAbilityMode || this.bgAbilityMode());
            this.bgAbilityScoreFor2.set(persisted.bgAbilityScoreFor2 || inferredBackgroundState.bgAbilityScoreFor2 || this.bgAbilityScoreFor2());
            this.bgAbilityScoreFor1.set(persisted.bgAbilityScoreFor1 || inferredBackgroundState.bgAbilityScoreFor1 || this.bgAbilityScoreFor1());

            const persistedAbilityBaseScores = persisted.abilityBaseScores;
            const hasPersistedAbilityBaseScores = !!persistedAbilityBaseScores && this.abilityTiles.some((ability) => {
                const score = persistedAbilityBaseScores[ability];
                return typeof score === 'number' && Number.isFinite(score) && score > 0;
            });
            this.abilityBaseScores.set(
                hasPersistedAbilityBaseScores
                    ? persistedAbilityBaseScores
                    : this.inferAbilityBaseScoresFromCharacter(character)
            );
            this.hitPointMode.set(persisted.hitPointMode === 'rolled' ? 'rolled' : 'fixed');
            this.rolledHitPointTotal.set(
                typeof persisted.rolledHitPointTotal === 'number' && Number.isFinite(persisted.rolledHitPointTotal)
                    ? Math.max(1, Math.trunc(persisted.rolledHitPointTotal))
                    : null
            );

            const classStartingChoice = persisted.selectedClassStartingOption;
            this.selectedClassStartingOption.set(classStartingChoice === 'A' || classStartingChoice === 'B' ? classStartingChoice : '');

            const backgroundStartingChoice = persisted.selectedBackgroundStartingOption;
            this.selectedBackgroundStartingOption.set(backgroundStartingChoice === 'A' || backgroundStartingChoice === 'B' ? backgroundStartingChoice : '');

            this.inventoryEntries.set(
                Array.isArray(persisted.inventoryEntries)
                    ? persisted.inventoryEntries.map((entry) => this.createEnrichedInventoryItem(entry))
                    : []
            );
            this.expandedInventoryContainers.set(new Set());

            const nextCurrency = persisted.currency;
            if (nextCurrency && typeof nextCurrency === 'object') {
                this.currency.set({
                    pp: Number(nextCurrency.pp) || 0,
                    gp: Number(nextCurrency.gp) || 0,
                    ep: Number(nextCurrency.ep) || 0,
                    sp: Number(nextCurrency.sp) || 0,
                    cp: Number(nextCurrency.cp) || 0
                });
            }

            this.personalityTraits.set(Array.isArray(persisted.personalityTraits) && persisted.personalityTraits.length > 0 ? persisted.personalityTraits : (character.personalityTraits ?? matchedPremade?.personalityTraits ?? []));
            this.ideals.set(Array.isArray(persisted.ideals) && persisted.ideals.length > 0 ? persisted.ideals : (character.ideals ?? matchedPremade?.ideals ?? []));
            this.bonds.set(Array.isArray(persisted.bonds) && persisted.bonds.length > 0 ? persisted.bonds : (character.bonds ?? matchedPremade?.bonds ?? []));
            this.flaws.set(Array.isArray(persisted.flaws) && persisted.flaws.length > 0 ? persisted.flaws : (character.flaws ?? matchedPremade?.flaws ?? []));

            this.physicalHair.set(persisted.physicalHair || parsedPhysical.hair || premadeAppearance?.hair || '');
            this.physicalSkin.set(persisted.physicalSkin || parsedPhysical.skin || premadeAppearance?.skin || '');
            this.physicalEyes.set(persisted.physicalEyes || parsedPhysical.eyes || premadeAppearance?.eyes || '');
            this.physicalHeight.set(persisted.physicalHeight || parsedPhysical.height || premadeAppearance?.height || '');
            this.physicalHeightUnit.set(this.resolveHeightUnit(persisted.physicalHeightUnit, persisted.physicalHeight || parsedPhysical.height || premadeAppearance?.height || ''));
            this.physicalWeight.set(persisted.physicalWeight || parsedPhysical.weight || premadeAppearance?.weight || '');
            this.physicalWeightUnit.set(this.resolveWeightUnit(persisted.physicalWeightUnit, persisted.physicalWeight || parsedPhysical.weight || premadeAppearance?.weight || ''));
            this.physicalAge.set(persisted.physicalAge || parsedPhysical.age || premadeAppearance?.age || '');
            this.physicalGender.set(persisted.physicalGender || parsedPhysical.gender || character.gender || matchedPremade?.gender || '');
            this.noteOrganizations.set(this.uniqueNoteEntries(Array.isArray(persisted.noteOrganizations) ? persisted.noteOrganizations : parsedOrganizations));
            this.noteAllies.set(this.uniqueNoteEntries(Array.isArray(persisted.noteAllies) ? persisted.noteAllies : parsedAllies));
            this.noteEnemies.set(this.uniqueNoteEntries(Array.isArray(persisted.noteEnemies) ? persisted.noteEnemies : parsedEnemies));
            this.otherNotes.set(typeof persisted.otherNotes === 'string' ? persisted.otherNotes : parsedOtherNotes);

            this.classPreparedSpells.set(persisted.classPreparedSpells ?? {});
            this.classKnownSpellsByClass.set(persisted.classKnownSpellsByClass ?? {});
            this.wizardSpellbookByClass.set(persisted.wizardSpellbookByClass ?? {});
            this.wizardLevelUpLearnedSpellsByClass.set(persisted.wizardLevelUpLearnedSpellsByClass ?? {});
            this.wizardSpellSubTabByClass.set(persisted.wizardSpellSubTabByClass ?? {});

            // Re-apply class limits after persisted spell state loads using the current restored class level.
            this.syncPreparedSpellsForClass(this.getPrimaryClassName() || character.className, this.getPrimaryClassLevel());
        } else {
            const inferredBackgroundState = this.inferBackgroundStateFromCharacter(character);
            this.selectedFaith.set((this.extractFaithFromNotes(notes) || this.selectedFaith()).trim());
            this.classFeatureSelections.set(this.inferClassFeatureSelectionsFromCharacter(character));
            this.selectedLanguages.set(inferredBackgroundState.selectedLanguages);
            this.selectedSpeciesLanguages.set(inferredBackgroundState.selectedSpeciesLanguages);
            this.selectedSpeciesTraitChoices.set(matchedPremade?.speciesTraitChoices ?? {});
            this.backgroundChoiceSelections.set(inferredBackgroundState.backgroundChoiceSelections);
            this.bgAbilityMode.set(inferredBackgroundState.bgAbilityMode);
            this.bgAbilityScoreFor2.set(inferredBackgroundState.bgAbilityScoreFor2);
            this.bgAbilityScoreFor1.set(inferredBackgroundState.bgAbilityScoreFor1);
            this.selectedAbilityMethod.set('manual-rolled');
            this.abilityBaseScores.set(this.inferAbilityBaseScoresFromCharacter(character));
            this.personalityTraits.set(character.personalityTraits?.length ? character.personalityTraits : (matchedPremade?.personalityTraits ?? []));
            this.ideals.set(character.ideals?.length ? character.ideals : (matchedPremade?.ideals ?? []));
            this.bonds.set(character.bonds?.length ? character.bonds : (matchedPremade?.bonds ?? []));
            this.flaws.set(character.flaws?.length ? character.flaws : (matchedPremade?.flaws ?? []));
            this.physicalHair.set(parsedPhysical.hair || premadeAppearance?.hair || '');
            this.physicalSkin.set(parsedPhysical.skin || premadeAppearance?.skin || '');
            this.physicalEyes.set(parsedPhysical.eyes || premadeAppearance?.eyes || '');
            this.physicalHeight.set(parsedPhysical.height || premadeAppearance?.height || '');
            this.physicalWeight.set(parsedPhysical.weight || premadeAppearance?.weight || '');
            this.physicalAge.set(parsedPhysical.age || premadeAppearance?.age || '');
            this.physicalGender.set(parsedPhysical.gender || this.physicalGender() || '');
            this.physicalHeightUnit.set(this.resolveHeightUnit(this.physicalHeightUnit(), this.physicalHeight()));
            this.physicalWeightUnit.set(this.resolveWeightUnit(this.physicalWeightUnit(), this.physicalWeight()));
            this.noteOrganizations.set(parsedOrganizations);
            this.noteAllies.set(parsedAllies);
            this.noteEnemies.set(parsedEnemies);
            this.otherNotes.set(parsedOtherNotes);
        }

        this.applyPremadeFallbackValues(character, matchedPremade, premadeAppearance);
    }

    private getBuilderSessionStorageKey(): string {
        const characterId = this.activeBuilderCharacterId().trim();
        return `${this.builderSessionStoragePrefix}${characterId || 'new'}`;
    }

    private readBuilderSessionSnapshot(): BuilderSessionSnapshot | null {
        const storage = this.document.defaultView?.sessionStorage;
        if (!storage) {
            return null;
        }

        const raw = storage.getItem(this.getBuilderSessionStorageKey());
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<BuilderSessionSnapshot>;
            return {
                completionCharacterName: typeof parsed.completionCharacterName === 'string' ? parsed.completionCharacterName : '',
                selectedSpeciesName: typeof parsed.selectedSpeciesName === 'string' ? parsed.selectedSpeciesName : '',
                selectedCampaignIdsOnCreate: Array.isArray(parsed.selectedCampaignIdsOnCreate) ? parsed.selectedCampaignIdsOnCreate.filter((value): value is string => typeof value === 'string') : [],
                generatedBackstory: typeof parsed.generatedBackstory === 'string' ? parsed.generatedBackstory : '',
                completionPortraitImageUrl: typeof parsed.completionPortraitImageUrl === 'string' ? parsed.completionPortraitImageUrl : '',
                completionPortraitOriginalImageUrl: typeof parsed.completionPortraitOriginalImageUrl === 'string' ? parsed.completionPortraitOriginalImageUrl : '',
                notes: typeof parsed.notes === 'string' ? parsed.notes : ''
            };
        } catch {
            return null;
        }
    }

    private saveBuilderSessionSnapshot(): void {
        const storage = this.document.defaultView?.sessionStorage;
        if (!storage) {
            return;
        }

        const activeCharacterId = this.activeBuilderCharacterId().trim();
        if (activeCharacterId && this.hydratedCharacterId() !== activeCharacterId) {
            return;
        }

        const hasMeaningfulState = this.completionCharacterName().trim().length > 0
            || this.selectedSpeciesName().trim().length > 0
            || this.selectedBackgroundName().trim().length > 0
            || Object.keys(this.multiclassList()).length > 0;

        if (!hasMeaningfulState) {
            return;
        }

        const snapshot: BuilderSessionSnapshot = {
            completionCharacterName: this.completionCharacterName(),
            selectedSpeciesName: this.selectedSpeciesName(),
            selectedCampaignIdsOnCreate: this.selectedCampaignIdsOnCreate(),
            generatedBackstory: this.generatedBackstory(),
            completionPortraitImageUrl: this.completionPortraitImageUrl(),
            completionPortraitOriginalImageUrl: this.completionPortraitOriginalImageUrl(),
            notes: this.buildPersistedNotes()
        };

        storage.setItem(this.getBuilderSessionStorageKey(), JSON.stringify(snapshot));
    }

    private clearBuilderSessionSnapshot(characterId?: string): void {
        const storage = this.document.defaultView?.sessionStorage;
        if (!storage) {
            return;
        }

        const resolvedCharacterId = (characterId ?? this.activeBuilderCharacterId()).trim();
        storage.removeItem(`${this.builderSessionStoragePrefix}${resolvedCharacterId || 'new'}`);
    }

    private buildPersistedNotes(): string {
        const faith = this.selectedFaith().trim();
        const otherNotes = this.otherNotes().trim().replace(/\s*\n+\s*/g, ' ');
        const structuredNoteLines = [
            this.noteOrganizations().length > 0 ? `Organizations: ${this.noteOrganizations().join(', ')}` : '',
            this.noteAllies().length > 0 ? `Allies: ${this.noteAllies().join(', ')}` : '',
            this.noteEnemies().length > 0 ? `Enemies: ${this.noteEnemies().join(', ')}` : '',
            otherNotes ? `Other: ${otherNotes}` : '',
            faith ? `Faith: ${faith}` : ''
        ].filter((part) => part.length > 0);
        const notesParts = [
            this.generatedBackstory().trim(),
            structuredNoteLines.join('\n'),
            this.backstoryPromptDetails().trim()
        ];

        const visibleNotes = notesParts.filter((part) => part.length > 0).join('\n\n') || 'No field notes yet.';
        const state: PersistedBuilderState = {
            selectedClass: this.getPrimaryClassName(),
            characterLevel: this.getPrimaryClassLevel(),
            multiclassList: this.multiclassList(),
            selectedBackgroundName: this.selectedBackgroundName(),
            selectedBackgroundUrl: this.selectedBackgroundUrl(),
            selectedAlignment: this.selectedAlignment(),
            selectedFaith: this.selectedFaith(),
            selectedLifestyle: this.selectedLifestyle(),
            selectedLanguages: this.selectedLanguages(),
            selectedSpeciesLanguages: this.selectedSpeciesLanguages(),
            selectedSpeciesTraitChoices: this.selectedSpeciesTraitChoices(),
            classFeatureSelections: this.classFeatureSelections(),
            abilityScoreImprovementChoices: this.abilityScoreImprovementChoices(),
            featFollowUpChoices: this.featFollowUpChoices(),
            backgroundChoiceSelections: this.backgroundChoiceSelections(),
            selectedAbilityMethod: this.selectedAbilityMethod(),
            abilityBaseScores: this.abilityBaseScores(),
            abilityOtherModifiers: this.abilityOtherModifiers(),
            abilityOverrideScores: this.abilityOverrideScores(),
            standardArraySelections: this.standardArraySelections(),
            rolledValues: this.rolledValues(),
            rolledAssignments: this.rolledAssignments(),
            manualRollGroupCount: this.manualRollGroupCount(),
            bgAbilityMode: this.bgAbilityMode(),
            bgAbilityScoreFor2: this.bgAbilityScoreFor2(),
            bgAbilityScoreFor1: this.bgAbilityScoreFor1(),
            hitPointMode: this.hitPointMode(),
            rolledHitPointTotal: this.rolledHitPointTotal(),
            selectedClassStartingOption: this.selectedClassStartingOption(),
            selectedBackgroundStartingOption: this.selectedBackgroundStartingOption(),
            inventoryEntries: this.inventoryEntries(),
            currency: this.currency(),
            personalityTraits: this.personalityTraits(),
            ideals: this.ideals(),
            bonds: this.bonds(),
            flaws: this.flaws(),
            physicalHair: this.physicalHair(),
            physicalSkin: this.physicalSkin(),
            physicalEyes: this.physicalEyes(),
            physicalHeight: this.physicalHeight(),
            physicalHeightUnit: this.physicalHeightUnit(),
            physicalWeight: this.physicalWeight(),
            physicalWeightUnit: this.physicalWeightUnit(),
            physicalAge: this.physicalAge(),
            physicalGender: this.physicalGender(),
            noteOrganizations: this.noteOrganizations(),
            noteAllies: this.noteAllies(),
            noteEnemies: this.noteEnemies(),
            otherNotes: this.otherNotes(),
            classPreparedSpells: this.classPreparedSpells(),
            classKnownSpellsByClass: this.classKnownSpellsByClass(),
            wizardSpellbookByClass: this.wizardSpellbookByClass(),
            wizardLevelUpLearnedSpellsByClass: this.wizardLevelUpLearnedSpellsByClass(),
            wizardSpellSubTabByClass: this.wizardSpellSubTabByClass()
        };

        const serialized = JSON.stringify(state);
        return `${visibleNotes}\n\n${this.builderStateStartTag}\n${serialized}\n${this.builderStateEndTag}`;
    }

    private parsePersistedNotes(notes: string): { cleanedNotes: string; state: PersistedBuilderState | null } {
        const raw = notes?.trim() ?? '';
        if (!raw) {
            return { cleanedNotes: '', state: null };
        }

        const start = raw.indexOf(this.builderStateStartTag);
        const end = raw.indexOf(this.builderStateEndTag);

        if (start === -1 || end === -1 || end < start) {
            return { cleanedNotes: raw, state: null };
        }

        const jsonStart = start + this.builderStateStartTag.length;
        const jsonText = raw.slice(jsonStart, end).trim();
        const before = raw.slice(0, start).trimEnd();
        const after = raw.slice(end + this.builderStateEndTag.length).trimStart();
        const cleanedNotes = [before, after].filter((part) => part.length > 0).join('\n\n').trim();

        try {
            const parsed = JSON.parse(jsonText) as PersistedBuilderState;
            return { cleanedNotes, state: parsed };
        } catch {
            return { cleanedNotes: raw, state: null };
        }
    }

    private mergePersistedBuilderStates(base: PersistedBuilderState | null, override: PersistedBuilderState | null): PersistedBuilderState | null {
        if (!base && !override) {
            return null;
        }

        const baseState = base ?? {} as PersistedBuilderState;
        const overrideState = override ?? {} as PersistedBuilderState;

        return {
            ...baseState,
            ...overrideState,
            multiclassList: { ...(baseState.multiclassList ?? {}), ...(overrideState.multiclassList ?? {}) },
            selectedSpeciesTraitChoices: { ...(baseState.selectedSpeciesTraitChoices ?? {}), ...(overrideState.selectedSpeciesTraitChoices ?? {}) },
            classFeatureSelections: { ...(baseState.classFeatureSelections ?? {}), ...(overrideState.classFeatureSelections ?? {}) },
            abilityScoreImprovementChoices: { ...(baseState.abilityScoreImprovementChoices ?? {}), ...(overrideState.abilityScoreImprovementChoices ?? {}) },
            featFollowUpChoices: { ...(baseState.featFollowUpChoices ?? {}), ...(overrideState.featFollowUpChoices ?? {}) },
            backgroundChoiceSelections: { ...(baseState.backgroundChoiceSelections ?? {}), ...(overrideState.backgroundChoiceSelections ?? {}) },
            classPreparedSpells: { ...(baseState.classPreparedSpells ?? {}), ...(overrideState.classPreparedSpells ?? {}) },
            classKnownSpellsByClass: { ...(baseState.classKnownSpellsByClass ?? {}), ...(overrideState.classKnownSpellsByClass ?? {}) },
            wizardSpellbookByClass: { ...(baseState.wizardSpellbookByClass ?? {}), ...(overrideState.wizardSpellbookByClass ?? {}) },
            wizardLevelUpLearnedSpellsByClass: { ...(baseState.wizardLevelUpLearnedSpellsByClass ?? {}), ...(overrideState.wizardLevelUpLearnedSpellsByClass ?? {}) },
            wizardSpellSubTabByClass: { ...(baseState.wizardSpellSubTabByClass ?? {}), ...(overrideState.wizardSpellSubTabByClass ?? {}) }
        };
    }

    private normalizePersistedFeatureSelections(classLevels: Record<string, number>, selections: Record<string, string[]>): Record<string, string[]> {
        const normalizedSelections: Record<string, string[]> = {};

        for (const [className, rawLevel] of Object.entries(classLevels)) {
            const classLevel = Math.min(20, Math.max(1, Math.trunc(Number(rawLevel) || 1)));
            const classProgression = classLevelOneFeatures[className] ?? [];
            const legacyPools = new Map<string, string[]>(
                classProgression
                    .flatMap((levelEntry) => levelEntry.features)
                    .filter((feature) => !!feature.choices)
                    .map((feature) => {
                        const legacySelections = Array.isArray(selections[feature.name]) ? selections[feature.name] : [];
                        return [feature.name, legacySelections
                            .map((value) => value?.trim())
                            .filter((value): value is string => !!value)] as const;
                    })
            );

            for (const levelEntry of classProgression) {
                if (levelEntry.level > classLevel) {
                    continue;
                }

                for (const feature of levelEntry.features) {
                    if (!feature.choices) {
                        continue;
                    }

                    const key = this.getFeatureSelectionKey(className, feature);
                    const keyedSelections = Array.isArray(selections[key]) ? selections[key] : [];
                    const sourceSelections = keyedSelections.length > 0
                        ? keyedSelections
                        : (legacyPools.get(feature.name) ?? []).slice(0, feature.choices.count);

                    const normalizedValues = this.normalizePersistedFeatureChoiceValues(feature, sourceSelections)
                        .slice(0, feature.choices.count);

                    if (normalizedValues.length > 0) {
                        normalizedSelections[key] = normalizedValues;

                        if (keyedSelections.length === 0) {
                            const remainingLegacyValues = legacyPools.get(feature.name) ?? [];
                            legacyPools.set(feature.name, remainingLegacyValues.slice(normalizedValues.length));
                        }
                    }
                }
            }
        }

        return normalizedSelections;
    }

    private normalizePersistedFeatureChoiceValues(feature: ClassFeature, values: readonly string[]): string[] {
        const options = feature.choices?.options ?? [];
        const normalizedOptions = new Map(options.map((option) => [option.trim().toLowerCase(), option] as const));
        const normalizedWeaponMasteryOptions = this.isWeaponMasteryFeature(feature)
            ? new Map(options.map((option) => [this.normalizeWeaponMasteryChoice(option), option] as const))
            : null;

        return values
            .map((value) => value?.trim())
            .filter((value): value is string => !!value)
            .map((value) => {
                const exactMatch = normalizedOptions.get(value.toLowerCase());
                if (exactMatch) {
                    return exactMatch;
                }

                if (normalizedWeaponMasteryOptions) {
                    return normalizedWeaponMasteryOptions.get(this.normalizeWeaponMasteryChoice(value)) ?? value;
                }

                return options.find((option) => option.localeCompare(value, undefined, { sensitivity: 'accent' }) === 0) ?? value;
            })
            .filter((value, index, array) => array.indexOf(value) === index);
    }

    private normalizeWeaponMasteryChoice(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/\s*\([^)]+\)\s*$/, '');
    }

    private resolveNavigationEditLevel(): number | null {
        const state = window.history.state as { editLevel?: unknown } | null;
        const raw = state?.editLevel;
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
            return null;
        }

        return Math.min(20, Math.max(1, Math.trunc(raw)));
    }

    private setNoteEntries(section: CharacterNoteListKey, values: string[]): void {
        const nextValues = this.uniqueNoteEntries(values);

        switch (section) {
            case 'organizations':
                this.noteOrganizations.set(nextValues);
                break;
            case 'allies':
                this.noteAllies.set(nextValues);
                break;
            case 'enemies':
                this.noteEnemies.set(nextValues);
                break;
        }
    }

    private inferClassFeatureSelectionsFromCharacter(character: Character): Record<string, string[]> {
        const inferredSelections: Record<string, string[]> = {};
        const classProgression = classLevelOneFeatures[character.className] ?? [];
        const selectedSkills = this.getCharacterSkillLabels(character);
        const featureHints = [
            ...(character.classFeatures ?? []),
            ...(character.traits ?? []),
            ...(character.speciesTraits ?? []),
            ...(character.spells ?? [])
        ].map((value) => value.trim()).filter((value) => value.length > 0);

        for (const levelEntry of classProgression) {
            if (levelEntry.level > Math.max(1, character.level || 1)) {
                continue;
            }

            for (const feature of levelEntry.features) {
                if (!feature.choices) {
                    continue;
                }

                const key = this.getFeatureSelectionKey(character.className, feature);
                const options = feature.choices.options ?? [];

                const skillMatches = options.filter((option) => selectedSkills.includes(option)).slice(0, feature.choices!.count);
                if (skillMatches.length > 0) {
                    inferredSelections[key] = skillMatches;
                    continue;
                }

                const hintMatches = options.filter((option) => this.matchesFeatureHint(option, featureHints)).slice(0, feature.choices!.count);
                if (hintMatches.length > 0) {
                    inferredSelections[key] = hintMatches;
                }
            }
        }

        return inferredSelections;
    }

    private inferBackgroundStateFromCharacter(character: Character): {
        selectedLanguages: string[];
        selectedSpeciesLanguages: string[];
        backgroundChoiceSelections: Record<string, string>;
        bgAbilityMode: string;
        bgAbilityScoreFor2: string;
        bgAbilityScoreFor1: string;
    } {
        const selectedBackground = this.selectedBackground();
        const detail = this.selectedBackgroundDetail();
        const knownSpeciesLanguages = new Set(this.speciesKnownLanguages());
        const extraLanguages = this.uniqueNoteEntries(character.languages ?? [])
            .filter((language) => !knownSpeciesLanguages.has(language));
        const languageChoiceCount = this.backgroundLanguageChoiceCount();
        const selectedLanguages = languageChoiceCount > 0
            ? extraLanguages.slice(Math.max(0, extraLanguages.length - languageChoiceCount))
            : [];
        const selectedSpeciesLanguages = extraLanguages.filter((language) => !selectedLanguages.includes(language));

        const scoredAbilities = this.currentBgAbilityScores()
            .map((ability) => ({ ability, score: this.getCharacterAbilityScore(character, ability) }))
            .sort((left, right) => right.score - left.score);

        let bgAbilityMode = '';
        let bgAbilityScoreFor2 = '';
        let bgAbilityScoreFor1 = '';

        if (scoredAbilities.length >= 3 && scoredAbilities[0].score - scoredAbilities[2].score <= 1) {
            bgAbilityMode = 'Increase three scores (+1 / +1 / +1)';
        } else if (scoredAbilities.length >= 2) {
            bgAbilityMode = 'Increase two scores (+2 / +1)';
            bgAbilityScoreFor2 = scoredAbilities[0]?.ability ?? '';
            bgAbilityScoreFor1 = scoredAbilities.find((entry) => entry.ability !== bgAbilityScoreFor2)?.ability ?? '';
        } else if (scoredAbilities.length > 0) {
            bgAbilityMode = 'Increase three scores (+1 / +1 / +1)';
        }

        const backgroundChoiceSelections: Record<string, string> = {};
        if (selectedBackground && detail) {
            for (const choice of detail.choices) {
                if (choice.key === 'ability-scores') {
                    continue;
                }

                const compositeKey = `${selectedBackground.name}:${choice.key}`;
                let selectedValue = '';

                if (this.isLanguageChoiceKey(choice.key)) {
                    selectedValue = selectedLanguages[0] ?? '';
                } else if (choice.key === 'characteristics-focus') {
                    selectedValue = choice.options.find((option) => option.toLowerCase().includes('roleplay')) ?? choice.options[0] ?? '';
                } else {
                    selectedValue = choice.options[0] ?? '';
                }

                if (selectedValue) {
                    backgroundChoiceSelections[compositeKey] = selectedValue;
                }
            }
        }

        return {
            selectedLanguages,
            selectedSpeciesLanguages,
            backgroundChoiceSelections,
            bgAbilityMode,
            bgAbilityScoreFor2,
            bgAbilityScoreFor1
        };
    }

    private findMatchingPremadeCharacter(character: Character | null): PremadeCharacter | null {
        if (!character) {
            return null;
        }

        const key = this.buildPremadeLookupKey(character);
        const normalizedImage = this.normalizePremadeMatchValue(character.image);

        const exactMatch = premadeCharacters.find((entry) => this.buildPremadeLookupKey(entry) === key);
        if (exactMatch) {
            return exactMatch;
        }

        if (normalizedImage) {
            const imageMatch = premadeCharacters.find((entry) => this.normalizePremadeMatchValue(entry.image) === normalizedImage);
            if (imageMatch) {
                return imageMatch;
            }
        }

        const raceClassBackgroundMatch = premadeCharacters.find((entry) =>
            this.normalizePremadeMatchValue(entry.race) === this.normalizePremadeMatchValue(character.race)
            && this.normalizePremadeMatchValue(entry.className) === this.normalizePremadeMatchValue(character.className)
            && this.normalizePremadeMatchValue(entry.background) === this.normalizePremadeMatchValue(character.background)
        );
        if (raceClassBackgroundMatch) {
            return raceClassBackgroundMatch;
        }

        return premadeCharacters.find((entry) =>
            this.normalizePremadeMatchValue(entry.race) === this.normalizePremadeMatchValue(character.race)
            && this.normalizePremadeMatchValue(entry.className) === this.normalizePremadeMatchValue(character.className)
        ) ?? null;
    }

    private resolvePremadeAppearance(character: Pick<Character, 'race'>, matchedPremade: PremadeCharacter | null): PremadeCharacter['appearance'] | undefined {
        const normalizedRace = this.normalizePremadeMatchValue(character.race);
        const raceAppearance = premadeCharacters.find((entry) => this.normalizePremadeMatchValue(entry.race) === normalizedRace)?.appearance;

        if (!matchedPremade?.appearance) {
            return raceAppearance;
        }

        return {
            age: matchedPremade.appearance.age || raceAppearance?.age || '',
            height: matchedPremade.appearance.height || raceAppearance?.height || '',
            weight: matchedPremade.appearance.weight || raceAppearance?.weight || '',
            hair: matchedPremade.appearance.hair || raceAppearance?.hair || '',
            eyes: matchedPremade.appearance.eyes || raceAppearance?.eyes || '',
            skin: matchedPremade.appearance.skin || raceAppearance?.skin || ''
        };
    }

    private normalizePremadeMatchValue(value: string | undefined | null): string {
        return (value ?? '').trim().toLowerCase();
    }

    private applyPremadeFallbackValues(character: Character, matchedPremade: PremadeCharacter | null, premadeAppearance: PremadeCharacter['appearance'] | undefined): void {
        if (!this.selectedAlignment()) {
            this.selectedAlignment.set(this.normalizeAlignmentSelection((character.alignment || matchedPremade?.alignment || '').trim()));
        }

        if (!this.selectedFaith().trim()) {
            this.selectedFaith.set((character.faith || matchedPremade?.faith || '').trim());
        }

        if (!this.selectedLifestyle()) {
            this.selectedLifestyle.set(this.normalizeLifestyleSelection((character.lifestyle || matchedPremade?.lifestyle || '').trim()));
        }

        if (!this.personalityTraits().length && matchedPremade?.personalityTraits?.length) {
            this.personalityTraits.set(matchedPremade.personalityTraits);
        }

        if (!this.ideals().length && matchedPremade?.ideals?.length) {
            this.ideals.set(matchedPremade.ideals);
        }

        if (!this.bonds().length && matchedPremade?.bonds?.length) {
            this.bonds.set(matchedPremade.bonds);
        }

        if (!this.flaws().length && matchedPremade?.flaws?.length) {
            this.flaws.set(matchedPremade.flaws);
        }

        if (!this.physicalHair().trim()) {
            this.physicalHair.set(premadeAppearance?.hair ?? '');
        }

        if (!this.physicalSkin().trim()) {
            this.physicalSkin.set(premadeAppearance?.skin ?? '');
        }

        if (!this.physicalEyes().trim()) {
            this.physicalEyes.set(premadeAppearance?.eyes ?? '');
        }

        if (!this.physicalHeight().trim()) {
            this.physicalHeight.set(premadeAppearance?.height ?? '');
        }

        if (!this.physicalWeight().trim()) {
            this.physicalWeight.set(premadeAppearance?.weight ?? '');
        }

        if (!this.physicalAge().trim()) {
            this.physicalAge.set(premadeAppearance?.age ?? '');
        }

        if (!this.physicalGender().trim()) {
            this.physicalGender.set(character.gender || matchedPremade?.gender || '');
        }

        this.physicalHeightUnit.set(this.resolveHeightUnit(this.physicalHeightUnit(), this.physicalHeight()));
        this.physicalWeightUnit.set(this.resolveWeightUnit(this.physicalWeightUnit(), this.physicalWeight()));
    }

    private buildPremadeLookupKey(character: Pick<Character, 'name' | 'race' | 'className' | 'background'>): string {
        return [character.name, character.race, character.className, character.background]
            .map((value) => value.trim().toLowerCase())
            .join('|');
    }

    private normalizeAlignmentSelection(value: string): string {
        const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
        return this.alignmentOptions.some((option) => option.value === normalized) ? normalized : '';
    }

    private normalizeLifestyleSelection(value: string): string {
        const normalized = value.trim().toLowerCase();
        const aliases: Readonly<Record<string, string>> = {
            wretched: 'wretched',
            squalid: 'squalid',
            poor: 'poor',
            modest: 'modest',
            comfortable: 'comfortable',
            wealthy: 'wealthy',
            aristocratic: 'aristocratic',
            scholar: 'modest',
            wanderer: 'poor'
        };
        const resolved = aliases[normalized] ?? normalized;
        return this.lifestyleOptions.some((option) => option.value === resolved) ? resolved : '';
    }

    private getSelectedAlignmentLabel(): string {
        const selected = this.selectedAlignment();
        return this.alignmentOptions.find((option) => option.value === selected)?.label ?? '';
    }

    private getSelectedLifestyleLabel(): string {
        const selected = this.selectedLifestyle();
        return this.lifestyleOptions.find((option) => option.value === selected)?.label ?? '';
    }

    private getCharacterSkillLabels(character: Character): string[] {
        const skillMap: ReadonlyArray<[keyof Character['skills'], string]> = [
            ['acrobatics', 'Acrobatics'],
            ['animalHandling', 'Animal Handling'],
            ['arcana', 'Arcana'],
            ['athletics', 'Athletics'],
            ['deception', 'Deception'],
            ['history', 'History'],
            ['insight', 'Insight'],
            ['intimidation', 'Intimidation'],
            ['investigation', 'Investigation'],
            ['medicine', 'Medicine'],
            ['nature', 'Nature'],
            ['perception', 'Perception'],
            ['performance', 'Performance'],
            ['persuasion', 'Persuasion'],
            ['religion', 'Religion'],
            ['sleightOfHand', 'Sleight of Hand'],
            ['stealth', 'Stealth'],
            ['survival', 'Survival']
        ];

        return skillMap
            .filter(([key]) => character.skills?.[key])
            .map(([, label]) => label);
    }

    private getCharacterAbilityScore(character: Character, ability: string): number {
        switch (ability) {
            case 'Strength':
                return character.abilityScores.strength;
            case 'Dexterity':
                return character.abilityScores.dexterity;
            case 'Constitution':
                return character.abilityScores.constitution;
            case 'Intelligence':
                return character.abilityScores.intelligence;
            case 'Wisdom':
                return character.abilityScores.wisdom;
            case 'Charisma':
                return character.abilityScores.charisma;
            default:
                return 10;
        }
    }

    private matchesFeatureHint(option: string, hints: string[]): boolean {
        const normalizedOption = option.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (!normalizedOption) {
            return false;
        }

        const optionWords = normalizedOption.split(' ').filter((word) => word.length > 2);

        return hints.some((hint) => {
            const normalizedHint = hint.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            return normalizedHint.includes(normalizedOption)
                || normalizedOption.includes(normalizedHint)
                || optionWords.every((word) => normalizedHint.includes(word));
        });
    }

    private uniqueNoteEntries(values: string[]): string[] {
        const seen = new Set<string>();
        const normalizedValues: string[] = [];

        for (const value of values) {
            const trimmed = value.trim().replace(/\s+/g, ' ');
            const key = trimmed.toLowerCase();
            if (!trimmed || seen.has(key)) {
                continue;
            }

            seen.add(key);
            normalizedValues.push(trimmed);
        }

        return normalizedValues;
    }

    private getNoteSourceCampaigns() {
        const selectedIds = new Set(this.selectedCampaignIdsOnCreate());
        const campaigns = this.store.campaigns();

        if (selectedIds.size === 0) {
            return campaigns;
        }

        return campaigns.filter((campaign) => selectedIds.has(campaign.id));
    }

    private extractNoteListFromText(notes: string, label: 'Organizations' | 'Allies' | 'Enemies'): string[] {
        const match = notes.match(new RegExp(`(?:^|\\n)${label}:\\s*(.+?)(?=\\n|$)`, 'i'));
        return this.uniqueNoteEntries((match?.[1] ?? '').split(/,|;/));
    }

    private extractOtherNotes(notes: string): string {
        const match = notes.match(/(?:^|\n)Other:\s*(.+?)(?=\n|$)/i);
        return match?.[1]?.trim() ?? '';
    }

    private extractFaithFromNotes(notes: string): string {
        const match = notes.match(/(?:^|\n)Faith:\s*(.+?)(?:\n|$)/i);
        return match?.[1]?.trim() ?? '';
    }

    private extractPhysicalCharacteristicsFromText(notes: string): { gender: string; age: string; height: string; weight: string; hair: string; eyes: string; skin: string } {
        const physicalSummary = this.extractSingleNoteValue(notes, 'Physical characteristics');
        const readValue = (label: 'Gender' | 'Age' | 'Height' | 'Weight' | 'Hair' | 'Eyes' | 'Skin') => {
            const summaryMatch = physicalSummary.match(new RegExp(`${label}:\\s*([^;]+)`, 'i'));
            if (summaryMatch?.[1]?.trim()) {
                return summaryMatch[1].trim();
            }

            return this.extractSingleNoteValue(notes, label);
        };

        return {
            gender: readValue('Gender'),
            age: readValue('Age'),
            height: readValue('Height'),
            weight: readValue('Weight'),
            hair: readValue('Hair'),
            eyes: readValue('Eyes'),
            skin: readValue('Skin')
        };
    }

    private extractSingleNoteValue(notes: string, label: string): string {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = notes.match(new RegExp(`(?:^|\\n)${escapedLabel}:\\s*(.+?)(?=\\n|$)`, 'i'));
        return match?.[1]?.trim() ?? '';
    }

    private extractVisibleBackstory(notes: string): string {
        const marker = notes.search(/(?:^|\n)\s*(Organizations:|Allies:|Enemies:|Other:|Faith:|Experience:|Builder class focus:|Species focus:|Background focus:|Alignment direction:|Lifestyle direction:|Emphasize these personality traits:|Include these ideals:|Include these bonds:|Reflect these flaws:|Physical characteristics:|Known organizations:|Known allies:|Known enemies:|Other notes to include:)/i);
        if (marker > 0) {
            return notes.slice(0, marker).trim();
        }

        return notes.trim();
    }

    private buildAutoBackstoryDirection(): string {
        const target = this.backstoryTargetCharacter();
        const lines: string[] = [];
        const fallbackName = this.completionCharacterName().trim();
        const currentClassName = this.getPrimaryClassName() || target?.className?.trim() || '';
        const currentClassLevel = Math.max(1, this.getPrimaryClassLevel() || target?.level || 1);
        const resolvedSpeciesFocus = this.selectedSpeciesName() || target?.race?.trim() || '';
        const resolvedBackgroundFocus = this.selectedBackground()?.name || this.selectedBackgroundName().trim() || target?.background?.trim() || '';
        const characterName = fallbackName || target?.name?.trim() || '';
        const visibleTargetNotes = target?.notes?.trim() ? this.extractVisibleBackstory(target.notes) : '';
        const faith = this.selectedFaith().trim() || target?.faith?.trim() || '';

        if (characterName) {
            lines.push(`Character name: ${characterName}`);
        }

        if (currentClassName) {
            lines.push(`Current class and level: ${currentClassName} ${currentClassLevel}`);
        }

        if (resolvedBackgroundFocus) {
            lines.push(`Known background: ${resolvedBackgroundFocus}`);
        }

        if (visibleTargetNotes) {
            lines.push(`Existing notes to honor: ${visibleTargetNotes}`);
        }

        lines.push(`Builder class focus: ${currentClassName || this.getCurrentClassSummary()}`);

        if (resolvedSpeciesFocus) {
            lines.push(`Species focus: ${resolvedSpeciesFocus}`);
        }

        if (resolvedBackgroundFocus) {
            lines.push(`Background focus: ${resolvedBackgroundFocus}`);
        }

        if (this.selectedAlignment()) {
            lines.push(`Alignment direction: ${this.selectedAlignment()}`);
        }

        if (this.selectedLifestyle()) {
            lines.push(`Lifestyle direction: ${this.selectedLifestyle()}`);
        }

        if (faith) {
            lines.push(`Faith: ${faith}`);
        }

        const physicalDetails = [
            ['Gender', this.physicalGender().trim()],
            ['Age', this.physicalAge().trim()],
            ['Height', this.formatPhysicalMeasurement(this.physicalHeight().trim(), this.physicalHeightUnit())],
            ['Weight', this.formatPhysicalMeasurement(this.physicalWeight().trim(), this.physicalWeightUnit())],
            ['Hair', this.physicalHair().trim()],
            ['Eyes', this.physicalEyes().trim()],
            ['Skin', this.physicalSkin().trim()]
        ].filter(([, value]) => value.length > 0);

        if (physicalDetails.length > 0) {
            lines.push(`Physical characteristics: ${physicalDetails.map(([label, value]) => `${label}: ${value}`).join('; ')}`);
        }

        const traits = this.personalityTraits().slice(0, 3);
        if (traits.length > 0) {
            lines.push(`Emphasize these personality traits: ${traits.join('; ')}`);
        }

        const ideals = this.ideals().slice(0, 2);
        if (ideals.length > 0) {
            lines.push(`Include these ideals: ${ideals.join('; ')}`);
        }

        const bonds = this.bonds().slice(0, 2);
        if (bonds.length > 0) {
            lines.push(`Include these bonds: ${bonds.join('; ')}`);
        }

        const flaws = this.flaws().slice(0, 2);
        if (flaws.length > 0) {
            lines.push(`Reflect these flaws: ${flaws.join('; ')}`);
        }

        if (this.noteOrganizations().length > 0) {
            lines.push(`Known organizations: ${this.noteOrganizations().join('; ')}`);
        }

        if (this.noteAllies().length > 0) {
            lines.push(`Known allies: ${this.noteAllies().join('; ')}`);
        }

        if (this.noteEnemies().length > 0) {
            lines.push(`Known enemies: ${this.noteEnemies().join('; ')}`);
        }

        if (this.otherNotes().trim()) {
            lines.push(`Other notes to include: ${this.otherNotes().trim()}`);
        }

        lines.push('Keep details grounded in campaign play and avoid contradicting known notes.');

        return lines.join('\n');
    }

    private getMaxSpellLevelForClass(className: string, classLevel: number): number {
        const normalizedLevel = Math.min(20, Math.max(1, Math.trunc(classLevel)));
        const progression = this.spellcastingProgressionByClass[className] ?? 'none';

        if (progression === 'none') {
            return 0;
        }

        if (progression === 'full') {
            return Math.min(9, Math.max(1, Math.ceil(normalizedLevel / 2)));
        }

        if (progression === 'pact') {
            if (normalizedLevel >= 9) return 5;
            if (normalizedLevel >= 7) return 4;
            if (normalizedLevel >= 5) return 3;
            if (normalizedLevel >= 3) return 2;
            return 1;
        }

        if (progression === 'half') {
            if (normalizedLevel >= 17) return 5;
            if (normalizedLevel >= 13) return 4;
            if (normalizedLevel >= 9) return 3;
            if (normalizedLevel >= 5) return 2;
            return 1;
        }

        if (normalizedLevel < 2) {
            return 0;
        }
        if (normalizedLevel >= 17) return 5;
        if (normalizedLevel >= 13) return 4;
        if (normalizedLevel >= 9) return 3;
        if (normalizedLevel >= 5) return 2;
        return 1;
    }

    private getClassSpellcastingAbility(className: string): 'Intelligence' | 'Wisdom' | 'Charisma' | null {
        switch (className) {
            case 'Artificer':
            case 'Wizard':
                return 'Intelligence';
            case 'Cleric':
            case 'Druid':
            case 'Ranger':
                return 'Wisdom';
            case 'Bard':
            case 'Paladin':
            case 'Sorcerer':
            case 'Warlock':
                return 'Charisma';
            default:
                return null;
        }
    }

    private getSpellcastingAbilityModifierForClass(className: string): number {
        const ability = this.getClassSpellcastingAbility(className);
        if (!ability) {
            return 0;
        }

        const score = this.getTotalScore(ability);
        return Math.floor((score - 10) / 2);
    }

    private isRitualSpell(spellName: string): boolean {
        return Boolean(spellDetailsMap[spellName]?.ritual);
    }

    private limitPreparedLeveledSpellsForDisplay(spells: ClassSpellOption[], preparedLimit: number): ClassSpellOption[] {
        const kept: ClassSpellOption[] = [];
        let countedPrepared = 0;

        for (const spell of spells) {
            if (countedPrepared >= preparedLimit) {
                continue;
            }

            countedPrepared += 1;
            kept.push(spell);
        }

        return kept;
    }

    private getPreparedSpellCountForLimit(className: string, classLevel: number): number {
        return this.getPreparedLeveledSpellNames(className, classLevel).length;
    }

    private getPreparedLeveledSpellNames(className: string, classLevel: number): string[] {
        const knownByName = new Map(this.getKnownClassSpells(className, classLevel).map((spell) => [spell.name, spell]));
        return normalizePreparedLeveledSpellNames(this.classPreparedSpells()[className], {
            getSpellLevel: (spellName) => knownByName.get(spellName)?.level ?? 0,
            includeSpell: (spellName) => knownByName.has(spellName)
        });
    }

    private getTableValueForClassLevel(className: string, classLevel: number, tableValuesByLevel: ReadonlyArray<number>): number {
        const progression = this.spellcastingProgressionByClass[className] ?? 'none';
        if (progression === 'none') {
            return 0;
        }

        const index = Math.min(20, Math.max(1, Math.trunc(classLevel))) - 1;
        return tableValuesByLevel[index] ?? 0;
    }

    private syncPreparedSpellsForClass(className: string, classLevel: number): void {
        this.classPreparedSpells.update((current) => {
            const prepared = current[className] ?? [];
            if (!prepared.length) {
                return current;
            }

            const known = className === 'Wizard'
                ? new Set(this.getSpellbookSpells(className, classLevel).map((spell) => spell.name))
                : new Set(this.getKnownClassSpells(className, classLevel).map((spell) => spell.name));
            const preparedLimit = this.getPreparedSpellLimitForClass(className, classLevel);

            let nextPrepared: string[];
            if (className === 'Wizard') {
                const spellbookByName = new Map(this.getSpellbookSpells(className, classLevel).map((spell) => [spell.name, spell]));
                const filteredPrepared = prepared.filter((spellName) => known.has(spellName));
                const leveledPrepared = filteredPrepared
                    .filter((spellName) => (spellbookByName.get(spellName)?.level ?? 0) > 0);
                const leveledSlots: string[] = [];
                let countedPrepared = 0;
                for (const spellName of leveledPrepared) {
                    if (countedPrepared >= preparedLimit) {
                        continue;
                    }

                    countedPrepared += 1;
                    leveledSlots.push(spellName);
                }
                nextPrepared = leveledSlots;
            } else {
                const filteredPrepared = prepared.filter((spellName) => known.has(spellName));
                const leveledSlots: string[] = [];
                let countedPrepared = 0;
                for (const spellName of filteredPrepared) {
                    if (countedPrepared >= preparedLimit) {
                        continue;
                    }

                    countedPrepared += 1;
                    leveledSlots.push(spellName);
                }

                nextPrepared = leveledSlots;
            }

            if (nextPrepared.length === prepared.length) {
                return current;
            }

            if (!nextPrepared.length) {
                const { [className]: _, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [className]: nextPrepared
            };
        });
    }

    getPointBuyDropdownOptions(ability: string): DropdownOption[] {
        return this.pointBuyValues.map((value) => ({
            value: String(value),
            label: this.getPointBuyOptionLabel(value),
            disabled: this.isPointBuyOptionDisabled(ability, value)
        }));
    }

    choiceOptionsToDropdown(options: string[]): DropdownOption[] {
        return options.map((option) => ({ value: option, label: option }));
    }

    singleSelectValue(value: string): string[] {
        return value ? [value] : [];
    }

    singleSelectGroupsFromStrings(options: readonly string[]): MultiSelectOptionGroup[] {
        return [{ label: '', options: [...options] }];
    }

    singleSelectGroupsFromDropdownOptions(options: ReadonlyArray<DropdownOption>): MultiSelectOptionGroup[] {
        return [{
            label: '',
            options: options
                .filter((option) => !option.disabled)
                .map((option) => String(option.value))
        }];
    }

    // Dropdown event handlers - accept string | number from dropdown and convert to correct types
    onClassLevelChanged(className: string, value: string | number): void {
        this.updateClassLevel(className, Number(value));
    }

    onBackgroundSelectedFromDropdown(value: string | number): void {
        this.onBackgroundSelected(String(value));
    }

    onBackgroundChoiceSelectedFromDropdown(key: string, value: string | number): void {
        this.onBackgroundChoiceSelected(key, String(value));
    }

    onBackgroundChoiceSelectedFromMultiSelect(key: string, value: string[]): void {
        this.onBackgroundChoiceSelected(key, value[0] ?? '');
    }

    onAbilityMethodSelectedFromDropdown(value: string | number): void {
        this.onAbilityMethodSelected(String(value) as AbilityGenerationMethod);
    }

    onStandardArraySelectedFromDropdown(ability: string, value: string | number): void {
        this.onStandardArraySelected(ability, String(value));
    }

    onPointBuySelectedFromDropdown(ability: string, value: string | number): void {
        this.onPointBuySelected(ability, String(value));
    }

    onClassSearchChanged(value: string): void {
        this.classSearchTerm.set(value);
    }

    onSpeciesSearchChanged(value: string): void {
        this.speciesSearchTerm.set(value);
    }

    onBackgroundLanguagesChanged(values: string[]): void {
        const blockedBySpecies = new Set([...this.speciesKnownLanguages(), ...this.selectedSpeciesLanguages()]);
        const maxCount = this.backgroundLanguageChoiceCount() || 1;
        const nextValues = this.uniqueNoteEntries(values)
            .filter((value) => !blockedBySpecies.has(value))
            .slice(0, maxCount);

        this.selectedLanguages.set(nextValues);
        this.syncBackgroundLanguageChoiceSelections(nextValues);
    }

    onSpeciesLanguagesChanged(values: string[]): void {
        const blockedByBackground = new Set([...this.speciesKnownLanguages(), ...this.selectedLanguages()]);
        const maxCount = this.speciesLanguageChoiceCount() || 0;
        const nextValues = this.uniqueNoteEntries(values)
            .filter((value) => !blockedByBackground.has(value));

        this.selectedSpeciesLanguages.set(maxCount > 0 ? nextValues.slice(0, maxCount) : []);
    }

    onClassSortModeChanged(value: string | number): void {
        const next = String(value) as ClassSortMode;
        if (Object.prototype.hasOwnProperty.call(this.classCategorySets, next)) {
            this.selectedClassSortMode.set(next);
        }
    }

    onSpeciesSortModeChanged(value: string | number): void {
        const next = String(value) as SpeciesSortMode;
        if (Object.prototype.hasOwnProperty.call(this.speciesCategorySets, next)) {
            this.selectedSpeciesSortMode.set(next);
        }
    }

    onMagicInitiateAbilityChanged(value: string | number): void {
        this.magicInitiateAbility.set(String(value));
        this.magicInitiateCantrip1.set('');
        this.magicInitiateCantrip2.set('');
        this.magicInitiateSpell1.set('');
    }

    onMagicInitiateAbilitySelectionChanged(value: string[]): void {
        this.onMagicInitiateAbilityChanged(value[0] ?? '');
    }

    onMagicInitiateCantrip1Changed(value: string | number): void {
        this.magicInitiateCantrip1.set(String(value));
    }

    onMagicInitiateCantrip2Changed(value: string | number): void {
        this.magicInitiateCantrip2.set(String(value));
    }

    onMagicInitiateSpell1Changed(value: string | number): void {
        this.magicInitiateSpell1.set(String(value));
    }

    onBgAbilityModeChanged(value: string | number): void {
        this.bgAbilityMode.set(String(value));
        this.bgAbilityScoreFor2.set('');
        this.bgAbilityScoreFor1.set('');
    }

    onBgAbilityModeSelectionChanged(value: string[]): void {
        this.onBgAbilityModeChanged(value[0] ?? '');
    }

    onBgAbilityScore2Changed(value: string | number): void {
        const next = this.normalizeAbilityName(String(value));
        if (next && !this.canApplyBackgroundAbilityIncrease(next, 2)) {
            return;
        }

        this.bgAbilityScoreFor2.set(next);
        if (this.bgAbilityScoreFor1() === next) {
            this.bgAbilityScoreFor1.set('');
        }
    }

    onBgAbilityScore2SelectionChanged(value: string[]): void {
        this.onBgAbilityScore2Changed(value[0] ?? '');
    }

    onBgAbilityScore1Changed(value: string | number): void {
        const next = this.normalizeAbilityName(String(value));
        if (next && (!this.canApplyBackgroundAbilityIncrease(next, 1) || next === this.bgAbilityScoreFor2())) {
            return;
        }

        this.bgAbilityScoreFor1.set(next);
    }

    onBgAbilityScore1SelectionChanged(value: string[]): void {
        this.onBgAbilityScore1Changed(value[0] ?? '');
    }

    private getBackgroundGroup(name: string): string {
        if (this.coreBackgrounds.has(name)) {
            return 'Core Backgrounds';
        }

        if (this.coreVariantBackgrounds.has(name)) {
            return 'Core Variants';
        }

        if (this.forgottenRealmsBackgrounds.has(name)) {
            return 'Forgotten Realms';
        }

        if (this.settingBackgrounds.has(name)) {
            return 'Setting Books';
        }

        if (this.adventureBackgrounds.has(name)) {
            return 'Adventures & Expansions';
        }

        return 'Other';
    }

    isLanguageChoiceKey(choiceKey: string): boolean {
        return choiceKey.toLowerCase().includes('language');
    }

    private getLanguageDisabledOptions(currentSelections: string[]): string[] {
        const currentSet = new Set(currentSelections);
        return this.uniqueNoteEntries([
            ...this.speciesKnownLanguages(),
            ...this.selectedLanguages(),
            ...this.selectedSpeciesLanguages()
        ]).filter((language) => !currentSet.has(language));
    }

    getBackgroundChoiceDisabledOptions(choiceKey: string): string[] {
        if (!this.isLanguageChoiceKey(choiceKey)) {
            return [];
        }

        const current = this.getBackgroundChoiceSelection(choiceKey);
        return this.getLanguageDisabledOptions(current ? [current] : []);
    }

    onCompletionCampaignSelectionChanged(campaignIds: string[]): void {
        this.hasTouchedCompletionCampaignSelection.set(true);
        this.selectedCampaignIdsOnCreate.set(campaignIds);
    }

    onFaithChanged(value: string, input: HTMLInputElement): void {
        this.faithInputElement = input;
        this.selectedFaith.set(value);
        const nextOpen = value.trim().length > 0;
        if (nextOpen) {
            this.requestCloseChat();
        }

        this.faithDropdownOpen.set(nextOpen);
        this.updateFaithSuggestionOverlayPosition();
        this.scheduleFaithSuggestionOverlayPositionUpdate();
    }

    selectDeity(name: string): void {
        this.selectedFaith.set(name);
        this.faithDropdownOpen.set(false);
        this.faithOpensUpward.set(false);
        this.faithSuggestionsStyle.set({});
    }

    onFaithBlur(): void {
        // Delay so mousedown on a suggestion fires before blur closes the list
        setTimeout(() => {
            this.faithDropdownOpen.set(false);
            this.faithOpensUpward.set(false);
            this.faithSuggestionsStyle.set({});
        }, 150);
    }

    openDeityPicker(): void {
        this.requestCloseChat();
        this.faithDropdownOpen.set(false);
        this.faithOpensUpward.set(false);
        this.faithSuggestionsStyle.set({});
        this.deityPickerOpen.set(true);
    }

    private updateFaithSuggestionOverlayPosition(): void {
        const view = this.document.defaultView;
        const input = this.faithInputElement;
        if (!view || !input || !this.faithDropdownOpen()) {
            return;
        }

        const viewportPadding = 10;
        const panel = this.document.querySelector('.deity-suggestions--floating') as HTMLElement | null;
        const measuredHeight = panel ? panel.scrollHeight : this.estimateFaithSuggestionsHeight();
        const desiredHeight = Math.min(320, measuredHeight);
        const rect = input.getBoundingClientRect();
        const availableBelow = Math.max(0, view.innerHeight - rect.bottom - viewportPadding);
        const availableAbove = Math.max(0, rect.top - viewportPadding);
        const openUpward = desiredHeight > availableBelow && availableAbove > availableBelow;
        const maxHeight = Math.max(96, Math.min(320, openUpward ? availableAbove - 6 : availableBelow - 6));
        const renderedHeight = Math.min(desiredHeight, maxHeight);
        const top = openUpward
            ? Math.max(viewportPadding, rect.top - renderedHeight - 4)
            : Math.min(view.innerHeight - viewportPadding - renderedHeight, rect.bottom + 4);
        const left = Math.max(viewportPadding, Math.min(rect.left, view.innerWidth - viewportPadding - rect.width));

        this.faithOpensUpward.set(openUpward);
        this.faithSuggestionsStyle.set({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${rect.width}px`,
            maxHeight: `${maxHeight}px`
        });
    }

    private scheduleFaithSuggestionOverlayPositionUpdate(): void {
        const view = this.document.defaultView;
        if (!view || !this.faithDropdownOpen()) {
            return;
        }

        view.requestAnimationFrame(() => this.updateFaithSuggestionOverlayPosition());
    }

    private estimateFaithSuggestionsHeight(): number {
        const rowHeight = 58;
        const verticalPadding = 8;
        return verticalPadding + (this.faithSuggestions().length * rowHeight);
    }

    closeDeityPicker(): void {
        this.deityPickerOpen.set(false);
    }

    onDeityConfirmed(deityName: string): void {
        this.selectedFaith.set(deityName);
        this.closeDeityPicker();
    }

    onPhysicalCharacteristicChanged(field: 'hair' | 'skin' | 'eyes' | 'height' | 'weight' | 'age' | 'gender', value: string): void {
        switch (field) {
            case 'hair':
                this.physicalHair.set(value);
                break;
            case 'skin':
                this.physicalSkin.set(value);
                break;
            case 'eyes':
                this.physicalEyes.set(value);
                break;
            case 'height':
                this.physicalHeight.set(value);
                break;
            case 'weight':
                this.physicalWeight.set(value);
                break;
            case 'age':
                this.physicalAge.set(value);
                break;
            case 'gender':
                this.physicalGender.set(value);
                break;
        }
    }

    onPhysicalMeasurementUnitChanged(field: 'height' | 'weight', unit: string | number): void {
        const nextUnit = String(unit);

        if (field === 'height') {
            if (!this.isHeightUnit(nextUnit)) {
                return;
            }

            const currentUnit = this.physicalHeightUnit();
            if (currentUnit === nextUnit) {
                return;
            }

            const converted = this.convertHeightValue(this.physicalHeight(), currentUnit, nextUnit);
            this.physicalHeightUnit.set(nextUnit);
            if (converted != null) {
                this.physicalHeight.set(converted);
            }
            return;
        }

        if (!this.isWeightUnit(nextUnit)) {
            return;
        }

        const currentUnit = this.physicalWeightUnit();
        if (currentUnit === nextUnit) {
            return;
        }

        const converted = this.convertWeightValue(this.physicalWeight(), currentUnit, nextUnit);
        this.physicalWeightUnit.set(nextUnit);
        if (converted != null) {
            this.physicalWeight.set(converted);
        }
    }

    private isHeightUnit(value: string): value is HeightUnit {
        return value === 'cm' || value === 'm' || value === 'ft' || value === 'in';
    }

    private isWeightUnit(value: string): value is WeightUnit {
        return value === 'kg' || value === 'lb';
    }

    private resolveHeightUnit(persistedUnit: string | undefined, heightValue: string): HeightUnit {
        if (persistedUnit && this.isHeightUnit(persistedUnit)) {
            return persistedUnit;
        }

        const normalized = heightValue.trim().toLowerCase();
        if (/\bcm\b|centimeter/.test(normalized)) return 'cm';
        if (/\bm\b|meter/.test(normalized)) return 'm';
        if (/\bft\b|foot|feet|\'/.test(normalized)) return 'ft';
        if (/\bin\b|inch/.test(normalized)) return 'in';

        return 'ft';
    }

    private resolveWeightUnit(persistedUnit: string | undefined, weightValue: string): WeightUnit {
        if (persistedUnit && this.isWeightUnit(persistedUnit)) {
            return persistedUnit;
        }

        const normalized = weightValue.trim().toLowerCase();
        if (/\bkg\b|kilogram/.test(normalized)) return 'kg';
        if (/\blb\b|\blbs\b|pound/.test(normalized)) return 'lb';

        return 'lb';
    }

    private formatPhysicalMeasurement(value: string, unit: HeightUnit | WeightUnit): string {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        if (/[a-zA-Z]/.test(trimmed)) {
            return trimmed;
        }

        return `${trimmed} ${unit}`;
    }

    private inferAbilityBaseScoresFromCharacter(character: Character): Record<string, number> {
        const abilityMap: Record<string, number> = {
            Strength: character.abilityScores.strength,
            Dexterity: character.abilityScores.dexterity,
            Constitution: character.abilityScores.constitution,
            Intelligence: character.abilityScores.intelligence,
            Wisdom: character.abilityScores.wisdom,
            Charisma: character.abilityScores.charisma
        };

        return this.abilityTiles.reduce<Record<string, number>>((scores, ability) => {
            const total = Number(abilityMap[ability]);
            const fallback = this.abilityBaseScores()[ability] ?? 10;
            if (!Number.isFinite(total)) {
                scores[ability] = fallback;
                return scores;
            }

            const calculatedBonus = this.getCalculatedAbilityScoreBonus(ability);
            scores[ability] = Math.max(1, Math.min(20, Math.trunc(total - calculatedBonus)));
            return scores;
        }, {});
    }

    private convertHeightValue(rawValue: string, fromUnit: HeightUnit, toUnit: HeightUnit): string | null {
        const parsed = this.parseLeadingNumber(rawValue);
        if (parsed == null) {
            return null;
        }

        const valueInCm = this.heightToCm(parsed, fromUnit);
        const converted = this.cmToHeightUnit(valueInCm, toUnit);
        return this.roundMeasurement(converted, toUnit === 'm' ? 2 : 1);
    }

    private convertWeightValue(rawValue: string, fromUnit: WeightUnit, toUnit: WeightUnit): string | null {
        const parsed = this.parseLeadingNumber(rawValue);
        if (parsed == null) {
            return null;
        }

        const valueInKg = fromUnit === 'kg' ? parsed : parsed * 0.45359237;
        const converted = toUnit === 'kg' ? valueInKg : valueInKg / 0.45359237;
        return this.roundMeasurement(converted, 1);
    }

    private parseLeadingNumber(input: string): number | null {
        const match = input.trim().match(/^-?\d+(?:\.\d+)?/);
        if (!match) {
            return null;
        }

        const value = Number(match[0]);
        return Number.isFinite(value) ? value : null;
    }

    private heightToCm(value: number, unit: HeightUnit): number {
        switch (unit) {
            case 'cm':
                return value;
            case 'm':
                return value * 100;
            case 'ft':
                return value * 30.48;
            case 'in':
                return value * 2.54;
        }
    }

    private cmToHeightUnit(valueInCm: number, unit: HeightUnit): number {
        switch (unit) {
            case 'cm':
                return valueInCm;
            case 'm':
                return valueInCm / 100;
            case 'ft':
                return valueInCm / 30.48;
            case 'in':
                return valueInCm / 2.54;
        }
    }

    private roundMeasurement(value: number, decimals: number): string {
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(value * factor) / factor;
        return rounded.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    }

    private syncBackgroundLanguageChoiceSelections(values: string[]): void {
        const selected = this.selectedBackground();
        const detail = this.selectedBackgroundDetail();
        if (!selected || !detail) {
            return;
        }

        const languageChoice = detail.choices.find((choice) => this.isLanguageChoiceKey(choice.key));
        if (!languageChoice) {
            return;
        }

        const compositeKey = `${selected.name}:${languageChoice.key}`;
        this.backgroundChoiceSelections.update((current) => {
            const next = values[0] ?? '';
            if ((current[compositeKey] ?? '') === next) {
                return current;
            }

            return {
                ...current,
                [compositeKey]: next
            };
        });
    }

    private getLanguageGroupsForRule(languageRule: string): ReadonlyArray<MultiSelectOptionGroup> {
        const normalized = languageRule.toLowerCase().trim();

        if (normalized.includes('standard language')) {
            return [{ label: 'Standard', options: [...this.commonLanguages] }];
        }

        if (normalized.includes('exotic language')) {
            return [{ label: 'Exotic', options: [...this.exoticLanguages] }];
        }

        return this.languageGroups;
    }

    private getLanguageChoiceCount(languageRule: string): number {
        const normalized = languageRule.toLowerCase().trim();
        if (!normalized || normalized === 'none' || normalized.includes('common +') || normalized.includes('common and')) {
            return 0;
        }

        if (normalized.includes('three')) {
            return 3;
        }

        if (normalized.includes('two')) {
            return 2;
        }

        if (/(?:^|\b)(?:a|an|any|one)?\s*(?:standard|exotic)?\s*language(?:s)? of your choice\b/.test(normalized)) {
            return 1;
        }

        if (normalized.includes('one')) {
            return 1;
        }

        return 0;
    }

    private extractKnownLanguages(details: string): string[] {
        const normalized = details.trim();
        if (!normalized) {
            return [];
        }

        const knownMatch = normalized.match(/Your character knows\s+(.+?)\./i);
        const rawKnown = (knownMatch?.[1] ?? '').trim();
        if (!rawKnown) {
            return [];
        }

        return rawKnown
            .replace(/\s+and\s+/gi, ',')
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }

    openItemModal(item: InventoryEntry): void {
        this.activeItemDetailModal.set(item);
    }

    addActiveItemFromModal(quantity: number): void {
        const activeItem = this.activeItemDetailModal();
        if (!activeItem) {
            return;
        }

        const safeQuantity = Math.max(1, Math.floor(quantity));
        const equipmentItem: EquipmentItem = {
            name: activeItem.name,
            category: activeItem.category,
            sourceUrl: activeItem.sourceUrl ?? '',
            weight: activeItem.weight,
            costGp: activeItem.costGp,
            sourceLabel: activeItem.sourceLabel,
            summary: activeItem.summary,
            notes: activeItem.notes,
            detailLines: activeItem.detailLines,
            rarity: activeItem.rarity,
            attunement: activeItem.attunement
        };

        for (let count = 0; count < safeQuantity; count++) {
            this.addEquipmentItemToInventory(equipmentItem);
        }

        this.closeItemModal();
    }

    closeItemModal(): void {
        this.activeItemDetailModal.set(null);
    }

}





