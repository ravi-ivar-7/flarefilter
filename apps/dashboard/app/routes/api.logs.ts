import { actionLogs, zoneConfigs } from "@flarefilter/db/src/schema/zones";
import { desc, eq, inArray, and, gte } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { getAuth } from "~/lib/auth";
import { getDb } from "~/lib/db";

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
    const zoneId = formData.get("zoneId") as string;
    const actions = formData.get("actions") as string;
    const limit = Math.min(parseInt(formData.get("limit") as string || "100", 10), 1000);
    const windowSeconds = parseInt(formData.get("windowSeconds") as string || "3600", 10);

    const conditions = [];
    if (userId) conditions.push(eq(actionLogs.userId, userId));
    if (zoneId) conditions.push(eq(actionLogs.zoneConfigId, zoneId));
    if (actions) {
        const actionArray = actions.split(",").map(a => a.trim()).filter(Boolean);
        if (actionArray.length > 0) {
            conditions.push(inArray(actionLogs.actionTaken, actionArray));
        }
    }

    // Time filter
    const cutoffTimeMs = Date.now() - (windowSeconds * 1000);
    conditions.push(gte(actionLogs.timestamp, new Date(cutoffTimeMs)));

    try {
        const query = db.select()
            .from(actionLogs)
            .where(and(...conditions))
            .orderBy(desc(actionLogs.timestamp))
            .limit(limit);

        const logs = await query;
        return Response.json(logs);
    } catch (e: any) {
        return Response.json({ error: e.message || "Failed to fetch logs" }, { status: 500 });
    }
}
