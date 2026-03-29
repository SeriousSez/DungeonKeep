import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DungeonApiService } from '../../state/dungeon-api.service';

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

    toggleOpen(): void {
        this.isOpen.update((open) => !open);
        this.error.set('');
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
                history
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
}
