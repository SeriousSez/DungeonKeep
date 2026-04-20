import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiMessageContactDto, ApiMessageDto, ApiMessageThreadDto, ApiMessageThreadSummaryDto, DungeonApiService } from '../../state/dungeon-api.service';
import { UserHubService } from '../../state/user-hub.service';

@Component({
    selector: 'app-messages-page',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './messages-page.component.html',
    styleUrl: './messages-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesPageComponent implements OnInit {
    private readonly api = inject(DungeonApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    readonly destroyRef = inject(DestroyRef);
    private readonly userHub = inject(UserHubService);

    readonly threads = signal<ApiMessageThreadSummaryDto[]>([]);
    readonly selectedThread = signal<ApiMessageThreadDto | null>(null);
    readonly contacts = signal<ApiMessageContactDto[]>([]);
    readonly loading = signal(true);
    readonly threadLoading = signal(false);
    readonly composeOpen = signal(false);
    readonly replyBody = signal('');
    readonly composeRecipientId = signal('');
    readonly composeBody = signal('');
    readonly sending = signal(false);

    readonly unreadCount = () => this.threads().filter(t => t.hasUnread).length;

    ngOnInit(): void {
        void this.loadThreads();

        this.userHub.newMessageReceived$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(event => void this.onNewMessageReceived(event.threadId));
    }

    private async onNewMessageReceived(threadId: string): Promise<void> {
        // Refresh thread list to show unread badge.
        try {
            const threads = await this.api.getMessageThreads();
            this.threads.set(threads);
        } catch {
            // silent
        }

        // If the incoming message is for the currently selected thread, reload it live.
        const selected = this.selectedThread();
        if (selected?.id === threadId) {
            try {
                const updated = await this.api.getMessageThread(threadId);
                this.selectedThread.set(updated);
                await this.api.markMessageThreadRead(threadId);
            } catch {
                // silent
            }
        }

        this.cdr.detectChanges();
    }

    private async loadThreads(): Promise<void> {
        try {
            const data = await this.api.getMessageThreads();
            this.threads.set(data);
        } catch {
            // silent
        } finally {
            this.loading.set(false);
            this.cdr.detectChanges();
        }
    }

    async selectThread(id: string): Promise<void> {
        this.threadLoading.set(true);
        this.cdr.detectChanges();
        try {
            const thread = await this.api.getMessageThread(id);
            this.selectedThread.set(thread);
            this.threads.update(list => list.map(t => t.id === id ? { ...t, hasUnread: false } : t));
            await this.api.markMessageThreadRead(id);
        } catch {
            // silent
        } finally {
            this.threadLoading.set(false);
            this.cdr.detectChanges();
        }
    }

    clearSelection(): void {
        this.selectedThread.set(null);
        this.replyBody.set('');
    }

    async sendReply(): Promise<void> {
        const body = this.replyBody().trim();
        const thread = this.selectedThread();
        if (!body || !thread || this.sending()) return;
        this.sending.set(true);
        try {
            const updated = await this.api.sendMessage(thread.id, body);
            this.selectedThread.set(updated);
            this.replyBody.set('');
            const lastMsg = updated.messages.at(-1);
            this.threads.update(list => list.map(t =>
                t.id === thread.id
                    ? { ...t, lastMessagePreview: lastMsg?.body ?? t.lastMessagePreview, lastMessageAtUtc: lastMsg?.sentAtUtc ?? t.lastMessageAtUtc, hasUnread: false }
                    : t
            ));
        } catch {
            // silent
        } finally {
            this.sending.set(false);
            this.cdr.detectChanges();
        }
    }

    async openCompose(): Promise<void> {
        this.composeOpen.set(true);
        if (this.contacts().length === 0) {
            try {
                const contacts = await this.api.getMessageContacts();
                this.contacts.set(contacts);
            } catch {
                // silent
            } finally {
                this.cdr.detectChanges();
            }
        }
    }

    closeCompose(): void {
        this.composeOpen.set(false);
        this.composeRecipientId.set('');
        this.composeBody.set('');
    }

    async sendCompose(): Promise<void> {
        const recipientId = this.composeRecipientId();
        const body = this.composeBody().trim();
        if (!recipientId || !body || this.sending()) return;
        this.sending.set(true);
        try {
            const thread = await this.api.composeMessage(recipientId, body);
            this.selectedThread.set(thread);
            const threads = await this.api.getMessageThreads();
            this.threads.set(threads);
            this.closeCompose();
        } catch {
            // silent
        } finally {
            this.sending.set(false);
            this.cdr.detectChanges();
        }
    }

    onReplyKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void this.sendReply();
        }
    }

    onComposeKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void this.sendCompose();
        }
    }

    formatDate(isoString: string): string {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    isMine(msg: ApiMessageDto): boolean {
        const thread = this.selectedThread();
        return thread ? msg.senderUserId !== thread.otherUserId : false;
    }
}
