import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { extractApiError } from '../../state/extract-api-error';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { ApiNotificationDto, DungeonApiService } from '../../state/dungeon-api.service';
import { UserHubService } from '../../state/user-hub.service';
import { NotificationBadgeService } from '../../state/notification-badge.service';

const NOTIFICATION_ICONS: Record<string, string> = {
    CampaignInvite: 'scroll',
    CharacterApproved: 'user-check',
    SessionScheduled: 'calendar',
    NewMessage: 'message-dots',
    SessionRevealed: 'scroll-quill',
    WorldNoteRevealed: 'book-open',
};

@Component({
    selector: 'app-notifications-page',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './notifications-page.component.html',
    styleUrl: './notifications-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsPageComponent implements OnInit {
    readonly error = signal('');
    private readonly api = inject(DungeonApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly userHub = inject(UserHubService);
    private readonly badge = inject(NotificationBadgeService);

    readonly notifications = signal<ApiNotificationDto[]>([]);
    readonly loading = signal(true);
    readonly pendingIds = signal<Set<string>>(new Set());

    readonly unreadCount = () => this.notifications().filter(n => !n.isRead).length;
    readonly iconFor = (type: string) => NOTIFICATION_ICONS[type] ?? 'bell';
    readonly isPending = (id: string) => this.pendingIds().has(id);

    ngOnInit(): void {
        void this.loadNotifications();

        this.userHub.newNotificationReceived$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => void this.loadNotifications());
    }

    private async loadNotifications(): Promise<void> {
        try {
            const data = await this.api.getNotifications();
            this.notifications.set(data);
            this.error.set('');
        } catch (error) {
            this.error.set(extractApiError(error, 'Could not load notifications.'));
        } finally {
            this.loading.set(false);
            this.cdr.detectChanges();
        }
    }

    async markAllRead(): Promise<void> {
        try {
            await this.api.markAllNotificationsRead();
            this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
            this.badge.clear();
            this.cdr.detectChanges();
        } catch {
            // silent
        }
    }

    async markRead(id: string): Promise<void> {
        const notif = this.notifications().find(n => n.id === id);
        if (!notif || notif.isRead) return;
        try {
            await this.api.markNotificationRead(id);
            this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
            this.badge.decrement();
            this.cdr.detectChanges();
        } catch {
            // silent
        }
    }

    async dismiss(id: string): Promise<void> {
        const notif = this.notifications().find(n => n.id === id);
        this.pendingIds.update(s => new Set(s).add(id));
        this.cdr.detectChanges();
        try {
            await this.api.dismissNotification(id);
            this.notifications.update(list => list.filter(n => n.id !== id));
            if (notif && !notif.isRead) this.badge.decrement();
            this.cdr.detectChanges();
        } catch {
            // silent
        } finally {
            this.pendingIds.update(s => { const next = new Set(s); next.delete(id); return next; });
            this.cdr.detectChanges();
        }
    }

    async acceptInvite(notif: ApiNotificationDto): Promise<void> {
        const campaignId = notif.metadata?.['campaignId'];
        if (!campaignId) return;
        this.pendingIds.update(s => new Set(s).add(notif.id + '_accept'));
        this.cdr.detectChanges();
        try {
            await this.api.acceptCampaignInvite(campaignId);
            await this.api.dismissNotification(notif.id);
            this.notifications.update(list => list.filter(n => n.id !== notif.id));
            if (!notif.isRead) this.badge.decrement();
            this.cdr.detectChanges();
        } catch {
            // silent
        } finally {
            this.pendingIds.update(s => { const next = new Set(s); next.delete(notif.id + '_accept'); return next; });
            this.cdr.detectChanges();
        }
    }

    async declineInvite(notif: ApiNotificationDto): Promise<void> {
        const campaignId = notif.metadata?.['campaignId'];
        if (!campaignId) return;
        this.pendingIds.update(s => new Set(s).add(notif.id + '_decline'));
        this.cdr.detectChanges();
        try {
            await this.api.declineCampaignInvite(campaignId);
            await this.api.dismissNotification(notif.id);
            this.notifications.update(list => list.filter(n => n.id !== notif.id));
            if (!notif.isRead) this.badge.decrement();
            this.cdr.detectChanges();
        } catch {
            // silent
        } finally {
            this.pendingIds.update(s => { const next = new Set(s); next.delete(notif.id + '_decline'); return next; });
            this.cdr.detectChanges();
        }
    }

    async navigateToNotification(notif: ApiNotificationDto): Promise<void> {
        if (!notif.link) return;
        await this.markRead(notif.id);
        this.router.navigateByUrl(notif.link);
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
}
