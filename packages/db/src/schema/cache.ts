import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

/**
 * Generic entity cache — stores set membership for any CF-managed collection.
 *
 * Designed to eliminate duplicate-check round-trips to the CF API.
 * Namespace convention:
 *   - 'cf_list:{cfListId}'  → IP / ASN / hostname / redirect list membership
 *   (extend with new namespace prefixes for future entity types)
 *
 * Lifecycle:
 *   - Row inserted when an item is successfully added to CF.
 *   - Row deleted when an item is successfully removed from CF.
 *   - Entire namespace replaced (sync) when a GET-from-CF re-sync is triggered.
 */
export const entityCache = sqliteTable(
    'entity_cache',
    {
        /** Namespaced bucket, e.g. 'cf_list:abc123'. */
        namespace: text('namespace').notNull(),
        /** The item value stored, e.g. an IP address or hostname. */
        key: text('key').notNull(),
        /** Wall-clock time this row was last confirmed against the CF API. */
        syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull(),
    },
    (t) => [primaryKey({ columns: [t.namespace, t.key] })]
);
