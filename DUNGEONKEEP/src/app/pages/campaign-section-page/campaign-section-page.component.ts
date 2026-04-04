import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NpcManagerComponent } from '../../components/npc-manager/npc-manager.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { ItemDetailModalComponent } from '../../components/item-detail-modal/item-detail-modal.component';
import { equipmentCatalog } from '../../data/new-character-standard-page.data';
import type { InventoryEntry } from '../../data/new-character-standard-page.types';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type CampaignSection = 'party' | 'sessions' | 'npcs' | 'loot' | 'threads' | 'members';
type ThreatLevel = 'Low' | 'Moderate' | 'High' | 'Deadly';

const lootRarityOrder = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Unique', '???'] as const;

@Component({
    selector: 'app-campaign-section-page',
    imports: [CommonModule, RouterLink, ConfirmModalComponent, DropdownComponent, NpcManagerComponent, ItemDetailModalComponent],
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
            case 'loot':
            case 'threads':
            case 'members':
                return routeSection;
            default:
                return 'party';
        }
    });

    readonly confirmAction = signal<'delete' | 'leave' | null>(null);
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

    readonly selectedCampaign = computed(() => {
        const id = this.campaignId();
        if (!id) {
            return null;
        }

        return this.store.campaigns().find((campaign) => campaign.id === id) ?? null;
    });

    readonly partyMembers = computed(() => {
        const campaign = this.selectedCampaign();
        if (!campaign) {
            return [];
        }

        const characterMap = new Map(this.store.characters().map((character) => [character.id, character]));

        return campaign.partyCharacterIds
            .map((id) => characterMap.get(id))
            .filter((character) => character !== undefined);
    });

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
        const campaign = this.selectedCampaign();
        const existingLoot = new Set((campaign?.loot ?? []).map((item) => item.trim().toLowerCase()));
        const searchTerm = this.lootDraft().trim().toLowerCase();
        const selectedCategory = this.selectedLootCategory();
        const selectedRarity = this.selectedLootRarity();

        return [...equipmentCatalog]
            .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name))
            .filter((item) => !existingLoot.has(item.name.trim().toLowerCase()))
            .filter((item) => selectedCategory === 'All' || item.category === selectedCategory)
            .filter((item) => selectedCategory !== 'Wondrous Item' || selectedRarity === 'All' || item.rarity === selectedRarity)
            .filter((item) => !searchTerm
                || item.name.toLowerCase().includes(searchTerm)
                || item.category.toLowerCase().includes(searchTerm));
    });

    readonly pageTitle = computed(() => {
        switch (this.section()) {
            case 'party':
                return 'Party Roster';
            case 'sessions':
                return 'Campaign Sessions';
            case 'npcs':
                return 'Campaign NPCs';
            case 'loot':
                return 'Campaign Loot';
            case 'threads':
                return 'Open Threads';
            case 'members':
                return 'Campaign Members';
        }
    });

    readonly pageDescription = computed(() => {
        switch (this.section()) {
            case 'party':
                return 'Track the active adventurers tied to this campaign, their roles, and who is ready for the next session.';
            case 'sessions':
                return 'Review prepared sessions, important locations, and the next objective waiting on the table.';
            case 'npcs':
                return 'Keep the campaign cast visible so important allies, patrons, rivals, and suspects stay easy to reference.';
            case 'loot':
                return 'Track treasure, clues, debts, and notable items the party has collected along the way.';
            case 'threads':
                return 'Surface the unresolved problems, secrets, and hooks the party is still chasing.';
            case 'members':
                return 'See who has access to the campaign and whether each invite is active or still pending.';
        }
    });

    readonly confirmModalOpen = computed(() => this.confirmAction() !== null);
    readonly confirmModalTitle = computed(() => this.confirmAction() === 'leave' ? 'Leave Campaign?' : 'Delete Campaign?');
    readonly confirmModalMessage = computed(() =>
        this.confirmAction() === 'leave'
            ? 'Are you sure you want to leave this campaign? Your characters will be removed from the party and returned to your unassigned roster.'
            : 'Are you sure you want to delete this campaign? This action cannot be undone.');
    readonly confirmModalActionText = computed(() => this.confirmAction() === 'leave' ? 'Leave' : 'Delete');

    isActiveSection(section: CampaignSection): boolean {
        return this.section() === section;
    }

    clearSectionFeedback(): void {
        this.sectionFeedback.set('');
    }

    handleRequestDelete(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Owner') {
            return;
        }

        this.confirmAction.set('delete');
    }

    handleRequestLeave(): void {
        if (this.selectedCampaign()?.currentUserRole !== 'Member') {
            return;
        }

        this.confirmAction.set('leave');
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
        }

        this.confirmAction.set(null);
        this.cdr.detectChanges();
    }

    handleConfirmCancelled(): void {
        this.confirmAction.set(null);
        this.cdr.detectChanges();
    }

    openAddThreadModal(): void {
        this.clearSectionFeedback();
        this.threadModalMode.set('add');
        this.modalThreadId.set(null);
        this.newThreadText.set('');
        this.newThreadVisibility.set('Party');
        this.addThreadModalOpen.set(true);
    }

    openEditThreadModal(threadId: string, text: string, visibility: 'Party' | 'GMOnly'): void {
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
}