import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, Renderer2, computed, effect, inject, input, output, signal } from '@angular/core';

@Component({
    selector: 'app-character-portrait-crop-modal',
    imports: [CommonModule],
    templateUrl: './character-portrait-crop-modal.component.html',
    styleUrl: './character-portrait-crop-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterPortraitCropModalComponent implements AfterViewInit, OnDestroy {
    private static readonly DEFAULT_VIEWPORT_SIZE = 360;
    private static readonly OUTPUT_SIZE = 768;
    private static readonly MIN_ZOOM = 0.4;
    private static readonly MAX_ZOOM = 4;
    private static readonly FRAME_INSET_RATIO = 0.12;

    private readonly document = inject(DOCUMENT);
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly renderer = inject(Renderer2);

    readonly open = input(false);
    readonly imageUrl = input('');
    readonly characterName = input('Character');

    readonly closed = output<void>();
    readonly applied = output<string>();

    readonly zoom = signal(1);
    readonly offsetX = signal(0);
    readonly offsetY = signal(0);
    readonly naturalWidth = signal(0);
    readonly naturalHeight = signal(0);
    readonly viewportSize = signal(CharacterPortraitCropModalComponent.DEFAULT_VIEWPORT_SIZE);
    readonly imageReady = computed(() => this.naturalWidth() > 0 && this.naturalHeight() > 0 && this.imageUrl().trim().length > 0);
    readonly frameSize = computed(() => this.viewportSize() * (1 - (CharacterPortraitCropModalComponent.FRAME_INSET_RATIO * 2)));
    readonly displayScale = computed(() => {
        const width = this.naturalWidth();
        const height = this.naturalHeight();
        if (!width || !height) {
            return 1;
        }

        const viewportSize = this.viewportSize();
        const baseScale = Math.max(
            viewportSize / width,
            viewportSize / height
        );

        return baseScale * this.zoom();
    });
    readonly previewTransform = computed(() => `translate(-50%, -50%) translate(${this.offsetX()}px, ${this.offsetY()}px) scale(${this.displayScale()})`);

    private loadedImage: HTMLImageElement | null = null;
    private draggingPointerId: number | null = null;
    private lastPointerX = 0;
    private lastPointerY = 0;

    constructor() {
        effect(() => {
            const isOpen = this.open();
            const imageUrl = this.imageUrl().trim();
            if (!isOpen || !imageUrl) {
                this.draggingPointerId = null;
                this.loadedImage = null;
                this.naturalWidth.set(0);
                this.naturalHeight.set(0);
                return;
            }

            this.zoom.set(1);
            this.offsetX.set(0);
            this.offsetY.set(0);
            this.loadImage(imageUrl);
        });
    }

    ngAfterViewInit(): void {
        this.renderer.appendChild(this.document.body, this.elementRef.nativeElement);
        this.measureViewport();
    }

    ngOnDestroy(): void {
        const element = this.elementRef.nativeElement;
        if (element.parentNode) {
            this.renderer.removeChild(element.parentNode, element);
        }
    }

    close(): void {
        this.closed.emit();
    }

    updateZoom(value: string | number): void {
        const numericValue = typeof value === 'number' ? value : Number(value);
        const nextZoom = Number.isFinite(numericValue)
            ? Math.max(CharacterPortraitCropModalComponent.MIN_ZOOM, Math.min(CharacterPortraitCropModalComponent.MAX_ZOOM, numericValue))
            : 1;
        this.zoom.set(nextZoom);
        this.clampOffsets();
    }

    handleViewportPointerDown(event: PointerEvent): void {
        if (!this.imageReady() || event.button !== 0) {
            return;
        }

        this.draggingPointerId = event.pointerId;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    handleViewportPointerMove(event: PointerEvent): void {
        if (!this.imageReady() || this.draggingPointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - this.lastPointerX;
        const deltaY = event.clientY - this.lastPointerY;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;

        this.offsetX.update((value) => value + deltaX);
        this.offsetY.update((value) => value + deltaY);
        this.clampOffsets();
        event.preventDefault();
    }

    handleViewportPointerUp(event: PointerEvent): void {
        if (this.draggingPointerId !== event.pointerId) {
            return;
        }

        this.draggingPointerId = null;
        (event.currentTarget as HTMLElement | null)?.releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    applyCrop(): void {
        if (!this.loadedImage || !this.imageReady()) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = CharacterPortraitCropModalComponent.OUTPUT_SIZE;
        canvas.height = CharacterPortraitCropModalComponent.OUTPUT_SIZE;

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const exportScale = canvas.width / this.frameSize();
        const displayedWidth = this.naturalWidth() * this.displayScale() * exportScale;
        const displayedHeight = this.naturalHeight() * this.displayScale() * exportScale;
        const drawX = ((canvas.width - displayedWidth) / 2) + (this.offsetX() * exportScale);
        const drawY = ((canvas.height - displayedHeight) / 2) + (this.offsetY() * exportScale);

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
        context.closePath();
        context.clip();
        context.fillStyle = this.getCanvasBackgroundColor();
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(this.loadedImage, drawX, drawY, displayedWidth, displayedHeight);
        context.restore();

        this.applied.emit(canvas.toDataURL('image/png'));
    }

    @HostListener('window:resize')
    handleWindowResize(): void {
        if (this.open()) {
            this.measureViewport();
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleDocumentKeydown(event: KeyboardEvent): void {
        if (!this.open()) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
        }
    }

    @HostListener('document:dungeonkeep-close-overlays')
    handleCloseOverlayRequest(): void {
        if (this.open()) {
            this.close();
        }
    }

    private loadImage(imageUrl: string): void {
        const image = new Image();
        image.onload = () => {
            this.loadedImage = image;
            this.naturalWidth.set(image.naturalWidth || 1);
            this.naturalHeight.set(image.naturalHeight || 1);
            this.measureViewport();
            this.clampOffsets();
        };
        image.src = imageUrl;
    }

    private measureViewport(): void {
        const viewport = this.elementRef.nativeElement.querySelector('.portrait-crop-viewport') as HTMLElement | null;
        const nextSize = viewport?.getBoundingClientRect().width ?? CharacterPortraitCropModalComponent.DEFAULT_VIEWPORT_SIZE;
        if (nextSize > 0) {
            this.viewportSize.set(nextSize);
        }
    }

    private getCanvasBackgroundColor(): string {
        const rootStyles = this.document.defaultView?.getComputedStyle(this.document.documentElement);
        return rootStyles?.getPropertyValue('--color-surface-alt').trim()
            || rootStyles?.getPropertyValue('--color-surface').trim()
            || '#a79f96';
    }

    private clampOffsets(): void {
        if (!this.imageReady()) {
            this.offsetX.set(0);
            this.offsetY.set(0);
            return;
        }

        const displayedWidth = this.naturalWidth() * this.displayScale();
        const displayedHeight = this.naturalHeight() * this.displayScale();
        const frameSize = this.frameSize();
        const maxOffsetX = Math.max(0, (displayedWidth - frameSize) / 2);
        const maxOffsetY = Math.max(0, (displayedHeight - frameSize) / 2);

        this.offsetX.set(this.clampValue(this.offsetX(), -maxOffsetX, maxOffsetX));
        this.offsetY.set(this.clampValue(this.offsetY(), -maxOffsetY, maxOffsetY));
    }

    private clampValue(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}