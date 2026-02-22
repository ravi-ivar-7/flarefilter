import { type ActionFunctionArgs } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts } from "@flarefilter/db/src/schema/zones";
import { eq } from "drizzle-orm";

export async function action({ request, context }: ActionFunctionArgs) {
    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = drizzle(env.DB);

    const formData = await request.formData();
    const accountRef = formData.get("accountRef") as string;
    const type = formData.get("type") as "zones" | "lists";

    if (!accountRef) return Response.json({ error: "Missing accountRef" }, { status: 400 });

    const [account] = await db.select().from(cloudflareAccounts).where(eq(cloudflareAccounts.id, accountRef));
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

    const headers = { Authorization: `Bearer ${account.cfApiToken}` };

    try {
        if (type === "zones") {
            const res = await fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${account.cfAccountId}`, { headers });
            const data: any = await res.json();
            return Response.json(data.result || []);
        }

        if (type === "lists") {
            const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account.cfAccountId}/rules/lists`, { headers });
            const data: any = await res.json();
            return Response.json(data.result || []);
        }

        if (type === "ip-list-add") {
            const listId = formData.get("listId") as string;
            const ips = (formData.get("ips") as string || "").split(",").map(ip => ip.trim()).filter(Boolean);
            if (!listId || ips.length === 0) return Response.json({ error: "Missing listId or ips" }, { status: 400 });

            const body = ips.map(ip => ({ ip }));
            const res = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${account.cfAccountId}/rules/lists/${listId}/items`,
                { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) }
            );
            const data: any = await res.json();
            if (!data.success) return Response.json({ error: data.errors?.[0]?.message || "Failed to add IPs" }, { status: 400 });
            return Response.json({ success: true, added: ips.length });
        }

        if (type === "top-ips") {
            const zoneTag = formData.get("zoneTag") as string;
            const limit = parseInt(formData.get("limit") as string) || 10;
            const windowSeconds = parseInt(formData.get("windowSeconds") as string) || 3600;
            const dimensionsParam = formData.get("dimensions") as string || "";
            if (!zoneTag) return Response.json({ error: "Missing zoneTag" }, { status: 400 });

            // Use 3 minutes latency for adaptive groups to be safe
            const end = Date.now() - (180 * 1000);
            const start = end - (windowSeconds * 1000);
            const datetimeEnd = new Date(end).toISOString().split('.')[0] + 'Z';
            const datetimeStart = new Date(start).toISOString().split('.')[0] + 'Z';

            const finalDimensions = dimensionsParam.split(",").map(d => d.trim()).filter(Boolean);
            if (finalDimensions.length === 0) {
                finalDimensions.push("clientIP");
            }
            const dimensionsStr = finalDimensions.join(", ");

            const graphqlQuery = `
                query GetTopStats($zoneTag: String!, $start: String!, $end: String!, $limit: Int!) {
                    viewer {
                        zones(filter: { zoneTag: $zoneTag }) {
                            httpRequestsAdaptiveGroups(
                                filter: { datetime_geq: $start, datetime_leq: $end }
                                limit: $limit
                                orderBy: [count_DESC]
                            ) {
                                count
                                dimensions { ${dimensionsStr} }
                            }
                        }
                    }
                }
            `;

            console.log("CF Explorer Query:", { zoneTag, start: datetimeStart, end: datetimeEnd, dimensions: dimensionsStr, limit });

            const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { zoneTag, start: datetimeStart, end: datetimeEnd, limit }
                }),
            });

            const data: any = await res.json();

            if (data.errors) {
                console.error("CF GraphQL Errors:", JSON.stringify(data.errors, null, 2));
                return Response.json({
                    error: data.errors[0].message,
                    details: data.errors
                }, { status: 500 });
            }

            const results = data.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];
            console.log(`CF Explorer Success: found ${results.length} rows`);

            return Response.json(results.map((r: any) => ({
                ...r.dimensions,
                count: r.count
            })));
        }
    } catch (err: any) {
        console.error("Cloudflare API Action Error:", err);
        return Response.json({
            error: "Internal Server Error",
            message: err.message || "Unknown error",
            stack: err.stack
        }, { status: 500 });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
}
