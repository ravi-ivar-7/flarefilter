import { CloudflareApiBase } from './base';

export class CloudflareIpApi extends CloudflareApiBase {
  /**
   * Queries Analytics for abusive client IPs based on request volume.
   *
   * Uses `httpRequestsAdaptiveGroups` with a high limit and applies the
   * threshold filter client-side so we can return exactly the set exceeding
   * the threshold without having to paginate.
   *
   * NOTE: Throws on API/network errors so callers can distinguish between
   * "no abusive IPs found" and "query failed".
   */
  async getAbusive(
    cfZoneId: string,
    threshold: number,
    windowSeconds: number
  ): Promise<{ ip: string; count: number }[]> {
    // Analytics ingestion delay: offset 'end' slightly so data has landed.
    const LATENCY_OFFSET_MS = 60 * 1000; // 1 min safety buffer
    const end = Date.now() - LATENCY_OFFSET_MS;
    const start = end - windowSeconds * 1000;

    const datetimeEnd = new Date(end).toISOString().split('.')[0] + 'Z';
    const datetimeStart = new Date(start).toISOString().split('.')[0] + 'Z';

    console.log(`    Querying Analytics: ${datetimeStart} → ${datetimeEnd} (threshold: ${threshold})`);

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

    // NOTE: This throws on failure — do NOT swallow here.
    const data = await this.fetchGraphQL(query, {
      zoneTag: cfZoneId,
      datetimeStart,
      datetimeEnd,
      limit: 10000,
    });

    const groups: any[] = data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];
    console.log(`    Cloudflare returned ${groups.length} IP groups.`);

    const flagged = groups
      .filter(g => g.count > threshold)
      .map(g => ({ ip: g.dimensions.clientIP as string, count: g.count as number }));

    console.log(`    ${flagged.length} IPs exceeded threshold of ${threshold}.`);
    return flagged;
  }

  /**
   * Raw batch add — sends all IPs in a single POST.
   * Throws on any CF API error (including duplicates).
   * Returns the CF operation_id for the caller to track/store.
   * Prefer `addItemsToListSafe` unless you know your IPs are all new.
   */
  private async addItemsToList(
    cfListId: string,
    ips: string[],
    comment: string
  ): Promise<string | null> {
    if (ips.length === 0) return null;
    const body = ips.map(ip => ({ ip, comment }));
    const result = await this.fetchRest(
      `/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items`,
      { method: 'POST', body: JSON.stringify(body) }
    );
    // CF returns { operation_id } for async list mutations.
    return result?.operation_id ?? null;
  }

  /**
   * Safely adds IPs to a CF list, handling the mixed-batch case:
   * some IPs might already be in the list, some might be new.
   *
   * Strategy:
   *   1. Fast path  — try a single batch POST (cheap: 1 API call).
   *   2. Slow path  — if CF rejects the batch for duplicates, fall back
   *                   to per-IP POSTs so new IPs aren't lost along with
   *                   the dupes.
   *
   * Returns a categorised result so the caller knows exactly which IPs
   * were genuinely new, which were already present, and which hard-failed.
   */
  async addItemsToListSafe(
    cfListId: string,
    ips: string[],
    comment: string = `FlareFilter auto-added ${new Date().toISOString()}`
  ): Promise<{ added: string[]; alreadyInList: string[]; failed: string[]; operationIds: string[] }> {
    if (ips.length === 0) return { added: [], alreadyInList: [], failed: [], operationIds: [] };

    // ── Fast path: try the whole batch at once (1 API call) ─────────────
    try {
      const operationId = await this.addItemsToList(cfListId, ips, comment);
      // Entire batch accepted — all IPs are newly added.
      return {
        added: ips,
        alreadyInList: [],
        failed: [],
        operationIds: operationId ? [operationId] : [],
      };
    } catch (err: any) {
      const isDuplicate =
        err.message?.toLowerCase().includes('duplicate') ||
        err.message?.toLowerCase().includes('already exists');

      if (!isDuplicate) {
        // Hard CF error (auth, list not found, etc.) — rethrow so the
        // caller can bubble it out cleanly.
        throw err;
      }
      // Some IPs are dupes — fall through to the slow path.
      console.log(`  Batch rejected (duplicates detected). Falling back to per-IP adds…`);
    }

    // ── Slow path: add in chunks to balance throughput vs CF rate limits ─────
    // Firing ALL IPs concurrently risks hitting CF's list API rate limit
    // (typically ~1200 req/min). Chunking at 20 concurrent gives ~1200/min
    // max throughput while keeping wall-clock time low.
    const CHUNK_SIZE = 20;
    const added: string[] = [];
    const alreadyInList: string[] = [];
    const failed: string[] = [];
    const operationIds: string[] = [];

    for (let i = 0; i < ips.length; i += CHUNK_SIZE) {
      const chunk = ips.slice(i, i + CHUNK_SIZE);

      const chunkResults = await Promise.allSettled(
        chunk.map(ip => this.addItemsToList(cfListId, [ip], comment).then(opId => ({ ip, opId })))
      );

      chunkResults.forEach((result, j) => {
        if (result.status === 'fulfilled') {
          added.push(result.value.ip);
          if (result.value.opId) operationIds.push(result.value.opId);
        } else {
          const err = result.reason;
          const ip = chunk[j]; // chunk preserves order
          const isDuplicate =
            err.message?.toLowerCase().includes('duplicate') ||
            err.message?.toLowerCase().includes('already exists');

          if (isDuplicate) {
            alreadyInList.push(ip);
          } else {
            console.error(`  Failed to add ${ip} to list ${cfListId}:`, err.message);
            failed.push(ip);
          }
        }
      });
    }

    return { added, alreadyInList, failed, operationIds };
  }
}
