import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CharacteristicsModalComponent } from '../../components/characteristics-modal/characteristics-modal.component';
import { DropdownComponent, DropdownOption } from '../../components/dropdown/dropdown.component';
import { CampaignNpc, NpcDisposition, NpcRelationship } from '../../models/campaign-npc.models';
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

@Component({
    selector: 'app-npc-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DropdownComponent, CharacteristicsModalComponent],
    templateUrl: './npc-editor.component.html',
    styleUrl: './npc-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NpcEditorComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

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