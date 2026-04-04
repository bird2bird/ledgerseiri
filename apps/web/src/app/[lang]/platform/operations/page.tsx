"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformAuditOperationLink,
  fetchPlatformOperationById,
  fetchPlatformOperationsAnalytics,
  fetchPlatformOperationsMetrics,
  fetchPlatformOperationsList,
  fetchPlatformReconciliationOpsSummary,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  retryFailedPlatformOperation,
} from "@/core/platform-auth/client";
import {
  buildPlatformAuditHref,
  buildPlatformReconciliationHref,
  buildPlatformUsersHref,
} from "@/core/platform/drilldown";

type OperationSummary = {
  id: string;
  type: string;
  scope: string;
  status: string;
  requestedDecision?: string | null;
  requestedCount?: number;
  successCount?: number;
  failedCount?: number;
  requestedAt?: string;
  completedAt?: string | null;
  companyId?: string | null;
  candidateId?: string | null;
  persistenceKey?: string | null;
  source?: string | null;
};

type OperationDetail = OperationSummary & {
  items?: Array<{
    id: string;
    targetId: string;
    companyId?: string | null;
    candidateId?: string | null;
    persistenceKey?: string | null;
    status: string;
    requestedAction?: string;
    failureCode?: string | null;
    failureMessage?: string | null;
    auditId?: string | null;
  }>;
};

function statusBadgeClass(status?: string | null) {
  if (status === "COMPLETED" || status === "SUCCEEDED") {
    return "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200";
  }
  if (status === "FAILED") {
    return "rounded-full bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200";
  }
  if (status === "PARTIAL_FAILED") {
    return "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200";
  }
  if (status === "RUNNING") {
    return "rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200";
  }
  return "rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300";
}

function itemStatusBadgeClass(status?: string | null) {
  if (status === "SUCCEEDED") {
    return "rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200";
  }
  if (status === "FAILED") {
    return "rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-200";
  }
  return "rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300";
}

function OperationsCenterContent() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [analytics, setAnalytics] = useState<{
    failureTrend: Array<{ id: string; requestedAt: string; scope: string; failedCount: number; successCount: number; status: string }>;
    scopeByStatus: Array<{ scope: string; status: string; count: number }>;
    retryPerformanceByScope: Array<{ scope: string; total: number; retryCapable: number; successful: number; successRate: number }>;
    topFailureCodes: Array<{ code: string; count: number }>;
    recentFailingTargets: Array<{ targetId: string; count: number; scope: string; lastFailureCode: string | null }>;
    noisyCompanies: Array<{ companyId: string; count: number }>;
    noisyCandidates: Array<{ candidateId: string; count: number }>;
  } | null>(null);
  const [metrics, setMetrics] = useState<{
    total: number;
    running: number;
    completed: number;
    partialFailed: number;
    failed: number;
    retryCapable: number;
    byScope: Array<{ scope: string; count: number }>;
    topFailureCodes: Array<{ code: string; count: number }>;
  } | null>(null);
  const [opsSummary, setOpsSummary] = useState<{
    totalAuditRows: number;
    changedRows: number;
    adminRows: number;
    overrideRows: number;
    failedSignals: number;
    actionableSignals: number;
    latestAuditAt: string | null;
  } | null>(null);

  const [operations, setOperations] = useState<OperationSummary[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [initialSelectedOperationId, setInitialSelectedOperationId] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<OperationDetail | null>(null);
  const [operationAuditLink, setOperationAuditLink] = useState<{ auditIds: string[] } | null>(null);

  const [scopeFilter, setScopeFilter] = useState<"all" | "RECONCILIATION" | "PLATFORM_TENANT" | "PLATFORM_USER">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "COMPLETED" | "PARTIAL_FAILED" | "FAILED" | "RUNNING">("all");
  const [searchText, setSearchText] = useState("");
  const [itemFilter, setItemFilter] = useState<"all" | "failed" | "succeeded">("all");

  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retryingOperationId, setRetryingOperationId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const items = selectedOperation?.items || [];
    if (itemFilter === "failed") return items.filter((item) => item.status === "FAILED");
    if (itemFilter === "succeeded") return items.filter((item) => item.status === "SUCCEEDED");
    return items;
  }, [selectedOperation, itemFilter]);

  const failureSummary = useMemo(() => {
    const rows = (selectedOperation?.items || []).filter((item) => item.status === "FAILED");
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.failureCode || "UNKNOWN";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([code, count]) => ({ code, count }));
  }, [selectedOperation]);

  function syncSelectedOperationQuery(id?: string | null) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("selected", id);
    } else {
      url.searchParams.delete("selected");
    }
    window.history.replaceState({}, "", url.toString());
  }

  async function reload(keepSelection = true) {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [ops, metricsData, analyticsData, list] = await Promise.all([
      fetchPlatformReconciliationOpsSummary(token),
      fetchPlatformOperationsMetrics(token),
      fetchPlatformOperationsAnalytics(token),
      fetchPlatformOperationsList(token, {
        ...(scopeFilter === "all" ? {} : { scope: scopeFilter }),
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(searchText.trim() ? { q: searchText.trim() } : {}),
        page,
        limit: 12,
      }),
    ]);

    setOpsSummary(ops);
    setMetrics(metricsData);
    setAnalytics(analyticsData);
    setOperations(list.items || []);
    setPageMeta({
      total: list.total ?? 0,
      totalPages: list.totalPages ?? 1,
      hasNextPage: !!list.hasNextPage,
      hasPrevPage: !!list.hasPrevPage,
    });

    const urlSelectedId =
      initialSelectedOperationId && (list.items || []).some((x) => x.id === initialSelectedOperationId)
        ? initialSelectedOperationId
        : null;

    const nextId =
      keepSelection && selectedOperationId && (list.items || []).some((x) => x.id === selectedOperationId)
        ? selectedOperationId
        : urlSelectedId || list.items?.[0]?.id || null;

    setSelectedOperationId(nextId);
    syncSelectedOperationQuery(nextId);

    if (nextId) {
      setDetailLoading(true);
      try {
        const [detail, auditLink] = await Promise.all([
          fetchPlatformOperationById(nextId, token),
          fetchPlatformAuditOperationLink(nextId, token),
        ]);
        setSelectedOperation(detail as OperationDetail);
        setOperationAuditLink({ auditIds: auditLink.auditIds || [] });
      } finally {
        setDetailLoading(false);
      }
    } else {
      setSelectedOperation(null);
    }

    setError("");
  }

  async function openOperation(id: string) {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    setSelectedOperationId(id);
    syncSelectedOperationQuery(id);
    setDetailLoading(true);
    try {
      const [detail, auditLink] = await Promise.all([
        fetchPlatformOperationById(id, token),
        fetchPlatformAuditOperationLink(id, token),
      ]);
      setSelectedOperation(detail as OperationDetail);
      setOperationAuditLink({ auditIds: auditLink.auditIds || [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  }

  async function retryFailedOperation(id: string) {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    setRetryingOperationId(id);
    try {
      const result = await retryFailedPlatformOperation(id, token, "operations_center");
      setSelectedOperationId(result.operation.id);
      syncSelectedOperationQuery(result.operation.id);
      const detail = await fetchPlatformOperationById(result.operation.id, token);
      setSelectedOperation(detail as OperationDetail);
      await reload(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRetryingOperationId(null);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search);
    const selected = qp.get("selected");
    if (selected) {
      setInitialSelectedOperationId(selected);
      setSelectedOperationId((prev) => prev ?? selected);
    }
  }, []);

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
  }, [lang, router, scopeFilter, statusFilter, page]);

  const cards = useMemo(
    () => [
      ["Batch Tasks", String(opsSummary?.actionableSignals ?? 0), "Current actionable signal volume"],
      ["Operation Results", String(opsSummary?.changedRows ?? 0), "Changed signals flowing through investigation"],
      ["Retry Capability", String(opsSummary?.failedSignals ?? 0), "Failed signals requiring operator retry or inspection"],
      ["Platform Status", String(opsSummary?.adminRows ?? 0), "Admin-originated operations observed in unified audit"],
    ],
    [opsSummary]
  );

  if (loading) return <div className="text-slate-300">Loading operations center...</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Platform Operations</div>
          <h2 className="mt-3 text-3xl font-semibold">Operations Center</h2>
          <div className="mt-2 text-xs text-slate-400">
            Unified operator-facing signals across dashboard, review queue, tenant controls, user controls, and audit timeline.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/${lang}/platform/dashboard`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
            Dashboard
          </Link>
          <Link href={`/${lang}/platform/reconciliation`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
            Review Queue
          </Link>
          <Link href={`/${lang}/platform/audit?page=1&limit=20`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
            Investigation Timeline
          </Link>
        </div>
      </div>        {selectedOperation ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            Requested By: <span className="font-semibold text-slate-100">{(selectedOperation as any).requestedByAdminEmail || (selectedOperation as any).requestedByAdminId || "-"}</span> ·
            Governance Note: <span className="font-semibold text-slate-100">{(selectedOperation as any).note || "-"}</span>
          </div>
        ) : null}

        {selectedOperation ? (
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
            Governance Flags:
            <span className="ml-2 font-semibold text-slate-100">reasonValidated</span> /
            <span className="ml-2 font-semibold text-slate-100">thresholdReviewed</span> /
            <span className="ml-2 font-semibold text-slate-100">protectedScopeChecked</span>
          </div>
        ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {analytics ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="text-sm font-semibold">Failure Intelligence</div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Retry Performance By Scope</div>
              <div className="mt-3 space-y-2">
                {(analytics.retryPerformanceByScope || []).map((row) => (
                  <div key={row.scope} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                    <div>{row.scope}</div>
                    <div className="text-slate-400">
                      success {row.successRate}% · retry {row.retryCapable}/{row.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent Failing Targets</div>
              <div className="mt-3 space-y-2">
                {(analytics.recentFailingTargets || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No recent failing targets.</div>
                ) : (
                  analytics.recentFailingTargets.map((row) => (
                    <div key={`${row.scope}-${row.targetId}`} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                      <div className="font-medium">{row.targetId}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {row.scope} · failures {row.count} · code {row.lastFailureCode || "-"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Noisy Companies</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analytics.noisyCompanies || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No company hotspots.</div>
                ) : (
                  analytics.noisyCompanies.map((row) => (
                    <div key={row.companyId} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                      {row.companyId} · {row.count}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Noisy Candidates</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analytics.noisyCandidates || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No candidate hotspots.</div>
                ) : (
                  analytics.noisyCandidates.map((row) => (
                    <div key={row.candidateId} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                      {row.candidateId} · {row.count}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {metrics ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="text-sm font-semibold">Operations Metrics</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Running</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.running}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.failed}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Partial Failed</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.partialFailed}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Retry Capable</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.retryCapable}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">By Scope</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(metrics.byScope || []).map((row) => (
                  <div key={row.scope} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                    {row.scope} · {row.count}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Top Failure Codes</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(metrics.topFailureCodes || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No recent failure codes.</div>
                ) : (
                  metrics.topFailureCodes.map((row) => (
                    <div key={row.code} className="rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-200">
                      {row.code} · {row.count}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, subtitle]) => (
          <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
            <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Recent Operations</div>
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

          <div className="mt-4 space-y-3">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search operation id / company / candidate / note"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setLoading(true);
                reload(false)
                  .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                  .finally(() => setLoading(false));
              }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Apply Search
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setScopeFilter("all"); setPage(1); }} className={scopeFilter === "all" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>All</button>
            <button type="button" onClick={() => { setScopeFilter("RECONCILIATION"); setPage(1); }} className={scopeFilter === "RECONCILIATION" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Reconciliation</button>
            <button type="button" onClick={() => { setScopeFilter("PLATFORM_TENANT"); setPage(1); }} className={scopeFilter === "PLATFORM_TENANT" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Tenant Controls</button>
            <button type="button" onClick={() => { setScopeFilter("PLATFORM_USER"); setPage(1); }} className={scopeFilter === "PLATFORM_USER" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>User Controls</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setStatusFilter("all"); setPage(1); }} className={statusFilter === "all" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>All Status</button>
            <button type="button" onClick={() => { setStatusFilter("COMPLETED"); setPage(1); }} className={statusFilter === "COMPLETED" ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Completed</button>
            <button type="button" onClick={() => { setStatusFilter("PARTIAL_FAILED"); setPage(1); }} className={statusFilter === "PARTIAL_FAILED" ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Partial Failed</button>
            <button type="button" onClick={() => { setStatusFilter("FAILED"); setPage(1); }} className={statusFilter === "FAILED" ? "rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Failed</button>
            <button type="button" onClick={() => { setStatusFilter("RUNNING"); setPage(1); }} className={statusFilter === "RUNNING" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Running</button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
            Total <span className="font-semibold text-slate-100">{pageMeta.total}</span> · Page <span className="font-semibold text-slate-100">{page}</span> / <span className="font-semibold text-slate-100">{pageMeta.totalPages}</span>
          </div>

          <div className="mt-4 space-y-3">
            {operations.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-400">
                No operations found for current filters.
              </div>
            ) : (
              operations.map((op) => {
                const active = op.id === selectedOperationId;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => openOperation(op.id)}
                    className={
                      active
                        ? "block w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-left"
                        : "block w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left hover:border-cyan-500/30"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{op.id}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{op.scope}</span>
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{op.requestedDecision || "-"}</span>
                          <span className={statusBadgeClass(op.status)}>{op.status}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>{op.successCount ?? 0} ok</div>
                        <div>{op.failedCount ?? 0} failed</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {op.completedAt || op.requestedAt || "-"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={!pageMeta.hasPrevPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!pageMeta.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Operation Detail</div>
            {selectedOperation ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedOperation.id}</span>
                <span className={statusBadgeClass(selectedOperation.status)}>{selectedOperation.status}</span>
              </div>
            ) : null}
          </div>

          {detailLoading ? (
            <div className="mt-4 text-sm text-slate-400">Loading operation detail...</div>
          ) : selectedOperation ? (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Decision</div>
                  <div className="mt-2 text-lg font-semibold">{selectedOperation.requestedDecision || "-"}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Requested</div>
                  <div className="mt-2 text-lg font-semibold">{selectedOperation.requestedCount ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Succeeded</div>
                  <div className="mt-2 text-lg font-semibold">{selectedOperation.successCount ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed</div>
                  <div className="mt-2 text-lg font-semibold">{selectedOperation.failedCount ?? 0}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildPlatformAuditHref(lang, {
                      from: "operations_detail",
                      selected: selectedOperation.id,
                      operationId: selectedOperation.id,
                      companyId: selectedOperation.companyId || "",
                      candidateId: selectedOperation.candidateId || "",
                      persistenceKey: selectedOperation.persistenceKey || "",
                      page: 1,
                      limit: 20,
                    })}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Open Audit
                </Link>

                {selectedOperation.scope === "RECONCILIATION" ? (
                  <Link
                    href={buildPlatformReconciliationHref(lang, {
                      from: "operations_detail",
                      selected: selectedOperation.id,
                      operationId: selectedOperation.id,
                      companyId: selectedOperation.companyId || "",
                      candidateId: selectedOperation.candidateId || "",
                      persistenceKey: selectedOperation.persistenceKey || "",
                    })}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Open Review Queue
                  </Link>
                  ) : selectedOperation.scope === "PLATFORM_TENANT" ? (
                    <Link
                      href={`/${lang}/platform/tenants${selectedOperation.companyId ? `?selected=${encodeURIComponent(selectedOperation.companyId)}` : ""}`}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/15"
                    >
                      Open Tenant
                    </Link>
                ) : selectedOperation.scope === "PLATFORM_USER" ? (
                  <Link
                    href={buildPlatformUsersHref(lang, {
                        from: "operations_detail",
                        selected: selectedOperation.candidateId || "",
                        operationId: selectedOperation.id,
                        companyId: selectedOperation.companyId || "",
                        candidateId: selectedOperation.candidateId || "",
                        persistenceKey: selectedOperation.persistenceKey || "",
                      })}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Open Users
                  </Link>
                ) : null}

                {selectedOperation.scope === "RECONCILIATION" ? (
                  <Link
                    href={buildPlatformAuditHref(lang, {
                      from: "operations_detail",
                      selected: selectedOperation.id,
                      operationId: selectedOperation.id,
                      companyId: selectedOperation.companyId || "",
                      candidateId: selectedOperation.candidateId || "",
                      persistenceKey: selectedOperation.persistenceKey || "",
                      page: 1,
                      limit: 20,
                    })}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Open Matching Audit Rows
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => retryFailedOperation(selectedOperation.id)}
                  disabled={retryingOperationId === selectedOperation.id || selectedOperation.scope !== "RECONCILIATION"}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40"
                >
                  Retry Failed Items
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Operation Summary</div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Scope</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">{selectedOperation.scope || "-"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Source</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">{selectedOperation.source || "-"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Requested At</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">{selectedOperation.requestedAt || "-"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completed At</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">{selectedOperation.completedAt || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Failure Aggregation</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {failureSummary.length === 0 ? (
                    <div className="text-sm text-slate-400">No failed items in this operation.</div>
                  ) : (
                    failureSummary.map((row) => (
                      <div key={row.code} className="rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-200">
                        {row.code} · {row.count}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Operation Items</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setItemFilter("all")} className={itemFilter === "all" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>All</button>
                    <button type="button" onClick={() => setItemFilter("failed")} className={itemFilter === "failed" ? "rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Failed</button>
                    <button type="button" onClick={() => setItemFilter("succeeded")} className={itemFilter === "succeeded" ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}>Succeeded</button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {filteredItems.length === 0 ? (
                    <div className="text-sm text-slate-400">No items found for the current filter.</div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{item.targetId}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{item.requestedAction || "-"}</span>
                              <span className={itemStatusBadgeClass(item.status)}>{item.status}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.auditId ? `audit=${item.auditId}` : "audit=-"}
                          </div>
                        </div>

                        {(item.failureCode || item.failureMessage) ? (
                          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
                            <div className="font-medium">{item.failureCode || "-"}</div>
                            <div className="mt-1">{item.failureMessage || "-"}</div>
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={buildPlatformAuditHref(lang, {
                                from: "operations_item",
                                selected: item.targetId || selectedOperation.id,
                                operationId: selectedOperation.id,
                                companyId: item.companyId || selectedOperation.companyId || "",
                                candidateId: item.candidateId || selectedOperation.candidateId || "",
                                persistenceKey: item.persistenceKey || selectedOperation.persistenceKey || "",
                                page: 1,
                                limit: 20,
                              })}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            {item.auditId ? "Open This Audit" : "Open Audit"}
                          </Link>
                          {selectedOperation.scope === "RECONCILIATION" ? (
                            <Link
                              href={buildPlatformReconciliationHref(lang, {
                                from: "operations_item",
                                selected: item.targetId || selectedOperation.id,
                                operationId: selectedOperation.id,
                                companyId: item.companyId || selectedOperation.companyId || "",
                                candidateId: item.candidateId || selectedOperation.candidateId || "",
                                persistenceKey: item.persistenceKey || selectedOperation.persistenceKey || "",
                              })}
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                            >
                              Open Review Queue
                            </Link>
                            ) : selectedOperation.scope === "PLATFORM_TENANT" ? (
                              <Link
                                href={`/${lang}/platform/tenants${(item.companyId || selectedOperation.companyId) ? `?selected=${encodeURIComponent(item.companyId || selectedOperation.companyId || "")}` : ""}`}
                                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/15"
                              >
                                Open Tenant
                              </Link>
                          ) : selectedOperation.scope === "PLATFORM_USER" ? (
                            <Link
                              href={buildPlatformUsersHref(lang, {
                                  from: "operations_item",
                                  selected: item.candidateId || selectedOperation.candidateId || "",
                                  operationId: selectedOperation.id,
                                  companyId: item.companyId || selectedOperation.companyId || "",
                                  candidateId: item.candidateId || selectedOperation.candidateId || "",
                                  persistenceKey: item.persistenceKey || selectedOperation.persistenceKey || "",
                                })}
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                            >
                              Open Users
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm text-slate-400">Select an operation to view detail.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function OperationsCenterPage() {
  return (
    <Suspense fallback={<div className="text-slate-300">Loading operations center...</div>}>
      <OperationsCenterContent />
    </Suspense>
  );
}
