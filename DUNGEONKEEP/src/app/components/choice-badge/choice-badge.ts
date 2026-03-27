import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-choice-badge',
  imports: [],
  templateUrl: './choice-badge.html',
  styleUrl: './choice-badge.scss'
})
export class ChoiceBadgeComponent {
  readonly count = input<number>(1);
  readonly label = input<string>('');

  readonly text = computed(() => {
    const count = Math.max(0, Math.trunc(this.count()));
    const choiceText = `${count} Choice${count === 1 ? '' : 's'}`;
    const label = this.label().trim();

    return label ? `${choiceText} • ${label}` : choiceText;
  });
}
