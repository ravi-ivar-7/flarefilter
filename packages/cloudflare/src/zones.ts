import { CloudflareApiBase } from './base';

export class ZonesApi extends CloudflareApiBase {
    /**
     * Fetches all zones accessible in the account.
     */
    async getZones(): Promise<any[]> {
        return this.fetchRest(`/zones?account.id=${this.cfAccountId}`);
    }
}
