import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts, zoneConfigs, addIpToListRules, actionLogs, requestActivity } from "@flarefilter/db/src/schema/zones";
import { desc, eq, sql, and } from "drizzle-orm";
import type { Route } from "./+types/dashboard";
import { useNavigation, useActionData, useRevalidator, redirect } from "react-router";
import { getAuth } from "~/lib/auth";
import { useState, useEffect } from "react";

import { AddAccountModal } from "~/components/dashboard/modals/AddAccountModal";
import { AddZoneModal } from "~/components/dashboard/modals/AddZoneModal";
import { AddIpToListRuleModal } from "~/components/dashboard/modals/rules/AddIpToListRuleModal";
import { IPsAnalyzer } from "~/components/dashboard/views/IPsAnalyzer";
import { Overview } from "~/components/dashboard/views/Overview";
import { ActionLogs } from "~/components/dashboard/views/ActionLogs";
import { Profile } from "~/components/dashboard/views/Profile";
import { type DateRange } from "~/components/shared/DateRangePicker";
import { useSearchParams } from "react-router";


export const meta: Route.MetaFunction = () => [
  { title: "Dashboard - FlareFilter" },
  { name: "description", content: "Monitor your Cloudflare zones, manage IP blocking rules, and review recent threat activity - all in one place." },
];

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  if (!env.DB) throw new Error("D1 binding 'DB' not configured.");
  const db = drizzle(env.DB);

  const auth = getAuth(env);
  const sessionData = await auth.api.getSession({ headers: request.headers });
  if (!sessionData?.user) throw redirect("/auth?mode=login");

  let tenantId = sessionData.session.activeOrganizationId;
  if (!tenantId) {
    const orgs = await auth.api.listOrganizations({ headers: request.headers });
    if (orgs.length > 0) {
      tenantId = orgs[0].id;
    } else {
      const newOrg = await auth.api.createOrganization({
        headers: request.headers,
        body: { name: `${sessionData.user.name}'s Organization`, slug: crypto.randomUUID() },
      });
      tenantId = newOrg!.id;
    }
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "add_account") {
    const label = formData.get("label") as string;
    const cfAccountId = formData.get("cfAccountId") as string;
    const cfApiToken = formData.get("cfApiToken") as string;
    if (label && cfAccountId && cfApiToken) {
      // 1. Verify token validity with Cloudflare
      try {
        const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
          headers: { Authorization: `Bearer ${cfApiToken}` },
        });
        const verifyJson: any = await verifyRes.json();
        if (!verifyRes.ok || !verifyJson.success) {
          return { error: "Invalid Cloudflare API Token. Please check your permissions and try again." };
        }
      } catch (err) {
        return { error: "Failed to verify Cloudflare token. Check your internet connection." };
      }

      await db.insert(cloudflareAccounts).values({
        id: crypto.randomUUID(),
        tenantId,
        label,
        cfAccountId,
        cfApiToken, // TODO: encrypt at rest
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
    return null;
  }

  if (intent === "add_zone") {
    const name = formData.get("name") as string;
    const cfZoneId = formData.get("cfZoneId") as string;
    const cfAccountRef = formData.get("cfAccountRef") as string;
    if (name && cfZoneId && cfAccountRef) {
      await db.insert(zoneConfigs).values({
        id: crypto.randomUUID(), tenantId, cfAccountRef, name, cfZoneId,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
    return null;
  }

  if (intent === "add_ip_to_list_rule") {
    const zoneConfigId = formData.get("zoneConfigId") as string;
    const cfListId = formData.get("cfListId") as string;
    const cfListName = formData.get("cfListName") as string;
    const rateLimitThreshold = parseInt(formData.get("rateLimitThreshold") as string) || 10000;
    const windowSeconds = parseInt(formData.get("windowSeconds") as string) || 300;
    if (zoneConfigId && cfListId) {
      await db.insert(addIpToListRules).values({
        id: crypto.randomUUID(), tenantId, zoneConfigId, cfListId, cfListName,
        rateLimitThreshold, windowSeconds,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
    return null;
  }

  if (intent === "delete_account") {
    const accountId = formData.get("accountId") as string;
    if (accountId) {
      // Guard: refuse if any zones still reference this account
      const dependentZones = await db.select().from(zoneConfigs)
        .where(eq(zoneConfigs.cfAccountRef, accountId));
      if (dependentZones.length > 0) {
        return { error: `Cannot delete — ${dependentZones.length} zone(s) still use this account. Remove those zones first.` };
      }
      await db.delete(cloudflareAccounts).where(
        and(eq(cloudflareAccounts.id, accountId), eq(cloudflareAccounts.tenantId, tenantId))
      );
    }
    return null;
  }

  if (intent === "delete_zone") {
    const zoneId = formData.get("zoneId") as string;
    if (zoneId) {
      // Manual cascade delete
      await db.delete(actionLogs).where(eq(actionLogs.zoneConfigId, zoneId));
      await db.delete(requestActivity).where(eq(requestActivity.zoneConfigId, zoneId));
      await db.delete(addIpToListRules).where(eq(addIpToListRules.zoneConfigId, zoneId));
      await db.delete(zoneConfigs).where(
        and(eq(zoneConfigs.id, zoneId), eq(zoneConfigs.tenantId, tenantId))
      );
    }
    return null;
  }

  if (intent === "delete_rule") {
    const ruleId = formData.get("ruleId") as string;
    if (ruleId) {
      await db.delete(actionLogs).where(eq(actionLogs.ruleId, ruleId));
      await db.delete(addIpToListRules).where(
        and(eq(addIpToListRules.id, ruleId), eq(addIpToListRules.tenantId, tenantId))
      );
    }
    return null;
  }

  if (intent === "toggle_zone_status") {
    const zoneId = formData.get("zoneId") as string;
    const isActive = formData.get("isActive") === "true";
    if (zoneId) {
      // 1. Update the zone status
      await db.update(zoneConfigs)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(zoneConfigs.id, zoneId), eq(zoneConfigs.tenantId, tenantId)));

      // 2. Cascade the status to all rules in this zone
      await db.update(addIpToListRules)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(addIpToListRules.zoneConfigId, zoneId), eq(addIpToListRules.tenantId, tenantId)));
    }
    return null;
  }

  if (intent === "toggle_rule_status") {
    const ruleId = formData.get("ruleId") as string;
    const isActive = formData.get("isActive") === "true";
    if (ruleId) {
      await db.update(addIpToListRules)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(addIpToListRules.id, ruleId), eq(addIpToListRules.tenantId, tenantId)));
    }
    return null;
  }

  return null;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  if (!env.DB) throw new Error("D1 binding 'DB' not configured.");

  const auth = getAuth(env);
  const sessionData = await auth.api.getSession({ headers: request.headers });
  if (!sessionData?.user) throw redirect("/auth?mode=login");

  const orgs = await auth.api.listOrganizations({ headers: request.headers });
  let tenantId = sessionData.session.activeOrganizationId;
  let activeOrg: any = null;

  if (!tenantId) {
    if (orgs.length > 0) {
      tenantId = orgs[0].id;
      activeOrg = orgs[0];
    } else {
      const newOrg = await auth.api.createOrganization({
        headers: request.headers,
        body: { name: `${sessionData.user.name}'s Organization`, slug: crypto.randomUUID() },
      });
      tenantId = newOrg!.id;
      activeOrg = newOrg;
      // Note: orgs might need to be refreshed or we just add this one
    }
  } else {
    activeOrg = orgs.find((o: any) => o.id === tenantId);
  }

  // Ensure orgs includes the newly created one if applicable
  const allOrgs = orgs.length > 0 ? orgs : (activeOrg ? [activeOrg] : []);

  const orgName = activeOrg?.name || "Default Organization";

  const db = drizzle(env.DB, { schema: { cloudflareAccounts, zoneConfigs, addIpToListRules, actionLogs } });

  const tab = params.tab || "overview";

  const [accounts, zones, rules, recentActions, [{ count: totalBlocks }]] = await Promise.all([
    db.select().from(cloudflareAccounts).where(eq(cloudflareAccounts.tenantId, tenantId)).orderBy(desc(cloudflareAccounts.createdAt)),
    db.select().from(zoneConfigs).where(eq(zoneConfigs.tenantId, tenantId)).orderBy(desc(zoneConfigs.createdAt)),
    db.select().from(addIpToListRules).where(eq(addIpToListRules.tenantId, tenantId)).orderBy(desc(addIpToListRules.createdAt)),
    db.select().from(actionLogs).where(eq(actionLogs.tenantId, tenantId)).orderBy(desc(actionLogs.timestamp)).limit(tab === "logs" ? 100 : 10),
    db.select({ count: sql<number>`count(*)` }).from(actionLogs).where(eq(actionLogs.tenantId, tenantId)),
  ]);

  return { user: sessionData.user, orgName, activeOrg, orgs: allOrgs, accounts, zones, rules, recentActions, totalBlocks, currentTab: tab };
}

export default function DashboardPage({ loaderData, params }: Route.ComponentProps) {
  const { user, orgName, activeOrg, orgs, accounts, zones, rules, recentActions, totalBlocks } = loaderData as any;
  const currentTab = params.tab || "overview";
  const actionData = useActionData() as { error?: string } | null;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const activeTab = currentTab;

  const isAddingAccount = navigation.formData?.get("intent") === "add_account";
  const isAddingZone = navigation.formData?.get("intent") === "add_zone";
  const isAddingRule = navigation.formData?.get("intent") === "add_ip_to_list_rule";

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [ruleModalZoneId, setRuleModalZoneId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flarefilter_daterange");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.start) parsed.start = new Date(parsed.start);
          if (parsed.end) parsed.end = new Date(parsed.end);
          return parsed;
        } catch (e) {
          console.error("Failed to parse saved daterange", e);
        }
      }
    }
    return { type: "relative", relativeValue: "30m", live: false, refreshInterval: 10 };
  });

  useEffect(() => {
    localStorage.setItem("flarefilter_daterange", JSON.stringify(dateRange));

    if (!dateRange.live) return;

    const intervalMs = (dateRange.refreshInterval || 10) * 1000;
    const timer = setInterval(() => {
      if (navigation.state === "idle") {
        revalidator.revalidate();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [dateRange, revalidator, navigation.state]);

  useEffect(() => { if (!isAddingAccount && navigation.state === "idle") setIsAccountModalOpen(false); }, [isAddingAccount, navigation.state]);
  useEffect(() => { if (!isAddingZone && navigation.state === "idle") setIsZoneModalOpen(false); }, [isAddingZone, navigation.state]);
  useEffect(() => { if (!isAddingRule && navigation.state === "idle") setRuleModalZoneId(null); }, [isAddingRule, navigation.state]);

  return (
    <div className="pb-8">

      {accounts.length === 0 && (
        <div className="mb-8 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">No Cloudflare account connected</p>
            <p className="text-xs text-amber-700 mt-0.5">Connect a CF account before adding zones.</p>
          </div>
          <button onClick={() => setIsAccountModalOpen(true)} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors">
            Connect Account
          </button>
        </div>
      )}

      {activeTab === "overview" && (
        <Overview
          orgName={orgName}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isLoading={navigation.state !== "idle"}
          accounts={accounts}
          zones={zones}
          rules={rules}
          recentActions={recentActions}
          totalBlocks={totalBlocks}
          onAddAccount={() => setIsAccountModalOpen(true)}
          onAddZone={() => setIsZoneModalOpen(true)}
          onAddRule={(zoneId: string) => setRuleModalZoneId(zoneId)}
          error={actionData?.error}
        />
      )}

      {activeTab === "ips" && (
        <IPsAnalyzer
          zones={zones}
          accounts={accounts}
          orgName={orgName}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isLoading={navigation.state !== "idle"}
        />
      )}

      {activeTab === "logs" && (
        <ActionLogs
          zones={zones}
          orgName={orgName}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isLoading={navigation.state !== "idle"}
          recentActions={recentActions}
        />
      )}

      {activeTab === "profile" && (
        <Profile user={user} activeOrg={activeOrg} orgs={orgs} />
      )}

      {isAccountModalOpen && <AddAccountModal onClose={() => setIsAccountModalOpen(false)} isSubmitting={isAddingAccount} />}
      {isZoneModalOpen && <AddZoneModal onClose={() => setIsZoneModalOpen(false)} isSubmitting={isAddingZone} accounts={accounts} />}
      {ruleModalZoneId && <AddIpToListRuleModal onClose={() => setRuleModalZoneId(null)} isSubmitting={isAddingRule} zoneId={ruleModalZoneId} accounts={accounts} zones={zones} />}
    </div>
  );
}
