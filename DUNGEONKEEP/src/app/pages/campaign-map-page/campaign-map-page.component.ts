import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MapArtGenerationModalComponent, MapArtGenerationOptions } from '../../components/map-art-generation-modal/map-art-generation-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { Campaign, CampaignMap, CampaignMapBackground, CampaignMapBoard, CampaignMapDecoration, CampaignMapDecorationType, CampaignMapIcon, CampaignMapIconType, CampaignMapLabel, CampaignMapLabelTone, CampaignMapPoint, CampaignTone } from '../../models/dungeon.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type MapTool = 'draw' | 'icon' | 'terrain' | 'label';
type MapConfirmAction = 'clear-map' | 'delete-icon' | 'delete-map' | null;
type MapAnchorProminence = 'major' | 'minor';
type SettlementScale = 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis';
type ParchmentLayout = 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular';
type CavernLayout = 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes';

interface MapIconOption {
    type: CampaignMapIconType;
    label: string;
    description: string;
    iconClass: string;
}

interface MapTerrainOption {
    type: CampaignMapDecorationType;
    label: string;
    description: string;
    iconClass: string;
}

interface GeneratedMapAnchor {
    id: string;
    type: CampaignMapIconType;
    label: string;
    x: number;
    y: number;
    prominence: MapAnchorProminence;
}

interface GeneratedMapTerrainLabel {
    text: string;
    tone: 'Region' | 'Feature';
    x: number;
    y: number;
    rotation: number;
}

interface CampaignSeedProfile {
    hash: string;
    suggestedBackground: CampaignMapBackground;
    civilization: number;
    mysticism: number;
    danger: number;
    wilderness: number;
    routeDensity: number;
    riverCount: number;
    forestDensity: number;
    mountainDensity: number;
    regionName: string;
    featureName: string;
    summary: string;
}

interface MapEditorHistoryEntry {
    maps: CampaignMapBoard[];
    activeMapId: string;
}

type MapLabelCatalog = Record<CampaignMapIconType, readonly string[]>;

const MAP_BACKGROUND_OPTIONS: DropdownOption[] = [
    { value: 'Parchment', label: 'Parchment', description: 'Warm paper tones for hand-drawn routes and lore maps.' },
    { value: 'City', label: 'Settlement', description: 'Sharper streets, walls, and district lines for towns and cities.' },
    { value: 'Coast', label: 'Coast', description: 'Sea-washed tones for harbors, islands, and shore routes.' },
    { value: 'Cavern', label: 'Cavern', description: 'Deep mineral tones for tunnels, roots, and underworld spaces.' }
];

const BRUSH_COLOR_OPTIONS: DropdownOption[] = [
    { value: '#8a5a2b', label: 'Amber Ink', description: 'Default route color for roads and trade lines.' },
    { value: '#4b3a2a', label: 'Walnut Ink', description: 'Strong dark line for walls, borders, and keeps.' },
    { value: '#507255', label: 'Moss Ink', description: 'Great for forests, roots, and hidden trails.' },
    { value: '#385f7a', label: 'Tide Ink', description: 'Useful for rivers, coasts, and magical wards.' },
    { value: '#a03d2f', label: 'Cinder Ink', description: 'Use for danger zones, enemy paths, and warnings.' }
];

const BRUSH_SIZE_OPTIONS: DropdownOption[] = [
    { value: 3, label: 'Fine', description: 'Thin detail lines and footpaths.' },
    { value: 5, label: 'Standard', description: 'General-purpose route marking.' },
    { value: 8, label: 'Bold', description: 'Strong roads, coastlines, and region borders.' },
    { value: 12, label: 'Heavy', description: 'Chunky marker for major territory blocks.' }
];

const SETTLEMENT_SCALE_OPTIONS: DropdownOption[] = [
    { value: 'Hamlet', label: 'Hamlet', description: 'Tiny cluster of homes or a remote outpost.' },
    { value: 'Village', label: 'Village', description: 'Small settlement with a modest footprint.' },
    { value: 'Town', label: 'Town', description: 'Regional market town with moderate prominence.' },
    { value: 'City', label: 'City', description: 'Large urban center with clear district massing.' },
    { value: 'Metropolis', label: 'Metropolis', description: 'Capital-scale city with dominant urban presence.' }
];

const PARCHMENT_LAYOUT_OPTIONS: DropdownOption[] = [
    { value: 'Uniform', label: 'Uniform', description: 'Evenly distributed landmasses and terrain without one dominant focal continent.' },
    { value: 'Continent', label: 'Continent', description: 'One dominant continental landmass with surrounding seas and coasts.' },
    { value: 'Archipelago', label: 'Archipelago', description: 'Clusters of islands and broken coastlines across the map.' },
    { value: 'Atoll', label: 'Atoll', description: 'Ring-like island forms, lagoons, and coral-style maritime geography.' },
    { value: 'World', label: 'World', description: 'A broad world-map feel with large-scale planetary geography.' },
    { value: 'Equirectangular', label: 'Equirectangular', description: 'A projection-style world layout suitable for a full global map.' }
];

const CAVERN_LAYOUT_OPTIONS: DropdownOption[] = [
    { value: 'TunnelNetwork', label: 'Tunnel Network', description: 'Dense branching passages and linked chambers.' },
    { value: 'GrandCavern', label: 'Grand Cavern', description: 'One dominant cavern hall with secondary side chambers.' },
    { value: 'VerticalChasm', label: 'Vertical Chasm', description: 'Layered drops, rifts, bridges, and deep shafts.' },
    { value: 'CrystalGrotto', label: 'Crystal Grotto', description: 'Mineral halls, luminous caverns, and reflective chambers.' },
    { value: 'RuinedUndercity', label: 'Ruined Undercity', description: 'Buried structures, collapsed streets, and ancient subterranean ruins.' },
    { value: 'LavaTubes', label: 'Lava Tubes', description: 'Volcanic channels, magma scars, and heat-cut cavern paths.' }
];

const MAP_ICON_OPTIONS: MapIconOption[] = [
    { type: 'Keep', label: 'Keep', description: 'Strongholds, castles, and bastions.', iconClass: 'fa-duotone fa-thin fa-chess-rook' },
    { type: 'Town', label: 'Town', description: 'Settlements, markets, and districts.', iconClass: 'fa-duotone fa-thin fa-house-chimney' },
    { type: 'Camp', label: 'Camp', description: 'Temporary camps, caravans, and staging grounds.', iconClass: 'fa-duotone fa-thin fa-campground' },
    { type: 'Dungeon', label: 'Dungeon', description: 'Ruins, vaults, and underground sites.', iconClass: 'fa-duotone fa-thin fa-dungeon' },
    { type: 'Danger', label: 'Danger', description: 'Hazards, threats, and conflict zones.', iconClass: 'fa-duotone fa-thin fa-triangle-exclamation' },
    { type: 'Treasure', label: 'Treasure', description: 'Caches, vaults, and hidden rewards.', iconClass: 'fa-duotone fa-thin fa-gem' },
    { type: 'Portal', label: 'Portal', description: 'Gates, crossings, and strange thresholds.', iconClass: 'fa-duotone fa-thin fa-sparkles' },
    { type: 'Tower', label: 'Tower', description: 'Watchtowers, beacons, and mage spires.', iconClass: 'fa-duotone fa-thin fa-tower-observation' }
];

const MAP_TERRAIN_OPTIONS: MapTerrainOption[] = [
    { type: 'Mountain', label: 'Mountains', description: 'Ranges, ridges, and hard borders.', iconClass: 'fa-duotone fa-thin fa-mountains' },
    { type: 'Forest', label: 'Forests', description: 'Woods, groves, and dense cover.', iconClass: 'fa-duotone fa-thin fa-trees' },
    { type: 'Hill', label: 'Hills', description: 'Rolling uplands and softer terrain.', iconClass: 'fa-duotone fa-thin fa-mound' },
    { type: 'Reef', label: 'Reefs', description: 'Shoals, reefs, and coastal hazards.', iconClass: 'fa-duotone fa-thin fa-water' },
    { type: 'Cave', label: 'Caves', description: 'Entrances, sinkholes, and hollow depths.', iconClass: 'fa-duotone fa-thin fa-dungeon' },
    { type: 'Ward', label: 'Wards', description: 'Mystic sites, anomalies, and marked zones.', iconClass: 'fa-duotone fa-thin fa-stars' }
];

const LABEL_TONE_OPTIONS: DropdownOption[] = [
    { value: 'Region', label: 'Region', description: 'Large names for realms, forests, coasts, or seas.' },
    { value: 'Feature', label: 'Feature', description: 'Smaller names for roads, ruins, rivers, or landmarks.' }
];

const MAP_LABELS_BY_BACKGROUND: Record<CampaignMapBackground, MapLabelCatalog> = {
    Parchment: {
        Keep: ['Sunward Keep', 'Wayfarer Bastion', 'Saint Ember Hold'],
        Town: ['Miller\'s Rest', 'Wren Hollow', 'Foxglove Crossing'],
        Camp: ['Survey Camp', 'Pilgrim Fires', 'Roadwarden Camp'],
        Dungeon: ['Old Barrow', 'Dustvault', 'Broken Archive'],
        Danger: ['Bandit Ridge', 'Cursed Ford', 'Black Mire'],
        Treasure: ['Forgotten Cache', 'Relic Cairn', 'Smuggler\'s Chest'],
        Portal: ['Moon Gate', 'Whisper Arch', 'Veil Tear'],
        Tower: ['Northwatch', 'Scribe Tower', 'Star Beacon']
    },
    City: {
        Keep: ['Garnet Citadel', 'High Ward Bastion', 'Rivergate Keep'],
        Town: ['Market Ward', 'Lantern Square', 'Copper Quay'],
        Camp: ['Siege Camp', 'Gatehouse Camp', 'Mercer Yard'],
        Dungeon: ['Undercrypt', 'Flooded Cells', 'Ash Sewers'],
        Danger: ['Riot Quarter', 'Burned Gate', 'Silent Alley'],
        Treasure: ['Guild Vault', 'Hidden Ledger', 'Coin Cellar'],
        Portal: ['Clockwork Gate', 'Mirror Arch', 'South Span Rift'],
        Tower: ['Bell Tower', 'Arcanist Spire', 'Old Watch']
    },
    Coast: {
        Keep: ['Stormwatch Keep', 'Harbor Bastion', 'Salt Crown Fort'],
        Town: ['Tidebreak', 'Gull Harbor', 'Pearl Market'],
        Camp: ['Drift Camp', 'Beacon Camp', 'Jetty Fires'],
        Dungeon: ['Sunken Vault', 'Sea Caves', 'Brine Catacombs'],
        Danger: ['Sharkwater', 'Breaker Reef', 'Wreck Shoals'],
        Treasure: ['Corsair Hoard', 'Drowned Chest', 'Pearl Cache'],
        Portal: ['Tide Gate', 'Siren Arch', 'Mist Crossing'],
        Tower: ['Beacon Tower', 'Cliff Watch', 'Fog Lamp']
    },
    Cavern: {
        Keep: ['Rootkeep', 'Stone Maw Hold', 'Ember Shelf'],
        Town: ['Glowmarket', 'Lantern Burrow', 'Fungus Reach'],
        Camp: ['Mushroom Camp', 'Delver Camp', 'Spore Fires'],
        Dungeon: ['Hollow Sink', 'Crystal Maw', 'Deep Vault'],
        Danger: ['Chasm Edge', 'Spider Hollow', 'Gas Vein'],
        Treasure: ['Gem Nest', 'Buried Reliquary', 'Ore Cache'],
        Portal: ['Echo Gate', 'Crystal Rift', 'Root Door'],
        Tower: ['Stalag Spire', 'Glow Tower', 'Rune Needle']
    }
};

@Component({
    selector: 'app-campaign-map-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent, ConfirmModalComponent, MapArtGenerationModalComponent],
    templateUrl: './campaign-map-page.component.html',
    styleUrl: './campaign-map-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignMapPageComponent {
    private static readonly MAX_HISTORY_ENTRIES = 80;

    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly mapBoard = viewChild<ElementRef<HTMLDivElement>>('mapBoard');

    readonly campaignId = signal('');
    readonly routeMapId = signal('');
    readonly routeMode = signal<'view' | 'edit'>('view');
    readonly workingMap = signal<CampaignMap>(this.createEmptyMap());
    readonly mapBoards = signal<CampaignMapBoard[]>([]);
    readonly currentMapId = signal('');
    readonly mapNameDraft = signal('');
    readonly activeTool = signal<MapTool>('draw');
    readonly pendingIconType = signal<CampaignMapIconType | null>(null);
    readonly pendingTerrainType = signal<CampaignMapDecorationType | null>(null);
    readonly selectedIconId = signal<string | null>(null);
    readonly iconLabelDraft = signal('');
    readonly labelTextDraft = signal('New Region');
    readonly labelToneDraft = signal<CampaignMapLabelTone>('Region');
    readonly mapArtModalOpen = signal(false);
    readonly settlementNamesDraft = signal('');
    readonly regionNamesDraft = signal('');
    readonly ruinNamesDraft = signal('');
    readonly cavernNamesDraft = signal('');
    readonly additionalArtDirectionDraft = signal('');
    readonly settlementScale = signal<SettlementScale>('City');
    readonly parchmentLayout = signal<ParchmentLayout>('Continent');
    readonly cavernLayout = signal<CavernLayout>('TunnelNetwork');
    readonly brushColor = signal('#8a5a2b');
    readonly terrainColor = signal('#8a5a2b');
    readonly brushWidth = signal(5);
    readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
    readonly saveMessage = signal('');
    readonly hasUnsavedChanges = signal(false);
    readonly confirmAction = signal<MapConfirmAction>(null);
    readonly isDrawing = signal(false);
    readonly isAiArtGenerating = signal(false);
    readonly undoStack = signal<MapEditorHistoryEntry[]>([]);
    readonly redoStack = signal<MapEditorHistoryEntry[]>([]);

    readonly backgroundOptions = MAP_BACKGROUND_OPTIONS;
    readonly brushColorOptions = BRUSH_COLOR_OPTIONS;
    readonly terrainColorOptions = BRUSH_COLOR_OPTIONS;
    readonly brushSizeOptions = BRUSH_SIZE_OPTIONS;
    readonly settlementScaleOptions = SETTLEMENT_SCALE_OPTIONS;
    readonly parchmentLayoutOptions = PARCHMENT_LAYOUT_OPTIONS;
    readonly cavernLayoutOptions = CAVERN_LAYOUT_OPTIONS;
    readonly iconOptions = MAP_ICON_OPTIONS;
    readonly terrainOptions = MAP_TERRAIN_OPTIONS;
    readonly labelToneOptions = LABEL_TONE_OPTIONS;

    readonly selectedCampaign = computed(() => {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === campaignId) ?? null;
    });

    readonly canEdit = computed(() => this.selectedCampaign()?.currentUserRole === 'Owner');
    readonly isEditorMode = computed(() => this.routeMode() === 'edit');
    readonly canModify = computed(() => this.canEdit() && this.isEditorMode());
    readonly showSettlementScale = computed(() => this.workingMap().background === 'City');
    readonly showParchmentLayout = computed(() => this.workingMap().background === 'Parchment');
    readonly showCavernLayout = computed(() => this.workingMap().background === 'Cavern');
    readonly cavernLayoutLabel = computed(() => this.cavernLayoutOptions.find((option) => option.value === this.cavernLayout())?.label ?? 'Tunnel Network');
    readonly hasPreferredNamesQueued = computed(() => [
        this.settlementNamesDraft(),
        this.regionNamesDraft(),
        this.ruinNamesDraft(),
        this.cavernNamesDraft()
    ].some((value) => value.trim().length > 0));
    readonly canUndo = computed(() => this.undoStack().length > 0);
    readonly canRedo = computed(() => this.redoStack().length > 0);
    readonly currentMapBoard = computed(() => this.mapBoards().find((map) => map.id === this.currentMapId()) ?? this.mapBoards()[0] ?? null);
    readonly backLink = computed(() => {
        const campaign = this.selectedCampaign();
        const currentMap = this.currentMapBoard();
        if (!campaign) {
            return {
                route: ['/campaigns'] as string[],
                label: 'Back to maps'
            };
        }

        if (this.isEditorMode() && currentMap) {
            return {
                route: this.mapViewRoute(campaign.id, currentMap.id),
                label: `Back to ${currentMap.name}`
            };
        }

        return {
            route: this.mapListRoute(campaign.id),
            label: `Back to ${campaign.name} maps`
        };
    });
    readonly selectedIcon = computed(() => {
        const iconId = this.selectedIconId();
        if (!iconId) {
            return null;
        }

        return this.workingMap().icons.find((icon) => icon.id === iconId) ?? null;
    });
    readonly activeIconOption = computed(() => this.iconOptions.find((option) => option.type === this.pendingIconType()) ?? null);
    readonly activeTerrainOption = computed(() => this.terrainOptions.find((option) => option.type === this.pendingTerrainType()) ?? null);
    readonly placementHint = computed(() => {
        if (this.pendingIconType()) {
            return `Click anywhere on the board to place a ${this.activeIconOption()?.label?.toLowerCase() ?? 'landmark'} marker.`;
        }

        if (this.pendingTerrainType()) {
            return `Click anywhere on the board to place ${this.activeTerrainOption()?.label?.toLowerCase() ?? 'terrain'}.`;
        }

        if (this.activeTool() === 'label') {
            const labelText = this.labelTextDraft().trim() || this.defaultLabelText(this.labelToneDraft());
            return `Click anywhere on the board to place the label "${labelText}".`;
        }

        return '';
    });
    readonly saveStatusText = computed(() => {
        if (this.isAiArtGenerating()) {
            return this.saveMessage();
        }

        switch (this.saveState()) {
            case 'saving':
                return 'Saving changes...';
            case 'error':
                return 'Latest change is only local right now.';
            default:
                return this.hasUnsavedChanges() ? 'Unsaved changes' : this.saveMessage();
        }
    });
    readonly shouldShowSaveStatus = computed(() => {
        if (this.isAiArtGenerating() || this.hasUnsavedChanges()) {
            return true;
        }

        if (this.saveState() === 'saving' || this.saveState() === 'saved' || this.saveState() === 'error') {
            return true;
        }

        return this.saveMessage().trim().length > 0;
    });
    readonly confirmOpen = computed(() => this.confirmAction() !== null);
    readonly confirmTitle = computed(() => {
        switch (this.confirmAction()) {
            case 'clear-map':
                return 'Clear Map?';
            case 'delete-map':
                return 'Delete Map?';
            default:
                return 'Delete Landmark?';
        }
    });
    readonly confirmMessage = computed(() => {
        if (this.confirmAction() === 'clear-map') {
            return 'Remove every route and landmark from this campaign map? The current background style will stay in place.';
        }

        if (this.confirmAction() === 'delete-map') {
            const board = this.currentMapBoard();
            return board
                ? `Delete ${board.name}? Its routes, terrain, and landmarks will be removed for everyone in the campaign.`
                : 'Delete this map from the campaign library?';
        }

        const icon = this.selectedIcon();
        return icon ? `Remove ${icon.label}? This landmark marker will disappear for everyone in the campaign.` : 'Remove this landmark from the campaign map?';
    });
    readonly confirmActionText = computed(() => {
        switch (this.confirmAction()) {
            case 'clear-map':
                return 'Clear Map';
            case 'delete-map':
                return 'Delete Map';
            default:
                return 'Delete Landmark';
        }
    });

    backgroundDisplayLabel(background: CampaignMapBackground): string {
        return background === 'City' ? 'Settlement' : background;
    }
    readonly campaignSeed = computed(() => this.createCampaignSeedProfile(this.selectedCampaign()));
    readonly showRivers = signal(true);
    readonly showMountainChains = signal(true);
    readonly showForestBelts = signal(true);
    readonly showLabels = signal(true);

    private lastLoadedCampaignId = '';
    private lastLoadedMapSignature = '';
    private lastLoadedRouteMapId = '';
    private activeStrokePointerId: number | null = null;
    private draggingIconId: string | null = null;
    private draggingPointerId: number | null = null;
    private pendingDragHistory: MapEditorHistoryEntry | null = null;
    private persistInFlight = false;
    private creatingRouteMap = false;
    private generationVariant = 0;
    private historySuppressed = false;
    private randomSource: () => number = () => Math.random();

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                const routeMapId = params.get('mapId') ?? '';
                this.campaignId.set(campaignId);
                this.routeMapId.set(routeMapId);

                if (campaignId) {
                    this.store.selectCampaign(campaignId);
                }
            });

        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.routeMode.set(data['mapMode'] === 'edit' ? 'edit' : 'view');
            });

        effect(() => {
            const campaign = this.selectedCampaign();
            const routeMapId = this.routeMapId();
            if (!campaign) {
                return;
            }

            const signature = this.mapLibrarySignature(campaign.maps, campaign.activeMapId);
            if (campaign.id === this.lastLoadedCampaignId && signature === this.lastLoadedMapSignature && routeMapId === this.lastLoadedRouteMapId) {
                return;
            }

            this.lastLoadedCampaignId = campaign.id;
            this.lastLoadedMapSignature = signature;
            this.lastLoadedRouteMapId = routeMapId;
            const maps = campaign.maps.length > 0
                ? campaign.maps.map((map) => this.cloneMapBoard(map))
                : [this.createEmptyMapBoard('Main Map', campaign.map.background)];

            if (routeMapId === 'new') {
                if (!this.canEdit()) {
                    void this.router.navigate(this.mapListRoute(campaign.id), { replaceUrl: true });
                    return;
                }

                if (this.creatingRouteMap) {
                    return;
                }

                void this.createMapBoard();
                return;
            }

            const activeMap = maps.find((map) => map.id === routeMapId)
                ?? maps.find((map) => map.id === campaign.activeMapId)
                ?? maps[0];

            if (routeMapId && !maps.some((map) => map.id === routeMapId) && activeMap) {
                void this.router.navigate(this.mapRouteForCurrentMode(campaign.id, activeMap.id), { replaceUrl: true });
            }

            this.mapBoards.set(maps);
            this.loadMapBoard(activeMap);
            this.undoStack.set([]);
            this.redoStack.set([]);
            this.pendingDragHistory = null;
            this.hasUnsavedChanges.set(false);
            this.saveState.set('idle');
            this.saveMessage.set(this.canModify() ? '' : this.canEdit() ? 'Viewing map. Click Edit Map to make changes.' : 'Members can review the map, but only owners can edit it.');
        });

        effect(() => {
            const selectedIcon = this.selectedIcon();
            this.iconLabelDraft.set(selectedIcon?.label ?? '');
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleDocumentKeydown(event: KeyboardEvent): void {
        if (!this.canModify() || this.confirmOpen() || this.shouldIgnoreShortcut(event.target) || event.altKey) {
            return;
        }

        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        const key = event.key.toLowerCase();
        const handled = key === 's'
            ? this.handleSaveShortcut()
            : (key === 'z' && !event.shiftKey)
                ? this.handleUndo()
                : (key === 'y' || (key === 'z' && event.shiftKey))
                    ? this.handleRedo()
                    : false;

        if (handled) {
            event.preventDefault();
        }
    }

    selectDrawTool(): void {
        this.activeTool.set('draw');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectIconTool(iconType: CampaignMapIconType): void {
        this.activeTool.set('icon');
        this.pendingIconType.set(iconType);
        this.pendingTerrainType.set(null);
    }

    selectTerrainTool(terrainType: CampaignMapDecorationType): void {
        this.activeTool.set('terrain');
        this.pendingTerrainType.set(terrainType);
        this.pendingIconType.set(null);
    }

    selectLabelTool(): void {
        this.activeTool.set('label');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    startLandmarkTool(): void {
        if (this.pendingIconType()) {
            this.activeTool.set('icon');
            return;
        }

        this.selectIconTool('Keep');
    }

    clearPlacementMode(): void {
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
        this.activeTool.set('draw');
    }

    updateBackground(value: string | number): void {
        const background = this.normalizeBackground(value);
        this.mutateMap((map) => {
            map.background = background;
        });
        this.markDirty('Map background updated.');
    }

    updateBrushColor(value: string | number): void {
        this.brushColor.set(typeof value === 'string' ? value : '#8a5a2b');
    }

    updateTerrainColor(value: string | number): void {
        this.terrainColor.set(this.normalizeEditorColor(value, '#8a5a2b'));
    }

    updateBrushWidth(value: string | number): void {
        const numericValue = typeof value === 'number' ? value : Number(value);
        this.brushWidth.set(Number.isFinite(numericValue) ? Math.max(2, Math.min(18, Math.trunc(numericValue))) : 5);
    }

    updateSettlementScale(value: string | number): void {
        const normalizedValue = typeof value === 'string' ? value : String(value);
        this.settlementScale.set(this.normalizeSettlementScale(normalizedValue));
    }

    updateParchmentLayout(value: string | number): void {
        const normalizedValue = typeof value === 'string' ? value : String(value);
        this.parchmentLayout.set(this.normalizeParchmentLayout(normalizedValue));
    }

    updateCavernLayout(value: string | number): void {
        const normalizedValue = typeof value === 'string' ? value : String(value);
        this.cavernLayout.set(this.normalizeCavernLayout(normalizedValue));
    }

    toggleRiverLayer(): void {
        this.showRivers.update((visible) => !visible);
    }

    toggleMountainLayer(): void {
        this.showMountainChains.update((visible) => !visible);
    }

    toggleForestLayer(): void {
        this.showForestBelts.update((visible) => !visible);
    }

    toggleLabelLayer(): void {
        this.showLabels.update((visible) => !visible);
    }

    selectMapBoard(mapId: string): void {
        const mapBoard = this.mapBoards().find((map) => map.id === mapId);
        if (!mapBoard) {
            return;
        }

        if (this.canEdit() && mapId !== this.currentMapId()) {
            this.captureHistorySnapshot();
        }

        this.loadMapBoard(mapBoard);
    }

    updateMapNameDraft(value: string): void {
        this.mapNameDraft.set(value);
    }

    applyMapName(): void {
        const currentMap = this.currentMapBoard();
        if (!currentMap || !this.canModify()) {
            return;
        }

        const nextName = this.mapNameDraft().trim() || 'Untitled Map';
        if (nextName === currentMap.name) {
            return;
        }

        this.captureHistorySnapshot();
        this.mapBoards.update((maps) => maps.map((map) => map.id === currentMap.id ? { ...map, name: nextName } : map));
        this.mapNameDraft.set(nextName);
        if (this.canEdit()) {
            this.markDirty(`${nextName} renamed. Save to keep this change.`);
        }
    }

    createMapBoard(): void {
        if (!this.canModify()) {
            return;
        }

        void this.createRouteMapBoard();
    }

    requestDeleteCurrentMap(): void {
        if (!this.canModify() || this.mapBoards().length <= 1) {
            return;
        }

        this.confirmAction.set('delete-map');
    }

    selectIcon(iconId: string): void {
        this.selectedIconId.set(iconId);
    }

    updateIconLabelDraft(value: string): void {
        this.iconLabelDraft.set(value);
    }

    updateLabelTextDraft(value: string): void {
        this.labelTextDraft.set(value);
    }

    updateLabelToneDraft(value: string | number): void {
        const tone: CampaignMapLabelTone = value === 'Feature' ? 'Feature' : 'Region';
        const currentText = this.labelTextDraft().trim();
        this.labelToneDraft.set(tone);

        if (!currentText || currentText === 'New Region' || currentText === 'New Feature') {
            this.labelTextDraft.set(this.defaultLabelText(tone));
        }
    }

    applySelectedIconLabel(): void {
        const selectedIcon = this.selectedIcon();
        if (!selectedIcon || !this.canModify()) {
            return;
        }

        const nextLabel = this.iconLabelDraft().trim() || this.defaultIconLabel(selectedIcon.type);
        if (nextLabel === selectedIcon.label) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.icons = map.icons.map((icon) => icon.id === selectedIcon.id ? { ...icon, label: nextLabel } : icon);
        });
        this.markDirty('Landmark label updated.');
    }

    requestDeleteSelectedIcon(): void {
        if (!this.selectedIcon() || !this.canModify()) {
            return;
        }

        this.confirmAction.set('delete-icon');
    }

    requestClearMap(): void {
        if (!this.canModify() || (!this.workingMap().strokes.length && !this.workingMap().icons.length && !this.workingMap().decorations.length && !this.workingMap().labels.length && !this.workingMap().layers.rivers.length && !this.workingMap().layers.mountainChains.length && !this.workingMap().layers.forestBelts.length)) {
            return;
        }

        this.confirmAction.set('clear-map');
    }

    async handleConfirmAccepted(): Promise<void> {
        const action = this.confirmAction();
        this.confirmAction.set(null);

        if (action === 'delete-icon') {
            const iconId = this.selectedIconId();
            if (!iconId) {
                return;
            }

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.icons = map.icons.filter((icon) => icon.id !== iconId);
            });
            this.selectedIconId.set(null);
            this.markDirty('Landmark removed.');
            return;
        }

        if (action === 'clear-map') {
            const background = this.workingMap().background;
            this.captureHistorySnapshot();
            this.setWorkingMap(this.createEmptyMap(background));
            this.selectedIconId.set(null);
            this.markDirty('Map cleared.');
            return;
        }

        if (action === 'delete-map') {
            const campaign = this.selectedCampaign();
            const currentMapId = this.currentMapId();
            const currentMaps = this.mapBoards().map((map) => this.cloneMapBoard(map));
            const remainingMaps = this.mapBoards().filter((map) => map.id !== currentMapId);
            const fallbackMap = remainingMaps[0];
            const deletedMap = currentMaps.find((map) => map.id === currentMapId);

            if (!campaign || !fallbackMap || !deletedMap) {
                return;
            }

            this.captureHistorySnapshot();
            this.mapBoards.set(remainingMaps);
            this.loadMapBoard(fallbackMap);
            this.saveState.set('saving');
            this.saveMessage.set(`Deleting ${deletedMap.name}...`);
            this.hasUnsavedChanges.set(false);
            this.cdr.detectChanges();

            const deleted = await this.store.updateCampaignMap(campaign.id, {
                activeMapId: fallbackMap.id,
                maps: remainingMaps
            });

            if (!deleted) {
                this.mapBoards.set(currentMaps);
                this.loadMapBoard(deletedMap);
                this.saveState.set('error');
                this.saveMessage.set(`Could not delete ${deletedMap.name}.`);
                this.hasUnsavedChanges.set(false);
                this.cdr.detectChanges();
                return;
            }

            this.lastLoadedMapSignature = this.mapLibrarySignature(remainingMaps, fallbackMap.id);
            this.saveState.set('saved');
            this.saveMessage.set(`${deletedMap.name} deleted.`);
            this.hasUnsavedChanges.set(false);
            this.cdr.detectChanges();
            await this.router.navigate(this.mapEditRoute(this.campaignId(), fallbackMap.id), { replaceUrl: true });
        }
    }

    handleConfirmCancelled(): void {
        this.confirmAction.set(null);
    }

    handleUndo(): boolean {
        if (!this.canModify()) {
            return false;
        }

        const previous = this.undoStack().at(-1);
        if (!previous) {
            return false;
        }

        const current = this.createHistoryEntry();
        this.undoStack.update((stack) => stack.slice(0, -1));
        this.pushHistoryEntry(current, 'redo');
        this.applyHistoryEntry(previous);
        this.markDirty('Undo applied.');
        return true;
    }

    handleRedo(): boolean {
        if (!this.canModify()) {
            return false;
        }

        const next = this.redoStack().at(-1);
        if (!next) {
            return false;
        }

        const current = this.createHistoryEntry();
        this.redoStack.update((stack) => stack.slice(0, -1));
        this.pushHistoryEntry(current, 'undo');
        this.applyHistoryEntry(next);
        this.markDirty('Redo applied.');
        return true;
    }

    async generateAiMapArt(): Promise<void> {
        await this.generateAiMapArtWithOptions({
            background: this.workingMap().background,
            mapName: this.mapNameDraft().trim(),
            settlementScale: this.settlementScale(),
            parchmentLayout: this.parchmentLayout(),
            cavernLayout: this.cavernLayout(),
            settlementNamesText: this.settlementNamesDraft(),
            regionNamesText: this.regionNamesDraft(),
            ruinNamesText: this.ruinNamesDraft(),
            cavernNamesText: this.cavernNamesDraft(),
            additionalDirection: this.additionalArtDirectionDraft()
        });
    }

    openMapArtModal(): void {
        if (!this.canModify() || this.isAiArtGenerating()) {
            return;
        }

        this.mapArtModalOpen.set(true);
    }

    closeMapArtModal(): void {
        this.mapArtModalOpen.set(false);
    }

    async submitMapArtModal(options: MapArtGenerationOptions): Promise<void> {
        this.mapArtModalOpen.set(false);
        this.settlementScale.set(options.settlementScale);
        this.parchmentLayout.set(options.parchmentLayout);
        this.cavernLayout.set(options.cavernLayout);
        this.settlementNamesDraft.set(options.settlementNamesText);
        this.regionNamesDraft.set(options.regionNamesText);
        this.ruinNamesDraft.set(options.ruinNamesText);
        this.cavernNamesDraft.set(options.cavernNamesText);
        this.additionalArtDirectionDraft.set(options.additionalDirection);
        await this.generateAiMapArtWithOptions(options);
    }

    private async generateAiMapArtWithOptions(options: MapArtGenerationOptions): Promise<void> {
        const campaign = this.selectedCampaign();
        const currentMap = this.currentMapBoard();
        if (!campaign || !currentMap || !this.canModify() || this.isAiArtGenerating()) {
            return;
        }

        const background = options.background;
        const mapName = options.mapName.trim();
        const settlementNames = this.parseNameList(options.settlementNamesText);
        const regionNames = this.parseNameList(options.regionNamesText);
        const ruinNames = this.parseNameList(options.ruinNamesText);
        const cavernNames = this.parseNameList(options.cavernNamesText);

        this.isAiArtGenerating.set(true);
        this.saveMessage.set('Generating map art with OpenAI...');
        this.cdr.detectChanges();

        try {
            const backgroundImageUrl = await this.store.generateCampaignMapArtAi(campaign.id, {
                background,
                mapName,
                settlementScale: background === 'City' ? options.settlementScale : undefined,
                parchmentLayout: background === 'Parchment' ? options.parchmentLayout : undefined,
                cavernLayout: background === 'Cavern' ? options.cavernLayout : undefined,
                settlementNames,
                regionNames,
                ruinNames,
                cavernNames,
                additionalDirection: options.additionalDirection.trim() || undefined
            });

            if (!backgroundImageUrl) {
                this.saveState.set('error');
                this.saveMessage.set('OpenAI map art generation failed or is unavailable.');
                return;
            }

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.background = background;
                map.backgroundImageUrl = backgroundImageUrl;
                map.strokes = [];
                map.decorations = [];
                map.labels = [];
                map.layers = {
                    rivers: [],
                    mountainChains: [],
                    forestBelts: []
                };
            });
            this.saveState.set('idle');
            this.markDirty('Map art generated. Existing routes were cleared and landmarks were kept. Save to keep it.');
        } finally {
            this.isAiArtGenerating.set(false);
            this.cdr.detectChanges();
        }
    }

    clearBackgroundImage(): void {
        if (!this.canModify() || !this.workingMap().backgroundImageUrl) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.backgroundImageUrl = '';
        });
        this.markDirty('Map art cleared.');
    }

    clearTerrainLayers(): void {
        if (!this.canModify()) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.decorations = [];
            map.labels = [];
            map.layers = {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            };
        });
        this.markDirty('Terrain layers cleared.');
    }

    handleBoardClick(event: MouseEvent): void {
        if (!this.canModify()) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        const pendingIconType = this.pendingIconType();
        if (pendingIconType) {
            const icon: CampaignMapIcon = {
                id: this.createId(),
                type: pendingIconType,
                label: this.defaultIconLabel(pendingIconType),
                x: point.x,
                y: point.y
            };

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.icons = [...map.icons, icon];
            });
            this.selectedIconId.set(icon.id);
            this.markDirty('Landmark added.');
            return;
        }

        const pendingTerrainType = this.pendingTerrainType();
        if (pendingTerrainType) {
            const decoration = this.createPlacedDecoration(pendingTerrainType, point);
            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                this.appendTerrainDecoration(map, decoration);
            });
            this.selectedIconId.set(null);
            this.markDirty(`${this.terrainLabel(pendingTerrainType)} added.`);
            return;
        }

        if (this.activeTool() === 'label') {
            const label: CampaignMapLabel = {
                id: this.createId(),
                text: this.labelTextDraft().trim() || this.defaultLabelText(this.labelToneDraft()),
                tone: this.labelToneDraft(),
                x: point.x,
                y: point.y,
                rotation: this.labelToneDraft() === 'Feature' ? this.randomFloat(-10, 10) : this.randomFloat(-4, 4)
            };

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.labels = [...map.labels, label];
            });
            this.selectedIconId.set(null);
            this.markDirty('Map label added.');
            return;
        }

        this.selectedIconId.set(null);
    }

    handleBoardPointerDown(event: PointerEvent): void {
        if (!this.canModify() || this.activeTool() !== 'draw' || event.button !== 0) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        this.selectedIconId.set(null);
        this.isDrawing.set(true);
        this.captureHistorySnapshot();
        this.activeStrokePointerId = event.pointerId;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);

        this.mutateMap((map) => {
            map.strokes = [
                ...map.strokes,
                {
                    id: this.createId(),
                    color: this.brushColor(),
                    width: this.brushWidth(),
                    points: [point]
                }
            ];
        });

        event.preventDefault();
    }

    handleBoardPointerMove(event: PointerEvent): void {
        if (!this.isDrawing() || this.activeStrokePointerId !== event.pointerId) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        this.mutateMap((map) => {
            const lastStroke = map.strokes.at(-1);
            if (!lastStroke) {
                return;
            }

            const previousPoint = lastStroke.points.at(-1);
            if (previousPoint && Math.hypot(previousPoint.x - point.x, previousPoint.y - point.y) < 0.005) {
                return;
            }

            lastStroke.points = [...lastStroke.points, point];
        });

        event.preventDefault();
    }

    handleBoardPointerUp(event: PointerEvent): void {
        if (!this.isDrawing() || this.activeStrokePointerId !== event.pointerId) {
            return;
        }

        this.activeStrokePointerId = null;
        this.isDrawing.set(false);
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

        this.mutateMap((map) => {
            const lastStroke = map.strokes.at(-1);
            if (!lastStroke || lastStroke.points.length !== 1) {
                return;
            }

            lastStroke.points = [...lastStroke.points, lastStroke.points[0]];
        });

        this.markDirty('Route stroke added.');
    }

    handleIconPointerDown(event: PointerEvent, iconId: string): void {
        this.selectedIconId.set(iconId);

        if (!this.canModify() || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        this.draggingIconId = iconId;
        this.draggingPointerId = event.pointerId;
        this.pendingDragHistory = this.createHistoryEntry();
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
        event.stopPropagation();
    }

    handleIconPointerMove(event: PointerEvent, iconId: string): void {
        if (this.draggingIconId !== iconId || this.draggingPointerId !== event.pointerId) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        this.mutateMap((map) => {
            map.icons = map.icons.map((icon) => icon.id === iconId ? { ...icon, x: point.x, y: point.y } : icon);
        });

        event.preventDefault();
        event.stopPropagation();
    }

    handleIconPointerUp(event: PointerEvent, iconId: string): void {
        if (this.draggingIconId !== iconId || this.draggingPointerId !== event.pointerId) {
            return;
        }

        this.draggingIconId = null;
        this.draggingPointerId = null;
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);
        event.stopPropagation();

        if (this.pendingDragHistory) {
            const beforeDrag = this.historyEntrySignature(this.pendingDragHistory);
            const afterDrag = this.historyEntrySignature(this.createHistoryEntry());
            if (beforeDrag !== afterDrag) {
                this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                this.redoStack.set([]);
            }
        }

        this.pendingDragHistory = null;
        this.markDirty('Landmark moved.');
    }

    async saveMap(): Promise<void> {
        if (!this.canModify() || this.persistInFlight || !this.hasUnsavedChanges()) {
            return;
        }

        await this.persistWorkingMap();
    }

    formatStrokePoints(points: CampaignMapPoint[]): string {
        return points
            .map((point) => `${Math.round(point.x * 1000)},${Math.round(point.y * 700)}`)
            .join(' ');
    }

    decorationClass(type: CampaignMapDecorationType): string {
        switch (type) {
            case 'Mountain':
                return 'fa-duotone fa-thin fa-mountains';
            case 'Hill':
                return 'fa-duotone fa-thin fa-mound';
            case 'Reef':
                return 'fa-duotone fa-thin fa-water';
            case 'Cave':
                return 'fa-duotone fa-thin fa-dungeon';
            case 'Ward':
                return 'fa-duotone fa-thin fa-stars';
            default:
                return 'fa-duotone fa-thin fa-trees';
        }
    }

    decorationColor(decoration: CampaignMapDecoration): string {
        return this.normalizeEditorColor(decoration.color, this.defaultDecorationColor(decoration.type));
    }

    iconClass(iconType: CampaignMapIconType): string {
        return this.iconOptions.find((option) => option.type === iconType)?.iconClass ?? 'fa-duotone fa-thin fa-location-dot';
    }

    backgroundTextureClass(): string {
        return `map-board--${this.workingMap().background.toLowerCase()}`;
    }

    isSelectedIcon(iconId: string): boolean {
        return this.selectedIconId() === iconId;
    }

    private markDirty(message = 'Unsaved changes.'): void {
        if (!this.canModify()) {
            return;
        }

        this.hasUnsavedChanges.set(true);
        this.saveState.set('idle');
        this.saveMessage.set(message);
    }

    private captureHistorySnapshot(): void {
        if (!this.canModify()) {
            return;
        }

        this.pushHistoryEntry(this.createHistoryEntry(), 'undo');
        this.redoStack.set([]);
    }

    private pushHistoryEntry(entry: MapEditorHistoryEntry, target: 'undo' | 'redo'): void {
        if (this.historySuppressed) {
            return;
        }

        const signature = this.historyEntrySignature(entry);
        const historySignal = target === 'undo' ? this.undoStack : this.redoStack;
        historySignal.update((stack) => {
            const previous = stack.at(-1);
            if (previous && this.historyEntrySignature(previous) === signature) {
                return stack;
            }

            const next = [...stack, entry];
            return next.length > CampaignMapPageComponent.MAX_HISTORY_ENTRIES
                ? next.slice(next.length - CampaignMapPageComponent.MAX_HISTORY_ENTRIES)
                : next;
        });
    }

    private createHistoryEntry(): MapEditorHistoryEntry {
        const maps = this.mapBoards().map((map) => this.cloneMapBoard(map));
        const activeMapId = this.currentMapId() || maps[0]?.id || '';
        return { maps, activeMapId };
    }

    private applyHistoryEntry(entry: MapEditorHistoryEntry): void {
        this.historySuppressed = true;
        try {
            const maps = entry.maps.map((map) => this.cloneMapBoard(map));
            const activeMap = maps.find((map) => map.id === entry.activeMapId) ?? maps[0] ?? this.createEmptyMapBoard('Main Map');
            this.mapBoards.set(maps.length > 0 ? maps : [this.cloneMapBoard(activeMap)]);
            this.loadMapBoard(activeMap);
            this.selectedIconId.set(null);
            this.pendingIconType.set(null);
            this.activeTool.set('draw');
        } finally {
            this.historySuppressed = false;
        }

        this.cdr.detectChanges();
    }

    private async persistWorkingMap(): Promise<void> {
        const campaign = this.selectedCampaign();
        const currentMap = this.currentMapBoard();
        if (!campaign || !currentMap || !this.canModify()) {
            return;
        }

        this.persistInFlight = true;
        const snapshot = this.cloneMap(this.workingMap());
        const maps = this.mapBoards().map((map) => map.id === currentMap.id ? { ...map, name: this.mapNameDraft().trim() || map.name, ...snapshot } : this.cloneMapBoard(map));
        const activeMapId = this.currentMapId() || currentMap.id;
        this.saveState.set('saving');
        this.saveMessage.set('Saving changes...');

        try {
            const saved = await this.store.updateCampaignMap(campaign.id, { activeMapId, maps });
            this.saveState.set(saved ? 'saved' : 'error');
            this.saveMessage.set(saved
                ? `Saved ${maps.length} maps with ${snapshot.strokes.length} routes and ${snapshot.icons.length} landmarks on ${this.mapNameDraft().trim() || currentMap.name}.`
                : 'Could not save your latest map change.');

            if (saved) {
                this.hasUnsavedChanges.set(false);
                this.lastLoadedMapSignature = this.mapLibrarySignature(maps, activeMapId);
            }
        } finally {
            this.persistInFlight = false;
            this.cdr.detectChanges();
        }
    }

    private handleSaveShortcut(): boolean {
        if (!this.canEdit() || !this.hasUnsavedChanges() || this.persistInFlight) {
            return false;
        }

        void this.saveMap();
        return true;
    }

    private mutateMap(mutator: (map: CampaignMap) => void): void {
        const next = this.cloneMap(this.workingMap());
        mutator(next);
        this.setWorkingMap(next);
    }

    private setWorkingMap(map: CampaignMap): void {
        this.workingMap.set(map);
        const currentMapId = this.currentMapId();
        if (!currentMapId) {
            return;
        }

        this.mapBoards.update((maps) => maps.map((entry) => entry.id === currentMapId ? { ...entry, ...this.cloneMap(map) } : entry));
    }

    private cloneMap(map: CampaignMap | null | undefined): CampaignMap {
        if (!map) {
            return this.createEmptyMap();
        }

        return {
            background: map.background,
            backgroundImageUrl: map.backgroundImageUrl,
            strokes: map.strokes.map((stroke) => ({
                id: stroke.id,
                color: stroke.color,
                width: stroke.width,
                points: stroke.points.map((point) => ({ ...point }))
            })),
            icons: map.icons.map((icon) => ({ ...icon })),
            decorations: map.decorations.map((decoration) => ({ ...decoration })),
            labels: map.labels.map((label) => ({ ...label })),
            layers: {
                rivers: map.layers.rivers.map((stroke) => ({
                    id: stroke.id,
                    color: stroke.color,
                    width: stroke.width,
                    points: stroke.points.map((point) => ({ ...point }))
                })),
                mountainChains: map.layers.mountainChains.map((decoration) => ({ ...decoration })),
                forestBelts: map.layers.forestBelts.map((decoration) => ({ ...decoration }))
            }
        };
    }

    private createEmptyMap(background: CampaignMapBackground = 'Parchment'): CampaignMap {
        return {
            background,
            backgroundImageUrl: '',
            strokes: [],
            icons: [],
            decorations: [],
            labels: [],
            layers: {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            }
        };
    }

    private createEmptyMapBoard(name: string, background: CampaignMapBackground = 'Parchment'): CampaignMapBoard {
        return {
            id: this.createId(),
            name,
            ...this.createEmptyMap(background)
        };
    }

    private cloneMapBoard(map: CampaignMapBoard): CampaignMapBoard {
        return {
            id: map.id,
            name: map.name,
            ...this.cloneMap(map)
        };
    }

    private loadMapBoard(map: CampaignMapBoard): void {
        this.currentMapId.set(map.id);
        this.workingMap.set(this.cloneMap(map));
        this.selectedIconId.set(null);
        this.iconLabelDraft.set('');
        this.mapNameDraft.set(map.name);
    }

    private async createRouteMapBoard(): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || !this.canModify() || this.creatingRouteMap) {
            return;
        }

        this.creatingRouteMap = true;

        const existingMaps = campaign.maps.length > 0
            ? campaign.maps.map((map) => this.cloneMapBoard(map))
            : [this.createEmptyMapBoard('Main Map', campaign.map.background)];
        const nextBoard = this.createEmptyMapBoard(`Map ${existingMaps.length + 1}`, existingMaps[0]?.background ?? campaign.map.background);
        const nextMaps = [...existingMaps, nextBoard];

        this.mapBoards.set(nextMaps);
        this.loadMapBoard(nextBoard);
        this.undoStack.set([]);
        this.redoStack.set([]);
        this.pendingDragHistory = null;
        this.saveState.set('saving');
        this.saveMessage.set('Creating map...');
        this.cdr.detectChanges();

        try {
            const saved = await this.store.updateCampaignMap(campaign.id, { activeMapId: nextBoard.id, maps: nextMaps });
            if (!saved) {
                this.saveState.set('error');
                this.saveMessage.set('Could not create a new map right now.');
                this.cdr.detectChanges();
                await this.router.navigate(this.mapListRoute(campaign.id), { replaceUrl: true });
                return;
            }

            this.lastLoadedMapSignature = this.mapLibrarySignature(nextMaps, nextBoard.id);
            this.saveState.set('saved');
            this.saveMessage.set(`Created ${nextBoard.name}.`);
            this.cdr.detectChanges();
            await this.router.navigate(this.mapEditRoute(campaign.id, nextBoard.id), { replaceUrl: true });
        } finally {
            this.creatingRouteMap = false;
        }
    }

    private mapListRoute(campaignId: string): string[] {
        return ['/campaigns', campaignId, 'maps'];
    }

    private mapViewRoute(campaignId: string, mapId: string): string[] {
        return ['/campaigns', campaignId, 'maps', mapId];
    }

    private mapEditRoute(campaignId: string, mapId: string): string[] {
        return ['/campaigns', campaignId, 'maps', mapId, 'edit'];
    }

    private mapRouteForCurrentMode(campaignId: string, mapId: string): string[] {
        return this.isEditorMode() ? this.mapEditRoute(campaignId, mapId) : this.mapViewRoute(campaignId, mapId);
    }

    private normalizeSettlementScale(value: string | null | undefined): SettlementScale {
        switch (value?.trim().toLowerCase()) {
            case 'hamlet':
                return 'Hamlet';
            case 'village':
                return 'Village';
            case 'town':
                return 'Town';
            case 'metropolis':
                return 'Metropolis';
            default:
                return 'City';
        }
    }

    private normalizeParchmentLayout(value: string | null | undefined): ParchmentLayout {
        switch (value?.trim().toLowerCase()) {
            case 'uniform':
                return 'Uniform';
            case 'archipelago':
                return 'Archipelago';
            case 'atoll':
                return 'Atoll';
            case 'world':
                return 'World';
            case 'equirectangular':
                return 'Equirectangular';
            default:
                return 'Continent';
        }
    }

    private normalizeCavernLayout(value: string | null | undefined): CavernLayout {
        switch (value?.trim().toLowerCase()) {
            case 'grandcavern':
            case 'grand cavern':
                return 'GrandCavern';
            case 'verticalchasm':
            case 'vertical chasm':
                return 'VerticalChasm';
            case 'crystalgrotto':
            case 'crystal grotto':
                return 'CrystalGrotto';
            case 'ruinedundercity':
            case 'ruined undercity':
                return 'RuinedUndercity';
            case 'lavatubes':
            case 'lava tubes':
                return 'LavaTubes';
            default:
                return 'TunnelNetwork';
        }
    }

    private defaultLabelText(tone: CampaignMapLabelTone): string {
        return tone === 'Feature' ? 'New Feature' : 'New Region';
    }

    private terrainLabel(type: CampaignMapDecorationType): string {
        return this.terrainOptions.find((option) => option.type === type)?.label ?? 'Terrain';
    }

    private defaultDecorationColor(type: CampaignMapDecorationType): string {
        switch (type) {
            case 'Mountain':
                return '#4b3a2a';
            case 'Forest':
                return '#507255';
            case 'Reef':
                return '#385f7a';
            case 'Ward':
                return '#a03d2f';
            default:
                return '#8a5a2b';
        }
    }

    private normalizeEditorColor(value: string | number | undefined, fallback: string): string {
        if (typeof value === 'string' && BRUSH_COLOR_OPTIONS.some((option) => option.value === value)) {
            return value;
        }

        return fallback;
    }

    private parseNameList(value: string): string[] {
        return value
            .split(/\r?\n|,/)
            .map((entry) => entry.trim())
            .filter((entry, index, entries) => entry.length > 0 && entries.indexOf(entry) === index)
            .slice(0, 20);
    }

    private createPlacedDecoration(type: CampaignMapDecorationType, point: CampaignMapPoint): CampaignMapDecoration {
        const scaleRange = type === 'Mountain'
            ? [1.1, 1.8]
            : type === 'Forest'
                ? [0.9, 1.45]
                : [0.85, 1.25];

        return {
            id: this.createId(),
            type,
            color: this.terrainColor(),
            x: point.x,
            y: point.y,
            scale: this.randomFloat(scaleRange[0], scaleRange[1]),
            rotation: this.randomFloat(-16, 16),
            opacity: this.randomFloat(0.5, 0.86)
        };
    }

    private appendTerrainDecoration(map: CampaignMap, decoration: CampaignMapDecoration): void {
        switch (decoration.type) {
            case 'Mountain':
                map.layers = {
                    ...map.layers,
                    mountainChains: [...map.layers.mountainChains, decoration]
                };
                break;
            case 'Forest':
                map.layers = {
                    ...map.layers,
                    forestBelts: [...map.layers.forestBelts, decoration]
                };
                break;
            default:
                map.decorations = [...map.decorations, decoration];
                break;
        }
    }

    private createRandomMap(background: CampaignMapBackground): CampaignMap {
        const seed = this.campaignSeed();
        return this.withSeededRandom(`${seed.hash}:${background}:${this.generationVariant}`, () => {
            const anchors = this.createGeneratedAnchors(background, seed);
            const strokes = [
                ...this.createBackdropStrokes(background, anchors, seed),
                ...this.createRouteNetworkStrokes(background, anchors, seed),
                ...this.createLandmarkDetailStrokes(background, anchors, seed)
            ];

            return {
                background,
                backgroundImageUrl: '',
                strokes: strokes.filter((stroke) => stroke.points.length > 1),
                icons: anchors.map((anchor) => ({
                    id: anchor.id,
                    type: anchor.type,
                    label: anchor.label,
                    x: anchor.x,
                    y: anchor.y
                })),
                decorations: this.createDecorations(background, anchors, seed),
                labels: this.createLabels(background, anchors, seed),
                layers: this.createTerrainLayers(background, anchors, seed)
            };
        });
    }

    private createGeneratedAnchors(background: CampaignMapBackground, seed: CampaignSeedProfile): GeneratedMapAnchor[] {
        const iconTypes = this.randomIconSequence(background, Math.max(6, Math.min(10, 6 + Math.round(seed.routeDensity * 4))));
        const centers = this.clusterCentersForBackground(background, seed);
        const anchors: GeneratedMapAnchor[] = [];

        iconTypes.forEach((iconType, index) => {
            const prominence: MapAnchorProminence = index < 3 || iconType === 'Keep' ? 'major' : 'minor';
            const preferredCenter = this.preferredClusterIndex(iconType, background, index, seed);
            const center = centers[Math.min(preferredCenter, centers.length - 1)] ?? centers[0];
            let point = this.offsetPoint(center, prominence === 'major' ? 0.08 : 0.12, prominence === 'major' ? 0.07 : 0.1);

            for (let attempt = 0; attempt < 14; attempt++) {
                const minimumDistance = prominence === 'major' ? 0.11 : 0.085;
                if (anchors.every((anchor) => Math.hypot(anchor.x - point.x, anchor.y - point.y) >= minimumDistance)) {
                    break;
                }

                point = this.offsetPoint(center, prominence === 'major' ? 0.1 : 0.14, prominence === 'major' ? 0.085 : 0.12);
            }

            anchors.push({
                id: this.createId(),
                type: iconType,
                label: this.randomLabel(iconType, background, index + this.randomInt(0, 2), seed),
                x: point.x,
                y: point.y,
                prominence
            });
        });

        return anchors;
    }

    private createBackdropStrokes(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile) {
        const palette = this.paletteForBackground(background);
        const center = this.averagePoint(anchors.map((anchor) => ({ x: anchor.x, y: anchor.y })));

        switch (background) {
            case 'City':
                return [
                    this.createGeneratedStroke(palette.ink, 5 + Math.round(seed.civilization * 2), this.createLoopPoints(center.x, center.y, 0.24, 0.18, 18, 0.012)),
                    this.createGeneratedStroke(palette.route, 3 + Math.round(seed.routeDensity * 2), this.createLoopPoints(center.x, center.y, 0.14, 0.1, 16, 0.01)),
                    this.createGeneratedStroke(palette.terrain, 3, this.createPath([
                        { x: 0.12, y: center.y + this.randomFloat(-0.03, 0.03) },
                        { x: 0.28, y: center.y - 0.04 },
                        { x: center.x, y: center.y },
                        { x: 0.76, y: center.y + 0.05 },
                        { x: 0.9, y: center.y + this.randomFloat(-0.02, 0.02) }
                    ])),
                    this.createGeneratedStroke(palette.terrain, 3, this.createPath([
                        { x: center.x - 0.03, y: 0.1 },
                        { x: center.x - 0.02, y: 0.28 },
                        { x: center.x, y: center.y },
                        { x: center.x + 0.04, y: 0.72 },
                        { x: center.x + 0.02, y: 0.9 }
                    ]))
                ];
            case 'Coast':
                return [
                    this.createGeneratedStroke(palette.terrain, 6 + seed.riverCount, this.createPath([
                        { x: 0.7, y: 0.04 },
                        { x: 0.76, y: 0.18 },
                        { x: 0.72, y: 0.31 },
                        { x: 0.82, y: 0.46 },
                        { x: 0.74, y: 0.62 },
                        { x: 0.8, y: 0.78 },
                        { x: 0.72, y: 0.96 }
                    ], 0.018)),
                    this.createGeneratedStroke(palette.route, 3, this.createPath([
                        { x: 0.12, y: 0.72 },
                        { x: 0.28, y: 0.64 },
                        { x: 0.42, y: 0.61 },
                        { x: 0.58, y: 0.56 },
                        { x: 0.7, y: 0.52 }
                    ], 0.014)),
                    this.createGeneratedStroke(palette.accent, 2, this.createLoopPoints(0.84, 0.26, 0.055, 0.04, 12, 0.008)),
                    this.createGeneratedStroke(palette.accent, 2, this.createLoopPoints(0.87, 0.58, 0.045, 0.032, 12, 0.008))
                ];
            case 'Cavern':
                return [
                    this.createGeneratedStroke(palette.terrain, 5 + Math.round(seed.danger * 2), this.createLoopPoints(center.x, center.y, 0.25, 0.16, 18, 0.02)),
                    this.createGeneratedStroke(palette.route, 4, this.createLoopPoints(center.x + 0.12, center.y - 0.14, 0.12, 0.08, 14, 0.016)),
                    this.createGeneratedStroke(palette.ink, 3, this.createPath([
                        { x: 0.14, y: 0.18 },
                        { x: 0.24, y: 0.28 },
                        { x: 0.4, y: 0.4 },
                        { x: 0.56, y: 0.46 },
                        { x: 0.72, y: 0.56 },
                        { x: 0.88, y: 0.72 }
                    ], 0.024))
                ];
            default:
                return [
                    this.createGeneratedStroke(palette.terrain, 4, this.createLoopPoints(center.x, center.y, 0.28, 0.2, 20, 0.018)),
                    this.createGeneratedStroke(palette.route, 3, this.createPath([
                        { x: 0.14, y: 0.22 },
                        { x: 0.24, y: 0.32 },
                        { x: 0.38, y: 0.4 },
                        { x: 0.56, y: 0.5 },
                        { x: 0.76, y: 0.68 }
                    ], 0.02)),
                    this.createGeneratedStroke(palette.accent, 2, this.createPath([
                        { x: 0.24, y: 0.14 },
                        { x: 0.28, y: 0.2 },
                        { x: 0.34, y: 0.24 },
                        { x: 0.42, y: 0.2 },
                        { x: 0.48, y: 0.14 }
                    ], 0.012))
                ];
        }
    }

    private createRouteNetworkStrokes(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile) {
        const palette = this.paletteForBackground(background);
        const majorAnchors = anchors
            .filter((anchor) => anchor.prominence === 'major' || anchor.type === 'Town' || anchor.type === 'Tower')
            .sort((left, right) => left.x - right.x);
        const routeStrokes = [] as Array<{ id: string; color: string; width: number; points: CampaignMapPoint[] }>;

        if (majorAnchors.length >= 2) {
            routeStrokes.push(this.createGeneratedStroke(palette.route, 5, this.createPath(majorAnchors, 0.018)));
        }

        const secondaryAnchors = anchors.filter((anchor) => !majorAnchors.some((candidate) => candidate.id === anchor.id));
        secondaryAnchors.forEach((anchor, index) => {
            if (index > Math.round(seed.routeDensity * 6) + 1) {
                return;
            }

            const nearestAnchor = this.findNearestAnchor(anchor, majorAnchors.length > 0 ? majorAnchors : anchors.filter((candidate) => candidate.id !== anchor.id));
            if (!nearestAnchor) {
                return;
            }

            const midpoint = {
                x: this.clampCoordinate((anchor.x + nearestAnchor.x) / 2 + this.randomFloat(-0.05, 0.05)),
                y: this.clampCoordinate((anchor.y + nearestAnchor.y) / 2 + this.randomFloat(-0.05, 0.05))
            };

            routeStrokes.push(this.createGeneratedStroke(
                index % 3 === 0 ? palette.accent : palette.ink,
                index % 3 === 0 ? 2 : 3,
                this.createPath([
                    { x: anchor.x, y: anchor.y },
                    midpoint,
                    { x: nearestAnchor.x, y: nearestAnchor.y }
                ], 0.01)
            ));
        });

        return routeStrokes;
    }

    private createLandmarkDetailStrokes(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile) {
        const palette = this.paletteForBackground(background);
        return anchors
            .filter((anchor) => anchor.prominence === 'major' || anchor.type === 'Danger' || anchor.type === 'Treasure')
            .slice(0, 3 + Math.round(seed.danger * 3))
            .map((anchor, index) => {
                const radiusX = anchor.prominence === 'major' ? 0.04 : 0.03;
                const radiusY = anchor.prominence === 'major' ? 0.028 : 0.022;
                return this.createGeneratedStroke(
                    index % 2 === 0 ? palette.ink : palette.accent,
                    anchor.prominence === 'major' ? 2 : 1,
                    this.createLoopPoints(anchor.x, anchor.y, radiusX, radiusY, 12, 0.006)
                );
            });
    }

    private createDecorations(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile): CampaignMapDecoration[] {
        const decorationTypes = this.decorationTypesForBackground(background);
        return anchors.flatMap((anchor, index) => {
            const decorationCount = anchor.prominence === 'major' ? 2 : (seed.wilderness > 0.55 ? 2 : 1);
            return Array.from({ length: decorationCount }, (_, offset) => {
                const point = this.offsetPoint({ x: anchor.x, y: anchor.y }, 0.06 + offset * 0.02, 0.05 + offset * 0.02);
                return {
                    id: this.createId(),
                    type: decorationTypes[(index + offset) % decorationTypes.length],
                    color: this.defaultDecorationColor(decorationTypes[(index + offset) % decorationTypes.length]),
                    x: point.x,
                    y: point.y,
                    scale: anchor.prominence === 'major' ? this.randomFloat(1.05, 1.45) : this.randomFloat(0.72, 1.08),
                    rotation: this.randomFloat(-18, 18),
                    opacity: this.randomFloat(0.3, 0.82)
                };
            });
        });
    }

    private createLabels(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile): CampaignMapLabel[] {
        const labels = this.labelCatalogForBackground(background, seed);
        const mapCenter = this.averagePoint(anchors.map((anchor) => ({ x: anchor.x, y: anchor.y })));
        const regionLabels: GeneratedMapTerrainLabel[] = [
            {
                text: labels.region,
                tone: 'Region',
                x: mapCenter.x,
                y: this.clampCoordinate(mapCenter.y - 0.18),
                rotation: this.randomFloat(-8, 8)
            },
            {
                text: labels.feature,
                tone: 'Feature',
                x: this.clampCoordinate(mapCenter.x + 0.18),
                y: this.clampCoordinate(mapCenter.y + 0.16),
                rotation: this.randomFloat(-18, 18)
            }
        ];

        return regionLabels.map((label) => ({
            id: this.createId(),
            text: label.text,
            tone: label.tone,
            x: label.x,
            y: label.y,
            rotation: label.rotation
        }));
    }

    private createTerrainLayers(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile): CampaignMap['layers'] {
        return {
            rivers: this.createRiverStrokes(background, anchors, seed),
            mountainChains: this.createMountainChainLayer(background, seed),
            forestBelts: this.createForestBeltLayer(background, anchors, seed)
        };
    }

    private randomIconSequence(background: CampaignMapBackground, iconCount: number): CampaignMapIconType[] {
        const themedSets: Record<CampaignMapBackground, readonly CampaignMapIconType[]> = {
            Parchment: ['Keep', 'Town', 'Town', 'Camp', 'Dungeon', 'Danger', 'Treasure', 'Tower', 'Portal', 'Camp'],
            City: ['Keep', 'Town', 'Town', 'Town', 'Tower', 'Dungeon', 'Danger', 'Treasure', 'Camp', 'Portal'],
            Coast: ['Keep', 'Town', 'Town', 'Camp', 'Camp', 'Danger', 'Treasure', 'Portal', 'Tower', 'Dungeon'],
            Cavern: ['Keep', 'Camp', 'Town', 'Dungeon', 'Dungeon', 'Danger', 'Treasure', 'Portal', 'Tower', 'Camp']
        };

        const baseSequence = themedSets[background];
        const head = baseSequence.slice(0, 3);
        const tail = this.shuffleArray(baseSequence.slice(3));
        return [...head, ...tail].slice(0, iconCount);
    }

    private randomLabel(iconType: CampaignMapIconType, background: CampaignMapBackground, index: number, seed: CampaignSeedProfile): string {
        const labels = MAP_LABELS_BY_BACKGROUND[background][iconType];
        const base = labels[index % labels.length];
        return iconType === 'Portal' && seed.mysticism > 0.6 ? `${base} Gate` : base;
    }

    private decorationTypesForBackground(background: CampaignMapBackground): readonly CampaignMapDecorationType[] {
        switch (background) {
            case 'City':
                return ['Ward', 'Hill', 'Forest'];
            case 'Coast':
                return ['Reef', 'Forest', 'Hill'];
            case 'Cavern':
                return ['Cave', 'Mountain', 'Ward'];
            default:
                return ['Forest', 'Hill', 'Mountain'];
        }
    }

    private labelCatalogForBackground(background: CampaignMapBackground, seed: CampaignSeedProfile): { region: string; feature: string } {
        switch (background) {
            case 'City':
                return { region: seed.regionName, feature: seed.featureName };
            case 'Coast':
                return { region: seed.regionName, feature: seed.featureName };
            case 'Cavern':
                return { region: seed.regionName, feature: seed.featureName };
            default:
                return { region: seed.regionName, feature: seed.featureName };
        }
    }

    private createRiverStrokes(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile): CampaignMap['layers']['rivers'] {
        const rivers: CampaignMap['layers']['rivers'] = [];
        const riverCount = Math.max(0, seed.riverCount + (background === 'Coast' ? 1 : 0));
        const center = this.averagePoint(anchors.map((anchor) => ({ x: anchor.x, y: anchor.y })));

        for (let index = 0; index < riverCount; index++) {
            const startX = background === 'Coast' ? this.randomFloat(0.08, 0.34) : this.randomFloat(0.18, 0.82);
            rivers.push(this.createGeneratedStroke('#385f7a', 3 + (index === 0 ? 1 : 0), this.createPath([
                { x: startX, y: 0.06 + this.randomFloat(0, 0.08) },
                { x: this.clampCoordinate((startX + center.x) / 2), y: this.randomFloat(0.26, 0.38) },
                { x: this.clampCoordinate(center.x + this.randomFloat(-0.08, 0.08)), y: center.y },
                { x: this.randomFloat(0.58, 0.92), y: 0.92 }
            ], 0.016)));
        }

        return rivers;
    }

    private createMountainChainLayer(background: CampaignMapBackground, seed: CampaignSeedProfile): CampaignMap['layers']['mountainChains'] {
        const count = Math.max(3, Math.round(seed.mountainDensity * 9));
        const origin = background === 'Cavern' ? { x: 0.28, y: 0.28 } : { x: 0.22, y: 0.22 };
        return Array.from({ length: count }, (_, index) => ({
            id: this.createId(),
            type: background === 'Cavern' ? 'Cave' : 'Mountain',
            color: this.defaultDecorationColor(background === 'Cavern' ? 'Cave' : 'Mountain'),
            x: this.clampCoordinate(origin.x + index * 0.07 + this.randomFloat(-0.03, 0.03)),
            y: this.clampCoordinate(origin.y + index * 0.05 + this.randomFloat(-0.04, 0.04)),
            scale: this.randomFloat(0.82, 1.42),
            rotation: this.randomFloat(-14, 14),
            opacity: this.randomFloat(0.4, 0.78)
        }));
    }

    private createForestBeltLayer(background: CampaignMapBackground, anchors: GeneratedMapAnchor[], seed: CampaignSeedProfile): CampaignMap['layers']['forestBelts'] {
        const count = Math.max(4, Math.round(seed.forestDensity * 12));
        const center = this.averagePoint(anchors.map((anchor) => ({ x: anchor.x, y: anchor.y })));
        return Array.from({ length: count }, (_, index) => {
            const point = this.offsetPoint({ x: center.x - 0.1 + (index % 3) * 0.06, y: center.y + 0.08 + Math.floor(index / 3) * 0.04 }, 0.07, 0.05);
            const type: CampaignMapDecorationType = background === 'Coast' ? 'Reef' : 'Forest';
            return {
                id: this.createId(),
                type,
                color: this.defaultDecorationColor(type),
                x: point.x,
                y: point.y,
                scale: this.randomFloat(0.72, 1.18),
                rotation: this.randomFloat(-12, 12),
                opacity: this.randomFloat(0.28, 0.74)
            };
        });
    }

    private createCampaignSeedProfile(campaign: Campaign | null): CampaignSeedProfile {
        if (!campaign) {
            return {
                hash: 'default-seed',
                suggestedBackground: 'Parchment',
                civilization: 0.5,
                mysticism: 0.4,
                danger: 0.4,
                wilderness: 0.5,
                routeDensity: 0.5,
                riverCount: 1,
                forestDensity: 0.5,
                mountainDensity: 0.5,
                regionName: 'The Amber Reach',
                featureName: 'The Pilgrim Road',
                summary: 'Balanced frontier seed.'
            };
        }

        const worldNoteText = campaign.worldNotes.map((note) => `${note.title} ${note.content}`);
        const sourceText = [campaign.name, campaign.setting, campaign.tone, campaign.summary, campaign.hook, ...worldNoteText].join(' ').toLowerCase();
        const civilization = this.keywordScore(sourceText, ['city', 'court', 'market', 'harbor', 'harbour', 'guild', 'ward', 'capital', 'kingdom']);
        const mysticism = this.keywordScore(sourceText, ['mystic', 'spirit', 'ghost', 'arcane', 'portal', 'veil', 'rune', 'divination', 'fey', 'magic']);
        const danger = this.keywordScore(sourceText, ['danger', 'war', 'cursed', 'enemy', 'threat', 'vault', 'dragon', 'riot', 'storm', 'dead']);
        const coast = this.keywordScore(sourceText, ['coast', 'harbor', 'sea', 'island', 'tide', 'reef', 'shore', 'ship']);
        const subterranean = this.keywordScore(sourceText, ['cavern', 'underworld', 'root', 'deep', 'underground', 'chasm', 'hollow', 'dungeon']);
        const wilderness = this.keywordScore(sourceText, ['forest', 'wild', 'road', 'frontier', 'camp', 'orchard', 'trail', 'marsh', 'ridge']);
        const suggestedBackground = coast > 0.58 ? 'Coast' : subterranean > 0.56 ? 'Cavern' : civilization > 0.6 ? 'City' : 'Parchment';
        const routeDensity = this.clampUnit((civilization + danger + this.toneRouteBias(campaign.tone)) / 3);
        const forestDensity = this.clampUnit((wilderness + (suggestedBackground === 'Parchment' ? 0.18 : 0)) / 1.18);
        const mountainDensity = this.clampUnit((danger + subterranean + this.toneDangerBias(campaign.tone)) / 3);
        const riverCount = suggestedBackground === 'Coast' ? 2 : routeDensity > 0.58 ? 2 : 1;
        const settingStem = this.titleStem(campaign.setting || campaign.name);
        const regionSuffix = suggestedBackground === 'Coast' ? 'Coast' : suggestedBackground === 'Cavern' ? 'Deep' : civilization > 0.55 ? 'Marches' : 'Reach';
        const featureSuffix = mysticism > 0.6 ? 'Way' : danger > 0.58 ? 'Pass' : 'Road';
        const noteTitleHash = campaign.worldNotes.map((note) => note.title).join('|');
        const hashSource = [campaign.name, campaign.setting, campaign.tone, campaign.summary, campaign.hook, noteTitleHash].join('|');
        const summary = `${campaign.tone} tone, ${campaign.worldNotes.length} notes, ${suggestedBackground.toLowerCase()} terrain bias.`;

        return {
            hash: this.hashString(hashSource),
            suggestedBackground,
            civilization,
            mysticism,
            danger,
            wilderness,
            routeDensity,
            riverCount,
            forestDensity,
            mountainDensity,
            regionName: `The ${settingStem} ${regionSuffix}`,
            featureName: `${this.titleStem(campaign.name)} ${featureSuffix}`,
            summary
        };
    }

    private keywordScore(source: string, keywords: ReadonlyArray<string>): number {
        const hits = keywords.reduce((count, keyword) => count + (source.includes(keyword) ? 1 : 0), 0);
        return this.clampUnit(hits / Math.max(3, keywords.length / 2));
    }

    private toneRouteBias(tone: CampaignTone): number {
        switch (tone) {
            case 'Political Intrigue':
            case 'Epic War':
            case 'Heroic':
                return 0.8;
            case 'Mystic':
            case 'Cosmic':
                return 0.45;
            default:
                return 0.58;
        }
    }

    private toneDangerBias(tone: CampaignTone): number {
        switch (tone) {
            case 'Horror':
            case 'Grimdark':
            case 'Dark Fantasy':
            case 'Heroic Tragedy':
                return 0.84;
            case 'Whimsical':
                return 0.28;
            default:
                return 0.56;
        }
    }

    private titleStem(value: string): string {
        const words = value.replace(/[^a-zA-Z0-9\s'-]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2);
        return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Amber';
    }

    private clampUnit(value: number): number {
        if (!Number.isFinite(value)) {
            return 0.5;
        }

        return Math.max(0, Math.min(1, value));
    }

    private withSeededRandom<T>(seed: string, callback: () => T): T {
        const previousRandomSource = this.randomSource;
        this.randomSource = this.createSeededRandom(seed);
        try {
            return callback();
        } finally {
            this.randomSource = previousRandomSource;
        }
    }

    private createSeededRandom(seed: string): () => number {
        let state = 2166136261;
        for (let index = 0; index < seed.length; index++) {
            state ^= seed.charCodeAt(index);
            state = Math.imul(state, 16777619);
        }

        return () => {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    private hashString(value: string): string {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index++) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }

        return (hash >>> 0).toString(16);
    }

    private randomEdgePoint(edge: number): CampaignMapPoint {
        switch (edge) {
            case 0:
                return { x: this.randomFloat(0.1, 0.9), y: this.randomFloat(0.08, 0.18) };
            case 1:
                return { x: this.randomFloat(0.82, 0.92), y: this.randomFloat(0.1, 0.9) };
            case 2:
                return { x: this.randomFloat(0.1, 0.9), y: this.randomFloat(0.82, 0.92) };
            default:
                return { x: this.randomFloat(0.08, 0.18), y: this.randomFloat(0.1, 0.9) };
        }
    }

    private smoothStrokePoints(points: CampaignMapPoint[]): CampaignMapPoint[] {
        return points.map((point, index) => {
            if (index === 0 || index === points.length - 1) {
                return point;
            }

            const previous = points[index - 1];
            const next = points[index + 1];

            return {
                x: this.clampCoordinate((previous.x + point.x * 2 + next.x) / 4),
                y: this.clampCoordinate((previous.y + point.y * 2 + next.y) / 4)
            };
        });
    }

    private paletteForBackground(background: CampaignMapBackground): { ink: string; route: string; terrain: string; accent: string } {
        switch (background) {
            case 'City':
                return { ink: '#4b3a2a', route: '#8a5a2b', terrain: '#385f7a', accent: '#a03d2f' };
            case 'Coast':
                return { ink: '#4b3a2a', route: '#385f7a', terrain: '#8a5a2b', accent: '#507255' };
            case 'Cavern':
                return { ink: '#4b3a2a', route: '#507255', terrain: '#8a5a2b', accent: '#385f7a' };
            default:
                return { ink: '#4b3a2a', route: '#8a5a2b', terrain: '#507255', accent: '#a03d2f' };
        }
    }

    private clusterCentersForBackground(background: CampaignMapBackground, seed: CampaignSeedProfile): CampaignMapPoint[] {
        switch (background) {
            case 'City':
                return [
                    { x: 0.32 + seed.civilization * 0.05, y: 0.58 },
                    { x: 0.56, y: 0.42 + seed.mysticism * 0.04 },
                    { x: 0.76, y: 0.58 }
                ];
            case 'Coast':
                return [
                    { x: 0.28, y: 0.66 },
                    { x: 0.52, y: 0.48 },
                    { x: 0.7, y: 0.24 + seed.danger * 0.08 }
                ];
            case 'Cavern':
                return [
                    { x: 0.26, y: 0.28 },
                    { x: 0.52 + seed.mysticism * 0.04, y: 0.52 },
                    { x: 0.74, y: 0.68 }
                ];
            default:
                return [
                    { x: 0.24, y: 0.32 + seed.wilderness * 0.04 },
                    { x: 0.5, y: 0.5 },
                    { x: 0.74, y: 0.26 + seed.danger * 0.05 }
                ];
        }
    }

    private preferredClusterIndex(iconType: CampaignMapIconType, background: CampaignMapBackground, index: number, seed: CampaignSeedProfile): number {
        if (iconType === 'Keep') {
            return seed.civilization > 0.55 ? 1 : 0;
        }

        if (iconType === 'Town') {
            return index % 2;
        }

        if (iconType === 'Camp') {
            return background === 'Coast' ? 0 : seed.wilderness > 0.6 ? 2 : 1;
        }

        if (iconType === 'Dungeon' || iconType === 'Danger' || iconType === 'Treasure' || iconType === 'Portal') {
            return 2;
        }

        return 1;
    }

    private offsetPoint(center: CampaignMapPoint, radiusX: number, radiusY: number): CampaignMapPoint {
        return {
            x: this.clampCoordinate(center.x + this.randomFloat(-radiusX, radiusX)),
            y: this.clampCoordinate(center.y + this.randomFloat(-radiusY, radiusY))
        };
    }

    private averagePoint(points: CampaignMapPoint[]): CampaignMapPoint {
        if (points.length === 0) {
            return { x: 0.5, y: 0.5 };
        }

        const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
        return {
            x: this.clampCoordinate(total.x / points.length),
            y: this.clampCoordinate(total.y / points.length)
        };
    }

    private createGeneratedStroke(color: string, width: number, points: CampaignMapPoint[]) {
        return {
            id: this.createId(),
            color,
            width,
            points: this.smoothStrokePoints(points.map((point) => ({ x: this.clampCoordinate(point.x), y: this.clampCoordinate(point.y) })))
        };
    }

    private createLoopPoints(centerX: number, centerY: number, radiusX: number, radiusY: number, segments: number, jitter: number): CampaignMapPoint[] {
        const loop = Array.from({ length: segments }, (_, index) => {
            const angle = (Math.PI * 2 * index) / segments;
            return {
                x: this.clampCoordinate(centerX + Math.cos(angle) * radiusX + this.randomFloat(-jitter, jitter)),
                y: this.clampCoordinate(centerY + Math.sin(angle) * radiusY + this.randomFloat(-jitter, jitter))
            };
        });

        return [...loop, loop[0]];
    }

    private createPath(points: CampaignMapPoint[], jitter = 0): CampaignMapPoint[] {
        return points.map((point, index) => {
            if (index === 0 || index === points.length - 1 || jitter === 0) {
                return { x: this.clampCoordinate(point.x), y: this.clampCoordinate(point.y) };
            }

            return {
                x: this.clampCoordinate(point.x + this.randomFloat(-jitter, jitter)),
                y: this.clampCoordinate(point.y + this.randomFloat(-jitter, jitter))
            };
        });
    }

    private findNearestAnchor(anchor: GeneratedMapAnchor, anchors: GeneratedMapAnchor[]): GeneratedMapAnchor | null {
        let nearest: GeneratedMapAnchor | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        anchors.forEach((candidate) => {
            if (candidate.id === anchor.id) {
                return;
            }

            const distance = Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);
            if (distance < nearestDistance) {
                nearest = candidate;
                nearestDistance = distance;
            }
        });

        return nearest;
    }

    private shuffleArray<T>(items: ReadonlyArray<T>): T[] {
        const next = [...items];
        for (let index = next.length - 1; index > 0; index--) {
            const swapIndex = this.randomInt(0, index);
            [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        }

        return next;
    }

    private randomFloat(min: number, max: number): number {
        return min + this.randomSource() * (max - min);
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(this.randomFloat(min, max + 1));
    }

    private createId(): string {
        return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    private getRelativePoint(clientX: number, clientY: number): CampaignMapPoint | null {
        const board = this.mapBoard()?.nativeElement;
        if (!board) {
            return null;
        }

        const rect = board.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return null;
        }

        return {
            x: this.clampCoordinate((clientX - rect.left) / rect.width),
            y: this.clampCoordinate((clientY - rect.top) / rect.height)
        };
    }

    private clampCoordinate(value: number): number {
        if (!Number.isFinite(value)) {
            return 0.5;
        }

        return Math.max(0, Math.min(1, value));
    }

    private mapSignature(map: CampaignMap | null | undefined): string {
        return JSON.stringify(map ?? this.createEmptyMap());
    }

    private mapLibrarySignature(maps: CampaignMapBoard[], activeMapId: string): string {
        return JSON.stringify({ activeMapId, maps });
    }

    private historyEntrySignature(entry: MapEditorHistoryEntry): string {
        return JSON.stringify(entry);
    }

    private normalizeBackground(value: string | number): CampaignMapBackground {
        switch (value) {
            case 'City':
            case 'Coast':
            case 'Cavern':
                return value;
            default:
                return 'Parchment';
        }
    }

    private defaultIconLabel(iconType: CampaignMapIconType): string {
        return this.iconOptions.find((option) => option.type === iconType)?.label ?? 'Landmark';
    }

    private shouldIgnoreShortcut(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        if (target.isContentEditable) {
            return true;
        }

        return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    }
}