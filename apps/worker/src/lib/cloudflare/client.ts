import { CloudflareApiBase } from './api/base';
import { CloudflareIpApi } from './api/ip';

export class CloudflareClient extends CloudflareApiBase {
    // We compose the client by importing our specific domain APIs
    public readonly ips: CloudflareIpApi;

    constructor(cfAccountId: string, cfApiToken: string) {
        super(cfAccountId, cfApiToken);

        // Instantiate domain-specific sub-clients
        this.ips = new CloudflareIpApi(cfAccountId, cfApiToken);

        // Future extensions:
        // this.asn = new CloudflareAsnApi(cfAccountId, cfApiToken);
        // this.countries = new CloudflareCountryApi(cfAccountId, cfApiToken);
    }
}
