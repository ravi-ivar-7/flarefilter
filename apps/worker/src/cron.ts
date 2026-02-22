import { ExecutionContext } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { zoneConfigs } from '@flarefilter/db/src/schema/zones';
import { eq } from 'drizzle-orm';
import { Env } from './index';

import { RuleEngine } from './engine';

// ─── Main cron handler ───
export async function runCronTasks(env: Env, ctx: ExecutionContext) {
    console.log('--- FlareFilter Execution Loop ---');
    const db = drizzle(env.DB);
    const engine = new RuleEngine(db);

    // 1. Load all active zones from the DB
    const activeZones = await db.select().from(zoneConfigs).where(eq(zoneConfigs.isActive, true)).all();

    if (activeZones.length === 0) {
        console.log('No zones configured. Sleeping.');
        return;
    }

    const currentMinute = new Date().getUTCMinutes();

    // 2. Determine Which Zones to Process
    for (const zone of activeZones) {
        // Respect per-zone polling interval
        const intervalMins = zone.pollingIntervalMinutes ?? 5;
        if (currentMinute % intervalMins !== 0) {
            console.log(`Skipping ${zone.name} (polling set to every ${intervalMins}m. Current minute: ${currentMinute})`);
            continue;
        }

        // 3. Delegate execution directly to the Rule Engine
        await engine.processZone(zone);
    }

    console.log('\n--- FlareFilter Execution Loop Complete ---');
}
