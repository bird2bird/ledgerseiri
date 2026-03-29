"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformOperationById,
  fetchPlatformOperationsList,
  fetchPlatformReconciliationOpsSummary,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  retryFailedPlatformOperation,
} from "@/core/platform-auth/client";

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

function buildReconciliationHref(
  lang: string,
  detail?: Partial<OperationDetail> | null
) {
  const sp = new URLSearchParams();
  if (detail?.companyId) sp.set("companyId", detail.companyId);
  if (detail?.candidateId) sp.set("candidateId", detail.candidateId);
  if (detail?.persistenceKey) sp.set("persistenceKey", detail.persistenceKey);
  const qs = sp.toString();
  return `/${lang}/platform/reconciliation${qs ? `?${qs}` : ""}`;
}

function OperationsCenterContent() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

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
  const [selectedOperation, setSelectedOperation] = useState<OperationDetail | null>(null);
  const [itemFilter, setItemFilter] = useState<"all" | "failed" | "succeeded">("all");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retryingOperationId, setRetryingOperationId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [ops, list] = await Promise.all([
      fetchPlatformReconciliationOpsSummary(token),
      fetchPlatformOperationsList(token, {
        scope: "RECONCILIATION",
        limit: 20,
      }),
    ]);

    setOpsSummary(ops);
    setOperations(list);

    const nextId = selectedOperationId || list[0]?.id || null;
    setSelectedOperationId(nextId);

    if (nextId) {
      setDetailLoading(true);
      try {
        const detail = await fetchPlatformOperationById(nextId, token);
        setSelectedOperation(detail as OperationDetail);
      } finally {
        setDetailLoading(false);
      }
    } else {
      setSelectedOperation(null);
    }

    setError("");
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
      const detail = await fetchPlatformOperationById(result.operation.id, token);
      setSelectedOperation(detail as OperationDetail);

      const list = await fetchPlatformOperationsList(token, {
        scope: "RECONCILIATION",
        limit: 20,
      });
      setOperations(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRetryingOperationId(null);
    }
  }

  async function openOperation(id: string) {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    setSelectedOperationId(id);
    setDetailLoading(true);
    try {
      const detail = await fetchPlatformOperationById(id, token);
      setSelectedOperation(detail as OperationDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  }


  const filteredItems = useMemo(() => {
    const items = selectedOperation?.items || [];
    if (itemFilter === "failed") return items.filter((item) => item.status === "FAILED");
    if (itemFilter === "succeeded") return items.filter((item) => item.status === "SUCCEEDED");
    return items;
  }, [selectedOperation, itemFilter]);

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
            Unified operator-facing signals across dashboard, review queue, and audit timeline.
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
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
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
            {operations.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-400">
                No recent operations found.
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
                  href={buildAuditHref(lang, {
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

                <Link
                  href={buildReconciliationHref(lang, selectedOperation)}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Open Review Queue
                </Link>

                <button
                  type="button"
                  onClick={() => retryFailedOperation(selectedOperation.id)}
                  disabled={retryingOperationId === selectedOperation.id}
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
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Operation Items</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setItemFilter("all")}
                      className={itemFilter === "all" ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemFilter("failed")}
                      className={itemFilter === "failed" ? "rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}
                    >
                      Failed
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemFilter("succeeded")}
                      className={itemFilter === "succeeded" ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200" : "rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"}
                    >
                      Succeeded
                    </button>
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
                            href={buildAuditHref(lang, {
                              companyId: item.companyId || "",
                              candidateId: item.candidateId || "",
                              persistenceKey: item.persistenceKey || "",
                              page: 1,
                              limit: 20,
                            })}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            Open Audit
                          </Link>
                          <Link
                            href={buildReconciliationHref(lang, item)}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            Open Review Queue
                          </Link>
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
