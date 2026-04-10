import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';

import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';
import { CampaignMapBackground } from '../../models/dungeon.models';

export type MapArtSettlementScale = 'Hamlet' | 'Village' | 'Town' | 'City' | 'Metropolis';
export type MapArtParchmentLayout = 'Uniform' | 'Continent' | 'Archipelago' | 'Atoll' | 'World' | 'Equirectangular';
export type MapArtCavernLayout = 'TunnelNetwork' | 'GrandCavern' | 'VerticalChasm' | 'CrystalGrotto' | 'RuinedUndercity' | 'LavaTubes';
export type MapArtBattlemapLocale = 'TownStreet' | 'BuildingInterior' | 'ForestClearing' | 'Roadside' | 'Cliffside' | 'Riverside' | 'Ruins' | 'DungeonRoom' | 'Tavern';
export type MapArtLighting = 'Day' | 'Dusk' | 'Night';

export interface MapArtGenerationOptions {
    background: CampaignMapBackground;
    mapName: string;
    separateLabels: boolean;
    settlementScale: MapArtSettlementScale;
    parchmentLayout: MapArtParchmentLayout;
    cavernLayout: MapArtCavernLayout;
    battlemapLocale: MapArtBattlemapLocale;
    lighting: MapArtLighting;
    settlementNamesText: string;
    regionNamesText: string;
    ruinNamesText: string;
    cavernNamesText: string;
    additionalDirection: string;
}

const BACKGROUND_OPTIONS: DropdownOption[] = [
    { value: 'Parchment', label: 'Parchment', description: 'Warm paper tones for hand-drawn routes and lore maps.' },
    { value: 'City', label: 'Settlement', description: 'Sharper streets, walls, and district lines for towns and cities.' },
    { value: 'Coast', label: 'Coast', description: 'Sea-washed tones for harbors, islands, and shore routes.' },
    { value: 'Cavern', label: 'Cavern', description: 'Deep mineral tones for tunnels, roots, and underworld spaces.' },
    { value: 'Battlemap', label: 'Encounter Map', description: 'Top-down encounter map art for streets, rooms, forests, roads, cliffs, and other tactical spaces.' }
];

const SETTLEMENT_SCALE_OPTIONS: DropdownOption[] = [
    { value: 'Hamlet', label: 'Hamlet', description: 'Tiny cluster of homes or a remote outpost.' },
    { value: 'Village', label: 'Village', description: 'Small settlement with a modest footprint.' },
    { value: 'Town', label: 'Town', description: 'Regional market town with moderate prominence.' },
    { value: 'City', label: 'City', description: 'Large urban center with clear district massing.' },
    { value: 'Metropolis', label: 'Metropolis', description: 'Capital-scale city with dominant urban presence.' }
];

const PARCHMENT_LAYOUT_OPTIONS: DropdownOption[] = [
    { value: 'Uniform', label: 'Uniform' },
    { value: 'Continent', label: 'Continent' },
    { value: 'Archipelago', label: 'Archipelago' },
    { value: 'Atoll', label: 'Atoll' },
    { value: 'World', label: 'World' },
    { value: 'Equirectangular', label: 'Equirectangular' }
];

const CAVERN_LAYOUT_OPTIONS: DropdownOption[] = [
    { value: 'TunnelNetwork', label: 'Tunnel Network' },
    { value: 'GrandCavern', label: 'Grand Cavern' },
    { value: 'VerticalChasm', label: 'Vertical Chasm' },
    { value: 'CrystalGrotto', label: 'Crystal Grotto' },
    { value: 'RuinedUndercity', label: 'Ruined Undercity' },
    { value: 'LavaTubes', label: 'Lava Tubes' }
];

const BATTLEMAP_LOCALE_OPTIONS: DropdownOption[] = [
    { value: 'TownStreet', label: 'Town Street', description: 'Alleys, plazas, market lanes, and urban choke points.', group: 'Urban' },
    { value: 'BuildingInterior', label: 'Building Interior', description: 'Rooms, halls, furniture, doors, and interior cover.', group: 'Urban' },
    { value: 'Tavern', label: 'Tavern', description: 'Tables, bar space, stair corners, and tight movement lanes.', group: 'Urban' },
    { value: 'ForestClearing', label: 'Forest Clearing', description: 'Tree lines, roots, brush, rocks, and ambush space.', group: 'Wilds' },
    { value: 'Roadside', label: 'Roadside', description: 'A travel route with ditches, carts, shrubs, and flanking terrain.', group: 'Wilds' },
    { value: 'Cliffside', label: 'Cliffside', description: 'Ledges, drops, broken stone, and exposed elevation edges.', group: 'Wilds' },
    { value: 'Riverside', label: 'Riverside', description: 'Banks, shallows, bridges, mud, and water-adjacent hazards.', group: 'Wilds' },
    { value: 'Ruins', label: 'Ruins', description: 'Collapsed walls, fractured floors, debris, and ancient cover.', group: 'Ancient Sites' },
    { value: 'DungeonRoom', label: 'Dungeon Room', description: 'Chambers, pillars, doorways, and classic encounter geometry.', group: 'Ancient Sites' }
];

const LIGHTING_OPTIONS: DropdownOption[] = [
    { value: 'Day', label: 'Daylight', description: 'Bright, readable daytime lighting with clean terrain separation.' },
    { value: 'Dusk', label: 'Dusk', description: 'Warm late-day light with longer shadows, but still readable.' },
    { value: 'Night', label: 'Night', description: 'Moonlit or lantern-lit atmosphere with preserved gameplay readability.' }
];

@Component({
    selector: 'app-map-art-generation-modal',
    standalone: true,
    imports: [CommonModule, DropdownComponent],
    templateUrl: './map-art-generation-modal.component.html',
    styleUrl: './map-art-generation-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapArtGenerationModalComponent {
    readonly open = input(false);
    readonly isSubmitting = input(false);
    readonly background = input<CampaignMapBackground>('Parchment');
    readonly mapName = input('');
    readonly separateLabels = input(true);
    readonly settlementScale = input<MapArtSettlementScale>('City');
    readonly parchmentLayout = input<MapArtParchmentLayout>('Continent');
    readonly cavernLayout = input<MapArtCavernLayout>('TunnelNetwork');
    readonly battlemapLocale = input<MapArtBattlemapLocale>('ForestClearing');
    readonly lighting = input<MapArtLighting>('Day');
    readonly settlementNamesText = input('');
    readonly regionNamesText = input('');
    readonly ruinNamesText = input('');
    readonly cavernNamesText = input('');
    readonly additionalDirection = input('');

    readonly closed = output<void>();
    readonly confirmed = output<MapArtGenerationOptions>();

    readonly backgroundDraft = signal<CampaignMapBackground>('Parchment');
    readonly mapNameDraft = signal('');
    readonly separateLabelsDraft = signal(true);
    readonly settlementScaleDraft = signal<MapArtSettlementScale>('City');
    readonly parchmentLayoutDraft = signal<MapArtParchmentLayout>('Continent');
    readonly cavernLayoutDraft = signal<MapArtCavernLayout>('TunnelNetwork');
    readonly battlemapLocaleDraft = signal<MapArtBattlemapLocale>('ForestClearing');
    readonly lightingDraft = signal<MapArtLighting>('Day');
    readonly settlementNamesDraft = signal('');
    readonly regionNamesDraft = signal('');
    readonly ruinNamesDraft = signal('');
    readonly cavernNamesDraft = signal('');
    readonly additionalDirectionDraft = signal('');

    readonly backgroundOptions = BACKGROUND_OPTIONS;
    readonly settlementScaleOptions = SETTLEMENT_SCALE_OPTIONS;
    readonly parchmentLayoutOptions = PARCHMENT_LAYOUT_OPTIONS;
    readonly cavernLayoutOptions = CAVERN_LAYOUT_OPTIONS;
    readonly battlemapLocaleOptions = BATTLEMAP_LOCALE_OPTIONS;
    readonly lightingOptions = LIGHTING_OPTIONS;
    readonly selectedBattlemapLocaleOption = computed(() => {
        return this.battlemapLocaleOptions.find((option) => option.value === this.battlemapLocaleDraft()) ?? this.battlemapLocaleOptions[0];
    });
    readonly battlemapLocaleTags = computed(() => {
        switch (this.battlemapLocaleDraft()) {
            case 'TownStreet':
                return ['Chokepoints', 'Street cover', 'Civic clutter'];
            case 'BuildingInterior':
                return ['Doors', 'Furniture', 'Room-to-room flow'];
            case 'Roadside':
                return ['Flanks', 'Wagons', 'Low cover'];
            case 'Cliffside':
                return ['Elevation', 'Hazards', 'Narrow footing'];
            case 'Riverside':
                return ['Water edge', 'Bridge play', 'Mud and banks'];
            case 'Ruins':
                return ['Broken walls', 'Debris', 'Sightline breaks'];
            case 'DungeonRoom':
                return ['Chambers', 'Pillars', 'Corridor entries'];
            case 'Tavern':
                return ['Crowded lanes', 'Tables', 'Bar focal point'];
            default:
                return ['Tree cover', 'Open center', 'Ambush angles'];
        }
    });

    readonly showSettlementScale = computed(() => this.backgroundDraft() === 'City');
    readonly showParchmentLayout = computed(() => this.backgroundDraft() === 'Parchment');
    readonly showCavernLayout = computed(() => this.backgroundDraft() === 'Cavern');
    readonly showBattlemapLocale = computed(() => this.backgroundDraft() === 'Battlemap');
    readonly showSeparateLabelsToggle = computed(() => this.backgroundDraft() !== 'Battlemap');
    readonly isSettlementMap = computed(() => this.backgroundDraft() === 'City');
    readonly isCavernMap = computed(() => this.backgroundDraft() === 'Cavern');
    readonly isBattlemap = computed(() => this.backgroundDraft() === 'Battlemap');
    readonly settlementNameCount = computed(() => this.parseNameList(this.settlementNamesDraft()).length);
    readonly regionNameCount = computed(() => this.parseNameList(this.regionNamesDraft()).length);
    readonly ruinNameCount = computed(() => this.parseNameList(this.ruinNamesDraft()).length);
    readonly cavernNameCount = computed(() => this.parseNameList(this.cavernNamesDraft()).length);
    readonly totalPreferredNameCount = computed(() => this.settlementNameCount() + this.regionNameCount() + this.ruinNameCount() + this.cavernNameCount());
    readonly separateLabelsHelpText = computed(() => {
        if (this.isSettlementMap()) {
            return 'Generate the city, district, landmark, and street names as movable overlay labels instead of painting text into the art.';
        }

        if (this.isCavernMap()) {
            return 'Generate the cavern, enclave, landmark, and tunnel names as movable overlay labels instead of painting text into the art.';
        }

        if (this.isBattlemap()) {
            return 'Generate movable overlay labels only if you want encounter areas or named features tagged on top of the encounter map.';
        }

        return 'Generate place names as movable overlay labels instead of painting text into the art.';
    });
    readonly namesIntro = computed(() => {
        if (this.isSettlementMap()) {
            return 'Choose the map type, structure, and the specific settlement, district, landmark, or street names you want the AI to prefer.';
        }

        if (this.isCavernMap()) {
            return 'Choose the map type, structure, and the specific enclave, chamber, landmark, or tunnel names you want the AI to prefer.';
        }

        if (this.isBattlemap()) {
            return 'Choose the encounter map style, encounter locale, and any specific area, feature, or set-piece names you want the AI to lean on.';
        }

        return 'Choose the map type, structure, and the specific settlement, region, ruin, or cavern names you want the AI to prefer.';
    });
    readonly settlementFieldLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'City or borough names';
        }

        if (this.isCavernMap()) {
            return 'Enclave or outpost names';
        }

        if (this.isBattlemap()) {
            return 'Encounter or site names';
        }

        return 'Settlement names';
    });
    readonly settlementFieldPlaceholder = computed(() => {
        if (this.isSettlementMap()) {
            return 'One per line:\nStormhaven\nRivergate\nThe Old Borough';
        }

        if (this.isCavernMap()) {
            return 'One per line:\nGlowmarket\nLantern Burrow\nDelvers\' Rest';
        }

        if (this.isBattlemap()) {
            return 'One per line:\nBroken Causeway\nThe Hook & Lantern\nCliffwatch Approach';
        }

        return 'One per line:\nTharandor\nStormhaven\nValdren';
    });
    readonly settlementFieldHelpText = computed(() => {
        if (this.isSettlementMap()) {
            return 'Use these for the main city, boroughs, harbors, or named urban cores that define the settlement map.';
        }

        if (this.isCavernMap()) {
            return 'Use these for underdark settlements, mining camps, fungal hamlets, buried districts, or delver outposts.';
        }

        if (this.isBattlemap()) {
            return 'Use these for the encounter site itself: a crossroads, tavern, shrine, gatehouse, watchtower, courtyard, or other battle location.';
        }

        return 'Use these for towns, cities, villages, ports, or other settlement labels.';
    });
    readonly settlementCountLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'city or borough names ready.';
        }

        if (this.isCavernMap()) {
            return 'enclave or outpost names ready.';
        }

        if (this.isBattlemap()) {
            return 'encounter or site names ready.';
        }

        return 'settlement names ready.';
    });
    readonly regionFieldLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'District or ward names';
        }

        if (this.isCavernMap()) {
            return 'Chamber or zone names';
        }

        if (this.isBattlemap()) {
            return 'Area or zone names';
        }

        return 'Region names';
    });
    readonly regionFieldPlaceholder = computed(() => {
        if (this.isSettlementMap()) {
            return 'One per line:\nOld Market\nLantern Ward\nCopper Quay';
        }

        if (this.isCavernMap()) {
            return 'One per line:\nThe Glow Hollows\nSpore Basin\nRootfall Depths';
        }

        if (this.isBattlemap()) {
            return 'One per line:\nUpper Walk\nCollapsed Yard\nEast Barricade';
        }

        return 'One per line:\nThe Ashen March\nCrownwild\nThe Sapphire Coast';
    });
    readonly regionFieldHelpText = computed(() => {
        if (this.isSettlementMap()) {
            return 'Use these for districts, wards, neighborhoods, docks, or market quarters inside the settlement.';
        }

        if (this.isCavernMap()) {
            return 'Use these for major chambers, fungus forests, undercity sectors, lava fields, or broad underground zones.';
        }

        if (this.isBattlemap()) {
            return 'Use these for tactical sub-areas such as courtyards, balconies, lanes, chambers, clearings, ridges, or choke points.';
        }

        return 'Use these for realms, forests, coasts, seas, provinces, or major territories.';
    });
    readonly regionCountLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'district or ward names ready.';
        }

        if (this.isCavernMap()) {
            return 'chamber or zone names ready.';
        }

        if (this.isBattlemap()) {
            return 'area or zone names ready.';
        }

        return 'region names ready.';
    });
    readonly ruinFieldLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'Landmark names';
        }

        if (this.isCavernMap()) {
            return 'Vault or landmark names';
        }

        if (this.isBattlemap()) {
            return 'Feature or set-piece names';
        }

        return 'Ruin names';
    });
    readonly ruinFieldPlaceholder = computed(() => {
        if (this.isSettlementMap()) {
            return 'One per line:\nSunspire Plaza\nBell Tower\nRivergate Keep';
        }

        if (this.isCavernMap()) {
            return 'One per line:\nCrystal Reliquary\nThe Fallen Shrine\nBasalt Throne';
        }

        if (this.isBattlemap()) {
            return 'One per line:\nOverturned Wagon\nSignal Bonfire\nShattered Idol';
        }

        return 'One per line:\nBroken Archive\nSaint Ember Barrow\nThe Sunken Vault';
    });
    readonly ruinFieldHelpText = computed(() => {
        if (this.isSettlementMap()) {
            return 'Use these for plazas, keeps, towers, temples, bridges, guildhalls, or other named urban landmarks.';
        }

        if (this.isCavernMap()) {
            return 'Use these for ancient vaults, shrines, crystal halls, monster dens, drowned ruins, or other named cavern landmarks.';
        }

        if (this.isBattlemap()) {
            return 'Use these for tactical features such as wagons, altars, towers, bridges, statues, stairwells, barricades, or major pieces of cover.';
        }

        return 'Use these for ruins, keeps, towers, dungeons, shrines, or landmark sites.';
    });
    readonly ruinCountLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'landmark names ready.';
        }

        if (this.isCavernMap()) {
            return 'vault or landmark names ready.';
        }

        if (this.isBattlemap()) {
            return 'feature or set-piece names ready.';
        }

        return 'ruin names ready.';
    });
    readonly cavernFieldLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'Street or gate names';
        }

        if (this.isCavernMap()) {
            return 'Tunnel or chasm names';
        }

        if (this.isBattlemap()) {
            return 'Paths or access routes';
        }

        return 'Cavern names';
    });
    readonly cavernFieldPlaceholder = computed(() => {
        if (this.isSettlementMap()) {
            return 'One per line:\nKingfisher Way\nNorth Gate\nThreadneedle Lane';
        }

        if (this.isCavernMap()) {
            return 'One per line:\nWhisper Chasm\nThe Ember Vein\nEcho Run';
        }

        if (this.isBattlemap()) {
            return 'One per line:\nNorth Gate\nService Stairs\nRiver Path';
        }

        return 'One per line:\nGlowdeep\nWhisper Chasm\nCrystal Maw';
    });
    readonly cavernFieldHelpText = computed(() => {
        if (this.isSettlementMap()) {
            return 'Use these for streets, avenues, bridges, gates, canals, or other circulation labels inside the settlement.';
        }

        if (this.isCavernMap()) {
            return 'Use these for tunnel routes, chasms, fissures, bridge spans, lava channels, or other connective cavern features.';
        }

        if (this.isBattlemap()) {
            return 'Use these for roads, alleys, bridges, stairs, ledges, doors, trails, or other movement routes through the encounter space.';
        }

        return 'Use these for caves, grottoes, chasms, undercities, or subterranean spaces.';
    });
    readonly cavernCountLabel = computed(() => {
        if (this.isSettlementMap()) {
            return 'street or gate names ready.';
        }

        if (this.isCavernMap()) {
            return 'tunnel or chasm names ready.';
        }

        if (this.isBattlemap()) {
            return 'paths or access routes ready.';
        }

        return 'cavern names ready.';
    });

    constructor() {
        effect(() => {
            if (!this.open()) {
                return;
            }

            this.backgroundDraft.set(this.background());
            this.mapNameDraft.set(this.mapName());
            this.separateLabelsDraft.set(this.background() === 'Battlemap' ? false : this.separateLabels());
            this.settlementScaleDraft.set(this.settlementScale());
            this.parchmentLayoutDraft.set(this.parchmentLayout());
            this.cavernLayoutDraft.set(this.cavernLayout());
            this.battlemapLocaleDraft.set(this.battlemapLocale());
            this.lightingDraft.set(this.lighting());
            this.settlementNamesDraft.set(this.settlementNamesText());
            this.regionNamesDraft.set(this.regionNamesText());
            this.ruinNamesDraft.set(this.ruinNamesText());
            this.cavernNamesDraft.set(this.cavernNamesText());
            this.additionalDirectionDraft.set(this.additionalDirection());
        });
    }

    updateBackground(value: string | number): void {
        switch (value) {
            case 'City':
            case 'Coast':
            case 'Cavern':
            case 'Battlemap':
                this.backgroundDraft.set(value);
                if (value === 'Battlemap') {
                    this.separateLabelsDraft.set(false);
                }
                break;
            default:
                this.backgroundDraft.set('Parchment');
                break;
        }
    }

    updateMapName(value: string): void {
        this.mapNameDraft.set(value);
    }

    updateSeparateLabels(value: boolean): void {
        this.separateLabelsDraft.set(value);
    }

    updateSettlementScale(value: string | number): void {
        this.settlementScaleDraft.set(value === 'Hamlet' || value === 'Village' || value === 'Town' || value === 'Metropolis' ? value : 'City');
    }

    updateParchmentLayout(value: string | number): void {
        switch (value) {
            case 'Uniform':
            case 'Archipelago':
            case 'Atoll':
            case 'World':
            case 'Equirectangular':
                this.parchmentLayoutDraft.set(value);
                break;
            default:
                this.parchmentLayoutDraft.set('Continent');
                break;
        }
    }

    updateCavernLayout(value: string | number): void {
        switch (value) {
            case 'GrandCavern':
            case 'VerticalChasm':
            case 'CrystalGrotto':
            case 'RuinedUndercity':
            case 'LavaTubes':
                this.cavernLayoutDraft.set(value);
                break;
            default:
                this.cavernLayoutDraft.set('TunnelNetwork');
                break;
        }
    }

    updateBattlemapLocale(value: string | number): void {
        switch (value) {
            case 'TownStreet':
            case 'BuildingInterior':
            case 'Roadside':
            case 'Cliffside':
            case 'Riverside':
            case 'Ruins':
            case 'DungeonRoom':
            case 'Tavern':
                this.battlemapLocaleDraft.set(value);
                break;
            default:
                this.battlemapLocaleDraft.set('ForestClearing');
                break;
        }
    }

    updateLighting(value: string | number): void {
        switch (value) {
            case 'Dusk':
            case 'Night':
                this.lightingDraft.set(value);
                break;
            default:
                this.lightingDraft.set('Day');
                break;
        }
    }

    updateSettlementNames(value: string): void {
        this.settlementNamesDraft.set(value);
    }

    updateRegionNames(value: string): void {
        this.regionNamesDraft.set(value);
    }

    updateRuinNames(value: string): void {
        this.ruinNamesDraft.set(value);
    }

    updateCavernNames(value: string): void {
        this.cavernNamesDraft.set(value);
    }

    updateAdditionalDirection(value: string): void {
        this.additionalDirectionDraft.set(value);
    }

    close(): void {
        this.closed.emit();
    }

    submit(): void {
        const background = this.backgroundDraft();
        this.confirmed.emit({
            background,
            mapName: this.mapNameDraft().trim(),
            separateLabels: background === 'Battlemap' ? false : this.separateLabelsDraft(),
            settlementScale: this.settlementScaleDraft(),
            parchmentLayout: this.parchmentLayoutDraft(),
            cavernLayout: this.cavernLayoutDraft(),
            battlemapLocale: this.battlemapLocaleDraft(),
            lighting: this.lightingDraft(),
            settlementNamesText: this.settlementNamesDraft(),
            regionNamesText: this.regionNamesDraft(),
            ruinNamesText: this.ruinNamesDraft(),
            cavernNamesText: this.cavernNamesDraft(),
            additionalDirection: this.additionalDirectionDraft().trim()
        });
    }

    private parseNameList(value: string): string[] {
        return value
            .split(/\r?\n|,/)
            .map((entry) => entry.trim())
            .filter((entry, index, entries) => entry.length > 0 && entries.indexOf(entry) === index)
            .slice(0, 20);
    }
}
