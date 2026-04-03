import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { Router } from '@angular/router';
import { Character } from '../../models/dungeon.models';
import {
    ApiDndChatCampaignContext,
    ApiDndChatCharacterContext,
    ApiDndChatPageContext,
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

        const character = this.getCharacterContextFromRoute(route);
        if (character) {
            return {
                route,
                pageType: 'character',
                character
            };
        }

        const campaign = this.getCampaignContext();
        if (campaign && (route.startsWith('/campaigns') || route.startsWith('/sessions') || route.startsWith('/dashboard'))) {
            return {
                route,
                pageType: route.startsWith('/sessions') ? 'sessions' : route.startsWith('/dashboard') ? 'dashboard' : 'campaign',
                campaign
            };
        }

        if (route.startsWith('/dashboard')) {
            return { route, pageType: 'dashboard' };
        }

        return { route, pageType: 'other' };
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

    private getCampaignContext(): ApiDndChatCampaignContext | undefined {
        const campaign = this.store.selectedCampaign();
        if (!campaign) {
            return undefined;
        }

        return {
            id: campaign.id,
            name: campaign.name,
            setting: campaign.setting,
            tone: campaign.tone,
            summary: campaign.summary,
            hook: campaign.hook,
            nextSession: campaign.nextSession,
            playerCount: this.store.selectedParty().length,
            party: this.store.selectedParty().map((character) => {
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
            openThreads: campaign.openThreads
                .filter((thread) => campaign.currentUserRole === 'Owner' || thread.visibility === 'Party')
                .map((thread) => thread.text),
            npcs: [...campaign.npcs],
            loot: [...campaign.loot]
        };
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
