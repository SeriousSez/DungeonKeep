import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2, inject } from '@angular/core';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements AfterViewInit, OnDestroy {
    private readonly document = inject(DOCUMENT);
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly renderer = inject(Renderer2);

    @Input() title: string = 'Are you sure?';
    @Input() message: string = 'This action cannot be undone.';
    @Input() confirmText: string = 'Delete';
    @Input() cancelText: string = 'Cancel';
    @Input() open: boolean = false;

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    ngAfterViewInit(): void {
        this.renderer.appendChild(this.document.body, this.elementRef.nativeElement);
    }

    ngOnDestroy(): void {
        const element = this.elementRef.nativeElement;
        if (element.parentNode) {
            this.renderer.removeChild(element.parentNode, element);
        }
    }

    confirm() {
        this.confirmed.emit();
    }

    cancel() {
        this.cancelled.emit();
    }
}
