import { SessionEditorDraft } from '../models/session-editor.models';

export const SESSION_EDITOR_SAMPLE_DRAFT: SessionEditorDraft = {
    id: 'sample-session-amber-vault',
    title: 'The Amber Vault Heist',
    shortDescription: 'The party infiltrates a sealed archive beneath the city while rival treasure-hunters close in from above.',
    sessionNumber: 8,
    campaignId: 'sample-campaign-id',
    date: '2026-04-20',
    inGameLocation: 'Underkeep Archive, South Vault Wing',
    estimatedLength: '3.5 hours',
    markdownNotes: '# Session Goals\n\n- Get the party into the archive unseen\n- Introduce the rival salvage crew\n- End on the vault door opening\n\n> Keep pressure on time and noise.\n\n| Beat | Focus |\n| --- | --- |\n| Entry | stealth and positioning |\n| Midpoint | social pressure |\n| Finale | discovery and consequence |\n\n- [ ] Rival crew named on-screen\n- [ ] First vault clue revealed',
    scenes: [
        {
            id: 'scene-entry',
            title: 'Sewer Entry',
            description: 'The group approaches the archive through a flooded service tunnel under the old mint.',
            trigger: 'Begins once the party commits to the infiltration route.',
            keyEvents: ['Spot the broken grate', 'Avoid patrolling torchlight', 'Hear rival boots overhead'],
            possibleOutcomes: ['Clean entry into the service hall', 'Party alerts a sentry', 'Rivals realize they are not alone']
        },
        {
            id: 'scene-vault-door',
            title: 'The Amber Door',
            description: 'A sealed amber-veined door blocks the archive core and reacts to blood, heat, and spoken names.',
            trigger: 'Runs after the party secures the central catalog room.',
            keyEvents: ['Recover missing sigil phrases', 'Choose brute force or ritual approach', 'Rival crew arrives during the final attempt'],
            possibleOutcomes: ['Door opens cleanly', 'Door opens with a magical alarm', 'Door remains shut and forces retreat']
        }
    ],
    npcs: [
        {
            id: 'npc-curator',
            name: 'Curator Vaelis',
            role: 'Ghost archivist',
            personality: 'Formal, exacting, offended by sloppy scholarship',
            motivation: 'Keep the amber records from leaving the vault intact',
            voiceNotes: 'Measured, quiet, treats everyone like a junior assistant'
        }
    ],
    monsters: [
        {
            id: 'monster-amber-warden',
            name: 'Amber Warden',
            type: 'Construct',
            challengeRating: 'CR 5',
            hp: 84,
            keyAbilities: 'Resin lash, radiant pulse, immobilizing amber shell',
            notes: 'Use only if the vault opens loudly or the party breaks the ward lattice.'
        }
    ],
    locations: [
        {
            id: 'location-catalog',
            name: 'Catalog Hall',
            description: 'A circular chamber ringed with brass indexing arms and suspended file chains.',
            secrets: 'One shelf contains the missing sigil phrases hidden inside a fake ledger spine.',
            encounters: 'Rival scout or spectral clerk depending on party pace.'
        }
    ],
    loot: [
        {
            id: 'loot-ledger',
            name: 'Amber Ledger Fragment',
            type: 'Quest item',
            quantity: 1,
            notes: 'Contains a partial map to the Regent’s sealed reliquary.'
        }
    ],
    skillChecks: [
        {
            id: 'skill-lock',
            situation: 'Quietly bypass the maintenance hatch lock',
            skill: 'Thieves’ Tools',
            dc: 15,
            successOutcome: 'The hatch opens silently and grants a better approach angle.',
            failureOutcome: 'A metallic snap echoes through the tunnel and starts a patrol clock.'
        }
    ],
    secrets: [
        { id: 'secret-regent', text: 'The Regent financed the archive through a false charity network.' }
    ],
    branchingPaths: [
        { id: 'branch-rivals', text: 'If the party bargains with the rival crew, split the vault rewards but gain a recurring faction.' }
    ],
    nextSessionHooks: [
        { id: 'hook-door', text: 'The opened vault reveals a reliquary linked to the party’s patron.' }
    ]
};

export const SESSION_EDITOR_SAMPLE_JSON = JSON.stringify(SESSION_EDITOR_SAMPLE_DRAFT, null, 2);