import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { CampaignNpcPreviewModalComponent } from '../../components/campaign-npc-preview-modal/campaign-npc-preview-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { MonsterStatBlockModalComponent } from '../../components/monster-stat-block-modal/monster-stat-block-modal.component';
import { createDefaultNpc, mergeCampaignNpcSources, sanitizeNpc, touchNpc } from '../../data/campaign-npc.helpers';
import { monsterCatalog } from '../../data/monster-catalog.generated';
import { CampaignNpc } from '../../models/campaign-npc.models';
import { Character, SessionPrep, ThreatLevel } from '../../models/dungeon.models';
import { MonsterCatalogEntry } from '../../models/monster-reference.models';
import { SessionEditorDraft, SessionMonster, SessionNpc } from '../../models/session-editor.models';
import { ApiGenerateNpcDraftResponse, DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface SessionDetailFact {
    label: string;
    value: string;
}

interface SessionSectionLink {
    id: string;
    label: string;
}

interface SessionDetailView {
    id: string;
    title: string;
    shortDescription: string;
    sessionNumber: number;
    date: string;
    inGameLocation: string;
    estimatedLength: string;
    threatWasSetManually: boolean;
    threat: ThreatLevel;
    markdownNotes: string;
    scenes: SessionEditorDraft['scenes'];
    npcs: SessionEditorDraft['npcs'];
    monsters: SessionEditorDraft['monsters'];
    locations: SessionEditorDraft['locations'];
    loot: SessionEditorDraft['loot'];
    skillChecks: SessionEditorDraft['skillChecks'];
    secrets: SessionEditorDraft['secrets'];
    branchingPaths: SessionEditorDraft['branchingPaths'];
    nextSessionHooks: SessionEditorDraft['nextSessionHooks'];
}

interface SessionPersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
    notes?: string;
    isContainer?: boolean;
    containedItems?: SessionPersistedInventoryEntry[];
    equipped?: boolean;
}

interface SessionPersistedBuilderState {
    inventoryEntries?: SessionPersistedInventoryEntry[];
    [key: string]: unknown;
}

interface SessionLootAssignment {
    itemName: string;
    itemCategory: string;
    allocations: Array<{
        characterId: string;
        quantity: number;
    }>;
}

const monsterCatalogByLookupKey = new Map<string, MonsterCatalogEntry>();
const monsterLookupStopWords = new Set(['the', 'a', 'an', 'of', 'and']);

for (const entry of monsterCatalog) {
    for (const key of buildMonsterLookupKeys(entry.name)) {
        if (!monsterCatalogByLookupKey.has(key)) {
            monsterCatalogByLookupKey.set(key, entry);
        }
    }
}

@Component({
    selector: 'app-session-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DropdownComponent, MonsterStatBlockModalComponent, CampaignNpcPreviewModalComponent],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailPageComponent {
    private readonly builderStateStartTag = '[DK_BUILDER_STATE_START]';
    private readonly builderStateEndTag = '[DK_BUILDER_STATE_END]';

    private readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly sessionId = signal('');
    readonly initialized = signal(false);
    readonly loadError = signal('');
    readonly storedDraft = signal<SessionEditorDraft | null>(null);
    readonly renderedMarkdown = signal('');
    readonly detailsLoadRequested = signal(false);
    readonly interactionMessage = signal('');
    readonly interactionError = signal('');
    readonly activeMonster = signal<MonsterCatalogEntry | null>(null);
    readonly activeCampaignNpc = signal<CampaignNpc | null>(null);
    readonly npcDraftVersion = signal(0);
    readonly activeNpcCreationName = signal('');
    readonly activeLootAddId = signal('');
    readonly activeLootAssignId = signal('');
    readonly activeLootRemoveId = signal('');
    readonly lootAssignmentTargets = signal<Record<string, string>>({});
    readonly lootAssignmentAmounts = signal<Record<string, string>>({});
    readonly lootAssignments = signal<Record<string, SessionLootAssignment>>({});
    readonly selectedSection = signal('all');

    readonly campaignNpcLookup = computed(() =>
        new Set((this.currentCampaign()?.npcs ?? []).map((name) => normalizeLookupValue(name)))
    );
    readonly storedCampaignNpcDraftMap = computed(() => {
        return new Map(
            mergeCampaignNpcSources(this.currentCampaign()?.npcs ?? [], this.currentCampaign()?.campaignNpcs ?? [], [])
                .map((npc) => sanitizeNpc(npc))
                .map((npc) => [normalizeLookupValue(npc.name), npc] as const)
        );
    });

    readonly currentCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null
    );
    readonly partyCharacters = computed<Character[]>(() => {
        const campaign = this.currentCampaign();
        if (!campaign) {
            return [];
        }

        const byId = new Map(this.store.characters().map((character) => [character.id, character]));
        return campaign.partyCharacterIds
            .map((characterId) => byId.get(characterId))
            .filter((character): character is Character => Boolean(character));
    });
    readonly lootAssignmentOptions = computed<DropdownOption[]>(() =>
        this.partyCharacters()
            .filter((character) => character.status !== 'Inactive')
            .map((character) => ({
                value: character.id,
                label: character.name,
                description: `${character.className} ${character.level}`
            }))
    );
    readonly sessionSummary = computed(() =>
        this.currentCampaign()?.sessions.find((session) => session.id === this.sessionId()) ?? null
    );
    readonly canEdit = computed(() => this.currentCampaign()?.currentUserRole === 'Owner');
    readonly hasRichDraft = computed(() => this.storedDraft() !== null);
    readonly backLink = computed<readonly string[]>(() => ['/campaigns', this.campaignId(), 'sessions']);
    readonly editLink = computed<readonly string[]>(() => ['/campaigns', this.campaignId(), 'sessions', this.sessionId(), 'edit']);
    readonly pageSummary = computed(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return 'Detailed notes, scene flow, and encounter prep for the table.';
        }

        return detail.shortDescription || 'Detailed notes, scene flow, and encounter prep for the table.';
    });
    readonly overviewFacts = computed<SessionDetailFact[]>(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return [];
        }

        const facts: SessionDetailFact[] = [
            { label: 'Session', value: `#${detail.sessionNumber}` },
            { label: 'Date', value: detail.date || 'TBD' },
            { label: 'Location', value: detail.inGameLocation || 'Unrecorded' },
            { label: 'Length', value: detail.estimatedLength || 'Flexible' },
        ];
        if (this.canEdit()) {
            facts.push(
                { label: 'Threat', value: detail.threat },
                { label: 'Threat Source', value: detail.threatWasSetManually ? 'Manual selection' : 'Auto derived' },
                { label: 'Source', value: this.hasRichDraft() ? 'Local draft + campaign summary' : 'Campaign summary only' }
            );
        }
        return facts;
    });
    readonly sectionOptions = computed<SessionSectionLink[]>(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return [];
        }

        const options: SessionSectionLink[] = [
            { id: 'all', label: 'All' },
            { id: 'session-notes', label: 'Session Notes' }
        ];

        if (detail.scenes.length > 0) {
            options.push({
                id: 'session-scenes',
                label: 'Scenes'
            });
        }

        if (detail.npcs.length > 0 || detail.monsters.length > 0) {
            options.push({
                id: 'session-cast',
                label: 'NPCs and Monsters'
            });
        }

        if (detail.locations.length > 0 || detail.loot.length > 0) {
            options.push({
                id: 'session-terrain',
                label: 'Locations and Loot'
            });
        }

        if (detail.skillChecks.length > 0) {
            options.push({
                id: 'session-skill-checks',
                label: 'Skill Checks'
            });
        }

        if (detail.secrets.length > 0 || detail.branchingPaths.length > 0 || detail.nextSessionHooks.length > 0) {
            options.push({
                id: 'session-loose-ends',
                label: 'Secrets, Branches, and Hooks'
            });
        }

        return options;
    });
    readonly sessionDetail = computed<SessionDetailView | null>(() => {
        const summary = this.sessionSummary();
        const draft = this.storedDraft();
        const campaign = this.currentCampaign();

        if (!summary && !draft) {
            return null;
        }

        return {
            id: draft?.id || summary?.id || this.sessionId(),
            title: draft?.title || summary?.title || 'Untitled Session',
            shortDescription: draft?.shortDescription || summary?.objective || '',
            sessionNumber: draft?.sessionNumber ?? this.resolveSessionNumber(summary),
            date: draft?.date || summary?.date || '',
            inGameLocation: draft?.inGameLocation || summary?.location || '',
            estimatedLength: draft?.estimatedLength || '',
            threatWasSetManually: Boolean(draft?.threatLevel),
            threat: draft?.threatLevel ?? summary?.threat ?? this.deriveThreatFromDraft(draft),
            markdownNotes: this.resolveMarkdownNotes(summary, draft),
            scenes: draft?.scenes ?? [],
            npcs: draft?.npcs ?? [],
            monsters: draft?.monsters ?? [],
            locations: draft?.locations ?? [],
            loot: draft?.loot ?? [],
            skillChecks: draft?.skillChecks ?? [],
            secrets: draft?.secrets ?? [],
            branchingPaths: draft?.branchingPaths ?? [],
            nextSessionHooks: draft?.nextSessionHooks ?? []
        };
    });

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                this.campaignId.set(campaignId);
                this.sessionId.set(params.get('sessionId') ?? '');
                this.initialized.set(false);
                this.loadError.set('');
                this.storedDraft.set(null);
                this.renderedMarkdown.set('');
                this.detailsLoadRequested.set(false);
                this.interactionMessage.set('');
                this.interactionError.set('');
                this.activeMonster.set(null);
                this.activeCampaignNpc.set(null);
                this.activeLootAddId.set('');
                this.activeLootAssignId.set('');
                this.activeLootRemoveId.set('');
                this.lootAssignmentTargets.set({});
                this.lootAssignmentAmounts.set({});
                this.lootAssignments.set({});
                this.selectedSection.set('all');
                this.cdr.detectChanges();
            });

        effect(() => {
            const campaignId = this.campaignId();
            const storeInitialized = this.store.initialized();
            const detailsLoadRequested = this.detailsLoadRequested();
            const detailsLoading = campaignId ? this.store.isCampaignDetailsLoading(campaignId) : false;

            if (!campaignId || !storeInitialized || detailsLoadRequested || detailsLoading) {
                return;
            }

            this.detailsLoadRequested.set(true);
            void this.store.refreshCampaignLoaded(campaignId);
        });

        effect(() => {
            const campaignId = this.campaignId();
            const sessionId = this.sessionId();
            const storeInitialized = this.store.initialized();
            const isDetailsLoading = campaignId ? this.store.isCampaignDetailsLoading(campaignId) : false;

            if (!campaignId || !sessionId) {
                return;
            }

            const campaign = this.currentCampaign();
            if (!campaign) {
                if (!storeInitialized) {
                    return;
                }

                this.loadError.set('The requested campaign could not be found.');
                this.initialized.set(true);
                this.cdr.detectChanges();
                return;
            }

            const summary = campaign.sessions.find((session) => session.id === sessionId) ?? null;
            if (!campaign.detailsLoaded) {
                if (this.detailsLoadRequested() && !isDetailsLoading) {
                    this.loadError.set('The requested session details could not be loaded.');
                    this.initialized.set(true);
                    this.cdr.detectChanges();
                }
                return;
            }

            const draft = this.parseSessionDraft(summary?.detailsJson ?? null);
            this.storedDraft.set(draft);
            this.lootAssignments.set(this.parseLootAssignments(summary?.lootAssignmentsJson ?? null));

            if (!summary && !draft) {
                if (isDetailsLoading || !this.detailsLoadRequested()) {
                    return;
                }
                this.loadError.set('The requested session could not be found in this campaign.');
                this.initialized.set(true);
                this.cdr.detectChanges();
                return;
            }

            const markdown = this.resolveMarkdownNotes(summary, draft);
            this.renderedMarkdown.set(String(marked.parse(markdown || '_No session notes recorded yet._', { gfm: true, breaks: true })));
            this.loadError.set('');
            this.initialized.set(true);
            this.cdr.detectChanges();
        });
    }

    isCampaignNpc(name: string): boolean {
        return this.campaignNpcLookup().has(normalizeLookupValue(name));
    }

    hasStoredCampaignNpcDraft(name: string): boolean {
        return this.storedCampaignNpcDraftMap().has(normalizeLookupValue(name));
    }

    isCreatingCampaignNpc(name: string): boolean {
        return normalizeLookupValue(this.activeNpcCreationName()) === normalizeLookupValue(name);
    }

    isAddingCampaignLoot(lootId: string): boolean {
        return this.activeLootAddId() === lootId;
    }

    isAssigningSessionLoot(lootId: string): boolean {
        return this.activeLootAssignId() === lootId;
    }

    isRemovingSessionLoot(lootId: string): boolean {
        return this.activeLootRemoveId() === lootId;
    }

    hasLootAssignment(lootId: string): boolean {
        return this.lootAssignmentTotal(lootId) > 0;
    }

    lootAssignmentTotal(lootId: string): number {
        const assignment = this.lootAssignments()[lootId];
        if (!assignment) {
            return 0;
        }

        return assignment.allocations.reduce((total, allocation) => total + Math.max(0, Math.trunc(allocation.quantity || 0)), 0);
    }

    lootAssignmentRemaining(lootEntry: SessionEditorDraft['loot'][number]): number {
        const totalQuantity = Number.isFinite(lootEntry.quantity) ? Math.max(1, Math.floor(lootEntry.quantity)) : 1;
        return Math.max(0, totalQuantity - this.lootAssignmentTotal(lootEntry.id));
    }

    lootCanAssignMore(lootEntry: SessionEditorDraft['loot'][number]): boolean {
        return this.lootAssignmentRemaining(lootEntry) > 0;
    }

    lootHasSingleQuantity(lootEntry: SessionEditorDraft['loot'][number]): boolean {
        const totalQuantity = Number.isFinite(lootEntry.quantity) ? Math.max(1, Math.floor(lootEntry.quantity)) : 1;
        return totalQuantity === 1;
    }

    lootAssignmentAmountValue(lootEntry: SessionEditorDraft['loot'][number]): string {
        const remaining = this.lootAssignmentRemaining(lootEntry);
        const draft = this.lootAssignmentAmounts()[lootEntry.id];
        if (!draft || !draft.trim()) {
            return remaining > 0 ? '1' : '0';
        }

        const parsed = Math.trunc(Number(draft));
        if (!Number.isFinite(parsed)) {
            return remaining > 0 ? '1' : '0';
        }

        if (remaining <= 0) {
            return '0';
        }

        return String(Math.max(1, Math.min(remaining, parsed)));
    }

    setLootAssignmentAmount(lootId: string, value: string): void {
        this.lootAssignmentAmounts.update((current) => ({
            ...current,
            [lootId]: value
        }));
    }

    async assignSelectedSessionLootAmount(lootEntry: SessionEditorDraft['loot'][number]): Promise<void> {
        const amount = Math.trunc(Number(this.lootAssignmentAmountValue(lootEntry)));
        await this.assignSessionLootQuantityToCharacter(lootEntry, amount);
    }

    lootAssignmentRows(lootId: string): Array<{ characterId: string; label: string; quantity: number }> {
        const assignment = this.lootAssignments()[lootId];
        if (!assignment) {
            return [];
        }

        return assignment.allocations
            .map((allocation) => {
                const character = this.store.characters().find((item) => item.id === allocation.characterId) ?? null;

                return {
                    characterId: allocation.characterId,
                    label: character?.name ?? 'Unknown character',
                    quantity: Math.max(0, Math.trunc(allocation.quantity || 0))
                };
            })
            .filter((row) => row.quantity > 0);
    }

    lootAssignedSummaryLabel(lootEntry: SessionEditorDraft['loot'][number]): string {
        const totalAssigned = this.lootAssignmentTotal(lootEntry.id);
        if (totalAssigned <= 0) {
            return 'Not assigned';
        }

        const totalQuantity = Number.isFinite(lootEntry.quantity) ? Math.max(1, Math.floor(lootEntry.quantity)) : 1;
        const remaining = Math.max(0, totalQuantity - totalAssigned);
        const assignedLabel = totalAssigned === 1 ? '1 assigned' : `${totalAssigned} assigned`;
        const remainingLabel = remaining === 1 ? '1 remaining' : `${remaining} remaining`;

        return `${assignedLabel} · ${remainingLabel}`;
    }

    singleQuantityAssignedLabel(lootId: string): string {
        const rows = this.lootAssignmentRows(lootId);
        if (rows.length === 0) {
            return 'Assigned';
        }

        return `Assigned to ${rows[0].label}`;
    }

    lootAssignmentTarget(lootId: string): string {
        const options = this.lootAssignmentOptions();
        if (options.length === 0) {
            return '';
        }

        const explicitSelection = this.lootAssignmentTargets()[lootId];
        if (explicitSelection && options.some((option) => String(option.value) === explicitSelection)) {
            return explicitSelection;
        }

        return String(options[0].value);
    }

    setLootAssignmentTarget(lootId: string, value: string | number): void {
        const nextValue = String(value ?? '').trim();
        this.lootAssignmentTargets.update((current) => ({
            ...current,
            [lootId]: nextValue
        }));
    }

    resolveStoredCampaignNpc(name: string): CampaignNpc | null {
        return this.storedCampaignNpcDraftMap().get(normalizeLookupValue(name)) ?? null;
    }

    openStoredCampaignNpcModal(name: string): void {
        const npc = this.resolveStoredCampaignNpc(name);
        if (!npc) {
            return;
        }

        this.activeCampaignNpc.set(npc);
        this.cdr.detectChanges();
    }

    closeCampaignNpcModal(): void {
        this.activeCampaignNpc.set(null);
        this.cdr.detectChanges();
    }

    selectSection(sectionId: string): void {
        if (!sectionId.trim()) {
            return;
        }

        this.selectedSection.set(sectionId);
    }

    isSectionVisible(sectionId: string): boolean {
        const selectedSection = this.selectedSection();
        return selectedSection === 'all' || selectedSection === sectionId;
    }

    openStoredCampaignNpc(name: string): void {
        const npc = this.storedCampaignNpcDraftMap().get(normalizeLookupValue(name));
        if (!npc) {
            return;
        }

        void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', this.toRouteNpcId(npc.id)]);
    }

    editStoredCampaignNpc(name: string): void {
        const npc = this.resolveStoredCampaignNpc(name);
        if (!npc) {
            return;
        }

        void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', this.toRouteNpcId(npc.id), 'edit']);
    }

    async addNpcToCampaign(sessionNpc: SessionNpc): Promise<void> {
        const campaignId = this.campaignId();
        const trimmedName = sessionNpc.name.trim();

        if (!campaignId || !trimmedName || !this.canEdit()) {
            return;
        }

        if (this.isCreatingCampaignNpc(trimmedName)) {
            return;
        }

        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeNpcCreationName.set(trimmedName);

        try {
            const existingDraft = this.storedCampaignNpcDraftMap().get(normalizeLookupValue(trimmedName)) ?? null;
            if (existingDraft) {
                return;
            }

            let draft = this.buildCampaignNpcFromSessionNpc(sessionNpc);

            try {
                const generated = await this.api.generateNpcDraft(this.buildNpcGenerationRequest(sessionNpc));
                draft = this.mergeGeneratedNpcDraft(draft, generated);
            } catch (error) {
                void error;
            }

            const savedNpc = this.persistCampaignNpcDraft(draft);

            const synced = await this.store.saveCampaignNpc(campaignId, savedNpc);
            if (!synced) {
                this.interactionError.set('The full NPC draft was saved locally, but the campaign NPC could not be synced.');
            }
        } finally {
            this.activeNpcCreationName.set('');
            this.cdr.detectChanges();
        }
    }

    private toRouteNpcId(id: string): string {
        if (id.startsWith('npc-')) {
            return id.slice('npc-'.length);
        }

        return id;
    }

    async addSessionLootToCampaign(lootEntry: SessionEditorDraft['loot'][number]): Promise<void> {
        const campaignId = this.campaignId();
        const sessionId = this.sessionId();
        const trimmedName = lootEntry.name.trim();
        const quantity = Number.isFinite(lootEntry.quantity) ? Math.max(1, Math.floor(lootEntry.quantity)) : 1;

        if (!campaignId || !trimmedName || !this.canEdit()) {
            return;
        }

        if (this.isAddingCampaignLoot(lootEntry.id)) {
            return;
        }

        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeLootAddId.set(lootEntry.id);
        this.cdr.detectChanges();

        try {
            let addedCount = 0;

            for (let index = 0; index < quantity; index += 1) {
                const added = await this.store.addCampaignLoot(campaignId, trimmedName, sessionId);
                if (!added) {
                    break;
                }

                addedCount += 1;
            }

            if (addedCount === quantity) {
                this.interactionMessage.set(quantity === 1
                    ? `${trimmedName} added to campaign loot log.`
                    : `Added ${quantity} x ${trimmedName} to campaign loot log.`);
                return;
            }

            if (addedCount > 0) {
                const remaining = quantity - addedCount;
                const remainingLabel = remaining === 1 ? 'entry' : 'entries';

                this.interactionMessage.set(`Added ${addedCount} x ${trimmedName} to campaign loot log.`);
                this.interactionError.set(`Could not add ${remaining} remaining ${remainingLabel}.`);
                return;
            }

            this.interactionError.set(this.store.lastError() || `Could not add ${trimmedName} to campaign loot log.`);
        } finally {
            this.activeLootAddId.set('');
            this.cdr.detectChanges();
        }
    }

    async assignSessionLootToCharacter(lootEntry: SessionEditorDraft['loot'][number]): Promise<void> {
        await this.assignSessionLootQuantityToCharacter(lootEntry, 1);
    }

    async assignAllRemainingSessionLootToCharacter(lootEntry: SessionEditorDraft['loot'][number]): Promise<void> {
        await this.assignSessionLootQuantityToCharacter(lootEntry, this.lootAssignmentRemaining(lootEntry));
    }

    private async assignSessionLootQuantityToCharacter(
        lootEntry: SessionEditorDraft['loot'][number],
        requestedQuantity: number
    ): Promise<void> {
        const selectedCharacterId = this.lootAssignmentTarget(lootEntry.id);
        const selectedCharacter = this.partyCharacters().find((character) => character.id === selectedCharacterId) ?? null;
        const trimmedName = lootEntry.name.trim();
        const category = lootEntry.type.trim() || 'Session Loot';
        const notes = lootEntry.notes.trim() || undefined;
        const remaining = this.lootAssignmentRemaining(lootEntry);
        const quantityToAssign = Math.max(0, Math.min(remaining, Math.trunc(requestedQuantity || 0)));

        if (!this.canEdit() || !selectedCharacter || !trimmedName) {
            return;
        }

        if (quantityToAssign <= 0) {
            this.interactionError.set('All copies of this loot item are already assigned.');
            return;
        }

        if (!this.lootCanAssignMore(lootEntry)) {
            this.interactionError.set('All copies of this loot item are already assigned.');
            return;
        }

        if (this.isAssigningSessionLoot(lootEntry.id)) {
            return;
        }

        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeLootAssignId.set(lootEntry.id);
        this.cdr.detectChanges();

        try {
            const parsed = this.parsePersistedNotes(selectedCharacter.notes ?? '');
            const nextState: SessionPersistedBuilderState = {
                ...parsed.state,
                inventoryEntries: this.mergeInventoryEntry(parsed.state.inventoryEntries ?? [], {
                    name: trimmedName,
                    category,
                    quantity: quantityToAssign,
                    notes,
                    isContainer: false,
                    containedItems: []
                })
            };
            const updatedNotes = this.createPersistedNotesString(selectedCharacter.notes ?? '', nextState);

            const updated = await this.persistCharacterNotes(selectedCharacter, updatedNotes);
            if (!updated) {
                this.interactionError.set(`Could not assign ${trimmedName} to ${selectedCharacter.name}.`);
                return;
            }

            this.lootAssignments.update((current) => {
                const existing = current[lootEntry.id];
                const nextAllocations = existing?.allocations?.map((allocation) => ({ ...allocation })) ?? [];
                const matchingIndex = nextAllocations.findIndex((allocation) => allocation.characterId === selectedCharacter.id);

                if (matchingIndex === -1) {
                    nextAllocations.push({
                        characterId: selectedCharacter.id,
                        quantity: quantityToAssign
                    });
                } else {
                    nextAllocations[matchingIndex] = {
                        ...nextAllocations[matchingIndex],
                        quantity: Math.max(0, Math.trunc(nextAllocations[matchingIndex].quantity || 0)) + quantityToAssign
                    };
                }

                return {
                    ...current,
                    [lootEntry.id]: {
                        itemName: trimmedName,
                        itemCategory: category,
                        allocations: nextAllocations
                    }
                };
            });
            this.persistSessionLootAssignments();

            const updatedRemaining = this.lootAssignmentRemaining(lootEntry);
            this.interactionMessage.set(quantityToAssign === 1
                ? `${trimmedName} assigned to ${selectedCharacter.name}. ${updatedRemaining} remaining.`
                : `${quantityToAssign} x ${trimmedName} assigned to ${selectedCharacter.name}. ${updatedRemaining} remaining.`);
        } finally {
            this.activeLootAssignId.set('');
            this.cdr.detectChanges();
        }
    }

    async removeSessionLootAssignment(lootEntry: SessionEditorDraft['loot'][number], characterId: string): Promise<void> {
        const assignment = this.lootAssignments()[lootEntry.id];
        if (!assignment) {
            return;
        }

        const targetAllocation = assignment.allocations.find((allocation) => allocation.characterId === characterId);
        if (!targetAllocation || targetAllocation.quantity <= 0) {
            return;
        }

        if (this.isRemovingSessionLoot(lootEntry.id)) {
            return;
        }

        const assignedCharacter = this.store.characters().find((character) => character.id === characterId) ?? null;
        if (!assignedCharacter) {
            this.removeLootAllocation(lootEntry.id, characterId, 1);
            this.interactionError.set('The assigned character is no longer available. Assignment was cleared.');
            this.cdr.detectChanges();
            return;
        }

        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeLootRemoveId.set(lootEntry.id);
        this.cdr.detectChanges();

        try {
            const parsed = this.parsePersistedNotes(assignedCharacter.notes ?? '');
            const nextState: SessionPersistedBuilderState = {
                ...parsed.state,
                inventoryEntries: this.removeInventoryEntry(
                    parsed.state.inventoryEntries ?? [],
                    assignment.itemName,
                    assignment.itemCategory,
                    1
                )
            };
            const updatedNotes = this.createPersistedNotesString(assignedCharacter.notes ?? '', nextState);

            const updated = await this.persistCharacterNotes(assignedCharacter, updatedNotes);
            if (!updated) {
                this.interactionError.set(`Could not remove assigned loot from ${assignedCharacter.name}.`);
                return;
            }

            this.removeLootAllocation(lootEntry.id, characterId, 1);
            this.interactionMessage.set(`Removed one assigned ${assignment.itemName} from ${assignedCharacter.name}.`);
        } finally {
            this.activeLootRemoveId.set('');
            this.cdr.detectChanges();
        }
    }

    resolveMonsterCatalogEntry(monster: SessionMonster | string): MonsterCatalogEntry | null {
        const monsterName = typeof monster === 'string' ? monster : monster.name;

        for (const key of buildMonsterLookupKeys(monsterName)) {
            const match = monsterCatalogByLookupKey.get(key);
            if (match) {
                return match;
            }
        }

        if (typeof monster === 'string') {
            return this.findFuzzyMonsterCatalogEntry({
                id: 'lookup-preview',
                name: monster,
                type: '',
                challengeRating: '',
                hp: 0,
                keyAbilities: '',
                notes: ''
            });
        }

        return this.findFuzzyMonsterCatalogEntry(monster);
    }

    describeMonsterArmorClass(monster: SessionMonster): string {
        const armorClass = this.resolveMonsterCatalogEntry(monster)?.armorClass;
        return typeof armorClass === 'number' ? `AC ${armorClass}` : '';
    }

    describeMonsterSavingThrows(monster: SessionMonster): string {
        return this.resolveMonsterCatalogEntry(monster)?.savingThrows?.trim() ?? '';
    }

    describeMonsterSenses(monster: SessionMonster): string {
        return this.resolveMonsterCatalogEntry(monster)?.senses?.trim() ?? '';
    }

    private findFuzzyMonsterCatalogEntry(monster: SessionMonster): MonsterCatalogEntry | null {
        const normalizedName = normalizeLookupValue(monster.name);
        const nameTokens = tokenizeLookupValue(monster.name);
        const normalizedType = normalizeLookupValue(monster.type);
        const challengeRating = parseChallengeRating(monster.challengeRating);
        let bestMatch: MonsterCatalogEntry | null = null;
        let bestScore = 0;

        for (const entry of monsterCatalog) {
            const normalizedEntryName = normalizeLookupValue(entry.name);
            const entryTokens = tokenizeLookupValue(entry.name);
            let score = 0;

            if (normalizedName && (normalizedEntryName.includes(normalizedName) || normalizedName.includes(normalizedEntryName))) {
                score += 28;
            }

            const overlapCount = countSharedTokens(nameTokens, entryTokens);
            if (overlapCount > 0) {
                score += overlapCount * 16;
                score += Math.round((overlapCount / Math.max(nameTokens.length, 1)) * 18);
            }

            if (normalizedType) {
                const normalizedCreatureType = normalizeLookupValue(entry.creatureType);
                const normalizedCreatureCategory = normalizeLookupValue(entry.creatureCategory);

                if (
                    normalizedCreatureType.includes(normalizedType)
                    || normalizedType.includes(normalizedCreatureType)
                    || normalizedCreatureCategory.includes(normalizedType)
                    || normalizedType.includes(normalizedCreatureCategory)
                ) {
                    score += 20;
                }
            }

            const entryChallengeRating = parseChallengeRating(entry.challengeRating);
            if (challengeRating !== null && entryChallengeRating !== null) {
                const difference = Math.abs(challengeRating - entryChallengeRating);
                if (difference === 0) {
                    score += 16;
                } else if (difference <= 1) {
                    score += 10;
                } else if (difference <= 2) {
                    score += 4;
                }
            }

            if (monster.hp > 0 && typeof entry.hitPoints === 'number') {
                const hpDifference = Math.abs(monster.hp - entry.hitPoints);
                if (hpDifference <= 15) {
                    score += 10;
                } else if (hpDifference <= 35) {
                    score += 5;
                }
            }

            if (entry.sourceUrl) {
                score += 2;
            }

            if (entry.actions.length > 0) {
                score += 2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }

        return bestScore >= 30 ? bestMatch : null;
    }

    openMonsterStatBlock(monster: MonsterCatalogEntry): void {
        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeMonster.set(monster);
        this.cdr.detectChanges();
    }

    closeMonsterModal(): void {
        this.activeMonster.set(null);
        this.cdr.detectChanges();
    }

    openMonsterStatBlockBySessionMonster(monster: SessionMonster): void {
        const entry = this.resolveMonsterCatalogEntry(monster);

        if (!entry) {
            this.interactionMessage.set('');
            this.interactionError.set(`No local stat block match was found for ${monster.name}.`);
            this.cdr.detectChanges();
            return;
        }

        this.openMonsterStatBlock(entry);
    }

    private resolveSessionNumber(summary: SessionPrep | null): number {
        const campaign = this.currentCampaign();
        if (!campaign || !summary) {
            return 1;
        }

        const index = campaign.sessions.findIndex((session) => session.id === summary.id);
        return index >= 0 ? index + 1 : 1;
    }

    private deriveThreatFromDraft(draft: SessionEditorDraft | null): ThreatLevel {
        const note = `${draft?.shortDescription ?? ''} ${draft?.markdownNotes ?? ''}`.toLowerCase();
        if (note.includes('deadly')) {
            return 'Deadly';
        }
        if (note.includes('high')) {
            return 'High';
        }
        if (note.includes('low')) {
            return 'Low';
        }
        return 'Moderate';
    }

    private resolveMarkdownNotes(summary: SessionPrep | null, draft: SessionEditorDraft | null): string {
        if (draft?.markdownNotes.trim()) {
            return draft.markdownNotes.trim();
        }

        if (draft?.shortDescription.trim()) {
            return `## Session Objective\n\n${draft.shortDescription.trim()}`;
        }

        if (summary?.objective.trim()) {
            return `## Session Objective\n\n${summary.objective.trim()}`;
        }

        return '';
    }

    private buildCampaignNpcFromSessionNpc(sessionNpc: SessionNpc): CampaignNpc {
        const session = this.sessionDetail();
        const baseNpc = createDefaultNpc(sessionNpc.name.trim());
        const personalityTraits = sessionNpc.personality.trim() ? [sessionNpc.personality.trim()] : [];
        const sessionAppearance = session?.title?.trim() ? [session.title.trim()] : [];
        const importedNotes = [
            sessionNpc.personality.trim() ? `Personality: ${sessionNpc.personality.trim()}` : '',
            sessionNpc.motivation.trim() ? `Motivation: ${sessionNpc.motivation.trim()}` : '',
            sessionNpc.voiceNotes.trim() ? `Voice notes: ${sessionNpc.voiceNotes.trim()}` : ''
        ].filter(Boolean).join('\n');

        return sanitizeNpc(touchNpc({
            ...baseNpc,
            title: sessionNpc.role.trim(),
            classOrRole: sessionNpc.role.trim(),
            location: session?.inGameLocation.trim() || '',
            shortDescription: buildNpcShortDescription(sessionNpc),
            personalityTraits,
            motivations: sessionNpc.motivation.trim(),
            voiceNotes: sessionNpc.voiceNotes.trim(),
            notes: importedNotes,
            tags: ['Session NPC'],
            sessionAppearances: sessionAppearance,
            isImportant: true
        }));
    }

    private buildNpcGenerationRequest(sessionNpc: SessionNpc) {
        const campaign = this.currentCampaign();
        const session = this.sessionDetail();
        const existingNpcNames = Array.from(new Set([
            ...(campaign?.npcs ?? []),
            ...Array.from(this.storedCampaignNpcDraftMap().values()).map((npc) => npc.name)
        ]));

        return {
            campaignId: this.campaignId(),
            nameHint: sessionNpc.name.trim(),
            titleHint: sessionNpc.role.trim(),
            raceHint: '',
            roleHint: sessionNpc.role.trim(),
            factionHint: '',
            locationHint: session?.inGameLocation.trim() || '',
            motivationHint: sessionNpc.motivation.trim(),
            functionHint: 'Create a full campaign NPC record from a session prep note. Preserve provided details and fill in the missing biography, appearance, goals, secrets, and campaign hooks.',
            toneHint: campaign?.tone ?? '',
            campaignTieHint: [campaign?.name, campaign?.hook, campaign?.summary, session?.title, session?.shortDescription]
                .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
                .join(' | '),
            notesHint: [sessionNpc.personality.trim(), sessionNpc.motivation.trim(), sessionNpc.voiceNotes.trim(), session?.markdownNotes.trim() ?? '']
                .filter(Boolean)
                .join(' | '),
            existingNpcNames
        };
    }

    private mergeGeneratedNpcDraft(currentNpc: CampaignNpc, generated: ApiGenerateNpcDraftResponse): CampaignNpc {
        return sanitizeNpc(touchNpc({
            ...currentNpc,
            title: currentNpc.title || generated.title,
            race: currentNpc.race || generated.race,
            classOrRole: currentNpc.classOrRole || generated.classOrRole,
            faction: currentNpc.faction || generated.faction,
            occupation: currentNpc.occupation || generated.occupation,
            age: currentNpc.age || generated.age,
            gender: currentNpc.gender || generated.gender,
            alignment: currentNpc.alignment || generated.alignment,
            currentStatus: currentNpc.currentStatus || generated.currentStatus,
            location: currentNpc.location || generated.location,
            shortDescription: currentNpc.shortDescription || generated.shortDescription,
            appearance: currentNpc.appearance || generated.appearance,
            personalityTraits: currentNpc.personalityTraits.length > 0 ? currentNpc.personalityTraits : generated.personalityTraits,
            ideals: currentNpc.ideals.length > 0 ? currentNpc.ideals : generated.ideals,
            bonds: currentNpc.bonds.length > 0 ? currentNpc.bonds : generated.bonds,
            flaws: currentNpc.flaws.length > 0 ? currentNpc.flaws : generated.flaws,
            motivations: currentNpc.motivations || generated.motivations,
            goals: currentNpc.goals || generated.goals,
            fears: currentNpc.fears || generated.fears,
            secrets: currentNpc.secrets.length > 0 ? currentNpc.secrets : generated.secrets,
            mannerisms: currentNpc.mannerisms.length > 0 ? currentNpc.mannerisms : generated.mannerisms,
            voiceNotes: currentNpc.voiceNotes || generated.voiceNotes,
            backstory: currentNpc.backstory || generated.backstory,
            notes: currentNpc.notes || generated.notes,
            combatNotes: currentNpc.combatNotes || generated.combatNotes,
            statBlockReference: currentNpc.statBlockReference || generated.statBlockReference,
            tags: mergeUniqueStrings(currentNpc.tags, generated.tags, ['Session NPC']),
            questLinks: currentNpc.questLinks.length > 0 ? currentNpc.questLinks : generated.questLinks,
            sessionAppearances: mergeUniqueStrings(currentNpc.sessionAppearances, generated.sessionAppearances),
            inventory: currentNpc.inventory.length > 0 ? currentNpc.inventory : generated.inventory,
            imageUrl: currentNpc.imageUrl || generated.imageUrl,
            hostility: currentNpc.hostility !== 'Indifferent' ? currentNpc.hostility : (generated.isHostile ? 'Hostile' : 'Friendly'),
            isAlive: generated.isAlive,
            isImportant: currentNpc.isImportant || generated.isImportant
        }));
    }

    private persistCampaignNpcDraft(npc: CampaignNpc): CampaignNpc {
        this.npcDraftVersion.update((value) => value + 1);
        return npc;
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

    private parsePersistedNotes(notes: string): { cleanedNotes: string; state: SessionPersistedBuilderState } {
        const startIndex = notes.indexOf(this.builderStateStartTag);
        if (startIndex === -1) {
            return {
                cleanedNotes: notes.trim(),
                state: {}
            };
        }

        const endIndex = notes.indexOf(this.builderStateEndTag, startIndex + this.builderStateStartTag.length);
        if (endIndex === -1) {
            return {
                cleanedNotes: notes.trim(),
                state: {}
            };
        }

        const cleanedNotes = notes.slice(0, startIndex).trim();
        const rawState = notes.slice(startIndex + this.builderStateStartTag.length, endIndex).trim();
        if (!rawState) {
            return {
                cleanedNotes,
                state: {}
            };
        }

        try {
            const parsed = JSON.parse(rawState) as SessionPersistedBuilderState | null;
            return {
                cleanedNotes,
                state: parsed && typeof parsed === 'object' ? parsed : {}
            };
        } catch {
            return {
                cleanedNotes,
                state: {}
            };
        }
    }

    private createPersistedNotesString(originalNotes: string, state: SessionPersistedBuilderState): string {
        const cleanedNotes = this.parsePersistedNotes(originalNotes).cleanedNotes;
        const serializedState = JSON.stringify(state);
        return `${cleanedNotes}\n\n${this.builderStateStartTag}${serializedState}${this.builderStateEndTag}`.trim();
    }

    private mergeInventoryEntry(
        entries: SessionPersistedInventoryEntry[],
        incoming: SessionPersistedInventoryEntry
    ): SessionPersistedInventoryEntry[] {
        const normalizedIncomingName = incoming.name.trim().toLowerCase();
        const normalizedIncomingCategory = incoming.category.trim().toLowerCase();
        const quantityToAdd = Math.max(1, Math.trunc(Number(incoming.quantity) || 1));

        if (!normalizedIncomingName || !normalizedIncomingCategory) {
            return [...entries];
        }

        const existingIndex = entries.findIndex((entry) =>
            entry.name.trim().toLowerCase() === normalizedIncomingName
            && entry.category.trim().toLowerCase() === normalizedIncomingCategory
            && !entry.isContainer
        );

        if (existingIndex === -1) {
            return [
                ...entries,
                {
                    ...incoming,
                    name: incoming.name.trim(),
                    category: incoming.category.trim(),
                    quantity: quantityToAdd
                }
            ];
        }

        return entries.map((entry, index) => {
            if (index !== existingIndex) {
                return entry;
            }

            return {
                ...entry,
                quantity: Math.max(1, Math.trunc(Number(entry.quantity) || 1)) + quantityToAdd,
                notes: entry.notes?.trim() || incoming.notes
            };
        });
    }

    private removeInventoryEntry(
        entries: SessionPersistedInventoryEntry[],
        itemName: string,
        itemCategory: string,
        quantityToRemove: number
    ): SessionPersistedInventoryEntry[] {
        const normalizedName = itemName.trim().toLowerCase();
        const normalizedCategory = itemCategory.trim().toLowerCase();
        const requestedRemoval = Math.max(1, Math.trunc(Number(quantityToRemove) || 1));

        if (!normalizedName || !normalizedCategory || entries.length === 0) {
            return [...entries];
        }

        let remainingToRemove = requestedRemoval;
        const nextEntries: SessionPersistedInventoryEntry[] = [];

        for (const entry of entries) {
            const entryName = entry.name.trim().toLowerCase();
            const entryCategory = entry.category.trim().toLowerCase();
            const entryQuantity = Math.max(1, Math.trunc(Number(entry.quantity) || 1));
            const isMatchingEntry = !entry.isContainer && entryName === normalizedName && entryCategory === normalizedCategory;

            if (!isMatchingEntry || remainingToRemove <= 0) {
                nextEntries.push(entry);
                continue;
            }

            if (entryQuantity <= remainingToRemove) {
                remainingToRemove -= entryQuantity;
                continue;
            }

            nextEntries.push({
                ...entry,
                quantity: entryQuantity - remainingToRemove
            });
            remainingToRemove = 0;
        }

        return nextEntries;
    }

    private async persistCharacterNotes(character: Character, notes: string): Promise<boolean> {
        const updatedCharacter = await this.store.updateCharacter(character.id, {
            name: character.name,
            playerName: character.playerName,
            race: character.race,
            className: character.className,
            role: character.role,
            level: character.level,
            background: character.background,
            notes,
            campaignId: character.campaignId,
            campaignIds: character.campaignIds,
            abilityScores: character.abilityScores,
            skills: character.skills,
            armorClass: character.armorClass,
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            deathSaveFailures: character.deathSaveFailures,
            deathSaveSuccesses: character.deathSaveSuccesses,
            alignment: character.alignment,
            faith: character.faith,
            lifestyle: character.lifestyle,
            classFeatures: character.classFeatures,
            speciesTraits: character.speciesTraits,
            languages: character.languages,
            personalityTraits: character.personalityTraits,
            ideals: character.ideals,
            bonds: character.bonds,
            flaws: character.flaws,
            equipment: character.equipment,
            spells: character.spells,
            experiencePoints: character.experiencePoints,
            image: character.image,
            detailBackgroundImageUrl: character.detailBackgroundImageUrl
        });

        return updatedCharacter !== null;
    }

    private clearLootAssignment(lootId: string): void {
        this.lootAssignments.update((current) => {
            if (!current[lootId]) {
                return current;
            }

            const { [lootId]: _removedAssignment, ...remaining } = current;
            return remaining;
        });
        this.persistSessionLootAssignments();
    }

    private removeLootAllocation(lootId: string, characterId: string, quantityToRemove: number): void {
        const safeQuantity = Math.max(1, Math.trunc(quantityToRemove || 1));

        this.lootAssignments.update((current) => {
            const assignment = current[lootId];
            if (!assignment) {
                return current;
            }

            const nextAllocations = assignment.allocations
                .map((allocation) => {
                    if (allocation.characterId !== characterId) {
                        return allocation;
                    }

                    return {
                        ...allocation,
                        quantity: Math.max(0, Math.trunc(allocation.quantity || 0) - safeQuantity)
                    };
                })
                .filter((allocation) => allocation.quantity > 0);

            if (nextAllocations.length === 0) {
                const { [lootId]: _removedAssignment, ...remaining } = current;
                return remaining;
            }

            return {
                ...current,
                [lootId]: {
                    ...assignment,
                    allocations: nextAllocations
                }
            };
        });

        this.persistSessionLootAssignments();
    }

    private persistSessionLootAssignments(): void {
        const campaignId = this.campaignId();
        const sessionId = this.sessionId();
        const detailsJson = this.storedDraft() ? JSON.stringify(this.storedDraft()) : (this.sessionSummary()?.detailsJson ?? null);
        if (!campaignId || !sessionId) {
            return;
        }

        void this.store.saveSessionDetails(campaignId, sessionId, {
            detailsJson,
            lootAssignmentsJson: JSON.stringify(this.lootAssignments())
        });
    }

    private parseSessionDraft(detailsJson: string | null | undefined): SessionEditorDraft | null {
        if (!detailsJson?.trim()) {
            return null;
        }

        try {
            const parsed = JSON.parse(detailsJson) as SessionEditorDraft;
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    private parseLootAssignments(lootAssignmentsJson: string | null | undefined): Record<string, SessionLootAssignment> {
        if (!lootAssignmentsJson?.trim()) {
            return {};
        }

        try {
            const parsed = JSON.parse(lootAssignmentsJson) as Record<string, SessionLootAssignment>;
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }
}

function buildNpcShortDescription(sessionNpc: SessionNpc): string {
    const fragments = [sessionNpc.role.trim(), sessionNpc.motivation.trim()]
        .filter(Boolean)
        .slice(0, 2);

    return fragments.join(' · ');
}

function mergeUniqueStrings(...groups: string[][]): string[] {
    return Array.from(new Set(groups.flat().map((value) => value.trim()).filter(Boolean)));
}

function buildMonsterLookupKeys(value: string): string[] {
    const normalized = normalizeLookupValue(value);
    const withoutParentheticals = normalizeLookupValue(value.replace(/\([^)]*\)/g, ' '));
    const withoutLeadingArticle = normalized.replace(/^the\s+/, '');

    return Array.from(new Set([normalized, withoutParentheticals, withoutLeadingArticle].filter(Boolean)));
}

function normalizeLookupValue(value: string): string {
    return value
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9/\s-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeLookupValue(value: string): string[] {
    return Array.from(new Set(
        normalizeLookupValue(value)
            .split(/[^a-z0-9/]+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 3 && !monsterLookupStopWords.has(token))
    ));
}

function countSharedTokens(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) {
        return 0;
    }

    const rightSet = new Set(right);
    return left.filter((token) => rightSet.has(token)).length;
}

function parseChallengeRating(challengeRating: string): number | null {
    const normalized = challengeRating.trim();
    if (!normalized) {
        return null;
    }

    if (normalized.includes('/')) {
        const [numeratorText, denominatorText] = normalized.split('/');
        const numerator = Number(numeratorText);
        const denominator = Number(denominatorText);
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
            return null;
        }

        return numerator / denominator;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}