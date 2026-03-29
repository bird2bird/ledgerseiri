"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformTenantSummary,
  fetchPlatformUsersSummary,
  fetchPlatformReconciliationSummary,
  fetchPlatformRevenueSummary,
  fetchPlatformReconciliationList,
  fetchPlatformReconciliationOpsSummary,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  type PlatformAuditRow,
} from "@/core/platform-auth/client";

type TenantSummary = {
  totalTenants: number;
  tenantsWithUsers: number;
  tenantsWithStores: number;
  subscribedTenants: number;
  createdLast30Days: number;
};

type UsersSummary = {
  totalUsers: number;
  assignedUsers: number;
  unassignedUsers: number;
  newUsers30d: number;
};

type ReconciliationSummary = {
  totalDecisions: number;
  avgConfidence: number;
  decisions30d: number;
  totalAudits: number;
  audits30d: number;
  latestSubmittedAt: string | null;
  decisionBreakdown: Array<{ decision: string; count: number }>;
};

type RevenueSummary = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  newSubscriptions30d: number;
  mrr: number;
  arpu: number;
};

function formatMoney(v?: number | null) {
  return `¥${Number(v || 0).toLocaleString("ja-JP")}`;
}

function buildAuditHref(
  lang: string,
  params?: Record<string, string | number | boolean | null | undefined>
) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return `/${lang}/platform/audit${qs ? `?${qs}` : ""}`;
}

function metricCard(title: string, value: string, subtitle: string, href: string) {
  return { title, value, subtitle, href };
}

export default function PlatformDashboardPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);
  const [reconciliationSummary, setReconciliationSummary] =
    useState<ReconciliationSummary | null>(null);
  const [revenueSummary, setRevenueSummary] =
    useState<RevenueSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<PlatformAuditRow[]>([]);
  const [opsSummary, setOpsSummary] = useState<{
    totalAuditRows: number;
    changedRows: number;
    adminRows: number;
    overrideRows: number;
    failedSignals: number;
    actionableSignals: number;
    latestAuditAt: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [t, u, r, rev, recent, ops] = await Promise.all([
      fetchPlatformTenantSummary(token),
      fetchPlatformUsersSummary(token),
      fetchPlatformReconciliationSummary(token),
      fetchPlatformRevenueSummary(token),
      fetchPlatformReconciliationList(token, { page: 1, limit: 6 }),
      fetchPlatformReconciliationOpsSummary(token),
    ]);

    setTenantSummary(t);
    setUsersSummary(u);
    setReconciliationSummary(r);
    setRevenueSummary(rev);
    setRecentEvents(recent.items || []);
    setOpsSummary(ops);
    setError("");
  }

  useEffect(() => {
    reload()
      .catch((e) => {
        if (isPlatformUnauthorizedError(e)) {
          router.replace(`/${lang}/platform-auth/login`);
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, [lang, router]);

  const cards = useMemo(
    () => [
      metricCard(
        "MRR",
        formatMoney(revenueSummary?.mrr),
        `Active subs: ${revenueSummary?.activeSubscriptions ?? 0}`,
        `/${lang}/platform/tenants`
      ),
      metricCard(
        "Tenants",
        String(tenantSummary?.totalTenants ?? 0),
        `New 30d: ${tenantSummary?.createdLast30Days ?? 0}`,
        `/${lang}/platform/tenants`
      ),
      metricCard(
        "Users",
        String(usersSummary?.totalUsers ?? 0),
        `Assigned: ${usersSummary?.assignedUsers ?? 0}`,
        `/${lang}/platform/users`
      ),
      metricCard(
        "Reconciliation",
        String(reconciliationSummary?.totalDecisions ?? 0),
        `Audits: ${reconciliationSummary?.totalAudits ?? 0}`,
        buildAuditHref(lang, { page: 1, limit: 20 })
      ),
    ],
    [lang, revenueSummary, tenantSummary, usersSummary, reconciliationSummary]
  );

  const trendCards = useMemo(
    () => [
      {
        title: "Tenant Growth",
        value: `+${tenantSummary?.createdLast30Days ?? 0}`,
        subtitle: "new tenants in last 30 days",
      },
      {
        title: "User Assignment",
        value: `${usersSummary?.assignedUsers ?? 0}/${usersSummary?.totalUsers ?? 0}`,
        subtitle: "assigned users ratio",
      },
      {
        title: "Audit Freshness",
        value: `${reconciliationSummary?.audits30d ?? 0}`,
        subtitle: "audit rows in last 30 days",
      },
      {
        title: "Subscription Momentum",
        value: `+${revenueSummary?.newSubscriptions30d ?? 0}`,
        subtitle: "new subscriptions in last 30 days",
      },
    ],
    [tenantSummary, usersSummary, reconciliationSummary, revenueSummary, opsSummary]
  );

  if (loading) return <div className="text-slate-300">Loading dashboard...</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Investigation Workspace</div>
          <h2 className="mt-3 text-3xl font-semibold">Dashboard</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            reload()
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setLoading(false));
          }}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
        >
          Reload
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 hover:border-cyan-500/40"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.title}</div>
            <div className="mt-3 text-3xl font-semibold">{card.value}</div>
            <div className="mt-2 text-sm text-slate-400">{card.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="text-sm font-semibold">30-day operational signals</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trendCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{card.title}</div>
              <div className="mt-3 text-2xl font-semibold">{card.value}</div>
              <div className="mt-2 text-xs text-slate-400">{card.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">Operational Status</div>
          <Link
            href={`/${lang}/platform/operations`}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            View Result Center
          </Link>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Audit Rows", String(opsSummary?.totalAuditRows ?? 0), "Unified audit timeline volume"],
            ["Changed Signals", String(opsSummary?.changedRows ?? 0), "Signals with meaningful value change"],
            ["Failed Signals", String(opsSummary?.failedSignals ?? 0), "Requires review or retry"],
            ["Latest Audit", opsSummary?.latestAuditAt || "-", "Latest observed unified audit write-back"],
          ].map(([title, value, subtitle]) => (
            <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
              <div className="mt-3 text-2xl font-semibold">{value}</div>
              <div className="mt-2 text-xs text-slate-400">{subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link
          href={`/${lang}/platform/tenants`}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 hover:border-cyan-500/40"
        >
          <div className="text-sm font-semibold">Tenant Drill-down</div>
          <div className="mt-2 text-xs text-slate-400">
            With users: {tenantSummary?.tenantsWithUsers ?? 0} · With stores: {tenantSummary?.tenantsWithStores ?? 0}
          </div>
        </Link>

        <Link
          href={`/${lang}/platform/users`}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 hover:border-cyan-500/40"
        >
          <div className="text-sm font-semibold">User Drill-down</div>
          <div className="mt-2 text-xs text-slate-400">
            Unassigned: {usersSummary?.unassignedUsers ?? 0} · New 30d: {usersSummary?.newUsers30d ?? 0}
          </div>
        </Link>

        <Link
          href={buildAuditHref(lang, { changed: true, page: 1, limit: 20 })}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 hover:border-cyan-500/40"
        >
          <div className="text-sm font-semibold">Audit Drill-down</div>
          <div className="mt-2 text-xs text-slate-400">
            Latest: {reconciliationSummary?.latestSubmittedAt || "-"} · Avg confidence: {reconciliationSummary?.avgConfidence ?? 0}
          </div>
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">Investigation Signals</div>
          <Link
            href={`/${lang}/platform/audit?source=admin&page=1&limit=20`}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Open Investigation Workspace
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {recentEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-400">
              No recent audit events.
            </div>
          ) : (
            recentEvents.map((row) => (
              <Link
                key={row.id}
                href={buildAuditHref(lang, {
                  companyId: row.companyId,
                  candidateId: row.candidateId,
                  persistenceKey: row.persistenceKey || "",
                  page: 1,
                  limit: 20,
                })}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 hover:border-cyan-500/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {row.actionType} · {row.source}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {row.companyId} · {row.candidateId}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Changed</div>
                    <div className="mt-1 text-sm font-medium">{row.changed ? "YES" : "NO"}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500">{row.createdAt}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
