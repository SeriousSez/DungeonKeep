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

  readonly previousPath = (() => {
    const prev = this.router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl?.toString();
    return prev && prev !== '/' ? prev : '';
  })();
}
