import { CampaignCustomTable } from '../models/campaign-custom-table.models';

export function createCustomTableId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeCustomTableTitle(title: string): string {
    return title.trim().toLowerCase();
}

export function normalizeCustomTableEntry(entry: string): string {
    const rawCells = entry.split('|').map((cell) => cell.trim());
    const hasContent = rawCells.some((cell) => cell.length > 0);

    if (!hasContent) {
        return '';
    }

    return rawCells.length > 1 ? rawCells.join(' | ') : rawCells[0];
}

export function getCustomTableRows(entries: readonly string[]): string[][] {
    const normalizedRows = entries
        .map((entry) => normalizeCustomTableEntry(entry))
        .filter(Boolean)
        .map((entry) => entry.split('|').map((cell) => cell.trim()));

    const columnCount = Math.max(1, ...normalizedRows.map((row) => row.length));

    return normalizedRows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? ''));
}

export function formatCustomTableEntry(entry: string): string {
    const cells = normalizeCustomTableEntry(entry)
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);

    return cells.join(' — ');
}

export function normalizeCustomTableLabels(values: readonly string[] | undefined, count: number, prefix: string): string[] {
    return Array.from({ length: Math.max(1, count) }, (_, index) => {
        const trimmed = values?.[index]?.trim();
        return trimmed || `${prefix} ${index + 1}`;
    });
}

export function sanitizeCustomTable(table: CampaignCustomTable): CampaignCustomTable {
    const title = table.title.trim() || 'Untitled Table';
    const description = table.description.trim();
    const entries = table.entries.map((entry) => normalizeCustomTableEntry(entry)).filter(Boolean);
    const rows = getCustomTableRows(entries);
    const rowCount = Math.max(1, rows.length || entries.length);
    const columnCount = Math.max(1, ...rows.map((row) => row.length));

    return {
        ...table,
        title,
        description,
        entries,
        rowLabels: normalizeCustomTableLabels(table.rowLabels, rowCount, 'Row'),
        columnLabels: normalizeCustomTableLabels(table.columnLabels, columnCount, 'Column'),
        updatedAt: new Date().toISOString()
    };
}

export function createDefaultCustomTable(title: string): CampaignCustomTable {
    return {
        id: createCustomTableId(),
        title,
        description: '',
        entries: ['Example result'],
        rowLabels: ['Row 1'],
        columnLabels: ['Column 1'],
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
