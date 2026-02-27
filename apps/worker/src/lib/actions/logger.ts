import { DrizzleD1Database } from 'drizzle-orm/d1';
import { actionLogs } from '@flarefilter/db/src/schema/zones';
import { log } from '../log';

export interface ActionLogParams {
    userId: string;
    zoneConfigId: string;
    ruleId: string;
    actionTaken: string;
    targetType: string;
    targetValue: string;
    requestCount?: number | null;
    metadata?: string;
    timestamp?: Date;
}

// D1 supports at most ~100 rows per INSERT statement.
const D1_MAX_INSERT_ROWS = 100;

export class ActionLogger {
    constructor(private db: DrizzleD1Database<any>) { }

    /**
     * Records a single action log entry in the database.
     */
    async logAction(params: ActionLogParams): Promise<void> {
        await this.logActions([params]);
    }

    /**
     * Batch-inserts multiple action log entries in a single DB write.
     *
     * D1 has a ~100 row per-INSERT limit, so large batches are automatically
     * chunked to avoid silent failures.
     */
    async logActions(entries: ActionLogParams[]): Promise<void> {
        if (entries.length === 0) return;

        const now = new Date();
        const rows = entries.map(p => ({
            id: crypto.randomUUID(),
            userId: p.userId,
            zoneConfigId: p.zoneConfigId,
            ruleId: p.ruleId,
            actionTaken: p.actionTaken,
            targetType: p.targetType,
            targetValue: p.targetValue,
            requestCount: p.requestCount ?? null,
            metadata: p.metadata,
            timestamp: p.timestamp ?? now,
        }));

        try {
            // Chunk inserts to respect D1's per-statement row limit.
            if (rows.length <= D1_MAX_INSERT_ROWS) {
                await this.db.insert(actionLogs).values(rows);
            } else {
                const chunks: typeof rows[] = [];
                for (let i = 0; i < rows.length; i += D1_MAX_INSERT_ROWS) {
                    chunks.push(rows.slice(i, i + D1_MAX_INSERT_ROWS));
                }
                // Use db.batch() to send all chunks in one HTTP round-trip.
                await (this.db as any).batch(
                    chunks.map(chunk => this.db.insert(actionLogs).values(chunk))
                );
            }

            const preview = entries.length > 10
                ? `${entries.slice(0, 10).map(e => e.targetValue).join(', ')} … (+${entries.length - 10} more)`
                : entries.map(e => e.targetValue).join(', ');
            log(`  > Logged ${entries.length} action(s): ${preview}`);
        } catch (error) {
            console.error(`Failed to batch-write ${entries.length} action log(s):`, error);
        }
    }
}
