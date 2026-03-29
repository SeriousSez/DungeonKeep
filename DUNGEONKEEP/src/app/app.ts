import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DungeonStoreService } from './state/dungeon-store.service';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { AuthShellComponent } from './components/auth-shell/auth-shell.component';
import { DndChatWidgetComponent } from './components/dnd-chat-widget/dnd-chat-widget.component';
import { SessionService } from './state/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent, AuthShellComponent, DndChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly store = inject(DungeonStoreService);
  readonly session = inject(SessionService);
  readonly mobileNavOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);
  readonly currentUser = computed(() => this.session.currentUser());
  readonly isInitialized = computed(() => this.session.initialized());

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

