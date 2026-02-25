import { type ActionFunctionArgs } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts } from "@flarefilter/db/src/schema/zones";
import { eq } from "drizzle-orm";
import { CloudflareClient } from "@flarefilter/cloudflare";

export async function action({ request, context }: ActionFunctionArgs) {
    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = drizzle(env.DB);

    const formData = await request.formData();
    const accountRef = formData.get("accountRef") as string;
    const type = formData.get("type") as string;

    if (!accountRef) return Response.json({ error: "Missing accountRef" }, { status: 400 });

    const [account] = await db.select().from(cloudflareAccounts).where(eq(cloudflareAccounts.id, accountRef));
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

        if (type === "rules-list-add") {
            const listId = formData.get("listId") as string;
            const itemsJson = formData.get("items") as string;

            if (!listId || !itemsJson) return Response.json({ error: "Missing listId or items" }, { status: 400 });

            try {
                const items = JSON.parse(itemsJson);
                const result = await cf.lists.addItems(listId, items);
                return Response.json({ success: true, added: items.length, operationId: result });
            } catch (e) {
                return Response.json({ error: "Invalid items JSON" }, { status: 400 });
            }
        }

        if (type === "rules-list-items") {
            const listId = formData.get("listId") as string;
            const limit = parseInt(formData.get("limit") as string) || 10;
            if (!listId) return Response.json({ error: "Missing listId" }, { status: 400 });

            const items = await cf.lists.getItems(listId, limit);
            return Response.json(items);
        }

        if (type === "rules-list-item-delete") {
            const listId = formData.get("listId") as string;
            const itemId = formData.get("itemId") as string;
            if (!listId || !itemId) return Response.json({ error: "Missing listId or itemId" }, { status: 400 });

            await cf.lists.deleteItem(listId, itemId);
            return Response.json({ success: true });
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
