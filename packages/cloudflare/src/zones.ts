import { CloudflareApiBase } from './base';

// ── Cloudflare Zone shape ────────────────────────────────────────────────────

export interface CfZone {
    id: string;
    name: string;
    status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
    paused: boolean;
    type: 'full' | 'partial' | 'secondary';
    account: { id: string; name: string };
    plan?: { name: string; price: number };
    modified_on: string;
    created_on: string;
}

export class ZonesApi extends CloudflareApiBase {
    /**
     * Fetches ALL zones accessible in the account.
     * Handles pagination — CF returns at most 50 zones per page.
     */
    async getZones(): Promise<CfZone[]> {
        const allZones: CfZone[] = [];
        let page = 1;
        const perPage = 50;

        while (true) {
            const payload = await this.fetchRestFull<CfZone[]>(
                `/zones?account.id=${this.cfAccountId}&per_page=${perPage}&page=${page}`
            );

            allZones.push(...payload.result);

            // Stop when we've fetched all pages.
            const totalPages = payload.result_info?.total_pages ?? 1;
            if (page >= totalPages) break;
            page++;
        }

        return allZones;
    }
}
