import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CustomTableManagerComponent } from '../../components/custom-table-manager/custom-table-manager.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-tables-library-page',
    standalone: true,
    imports: [CommonModule, RouterLink, CustomTableManagerComponent],
    templateUrl: './tables-library-page.component.html',
    styleUrl: './tables-library-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablesLibraryPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly importCampaignId = signal('');
    readonly importCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.importCampaignId()) ?? null
    );

    constructor() {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.importCampaignId.set(params.get('campaignId') ?? '');
                this.cdr.detectChanges();
            });
    }
}
