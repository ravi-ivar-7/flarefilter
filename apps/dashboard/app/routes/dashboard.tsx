import { drizzle } from "drizzle-orm/d1";
import { cloudflareAccounts, zoneConfigs, addIpToListRules, actionLogs, requestActivity } from "@flarefilter/db/src/schema/zones";
import { organization as orgTable, member as memberTable } from "@flarefilter/db/src/schema/organizations";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";
import type { Route } from "./+types/dashboard";
import { useNavigation, useActionData, useRevalidator, redirect } from "react-router";
import { getAuth } from "~/lib/auth";
import { useState, useEffect, useRef } from "react";

import { AddAccount } from "~/components/dashboard/modals/AddAccount";
import { AddZone } from "~/components/dashboard/modals/AddZone";
import { RuleSelector } from "~/components/dashboard/modals/rules/RuleSelector";
import { RULE_REGISTRY, type RuleType } from "~/lib/rules/registry";
import { IPsAnalyzer } from "~/components/dashboard/views/IPsAnalyzer";
import { Overview } from "~/components/dashboard/views/Overview";
import { ActionLogs } from "~/components/dashboard/views/ActionLogs";
import { Lists } from "~/components/dashboard/views/Lists";
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

  const db = drizzle(env.DB, { schema: { cloudflareAccounts, zoneConfigs, addIpToListRules, actionLogs, orgTable, memberTable } });

  const auth = getAuth(env);
  const sessionData = await auth.api.getSession({ headers: request.headers });
  if (!sessionData?.user) throw redirect("/auth?mode=login");

  let tenantId = sessionData.session.activeOrganizationId;
  if (!tenantId) {
    // Fallback: find first membership via DB (faster than auth API)
    const firstMembership = await db
      .select({ orgId: memberTable.organizationId })
      .from(memberTable)
      .where(eq(memberTable.userId, sessionData.user.id))
      .limit(1);
    if (firstMembership.length > 0) {
      tenantId = firstMembership[0].orgId;
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

      // Cloudflare Account IDs are strictly 32-character hex strings.
      if (!/^[a-fA-F0-9]{32}$/.test(cfAccountId)) {
        return { error: "Invalid Account ID format. It must be exactly 32 alphanumeric characters." };
      }

      // 1. Verify the token is valid at all
      try {
        const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
          headers: { Authorization: `Bearer ${cfApiToken}` },
        });
        const verifyJson: any = await verifyRes.json();
        if (!verifyRes.ok || !verifyJson.success) {
          return { error: "Invalid API Token. Cloudflare rejected it — check the token is active and not expired." };
        }
      } catch {
        return { error: "Could not reach Cloudflare to verify the token. Check your internet connection." };
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

  if (intent === "add_rule") {
    const ruleType = formData.get("ruleType") as string;
    const config = RULE_REGISTRY[ruleType];

    if (config?.table && config.prepareValues) {
      const values = config.prepareValues(formData);
      await db.insert(config.table).values({
        id: crypto.randomUUID(),
        tenantId,
        ...values,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      // 1. Delete transient logs and activity
      await db.delete(actionLogs).where(eq(actionLogs.zoneConfigId, zoneId));
      await db.delete(requestActivity).where(eq(requestActivity.zoneConfigId, zoneId));

      // 2. Cascade delete rules across ALL rule tables in the registry
      for (const config of Object.values(RULE_REGISTRY)) {
        if (config.table) {
          await db.delete(config.table).where(eq(config.table.zoneConfigId, zoneId));
        }
      }

      // 3. Finally delete the zone itself
      await db.delete(zoneConfigs).where(
        and(eq(zoneConfigs.id, zoneId), eq(zoneConfigs.tenantId, tenantId))
      );
    }
    return null;
  }

  if (intent === "delete_rule") {
    const ruleId = formData.get("ruleId") as string;
    const ruleType = formData.get("ruleType") as string;
    const config = RULE_REGISTRY[ruleType];

    if (ruleId && config) {
      await db.delete(actionLogs).where(eq(actionLogs.ruleId, ruleId));
      await db.delete(config.table).where(
        and(eq(config.table.id, ruleId), eq(config.table.tenantId, tenantId))
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

      // 2. Cascade the status to all rules in this zone across ALL implemented rule tables in the registry
      for (const config of Object.values(RULE_REGISTRY)) {
        if (config.table) {
          await db.update(config.table)
            .set({ isActive, updatedAt: new Date() })
            .where(and(eq(config.table.zoneConfigId, zoneId), eq(config.table.tenantId, tenantId)));
        }
      }
    }
    return null;
  }

  if (intent === "toggle_rule_status") {
    const ruleId = formData.get("ruleId") as string;
    const ruleType = formData.get("ruleType") as string;
    const isActive = formData.get("isActive") === "true";
    const config = RULE_REGISTRY[ruleType];

    if (ruleId && config) {
      await db.update(config.table)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(config.table.id, ruleId), eq(config.table.tenantId, tenantId)));
    }
    return null;
  }

  if (intent === "update_profile") {
    const name = formData.get("name") as string;
    if (name) {
      await auth.api.updateUser({
        headers: request.headers,
        body: { name },
      });
    }
    // Redirect so the loader re-runs and renders the updated user name
    throw redirect("/dashboard/profile");
  }

  if (intent === "update_organization") {
    const organizationId = formData.get("organizationId") as string;
    const name = formData.get("name") as string;
    if (organizationId && name) {
      await auth.api.updateOrganization({
        headers: request.headers,
        body: { organizationId, data: { name } }
      });
    }
    // Redirect so the loader re-runs with fresh org name
    throw redirect("/dashboard/profile");
  }

  if (intent === "delete_organization") {
    const orgId = formData.get("organizationId") as string;
    if (orgId) {
      // 0. Authorization: query DB directly — faster and correct (no role-stripping)
      const membership = await db
        .select({ role: memberTable.role })
        .from(memberTable)
        .where(and(eq(memberTable.organizationId, orgId), eq(memberTable.userId, sessionData.user.id)))
        .limit(1);
      const userRole = membership[0]?.role;
      if (!userRole || userRole !== 'owner') {
        return { error: "Permission Denied: Only organization owners can delete organizations." };
      }

      // 1. Delete all application data tied to this organization to avoid FK constraint errors

      // Fetch zones to clean up their dependent logs/activity/rules
      const zones = await db.select().from(zoneConfigs).where(eq(zoneConfigs.tenantId, orgId));
      for (const zone of zones) {
        // Delete transient data
        await db.delete(actionLogs).where(eq(actionLogs.zoneConfigId, zone.id));
        await db.delete(requestActivity).where(eq(requestActivity.zoneConfigId, zone.id));

        // Delete rules from all registries
        for (const config of Object.values(RULE_REGISTRY)) {
          if (config.table) {
            await db.delete(config.table).where(eq(config.table.zoneConfigId, zone.id));
          }
        }
      }

      // Delete zones themselves
      await db.delete(zoneConfigs).where(eq(zoneConfigs.tenantId, orgId));

      // Delete cloudflare accounts
      await db.delete(cloudflareAccounts).where(eq(cloudflareAccounts.tenantId, orgId));

      // 2. Finally delete from the auth system (which handles members/invitations)
      await auth.api.deleteOrganization({
        headers: request.headers,
        body: { organizationId: orgId }
      });
    }
    // Redirect so the loader re-runs with fresh session (active org changed after delete)
    throw redirect("/dashboard/profile");
  }
  if (intent === "leave_organization") {
    const orgId = formData.get("organizationId") as string;
    if (orgId) {
      await auth.api.leaveOrganization({
        headers: request.headers,
        body: { organizationId: orgId }
      });
    }
    // Redirect so loader re-runs with fresh session (active org may have changed)
    throw redirect("/dashboard/profile");
  }

  return null;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  if (!env.DB) throw new Error("D1 binding 'DB' not configured.");

  const auth = getAuth(env);
  const sessionData = await auth.api.getSession({ headers: request.headers });
  if (!sessionData?.user) throw redirect("/auth?mode=login");

  const db = drizzle(env.DB, { schema: { cloudflareAccounts, zoneConfigs, addIpToListRules, actionLogs, orgTable, memberTable } });

  // Single optimized query: get all orgs the current user belongs to WITH their role
  // This replaces auth.api.listOrganizations() which strips the member.role field
  const userOrgMemberships = await db
    .select({
      // org fields
      id: orgTable.id,
      name: orgTable.name,
      slug: orgTable.slug,
      logo: orgTable.logo,
      createdAt: orgTable.createdAt,
      metadata: orgTable.metadata,
      // member fields
      role: memberTable.role,
      memberId: memberTable.id,
    })
    .from(memberTable)
    .innerJoin(orgTable, eq(memberTable.organizationId, orgTable.id))
    .where(eq(memberTable.userId, sessionData.user.id))
    .orderBy(orgTable.createdAt);

  const orgsWithRoles = userOrgMemberships; // each item has role, memberId, plus org fields

  let tenantId = sessionData.session.activeOrganizationId;
  let activeOrg: any = null;

  if (!tenantId) {
    if (orgsWithRoles.length > 0) {
      tenantId = orgsWithRoles[0].id;
      activeOrg = orgsWithRoles[0];
    } else {
      // No orgs yet — create a default one
      const newOrg = await auth.api.createOrganization({
        headers: request.headers,
        body: { name: `${sessionData.user.name}'s Organization`, slug: crypto.randomUUID() },
      });
      tenantId = newOrg!.id;
      // Re-fetch after creation to get member row with role
      const created = await db
        .select({ id: orgTable.id, name: orgTable.name, slug: orgTable.slug, logo: orgTable.logo, createdAt: orgTable.createdAt, metadata: orgTable.metadata, role: memberTable.role, memberId: memberTable.id })
        .from(memberTable)
        .innerJoin(orgTable, eq(memberTable.organizationId, orgTable.id))
        .where(eq(memberTable.userId, sessionData.user.id))
        .limit(1);
      activeOrg = created[0] ?? { ...newOrg, role: 'owner' };
      orgsWithRoles.push(activeOrg);
    }
  } else {
    activeOrg = orgsWithRoles.find((o) => o.id === tenantId) ?? orgsWithRoles[0] ?? null;
  }

  const orgName = activeOrg?.name || "Default Organization";

  const tab = params.tab || "overview";

  const activeRuleConfigs = Object.values(RULE_REGISTRY).filter(c => c.table);

  const url = new URL(request.url);
  const rangeType = url.searchParams.get("type") || "relative";
  const relativeValue = url.searchParams.get("relative") || "30m";
  const startStr = url.searchParams.get("start");
  const endStr = url.searchParams.get("end");
  const queryLimit = parseInt(url.searchParams.get("limit") || (tab === "logs" ? "100" : "10"));
  const zoneIdFilter = url.searchParams.get("zoneId");

  const conditions = [eq(actionLogs.tenantId, tenantId)];

  if (zoneIdFilter) {
    conditions.push(eq(actionLogs.zoneConfigId, zoneIdFilter));
  }

  if (rangeType === "relative") {
    const num = parseInt(relativeValue);
    const unit = relativeValue.slice(-1);
    let ms = 30 * 60000;
    if (unit === "m") ms = num * 60000;
    else if (unit === "h") ms = num * 3600000;
    else if (unit === "d") ms = num * 86400000;
    conditions.push(gte(actionLogs.timestamp, new Date(Date.now() - ms)));
  } else if (rangeType === "absolute" && startStr) {
    conditions.push(gte(actionLogs.timestamp, new Date(startStr)));
    if (endStr) conditions.push(lte(actionLogs.timestamp, new Date(endStr)));
  }

  const [accounts, zones, recentActions, [{ count: totalBlocks }], ...ruleResults] = await Promise.all([
    db.select().from(cloudflareAccounts).where(eq(cloudflareAccounts.tenantId, tenantId)).orderBy(desc(cloudflareAccounts.createdAt)),
    db.select().from(zoneConfigs).where(eq(zoneConfigs.tenantId, tenantId)).orderBy(desc(zoneConfigs.createdAt)),
    db.select().from(actionLogs).where(and(...conditions)).orderBy(desc(actionLogs.timestamp)).limit(queryLimit),
    db.select({ count: sql<number>`count(*)` }).from(actionLogs).where(and(...conditions)),
    ...activeRuleConfigs.map(c => db.select().from(c.table).where(eq(c.table.tenantId, tenantId)).orderBy(desc(c.table.createdAt)))
  ]);

  const rules = ruleResults.flatMap((res, i) => {
    const type = activeRuleConfigs[i].type;
    return (res as any[]).map(r => ({ ...r, type }));
  });

  return { user: sessionData.user, orgName, activeOrg, orgs: orgsWithRoles, accounts, zones, rules, recentActions, totalBlocks, currentTab: tab };
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
  const isAddingRule = navigation.formData?.get("intent") === "add_rule";

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [ruleModalZoneId, setRuleModalZoneId] = useState<string | null>(null);
  const [selectedRuleType, setSelectedRuleType] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPaused, setIsPaused] = useState(false);

  const [dateRange, _setDateRange] = useState<DateRange>(() => {
    // 1. Try URL first
    const type = searchParams.get("type") as "relative" | "absolute" | "all" | null;
    if (type) {
      return {
        type,
        relativeValue: searchParams.get("relative") || "30m",
        start: searchParams.get("start") ? new Date(searchParams.get("start")!) : undefined,
        end: searchParams.get("end") ? new Date(searchParams.get("end")!) : undefined,
        live: searchParams.get("live") === "true",
        refreshInterval: parseInt(searchParams.get("refresh") || "10")
      };
    }

    // 2. Try localStorage
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

  const [limit, _setLimit] = useState<number>(() => {
    // 1. URL
    const qLimit = searchParams.get("limit");
    if (qLimit) return parseInt(qLimit);

    // 2. LocalStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flarefilter_limit");
      if (saved) return parseInt(saved);
    }

    return currentTab === "logs" ? 100 : 10;
  });


  const [analyzerZoneId, _setAnalyzerZoneId] = useState<string>(() => {
    // 1. URL
    const qZone = searchParams.get("zoneId");
    if (qZone) return qZone;

    // 2. LocalStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ff_ips_analyzer_zone");
      if (saved) return saved;
    }
    return "";
  });

  const syncToUrl = (range: DateRange, l: number, zoneId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("type", range.type);
    if (range.type === "relative") {
      params.set("relative", range.relativeValue || "30m");
      params.delete("start");
      params.delete("end");
    } else if (range.type === "absolute") {
      params.set("start", range.start?.toISOString() || "");
      params.set("end", range.end?.toISOString() || "");
      params.delete("relative");
    } else {
      params.delete("relative");
      params.delete("start");
      params.delete("end");
    }
    params.set("live", String(range.live || false));
    params.set("refresh", String(range.refreshInterval || 10));
    params.set("limit", String(l));

    if (zoneId) params.set("zoneId", zoneId);
    else params.delete("zoneId");

    params.delete("actions");

    setSearchParams(params, { replace: true, preventScrollReset: true });
  };

  const setDateRange = (newRange: DateRange) => {
    _setDateRange(newRange);
    if (typeof window !== "undefined") {
      localStorage.setItem("flarefilter_daterange", JSON.stringify(newRange));
    }
    syncToUrl(newRange, limit, analyzerZoneId);
  };

  const setLimit = (newLimit: number) => {
    _setLimit(newLimit);
    if (typeof window !== "undefined") {
      localStorage.setItem("flarefilter_limit", String(newLimit));
    }
    syncToUrl(dateRange, newLimit, analyzerZoneId);
  };

  const setAnalyzerZoneId = (zId: string) => {
    _setAnalyzerZoneId(zId);
    if (typeof window !== "undefined") {
      localStorage.setItem("ff_ips_analyzer_zone", zId);
    }
    syncToUrl(dateRange, limit, zId);
  };

  // Guarantee that the URL always perfectly matches the internal UI state 
  // so the Loader never fetches default empty data while the dropdown shows something else.
  useEffect(() => {
    const urlZone = searchParams.get("zoneId") || "";
    const urlLimit = searchParams.get("limit");

    if (
      !searchParams.has("type") ||
      urlZone !== analyzerZoneId ||
      urlLimit !== String(limit)
    ) {
      syncToUrl(dateRange, limit, analyzerZoneId);
    }
  }, [searchParams, activeTab, dateRange, limit, analyzerZoneId]);

  useEffect(() => {
    const type = searchParams.get("type") as "relative" | "absolute" | "all" | null;
    if (type) {
      _setDateRange({
        type,
        relativeValue: searchParams.get("relative") || "30m",
        start: searchParams.get("start") ? new Date(searchParams.get("start")!) : undefined,
        end: searchParams.get("end") ? new Date(searchParams.get("end")!) : undefined,
        live: searchParams.get("live") === "true",
        refreshInterval: parseInt(searchParams.get("refresh") || "10")
      });
    }

    const qLimit = searchParams.get("limit");
    if (qLimit) {
      _setLimit(parseInt(qLimit));
    }

    const qZone = searchParams.get("zoneId");
    if (qZone !== null) {
      _setAnalyzerZoneId(qZone);
    }

  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flarefilter_daterange", JSON.stringify(dateRange));
    }

    if (!dateRange.live) return;

    const intervalMs = (dateRange.refreshInterval || 10) * 1000;
    const timer = setInterval(() => {
      if (navigation.state === "idle" && !isPaused) {
        revalidator.revalidate();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [dateRange, revalidator, navigation.state, isPaused]);

  // Close modal only on success (no error). If there's an error keep modal open so user sees it.
  const prevIsAddingAccount = useRef(isAddingAccount);
  useEffect(() => {
    if (prevIsAddingAccount.current === true && isAddingAccount === false) {
      if (!actionData?.error) setIsAccountModalOpen(false);
    }
    prevIsAddingAccount.current = isAddingAccount;
  }, [isAddingAccount, actionData]);

  const prevIsAddingZone = useRef(isAddingZone);
  useEffect(() => {
    if (prevIsAddingZone.current === true && isAddingZone === false) {
      if (!actionData?.error) setIsZoneModalOpen(false);
    }
    prevIsAddingZone.current = isAddingZone;
  }, [isAddingZone, actionData]);

  const prevIsAddingRule = useRef(isAddingRule);
  useEffect(() => {
    if (prevIsAddingRule.current === true && isAddingRule === false) {
      if (!actionData?.error) setRuleModalZoneId(null);
    }
    prevIsAddingRule.current = isAddingRule;
  }, [isAddingRule, actionData]);

  return (
    <div className="pb-8">

      {accounts.length === 0 && (
        <div className="mb-8 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">No Cloudflare account connected</p>
            <p className="text-xs text-amber-700 mt-0.5">Connect a CF account before adding zones.</p>
          </div>
          <button onClick={() => setIsAccountModalOpen(true)} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors">
            Connect Account
          </button>
        </div>
      )}

      {activeTab === "overview" && (
        <Overview
          orgName={orgName}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isLoading={navigation.state !== "idle" || revalidator.state !== "idle"}
          accounts={accounts}
          zones={zones}
          rules={rules}
          recentActions={recentActions}
          totalBlocks={totalBlocks}
          limit={limit}
          onLimitChange={setLimit}
          onRefresh={() => revalidator.revalidate()}
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
          limit={limit}
          onLimitChange={setLimit}
          activeZoneId={analyzerZoneId}
          onActiveZoneChange={setAnalyzerZoneId}
          isLoading={navigation.state !== "idle" || revalidator.state !== "idle"}
          onPauseChange={setIsPaused}
        />
      )}

      {activeTab === "logs" && (
        <ActionLogs
          zones={zones}
          orgName={orgName}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          limit={limit}
          onLimitChange={setLimit}
          activeZoneId={analyzerZoneId}
          onActiveZoneChange={setAnalyzerZoneId}
          onRefresh={() => revalidator.revalidate()}
          isLoading={navigation.state !== "idle" || revalidator.state !== "idle"}
          recentActions={recentActions}
        />
      )}

      {activeTab === "lists" && (
        <Lists
          accounts={accounts}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          limit={limit}
          onLimitChange={setLimit}
          isLoading={navigation.state !== "idle" || revalidator.state !== "idle"}
          onPauseChange={setIsPaused}
        />
      )}

      {activeTab === "profile" && (
        <Profile user={user} activeOrg={activeOrg} orgs={orgs} />
      )}

      {isAccountModalOpen && <AddAccount onClose={() => { setIsAccountModalOpen(false); }} isSubmitting={isAddingAccount} error={actionData?.error} />}
      {isZoneModalOpen && <AddZone onClose={() => setIsZoneModalOpen(false)} isSubmitting={isAddingZone} accounts={accounts} />}
      {ruleModalZoneId && !selectedRuleType && (
        <RuleSelector
          onClose={() => setRuleModalZoneId(null)}
          onSelect={(type: RuleType) => setSelectedRuleType(type)}
        />
      )}
      {(() => {
        const config = ruleModalZoneId && selectedRuleType ? RULE_REGISTRY[selectedRuleType] : null;
        const AddComponent = config?.addComponent;
        if (!AddComponent) return null;

        return (
          <AddComponent
            onClose={() => {
              setRuleModalZoneId(null);
              setSelectedRuleType(null);
            }}
            isSubmitting={isAddingRule}
            zoneId={ruleModalZoneId!}
            accounts={accounts}
            zones={zones}
            config={config}
          />
        );
      })()}
    </div>
  );
}
