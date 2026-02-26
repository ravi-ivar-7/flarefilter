import { type ActionFunctionArgs } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts } from "@flarefilter/db/src/schema/zones";
import { eq, and } from "drizzle-orm";
import { CloudflareClient } from "@flarefilter/cloudflare";
import { getAuth } from "~/lib/auth";

export async function action({ request, context }: ActionFunctionArgs) {
    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = drizzle(env.DB);

    // ── Auth guard ────────────────────────────────────────────────────────────
    const auth = getAuth(env);
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve tenant — user must belong to an active org.
    const tenantId = sessionData.session.activeOrganizationId;
    if (!tenantId) return Response.json({ error: "No active organization" }, { status: 403 });

    const formData = await request.formData();
    const accountRef = formData.get("accountRef") as string;
    const type = formData.get("type") as string;

    if (!accountRef) return Response.json({ error: "Missing accountRef" }, { status: 400 });

    // Tenant-scoped lookup: ensures the caller can only use accounts that
    // belong to their own organization. Prevents IDOR.
    const [account] = await db.select().from(cloudflareAccounts).where(
        and(eq(cloudflareAccounts.id, accountRef), eq(cloudflareAccounts.tenantId, tenantId))
    );
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

    const cf = new CloudflareClient(account.cfAccountId, account.cfApiToken);

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

            let items: any[];
            try {
                items = JSON.parse(itemsJson);
            } catch {
                return Response.json({ error: "Invalid items JSON" }, { status: 400 });
            }

            const result = await cf.lists.addItems(listId, items);
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
                const operationId = await cf.lists.deleteItems(listId, itemIds);
                return Response.json({ success: true, deleted: itemIds.length, operationId });
            } catch (e: any) {
                return Response.json({ error: "Failed to delete items", details: e.message }, { status: 400 });
            }
        }

        if (type === "top-ips") {
            const zoneTag = formData.get("zoneTag") as string;
            const limit = parseInt(formData.get("limit") as string) || 10;
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
    } catch (err: any) {
        console.error("Cloudflare API Action Error:", err);
        return Response.json({
            error: err.message || "Failed to process Cloudflare action",
            details: err.details
        }, { status: 500 });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
}
