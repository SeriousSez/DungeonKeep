import { CommonModule, DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectorRef, Component, DestroyRef, computed, effect, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DungeonStoreService } from './state/dungeon-store.service';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { DndChatWidgetComponent } from './components/dnd-chat-widget/dnd-chat-widget.component';
import { CampaignRealtimeService } from './state/campaign-realtime.service';
import { ApiNotificationDto, DungeonApiService } from './state/dungeon-api.service';
import { SessionService } from './state/session.service';
import { ThemeService } from './state/theme.service';
import { CompactModeService } from './state/compact-mode.service';
import { NotificationBadgeService } from './state/notification-badge.service';
import { UserHubService } from './state/user-hub.service';
import { rulesBrowseLinks, rulesResourceLinks } from './data/rules-links';

const LIVE_NOTIFICATION_ICONS: Record<string, string> = {
  CampaignInvite: 'scroll',
  CharacterApproved: 'user-check',
  SessionScheduled: 'calendar',
  NewMessage: 'message-dots',
  SessionRevealed: 'scroll-quill',
  WorldNoteRevealed: 'book-open'
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent, DndChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly store = inject(DungeonStoreService);
  readonly session = inject(SessionService);
  private readonly campaignRealtime = inject(CampaignRealtimeService);
  private readonly api = inject(DungeonApiService);
  private readonly userHub = inject(UserHubService);
  private readonly theme = inject(ThemeService);
  private readonly compactMode = inject(CompactModeService);
  readonly notificationBadge = inject(NotificationBadgeService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly mobileNavOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);
  readonly userMenuOpen = signal(false);
  readonly liveNotification = signal<ApiNotificationDto | null>(null);
  readonly isLiveNotificationVisible = signal(false);
  readonly currentUser = computed(() => this.session.currentUser());
  readonly isInitialized = computed(() => this.session.initialized());
  readonly rulesBrowseLinks = rulesBrowseLinks;
  readonly rulesResourceLinks = rulesResourceLinks;
  readonly iconForLiveNotification = (type: string) => LIVE_NOTIFICATION_ICONS[type] ?? 'bell';
  private previousUserId: string | null = null;
  private readonly seenNotificationIds = new Set<string>();
  private toastDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.isInitialized()) {
        return;
      }

      const user = this.currentUser();
      const currentUrl = this.getCurrentUrl();
      const isAuthRoute = currentUrl === '/auth' || currentUrl.startsWith('/auth?') || currentUrl.startsWith('/auth#');
      const isPublicHomeRoute = currentUrl === '/' || currentUrl === '';

      if (!user && !isAuthRoute && !isPublicHomeRoute) {
        void this.router.navigateByUrl('/');
        return;
      }

      if (user && (isAuthRoute || isPublicHomeRoute)) {
        void this.router.navigateByUrl('/dashboard');
      }
    });

    effect(() => {
      if (!this.isInitialized()) {
        return;
      }

      const userId = this.currentUser()?.id ?? '';
      if (this.previousUserId !== null && this.previousUserId !== userId) {
        this.cleanupDetachedModalHosts();
      }

      this.previousUserId = userId;
    });

    effect(() => {
      const userId = this.currentUser()?.id ?? '';
      void this.hydrateSeenNotifications(userId);
    });

    this.userHub.newNotificationReceived$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.showIncomingNotificationToast());
  }

  private async hydrateSeenNotifications(userId: string): Promise<void> {
    this.clearToastTimer();
    this.liveNotification.set(null);
    this.isLiveNotificationVisible.set(false);
    this.seenNotificationIds.clear();

    if (!userId) {
      this.cdr.detectChanges();
      return;
    }

    try {
      const notifications = await this.api.getNotifications();
      for (const notification of notifications) {
        if (!notification.isRead) {
          this.seenNotificationIds.add(notification.id);
        }
      }
    } catch {
      // Ignore hydration failures and continue with live events.
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async showIncomingNotificationToast(): Promise<void> {
    if (!this.currentUser()) {
      return;
    }

    try {
      const notifications = await this.api.getNotifications();
      const incoming = notifications.find(notification => !notification.isRead && !this.seenNotificationIds.has(notification.id));
      if (!incoming) {
        return;
      }

      this.seenNotificationIds.add(incoming.id);
      this.liveNotification.set(incoming);
      this.isLiveNotificationVisible.set(true);
      this.playNotificationSound();
      this.startToastDismissTimer();
    } catch {
      // Ignore toast fetch failures.
    } finally {
      this.cdr.detectChanges();
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.6;
      void audio.play();
    } catch {
      // Ignore audio failures (e.g. browser autoplay policy).
    }
  }

  private startToastDismissTimer(): void {
    this.clearToastTimer();
    this.toastDismissTimer = setTimeout(() => {
      this.liveNotification.set(null);
      this.isLiveNotificationVisible.set(false);
      this.cdr.detectChanges();
    }, 8000);
  }

  private clearToastTimer(): void {
    if (!this.toastDismissTimer) {
      return;
    }

    clearTimeout(this.toastDismissTimer);
    this.toastDismissTimer = null;
  }

  closeLiveNotificationToast(): void {
    this.clearToastTimer();
    this.liveNotification.set(null);
    this.isLiveNotificationVisible.set(false);
  }

  async openLiveNotification(): Promise<void> {
    const notification = this.liveNotification();
    if (!notification) {
      return;
    }

    this.closeLiveNotificationToast();

    if (!notification.isRead) {
      try {
        await this.api.markNotificationRead(notification.id);
        this.notificationBadge.decrement();
      } catch {
        // Ignore mark-read failures and still navigate.
      }
    }

    if (notification.link) {
      await this.router.navigateByUrl(notification.link);
      return;
    }

    await this.router.navigateByUrl('/notifications');
  }

  private getCurrentUrl(): string {
    const routerUrl = this.router.url;
    if (routerUrl && routerUrl !== '/') {
      return routerUrl;
    }

    if (typeof window === 'undefined') {
      return routerUrl;
    }

    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!target.closest('.nav-group')) {
      this.openDropdown.set(null);
    }

    if (!target.closest('.user-menu-wrap')) {
      this.userMenuOpen.set(false);
    }

    if (this.mobileNavOpen() && !target.closest('.topbar')) {
      this.closeMobileNav();
    }
  }

  @HostListener('document:dungeonkeep-close-popups')
  onClosePopups(): void {
    this.closeDropdown();
    this.closeMobileNav();
    this.userMenuOpen.set(false);
  }

  toggleDropdown(name: string): void {
    this.openDropdown.update(current => {
      const next = current === name ? null : name;
      if (next) {
        this.document.dispatchEvent(new CustomEvent('dungeonkeep-close-chat', { bubbles: true }));
      }

      return next;
    });
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
    if (this.mobileNavOpen()) {
      this.openDropdown.set(null);
    }
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(open => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeLiveNotificationToast();
    this.cleanupDetachedModalHosts();
    this.session.logout();
    this.closeMobileNav();
    this.closeDropdown();
    this.userMenuOpen.set(false);
  }

  private cleanupDetachedModalHosts(): void {
    const modalHosts = this.document.body.querySelectorAll([
      'app-confirm-modal',
      'app-character-portrait-modal',
      'app-character-portrait-crop-modal'
    ].join(', '));

    for (const host of modalHosts) {
      host.remove();
    }
  }
}

