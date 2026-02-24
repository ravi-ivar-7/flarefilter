import { DrizzleD1Database } from 'drizzle-orm/d1';
import { actionLogs } from '@flarefilter/db/src/schema/zones';

export class ActionLogger {
    constructor(private db: DrizzleD1Database<any>) { }

    /**
     * Records a new action log entry in the database.
     */
    async logAction(params: {
        tenantId: string;
        zoneConfigId: string;
        ruleId: string;
        actionTaken: string;
        targetType: string;
        targetValue: string;
        requestCount: number;
        metadata?: string;
        timestamp?: Date;
    }) {
        try {
            await this.db.insert(actionLogs).values({
                id: crypto.randomUUID(),
                tenantId: params.tenantId,
                zoneConfigId: params.zoneConfigId,
                ruleId: params.ruleId,
                actionTaken: params.actionTaken,
                targetType: params.targetType,
                targetValue: params.targetValue,
                requestCount: params.requestCount,
                metadata: params.metadata,
                timestamp: params.timestamp ?? new Date(),
            });
            console.log(`  > Action logged for ${params.targetType} ${params.targetValue} (${params.actionTaken})`);
        } catch (error) {
            console.error(`Failed to write action log for ${params.targetType} ${params.targetValue}: `, error);
        }
    }
}
