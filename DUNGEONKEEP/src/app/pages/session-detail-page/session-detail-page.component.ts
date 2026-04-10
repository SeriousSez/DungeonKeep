import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { CampaignNpcPreviewModalComponent } from '../../components/campaign-npc-preview-modal/campaign-npc-preview-modal.component';
import { MonsterStatBlockModalComponent } from '../../components/monster-stat-block-modal/monster-stat-block-modal.component';
import { createDefaultNpc, sanitizeNpc, touchNpc } from '../../data/campaign-npc.helpers';
import { loadCampaignNpcDrafts, saveCampaignNpcDrafts } from '../../data/campaign-npc.storage';
import { monsterCatalog } from '../../data/monster-catalog.generated';
import { readStoredSessionEditorDraft } from '../../data/session-editor.storage';
import { CampaignNpc } from '../../models/campaign-npc.models';
import { SessionPrep, ThreatLevel } from '../../models/dungeon.models';
import { MonsterCatalogEntry } from '../../models/monster-reference.models';
import { SessionEditorDraft, SessionMonster, SessionNpc } from '../../models/session-editor.models';
import { ApiGenerateNpcDraftResponse, DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface SessionDetailFact {
    label: string;
    value: string;
}

interface SessionSectionLink {
    id: string;
    label: string;
}

interface SessionDetailView {
    id: string;
    title: string;
    shortDescription: string;
    sessionNumber: number;
    date: string;
    inGameLocation: string;
    estimatedLength: string;
    threatWasSetManually: boolean;
    threat: ThreatLevel;
    markdownNotes: string;
    scenes: SessionEditorDraft['scenes'];
    npcs: SessionEditorDraft['npcs'];
    monsters: SessionEditorDraft['monsters'];
    locations: SessionEditorDraft['locations'];
    loot: SessionEditorDraft['loot'];
    skillChecks: SessionEditorDraft['skillChecks'];
    secrets: SessionEditorDraft['secrets'];
    branchingPaths: SessionEditorDraft['branchingPaths'];
    nextSessionHooks: SessionEditorDraft['nextSessionHooks'];
}

const monsterCatalogByLookupKey = new Map<string, MonsterCatalogEntry>();
const monsterLookupStopWords = new Set(['the', 'a', 'an', 'of', 'and']);

for (const entry of monsterCatalog) {
    for (const key of buildMonsterLookupKeys(entry.name)) {
        if (!monsterCatalogByLookupKey.has(key)) {
            monsterCatalogByLookupKey.set(key, entry);
        }
    }
}

@Component({
    selector: 'app-session-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink, MonsterStatBlockModalComponent, CampaignNpcPreviewModalComponent],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailPageComponent {
    private readonly store = inject(DungeonStoreService);
    private readonly api = inject(DungeonApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly sessionId = signal('');
    readonly initialized = signal(false);
    readonly loadError = signal('');
    readonly storedDraft = signal<SessionEditorDraft | null>(null);
    readonly renderedMarkdown = signal('');
    readonly detailsLoadRequested = signal(false);
    readonly interactionMessage = signal('');
    readonly interactionError = signal('');
    readonly activeMonster = signal<MonsterCatalogEntry | null>(null);
    readonly activeCampaignNpc = signal<CampaignNpc | null>(null);
    readonly npcDraftVersion = signal(0);
    readonly activeNpcCreationName = signal('');
    readonly selectedSection = signal('all');

    readonly campaignNpcLookup = computed(() =>
        new Set((this.currentCampaign()?.npcs ?? []).map((name) => normalizeLookupValue(name)))
    );
    readonly storedCampaignNpcDraftMap = computed(() => {
        this.npcDraftVersion();

        return new Map(
            (loadCampaignNpcDrafts(this.campaignId()) ?? [])
                .map((npc) => sanitizeNpc(npc))
                .map((npc) => [normalizeLookupValue(npc.name), npc] as const)
        );
    });

    readonly currentCampaign = computed(() =>
        this.store.campaigns().find((campaign) => campaign.id === this.campaignId()) ?? null
    );
    readonly sessionSummary = computed(() =>
        this.currentCampaign()?.sessions.find((session) => session.id === this.sessionId()) ?? null
    );
    readonly canEdit = computed(() => this.currentCampaign()?.currentUserRole === 'Owner');
    readonly hasRichDraft = computed(() => this.storedDraft() !== null);
    readonly backLink = computed<readonly string[]>(() => ['/campaigns', this.campaignId(), 'sessions']);
    readonly editLink = computed<readonly string[]>(() => ['/campaigns', this.campaignId(), 'sessions', this.sessionId(), 'edit']);
    readonly pageSummary = computed(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return 'Detailed notes, scene flow, and encounter prep for the table.';
        }

        return detail.shortDescription || 'Detailed notes, scene flow, and encounter prep for the table.';
    });
    readonly overviewFacts = computed<SessionDetailFact[]>(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return [];
        }

        return [
            { label: 'Session', value: `#${detail.sessionNumber}` },
            { label: 'Date', value: detail.date || 'TBD' },
            { label: 'Location', value: detail.inGameLocation || 'Unrecorded' },
            { label: 'Length', value: detail.estimatedLength || 'Flexible' },
            { label: 'Threat', value: detail.threat },
            { label: 'Threat Source', value: detail.threatWasSetManually ? 'Manual selection' : 'Auto derived' },
            { label: 'Source', value: this.hasRichDraft() ? 'Local draft + campaign summary' : 'Campaign summary only' }
        ];
    });
    readonly sectionOptions = computed<SessionSectionLink[]>(() => {
        const detail = this.sessionDetail();
        if (!detail) {
            return [];
        }

        const options: SessionSectionLink[] = [
            { id: 'all', label: 'All' },
            { id: 'session-notes', label: 'Session Notes' }
        ];

        if (detail.scenes.length > 0) {
            options.push({
                id: 'session-scenes',
                label: 'Scenes'
            });
        }

        if (detail.npcs.length > 0 || detail.monsters.length > 0) {
            options.push({
                id: 'session-cast',
                label: 'NPCs and Monsters'
            });
        }

        if (detail.locations.length > 0 || detail.loot.length > 0) {
            options.push({
                id: 'session-terrain',
                label: 'Locations and Loot'
            });
        }

        if (detail.skillChecks.length > 0) {
            options.push({
                id: 'session-skill-checks',
                label: 'Skill Checks'
            });
        }

        if (detail.secrets.length > 0 || detail.branchingPaths.length > 0 || detail.nextSessionHooks.length > 0) {
            options.push({
                id: 'session-loose-ends',
                label: 'Secrets, Branches, and Hooks'
            });
        }

        return options;
    });
    readonly sessionDetail = computed<SessionDetailView | null>(() => {
        const summary = this.sessionSummary();
        const draft = this.storedDraft();
        const campaign = this.currentCampaign();

        if (!summary && !draft) {
            return null;
        }

        return {
            id: draft?.id || summary?.id || this.sessionId(),
            title: draft?.title || summary?.title || 'Untitled Session',
            shortDescription: draft?.shortDescription || summary?.objective || '',
            sessionNumber: draft?.sessionNumber ?? this.resolveSessionNumber(summary),
            date: draft?.date || summary?.date || '',
            inGameLocation: draft?.inGameLocation || summary?.location || '',
            estimatedLength: draft?.estimatedLength || '',
            threatWasSetManually: Boolean(draft?.threatLevel),
            threat: draft?.threatLevel ?? summary?.threat ?? this.deriveThreatFromDraft(draft),
            markdownNotes: this.resolveMarkdownNotes(summary, draft),
            scenes: draft?.scenes ?? [],
            npcs: draft?.npcs ?? [],
            monsters: draft?.monsters ?? [],
            locations: draft?.locations ?? [],
            loot: draft?.loot ?? [],
            skillChecks: draft?.skillChecks ?? [],
            secrets: draft?.secrets ?? [],
            branchingPaths: draft?.branchingPaths ?? [],
            nextSessionHooks: draft?.nextSessionHooks ?? []
        };
    });

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const campaignId = params.get('id') ?? '';
                this.campaignId.set(campaignId);
                this.sessionId.set(params.get('sessionId') ?? '');
                this.initialized.set(false);
                this.loadError.set('');
                this.storedDraft.set(null);
                this.renderedMarkdown.set('');
                this.detailsLoadRequested.set(false);
                this.interactionMessage.set('');
                this.interactionError.set('');
                this.activeMonster.set(null);
                this.activeCampaignNpc.set(null);
                this.selectedSection.set('all');
                this.cdr.detectChanges();
            });

        effect(() => {
            const campaignId = this.campaignId();
            const storeInitialized = this.store.initialized();
            const detailsLoadRequested = this.detailsLoadRequested();
            const detailsLoaded = this.currentCampaign()?.detailsLoaded === true;
            const detailsLoading = campaignId ? this.store.isCampaignDetailsLoading(campaignId) : false;

            if (!campaignId || !storeInitialized || detailsLoadRequested || detailsLoaded || detailsLoading) {
                return;
            }

            this.detailsLoadRequested.set(true);
            void this.store.ensureCampaignLoaded(campaignId);
        });

        effect(() => {
            const campaignId = this.campaignId();
            const sessionId = this.sessionId();
            const storeInitialized = this.store.initialized();

            if (!campaignId || !sessionId) {
                return;
            }

            const campaign = this.currentCampaign();
            if (!campaign) {
                if (!storeInitialized) {
                    return;
                }

                this.loadError.set('The requested campaign could not be found.');
                this.initialized.set(true);
                this.cdr.detectChanges();
                return;
            }

            const summary = campaign.sessions.find((session) => session.id === sessionId) ?? null;
            if (!campaign.detailsLoaded) {
                if (this.detailsLoadRequested() && !this.store.isCampaignDetailsLoading(campaignId)) {
                    this.loadError.set('The requested session details could not be loaded.');
                    this.initialized.set(true);
                    this.cdr.detectChanges();
                }
                return;
            }

            const draft = readStoredSessionEditorDraft(campaignId, sessionId);
            this.storedDraft.set(draft);

            if (!summary && !draft) {
                this.loadError.set('The requested session could not be found in this campaign.');
                this.initialized.set(true);
                this.cdr.detectChanges();
                return;
            }

            const markdown = this.resolveMarkdownNotes(summary, draft);
            this.renderedMarkdown.set(String(marked.parse(markdown || '_No session notes recorded yet._', { gfm: true, breaks: true })));
            this.loadError.set('');
            this.initialized.set(true);
            this.cdr.detectChanges();
        });
    }

    isCampaignNpc(name: string): boolean {
        return this.campaignNpcLookup().has(normalizeLookupValue(name));
    }

    hasStoredCampaignNpcDraft(name: string): boolean {
        return this.storedCampaignNpcDraftMap().has(normalizeLookupValue(name));
    }

    isCreatingCampaignNpc(name: string): boolean {
        return normalizeLookupValue(this.activeNpcCreationName()) === normalizeLookupValue(name);
    }

    resolveStoredCampaignNpc(name: string): CampaignNpc | null {
        return this.storedCampaignNpcDraftMap().get(normalizeLookupValue(name)) ?? null;
    }

    openStoredCampaignNpcModal(name: string): void {
        const npc = this.resolveStoredCampaignNpc(name);
        if (!npc) {
            return;
        }

        this.activeCampaignNpc.set(npc);
        this.cdr.detectChanges();
    }

    closeCampaignNpcModal(): void {
        this.activeCampaignNpc.set(null);
        this.cdr.detectChanges();
    }

    selectSection(sectionId: string): void {
        if (!sectionId.trim()) {
            return;
        }

        this.selectedSection.set(sectionId);
    }

    isSectionVisible(sectionId: string): boolean {
        const selectedSection = this.selectedSection();
        return selectedSection === 'all' || selectedSection === sectionId;
    }

    openStoredCampaignNpc(name: string): void {
        const npc = this.storedCampaignNpcDraftMap().get(normalizeLookupValue(name));
        if (!npc) {
            return;
        }

        void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', npc.id]);
    }

    editStoredCampaignNpc(name: string): void {
        const npc = this.resolveStoredCampaignNpc(name);
        if (!npc) {
            return;
        }

        void this.router.navigate(['/campaigns', this.campaignId(), 'npcs', npc.id, 'edit']);
    }

    async addNpcToCampaign(sessionNpc: SessionNpc): Promise<void> {
        const campaignId = this.campaignId();
        const trimmedName = sessionNpc.name.trim();

        if (!campaignId || !trimmedName || !this.canEdit()) {
            return;
        }

        if (this.isCreatingCampaignNpc(trimmedName)) {
            return;
        }

        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeNpcCreationName.set(trimmedName);

        try {
            const existingDraft = this.storedCampaignNpcDraftMap().get(normalizeLookupValue(trimmedName)) ?? null;
            if (existingDraft) {
                await this.router.navigate(['/campaigns', campaignId, 'npcs', existingDraft.id]);
                return;
            }

            let draft = this.buildCampaignNpcFromSessionNpc(sessionNpc);

            try {
                const generated = await this.api.generateNpcDraft(this.buildNpcGenerationRequest(sessionNpc));
                draft = this.mergeGeneratedNpcDraft(draft, generated);
            } catch (error) {
                this.interactionMessage.set(`Created ${trimmedName} from the session notes. AI enrichment was unavailable, so some fields may still need editing.`);
                this.interactionError.set('');
                const detail = this.readApiError(error, '');
                if (detail) {
                    this.interactionMessage.set(`Created ${trimmedName} from the session notes. AI enrichment was unavailable: ${detail}`);
                }
            }

            const savedNpc = this.persistCampaignNpcDraft(draft);
            let syncMessage = '';

            if (!this.isCampaignNpc(savedNpc.name)) {
                const added = await this.store.addCampaignNpc(campaignId, savedNpc.name);
                if (!added) {
                    syncMessage = ' The full NPC draft was saved locally, but the campaign NPC name list could not be synced.';
                }
            }

            if (!this.interactionMessage()) {
                this.interactionMessage.set(`${savedNpc.name} is now a full campaign NPC.${syncMessage}`);
            } else if (syncMessage) {
                this.interactionMessage.set(`${this.interactionMessage()}${syncMessage}`);
            }

            await this.router.navigate(['/campaigns', campaignId, 'npcs', savedNpc.id]);
        } finally {
            this.activeNpcCreationName.set('');
            this.cdr.detectChanges();
        }
    }

    resolveMonsterCatalogEntry(monster: SessionMonster | string): MonsterCatalogEntry | null {
        const monsterName = typeof monster === 'string' ? monster : monster.name;

        for (const key of buildMonsterLookupKeys(monsterName)) {
            const match = monsterCatalogByLookupKey.get(key);
            if (match) {
                return match;
            }
        }

        if (typeof monster === 'string') {
            return this.findFuzzyMonsterCatalogEntry({
                id: 'lookup-preview',
                name: monster,
                type: '',
                challengeRating: '',
                hp: 0,
                keyAbilities: '',
                notes: ''
            });
        }

        return this.findFuzzyMonsterCatalogEntry(monster);
    }

    describeMonsterArmorClass(monster: SessionMonster): string {
        const armorClass = this.resolveMonsterCatalogEntry(monster)?.armorClass;
        return typeof armorClass === 'number' ? `AC ${armorClass}` : '';
    }

    describeMonsterSavingThrows(monster: SessionMonster): string {
        return this.resolveMonsterCatalogEntry(monster)?.savingThrows?.trim() ?? '';
    }

    describeMonsterSenses(monster: SessionMonster): string {
        return this.resolveMonsterCatalogEntry(monster)?.senses?.trim() ?? '';
    }

    private findFuzzyMonsterCatalogEntry(monster: SessionMonster): MonsterCatalogEntry | null {
        const normalizedName = normalizeLookupValue(monster.name);
        const nameTokens = tokenizeLookupValue(monster.name);
        const normalizedType = normalizeLookupValue(monster.type);
        const challengeRating = parseChallengeRating(monster.challengeRating);
        let bestMatch: MonsterCatalogEntry | null = null;
        let bestScore = 0;

        for (const entry of monsterCatalog) {
            const normalizedEntryName = normalizeLookupValue(entry.name);
            const entryTokens = tokenizeLookupValue(entry.name);
            let score = 0;

            if (normalizedName && (normalizedEntryName.includes(normalizedName) || normalizedName.includes(normalizedEntryName))) {
                score += 28;
            }

            const overlapCount = countSharedTokens(nameTokens, entryTokens);
            if (overlapCount > 0) {
                score += overlapCount * 16;
                score += Math.round((overlapCount / Math.max(nameTokens.length, 1)) * 18);
            }

            if (normalizedType) {
                const normalizedCreatureType = normalizeLookupValue(entry.creatureType);
                const normalizedCreatureCategory = normalizeLookupValue(entry.creatureCategory);

                if (
                    normalizedCreatureType.includes(normalizedType)
                    || normalizedType.includes(normalizedCreatureType)
                    || normalizedCreatureCategory.includes(normalizedType)
                    || normalizedType.includes(normalizedCreatureCategory)
                ) {
                    score += 20;
                }
            }

            const entryChallengeRating = parseChallengeRating(entry.challengeRating);
            if (challengeRating !== null && entryChallengeRating !== null) {
                const difference = Math.abs(challengeRating - entryChallengeRating);
                if (difference === 0) {
                    score += 16;
                } else if (difference <= 1) {
                    score += 10;
                } else if (difference <= 2) {
                    score += 4;
                }
            }

            if (monster.hp > 0 && typeof entry.hitPoints === 'number') {
                const hpDifference = Math.abs(monster.hp - entry.hitPoints);
                if (hpDifference <= 15) {
                    score += 10;
                } else if (hpDifference <= 35) {
                    score += 5;
                }
            }

            if (entry.sourceUrl) {
                score += 2;
            }

            if (entry.actions.length > 0) {
                score += 2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }

        return bestScore >= 30 ? bestMatch : null;
    }

    openMonsterStatBlock(monster: MonsterCatalogEntry): void {
        this.interactionMessage.set('');
        this.interactionError.set('');
        this.activeMonster.set(monster);
        this.cdr.detectChanges();
    }

    closeMonsterModal(): void {
        this.activeMonster.set(null);
        this.cdr.detectChanges();
    }

    openMonsterStatBlockBySessionMonster(monster: SessionMonster): void {
        const entry = this.resolveMonsterCatalogEntry(monster);

        if (!entry) {
            this.interactionMessage.set('');
            this.interactionError.set(`No local stat block match was found for ${monster.name}.`);
            this.cdr.detectChanges();
            return;
        }

        this.openMonsterStatBlock(entry);
    }

    private resolveSessionNumber(summary: SessionPrep | null): number {
        const campaign = this.currentCampaign();
        if (!campaign || !summary) {
            return 1;
        }

        const index = campaign.sessions.findIndex((session) => session.id === summary.id);
        return index >= 0 ? index + 1 : 1;
    }

    private deriveThreatFromDraft(draft: SessionEditorDraft | null): ThreatLevel {
        const note = `${draft?.shortDescription ?? ''} ${draft?.markdownNotes ?? ''}`.toLowerCase();
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

    private resolveMarkdownNotes(summary: SessionPrep | null, draft: SessionEditorDraft | null): string {
        if (draft?.markdownNotes.trim()) {
            return draft.markdownNotes.trim();
        }

        if (draft?.shortDescription.trim()) {
            return `## Session Objective\n\n${draft.shortDescription.trim()}`;
        }

        if (summary?.objective.trim()) {
            return `## Session Objective\n\n${summary.objective.trim()}`;
        }

        return '';
    }

    private buildCampaignNpcFromSessionNpc(sessionNpc: SessionNpc): CampaignNpc {
        const session = this.sessionDetail();
        const baseNpc = createDefaultNpc(sessionNpc.name.trim());
        const personalityTraits = sessionNpc.personality.trim() ? [sessionNpc.personality.trim()] : [];
        const sessionAppearance = session?.title?.trim() ? [session.title.trim()] : [];
        const importedNotes = [
            sessionNpc.personality.trim() ? `Personality: ${sessionNpc.personality.trim()}` : '',
            sessionNpc.motivation.trim() ? `Motivation: ${sessionNpc.motivation.trim()}` : '',
            sessionNpc.voiceNotes.trim() ? `Voice notes: ${sessionNpc.voiceNotes.trim()}` : ''
        ].filter(Boolean).join('\n');

        return sanitizeNpc(touchNpc({
            ...baseNpc,
            title: sessionNpc.role.trim(),
            classOrRole: sessionNpc.role.trim(),
            location: session?.inGameLocation.trim() || '',
            shortDescription: buildNpcShortDescription(sessionNpc),
            personalityTraits,
            motivations: sessionNpc.motivation.trim(),
            voiceNotes: sessionNpc.voiceNotes.trim(),
            notes: importedNotes,
            tags: ['Session NPC'],
            sessionAppearances: sessionAppearance,
            isImportant: true
        }));
    }

    private buildNpcGenerationRequest(sessionNpc: SessionNpc) {
        const campaign = this.currentCampaign();
        const session = this.sessionDetail();
        const existingNpcNames = Array.from(new Set([
            ...(campaign?.npcs ?? []),
            ...Array.from(this.storedCampaignNpcDraftMap().values()).map((npc) => npc.name)
        ]));

        return {
            campaignId: this.campaignId(),
            nameHint: sessionNpc.name.trim(),
            titleHint: sessionNpc.role.trim(),
            raceHint: '',
            roleHint: sessionNpc.role.trim(),
            factionHint: '',
            locationHint: session?.inGameLocation.trim() || '',
            motivationHint: sessionNpc.motivation.trim(),
            functionHint: 'Create a full campaign NPC record from a session prep note. Preserve provided details and fill in the missing biography, appearance, goals, secrets, and campaign hooks.',
            toneHint: campaign?.tone ?? '',
            campaignTieHint: [campaign?.name, campaign?.hook, campaign?.summary, session?.title, session?.shortDescription]
                .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
                .join(' | '),
            notesHint: [sessionNpc.personality.trim(), sessionNpc.motivation.trim(), sessionNpc.voiceNotes.trim(), session?.markdownNotes.trim() ?? '']
                .filter(Boolean)
                .join(' | '),
            existingNpcNames
        };
    }

    private mergeGeneratedNpcDraft(currentNpc: CampaignNpc, generated: ApiGenerateNpcDraftResponse): CampaignNpc {
        return sanitizeNpc(touchNpc({
            ...currentNpc,
            title: currentNpc.title || generated.title,
            race: currentNpc.race || generated.race,
            classOrRole: currentNpc.classOrRole || generated.classOrRole,
            faction: currentNpc.faction || generated.faction,
            occupation: currentNpc.occupation || generated.occupation,
            age: currentNpc.age || generated.age,
            gender: currentNpc.gender || generated.gender,
            alignment: currentNpc.alignment || generated.alignment,
            currentStatus: currentNpc.currentStatus || generated.currentStatus,
            location: currentNpc.location || generated.location,
            shortDescription: currentNpc.shortDescription || generated.shortDescription,
            appearance: currentNpc.appearance || generated.appearance,
            personalityTraits: currentNpc.personalityTraits.length > 0 ? currentNpc.personalityTraits : generated.personalityTraits,
            ideals: currentNpc.ideals.length > 0 ? currentNpc.ideals : generated.ideals,
            bonds: currentNpc.bonds.length > 0 ? currentNpc.bonds : generated.bonds,
            flaws: currentNpc.flaws.length > 0 ? currentNpc.flaws : generated.flaws,
            motivations: currentNpc.motivations || generated.motivations,
            goals: currentNpc.goals || generated.goals,
            fears: currentNpc.fears || generated.fears,
            secrets: currentNpc.secrets.length > 0 ? currentNpc.secrets : generated.secrets,
            mannerisms: currentNpc.mannerisms.length > 0 ? currentNpc.mannerisms : generated.mannerisms,
            voiceNotes: currentNpc.voiceNotes || generated.voiceNotes,
            backstory: currentNpc.backstory || generated.backstory,
            notes: currentNpc.notes || generated.notes,
            combatNotes: currentNpc.combatNotes || generated.combatNotes,
            statBlockReference: currentNpc.statBlockReference || generated.statBlockReference,
            tags: mergeUniqueStrings(currentNpc.tags, generated.tags, ['Session NPC']),
            questLinks: currentNpc.questLinks.length > 0 ? currentNpc.questLinks : generated.questLinks,
            sessionAppearances: mergeUniqueStrings(currentNpc.sessionAppearances, generated.sessionAppearances),
            inventory: currentNpc.inventory.length > 0 ? currentNpc.inventory : generated.inventory,
            imageUrl: currentNpc.imageUrl || generated.imageUrl,
            hostility: currentNpc.hostility !== 'Indifferent' ? currentNpc.hostility : (generated.isHostile ? 'Hostile' : 'Friendly'),
            isAlive: generated.isAlive,
            isImportant: currentNpc.isImportant || generated.isImportant
        }));
    }

    private persistCampaignNpcDraft(npc: CampaignNpc): CampaignNpc {
        const campaignId = this.campaignId();
        const currentDrafts = (loadCampaignNpcDrafts(campaignId) ?? []).map((draft) => sanitizeNpc(draft));
        const existingIndex = currentDrafts.findIndex((entry) => entry.id === npc.id || normalizeLookupValue(entry.name) === normalizeLookupValue(npc.name));
        const nextDrafts = existingIndex >= 0
            ? currentDrafts.map((entry, index) => index === existingIndex ? npc : entry)
            : [npc, ...currentDrafts];

        saveCampaignNpcDrafts(campaignId, nextDrafts);
        this.npcDraftVersion.update((value) => value + 1);
        return npc;
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

function buildNpcShortDescription(sessionNpc: SessionNpc): string {
    const fragments = [sessionNpc.role.trim(), sessionNpc.motivation.trim()]
        .filter(Boolean)
        .slice(0, 2);

    return fragments.join(' · ');
}

function mergeUniqueStrings(...groups: string[][]): string[] {
    return Array.from(new Set(groups.flat().map((value) => value.trim()).filter(Boolean)));
}

function buildMonsterLookupKeys(value: string): string[] {
    const normalized = normalizeLookupValue(value);
    const withoutParentheticals = normalizeLookupValue(value.replace(/\([^)]*\)/g, ' '));
    const withoutLeadingArticle = normalized.replace(/^the\s+/, '');

    return Array.from(new Set([normalized, withoutParentheticals, withoutLeadingArticle].filter(Boolean)));
}

function normalizeLookupValue(value: string): string {
    return value
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9/\s-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeLookupValue(value: string): string[] {
    return Array.from(new Set(
        normalizeLookupValue(value)
            .split(/[^a-z0-9/]+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 3 && !monsterLookupStopWords.has(token))
    ));
}

function countSharedTokens(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) {
        return 0;
    }

    const rightSet = new Set(right);
    return left.filter((token) => rightSet.has(token)).length;
}

function parseChallengeRating(challengeRating: string): number | null {
    const normalized = challengeRating.trim();
    if (!normalized) {
        return null;
    }

    if (normalized.includes('/')) {
        const [numeratorText, denominatorText] = normalized.split('/');
        const numerator = Number(numeratorText);
        const denominator = Number(denominatorText);
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
            return null;
        }

        return numerator / denominator;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}