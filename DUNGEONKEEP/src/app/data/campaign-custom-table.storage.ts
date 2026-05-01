import { CampaignCustomTable } from '../models/campaign-custom-table.models';

export function loadCampaignCustomTables(campaignId: string): CampaignCustomTable[] | null {
    void campaignId;
    return null;
}

export function saveCampaignCustomTables(campaignId: string, tables: readonly CampaignCustomTable[]): void {
    void campaignId;
    void tables;
}

export function clearCampaignCustomTables(campaignId: string): void {
    void campaignId;
}

export function loadCustomTableLibrary(): CampaignCustomTable[] | null {
    return null;
}

export function saveCustomTableLibrary(tables: readonly CampaignCustomTable[]): void {
    void tables;
}

export function clearCustomTableLibrary(): void {
}
