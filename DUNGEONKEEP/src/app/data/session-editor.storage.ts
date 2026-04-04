import { SessionEditorDraft } from '../models/session-editor.models';

const SESSION_EDITOR_STORAGE_PREFIX = 'dungeonkeep.session-editor';

export function buildSessionEditorStorageKey(campaignId: string, sessionId: string): string {
    return `${SESSION_EDITOR_STORAGE_PREFIX}.${campaignId}.${sessionId}`;
}

export function readStoredSessionEditorDraft(campaignId: string, sessionId: string): SessionEditorDraft | null {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined' || !campaignId || !sessionId) {
        return null;
    }

    const raw = window.localStorage.getItem(buildSessionEditorStorageKey(campaignId, sessionId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as SessionEditorDraft;
    } catch {
        window.localStorage.removeItem(buildSessionEditorStorageKey(campaignId, sessionId));
        return null;
    }
}

export function persistStoredSessionEditorDraft(campaignId: string, sessionId: string, draft: SessionEditorDraft): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined' || !campaignId || !sessionId) {
        return;
    }

    window.localStorage.setItem(buildSessionEditorStorageKey(campaignId, sessionId), JSON.stringify(draft));
}

export function removeStoredSessionEditorDraft(campaignId: string, sessionId: string): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined' || !campaignId || !sessionId) {
        return;
    }

    window.localStorage.removeItem(buildSessionEditorStorageKey(campaignId, sessionId));
}