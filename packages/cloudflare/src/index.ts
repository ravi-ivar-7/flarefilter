import { ListsApi } from './lists';
import { AnalyticsApi } from './analytics';
import { ZonesApi } from './zones';

export * from './base';
export * from './lists';
export * from './analytics';
export * from './zones';

export class CloudflareClient {
    public readonly lists: ListsApi;
    public readonly analytics: AnalyticsApi;
    public readonly zones: ZonesApi;

    constructor(cfAccountId: string, cfApiToken: string) {
        this.lists = new ListsApi(cfAccountId, cfApiToken);
        this.analytics = new AnalyticsApi(cfAccountId, cfApiToken);
        this.zones = new ZonesApi(cfAccountId, cfApiToken);
    }
}
