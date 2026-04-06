import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage {
  private readonly router = inject(Router);

  readonly requestedPath = this.router.url !== '/404' ? this.router.url : '';
}
