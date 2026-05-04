import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { MultiSelectDropdownComponent, MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { CampaignNpc, NpcHostilityFilter, NpcImportanceFilter, NpcLifeFilter, NpcSortField } from '../../models/campaign-npc.models';

const ALL_CAMPAIGNS_FILTER_VALUE = '__all_campaigns__';

@Component({
    selector: 'app-npc-list',
    standalone: true,
    imports: [CommonModule, DropdownComponent, MultiSelectDropdownComponent],
    templateUrl: './npc-list.component.html',
    styleUrl: './npc-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcListComponent {
    readonly filtersExpanded = signal(false);
    readonly npcs = input.required<readonly CampaignNpc[]>();
    readonly totalNpcCount = input<number>(0);
    readonly selectedNpcId = input<string | null>(null);
    readonly canEdit = input<boolean>(false);
    readonly showCampaignFilter = input<boolean>(false);
    readonly campaignGroups = input<ReadonlyArray<MultiSelectOptionGroup>>([]);
    readonly selectedCampaignIds = input<string[]>([]);
    readonly searchTerm = input<string>('');
    readonly factionOptions = input.required<ReadonlyArray<DropdownOption>>();
    readonly locationOptions = input.required<ReadonlyArray<DropdownOption>>();
    readonly tagGroups = input.required<ReadonlyArray<MultiSelectOptionGroup>>();
    readonly selectedFaction = input<string>('');
    readonly selectedLocation = input<string>('');
    readonly selectedTags = input<string[]>([]);
    readonly lifeState = input<NpcLifeFilter>('All');
    readonly hostility = input<NpcHostilityFilter>('All');
    readonly importance = input<NpcImportanceFilter>('All');
    readonly sortBy = input<NpcSortField>('RecentlyUpdated');
    readonly campaignFilterGroups = computed<ReadonlyArray<MultiSelectOptionGroup>>(() => [
        {
            label: '',
            options: [{ value: ALL_CAMPAIGNS_FILTER_VALUE, label: 'All Campaigns' }]
        },
        ...this.campaignGroups()
    ]);
    readonly campaignFilterSelection = computed<string[]>(() => {
        const selected = this.selectedCampaignIds();
        return selected.length === 0 ? [ALL_CAMPAIGNS_FILTER_VALUE] : selected;
    });

    readonly searchChanged = output<string>();
    readonly campaignSelectionChanged = output<string[]>();
    readonly factionChanged = output<string>();
    readonly locationChanged = output<string>();
    readonly tagSelectionChanged = output<string[]>();
    readonly lifeStateChanged = output<NpcLifeFilter>();
    readonly hostilityChanged = output<NpcHostilityFilter>();
    readonly importanceChanged = output<NpcImportanceFilter>();
    readonly sortChanged = output<NpcSortField>();
    readonly selectNpc = output<string>();
    readonly editNpc = output<string>();
    readonly addNpc = output<void>();
    readonly loadMockNpcs = output<void>();
    readonly clearFilters = output<void>();
    readonly duplicateNpc = output<string>();
    readonly deleteNpc = output<string>();
    readonly toggleAlive = output<string>();
    readonly toggleHostile = output<string>();
    readonly toggleImportant = output<string>();

    readonly lifeStateOptions: DropdownOption[] = [
        { value: 'All', label: 'All statuses' },
        { value: 'Alive', label: 'Alive' },
        { value: 'Dead', label: 'Dead' }
    ];

    readonly hostilityOptions: DropdownOption[] = [
        { value: 'All', label: 'All temperaments' },
        { value: 'Friendly', label: 'Friendly' },
        { value: 'Indifferent', label: 'Indifferent' },
        { value: 'Hostile', label: 'Hostile' }
    ];

    readonly importanceOptions: DropdownOption[] = [
        { value: 'All', label: 'All priorities' },
        { value: 'Important', label: 'Important' },
        { value: 'NotImportant', label: 'Not important' }
    ];

    readonly sortOptions: DropdownOption[] = [
        { value: 'RecentlyUpdated', label: 'Recently updated' },
        { value: 'Name', label: 'Name' },
        { value: 'Location', label: 'Location' },
        { value: 'Faction', label: 'Faction' }
    ];

    emitSearch(value: string): void {
        this.searchChanged.emit(value);
    }

    emitCampaignSelection(value: string[]): void {
        if (value.includes(ALL_CAMPAIGNS_FILTER_VALUE)) {
            const campaignIds = value.filter((entry) => entry !== ALL_CAMPAIGNS_FILTER_VALUE);
            this.campaignSelectionChanged.emit(campaignIds);
            return;
        }

        this.campaignSelectionChanged.emit(value);
    }

    emitFaction(value: string | number): void {
        this.factionChanged.emit(typeof value === 'string' ? value : '');
    }

    emitLocation(value: string | number): void {
        this.locationChanged.emit(typeof value === 'string' ? value : '');
    }

    emitLifeState(value: string | number): void {
        this.lifeStateChanged.emit(value === 'Alive' || value === 'Dead' ? value : 'All');
    }

    emitHostility(value: string | number): void {
        this.hostilityChanged.emit(value === 'Friendly' || value === 'Indifferent' || value === 'Hostile' ? value : 'All');
    }

    hostilityBadgeClass(npc: CampaignNpc): string {
        switch (npc.hostility) {
            case 'Hostile':
                return 'hostile-badge';
            case 'Friendly':
                return 'friendly-badge';
            default:
                return 'neutral-badge';
        }
    }

    hostilityToggleClass(npc: CampaignNpc): string {
        switch (npc.hostility) {
            case 'Hostile':
                return 'toggle-pill--hostile';
            case 'Friendly':
                return 'toggle-pill--friendly';
            default:
                return 'toggle-pill--neutral';
        }
    }

    emitImportance(value: string | number): void {
        this.importanceChanged.emit(value === 'Important' || value === 'NotImportant' ? value : 'All');
    }

    emitSort(value: string | number): void {
        switch (value) {
            case 'Name':
            case 'Location':
            case 'Faction':
            case 'RecentlyUpdated':
                this.sortChanged.emit(value);
                break;
            default:
                this.sortChanged.emit('RecentlyUpdated');
                break;
        }
    }

    trackNpc(index: number, npc: CampaignNpc): string {
        return npc.id;
    }

    npcSubtitle(npc: CampaignNpc): string {
        return npc.title || npc.classOrRole || npc.occupation || 'Unassigned role';
    }

    hasActiveFilters(): boolean {
        return !!this.searchTerm().trim()
            || this.selectedCampaignIds().length > 0
            || !!this.selectedFaction()
            || !!this.selectedLocation()
            || this.selectedTags().length > 0
            || this.lifeState() !== 'All'
            || this.hostility() !== 'All'
            || this.importance() !== 'All'
            || this.sortBy() !== 'RecentlyUpdated';
    }

    toggleFilters(): void {
        this.filtersExpanded.update((expanded) => !expanded);
    }
}