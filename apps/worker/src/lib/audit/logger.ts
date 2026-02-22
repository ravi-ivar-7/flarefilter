import { DrizzleD1Database } from 'drizzle-orm/d1';
import { actionLogs } from '@flarefilter/db/src/schema/zones';

export class AuditLogger {
    constructor(private db: DrizzleD1Database<any>) { }

    /**
     * Records a new action log entry in the database.
     */
    async logAction(params: {
        tenantId: string;
        zoneConfigId: string;
        ruleId: string;
        actionTaken: string;
        ip: string;
        requestCount: number;
        metadata?: string;
        blockedAt?: Date;
    }) {
        try {
            await this.db.insert(actionLogs).values({
                id: crypto.randomUUID(),
                tenantId: params.tenantId,
                zoneConfigId: params.zoneConfigId,
                ruleId: params.ruleId,
                actionTaken: params.actionTaken,
                ip: params.ip,
                requestCount: params.requestCount,
                metadata: params.metadata,
                blockedAt: params.blockedAt ?? new Date(),
            });
            console.log(`  > Action logged for IP: ${params.ip} (${params.actionTaken})`);
        } catch (error) {
            console.error(`Failed to write action log for IP ${params.ip}: `, error);
        }
    }
}
