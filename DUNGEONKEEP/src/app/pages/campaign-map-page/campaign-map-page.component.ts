import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MapArtBattlemapLocale, MapArtGenerationModalComponent, MapArtGenerationOptions, MapArtLighting } from '../../components/map-art-generation-modal/map-art-generation-modal.component';
import { TokenImageCropModalComponent } from '../../components/token-image-crop-modal/token-image-crop-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { mergeCampaignNpcSources } from '../../data/campaign-npc.helpers';
import { loadCampaignNpcDrafts } from '../../data/campaign-npc.storage';
import { CampaignNpc } from '../../models/campaign-npc.models';
import { Campaign, CampaignMap, CampaignMapBackground, CampaignMapBoard, CampaignMapDecoration, CampaignMapDecorationType, CampaignMapIcon, CampaignMapIconType, CampaignMapLabel, CampaignMapLabelFontFamily, CampaignMapLabelTone, CampaignMapPoint, CampaignMapStroke, CampaignMapToken, CampaignMapWall, CampaignTone, Character, DEFAULT_CAMPAIGN_MAP_GRID_COLOR, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y, DEFAULT_CAMPAIGN_MAP_GRID_ROWS } from '../../models/dungeon.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { CampaignMapTokenMovedEvent, CampaignMapVisionUpdatedEvent, CampaignRealtimeService } from '../../state/campaign-realtime.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { SessionService } from '../../state/session.service';

type MapTool = 'select' | 'draw' | 'wall' | 'erase' | 'icon' | 'terrain' | 'label' | 'token';
type MapConfirmAction = 'clear-map' | 'delete-icon' | 'delete-token' | 'delete-label' | 'delete-stroke' | 'delete-wall' | 'delete-map' | null;
type MapLineKind = 'drawing' | 'wall';
type MapAnchorProminence = 'major' | 'minor';
type SettlementScale = 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis';
type ParchmentLayout = 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular';
type CavernLayout = 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes';

interface MapVisionMemoryEntryState {
    key: string;
    polygons: CampaignMapPoint[][];
    lastOrigin: CampaignMapPoint | null;
    lastPolygonHash: string;
    revision: number;
}

interface PendingMapVisionMemorySnapshot {
    campaignId: string;
    savedAt: number;
    entries: Record<string, MapVisionMemoryEntryState>;
}

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

const TOKEN_SIZE_OPTIONS: DropdownOption[] = [
    { value: 0.5, label: 'Small', description: 'Fits within half a map grid square.' },
    { value: 1, label: 'Medium', description: 'Fits within a single map grid square.' },
    { value: 2, label: 'Large', description: 'Expands the token to span two grid squares across.' },
    { value: 4, label: 'Huge', description: 'Large footprint for major pieces on the board.' }
];

const MAP_BOARD_HEIGHT_RATIO = 0.7;
const MAP_TOKEN_GRID_SPANS = [0.5, 1, 2, 4] as const;
const MAP_GRID_VISIBILITY_STORAGE_KEY = 'dungeonkeep.campaign-map.show-grid';
const MAP_GRID_CONTROLS_EXPANDED_STORAGE_KEY = 'dungeonkeep.campaign-map.grid-controls-expanded';
const MAP_PLACEMENT_HINT_VISIBILITY_STORAGE_KEY = 'dungeonkeep.campaign-map.show-placement-hint';
const MAP_AUTOSAVE_DELAY_MS = 450;
const MAP_VISION_MEMORY_LIMIT = 40;
const MAP_VISION_FEET_PER_GRID_SQUARE = 5;
const MAP_VISION_MEMORY_ORIGIN_THRESHOLD = 0.02;
const MAP_VISION_MEMORY_PERSIST_DELAY_MS = 1200;
const MAP_VISION_MEMORY_PENDING_STORAGE_KEY = 'dungeonkeep.campaign-map.pending-vision-memory';
const MAP_VISION_MEMORY_PENDING_STORAGE_MAX_AGE_MS = 1000 * 60 * 30;
const MAP_ART_STORAGE_MAX_DIMENSION = 1600;
const MAP_ART_STORAGE_TARGET_DATA_URL_LENGTH = 450_000;

const MAP_BACKGROUND_OPTIONS: DropdownOption[] = [
    { value: 'Parchment', label: 'Parchment', description: 'Warm paper tones for hand-drawn lines, sketches, and lore maps.' },
    { value: 'City', label: 'Settlement', description: 'Sharper streets, walls, and district lines for towns and cities.' },
    { value: 'Coast', label: 'Coast', description: 'Sea-washed tones for harbors, islands, shoreline marks, and nautical details.' },
    { value: 'Cavern', label: 'Cavern', description: 'Deep mineral tones for tunnels, roots, and underworld spaces.' },
    { value: 'Battlemap', label: 'Encounter Map', description: 'Top-down encounter board for streets, interiors, woods, roads, cliffs, and other tactical scenes.' }
];

const BRUSH_COLOR_OPTIONS: DropdownOption[] = [
    { value: '#8a5a2b', label: 'Amber Ink', description: 'Default ink for roads, notes, and hand-drawn lines.' },
    { value: '#4b3a2a', label: 'Walnut Ink', description: 'Strong dark line for walls, borders, and keeps.' },
    { value: '#507255', label: 'Moss Ink', description: 'Great for forests, roots, and hidden trails.' },
    { value: '#385f7a', label: 'Tide Ink', description: 'Useful for rivers, coasts, and magical wards.' },
    { value: '#a03d2f', label: 'Cinder Ink', description: 'Use for danger zones, enemy paths, and warnings.' }
];

const BRUSH_SIZE_OPTIONS: DropdownOption[] = [
    { value: 3, label: 'Fine', description: 'Thin detail lines and footpaths.' },
    { value: 5, label: 'Standard', description: 'General-purpose line work.' },
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
        Camp: ['Guard Post', 'Supply Yard', 'Refuge Court'],
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
    },
    Battlemap: {
        Keep: ['Gatehouse', 'Barricade Hold', 'Watch Post'],
        Town: ['Market Lane', 'Bridge Crossing', 'Courtyard'],
        Camp: ['Supply Wagons', 'Fire Ring', 'War Camp'],
        Dungeon: ['Collapsed Hall', 'Crypt Entrance', 'Ritual Chamber'],
        Danger: ['Kill Zone', 'Arrow Nest', 'Cracked Edge'],
        Treasure: ['Locked Chest', 'Spoils Crate', 'Relic Pedestal'],
        Portal: ['Rune Circle', 'Shadow Gate', 'Blink Arch'],
        Tower: ['Bell Loft', 'Sniper Roost', 'Mage Perch']
    }
};

@Component({
    selector: 'app-campaign-map-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent, ConfirmModalComponent, MapArtGenerationModalComponent, TokenImageCropModalComponent],
    templateUrl: './campaign-map-page.component.html',
    styleUrl: './campaign-map-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignMapPageComponent {
    private static readonly MAX_HISTORY_ENTRIES = 80;
    private static readonly MAP_OVERLAY_HINT_LUMINANCE_THRESHOLD = 0.58;

    readonly store = inject(DungeonStoreService);
    private readonly session = inject(SessionService);
    private readonly campaignRealtime = inject(CampaignRealtimeService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly mapBoard = viewChild<ElementRef<HTMLDivElement>>('mapBoard');
    private readonly mapBoardShell = viewChild<ElementRef<HTMLDivElement>>('mapBoardShell');
    private readonly mapGuidePanel = viewChild<ElementRef<HTMLElement>>('mapGuidePanel');

    readonly campaignId = signal('');
    readonly routeMapId = signal('');
    readonly routeMode = signal<'view' | 'edit'>('view');
    readonly workingMap = signal<CampaignMap>(this.createEmptyMap());
    readonly mapBoards = signal<CampaignMapBoard[]>([]);
    readonly currentMapId = signal('');
    readonly mapNameDraft = signal('');
    readonly activeTool = signal<MapTool>('select');
    readonly mapOverlayHintUseDarkText = signal(false);
    readonly showPlacementHint = signal(this.readStoredPlacementHintVisibility());
    readonly pendingIconType = signal<CampaignMapIconType | null>(null);
    readonly pendingTerrainType = signal<CampaignMapDecorationType | null>(null);
    readonly selectedDecorationId = signal<string | null>(null);
    readonly selectedIconId = signal<string | null>(null);
    readonly selectedLabelId = signal<string | null>(null);
    readonly selectedStrokeId = signal<string | null>(null);
    readonly selectedWallId = signal<string | null>(null);
    readonly selectedTokenId = signal<string | null>(null);
    readonly iconLabelDraft = signal('');
    readonly tokenNameDraft = signal('');
    readonly tokenNoteDraft = signal('');
    readonly tokenAssignmentDraft = signal('none');
    readonly tokenPlacementCharacterId = signal('');
    readonly tokenPlacementNpcId = signal('');
    readonly tokenPlacementAssignedUserId = signal<string | null>(null);
    readonly tokenPlacementAssignedCharacterId = signal<string | null>(null);
    readonly tokenPlacementNameDraft = signal('Token');
    readonly tokenPlacementNoteDraft = signal('');
    readonly tokenPlacementImageUrl = signal('');
    readonly tokenPlacementSize = signal(1);
    readonly tokenUploadFeedback = signal('');
    readonly pendingTokenImageLoadFailed = signal(false);
    readonly failedTokenImages = signal<Record<string, string>>({});
    readonly tokenCropModalOpen = signal(false);
    readonly tokenCropSourceImageUrl = signal('');
    readonly tokenCropSourceName = signal('Token');
    readonly labelTextDraft = signal('New Region');
    readonly labelToneDraft = signal<CampaignMapLabelTone>('Region');
    readonly mapArtModalOpen = signal(false);
    readonly settlementNamesDraft = signal('');
    readonly regionNamesDraft = signal('');
    readonly ruinNamesDraft = signal('');
    readonly cavernNamesDraft = signal('');
    readonly separateLabelsDraft = signal(true);
    readonly additionalArtDirectionDraft = signal('');
    readonly settlementScale = signal<SettlementScale>('City');
    readonly parchmentLayout = signal<ParchmentLayout>('Continent');
    readonly cavernLayout = signal<CavernLayout>('TunnelNetwork');
    readonly battlemapLocale = signal<MapArtBattlemapLocale>('ForestClearing');
    readonly lighting = signal<MapArtLighting>('Day');
    readonly brushColor = signal('#8a5a2b');
    readonly terrainColor = signal('#8a5a2b');
    readonly brushWidth = signal(5);
    readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
    readonly saveMessage = signal('');
    readonly mapNotice = signal('');
    readonly hasUnsavedChanges = signal(false);
    readonly confirmAction = signal<MapConfirmAction>(null);
    readonly isDrawing = signal(false);
    readonly isAiArtGenerating = signal(false);
    readonly showGrid = signal(this.readStoredGridVisibility());
    readonly gridControlsExpanded = signal(this.readStoredGridControlsExpanded());
    readonly undoStack = signal<MapEditorHistoryEntry[]>([]);
    readonly redoStack = signal<MapEditorHistoryEntry[]>([]);
    readonly isFullscreen = signal(false);
    readonly showGuide = signal(false);
    readonly showWallsInEditor = signal(true);
    readonly showWallsInViewer = signal(false);
    readonly showVisionPreview = signal(false);
    readonly visionExploration = signal<Record<string, MapVisionMemoryEntryState>>({});
    readonly ctrlPolylineKind = signal<MapLineKind | null>(null);
    readonly ctrlPolylinePoints = signal<CampaignMapPoint[]>([]);
    readonly ctrlPolylinePreviewPoint = signal<CampaignMapPoint | null>(null);
    readonly ctrlPolylineColor = signal(this.brushColor());
    readonly ctrlPolylineWidth = signal(this.brushWidth());

    readonly backgroundOptions = MAP_BACKGROUND_OPTIONS;
    readonly brushColorOptions = BRUSH_COLOR_OPTIONS;
    readonly terrainColorOptions = BRUSH_COLOR_OPTIONS;
    readonly brushSizeOptions = BRUSH_SIZE_OPTIONS;
    readonly tokenSizeOptions = TOKEN_SIZE_OPTIONS;
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
    readonly campaignReady = computed(() => this.selectedCampaign()?.detailsLoaded === true);

    readonly canEdit = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return false;
        }

        return campaign.currentUserRole === 'Owner';
    });
    readonly isEditorMode = computed(() => this.routeMode() === 'edit');
    readonly isEditorLocked = computed(() => this.isAiArtGenerating());
    readonly canModify = computed(() => this.canEdit() && this.isEditorMode() && !this.isEditorLocked());
    readonly showWalls = computed(() => this.isEditorMode() ? this.showWallsInEditor() : this.showWallsInViewer());
    readonly canSeeWallOutlines = computed(() => this.isEditorMode() || this.canEdit());
    readonly showWallOutlines = computed(() => this.canSeeWallOutlines() && this.showWalls());
    readonly visibleLineCount = computed(() => {
        const map = this.workingMap();
        return map.strokes.length + map.layers.rivers.length + (this.showWallOutlines() ? map.walls.length : 0);
    });
    readonly isMapVisuallyEmpty = computed(() => {
        const map = this.workingMap();
        return !map.backgroundImageUrl
            && map.strokes.length === 0
            && (!this.canSeeWallOutlines() || map.walls.length === 0)
            && map.icons.length === 0
            && map.tokens.length === 0
            && map.decorations.length === 0
            && map.labels.length === 0
            && map.layers.rivers.length === 0
            && map.layers.mountainChains.length === 0
            && map.layers.forestBelts.length === 0;
    });
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
    readonly currentUserId = computed(() => this.session.currentUser()?.id ?? '');
    readonly isRefreshingCampaignData = computed(() => {
        const campaignId = this.campaignId();
        return !!campaignId && this.store.isCampaignDetailsLoading(campaignId);
    });
    readonly currentMapBoard = computed(() => {
        const currentMapId = this.currentMapId();
        const localMapBoards = this.mapBoards();
        const localMatch = localMapBoards.find((map) => map.id === currentMapId) ?? localMapBoards[0] ?? null;
        if (localMatch) {
            return localMatch;
        }

        const campaign = this.selectedCampaign();
        if (!campaign?.maps?.length) {
            return null;
        }

        return campaign.maps.find((map) => map.id === currentMapId)
            ?? campaign.maps.find((map) => map.id === campaign.activeMapId)
            ?? campaign.maps[0]
            ?? null;
    });
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
    readonly selectedToken = computed(() => {
        const tokenId = this.selectedTokenId();
        if (!tokenId) {
            return null;
        }

        return this.workingMap().tokens.find((token) => token.id === tokenId) ?? null;
    });
    readonly singleAssignedTokenId = computed(() => {
        const assignedTokens = this.workingMap().tokens.filter((token) => this.isTokenAssignedToCurrentUser(token));
        return assignedTokens.length === 1 ? assignedTokens[0]?.id ?? null : null;
    });
    readonly selectedLabel = computed(() => {
        const labelId = this.selectedLabelId();
        if (!labelId) {
            return null;
        }

        return this.workingMap().labels.find((label) => label.id === labelId) ?? null;
    });
    readonly selectedStroke = computed(() => {
        const strokeId = this.selectedStrokeId();
        if (!strokeId) {
            return null;
        }

        return this.workingMap().strokes.find((stroke) => stroke.id === strokeId) ?? null;
    });
    readonly selectedWall = computed(() => {
        const wallId = this.selectedWallId();
        if (!wallId) {
            return null;
        }

        return this.workingMap().walls.find((wall) => wall.id === wallId) ?? null;
    });
    readonly selectedDecoration = computed(() => {
        const decorationId = this.selectedDecorationId();
        if (!decorationId) {
            return null;
        }

        return this.allDecorations().find((decoration) => decoration.id === decorationId) ?? null;
    });
    readonly campaignCharacters = computed(() => {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return [];
        }

        return this.store.characters()
            .filter((character) => this.isCharacterInCampaign(character, campaignId))
            .sort((left, right) => left.name.localeCompare(right.name));
    });
    readonly campaignNpcs = computed<CampaignNpc[]>(() => {
        const campaign = this.selectedCampaign();
        const campaignId = this.campaignId();
        if (!campaign || !campaignId) {
            return [];
        }

        return mergeCampaignNpcSources(campaign.npcs, campaign.campaignNpcs ?? [], loadCampaignNpcDrafts(campaignId) ?? []);
    });
    readonly characterTokenOptions = computed<DropdownOption[]>(() => {
        const options: DropdownOption[] = [
            {
                value: '',
                label: 'Choose a character',
                description: 'Place a token using a party character portrait and auto-assign control.'
            }
        ];

        options.push(...this.campaignCharacters()
            .map((character) => ({
                value: character.id,
                label: character.name,
                description: character.ownerDisplayName
                    ? `${character.ownerDisplayName} will automatically control this token.`
                    : 'This token will stay linked to the selected character.',
                group: 'Character Portraits'
            } satisfies DropdownOption)));

        return options;
    });
    readonly npcTokenOptions = computed<DropdownOption[]>(() => {
        const options: DropdownOption[] = [
            {
                value: '',
                label: 'Choose an NPC',
                description: 'Place a token using a campaign NPC portrait.'
            }
        ];

        options.push(...this.campaignNpcs()
            .map((npc) => ({
                value: npc.id,
                label: npc.name,
                description: npc.title || npc.classOrRole || npc.location || 'Campaign NPC portrait',
                group: 'NPC Portraits'
            } satisfies DropdownOption)));

        return options;
    });
    readonly tokenAssignmentOptions = computed<DropdownOption[]>(() => {
        const options: DropdownOption[] = [
            {
                value: 'none',
                label: 'Unassigned',
                description: 'Only campaign owners can move an unassigned token.'
            }
        ];

        const memberOptions = (this.selectedCampaign()?.members ?? [])
            .filter((member) => member.status === 'Active' && !!member.userId)
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
            .map((member) => ({
                value: `user:${member.userId}`,
                label: member.displayName,
                description: 'This player can move the token on the active map.',
                group: 'Players'
            } satisfies DropdownOption));

        const characterOptions = this.campaignCharacters().map((character) => ({
            value: `character:${character.id}`,
            label: character.name,
            description: character.ownerDisplayName
                ? `${character.ownerDisplayName} controls this character.`
                : 'The owner of this character can move the token.',
            group: 'Characters'
        } satisfies DropdownOption));

        options.push(...memberOptions, ...characterOptions);

        const selectedToken = this.selectedToken();
        if (selectedToken?.assignedCharacterId && !characterOptions.some((option) => option.value === `character:${selectedToken.assignedCharacterId}`)) {
            options.push({
                value: `character:${selectedToken.assignedCharacterId}`,
                label: 'Unavailable character',
                description: 'This token is still assigned to a character that is not currently available in the campaign.',
                group: 'Characters'
            });
        }

        if (selectedToken?.assignedUserId && !memberOptions.some((option) => option.value === `user:${selectedToken.assignedUserId}`)) {
            options.push({
                value: `user:${selectedToken.assignedUserId}`,
                label: 'Unavailable player',
                description: 'This token is still assigned to a player who is not currently available in the campaign.',
                group: 'Players'
            });
        }

        return options;
    });
    readonly activeIconOption = computed(() => this.iconOptions.find((option) => option.type === this.pendingIconType()) ?? null);
    readonly activeTerrainOption = computed(() => this.terrainOptions.find((option) => option.type === this.pendingTerrainType()) ?? null);
    readonly previewableTokens = computed(() => this.workingMap().tokens.filter((token) => this.canEdit() || this.canControlToken(token)));
    readonly automaticVisionTokens = computed(() => {
        if (this.canEdit() || !this.workingMap().visionEnabled) {
            return [];
        }
        return this.previewableTokens();
    });
    readonly visionPreviewToken = computed(() => {
        const token = this.selectedToken();
        if (!token) {
            return null;
        }

        return this.canEdit() || this.canControlToken(token) ? token : null;
    });
    readonly canPreviewVision = computed(() => this.previewableTokens().length > 0);
    readonly visionPreviewRangeFeet = computed(() => {
        const token = this.visionPreviewToken();
        return token ? this.resolveTokenVisionRangeFeet(token) : 0;
    });
    readonly visionPreviewRangeSquares = computed(() => {
        const rangeFeet = this.visionPreviewRangeFeet();
        return rangeFeet > 0 ? this.visionRangeSquares(rangeFeet) : 0;
    });
    readonly visionPreviewSummary = computed(() => {
        const token = this.visionPreviewToken();
        if (!token) {
            return 'Select a token to preview line of sight.';
        }

        const assignedCharacter = token.assignedCharacterId
            ? this.campaignCharacters().find((character) => character.id === token.assignedCharacterId) ?? null
            : null;
        const rangeFeet = this.resolveTokenVisionRangeFeet(token);
        const rangeSquares = this.visionRangeSquares(rangeFeet);

        if (assignedCharacter) {
            return `${assignedCharacter.name} reveals roughly ${rangeFeet} ft of sight across about ${rangeSquares} grid squares.`;
        }

        return `This token reveals roughly ${rangeFeet} ft of sight across about ${rangeSquares} grid squares.`;
    });
    readonly temporaryVisionPreviewActive = computed(() => this.shiftKeyPressed() && !!this.visionPreviewToken());
    readonly manualVisionOverlayActive = computed(() => (this.showVisionPreview() || this.temporaryVisionPreviewActive()) && !!this.visionPreviewToken());
    readonly activeVisionTokens = computed(() => {
        const automaticTokens = this.automaticVisionTokens();
        if (automaticTokens.length > 0) {
            return automaticTokens;
        }

        const token = this.visionPreviewToken();
        return this.manualVisionOverlayActive() && token ? [token] : [];
    });
    readonly visionOverlayActive = computed(() => this.automaticVisionTokens().length > 0 || this.manualVisionOverlayActive());
    readonly currentVisionPolygon = computed(() => {
        const token = this.visionPreviewToken();
        if (!this.manualVisionOverlayActive() || !token) {
            return [];
        }

        return this.buildVisionPolygon(token);
    });
    readonly activeVisionPolygons = computed(() => {
        return this.activeVisionTokens()
            .map((token) => this.buildVisionPolygon(token))
            .filter((polygon) => polygon.length >= 3);
    });
    readonly visionPolygonPoints = computed(() => this.activeVisionPolygons().map((polygon) => this.formatVisionPolygonPoints(polygon)));
    readonly primaryVisionPolygon = computed(() => {
        const polygons = this.activeVisionPolygons();
        return polygons.length === 1 ? polygons[0] : [];
    });
    readonly visionClipPath = computed(() => {
        const polygon = this.primaryVisionPolygon();
        if (!this.visionOverlayActive() || polygon.length < 3) {
            return 'none';
        }

        return `polygon(${polygon.map((point) => `${(point.x * 100).toFixed(2)}% ${(point.y * 100).toFixed(2)}%`).join(', ')})`;
    });
    readonly exploredVisionPolygonPoints = computed(() => {
        const tokens = this.activeVisionTokens();
        if (!tokens.length) {
            return [];
        }

        const polygonPoints = new Set<string>();
        for (const token of tokens) {
            for (const memory of this.visionMemoryEntriesForToken(token)) {
                for (const polygon of memory.polygons ?? []) {
                    polygonPoints.add(this.formatVisionPolygonPoints(polygon));
                }
            }
        }

        return [...polygonPoints];
    });
    readonly hasVisionMemory = computed(() => {
        const token = this.selectedToken();
        if (token) {
            return this.visionMemoryEntriesForToken(token).length > 0;
        }

        const prefix = `${this.currentMapId()}::`;
        return Object.keys(this.visionExploration()).some((key) => key.startsWith(prefix));
    });
    readonly ctrlPolylineActive = computed(() => this.ctrlPolylineKind() !== null && this.ctrlPolylinePoints().length > 0);
    readonly ctrlPolylineRenderPoints = computed(() => {
        const points = this.ctrlPolylinePoints();
        if (!points.length) {
            return '';
        }

        const previewPoint = this.ctrlPolylinePreviewPoint();
        const renderPoints = previewPoint ? [...points, previewPoint] : points;
        return this.formatStrokePoints(renderPoints);
    });
    readonly hasPendingTokenPlacement = computed(() => this.activeTool() === 'token' && !!(
        this.tokenPlacementImageUrl().trim()
        || this.tokenPlacementCharacterId()
        || this.tokenPlacementNpcId()
    ));
    readonly placementHint = computed(() => {
        if (this.ctrlPolylineActive()) {
            return 'Ctrl line mode is active. Click to add corners, hold Shift to snap them to the grid, and release Ctrl to apply the line.';
        }

        if (this.hasPendingTokenPlacement()) {
            return `Click anywhere on the board to place ${this.tokenPlacementNameDraft().trim() || 'this token'}.`;
        }

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

        if (this.activeTool() === 'wall') {
            return 'Drag to sketch a vision wall, hold Alt as you start dragging to draw an oval, or hold Ctrl and click to place straight wall segments. Hold Ctrl+Shift to place snapped corners, then release Ctrl to apply.';
        }

        if (this.activeTool() === 'draw') {
            return 'Drag to paint a freehand line, hold Alt as you start dragging to draw an oval, or hold Ctrl and click to place straight segments. Hold Ctrl+Shift to place snapped corners, then release Ctrl to apply.';
        }

        return '';
    });
    readonly shouldShowPlacementHint = computed(() => this.canEdit() && this.showPlacementHint() && this.placementHint().trim().length > 0);
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
        return this.saveState() === 'error';
    });
    readonly confirmOpen = computed(() => this.confirmAction() !== null);
    readonly confirmTitle = computed(() => {
        switch (this.confirmAction()) {
            case 'clear-map':
                return 'Clear Map?';
            case 'delete-token':
                return 'Delete Token?';
            case 'delete-label':
                return 'Delete Label?';
            case 'delete-stroke':
                return 'Delete Drawing?';
            case 'delete-wall':
                return 'Delete Vision Wall?';
            case 'delete-map':
                return 'Delete Map?';
            default:
                return 'Delete Landmark?';
        }
    });
    readonly confirmMessage = computed(() => {
        if (this.confirmAction() === 'clear-map') {
            return 'Remove every drawn line, landmark, token, terrain piece, and label from this campaign map? The current background style will stay in place.';
        }

        if (this.confirmAction() === 'delete-map') {
            const board = this.currentMapBoard();
            return board
                ? `Delete ${board.name}? Its drawn lines, terrain, landmarks, and labels will be removed for everyone in the campaign.`
                : 'Delete this map from the campaign library?';
        }

        if (this.confirmAction() === 'delete-token') {
            const token = this.selectedToken();
            return token ? `Remove ${token.name}? This token will disappear for everyone viewing the map.` : 'Remove this token from the campaign map?';
        }

        if (this.confirmAction() === 'delete-label') {
            const label = this.selectedLabel();
            return label ? `Remove ${label.text}? This label will disappear for everyone viewing the map.` : 'Remove this label from the campaign map?';
        }

        if (this.confirmAction() === 'delete-stroke') {
            return 'Remove this drawing from the campaign map?';
        }

        if (this.confirmAction() === 'delete-wall') {
            return 'Remove this vision wall from the campaign map?';
        }

        const icon = this.selectedIcon();
        return icon ? `Remove ${icon.label}? This landmark marker will disappear for everyone in the campaign.` : 'Remove this landmark from the campaign map?';
    });
    readonly confirmActionText = computed(() => {
        switch (this.confirmAction()) {
            case 'clear-map':
                return 'Clear Map';
            case 'delete-token':
                return 'Delete Token';
            case 'delete-label':
                return 'Delete Label';
            case 'delete-stroke':
                return 'Delete Drawing';
            case 'delete-wall':
                return 'Delete Vision Wall';
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
    readonly visionUnexploredMaskId = `campaign-map-vision-unexplored-mask-${crypto.randomUUID()}`;
    readonly visionExploredMaskId = `campaign-map-vision-explored-mask-${crypto.randomUUID()}`;

    private lastLoadedCampaignId = '';
    private lastLoadedMapSignature = '';
    private lastLoadedRouteMapId = '';
    private activeStrokePointerId: number | null = null;
    private activeLineKind: MapLineKind | null = null;
    private activeStrokeOrigin: CampaignMapPoint | null = null;
    private activeStrokeDrawMode: 'freehand' | 'circle' = 'freehand';
    private activeErasePointerId: number | null = null;
    private draggingDecorationId: string | null = null;
    private draggingDecorationPointerId: number | null = null;
    private pendingStrokeId: string | null = null;
    private pendingStrokeKind: MapLineKind | null = null;
    private pendingStrokePointerId: number | null = null;
    private pendingStrokeClientX = 0;
    private pendingStrokeClientY = 0;
    private pendingStrokePoint: CampaignMapPoint | null = null;
    private draggingStrokeId: string | null = null;
    private draggingStrokeKind: MapLineKind | null = null;
    private draggingStrokePointerId: number | null = null;
    private draggingStrokeLastPoint: CampaignMapPoint | null = null;
    private strokeMoved = false;
    private pendingIconId: string | null = null;
    private pendingIconPointerId: number | null = null;
    private controlledTokenMoveRequestsInFlight = 0;
    private pendingIconClientX = 0;
    private pendingIconClientY = 0;
    private draggingIconId: string | null = null;
    private draggingPointerId: number | null = null;
    private draggingLabelId: string | null = null;
    private draggingLabelPointerId: number | null = null;
    private draggingTokenId: string | null = null;
    private draggingTokenPointerId: number | null = null;
    private draggingTokenMode: 'editor' | 'viewer' | null = null;
    private draggingTokenOrigin: CampaignMapPoint | null = null;
    private draggingTokenFreeMove = false;
    private eraseChanged = false;
    private pendingDragHistory: MapEditorHistoryEntry | null = null;
    private persistInFlight = false;
    private autosaveTimerId: ReturnType<typeof setTimeout> | null = null;
    private mapNoticeTimerId: ReturnType<typeof setTimeout> | null = null;
    private visionMemoryPersistTimerId: ReturnType<typeof setTimeout> | null = null;
    private visionMemoryPersistInFlight = false;
    private visionMemoryPersistInFlightPromise: Promise<void> | null = null;
    private resolveVisionMemoryPersistInFlight: (() => void) | null = null;
    private autosaveQueuedWhileSaving = false;
    private readonly pendingVisionMemoryPersistenceKeys = new Set<string>();
    private readonly inFlightVisionMemoryPersistenceKeys = new Set<string>();
    private readonly resetVisionMemoryOrigins = new Map<string, CampaignMapPoint | null>();
    private localChangeRevision = 0;
    private lastPersistedRevision = 0;
    private creatingRouteMap = false;
    private generationVariant = 0;
    private historySuppressed = false;
    private randomSource: () => number = () => Math.random();
    private ctrlKeyPressed = false;
    private suppressNextBoardClick = false;
    private readonly shiftKeyPressed = signal(false);
    private mapOverlayHintRefreshFrameId: number | null = null;
    private lastMapOverlayHintSourceKey = '';

    constructor() {
        this.destroyRef.onDestroy(() => {
            this.clearAutosaveTimer();
            this.clearMapNoticeTimer();
            this.clearVisionMemoryPersistTimer();
            this.clearMapOverlayHintRefreshFrame();
        });

        this.campaignRealtime.campaignMapVisionReset$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                if (event.campaignId !== this.campaignId()) {
                    return;
                }

                if (event.key) {
                    this.clearVisionExplorationEntry(event.mapId, event.key);
                } else {
                    this.clearVisionExplorationForMap(event.mapId);
                }

                if (event.mapId === this.currentMapId() && event.initiatedByUserId !== this.currentUserId()) {
                    this.showMapNotice(event.summary);
                }

                this.cdr.detectChanges();
            });

        this.campaignRealtime.campaignMapVisionUpdated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.applyRealtimeVisionMemoryUpdate(event);
            });

        this.campaignRealtime.campaignMapTokenMoved$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                this.applyRealtimeTokenMoved(event);
            });

        this.campaignRealtime.campaignActiveMapChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                if (event.campaignId !== this.campaignId()) {
                    return;
                }

                this.showMapNotice(event.summary || `Active map changed to ${event.activeMapName}.`);

                const displayedMapId = this.routeMapId() || this.currentMapId();
                if (!this.canEdit()
                    && displayedMapId
                    && displayedMapId !== 'new'
                    && !this.canMemberStayOnMap(displayedMapId, this.mapBoards(), event.activeMapId)) {
                    void this.navigateToMapViewWithFallback(event.campaignId, event.activeMapId);
                }

                this.cdr.detectChanges();
            });

        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                const routePath = this.route.snapshot.routeConfig?.path ?? '';
                const routeMapId = params.get('mapId') ?? (routePath === 'campaigns/:id/maps/new' ? 'new' : '');
                this.campaignId.set(campaignId);
                this.routeMapId.set(routeMapId);

                if (campaignId) {
                    this.store.selectCampaign(campaignId);
                    void this.ensureCampaignDetails(campaignId);
                }
            });

        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.routeMode.set(data['mapMode'] === 'edit' ? 'edit' : 'view');
            });

        effect(() => {
            const campaignId = this.campaignId();
            const routeMode = this.routeMode();
            if (!campaignId || routeMode !== 'edit') {
                return;
            }

            void this.refreshCampaignCharactersForEditor(campaignId);
        });

        effect(() => {
            const campaign = this.selectedCampaign();
            const routeMapId = this.routeMapId();
            if (!campaign || !campaign.detailsLoaded) {
                return;
            }

            const signature = this.mapLibrarySignature(campaign.maps, campaign.activeMapId);
            if (campaign.id === this.lastLoadedCampaignId && signature === this.lastLoadedMapSignature && routeMapId === this.lastLoadedRouteMapId) {
                return;
            }

            if (this.canModify() && this.persistInFlight && campaign.id === this.lastLoadedCampaignId && routeMapId === this.lastLoadedRouteMapId) {
                return;
            }

            if (this.controlledTokenMoveRequestsInFlight > 0 && campaign.id === this.lastLoadedCampaignId && routeMapId === this.lastLoadedRouteMapId) {
                this.mergeRealtimeTokenState(campaign, routeMapId);
                return;
            }

            if (this.canModify() && this.hasUnsavedChanges() && !this.persistInFlight) {
                this.mergeRealtimeTokenState(campaign, routeMapId);
                return;
            }

            this.lastLoadedCampaignId = campaign.id;
            this.lastLoadedMapSignature = signature;
            this.lastLoadedRouteMapId = routeMapId;
            const maps = campaign.maps.length > 0
                ? campaign.maps.map((map) => this.cloneMapBoard(map))
                : [this.createEmptyMapBoard('Main Map', campaign.map.background)];

            const nextActiveMap = maps.find((map) => map.id === campaign.activeMapId) ?? maps[0] ?? null;
            const displayedMapId = routeMapId || this.currentMapId();
            if (!this.canEdit()
                && displayedMapId
                && displayedMapId !== 'new'
                && nextActiveMap
                && !this.canMemberStayOnMap(displayedMapId, maps, nextActiveMap.id)) {
                void this.navigateToMapViewWithFallback(campaign.id, nextActiveMap.id);
                this.showMapNotice(`The active map changed to ${nextActiveMap.name}.`);
                return;
            }

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

            if (this.routeMode() === 'edit' && !this.canEdit()) {
                if (activeMap) {
                    void this.router.navigate(this.mapViewRoute(campaign.id, activeMap.id), { replaceUrl: true });
                } else {
                    void this.router.navigate(this.mapListRoute(campaign.id), { replaceUrl: true });
                }

                return;
            }

            if (routeMapId && !maps.some((map) => map.id === routeMapId) && activeMap) {
                void this.router.navigate(this.mapRouteForCurrentMode(campaign.id, activeMap.id), { replaceUrl: true });
            }

            const sameMapEditorRefresh = this.isEditorMode() && this.canModify() && !!activeMap && this.currentMapId() === activeMap.id;

            this.mapBoards.set(maps);
            this.hydrateVisionExplorationFromMaps(maps);
            this.loadMapBoard(activeMap, {
                preserveTool: sameMapEditorRefresh,
                preserveTokenSelection: sameMapEditorRefresh
            });
            if (!sameMapEditorRefresh) {
                this.undoStack.set([]);
                this.redoStack.set([]);
            }
            this.pendingDragHistory = null;
            this.hasUnsavedChanges.set(false);
            this.saveState.set('idle');
            this.saveMessage.set(this.canModify() ? '' : this.canEdit() ? 'Viewing map. Click Edit Map to make changes.' : 'Members can review the map, but only owners can edit it.');
        });

        effect(() => {
            const selectedIcon = this.selectedIcon();
            this.iconLabelDraft.set(selectedIcon?.label ?? '');
        });

        effect(() => {
            const selectedToken = this.selectedToken();
            this.tokenNameDraft.set(selectedToken?.name ?? '');
            this.tokenNoteDraft.set(selectedToken?.note ?? '');
            this.tokenAssignmentDraft.set(this.tokenAssignmentValue(selectedToken));
        });

        effect(() => {
            const singleTokenId = this.singleAssignedTokenId();
            const selectedTokenId = this.selectedTokenId();
            const hasNonTokenSelection = !!this.selectedIconId()
                || !!this.selectedLabelId()
                || !!this.selectedDecorationId()
                || !!this.selectedStrokeId()
                || !!this.selectedWallId();

            if (singleTokenId) {
                const shouldAutoSelectAssignedToken = !this.isEditorMode() && !hasNonTokenSelection && !selectedTokenId;
                if (shouldAutoSelectAssignedToken) {
                    this.selectedTokenId.set(singleTokenId);
                }

                return;
            }

            if (selectedTokenId && !this.workingMap().tokens.some((token) => token.id === selectedTokenId)) {
                this.selectedTokenId.set(null);
            }
        });

        effect(() => {
            const selectedLabel = this.selectedLabel();
            if (!selectedLabel) {
                return;
            }

            this.labelTextDraft.set(selectedLabel.text);
            this.labelToneDraft.set(selectedLabel.tone);
        });

        effect(() => {
            const tokens = this.activeVisionTokens();
            if (!tokens.length) {
                return;
            }

            for (const token of tokens) {
                const polygon = this.buildVisionPolygon(token);
                if (polygon.length < 3) {
                    continue;
                }

                this.rememberVisionPolygon(token, polygon);
            }
        });
    }

    private async ensureCampaignDetails(campaignId: string): Promise<void> {
        await this.store.ensureCampaignLoaded(campaignId);
        await this.store.refreshCampaignMapLibrary(campaignId);
        this.cdr.detectChanges();
    }

    private async refreshCampaignCharactersForEditor(campaignId: string): Promise<void> {
        await this.store.refreshCampaignCharacters(campaignId);
        await this.store.refreshCampaignLoaded(campaignId);
        await this.store.refreshCampaignMapLibrary(campaignId);
        this.cdr.detectChanges();
    }

    async refreshMapData(): Promise<void> {
        const campaignId = this.campaignId();
        if (!campaignId || this.hasUnsavedChanges() || this.saveState() === 'saving' || this.isAiArtGenerating() || this.isRefreshingCampaignData()) {
            return;
        }

        await this.store.refreshCampaignLoaded(campaignId);
        await this.store.refreshCampaignMapLibrary(campaignId);
        this.saveState.set('saved');
        this.saveMessage.set('Map data refreshed.');
        this.cdr.detectChanges();
    }

    @HostListener('document:keydown', ['$event'])
    handleDocumentKeydown(event: KeyboardEvent): void {
        if (event.key === 'Control') {
            this.ctrlKeyPressed = true;
        }

        if (event.key === 'Shift') {
            this.shiftKeyPressed.set(true);
        }

        if (this.confirmOpen() || this.shouldIgnoreShortcut(event.target) || event.altKey) {
            return;
        }

        if (!event.ctrlKey && !event.metaKey && this.handleSelectedTokenArrowMove(event)) {
            event.preventDefault();
            return;
        }

        if (!this.canModify()) {
            return;
        }

        if (!event.ctrlKey && !event.metaKey && this.handleToolShortcut(event)) {
            event.preventDefault();
            return;
        }

        if ((event.key === 'Delete' || event.key === 'Backspace') && this.handleDeleteShortcut()) {
            event.preventDefault();
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

    @HostListener('document:keyup', ['$event'])
    handleDocumentKeyup(event: KeyboardEvent): void {
        if (event.key === 'Control') {
            this.ctrlKeyPressed = false;
        }

        if (event.key === 'Shift') {
            this.shiftKeyPressed.set(false);
        }

        if (event.key !== 'Control' && event.key !== 'Shift') {
            return;
        }

        if (!this.canModify()) {
            this.clearCtrlPolylineDraft();
            return;
        }

        if (!this.isModifierPolylineHeld()) {
            this.commitCtrlPolylineDraft();
        }
    }

    @HostListener('window:pagehide')
    handleWindowPageHide(): void {
        this.syncPendingVisionMemorySnapshot();
    }

    @HostListener('document:visibilitychange')
    handleDocumentVisibilityChange(): void {
        if (globalThis.document?.visibilityState === 'hidden') {
            this.syncPendingVisionMemorySnapshot();
        }
    }

    @HostListener('document:fullscreenchange')
    handleFullscreenChange(): void {
        this.isFullscreen.set(globalThis.document?.fullscreenElement === this.mapBoardShell()?.nativeElement);
        this.cdr.detectChanges();
    }

    refreshMapOverlayHintTone(): void {
        const useDarkText = this.computeMapOverlayHintUseDarkText();
        if (useDarkText === this.mapOverlayHintUseDarkText()) {
            return;
        }

        this.mapOverlayHintUseDarkText.set(useDarkText);
        this.cdr.detectChanges();
    }

    private handleDeleteShortcut(): boolean {
        if (this.selectedToken()) {
            this.requestDeleteSelectedToken();
            return true;
        }

        if (this.selectedLabel()) {
            this.requestDeleteSelectedLabel();
            return true;
        }

        if (this.selectedStroke()) {
            this.requestDeleteSelectedStroke();
            return true;
        }

        if (this.selectedWall()) {
            this.requestDeleteSelectedWall();
            return true;
        }

        if (this.selectedIcon()) {
            this.requestDeleteSelectedIcon();
            return true;
        }

        return false;
    }

    private handleToolShortcut(event: KeyboardEvent): boolean {
        switch (event.key) {
            case '1':
            case 'Numpad1':
                this.selectSelectTool();
                return true;
            case '2':
            case 'Numpad2':
                this.selectDrawTool();
                return true;
            case '3':
            case 'Numpad3':
                this.selectWallTool();
                return true;
            case '4':
            case 'Numpad4':
                this.selectEraseTool();
                return true;
            case '5':
            case 'Numpad5':
                this.startLandmarkTool();
                return true;
            case '6':
            case 'Numpad6':
                this.selectTerrainTool('Mountain');
                return true;
            case '7':
            case 'Numpad7':
                this.selectLabelTool();
                return true;
            case '8':
            case 'Numpad8':
                this.selectTokenTool();
                return true;
            default:
                return false;
        }
    }

    selectSelectTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('select');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectDrawTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('draw');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectWallTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('wall');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectEraseTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('erase');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectIconTool(iconType: CampaignMapIconType): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('icon');
        this.pendingIconType.set(iconType);
        this.pendingTerrainType.set(null);
    }

    selectTerrainTool(terrainType: CampaignMapDecorationType): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('terrain');
        this.pendingTerrainType.set(terrainType);
        this.pendingIconType.set(null);
    }

    selectLabelTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('label');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    selectTokenTool(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.activeTool.set('token');
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
    }

    startLandmarkTool(): void {
        if (!this.canModify()) {
            return;
        }

        if (this.pendingIconType()) {
            this.activeTool.set('icon');
            return;
        }

        this.selectIconTool('Keep');
    }

    clearPlacementMode(): void {
        if (!this.canModify()) {
            return;
        }

        this.clearCtrlPolylineDraft();
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
        this.activeTool.set('select');
    }

    selectLabel(labelId: string): void {
        this.selectedLabelId.set(labelId);
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(null);
    }

    updateTokenPlacementNameDraft(value: string): void {
        this.tokenPlacementNameDraft.set(value);
    }

    updateTokenPlacementCharacter(value: string | number): void {
        const characterId = typeof value === 'string' ? value : String(value);
        if (!characterId) {
            this.tokenPlacementCharacterId.set('');
            this.tokenPlacementNpcId.set('');
            this.tokenPlacementAssignedCharacterId.set(null);
            this.tokenPlacementAssignedUserId.set(null);
            this.tokenUploadFeedback.set(this.tokenPlacementImageUrl() ? 'Custom token art ready. Click the board to place it.' : '');
            return;
        }

        const character = this.campaignCharacters().find((entry) => entry.id === characterId);
        if (!character) {
            this.tokenUploadFeedback.set('That character is not currently available in this campaign.');
            this.tokenPlacementCharacterId.set('');
            this.tokenPlacementNpcId.set('');
            this.tokenPlacementAssignedCharacterId.set(null);
            this.tokenPlacementAssignedUserId.set(null);
            return;
        }

        this.tokenPlacementCharacterId.set(character.id);
        this.tokenPlacementNpcId.set('');
        this.tokenPlacementImageUrl.set(character.image?.trim() ?? '');
        this.pendingTokenImageLoadFailed.set(false);
        this.tokenPlacementNameDraft.set(character.name);
        this.tokenPlacementNoteDraft.set('');
        this.tokenPlacementAssignedCharacterId.set(character.id);
        this.tokenPlacementAssignedUserId.set(character.ownerUserId ?? null);
        this.tokenPlacementSize.set(1);
        this.tokenUploadFeedback.set(character.ownerDisplayName
            ? `${character.name} is ready to place. ${character.ownerDisplayName} will be able to move this token.${character.image?.trim() ? '' : ' The token will use initials until a portrait is added.'}`
            : `${character.name} is ready to place. This token will stay linked to the selected character.${character.image?.trim() ? '' : ' The token will use initials until a portrait is added.'}`);
        this.selectTokenTool();
        this.cdr.detectChanges();
    }

    updateTokenPlacementNpc(value: string | number): void {
        const npcId = typeof value === 'string' ? value : String(value);
        if (!npcId) {
            this.tokenPlacementNpcId.set('');
            this.tokenPlacementAssignedCharacterId.set(null);
            this.tokenPlacementAssignedUserId.set(null);
            this.tokenUploadFeedback.set(this.tokenPlacementImageUrl() ? 'Custom token art ready. Click the board to place it.' : '');
            return;
        }

        const npc = this.campaignNpcs().find((entry) => entry.id === npcId);
        if (!npc) {
            this.tokenUploadFeedback.set('That NPC is not currently available in this campaign.');
            this.tokenPlacementNpcId.set('');
            return;
        }

        this.tokenPlacementNpcId.set(npc.id);
        this.tokenPlacementCharacterId.set('');
        this.tokenPlacementImageUrl.set(npc.imageUrl?.trim() ?? '');
        this.pendingTokenImageLoadFailed.set(false);
        this.tokenPlacementNameDraft.set(npc.name);
        this.tokenPlacementNoteDraft.set(npc.title || npc.classOrRole || '');
        this.tokenPlacementAssignedCharacterId.set(null);
        this.tokenPlacementAssignedUserId.set(null);
        this.tokenPlacementSize.set(1);
        this.tokenUploadFeedback.set(`${npc.name} is ready to place as an NPC token.${npc.imageUrl?.trim() ? '' : ' The token will use initials until a portrait is added.'}`);
        this.selectTokenTool();
        this.cdr.detectChanges();
    }

    updateTokenPlacementNoteDraft(value: string): void {
        this.tokenPlacementNoteDraft.set(value);
    }

    updateTokenPlacementSize(value: string | number): void {
        const numericValue = typeof value === 'number' ? value : Number(value);
        this.tokenPlacementSize.set(this.normalizeTokenGridSpan(numericValue));
    }

    updateTokenNameDraft(value: string): void {
        this.tokenNameDraft.set(value);
    }

    updateTokenNoteDraft(value: string): void {
        this.tokenNoteDraft.set(value);
    }

    updateTokenAssignmentDraft(value: string | number): void {
        this.tokenAssignmentDraft.set(String(value));
    }

    applySelectedTokenDetails(): void {
        const selectedToken = this.selectedToken();
        if (!selectedToken || !this.canModify()) {
            return;
        }

        const nextName = this.tokenNameDraft().trim() || 'Token';
        const nextNote = this.tokenNoteDraft().trim();
        const nextAssignment = this.parseTokenAssignmentValue(this.tokenAssignmentDraft());

        if (
            nextName === selectedToken.name
            && nextNote === selectedToken.note
            && nextAssignment.assignedUserId === (selectedToken.assignedUserId ?? null)
            && nextAssignment.assignedCharacterId === (selectedToken.assignedCharacterId ?? null)
        ) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.tokens = map.tokens.map((token) => token.id === selectedToken.id
                ? {
                    ...token,
                    name: nextName,
                    note: nextNote,
                    assignedUserId: nextAssignment.assignedUserId,
                    assignedCharacterId: nextAssignment.assignedCharacterId
                }
                : token);
        });
        this.markDirty('Token updated.');
    }

    updateSelectedTokenSize(value: string | number): void {
        const selectedToken = this.selectedToken();
        if (!selectedToken || !this.canModify()) {
            return;
        }

        const numericValue = typeof value === 'number' ? value : Number(value);
        const nextSize = this.normalizeTokenGridSpan(numericValue);
        if (nextSize === this.normalizeTokenGridSpan(selectedToken.size)) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.tokens = map.tokens.map((token) => {
                if (token.id !== selectedToken.id) {
                    return token;
                }

                const snappedPoint = this.snapTokenPointToGrid({ x: token.x, y: token.y }, nextSize);
                return {
                    ...token,
                    x: snappedPoint.x,
                    y: snappedPoint.y,
                    size: nextSize
                };
            });
        });
        this.markDirty('Token size updated.');
    }

    toggleSelectedWallVision(): void {
        const wall = this.selectedWall();
        if (!wall || !this.canModify()) {
            return;
        }

        this.updateSelectedWallFlags(
            wall.id,
            { blocksVision: !wall.blocksVision },
            wall.blocksVision ? 'Wall sight blocking disabled.' : 'Wall sight blocking enabled.'
        );
    }

    toggleSelectedWallMovement(): void {
        const wall = this.selectedWall();
        if (!wall || !this.canModify()) {
            return;
        }

        this.updateSelectedWallFlags(
            wall.id,
            { blocksMovement: !wall.blocksMovement },
            wall.blocksMovement ? 'Wall movement blocking disabled.' : 'Wall movement blocking enabled.'
        );
    }

    selectedWallRoleLabel(wall: CampaignMapWall): string {
        if (wall.blocksVision && wall.blocksMovement) {
            return 'Sight and movement blocker';
        }

        if (wall.blocksVision) {
            return 'Sight blocker';
        }

        if (wall.blocksMovement) {
            return 'Movement blocker';
        }

        return 'Reference wall';
    }

    selectedWallBehaviorSummary(wall: CampaignMapWall): string {
        const behaviors: string[] = [];

        if (wall.blocksVision) {
            behaviors.push('blocks the token sight preview');
        }

        if (wall.blocksMovement) {
            behaviors.push('stops tokens from moving through it');
        }

        if (!behaviors.length) {
            return 'This wall is currently only visual reference linework. Drag it in Select mode, erase touched segments, or remove it entirely.';
        }

        return `This wall ${behaviors.join(' and ')}. Drag it in Select mode, erase touched segments, or remove it entirely.`;
    }

    tokenRenderSize(size: number): string {
        const span = this.normalizeTokenGridSpan(size);
        const horizontalCellPercent = 100 / this.gridColumns();
        const verticalCellPercent = (MAP_BOARD_HEIGHT_RATIO * 100) / this.gridRows();

        return `calc(min(${horizontalCellPercent}%, ${verticalCellPercent}%) * ${span})`;
    }

    tokenHasRenderableImage(token: CampaignMapToken): boolean {
        const imageUrl = token.imageUrl.trim();
        if (!imageUrl) {
            return false;
        }

        return this.failedTokenImages()[token.id] !== imageUrl;
    }

    markTokenImageFailed(token: CampaignMapToken): void {
        const imageUrl = token.imageUrl.trim();
        if (!imageUrl) {
            return;
        }

        this.failedTokenImages.update((current) => current[token.id] === imageUrl
            ? current
            : { ...current, [token.id]: imageUrl });
    }

    tokenInitials(name: string): string {
        const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (parts.length === 0) {
            return 'TK';
        }

        return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    }

    pendingTokenHasRenderableImage(): boolean {
        return !!this.tokenPlacementImageUrl().trim() && !this.pendingTokenImageLoadFailed();
    }

    markPendingTokenImageFailed(): void {
        if (!this.tokenPlacementImageUrl().trim()) {
            return;
        }

        this.pendingTokenImageLoadFailed.set(true);
        this.cdr.detectChanges();
    }

    gridColumns(): number {
        return this.normalizeMapGridCount(this.workingMap().gridColumns, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS);
    }

    gridRows(): number {
        return this.normalizeMapGridCount(this.workingMap().gridRows, DEFAULT_CAMPAIGN_MAP_GRID_ROWS);
    }

    gridColor(): string {
        return this.normalizeMapGridColor(this.workingMap().gridColor, this.workingMap().background);
    }

    gridOffsetX(): number {
        return this.normalizeMapGridOffset(this.workingMap().gridOffsetX, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X);
    }

    gridOffsetY(): number {
        return this.normalizeMapGridOffset(this.workingMap().gridOffsetY, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y);
    }

    updateGridColumns(value: string): void {
        this.updateGridCount('gridColumns', value, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS);
    }

    updateGridRows(value: string): void {
        this.updateGridCount('gridRows', value, DEFAULT_CAMPAIGN_MAP_GRID_ROWS);
    }

    updateGridOffsetX(value: string): void {
        this.updateGridOffset('gridOffsetX', value, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X);
    }

    updateGridOffsetY(value: string): void {
        this.updateGridOffset('gridOffsetY', value, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y);
    }

    updateGridColor(value: string): void {
        if (!this.canModify()) {
            return;
        }

        const nextColor = this.normalizeMapGridColor(value, this.workingMap().background);
        if (nextColor === this.gridColor()) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.gridColor = nextColor;
        });
        this.markDirty('Grid color updated.');
    }

    resetGridColor(): void {
        this.updateGridColor(this.defaultGridColorForBackground(this.workingMap().background));
    }

    resetGridOffset(): void {
        if (!this.canModify()) {
            return;
        }

        if (this.gridOffsetX() === DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X && this.gridOffsetY() === DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.gridOffsetX = DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X;
            map.gridOffsetY = DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y;
            map.tokens = this.resnapTokensToGrid(
                map.tokens,
                this.gridColumns(),
                this.gridRows(),
                DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
                DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y
            );
        });
        this.markDirty('Grid offset reset.');
    }

    toggleGridLayer(): void {
        const nextValue = !this.showGrid();
        this.showGrid.set(nextValue);
        this.storeGridVisibility(nextValue);
    }

    syncGridControlsDisclosure(event: Event): void {
        const disclosure = event.target as HTMLDetailsElement | null;
        const isOpen = disclosure?.open === true;
        if (this.gridControlsExpanded() === isOpen) {
            return;
        }

        this.gridControlsExpanded.set(isOpen);
        this.storeGridControlsExpanded(isOpen);
    }

    async toggleMapFullscreen(): Promise<void> {
        const shell = this.mapBoardShell()?.nativeElement;
        if (!shell) {
            return;
        }

        try {
            if (globalThis.document?.fullscreenElement === shell) {
                await globalThis.document.exitFullscreen();
                return;
            }

            await shell.requestFullscreen();
        } catch {
            this.isFullscreen.set(false);
        }
    }

    toggleGuide(): void {
        const nextVisible = !this.showGuide();
        this.showGuide.set(nextVisible);

        if (!nextVisible) {
            return;
        }

        this.cdr.detectChanges();
        this.scheduleGuideScroll();
    }

    private scheduleGuideScroll(): void {
        const scrollToGuide = () => {
            this.mapGuidePanel()?.nativeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        };

        if (typeof globalThis.requestAnimationFrame === 'function') {
            globalThis.requestAnimationFrame(() => {
                globalThis.requestAnimationFrame(scrollToGuide);
            });
            return;
        }

        globalThis.setTimeout(scrollToGuide, 0);
    }

    private readStoredGridVisibility(): boolean {
        try {
            return globalThis.localStorage?.getItem(MAP_GRID_VISIBILITY_STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    private readStoredGridControlsExpanded(): boolean {
        try {
            return globalThis.localStorage?.getItem(MAP_GRID_CONTROLS_EXPANDED_STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    private storeGridVisibility(value: boolean): void {
        try {
            globalThis.localStorage?.setItem(MAP_GRID_VISIBILITY_STORAGE_KEY, String(value));
        } catch {
            // Ignore storage failures and keep the in-memory toggle working.
        }
    }

    private storeGridControlsExpanded(value: boolean): void {
        try {
            globalThis.localStorage?.setItem(MAP_GRID_CONTROLS_EXPANDED_STORAGE_KEY, String(value));
        } catch {
            // Ignore storage failures and keep the in-memory toggle working.
        }
    }

    togglePlacementHintVisibility(): void {
        const nextVisible = !this.showPlacementHint();
        this.showPlacementHint.set(nextVisible);
        this.storePlacementHintVisibility(nextVisible);
    }

    private readStoredPlacementHintVisibility(): boolean {
        try {
            const stored = globalThis.localStorage?.getItem(MAP_PLACEMENT_HINT_VISIBILITY_STORAGE_KEY);
            return stored !== 'false';
        } catch {
            return true;
        }
    }

    private storePlacementHintVisibility(value: boolean): void {
        try {
            globalThis.localStorage?.setItem(MAP_PLACEMENT_HINT_VISIBILITY_STORAGE_KEY, String(value));
        } catch {
            // Ignore storage failures and keep the in-memory toggle working.
        }
    }

    requestDeleteSelectedToken(): void {
        if (!this.selectedToken() || !this.canModify()) {
            return;
        }

        this.confirmAction.set('delete-token');
    }

    handleTokenUpload(event: Event): void {
        if (!this.canModify()) {
            return;
        }

        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.tokenUploadFeedback.set('Choose an image file for the token.');
            if (input) {
                input.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!imageUrl) {
                this.tokenUploadFeedback.set('That token image could not be loaded.');
                return;
            }

            const tokenName = this.sanitizeTokenName(file.name);
            this.tokenPlacementCharacterId.set('');
            this.tokenPlacementNpcId.set('');
            this.tokenPlacementAssignedCharacterId.set(null);
            this.tokenPlacementAssignedUserId.set(null);
            this.tokenCropSourceImageUrl.set(imageUrl);
            this.tokenCropSourceName.set(tokenName);
            this.tokenCropModalOpen.set(true);
            this.tokenUploadFeedback.set(`Token art loaded: ${tokenName}. Adjust the crop, then place it on the board.`);
            this.cdr.detectChanges();
        };
        reader.onerror = () => {
            this.tokenUploadFeedback.set('That token image could not be read.');
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);

        if (input) {
            input.value = '';
        }
    }

    clearPendingTokenPlacement(): void {
        if (this.isEditorLocked()) {
            return;
        }

        this.tokenPlacementCharacterId.set('');
        this.tokenPlacementNpcId.set('');
        this.tokenPlacementAssignedUserId.set(null);
        this.tokenPlacementAssignedCharacterId.set(null);
        this.tokenPlacementImageUrl.set('');
        this.pendingTokenImageLoadFailed.set(false);
        this.tokenPlacementNameDraft.set('Token');
        this.tokenPlacementNoteDraft.set('');
        this.tokenPlacementSize.set(1);
        this.tokenUploadFeedback.set('');

        if (this.activeTool() === 'token') {
            this.clearPlacementMode();
        }
    }

    closeTokenCropModal(): void {
        this.tokenCropModalOpen.set(false);
        this.tokenCropSourceImageUrl.set('');
    }

    applyTokenCrop(croppedImageUrl: string): void {
        const tokenName = this.tokenCropSourceName().trim() || 'Token';
        this.tokenPlacementCharacterId.set('');
        this.tokenPlacementNpcId.set('');
        this.tokenPlacementAssignedCharacterId.set(null);
        this.tokenPlacementAssignedUserId.set(null);
        this.tokenPlacementImageUrl.set(croppedImageUrl);
        this.pendingTokenImageLoadFailed.set(false);
        this.tokenPlacementNameDraft.set(tokenName);
        this.tokenPlacementNoteDraft.set('');
        this.tokenPlacementSize.set(1);
        this.tokenCropModalOpen.set(false);
        this.tokenCropSourceImageUrl.set('');
        this.tokenUploadFeedback.set(`Token art loaded: ${tokenName}. Click the board to place it.`);
        this.selectTokenTool();
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedTokenId.set(null);
        this.selectedLabelId.set(null);
        this.cdr.detectChanges();
    }

    updateBackground(value: string | number): void {
        const background = this.normalizeBackground(value);
        this.mutateMap((map) => {
            map.background = background;
            map.gridColor = this.normalizeMapGridColor(map.gridColor, background);
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

    updateMembersCanViewAnytime(enabled: boolean): void {
        if (!this.canModify() || this.workingMap().membersCanViewAnytime === enabled) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.membersCanViewAnytime = enabled;
        });
        this.markDirty(enabled
            ? 'Members can now open this map at any time.'
            : 'Members can now open this map only when it becomes active.');
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
        this.selectedDecorationId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(null);
    }

    selectDecoration(decorationId: string): void {
        this.selectedDecorationId.set(decorationId);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(null);
    }

    selectStroke(strokeId: string): void {
        this.selectedStrokeId.set(strokeId);
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(null);
    }

    selectWall(wallId: string): void {
        this.selectedWallId.set(wallId);
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedTokenId.set(null);
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

    applySelectedLabel(): void {
        const selectedLabel = this.selectedLabel();
        if (!selectedLabel || !this.canModify()) {
            return;
        }

        const nextText = this.labelTextDraft().trim() || this.defaultLabelText(this.labelToneDraft());
        const nextTone = this.labelToneDraft();
        const nextStyle = selectedLabel.tone === nextTone
            ? selectedLabel.style
            : this.defaultMapLabelStyle(nextTone);

        if (nextText === selectedLabel.text && nextTone === selectedLabel.tone) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.labels = map.labels.map((label) => label.id === selectedLabel.id ? { ...label, text: nextText, tone: nextTone, style: nextStyle } : label);
        });
        this.markDirty('Label updated.');
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

    requestDeleteSelectedLabel(): void {
        if (!this.selectedLabel() || !this.canModify()) {
            return;
        }

        this.confirmAction.set('delete-label');
    }

    requestDeleteSelectedStroke(): void {
        if (!this.selectedStroke() || !this.canModify()) {
            return;
        }

        this.confirmAction.set('delete-stroke');
    }

    requestDeleteSelectedWall(): void {
        if (!this.selectedWall() || !this.canModify()) {
            return;
        }

        this.confirmAction.set('delete-wall');
    }

    requestClearMap(): void {
        if (!this.canModify() || (!this.workingMap().strokes.length && !this.workingMap().walls.length && !this.workingMap().icons.length && !this.workingMap().tokens.length && !this.workingMap().decorations.length && !this.workingMap().labels.length && !this.workingMap().layers.rivers.length && !this.workingMap().layers.mountainChains.length && !this.workingMap().layers.forestBelts.length)) {
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

        if (action === 'delete-token') {
            const tokenId = this.selectedTokenId();
            if (!tokenId) {
                return;
            }

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.tokens = map.tokens.filter((token) => token.id !== tokenId);
            });
            this.selectedTokenId.set(null);
            this.markDirty('Token removed.');
            return;
        }

        if (action === 'delete-label') {
            const labelId = this.selectedLabelId();
            if (!labelId) {
                return;
            }

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.labels = map.labels.filter((label) => label.id !== labelId);
            });
            this.selectedLabelId.set(null);
            this.markDirty('Label removed.');
            return;
        }

        if (action === 'delete-stroke') {
            const strokeId = this.selectedStrokeId();
            if (!strokeId) {
                return;
            }

            this.deleteStrokeById(strokeId, 'Drawing removed.');
            return;
        }

        if (action === 'delete-wall') {
            const wallId = this.selectedWallId();
            if (!wallId) {
                return;
            }

            this.deleteWallById(wallId, 'Vision wall removed.');
            return;
        }

        if (action === 'clear-map') {
            const background = this.workingMap().background;
            this.captureHistorySnapshot();
            this.setWorkingMap(this.createEmptyMap(background));
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(null);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedWallId.set(null);
            this.selectedTokenId.set(null);
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
            await this.router.navigate(this.mapListRoute(this.campaignId()), { replaceUrl: true });
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
            separateLabels: this.separateLabelsDraft(),
            settlementScale: this.settlementScale(),
            parchmentLayout: this.parchmentLayout(),
            cavernLayout: this.cavernLayout(),
            battlemapLocale: this.battlemapLocale(),
            lighting: this.lighting(),
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
        this.separateLabelsDraft.set(options.background === 'Battlemap' ? false : options.separateLabels);
        this.settlementScale.set(options.settlementScale);
        this.parchmentLayout.set(options.parchmentLayout);
        this.cavernLayout.set(options.cavernLayout);
        this.battlemapLocale.set(options.battlemapLocale);
        this.lighting.set(options.lighting);
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
        let dirtyMessage = '';

        this.lockEditorForAiGeneration();
        this.isAiArtGenerating.set(true);
        this.saveMessage.set('Generating map art with OpenAI...');
        this.cdr.detectChanges();

        try {
            const generated = await this.store.generateCampaignMapArtAi(campaign.id, {
                background,
                mapName,
                separateLabels: background === 'Battlemap' ? false : options.separateLabels,
                settlementScale: background === 'City' ? options.settlementScale : undefined,
                parchmentLayout: background === 'Parchment' ? options.parchmentLayout : undefined,
                cavernLayout: background === 'Cavern' ? options.cavernLayout : undefined,
                battlemapLocale: background === 'Battlemap' ? options.battlemapLocale : undefined,
                lighting: options.lighting,
                settlementNames,
                regionNames,
                ruinNames,
                cavernNames,
                additionalDirection: this.buildMapArtAdditionalDirection(options)
            });

            const backgroundImageUrl = generated?.backgroundImageUrl ?? null;

            if (!backgroundImageUrl) {
                this.saveState.set('error');
                this.saveMessage.set('OpenAI map art generation failed or is unavailable.');
                return;
            }

            const optimizedBackgroundImageUrl = await this.optimizeMapArtForStorage(backgroundImageUrl);

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.background = background;
                map.backgroundImageUrl = optimizedBackgroundImageUrl;
                map.strokes = [];
                map.walls = [];
                map.decorations = [];
                map.labels = generated?.labels ?? [];
                map.layers = {
                    rivers: [],
                    mountainChains: [],
                    forestBelts: []
                };
            });
            dirtyMessage = options.separateLabels
                ? 'Map art generated with separate movable labels. Existing drawings were cleared and landmarks were kept. Save to keep it.'
                : 'Map art generated. Existing drawings were cleared and landmarks were kept. Save to keep it.';
        } finally {
            this.isAiArtGenerating.set(false);

            if (dirtyMessage) {
                this.hasUnsavedChanges.set(true);
                this.saveState.set('idle');
                this.saveMessage.set(dirtyMessage);
            }

            this.cdr.detectChanges();
        }
    }

    private lockEditorForAiGeneration(): void {
        this.isDrawing.set(false);
        this.activeStrokePointerId = null;
        this.activeLineKind = null;
        this.activeStrokeOrigin = null;
        this.activeStrokeDrawMode = 'freehand';
        this.activeErasePointerId = null;
        this.pendingStrokeId = null;
        this.pendingStrokePointerId = null;
        this.pendingStrokePoint = null;
        this.draggingStrokeId = null;
        this.draggingStrokePointerId = null;
        this.draggingStrokeLastPoint = null;
        this.strokeMoved = false;
        this.pendingIconType.set(null);
        this.pendingTerrainType.set(null);
        this.activeTool.set('select');
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

    clearLandmarks(): void {
        if (!this.canModify() || this.workingMap().icons.length === 0) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.icons = [];
        });
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedStrokeId.set(null);
        this.markDirty('Landmarks cleared.');
    }

    clearLabels(): void {
        if (!this.canModify() || this.workingMap().labels.length === 0) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.labels = [];
        });
        this.selectedDecorationId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.markDirty('Labels cleared.');
    }

    clearTokens(): void {
        if (!this.canModify() || this.workingMap().tokens.length === 0) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.tokens = [];
        });
        this.selectedDecorationId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedTokenId.set(null);
        this.markDirty('Tokens cleared.');
    }

    clearTerrainLayers(): void {
        if (!this.canModify() || (!this.workingMap().decorations.length && !this.workingMap().layers.rivers.length && !this.workingMap().layers.mountainChains.length && !this.workingMap().layers.forestBelts.length)) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.decorations = [];
            map.layers = {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            };
        });
        this.selectedDecorationId.set(null);
        this.selectedStrokeId.set(null);
        this.markDirty('Terrain layers cleared.');
    }

    normalizeTokenGridSpan(value: number | undefined): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 1;
        }

        return MAP_TOKEN_GRID_SPANS.reduce((closest, span) => {
            return Math.abs(span - value) < Math.abs(closest - value) ? span : closest;
        }, MAP_TOKEN_GRID_SPANS[0]);
    }

    handleBoardClick(event: MouseEvent): void {
        if (this.suppressNextBoardClick) {
            this.suppressNextBoardClick = false;
            return;
        }

        if (!this.canModify()) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        if (this.shouldHandleModifierPolyline(event.ctrlKey) && (this.activeTool() === 'draw' || this.activeTool() === 'wall')) {
            this.handleCtrlPolylineClick(point, event.shiftKey);
            event.preventDefault();
            return;
        }

        if (this.hasPendingTokenPlacement()) {
            const snappedPoint = this.snapTokenPointToGrid(point, this.tokenPlacementSize());
            const token: CampaignMapToken = {
                id: this.createId(),
                name: this.tokenPlacementNameDraft().trim() || 'Token',
                imageUrl: this.tokenPlacementImageUrl(),
                x: snappedPoint.x,
                y: snappedPoint.y,
                size: this.tokenPlacementSize(),
                note: this.tokenPlacementNoteDraft().trim(),
                assignedUserId: this.tokenPlacementAssignedUserId(),
                assignedCharacterId: this.tokenPlacementAssignedCharacterId(),
                moveRevision: 0
            };

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.tokens = [...map.tokens, token];
            });
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(null);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedTokenId.set(token.id);
            this.markDirty('Token placed.');
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
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(icon.id);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedTokenId.set(null);
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
            this.selectDecoration(decoration.id);
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
                rotation: this.labelToneDraft() === 'Feature' ? this.randomFloat(-10, 10) : this.randomFloat(-4, 4),
                style: this.defaultMapLabelStyle(this.labelToneDraft())
            };

            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.labels = [...map.labels, label];
            });
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(null);
            this.selectedLabelId.set(label.id);
            this.selectedStrokeId.set(null);
            this.selectedTokenId.set(null);
            this.markDirty('Map label added.');
            return;
        }

        if (this.activeTool() === 'select') {
            const clickedIcon = this.findNearestIconAtPoint(point.x, point.y);
            if (clickedIcon) {
                this.selectIcon(clickedIcon.id);
                return;
            }

            const clickedLabel = this.findNearestLabelAtPoint(point.x, point.y);
            if (clickedLabel) {
                this.selectLabel(clickedLabel.id);
                return;
            }

            const clickedDecoration = this.findNearestDecorationAtPoint(point.x, point.y);
            if (clickedDecoration) {
                this.selectDecoration(clickedDecoration.id);
                return;
            }

            const clickedStroke = this.findNearestStrokeAtPoint(point.x, point.y);
            if (clickedStroke) {
                if (event.ctrlKey || event.metaKey) {
                    this.deleteStrokeById(clickedStroke.id, 'Drawing removed.');
                    return;
                }

                this.selectStroke(clickedStroke.id);
                return;
            }

            const clickedWall = this.findNearestWallAtPoint(point.x, point.y);
            if (clickedWall) {
                if (event.ctrlKey || event.metaKey) {
                    this.deleteWallById(clickedWall.id, 'Vision wall removed.');
                    return;
                }

                this.selectWall(clickedWall.id);
                return;
            }
        }

        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(null);
    }

    handleBoardPointerDown(event: PointerEvent): void {
        if (!this.canModify() || event.button !== 0) {
            return;
        }

        if (this.shouldHandleModifierPolyline(event.ctrlKey) && (this.activeTool() === 'draw' || this.activeTool() === 'wall')) {
            event.preventDefault();
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        if (this.activeTool() === 'select') {
            const clickedIcon = this.findNearestIconAtPoint(point.x, point.y);
            if (clickedIcon) {
                this.armIconInteraction(clickedIcon.id, event);
                return;
            }

            const clickedLabel = this.findNearestLabelAtPoint(point.x, point.y);
            if (clickedLabel) {
                this.selectLabel(clickedLabel.id);
                this.draggingLabelId = clickedLabel.id;
                this.draggingLabelPointerId = event.pointerId;
                this.pendingDragHistory = this.createHistoryEntry();
                (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
                event.preventDefault();
                return;
            }

            const clickedDecoration = this.findNearestDecorationAtPoint(point.x, point.y);
            if (clickedDecoration) {
                this.selectDecoration(clickedDecoration.id);
                this.draggingDecorationId = clickedDecoration.id;
                this.draggingDecorationPointerId = event.pointerId;
                this.pendingDragHistory = this.createHistoryEntry();
                (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
                event.preventDefault();
                return;
            }

            const clickedStroke = this.findNearestStrokeAtPoint(point.x, point.y);
            if (clickedStroke) {
                this.armStrokeInteraction(clickedStroke.id, point, event, 'drawing');
                return;
            }

            const clickedWall = this.findNearestWallAtPoint(point.x, point.y);
            if (clickedWall) {
                this.armStrokeInteraction(clickedWall.id, point, event, 'wall');
                return;
            }

            return;
        }

        if (this.activeTool() === 'erase') {
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(null);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedWallId.set(null);
            this.selectedTokenId.set(null);
            this.pendingDragHistory = this.createHistoryEntry();
            this.activeErasePointerId = event.pointerId;
            this.eraseChanged = false;
            (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
            this.eraseChanged = this.eraseRoutesAtPoint(point) || this.eraseChanged;
            event.preventDefault();
            return;
        }

        if (this.activeTool() !== 'draw' && this.activeTool() !== 'wall') {
            return;
        }

        const drawPoint = event.shiftKey ? this.snapRoutePointToGridIntersection(point) : point;
        const lineKind: MapLineKind = this.activeTool() === 'wall' ? 'wall' : 'drawing';

        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.isDrawing.set(true);
        this.captureHistorySnapshot();
        this.activeStrokePointerId = event.pointerId;
        this.activeLineKind = lineKind;
        this.activeStrokeOrigin = drawPoint;
        this.activeStrokeDrawMode = event.altKey ? 'circle' : 'freehand';
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);

        this.mutateMap((map) => {
            if (lineKind === 'wall') {
                map.walls = [...map.walls, this.createMapWall([drawPoint])];
                return;
            }

            map.strokes = [...map.strokes, {
                id: this.createId(),
                color: this.brushColor(),
                width: this.brushWidth(),
                points: [drawPoint]
            }];
        });

        event.preventDefault();
    }

    handleBoardPointerMove(event: PointerEvent): void {
        if (this.handlePendingOrActiveIconMove(event)) {
            return;
        }

        if (this.handlePendingOrActiveStrokeMove(event)) {
            return;
        }

        if (this.ctrlPolylineActive() && this.isModifierPolylineHeld() && (this.activeTool() === 'draw' || this.activeTool() === 'wall')) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return;
            }

            this.ctrlPolylinePreviewPoint.set(event.shiftKey ? this.snapRoutePointToGridIntersection(point) : point);
            event.preventDefault();
            return;
        }

        if (this.draggingDecorationPointerId === event.pointerId && this.draggingDecorationId) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return;
            }

            this.mutateMap((map) => {
                this.moveDecorationById(map, this.draggingDecorationId!, point);
            });

            event.preventDefault();
            return;
        }

        if (this.draggingLabelPointerId === event.pointerId && this.draggingLabelId) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return;
            }

            this.mutateMap((map) => {
                map.labels = map.labels.map((label) => label.id === this.draggingLabelId ? { ...label, x: point.x, y: point.y } : label);
            });

            event.preventDefault();
            return;
        }

        if (this.activeErasePointerId === event.pointerId) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return;
            }

            this.eraseChanged = this.eraseRoutesAtPoint(point) || this.eraseChanged;
            event.preventDefault();
            return;
        }

        if (!this.isDrawing() || this.activeStrokePointerId !== event.pointerId) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        const drawPoint = event.shiftKey ? this.snapRoutePointToGridIntersection(point) : point;

        this.mutateMap((map) => {
            const targetLines = this.activeLineKind === 'wall' ? map.walls : map.strokes;
            const lastStroke = targetLines.at(-1);
            if (!lastStroke) {
                return;
            }

            if (this.activeStrokeDrawMode === 'circle' && this.activeStrokeOrigin) {
                lastStroke.points = this.createCircleDragPoints(this.activeStrokeOrigin, drawPoint);
                return;
            }

            const previousPoint = lastStroke.points.at(-1);
            if (previousPoint && Math.hypot(previousPoint.x - drawPoint.x, previousPoint.y - drawPoint.y) < 0.005) {
                return;
            }

            lastStroke.points = [...lastStroke.points, drawPoint];
        });

        event.preventDefault();
    }

    handleBoardPointerUp(event: PointerEvent): void {
        if (this.finishIconInteraction(event)) {
            return;
        }

        if (this.finishStrokeInteraction(event)) {
            return;
        }

        if (this.draggingDecorationPointerId === event.pointerId && this.draggingDecorationId) {
            this.draggingDecorationId = null;
            this.draggingDecorationPointerId = null;
            (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

            if (this.pendingDragHistory) {
                const beforeDrag = this.historyEntrySignature(this.pendingDragHistory);
                const afterDrag = this.historyEntrySignature(this.createHistoryEntry());
                if (beforeDrag !== afterDrag) {
                    this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                    this.redoStack.set([]);
                }
            }

            this.pendingDragHistory = null;
            this.markDirty('Terrain moved.');
            return;
        }

        if (this.draggingLabelPointerId === event.pointerId && this.draggingLabelId) {
            this.draggingLabelId = null;
            this.draggingLabelPointerId = null;
            (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

            if (this.pendingDragHistory) {
                const beforeDrag = this.historyEntrySignature(this.pendingDragHistory);
                const afterDrag = this.historyEntrySignature(this.createHistoryEntry());
                if (beforeDrag !== afterDrag) {
                    this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                    this.redoStack.set([]);
                }
            }

            this.pendingDragHistory = null;
            this.markDirty('Label moved.');
            return;
        }

        if (this.activeErasePointerId === event.pointerId) {
            this.activeErasePointerId = null;
            (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

            if (this.pendingDragHistory) {
                const beforeErase = this.historyEntrySignature(this.pendingDragHistory);
                const afterErase = this.historyEntrySignature(this.createHistoryEntry());
                if (beforeErase !== afterErase) {
                    this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                    this.redoStack.set([]);
                }
            }

            this.pendingDragHistory = null;
            if (this.eraseChanged) {
                this.markDirty('Linework erased.');
            }

            this.eraseChanged = false;
            return;
        }

        if (!this.isDrawing() || this.activeStrokePointerId !== event.pointerId) {
            return;
        }

        const finishedLineKind = this.activeLineKind;
        this.activeStrokePointerId = null;
        this.activeLineKind = null;
        this.activeStrokeOrigin = null;
        this.activeStrokeDrawMode = 'freehand';
        this.isDrawing.set(false);
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

        this.mutateMap((map) => {
            const targetLines = finishedLineKind === 'wall' ? map.walls : map.strokes;
            const lastStroke = targetLines.at(-1);
            if (!lastStroke || lastStroke.points.length !== 1) {
                return;
            }

            lastStroke.points = [...lastStroke.points, lastStroke.points[0]];
        });

        this.markDirty(finishedLineKind === 'wall' ? 'Vision wall added.' : 'Drawing added.');
    }

    handleIconPointerDown(event: PointerEvent, iconId: string): void {
        this.armIconInteraction(iconId, event);
        event.stopPropagation();
    }

    handleIconPointerMove(event: PointerEvent, iconId: string): void {
        if (this.draggingIconId !== iconId && this.pendingIconId !== iconId) {
            return;
        }

        if (this.handlePendingOrActiveIconMove(event)) {
            event.stopPropagation();
        }
    }

    handleIconPointerUp(event: PointerEvent, iconId: string): void {
        if (this.draggingIconId !== iconId && this.pendingIconId !== iconId) {
            return;
        }

        if (this.finishIconInteraction(event)) {
            event.stopPropagation();
        }
    }

    private armIconInteraction(iconId: string, event: PointerEvent): void {
        this.selectIcon(iconId);

        if (!this.canModify() || event.button !== 0) {
            return;
        }

        this.pendingIconId = iconId;
        this.pendingIconPointerId = event.pointerId;
        this.pendingIconClientX = event.clientX;
        this.pendingIconClientY = event.clientY;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
    }

    private handlePendingOrActiveIconMove(event: PointerEvent): boolean {
        if (this.draggingPointerId === event.pointerId && this.draggingIconId) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return true;
            }

            this.mutateMap((map) => {
                map.icons = map.icons.map((icon) => icon.id === this.draggingIconId ? { ...icon, x: point.x, y: point.y } : icon);
            });

            event.preventDefault();
            return true;
        }

        if (this.pendingIconPointerId !== event.pointerId || !this.pendingIconId) {
            return false;
        }

        if (Math.hypot(event.clientX - this.pendingIconClientX, event.clientY - this.pendingIconClientY) < 6) {
            return true;
        }

        this.draggingIconId = this.pendingIconId;
        this.draggingPointerId = event.pointerId;
        this.pendingIconId = null;
        this.pendingIconPointerId = null;
        this.pendingDragHistory = this.createHistoryEntry();

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return true;
        }

        this.mutateMap((map) => {
            map.icons = map.icons.map((icon) => icon.id === this.draggingIconId ? { ...icon, x: point.x, y: point.y } : icon);
        });

        event.preventDefault();
        return true;
    }

    private armStrokeInteraction(strokeId: string, point: CampaignMapPoint, event: PointerEvent, kind: MapLineKind = 'drawing'): void {
        if (kind === 'wall') {
            this.selectWall(strokeId);
        } else {
            this.selectStroke(strokeId);
        }

        if (!this.canModify() || event.button !== 0) {
            return;
        }

        this.pendingStrokeId = strokeId;
        this.pendingStrokeKind = kind;
        this.pendingStrokePointerId = event.pointerId;
        this.pendingStrokeClientX = event.clientX;
        this.pendingStrokeClientY = event.clientY;
        this.pendingStrokePoint = point;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    private handlePendingOrActiveStrokeMove(event: PointerEvent): boolean {
        if (this.draggingStrokePointerId === event.pointerId && this.draggingStrokeId) {
            const point = this.getRelativePoint(event.clientX, event.clientY);
            if (!point) {
                return true;
            }

            const previousPoint = this.draggingStrokeLastPoint ?? point;
            this.draggingStrokeLastPoint = point;
            this.strokeMoved = this.translateStrokeById(this.draggingStrokeId, point.x - previousPoint.x, point.y - previousPoint.y, this.draggingStrokeKind ?? 'drawing') || this.strokeMoved;
            event.preventDefault();
            return true;
        }

        if (this.pendingStrokePointerId !== event.pointerId || !this.pendingStrokeId) {
            return false;
        }

        if (Math.hypot(event.clientX - this.pendingStrokeClientX, event.clientY - this.pendingStrokeClientY) < 6) {
            return true;
        }

        this.draggingStrokeId = this.pendingStrokeId;
        this.draggingStrokeKind = this.pendingStrokeKind;
        this.draggingStrokePointerId = event.pointerId;
        this.draggingStrokeLastPoint = this.pendingStrokePoint;
        this.pendingStrokeId = null;
        this.pendingStrokeKind = null;
        this.pendingStrokePointerId = null;
        this.pendingStrokePoint = null;
        this.pendingDragHistory = this.createHistoryEntry();
        this.strokeMoved = false;

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return true;
        }

        const previousPoint = this.draggingStrokeLastPoint ?? point;
        this.draggingStrokeLastPoint = point;
        this.strokeMoved = this.translateStrokeById(this.draggingStrokeId, point.x - previousPoint.x, point.y - previousPoint.y, this.draggingStrokeKind ?? 'drawing') || this.strokeMoved;
        event.preventDefault();
        return true;
    }

    private finishStrokeInteraction(event: PointerEvent): boolean {
        if (this.draggingStrokePointerId === event.pointerId && this.draggingStrokeId) {
            const movedKind = this.draggingStrokeKind;
            this.draggingStrokeId = null;
            this.draggingStrokeKind = null;
            this.draggingStrokePointerId = null;
            this.draggingStrokeLastPoint = null;
            (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

            if (this.pendingDragHistory) {
                const beforeDrag = this.historyEntrySignature(this.pendingDragHistory);
                const afterDrag = this.historyEntrySignature(this.createHistoryEntry());
                if (beforeDrag !== afterDrag) {
                    this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                    this.redoStack.set([]);
                }
            }

            this.pendingDragHistory = null;
            if (this.strokeMoved) {
                this.markDirty(movedKind === 'wall' ? 'Vision wall moved.' : 'Drawing moved.');
            }

            this.strokeMoved = false;
            return true;
        }

        if (this.pendingStrokePointerId !== event.pointerId || !this.pendingStrokeId) {
            return false;
        }

        this.pendingStrokeId = null;
        this.pendingStrokeKind = null;
        this.pendingStrokePointerId = null;
        this.pendingStrokePoint = null;
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);
        return true;
    }

    private finishIconInteraction(event: PointerEvent): boolean {
        if (this.draggingPointerId === event.pointerId && this.draggingIconId) {
            this.draggingIconId = null;
            this.draggingPointerId = null;
            (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);

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
            return true;
        }

        if (this.pendingIconPointerId !== event.pointerId || !this.pendingIconId) {
            return false;
        }

        this.pendingIconId = null;
        this.pendingIconPointerId = null;
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);
        return true;
    }

    selectToken(tokenId: string): void {
        this.selectedTokenId.set(tokenId);
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
    }

    handleLabelPointerDown(event: PointerEvent, labelId: string): void {
        this.selectLabel(labelId);

        if (!this.canModify() || event.button !== 0) {
            event.stopPropagation();
            return;
        }

        this.draggingLabelId = labelId;
        this.draggingLabelPointerId = event.pointerId;
        this.pendingDragHistory = this.createHistoryEntry();
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
        event.stopPropagation();
    }

    handleLabelPointerMove(event: PointerEvent, labelId: string): void {
        if (this.draggingLabelId !== labelId || this.draggingLabelPointerId !== event.pointerId) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        this.mutateMap((map) => {
            map.labels = map.labels.map((label) => label.id === labelId ? { ...label, x: point.x, y: point.y } : label);
        });

        event.preventDefault();
        event.stopPropagation();
    }

    handleLabelPointerUp(event: PointerEvent, labelId: string): void {
        if (this.draggingLabelId !== labelId || this.draggingLabelPointerId !== event.pointerId) {
            return;
        }

        this.draggingLabelId = null;
        this.draggingLabelPointerId = null;
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
        this.markDirty('Label moved.');
    }

    handleTokenPointerDown(event: PointerEvent, tokenId: string): void {
        this.selectToken(tokenId);

        const token = this.workingMap().tokens.find((entry) => entry.id === tokenId) ?? null;
        if (!token) {
            event.stopPropagation();
            return;
        }

        if (event.button !== 0 || (!this.canModify() && !this.canControlToken(token))) {
            event.stopPropagation();
            return;
        }

        this.draggingTokenId = tokenId;
        this.draggingTokenPointerId = event.pointerId;
        this.draggingTokenMode = this.canModify() ? 'editor' : 'viewer';
        this.draggingTokenOrigin = { x: token.x, y: token.y };
        this.draggingTokenFreeMove = event.ctrlKey || this.ctrlKeyPressed;
        this.pendingDragHistory = this.draggingTokenMode === 'editor' ? this.createHistoryEntry() : null;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
        event.stopPropagation();
    }

    handleTokenPointerMove(event: PointerEvent, tokenId: string): void {
        if (this.draggingTokenId !== tokenId || this.draggingTokenPointerId !== event.pointerId) {
            return;
        }

        const point = this.getRelativePoint(event.clientX, event.clientY);
        if (!point) {
            return;
        }

        this.mutateMap((map) => {
            map.tokens = map.tokens.map((token) => {
                if (token.id !== tokenId) {
                    return token;
                }

                if (this.shouldMoveTokenFreely(event)) {
                    this.draggingTokenFreeMove = true;
                }

                const targetPoint = this.shouldMoveTokenFreely(event)
                    ? point
                    : this.snapTokenPointToGrid(point, token.size);

                if (targetPoint.x === token.x && targetPoint.y === token.y) {
                    return token;
                }

                if (this.isTokenMoveBlocked(token, targetPoint)) {
                    return token;
                }

                return {
                    ...token,
                    x: targetPoint.x,
                    y: targetPoint.y,
                    moveRevision: Math.max(0, token.moveRevision ?? 0) + 1
                };
            });
        });

        event.preventDefault();
        event.stopPropagation();
    }

    private shouldMoveTokenFreely(event: PointerEvent): boolean {
        return this.draggingTokenFreeMove || event.ctrlKey || this.ctrlKeyPressed;
    }

    private handleSelectedTokenArrowMove(event: KeyboardEvent): boolean {
        const direction = this.tokenArrowMoveDirection(event.key);
        if (!direction || event.ctrlKey || event.metaKey) {
            return false;
        }

        const token = this.selectedToken();
        if (!token || this.draggingTokenId) {
            return false;
        }

        const canMoveSelectedToken = this.canModify() || this.canControlToken(token);
        if (!canMoveSelectedToken) {
            return false;
        }

        const targetPoint = this.computeTokenArrowMoveTarget(token, direction.deltaX, direction.deltaY);
        if (!targetPoint) {
            return false;
        }

        const origin = { x: token.x, y: token.y };
        const nextMoveRevision = Math.max(0, token.moveRevision ?? 0) + 1;
        const movedToken = { ...token, x: targetPoint.x, y: targetPoint.y, moveRevision: nextMoveRevision };

        if (this.canModify()) {
            this.captureHistorySnapshot();
            this.mutateMap((map) => {
                map.tokens = map.tokens.map((entry) => entry.id === token.id
                    ? { ...entry, x: targetPoint.x, y: targetPoint.y, moveRevision: nextMoveRevision }
                    : entry);
            });
            this.markDirty('Token moved.');
            return true;
        }

        this.mutateMap((map) => {
            map.tokens = map.tokens.map((entry) => entry.id === token.id
                ? { ...entry, x: targetPoint.x, y: targetPoint.y, moveRevision: nextMoveRevision }
                : entry);
        });
        void this.persistControlledTokenMove(token.id, movedToken, origin);
        return true;
    }

    private tokenArrowMoveDirection(key: string): { deltaX: number; deltaY: number } | null {
        switch (key) {
            case 'ArrowLeft':
                return { deltaX: -1, deltaY: 0 };
            case 'ArrowRight':
                return { deltaX: 1, deltaY: 0 };
            case 'ArrowUp':
                return { deltaX: 0, deltaY: -1 };
            case 'ArrowDown':
                return { deltaX: 0, deltaY: 1 };
            default:
                return null;
        }
    }

    private computeTokenArrowMoveTarget(token: CampaignMapToken, deltaX: number, deltaY: number): CampaignMapPoint | null {
        const candidatePoint = {
            x: this.clampCoordinate(token.x + (deltaX / this.gridColumns())),
            y: this.clampCoordinate(token.y + (deltaY / this.gridRows()))
        } satisfies CampaignMapPoint;
        const targetPoint = this.snapTokenPointToGrid(candidatePoint, token.size);

        if ((targetPoint.x === token.x && targetPoint.y === token.y) || this.isTokenMoveBlocked(token, targetPoint)) {
            return null;
        }

        return targetPoint;
    }

    handleTokenPointerUp(event: PointerEvent, tokenId: string): void {
        if (this.draggingTokenId !== tokenId || this.draggingTokenPointerId !== event.pointerId) {
            return;
        }

        const dragMode = this.draggingTokenMode;
        const origin = this.draggingTokenOrigin;
        this.draggingTokenId = null;
        this.draggingTokenPointerId = null;
        this.draggingTokenMode = null;
        this.draggingTokenOrigin = null;
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);
        event.stopPropagation();

        if (dragMode === 'editor' && this.pendingDragHistory) {
            const beforeDrag = this.historyEntrySignature(this.pendingDragHistory);
            const afterDrag = this.historyEntrySignature(this.createHistoryEntry());
            if (beforeDrag !== afterDrag) {
                this.pushHistoryEntry(this.pendingDragHistory, 'undo');
                this.redoStack.set([]);
            }
        }

        const movedToken = this.workingMap().tokens.find((entry) => entry.id === tokenId) ?? null;
        if (!movedToken || !origin || (movedToken.x === origin.x && movedToken.y === origin.y)) {
            this.pendingDragHistory = null;
            return;
        }

        this.pendingDragHistory = null;
        this.suppressNextBoardClick = true;
        void this.persistControlledTokenMove(tokenId, movedToken, origin);
    }

    private handleCtrlPolylineClick(point: CampaignMapPoint, snapToGrid: boolean): void {
        const drawPoint = snapToGrid ? this.snapRoutePointToGridIntersection(point) : point;
        const lineKind: MapLineKind = this.activeTool() === 'wall' ? 'wall' : 'drawing';
        const points = this.ctrlPolylinePoints();
        const nextPoint = { ...drawPoint };

        if (this.ctrlPolylineKind() !== lineKind || points.length === 0) {
            this.selectedDecorationId.set(null);
            this.selectedIconId.set(null);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedWallId.set(null);
            this.selectedTokenId.set(null);
            this.ctrlPolylineKind.set(lineKind);
            this.ctrlPolylineColor.set(lineKind === 'wall' ? '#101418' : this.brushColor());
            this.ctrlPolylineWidth.set(lineKind === 'wall' ? Math.max(4, this.brushWidth()) : this.brushWidth());
            this.ctrlPolylinePoints.set([nextPoint]);
            this.ctrlPolylinePreviewPoint.set(nextPoint);
            return;
        }

        const lastPoint = points.at(-1);
        if (lastPoint && Math.hypot(lastPoint.x - nextPoint.x, lastPoint.y - nextPoint.y) < 0.005) {
            this.ctrlPolylinePreviewPoint.set(nextPoint);
            return;
        }

        this.ctrlPolylinePoints.set([...points, nextPoint]);
        this.ctrlPolylinePreviewPoint.set(nextPoint);
    }

    private commitCtrlPolylineDraft(): boolean {
        const lineKind = this.ctrlPolylineKind();
        const points = this.ctrlPolylinePoints();
        if (!lineKind) {
            return false;
        }

        if (points.length < 2) {
            this.clearCtrlPolylineDraft();
            return false;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            if (lineKind === 'wall') {
                map.walls = [...map.walls, this.createMapWall(points)];
                return;
            }

            map.strokes = [...map.strokes, {
                id: this.createId(),
                color: this.ctrlPolylineColor(),
                width: this.ctrlPolylineWidth(),
                points: points.map((entry) => ({ ...entry }))
            }];
        });

        this.clearCtrlPolylineDraft();
        this.markDirty(lineKind === 'wall' ? 'Vision wall added.' : 'Drawing added.');
        return true;
    }

    private clearCtrlPolylineDraft(): void {
        this.ctrlPolylineKind.set(null);
        this.ctrlPolylinePoints.set([]);
        this.ctrlPolylinePreviewPoint.set(null);
    }

    private isModifierPolylineHeld(): boolean {
        return this.ctrlKeyPressed || this.shiftKeyPressed();
    }

    private shouldHandleModifierPolyline(eventCtrlKey: boolean): boolean {
        if (!this.ctrlPolylineActive()) {
            return eventCtrlKey || this.ctrlKeyPressed;
        }

        return this.isModifierPolylineHeld();
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

    mapLabelFontFamily(fontFamily: CampaignMapLabelFontFamily): string {
        return fontFamily === 'body' ? 'var(--body-font)' : 'var(--display-font)';
    }

    mapLabelPadding(style: CampaignMapLabel['style']): string {
        return `${style.paddingY}px ${style.paddingX}px`;
    }

    mapLabelBorderStyle(style: CampaignMapLabel['style']): string {
        return style.borderWidth > 0 ? 'solid' : 'none';
    }

    iconClass(iconType: CampaignMapIconType): string {
        return this.iconOptions.find((option) => option.type === iconType)?.iconClass ?? 'fa-duotone fa-thin fa-location-dot';
    }

    backgroundTextureClass(): string {
        return `map-board--${this.workingMap().background.toLowerCase()}`;
    }

    battlemapLocaleLabel(locale: MapArtBattlemapLocale): string {
        switch (locale) {
            case 'TownStreet':
                return 'town street';
            case 'BuildingInterior':
                return 'building interior';
            case 'Roadside':
                return 'roadside encounter';
            case 'Cliffside':
                return 'cliffside approach';
            case 'Riverside':
                return 'riverside encounter';
            case 'Ruins':
                return 'ruined site';
            case 'DungeonRoom':
                return 'dungeon room';
            case 'Tavern':
                return 'tavern interior';
            default:
                return 'forest clearing';
        }
    }

    isSelectedIcon(iconId: string): boolean {
        return this.selectedIconId() === iconId;
    }

    isSelectedDecoration(decorationId: string): boolean {
        return this.selectedDecorationId() === decorationId;
    }

    isSelectedLabel(labelId: string): boolean {
        return this.selectedLabelId() === labelId;
    }

    isSelectedStroke(strokeId: string): boolean {
        return this.selectedStrokeId() === strokeId;
    }

    isSelectedWall(wallId: string): boolean {
        return this.selectedWallId() === wallId;
    }

    toggleWallsVisibility(): void {
        if (this.isEditorMode()) {
            this.showWallsInEditor.update((value) => !value);
            return;
        }

        if (!this.canEdit()) {
            return;
        }

        this.showWallsInViewer.update((value) => !value);
    }

    toggleMapVision(): void {
        if (!this.canModify()) {
            return;
        }

        this.mutateMap((map) => {
            map.visionEnabled = !map.visionEnabled;
        });

        const enabled = this.workingMap().visionEnabled;
        this.markDirty(enabled ? 'Player vision enabled.' : 'Player vision disabled — players see the full map.');
    }

    toggleVisionPreview(): void {
        if (!this.canPreviewVision()) {
            this.showVisionPreview.set(false);
            return;
        }

        if (!this.visionPreviewToken()) {
            const fallbackToken = this.previewableTokens()[0] ?? null;
            if (fallbackToken) {
                this.selectToken(fallbackToken.id);
            }
        }

        this.showVisionPreview.update((value) => !value);
    }

    resetCurrentMapVisionExploration(): void {
        const campaignId = this.campaignId();
        const mapId = this.currentMapId();
        if (!mapId) {
            return;
        }

        if (!this.canEdit()) {
            this.showMapNotice('Only campaign owners can reset shared sight memory.');
            return;
        }

        const token = this.selectedToken();
        const visionKeys = token ? this.visionMemoryScopeKeys(token) : [];
        const primaryVisionKey = visionKeys[0] ?? null;

        if (visionKeys.length > 0) {
            for (const visionKey of visionKeys) {
                this.clearVisionExplorationEntry(mapId, visionKey);
            }
            this.showMapNotice('Sight memory reset for this token.');
        } else {
            this.clearVisionExplorationForMap(mapId);
            this.showMapNotice('Sight memory reset for this board.');
        }

        if (!campaignId) {
            return;
        }

        if (visionKeys.length > 0) {
            void Promise.all(visionKeys.map((visionKey) => this.store.resetCampaignMapVision(campaignId, mapId, visionKey)))
                .then((results) => {
                    const ok = results.every((result) => result);
                    if (!ok) {
                        this.showMapNotice('Sight memory reset here, but other viewers could not be updated for this token.');
                    }

                    this.cdr.detectChanges();
                });
            return;
        }

        void this.store.resetCampaignMapVision(campaignId, mapId, primaryVisionKey)
            .then((ok) => {
                if (!ok) {
                    this.showMapNotice('Sight memory reset here, but other viewers could not be updated.');
                }

                this.cdr.detectChanges();
            });
    }

    private markDirty(message = 'Unsaved changes.'): void {
        if (!this.canModify()) {
            return;
        }

        this.localChangeRevision += 1;
        this.hasUnsavedChanges.set(true);
        this.saveState.set('idle');
        this.saveMessage.set(message);
        this.queueAutosave();
    }

    private queueAutosave(): void {
        if (!this.canModify()) {
            return;
        }

        if (this.persistInFlight) {
            this.autosaveQueuedWhileSaving = true;
            return;
        }

        this.clearAutosaveTimer();
        this.autosaveTimerId = globalThis.setTimeout(() => {
            this.autosaveTimerId = null;

            if (this.shouldDeferAutosave()) {
                this.queueAutosave();
                return;
            }

            if (!this.canModify() || !this.hasUnsavedChanges() || this.persistInFlight) {
                return;
            }

            void this.persistWorkingMap();
        }, MAP_AUTOSAVE_DELAY_MS);
    }

    private clearAutosaveTimer(): void {
        if (this.autosaveTimerId === null) {
            return;
        }

        globalThis.clearTimeout(this.autosaveTimerId);
        this.autosaveTimerId = null;
    }

    private clearMapNoticeTimer(): void {
        if (this.mapNoticeTimerId === null) {
            return;
        }

        globalThis.clearTimeout(this.mapNoticeTimerId);
        this.mapNoticeTimerId = null;
    }

    private shouldDeferAutosave(): boolean {
        if (!this.canModify()) {
            return false;
        }

        if (this.isDrawing() || this.activeStrokePointerId !== null || this.activeLineKind !== null) {
            return true;
        }

        return this.ctrlPolylineActive() && (this.activeTool() === 'draw' || this.activeTool() === 'wall');
    }

    private showMapNotice(message: string): void {
        this.mapNotice.set(message);
        this.clearMapNoticeTimer();
        this.mapNoticeTimerId = globalThis.setTimeout(() => {
            this.mapNotice.set('');
            this.mapNoticeTimerId = null;
            this.cdr.detectChanges();
        }, 5000);
    }

    private async optimizeMapArtForStorage(imageUrl: string): Promise<string> {
        const trimmedImageUrl = imageUrl?.trim() ?? '';
        if (!trimmedImageUrl.startsWith('data:image/') || trimmedImageUrl.length <= MAP_ART_STORAGE_TARGET_DATA_URL_LENGTH) {
            return trimmedImageUrl;
        }

        if (typeof globalThis.document === 'undefined') {
            return trimmedImageUrl;
        }

        try {
            const image = await this.loadMapArtImage(trimmedImageUrl);
            const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
            const scale = longestEdge > MAP_ART_STORAGE_MAX_DIMENSION
                ? MAP_ART_STORAGE_MAX_DIMENSION / longestEdge
                : 1;
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            const canvas = globalThis.document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d');
            if (!context) {
                return trimmedImageUrl;
            }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, width, height);

            let bestImageUrl = trimmedImageUrl;
            const attempts: Array<{ type: 'image/webp' | 'image/jpeg'; quality: number }> = [
                { type: 'image/webp', quality: 0.9 },
                { type: 'image/jpeg', quality: 0.9 },
                { type: 'image/webp', quality: 0.82 },
                { type: 'image/jpeg', quality: 0.82 },
                { type: 'image/webp', quality: 0.74 },
                { type: 'image/jpeg', quality: 0.74 }
            ];

            for (const attempt of attempts) {
                const candidate = canvas.toDataURL(attempt.type, attempt.quality);
                if (candidate.length < bestImageUrl.length) {
                    bestImageUrl = candidate;
                }

                if (bestImageUrl.length <= MAP_ART_STORAGE_TARGET_DATA_URL_LENGTH) {
                    break;
                }
            }

            return bestImageUrl;
        } catch {
            return trimmedImageUrl;
        }
    }

    private loadMapArtImage(source: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = 'async';
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Map art image failed to load for optimization.'));
            image.src = source;
        });
    }

    private buildMapArtAdditionalDirection(options: MapArtGenerationOptions): string | undefined {
        const trimmedDirection = options.additionalDirection.trim();
        const lightingDirection = options.lighting === 'Night'
            ? 'Set the encounter at night with moonlight, lantern light, or torchlight, but keep the battlemat readable and avoid crushed blacks or muddy shadows.'
            : options.lighting === 'Dusk'
                ? 'Set the encounter at dusk or golden hour with warm late-day light and longer shadows, but keep the battlemat bright enough for clear tactical readability.'
                : 'Set the encounter in clear daylight with bright, even lighting and strong readability. Avoid dim, shadow-heavy, twilight, or near-night rendering.';

        if (options.background !== 'Battlemap') {
            return trimmedDirection || undefined;
        }

        const baseDirection = `Create a strict orthographic top-down 2D virtual tabletop encounter battlemat set in a ${this.battlemapLocaleLabel(options.battlemapLocale)}. This should read like a playable floor plan or printable battlemat, not scenic concept art, not a hand-drawn atlas, and not a parchment world map. Fill the frame with one local encounter site at battle scale, not a regional overview or distant geography. The camera must look straight down at 90 degrees with no isometric angle, no oblique view, no horizon, and no perspective scene art. If any part of the image looks angled, cinematic, or even slightly isometric, it is wrong and must be flattened into a pure plan view. All encounter maps, including outdoor scenes, must use the same flat VTT projection discipline as a roof-removed tavern battlemat. Include encounter-ready cover, obstacles, traversal features, and grounded props sized for token movement. Trees, buildings, walls, bridges, furniture, and cliffs must read as top-down shapes viewed from directly above. Never show wall faces, stair risers, furniture sides, or other vertical surfaces from an angle; indoor rooms must read as flattened floor-plan footprints rather than 3D rendered masonry. Prefer open thresholds, arches, or simple wall gaps over visible swinging doors or decorative door props. Visible floor tiles, flagstones, planks, or paving modules are optional and should appear only when the chosen locale naturally calls for them. Outdoor scenes such as forest clearings, roadsides, riversides, and cliff paths should usually use natural ground like dirt, grass, mud, roots, gravel, or bare stone instead of a tiled or paved center. Do not paint any visible square grid, hex grid, cell outlines, checkerboard paving, measurement marks, or repeated linework intended to act as a combat grid. If stonework or planks are present, keep them organic and irregular rather than evenly spaced like our editor grid, because the tactical grid will be added separately in the app. Do not render a baked-in grid, UI, tokens, border, cartouche, legend, parchment texture, coastline silhouette, long travel road, or labeled map features.`;
        const localeDirection = options.battlemapLocale === 'Tavern'
            ? 'This must be a single tavern or inn interior only, shown as a roof-removed floor plan from directly above, with tables, chairs, booths, bar counter, stools, hearth, stairs, kitchen access, and side rooms. Prefer open thresholds or archways instead of explicit door objects. No exterior town, road network, wilderness, mountains, coastline, or world-map composition.'
            : options.battlemapLocale === 'BuildingInterior'
                ? 'This must be a single interior floor-plan encounter space only, shown from directly above with rooms, halls, stairs, furniture, and no exterior town or regional landscape. Prefer open thresholds or archways instead of explicit door objects.'
                : options.battlemapLocale === 'Cliffside'
                    ? 'This must be one continuous top-down playable area along a cliff edge, with ledges, switchbacks, ropes, broken stone, and exposed drops shown as map shapes from above. Do not generate floating rock islands, cutaway chasms, suspended platforms over empty white space, or any side-view cliff diorama.'
                    : options.battlemapLocale === 'ForestClearing'
                        ? 'This must be a flat top-down outdoor ground plan with tree canopies, roots, brush, rocks, and cover shapes seen from above, not a scenic forest scene with visible trunks and side views. Keep the ground natural and organic; do not add a paved plaza, tiled pad, checkerboard clearing, or formal stone floor unless explicitly requested.'
                        : options.battlemapLocale === 'Roadside'
                            ? 'This must be a flat top-down roadside encounter area with the road, ditches, wagons, brush, and fences shown as gameplay shapes from above, not a cinematic travel-road scene.'
                            : options.battlemapLocale === 'Riverside'
                                ? 'This must be a flat top-down riverside encounter area with banks, ford or bridge, reeds, stones, and water edges shown as map shapes from above, not a scenic river landscape.'
                                : options.battlemapLocale === 'Ruins'
                                    ? 'This must be a flat top-down ruined site plan, with walls, rubble, pillars, and fractured floors shown as footprints and outlines from above, not a 3D ruin illustration.'
                                    : '';

        return [baseDirection, lightingDirection, localeDirection, trimmedDirection].filter(Boolean).join(' ');
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
            this.loadMapBoard(activeMap, { preserveTool: true });
            this.selectedIconId.set(null);
            this.selectedLabelId.set(null);
            this.selectedStrokeId.set(null);
            this.selectedWallId.set(null);
            this.selectedTokenId.set(null);
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

        this.clearAutosaveTimer();
        this.autosaveQueuedWhileSaving = false;
        this.persistInFlight = true;
        const saveRevision = this.localChangeRevision;
        const snapshot = this.cloneMap(this.workingMap());
        const optimizedBackgroundImageUrl = await this.optimizeMapArtForStorage(snapshot.backgroundImageUrl);
        if (optimizedBackgroundImageUrl !== snapshot.backgroundImageUrl) {
            snapshot.backgroundImageUrl = optimizedBackgroundImageUrl;
            this.workingMap.update((map) => ({
                ...map,
                backgroundImageUrl: optimizedBackgroundImageUrl
            }));
        }

        const maps = this.mapBoards().map((map) => map.id === currentMap.id ? { ...map, name: this.mapNameDraft().trim() || map.name, ...snapshot } : this.cloneMapBoard(map));
        // Editing/saving a map must not implicitly change which map is active.
        // Only the explicit "Set Active" action should switch activeMapId.
        const activeMapId = campaign.activeMapId || this.currentMapId() || currentMap.id;
        this.saveState.set('saving');
        this.saveMessage.set('Saving changes...');

        try {
            const saved = await this.store.updateCampaignMap(campaign.id, { activeMapId, maps });
            const savedMessage = `Saved ${maps.length} maps with ${snapshot.strokes.length} drawings, ${snapshot.walls.length} walls, ${snapshot.icons.length} landmarks, and ${snapshot.tokens.length} tokens on ${this.mapNameDraft().trim() || currentMap.name}.`;
            const hasNewerLocalChanges = this.localChangeRevision !== saveRevision;

            if (!saved) {
                this.saveState.set('error');
                this.saveMessage.set('Could not save your latest map change.');
                return;
            }

            this.lastPersistedRevision = Math.max(this.lastPersistedRevision, saveRevision);

            if (hasNewerLocalChanges) {
                this.saveState.set('idle');
                this.saveMessage.set('Saved previous changes. Newer edits are still local.');
                this.hasUnsavedChanges.set(true);
                this.autosaveQueuedWhileSaving = true;
            } else {
                this.saveState.set('saved');
                this.saveMessage.set(savedMessage);
                this.hasUnsavedChanges.set(false);
                this.lastLoadedMapSignature = this.mapLibrarySignature(maps, activeMapId);
            }
        } finally {
            this.persistInFlight = false;
            this.cdr.detectChanges();

            if (this.autosaveQueuedWhileSaving && this.hasUnsavedChanges() && this.canModify()) {
                this.autosaveQueuedWhileSaving = false;
                this.queueAutosave();
            }
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
        this.scheduleMapOverlayHintToneRefresh(map);
        const currentMapId = this.currentMapId();
        if (!currentMapId) {
            return;
        }

        this.mapBoards.update((maps) => maps.map((entry) => entry.id === currentMapId ? { ...entry, ...this.cloneMap(map) } : entry));
    }

    private scheduleMapOverlayHintToneRefresh(map: CampaignMap): void {
        const sourceKey = `${map.background}|${map.backgroundImageUrl}`;
        if (sourceKey === this.lastMapOverlayHintSourceKey) {
            return;
        }

        this.lastMapOverlayHintSourceKey = sourceKey;
        this.clearMapOverlayHintRefreshFrame();

        if (typeof globalThis.requestAnimationFrame === 'function') {
            this.mapOverlayHintRefreshFrameId = globalThis.requestAnimationFrame(() => {
                this.mapOverlayHintRefreshFrameId = null;
                this.refreshMapOverlayHintTone();
            });
            return;
        }

        this.refreshMapOverlayHintTone();
    }

    private clearMapOverlayHintRefreshFrame(): void {
        if (this.mapOverlayHintRefreshFrameId === null || typeof globalThis.cancelAnimationFrame !== 'function') {
            this.mapOverlayHintRefreshFrameId = null;
            return;
        }

        globalThis.cancelAnimationFrame(this.mapOverlayHintRefreshFrameId);
        this.mapOverlayHintRefreshFrameId = null;
    }

    private computeMapOverlayHintUseDarkText(): boolean {
        const map = this.workingMap();
        const board = this.mapBoard()?.nativeElement;
        const artImage = board?.querySelector<HTMLImageElement>('.map-board-art') ?? null;

        if (!board || !map.backgroundImageUrl || !artImage?.complete || artImage.naturalWidth <= 0 || artImage.naturalHeight <= 0) {
            return this.defaultMapOverlayHintUseDarkText(map.background);
        }

        const boardWidth = board.clientWidth;
        const boardHeight = board.clientHeight;
        if (boardWidth <= 0 || boardHeight <= 0) {
            return this.defaultMapOverlayHintUseDarkText(map.background);
        }

        try {
            const scale = Math.max(boardWidth / artImage.naturalWidth, boardHeight / artImage.naturalHeight);
            const renderedWidth = artImage.naturalWidth * scale;
            const renderedHeight = artImage.naturalHeight * scale;
            const cropLeft = Math.max(0, (renderedWidth - boardWidth) / 2);
            const cropTop = Math.max(0, (renderedHeight - boardHeight) / 2);
            const sampleLeft = boardWidth * 0.2;
            const sampleTop = boardHeight * 0.015;
            const sampleWidth = boardWidth * 0.6;
            const sampleHeight = boardHeight * 0.14;
            const sourceX = Math.max(0, Math.floor((sampleLeft + cropLeft) / scale));
            const sourceY = Math.max(0, Math.floor((sampleTop + cropTop) / scale));
            const sourceWidth = Math.max(1, Math.min(artImage.naturalWidth - sourceX, Math.ceil(sampleWidth / scale)));
            const sourceHeight = Math.max(1, Math.min(artImage.naturalHeight - sourceY, Math.ceil(sampleHeight / scale)));
            const canvas = globalThis.document?.createElement('canvas');
            const context = canvas?.getContext('2d', { willReadFrequently: true });

            if (!canvas || !context) {
                return this.defaultMapOverlayHintUseDarkText(map.background);
            }

            canvas.width = 24;
            canvas.height = 8;
            context.drawImage(artImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            let luminanceTotal = 0;
            let sampleCount = 0;

            for (let index = 0; index < imageData.data.length; index += 4) {
                const alpha = imageData.data[index + 3] / 255;
                if (alpha < 0.05) {
                    continue;
                }

                const red = imageData.data[index] / 255;
                const green = imageData.data[index + 1] / 255;
                const blue = imageData.data[index + 2] / 255;
                luminanceTotal += ((0.2126 * red) + (0.7152 * green) + (0.0722 * blue)) * alpha;
                sampleCount += 1;
            }

            if (sampleCount === 0) {
                return this.defaultMapOverlayHintUseDarkText(map.background);
            }

            return (luminanceTotal / sampleCount) >= CampaignMapPageComponent.MAP_OVERLAY_HINT_LUMINANCE_THRESHOLD;
        } catch {
            return this.defaultMapOverlayHintUseDarkText(map.background);
        }
    }

    private defaultMapOverlayHintUseDarkText(background: CampaignMapBackground): boolean {
        return background !== 'Cavern';
    }

    private mergeRealtimeTokenState(campaign: Campaign, routeMapId: string): void {
        const realtimeMaps = campaign.maps.length > 0
            ? campaign.maps.map((map) => this.cloneMapBoard(map))
            : [this.createEmptyMapBoard('Main Map', campaign.map.background)];
        const realtimeMapLookup = new Map(realtimeMaps.map((map) => [map.id, map]));

        this.mapBoards.update((maps) => maps.map((map) => {
            const realtimeMap = realtimeMapLookup.get(map.id);
            return realtimeMap ? this.mergeTokenStateIntoBoard(map, realtimeMap) : map;
        }));

        const currentMapId = this.currentMapId();
        const activeRealtimeMap = realtimeMapLookup.get(currentMapId)
            ?? realtimeMapLookup.get(routeMapId)
            ?? realtimeMapLookup.get(campaign.activeMapId)
            ?? realtimeMaps[0]
            ?? null;

        if (!activeRealtimeMap) {
            return;
        }

        this.workingMap.update((map) => this.mergeTokenStateIntoMap(map, activeRealtimeMap));
        this.cdr.detectChanges();
    }

    private mergeTokenStateIntoBoard(localMap: CampaignMapBoard, realtimeMap: CampaignMapBoard): CampaignMapBoard {
        return {
            ...localMap,
            tokens: this.mergeTokens(localMap.tokens, realtimeMap.tokens)
        };
    }

    private mergeTokenStateIntoMap(localMap: CampaignMap, realtimeMap: CampaignMapBoard): CampaignMap {
        return {
            ...this.cloneMap(localMap),
            tokens: this.mergeTokens(localMap.tokens, realtimeMap.tokens)
        };
    }

    private mergeTokens(localTokens: CampaignMapToken[], realtimeTokens: CampaignMapToken[]): CampaignMapToken[] {
        const normalizedRealtimeTokens = realtimeTokens.map((token) => ({ ...token }));
        const realtimeTokenLookup = new Map(normalizedRealtimeTokens.map((token) => [token.id, token]));
        const draggingTokenId = this.draggingTokenId;
        const localTokenIds = new Set(localTokens.map((token) => token.id));

        return [
            ...localTokens.map((token) => {
                if (token.id === draggingTokenId) {
                    return token;
                }

                const realtimeToken = realtimeTokenLookup.get(token.id);
                if (!realtimeToken) {
                    return token;
                }

                if (realtimeToken.moveRevision < (token.moveRevision ?? 0)) {
                    return token;
                }

                return {
                    ...token,
                    x: realtimeToken.x,
                    y: realtimeToken.y,
                    size: realtimeToken.size,
                    assignedUserId: realtimeToken.assignedUserId ?? null,
                    assignedCharacterId: realtimeToken.assignedCharacterId ?? null,
                    moveRevision: realtimeToken.moveRevision
                };
            }),
            ...normalizedRealtimeTokens
                .filter((token) => token.id !== draggingTokenId && !localTokenIds.has(token.id))
                .map((token) => ({
                    ...token,
                    assignedUserId: token.assignedUserId ?? null,
                    assignedCharacterId: token.assignedCharacterId ?? null,
                    moveRevision: Number.isFinite(token.moveRevision) ? Math.max(0, Math.trunc(token.moveRevision)) : 0
                }))
        ];
    }

    private cloneMap(map: CampaignMap | null | undefined): CampaignMap {
        if (!map) {
            return this.createEmptyMap();
        }

        const gridColumns = this.normalizeMapGridCount(map.gridColumns, DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS);
        const gridRows = this.normalizeMapGridCount(map.gridRows, DEFAULT_CAMPAIGN_MAP_GRID_ROWS);
        const gridOffsetX = this.normalizeMapGridOffset(map.gridOffsetX, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X);
        const gridOffsetY = this.normalizeMapGridOffset(map.gridOffsetY, DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y);

        return {
            background: map.background,
            backgroundImageUrl: map.backgroundImageUrl,
            gridColumns,
            gridRows,
            gridColor: this.normalizeMapGridColor(map.gridColor, map.background),
            gridOffsetX,
            gridOffsetY,
            visionEnabled: map.visionEnabled ?? true,
            membersCanViewAnytime: map.membersCanViewAnytime ?? false,
            strokes: map.strokes.map((stroke) => ({
                id: stroke.id,
                color: stroke.color,
                width: stroke.width,
                points: stroke.points.map((point) => ({ ...point }))
            })),
            walls: map.walls.map((wall) => ({
                id: wall.id,
                color: wall.color,
                width: wall.width,
                points: wall.points.map((point) => ({ ...point })),
                blocksVision: wall.blocksVision ?? true,
                blocksMovement: wall.blocksMovement ?? true
            })),
            icons: map.icons.map((icon) => ({ ...icon })),
            tokens: map.tokens.map((token) => ({
                ...token,
                x: this.clampCoordinate(token.x),
                y: this.clampCoordinate(token.y),
                size: this.normalizeTokenGridSpan(token.size),
                assignedUserId: token.assignedUserId ?? null,
                assignedCharacterId: token.assignedCharacterId ?? null,
                moveRevision: Number.isFinite(token.moveRevision) ? Math.max(0, Math.trunc(token.moveRevision)) : 0
            })),
            decorations: map.decorations.map((decoration) => ({ ...decoration })),
            labels: map.labels.map((label) => ({
                ...label,
                style: { ...label.style }
            })),
            layers: {
                rivers: map.layers.rivers.map((stroke) => ({
                    id: stroke.id,
                    color: stroke.color,
                    width: stroke.width,
                    points: stroke.points.map((point) => ({ ...point }))
                })),
                mountainChains: map.layers.mountainChains.map((decoration) => ({ ...decoration })),
                forestBelts: map.layers.forestBelts.map((decoration) => ({ ...decoration }))
            },
            visionMemory: map.visionMemory.map((entry) => ({
                key: entry.key,
                polygons: entry.polygons.map((polygon) => ({
                    points: polygon.points.map((point) => ({ ...point }))
                })),
                lastOrigin: entry.lastOrigin ? { ...entry.lastOrigin } : null,
                lastPolygonHash: entry.lastPolygonHash,
                revision: Number.isFinite(entry.revision) ? Math.max(0, Math.trunc(entry.revision)) : 0
            }))
        };
    }

    private createEmptyMap(background: CampaignMapBackground = 'Parchment'): CampaignMap {
        return {
            background,
            backgroundImageUrl: '',
            gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
            gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
            gridColor: this.defaultGridColorForBackground(background),
            gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
            gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
            visionEnabled: true,
            membersCanViewAnytime: false,
            strokes: [],
            walls: [],
            icons: [],
            tokens: [],
            decorations: [],
            labels: [],
            layers: {
                rivers: [],
                mountainChains: [],
                forestBelts: []
            },
            visionMemory: []
        };
    }

    private defaultMapLabelStyle(tone: CampaignMapLabelTone): CampaignMapLabel['style'] {
        if (tone === 'Feature') {
            return {
                color: '#f6ead8',
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                fontFamily: 'body',
                fontSize: 0.84,
                fontWeight: 600,
                letterSpacing: 0.08,
                fontStyle: 'italic',
                textTransform: 'none',
                borderWidth: 0,
                borderRadius: 8,
                paddingX: 0,
                paddingY: 0,
                textShadow: '0 1px 0 rgba(43, 28, 19, 0.72), 0 2px 10px rgba(0, 0, 0, 0.34)',
                boxShadow: 'none',
                opacity: 0.98
            };
        }

        return {
            color: '#fff4e5',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            fontFamily: 'display',
            fontSize: 1,
            fontWeight: 650,
            letterSpacing: 0.18,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            borderWidth: 0,
            borderRadius: 8,
            paddingX: 0,
            paddingY: 0,
            textShadow: '0 1px 0 rgba(43, 28, 19, 0.78), 0 2px 12px rgba(0, 0, 0, 0.4)',
            boxShadow: 'none',
            opacity: 1
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

    private loadMapBoard(map: CampaignMapBoard, options?: { preserveTool?: boolean; preserveTokenSelection?: boolean }): void {
        const preserveTool = options?.preserveTool === true;
        const preserveTokenSelection = options?.preserveTokenSelection === true;
        const activeTool = this.activeTool();
        const pendingIconType = this.pendingIconType();
        const pendingTerrainType = this.pendingTerrainType();
        const selectedTokenId = preserveTokenSelection ? this.selectedTokenId() : null;

        this.currentMapId.set(map.id);
        this.workingMap.set(this.cloneMap(map));
        this.clearCtrlPolylineDraft();
        this.isDrawing.set(false);
        this.activeStrokePointerId = null;
        this.activeLineKind = null;
        this.activeStrokeOrigin = null;
        this.activeStrokeDrawMode = 'freehand';
        this.activeTool.set(preserveTool ? activeTool : 'select');
        this.pendingIconType.set(preserveTool ? pendingIconType : null);
        this.pendingTerrainType.set(preserveTool ? pendingTerrainType : null);
        this.pendingStrokeId = null;
        this.pendingStrokeKind = null;
        this.pendingStrokePointerId = null;
        this.pendingStrokePoint = null;
        this.draggingStrokeId = null;
        this.draggingStrokeKind = null;
        this.draggingStrokePointerId = null;
        this.draggingStrokeLastPoint = null;
        this.strokeMoved = false;
        this.selectedDecorationId.set(null);
        this.selectedIconId.set(null);
        this.selectedLabelId.set(null);
        this.selectedStrokeId.set(null);
        this.selectedWallId.set(null);
        this.selectedTokenId.set(selectedTokenId && map.tokens.some((token) => token.id === selectedTokenId) ? selectedTokenId : null);
        this.showVisionPreview.set(false);
        this.iconLabelDraft.set('');
        this.tokenNameDraft.set('');
        this.tokenNoteDraft.set('');
        this.tokenPlacementNameDraft.set('Token');
        this.tokenPlacementNoteDraft.set('');
        this.tokenPlacementImageUrl.set('');
        this.tokenPlacementNpcId.set('');
        this.tokenPlacementSize.set(1);
        this.tokenAssignmentDraft.set('none');
        this.tokenUploadFeedback.set('');
        this.tokenCropModalOpen.set(false);
        this.tokenCropSourceImageUrl.set('');
        this.tokenCropSourceName.set('Token');
        this.labelToneDraft.set('Region');
        this.labelTextDraft.set(this.defaultLabelText('Region'));
        this.localChangeRevision = 0;
        this.lastPersistedRevision = 0;
        this.mapArtModalOpen.set(false);
        this.settlementNamesDraft.set('');
        this.regionNamesDraft.set('');
        this.ruinNamesDraft.set('');
        this.cavernNamesDraft.set('');
        this.separateLabelsDraft.set(true);
        this.additionalArtDirectionDraft.set('');
        this.settlementScale.set('City');
        this.parchmentLayout.set('Continent');
        this.cavernLayout.set('TunnelNetwork');
        this.confirmAction.set(null);
        this.mapNameDraft.set(map.name);
        this.scheduleMapOverlayHintToneRefresh(this.workingMap());
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
        const activeMapId = existingMaps.some((map) => map.id === campaign.activeMapId)
            ? campaign.activeMapId
            : existingMaps[0]?.id ?? nextBoard.id;

        this.mapBoards.set(nextMaps);
        this.loadMapBoard(nextBoard);
        this.undoStack.set([]);
        this.redoStack.set([]);
        this.pendingDragHistory = null;
        this.saveState.set('saving');
        this.saveMessage.set('Creating map...');
        this.cdr.detectChanges();

        try {
            const saved = await this.store.updateCampaignMap(campaign.id, { activeMapId, maps: nextMaps });
            if (!saved) {
                this.saveState.set('error');
                this.saveMessage.set('Could not create a new map right now.');
                this.cdr.detectChanges();
                await this.router.navigate(this.mapListRoute(campaign.id), { replaceUrl: true });
                return;
            }

            this.lastLoadedMapSignature = this.mapLibrarySignature(nextMaps, activeMapId);
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

    private async navigateToMapViewWithFallback(campaignId: string, mapId: string): Promise<void> {
        const targetRoute = this.mapViewRoute(campaignId, mapId);

        try {
            const navigated = await this.router.navigate(targetRoute, { replaceUrl: true });
            if (navigated) {
                return;
            }
        } catch {
            // Fall back to hard navigation if the router rejects the transition.
        }

        const targetUrl = this.router.serializeUrl(this.router.createUrlTree(targetRoute));
        globalThis.location.assign(targetUrl);
    }

    private canMemberStayOnMap(displayedMapId: string, maps: CampaignMapBoard[], activeMapId: string): boolean {
        if (!displayedMapId) {
            return false;
        }

        const displayedMap = maps.find((map) => map.id === displayedMapId) ?? null;
        const mainMapId = maps[0]?.id ?? '';
        return displayedMapId === activeMapId
            || (!!displayedMap?.membersCanViewAnytime)
            || (!!mainMapId && displayedMapId === mainMapId);
    }

    private mapEditRoute(campaignId: string, mapId: string): string[] {
        return ['/campaigns', campaignId, 'maps', mapId, 'edit'];
    }

    private mapRouteForCurrentMode(campaignId: string, mapId: string): string[] {
        return this.isEditorMode() ? this.mapEditRoute(campaignId, mapId) : this.mapViewRoute(campaignId, mapId);
    }

    canControlToken(token: CampaignMapToken | null): boolean {
        if (!token) {
            return false;
        }

        if (this.canEdit()) {
            return true;
        }

        return this.isTokenAssignedToCurrentUser(token);
    }

    private isTokenAssignedToCurrentUser(token: CampaignMapToken): boolean {
        const currentUserId = this.currentUserId();
        if (!currentUserId) {
            return false;
        }

        if (token.assignedUserId === currentUserId) {
            return true;
        }

        return !!token.assignedCharacterId && this.campaignCharacters().some((character) => character.id === token.assignedCharacterId && character.ownerUserId === currentUserId);
    }

    tokenAssignmentSummary(token: CampaignMapToken): string {
        if (token.assignedCharacterId) {
            const character = this.campaignCharacters().find((entry) => entry.id === token.assignedCharacterId);
            if (character) {
                return `${character.name} can move this token on the active map.`;
            }

            return 'Assigned to a character that is no longer available in this campaign.';
        }

        if (token.assignedUserId) {
            const member = this.selectedCampaign()?.members?.find((entry) => entry.userId === token.assignedUserId);
            if (member) {
                return `${member.displayName} can move this token on the active map.`;
            }

            return 'Assigned to a player who is not currently available in this campaign.';
        }

        return 'Unassigned. Only campaign owners can move this token.';
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

    private allDecorations(): CampaignMapDecoration[] {
        return [
            ...this.workingMap().decorations,
            ...(this.showMountainChains() ? this.workingMap().layers.mountainChains : []),
            ...(this.showForestBelts() ? this.workingMap().layers.forestBelts : [])
        ];
    }

    private deleteStrokeById(strokeId: string, message: string): void {
        this.deleteLineById(strokeId, message, 'drawing');
    }

    private deleteWallById(wallId: string, message: string): void {
        this.deleteLineById(wallId, message, 'wall');
    }

    private deleteLineById(lineId: string, message: string, kind: MapLineKind): void {
        if (!this.canModify()) {
            return;
        }

        const lines = kind === 'wall' ? this.workingMap().walls : this.workingMap().strokes;
        const existingStroke = lines.find((stroke) => stroke.id === lineId);
        if (!existingStroke) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            if (kind === 'wall') {
                map.walls = map.walls.filter((stroke) => stroke.id !== lineId);
                return;
            }

            map.strokes = map.strokes.filter((stroke) => stroke.id !== lineId);
        });
        if (kind === 'wall') {
            this.selectedWallId.set(null);
        } else {
            this.selectedStrokeId.set(null);
        }
        this.markDirty(message);
    }

    private findNearestStrokeAtPoint(x: number, y: number): CampaignMap['strokes'][number] | null {
        return this.findNearestLineAtPoint(x, y, 'drawing');
    }

    private findNearestWallAtPoint(x: number, y: number): CampaignMap['walls'][number] | null {
        let closestWall: CampaignMap['walls'][number] | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const wall of this.workingMap().walls) {
            const distance = this.distanceToStroke(wall, x, y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestWall = wall;
            }
        }

        return closestWall && closestDistance <= this.strokeSelectionThreshold(closestWall.width)
            ? closestWall
            : null;
    }

    private findNearestLineAtPoint(x: number, y: number, kind: MapLineKind): CampaignMapStroke | null {
        let closestStroke: CampaignMap['strokes'][number] | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        const lines = kind === 'wall' ? this.workingMap().walls : this.workingMap().strokes;
        for (const stroke of lines) {
            const distance = this.distanceToStroke(stroke, x, y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestStroke = stroke;
            }
        }

        return closestStroke && closestDistance <= this.strokeSelectionThreshold(closestStroke.width)
            ? closestStroke
            : null;
    }

    private distanceToStroke(stroke: CampaignMap['strokes'][number], x: number, y: number): number {
        if (stroke.points.length === 0) {
            return Number.POSITIVE_INFINITY;
        }

        if (stroke.points.length === 1) {
            const anchor = stroke.points[0];
            return Math.hypot(anchor.x - x, (anchor.y - y) * (10 / 7));
        }

        let closestDistance = Number.POSITIVE_INFINITY;
        for (let index = 1; index < stroke.points.length; index++) {
            const previous = stroke.points[index - 1];
            const current = stroke.points[index];
            const distance = this.distanceToSegment(previous, current, { x, y });
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    private distanceToSegment(start: CampaignMapPoint, end: CampaignMapPoint, point: CampaignMapPoint): number {
        const scaledStart = { x: start.x, y: start.y * (10 / 7) };
        const scaledEnd = { x: end.x, y: end.y * (10 / 7) };
        const scaledPoint = { x: point.x, y: point.y * (10 / 7) };
        const deltaX = scaledEnd.x - scaledStart.x;
        const deltaY = scaledEnd.y - scaledStart.y;
        const segmentLengthSquared = (deltaX * deltaX) + (deltaY * deltaY);

        if (segmentLengthSquared === 0) {
            return Math.hypot(scaledPoint.x - scaledStart.x, scaledPoint.y - scaledStart.y);
        }

        const projection = ((scaledPoint.x - scaledStart.x) * deltaX + (scaledPoint.y - scaledStart.y) * deltaY) / segmentLengthSquared;
        const clampedProjection = Math.max(0, Math.min(1, projection));
        const projectedX = scaledStart.x + (deltaX * clampedProjection);
        const projectedY = scaledStart.y + (deltaY * clampedProjection);
        return Math.hypot(scaledPoint.x - projectedX, scaledPoint.y - projectedY);
    }

    private strokeSelectionThreshold(width: number): number {
        return 0.018 + (Math.max(2, width) / 1000);
    }

    private translateStrokeById(strokeId: string, deltaX: number, deltaY: number, kind: MapLineKind = 'drawing'): boolean {
        if (!deltaX && !deltaY) {
            return false;
        }

        let changed = false;
        this.mutateMap((map) => {
            if (kind === 'wall') {
                map.walls = map.walls.map((wall) => {
                    if (wall.id !== strokeId) {
                        return wall;
                    }

                    const translated = this.translateStrokePoints(wall.points, deltaX, deltaY);
                    if (translated === wall.points) {
                        return wall;
                    }

                    changed = true;
                    return {
                        ...wall,
                        points: translated
                    };
                });
            } else {
                map.strokes = map.strokes.map((stroke) => {
                    if (stroke.id !== strokeId) {
                        return stroke;
                    }

                    const translated = this.translateStrokePoints(stroke.points, deltaX, deltaY);
                    if (translated === stroke.points) {
                        return stroke;
                    }

                    changed = true;
                    return {
                        ...stroke,
                        points: translated
                    };
                });
            }
        });

        return changed;
    }

    private translateStrokePoints(points: CampaignMapPoint[], deltaX: number, deltaY: number): CampaignMapPoint[] {
        if (points.length === 0) {
            return points;
        }

        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const boundedDeltaX = Math.max(-minX, Math.min(1 - maxX, deltaX));
        const boundedDeltaY = Math.max(-minY, Math.min(1 - maxY, deltaY));

        if (!boundedDeltaX && !boundedDeltaY) {
            return points;
        }

        return points.map((point) => ({
            x: this.clampCoordinate(point.x + boundedDeltaX),
            y: this.clampCoordinate(point.y + boundedDeltaY)
        }));
    }

    private eraseRoutesAtPoint(point: CampaignMapPoint): boolean {
        const eraseRadius = 0.02;
        let changed = false;

        this.mutateMap((map) => {
            const nextStrokes: CampaignMap['strokes'] = [];

            for (const stroke of map.strokes) {
                const remainingSegments = this.removeStrokeSegmentsAtPoint(stroke, point, eraseRadius);
                const unchanged = remainingSegments.length === 1
                    && remainingSegments[0].id === stroke.id
                    && remainingSegments[0].points.length === stroke.points.length;

                if (!unchanged) {
                    changed = true;
                }

                nextStrokes.push(...remainingSegments);
            }

            map.strokes = nextStrokes;

            const nextWalls: CampaignMap['walls'] = [];
            for (const wall of map.walls) {
                const remainingSegments = this.removeStrokeSegmentsAtPoint(wall, point, eraseRadius);
                const unchanged = remainingSegments.length === 1
                    && remainingSegments[0].id === wall.id
                    && remainingSegments[0].points.length === wall.points.length;

                if (!unchanged) {
                    changed = true;
                }

                nextWalls.push(...remainingSegments);
            }

            map.walls = nextWalls;
        });

        if (changed && this.selectedStrokeId() && !this.workingMap().strokes.some((stroke) => stroke.id === this.selectedStrokeId())) {
            this.selectedStrokeId.set(null);
        }

        if (changed && this.selectedWallId() && !this.workingMap().walls.some((wall) => wall.id === this.selectedWallId())) {
            this.selectedWallId.set(null);
        }

        return changed;
    }

    private removeStrokeSegmentsAtPoint<T extends CampaignMapStroke>(
        stroke: T,
        point: CampaignMapPoint,
        eraseRadius: number
    ): T[] {
        if (stroke.points.length < 2) {
            return this.distanceToStroke(stroke, point.x, point.y) <= eraseRadius ? [] : [stroke];
        }

        const segments: T[] = [];
        let currentPoints: CampaignMapPoint[] = [];

        for (let index = 1; index < stroke.points.length; index++) {
            const start = stroke.points[index - 1];
            const end = stroke.points[index];
            const shouldEraseSegment = this.distanceToSegment(start, end, point) <= eraseRadius;

            if (shouldEraseSegment) {
                if (currentPoints.length > 1) {
                    segments.push({
                        ...stroke,
                        id: this.createId(),
                        points: currentPoints
                    });
                }

                currentPoints = [];
                continue;
            }

            if (currentPoints.length === 0) {
                currentPoints = [{ ...start }];
            }

            currentPoints = [...currentPoints, { ...end }];
        }

        if (currentPoints.length > 1) {
            segments.push({
                ...stroke,
                id: segments.length === 0 && currentPoints.length === stroke.points.length ? stroke.id : this.createId(),
                points: currentPoints
            });
        }

        return segments;
    }

    private resolveTokenVisionRangeFeet(token: CampaignMapToken): number {
        const assignedCharacter = token.assignedCharacterId
            ? this.campaignCharacters().find((character) => character.id === token.assignedCharacterId) ?? null
            : null;

        if (!assignedCharacter) {
            return 30;
        }

        const ranges = [
            ...this.extractVisionRanges(assignedCharacter.traits),
            ...this.extractVisionRanges(assignedCharacter.speciesTraits),
            ...this.extractVisionRanges(assignedCharacter.classFeatures),
            ...this.extractVisionRanges(assignedCharacter.equipment)
        ];

        return ranges.length > 0 ? Math.max(...ranges) : 30;
    }

    private extractVisionRanges(entries: string[] | undefined): number[] {
        if (!entries?.length) {
            return [];
        }

        return entries.flatMap((entry) => {
            const normalized = entry.toLowerCase();
            if (!/(darkvision|blindsight|truesight|tremorsense|vision)/.test(normalized)) {
                return [];
            }

            const matches = [...entry.matchAll(/(\d{1,3})\s*(?:foot|feet|ft)\b/gi)];
            return matches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value) && value > 0);
        });
    }

    private buildVisionPolygon(token: CampaignMapToken): CampaignMapPoint[] {
        const origin = this.tokenVisionOrigin(token);
        const rangeFeet = this.resolveTokenVisionRangeFeet(token);
        const rangePixels = this.visionRangePixels(rangeFeet, token.size);
        const wallSegments = this.mapWallSegments('vision');
        const boundarySegments = [
            [{ x: 0, y: 0 }, { x: 1000, y: 0 }],
            [{ x: 1000, y: 0 }, { x: 1000, y: 700 }],
            [{ x: 1000, y: 700 }, { x: 0, y: 700 }],
            [{ x: 0, y: 700 }, { x: 0, y: 0 }]
        ] as const;
        const segments = [...wallSegments, ...boundarySegments];
        const epsilon = 0.0001;
        const angles = new Set<number>();

        for (let index = 0; index < 72; index++) {
            angles.add((Math.PI * 2 * index) / 72);
        }

        for (const [start, end] of wallSegments) {
            const startAngle = Math.atan2(start.y - origin.y, start.x - origin.x);
            const endAngle = Math.atan2(end.y - origin.y, end.x - origin.x);
            for (const angle of [startAngle, startAngle - epsilon, startAngle + epsilon, endAngle, endAngle - epsilon, endAngle + epsilon]) {
                angles.add(angle);
            }
        }

        return [...angles]
            .sort((left, right) => left - right)
            .map((angle) => this.castVisionRay(origin, angle, rangePixels, segments))
            .map((point) => ({
                x: this.clampCoordinate(point.x / 1000),
                y: this.clampCoordinate(point.y / 700)
            }));
    }

    private formatVisionPolygonPoints(points: CampaignMapPoint[]): string {
        return points.map((point) => `${Math.round(point.x * 1000)},${Math.round(point.y * 700)}`).join(' ');
    }

    private rememberVisionPolygon(token: CampaignMapToken, polygon: CampaignMapPoint[]): void {
        const key = this.visionMemoryKey(token);
        const origin = this.tokenVisionOriginNormalized(token);
        const nextPolygon = polygon.map((point) => ({ ...point }));
        const polygonHash = this.hashVisionPolygon(nextPolygon);
        let updated = false;

        const resetOrigin = this.resetVisionMemoryOrigins.get(key);
        if (resetOrigin && (!resetOrigin || this.distanceBetweenPoints(resetOrigin, origin) < MAP_VISION_MEMORY_ORIGIN_THRESHOLD)) {
            return;
        }

        this.resetVisionMemoryOrigins.delete(key);

        this.visionExploration.update((memory) => {
            const existing = memory[key];
            if (existing?.lastPolygonHash === polygonHash && existing.lastOrigin && this.distanceBetweenPoints(existing.lastOrigin, origin) < MAP_VISION_MEMORY_ORIGIN_THRESHOLD) {
                return memory;
            }

            const polygons = [...(existing?.polygons ?? []), nextPolygon].slice(-MAP_VISION_MEMORY_LIMIT);
            updated = true;
            return {
                ...memory,
                [key]: {
                    key: existing?.key ?? this.visionMemoryScopeKey(token),
                    polygons,
                    lastOrigin: origin,
                    lastPolygonHash: polygonHash,
                    revision: Math.max(0, existing?.revision ?? 0) + 1
                }
            };
        });

        if (updated && this.shouldPersistVisionMemory(token)) {
            if (this.canEdit()) {
                this.queueVisionMemoryPersistence(key);
            } else {
                this.pendingVisionMemoryPersistenceKeys.add(key);
                this.syncPendingVisionMemorySnapshot();
            }
        }
    }

    private clearVisionExplorationForMap(mapId: string): void {
        const prefix = `${mapId}::`;
        for (const key of [...this.pendingVisionMemoryPersistenceKeys]) {
            if (key.startsWith(prefix)) {
                this.pendingVisionMemoryPersistenceKeys.delete(key);
            }
        }
        for (const key of [...this.inFlightVisionMemoryPersistenceKeys]) {
            if (key.startsWith(prefix)) {
                this.inFlightVisionMemoryPersistenceKeys.delete(key);
            }
        }

        for (const token of this.workingMap().tokens) {
            this.suppressVisionMemoryUntilTokenMoves(mapId, this.visionMemoryScopeKey(token), token);
        }

        this.visionExploration.update((memory) => Object.fromEntries(
            Object.entries(memory).filter(([key]) => !key.startsWith(prefix))
        ));
    }

    private clearVisionExplorationEntry(mapId: string, visionKey: string): void {
        const compoundKey = `${mapId}::${visionKey}`;
        this.pendingVisionMemoryPersistenceKeys.delete(compoundKey);
        this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
        const token = this.workingMap().tokens.find((entry) => this.visionMemoryScopeKey(entry) === visionKey) ?? null;
        this.suppressVisionMemoryUntilTokenMoves(mapId, visionKey, token);
        this.visionExploration.update((memory) => {
            const next = { ...memory };
            delete next[compoundKey];
            return next;
        });
        this.syncPendingVisionMemorySnapshot();
    }

    private suppressVisionMemoryUntilTokenMoves(mapId: string, visionKey: string, token: CampaignMapToken | null): void {
        this.resetVisionMemoryOrigins.set(
            `${mapId}::${visionKey}`,
            token ? this.tokenVisionOriginNormalized(token) : null
        );
    }

    private visionMemoryKey(token: CampaignMapToken): string {
        return `${this.currentMapId()}::${this.visionMemoryScopeKey(token)}`;
    }

    private visionMemoryScopeKey(token: CampaignMapToken): string {
        return this.visionMemoryScopeKeys(token)[0] ?? `token:${token.id}`;
    }

    private visionMemoryScopeKeys(token: CampaignMapToken): string[] {
        const keys: string[] = [];

        if (token.assignedCharacterId) {
            keys.push(`character:${token.assignedCharacterId}`);
        }

        if (token.assignedUserId) {
            keys.push(`user:${token.assignedUserId}`);
        }

        keys.push(`token:${token.id}`);

        return [...new Set(keys.filter((key) => !!key.trim()))];
    }

    private visionMemoryEntriesForToken(token: CampaignMapToken): MapVisionMemoryEntryState[] {
        const visionExploration = this.visionExploration();

        return this.visionMemoryScopeKeys(token)
            .map((scopeKey) => visionExploration[`${this.currentMapId()}::${scopeKey}`])
            .filter((entry): entry is MapVisionMemoryEntryState => Boolean(entry));
    }

    private shouldPersistVisionMemory(token: CampaignMapToken): boolean {
        return !!this.campaignId()
            && this.isPersistableMapId(this.currentMapId())
            && (this.canEdit() || this.canControlToken(token));
    }

    private isPersistableMapId(mapId: string): boolean {
        if (!mapId) {
            return false;
        }

        return this.selectedCampaign()?.maps?.some((map) => map.id === mapId) === true;
    }

    private hydrateVisionExplorationFromMaps(maps: CampaignMapBoard[]): void {
        const existingMemory = this.visionExploration();
        const persistedPendingMemory = this.loadPendingVisionMemorySnapshot(this.campaignId());
        const localMemory = {
            ...persistedPendingMemory,
            ...existingMemory
        };
        const currentMapIds = new Set(maps.map((map) => map.id));
        const pendingKeys = new Set([
            ...this.pendingVisionMemoryPersistenceKeys,
            ...this.inFlightVisionMemoryPersistenceKeys,
            ...Object.keys(persistedPendingMemory)
        ]);
        const backendMemory = Object.fromEntries(maps.flatMap((map) =>
            map.visionMemory.map((entry) => [
                `${map.id}::${entry.key}`,
                {
                    key: entry.key,
                    polygons: entry.polygons.map((polygon) => polygon.points.map((point) => ({ ...point }))),
                    lastOrigin: entry.lastOrigin ? { ...entry.lastOrigin } : null,
                    lastPolygonHash: entry.lastPolygonHash,
                    revision: Number.isFinite(entry.revision) ? Math.max(0, Math.trunc(entry.revision)) : 0
                } satisfies MapVisionMemoryEntryState
            ])
        ));

        const nextMemory = { ...backendMemory };
        for (const [key, localEntry] of Object.entries(localMemory)) {
            const separatorIndex = key.indexOf('::');
            if (separatorIndex <= 0) {
                continue;
            }

            const mapId = key.slice(0, separatorIndex);
            if (!currentMapIds.has(mapId) || !this.shouldPreferLocalVisionMemory(localEntry, backendMemory[key])) {
                continue;
            }

            nextMemory[key] = {
                key: localEntry.key,
                polygons: localEntry.polygons.map((polygon) => polygon.map((point) => ({ ...point }))),
                lastOrigin: localEntry.lastOrigin ? { ...localEntry.lastOrigin } : null,
                lastPolygonHash: localEntry.lastPolygonHash,
                revision: localEntry.revision
            } satisfies MapVisionMemoryEntryState;
        }

        for (const key of pendingKeys) {
            const separatorIndex = key.indexOf('::');
            if (separatorIndex <= 0) {
                continue;
            }

            const mapId = key.slice(0, separatorIndex);
            if (!currentMapIds.has(mapId)) {
                continue;
            }

            const localEntry = existingMemory[key] ?? persistedPendingMemory[key];
            if (!localEntry) {
                continue;
            }

            nextMemory[key] = {
                key: localEntry.key,
                polygons: localEntry.polygons.map((polygon) => polygon.map((point) => ({ ...point }))),
                lastOrigin: localEntry.lastOrigin ? { ...localEntry.lastOrigin } : null,
                lastPolygonHash: localEntry.lastPolygonHash,
                revision: localEntry.revision
            } satisfies MapVisionMemoryEntryState;
        }

        this.visionExploration.set(nextMemory);

        this.pendingVisionMemoryPersistenceKeys.clear();
        this.inFlightVisionMemoryPersistenceKeys.clear();
        for (const key of pendingKeys) {
            const separatorIndex = key.indexOf('::');
            if (separatorIndex <= 0) {
                continue;
            }

            const mapId = key.slice(0, separatorIndex);
            if (!currentMapIds.has(mapId)) {
                continue;
            }

            const localEntry = existingMemory[key] ?? persistedPendingMemory[key];
            if (!this.matchesVisionMemoryEntry(backendMemory[key], localEntry)) {
                this.pendingVisionMemoryPersistenceKeys.add(key);
            }
        }

        if (!this.canEdit()) {
            this.inFlightVisionMemoryPersistenceKeys.clear();
            this.clearVisionMemoryPersistTimer();
            this.syncPendingVisionMemorySnapshot();
            return;
        }

        if (this.pendingVisionMemoryPersistenceKeys.size === 0) {
            this.clearVisionMemoryPersistTimer();
            this.clearPendingVisionMemorySnapshot();
            return;
        }

        this.syncPendingVisionMemorySnapshot();
        this.ensureVisionMemoryPersistTimer();
    }

    private matchesVisionMemoryEntry(
        left: MapVisionMemoryEntryState | undefined,
        right: MapVisionMemoryEntryState | undefined
    ): boolean {
        if (!left || !right) {
            return left === right;
        }

        if (left.key !== right.key || left.lastPolygonHash !== right.lastPolygonHash || left.revision !== right.revision) {
            return false;
        }

        if (!this.matchesVisionPoint(left.lastOrigin, right.lastOrigin)) {
            return false;
        }

        if (left.polygons.length !== right.polygons.length) {
            return false;
        }

        return left.polygons.every((polygon, polygonIndex) => {
            const otherPolygon = right.polygons[polygonIndex];
            if (!otherPolygon || polygon.length !== otherPolygon.length) {
                return false;
            }

            return polygon.every((point, pointIndex) => this.matchesVisionPoint(point, otherPolygon[pointIndex]));
        });
    }

    private matchesVisionPoint(
        left: CampaignMapPoint | null | undefined,
        right: CampaignMapPoint | null | undefined
    ): boolean {
        if (!left || !right) {
            return left === right;
        }

        return left.x === right.x && left.y === right.y;
    }

    private shouldPreferLocalVisionMemory(
        localEntry: MapVisionMemoryEntryState | undefined,
        backendEntry: MapVisionMemoryEntryState | undefined
    ): boolean {
        if (!localEntry) {
            return false;
        }

        if (!backendEntry) {
            return true;
        }

        if (localEntry.revision !== backendEntry.revision) {
            return localEntry.revision > backendEntry.revision;
        }

        if (localEntry.polygons.length !== backendEntry.polygons.length) {
            return localEntry.polygons.length > backendEntry.polygons.length;
        }

        return localEntry.lastPolygonHash !== backendEntry.lastPolygonHash
            || !this.matchesVisionPoint(localEntry.lastOrigin, backendEntry.lastOrigin);
    }

    private queueVisionMemoryPersistence(key: string): void {
        this.pendingVisionMemoryPersistenceKeys.add(key);
        this.syncPendingVisionMemorySnapshot();
        this.ensureVisionMemoryPersistTimer();
    }

    private clearVisionMemoryPersistTimer(): void {
        if (this.visionMemoryPersistTimerId === null) {
            return;
        }

        globalThis.clearTimeout(this.visionMemoryPersistTimerId);
        this.visionMemoryPersistTimerId = null;
    }

    private ensureVisionMemoryPersistTimer(): void {
        if (this.visionMemoryPersistTimerId !== null || this.visionMemoryPersistInFlight || this.pendingVisionMemoryPersistenceKeys.size === 0) {
            return;
        }

        this.visionMemoryPersistTimerId = globalThis.setTimeout(() => {
            this.visionMemoryPersistTimerId = null;
            void this.persistQueuedVisionMemory();
        }, MAP_VISION_MEMORY_PERSIST_DELAY_MS);
    }

    private syncPendingVisionMemorySnapshot(): void {
        if (typeof globalThis.localStorage === 'undefined') {
            return;
        }

        const campaignId = this.campaignId();
        const snapshotKeys = new Set([
            ...this.pendingVisionMemoryPersistenceKeys,
            ...this.inFlightVisionMemoryPersistenceKeys
        ]);

        if (!campaignId || snapshotKeys.size === 0) {
            this.clearPendingVisionMemorySnapshot();
            return;
        }

        const memory = this.visionExploration();
        const entries = Object.fromEntries(
            [...snapshotKeys]
                .map((key) => {
                    const entry = memory[key];
                    if (!entry) {
                        return null;
                    }

                    return [
                        key,
                        {
                            key: entry.key,
                            polygons: entry.polygons.map((polygon) => polygon.map((point) => ({ ...point }))),
                            lastOrigin: entry.lastOrigin ? { ...entry.lastOrigin } : null,
                            lastPolygonHash: entry.lastPolygonHash,
                            revision: entry.revision
                        } satisfies MapVisionMemoryEntryState
                    ] as const;
                })
                .filter((entry): entry is readonly [string, MapVisionMemoryEntryState] => !!entry)
        );

        if (Object.keys(entries).length === 0) {
            this.clearPendingVisionMemorySnapshot();
            return;
        }

        const snapshot: PendingMapVisionMemorySnapshot = {
            campaignId,
            savedAt: Date.now(),
            entries
        };

        try {
            globalThis.localStorage.setItem(MAP_VISION_MEMORY_PENDING_STORAGE_KEY, JSON.stringify(snapshot));
        } catch {
            return;
        }
    }

    private loadPendingVisionMemorySnapshot(campaignId: string): Record<string, MapVisionMemoryEntryState> {
        if (!campaignId || typeof globalThis.localStorage === 'undefined') {
            return {};
        }

        try {
            const raw = globalThis.localStorage.getItem(MAP_VISION_MEMORY_PENDING_STORAGE_KEY);
            if (!raw) {
                return {};
            }

            const snapshot = JSON.parse(raw) as Partial<PendingMapVisionMemorySnapshot>;
            if (
                !snapshot
                || snapshot.campaignId !== campaignId
                || typeof snapshot.savedAt !== 'number'
                || Date.now() - snapshot.savedAt > MAP_VISION_MEMORY_PENDING_STORAGE_MAX_AGE_MS
                || !snapshot.entries
                || typeof snapshot.entries !== 'object'
            ) {
                this.clearPendingVisionMemorySnapshot();
                return {};
            }

            return Object.fromEntries(
                Object.entries(snapshot.entries).flatMap(([key, entry]) => {
                    if (!entry || typeof entry !== 'object' || typeof entry.key !== 'string' || !Array.isArray(entry.polygons)) {
                        return [];
                    }

                    const polygons = entry.polygons
                        .filter((polygon): polygon is CampaignMapPoint[] => Array.isArray(polygon))
                        .map((polygon) => polygon
                            .filter((point): point is CampaignMapPoint => !!point && typeof point.x === 'number' && typeof point.y === 'number')
                            .map((point) => ({ x: point.x, y: point.y })))
                        .filter((polygon) => polygon.length >= 3);

                    if (!key || !entry.key.trim() || polygons.length === 0) {
                        return [];
                    }

                    const lastOrigin = entry.lastOrigin && typeof entry.lastOrigin.x === 'number' && typeof entry.lastOrigin.y === 'number'
                        ? { x: entry.lastOrigin.x, y: entry.lastOrigin.y }
                        : null;

                    return [[
                        key,
                        {
                            key: entry.key.trim(),
                            polygons,
                            lastOrigin,
                            lastPolygonHash: typeof entry.lastPolygonHash === 'string' ? entry.lastPolygonHash : '',
                            revision: typeof (entry as { revision?: unknown }).revision === 'number' && Number.isFinite((entry as { revision?: number }).revision)
                                ? Math.max(0, Math.trunc((entry as { revision?: number }).revision ?? 0))
                                : 0
                        } satisfies MapVisionMemoryEntryState
                    ]];
                })
            );
        } catch {
            this.clearPendingVisionMemorySnapshot();
            return {};
        }
    }

    private clearPendingVisionMemorySnapshot(): void {
        if (typeof globalThis.localStorage === 'undefined') {
            return;
        }

        try {
            globalThis.localStorage.removeItem(MAP_VISION_MEMORY_PENDING_STORAGE_KEY);
        } catch {
            return;
        }
    }

    private findMapBoardById(mapId: string): CampaignMapBoard | null {
        return this.mapBoards().find((map) => map.id === mapId)
            ?? this.selectedCampaign()?.maps?.find((map) => map.id === mapId)
            ?? null;
    }

    private findTokenForVisionMemory(mapId: string, visionKey: string): CampaignMapToken | null {
        const map = this.findMapBoardById(mapId);
        if (!map) {
            return null;
        }

        return map.tokens.find((token) => this.visionMemoryScopeKeys(token).includes(visionKey)) ?? null;
    }

    private async persistQueuedVisionMemory(): Promise<void> {
        const campaignId = this.campaignId();
        if (this.visionMemoryPersistInFlight) {
            await (this.visionMemoryPersistInFlightPromise ?? Promise.resolve());
            return;
        }

        if (!campaignId || this.pendingVisionMemoryPersistenceKeys.size === 0) {
            this.clearPendingVisionMemorySnapshot();
            return;
        }

        this.visionMemoryPersistInFlight = true;
        this.visionMemoryPersistInFlightPromise = new Promise<void>((resolve) => {
            this.resolveVisionMemoryPersistInFlight = resolve;
        });

        try {
            const keys = [...this.pendingVisionMemoryPersistenceKeys];
            this.pendingVisionMemoryPersistenceKeys.clear();
            this.inFlightVisionMemoryPersistenceKeys.clear();
            for (const key of keys) {
                this.inFlightVisionMemoryPersistenceKeys.add(key);
            }
            this.syncPendingVisionMemorySnapshot();
            const memory = this.visionExploration();

            for (const compoundKey of keys) {
                const separatorIndex = compoundKey.indexOf('::');
                if (separatorIndex <= 0) {
                    this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
                    continue;
                }

                const mapId = compoundKey.slice(0, separatorIndex);
                if (!this.isPersistableMapId(mapId)) {
                    this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
                    this.visionExploration.update((entries) => {
                        const next = { ...entries };
                        delete next[compoundKey];
                        return next;
                    });
                    this.syncPendingVisionMemorySnapshot();
                    continue;
                }

                const entry = memory[compoundKey];
                if (!entry) {
                    this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
                    continue;
                }

                const sharedMemory: CampaignMap['visionMemory'][number] = {
                    key: entry.key,
                    polygons: entry.polygons.map((polygon) => ({
                        points: polygon.map((point) => ({ ...point }))
                    })),
                    lastOrigin: entry.lastOrigin ? { ...entry.lastOrigin } : null,
                    lastPolygonHash: entry.lastPolygonHash,
                    revision: entry.revision
                };

                const token = this.findTokenForVisionMemory(mapId, entry.key);
                const result = token
                    ? (await this.store.moveCampaignMapToken(campaignId, mapId, token.id, { x: token.x, y: token.y }, sharedMemory) ? 'ok' : 'error')
                    : await this.store.updateCampaignMapVision(campaignId, mapId, sharedMemory);

                this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
                if (result === 'not-found') {
                    this.visionExploration.update((entries) => {
                        const next = { ...entries };
                        delete next[compoundKey];
                        return next;
                    });
                } else if (result !== 'ok') {
                    this.pendingVisionMemoryPersistenceKeys.add(compoundKey);
                }

                this.syncPendingVisionMemorySnapshot();
            }
        }
        finally {
            this.visionMemoryPersistInFlight = false;
            this.resolveVisionMemoryPersistInFlight?.();
            this.resolveVisionMemoryPersistInFlight = null;
            this.visionMemoryPersistInFlightPromise = null;
        }

        if (this.pendingVisionMemoryPersistenceKeys.size > 0) {
            this.syncPendingVisionMemorySnapshot();
            this.ensureVisionMemoryPersistTimer();
            return;
        }

        this.clearPendingVisionMemorySnapshot();
    }

    private hashVisionPolygon(points: CampaignMapPoint[]): string {
        return points
            .map((point) => `${point.x.toFixed(3)}:${point.y.toFixed(3)}`)
            .join('|');
    }

    private tokenVisionOrigin(token: CampaignMapToken): { x: number; y: number } {
        return {
            x: this.clampCoordinate(token.x) * 1000,
            y: this.clampCoordinate(token.y) * 700
        };
    }

    private tokenVisionOriginNormalized(token: CampaignMapToken): CampaignMapPoint {
        const origin = this.tokenVisionOrigin(token);
        return {
            x: origin.x / 1000,
            y: origin.y / 700
        };
    }

    private distanceBetweenPoints(left: CampaignMapPoint, right: CampaignMapPoint): number {
        return Math.hypot(left.x - right.x, left.y - right.y);
    }

    private gridSquareSizePixels(): number {
        return Math.min(1000 / this.gridColumns(), 700 / this.gridRows());
    }

    private visionRangeSquares(rangeFeet: number): number {
        if (!Number.isFinite(rangeFeet) || rangeFeet <= 0) {
            return 0;
        }

        return Math.max(1, rangeFeet / MAP_VISION_FEET_PER_GRID_SQUARE);
    }

    private visionRangePixels(rangeFeet: number, tokenSize = 1): number {
        const rangeSquares = this.visionRangeSquares(rangeFeet);
        const tokenEdgeSquares = this.normalizeTokenGridSpan(tokenSize) / 2;
        return this.gridSquareSizePixels() * (rangeSquares + tokenEdgeSquares);
    }

    private mapWallSegments(kind: 'all' | 'vision' | 'movement' = 'all'): Array<[{ x: number; y: number }, { x: number; y: number }]> {
        return this.workingMap().walls
            .filter((wall) => {
                if (kind === 'vision') {
                    return wall.blocksVision;
                }

                if (kind === 'movement') {
                    return wall.blocksMovement;
                }

                return true;
            })
            .flatMap((wall) => {
                const segments: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];

                for (let index = 1; index < wall.points.length; index++) {
                    const start = wall.points[index - 1];
                    const end = wall.points[index];
                    segments.push([
                        { x: start.x * 1000, y: start.y * 700 },
                        { x: end.x * 1000, y: end.y * 700 }
                    ]);
                }

                return segments;
            });
    }

    private castVisionRay(
        origin: { x: number; y: number },
        angle: number,
        rangePixels: number,
        segments: ReadonlyArray<readonly [{ x: number; y: number }, { x: number; y: number }]>
    ): { x: number; y: number } {
        const direction = { x: Math.cos(angle), y: Math.sin(angle) };
        let closestDistance = rangePixels;
        let closestPoint = {
            x: origin.x + (direction.x * rangePixels),
            y: origin.y + (direction.y * rangePixels)
        };

        for (const [start, end] of segments) {
            const intersection = this.intersectRayWithSegment(origin, direction, start, end);
            if (!intersection || intersection.distance >= closestDistance) {
                continue;
            }

            closestDistance = intersection.distance;
            closestPoint = intersection.point;
        }

        return {
            x: Math.max(0, Math.min(1000, closestPoint.x)),
            y: Math.max(0, Math.min(700, closestPoint.y))
        };
    }

    private intersectRayWithSegment(
        origin: { x: number; y: number },
        direction: { x: number; y: number },
        start: { x: number; y: number },
        end: { x: number; y: number }
    ): { point: { x: number; y: number }; distance: number } | null {
        const segment = { x: end.x - start.x, y: end.y - start.y };
        const determinant = (direction.x * segment.y) - (direction.y * segment.x);

        if (Math.abs(determinant) < 0.000001) {
            return null;
        }

        const delta = { x: start.x - origin.x, y: start.y - origin.y };
        const distance = ((delta.x * segment.y) - (delta.y * segment.x)) / determinant;
        const segmentT = ((delta.x * direction.y) - (delta.y * direction.x)) / determinant;

        if (distance < 0 || segmentT < 0 || segmentT > 1) {
            return null;
        }

        return {
            point: {
                x: origin.x + (direction.x * distance),
                y: origin.y + (direction.y * distance)
            },
            distance
        };
    }

    private findNearestIconAtPoint(x: number, y: number): CampaignMapIcon | null {
        const icons = this.workingMap().icons;
        let closestIcon: CampaignMapIcon | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const icon of icons) {
            const dx = icon.x - x;
            const dy = icon.y - y;
            const distance = Math.hypot(dx, dy * (10 / 7));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIcon = icon;
            }
        }

        return closestDistance <= 0.04 ? closestIcon : null;
    }

    private findNearestDecorationAtPoint(x: number, y: number): CampaignMapDecoration | null {
        const decorations = this.allDecorations();
        let closestDecoration: CampaignMapDecoration | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const decoration of decorations) {
            const dx = decoration.x - x;
            const dy = decoration.y - y;
            const distance = Math.hypot(dx, dy * (10 / 7));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestDecoration = decoration;
            }
        }

        return closestDistance <= 0.045 ? closestDecoration : null;
    }

    private findNearestLabelAtPoint(x: number, y: number): CampaignMapLabel | null {
        const labels = this.workingMap().labels;
        let closestLabel: CampaignMapLabel | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const label of labels) {
            const dx = label.x - x;
            const dy = label.y - y;
            const distance = Math.hypot(dx, dy * (10 / 7));
            if (distance < closestDistance) {
                closestDistance = distance;
                closestLabel = label;
            }
        }

        return closestDistance <= 0.05 ? closestLabel : null;
    }

    private sanitizeTokenName(fileName: string): string {
        return fileName.replace(/\.[^.]+$/, '').trim() || 'Token';
    }

    private isCharacterInCampaign(character: Character, campaignId: string): boolean {
        const campaignIds = character.campaignIds?.length
            ? character.campaignIds
            : character.campaignId
                ? [character.campaignId]
                : [];

        return campaignIds.includes(campaignId);
    }

    private tokenAssignmentValue(token: CampaignMapToken | null): string {
        if (!token) {
            return 'none';
        }

        if (token.assignedCharacterId) {
            return `character:${token.assignedCharacterId}`;
        }

        if (token.assignedUserId) {
            return `user:${token.assignedUserId}`;
        }

        return 'none';
    }

    private parseTokenAssignmentValue(value: string): { assignedUserId: string | null; assignedCharacterId: string | null } {
        if (value.startsWith('character:')) {
            const assignedCharacterId = value.slice('character:'.length).trim();
            return {
                assignedUserId: null,
                assignedCharacterId: assignedCharacterId || null
            };
        }

        if (value.startsWith('user:')) {
            const assignedUserId = value.slice('user:'.length).trim();
            return {
                assignedUserId: assignedUserId || null,
                assignedCharacterId: null
            };
        }

        return {
            assignedUserId: null,
            assignedCharacterId: null
        };
    }

    private async persistControlledTokenMove(tokenId: string, token: CampaignMapToken, origin: CampaignMapPoint): Promise<void> {
        const campaign = this.selectedCampaign();
        const mapId = this.currentMapId();
        if (!campaign || !mapId) {
            return;
        }

        const visionMemory = this.captureVisionMemoryForControlledMove(token);
        this.controlledTokenMoveRequestsInFlight += 1;

        try {
            const moved = await this.store.moveCampaignMapToken(campaign.id, mapId, tokenId, { x: token.x, y: token.y }, visionMemory);
            if (moved) {
                return;
            }

            this.mutateMap((map) => {
                map.tokens = map.tokens.map((entry) => entry.id === tokenId ? { ...entry, x: origin.x, y: origin.y } : entry);
            });
            this.cdr.detectChanges();
        } finally {
            this.controlledTokenMoveRequestsInFlight = Math.max(0, this.controlledTokenMoveRequestsInFlight - 1);
        }
    }

    private captureVisionMemoryForControlledMove(token: CampaignMapToken): CampaignMap['visionMemory'][number] | null {
        if (!this.shouldPersistVisionMemory(token)) {
            return null;
        }

        const polygon = this.buildVisionPolygon(token);
        if (polygon.length >= 3) {
            this.rememberVisionPolygon(token, polygon);
        }

        const key = this.visionMemoryKey(token);
        const entry = this.visionExploration()[key];
        if (!entry) {
            return null;
        }

        if (this.canEdit()) {
            this.pendingVisionMemoryPersistenceKeys.delete(key);
            this.syncPendingVisionMemorySnapshot();
        }

        this.clearVisionMemoryPersistTimer();

        return {
            key: entry.key,
            polygons: entry.polygons.map((entryPolygon) => ({
                points: entryPolygon.map((point) => ({ ...point }))
            })),
            lastOrigin: entry.lastOrigin ? { ...entry.lastOrigin } : null,
            lastPolygonHash: entry.lastPolygonHash,
            revision: entry.revision
        };
    }

    private applyRealtimeVisionMemoryUpdate(event: CampaignMapVisionUpdatedEvent): void {
        if (event.campaignId !== this.campaignId()) {
            return;
        }

        const compoundKey = `${event.mapId}::${event.memory.key}`;
        const currentEntry = this.visionExploration()[compoundKey];
        const incomingEntry: MapVisionMemoryEntryState = {
            key: event.memory.key,
            polygons: event.memory.polygons.map((polygon) => polygon.points.map((point) => ({ ...point }))),
            lastOrigin: event.memory.lastOrigin ? { ...event.memory.lastOrigin } : null,
            lastPolygonHash: event.memory.lastPolygonHash,
            revision: Number.isFinite(event.memory.revision) ? Math.max(0, Math.trunc(event.memory.revision)) : 0
        };

        if ((currentEntry?.revision ?? 0) > incomingEntry.revision) {
            return;
        }

        this.resetVisionMemoryOrigins.delete(compoundKey);

        this.visionExploration.update((memory) => ({
            ...memory,
            [compoundKey]: incomingEntry
        }));

        if ((currentEntry?.revision ?? 0) <= incomingEntry.revision) {
            this.pendingVisionMemoryPersistenceKeys.delete(compoundKey);
            this.inFlightVisionMemoryPersistenceKeys.delete(compoundKey);
            this.syncPendingVisionMemorySnapshot();
        }

        this.cdr.detectChanges();
    }

    private applyRealtimeTokenMoved(event: CampaignMapTokenMovedEvent): void {
        if (event.campaignId !== this.campaignId()) {
            return;
        }

        if (event.initiatedByUserId === this.currentUserId()) {
            return;
        }

        const incomingToken: CampaignMapToken = {
            id: event.token.id,
            name: event.token.name,
            imageUrl: event.token.imageUrl,
            x: this.clampCoordinate(event.token.x),
            y: this.clampCoordinate(event.token.y),
            size: this.normalizeTokenGridSpan(event.token.size),
            note: event.token.note,
            assignedUserId: event.token.assignedUserId ?? null,
            assignedCharacterId: event.token.assignedCharacterId ?? null,
            moveRevision: Number.isFinite(event.token.moveRevision) ? Math.max(0, Math.trunc(event.token.moveRevision)) : 0
        };

        this.mapBoards.update((maps) => maps.map((map) => map.id === event.mapId
            ? {
                ...map,
                tokens: this.upsertRealtimeMapToken(map.tokens, incomingToken)
            }
            : map));

        if (this.currentMapId() === event.mapId) {
            this.workingMap.update((map) => ({
                ...this.cloneMap(map),
                tokens: this.upsertRealtimeMapToken(map.tokens, incomingToken)
            }));
        }

        this.cdr.detectChanges();
    }

    private upsertRealtimeMapToken(tokens: CampaignMapToken[], incomingToken: CampaignMapToken): CampaignMapToken[] {
        const existingIndex = tokens.findIndex((token) => token.id === incomingToken.id);
        if (existingIndex === -1) {
            return [...tokens, incomingToken];
        }

        if ((tokens[existingIndex].moveRevision ?? 0) > incomingToken.moveRevision) {
            return tokens;
        }

        const next = [...tokens];
        next[existingIndex] = incomingToken;
        return next;
    }

    private updateSelectedWallFlags(wallId: string, flags: Partial<Pick<CampaignMapWall, 'blocksVision' | 'blocksMovement'>>, message: string): void {
        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map.walls = map.walls.map((wall) => wall.id === wallId
                ? {
                    ...wall,
                    ...flags
                }
                : wall);
        });
        this.markDirty(message);
    }

    private createMapWall(points: CampaignMapPoint[]): CampaignMapWall {
        return {
            id: this.createId(),
            color: '#101418',
            width: Math.max(4, this.brushWidth()),
            points: points.map((point) => ({ ...point })),
            blocksVision: true,
            blocksMovement: true
        };
    }

    private isTokenMoveBlocked(token: CampaignMapToken, targetPoint: CampaignMapPoint): boolean {
        const start = this.tokenCenterForPosition(token.x, token.y, token.size);
        const end = this.tokenCenterForPosition(targetPoint.x, targetPoint.y, token.size);
        const targetBounds = this.tokenBoundsForPosition(targetPoint.x, targetPoint.y, token.size);

        if (Math.hypot(end.x - start.x, end.y - start.y) < 0.5) {
            return false;
        }

        return this.workingMap().walls
            .filter((wall) => wall.blocksMovement)
            .some((wall) => {
                for (let index = 1; index < wall.points.length; index++) {
                    const wallStart = {
                        x: wall.points[index - 1].x * 1000,
                        y: wall.points[index - 1].y * 700
                    };
                    const wallEnd = {
                        x: wall.points[index].x * 1000,
                        y: wall.points[index].y * 700
                    };

                    if (this.isMovementBlockedByWallSegment(start, end, wallStart, wallEnd, targetBounds)) {
                        return true;
                    }
                }

                return false;
            });
    }

    private tokenCenterForPosition(x: number, y: number, size: number): { x: number; y: number } {
        return {
            x: this.clampCoordinate(x) * 1000,
            y: this.clampCoordinate(y) * 700
        };
    }

    private tokenBoundsForPosition(x: number, y: number, size: number): { left: number; top: number; right: number; bottom: number } {
        const span = this.normalizeTokenGridSpan(size);
        const halfWidth = (span / this.gridColumns()) / 2;
        const halfHeight = (span / this.gridRows()) / 2;

        return {
            left: this.clampCoordinate(x - halfWidth) * 1000,
            top: this.clampCoordinate(y - halfHeight) * 700,
            right: this.clampCoordinate(x + halfWidth) * 1000,
            bottom: this.clampCoordinate(y + halfHeight) * 700
        };
    }

    private isMovementBlockedByWallSegment(
        start: { x: number; y: number },
        end: { x: number; y: number },
        wallStart: { x: number; y: number },
        wallEnd: { x: number; y: number },
        targetBounds: { left: number; top: number; right: number; bottom: number }
    ): boolean {
        if (this.doesWallOverlapTokenBounds(wallStart, wallEnd, targetBounds)) {
            return true;
        }

        return this.segmentsCrossStrictly(start, end, wallStart, wallEnd);
    }

    private doesWallOverlapTokenBounds(
        start: { x: number; y: number },
        end: { x: number; y: number },
        bounds: { left: number; top: number; right: number; bottom: number }
    ): boolean {
        const epsilon = 0.75;
        const interior = {
            left: bounds.left + epsilon,
            top: bounds.top + epsilon,
            right: bounds.right - epsilon,
            bottom: bounds.bottom - epsilon
        };

        if (interior.left >= interior.right || interior.top >= interior.bottom) {
            return false;
        }

        const pointInside = (point: { x: number; y: number }): boolean => {
            return point.x > interior.left
                && point.x < interior.right
                && point.y > interior.top
                && point.y < interior.bottom;
        };

        if (pointInside(start) || pointInside(end)) {
            return true;
        }

        const topLeft = { x: interior.left, y: interior.top };
        const topRight = { x: interior.right, y: interior.top };
        const bottomLeft = { x: interior.left, y: interior.bottom };
        const bottomRight = { x: interior.right, y: interior.bottom };

        return this.segmentsIntersect(start, end, topLeft, topRight)
            || this.segmentsIntersect(start, end, topRight, bottomRight)
            || this.segmentsIntersect(start, end, bottomRight, bottomLeft)
            || this.segmentsIntersect(start, end, bottomLeft, topLeft);
    }

    private segmentsIntersect(
        startA: { x: number; y: number },
        endA: { x: number; y: number },
        startB: { x: number; y: number },
        endB: { x: number; y: number }
    ): boolean {
        const epsilon = 0.0001;
        const orientation = (first: { x: number; y: number }, second: { x: number; y: number }, third: { x: number; y: number }): number => {
            const value = ((second.y - first.y) * (third.x - second.x)) - ((second.x - first.x) * (third.y - second.y));
            if (Math.abs(value) <= epsilon) {
                return 0;
            }

            return value > 0 ? 1 : 2;
        };
        const onSegment = (first: { x: number; y: number }, second: { x: number; y: number }, third: { x: number; y: number }): boolean => {
            return second.x <= Math.max(first.x, third.x) + epsilon
                && second.x + epsilon >= Math.min(first.x, third.x)
                && second.y <= Math.max(first.y, third.y) + epsilon
                && second.y + epsilon >= Math.min(first.y, third.y);
        };

        const firstOrientation = orientation(startA, endA, startB);
        const secondOrientation = orientation(startA, endA, endB);
        const thirdOrientation = orientation(startB, endB, startA);
        const fourthOrientation = orientation(startB, endB, endA);

        if (firstOrientation !== secondOrientation && thirdOrientation !== fourthOrientation) {
            return true;
        }

        if (firstOrientation === 0 && onSegment(startA, startB, endA)) {
            return true;
        }

        if (secondOrientation === 0 && onSegment(startA, endB, endA)) {
            return true;
        }

        if (thirdOrientation === 0 && onSegment(startB, startA, endB)) {
            return true;
        }

        return fourthOrientation === 0 && onSegment(startB, endA, endB);
    }

    private segmentsCrossStrictly(
        startA: { x: number; y: number },
        endA: { x: number; y: number },
        startB: { x: number; y: number },
        endB: { x: number; y: number }
    ): boolean {
        const directionA = { x: endA.x - startA.x, y: endA.y - startA.y };
        const directionB = { x: endB.x - startB.x, y: endB.y - startB.y };
        const determinant = (directionA.x * directionB.y) - (directionA.y * directionB.x);
        const epsilon = 0.0001;

        if (Math.abs(determinant) <= epsilon) {
            return false;
        }

        const delta = { x: startB.x - startA.x, y: startB.y - startA.y };
        const t = ((delta.x * directionB.y) - (delta.y * directionB.x)) / determinant;
        const u = ((delta.x * directionA.y) - (delta.y * directionA.x)) / determinant;

        return t > epsilon && t < 1 - epsilon && u > epsilon && u < 1 - epsilon;
    }

    terrainLabel(type: CampaignMapDecorationType): string {
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

    private moveDecorationById(map: CampaignMap, decorationId: string, point: CampaignMapPoint): void {
        map.decorations = map.decorations.map((decoration) => decoration.id === decorationId ? { ...decoration, x: point.x, y: point.y } : decoration);
        map.layers = {
            ...map.layers,
            mountainChains: map.layers.mountainChains.map((decoration) => decoration.id === decorationId ? { ...decoration, x: point.x, y: point.y } : decoration),
            forestBelts: map.layers.forestBelts.map((decoration) => decoration.id === decorationId ? { ...decoration, x: point.x, y: point.y } : decoration)
        };
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
                gridColumns: DEFAULT_CAMPAIGN_MAP_GRID_COLUMNS,
                gridRows: DEFAULT_CAMPAIGN_MAP_GRID_ROWS,
                gridColor: this.defaultGridColorForBackground(background),
                gridOffsetX: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_X,
                gridOffsetY: DEFAULT_CAMPAIGN_MAP_GRID_OFFSET_Y,
                membersCanViewAnytime: false,
                strokes: strokes.filter((stroke) => stroke.points.length > 1),
                walls: [],
                icons: anchors.map((anchor) => ({
                    id: anchor.id,
                    type: anchor.type,
                    label: anchor.label,
                    x: anchor.x,
                    y: anchor.y
                })),
                tokens: [],
                decorations: this.createDecorations(background, anchors, seed),
                labels: this.createLabels(background, anchors, seed),
                layers: this.createTerrainLayers(background, anchors, seed),
                visionMemory: [],
                visionEnabled: true
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
            rotation: label.rotation,
            style: this.defaultMapLabelStyle(label.tone)
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
            Cavern: ['Keep', 'Camp', 'Town', 'Dungeon', 'Dungeon', 'Danger', 'Treasure', 'Portal', 'Tower', 'Camp'],
            Battlemap: ['Town', 'Danger', 'Keep', 'Camp', 'Dungeon', 'Danger', 'Treasure', 'Tower', 'Portal', 'Camp']
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

    private createCircleDragPoints(origin: CampaignMapPoint, current: CampaignMapPoint): CampaignMapPoint[] {
        const radiusX = Math.abs(current.x - origin.x) / 2;
        const radiusY = Math.abs(current.y - origin.y) / 2;
        if (radiusX < 0.0025 && radiusY < 0.0025) {
            return [origin, origin];
        }

        const centerX = (origin.x + current.x) / 2;
        const centerY = (origin.y + current.y) / 2;
        const dominantRadius = Math.max(radiusX, radiusY);
        const segments = Math.max(18, Math.min(72, Math.round(dominantRadius * 220)));
        return this.createLoopPoints(centerX, centerY, radiusX, radiusY, segments, 0);
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

    private snapTokenPointToGrid(point: CampaignMapPoint, size: number): CampaignMapPoint {
        return this.snapTokenPointToGridForConfig(
            point,
            size,
            this.gridColumns(),
            this.gridRows(),
            this.gridOffsetX(),
            this.gridOffsetY()
        );
    }

    private snapTokenPointToGridForConfig(
        point: CampaignMapPoint,
        size: number,
        gridColumns: number,
        gridRows: number,
        gridOffsetX: number,
        gridOffsetY: number
    ): CampaignMapPoint {
        const span = this.normalizeTokenGridSpan(size);
        return {
            x: this.snapTokenAxisToGrid(point.x, span, gridColumns, gridOffsetX),
            y: this.snapTokenAxisToGrid(point.y, span, gridRows, gridOffsetY)
        };
    }

    private snapTokenAxisToGrid(value: number, span: number, gridCount: number, offset: number): number {
        const boundedValue = this.clampCoordinate(value);
        const centerIndex = (boundedValue * gridCount) - offset;
        const maxStart = Math.max(0, gridCount - span);
        const snapIncrement = span < 1 ? span : 1;
        const startIndex = Math.max(
            0,
            Math.min(
                maxStart,
                Math.round((centerIndex - (span / 2)) / snapIncrement) * snapIncrement
            )
        );
        return this.clampCoordinate((startIndex + offset + (span / 2)) / gridCount);
    }

    private snapRoutePointToGridIntersection(point: CampaignMapPoint): CampaignMapPoint {
        return {
            x: this.snapRouteAxisToGridIntersection(point.x, this.gridColumns(), this.gridOffsetX()),
            y: this.snapRouteAxisToGridIntersection(point.y, this.gridRows(), this.gridOffsetY())
        };
    }

    private snapRouteAxisToGridIntersection(value: number, gridCount: number, offset: number): number {
        const boundedValue = this.clampCoordinate(value);
        const lineIndex = Math.max(0, Math.min(gridCount, Math.round((boundedValue * gridCount) - offset)));
        return this.clampCoordinate((lineIndex + offset) / gridCount);
    }

    private clampCoordinate(value: number): number {
        if (!Number.isFinite(value)) {
            return 0.5;
        }

        return Math.max(0, Math.min(1, value));
    }

    private updateGridCount(axis: 'gridColumns' | 'gridRows', rawValue: string, fallback: number): void {
        if (!this.canModify()) {
            return;
        }

        const nextValue = this.normalizeMapGridCount(Number.parseFloat(rawValue), fallback);
        const currentValue = axis === 'gridColumns' ? this.gridColumns() : this.gridRows();
        const nextGridColumns = axis === 'gridColumns' ? nextValue : this.gridColumns();
        const nextGridRows = axis === 'gridRows' ? nextValue : this.gridRows();

        if (nextValue === currentValue) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map[axis] = nextValue;
            map.tokens = this.resnapTokensToGrid(
                map.tokens,
                nextGridColumns,
                nextGridRows,
                this.gridOffsetX(),
                this.gridOffsetY()
            );
        });
        this.markDirty('Grid proportions updated.');
    }

    private updateGridOffset(axis: 'gridOffsetX' | 'gridOffsetY', rawValue: string, fallback: number): void {
        if (!this.canModify()) {
            return;
        }

        const nextValue = this.normalizeMapGridOffset(Number.parseFloat(rawValue), fallback);
        const currentValue = axis === 'gridOffsetX' ? this.gridOffsetX() : this.gridOffsetY();
        const nextGridOffsetX = axis === 'gridOffsetX' ? nextValue : this.gridOffsetX();
        const nextGridOffsetY = axis === 'gridOffsetY' ? nextValue : this.gridOffsetY();

        if (nextValue === currentValue) {
            return;
        }

        this.captureHistorySnapshot();
        this.mutateMap((map) => {
            map[axis] = nextValue;
            map.tokens = this.resnapTokensToGrid(
                map.tokens,
                this.gridColumns(),
                this.gridRows(),
                nextGridOffsetX,
                nextGridOffsetY
            );
        });
        this.markDirty('Grid offset updated.');
    }

    private resnapTokensToGrid(
        tokens: CampaignMapToken[],
        gridColumns: number,
        gridRows: number,
        gridOffsetX: number,
        gridOffsetY: number
    ): CampaignMapToken[] {
        return tokens.map((token) => {
            const snappedPoint = this.snapTokenPointToGridForConfig(
                { x: token.x, y: token.y },
                token.size,
                gridColumns,
                gridRows,
                gridOffsetX,
                gridOffsetY
            );

            return {
                ...token,
                x: snappedPoint.x,
                y: snappedPoint.y
            };
        });
    }

    private normalizeMapGridCount(value: number | undefined, fallback: number): number {
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
            return fallback;
        }

        return Math.max(8, Math.min(60, Math.round(value * 2) / 2));
    }

    private normalizeMapGridOffset(value: number | undefined, fallback: number): number {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(-1, Math.min(1, Math.round(value * 20) / 20));
    }

    private normalizeMapGridColor(value: string | undefined, background: CampaignMapBackground): string {
        const trimmed = value?.trim().toLowerCase();

        if (trimmed && /^#[0-9a-f]{6}$/i.test(trimmed)) {
            return trimmed;
        }

        return this.defaultGridColorForBackground(background);
    }

    private defaultGridColorForBackground(background: CampaignMapBackground): string {
        switch (background) {
            case 'Coast':
                return '#3f667e';
            case 'City':
                return '#594532';
            case 'Cavern':
                return '#4a5f3e';
            case 'Battlemap':
                return '#584f43';
            default:
                return DEFAULT_CAMPAIGN_MAP_GRID_COLOR;
        }
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
            case 'Battlemap':
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