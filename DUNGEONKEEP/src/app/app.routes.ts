import { Routes } from '@angular/router';
import { CampaignDetailPageComponent } from './pages/campaign-detail-page/campaign-detail-page.component';
import { CampaignEditPageComponent } from './pages/campaign-edit-page/campaign-edit-page.component';
import { CampaignMapPageComponent } from './pages/campaign-map-page/campaign-map-page.component';
import { CampaignMapsPageComponent } from './pages/campaign-maps-page/campaign-maps-page.component';
import { CampaignSectionPageComponent } from './pages/campaign-section-page/campaign-section-page.component';
import { SessionDetailPageComponent } from './pages/session-detail-page/session-detail-page.component';
import { SessionEditorPageComponent } from './pages/session-editor-page/session-editor-page.component';
import { CampaignsPageComponent } from './pages/campaigns-page/campaigns-page.component';
import { CharacterDetailPageComponent } from './pages/character-detail-page/character-detail-page.component';
import { CharactersPageComponent } from './pages/characters-page/characters-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { MonsterReferencePageComponent } from './pages/monster-reference-page/monster-reference-page.component';
import { NewCampaignPageComponent } from './pages/new-campaign-page/new-campaign-page.component';
import { NewCharacterPageComponent } from './pages/new-character-page/new-character-page.component';
import { NewCharacterStandardPageComponent } from './pages/new-character-standard-page/new-character-standard-page.component';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { NpcEditorPageComponent } from './pages/npc-editor-page/npc-editor-page.component';
import { NpcDetailPage } from './pages/npc-detail-page/npc-detail-page';
import { NpcLibraryPageComponent } from './pages/npc-library-page/npc-library-page.component';
import { PremadeCharactersPageComponent } from './pages/premade-characters-page.component';
import { PublicHomePageComponent } from './pages/public-home-page/public-home-page.component';
import { AuthShellComponent } from './components/auth-shell/auth-shell.component';
import { RulesPage } from './pages/rules-page/rules-page';
import { RulesDetailPage } from './pages/rules-detail-page/rules-detail-page';
import { RulesClassesPage } from './pages/rules-classes-page/rules-classes-page';
import { RulesClassDetailPage } from './pages/rules-class-detail-page/rules-class-detail-page';
import { RulesSpeciesPage } from './pages/rules-species-page/rules-species-page';
import { RulesSpeciesDetailPage } from './pages/rules-species-detail-page/rules-species-detail-page';
import { RulesBackgroundsPage } from './pages/rules-backgrounds-page/rules-backgrounds-page';
import { RulesBackgroundsDetailPage } from './pages/rules-backgrounds-detail-page/rules-backgrounds-detail-page';
import { RulesFeatsPage } from './pages/rules-feats-page/rules-feats-page';
import { RulesFeatsDetailPage } from './pages/rules-feats-detail-page/rules-feats-detail-page';
import { RulesSpellsPage } from './pages/rules-spells-page/rules-spells-page';
import { RulesSpellDetailPage } from './pages/rules-spell-detail-page/rules-spell-detail-page';

export const routes: Routes = [
    {
        path: '',
        component: PublicHomePageComponent,
        data: { title: 'DungeonKeep', breadcrumb: 'Home' }
    },
    {
        path: 'auth',
        component: AuthShellComponent,
        data: { title: 'Sign In', breadcrumb: 'Sign In' }
    },
    {
        path: 'dashboard',
        component: DashboardPageComponent,
        data: { title: 'Home', breadcrumb: 'Home' }
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
        path: 'campaigns/:id',
        component: CampaignDetailPageComponent,
        data: { title: 'Campaign', breadcrumb: 'Campaign', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }] }
    },
    {
        path: 'campaigns/:id/party',
        component: CampaignSectionPageComponent,
        data: { title: 'Party Roster', breadcrumb: 'Party', section: 'party', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/sessions',
        component: CampaignSectionPageComponent,
        data: { title: 'Campaign Sessions', breadcrumb: 'Sessions', section: 'sessions', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/sessions/new',
        component: SessionEditorPageComponent,
        data: { title: 'New Session', breadcrumb: 'New Session', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Sessions', url: '/campaigns/:id/sessions' }] }
    },
    {
        path: 'campaigns/:id/sessions/:sessionId/edit',
        component: SessionEditorPageComponent,
        data: { title: 'Edit Session', breadcrumb: 'Edit Session', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Sessions', url: '/campaigns/:id/sessions' }] }
    },
    {
        path: 'campaigns/:id/sessions/:sessionId',
        component: SessionDetailPageComponent,
        data: { title: 'Session Details', breadcrumb: 'Session', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Sessions', url: '/campaigns/:id/sessions' }] }
    },
    {
        path: 'campaigns/:id/npcs',
        component: CampaignSectionPageComponent,
        data: { title: 'Campaign NPCs', breadcrumb: 'NPCs', section: 'npcs', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/npcs/new',
        component: NpcEditorPageComponent,
        data: { title: 'New NPC', breadcrumb: 'New NPC', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'NPCs', url: '/campaigns/:id/npcs' }] }
    },
    {
        path: 'campaigns/:id/npcs/:npcId',
        component: NpcDetailPage,
        data: { title: 'NPC Details', breadcrumb: 'NPC', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'NPCs', url: '/campaigns/:id/npcs' }] }
    },
    {
        path: 'campaigns/:id/npcs/:npcId/edit',
        component: NpcEditorPageComponent,
        data: { title: 'Edit NPC', breadcrumb: 'Edit NPC', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'NPCs', url: '/campaigns/:id/npcs' }] }
    },
    {
        path: 'campaigns/:id/loot',
        component: CampaignSectionPageComponent,
        data: { title: 'Campaign Loot', breadcrumb: 'Loot', section: 'loot', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/threads',
        component: CampaignSectionPageComponent,
        data: { title: 'Open Threads', breadcrumb: 'Threads', section: 'threads', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/notes',
        component: CampaignSectionPageComponent,
        data: { title: 'World Notes', breadcrumb: 'World Notes', section: 'notes', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/maps',
        component: CampaignMapsPageComponent,
        data: { title: 'Campaign Maps', breadcrumb: 'Maps', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/maps/new',
        component: CampaignMapPageComponent,
        data: { title: 'Create Campaign Map', breadcrumb: 'New Map', mapMode: 'edit', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Maps', url: '/campaigns/:id/maps' }] }
    },
    {
        path: 'campaigns/:id/maps/:mapId',
        component: CampaignMapPageComponent,
        data: { title: 'Campaign Map', breadcrumb: 'Map', mapMode: 'view', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Maps', url: '/campaigns/:id/maps' }] }
    },
    {
        path: 'campaigns/:id/maps/:mapId/edit',
        component: CampaignMapPageComponent,
        data: { title: 'Map Editor', breadcrumb: 'Edit Map', mapMode: 'edit', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }, { label: 'Maps', url: '/campaigns/:id/maps' }] }
    },
    {
        path: 'campaigns/:id/members',
        component: CampaignSectionPageComponent,
        data: { title: 'Campaign Members', breadcrumb: 'Members', section: 'members', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }, { label: 'Campaign', url: '/campaigns/:id' }] }
    },
    {
        path: 'campaigns/:id/edit',
        component: CampaignEditPageComponent,
        data: { title: 'Edit Campaign', breadcrumb: 'Edit', parentCrumbs: [{ label: 'Campaigns', url: '/campaigns' }] }
    },
    {
        path: 'characters',
        component: CharactersPageComponent,
        data: { title: 'Characters', breadcrumb: 'Characters' }
    },
    {
        path: 'characters/new',
        component: NewCharacterPageComponent,
        data: { title: 'New Character', breadcrumb: 'New Character', parentCrumbs: [{ label: 'Characters', url: '/characters' }] }
    },
    {
        path: 'characters/new/premade',
        component: PremadeCharactersPageComponent,
        data: {
            title: 'Premade Characters', breadcrumb: 'Premade Characters', parentCrumbs: [
                { label: 'Characters', url: '/characters' },
                { label: 'New Character', url: '/characters/new' }
            ]
        }
    },
    {
        path: 'characters/new/standard',
        component: NewCharacterStandardPageComponent,
        data: {
            title: 'Standard Character Builder',
            breadcrumb: 'Standard Builder',
            parentCrumbs: [
                { label: 'Characters', url: '/characters' },
                { label: 'New Character', url: '/characters/new' }
            ]
        }
    },
    {
        path: 'characters/new/standard/:step',
        component: NewCharacterStandardPageComponent,
        data: {
            title: 'Standard Character Builder',
            breadcrumb: 'Standard Builder',
            parentCrumbs: [
                { label: 'Characters', url: '/characters' },
                { label: 'New Character', url: '/characters/new' }
            ]
        }
    },
    {
        path: 'characters/:id/builder',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder', parentCrumbs: [{ label: 'Characters', url: '/characters' }] }
    },
    {
        path: 'characters/:id/builder/:step',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder', parentCrumbs: [{ label: 'Characters', url: '/characters' }] }
    },
    {
        path: 'characters/:id/builder/:step/:mode',
        component: NewCharacterStandardPageComponent,
        data: { title: 'Character Builder', breadcrumb: 'Character Builder', parentCrumbs: [{ label: 'Characters', url: '/characters' }] }
    },
    {
        path: 'npcs',
        component: NpcLibraryPageComponent,
        data: { title: 'NPC Library', breadcrumb: 'NPC Library' }
    },
    {
        path: 'npcs/new',
        component: NpcEditorPageComponent,
        data: { title: 'New Library NPC', breadcrumb: 'New NPC', parentCrumbs: [{ label: 'NPC Library', url: '/npcs' }] }
    },
    {
        path: 'npcs/:npcId',
        component: NpcDetailPage,
        data: { title: 'NPC Details', breadcrumb: 'NPC', parentCrumbs: [{ label: 'NPC Library', url: '/npcs' }] }
    },
    {
        path: 'npcs/:npcId/edit',
        component: NpcEditorPageComponent,
        data: { title: 'Edit Library NPC', breadcrumb: 'Edit NPC', parentCrumbs: [{ label: 'NPC Library', url: '/npcs' }] }
    },
    {
        path: 'rules',
        component: RulesPage,
        data: { title: 'Rules Library', breadcrumb: 'Rules' }
    },
    {
        path: 'rules/monsters',
        component: MonsterReferencePageComponent,
        data: { title: 'Monster Reference', breadcrumb: 'Monsters', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/classes',
        component: RulesClassesPage,
        data: { title: 'Classes', breadcrumb: 'Classes', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/classes/:className',
        component: RulesClassDetailPage,
        data: { title: 'Class Detail', breadcrumb: 'Class', parentCrumbs: [{ label: 'Rules', url: '/rules' }, { label: 'Classes', url: '/rules/classes' }] }
    },
    {
        path: 'rules/species',
        component: RulesSpeciesPage,
        data: { title: 'Species', breadcrumb: 'Species', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/species/:speciesName',
        component: RulesSpeciesDetailPage,
        data: { title: 'Species Detail', breadcrumb: 'Species', parentCrumbs: [{ label: 'Rules', url: '/rules' }, { label: 'Species', url: '/rules/species' }] }
    },
    {
        path: 'rules/backgrounds',
        component: RulesBackgroundsPage,
        data: { title: 'Backgrounds', breadcrumb: 'Backgrounds', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/backgrounds/:backgroundName',
        component: RulesBackgroundsDetailPage,
        data: { title: 'Background Detail', breadcrumb: 'Background', parentCrumbs: [{ label: 'Rules', url: '/rules' }, { label: 'Backgrounds', url: '/rules/backgrounds' }] }
    },
    {
        path: 'rules/feats',
        component: RulesFeatsPage,
        data: { title: 'Feats', breadcrumb: 'Feats', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/feats/:featSlug',
        component: RulesFeatsDetailPage,
        data: { title: 'Feat Detail', breadcrumb: 'Feat', parentCrumbs: [{ label: 'Rules', url: '/rules' }, { label: 'Feats', url: '/rules/feats' }] }
    },
    {
        path: 'rules/spells',
        component: RulesSpellsPage,
        data: { title: 'Spells', breadcrumb: 'Spells', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'rules/spells/:spellSlug',
        component: RulesSpellDetailPage,
        data: { title: 'Spell Detail', breadcrumb: 'Spell', parentCrumbs: [{ label: 'Rules', url: '/rules' }, { label: 'Spells', url: '/rules/spells' }] }
    },
    {
        path: 'rules/:slug',
        component: RulesDetailPage,
        data: { title: 'Rules Reference', breadcrumb: 'Reference', parentCrumbs: [{ label: 'Rules', url: '/rules' }] }
    },
    {
        path: 'character/:id',
        component: CharacterDetailPageComponent,
        data: { title: 'Character', breadcrumb: 'Character', parentCrumbs: [{ label: 'Characters', url: '/characters' }] }
    },
    {
        path: '404',
        component: NotFoundPage,
        data: { title: 'Page Not Found', breadcrumb: 'Not Found' }
    },
    {
        path: '**',
        component: NotFoundPage,
        data: { title: 'Page Not Found', breadcrumb: 'Not Found' }
    }
];
