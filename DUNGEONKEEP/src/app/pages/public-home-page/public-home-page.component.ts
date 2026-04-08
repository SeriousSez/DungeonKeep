import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-public-home-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './public-home-page.component.html',
    styleUrl: './public-home-page.component.scss'
})
export class PublicHomePageComponent {
    readonly featureCards = [
        {
            title: 'Campaign Command',
            eyebrow: 'For Dungeon Masters',
            copy: 'Shape session prep, world notes, maps, threads, and invites in one shared stronghold.',
            icon: 'scroll-old'
        },
        {
            title: 'Party Roster',
            eyebrow: 'For Players',
            copy: 'Keep characters, notes, and readiness visible to the table without losing ownership of your own hero.',
            icon: 'users'
        },
        {
            title: 'Living Reference',
            eyebrow: 'At The Table',
            copy: 'Jump between NPCs, rules, loot, and session beats quickly enough to stay inside the scene.',
            icon: 'books'
        }
    ] as const;

    readonly workflowSteps = [
        {
            step: '1',
            title: 'Create a campaign keep',
            copy: 'Start with a campaign shell, tone, hook, and next-session focus.'
        },
        {
            step: '2',
            title: 'Invite your table',
            copy: 'Bring in players, assign ownership, and activate accounts with email verification.'
        },
        {
            step: '3',
            title: 'Run from one screen',
            copy: 'Track sessions, world notes, NPCs, maps, and unresolved threads as play evolves.'
        }
    ] as const;
}