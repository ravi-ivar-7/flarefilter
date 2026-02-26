import { RuleHandler, RuleContext } from '../interface';
import { log } from '../../lib/log';

export class AddIpToListRule implements RuleHandler {
    /**
     * Queries Cloudflare Analytics for IPs exceeding the rule's threshold,
     * adds them to the configured CF Custom List in a single batch API call,
     * and writes audit log entries only for IPs that were genuinely new
     * (not already present in the list).
     */
    async execute({ zone, rule, cf, actionLogger, prefetchedIps }: RuleContext): Promise<void> {
        log(
            `  Rule [add_ip_to_list] id=${rule.id} list=${rule.cfListId} ` +
            `threshold=${rule.rateLimitThreshold} window=${rule.windowSeconds}s`
        );

        // Guard: validate required rule fields at runtime.
        const { cfListId, rateLimitThreshold, windowSeconds: ruleWindowSeconds } = rule;
        if (!cfListId || typeof rateLimitThreshold !== 'number' || typeof ruleWindowSeconds !== 'number') {
            console.error(
                `  Rule ${rule.id} has invalid configuration — skipping.`,
                { cfListId, rateLimitThreshold, windowSeconds: ruleWindowSeconds }
            );
            return;
        }

        let flaggedIPs: { ip: string; count: number }[] = [];

        // 1. Use pre-fetched IPs when supplied by the batched cron orchestrator.
        //    Fall back to a per-rule analytics query only when not available.
        if (prefetchedIps) {
            // Re-filter against THIS rule's threshold — the batched query used
            // the lowest threshold across all rules on this zone, so the
            // pre-fetched set may contain IPs below this specific rule's bar.
            flaggedIPs = prefetchedIps.filter(({ count }) => count > rateLimitThreshold);
            log(`  Using ${flaggedIPs.length} pre-fetched flagged IP(s) for rule ${rule.id} (filtered from ${prefetchedIps.length}).`);
        } else {
            try {
                flaggedIPs = await cf.getAbusiveIps(
                    zone.cfZoneId,
                    rateLimitThreshold,
                    ruleWindowSeconds
                );
            } catch (err: any) {
                console.error(`  Failed to query abusive IPs for rule ${rule.id} on zone ${zone.name}:`, err.message);
                return;
            }
        }

        if (flaggedIPs.length === 0) {
            log(`  No IPs exceeded threshold for rule ${rule.id}.`);
            return;
        }

        log(`  Found ${flaggedIPs.length} flagged IP(s). Submitting batch to CF list…`);

        // 2. Add IPs to the CF list.
        //    addItemsSafe handles the mixed case:
        //      - Fast path: single batch POST (all new).
        //      - Slow path: sequential per-item POSTs in chunks,
        //                   so new items are never silently lost with the dupes.
        let added: any[] = [];
        let alreadyInList: any[] = [];
        let failed: any[] = [];
        let operationIds: string[] = [];

        try {
            const comment = `FlareFilter auto-added ${new Date().toISOString()}`;
            ({ added, alreadyInList, failed, operationIds } = await cf.lists.addItemsSafe(
                cfListId,
                flaggedIPs.map(({ ip }) => ({ ip, comment }))
            ));
        } catch (err: any) {
            // Hard error (non-duplicate): auth failure, list not found, etc.
            console.error(`  CF list add failed for rule ${rule.id}:`, err.message);
            return; // Nothing was added — don't log phantom entries.
        }

        // 3. Log summary before writing to DB.
        if (alreadyInList.length > 0) {
            const alreadyInListIps = alreadyInList.map(i => i.ip);
            const preview = alreadyInListIps.length > 10
                ? `${alreadyInListIps.slice(0, 10).join(', ')} … (+${alreadyInListIps.length - 10} more)`
                : alreadyInListIps.join(', ');
            log(`  ${alreadyInListIps.length} IP(s) already in list: ${preview}`);
        }
        if (failed.length > 0) {
            const failedIps = failed.map(i => i.ip);
            const preview = failedIps.length > 10
                ? `${failedIps.slice(0, 10).join(', ')} … (+${failedIps.length - 10} more)`
                : failedIps.join(', ');
            console.error(`  ${failedIps.length} IP(s) failed to add: ${preview}`);
        }

        if (added.length === 0) {
            log(`  No new IPs added to list for rule ${rule.id}.`);
            return;
        }

        // 4. Pre-compute metadata string ONCE — identical for every IP in this batch.
        //    Avoids calling JSON.stringify() inside the .map() for every row.
        const metadata = JSON.stringify({ cfListId, cfOperationIds: operationIds });
        const now = new Date();

        // 5. Batch-insert audit log entries ONLY for newly added IPs.
        const addedSet = new Set(added.map(i => i.ip));
        const newlyAdded = flaggedIPs.filter(({ ip }) => addedSet.has(ip));
        await actionLogger.logActions(
            newlyAdded.map(({ ip, count }) => ({
                tenantId: zone.tenantId,
                zoneConfigId: zone.id,
                ruleId: rule.id,
                actionTaken: 'IP_ADDED_TO_LIST',
                targetType: 'IP',
                targetValue: ip,
                requestCount: count,
                // cfOperationIds lets us trace back to the exact CF async
                // operation(s) that added this IP — useful for auditing/rollback.
                metadata,
                timestamp: now,
            }))
        );

        log(
            `  Done. Added: ${added.length}, Already in list: ${alreadyInList.length}, Failed: ${failed.length}.`
        );
    }
}
