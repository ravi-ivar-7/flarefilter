import { CloudflareClient as SharedClient } from '@flarefilter/cloudflare';

/**
 * Composes all CF domain-specific API clients.
 * Wraps the shared CloudflareClient to provide worker-specific convenience methods
 * or maintain API compatibility if needed.
 */
export class CloudflareClient extends SharedClient {
    /**
     * Legacy/Convenience alias for analytics top stats specialized for abusive IPs.
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
            latencyOffsetSeconds: 60, // Match the original latency buffer
        });

        return results
            .filter((r: any) => r.count > threshold)
            .map((r: any) => ({ ip: r.clientIP, count: r.count }));
    }
}
