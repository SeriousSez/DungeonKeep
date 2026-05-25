import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, HostListener, OnChanges, OnDestroy, Renderer2, SimpleChanges, inject, input } from '@angular/core';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

@Directive({
    selector: '[appTooltip]',
    standalone: true
})
export class TooltipDirective implements OnChanges, OnDestroy {
    readonly appTooltip = input<string>('');
    readonly appTooltipPlacement = input<TooltipPlacement>('top');

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly renderer = inject(Renderer2);
    private readonly document = inject(DOCUMENT);

    private tooltipEl: HTMLDivElement | null = null;
    private unlistenScroll: (() => void) | null = null;
    private unlistenResize: (() => void) | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.tooltipEl) {
            return;
        }

        if (changes['appTooltip']) {
            this.tooltipEl.textContent = this.tooltipText();
        }

        if (changes['appTooltip'] || changes['appTooltipPlacement']) {
            this.positionTooltip();
        }
    }

    @HostListener('mouseenter')
    @HostListener('focusin')
    showTooltip(): void {
        const text = this.tooltipText();
        if (!text || !this.document?.body) {
            return;
        }

        if (!this.tooltipEl) {
            const tooltip = this.renderer.createElement('div') as HTMLDivElement;
            this.renderer.addClass(tooltip, 'app-custom-tooltip');
            this.renderer.setAttribute(tooltip, 'role', 'tooltip');
            this.renderer.appendChild(this.document.body, tooltip);
            this.tooltipEl = tooltip;
            this.bindViewportListeners();
        }

        this.tooltipEl.textContent = text;
        this.renderer.setStyle(this.tooltipEl, 'opacity', '0');
        this.renderer.setStyle(this.tooltipEl, 'visibility', 'hidden');
        this.positionTooltip();
        this.renderer.setStyle(this.tooltipEl, 'visibility', 'visible');
        this.renderer.setStyle(this.tooltipEl, 'opacity', '1');
    }

    @HostListener('mouseleave')
    @HostListener('blur')
    @HostListener('keydown.escape')
    hideTooltip(): void {
        this.destroyTooltip();
    }

    ngOnDestroy(): void {
        this.destroyTooltip();
    }

    private tooltipText(): string {
        return this.appTooltip()?.trim() ?? '';
    }

    private bindViewportListeners(): void {
        if (!this.unlistenScroll) {
            this.unlistenScroll = this.renderer.listen('window', 'scroll', () => this.positionTooltip());
        }

        if (!this.unlistenResize) {
            this.unlistenResize = this.renderer.listen('window', 'resize', () => this.positionTooltip());
        }
    }

    private positionTooltip(): void {
        if (!this.tooltipEl) {
            return;
        }

        const hostRect = this.host.nativeElement.getBoundingClientRect();
        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const margin = 10;
        const viewportPadding = 8;
        const placement = this.appTooltipPlacement();
        let left = hostRect.left;
        let top = hostRect.top;

        if (placement === 'bottom') {
            left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);
            top = hostRect.bottom + margin;
        } else if (placement === 'left') {
            left = hostRect.left - tooltipRect.width - margin;
            top = hostRect.top + (hostRect.height / 2) - (tooltipRect.height / 2);
        } else if (placement === 'right') {
            left = hostRect.right + margin;
            top = hostRect.top + (hostRect.height / 2) - (tooltipRect.height / 2);
        } else {
            left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);
            top = hostRect.top - tooltipRect.height - margin;
        }

        const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding;
        const maxTop = window.innerHeight - tooltipRect.height - viewportPadding;
        left = Math.max(viewportPadding, Math.min(left, Math.max(viewportPadding, maxLeft)));
        top = Math.max(viewportPadding, Math.min(top, Math.max(viewportPadding, maxTop)));

        this.renderer.setAttribute(this.tooltipEl, 'data-placement', placement);
        this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
        this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    }

    private destroyTooltip(): void {
        if (this.tooltipEl) {
            this.renderer.removeChild(this.document.body, this.tooltipEl);
            this.tooltipEl = null;
        }

        if (this.unlistenScroll) {
            this.unlistenScroll();
            this.unlistenScroll = null;
        }

        if (this.unlistenResize) {
            this.unlistenResize();
            this.unlistenResize = null;
        }
    }
}