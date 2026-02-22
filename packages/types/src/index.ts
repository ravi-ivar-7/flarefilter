export interface ZoneConfig {
    id: string;
    tenantId: string;
    name: string;
    cfAccountId: string;
    cfZoneId: string;
    cfApiToken: string;
    cronInterval: string;
    rateLimitThreshold: number;
    penaltyDurationSeconds: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AttackLog {
    id: string;
    tenantId: string;
    zoneConfigId: string;
    ip: string;
    requestCount: number;
    blockedAt: string;
    expiresAt: string;
}

export interface BlockedIP {
    ip: string;
    tenantId: string;
    expiresAt: string;
}
