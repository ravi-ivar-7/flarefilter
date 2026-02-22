import { CloudflareApiBase } from './base';

export class CloudflareIpApi extends CloudflareApiBase {
  /**
   * Queries Analytics for abusive client IPs based on request volume.
   * Paginates through all results in pages of PAGE_SIZE to ensure no
   * abusive IPs are missed when more than PAGE_SIZE IPs exceed the threshold.
   */
  async getAbusive(
    cfZoneId: string,
    threshold: number,
    windowSeconds: number
  ): Promise<{ ip: string; count: number }[]> {
    const datetimeEnd = new Date().toISOString();
    const datetimeStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const query = `
            query GetAbusiveIPs(
                $zoneTag: String!,
                $datetimeStart: String!,
                $datetimeEnd: String!,
                $limit: Int!
            ) {
              viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                  httpRequestsAdaptiveGroups(
                    filter: {
                      datetime_geq: $datetimeStart,
                      datetime_leq: $datetimeEnd,
                    }
                    limit: $limit
                    orderBy: [count_DESC]
                  ) {
                    count
                    dimensions { clientIP }
                  }
                }
              }
            }
        `;

    const allGroups: { ip: string; count: number }[] = [];

    try {
      const data = await this.fetchGraphQL(query, {
        zoneTag: cfZoneId,
        datetimeStart,
        datetimeEnd,
        limit: 10000,
      });

      const page = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];

      for (const g of page) {
        if (g.count > threshold) {
          allGroups.push({ ip: g.dimensions.clientIP, count: g.count });
        }
      }
    } catch (err) {
      console.error(`Failed to query Abusive IPs for zone ${cfZoneId}:`, err);
    }

    return allGroups;
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
