import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { ApiNotificationDto, DungeonApiService } from '../../state/dungeon-api.service';
import { UserHubService } from '../../state/user-hub.service';

const NOTIFICATION_ICONS: Record<string, string> = {
    CampaignInvite: 'scroll',
    CharacterApproved: 'user-check',
    SessionScheduled: 'calendar',
    NewMessage: 'message-dots',
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
    private readonly api = inject(DungeonApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    readonly destroyRef = inject(DestroyRef);
    private readonly userHub = inject(UserHubService);

    readonly notifications = signal<ApiNotificationDto[]>([]);
    readonly loading = signal(true);

    readonly unreadCount = () => this.notifications().filter(n => !n.isRead).length;
    readonly iconFor = (type: string) => NOTIFICATION_ICONS[type] ?? 'bell';

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
        } catch {
            // silent — empty state shown
        } finally {
            this.loading.set(false);
            this.cdr.detectChanges();
        }
    }

    async markAllRead(): Promise<void> {
        try {
            await this.api.markAllNotificationsRead();
            this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
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
            this.cdr.detectChanges();
        } catch {
            // silent
        }
    }

    async dismiss(id: string): Promise<void> {
        try {
            await this.api.dismissNotification(id);
            this.notifications.update(list => list.filter(n => n.id !== id));
            this.cdr.detectChanges();
        } catch {
            // silent
        }
    }

    async acceptInvite(notif: ApiNotificationDto): Promise<void> {
        const campaignId = notif.metadata?.['campaignId'];
        if (!campaignId) return;
        try {
            await this.api.acceptCampaignInvite(campaignId);
            await this.api.dismissNotification(notif.id);
            this.notifications.update(list => list.filter(n => n.id !== notif.id));
            this.cdr.detectChanges();
        } catch {
            // silent
        }
    }

    async declineInvite(notif: ApiNotificationDto): Promise<void> {
        const campaignId = notif.metadata?.['campaignId'];
        if (!campaignId) return;
        try {
            await this.api.declineCampaignInvite(campaignId);
            await this.api.dismissNotification(notif.id);
            this.notifications.update(list => list.filter(n => n.id !== notif.id));
            this.cdr.detectChanges();
        } catch {
            // silent
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
}
