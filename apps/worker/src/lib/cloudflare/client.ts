import { CloudflareIpApi } from './api/ip';

/**
 * Composes all CF domain-specific API clients.
 * Does NOT extend CloudflareApiBase — that is an internal base for the
 * sub-clients only. CloudflareClient is purely a composition root.
 */
export class CloudflareClient {
    public readonly ips: CloudflareIpApi;

    constructor(cfAccountId: string, cfApiToken: string) {
        this.ips = new CloudflareIpApi(cfAccountId, cfApiToken);

        // Future extensions:
        // this.asn = new CloudflareAsnApi(cfAccountId, cfApiToken);
        // this.countries = new CloudflareCountryApi(cfAccountId, cfApiToken);
    }
}
