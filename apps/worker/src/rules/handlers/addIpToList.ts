import { RuleHandler, RuleContext } from '../interface';

export class AddIpToListRule implements RuleHandler {
    /**
     * Finds abusive IPs in Analytics and pushes them to a Custom List.
     */
    async execute({ zone, rule, cf, actionLogger }: RuleContext): Promise<void> {
        console.log(`  Rule: add_ip_to_list → list=${rule.cfListId}, threshold=${rule.rateLimitThreshold}, window=${rule.windowSeconds}s`);

        try {
            // 1. Fetch abusive IPs using the dedicated CF Client
            const flaggedIPs = await cf.ips.getAbusive(
                zone.cfZoneId,
                rule.rateLimitThreshold!,
                rule.windowSeconds!
            );

            if (flaggedIPs.length === 0) {
                console.log(`  No threats for rule ${rule.id}.`);
                return;
            }

            console.log(`  Found ${flaggedIPs.length} flagged IPs. Processing actions...`);
            let blockedCount = 0;

            // 2. Insert to List and Audit Log
            for (const { ip, count } of flaggedIPs) {
                try {
                    const cfListItemId = await cf.ips.addToList(rule.cfListId, ip);

                    await actionLogger.logAction({
                        tenantId: zone.tenantId,
                        zoneConfigId: zone.id,
                        ruleId: rule.id,
                        actionTaken: 'IP_BLOCKED',
                        targetType: 'IP',
                        targetValue: ip,
                        requestCount: count,
                        metadata: JSON.stringify({ cfListId: rule.cfListId, cfListItemId }),
                    });
                    blockedCount++;
                } catch (err: any) {
                    // Check if it's a "duplicate" error, which we can ignore
                    if (err.message.includes('duplicate') || err.message.includes('already exists')) {
                        console.log(`  IP ${ip} is already blocked. Skipping.`);
                    } else {
                        console.error(`  Failed to block IP ${ip}:`, err.message);
                    }
                }
            }

            if (blockedCount > 0) {
                console.log(`  Successfully blocked ${blockedCount} new IPs.`);
            }
        } catch (err) {
            console.error(`  Error processing AddIpToList rule ${rule.id} on zone ${zone.name}:`, err);
        }
    }
}
