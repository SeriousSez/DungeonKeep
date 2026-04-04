import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NpcManagerComponent } from '../../components/npc-manager/npc-manager.component';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
    selector: 'app-npc-library-page',
    standalone: true,
    imports: [CommonModule, RouterLink, NpcManagerComponent],
    templateUrl: './npc-library-page.component.html',
    styleUrl: './npc-library-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcLibraryPageComponent {
    private readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    readonly importCampaignId = signal('');
    readonly importCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.importCampaignId()) ?? null
    );

    constructor() {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.importCampaignId.set(params.get('campaignId') ?? '');
            });
    }
}