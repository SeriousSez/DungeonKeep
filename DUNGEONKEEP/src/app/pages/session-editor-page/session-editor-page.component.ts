import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormArray,
    FormControl,
    FormGroup,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { marked } from 'marked';

import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { SESSION_EDITOR_SAMPLE_DRAFT } from '../../data/session-editor.mock';
import {
    persistStoredSessionEditorDraft,
    readStoredSessionEditorDraft,
    removeStoredSessionEditorDraft
} from '../../data/session-editor.storage';
import { ThreatLevel } from '../../models/dungeon.models';
import {
    SessionEditorDraft,
    SessionLocation,
    SessionLootItem,
    SessionMonster,
    SessionNpc,
    SessionScene,
    SessionSkillCheck,
    SessionTextEntry
} from '../../models/session-editor.models';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { ApiGenerateSessionDraftResponse, DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

type TextEntryForm = FormGroup<{
    id: FormControl<string>;
    text: FormControl<string>;
}>;

type SceneForm = FormGroup<{
    id: FormControl<string>;
    title: FormControl<string>;
    description: FormControl<string>;
    trigger: FormControl<string>;
    keyEvents: FormArray<FormControl<string>>;
    possibleOutcomes: FormArray<FormControl<string>>;
}>;

type NpcForm = FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    role: FormControl<string>;
    personality: FormControl<string>;
    motivation: FormControl<string>;
    voiceNotes: FormControl<string>;
}>;

type MonsterForm = FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    type: FormControl<string>;
    challengeRating: FormControl<string>;
    hp: FormControl<number>;
    keyAbilities: FormControl<string>;
    notes: FormControl<string>;
}>;

type LocationForm = FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    description: FormControl<string>;
    secrets: FormControl<string>;
    encounters: FormControl<string>;
}>;

type LootForm = FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    type: FormControl<string>;
    quantity: FormControl<number>;
    notes: FormControl<string>;
}>;

type SkillCheckForm = FormGroup<{
    id: FormControl<string>;
    situation: FormControl<string>;
    skill: FormControl<string>;
    dc: FormControl<number>;
    successOutcome: FormControl<string>;
    failureOutcome: FormControl<string>;
}>;

type SessionEditorForm = FormGroup<{
    title: FormControl<string>;
    shortDescription: FormControl<string>;
    sessionNumber: FormControl<number>;
    threatLevel: FormControl<ThreatLevel | ''>;
    campaignId: FormControl<string>;
    date: FormControl<string>;
    inGameLocation: FormControl<string>;
    estimatedLength: FormControl<string>;
    markdownNotes: FormControl<string>;
    scenes: FormArray<SceneForm>;
    npcs: FormArray<NpcForm>;
    monsters: FormArray<MonsterForm>;
    locations: FormArray<LocationForm>;
    loot: FormArray<LootForm>;
    skillChecks: FormArray<SkillCheckForm>;
    secrets: FormArray<TextEntryForm>;
    branchingPaths: FormArray<TextEntryForm>;
    nextSessionHooks: FormArray<TextEntryForm>;
}>;

type DeleteCollection = 'scenes' | 'npcs' | 'monsters' | 'locations' | 'loot' | 'skillChecks' | 'secrets' | 'branchingPaths' | 'nextSessionHooks';

interface PendingDelete {
    collection: DeleteCollection;
    index: number;
    label: string;
}

interface SessionGenerationHints {
    titleHint: string;
    shortDescriptionHint: string;
    locationHint: string;
    estimatedLengthHint: string;
    markdownNotesHint: string;
}

type SessionCreationMode = 'standard' | 'ai';

@Component({
    selector: 'app-session-editor-page',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, DropdownComponent, ConfirmModalComponent],
    templateUrl: './session-editor-page.component.html',
    styleUrl: './session-editor-page.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionEditorPageComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly sessionId = signal<string | null>(null);
    readonly initialized = signal(false);
    readonly submitAttempted = signal(false);
    readonly saveMessage = signal('');
    readonly saveError = signal('');
    readonly generationError = signal('');
    readonly generationInProgress = signal(false);
    readonly generationHints = signal<SessionGenerationHints>({
        titleHint: '',
        shortDescriptionHint: '',
        locationHint: '',
        estimatedLengthHint: '',
        markdownNotesHint: ''
    });
    readonly creationMode = signal<SessionCreationMode>('standard');
    readonly lastAutosavedAt = signal<string>('');
    readonly markdownPreview = signal('');
    readonly pendingDelete = signal<PendingDelete | null>(null);

    readonly threatOptions: DropdownOption[] = [
        { value: '', label: 'Auto', description: 'Infer threat from the session summary and notes when saving.' },
        { value: 'Low', label: 'Low', description: 'Straightforward pacing and modest pressure.' },
        { value: 'Moderate', label: 'Moderate', description: 'Balanced risk and table tension.' },
        { value: 'High', label: 'High', description: 'Escalated danger or meaningful complications.' },
        { value: 'Deadly', label: 'Deadly', description: 'A major confrontation with real consequences.' }
    ];

    readonly skillOptions: DropdownOption[] = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
    ].map((skill) => ({ value: skill, label: skill }));

    readonly editorForm: SessionEditorForm = this.fb.group({
        title: this.fb.control('', { validators: [Validators.required] }),
        shortDescription: this.fb.control(''),
        sessionNumber: this.fb.control(1, { validators: [Validators.min(1)] }),
        threatLevel: this.fb.control<ThreatLevel | ''>(''),
        campaignId: this.fb.control(''),
        date: this.fb.control(''),
        inGameLocation: this.fb.control(''),
        estimatedLength: this.fb.control(''),
        markdownNotes: this.fb.control(''),
        scenes: this.fb.array<SceneForm>([]),
        npcs: this.fb.array<NpcForm>([]),
        monsters: this.fb.array<MonsterForm>([]),
        locations: this.fb.array<LocationForm>([]),
        loot: this.fb.array<LootForm>([]),
        skillChecks: this.fb.array<SkillCheckForm>([]),
        secrets: this.fb.array<TextEntryForm>([]),
        branchingPaths: this.fb.array<TextEntryForm>([]),
        nextSessionHooks: this.fb.array<TextEntryForm>([])
    });

    readonly currentCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null
    );

    readonly pageTitle = computed(() => this.sessionId() ? 'Edit Session' : 'New Session');
    readonly autosaveLabel = computed(() => this.lastAutosavedAt() ? `Autosaved ${this.lastAutosavedAt()}` : 'Autosave is ready');
    readonly deleteModalOpen = computed(() => this.pendingDelete() !== null);
    readonly deleteModalMessage = computed(() => {
        const pendingDelete = this.pendingDelete();
        if (!pendingDelete) {
            return 'Delete this item?';
        }

        return `Remove ${pendingDelete.label}? This cannot be undone from the editor.`;
    });

    readonly titleControl = this.editorForm.controls.title;
    readonly notesControl = this.editorForm.controls.markdownNotes;
    readonly scenesArray = this.editorForm.controls.scenes;
    readonly npcsArray = this.editorForm.controls.npcs;
    readonly monstersArray = this.editorForm.controls.monsters;
    readonly locationsArray = this.editorForm.controls.locations;
    readonly lootArray = this.editorForm.controls.loot;
    readonly skillChecksArray = this.editorForm.controls.skillChecks;
    readonly secretsArray = this.editorForm.controls.secrets;
    readonly branchingPathsArray = this.editorForm.controls.branchingPaths;
    readonly nextSessionHooksArray = this.editorForm.controls.nextSessionHooks;

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                this.campaignId.set(campaignId);
                this.sessionId.set(params.get('sessionId'));
                this.initialized.set(false);
                this.saveMessage.set('');
                this.saveError.set('');
                this.generationHints.set({
                    titleHint: '',
                    shortDescriptionHint: '',
                    locationHint: '',
                    estimatedLengthHint: '',
                    markdownNotesHint: ''
                });

                if (campaignId) {
                    void this.store.ensureCampaignLoaded(campaignId);
                }
            });

        this.editorForm.valueChanges
            .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (!this.initialized()) {
                    return;
                }

                this.autosaveDraft();
                this.updateMarkdownPreview(this.notesControl.value);
            });

        effect(() => {
            const campaign = this.currentCampaign();
            const campaignId = this.campaignId();

            if (!campaignId || this.initialized()) {
                return;
            }

            if (!campaign?.detailsLoaded) {
                return;
            }

            this.loadInitialState(campaign);
        });

        effect(() => {
            const campaign = this.currentCampaign();
            const campaignId = this.campaignId();
            const sessionId = this.sessionId();

            if (!campaignId || !campaign || campaign.currentUserRole === 'Owner') {
                return;
            }

            void this.router.navigate(
                sessionId
                    ? ['/campaigns', campaignId, 'sessions', sessionId]
                    : ['/campaigns', campaignId, 'sessions'],
                { replaceUrl: true }
            );
        });
    }

    loadSampleDraft(): void {
        const campaignId = this.campaignId();
        const sampleDraft: SessionEditorDraft = {
            ...SESSION_EDITOR_SAMPLE_DRAFT,
            id: this.sessionId() ?? this.generateId('session'),
            campaignId,
            sessionNumber: this.currentCampaign()?.sessions.length ? this.currentCampaign()!.sessions.length + 1 : SESSION_EDITOR_SAMPLE_DRAFT.sessionNumber
        };

        this.patchDraft(sampleDraft);
        this.autosaveDraft();
        this.saveMessage.set('Sample session loaded into the editor.');
        this.saveError.set('');
        this.cdr.detectChanges();
    }

    async generateSessionDraft(): Promise<void> {
        const campaign = this.currentCampaign();
        const campaignId = this.campaignId();

        if (!campaignId || campaign?.currentUserRole !== 'Owner') {
            return;
        }

        this.generationInProgress.set(true);
        this.generationError.set('');
        this.saveMessage.set('');

        try {
            const currentDraft = this.toDraft();
            const generationHints = this.generationHints();
            const generated = await this.api.generateSessionDraft(campaignId, {
                titleHint: generationHints.titleHint.trim() || currentDraft.title,
                shortDescriptionHint: generationHints.shortDescriptionHint.trim() || currentDraft.shortDescription,
                locationHint: generationHints.locationHint.trim() || currentDraft.inGameLocation,
                estimatedLengthHint: generationHints.estimatedLengthHint.trim() || currentDraft.estimatedLength,
                markdownNotesHint: generationHints.markdownNotesHint.trim() || currentDraft.markdownNotes
            });

            const mergedDraft = this.mergeGeneratedDraft(currentDraft, generated);
            this.patchDraft(mergedDraft);
            this.autosaveDraft();
            this.creationMode.set('standard');
            this.saveMessage.set('Session draft generated. Review it and save when ready.');
        } catch (error) {
            this.generationError.set(this.readApiError(error, 'Could not generate a session draft right now.'));
        } finally {
            this.generationInProgress.set(false);
            this.cdr.detectChanges();
        }
    }

    selectCreationMode(mode: SessionCreationMode): void {
        this.creationMode.set(mode);
        this.generationError.set('');
        this.cdr.detectChanges();
    }

    updateGenerationTitleHint(value: string): void {
        this.generationHints.update((hints) => ({ ...hints, titleHint: value }));
    }

    updateGenerationShortDescriptionHint(value: string): void {
        this.generationHints.update((hints) => ({ ...hints, shortDescriptionHint: value }));
    }

    updateGenerationLocationHint(value: string): void {
        this.generationHints.update((hints) => ({ ...hints, locationHint: value }));
    }

    updateGenerationEstimatedLengthHint(value: string): void {
        this.generationHints.update((hints) => ({ ...hints, estimatedLengthHint: value }));
    }

    updateGenerationNotesHint(value: string): void {
        this.generationHints.update((hints) => ({ ...hints, markdownNotesHint: value }));
    }

    async saveSession(): Promise<void> {
        this.submitAttempted.set(true);
        this.saveMessage.set('');
        this.saveError.set('');

        if (this.editorForm.invalid) {
            this.editorForm.markAllAsTouched();
            this.saveError.set('Fill the required fields before saving.');
            this.cdr.detectChanges();
            return;
        }

        const draft = this.toDraft();
        persistStoredSessionEditorDraft(this.campaignId(), this.sessionId() ?? draft.id, draft);

        const campaignId = this.campaignId();
        if (!campaignId) {
            this.saveMessage.set('Draft saved locally.');
            this.cdr.detectChanges();
            return;
        }

        if (this.currentCampaign()?.currentUserRole !== 'Owner') {
            this.saveError.set('Only campaign owners can edit sessions.');
            this.cdr.detectChanges();
            return;
        }

        const sessionSummary = this.toCampaignSessionSummary(draft);
        let saveSucceeded = false;

        if (this.sessionId()) {
            saveSucceeded = await this.store.updateCampaignSession(campaignId, this.sessionId()!, sessionSummary);
        } else {
            saveSucceeded = await this.store.addCampaignSession(campaignId, sessionSummary);
        }

        if (!saveSucceeded) {
            this.saveError.set('The planning draft was saved locally, but the campaign session summary could not be synced.');
            this.cdr.detectChanges();
            return;
        }

        const syncedSessionId = this.findPersistedSessionId(sessionSummary);
        if (syncedSessionId && !this.sessionId()) {
            persistStoredSessionEditorDraft(campaignId, syncedSessionId, { ...draft, id: syncedSessionId });
            removeStoredSessionEditorDraft(campaignId, 'new');
            removeStoredSessionEditorDraft(campaignId, draft.id);
            this.sessionId.set(syncedSessionId);
            await this.router.navigate(['/campaigns', campaignId, 'sessions', syncedSessionId, 'edit'], { replaceUrl: true });
        }

        this.saveMessage.set('Session plan saved.');
        this.saveError.set('');
        this.cdr.detectChanges();
    }

    addScene(): void {
        this.scenesArray.push(this.createSceneForm());
    }

    moveSceneUp(index: number): void {
        if (index <= 0) {
            return;
        }

        const scene = this.scenesArray.at(index);
        this.scenesArray.removeAt(index);
        this.scenesArray.insert(index - 1, scene);
    }

    moveSceneDown(index: number): void {
        if (index >= this.scenesArray.length - 1) {
            return;
        }

        const scene = this.scenesArray.at(index);
        this.scenesArray.removeAt(index);
        this.scenesArray.insert(index + 1, scene);
    }

    addSceneKeyEvent(sceneIndex: number): void {
        this.scenesArray.at(sceneIndex).controls.keyEvents.push(this.fb.control(''));
    }

    removeSceneKeyEvent(sceneIndex: number, keyEventIndex: number): void {
        this.scenesArray.at(sceneIndex).controls.keyEvents.removeAt(keyEventIndex);
    }

    addSceneOutcome(sceneIndex: number): void {
        this.scenesArray.at(sceneIndex).controls.possibleOutcomes.push(this.fb.control(''));
    }

    removeSceneOutcome(sceneIndex: number, outcomeIndex: number): void {
        this.scenesArray.at(sceneIndex).controls.possibleOutcomes.removeAt(outcomeIndex);
    }

    addNpc(): void {
        this.npcsArray.push(this.createNpcForm());
    }

    addMonster(): void {
        this.monstersArray.push(this.createMonsterForm());
    }

    addLocation(): void {
        this.locationsArray.push(this.createLocationForm());
    }

    addLoot(): void {
        this.lootArray.push(this.createLootForm());
    }

    addSkillCheck(): void {
        this.skillChecksArray.push(this.createSkillCheckForm());
    }

    addSecret(): void {
        this.secretsArray.push(this.createTextEntryForm());
    }

    addBranchingPath(): void {
        this.branchingPathsArray.push(this.createTextEntryForm());
    }

    addNextSessionHook(): void {
        this.nextSessionHooksArray.push(this.createTextEntryForm());
    }

    requestDelete(collection: DeleteCollection, index: number, label: string): void {
        this.pendingDelete.set({ collection, index, label });
    }

    confirmDelete(): void {
        const pendingDelete = this.pendingDelete();
        if (!pendingDelete) {
            return;
        }

        switch (pendingDelete.collection) {
            case 'scenes':
                this.scenesArray.removeAt(pendingDelete.index);
                break;
            case 'npcs':
                this.npcsArray.removeAt(pendingDelete.index);
                break;
            case 'monsters':
                this.monstersArray.removeAt(pendingDelete.index);
                break;
            case 'locations':
                this.locationsArray.removeAt(pendingDelete.index);
                break;
            case 'loot':
                this.lootArray.removeAt(pendingDelete.index);
                break;
            case 'skillChecks':
                this.skillChecksArray.removeAt(pendingDelete.index);
                break;
            case 'secrets':
                this.secretsArray.removeAt(pendingDelete.index);
                break;
            case 'branchingPaths':
                this.branchingPathsArray.removeAt(pendingDelete.index);
                break;
            case 'nextSessionHooks':
                this.nextSessionHooksArray.removeAt(pendingDelete.index);
                break;
        }

        this.pendingDelete.set(null);
    }

    cancelDelete(): void {
        this.pendingDelete.set(null);
    }

    updateSkillControl(control: FormControl<string>, value: string | number): void {
        control.setValue(typeof value === 'string' ? value : String(value));
    }

    updateThreatControl(control: FormControl<ThreatLevel | ''>, value: string | number): void {
        const threat = value === 'Low' || value === 'High' || value === 'Deadly' || value === 'Moderate' ? value : '';
        control.setValue(threat);
    }

    private loadInitialState(campaign: ReturnType<typeof this.currentCampaign>): void {
        const campaignId = this.campaignId();
        const sessionId = this.sessionId();

        if (!sessionId) {
            removeStoredSessionEditorDraft(campaignId, 'new');

            const freshDraft = this.createDraftFromCampaign(campaign, campaignId, null);
            this.patchDraft(freshDraft);
            this.initialized.set(true);
            this.cdr.detectChanges();
            return;
        }

        const persistedDraft = readStoredSessionEditorDraft(campaignId, sessionId ?? 'new');
        if (persistedDraft) {
            this.patchDraft(persistedDraft);
            this.initialized.set(true);
            this.cdr.detectChanges();
            return;
        }

        const fallbackDraft = this.createDraftFromCampaign(campaign, campaignId, sessionId);
        this.patchDraft(fallbackDraft);
        this.initialized.set(true);
        this.cdr.detectChanges();
    }

    private createDraftFromCampaign(campaign: ReturnType<typeof this.currentCampaign>, campaignId: string, sessionId: string | null): SessionEditorDraft {
        const existingSession = campaign?.sessions.find((session) => session.id === sessionId);
        const existingSessionIndex = existingSession
            ? campaign?.sessions.findIndex((session) => session.id === existingSession.id) ?? -1
            : -1;

        return {
            id: sessionId ?? this.generateId('session'),
            title: existingSession?.title ?? '',
            shortDescription: existingSession?.objective ?? '',
            sessionNumber: existingSession
                ? Math.max(1, existingSessionIndex + 1)
                : (campaign?.sessions.length ?? 0) + 1,
            threatLevel: existingSession?.threat,
            campaignId,
            date: existingSession?.date ?? '',
            inGameLocation: existingSession?.location ?? '',
            estimatedLength: '',
            markdownNotes: '',
            scenes: [],
            npcs: [],
            monsters: [],
            locations: [],
            loot: [],
            skillChecks: [],
            secrets: [],
            branchingPaths: [],
            nextSessionHooks: []
        };
    }

    private patchDraft(draft: SessionEditorDraft): void {
        this.generationError.set('');
        this.editorForm.patchValue({
            title: draft.title,
            shortDescription: draft.shortDescription,
            sessionNumber: draft.sessionNumber,
            threatLevel: draft.threatLevel ?? '',
            campaignId: draft.campaignId,
            date: draft.date,
            inGameLocation: draft.inGameLocation,
            estimatedLength: draft.estimatedLength,
            markdownNotes: draft.markdownNotes
        }, { emitEvent: false });

        this.replaceArray(this.scenesArray, draft.scenes.map((scene) => this.createSceneForm(scene)));
        this.replaceArray(this.npcsArray, draft.npcs.map((npc) => this.createNpcForm(npc)));
        this.replaceArray(this.monstersArray, draft.monsters.map((monster) => this.createMonsterForm(monster)));
        this.replaceArray(this.locationsArray, draft.locations.map((location) => this.createLocationForm(location)));
        this.replaceArray(this.lootArray, draft.loot.map((lootItem) => this.createLootForm(lootItem)));
        this.replaceArray(this.skillChecksArray, draft.skillChecks.map((skillCheck) => this.createSkillCheckForm(skillCheck)));
        this.replaceArray(this.secretsArray, draft.secrets.map((entry) => this.createTextEntryForm(entry)));
        this.replaceArray(this.branchingPathsArray, draft.branchingPaths.map((entry) => this.createTextEntryForm(entry)));
        this.replaceArray(this.nextSessionHooksArray, draft.nextSessionHooks.map((entry) => this.createTextEntryForm(entry)));

        this.updateMarkdownPreview(draft.markdownNotes);
    }

    private toDraft(): SessionEditorDraft {
        return {
            id: this.sessionId() ?? this.generateId('session'),
            title: this.titleControl.value.trim(),
            shortDescription: this.editorForm.controls.shortDescription.value.trim(),
            sessionNumber: this.editorForm.controls.sessionNumber.value,
            threatLevel: this.editorForm.controls.threatLevel.value || undefined,
            campaignId: this.editorForm.controls.campaignId.value,
            date: this.editorForm.controls.date.value.trim(),
            inGameLocation: this.editorForm.controls.inGameLocation.value.trim(),
            estimatedLength: this.editorForm.controls.estimatedLength.value.trim(),
            markdownNotes: this.notesControl.value,
            scenes: this.scenesArray.controls.map((scene) => ({
                id: scene.controls.id.value,
                title: scene.controls.title.value.trim(),
                description: scene.controls.description.value.trim(),
                trigger: scene.controls.trigger.value.trim(),
                keyEvents: scene.controls.keyEvents.controls.map((entry) => entry.value.trim()).filter(Boolean),
                possibleOutcomes: scene.controls.possibleOutcomes.controls.map((entry) => entry.value.trim()).filter(Boolean)
            })),
            npcs: this.npcsArray.controls.map((npc) => ({
                id: npc.controls.id.value,
                name: npc.controls.name.value.trim(),
                role: npc.controls.role.value.trim(),
                personality: npc.controls.personality.value.trim(),
                motivation: npc.controls.motivation.value.trim(),
                voiceNotes: npc.controls.voiceNotes.value.trim()
            })),
            monsters: this.monstersArray.controls.map((monster) => ({
                id: monster.controls.id.value,
                name: monster.controls.name.value.trim(),
                type: monster.controls.type.value.trim(),
                challengeRating: monster.controls.challengeRating.value.trim(),
                hp: monster.controls.hp.value,
                keyAbilities: monster.controls.keyAbilities.value.trim(),
                notes: monster.controls.notes.value.trim()
            })),
            locations: this.locationsArray.controls.map((location) => ({
                id: location.controls.id.value,
                name: location.controls.name.value.trim(),
                description: location.controls.description.value.trim(),
                secrets: location.controls.secrets.value.trim(),
                encounters: location.controls.encounters.value.trim()
            })),
            loot: this.lootArray.controls.map((lootItem) => ({
                id: lootItem.controls.id.value,
                name: lootItem.controls.name.value.trim(),
                type: lootItem.controls.type.value.trim(),
                quantity: lootItem.controls.quantity.value,
                notes: lootItem.controls.notes.value.trim()
            })),
            skillChecks: this.skillChecksArray.controls.map((skillCheck) => ({
                id: skillCheck.controls.id.value,
                situation: skillCheck.controls.situation.value.trim(),
                skill: skillCheck.controls.skill.value.trim(),
                dc: skillCheck.controls.dc.value,
                successOutcome: skillCheck.controls.successOutcome.value.trim(),
                failureOutcome: skillCheck.controls.failureOutcome.value.trim()
            })),
            secrets: this.secretsArray.controls.map((entry) => this.textEntryFromForm(entry)).filter((entry) => entry.text),
            branchingPaths: this.branchingPathsArray.controls.map((entry) => this.textEntryFromForm(entry)).filter((entry) => entry.text),
            nextSessionHooks: this.nextSessionHooksArray.controls.map((entry) => this.textEntryFromForm(entry)).filter((entry) => entry.text)
        };
    }

    private mergeGeneratedDraft(currentDraft: SessionEditorDraft, generated: ApiGenerateSessionDraftResponse): SessionEditorDraft {
        return {
            ...currentDraft,
            title: generated.title || currentDraft.title,
            shortDescription: generated.shortDescription || currentDraft.shortDescription,
            date: generated.date || currentDraft.date,
            inGameLocation: generated.inGameLocation || currentDraft.inGameLocation,
            estimatedLength: generated.estimatedLength || currentDraft.estimatedLength,
            markdownNotes: generated.markdownNotes || currentDraft.markdownNotes,
            scenes: generated.scenes.map((scene) => ({
                id: this.generateId('scene'),
                title: scene.title,
                description: scene.description,
                trigger: scene.trigger,
                keyEvents: scene.keyEvents,
                possibleOutcomes: scene.possibleOutcomes
            })),
            npcs: generated.npcs.map((npc) => ({
                id: this.generateId('npc'),
                name: npc.name,
                role: npc.role,
                personality: npc.personality,
                motivation: npc.motivation,
                voiceNotes: npc.voiceNotes
            })),
            monsters: generated.monsters.map((monster) => ({
                id: this.generateId('monster'),
                name: monster.name,
                type: monster.type,
                challengeRating: monster.challengeRating,
                hp: monster.hp,
                keyAbilities: monster.keyAbilities,
                notes: monster.notes
            })),
            locations: generated.locations.map((location) => ({
                id: this.generateId('location'),
                name: location.name,
                description: location.description,
                secrets: location.secrets,
                encounters: location.encounters
            })),
            loot: generated.loot.map((lootItem) => ({
                id: this.generateId('loot'),
                name: lootItem.name,
                type: lootItem.type,
                quantity: lootItem.quantity,
                notes: lootItem.notes
            })),
            skillChecks: generated.skillChecks.map((skillCheck) => ({
                id: this.generateId('skill-check'),
                situation: skillCheck.situation,
                skill: skillCheck.skill,
                dc: skillCheck.dc,
                successOutcome: skillCheck.successOutcome,
                failureOutcome: skillCheck.failureOutcome
            })),
            secrets: generated.secrets.map((entry) => ({ id: this.generateId('secret'), text: entry })),
            branchingPaths: generated.branchingPaths.map((entry) => ({ id: this.generateId('path'), text: entry })),
            nextSessionHooks: generated.nextSessionHooks.map((entry) => ({ id: this.generateId('hook'), text: entry }))
        };
    }

    // The API still stores only the lightweight session summary, so the rich planning draft
    // is synced locally while these summary fields keep the campaign session list up to date.
    private toCampaignSessionSummary(draft: SessionEditorDraft): { title: string; date: string; location: string; objective: string; threat: ThreatLevel } {
        const firstSceneTitle = draft.scenes.find((scene) => scene.title)?.title ?? '';

        return {
            title: draft.title,
            date: draft.date,
            location: draft.inGameLocation,
            objective: draft.shortDescription || firstSceneTitle || 'Session prep in progress.',
            threat: draft.threatLevel ?? this.deriveThreatFromDraft(draft)
        };
    }

    private deriveThreatFromDraft(draft: SessionEditorDraft): ThreatLevel {
        const note = `${draft.shortDescription} ${draft.markdownNotes}`.toLowerCase();
        if (note.includes('deadly')) {
            return 'Deadly';
        }
        if (note.includes('high')) {
            return 'High';
        }
        if (note.includes('low')) {
            return 'Low';
        }
        return 'Moderate';
    }

    private findPersistedSessionId(summary: { title: string; date: string; location: string; objective: string; threat: ThreatLevel }): string | null {
        const campaign = this.currentCampaign();
        const match = campaign?.sessions.find((session) =>
            session.title === summary.title
            && session.date === summary.date
            && session.location === summary.location
            && session.objective === summary.objective);

        return match?.id ?? null;
    }

    private autosaveDraft(): void {
        const draft = this.toDraft();
        persistStoredSessionEditorDraft(this.campaignId(), this.sessionId() ?? 'new', draft);
        this.lastAutosavedAt.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    private updateMarkdownPreview(value: string): void {
        this.markdownPreview.set(String(marked.parse(value || '_No notes yet._')));
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

    private textEntryFromForm(entry: TextEntryForm): SessionTextEntry {
        return {
            id: entry.controls.id.value,
            text: entry.controls.text.value.trim()
        };
    }

    private replaceArray<TControl extends FormControl | FormGroup>(array: FormArray<TControl>, controls: TControl[]): void {
        while (array.length > 0) {
            array.removeAt(0);
        }

        for (const control of controls) {
            array.push(control);
        }
    }

    private createSceneForm(scene?: SessionScene): SceneForm {
        return this.fb.group({
            id: this.fb.control(scene?.id ?? this.generateId('scene')),
            title: this.fb.control(scene?.title ?? '', { validators: [Validators.required] }),
            description: this.fb.control(scene?.description ?? ''),
            trigger: this.fb.control(scene?.trigger ?? ''),
            keyEvents: this.fb.array((scene?.keyEvents ?? []).map((entry) => this.fb.control(entry))),
            possibleOutcomes: this.fb.array((scene?.possibleOutcomes ?? []).map((entry) => this.fb.control(entry)))
        });
    }

    private createNpcForm(npc?: SessionNpc): NpcForm {
        return this.fb.group({
            id: this.fb.control(npc?.id ?? this.generateId('npc')),
            name: this.fb.control(npc?.name ?? '', { validators: [Validators.required] }),
            role: this.fb.control(npc?.role ?? ''),
            personality: this.fb.control(npc?.personality ?? ''),
            motivation: this.fb.control(npc?.motivation ?? ''),
            voiceNotes: this.fb.control(npc?.voiceNotes ?? '')
        });
    }

    private createMonsterForm(monster?: SessionMonster): MonsterForm {
        return this.fb.group({
            id: this.fb.control(monster?.id ?? this.generateId('monster')),
            name: this.fb.control(monster?.name ?? '', { validators: [Validators.required] }),
            type: this.fb.control(monster?.type ?? ''),
            challengeRating: this.fb.control(monster?.challengeRating ?? ''),
            hp: this.fb.control(monster?.hp ?? 0),
            keyAbilities: this.fb.control(monster?.keyAbilities ?? ''),
            notes: this.fb.control(monster?.notes ?? '')
        });
    }

    private createLocationForm(location?: SessionLocation): LocationForm {
        return this.fb.group({
            id: this.fb.control(location?.id ?? this.generateId('location')),
            name: this.fb.control(location?.name ?? '', { validators: [Validators.required] }),
            description: this.fb.control(location?.description ?? ''),
            secrets: this.fb.control(location?.secrets ?? ''),
            encounters: this.fb.control(location?.encounters ?? '')
        });
    }

    private createLootForm(lootItem?: SessionLootItem): LootForm {
        return this.fb.group({
            id: this.fb.control(lootItem?.id ?? this.generateId('loot')),
            name: this.fb.control(lootItem?.name ?? '', { validators: [Validators.required] }),
            type: this.fb.control(lootItem?.type ?? ''),
            quantity: this.fb.control(lootItem?.quantity ?? 1),
            notes: this.fb.control(lootItem?.notes ?? '')
        });
    }

    private createSkillCheckForm(skillCheck?: SessionSkillCheck): SkillCheckForm {
        return this.fb.group({
            id: this.fb.control(skillCheck?.id ?? this.generateId('skill-check')),
            situation: this.fb.control(skillCheck?.situation ?? '', { validators: [Validators.required] }),
            skill: this.fb.control(skillCheck?.skill ?? ''),
            dc: this.fb.control(skillCheck?.dc ?? 10),
            successOutcome: this.fb.control(skillCheck?.successOutcome ?? ''),
            failureOutcome: this.fb.control(skillCheck?.failureOutcome ?? '')
        });
    }

    private createTextEntryForm(entry?: SessionTextEntry): TextEntryForm {
        return this.fb.group({
            id: this.fb.control(entry?.id ?? this.generateId('entry')),
            text: this.fb.control(entry?.text ?? '')
        });
    }

    private generateId(prefix: string): string {
        return `${prefix}-${crypto.randomUUID()}`;
    }
}