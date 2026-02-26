import { CloudflareApiBase } from './base';

export interface ListItem {
    id: string;
    ip?: string;
    asn?: number;
    hostname?: string;
    comment?: string;
    created_on: string;
    modified_on: string;
    [key: string]: any;
}

export class ListsApi extends CloudflareApiBase {
    /**
     * Fetches all Lists in the account.
     */
    async getLists(): Promise<any[]> {
        return this.fetchRest(`/accounts/${this.cfAccountId}/rules/lists`);
    }

    /**
     * Fetches all items in a Cloudflare List.
     * Handles cursor-based pagination.
     */
    async getItems(cfListId: string, limit?: number): Promise<ListItem[]> {
        const items: ListItem[] = [];
        let cursor: string | undefined = undefined;

        do {
            const endpoint: string = `/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items${cursor ? `?cursor=${cursor}` : ''
                }`;
            const payload = await this.fetchRestFull<ListItem[]>(endpoint);
            items.push(...payload.result);

            if (limit && items.length >= limit) {
                return items.slice(0, limit);
            }

            cursor = payload.result_info?.cursors?.after;
        } while (cursor);

        return items;
    }

    /**
     * Deletes multiple items from a list in a single request.
     */
    async deleteItems(cfListId: string, itemIds: string[]): Promise<string | null> {
        const result = await this.fetchRest(`/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items`, {
            method: 'DELETE',
            body: JSON.stringify({ items: itemIds.map(id => ({ id })) }),
        });
        return result?.operation_id ?? null;
    }

    /**
     * Adds items to a list. Supports single or batch.
     */
    async addItems(cfListId: string, items: any[]): Promise<string | null> {
        const result = await this.fetchRest(
            `/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items`,
            {
                method: 'POST',
                body: JSON.stringify(items),
            }
        );
        return result?.operation_id ?? null;
    }

    /**
     * Safely adds items to a CF list, handling duplicates.
     *
     * Fast path  — single batch POST (all new items).
     * Slow path  — sequential chunks of CHUNK_SIZE, with per-item POSTs
     *              running concurrently within each chunk to respect
     *              CF API rate limits (1200 req/5min).
     */
    async addItemsSafe(
        cfListId: string,
        items: any[]
    ): Promise<{ added: any[]; alreadyInList: any[]; failed: any[]; operationIds: string[] }> {
        if (items.length === 0) {
            return { added: [], alreadyInList: [], failed: [], operationIds: [] };
        }

        // ── Fast path: single batch POST ──────────────────────────────────────
        try {
            const operationId = await this.addItems(cfListId, items);
            return {
                added: items,
                alreadyInList: [],
                failed: [],
                operationIds: operationId ? [operationId] : [],
            };
        } catch (err: any) {
            const isDuplicate =
                err.message?.toLowerCase().includes('duplicate') ||
                err.message?.toLowerCase().includes('already exists');

            if (!isDuplicate) throw err;
            console.log(`  Batch rejected (duplicates detected). Falling back to per-item adds…`);
        }

        // ── Slow path: per-item POSTs ─────────────────────────────────────────
        // Process in sequential chunks of CHUNK_SIZE to respect CF rate limits
        // (1200 req/5min). Items WITHIN each chunk run concurrently.
        const CHUNK_SIZE = 20;
        const added: any[] = [];
        const alreadyInList: any[] = [];
        const failed: any[] = [];
        const operationIds: string[] = [];

        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);

            const chunkResults = await Promise.allSettled(
                chunk.map(item => this.addItems(cfListId, [item]).then(opId => ({ item, opId })))
            );

            chunkResults.forEach((result, j) => {
                if (result.status === 'fulfilled') {
                    added.push(result.value.item);
                    if (result.value.opId) operationIds.push(result.value.opId);
                } else {
                    const err = result.reason;
                    const item = chunk[j];
                    const isDuplicate =
                        err.message?.toLowerCase().includes('duplicate') ||
                        err.message?.toLowerCase().includes('already exists');

                    if (isDuplicate) {
                        alreadyInList.push(item);
                    } else {
                        console.error(`  Failed to add item to list ${cfListId}:`, err.message);
                        failed.push(item);
                    }
                }
            });
        }

        return { added, alreadyInList, failed, operationIds };
    }
}
