import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { ApiGenerateNpcDraftResponse, DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { cloneNpcForCampaign, createDefaultNpc, duplicateNpc, filterAndSortNpcs, hasNpcNameConflict, mergeStoredNpcDrafts, sanitizeNpc, touchNpc } from '../../data/campaign-npc.helpers';
import { clearCampaignNpcDrafts, clearNpcLibrary, loadCampaignNpcDrafts, loadNpcLibrary, saveCampaignNpcDrafts, saveNpcLibrary } from '../../data/campaign-npc.storage';
import { CampaignNpc, NpcFilters, NpcSortField } from '../../models/campaign-npc.models';
import { DropdownOption } from '../dropdown/dropdown.component';
import { MultiSelectOptionGroup } from '../multi-select-dropdown/multi-select-dropdown.component';
import { NpcEditorComponent } from '../npc-editor/npc-editor.component';
import { NpcListComponent } from '../npc-list/npc-list.component';

interface NpcGenerationPrompt {
    nameHint: string;
    titleHint: string;
    raceHint: string;
    roleHint: string;
    factionHint: string;
    locationHint: string;
    motivationHint: string;
    notesHint: string;
}

@Component({
    selector: 'app-npc-manager',
    standalone: true,
    imports: [CommonModule, NpcListComponent, NpcEditorComponent, ConfirmModalComponent],
    templateUrl: './npc-manager.component.html',
    styleUrl: './npc-manager.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcManagerComponent {
    readonly campaignId = input<string>('');
    readonly canEdit = input<boolean>(false);
    readonly npcNames = input<readonly string[]>([]);
    readonly libraryMode = input<boolean>(false);
    readonly listOnly = input<boolean>(false);
    readonly importTargetCampaignId = input<string>('');

    private readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly router = inject(Router);

    readonly allNpcs = signal<CampaignNpc[]>([]);
    readonly selectedNpcId = signal<string | null>(null);
    readonly filters = signal<NpcFilters>({
        search: '',
        campaignIds: [],
        faction: '',
        location: '',
        tags: [],
        lifeState: 'All',
        hostility: 'All',
        importance: 'All',
        sortBy: 'RecentlyUpdated'
    });
    readonly feedback = signal('');
    readonly lastAutosavedAt = signal('');
    readonly deleteCandidate = signal<CampaignNpc | null>(null);
    readonly libraryNpcs = signal<CampaignNpc[]>([]);
    readonly libraryDeleteCandidate = signal<CampaignNpc | null>(null);
    readonly npcGenerationInProgress = signal(false);
    readonly npcGenerationError = signal('');

    readonly campaignFilterGroups = computed<MultiSelectOptionGroup[]>(() => [{
        label: 'Campaigns',
        options: [...this.store.campaigns()]
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((campaign) => ({ value: campaign.id, label: campaign.name }))
    }]);
    readonly libraryNpcCampaignUsage = computed(() => {
        const usage = new Map<string, Set<string>>();

        for (const campaign of this.store.campaigns()) {
            const mergedDrafts = mergeStoredNpcDrafts(campaign.npcs, loadCampaignNpcDrafts(campaign.id) ?? []);

            for (const npc of mergedDrafts) {
                const normalizedName = this.normalizeNpcName(npc.name);
                if (!normalizedName) {
                    continue;
                }

                const campaigns = usage.get(normalizedName) ?? new Set<string>();
                campaigns.add(campaign.id);
                usage.set(normalizedName, campaigns);
            }
        }

        return usage;
    });
    readonly filteredNpcs = computed(() => {
        const filters = this.filters();
        const selectedCampaignIds = filters.campaignIds;

        const campaignFiltered = this.libraryMode() && selectedCampaignIds.length > 0
            ? this.allNpcs().filter((npc) => {
                const campaignIds = this.libraryNpcCampaignUsage().get(this.normalizeNpcName(npc.name));
                return selectedCampaignIds.some((campaignId) => campaignIds?.has(campaignId));
            })
            : this.allNpcs();

        return filterAndSortNpcs(campaignFiltered, filters);
    });
    readonly activeNpc = computed<CampaignNpc | null>(() => this.allNpcs().find((npc) => npc.id === this.selectedNpcId()) ?? this.allNpcs()[0] ?? null);
    readonly activeNpcId = computed<string | null>(() => this.activeNpc()?.id ?? null);
    readonly hasCampaignContext = computed(() => !!this.campaignId() && !this.libraryMode() && this.canEdit());
    readonly nameConflict = computed(() => {
        const activeNpc = this.activeNpc();
        return activeNpc ? hasNpcNameConflict(this.allNpcs(), activeNpc) : false;
    });
    readonly autosaveLabel = computed(() => this.lastAutosavedAt() ? `Autosaved ${this.lastAutosavedAt()}` : 'Autosave is ready');
    readonly factionOptions = computed<DropdownOption[]>(() => [
        { value: '', label: 'All factions' },
        ...this.uniqueValues(this.allNpcs().map((npc) => npc.faction)).map((value) => ({ value, label: value }))
    ]);
    readonly locationOptions = computed<DropdownOption[]>(() => [
        { value: '', label: 'All locations' },
        ...this.uniqueValues(this.allNpcs().map((npc) => npc.location)).map((value) => ({ value, label: value }))
    ]);
    readonly tagGroups = computed<MultiSelectOptionGroup[]>(() => [{
        label: 'Tags',
        options: this.uniqueValues(this.allNpcs().flatMap((npc) => npc.tags))
    }]);
    readonly relationshipTargetOptions = computed<DropdownOption[]>(() => {
        const activeNpcId = this.activeNpc()?.id;
        return [
            { value: '', label: 'No target' },
            ...this.allNpcs()
                .filter((npc) => npc.id !== activeNpcId)
                .map((npc) => ({ value: npc.id, label: npc.name }))
        ];
    });
    readonly librarySortedNpcs = computed(() => [...this.libraryNpcs()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));

    constructor() {
        effect(() => {
            const storedLibrary = (loadNpcLibrary() ?? []).map((npc) => sanitizeNpc(npc));
            this.libraryNpcs.set(storedLibrary);
        });

        effect(() => {
            const campaignId = this.campaignId();
            const names = [...this.npcNames()];
            const libraryMode = this.libraryMode();

            if (libraryMode) {
                const library = [...this.libraryNpcs()];
                this.allNpcs.set(library);
                const selectedNpcId = this.selectedNpcId();
                if (!selectedNpcId || !library.some((npc) => npc.id === selectedNpcId)) {
                    this.selectedNpcId.set(library[0]?.id ?? null);
                }

                return;
            }

            if (!campaignId) {
                this.allNpcs.set([]);
                this.selectedNpcId.set(null);
                return;
            }

            const stored = loadCampaignNpcDrafts(campaignId) ?? [];
            const merged = mergeStoredNpcDrafts(names, stored);
            this.allNpcs.set(merged);

            const selectedNpcId = this.selectedNpcId();
            if (!selectedNpcId || !merged.some((npc) => npc.id === selectedNpcId)) {
                this.selectedNpcId.set(merged[0]?.id ?? null);
            }
        });
    }

    selectNpc(npcId: string): void {
        this.npcGenerationError.set('');
        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.listOnly() && this.libraryMode()) {
            void this.router.navigate(['/npcs', npcId], { queryParams });
            return;
        }

        if (this.listOnly() && !this.libraryMode() && this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', npcId]);
            return;
        }

        this.selectedNpcId.set(npcId);
    }

    editNpc(npcId: string): void {
        this.npcGenerationError.set('');
        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.listOnly() && this.libraryMode()) {
            void this.router.navigate(['/npcs', npcId, 'edit'], { queryParams });
            return;
        }

        if (this.listOnly() && !this.libraryMode() && this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', npcId, 'edit']);
            return;
        }

        this.selectedNpcId.set(npcId);
    }

    addNpc(): void {
        this.npcGenerationError.set('');
        const queryParams = this.importTargetCampaignId() ? { campaignId: this.importTargetCampaignId() } : undefined;

        if (this.listOnly() && this.libraryMode()) {
            void this.router.navigate(['/npcs', 'new'], { queryParams });
            return;
        }

        if (this.listOnly() && !this.libraryMode() && this.campaignId()) {
            void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', 'new']);
            return;
        }

        const nextNpc = sanitizeNpc(touchNpc(createDefaultNpc(this.nextNpcName())));

        const nextList = [nextNpc, ...this.allNpcs()];
        this.persistLocalState(nextList, nextNpc.id);
        this.feedback.set('New NPC draft created locally. Save it when the record is ready.');
    }

    updateSearch(value: string): void {
        this.filters.update((filters) => ({ ...filters, search: value }));
    }

    updateCampaignIds(value: string[]): void {
        const validCampaignIds = new Set(
            this.campaignFilterGroups()
                .flatMap((group) => group.options)
                .map((option) => typeof option === 'string' ? option : option.value)
        );
        const nextSelection = [...new Set(value.filter((campaignId) => validCampaignIds.has(campaignId)))];
        const totalCampaignCount = validCampaignIds.size;

        this.filters.update((filters) => ({
            ...filters,
            campaignIds: nextSelection.length === totalCampaignCount ? [] : nextSelection
        }));
    }

    updateFaction(value: string): void {
        this.filters.update((filters) => ({ ...filters, faction: value }));
    }

    updateLocation(value: string): void {
        this.filters.update((filters) => ({ ...filters, location: value }));
    }

    updateTags(value: string[]): void {
        this.filters.update((filters) => ({ ...filters, tags: value }));
    }

    updateLifeState(value: NpcFilters['lifeState']): void {
        this.filters.update((filters) => ({ ...filters, lifeState: value }));
    }

    updateHostility(value: NpcFilters['hostility']): void {
        this.filters.update((filters) => ({ ...filters, hostility: value }));
    }

    updateImportance(value: NpcFilters['importance']): void {
        this.filters.update((filters) => ({ ...filters, importance: value }));
    }

    updateSort(value: NpcSortField): void {
        this.filters.update((filters) => ({ ...filters, sortBy: value }));
    }

    clearFilters(): void {
        this.filters.set({
            search: '',
            campaignIds: [],
            faction: '',
            location: '',
            tags: [],
            lifeState: 'All',
            hostility: 'All',
            importance: 'All',
            sortBy: 'RecentlyUpdated'
        });
    }

    handleDraftChanged(npc: CampaignNpc): void {
        this.npcGenerationError.set('');
        const nextList = this.allNpcs().map((entry) => entry.id === npc.id ? npc : entry);
        this.persistLocalState(nextList, npc.id);
    }

    async generateActiveNpc(prompt: NpcGenerationPrompt): Promise<void> {
        const activeNpc = this.activeNpc();
        if (!activeNpc || !this.canEdit()) {
            return;
        }

        this.npcGenerationInProgress.set(true);
        this.npcGenerationError.set('');
        this.feedback.set('');

        try {
            const generated = await this.api.generateNpcDraft({
                campaignId: this.libraryMode() ? undefined : this.campaignId(),
                nameHint: prompt.nameHint.trim() || activeNpc.name,
                titleHint: prompt.titleHint.trim() || activeNpc.title,
                raceHint: prompt.raceHint.trim() || activeNpc.race,
                roleHint: prompt.roleHint.trim() || activeNpc.classOrRole,
                factionHint: prompt.factionHint.trim() || activeNpc.faction,
                locationHint: prompt.locationHint.trim() || activeNpc.location,
                motivationHint: prompt.motivationHint.trim() || activeNpc.motivations,
                notesHint: prompt.notesHint.trim() || activeNpc.notes,
                existingNpcNames: this.allNpcs()
                    .filter((npc) => npc.id !== activeNpc.id)
                    .map((npc) => npc.name)
            });

            const nextNpc = this.mergeGeneratedNpc(activeNpc, generated);
            const nextList = this.allNpcs().map((entry) => entry.id === nextNpc.id ? nextNpc : entry);
            this.persistLocalState(nextList, nextNpc.id);

            if (this.libraryMode()) {
                this.persistLibraryState(nextList);
                this.feedback.set('NPC draft generated. Review it and save when ready.');
            } else {
                this.feedback.set('NPC draft generated. Review it, then save the NPC to sync its name with the campaign.');
            }
        } catch (error) {
            this.npcGenerationError.set(this.readApiError(error, 'Could not generate an NPC draft right now.'));
        } finally {
            this.npcGenerationInProgress.set(false);
            this.cdr.detectChanges();
        }
    }

    async handleSaveNpc(npc: CampaignNpc): Promise<void> {
        const currentNpc = this.allNpcs().find((entry) => entry.id === npc.id) ?? null;
        const sanitizedNpc = sanitizeNpc(npc);

        if (hasNpcNameConflict(this.allNpcs(), sanitizedNpc)) {
            this.feedback.set('Choose a unique NPC name before saving.');
            return;
        }

        const nextList = this.allNpcs().map((entry) => entry.id === sanitizedNpc.id ? sanitizedNpc : entry);
        this.persistLocalState(nextList, sanitizedNpc.id);

        if (this.libraryMode()) {
            this.persistLibraryState(nextList);
            this.feedback.set('NPC saved to the reusable library.');
            this.cdr.detectChanges();
            return;
        }

        const syncSucceeded = await this.syncNpcName(currentNpc, sanitizedNpc);
        this.feedback.set(syncSucceeded
            ? 'NPC saved.'
            : 'NPC draft saved locally, but the campaign NPC name list could not be synced.');
        this.cdr.detectChanges();
    }

    async duplicateSelectedNpc(): Promise<void> {
        const activeNpc = this.activeNpc();
        if (!activeNpc) {
            return;
        }

        await this.duplicateNpc(activeNpc.id);
    }

    async duplicateNpc(npcId: string): Promise<void> {
        const source = this.allNpcs().find((npc) => npc.id === npcId);
        if (!source) {
            return;
        }

        const clone = duplicateNpc(source, this.allNpcs().map((npc) => npc.name));
        const nextList = [clone, ...this.allNpcs()];
        this.persistLocalState(nextList, clone.id);

        if (this.libraryMode()) {
            this.persistLibraryState(nextList);
            this.feedback.set('NPC duplicated in the reusable library.');
            this.cdr.detectChanges();
            return;
        }

        const syncSucceeded = await this.syncNpcName(null, clone);
        this.feedback.set(syncSucceeded
            ? 'NPC duplicated.'
            : 'NPC duplicate saved locally, but the campaign NPC name list could not be synced.');
        this.cdr.detectChanges();
    }

    requestDeleteNpc(npcId: string): void {
        this.deleteCandidate.set(this.allNpcs().find((npc) => npc.id === npcId) ?? null);
    }

    cancelDeleteNpc(): void {
        this.deleteCandidate.set(null);
    }

    async confirmDeleteNpc(): Promise<void> {
        const candidate = this.deleteCandidate();
        if (!candidate) {
            return;
        }

        const nextList = this.allNpcs().filter((npc) => npc.id !== candidate.id);
        this.persistLocalState(nextList, nextList[0]?.id ?? null);
        this.deleteCandidate.set(null);

        if (this.libraryMode()) {
            this.persistLibraryState(nextList);
            this.feedback.set('NPC removed from the reusable library.');
            this.cdr.detectChanges();
            return;
        }

        const syncSucceeded = await this.removeNpcName(candidate.name);
        this.feedback.set(syncSucceeded
            ? 'NPC removed.'
            : 'NPC removed locally, but the campaign NPC name list could not be synced.');
        this.cdr.detectChanges();
    }

    async toggleFlag(npcId: string, flag: 'isAlive' | 'hostility' | 'isImportant'): Promise<void> {
        const npc = this.allNpcs().find((entry) => entry.id === npcId);
        if (!npc) {
            return;
        }

        const updatedNpc = sanitizeNpc(touchNpc(
            flag === 'hostility'
                ? { ...npc, hostility: this.nextHostility(npc.hostility) }
                : { ...npc, [flag]: !npc[flag] }
        ));

        const nextList = this.allNpcs().map((entry) => entry.id === npcId ? updatedNpc : entry);
        this.persistLocalState(nextList, npcId);
    }

    resetLocalDrafts(): void {
        this.npcGenerationError.set('');
        if (this.libraryMode()) {
            clearNpcLibrary();
            this.libraryNpcs.set([]);
            this.allNpcs.set([]);
            this.selectedNpcId.set(null);
            this.feedback.set('Reusable library cleared.');
            return;
        }

        clearCampaignNpcDrafts(this.campaignId());
        const merged = mergeStoredNpcDrafts(this.npcNames(), []);
        this.allNpcs.set(merged);
        this.selectedNpcId.set(merged[0]?.id ?? null);
        this.feedback.set('Local NPC drafts reset to the campaign list.');
    }

    saveActiveNpcToLibrary(): void {
        const activeNpc = this.activeNpc();
        if (!activeNpc) {
            return;
        }

        const currentLibrary = this.libraryNpcs();
        const existingIndex = currentLibrary.findIndex((npc) => npc.name.trim().toLowerCase() === activeNpc.name.trim().toLowerCase());
        const libraryEntry = sanitizeNpc(touchNpc({ ...activeNpc }));

        const nextLibrary = existingIndex >= 0
            ? currentLibrary.map((npc, index) => index === existingIndex ? { ...libraryEntry, id: currentLibrary[existingIndex].id } : npc)
            : [libraryEntry, ...currentLibrary];

        this.persistLibraryState(nextLibrary);
        this.feedback.set('NPC saved to the reusable library.');
    }

    async importLibraryNpc(libraryNpcId: string): Promise<void> {
        if (!this.hasCampaignContext()) {
            const libraryNpc = this.libraryNpcs().find((npc) => npc.id === libraryNpcId);
            if (libraryNpc) {
                this.selectedNpcId.set(libraryNpc.id);
            }
            return;
        }

        const source = this.libraryNpcs().find((npc) => npc.id === libraryNpcId);
        if (!source) {
            return;
        }

        const imported = cloneNpcForCampaign(source, this.allNpcs().map((npc) => npc.name));
        const nextList = [imported, ...this.allNpcs()];
        this.persistLocalState(nextList, imported.id);

        const syncSucceeded = await this.syncNpcName(null, imported);
        this.feedback.set(syncSucceeded
            ? 'Library NPC imported into this campaign.'
            : 'Library NPC imported locally, but the campaign NPC name list could not be synced.');
        this.cdr.detectChanges();
    }

    requestDeleteLibraryNpc(libraryNpcId: string): void {
        this.libraryDeleteCandidate.set(this.libraryNpcs().find((npc) => npc.id === libraryNpcId) ?? null);
    }

    cancelDeleteLibraryNpc(): void {
        this.libraryDeleteCandidate.set(null);
    }

    confirmDeleteLibraryNpc(): void {
        const candidate = this.libraryDeleteCandidate();
        if (!candidate) {
            return;
        }

        const nextLibrary = this.libraryNpcs().filter((npc) => npc.id !== candidate.id);
        this.persistLibraryState(nextLibrary);
        this.libraryDeleteCandidate.set(null);
        this.feedback.set('NPC removed from the reusable library.');
    }

    private mergeGeneratedNpc(currentNpc: CampaignNpc, generated: ApiGenerateNpcDraftResponse): CampaignNpc {
        return sanitizeNpc(touchNpc({
            ...currentNpc,
            name: generated.name || currentNpc.name,
            title: generated.title,
            race: generated.race,
            classOrRole: generated.classOrRole,
            faction: generated.faction,
            occupation: generated.occupation,
            age: generated.age,
            gender: generated.gender,
            alignment: generated.alignment,
            currentStatus: generated.currentStatus,
            location: generated.location,
            shortDescription: generated.shortDescription,
            appearance: generated.appearance,
            personalityTraits: generated.personalityTraits,
            ideals: generated.ideals,
            bonds: generated.bonds,
            flaws: generated.flaws,
            motivations: generated.motivations,
            goals: generated.goals,
            fears: generated.fears,
            secrets: generated.secrets,
            mannerisms: generated.mannerisms,
            voiceNotes: generated.voiceNotes,
            backstory: generated.backstory,
            notes: generated.notes,
            combatNotes: generated.combatNotes,
            statBlockReference: generated.statBlockReference,
            tags: generated.tags,
            questLinks: generated.questLinks,
            sessionAppearances: generated.sessionAppearances,
            inventory: generated.inventory,
            imageUrl: generated.imageUrl,
            hostility: generated.isHostile ? 'Hostile' : 'Friendly',
            isAlive: generated.isAlive,
            isImportant: generated.isImportant
        }));
    }

    private readApiError(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                return detail || title || fallback;
            }
        }

        return fallback;
    }

    private persistLocalState(npcs: CampaignNpc[], selectedNpcId: string | null): void {
        this.allNpcs.set(npcs);
        this.selectedNpcId.set(selectedNpcId);
        if (this.libraryMode()) {
            this.persistLibraryState(npcs);
        } else {
            saveCampaignNpcDrafts(this.campaignId(), npcs);
        }
        this.lastAutosavedAt.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    private persistLibraryState(npcs: CampaignNpc[]): void {
        this.libraryNpcs.set(npcs);
        saveNpcLibrary(npcs);
        this.lastAutosavedAt.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    private uniqueValues(values: readonly string[]): string[] {
        return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
    }

    private normalizeNpcName(name: string): string {
        return name.trim().toLowerCase();
    }

    private nextHostility(current: CampaignNpc['hostility']): CampaignNpc['hostility'] {
        switch (current) {
            case 'Friendly':
                return 'Indifferent';
            case 'Indifferent':
                return 'Hostile';
            default:
                return 'Friendly';
        }
    }

    private nextNpcName(): string {
        const namesInUse = new Set(this.allNpcs().map((npc) => npc.name.trim().toLowerCase()));
        let counter = 1;
        let nextName = 'New NPC';

        while (namesInUse.has(nextName.toLowerCase())) {
            counter += 1;
            nextName = `New NPC ${counter}`;
        }

        return nextName;
    }

    private async syncNpcName(previousNpc: CampaignNpc | null, nextNpc: CampaignNpc): Promise<boolean> {
        if (!this.canEdit()) {
            return true;
        }

        const campaignId = this.campaignId();
        if (!campaignId) {
            return false;
        }

        if (!previousNpc) {
            return await this.store.addCampaignNpc(campaignId, nextNpc.name);
        }

        if (previousNpc.name === nextNpc.name) {
            return true;
        }

        const added = await this.store.addCampaignNpc(campaignId, nextNpc.name);
        if (!added) {
            return false;
        }

        const removed = await this.store.removeCampaignNpc(campaignId, previousNpc.name);
        if (!removed) {
            await this.store.removeCampaignNpc(campaignId, nextNpc.name);
            return false;
        }

        return true;
    }

    private async removeNpcName(name: string): Promise<boolean> {
        if (!this.canEdit()) {
            return true;
        }

        const campaignId = this.campaignId();
        if (!campaignId) {
            return false;
        }

        return await this.store.removeCampaignNpc(campaignId, name);
    }
}