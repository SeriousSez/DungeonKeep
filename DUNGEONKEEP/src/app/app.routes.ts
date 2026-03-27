import { Routes } from '@angular/router';
import { CampaignsPageComponent } from './pages/campaigns-page/campaigns-page.component';
import { CharacterDetailPageComponent } from './pages/character-detail-page/character-detail-page.component';
import { CharactersPageComponent } from './pages/characters-page/characters-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { NewCampaignPageComponent } from './pages/new-campaign-page/new-campaign-page.component';
import { NewCharacterPageComponent } from './pages/new-character-page/new-character-page.component';
import { NewCharacterStandardPageComponent } from './pages/new-character-standard-page/new-character-standard-page.component';
import { SessionsPageComponent } from './pages/sessions-page/sessions-page.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'dashboard',
        component: DashboardPageComponent,
        data: { title: 'Dashboard', breadcrumb: 'Dashboard' }
    },
    {
        path: 'campaigns',
        component: CampaignsPageComponent,
        data: { title: 'Campaigns', breadcrumb: 'Campaigns' }
    },
    {
        path: 'campaigns/new',
        component: NewCampaignPageComponent,
        data: { title: 'New Campaign', breadcrumb: 'New Campaign' }
    },
    {
        path: 'characters',
        component: CharactersPageComponent,
        data: { title: 'Characters', breadcrumb: 'Characters' }
    },
    {
        path: 'characters/new',
        component: NewCharacterPageComponent,
        data: { title: 'New Character', breadcrumb: 'New Character' }
    },
    {
        path: 'characters/new/standard',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Standard Character Builder', breadcrumb: 'Standard Builder' }
    },
    {
        path: 'characters/new/standard/:step',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Standard Character Builder', breadcrumb: 'Standard Builder' }
    },
    {
        path: 'characters/:id/builder',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder' }
    },
    {
        path: 'characters/:id/builder/:step',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder' }
    },
    {
        path: 'characters/:id/builder/:step/:mode',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder' }
    },
    {
        path: 'sessions',
        component: SessionsPageComponent,
        data: { title: 'Session Prep', breadcrumb: 'Sessions' }
    },
    {
        path: 'character/:id',
        component: CharacterDetailPageComponent,
        data: { title: 'Character', breadcrumb: 'Character Details' }
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
