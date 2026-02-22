import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts, zoneConfigs, addToListRules, actionLogs, requestActivity } from "@flarefilter/db/src/schema/zones";
import { desc, eq, sql, and } from "drizzle-orm";
import type { Route } from "./+types/dashboard";
import { useNavigation, useActionData, useRevalidator, redirect } from "react-router";
import { getAuth } from "~/lib/auth";
import { useState, useEffect } from "react";

import { MetricsGrid } from "~/components/dashboard/MetricsGrid";
import { ZonesList } from "~/components/dashboard/ZonesList";
import { RecentBlocks } from "~/components/dashboard/RecentBlocks";
import { AddAccountModal } from "~/components/dashboard/AddAccountModal";
import { AddZoneModal } from "~/components/dashboard/AddZoneModal";
import { AddToListRuleModal } from "~/components/dashboard/AddToListRuleModal";
import { InviteMemberModal } from "~/components/dashboard/InviteMemberModal";
import { ConnectedAccounts } from "~/components/dashboard/ConnectedAccounts";


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
    const pollingIntervalMinutes = parseInt(formData.get("pollingIntervalMinutes") as string) || 5;
    if (name && cfZoneId && cfAccountRef) {
      await db.insert(zoneConfigs).values({
        id: crypto.randomUUID(), tenantId, cfAccountRef, name, cfZoneId,
        pollingIntervalMinutes,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
    return null;
  }

  if (intent === "add_to_list_rule") {
    const zoneConfigId = formData.get("zoneConfigId") as string;
    const cfListId = formData.get("cfListId") as string;
    const cfListName = formData.get("cfListName") as string;
    const rateLimitThreshold = parseInt(formData.get("rateLimitThreshold") as string) || 10000;
    const windowSeconds = parseInt(formData.get("windowSeconds") as string) || 300;
    if (zoneConfigId && cfListId) {
      await db.insert(addToListRules).values({
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
      await db.delete(addToListRules).where(eq(addToListRules.zoneConfigId, zoneId));
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
      await db.delete(addToListRules).where(
        and(eq(addToListRules.id, ruleId), eq(addToListRules.tenantId, tenantId))
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
      await db.update(addToListRules)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(addToListRules.zoneConfigId, zoneId), eq(addToListRules.tenantId, tenantId)));
    }
    return null;
  }

  if (intent === "toggle_rule_status") {
    const ruleId = formData.get("ruleId") as string;
    const isActive = formData.get("isActive") === "true";
    if (ruleId) {
      await db.update(addToListRules)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(addToListRules.id, ruleId), eq(addToListRules.tenantId, tenantId)));
    }
    return null;
  }

  return null;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  if (!env.DB) throw new Error("D1 binding 'DB' not configured.");

  const auth = getAuth(env);
  const sessionData = await auth.api.getSession({ headers: request.headers });
  if (!sessionData?.user) throw redirect("/auth?mode=login");

  let tenantId = sessionData.session.activeOrganizationId;
  let activeOrgName = "Personal Workspace";

  if (!tenantId) {
    const orgs = await auth.api.listOrganizations({ headers: request.headers });
    if (orgs.length > 0) {
      tenantId = orgs[0].id;
      activeOrgName = orgs[0].name;
    } else {
      const newOrg = await auth.api.createOrganization({
        headers: request.headers,
        body: { name: `${sessionData.user.name}'s Organization`, slug: crypto.randomUUID() },
      });
      tenantId = newOrg!.id;
      activeOrgName = newOrg!.name;
    }
  } else {
    const orgs = await auth.api.listOrganizations({ headers: request.headers });
    const active = orgs.find((o: any) => o.id === tenantId);
    if (active) activeOrgName = active.name;
  }

  const db = drizzle(env.DB, { schema: { cloudflareAccounts, zoneConfigs, addToListRules, actionLogs } });

  const [accounts, zones, rules, recentAttacks, [{ count: totalBlocks }]] = await Promise.all([
    db.select().from(cloudflareAccounts).where(eq(cloudflareAccounts.tenantId, tenantId)).orderBy(desc(cloudflareAccounts.createdAt)),
    db.select().from(zoneConfigs).where(eq(zoneConfigs.tenantId, tenantId)).orderBy(desc(zoneConfigs.createdAt)),
    db.select().from(addToListRules).where(eq(addToListRules.tenantId, tenantId)).orderBy(desc(addToListRules.createdAt)),
    db.select().from(actionLogs).where(eq(actionLogs.tenantId, tenantId)).orderBy(desc(actionLogs.blockedAt)).limit(10),
    db.select({ count: sql<number>`count(*)` }).from(actionLogs).where(eq(actionLogs.tenantId, tenantId)),
  ]);

  return { user: sessionData.user, orgName: activeOrgName, accounts, zones, rules, recentAttacks, totalBlocks };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { orgName, accounts, zones, rules, recentAttacks, totalBlocks } = loaderData as any;
  const actionData = useActionData() as { error?: string } | null;
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const isAddingAccount = navigation.formData?.get("intent") === "add_account";
  const isAddingZone = navigation.formData?.get("intent") === "add_zone";
  const isAddingRule = navigation.formData?.get("intent") === "add_to_list_rule";

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [ruleModalZoneId, setRuleModalZoneId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(0); // 0 means off

  useEffect(() => {
    if (pollInterval === 0) return;
    const timer = setInterval(() => {
      if (navigation.state === "idle") {
        revalidator.revalidate();
      }
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval, revalidator, navigation.state]);

  useEffect(() => { if (!isAddingAccount && navigation.state === "idle") setIsAccountModalOpen(false); }, [isAddingAccount, navigation.state]);
  useEffect(() => { if (!isAddingZone && navigation.state === "idle") setIsZoneModalOpen(false); }, [isAddingZone, navigation.state]);
  useEffect(() => { if (!isAddingRule && navigation.state === "idle") setRuleModalZoneId(null); }, [isAddingRule, navigation.state]);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8">

      <header className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-10 gap-8">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-sm mb-4 mx-auto lg:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
              {orgName}
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950">Dashboard</h1>
          <p className="text-slate-500 font-semibold mt-2 text-sm max-w-md leading-relaxed mx-auto lg:mx-0">
            Monitor and manage your edge defenses in real-time.
          </p>
        </div>

        <div className="flex flex-row items-center justify-center gap-1.5 w-full lg:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl h-[38px] lg:h-[42px] shadow-sm divide-x divide-slate-100 overflow-hidden min-w-0 flex-1 lg:flex-none">
            <button
              onClick={() => revalidator.revalidate()}
              disabled={revalidator.state === "loading"}
              className="px-2.5 lg:px-3.5 h-full hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center"
              title="Refresh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${revalidator.state === "loading" ? "animate-spin text-indigo-600" : "text-slate-400"}`}
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" />
              </svg>
            </button>
            <div className="relative h-full flex items-center min-w-[50px] lg:min-w-[80px]">
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="appearance-none bg-transparent h-full w-full pl-2 pr-6 text-[10px] lg:text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors text-center"
              >
                <option value={0}>OFF</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>60s</option>
              </select>
              <svg className="absolute right-1.5 pointer-events-none text-slate-400" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-950 text-xs font-bold px-2.5 lg:px-4 h-[38px] lg:h-[42px] rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            Invite
          </button>

          <button
            onClick={() => setIsZoneModalOpen(true)}
            disabled={accounts.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-slate-950 text-white text-xs font-bold px-3 lg:px-5 h-[38px] lg:h-[42px] rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Zone
          </button>
        </div>
      </header>

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

      <ConnectedAccounts
        accounts={accounts}
        onAdd={() => setIsAccountModalOpen(true)}
        error={actionData?.error}
      />

      <MetricsGrid zonesCount={zones.length} totalBlocks={totalBlocks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ZonesList
          zones={zones}
          accounts={accounts}
          rules={rules}
          onAddZone={() => setIsZoneModalOpen(true)}
          onAddRule={(zoneId) => setRuleModalZoneId(zoneId)}
        />
        <RecentBlocks attacks={recentAttacks} />
      </div>

      {isAccountModalOpen && <AddAccountModal onClose={() => setIsAccountModalOpen(false)} isSubmitting={isAddingAccount} />}
      {isZoneModalOpen && <AddZoneModal onClose={() => setIsZoneModalOpen(false)} isSubmitting={isAddingZone} accounts={accounts} />}
      {ruleModalZoneId && <AddToListRuleModal onClose={() => setRuleModalZoneId(null)} isSubmitting={isAddingRule} zoneId={ruleModalZoneId} accounts={accounts} zones={zones} />}
      {isInviteModalOpen && <InviteMemberModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  );
}
