import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DropdownComponent, type DropdownOption } from '../dropdown/dropdown.component';

type HitPointMode = 'fixed' | 'rolled';

@Component({
    selector: 'app-hit-point-manager-modal',
    standalone: true,
    imports: [CommonModule, DropdownComponent],
    templateUrl: './hit-point-manager-modal.component.html',
    styleUrl: './hit-point-manager-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HitPointManagerModalComponent {
    readonly className = input.required<string>();
    readonly level = input<number>(1);
    readonly hitDie = input<number>(10);
    readonly conModifier = input<string>('+0');
    readonly fixedMaxHp = input<number>(1);
    readonly currentMaxHp = input<number>(1);
    readonly hitPointMode = input<HitPointMode>('fixed');
    readonly modeOptions = input<ReadonlyArray<DropdownOption>>([]);
    readonly rolledHitPointTotal = input<string>('');

    readonly closed = output<void>();
    readonly modeChanged = output<string | number>();
    readonly rolledTotalChanged = output<string>();

    close(): void {
        this.closed.emit();
    }

    onModeChanged(value: string | number): void {
        this.modeChanged.emit(value);
    }

    onRolledTotalInput(value: string): void {
        this.rolledTotalChanged.emit(value);
    }

    getHitDiceExpression(): string {
        return `${this.level()}d${this.hitDie()}`;
    }

    getConModifierNumeric(): number {
        const parsed = Number.parseInt(this.conModifier().trim(), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    getConContributionTotal(): number {
        return this.getConModifierNumeric() * this.level();
    }

    getConContributionDisplay(): string {
        const value = this.getConContributionTotal();
        return value >= 0 ? `+${value}` : `${value}`;
    }

    getMinimumRolledTotal(): number {
        const level = Math.max(1, this.level());
        const con = this.getConModifierNumeric();
        const firstLevel = this.hitDie();
        const laterLevelsMinimum = Math.max(0, level - 1);
        return Math.max(level, firstLevel + laterLevelsMinimum + (con * level));
    }

    getMaximumRolledTotal(): number {
        const level = Math.max(1, this.level());
        const con = this.getConModifierNumeric();
        const allMaxRolls = this.hitDie() * level;
        return Math.max(level, allMaxRolls + (con * level));
    }
}
