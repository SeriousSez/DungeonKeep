import { CommonModule } from '@angular/common';
import { Component, HostListener, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Router } from '@angular/router';
import { loadCampaignNpcDrafts, loadNpcLibrary } from '../../data/campaign-npc.storage';
import { mergeCampaignNpcSources, sanitizeNpc } from '../../data/campaign-npc.helpers';
import { readStoredSessionEditorDraft } from '../../data/session-editor.storage';
import { getRulesEntryBySlug, rulesEntries } from '../../data/rules-links';
import { Campaign, Character } from '../../models/dungeon.models';
import { CampaignNpc } from '../../models/campaign-npc.models';
import {
    ApiDndChatCampaignContext,
    ApiDndChatCampaignMapContext,
    ApiDndChatCampaignSummaryContext,
    ApiDndChatCharacterContext,
    ApiDndChatCharacterDetailContext,
    ApiDndChatCharacterSummaryContext,
    ApiDndChatNpcContext,
    ApiDndChatNpcLibrarySummaryContext,
    ApiDndChatPageContext,
    ApiDndChatRulesContext,
    ApiDndChatSessionContext,
    DungeonApiService
} from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatPersistedInventoryEntry {
    name: string;
    category: string;
    quantity: number;
    notes?: string;
    isContainer?: boolean;
    containedItems?: ChatPersistedInventoryEntry[];
    equipped?: boolean;
}

interface ChatPersistedBuilderState {
    inventoryEntries?: ChatPersistedInventoryEntry[];
    classPreparedSpells?: Record<string, string[]>;
    classKnownSpellsByClass?: Record<string, string[]>;
    wizardSpellbookByClass?: Record<string, string[]>;
    usedSpellSlotsByLevel?: Record<string, number>;
    limitedUseCounts?: Record<string, number>;
    usedHitDiceCount?: number;
    tempHitPoints?: number;
    deathSaveFailures?: number;
    deathSaveSuccesses?: number;
    activeConditions?: string[];
    exhaustionLevel?: number;
}

@Component({
    selector: 'app-dnd-chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dnd-chat-widget.component.html',
    styleUrl: './dnd-chat-widget.component.scss'
})
export class DndChatWidgetComponent {
    private readonly api = inject(DungeonApiService);
    private readonly router = inject(Router);
    private readonly store = inject(DungeonStoreService);
    private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

    readonly isOpen = signal(false);
    readonly isLoading = signal(false);
    readonly draft = signal('');
    readonly error = signal('');
    readonly messages = signal<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Ask me anything about D&D 5e rules, classes, spells, or mechanics.'
        }
    ]);

    constructor() {
        effect(() => {
            const isOpen = this.isOpen();
            const messageCount = this.messages().length;
            const isLoading = this.isLoading();

            if (!isOpen) {
                return;
            }

            void messageCount;
            void isLoading;
            this.scheduleScrollToBottom();
        });
    }

    toggleOpen(): void {
        const nextOpen = !this.isOpen();
        if (nextOpen) {
            this.requestClosePopups();
        }

        this.isOpen.set(nextOpen);
        this.error.set('');
    }

    @HostListener('document:dungeonkeep-close-chat')
    onCloseChatRequest(): void {
        this.isOpen.set(false);
        this.error.set('');
    }

    private requestClosePopups(): void {
        if (typeof globalThis.document === 'undefined') {
            return;
        }

        globalThis.document.dispatchEvent(new CustomEvent('dungeonkeep-close-popups', { bubbles: true }));

        const activeElement = globalThis.document.activeElement;
        if (activeElement instanceof HTMLElement) {
            activeElement.blur();
        }
    }

    renderMarkdown(content: string): string {
        return marked.parse(content, {
            async: false,
            breaks: true,
            gfm: true
        }) as string;
    }

    onTextareaEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.shiftKey) {
            return;
        }
        keyboardEvent.preventDefault();
        this.sendMessage();
    }

    async sendMessage(): Promise<void> {
        const prompt = this.draft().trim();
        if (!prompt || this.isLoading()) {
            return;
        }

        const history = this.messages()
            .slice(-12)
            .map((entry) => ({ role: entry.role, content: entry.content }));

        this.messages.update((current) => [...current, { role: 'user', content: prompt }]);
        this.draft.set('');
        this.isLoading.set(true);
        this.error.set('');

        try {
            const payload = await this.api.askDndQuestion({
                message: prompt,
                history,
                pageContext: this.buildPageContext()
            });
            const text = payload.reply?.trim() || 'No response text returned.';
            this.messages.update((current) => [...current, { role: 'assistant', content: text }]);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error while calling OpenAI.';
            this.error.set(message);
        } finally {
            this.isLoading.set(false);
        }
    }

    private buildPageContext(): ApiDndChatPageContext | undefined {
        const route = this.router.url.split('?')[0] || '/';
        const campaign = this.getCampaignFromRoute(route);
        const characterRecord = this.getCharacterFromRoute(route);
        const character = characterRecord ? this.mapCharacterContext(characterRecord) : undefined;
        const session = this.getSessionContextFromRoute(route, campaign);
        const npc = this.getNpcContextFromRoute(route, campaign);

        return {
            route,
            pageType: this.getPageType(route),
            character,
            characterDetail: characterRecord ? this.getCharacterDetailContext(route, characterRecord) : undefined,
            campaign: this.mapCampaignContext(campaign),
            session,
            npc,
            campaignsList: this.getCampaignsListContext(route),
            charactersList: this.getCharactersListContext(route),
            npcLibraryList: this.getNpcLibraryListContext(route),
            rules: this.getRulesContext(route)
        };
    }

    private getCharacterFromRoute(route: string): Character | undefined {
        const detailMatch = route.match(/^\/character\/([^/]+)$/);
        const builderMatch = route.match(/^\/characters\/([^/]+)\/builder(?:\/.*)?$/);
        const characterId = detailMatch?.[1] ?? builderMatch?.[1];
        if (!characterId) {
            return undefined;
        }

        return this.store.characters().find((entry) => entry.id === characterId);
    }

    private getCampaignFromRoute(route: string): Campaign | null {
        const campaignMatch = route.match(/^\/campaigns\/([^/]+)/);
        const campaignId = campaignMatch?.[1];

        if (campaignId) {
            return this.store.campaigns().find((entry) => entry.id === campaignId) ?? null;
        }

        if (route.startsWith('/dashboard')) {
            return this.store.selectedCampaign();
        }

        return null;
    }

    private mapCampaignContext(campaign: Campaign | null): ApiDndChatCampaignContext | undefined {
        if (!campaign) {
            return undefined;
        }

        const party = this.getPartyForCampaign(campaign);

        return {
            id: campaign.id,
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone,
            levelRange: campaign.levelRange,
            summary: campaign.summary,
            hook: campaign.hook,
            nextSession: campaign.nextSession,
            currentUserRole: campaign.currentUserRole,
            playerCount: party.length,
            party: party.map((character) => {
                const narrative = this.extractNarrativeContext(character.notes);
                return {
                    id: character.id,
                    name: character.name,
                    race: character.race,
                    className: character.className,
                    level: character.level,
                    role: character.role,
                    status: character.status,
                    background: character.background,
                    backstory: narrative.backstory,
                    raceTraits: [...character.traits],
                    personalityTraits: narrative.personalityTraits,
                    ideals: narrative.ideals,
                    bonds: narrative.bonds,
                    flaws: narrative.flaws
                };
            }),
            sessions: campaign.sessions.map((session) => ({
                id: session.id,
                title: session.title,
                date: session.date,
                location: session.location,
                objective: session.objective,
                threat: session.threat
            })),
            openThreads: campaign.openThreads
                .filter((thread) => campaign.currentUserRole === 'Owner' || thread.visibility === 'Party')
                .map((thread) => thread.text),
            worldNotes: campaign.worldNotes.map((note) => ({
                id: note.id,
                title: note.title,
                category: note.category,
                content: this.truncateText(note.content, 320)
            })),
            npcs: [...campaign.npcs],
            loot: [...campaign.loot],
            members: (campaign.members ?? []).map((member) => ({
                userId: member.userId,
                email: member.email,
                displayName: member.displayName,
                role: member.role,
                status: member.status
            })),
            maps: campaign.maps.map((map) => this.mapCampaignMapContext(map)),
            activeMapId: campaign.activeMapId
        };
    }

    private getPartyForCampaign(campaign: Campaign): Character[] {
        const characterMap = new Map(this.store.characters().map((character) => [character.id, character]));

        return campaign.partyCharacterIds
            .map((id) => characterMap.get(id))
            .filter((character): character is Character => Boolean(character));
    }

    private mapCampaignMapContext(map: Campaign['maps'][number]): ApiDndChatCampaignMapContext {
        return {
            id: map.id,
            name: map.name,
            background: map.background,
            locationLabels: map.labels.slice(0, 12).map((label) => label.text),
            tokenNames: map.tokens.slice(0, 12).map((token) => token.name),
            iconLabels: map.icons.slice(0, 12).map((icon) => icon.label || icon.type)
        };
    }

    private getSessionContextFromRoute(route: string, campaign: Campaign | null): ApiDndChatSessionContext | undefined {
        if (!campaign) {
            return undefined;
        }

        const sessionMatch = route.match(/^\/campaigns\/[^/]+\/sessions\/(new|[^/]+)(?:\/edit)?$/);
        const sessionKey = sessionMatch?.[1];
        if (!sessionKey) {
            return undefined;
        }

        const summary = sessionKey === 'new'
            ? null
            : campaign.sessions.find((session) => session.id === sessionKey) ?? null;
        const draft = readStoredSessionEditorDraft(campaign.id, sessionKey);

        if (!summary && !draft) {
            return undefined;
        }

        return {
            id: draft?.id || summary?.id || sessionKey,
            title: draft?.title || summary?.title || 'Untitled Session',
            date: draft?.date || summary?.date || '',
            location: draft?.inGameLocation || summary?.location || '',
            objective: draft?.shortDescription || summary?.objective || '',
            threat: draft?.threatLevel || summary?.threat || 'Moderate',
            shortDescription: draft?.shortDescription || summary?.objective || '',
            estimatedLength: draft?.estimatedLength || '',
            notes: this.truncateText(draft?.markdownNotes || summary?.objective || '', 1800),
            scenes: (draft?.scenes ?? []).map((scene) => this.compactParts([scene.title, scene.description, scene.trigger], ' - ', 220)),
            npcs: (draft?.npcs ?? []).map((npcEntry) => this.compactParts([npcEntry.name, npcEntry.role, npcEntry.motivation], ' - ', 180)),
            monsters: (draft?.monsters ?? []).map((monster) => this.compactParts([monster.name, monster.type, monster.challengeRating], ' - ', 180)),
            locations: (draft?.locations ?? []).map((location) => this.compactParts([location.name, location.description], ' - ', 220)),
            loot: (draft?.loot ?? []).map((item) => this.compactParts([item.name, item.type, item.notes], ' - ', 180)),
            skillChecks: (draft?.skillChecks ?? []).map((check) => this.compactParts([`${check.skill} DC ${check.dc}`, check.situation], ' - ', 180)),
            secrets: (draft?.secrets ?? []).map((entry) => this.truncateText(entry.text, 180)),
            branchingPaths: (draft?.branchingPaths ?? []).map((entry) => this.truncateText(entry.text, 180)),
            nextSessionHooks: (draft?.nextSessionHooks ?? []).map((entry) => this.truncateText(entry.text, 180))
        };
    }

    private getNpcContextFromRoute(route: string, campaign: Campaign | null): ApiDndChatNpcContext | undefined {
        const campaignNpcMatch = route.match(/^\/campaigns\/[^/]+\/npcs\/([^/]+)(?:\/edit)?$/);
        if (campaignNpcMatch?.[1] && campaign) {
            const stored = loadCampaignNpcDrafts(campaign.id) ?? [];
            const merged = mergeCampaignNpcSources(campaign.npcs, campaign.campaignNpcs ?? [], stored);
            const npc = merged.find((entry) => entry.id === campaignNpcMatch[1]);
            return npc ? this.mapNpcContext(npc, merged) : undefined;
        }

        const libraryNpcMatch = route.match(/^\/npcs\/([^/]+)(?:\/edit)?$/);
        if (!libraryNpcMatch?.[1]) {
            return undefined;
        }

        const library = (loadNpcLibrary() ?? []).map((entry) => sanitizeNpc(entry));
        const npc = library.find((entry) => entry.id === libraryNpcMatch[1]);
        return npc ? this.mapNpcContext(npc, library) : undefined;
    }

    private mapNpcContext(npc: CampaignNpc, allNpcs: CampaignNpc[]): ApiDndChatNpcContext {
        return {
            id: npc.id,
            name: npc.name,
            title: npc.title,
            race: npc.race,
            classOrRole: npc.classOrRole,
            faction: npc.faction,
            occupation: npc.occupation,
            alignment: npc.alignment,
            currentStatus: npc.currentStatus,
            location: npc.location,
            shortDescription: npc.shortDescription,
            personalityTraits: [...npc.personalityTraits],
            ideals: [...npc.ideals],
            bonds: [...npc.bonds],
            flaws: [...npc.flaws],
            motivations: npc.motivations,
            goals: npc.goals,
            fears: npc.fears,
            secrets: [...npc.secrets],
            mannerisms: [...npc.mannerisms],
            voiceNotes: npc.voiceNotes,
            backstory: npc.backstory,
            notes: this.truncateText(npc.notes, 1200),
            combatNotes: this.truncateText(npc.combatNotes, 500),
            tags: [...npc.tags],
            relationships: npc.relationships.map((relationship) => ({
                target: allNpcs.find((entry) => entry.id === relationship.targetNpcId)?.name ?? relationship.targetNpcId,
                type: relationship.relationshipType,
                description: relationship.description
            })),
            questLinks: [...npc.questLinks],
            sessionAppearances: [...npc.sessionAppearances],
            inventory: [...npc.inventory],
            hostility: npc.hostility,
            isAlive: npc.isAlive,
            isImportant: npc.isImportant
        };
    }

    private getPageType(route: string): string {
        if (/^\/dashboard$/.test(route)) {
            return 'dashboard';
        }
        if (/^\/character\/[^/]+$/.test(route)) {
            return 'character-detail';
        }
        if (/^\/characters\/[^/]+\/builder(?:\/.*)?$/.test(route)) {
            return 'character-builder';
        }
        if (/^\/campaigns\/[^/]+\/sessions\/new$/.test(route) || /^\/campaigns\/[^/]+\/sessions\/[^/]+\/edit$/.test(route)) {
            return 'session-editor';
        }
        if (/^\/campaigns\/[^/]+\/sessions\/[^/]+$/.test(route)) {
            return 'session-detail';
        }
        if (/^\/campaigns\/[^/]+\/npcs\/[^/]+(?:\/edit)?$/.test(route)) {
            return 'npc-detail';
        }
        if (/^\/npcs\/[^/]+(?:\/edit)?$/.test(route)) {
            return 'npc-library-detail';
        }
        if (/^\/campaigns\/[^/]+\/party$/.test(route)) {
            return 'campaign-party';
        }
        if (/^\/campaigns\/[^/]+\/sessions$/.test(route)) {
            return 'campaign-sessions';
        }
        if (/^\/campaigns\/[^/]+\/npcs$/.test(route)) {
            return 'campaign-npcs';
        }
        if (/^\/campaigns\/[^/]+\/loot$/.test(route)) {
            return 'campaign-loot';
        }
        if (/^\/campaigns\/[^/]+\/threads$/.test(route)) {
            return 'campaign-threads';
        }
        if (/^\/campaigns\/[^/]+\/notes$/.test(route)) {
            return 'campaign-notes';
        }
        if (/^\/campaigns\/[^/]+\/maps(?:\/.*)?$/.test(route)) {
            return 'campaign-maps';
        }
        if (/^\/campaigns\/[^/]+\/members$/.test(route)) {
            return 'campaign-members';
        }
        if (/^\/campaigns\/[^/]+\/edit$/.test(route)) {
            return 'campaign-edit';
        }
        if (/^\/campaigns\/[^/]+$/.test(route)) {
            return 'campaign-detail';
        }
        if (/^\/campaigns$/.test(route)) {
            return 'campaigns';
        }
        if (/^\/characters(?:\/new(?:\/.*)?)?$/.test(route)) {
            return 'characters';
        }
        if (/^\/npcs(?:\/new)?$/.test(route)) {
            return 'npc-library';
        }
        if (/^\/rules\/[^/]+$/.test(route)) {
            return 'rules-detail';
        }
        if (/^\/rules$/.test(route) || /^\/rules\/monsters$/.test(route)) {
            return 'rules';
        }

        return 'other';
    }

    private mapCharacterContext(character: Character): ApiDndChatCharacterContext {
        const narrative = this.extractNarrativeContext(character.notes);

        return {
            id: character.id,
            name: character.name,
            playerName: character.playerName,
            race: character.race,
            className: character.className,
            level: character.level,
            role: character.role,
            status: character.status,
            background: character.background,
            armorClass: character.armorClass,
            hitPoints: character.hitPoints,
            maxHitPoints: character.maxHitPoints,
            proficiencyBonus: character.proficiencyBonus,
            backstory: narrative.backstory,
            abilityScores: { ...character.abilityScores },
            raceTraits: [...character.traits],
            personalityTraits: narrative.personalityTraits,
            ideals: narrative.ideals,
            bonds: narrative.bonds,
            flaws: narrative.flaws
        };
    }

    private getCharacterDetailContext(route: string, character: Character): ApiDndChatCharacterDetailContext | undefined {
        if (!/^\/character\/[^/]+$/.test(route) && !/^\/characters\/[^/]+\/builder(?:\/.*)?$/.test(route)) {
            return undefined;
        }

        const state = this.extractBuilderState(character.notes);
        const inventoryEntries = this.flattenInventoryEntries(state?.inventoryEntries ?? []);
        const nonContainerEntries = inventoryEntries.filter((entry) => !entry.isContainer);
        const equippedItems = nonContainerEntries
            .filter((entry) => this.isEquippedInventoryEntry(entry))
            .map((entry) => this.formatInventoryEntryLabel(entry));
        const inventorySummary = nonContainerEntries.length > 0
            ? nonContainerEntries.map((entry) => this.formatInventoryEntryLabel(entry))
            : [...(character.equipment ?? [])];

        return {
            activeConditions: this.limitChatContextList((state?.activeConditions ?? []).map((condition) => this.formatConditionLabel(condition)), 8),
            exhaustionLevel: this.normalizeNonNegativeInteger(state?.exhaustionLevel),
            tempHitPoints: this.normalizeNonNegativeInteger(state?.tempHitPoints),
            deathSaveFailures: this.normalizeNonNegativeInteger(state?.deathSaveFailures ?? character.deathSaveFailures),
            deathSaveSuccesses: this.normalizeNonNegativeInteger(state?.deathSaveSuccesses ?? character.deathSaveSuccesses),
            usedHitDiceCount: this.normalizeNonNegativeInteger(state?.usedHitDiceCount),
            totalHitDice: Math.max(character.level, 0),
            usedSpellSlots: this.limitChatContextList(this.formatSpellSlotUsage(state?.usedSpellSlotsByLevel), 9),
            limitedUseCounts: this.limitChatContextList(this.formatLimitedUseCounts(state?.limitedUseCounts), 10),
            preparedSpells: this.limitChatContextList(this.flattenSpellMap(state?.classPreparedSpells), 16),
            knownSpells: this.limitChatContextList(this.flattenSpellMap(state?.classKnownSpellsByClass), 16),
            spellbookSpells: this.limitChatContextList(this.flattenSpellMap(state?.wizardSpellbookByClass), 16),
            equippedItems: this.limitChatContextList(equippedItems, 12),
            inventorySummary: this.limitChatContextList(inventorySummary, 16)
        };
    }

    private extractNarrativeContext(notes: string): {
        backstory: string;
        personalityTraits: string[];
        ideals: string[];
        bonds: string[];
        flaws: string[];
    } {
        const cleanedNotes = this.stripBuilderState(notes).trim();

        return {
            backstory: this.extractBackstory(cleanedNotes),
            personalityTraits: this.extractDelimitedValues(cleanedNotes, /(^|\n)Emphasize these personality traits:\s*(.+?)(?=\n|$)/i),
            ideals: this.extractDelimitedValues(cleanedNotes, /(^|\n)Include these ideals:\s*(.+?)(?=\n|$)/i),
            bonds: this.extractDelimitedValues(cleanedNotes, /(^|\n)Include these bonds:\s*(.+?)(?=\n|$)/i),
            flaws: this.extractDelimitedValues(cleanedNotes, /(^|\n)Reflect these flaws:\s*(.+?)(?=\n|$)/i)
        };
    }

    private extractBuilderState(notes: string): ChatPersistedBuilderState | null {
        const startTag = '[DK_BUILDER_STATE_START]';
        const endTag = '[DK_BUILDER_STATE_END]';
        const startIndex = notes.indexOf(startTag);
        const endIndex = notes.indexOf(endTag);
        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex + startTag.length) {
            return null;
        }

        const rawState = notes.slice(startIndex + startTag.length, endIndex).trim();
        if (!rawState) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawState);
            return parsed && typeof parsed === 'object' ? parsed as ChatPersistedBuilderState : null;
        } catch {
            return null;
        }
    }

    private stripBuilderState(notes: string): string {
        const startTag = '[DK_BUILDER_STATE_START]';
        const startIndex = notes.indexOf(startTag);
        if (startIndex === -1) {
            return notes;
        }

        return notes.slice(0, startIndex).trim();
    }

    private extractBackstory(notes: string): string {
        const marker = notes.search(/(?:^|\n)\s*(Builder class focus:|Species focus:|Alignment direction:|Lifestyle direction:|Emphasize these personality traits:|Include these ideals:|Include these bonds:|Reflect these flaws:|Physical characteristics:|Faith:)/i);
        if (marker > 0) {
            return notes.slice(0, marker).trim();
        }

        return notes.trim();
    }

    private extractDelimitedValues(notes: string, pattern: RegExp): string[] {
        const match = notes.match(pattern);
        const raw = match?.[2]?.trim();
        if (!raw || /^none provided$/i.test(raw) || /^not recorded$/i.test(raw)) {
            return [];
        }

        return raw
            .split(';')
            .map((value) => value.trim())
            .filter(Boolean);
    }

    private flattenInventoryEntries(entries: ChatPersistedInventoryEntry[]): ChatPersistedInventoryEntry[] {
        const flattened: ChatPersistedInventoryEntry[] = [];

        for (const entry of entries) {
            flattened.push(entry);

            if (Array.isArray(entry.containedItems) && entry.containedItems.length > 0) {
                flattened.push(...this.flattenInventoryEntries(entry.containedItems));
            }
        }

        return flattened;
    }

    private isEquippedInventoryEntry(entry: ChatPersistedInventoryEntry): boolean {
        if (entry.equipped === true) {
            return true;
        }

        const normalizedCategory = entry.category.trim().toLowerCase();
        return entry.equipped !== false && (
            normalizedCategory.includes('weapon')
            || normalizedCategory.includes('firearm')
            || normalizedCategory.includes('armor')
            || normalizedCategory.includes('shield')
        );
    }

    private formatInventoryEntryLabel(entry: ChatPersistedInventoryEntry): string {
        const quantity = Math.max(1, this.normalizeNonNegativeInteger(entry.quantity) || 1);
        return quantity > 1 ? `${entry.name} x${quantity}` : entry.name;
    }

    private formatConditionLabel(value: string): string {
        return value
            .trim()
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    private formatSpellSlotUsage(usage: Record<string, number> | undefined): string[] {
        if (!usage) {
            return [];
        }

        return Object.entries(usage)
            .map(([level, used]) => ({
                level: Number(level),
                used: this.normalizeNonNegativeInteger(used)
            }))
            .filter((entry) => Number.isFinite(entry.level) && entry.used > 0)
            .sort((left, right) => left.level - right.level)
            .map((entry) => `Level ${entry.level}: ${entry.used} used`);
    }

    private formatLimitedUseCounts(usage: Record<string, number> | undefined): string[] {
        if (!usage) {
            return [];
        }

        return Object.entries(usage)
            .map(([key, used]) => ({
                label: key
                    .split('-')
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' '),
                used: this.normalizeNonNegativeInteger(used)
            }))
            .filter((entry) => entry.used > 0)
            .sort((left, right) => left.label.localeCompare(right.label))
            .map((entry) => `${entry.label}: ${entry.used} used`);
    }

    private flattenSpellMap(spellMap: Record<string, string[]> | undefined): string[] {
        if (!spellMap) {
            return [];
        }

        const entries: string[] = [];

        for (const [className, spells] of Object.entries(spellMap)) {
            for (const spell of spells ?? []) {
                const trimmedSpell = spell.trim();
                if (!trimmedSpell) {
                    continue;
                }

                entries.push(`${className}: ${trimmedSpell}`);
            }
        }

        return entries.sort((left, right) => left.localeCompare(right));
    }

    private limitChatContextList(values: string[], maxItems: number): string[] {
        const normalized = values
            .map((value) => this.truncateText(value, 120))
            .filter(Boolean);

        if (normalized.length <= maxItems) {
            return normalized;
        }

        return [
            ...normalized.slice(0, maxItems),
            `+${normalized.length - maxItems} more`
        ];
    }

    private normalizeNonNegativeInteger(value: unknown): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 0;
        }

        return Math.max(0, Math.trunc(parsed));
    }

    private compactParts(values: Array<string | undefined>, separator: string, maxLength: number): string {
        return this.truncateText(values.map((value) => value?.trim()).filter(Boolean).join(separator), maxLength);
    }

    private truncateText(value: string | undefined, maxLength: number): string {
        const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
        if (!normalized || normalized.length <= maxLength) {
            return normalized;
        }

        return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
    }

    private getCampaignsListContext(route: string): ApiDndChatCampaignSummaryContext[] | undefined {
        if (!/^\/campaigns$/.test(route)) {
            return undefined;
        }

        return this.store.campaigns().map((c) => ({
            id: c.id,
            name: c.name,
            setting: c.setting,
            tone: c.tone,
            levelRange: c.levelRange,
            summary: this.truncateText(c.summary, 200),
            sessionCount: c.sessionCount,
            npcCount: c.npcCount,
            openThreadCount: c.openThreadCount,
            currentUserRole: c.currentUserRole ?? ''
        }));
    }

    private getCharactersListContext(route: string): ApiDndChatCharacterSummaryContext[] | undefined {
        if (!/^\/characters$/.test(route)) {
            return undefined;
        }

        return this.store.characters().map((c) => ({
            id: c.id,
            name: c.name,
            race: c.race,
            className: c.className,
            level: c.level,
            status: c.status,
            role: c.role,
            background: c.background
        }));
    }

    private getNpcLibraryListContext(route: string): ApiDndChatNpcLibrarySummaryContext[] | undefined {
        if (!/^\/npcs$/.test(route)) {
            return undefined;
        }

        const library = (loadNpcLibrary() ?? []).map((entry) => sanitizeNpc(entry));

        return library.map((npc) => ({
            id: npc.id,
            name: npc.name,
            race: npc.race,
            classOrRole: npc.classOrRole,
            faction: npc.faction,
            currentStatus: npc.currentStatus,
            isAlive: npc.isAlive,
            isImportant: npc.isImportant,
            tags: [...npc.tags]
        }));
    }

    private getRulesContext(route: string): ApiDndChatRulesContext | undefined {
        const detailMatch = route.match(/^\/rules\/([^/]+)$/);
        if (detailMatch?.[1]) {
            const entry = getRulesEntryBySlug(detailMatch[1]);
            if (!entry) {
                return undefined;
            }

            return {
                slug: entry.slug,
                label: entry.label,
                description: entry.description,
                heroSummary: entry.heroSummary,
                quickFacts: entry.quickFacts.map((qf) => `${qf.label}: ${qf.value}`),
                highlights: entry.highlights.map((h) => `${h.title}: ${h.text}`)
            };
        }

        if (/^\/rules$/.test(route) || /^\/rules\/monsters$/.test(route)) {
            return {
                slug: '',
                label: 'Rules Reference',
                description: 'Available D&D 5e rules topics in DungeonKeep',
                heroSummary: 'Reference index for D&D 5e rules topics.',
                quickFacts: [],
                highlights: [],
                topicList: rulesEntries.map((e) => ({ slug: e.slug, label: e.label, description: e.description }))
            };
        }

        return undefined;
    }

    private scheduleScrollToBottom(): void {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const container = this.messagesContainer()?.nativeElement;
                if (!container) {
                    return;
                }

                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            });
        });
    }
}
