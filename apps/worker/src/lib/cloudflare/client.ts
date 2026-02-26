import { CloudflareClient as SharedClient } from '@flarefilter/cloudflare';

/**
 * Composes all CF domain-specific API clients.
 * Wraps the shared CloudflareClient to provide worker-specific convenience methods.
 */
export class CloudflareClient extends SharedClient {
    /**
     * Legacy/Convenience alias for a single zone.
     */
    async getAbusiveIps(
        cfZoneId: string,
        threshold: number,
        windowSeconds: number
    ): Promise<{ ip: string; count: number }[]> {
        const results = await this.analytics.getTopStats({
            zoneTag: cfZoneId,
            dimensions: ['clientIP'],
            windowSeconds,
            limit: 10000,
            latencyOffsetSeconds: 60,
        });

        return results
            .filter((r: any) => r.count > threshold)
            .map((r: any) => ({ ip: r.clientIP, count: r.count }));
    }

    /**
     * Batched analytics fetch: queries ALL supplied zones in ONE GraphQL
     * HTTP request, then filters each zone's results by its own threshold.
     *
     * Returns a Map<cfZoneId, flaggedIPs[]>.
     */
    async getAbusiveIpsBatch(
        zones: { cfZoneId: string; threshold: number; windowSeconds: number }[]
    ): Promise<Map<string, { ip: string; count: number }[]>> {
        if (zones.length === 0) return new Map();

        const batchResults = await this.analytics.getTopStatsBatch(
            zones.map(z => ({
                zoneTag: z.cfZoneId,
                dimensions: ['clientIP'],
                windowSeconds: z.windowSeconds,
                limit: 10000,
                latencyOffsetSeconds: 60,
            }))
        );

        // Apply per-zone thresholds.
        const result = new Map<string, { ip: string; count: number }[]>();
        for (const z of zones) {
            const raw = batchResults.get(z.cfZoneId) ?? [];
            result.set(
                z.cfZoneId,
                raw
                    .filter((r: any) => r.count > z.threshold)
                    .map((r: any) => ({ ip: r.clientIP, count: r.count }))
            );
        }

        return result;
    }
}
