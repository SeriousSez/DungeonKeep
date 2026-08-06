import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CharacterPortraitCropModalComponent } from '../../components/character-portrait-crop-modal/character-portrait-crop-modal.component';
import { CharacterPortraitModalComponent } from '../../components/character-portrait-modal/character-portrait-modal.component';
import { CustomMonster, MonsterTextSectionEntry } from '../../models/monster-reference.models';
import { duplicateCustomMonster, sanitizeCustomMonster } from '../../data/monster-library.helpers';
import { SessionEditorDraft } from '../../models/session-editor.models';
import { DungeonApiService } from '../../state/dungeon-api.service';
import { DungeonStoreService } from '../../state/dungeon-store.service';
import { extractApiError } from '../../state/extract-api-error';

const MONSTER_PORTRAIT_STORAGE_MAX_DIMENSION = 768;
const MONSTER_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH = 240_000;

@Component({
    selector: 'app-monster-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink, CharacterPortraitModalComponent, CharacterPortraitCropModalComponent],
    templateUrl: './monster-detail-page.component.html',
    styleUrl: './monster-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterDetailPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly api = inject(DungeonApiService);
    readonly store = inject(DungeonStoreService);

    readonly monsterId = signal('');
    readonly monster = signal<CustomMonster | null>(null);
    readonly addToSessionOpen = signal(false);
    readonly addToSessionMessage = signal('');
    readonly portraitModalOpen = signal(false);
    readonly portraitCropModalOpen = signal(false);
    readonly portraitCropSourceImageUrl = signal('');
    readonly portraitPromptDetails = signal('');
    readonly portraitSaveMessage = signal('');
    readonly isPortraitGenerating = signal(false);
    readonly isSavingPortrait = signal(false);
    readonly portraitGenerationError = signal('');
    readonly portraitLoadFailed = signal(false);

    readonly campaignsWithSessions = computed(() =>
        this.store.campaigns().filter((c) => c.sessions.length > 0)
    );
    readonly showPortraitImage = computed(() => {
        const monster = this.monster();
        return !!monster?.imageUrl?.trim() && !this.portraitLoadFailed();
    });
    readonly generatePortraitButtonLabel = computed(() => this.showPortraitImage() ? 'Regenerate Portrait' : 'Generate Portrait');
    readonly portraitInitials = computed(() => {
        const name = this.monster()?.name.trim() ?? '';
        if (!name) {
            return 'MO';
        }

        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || 'MO';
    });

    readonly profileTags = computed(() => {
        const monster = this.monster();
        if (!monster) {
            return [] as string[];
        }

        return [
            monster.challengeRating ? `CR ${monster.challengeRating}` : '',
            'Custom',
            monster.legendary ? 'Legendary' : '',
            monster.templateSlug ? 'Based on template' : ''
        ].filter((value) => value.trim().length > 0);
    });

    readonly abilityRows = computed(() => {
        const monster = this.monster();
        if (!monster) {
            return [] as Array<{ label: string; value: number | null }>;
        }

        return [
            { label: 'STR', value: monster.abilityScores.strength },
            { label: 'DEX', value: monster.abilityScores.dexterity },
            { label: 'CON', value: monster.abilityScores.constitution },
            { label: 'INT', value: monster.abilityScores.intelligence },
            { label: 'WIS', value: monster.abilityScores.wisdom },
            { label: 'CHA', value: monster.abilityScores.charisma }
        ];
    });

    readonly supplementalDetails = computed(() => {
        const monster = this.monster();
        if (!monster) {
            return [] as Array<{ label: string; value: string }>;
        }

        return [
            { label: 'Saving Throws', value: monster.savingThrows },
            { label: 'Skills', value: monster.skills },
            { label: 'Damage Vulnerabilities', value: monster.damageVulnerabilities },
            { label: 'Damage Resistances', value: monster.damageResistances },
            { label: 'Damage Immunities', value: monster.damageImmunities },
            { label: 'Condition Immunities', value: monster.conditionImmunities },
            { label: 'Senses', value: monster.senses },
            { label: 'Languages', value: monster.languages },
            { label: 'XP', value: monster.challengeXp }
        ].filter((item) => item.value.trim().length > 0);
    });

    readonly textSections = computed(() => {
        const monster = this.monster();
        if (!monster) {
            return [] as Array<{ heading: string; entries: MonsterTextSectionEntry[] }>;
        }

        return [
            { heading: 'Traits', entries: monster.traits },
            { heading: 'Actions', entries: monster.actions },
            { heading: 'Reactions', entries: monster.reactions },
            { heading: 'Legendary Actions', entries: monster.legendaryActions }
        ].filter((section) => section.entries.length > 0);
    });

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                this.monsterId.set((params.get('monsterId') ?? '').trim());
                this.portraitModalOpen.set(false);
                this.portraitCropModalOpen.set(false);
                this.portraitCropSourceImageUrl.set('');
                this.portraitPromptDetails.set('');
                this.portraitSaveMessage.set('');
                this.portraitGenerationError.set('');
                this.portraitLoadFailed.set(false);
                this.cdr.detectChanges();
            });

        effect(() => {
            const id = this.monsterId();
            const library = this.store.userMonsterLibrary() ?? [];

            if (!id) {
                this.monster.set(null);
                this.cdr.detectChanges();
                return;
            }

            const found = (library as CustomMonster[]).find((monster) => monster.id === id);
            this.monster.set(found ? sanitizeCustomMonster(found) : null);
            this.cdr.detectChanges();
        });
    }

    subtitle(): string {
        const monster = this.monster();
        if (!monster) {
            return 'Custom Bestiary';
        }

        const details = [monster.size, monster.creatureType, monster.alignment]
            .map((value) => value.trim())
            .filter(Boolean);

        if (details.length === 0) {
            return 'Custom Bestiary';
        }

        const [size, type, alignment] = details;
        return `${size} ${type}${alignment ? `, ${alignment}` : ''}`;
    }

    armorClassText(): string {
        const monster = this.monster();
        return monster?.armorClass == null ? '—' : String(monster.armorClass);
    }

    hitPointsText(): string {
        const monster = this.monster();
        return monster?.hitPoints == null ? '—' : String(monster.hitPoints);
    }

    speedText(): string {
        const speed = this.monster()?.speed.trim() ?? '';
        return speed || '—';
    }

    scoreText(value: number | null): string {
        return value == null ? '—' : String(value);
    }

    modifierText(value: number | null): string {
        if (value == null) {
            return '—';
        }

        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    trackTextSection(index: number, section: { heading: string; entries: MonsterTextSectionEntry[] }): string {
        return `${section.heading}-${index}`;
    }

    formatEntryText(value: string): string {
        const escaped = this.escapeHtml(value);

        return escaped
            .replace(/\b(Melee or Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Melee Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Ranged Weapon Attack)\s*:/g, '<em>$1</em>:')
            .replace(/\b(Hit)\s*:/g, '<em>$1</em>:');
    }

    editMonster(): void {
        const monster = this.monster();
        if (monster) {
            void this.router.navigate(['/monsters', monster.id, 'edit']);
        }
    }

    duplicateMonster(): void {
        const monster = this.monster();
        if (!monster) {
            return;
        }

        const library = (this.store.userMonsterLibrary() ?? []) as CustomMonster[];
        const namesInUse = library.map((m) => m.name);
        const copy = duplicateCustomMonster(monster, namesInUse);
        const next = [copy, ...library];
        void this.store.saveUserMonsterLibrary(next).then((saved) => {
            if (saved) {
                void this.router.navigate(['/monsters', copy.id]);
            }
        });
    }

    openPortraitModal(): void {
        if (!this.monster()) {
            return;
        }

        this.portraitModalOpen.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
        this.cdr.detectChanges();
    }

    closePortraitModal(): void {
        this.portraitModalOpen.set(false);
        this.cdr.detectChanges();
    }

    closePortraitCropModal(): void {
        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
        this.cdr.detectChanges();
    }

    updatePortraitPromptDetails(value: string): void {
        this.portraitPromptDetails.set(value);
    }

    openPortraitRecrop(): void {
        const monster = this.monster();
        const sourceImageUrl = monster?.originalImageUrl?.trim() || monster?.imageUrl?.trim() || '';
        if (!monster || !sourceImageUrl || this.isSavingPortrait() || this.isPortraitGenerating()) {
            return;
        }

        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');
        this.portraitCropSourceImageUrl.set(sourceImageUrl);
        this.portraitCropModalOpen.set(true);
        this.cdr.detectChanges();
    }

    async onPortraitFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file) {
            return;
        }

        try {
            const imageUrl = await this.optimizePortraitForStorage(await this.readPortraitFile(file));
            this.portraitGenerationError.set('');
            this.portraitSaveMessage.set('');
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

    async generateMonsterPortrait(): Promise<void> {
        const monster = this.monster();
        if (!monster || this.isPortraitGenerating()) {
            return;
        }

        this.isPortraitGenerating.set(true);
        this.portraitGenerationError.set('');
        this.cdr.detectChanges();

        try {
            const response = await this.api.generateCharacterPortrait({
                name: monster.name,
                className: monster.creatureType || 'Monster',
                background: 'Dungeons and Dragons custom monster token art', // Intentional AI prompt text; not a user-facing localized string.
                species: monster.creatureCategory || monster.creatureType || 'Monster',
                alignment: monster.alignment || 'unaligned',
                gender: '',
                additionalDirection: this.buildPortraitGenerationDirection(monster, this.portraitPromptDetails().trim())
            });

            const optimizedImageUrl = await this.optimizePortraitForStorage(response.imageUrl);
            await this.persistPortrait(optimizedImageUrl, 'Portrait generated and saved.');
        } catch (error: unknown) {
            this.portraitGenerationError.set(this.buildPortraitGenerationFailureMessage(error));
        } finally {
            this.isPortraitGenerating.set(false);
            this.cdr.detectChanges();
        }
    }

    async clearPortrait(): Promise<void> {
        if (!this.monster() || this.isSavingPortrait()) {
            return;
        }

        await this.persistPortrait('', 'Portrait removed.');
    }

    async applyPortraitCrop(croppedImageUrl: string): Promise<void> {
        const monster = this.monster();
        if (!monster) {
            return;
        }

        const optimizedImageUrl = await this.optimizePortraitForStorage(croppedImageUrl);
        this.portraitCropModalOpen.set(false);
        this.portraitCropSourceImageUrl.set('');
        await this.persistPortrait(optimizedImageUrl, 'Portrait updated.');
    }

    handlePortraitImageError(): void {
        this.portraitLoadFailed.set(true);
        this.cdr.detectChanges();
    }

    toggleAddToSession(): void {
        this.addToSessionOpen.update((v) => !v);
        this.addToSessionMessage.set('');
        this.cdr.detectChanges();
    }

    async addMonsterToSession(campaignId: string, sessionId: string, sessionTitle: string): Promise<void> {
        const monster = this.monster();
        if (!monster) {
            return;
        }

        const campaign = this.store.campaigns().find((entry) => entry.id === campaignId) ?? null;
        const session = campaign?.sessions.find((entry) => entry.id === sessionId) ?? null;

        const draft = this.parseDraft(session?.detailsJson) ?? {
            id: sessionId,
            title: sessionTitle,
            shortDescription: '',
            sessionNumber: 1,
            campaignId,
            date: '',
            inGameLocation: '',
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

        const alreadyAdded = draft.monsters.some(
            (m) => m.name.toLowerCase() === monster.name.toLowerCase()
        );

        if (!alreadyAdded) {
            draft.monsters = [
                ...draft.monsters,
                {
                    id: `monster-${crypto.randomUUID()}`,
                    name: monster.name,
                    type: monster.creatureType,
                    challengeRating: monster.challengeRating ? `CR ${monster.challengeRating}` : '',
                    hp: monster.hitPoints ?? 0,
                    keyAbilities: monster.traits.slice(0, 2).map((t) => t.title).join(', '),
                    notes: monster.notes || ''
                }
            ];
            await this.store.saveSessionDetails(campaignId, sessionId, {
                detailsJson: JSON.stringify(draft),
                lootAssignmentsJson: session?.lootAssignmentsJson ?? null
            });
        }

        this.addToSessionMessage.set(
            alreadyAdded
                ? `${monster.name} is already in "${sessionTitle}".`
                : `Added to "${sessionTitle}".`
        );
        this.addToSessionOpen.set(false);
        this.cdr.detectChanges();
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private async updateMonsterInLibrary(updatedMonster: CustomMonster): Promise<boolean> {
        const library = (this.store.userMonsterLibrary() ?? []) as CustomMonster[];
        const nextLibrary = library.map((entry) => entry.id === updatedMonster.id ? updatedMonster : entry);
        const saved = await this.store.saveUserMonsterLibrary(nextLibrary);
        return saved;
    }

    private buildPortraitGenerationDirection(monster: CustomMonster, manualDirection: string): string {
        const normalizedType = `${monster.creatureType} ${monster.creatureCategory}`.toLowerCase();
        const isHumanoid = normalizedType.includes('humanoid');
        const details = [
            `Challenge rating: ${monster.challengeRating || 'unknown'}`,
            monster.creatureType ? `Type: ${monster.creatureType}` : '',
            monster.creatureCategory ? `Category: ${monster.creatureCategory}` : '',
            monster.alignment ? `Alignment: ${monster.alignment}` : '',
            monster.notes.trim() ? `Notes: ${monster.notes.trim()}` : '',
            isHumanoid
                ? 'Create centered monster token art with clean silhouette and transparent or neutral backdrop suitable for a tabletop token. Avoid cinematic profile-photo framing.'
                : 'Create non-profile monster token art that clearly shows the creature form (full body or imposing silhouette), not a humanoid bust/headshot portrait, with a transparent or neutral tabletop-friendly backdrop.'
        ].filter((detail) => detail.length > 0);

        const detailsSummary = details.join(' ');
        if (detailsSummary && manualDirection) {
            return `${detailsSummary}\nRequested art direction: ${manualDirection}`;
        }

        return detailsSummary || manualDirection;
    }

    private buildPortraitGenerationFailureMessage(error: unknown): string {
        const apiMessage = extractApiError(error, '').toLowerCase();
        if (apiMessage.includes('billing_hard_limit_reached') || apiMessage.includes('billing hard limit has been reached')) {
            return 'Portrait generation is unavailable because the OpenAI billing limit has been reached.';
        }

        return 'Portrait generation is unavailable right now. Please try again in a moment.';
    }

    private parseDraft(detailsJson: string | null | undefined): SessionEditorDraft | null {
        if (!detailsJson?.trim()) {
            return null;
        }

        try {
            const parsed = JSON.parse(detailsJson) as SessionEditorDraft;
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    private async persistPortrait(imageUrl: string, successMessage: string): Promise<void> {
        const monster = this.monster();
        if (!monster || this.isSavingPortrait()) {
            return;
        }

        this.isSavingPortrait.set(true);
        this.portraitGenerationError.set('');
        this.portraitSaveMessage.set('');

        try {
            const optimizedImageUrl = await this.optimizePortraitForStorage(imageUrl);
            const updatedMonster = sanitizeCustomMonster({
                ...monster,
                imageUrl: optimizedImageUrl,
                originalImageUrl: imageUrl ? (monster.originalImageUrl?.trim() || optimizedImageUrl) : ''
            });

            const saved = await this.updateMonsterInLibrary(updatedMonster);
            if (!saved) {
                this.portraitGenerationError.set('Unable to save portrait right now.');
                return;
            }

            this.monster.set(updatedMonster);
            this.portraitLoadFailed.set(false);
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

        if (trimmedImageUrl.length <= MONSTER_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH) {
            return trimmedImageUrl;
        }

        try {
            const image = await this.loadPortraitImage(trimmedImageUrl);
            const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
            const scale = longestEdge > MONSTER_PORTRAIT_STORAGE_MAX_DIMENSION
                ? MONSTER_PORTRAIT_STORAGE_MAX_DIMENSION / longestEdge
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

                if (bestImageUrl.length <= MONSTER_PORTRAIT_STORAGE_TARGET_DATA_URL_LENGTH) {
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

        if (file.size > 20 * 1024 * 1024) {
            return Promise.reject(new Error('Image must be under 20 MB. For best performance, images under 8 MB are recommended.'));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                if (!result) {
                    reject(new Error('Unable to read that image file.'));
                    return;
                }

                resolve(result);
            };
            reader.onerror = () => reject(new Error('Unable to read that image file.'));
            reader.readAsDataURL(file);
        });
    }
}
