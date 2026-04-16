import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, Renderer2, inject, input, output } from '@angular/core';

@Component({
    selector: 'app-character-portrait-modal',
    imports: [CommonModule],
    templateUrl: './character-portrait-modal.component.html',
    styleUrl: './character-portrait-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterPortraitModalComponent {
    private readonly document = inject(DOCUMENT);
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly renderer = inject(Renderer2);

    readonly open = input(false);
    readonly characterName = input('Character');
    readonly imageUrl = input('');
    readonly portraitInitials = input('');
    readonly promptDetails = input('');
    readonly isSaving = input(false);
    readonly isGenerating = input(false);
    readonly errorMessage = input('');
    readonly saveMessage = input('');
    readonly canRemove = input(false);

    readonly closed = output<void>();
    readonly promptDetailsChanged = output<string>();
    readonly fileSelected = output<Event>();
    readonly generateRequested = output<void>();
    readonly recropRequested = output<void>();
    readonly removeRequested = output<void>();

    ngAfterViewInit(): void {
        this.renderer.appendChild(this.document.body, this.elementRef.nativeElement);
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

    updatePromptDetails(value: string): void {
        this.promptDetailsChanged.emit(value);
    }

    requestUpload(fileInput: HTMLInputElement): void {
        fileInput.click();
    }

    handleFileChange(event: Event): void {
        this.fileSelected.emit(event);
    }

    requestGeneration(): void {
        this.generateRequested.emit();
    }

    requestRecrop(): void {
        this.recropRequested.emit();
    }

    requestRemoval(): void {
        this.removeRequested.emit();
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
}