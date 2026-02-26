import { CloudflareApiBase } from './base';

export interface TopStatsParams {
  zoneTag: string;
  dimensions: string[];
  windowSeconds?: number;
  limit: number;
  latencyOffsetSeconds?: number;
}

export class AnalyticsApi extends CloudflareApiBase {
  /**
   * Queries top requested adaptive groups for a single zone.
   */
  async getTopStats(params: TopStatsParams): Promise<any[]> {
    const result = await this.getTopStatsBatch([params]);
    return result.get(params.zoneTag) ?? [];
  }

  /**
   * Batches multiple zone analytics queries into a SINGLE GraphQL HTTP
   * request using field aliases.
   *
   * For N zones on the same CF account this reduces N HTTP round-trips
   * to the GraphQL endpoint down to 1.
   *
   * Returns results keyed by zoneTag.
   */
  async getTopStatsBatch(
    paramsList: TopStatsParams[]
  ): Promise<Map<string, any[]>> {
    if (paramsList.length === 0) return new Map();

    // If only one zone, no aliasing or extra variables needed — fast path.
    if (paramsList.length === 1) {
      return new Map([[paramsList[0].zoneTag, await this._singleZoneQuery(paramsList[0])]]);
    }

    // ── Build an aliased GraphQL query ────────────────────────────────────
    // Each zone gets its own aliased `zones()` block inside `viewer {}`.
    //
    // Example for 2 zones:
    //   viewer {
    //     zone_0: zones(filter: { zoneTag: $zt0 }) { httpRequestsAdaptiveGroups(...) { ... } }
    //     zone_1: zones(filter: { zoneTag: $zt1 }) { httpRequestsAdaptiveGroups(...) { ... } }
    //   }

    const variableDefs: string[] = [];
    const aliasBlocks: string[] = [];
    const variables: Record<string, any> = {};

    paramsList.forEach((p, i) => {
      const alias = `zone_${i}`;
      const ztVar = `$zt${i}`;
      const startVar = `$start${i}`;
      const endVar = `$end${i}`;
      const limitVar = `$limit${i}`;

      variableDefs.push(`${ztVar}: String!`, `${startVar}: String`, `${endVar}: String`, `${limitVar}: Int!`);

      const LATENCY = p.latencyOffsetSeconds ?? 60;
      const end = Date.now() - LATENCY * 1000;

      let datetimeStart = '';
      let datetimeEnd = '';
      if (p.windowSeconds) {
        const start = end - p.windowSeconds * 1000;
        datetimeStart = new Date(start).toISOString().split('.')[0] + 'Z';
        datetimeEnd = new Date(end).toISOString().split('.')[0] + 'Z';
      }

      const filterStr = p.windowSeconds
        ? `filter: { datetime_geq: ${startVar}, datetime_leq: ${endVar} }`
        : '';
      const dimensionsStr = p.dimensions.join(', ');

      aliasBlocks.push(`
                ${alias}: zones(filter: { zoneTag: ${ztVar} }) {
                    httpRequestsAdaptiveGroups(
                        ${filterStr}
                        limit: ${limitVar}
                        orderBy: [count_DESC]
                    ) {
                        count
                        dimensions { ${dimensionsStr} }
                    }
                }
            `);

      variables[`zt${i}`] = p.zoneTag;
      variables[`start${i}`] = datetimeStart || undefined;
      variables[`end${i}`] = datetimeEnd || undefined;
      variables[`limit${i}`] = p.limit;
    });

    const query = `
            query GetTopStatsBatch(${variableDefs.join(', ')}) {
                viewer {
                    ${aliasBlocks.join('\n')}
                }
            }
        `;

    const data = await this.fetchGraphQL(query, variables);
    const result = new Map<string, any[]>();

    paramsList.forEach((p, i) => {
      const alias = `zone_${i}`;
      const zoneData = data?.viewer?.[alias];
      if (!zoneData || zoneData.length === 0) {
        console.error(`  Analytics batch: zone ${p.zoneTag} (alias=${alias}) returned no data — may be invalid or inaccessible.`);
        result.set(p.zoneTag, []);
        return;
      }
      const groups: any[] = zoneData[0]?.httpRequestsAdaptiveGroups ?? [];
      result.set(
        p.zoneTag,
        groups.map((g: any) => ({ ...g.dimensions, count: g.count }))
      );
    });

    return result;
  }

  /**
   * Internal single-zone query — used by the fast path in getTopStatsBatch.
   */
  private async _singleZoneQuery(params: TopStatsParams): Promise<any[]> {
    const LATENCY = params.latencyOffsetSeconds ?? 60;
    const end = Date.now() - LATENCY * 1000;

    let datetimeStart = '';
    let datetimeEnd = '';

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
    return groups.map((g: any) => ({ ...g.dimensions, count: g.count }));
  }
}
