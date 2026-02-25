import { CloudflareApiBase } from './base';

export class AnalyticsApi extends CloudflareApiBase {
    /**
     * Queries top requested adaptive groups (Top IPs, Paths, etc.).
     */
    async getTopStats(params: {
        zoneTag: string;
        dimensions: string[];
        windowSeconds?: number;
        limit: number;
        latencyOffsetSeconds?: number;
    }): Promise<any[]> {
        const LATENCY = params.latencyOffsetSeconds ?? 60; // 1 min default
        const end = Date.now() - LATENCY * 1000;

        let datetimeStart = "";
        let datetimeEnd = "";

        if (params.windowSeconds) {
            const start = end - params.windowSeconds * 1000;
            datetimeStart = new Date(start).toISOString().split('.')[0] + 'Z';
            datetimeEnd = new Date(end).toISOString().split('.')[0] + 'Z';
        }

        const dimensionsStr = params.dimensions.join(', ');
        const filterStr = params.windowSeconds
            ? 'filter: { datetime_geq: $start, datetime_leq: $end }'
            : '';

        const query = `
      query GetTopStats($zoneTag: String!, $start: String, $end: String, $limit: Int!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequestsAdaptiveGroups(
              ${filterStr}
              limit: $limit
              orderBy: [count_DESC]
            ) {
              count
              dimensions { ${dimensionsStr} }
            }
          }
        }
      }
    `;

        const data = await this.fetchGraphQL(query, {
            zoneTag: params.zoneTag,
            start: datetimeStart || undefined,
            end: datetimeEnd || undefined,
            limit: params.limit,
        });

        const groups: any[] = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];
        return groups.map((g: any) => ({
            ...g.dimensions,
            count: g.count,
        }));
    }
}
