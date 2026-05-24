import { ApplicationRef, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
    private readonly appRef = inject(ApplicationRef);
    private readonly swUpdate = inject(SwUpdate);
    private readonly destroyRef = inject(DestroyRef);
    private readonly document = inject(DOCUMENT);

    readonly isUpdateReloading = signal(false);

    constructor() {
        if (!this.swUpdate.isEnabled) {
            return;
        }

        this.swUpdate.versionUpdates
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((event: VersionEvent) => event.type === 'VERSION_READY')
            )
            .subscribe(() => {
                void this.reloadToLatestVersion();
            });

        const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
        concat(appIsStable$, interval(10 * 60 * 1000))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                void this.swUpdate.checkForUpdate();
            });
    }

    private async reloadToLatestVersion(): Promise<void> {
        if (this.isUpdateReloading()) {
            return;
        }

        this.isUpdateReloading.set(true);

        try {
            await this.swUpdate.activateUpdate();
        } catch {
            // Reload anyway so the browser can request the newest app shell.
        }

        this.document.defaultView?.location.reload();
    }
}
