import { DrizzleD1Database } from 'drizzle-orm/d1';
import { actionLogs } from '@flarefilter/db/src/schema/zones';

export interface ActionLogParams {
    tenantId: string;
    zoneConfigId: string;
    ruleId: string;
    actionTaken: string;
    targetType: string;
    targetValue: string;
    requestCount: number;
    metadata?: string;
    timestamp?: Date;
}

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
     * Prefer this over calling logAction() in a loop — dramatically reduces
     * D1 write round-trips when processing many IPs at once.
     */
    async logActions(entries: ActionLogParams[]): Promise<void> {
        if (entries.length === 0) return;

        const now = new Date();
        const rows = entries.map(p => ({
            id: crypto.randomUUID(),
            tenantId: p.tenantId,
            zoneConfigId: p.zoneConfigId,
            ruleId: p.ruleId,
            actionTaken: p.actionTaken,
            targetType: p.targetType,
            targetValue: p.targetValue,
            requestCount: p.requestCount,
            metadata: p.metadata,
            timestamp: p.timestamp ?? now,
        }));

        try {
            await this.db.insert(actionLogs).values(rows);
            const preview = entries.length > 10
                ? `${entries.slice(0, 10).map(e => e.targetValue).join(', ')} … (+${entries.length - 10} more)`
                : entries.map(e => e.targetValue).join(', ');
            console.log(`  > Logged ${entries.length} action(s): ${preview}`);
        } catch (error) {
            console.error(`Failed to batch-write ${entries.length} action log(s):`, error);
        }
    }
}
