import { RuleHandler, RuleContext } from '../interface';

export class AddIpToListRule implements RuleHandler {
    /**
     * Queries Cloudflare Analytics for IPs exceeding the rule's threshold,
     * adds them to the configured CF Custom List in a single batch API call,
     * and writes audit log entries only for IPs that were genuinely new
     * (not already present in the list).
     */
    async execute({ zone, rule, cf, actionLogger }: RuleContext): Promise<void> {
        console.log(
            `  Rule [add_ip_to_list] id=${rule.id} list=${rule.cfListId} ` +
            `threshold=${rule.rateLimitThreshold} window=${rule.windowSeconds}s`
        );

        // Guard: validate required rule fields at runtime.
        // `rule` is typed as `any` so TypeScript's `!` assertions give no real safety.
        // A NULL cfListId produces a URL like `.../lists/null/items` (404 from CF).
        // NULL threshold/window will silently match nothing or use a 0-second window.
        const { cfListId, rateLimitThreshold, windowSeconds: ruleWindowSeconds } = rule;
        if (!cfListId || typeof rateLimitThreshold !== 'number' || typeof ruleWindowSeconds !== 'number') {
            console.error(
                `  Rule ${rule.id} has invalid configuration — skipping.`,
                { cfListId, rateLimitThreshold, windowSeconds: ruleWindowSeconds }
            );
            return;
        }

        let flaggedIPs: { ip: string; count: number }[] = [];

        // 1. Fetch abusive IPs — throws if the CF GraphQL query itself fails.
        try {
            flaggedIPs = await cf.getAbusiveIps(
                zone.cfZoneId,
                rateLimitThreshold,
                ruleWindowSeconds
            );
        } catch (err: any) {
            console.error(`  Failed to query abusive IPs for rule ${rule.id} on zone ${zone.name}:`, err.message);
            return; // Can't proceed without data — bail for this rule cycle.
        }

        if (flaggedIPs.length === 0) {
            console.log(`  No IPs exceeded threshold for rule ${rule.id}.`);
            return;
        }

        console.log(`  Found ${flaggedIPs.length} flagged IP(s). Submitting batch to CF list…`);

        // 2. Add IPs to the CF list.
        //    addItemsSafe handles the mixed case:
        //      - Fast path: single batch POST (all new).
        //      - Slow path: per-item POSTs if batch is rejected for duplicates,
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
            console.log(`  ${alreadyInListIps.length} IP(s) already in list: ${preview}`);
        }
        if (failed.length > 0) {
            const failedIps = failed.map(i => i.ip);
            const preview = failedIps.length > 10
                ? `${failedIps.slice(0, 10).join(', ')} … (+${failedIps.length - 10} more)`
                : failedIps.join(', ');
            console.error(`  ${failedIps.length} IP(s) failed to add: ${preview}`);
        }

        if (added.length === 0) {
            console.log(`  No new IPs added to list for rule ${rule.id}.`);
            return;
        }

        // 4. Batch-insert audit log entries ONLY for newly added IPs.
        const now = new Date();
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
                metadata: JSON.stringify({ cfListId, cfOperationIds: operationIds }),
                timestamp: now,
            }))
        );

        console.log(
            `  Done. Added: ${added.length}, Already in list: ${alreadyInList.length}, Failed: ${failed.length}.`
        );
    }
}
