import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DungeonStoreService } from './state/dungeon-store.service';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { DndChatWidgetComponent } from './components/dnd-chat-widget/dnd-chat-widget.component';
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
  private readonly router = inject(Router);
  readonly mobileNavOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);
  readonly currentUser = computed(() => this.session.currentUser());
  readonly isInitialized = computed(() => this.session.initialized());
  readonly rulesBrowseLinks = rulesBrowseLinks;
  readonly rulesResourceLinks = rulesResourceLinks;

  constructor() {
    effect(() => {
      if (!this.isInitialized()) {
        return;
      }

      const user = this.currentUser();
      const currentUrl = this.router.url;

      if (!user && currentUrl !== '/auth') {
        void this.router.navigateByUrl('/auth');
        return;
      }

      if (user && currentUrl.startsWith('/auth')) {
        void this.router.navigateByUrl('/dashboard');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.nav-group')) {
      this.openDropdown.set(null);
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
    this.session.logout();
    this.closeMobileNav();
    this.closeDropdown();
  }
}

