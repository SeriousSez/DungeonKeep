import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Router } from '@angular/router';
import { loadCampaignNpcDrafts, loadNpcLibrary } from '../../data/campaign-npc.storage';
import { mergeStoredNpcDrafts, sanitizeNpc } from '../../data/campaign-npc.helpers';
import { readStoredSessionEditorDraft } from '../../data/session-editor.storage';
import { Campaign, Character } from '../../models/dungeon.models';
import { CampaignNpc } from '../../models/campaign-npc.models';
import {
    ApiDndChatCampaignContext,
    ApiDndChatCampaignMapContext,
    ApiDndChatCharacterContext,
    ApiDndChatNpcContext,
    ApiDndChatPageContext,
    ApiDndChatSessionContext,
    DungeonApiService
} from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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
        this.isOpen.update((open) => !open);
        this.error.set('');
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
        const character = this.getCharacterContextFromRoute(route);
        const session = this.getSessionContextFromRoute(route, campaign);
        const npc = this.getNpcContextFromRoute(route, campaign);

        return {
            route,
            pageType: this.getPageType(route),
            character,
            campaign: this.mapCampaignContext(campaign),
            session,
            npc
        };
    }

    private getCharacterContextFromRoute(route: string): ApiDndChatCharacterContext | undefined {
        const detailMatch = route.match(/^\/character\/([^/]+)$/);
        const builderMatch = route.match(/^\/characters\/([^/]+)\/builder(?:\/.*)?$/);
        const characterId = detailMatch?.[1] ?? builderMatch?.[1];
        if (!characterId) {
            return undefined;
        }

        const character = this.store.characters().find((entry) => entry.id === characterId);
        if (!character) {
            return undefined;
        }

        return this.mapCharacterContext(character);
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
            const merged = mergeStoredNpcDrafts(campaign.npcs, stored);
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
