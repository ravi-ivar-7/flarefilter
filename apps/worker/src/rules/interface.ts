import { CloudflareClient } from '../lib/cloudflare/client';
import { ActionLogger } from '../lib/actions/logger';

// Standardized Zone object passed from the DB
export interface ZoneConfig {
    id: string;
    tenantId: string;
    cfAccountRef: string;
    name: string;
    cfZoneId: string;
}

export interface RuleContext {
    zone: ZoneConfig;
    rule: any; // The generic DB row. We cast this inside the specific handlers.
    cf: CloudflareClient;
    actionLogger: ActionLogger;
    /** Pre-fetched flagged IPs from a batched GraphQL call. When present,
     *  the handler should skip its own analytics query. */
    prefetchedIps?: { ip: string; count: number }[];
}

export interface RuleHandler {
    /**
     * Executes the specific logic for this rule (e.g., Check GraphQL -> Add to List).
     */
    execute: (context: RuleContext) => Promise<void>;
}
