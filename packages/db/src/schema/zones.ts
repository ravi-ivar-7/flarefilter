import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organization } from './organizations';

export const cloudflareAccounts = sqliteTable('cloudflare_accounts', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().references(() => organization.id),
    label: text('label').notNull(),
    cfAccountId: text('cf_account_id').notNull(),
    cfApiToken: text('cf_api_token').notNull(), // TODO: encrypt at rest
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ─── Zone configs ──────────────────────────────────────────────────────────────
// Only what the zone IS and how often to poll its analytics.
// All detection/action config lives on the rules, not here.
export const zoneConfigs = sqliteTable('zone_configs', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().references(() => organization.id),
    cfAccountRef: text('cf_account_ref').notNull().references(() => cloudflareAccounts.id),
    name: text('name').notNull(),
    cfZoneId: text('cf_zone_id').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ─── Add IP to list rules ─────────────────────────────────────────────────────────
// Rule: when an IP exceeds the threshold in the window, add it to a CF IP List.
// Detection config (threshold, window) lives here because it is specific to this rule.
export const addIpToListRules = sqliteTable('add_ip_to_list_rules', {
    id: text('id').primaryKey(),
    name: text('name').notNull().default('IP Mitigation Rule'),
    zoneConfigId: text('zone_config_id').notNull().references(() => zoneConfigs.id),
    tenantId: text('tenant_id').notNull().references(() => organization.id),
    cfListId: text('cf_list_id').notNull(),
    cfListName: text('cf_list_name'),
    rateLimitThreshold: integer('rate_limit_threshold').notNull().default(10000),
    windowSeconds: integer('window_seconds').notNull().default(300),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ─── Action logs (audit trail for all rules) ───────────────────────────────────
export const actionLogs = sqliteTable('action_logs', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    zoneConfigId: text('zone_config_id').notNull().references(() => zoneConfigs.id),
    ruleId: text('rule_id').notNull(), // Polymorphic: no foreign key to a specific rule table
    actionTaken: text('action_taken').notNull(), // 'IP_BLOCKED', 'JS_CHALLENGE', etc.
    targetType: text('target_type').default('IP').notNull(), // e.g. 'IP', 'ASN', 'COUNTRY'
    targetValue: text('target_value').notNull(), // e.g. '192.168.1.1', 'AS15169'
    requestCount: integer('request_count'),
    metadata: text('metadata'), // JSON string containing rule-specific rollback needs (e.g. cfListId, cfListItemId)
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// ─── Request activity (raw feed for future log-based analysis) ─────────────────
export const requestActivity = sqliteTable('request_activity', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    zoneConfigId: text('zone_config_id').notNull().references(() => zoneConfigs.id),
    ip: text('ip').notNull(),
    requestCount: integer('request_count').notNull(),
    windowStart: integer('window_start', { mode: 'timestamp' }).notNull(),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
