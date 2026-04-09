import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { marked } from 'marked';

import { readStoredSessionEditorDraft } from '../../data/session-editor.storage';
import { SessionPrep, ThreatLevel } from '../../models/dungeon.models';
import { SessionEditorDraft } from '../../models/session-editor.models';
import { DungeonStoreService } from '../../state/dungeon-store.service';

interface SessionDetailFact {
    label: string;
    value: string;
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

@Component({
    selector: 'app-session-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailPageComponent {
    private readonly store = inject(DungeonStoreService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly campaignId = signal('');
    readonly sessionId = signal('');
    readonly initialized = signal(false);
    readonly loadError = signal('');
    readonly storedDraft = signal<SessionEditorDraft | null>(null);
    readonly renderedMarkdown = signal('');

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
                if (campaignId) {
                    void this.store.ensureCampaignLoaded(campaignId);
                }
                this.cdr.detectChanges();
            });

        effect(() => {
            const campaignId = this.campaignId();
            const sessionId = this.sessionId();
            const campaigns = this.store.campaigns();

            if (!campaignId || !sessionId) {
                return;
            }

            const campaign = this.currentCampaign();
            if (!campaign) {
                if (campaigns.length === 0) {
                    return;
                }

                this.loadError.set('The requested campaign could not be found.');
                this.initialized.set(true);
                this.cdr.detectChanges();
                return;
            }

            const summary = campaign.sessions.find((session) => session.id === sessionId) ?? null;
            if (!campaign.detailsLoaded) {
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
}