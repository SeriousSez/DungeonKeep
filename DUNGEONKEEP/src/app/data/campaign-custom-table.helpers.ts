import { CampaignCustomTable } from '../models/campaign-custom-table.models';

export function createCustomTableId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeCustomTableTitle(title: string): string {
    return title.trim().toLowerCase();
}

export function sanitizeCustomTable(table: CampaignCustomTable): CampaignCustomTable {
    const title = table.title.trim() || 'Untitled Table';
    const description = table.description.trim();
    const entries = table.entries.map((entry) => entry.trim()).filter(Boolean);

    return {
        ...table,
        title,
        description,
        entries,
        updatedAt: new Date().toISOString()
    };
}

export function createDefaultCustomTable(title: string): CampaignCustomTable {
    return {
        id: createCustomTableId(),
        title,
        description: '',
        entries: ['Example result'],
        updatedAt: new Date().toISOString()
    };
}

export function nextCustomTableTitle(tables: readonly CampaignCustomTable[]): string {
    const titlesInUse = new Set(tables.map((table) => normalizeCustomTableTitle(table.title)));
    let counter = 1;
    let nextTitle = 'New Table';

    while (titlesInUse.has(normalizeCustomTableTitle(nextTitle))) {
        counter += 1;
        nextTitle = `New Table ${counter}`;
    }

    return nextTitle;
}

export function nextImportedCustomTableTitle(title: string, tables: readonly CampaignCustomTable[]): string {
    const titlesInUse = new Set(tables.map((table) => normalizeCustomTableTitle(table.title)));
    if (!titlesInUse.has(normalizeCustomTableTitle(title))) {
        return title;
    }

    let counter = 2;
    let nextTitle = `${title} ${counter}`;

    while (titlesInUse.has(normalizeCustomTableTitle(nextTitle))) {
        counter += 1;
        nextTitle = `${title} ${counter}`;
    }

    return nextTitle;
}
