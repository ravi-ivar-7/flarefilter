import { CloudflareApiBase } from './base';

export class ZonesApi extends CloudflareApiBase {
    /**
     * Fetches ALL zones accessible in the account.
     * Handles pagination — CF returns at most 50 zones per page.
     */
    async getZones(): Promise<any[]> {
        const allZones: any[] = [];
        let page = 1;
        const perPage = 50;

        while (true) {
            const payload = await this.fetchRestFull<any[]>(
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
