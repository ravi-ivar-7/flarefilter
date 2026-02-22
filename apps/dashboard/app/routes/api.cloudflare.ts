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
    } catch (err) {
        return Response.json({ error: "Cloudflare API error" }, { status: 500 });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
}
