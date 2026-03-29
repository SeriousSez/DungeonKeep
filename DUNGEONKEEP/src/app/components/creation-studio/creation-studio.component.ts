import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CampaignDraft, CharacterDraft } from '../../models/dungeon.models';
import { ThemedDatepickerComponent } from '../themed-datepicker/themed-datepicker.component';

const emptyCampaignDraft = (): CampaignDraft => ({
    name: '',
    setting: '',
    tone: 'Heroic',
    hook: '',
    nextSession: '',
    summary: ''
});

const emptyCharacterDraft = (): CharacterDraft => ({
    name: '',
    playerName: '',
    race: '',
    className: '',
    level: 1,
    role: 'Striker',
    background: '',
    notes: ''
});

@Component({
    selector: 'app-creation-studio',
    imports: [CommonModule, FormsModule, ThemedDatepickerComponent],
    templateUrl: './creation-studio.component.html',
    styleUrl: './creation-studio.component.scss'
})
export class CreationStudioComponent {
    readonly mode = input<'both' | 'campaign' | 'character'>('both');

    readonly campaignCreated = output<CampaignDraft>();
    readonly characterCreated = output<CharacterDraft>();

    readonly campaignDraft = signal<CampaignDraft>(emptyCampaignDraft());
    readonly characterDraft = signal<CharacterDraft>(emptyCharacterDraft());

    updateCampaign<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]): void {
        this.campaignDraft.update((draft) => ({ ...draft, [key]: value }));
    }

    updateCharacter<K extends keyof CharacterDraft>(key: K, value: CharacterDraft[K]): void {
        this.characterDraft.update((draft) => ({ ...draft, [key]: value }));
    }

    addCampaign(): void {
        const draft = {
            ...this.campaignDraft(),
            name: this.campaignDraft().name.trim(),
            setting: this.campaignDraft().setting.trim(),
            hook: this.campaignDraft().hook.trim(),
            nextSession: this.campaignDraft().nextSession.trim(),
            summary: this.campaignDraft().summary.trim()
        };

        if (!draft.name || !draft.setting || !draft.hook) {
            return;
        }

        this.campaignCreated.emit(draft);
        this.campaignDraft.set(emptyCampaignDraft());
    }

    addCharacter(): void {
        const draft = {
            ...this.characterDraft(),
            name: this.characterDraft().name.trim(),
            playerName: this.characterDraft().playerName.trim(),
            race: this.characterDraft().race.trim(),
            className: this.characterDraft().className.trim(),
            background: this.characterDraft().background.trim(),
            notes: this.characterDraft().notes.trim()
        };

        if (!draft.name || !draft.playerName || !draft.className) {
            return;
        }

        this.characterCreated.emit(draft);
        this.characterDraft.set(emptyCharacterDraft());
    }
}
