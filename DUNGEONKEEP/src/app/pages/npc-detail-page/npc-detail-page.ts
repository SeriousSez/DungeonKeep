import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MultiSelectDropdownComponent, type MultiSelectOptionGroup } from '../../components/multi-select-dropdown/multi-select-dropdown.component';
import { cloneNpcForCampaign, mergeCampaignNpcSources, sanitizeNpc } from '../../data/campaign-npc.helpers';
import { loadCampaignNpcDrafts, loadNpcLibrary, saveCampaignNpcDrafts } from '../../data/campaign-npc.storage';
import { CampaignNpc } from '../../models/campaign-npc.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

@Component({
  selector: 'app-npc-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MultiSelectDropdownComponent],
  templateUrl: './npc-detail-page.html',
  styleUrl: './npc-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcDetailPage {
  private readonly store = inject(DungeonStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly campaignId = signal('');
  readonly npcId = signal<string | null>(null);
  readonly importCampaignId = signal('');
  readonly selectedImportCampaignIds = signal<string[]>([]);
  readonly isLibraryMode = signal(false);
  readonly initialized = signal(false);
  readonly allNpcs = signal<CampaignNpc[]>([]);
  readonly npc = signal<CampaignNpc | null>(null);
  readonly loadError = signal('');
  readonly importBusy = signal(false);
  readonly importError = signal('');
  readonly importMessage = signal('');
  readonly portraitLoadFailed = signal(false);

  readonly currentCampaign = computed(() =>
    this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null
  );
  readonly importCampaign = computed(() =>
    this.store.campaigns().find((campaign) => campaign.id === this.importCampaignId()) ?? null
  );
  readonly ownerCampaigns = computed(() =>
    this.store.campaigns()
      .filter((campaign) => campaign.currentUserRole === 'Owner')
      .sort((left, right) => left.name.localeCompare(right.name))
  );
  readonly importCampaignGroups = computed<MultiSelectOptionGroup[]>(() => [{
    label: 'Campaigns',
    options: this.ownerCampaigns().map((campaign) => ({
      value: campaign.id,
      label: `${campaign.name} (${campaign.levelRange})`
    }))
  }]);
  readonly canEdit = computed(() => this.isLibraryMode() || this.currentCampaign()?.currentUserRole === 'Owner');
  readonly backLink = computed<readonly string[]>(() => this.isLibraryMode() ? ['/npcs'] : ['/campaigns', this.campaignId(), 'npcs']);
  readonly backQueryParams = computed(() => this.isLibraryMode() && this.importCampaignId() ? { campaignId: this.importCampaignId() } : undefined);
  readonly backLabel = computed(() => this.isLibraryMode() ? '← Back to NPC Library' : '← Back to Campaign NPCs');
  readonly editLink = computed<readonly string[]>(() => {
    const npcId = this.npcId();
    if (!npcId) {
      return this.backLink();
    }

    return this.isLibraryMode()
      ? ['/npcs', npcId, 'edit']
      : ['/campaigns', this.campaignId(), 'npcs', npcId, 'edit'];
  });
  readonly editQueryParams = computed(() => this.isLibraryMode() && this.importCampaignId() ? { campaignId: this.importCampaignId() } : undefined);
  readonly selectedImportCampaigns = computed(() =>
    this.ownerCampaigns().filter((campaign) => this.selectedImportCampaignIds().includes(campaign.id))
  );
  readonly canImportToCampaign = computed(() =>
    this.isLibraryMode()
    && this.selectedImportCampaigns().length > 0
  );
  readonly importActionLabel = computed(() => {
    const campaigns = this.selectedImportCampaigns();
    if (campaigns.length === 1) {
      return `Import to ${campaigns[0].name}`;
    }

    return campaigns.length > 1 ? `Import to ${campaigns.length} Campaigns` : 'Import to Campaigns';
  });
  readonly pageEyebrow = computed(() => this.isLibraryMode() ? 'Reusable Cast' : 'Campaign Cast');
  readonly pageSummary = computed(() => {
    const npc = this.npc();
    if (!npc) {
      return this.isLibraryMode()
        ? 'This NPC record could not be found in the reusable library.'
        : 'This NPC record could not be found in the campaign cast.';
    }

    const fragments = [
      npc.title || npc.classOrRole || npc.occupation || 'Unassigned role',
      npc.race || 'Unknown ancestry',
      npc.location || 'Location unrecorded'
    ];

    return fragments.join(' · ');
  });
  readonly overviewFacts = computed(() => {
    const npc = this.npc();
    if (!npc) {
      return [];
    }

    return [
      { label: 'Location', value: npc.location || 'Unknown' },
      { label: 'Faction', value: npc.faction || 'Independent' },
      { label: 'Alignment', value: npc.alignment || 'Unrecorded' },
      { label: 'Current Status', value: npc.currentStatus || (npc.isAlive ? 'Active' : 'Deceased') },
      { label: 'Occupation', value: npc.occupation || 'Unrecorded' },
      { label: 'Age', value: npc.age || 'Unknown' },
      { label: 'Gender', value: npc.gender || 'Unrecorded' },
      { label: 'Updated', value: this.formatUpdatedAt(npc.updatedAt) }
    ];
  });
  readonly relationshipRows = computed(() => {
    const npc = this.npc();
    if (!npc) {
      return [];
    }

    return npc.relationships.map((relationship) => ({
      id: relationship.id,
      target: this.resolveNpcName(relationship.targetNpcId),
      type: relationship.relationshipType || 'Relationship',
      description: relationship.description || 'No details recorded.'
    }));
  });
  readonly showPortraitImage = computed(() => {
    const npc = this.npc();
    return !!npc?.imageUrl.trim() && !this.portraitLoadFailed();
  });
  readonly npcInitial = computed(() => {
    const name = this.npc()?.name.trim() ?? '';
    return name.charAt(0).toUpperCase() || '?';
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.campaignId.set(params.get('id') ?? '');
        this.npcId.set(params.get('npcId'));
        this.isLibraryMode.set(!params.get('id'));
        this.initialized.set(false);
        this.allNpcs.set([]);
        this.npc.set(null);
        this.loadError.set('');
        this.portraitLoadFailed.set(false);
        this.cdr.detectChanges();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.importCampaignId.set(params.get('campaignId') ?? '');
        this.importError.set('');
        this.importMessage.set('');
        const requestedCampaignId = params.get('campaignId') ?? '';
        const defaultSelection = requestedCampaignId && this.ownerCampaigns().some((campaign) => campaign.id === requestedCampaignId)
          ? [requestedCampaignId]
          : [];
        this.selectedImportCampaignIds.set(defaultSelection);
        this.cdr.detectChanges();
      });

    effect(() => {
      const libraryMode = this.isLibraryMode();
      const npcId = this.npcId();

      if (this.initialized() || !npcId) {
        return;
      }

      if (libraryMode) {
        const library = (loadNpcLibrary() ?? []).map((npc) => sanitizeNpc(npc));
        this.allNpcs.set(library);
        this.npc.set(library.find((entry) => entry.id === npcId) ?? null);

        if (!this.npc()) {
          this.loadError.set('The requested NPC record could not be found in the reusable library.');
        }

        this.initialized.set(true);
        this.cdr.detectChanges();
        return;
      }

      const campaign = this.currentCampaign();
      const campaignId = this.campaignId();
      if (!campaignId || !campaign) {
        return;
      }

      const stored = loadCampaignNpcDrafts(campaignId) ?? [];
      const merged = mergeCampaignNpcSources(campaign.npcs, campaign.campaignNpcs ?? [], stored);
      this.allNpcs.set(merged);
      this.npc.set(merged.find((entry) => entry.id === npcId) ?? null);

      if (!this.npc()) {
        this.loadError.set('The requested NPC record could not be found in this campaign.');
      }

      this.initialized.set(true);
      this.cdr.detectChanges();
    });
  }

  markPortraitLoadFailed(): void {
    this.portraitLoadFailed.set(true);
    this.cdr.detectChanges();
  }

  async importNpcToCampaign(): Promise<void> {
    const sourceNpc = this.npc();
    const targetCampaigns = this.selectedImportCampaigns();

    if (!sourceNpc || targetCampaigns.length === 0 || !this.canImportToCampaign()) {
      return;
    }

    this.importBusy.set(true);
    this.importError.set('');
    this.importMessage.set('');

    try {
      const successfulImports: Array<{ campaignId: string; npcId: string; campaignName: string; synced: boolean }> = [];
      const failedSyncCampaigns: string[] = [];

      for (const targetCampaign of targetCampaigns) {
        const storedDrafts = loadCampaignNpcDrafts(targetCampaign.id) ?? [];
        const mergedDrafts = mergeCampaignNpcSources(targetCampaign.npcs, targetCampaign.campaignNpcs ?? [], storedDrafts);
        const importedNpc = cloneNpcForCampaign(sourceNpc, mergedDrafts.map((npc) => npc.name));

        saveCampaignNpcDrafts(targetCampaign.id, [importedNpc, ...mergedDrafts]);

        const syncSucceeded = await this.store.addCampaignNpc(targetCampaign.id, importedNpc.name);
        successfulImports.push({
          campaignId: targetCampaign.id,
          npcId: importedNpc.id,
          campaignName: targetCampaign.name,
          synced: syncSucceeded
        });

        if (!syncSucceeded) {
          failedSyncCampaigns.push(targetCampaign.name);
        }
      }

      if (successfulImports.length === 1 && failedSyncCampaigns.length === 0) {
        await this.router.navigate(['/campaigns', successfulImports[0].campaignId, 'npcs', successfulImports[0].npcId]);
        return;
      }

      const syncedCount = successfulImports.filter((entry) => entry.synced).length;
      const localOnlyCount = failedSyncCampaigns.length;

      if (syncedCount > 0) {
        this.importMessage.set(`NPC imported into ${syncedCount} campaign${syncedCount === 1 ? '' : 's'}.`);
      }

      if (localOnlyCount > 0) {
        this.importError.set(`Imported locally for ${localOnlyCount} campaign${localOnlyCount === 1 ? '' : 's'}, but the campaign NPC list could not be synced for: ${failedSyncCampaigns.join(', ')}.`);
      }
    } finally {
      this.importBusy.set(false);
      this.cdr.detectChanges();
    }
  }

  updateSelectedImportCampaigns(values: string[]): void {
    this.selectedImportCampaignIds.set(values);
    this.importError.set('');
    this.importMessage.set('');
  }

  private resolveNpcName(targetNpcId: string): string {
    if (!targetNpcId.trim()) {
      return 'No target';
    }

    return this.allNpcs().find((npc) => npc.id === targetNpcId)?.name ?? targetNpcId;
  }

  private formatUpdatedAt(value: string): string {
    if (!value) {
      return 'Unknown';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown';
    }

    return parsed.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
