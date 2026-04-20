import { Injectable, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DungeonApiService } from './dungeon-api.service';
import { SessionService } from './session.service';
import { UserHubService } from './user-hub.service';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
    private readonly api = inject(DungeonApiService);
    private readonly session = inject(SessionService);
    private readonly userHub = inject(UserHubService);
    private readonly destroyRef = inject(DestroyRef);

    readonly unreadCount = signal(0);

    constructor() {
        // Reload count when the logged-in user changes.
        effect(() => {
            const user = this.session.currentUser();
            if (user) {
                void this.refresh();
            } else {
                this.unreadCount.set(0);
            }
        });

        // Increment when a new notification arrives via SignalR.
        this.userHub.newNotificationReceived$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => void this.refresh());
    }

    async refresh(): Promise<void> {
        try {
            const notifications = await this.api.getNotifications();
            this.unreadCount.set(notifications.filter(n => !n.isRead).length);
        } catch {
            // silent — badge just won't update
        }
    }

    decrement(): void {
        this.unreadCount.update(n => Math.max(0, n - 1));
    }

    clear(): void {
        this.unreadCount.set(0);
    }
}
