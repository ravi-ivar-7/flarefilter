import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { cloudflareAccounts } from "@flarestack/db/src/schema/zones";
import { eq, and } from "drizzle-orm";
import { CloudflareClient } from "@flarestack/cloudflare";
import { CacheStore } from "@flarestack/db/src/cache";
import { getAuth } from "~/lib/auth";
import { getDb } from "~/lib/db";

export async function loader({ request, context }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const accountRef = url.searchParams.get("accountRef");

    if (!type || !accountRef) {
        return Response.json({ error: "Missing type or accountRef" }, { status: 400 });
    }

    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = getDb(env as { DB: D1Database });

    const auth = getAuth(env);
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const userId = sessionData.user.id;

    const [account] = await db.select().from(cloudflareAccounts).where(
        and(eq(cloudflareAccounts.id, accountRef), eq(cloudflareAccounts.userId, userId))
    );
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

    const cf = new CloudflareClient(account.cfAccountId, account.cfApiToken);

    try {
        if (type === "zones") {
            return Response.json(await cf.zones.getZones());
        }
        if (type === "lists") {
            return Response.json(await cf.lists.getLists());
        }
        return Response.json({ error: "Invalid type for GET. Supported: zones, lists" }, { status: 400 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg || "Failed to fetch" }, { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    if (request.method !== "POST") return Response.json({ error: "Method Not Allowed" }, { status: 405 });

    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = getDb(env);

    const auth = getAuth(env);
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = sessionData.user.id;

    const formData = await request.formData();
    const accountRef = formData.get("accountRef") as string;
    const type = formData.get("type") as string;

    if (!accountRef) return Response.json({ error: "Missing accountRef" }, { status: 400 });

    // User-scoped lookup: ensures the caller can only use accounts that
    // belong to them. Prevents IDOR.
    const [account] = await db.select().from(cloudflareAccounts).where(
        and(eq(cloudflareAccounts.id, accountRef), eq(cloudflareAccounts.userId, userId))
    );
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

    const cf = new CloudflareClient(account.cfAccountId, account.cfApiToken);
    const cacheStore = new CacheStore(db);

    try {
        if (type === "zones") {
            const zones = await cf.zones.getZones();
            return Response.json(zones);
        }

        if (type === "lists") {
            const lists = await cf.lists.getLists();
            return Response.json(lists);
        }

        if (type === "list-items-add") {
            const listId = formData.get("listId") as string;
            const itemsJson = formData.get("items") as string;

            if (!listId || !itemsJson) return Response.json({ error: "Missing listId or items" }, { status: 400 });

            let items: { ip: string; comment?: string }[];
            try {
                items = JSON.parse(itemsJson);
            } catch {
                return Response.json({ error: "Invalid items JSON" }, { status: 400 });
            }

            const result = await cf.lists.addItems(listId, items);
            // Keep entity_cache in sync so the next cron run doesn't cold-start
            // this list and re-add items that were just manually added.
            const addedIps = items.map(i => i.ip).filter((ip): ip is string => !!ip);
            if (addedIps.length > 0) {
                await cacheStore.add(`cf_list:${listId}`, addedIps);
            }
            return Response.json({ success: true, added: items.length, operationId: result });
        }

        if (type === "list-items") {
            const listId = formData.get("listId") as string;
            const limit = parseInt(formData.get("limit") as string) || 10;
            if (!listId) return Response.json({ error: "Missing listId" }, { status: 400 });

            const items = await cf.lists.getItems(listId, limit);
            return Response.json(items);
        }

        if (type === "list-items-delete") {
            const listId = formData.get("listId") as string;
            const itemIdsJson = formData.get("itemIds") as string;
            if (!listId || !itemIdsJson) return Response.json({ error: "Missing listId or itemIds" }, { status: 400 });

            try {
                const itemIds: string[] = JSON.parse(itemIdsJson);

                // We need the actual IP values to remove from cache — fetch them before deleting.
                // The CF list items endpoint returns full objects including the IP string.
                //
                // TOCTOU note: if deleteItems partially fails (some IDs deleted, some not),
                // the cache will remove IPs that CF didn't actually delete. This is an acceptable
                // edge-case — the cache will self-heal on the next cold-start GET re-sync.
                const listItemsBefore = await cf.lists.getItems(listId);
                const deletedItemMap = new Map(listItemsBefore.map(i => [i.id, i.ip]));
                const deletedIps = itemIds.map(id => deletedItemMap.get(id)).filter((ip): ip is string => !!ip);

                const operationIds = await cf.lists.deleteItems(listId, itemIds);

                // Sync entity_cache: remove deleted IPs so cron doesn't think they're still there.
                if (deletedIps.length > 0) {
                    await cacheStore.remove(`cf_list:${listId}`, deletedIps);
                }

                return Response.json({ success: true, deleted: itemIds.length, operationIds });
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                return Response.json({ error: "Failed to delete items", details: msg }, { status: 400 });
            }
        }

        if (type === "top-stats") {
            const zoneTag = formData.get("zoneTag") as string;
            const limit = Math.min(parseInt(formData.get("limit") as string) || 10, 500);
            const windowSecondsVal = formData.get("windowSeconds");
            const windowSeconds = windowSecondsVal ? parseInt(windowSecondsVal as string) : undefined;
            const dimensionsParam = formData.get("dimensions") as string || "clientIP";

            if (!zoneTag) return Response.json({ error: "Missing zoneTag" }, { status: 400 });

            const dimensions = dimensionsParam.split(",").map(d => d.trim()).filter(Boolean);

            const results = await cf.analytics.getTopStats({
                zoneTag,
                dimensions,
                windowSeconds,
                limit
            });

            return Response.json(results);
        }
    } catch (err) {
        console.error("Cloudflare API Action Error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({
            error: msg || "Failed to process Cloudflare action",
        }, { status: 500 });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
}
