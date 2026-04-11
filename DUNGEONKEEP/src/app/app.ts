import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DungeonStoreService } from './state/dungeon-store.service';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { DndChatWidgetComponent } from './components/dnd-chat-widget/dnd-chat-widget.component';
import { CampaignRealtimeService } from './state/campaign-realtime.service';
import { SessionService } from './state/session.service';
import { rulesBrowseLinks, rulesResourceLinks } from './data/rules-links';

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
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  readonly mobileNavOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);
  readonly currentUser = computed(() => this.session.currentUser());
  readonly isInitialized = computed(() => this.session.initialized());
  readonly rulesBrowseLinks = rulesBrowseLinks;
  readonly rulesResourceLinks = rulesResourceLinks;
  private previousUserId: string | null = null;

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

    if (this.mobileNavOpen() && !target.closest('.topbar')) {
      this.closeMobileNav();
    }
  }

  toggleDropdown(name: string): void {
    this.openDropdown.update(current => current === name ? null : name);
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

  logout(): void {
    this.cleanupDetachedModalHosts();
    this.session.logout();
    this.closeMobileNav();
    this.closeDropdown();
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

