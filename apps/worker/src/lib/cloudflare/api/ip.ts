import { CloudflareApiBase } from './base';

export class CloudflareIpApi extends CloudflareApiBase {
    /**
     * Queries Analytics for abusive client IPs based on request volume. 
     */
    async getAbusive(
        cfZoneId: string,
        threshold: number,
        windowSeconds: number
    ): Promise<{ ip: string; count: number }[]> {
        const datetimeEnd = new Date().toISOString();
        const datetimeStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

        const query = `
            query GetAbusiveIPs($zoneTag: String!, $datetimeStart: String!, $datetimeEnd: String!) {
              viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                  httpRequestsAdaptiveGroups(
                    filter: {
                      datetime_geq: $datetimeStart,
                      datetime_leq: $datetimeEnd,
                    }
                    limit: 1000
                    orderBy: [count_DESC]
                  ) {
                    count
                    dimensions { clientIP }
                  }
                }
              }
            }
        `;

        try {
            const data = await this.fetchGraphQL(query, { zoneTag: cfZoneId, datetimeStart, datetimeEnd });
            const groups = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];

            return groups
                .filter((g: any) => g.count > threshold)
                .map((g: any) => ({ ip: g.dimensions.clientIP, count: g.count }));
        } catch (err) {
            console.error(`Failed to query Abusive IPs for zone ${cfZoneId}:`, err);
            return [];
        }
    }

    /**
     * Pushes a specific IP constraint to a Cloudflare Custom Rule/List.
     */
    async addToList(
        cfListId: string,
        ip: string,
        comment: string = `FlareFilter auto-block ${new Date().toISOString()}`
    ): Promise<string | null> {
        try {
            const result = await this.fetchRest(
                `/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items`,
                {
                    method: 'POST',
                    body: JSON.stringify([{ ip, comment }]),
                }
            );
            return result?.items?.[0]?.id ?? null;
        } catch (err) {
            console.error(`Failed to add ${ip} to List ${cfListId}:`, err);
            return null;
        }
    }
}
