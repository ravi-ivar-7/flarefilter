import { drizzle } from 'drizzle-orm/d1';
import { zoneConfigs } from '@flarefilter/db/src/schema/zones';
import { eq } from 'drizzle-orm';
import { Env } from './index';
import { RuleEngine } from './engine';

// ─── Main cron handler ───────────────────────────────────────────────────────
export async function runCronTasks(env: Env): Promise<void> {
    console.log('--- FlareFilter Execution Loop ---');
    const db = drizzle(env.DB);
    const engine = new RuleEngine(db);

    // 1. Load all active zones.
    const activeZones = await db
        .select()
        .from(zoneConfigs)
        .where(eq(zoneConfigs.isActive, true))
        .all();

    if (activeZones.length === 0) {
        console.log('No active zones configured. Sleeping.');
        return;
    }

    console.log(`Found ${activeZones.length} active zone(s). Processing concurrently…`);

    // 2. Process all zones concurrently.
    //    allSettled ensures a failure in one zone never cancels the others.
    const results = await Promise.allSettled(
        activeZones.map(zone => engine.processZone(zone))
    );

    // 3. Surface per-zone errors cleanly after all zones settle.
    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(
                `Zone "${activeZones[i].name}" (${activeZones[i].cfZoneId}) threw an unhandled error:`,
                result.reason
            );
        }
    });

    console.log('\n--- FlareFilter Execution Loop Complete ---');
}
