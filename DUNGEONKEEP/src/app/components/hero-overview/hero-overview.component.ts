import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'app-hero-overview',
    imports: [CommonModule],
    templateUrl: './hero-overview.component.html',
    styleUrl: './hero-overview.component.scss'
})
export class HeroOverviewComponent {
    readonly title = input.required<string>();
    readonly campaignCount = input.required<number>();
    readonly characterCount = input.required<number>();
    readonly sessionCount = input.required<number>();
    readonly readyCharacterCount = input.required<number>();
}
