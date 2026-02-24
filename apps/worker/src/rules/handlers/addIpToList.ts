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
            flaggedIPs = await cf.ips.getAbusive(
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
        //    addItemsToListSafe handles the mixed case:
        //      - Fast path: single batch POST (all new).
        //      - Slow path: per-IP POSTs if batch is rejected for duplicates,
        //                   so new IPs are never silently lost with the dupes.
        let added: string[] = [];
        let alreadyInList: string[] = [];
        let failed: string[] = [];
        let operationIds: string[] = [];

        try {
            ({ added, alreadyInList, failed, operationIds } = await cf.ips.addItemsToListSafe(
                cfListId,
                flaggedIPs.map(({ ip }) => ip)
            ));
        } catch (err: any) {
            // Hard error (non-duplicate): auth failure, list not found, etc.
            console.error(`  CF list add failed for rule ${rule.id}:`, err.message);
            return; // Nothing was added — don't log phantom entries.
        }

        // 3. Log summary before writing to DB.
        if (alreadyInList.length > 0) {
            const preview = alreadyInList.length > 10
                ? `${alreadyInList.slice(0, 10).join(', ')} … (+${alreadyInList.length - 10} more)`
                : alreadyInList.join(', ');
            console.log(`  ${alreadyInList.length} IP(s) already in list: ${preview}`);
        }
        if (failed.length > 0) {
            const preview = failed.length > 10
                ? `${failed.slice(0, 10).join(', ')} … (+${failed.length - 10} more)`
                : failed.join(', ');
            console.error(`  ${failed.length} IP(s) failed to add: ${preview}`);
        }

        if (added.length === 0) {
            console.log(`  No new IPs added to list for rule ${rule.id}.`);
            return;
        }

        // 4. Batch-insert audit log entries ONLY for newly added IPs.
        const now = new Date();
        const addedSet = new Set(added);
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
