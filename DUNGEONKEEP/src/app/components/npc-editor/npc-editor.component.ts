import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CharacterPortraitCropModalComponent } from '../../components/character-portrait-crop-modal/character-portrait-crop-modal.component';
import { CharacterPortraitModalComponent } from '../../components/character-portrait-modal/character-portrait-modal.component';
import { CharacteristicsModalComponent } from '../../components/characteristics-modal/characteristics-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { CampaignNpc, NpcDisposition, NpcRelationship } from '../../models/campaign-npc.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { sanitizeNpc, touchNpc } from '../../data/campaign-npc.helpers';

type StringListControl = FormArray<FormControl<string>>;
type CharacteristicType = 'traits' | 'ideals' | 'bonds' | 'flaws' | 'mannerisms';

type RelationshipForm = FormGroup<{
    id: FormControl<string>;
    targetNpcId: FormControl<string>;
    customTarget: FormControl<string>;
    relationshipType: FormControl<string>;
    description: FormControl<string>;
}>;

type NpcEditorForm = FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    title: FormControl<string>;
    race: FormControl<string>;
    classOrRole: FormControl<string>;
    faction: FormControl<string>;
    occupation: FormControl<string>;
    age: FormControl<string>;
    gender: FormControl<string>;
    alignment: FormControl<string>;
    currentStatus: FormControl<string>;
    location: FormControl<string>;
    shortDescription: FormControl<string>;
    appearance: FormControl<string>;
    personalityTraits: StringListControl;
    ideals: StringListControl;
    bonds: StringListControl;
    flaws: StringListControl;
    motivations: FormControl<string>;
    goals: FormControl<string>;
    fears: FormControl<string>;
    secrets: StringListControl;
    mannerisms: StringListControl;
    voiceNotes: FormControl<string>;
    backstory: FormControl<string>;
    notes: FormControl<string>;
    combatNotes: FormControl<string>;
    statBlockReference: FormControl<string>;
    tags: StringListControl;
    relationships: FormArray<RelationshipForm>;
    questLinks: StringListControl;
    sessionAppearances: StringListControl;
    inventory: StringListControl;
    imageUrl: FormControl<string>;
    hostility: FormControl<NpcDisposition>;
    isAlive: FormControl<boolean>;
    isImportant: FormControl<boolean>;
    updatedAt: FormControl<string>;
}>;

interface NpcGenerationPrompt {
    nameHint: string;
    titleHint: string;
    raceHint: string;
    roleHint: string;
    factionHint: string;
    locationHint: string;
    motivationHint: string;
    functionHint: string;
    toneHint: string;
    campaignTieHint: string;
    notesHint: string;
}

type NpcEditorMode = 'standard' | 'ai';

const NPC_PORTRAIT_STORAGE_MAX_DIMENSION = 768;
const NPC_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH = 240_000;

@Component({
    selector: 'app-npc-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DropdownComponent, CharacteristicsModalComponent, CharacterPortraitModalComponent, CharacterPortraitCropModalComponent],
    templateUrl: './npc-editor.component.html',
    styleUrl: './npc-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcEditorComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly api = inject(DungeonApiService);

    readonly npc = input<CampaignNpc | null>(null);
    readonly canEdit = input<boolean>(false);
    readonly nameConflict = input<boolean>(false);
    readonly autosaveLabel = input<string>('Autosave is ready');
    readonly showAutosave = input<boolean>(true);
    readonly generationBusy = input<boolean>(false);
    readonly generationError = input<string>('');
    readonly relationshipTargets = input.required<ReadonlyArray<DropdownOption>>();
    readonly showSaveToLibraryAction = input<boolean>(true);
    readonly showDuplicateAction = input<boolean>(true);
    readonly showDeleteAction = input<boolean>(true);
    readonly isSaving = input<boolean>(false);

    readonly draftChanged = output<CampaignNpc>();
    readonly saveNpc = output<CampaignNpc>();
    readonly generateNpc = output<NpcGenerationPrompt>();
    readonly saveToLibrary = output<void>();
    readonly duplicateNpc = output<void>();
    readonly deleteNpc = output<void>();

    readonly submitAttempted = signal(false);
    readonly editorMode = signal<NpcEditorMode>('standard');
    readonly activeCharacteristicModal = signal<CharacteristicType | null>(null);
    readonly characteristicModalValues = signal<string[]>([]);
    readonly portraitPromptDetails = signal('');
    readonly portraitSaveMessage = signal('');
    readonly portraitGenerationError = signal('');
    readonly isSavingPortrait = signal(false);
    readonly isGeneratingPortrait = signal(false);
    readonly portraitModalOpen = signal(false);
    readonly portraitCropModalOpen = signal(false);
    readonly portraitCropSourceImageUrl = signal('');
    readonly portraitOriginalImageUrl = signal('');
    private readonly lastEmittedDraftJson = signal('');
    readonly generationPrompt = signal<NpcGenerationPrompt>({
        nameHint: '',
        titleHint: '',
        raceHint: '',
        roleHint: '',
        factionHint: '',
        locationHint: '',
        motivationHint: '',
        functionHint: '',
        toneHint: '',
        campaignTieHint: '',
        notesHint: ''
    });

    readonly npcFunctionOptions: DropdownOption[] = [
        { value: 'Ally', label: 'Ally' },
        { value: 'Quest giver', label: 'Quest giver' },
        { value: 'Rival', label: 'Rival' },
        { value: 'Suspect', label: 'Suspect' },
        { value: 'Patron', label: 'Patron' },
        { value: 'Villain', label: 'Villain' },
        { value: 'Comic relief', label: 'Comic relief' }
    ];

    readonly npcToneOptions: DropdownOption[] = [
        { value: 'Warm', label: 'Warm' },
        { value: 'Sinister', label: 'Sinister' },
        { value: 'Tragic', label: 'Tragic' },
        { value: 'Eccentric', label: 'Eccentric' },
        { value: 'Smug', label: 'Smug' },
        { value: 'Desperate', label: 'Desperate' }
    ];

    readonly relationshipTypeOptions: DropdownOption[] = [
        { value: 'Ally', label: 'Ally' },
        { value: 'Enemy', label: 'Enemy' },
        { value: 'Patron', label: 'Patron' },
        { value: 'Family', label: 'Family' },
        { value: 'Debtor', label: 'Debtor' },
        { value: 'Informant', label: 'Informant' },
        { value: 'Rival', label: 'Rival' }
    ];

    readonly editorForm: NpcEditorForm = this.fb.group({
        id: this.fb.control(''),
        name: this.fb.control('', { validators: [Validators.required] }),
        title: this.fb.control(''),
        race: this.fb.control(''),
        classOrRole: this.fb.control(''),
        faction: this.fb.control(''),
        occupation: this.fb.control(''),
        age: this.fb.control(''),
        gender: this.fb.control(''),
        alignment: this.fb.control(''),
        currentStatus: this.fb.control(''),
        location: this.fb.control(''),
        shortDescription: this.fb.control(''),
        appearance: this.fb.control(''),
        personalityTraits: this.fb.array<FormControl<string>>([]),
        ideals: this.fb.array<FormControl<string>>([]),
        bonds: this.fb.array<FormControl<string>>([]),
        flaws: this.fb.array<FormControl<string>>([]),
        motivations: this.fb.control(''),
        goals: this.fb.control(''),
        fears: this.fb.control(''),
        secrets: this.fb.array<FormControl<string>>([]),
        mannerisms: this.fb.array<FormControl<string>>([]),
        voiceNotes: this.fb.control(''),
        backstory: this.fb.control(''),
        notes: this.fb.control(''),
        combatNotes: this.fb.control(''),
        statBlockReference: this.fb.control(''),
        tags: this.fb.array<FormControl<string>>([]),
        relationships: this.fb.array<RelationshipForm>([]),
        questLinks: this.fb.array<FormControl<string>>([]),
        sessionAppearances: this.fb.array<FormControl<string>>([]),
        inventory: this.fb.array<FormControl<string>>([]),
        imageUrl: this.fb.control(''),
        hostility: this.fb.control('Indifferent' as NpcDisposition),
        isAlive: this.fb.control(true),
        isImportant: this.fb.control(false),
        updatedAt: this.fb.control('')
    });

    readonly nameControl = this.editorForm.controls.name;
    readonly activeNpcName = computed(() => this.editorForm.controls.name.value.trim() || 'NPC Record');

    constructor() {
        effect(() => {
            const npc = this.npc();

            if (!npc) {
                return;
            }

            const incomingDraftJson = JSON.stringify(npc);
            const isLocalAutosaveEcho = incomingDraftJson === this.lastEmittedDraftJson()
                && npc.id === this.editorForm.controls.id.value;

            if (isLocalAutosaveEcho) {
                return;
            }

            this.submitAttempted.set(false);
            this.editorMode.set('standard');
            this.generationPrompt.set(this.createGenerationPrompt(npc));
            this.portraitPromptDetails.set('');
            this.portraitSaveMessage.set('');
            this.portraitGenerationError.set('');
            this.portraitOriginalImageUrl.set(this.readStoredPortraitOriginalImageUrl(npc.id));

            this.patchForm(npc);
        });

        this.editorForm.valueChanges
            .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const npc = this.npc();
                if (!npc) {
                    return;
                }

                const draft = this.currentDraft();
                this.lastEmittedDraftJson.set(JSON.stringify(draft));
                this.draftChanged.emit(draft);
            });
    }

    addStringItem(array: StringListControl): void {
        array.push(this.fb.control(''));
    }

    removeStringItem(array: StringListControl, index: number): void {
        array.removeAt(index);
    }

    addRelationship(): void {
        this.editorForm.controls.relationships.push(this.createRelationshipForm());
    }

    removeRelationship(index: number): void {
        this.editorForm.controls.relationships.removeAt(index);
    }

    updateRelationshipTarget(relationship: RelationshipForm, value: string | number): void {
        const nextValue = typeof value === 'string' ? value : '';
        relationship.controls.targetNpcId.setValue(nextValue);

        if (nextValue) {
            relationship.controls.customTarget.setValue('');
        }
    }

    updateRelationshipCustomTarget(relationship: RelationshipForm, value: string): void {
        relationship.controls.customTarget.setValue(value);

        if (value.trim()) {
            relationship.controls.targetNpcId.setValue('');
        }
    }

    updateRelationshipType(control: FormControl<string>, value: string | number): void {
        control.setValue(typeof value === 'string' ? value : '');
    }

    selectEditorMode(mode: NpcEditorMode): void {
        if (mode === 'ai') {
            this.generationPrompt.set(this.createGenerationPrompt(this.currentDraft()));
        }

        this.editorMode.set(mode);
    }

    openCharacteristicModal(type: CharacteristicType): void {
        this.characteristicModalValues.set(
            this.getCharacteristicControl(type).controls
                .map((control) => control.value.trim())
                .filter(Boolean)
        );
        this.activeCharacteristicModal.set(type);
    }

    closeCharacteristicModal(): void {
        this.activeCharacteristicModal.set(null);
        this.characteristicModalValues.set([]);
    }

    onCharacteristicSubmit(values: string[]): void {
        const type = this.activeCharacteristicModal();
        if (!type) {
            this.closeCharacteristicModal();
            return;
        }

        this.replaceStringArray(this.getCharacteristicControl(type), values);
        this.closeCharacteristicModal();
    }

    removeCharacteristic(type: CharacteristicType, index: number): void {
        this.getCharacteristicControl(type).removeAt(index);
    }

    requestGenerateNpc(): void {
        this.generateNpc.emit(this.generationPrompt());
    }

    updateGenerationNameHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, nameHint: value }));
    }

    updateGenerationTitleHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, titleHint: value }));
    }

    updateGenerationRaceHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, raceHint: value }));
    }

    updateGenerationRoleHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, roleHint: value }));
    }

    updateGenerationFactionHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, factionHint: value }));
    }

    updateGenerationLocationHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, locationHint: value }));
    }

    updateGenerationMotivationHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, motivationHint: value }));
    }

    updateGenerationFunctionHint(value: string | number): void {
        this.generationPrompt.update((prompt) => ({
            ...prompt,
            functionHint: typeof value === 'string' ? value : ''
        }));
    }

    updateGenerationToneHint(value: string | number): void {
        this.generationPrompt.update((prompt) => ({
            ...prompt,
            toneHint: typeof value === 'string' ? value : ''
        }));
    }

    updateGenerationCampaignTieHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, campaignTieHint: value }));
    }

    updateGenerationNotesHint(value: string): void {
        this.generationPrompt.update((prompt) => ({ ...prompt, notesHint: value }));
    }

    cycleHostility(): void {
        const currentValue = this.editorForm.controls.hostility.value;
        const nextValue: NpcDisposition = currentValue === 'Friendly'
            ? 'Indifferent'
            : currentValue === 'Indifferent'
                ? 'Hostile'
                : 'Friendly';

        this.editorForm.controls.hostility.setValue(nextValue);
    }

    hostilityToggleClass(): string {
        switch (this.editorForm.controls.hostility.value) {
            case 'Hostile':
                return 'toggle-pill--hostile';
            case 'Friendly':
                return 'toggle-pill--friendly';
            default:
                return 'toggle-pill--neutral';
        }
    }

    save(): void {
        this.submitAttempted.set(true);
        if (this.editorForm.invalid || this.nameConflict()) {
            this.editorForm.markAllAsTouched();
            this.cdr.detectChanges();
            return;
        }

        this.saveNpc.emit(this.currentDraft());
    }

    openPortraitModal(): void {
        if (!this.canEdit()) {
            return;
        }

        this.portraitModalOpen.set(true);
    }

    closePortraitModal(): void {
        this.portraitModalOpen.set(false);
    }

    closePortraitCropModal(): void {
        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
    }

    openPortraitRecrop(): void {
        const sourceImageUrl = this.portraitOriginalImageUrl().trim()
            || this.editorForm.controls.imageUrl.value.trim();
        if (!this.canEdit() || !sourceImageUrl || this.isSavingPortrait() || this.isGeneratingPortrait()) {
            return;
        }

        if (!this.portraitOriginalImageUrl().trim()) {
            this.storePortraitOriginalImageUrl(this.editorForm.controls.id.value, sourceImageUrl);
        }

        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
        this.portraitCropSourceImageUrl.set(sourceImageUrl);
        this.portraitCropModalOpen.set(true);
    }

    async onPortraitFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file) {
            return;
        }

        try {
            const imageUrl = await this.optimizePortraitForStorage(await this.readPortraitFile(file));
            this.storePortraitOriginalImageUrl(this.editorForm.controls.id.value, imageUrl);
            this.portraitCropSourceImageUrl.set(imageUrl);
            this.portraitCropModalOpen.set(true);
        } catch (error) {
            this.portraitGenerationError.set(error instanceof Error ? error.message : 'Unable to use that image right now.');
        } finally {
            if (input) {
                input.value = '';
            }

            this.cdr.detectChanges();
        }
    }

    async generatePortrait(): Promise<void> {
        if (!this.canEdit() || this.isGeneratingPortrait()) {
            return;
        }

        this.isGeneratingPortrait.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');

        try {
            const response = await this.api.generateCharacterPortrait({
                name: this.editorForm.controls.name.value.trim() || 'NPC',
                className: this.editorForm.controls.classOrRole.value.trim() || this.editorForm.controls.occupation.value.trim() || this.editorForm.controls.title.value.trim() || 'NPC',
                background: this.editorForm.controls.faction.value.trim() || this.editorForm.controls.location.value.trim() || 'Campaign NPC',
                species: this.editorForm.controls.race.value.trim(),
                alignment: this.editorForm.controls.alignment.value.trim(),
                gender: this.editorForm.controls.gender.value.trim(),
                additionalDirection: this.buildPortraitAdditionalDirection(this.portraitPromptDetails().trim())
            });

            const optimizedImageUrl = await this.optimizePortraitForStorage(response.imageUrl);
            this.storePortraitOriginalImageUrl(this.editorForm.controls.id.value, optimizedImageUrl);
            await this.persistPortrait(optimizedImageUrl, 'Portrait generated and saved.');
        } catch (error) {
            this.portraitGenerationError.set(this.getPortraitGenerationErrorMessage(error));
        } finally {
            this.isGeneratingPortrait.set(false);
            this.cdr.detectChanges();
        }
    }

    async clearPortrait(): Promise<void> {
        if (!this.canEdit() || this.isSavingPortrait()) {
            return;
        }

        this.storePortraitOriginalImageUrl(this.editorForm.controls.id.value, '');
        await this.persistPortrait('', 'Portrait removed.');
    }

    async applyPortraitCrop(croppedImageUrl: string): Promise<void> {
        const sourceImageUrl = this.portraitOriginalImageUrl().trim()
            || this.portraitCropSourceImageUrl().trim()
            || this.editorForm.controls.imageUrl.value.trim();
        const optimizedImageUrl = await this.optimizePortraitForStorage(croppedImageUrl);

        if (sourceImageUrl) {
            this.storePortraitOriginalImageUrl(this.editorForm.controls.id.value, sourceImageUrl);
        }

        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
        await this.persistPortrait(optimizedImageUrl, 'Portrait updated.');
    }

    private currentDraft(): CampaignNpc {
        const current = this.npc();
        const draft: CampaignNpc = {
            id: this.editorForm.controls.id.value,
            name: this.editorForm.controls.name.value,
            title: this.editorForm.controls.title.value,
            race: this.editorForm.controls.race.value,
            classOrRole: this.editorForm.controls.classOrRole.value,
            faction: this.editorForm.controls.faction.value,
            occupation: this.editorForm.controls.occupation.value,
            age: this.editorForm.controls.age.value,
            gender: this.editorForm.controls.gender.value,
            alignment: this.editorForm.controls.alignment.value,
            currentStatus: this.editorForm.controls.currentStatus.value,
            location: this.editorForm.controls.location.value,
            shortDescription: this.editorForm.controls.shortDescription.value,
            appearance: this.editorForm.controls.appearance.value,
            personalityTraits: this.stringArrayValue(this.editorForm.controls.personalityTraits),
            ideals: this.stringArrayValue(this.editorForm.controls.ideals),
            bonds: this.stringArrayValue(this.editorForm.controls.bonds),
            flaws: this.stringArrayValue(this.editorForm.controls.flaws),
            motivations: this.editorForm.controls.motivations.value,
            goals: this.editorForm.controls.goals.value,
            fears: this.editorForm.controls.fears.value,
            secrets: this.stringArrayValue(this.editorForm.controls.secrets),
            mannerisms: this.stringArrayValue(this.editorForm.controls.mannerisms),
            voiceNotes: this.editorForm.controls.voiceNotes.value,
            backstory: this.editorForm.controls.backstory.value,
            notes: this.editorForm.controls.notes.value,
            combatNotes: this.editorForm.controls.combatNotes.value,
            statBlockReference: this.editorForm.controls.statBlockReference.value,
            tags: this.stringArrayValue(this.editorForm.controls.tags),
            relationships: this.relationshipValue(this.editorForm.controls.relationships),
            questLinks: this.stringArrayValue(this.editorForm.controls.questLinks),
            sessionAppearances: this.stringArrayValue(this.editorForm.controls.sessionAppearances),
            inventory: this.stringArrayValue(this.editorForm.controls.inventory),
            imageUrl: this.editorForm.controls.imageUrl.value,
            hostility: this.editorForm.controls.hostility.value,
            isAlive: this.editorForm.controls.isAlive.value,
            isImportant: this.editorForm.controls.isImportant.value,
            updatedAt: this.editorForm.controls.updatedAt.value || current?.updatedAt || new Date().toISOString()
        };

        return sanitizeNpc(touchNpc(draft));
    }

    private patchForm(npc: CampaignNpc): void {
        this.editorForm.patchValue({
            id: npc.id,
            name: npc.name,
            title: npc.title,
            race: npc.race,
            classOrRole: npc.classOrRole,
            faction: npc.faction,
            occupation: npc.occupation,
            age: npc.age,
            gender: npc.gender,
            alignment: npc.alignment,
            currentStatus: npc.currentStatus,
            location: npc.location,
            shortDescription: npc.shortDescription,
            appearance: npc.appearance,
            motivations: npc.motivations,
            goals: npc.goals,
            fears: npc.fears,
            voiceNotes: npc.voiceNotes,
            backstory: npc.backstory,
            notes: npc.notes,
            combatNotes: npc.combatNotes,
            statBlockReference: npc.statBlockReference,
            imageUrl: npc.imageUrl,
            hostility: npc.hostility,
            isAlive: npc.isAlive,
            isImportant: npc.isImportant,
            updatedAt: npc.updatedAt
        }, { emitEvent: false });

        this.replaceStringArray(this.editorForm.controls.personalityTraits, npc.personalityTraits);
        this.replaceStringArray(this.editorForm.controls.ideals, npc.ideals);
        this.replaceStringArray(this.editorForm.controls.bonds, npc.bonds);
        this.replaceStringArray(this.editorForm.controls.flaws, npc.flaws);
        this.replaceStringArray(this.editorForm.controls.secrets, npc.secrets);
        this.replaceStringArray(this.editorForm.controls.mannerisms, npc.mannerisms);
        this.replaceStringArray(this.editorForm.controls.tags, npc.tags);
        this.replaceStringArray(this.editorForm.controls.questLinks, npc.questLinks);
        this.replaceStringArray(this.editorForm.controls.sessionAppearances, npc.sessionAppearances);
        this.replaceStringArray(this.editorForm.controls.inventory, npc.inventory);
        this.replaceRelationshipArray(this.editorForm.controls.relationships, npc.relationships);
    }

    private createGenerationPrompt(npc: CampaignNpc): NpcGenerationPrompt {
        return {
            nameHint: npc.name,
            titleHint: npc.title,
            raceHint: npc.race,
            roleHint: npc.classOrRole,
            factionHint: npc.faction,
            locationHint: npc.location,
            motivationHint: npc.motivations,
            functionHint: npc.isImportant ? 'Quest giver' : '',
            toneHint: '',
            campaignTieHint: npc.questLinks[0] ?? '',
            notesHint: npc.notes
        };
    }

    private buildPortraitAdditionalDirection(manualDirection: string): string {
        const details = [
            this.editorForm.controls.title.value.trim() ? `Title: ${this.editorForm.controls.title.value.trim()}` : '',
            this.editorForm.controls.classOrRole.value.trim() ? `Role: ${this.editorForm.controls.classOrRole.value.trim()}` : '',
            this.editorForm.controls.occupation.value.trim() ? `Occupation: ${this.editorForm.controls.occupation.value.trim()}` : '',
            this.editorForm.controls.shortDescription.value.trim() ? `Short description: ${this.editorForm.controls.shortDescription.value.trim()}` : '',
            this.editorForm.controls.appearance.value.trim() ? `Appearance: ${this.editorForm.controls.appearance.value.trim()}` : '',
            this.editorForm.controls.location.value.trim() ? `Location: ${this.editorForm.controls.location.value.trim()}` : '',
            this.editorForm.controls.currentStatus.value.trim() ? `Current status: ${this.editorForm.controls.currentStatus.value.trim()}` : ''
        ].filter(Boolean);

        const detailsSummary = details.length > 0
            ? `Use these known NPC details: ${details.join('; ')}`
            : '';

        if (detailsSummary && manualDirection) {
            return `${detailsSummary}\nRequested art direction: ${manualDirection}`;
        }

        return detailsSummary || manualDirection;
    }

    private async persistPortrait(imageUrl: string, successMessage: string): Promise<void> {
        if (this.isSavingPortrait()) {
            return;
        }

        this.isSavingPortrait.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');

        try {
            this.editorForm.controls.imageUrl.setValue(await this.optimizePortraitForStorage(imageUrl));
            this.portraitSaveMessage.set(successMessage);
        } catch {
            this.portraitGenerationError.set('Unable to save portrait right now.');
        } finally {
            this.isSavingPortrait.set(false);
            this.cdr.detectChanges();
        }
    }

    private async optimizePortraitForStorage(imageUrl: string): Promise<string> {
        const trimmedImageUrl = imageUrl.trim();
        if (!trimmedImageUrl.startsWith('data:image/')) {
            return trimmedImageUrl;
        }

        if (trimmedImageUrl.length <= NPC_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH) {
            return trimmedImageUrl;
        }

        try {
            const image = await this.loadPortraitImage(trimmedImageUrl);
            const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
            const scale = longestEdge > NPC_PORTRAIT_STORAGE_MAX_DIMENSION
                ? NPC_PORTRAIT_STORAGE_MAX_DIMENSION / longestEdge
                : 1;
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            const canvas = globalThis.document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d');
            if (!context) {
                return trimmedImageUrl;
            }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, width, height);

            let bestImageUrl = trimmedImageUrl;
            const attempts: Array<{ type: 'image/webp' | 'image/jpeg'; quality: number }> = [
                { type: 'image/webp', quality: 0.9 },
                { type: 'image/jpeg', quality: 0.9 },
                { type: 'image/webp', quality: 0.82 },
                { type: 'image/jpeg', quality: 0.82 },
                { type: 'image/webp', quality: 0.72 },
                { type: 'image/jpeg', quality: 0.72 }
            ];

            for (const attempt of attempts) {
                const candidate = canvas.toDataURL(attempt.type, attempt.quality);
                if (candidate.length < bestImageUrl.length) {
                    bestImageUrl = candidate;
                }

                if (bestImageUrl.length <= NPC_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH) {
                    break;
                }
            }

            return bestImageUrl;
        } catch {
            return trimmedImageUrl;
        }
    }

    private loadPortraitImage(source: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = 'async';
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Portrait image failed to load for optimization.'));
            image.src = source;
        });
    }

    private readPortraitFile(file: File): Promise<string> {
        if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('Choose an image file for the portrait.'));
        }

        if (file.size > 8 * 1024 * 1024) {
            return Promise.reject(new Error('Choose an image smaller than 8 MB.'));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Unable to read that image file.'));
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                if (!result) {
                    reject(new Error('Unable to read that image file.'));
                    return;
                }

                resolve(result);
            };

            reader.readAsDataURL(file);
        });
    }

    private getPortraitGenerationErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            if (typeof error.error === 'string' && error.error.trim()) {
                return error.error.trim();
            }

            if (error.error && typeof error.error === 'object') {
                const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
                const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
                if (detail.trim() || title.trim()) {
                    return detail.trim() || title.trim();
                }
            }

            if (error.status === 0) {
                return 'Unable to reach the portrait service right now.';
            }
        }

        return error instanceof Error ? error.message : 'Unable to generate a portrait right now.';
    }

    private readStoredPortraitOriginalImageUrl(npcId: string): string {
        try {
            return globalThis.localStorage?.getItem(`dungeonkeep-npc-portrait-original:${npcId}`)?.trim() ?? '';
        } catch {
            return '';
        }
    }

    private storePortraitOriginalImageUrl(npcId: string, imageUrl: string): void {
        const trimmed = imageUrl.trim();
        this.portraitOriginalImageUrl.set(trimmed);

        try {
            if (!trimmed) {
                globalThis.localStorage?.removeItem(`dungeonkeep-npc-portrait-original:${npcId}`);
            } else {
                globalThis.localStorage?.setItem(`dungeonkeep-npc-portrait-original:${npcId}`, trimmed);
            }
        } catch {
            // Ignore browser storage failures and fall back to in-memory state.
        }
    }

    private replaceStringArray(array: StringListControl, values: readonly string[]): void {
        while (array.length > 0) {
            array.removeAt(0);
        }

        for (const value of values) {
            array.push(this.fb.control(value));
        }
    }

    private getCharacteristicControl(type: CharacteristicType): StringListControl {
        switch (type) {
            case 'traits':
                return this.editorForm.controls.personalityTraits;
            case 'ideals':
                return this.editorForm.controls.ideals;
            case 'bonds':
                return this.editorForm.controls.bonds;
            case 'flaws':
                return this.editorForm.controls.flaws;
            case 'mannerisms':
                return this.editorForm.controls.mannerisms;
        }
    }

    private replaceRelationshipArray(array: FormArray<RelationshipForm>, values: readonly NpcRelationship[]): void {
        while (array.length > 0) {
            array.removeAt(0);
        }

        for (const relationship of values) {
            array.push(this.createRelationshipForm(relationship));
        }
    }

    private stringArrayValue(array: StringListControl): string[] {
        return array.controls.map((control) => control.value.trim()).filter(Boolean);
    }

    private relationshipValue(array: FormArray<RelationshipForm>): NpcRelationship[] {
        return array.controls.map((relationship) => ({
            id: relationship.controls.id.value,
            targetNpcId: relationship.controls.customTarget.value.trim() || relationship.controls.targetNpcId.value.trim(),
            relationshipType: relationship.controls.relationshipType.value.trim(),
            description: relationship.controls.description.value.trim()
        })).filter((relationship) => relationship.targetNpcId || relationship.relationshipType || relationship.description);
    }

    private createRelationshipForm(relationship?: NpcRelationship): RelationshipForm {
        const rawTarget = relationship?.targetNpcId ?? '';
        const knownTarget = this.relationshipTargets().some((option) => String(option.value) === rawTarget);

        return this.fb.group({
            id: this.fb.control(relationship?.id ?? `npc-rel-${crypto.randomUUID()}`),
            targetNpcId: this.fb.control(knownTarget ? rawTarget : ''),
            customTarget: this.fb.control(knownTarget ? '' : rawTarget),
            relationshipType: this.fb.control(relationship?.relationshipType ?? ''),
            description: this.fb.control(relationship?.description ?? '')
        });
    }
}