import { RuleHandlers } from './rules/index';
import { CloudflareClient } from './lib/cloudflare/client';
import { ActionLogger } from './lib/actions/logger';
import { RULES_MANIFEST } from '@flarefilter/rules';

import { cloudflareAccounts } from '@flarefilter/db/src/schema/zones';
import { ZoneConfig } from './rules/interface';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';

export class RuleEngine {
    constructor(private db: DrizzleD1Database<any>) { }

    /**
     * Executes all rules configured for a specific zone.
     *
     * The Engine fetches the right Cloudflare credentials from the DB and
     * dispatches active rules to their registered handler plugins
     * (e.g. AddIpToList, JSChallenge).
     */
    async processZone(zone: ZoneConfig): Promise<void> {
        console.log(`\nProcessing zone: ${zone.name} (${zone.cfZoneId})`);

        // 1. Fetch Cloudflare API credentials for this zone's account.
        const [account] = await this.db
            .select()
            .from(cloudflareAccounts)
            .where(eq(cloudflareAccounts.id, zone.cfAccountRef));

        if (!account) {
            console.error(
                `No CF account found for zone ${zone.name} (cfAccountRef=${zone.cfAccountRef})`
            );
            return;
        }

        const cf = new CloudflareClient(account.cfAccountId, account.cfApiToken);
        const actionLogger = new ActionLogger(this.db);

        // 2. Fetch all active rules for this zone across every rule table.
        const ruleTables = Object.values(RULES_MANIFEST).filter(m => m.table);

        const ruleResults = (await Promise.all(
            ruleTables.map(t =>
                this.db
                    .select()
                    .from(t.table!)
                    .where(and(eq(t.table!.zoneConfigId, zone.id), eq(t.table!.isActive, true)))
            )
        )) as any[][];

        const activeRules = ruleResults.flatMap((res, i) =>
            res.map(r => ({ ...r, type: ruleTables[i].type }))
        );

        if (activeRules.length === 0) {
            console.log(`Zone ${zone.name} has no active rules. Skipping.`);
            return;
        }

        // 3. Determine which rules are due this cycle and dispatch them.
        //    Rules within a zone run CONCURRENTLY — each does independent
        //    network I/O (GraphQL + REST), so there's no reason to serialise.
        //    allSettled ensures one failing rule doesn't abort the others.
        const minutesSinceEpoch = Math.floor(Date.now() / (60 * 1000));

        const ruleSettled = await Promise.allSettled(
            activeRules.map(async (rule) => {
                const windowSeconds = rule.windowSeconds ?? 300;
                const intervalMins = Math.max(1, Math.floor(windowSeconds / 60));

                if (minutesSinceEpoch % intervalMins !== 0) {
                    // Compute the UTC timestamp of the next scheduled slot.
                    const nextSlotEpochMs =
                        (minutesSinceEpoch + (intervalMins - (minutesSinceEpoch % intervalMins))) * 60 * 1000;
                    const nextSlotUTC = new Date(nextSlotEpochMs).toISOString().slice(11, 16) + ' UTC';
                    console.log(
                        `  Skipping rule ${rule.id} (runs every ${intervalMins}m, next at ${nextSlotUTC})`
                    );
                    return;
                }

                const handler = RuleHandlers[rule.type];
                if (!handler) {
                    console.error(`No handler registered for rule type: ${rule.type}`);
                    return;
                }

                console.log(`  Executing rule ${rule.id} (type=${rule.type}, interval=${intervalMins}m)`);
                await handler.execute({ zone, rule, cf, actionLogger });
            })
        );

        // Surface any unhandled rule-level errors — same pattern as cron.ts for zones.
        ruleSettled.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(
                    `  Rule "${activeRules[i].id}" (type=${activeRules[i].type}) threw an unhandled error:`,
                    result.reason
                );
            }
        });
    }
}
