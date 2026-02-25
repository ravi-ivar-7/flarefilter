import { CloudflareApiBase } from './base';

export interface RulesListItem {
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
     * Fetches all Rules Lists in the account.
     */
    async getLists(): Promise<any[]> {
        return this.fetchRest(`/accounts/${this.cfAccountId}/rules/lists`);
    }

    /**
     * Fetches all items in a Cloudflare Rules List.
     * Handles cursor-based pagination.
     */
    async getItems(cfListId: string, limit?: number): Promise<RulesListItem[]> {
        const items: RulesListItem[] = [];
        let cursor: string | undefined = undefined;

        do {
            const endpoint: string = `/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items${cursor ? `?cursor=${cursor}` : ''
                }`;
            const payload = await this.fetchRestFull<RulesListItem[]>(endpoint);
            items.push(...payload.result);

            if (limit && items.length >= limit) {
                return items.slice(0, limit);
            }

            cursor = payload.result_info?.cursors?.after;
        } while (cursor);

        return items;
    }

    /**
     * Deletes a single item from a list.
     */
    async deleteItem(cfListId: string, itemId: string): Promise<boolean> {
        await this.fetchRest(`/accounts/${this.cfAccountId}/rules/lists/${cfListId}/items/${itemId}`, {
            method: 'DELETE',
        });
        return true;
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
     * Ported from CloudflareIpApi.addItemsToListSafe.
     */
    async addItemsSafe(
        cfListId: string,
        items: any[]
    ): Promise<{ added: any[]; alreadyInList: any[]; failed: any[]; operationIds: string[] }> {
        if (items.length === 0) {
            return { added: [], alreadyInList: [], failed: [], operationIds: [] };
        }

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
