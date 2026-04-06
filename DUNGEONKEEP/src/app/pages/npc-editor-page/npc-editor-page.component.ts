import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DropdownOption } from '../../components/dropdown/dropdown.component';
import { NpcEditorComponent } from '../../components/npc-editor/npc-editor.component';
import { createDefaultNpc, hasNpcNameConflict, mergeStoredNpcDrafts, sanitizeNpc, touchNpc } from '../../data/campaign-npc.helpers';
import { loadCampaignNpcDrafts, loadNpcLibrary, saveCampaignNpcDrafts, saveNpcLibrary } from '../../data/campaign-npc.storage';
import { CampaignNpc } from '../../models/campaign-npc.models';
import { ApiGenerateNpcDraftResponse, DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface NpcGenerationPrompt {
    nameHint: string;
    titleHint: string;
    raceHint: string;
    roleHint: string;
    factionHint: string;
    locationHint: string;
    motivationHint: string;
    notesHint: string;
}

@Component({
    selector: 'app-npc-editor-page',
    standalone: true,
    imports: [CommonModule, RouterLink, NpcEditorComponent],
    templateUrl: './npc-editor-page.component.html',
    styleUrl: './npc-editor-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcEditorPageComponent {
    readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly npcId = signal<string | null>(null);
    readonly isLibraryMode = signal(false);
    readonly initialized = signal(false);
    readonly editorNpc = signal<CampaignNpc | null>(null);
    readonly allNpcs = signal<CampaignNpc[]>([]);
    readonly saveMessage = signal('');
    readonly saveError = signal('');
    readonly generationBusy = signal(false);
    readonly generationError = signal('');
    readonly currentCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null
    );
    readonly canEdit = computed(() => this.isLibraryMode() || this.currentCampaign()?.currentUserRole === 'Owner');
    readonly pageEyebrow = computed(() => this.isLibraryMode() ? 'Reusable Cast' : 'Campaign Cast');
    readonly pageTitle = computed(() => this.npcId() ? 'Edit NPC' : 'New NPC');
    readonly pageSummary = computed(() => {
        if (this.isLibraryMode()) {
            return this.npcId()
                ? 'Refine the reusable NPC record on its own page, then return to the library when you are done.'
                : 'Start a reusable NPC on its own page, choose a drafting type, and save it back into the library.';
        }

        return this.npcId()
            ? 'Refine the NPC record on its own page, then return to the campaign cast list when you are done.'
            : 'Start a new NPC on its own page, choose a drafting type, and save it back into the campaign cast list.';
    });
    readonly relationshipTargetOptions = computed<DropdownOption[]>(() => {
        const activeNpcId = this.editorNpc()?.id;
        return [
            { value: '', label: 'No target' },
            ...this.allNpcs()
                .filter((npc) => npc.id !== activeNpcId)
                .map((npc) => ({ value: npc.id, label: npc.name }))
        ];
    });
    readonly nameConflict = computed(() => {
        const activeNpc = this.editorNpc();
        return activeNpc ? hasNpcNameConflict(this.allNpcs(), activeNpc) : false;
    });

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.campaignId.set(params.get('id') ?? '');
                this.npcId.set(params.get('npcId'));
                this.isLibraryMode.set(!params.get('id'));
                this.initialized.set(false);
                this.editorNpc.set(null);
                this.saveMessage.set('');
                this.saveError.set('');
                this.generationError.set('');
            });

        effect(() => {
            const libraryMode = this.isLibraryMode();
            const npcId = this.npcId();

            if (this.initialized()) {
                return;
            }

            if (libraryMode) {
                const library = (loadNpcLibrary() ?? []).map((npc) => sanitizeNpc(npc));
                this.allNpcs.set(library);

                if (npcId) {
                    const existingNpc = library.find((npc) => npc.id === npcId) ?? null;
                    if (!existingNpc) {
                        this.saveError.set('The requested NPC draft could not be found.');
                    }

                    this.editorNpc.set(existingNpc);
                } else {
                    this.editorNpc.set(sanitizeNpc(touchNpc(createDefaultNpc())));
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
            const merged = mergeStoredNpcDrafts(campaign.npcs, stored);
            this.allNpcs.set(merged);

            if (npcId) {
                const existingNpc = merged.find((npc) => npc.id === npcId) ?? null;
                if (!existingNpc) {
                    this.saveError.set('The requested NPC draft could not be found.');
                }

                this.editorNpc.set(existingNpc);
            } else {
                this.editorNpc.set(sanitizeNpc(touchNpc(createDefaultNpc())));
            }

            this.initialized.set(true);
            this.cdr.detectChanges();
        });
    }

    handleDraftChanged(npc: CampaignNpc): void {
        this.saveMessage.set('');
        this.generationError.set('');
        this.editorNpc.set(npc);
    }

    async generateNpc(prompt: NpcGenerationPrompt): Promise<void> {
        const activeNpc = this.editorNpc();
        if (!activeNpc || !this.canEdit()) {
            return;
        }

        this.generationBusy.set(true);
        this.generationError.set('');
        this.saveMessage.set('');

        try {
            const generated = await this.api.generateNpcDraft({
                campaignId: this.isLibraryMode() ? undefined : this.campaignId(),
                nameHint: prompt.nameHint.trim() || activeNpc.name,
                titleHint: prompt.titleHint.trim() || activeNpc.title,
                raceHint: prompt.raceHint.trim() || activeNpc.race,
                roleHint: prompt.roleHint.trim() || activeNpc.classOrRole,
                factionHint: prompt.factionHint.trim() || activeNpc.faction,
                locationHint: prompt.locationHint.trim() || activeNpc.location,
                motivationHint: prompt.motivationHint.trim() || activeNpc.motivations,
                notesHint: prompt.notesHint.trim() || activeNpc.notes,
                existingNpcNames: this.allNpcs()
                    .filter((npc) => npc.id !== activeNpc.id)
                    .map((npc) => npc.name)
            });

            const nextNpc = this.mergeGeneratedNpc(activeNpc, generated);
            this.editorNpc.set(nextNpc);
            this.saveMessage.set('NPC draft generated. Review it and save when ready.');
        } catch (error) {
            this.generationError.set(this.readApiError(error, 'Could not generate an NPC draft right now.'));
        } finally {
            this.generationBusy.set(false);
            this.cdr.detectChanges();
        }
    }

    async saveNpc(npc: CampaignNpc): Promise<void> {
        const sanitizedNpc = sanitizeNpc(npc);
        const existingNpc = this.npcId()
            ? this.allNpcs().find((entry) => entry.id === this.npcId()) ?? null
            : null;

        if (hasNpcNameConflict(this.allNpcs(), sanitizedNpc)) {
            this.saveError.set('Choose a unique NPC name before saving.');
            this.cdr.detectChanges();
            return;
        }

        this.saveError.set('');
        this.persistDraft(sanitizedNpc);

        if (this.isLibraryMode()) {
            await this.router.navigate(['/npcs', sanitizedNpc.id]);
            return;
        }

        const syncSucceeded = await this.syncNpcName(existingNpc, sanitizedNpc);
        if (!syncSucceeded) {
            this.saveError.set('NPC draft saved locally, but the campaign NPC name list could not be synced.');
            this.cdr.detectChanges();
            return;
        }

        await this.router.navigate(['/campaigns', this.campaignId(), 'npcs', sanitizedNpc.id]);
    }

    saveNpcToLibrary(): void {
        const activeNpc = this.editorNpc();
        if (!activeNpc) {
            return;
        }

        const currentLibrary = loadNpcLibrary() ?? [];
        const existingIndex = currentLibrary.findIndex((npc) => npc.name.trim().toLowerCase() === activeNpc.name.trim().toLowerCase());
        const libraryEntry = sanitizeNpc(touchNpc({ ...activeNpc }));
        const nextLibrary = existingIndex >= 0
            ? currentLibrary.map((npc, index) => index === existingIndex ? { ...libraryEntry, id: currentLibrary[existingIndex].id } : npc)
            : [libraryEntry, ...currentLibrary];

        saveNpcLibrary(nextLibrary);
        this.saveMessage.set('NPC saved to the reusable library.');
        this.cdr.detectChanges();
    }

    private persistDraft(npc: CampaignNpc): void {
        const currentList = this.allNpcs();
        const hasExisting = currentList.some((entry) => entry.id === npc.id);
        const nextList = hasExisting
            ? currentList.map((entry) => entry.id === npc.id ? npc : entry)
            : [npc, ...currentList];

        this.allNpcs.set(nextList);
        this.editorNpc.set(npc);
        if (this.isLibraryMode()) {
            saveNpcLibrary(nextList);
        } else {
            saveCampaignNpcDrafts(this.campaignId(), nextList);
        }
    }

    private mergeGeneratedNpc(currentNpc: CampaignNpc, generated: ApiGenerateNpcDraftResponse): CampaignNpc {
        return sanitizeNpc(touchNpc({
            ...currentNpc,
            name: generated.name || currentNpc.name,
            title: generated.title,
            race: generated.race,
            classOrRole: generated.classOrRole,
            faction: generated.faction,
            occupation: generated.occupation,
            age: generated.age,
            gender: generated.gender,
            alignment: generated.alignment,
            currentStatus: generated.currentStatus,
            location: generated.location,
            shortDescription: generated.shortDescription,
            appearance: generated.appearance,
            personalityTraits: generated.personalityTraits,
            ideals: generated.ideals,
            bonds: generated.bonds,
            flaws: generated.flaws,
            motivations: generated.motivations,
            goals: generated.goals,
            fears: generated.fears,
            secrets: generated.secrets,
            mannerisms: generated.mannerisms,
            voiceNotes: generated.voiceNotes,
            backstory: generated.backstory,
            notes: generated.notes,
            combatNotes: generated.combatNotes,
            statBlockReference: generated.statBlockReference,
            tags: generated.tags,
            questLinks: generated.questLinks,
            sessionAppearances: generated.sessionAppearances,
            inventory: generated.inventory,
            imageUrl: generated.imageUrl,
            hostility: generated.isHostile ? 'Hostile' : 'Friendly',
            isAlive: generated.isAlive,
            isImportant: generated.isImportant
        }));
    }

    private async syncNpcName(previousNpc: CampaignNpc | null, nextNpc: CampaignNpc): Promise<boolean> {
        if (!this.canEdit()) {
            return true;
        }

        const campaignId = this.campaignId();
        if (!campaignId) {
            return false;
        }

        if (!previousNpc) {
            return await this.store.addCampaignNpc(campaignId, nextNpc.name);
        }

        if (previousNpc.name === nextNpc.name) {
            return true;
        }

        const added = await this.store.addCampaignNpc(campaignId, nextNpc.name);
        if (!added) {
            return false;
        }

        const removed = await this.store.removeCampaignNpc(campaignId, previousNpc.name);
        if (!removed) {
            await this.store.removeCampaignNpc(campaignId, nextNpc.name);
            return false;
        }

        return true;
    }

    private readApiError(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                return detail || title || fallback;
            }
        }

        return fallback;
    }
}