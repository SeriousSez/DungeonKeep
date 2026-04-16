import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NpcManagerComponent } from '../../components/npc-manager/npc-manager.component';
import { CustomTableManagerComponent } from '../../components/custom-table-manager/custom-table-manager.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { ItemDetailModalComponent } from '../../components/item-detail-modal/item-detail-modal.component';
import { equipmentCatalog } from '../../data/new-character-standard-page.data';
import type { InventoryEntry } from '../../data/new-character-standard-page.types';
import type { CampaignMember, CampaignWorldNote, CampaignWorldNoteCategory, Character, CharacterStatus } from '../../models/dungeon.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type CampaignSection = 'party' | 'sessions' | 'npcs' | 'tables' | 'loot' | 'threads' | 'notes' | 'members';
type ThreatLevel = 'Low' | 'Moderate' | 'High' | 'Deadly';
type CampaignLootSummary = {
    name: string;
    count: number;
    category: string;
    weight?: number;
    costGp?: number;
    notes?: string;
    sourceUrl?: string;
    sourceLabel?: string;
    summary?: string;
    detailLines?: string[];
    rarity?: string;
    attunement?: string;
};

const lootRarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Unique', '???'] as const;
const equipmentCatalogByName = new Map(equipmentCatalog.map((item) => [item.name.trim().toLowerCase(), item]));

@Component({
    selector: 'app-campaign-section-page',
    imports: [CommonModule, RouterLink, ConfirmModalComponent, DropdownComponent, NpcManagerComponent, CustomTableManagerComponent, ItemDetailModalComponent],
    templateUrl: './campaign-section-page.component.html',
    styleUrl: './campaign-section-page.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignSectionPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
    readonly section = computed<CampaignSection>(() => {
        const routeSection = this.route.snapshot.data['section'];

        switch (routeSection) {
            case 'party':
            case 'sessions':
            case 'npcs':
            case 'tables':
            case 'loot':
            case 'threads':
            case 'notes':
            case 'members':
                return routeSection;
            default:
                return 'party';
        }
    });

    readonly confirmAction = signal<'delete' | 'leave' | 'remove-member' | 'remove-character' | null>(null);
    readonly pendingMemberRemoval = signal<CampaignMember | null>(null);
    readonly pendingCharacterRemoval = signal<Character | null>(null);
    readonly characterActionInFlightId = signal('');
    readonly addThreadModalOpen = signal(false);
    readonly threadModalMode = signal<'add' | 'edit'>('add');
    readonly modalThreadId = signal<string | null>(null);
    readonly newThreadText = signal('');
    readonly newThreadVisibility = signal<'Party' | 'GMOnly'>('Party');
    readonly sessionModalOpen = signal(false);
    readonly sessionModalMode = signal<'add' | 'edit'>('add');
    readonly sessionModalId = signal<string | null>(null);
    readonly sessionTitle = signal('');
    readonly sessionDate = signal('');
    readonly sessionLocation = signal('');
    readonly sessionObjective = signal('');
    readonly sessionThreat = signal<ThreatLevel>('Moderate');
    readonly activeLootItemDetailModal = signal<InventoryEntry | null>(null);
    readonly lootDraft = signal('');
    readonly selectedLootCategory = signal('All');
    readonly selectedLootRarity = signal('All');
    readonly noteEditorOpen = signal(false);
    readonly noteEditorMode = signal<'add' | 'edit'>('add');
    readonly noteEditorId = signal<string | null>(null);
    readonly noteTitle = signal('');
    readonly noteCategory = signal<CampaignWorldNoteCategory>('Lore');
    readonly noteContent = signal('');
    readonly inviteEmail = signal('');
    readonly sectionFeedback = signal('');

    readonly threadVisibilityOptions: DropdownOption[] = [
        { value: 'Party', label: 'Party', description: 'Visible to all campaign members.' },
        { value: 'GMOnly', label: 'GM Only', description: 'Only visible to campaign owners.' }
    ];
    readonly threatOptions: DropdownOption[] = [
        { value: 'Low', label: 'Low', description: 'Straightforward scene with limited risk.' },
        { value: 'Moderate', label: 'Moderate', description: 'Pressure is present, but manageable.' },
        { value: 'High', label: 'High', description: 'Meaningful danger or serious complications.' },
        { value: 'Deadly', label: 'Deadly', description: 'A major turning point with real stakes.' }
    ];
    readonly worldNoteCategoryOptions: DropdownOption[] = [
        { value: 'Backstory', label: 'Backstory', description: 'History, myths, lineage, and old promises.' },
        { value: 'Organization', label: 'Organization', description: 'Guilds, courts, cults, crews, and factions.' },
        { value: 'Ally', label: 'Ally', description: 'Trusted patrons, guides, and recurring friends.' },
        { value: 'Enemy', label: 'Enemy', description: 'Rivals, villains, hunters, and hostile powers.' },
        { value: 'Location', label: 'Location', description: 'Settlements, ruins, landmarks, and strongholds.' },
        { value: 'Lore', label: 'Lore', description: 'Setting truths, rumors, customs, and magical rules.' },
        { value: 'Custom', label: 'Custom', description: 'Anything that does not fit the main buckets.' }
    ];

    readonly selectedCampaign = computed(() => {
        const id = this.campaignId();
        if (!id) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === id) ?? null;
    });
    readonly campaignReady = computed(() => this.selectedCampaign()?.detailsLoaded === true);

    readonly partyMembers = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return [];
        }

        const characterMap = new Map(this.store.characters().map((character) => [character.id, character]));

        return campaign.partyCharacterIds
            .map((id) => characterMap.get(id))
            .filter((character): character is Character => character !== undefined);
    });
    readonly activePartyMembers = computed(() => this.partyMembers().filter((character) => character.status !== 'Inactive'));
    readonly inactivePartyMembers = computed(() => this.partyMembers().filter((character) => character.status === 'Inactive'));

    readonly visibleThreads = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return [];
        }

        if (campaign.currentUserRole === 'Owner') {
            return campaign.openThreads;
        }

        return campaign.openThreads.filter((thread) => thread.visibility === 'Party');
    });
    readonly worldNotes = computed(() => this.selectedCampaign()?.worldNotes ?? []);
    readonly lootCategories = computed(() => {
        return ['All', ...new Set(equipmentCatalog.map((item) => item.category).sort((left, right) => left.localeCompare(right)))];
    });
    readonly isWondrousLootCategory = computed(() => this.selectedLootCategory() === 'Wondrous Item');
    readonly lootRarities = computed(() => {
        const availableRarities = [...new Set(
            equipmentCatalog
                .filter((item) => item.category === 'Wondrous Item')
                .map((item) => item.rarity?.trim())
                .filter((rarity): rarity is string => Boolean(rarity))
        )];
        const rankedRarities = lootRarityOrder.filter((rarity) => availableRarities.includes(rarity));
        const unrankedRarities = availableRarities
            .filter((rarity) => !lootRarityOrder.includes(rarity as typeof lootRarityOrder[number]))
            .sort((left, right) => left.localeCompare(right));

        return ['All', ...rankedRarities, ...unrankedRarities];
    });
    readonly filteredLootCatalog = computed(() => {
        const searchTerm = this.lootDraft().trim().toLowerCase();
        const selectedCategory = this.selectedLootCategory();
        const selectedRarity = this.selectedLootRarity();

        return [...equipmentCatalog]
            .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name))
            .filter((item) => selectedCategory === 'All' || item.category === selectedCategory)
            .filter((item) => selectedCategory !== 'Wondrous Item' || selectedRarity === 'All' || item.rarity === selectedRarity)
            .filter((item) => !searchTerm
                || item.name.toLowerCase().includes(searchTerm)
                || item.category.toLowerCase().includes(searchTerm));
    });
    readonly lootSummaries = computed<CampaignLootSummary[]>(() => {
        const loot = this.selectedCampaign()?.loot ?? [];
        const summaries = new Map<string, CampaignLootSummary>();

        for (const name of loot) {
            const normalizedName = name.trim().toLowerCase();
            const existingSummary = summaries.get(normalizedName);

            if (existingSummary) {
                existingSummary.count += 1;
                continue;
            }

            const matchedItem = equipmentCatalogByName.get(normalizedName);
            const category = matchedItem?.category ?? 'Custom';

            summaries.set(normalizedName, {
                name,
                count: 1,
                category,
                weight: matchedItem?.weight,
                costGp: matchedItem?.costGp,
                notes: matchedItem?.notes,
                sourceUrl: matchedItem?.sourceUrl,
                sourceLabel: matchedItem?.sourceLabel,
                summary: matchedItem?.summary,
                detailLines: matchedItem?.detailLines,
                rarity: matchedItem?.rarity,
                attunement: matchedItem?.attunement
            });
        }

        return [...summaries.values()];
    });
    readonly totalLootWeight = computed(() => this.lootSummaries().reduce((total, item) => total + ((item.weight ?? 0) * item.count), 0));

    constructor() {
        void this.ensureCampaignDetails();
    }

    private async ensureCampaignDetails(): Promise<void> {
        const campaignId = this.campaignId();
        if (!campaignId) {
            return;
        }

        await this.store.ensureCampaignLoaded(campaignId);
        this.cdr.detectChanges();
    }

    readonly pageTitle = computed(() => {
        switch (this.section()) {
            case 'party':
                return 'Party Roster';
            case 'sessions':
                return 'Campaign Sessions';
            case 'npcs':
                return 'Campaign NPCs';
            case 'tables':
                return 'Custom Tables';
            case 'loot':
                return 'Campaign Loot';
            case 'threads':
                return 'Open Threads';
            case 'notes':
                return 'World Notes';
            case 'members':
                return 'Campaign Members';
        }
    });

    readonly pageDescription = computed(() => {
        switch (this.section()) {
            case 'party':
                return 'Track which adventurers are actively in play, keep reserve characters attached to the campaign, and manage the roster between sessions.';
            case 'sessions':
                return 'Review prepared sessions, important locations, and the next objective waiting on the table.';
            case 'npcs':
                return 'Keep the campaign cast visible so important allies, patrons, rivals, and suspects stay easy to reference.';
            case 'tables':
                return 'Create custom random tables with their own title and description, then save your best ones into a reusable library.';
            case 'loot':
                return 'Track treasure, clues, debts, and notable items the party has collected along the way.';
            case 'threads':
                return 'Surface the unresolved problems, secrets, and hooks the party is still chasing.';
            case 'notes':
                return 'Capture persistent lore, key allies, enemies, factions, and locations so campaign knowledge stays easy to reference.';
            case 'members':
                return 'See who has access to the campaign and whether each invite is active or still pending.';
        }
    });

    readonly confirmModalOpen = computed(() => this.confirmAction() !== null);
    readonly confirmModalTitle = computed(() => {
        switch (this.confirmAction()) {
            case 'leave':
                return 'Leave Campaign?';
            case 'remove-member':
                return 'Remove Member?';
            case 'remove-character':
                return 'Remove Character?';
            default:
                return 'Delete Campaign?';
        }
    });
    readonly confirmModalMessage = computed(() => {
        switch (this.confirmAction()) {
            case 'leave':
                return 'Are you sure you want to leave this campaign? Your characters will be removed from the party and returned to your unassigned roster.';
            case 'remove-member': {
                const member = this.pendingMemberRemoval();
                const memberName = member?.displayName?.trim() || member?.email || 'this member';
                return `Remove ${memberName} from this campaign? Their characters will be returned to the unassigned roster.`;
            }
            case 'remove-character': {
                const character = this.pendingCharacterRemoval();
                const characterName = character?.name?.trim() || 'this character';
                return `Remove ${characterName} from this campaign party? They will stay in the roster, but no longer be assigned here.`;
            }
            default:
                return 'Are you sure you want to delete this campaign? This action cannot be undone.';
        }
    });
    readonly confirmModalActionText = computed(() => {
        switch (this.confirmAction()) {
            case 'leave':
                return 'Leave';
            case 'remove-member':
            case 'remove-character':
                return 'Remove';
            default:
                return 'Delete';
        }
    });

    isActiveSection(section: CampaignSection): boolean {
        return this.section() === section;
    }

    openSessionDetails(sessionId: string): void {
        const campaignId = this.campaignId();
        if (!campaignId || !sessionId) {
            return;
        }

        void this.router.navigate(['/campaigns', campaignId, 'sessions', sessionId]);
    }

    clearSectionFeedback(): void {
        this.sectionFeedback.set('');
    }

    handleRequestDelete(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.pendingMemberRemoval.set(null);
        this.pendingCharacterRemoval.set(null);
        this.confirmAction.set('delete');
    }

    handleRequestLeave(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Member') {
            return;
        }

        this.pendingMemberRemoval.set(null);
        this.pendingCharacterRemoval.set(null);
        this.confirmAction.set('leave');
    }

    handleRequestRemoveMember(member: CampaignMember): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner' || member.role === 'Owner' || !member.userId) {
            return;
        }

        this.pendingCharacterRemoval.set(null);
        this.pendingMemberRemoval.set(member);
        this.confirmAction.set('remove-member');
    }

    handleRequestRemoveCharacter(character: Character): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.pendingMemberRemoval.set(null);
        this.pendingCharacterRemoval.set(character);
        this.confirmAction.set('remove-character');
    }

    async toggleCharacterActive(character: Character): Promise<void> {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        const nextStatus: CharacterStatus = character.status === 'Inactive' ? 'Ready' : 'Inactive';
        this.characterActionInFlightId.set(character.id);
        this.sectionFeedback.set('');

        try {
            const updated = await this.store.setCharacterStatus(character.id, nextStatus);
            if (!updated) {
                this.sectionFeedback.set(nextStatus === 'Inactive'
                    ? 'Could not deactivate that character.'
                    : 'Could not reactivate that character.');
                return;
            }

            this.sectionFeedback.set(nextStatus === 'Inactive'
                ? `${character.name} is now inactive for this campaign.`
                : `${character.name} is active again.`);
        } finally {
            this.characterActionInFlightId.set('');
            this.cdr.detectChanges();
        }
    }

    isCharacterActionPending(characterId: string): boolean {
        return this.characterActionInFlightId() === characterId;
    }

    async handleConfirmAccepted(): Promise<void> {
        const id = this.campaignId();

        if (!id) {
            this.confirmAction.set(null);
            this.cdr.detectChanges();
            return;
        }

        if (this.confirmAction() === 'delete') {
            await this.store.deleteCampaign(id);
            await this.router.navigate(['/campaigns']);
        } else if (this.confirmAction() === 'leave') {
            const didLeave = await this.store.leaveCampaign(id);
            if (didLeave) {
                await this.router.navigate(['/campaigns']);
            }
        } else if (this.confirmAction() === 'remove-member') {
            const member = this.pendingMemberRemoval();
            if (member?.userId) {
                const removed = await this.store.removeCampaignMember(id, member.userId);
                if (!removed) {
                    this.sectionFeedback.set('Could not remove that member.');
                }
            }
        } else if (this.confirmAction() === 'remove-character') {
            const character = this.pendingCharacterRemoval();
            if (character?.id) {
                const removed = await this.store.removeCharacterFromCampaign(character.id, id);
                if (!removed) {
                    this.sectionFeedback.set('Could not remove that character from the party.');
                } else {
                    this.sectionFeedback.set(`${character.name} was removed from the campaign party.`);
                }
            }
        }

        this.confirmAction.set(null);
        this.pendingMemberRemoval.set(null);
        this.pendingCharacterRemoval.set(null);
        this.cdr.detectChanges();
    }

    handleConfirmCancelled(): void {
        this.confirmAction.set(null);
        this.pendingMemberRemoval.set(null);
        this.pendingCharacterRemoval.set(null);
        this.cdr.detectChanges();
    }

    openAddThreadModal(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.threadModalMode.set('add');
        this.modalThreadId.set(null);
        this.newThreadText.set('');
        this.newThreadVisibility.set('Party');
        this.addThreadModalOpen.set(true);
    }

    openEditThreadModal(threadId: string, text: string, visibility: 'Party' | 'GMOnly'): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.threadModalMode.set('edit');
        this.modalThreadId.set(threadId);
        this.newThreadText.set(text);
        this.newThreadVisibility.set(visibility);
        this.addThreadModalOpen.set(true);
    }

    closeAddThreadModal(): void {
        this.modalThreadId.set(null);
        this.addThreadModalOpen.set(false);
    }

    updateNewThreadText(value: string): void {
        this.newThreadText.set(value);
    }

    updateThreadVisibility(value: string | number): void {
        this.newThreadVisibility.set(value === 'GMOnly' ? 'GMOnly' : 'Party');
    }

    updateSessionTitle(value: string): void {
        this.sessionTitle.set(value);
    }

    updateSessionDate(value: string): void {
        this.sessionDate.set(value);
    }

    updateSessionLocation(value: string): void {
        this.sessionLocation.set(value);
    }

    updateSessionObjective(value: string): void {
        this.sessionObjective.set(value);
    }

    updateSessionThreat(value: string | number): void {
        this.sessionThreat.set(value === 'Low' || value === 'High' || value === 'Deadly' ? value : 'Moderate');
    }

    openAddSessionModal(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.sessionModalMode.set('add');
        this.sessionModalId.set(null);
        this.sessionTitle.set('');
        this.sessionDate.set('');
        this.sessionLocation.set('');
        this.sessionObjective.set('');
        this.sessionThreat.set('Moderate');
        this.sessionModalOpen.set(true);
    }

    openEditSessionModal(sessionId: string, title: string, date: string, location: string, objective: string, threat: ThreatLevel): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.sessionModalMode.set('edit');
        this.sessionModalId.set(sessionId);
        this.sessionTitle.set(title);
        this.sessionDate.set(date);
        this.sessionLocation.set(location);
        this.sessionObjective.set(objective);
        this.sessionThreat.set(threat);
        this.sessionModalOpen.set(true);
    }

    closeSessionModal(): void {
        this.sessionModalOpen.set(false);
        this.sessionModalId.set(null);
    }

    async submitSession(): Promise<void> {
        const campaign = this.selectedCampaign();
        const title = this.sessionTitle().trim();

        if (!campaign || campaign.currentUserRole !== 'Owner' || !title) {
            return;
        }

        const draft = {
            title,
            date: this.sessionDate().trim(),
            location: this.sessionLocation().trim(),
            objective: this.sessionObjective().trim(),
            threat: this.sessionThreat()
        };

        let succeeded = false;
        if (this.sessionModalMode() === 'edit') {
            const sessionId = this.sessionModalId();
            if (!sessionId) {
                return;
            }

            succeeded = await this.store.updateCampaignSession(campaign.id, sessionId, draft);
        } else {
            succeeded = await this.store.addCampaignSession(campaign.id, draft);
        }

        if (succeeded) {
            this.closeSessionModal();
        } else {
            this.sectionFeedback.set('Could not save session changes.');
        }

        this.cdr.detectChanges();
    }

    async deleteSession(sessionId: string): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        const succeeded = await this.store.deleteCampaignSession(campaign.id, sessionId);
        if (!succeeded) {
            this.sectionFeedback.set('Could not remove that session.');
        }

        this.cdr.detectChanges();
    }

    updateLootDraft(value: string): void {
        this.lootDraft.set(value);
    }

    selectLootCategory(category: string): void {
        this.selectedLootCategory.set(this.lootCategories().includes(category) ? category : 'All');
        this.selectedLootRarity.set('All');
    }

    selectLootRarity(rarity: string): void {
        this.selectedLootRarity.set(this.lootRarities().includes(rarity) ? rarity : 'All');
    }

    async addLoot(): Promise<void> {
        const name = this.lootDraft().trim();
        if (!name) {
            return;
        }

        await this.addLootByName(name);
    }

    async addCatalogLoot(name: string): Promise<void> {
        await this.addLootByName(name);
    }

    openLootSummaryDetails(item: CampaignLootSummary): void {
        if (!item.sourceUrl && !item.summary && !item.detailLines?.length && item.weight == null && item.costGp == null && !item.rarity && !item.attunement) {
            return;
        }

        this.activeLootItemDetailModal.set({
            name: item.name,
            category: item.category,
            quantity: item.count,
            sourceUrl: item.sourceUrl,
            weight: item.weight,
            costGp: item.costGp,
            sourceLabel: item.sourceLabel,
            summary: item.summary,
            notes: item.notes,
            detailLines: item.detailLines,
            rarity: item.rarity,
            attunement: item.attunement
        });
    }

    lootNotes(item: CampaignLootSummary): string {
        return item.notes || '—';
    }

    formatWeight(weight: number): string {
        return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1);
    }

    openLootItemModal(item: { name: string; category: string; sourceUrl: string; weight?: number; costGp?: number; sourceLabel?: string; summary?: string; notes?: string; detailLines?: string[]; rarity?: string; attunement?: string }): void {
        this.activeLootItemDetailModal.set({
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
        });
    }

    async addActiveLootFromModal(quantity: number): Promise<void> {
        const activeItem = this.activeLootItemDetailModal();
        if (!activeItem) {
            return;
        }

        const safeQuantity = Math.max(1, Math.floor(quantity));

        for (let count = 0; count < safeQuantity; count++) {
            await this.addLootByName(activeItem.name, false);
        }

        this.closeLootItemModal();
        this.cdr.detectChanges();
    }

    closeLootItemModal(): void {
        this.activeLootItemDetailModal.set(null);
    }

    async removeLoot(name: string): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        const succeeded = await this.store.removeCampaignLoot(campaign.id, name);
        if (!succeeded) {
            this.sectionFeedback.set('Could not remove that loot item.');
        }

        this.cdr.detectChanges();
    }

    private async addLootByName(name: string, closeModalOnFailure = true): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        const succeeded = await this.store.addCampaignLoot(campaign.id, name);
        if (succeeded) {
            this.lootDraft.set('');
        } else {
            this.sectionFeedback.set('Could not add that loot item.');
            if (closeModalOnFailure) {
                this.closeLootItemModal();
            }
        }

        this.cdr.detectChanges();
    }

    updateInviteEmail(value: string): void {
        this.inviteEmail.set(value);
    }

    async inviteMember(): Promise<void> {
        const campaign = this.selectedCampaign();
        const email = this.inviteEmail().trim();
        if (!campaign || campaign.currentUserRole !== 'Owner' || !email) {
            return;
        }

        const succeeded = await this.store.inviteCampaignMember(campaign.id, email);
        if (succeeded) {
            this.inviteEmail.set('');
        } else {
            this.sectionFeedback.set('Could not send that invite.');
        }

        this.cdr.detectChanges();
    }

    openAddWorldNoteForm(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.noteEditorMode.set('add');
        this.noteEditorId.set(null);
        this.noteTitle.set('');
        this.noteCategory.set('Lore');
        this.noteContent.set('');
        this.noteEditorOpen.set(true);
    }

    openEditWorldNoteForm(note: CampaignWorldNote): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.clearSectionFeedback();
        this.noteEditorMode.set('edit');
        this.noteEditorId.set(note.id);
        this.noteTitle.set(note.title);
        this.noteCategory.set(note.category);
        this.noteContent.set(note.content);
        this.noteEditorOpen.set(true);
    }

    closeWorldNoteForm(): void {
        this.noteEditorId.set(null);
        this.noteEditorOpen.set(false);
    }

    updateWorldNoteTitle(value: string): void {
        this.noteTitle.set(value);
    }

    updateWorldNoteCategory(value: string | number): void {
        this.noteCategory.set(this.normalizeWorldNoteCategory(value));
    }

    updateWorldNoteContent(value: string): void {
        this.noteContent.set(value);
    }

    async submitWorldNote(): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        const title = this.noteTitle().trim();
        const content = this.noteContent().trim();

        if (!title || !content) {
            this.sectionFeedback.set('Add both a note title and note details before saving.');
            this.cdr.detectChanges();
            return;
        }

        const payload = {
            title,
            category: this.noteCategory(),
            content
        };

        const noteId = this.noteEditorId();
        const saved = this.noteEditorMode() === 'edit' && noteId
            ? await this.store.updateCampaignWorldNote(campaign.id, noteId, payload)
            : await this.store.addCampaignWorldNote(campaign.id, payload);

        this.sectionFeedback.set(saved
            ? this.noteEditorMode() === 'edit' ? 'World note updated.' : 'World note added.'
            : 'Unable to save the world note right now.');

        if (saved) {
            this.closeWorldNoteForm();
        }

        this.cdr.detectChanges();
    }

    async deleteWorldNote(noteId: string): Promise<void> {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        const removed = await this.store.removeCampaignWorldNote(campaign.id, noteId);
        this.sectionFeedback.set(removed ? 'World note removed.' : 'Unable to remove the world note right now.');

        if (removed && this.noteEditorId() === noteId) {
            this.closeWorldNoteForm();
        }

        this.cdr.detectChanges();
    }

    submitThread(): void {
        const text = this.newThreadText().trim();
        const campaign = this.selectedCampaign();

        if (!campaign || campaign.currentUserRole !== 'Owner' || !text) {
            return;
        }

        this.store.selectCampaign(campaign.id);

        if (this.threadModalMode() === 'edit') {
            const threadId = this.modalThreadId();
            if (!threadId) {
                return;
            }

            this.store.updateThread(threadId, text, this.newThreadVisibility());
        } else {
            this.store.addThread(text, this.newThreadVisibility());
        }

        this.closeAddThreadModal();
    }

    archiveThread(threadId: string): void {
        const campaign = this.selectedCampaign();
        if (!campaign || campaign.currentUserRole !== 'Owner') {
            return;
        }

        this.store.selectCampaign(campaign.id);
        this.store.archiveThread(threadId);
        this.closeAddThreadModal();
    }

    private normalizeWorldNoteCategory(value: string | number): CampaignWorldNoteCategory {
        switch (value) {
            case 'Backstory':
            case 'Organization':
            case 'Ally':
            case 'Enemy':
            case 'Location':
            case 'Lore':
            case 'Custom':
                return value;
            default:
                return 'Lore';
        }
    }
}