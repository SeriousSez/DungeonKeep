import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, input, output, signal } from '@angular/core';

interface CalendarCell {
    day: number | null;
    iso: string | null;
}

@Component({
    selector: 'app-themed-datepicker',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './themed-datepicker.component.html',
    styleUrl: './themed-datepicker.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemedDatepickerComponent {
    readonly value = input<string>('');
    readonly name = input<string>('');
    readonly valueChange = output<string>();

    private readonly host = inject(ElementRef<HTMLElement>);

    readonly isOpen = signal(false);
    readonly opensUpward = signal(false);
    readonly viewMonth = signal<Date>(this.firstOfMonth(new Date()));

    readonly monthLabel = computed(() =>
        new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.viewMonth())
    );

    readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    readonly calendarCells = computed<CalendarCell[]>(() => {
        const month = this.viewMonth();
        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const firstDay = new Date(year, monthIndex, 1);
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const mondayOffset = (firstDay.getDay() + 6) % 7;

        const cells: CalendarCell[] = [];

        for (let i = 0; i < mondayOffset; i++) {
            cells.push({ day: null, iso: null });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day);
            cells.push({ day, iso: this.toIsoDate(date) });
        }

        while (cells.length < 42) {
            cells.push({ day: null, iso: null });
        }

        return cells;
    });

    readonly displayValue = computed(() => this.value() || '');

    constructor() {
        effect(() => {
            const parsed = this.parseIsoDate(this.value());
            if (parsed) {
                this.viewMonth.set(this.firstOfMonth(parsed));
            }
        });

        effect(() => {
            if (this.isOpen()) {
                this.schedulePositionUpdate();
            }
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as Node | null;
        if (!target) {
            return;
        }

        if (!this.host.nativeElement.contains(target)) {
            this.isOpen.set(false);
            this.opensUpward.set(false);
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.isOpen.set(false);
        this.opensUpward.set(false);
    }

    @HostListener('document:dungeonkeep-close-popups')
    onClosePopupRequest(): void {
        this.isOpen.set(false);
        this.opensUpward.set(false);
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        if (this.isOpen()) {
            this.schedulePositionUpdate();
        }
    }

    open(): void {
        this.requestCloseChat();
        this.isOpen.set(true);
    }

    toggle(): void {
        this.isOpen.update((open) => {
            if (open) {
                this.opensUpward.set(false);
                return false;
            }

            this.requestCloseChat();
            return true;
        });
    }

    private requestCloseChat(): void {
        globalThis.document?.dispatchEvent(new CustomEvent('dungeonkeep-close-chat', { bubbles: true }));
    }

    goToPreviousMonth(): void {
        const month = this.viewMonth();
        this.viewMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    }

    goToNextMonth(): void {
        const month = this.viewMonth();
        this.viewMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    }

    pickDate(iso: string | null): void {
        if (!iso) {
            return;
        }

        this.valueChange.emit(iso);
        this.isOpen.set(false);
        this.opensUpward.set(false);
    }

    isSelected(iso: string | null): boolean {
        return Boolean(iso) && this.value() === iso;
    }

    isToday(iso: string | null): boolean {
        if (!iso) {
            return false;
        }
        return this.toIsoDate(new Date()) === iso;
    }

    private firstOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    private parseIsoDate(value: string): Date | null {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return null;
        }

        const [yearRaw, monthRaw, dayRaw] = value.split('-');
        const year = Number(yearRaw);
        const monthIndex = Number(monthRaw) - 1;
        const day = Number(dayRaw);

        const date = new Date(year, monthIndex, day);
        if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    private toIsoDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private schedulePositionUpdate(): void {
        requestAnimationFrame(() => this.updatePopoverDirection());
    }

    private updatePopoverDirection(): void {
        const host = this.host.nativeElement;
        const popover = host.querySelector('.calendar-popover') as HTMLElement | null;
        if (!popover) {
            this.opensUpward.set(false);
            return;
        }

        const hostRect = host.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const spacing = 8;

        const spaceBelow = window.innerHeight - hostRect.bottom;
        const spaceAbove = hostRect.top;
        const needsUpward = popoverRect.height + spacing > spaceBelow && spaceAbove > spaceBelow;

        this.opensUpward.set(needsUpward);
    }
}
