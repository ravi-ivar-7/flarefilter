import { RuleHandler, RuleContext } from '../interface';

export class AddToListRule implements RuleHandler {
    /**
     * Finds abusive IPs in Analytics and pushes them to a Custom List.
     */
    async execute({ zone, rule, cf, audit }: RuleContext): Promise<void> {
        console.log(`  Rule: add_to_list → list=${rule.cfListId}, threshold=${rule.rateLimitThreshold}, window=${rule.windowSeconds}s`);

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

            // 2. Insert to List and Audit Log
            for (const { ip, count } of flaggedIPs) {
                const cfListItemId = await cf.ips.addToList(rule.cfListId, ip);

                await audit.logAction({
                    tenantId: zone.tenantId,
                    zoneConfigId: zone.id,
                    ruleId: rule.id,
                    actionTaken: 'IP_BLOCKED',
                    ip,
                    requestCount: count,
                    metadata: JSON.stringify({ cfListId: rule.cfListId, cfListItemId }),
                });
            }
        } catch (err) {
            console.error(`  Error processing AddToList rule ${rule.id} on zone ${zone.name}:`, err);
        }
    }
}
