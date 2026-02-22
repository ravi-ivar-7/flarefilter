import { drizzle } from "drizzle-orm/d1";
import { actionLogs, zoneConfigs } from "@flarefilter/db/src/schema/zones";
import { desc, eq, inArray, and, gte } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { getAuth } from "~/lib/auth";

export async function action({ request, context }: ActionFunctionArgs) {
    const env = context.cloudflare.env;
    if (!env.DB) return Response.json({ error: "DB not found" }, { status: 500 });
    const db = drizzle(env.DB);

    const auth = getAuth(env);
    const sessionData = await auth.api.getSession({ headers: request.headers });
    if (!sessionData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let tenantId = sessionData.session.activeOrganizationId;

    const formData = await request.formData();
    const zoneId = formData.get("zoneId") as string;
    const actions = formData.get("actions") as string;
    const limit = parseInt(formData.get("limit") as string || "100", 10);
    const windowSeconds = parseInt(formData.get("windowSeconds") as string || "3600", 10);

    const conditions = [];
    if (tenantId) conditions.push(eq(actionLogs.tenantId, tenantId));
    if (zoneId) conditions.push(eq(actionLogs.zoneConfigId, zoneId));
    if (actions) {
        const actionArray = actions.split(",").map(a => a.trim()).filter(Boolean);
        if (actionArray.length > 0) {
            conditions.push(inArray(actionLogs.actionTaken, actionArray));
        }
    }

    // Time filter
    const cutoffTimeMs = Date.now() - (windowSeconds * 1000);
    conditions.push(gte(actionLogs.blockedAt, new Date(cutoffTimeMs)));

    try {
        const query = db.select()
            .from(actionLogs)
            .where(and(...conditions))
            .orderBy(desc(actionLogs.blockedAt))
            .limit(limit);

        const logs = await query;
        return Response.json(logs);
    } catch (e: any) {
        return Response.json({ error: e.message || "Failed to fetch logs" }, { status: 500 });
    }
}
