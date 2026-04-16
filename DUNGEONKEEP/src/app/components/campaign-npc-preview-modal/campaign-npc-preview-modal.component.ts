import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, input, output, signal } from '@angular/core';

import { CampaignNpc } from '../../models/campaign-npc.models';

type NpcPreviewTab = 'overview' | 'personality' | 'hooks' | 'history' | 'connections' | 'combat';

interface NpcPreviewTabOption {
    id: NpcPreviewTab;
    label: string;
}

@Component({
    selector: 'app-campaign-npc-preview-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './campaign-npc-preview-modal.component.html',
    styleUrl: './campaign-npc-preview-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignNpcPreviewModalComponent {
    readonly npc = input.required<CampaignNpc>();
    readonly canEdit = input(false);

    readonly closed = output<void>();
    readonly openRequested = output<void>();
    readonly editRequested = output<void>();

    readonly activeTab = signal<NpcPreviewTab>('overview');
    readonly tabs: readonly NpcPreviewTabOption[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'personality', label: 'Personality' },
        { id: 'hooks', label: 'Hooks' },
        { id: 'history', label: 'History' },
        { id: 'connections', label: 'Connections' },
        { id: 'combat', label: 'Combat' }
    ];

    readonly summary = computed(() => {
        const npc = this.npc();
        return [npc.title || npc.classOrRole || npc.occupation, npc.race, npc.location]
            .filter((value) => value.trim().length > 0)
            .join(' · ');
    });

    readonly personalityLines = computed(() => {
        const npc = this.npc();
        return [
            ...npc.personalityTraits,
            ...npc.ideals,
            ...npc.bonds,
            ...npc.flaws
        ].filter((value) => value.trim().length > 0).slice(0, 6);
    });

    readonly overviewFacts = computed(() => {
        const npc = this.npc();
        return [
            { label: 'Title', value: npc.title || 'Unrecorded' },
            { label: 'Role', value: npc.classOrRole || npc.occupation || 'Unrecorded' },
            { label: 'Race', value: npc.race || 'Unknown' },
            { label: 'Faction', value: npc.faction || 'Independent' },
            { label: 'Location', value: npc.location || 'Unknown' },
            { label: 'Status', value: npc.currentStatus || (npc.isAlive ? 'Active' : 'Deceased') },
            { label: 'Alignment', value: npc.alignment || 'Unrecorded' },
            { label: 'Age', value: npc.age || 'Unknown' },
            { label: 'Gender', value: npc.gender || 'Unrecorded' },
            { label: 'Updated', value: this.formatUpdatedAt(npc.updatedAt) }
        ];
    });

    readonly relationshipRows = computed(() =>
        this.npc().relationships
            .map((relationship) => ({
                id: relationship.id,
                target: relationship.targetNpcId || 'Linked NPC',
                type: relationship.relationshipType || 'Relationship',
                description: relationship.description || 'No details recorded.'
            }))
    );

    close(): void {
        this.closed.emit();
    }

    @HostListener('document:dungeonkeep-close-overlays')
    handleCloseOverlayRequest(): void {
        this.close();
    }

    selectTab(tab: NpcPreviewTab): void {
        this.activeTab.set(tab);
    }

    openFullNpc(): void {
        this.openRequested.emit();
    }

    editNpc(): void {
        this.editRequested.emit();
    }

    formatUpdatedAt(value: string): string {
        if (!value.trim()) {
            return 'Unknown';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}