import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
    @Input() title: string = 'Are you sure?';
    @Input() message: string = 'This action cannot be undone.';
    @Input() confirmText: string = 'Delete';
    @Input() cancelText: string = 'Cancel';
    @Input() open: boolean = false;

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    confirm() {
        this.confirmed.emit();
    }

    cancel() {
        this.cancelled.emit();
    }
}
