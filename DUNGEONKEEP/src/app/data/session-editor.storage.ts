import { SessionEditorDraft } from '../models/session-editor.models';

const SESSION_LOOT_ASSIGNMENT_STORAGE_PREFIX = 'dungeonkeep.session-loot-assignment';

export interface SessionLootAllocation {
    characterId: string;
    quantity: number;
}

export interface SessionLootAssignmentEntry {
    itemName: string;
    itemCategory: string;
    allocations: SessionLootAllocation[];
}

export function readStoredSessionEditorDraft(campaignId: string, sessionId: string): SessionEditorDraft | null {
    void campaignId;
    void sessionId;
    return null;
}

export function persistStoredSessionEditorDraft(campaignId: string, sessionId: string, draft: SessionEditorDraft): void {
    void campaignId;
    void sessionId;
    void draft;
}

export function removeStoredSessionEditorDraft(campaignId: string, sessionId: string): void {
    void campaignId;
    void sessionId;
}

export function readStoredSessionLootAssignments(campaignId: string, sessionId: string): Record<string, SessionLootAssignmentEntry> {
    void campaignId;
    void sessionId;
    return {};
}