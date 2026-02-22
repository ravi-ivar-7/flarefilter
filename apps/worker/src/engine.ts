import { RuleHandlers } from './rules/index';
import { CloudflareClient } from './lib/cloudflare/client';
import { AuditLogger } from './lib/audit/logger';

import { addToListRules, cloudflareAccounts } from '@flarefilter/db/src/schema/zones';
import { ZoneConfig } from './rules/interface';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';

export class RuleEngine {
    constructor(private db: DrizzleD1Database<any>) { }

    /**
     * Executes all rules configured for a specific zone.
     * The Engine fetches the right credentials from CF and distributes jobs
     * to the appropriate rule plugins (e.g. AddToList, JSChallenge).
     */
    async processZone(zone: ZoneConfig) {
        console.log(`\nProcessing zone: ${zone.name} (${zone.cfZoneId})`);

        // 1. Fetch Cloudflare API Auth for this Zone
        const [account] = await this.db.select().from(cloudflareAccounts)
            .where(eq(cloudflareAccounts.id, zone.cfAccountRef));

        if (!account) {
            console.error(`No CF account found for zone ${zone.name} (cfAccountRef=${zone.cfAccountRef})`);
            return;
        }

        const cf = new CloudflareClient(account.cfAccountId, account.cfApiToken);
        const audit = new AuditLogger(this.db);

        // 2. Fetch all generic active rules for this zone here
        // NOTE: If we get multiple rule tables (e.g., jsChallengeRules), we should map/concat them together into unified Rule objects
        const rawAddToListRules = await this.db.select().from(addToListRules)
            .where(and(eq(addToListRules.zoneConfigId, zone.id), eq(addToListRules.isActive, true)));

        const activeRules = [
            ...rawAddToListRules.map(r => ({ ...r, type: 'add_to_list' })),
            // Add other plugins here in the future
            // ...rawChallengeRules.map(r => ({...r, type: 'js_challenge'}))
        ];

        if (activeRules.length === 0) {
            console.log(`Zone ${zone.name} has no active rules. Skipping.`);
            return;
        }

        // 3. Delegate to Rule Handlers
        for (const rule of activeRules) {
            const handler = RuleHandlers[rule.type];

            if (!handler) {
                console.error(`No handler registered for rule type: ${rule.type}`);
                continue;
            }

            // Expose the Context to the Handler plugin
            await handler.execute({ zone, rule, cf, audit });
        }
    }
}
