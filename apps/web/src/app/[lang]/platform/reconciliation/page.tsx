"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  batchOverridePlatformReconciliationViaOperation,
  fetchPlatformOperationById,
  fetchPlatformReconciliationList,
  fetchPlatformReconciliationOpsSummary,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  overridePlatformReconciliationDecision,
  retryFailedPlatformOperation,
  type PlatformAuditRow,
} from "@/core/platform-auth/client";

type Row = PlatformAuditRow;

type BatchResult = {
  attempted: number;
  success: number;
  failed: number;
  failedIds: string[];
  operationId?: string | null;
  operationStatus?: string | null;
};

type ViewMode = "all" | "selected" | "changed" | "failed" | "actionable";

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

function PlatformReconciliationPageContent() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "ja";

  const [rows, setRows] = useState<Row[]>([]);
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
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [lastOperationId, setLastOperationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const [lastBatchDecision, setLastBatchDecision] = useState<"APPROVED" | "REJECTED" | null>(null);

  const companyId = searchParams.get("companyId") || "";
  const candidateId = searchParams.get("candidateId") || "";
  const persistenceKey = searchParams.get("persistenceKey") || "";

  useEffect(() => {
    const token = getPlatformAccessToken();

    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    fetchPlatformReconciliationList(token, {
      page: 1,
      limit: 50,
      companyId,
      candidateId,
      persistenceKey,
    })
      .then((data) => {
        setRows(data.items || []);
        setSelectedIds([]);
      })
      .catch((e) => {
        if (isPlatformUnauthorizedError(e)) {
          router.replace(`/${lang}/platform-auth/login`);
          return;
        }
        setError(String(e));
      })
      .finally(() => setLoading(false));
  }, [lang, router, companyId, candidateId, persistenceKey]);

  const titleSuffix = useMemo(() => {
    const parts = [
      companyId ? `company=${companyId}` : "",
      candidateId ? `candidate=${candidateId}` : "",
      persistenceKey ? `persistence=${persistenceKey}` : "",
    ].filter(Boolean);
    return parts.length ? ` · ${parts.join(" · ")}` : "";
  }, [companyId, candidateId, persistenceKey]);

  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(rows.map((x) => x.id));
  };

  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));

  const visibleRows = useMemo(() => {
    if (viewMode === "selected") return rows.filter((row) => selectedIds.includes(row.id));
    if (viewMode === "changed") return rows.filter((row) => row.changed);
    if (viewMode === "failed") return rows.filter((row) => batchResult?.failedIds.includes(row.id));
    if (viewMode === "actionable") {
      const failedSet = new Set(batchResult?.failedIds || []);
      return rows.filter((row) => row.changed && !failedSet.has(row.id));
    }
    return rows;
  }, [rows, selectedIds, viewMode, batchResult]);

  const failedRows = useMemo(() => {
    const failedSet = new Set(batchResult?.failedIds || []);
    return rows.filter((row) => failedSet.has(row.id));
  }, [rows, batchResult]);

  const changedRowsCount = useMemo(() => rows.filter((row) => row.changed).length, [rows]);

  const actionableRowsCount = useMemo(() => {
    const failedSet = new Set(batchResult?.failedIds || []);
    return rows.filter((row) => row.changed && !failedSet.has(row.id)).length;
  }, [rows, batchResult]);

  const selectedRowsCount = selectedIds.length;

  const viewDescription = useMemo(() => {
    if (viewMode === "selected") return "Rows currently selected for operator handling.";
    if (viewMode === "changed") return "Rows with meaningful value changes.";
    if (viewMode === "failed") return "Rows that failed during the last batch attempt.";
    if (viewMode === "actionable") return "Changed rows excluding the most recent failed items.";
    return "Full review queue for the current investigation scope.";
  }, [viewMode]);

  const failedAuditHref = buildAuditHref(lang, {
    companyId,
    candidateId,
    persistenceKey,
    source: "admin",
    changed: true,
    page: 1,
    limit: 20,
  });

  const resetResultCenter = () => {
    setBatchResult(null);
    setNotice("");
    setViewMode("all");
  };

  const runBatch = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedRows.length) return;

    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const confirmed = window.confirm(
      `${decision === "APPROVED" ? "Approve" : "Reject"} ${selectedRows.length} selected rows?`
    );
    if (!confirmed) return;

    try {
      setBusyId("batch");
      setNotice("");
      setError("");
      setBatchResult(null);
      setLastBatchDecision(decision);

      const result = await batchOverridePlatformReconciliationViaOperation(
        selectedRows.map((row) => row.id),
        decision,
        token,
        "review_queue",
        "review queue batch override"
      );

      setLastOperationId(result.operation.id);
      setBatchResult({
        attempted: result.summary.attempted,
        success: result.summary.success,
        failed: result.summary.failed,
        failedIds: result.summary.failedIds,
        operationId: result.operation.id,
        operationStatus: result.operation.status,
      });

      if (result.summary.failed === 0) {
        const targetActionType =
          decision === "APPROVED" ? "override_approve" : "override_reject";

        router.push(
          buildAuditHref(lang, {
            companyId,
            candidateId,
            persistenceKey,
            source: "admin",
            actionType: targetActionType,
            page: 1,
            limit: 20,
          })
        );
        return;
      }

      setViewMode("failed");
      setNotice(
        `${decision} batch finished. Success: ${result.summary.success}, Failed: ${result.summary.failed}. Result Center updated and failed slice is now active.`
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };


  const retryFailedOnly = async () => {
    if (!batchResult?.failedIds.length || !lastBatchDecision) return;

    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    try {
      setBusyId("batch");
      setNotice("Retrying failed rows...");
      setError("");

      if (!batchResult?.operationId) {
        throw new Error("PLATFORM_OPERATION_ID_MISSING");
      }

      const result = await retryFailedPlatformOperation(
        batchResult.operationId,
        token,
        "review_queue"
      );

      setLastOperationId(result.operation.id);
      setBatchResult({
        attempted: result.summary.attempted,
        success: result.summary.success,
        failed: result.summary.failed,
        failedIds: result.summary.failedIds,
        operationId: result.operation.id,
        operationStatus: result.operation.status,
      });

      if (result.summary.failed === 0) {
        setNotice("Retry finished. All previously failed rows succeeded.");
      } else {
        setNotice(`Retry finished. Success: ${result.summary.success}, Failed: ${result.summary.failed}.`);
        setViewMode("failed");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="text-slate-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Investigation Workspace</div>
          <h2 className="mt-3 text-2xl font-semibold">Review Queue</h2>
          <div className="mt-2 text-xs text-slate-400">
            Override actions will be written back to audit timeline{titleSuffix}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/${lang}/platform/dashboard`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
            Dashboard
          </Link>
          <Link
            href={buildAuditHref(lang, {
              companyId,
              candidateId,
              persistenceKey,
              page: 1,
              limit: 20,
            })}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Back to Audit
          </Link>
        </div>
      </div>

        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          Current Ops Signal · Total audit rows: <span className="font-semibold text-slate-100">{opsSummary?.totalAuditRows ?? 0}</span> · Failed: <span className="font-semibold text-slate-100">{opsSummary?.failedSignals ?? 0}</span> · Latest audit: <span className="font-semibold text-slate-100">{opsSummary?.latestAuditAt || "-"}</span>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Visible rows
            <div className="mt-1 text-2xl font-semibold text-slate-100">{visibleRows.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Selected
            <div className="mt-1 text-2xl font-semibold text-slate-100">{selectedRowsCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Changed
            <div className="mt-1 text-2xl font-semibold text-slate-100">{changedRowsCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Actionable
            <div className="mt-1 text-2xl font-semibold text-slate-100">{opsSummary?.actionableSignals ?? actionableRowsCount}</div>
          </div>
        </div>

      <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100">
        {viewDescription}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
        <button type="button" onClick={toggleAllVisible} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
          {allVisibleSelected ? "Clear Visible Selection" : "Select All Visible"}
        </button>

        <button type="button" onClick={() => setViewMode("all")} className={viewMode === "all" ? "rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" : "rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"}>
          All
        </button>
        <button type="button" onClick={() => setViewMode("selected")} className={viewMode === "selected" ? "rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" : "rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"}>
          Selected
        </button>
        <button type="button" onClick={() => setViewMode("changed")} className={viewMode === "changed" ? "rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" : "rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"}>
          Changed
        </button>
        <button type="button" onClick={() => setViewMode("failed")} className={viewMode === "failed" ? "rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" : "rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"}>
          Failed
        </button>
        <button type="button" onClick={() => setViewMode("actionable")} className={viewMode === "actionable" ? "rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" : "rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"}>
          Actionable
        </button>

        <button type="button" disabled={!selectedIds.length || busyId === "batch"} onClick={() => runBatch("APPROVED")} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
          Batch APPROVE
        </button>

        <button type="button" disabled={!selectedIds.length || busyId === "batch"} onClick={() => runBatch("REJECTED")} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
          Batch REJECT
        </button>
      </div>

      {notice ? (
        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

        {batchResult ? (
          <div className="mb-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Result Center</div>
                <div className="mt-2 text-xl font-semibold text-slate-100">Last batch operation</div>
                <div className="mt-2 text-slate-300">
                  Attempted: {batchResult.attempted} · Success: {batchResult.success} · Failed: {batchResult.failed}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {lastBatchDecision ? `Decision: ${lastBatchDecision}` : "Decision: -"} · Current view: {viewMode}
                  {batchResult?.operationId ? ` · Operation: ${batchResult.operationId}` : ""}
                  {batchResult?.operationStatus ? ` · Status: ${batchResult.operationStatus}` : ""}
                  {batchResult?.failed > 0 ? " · Retry path is backed by persistent operation history" : ""}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!batchResult.failedIds.length || busyId === "batch"}
                  onClick={retryFailedOnly}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40"
                >
                  Retry Failed Only
                </button>

                <Link
                  href={failedAuditHref}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Open Failed In Audit
                </Link>

                {batchResult?.operationId ? (
                  <Link
                    href={`/${lang}/platform/operations`}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Open Operations Center
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={resetResultCenter}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Back To Full Queue
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed Rows</div>
                <div className="mt-2 text-2xl font-semibold text-slate-100">{failedRows.length}</div>
                <div className="mt-1 text-xs text-slate-400">Retry-ready subset</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Actionable Rows</div>
                <div className="mt-2 text-2xl font-semibold text-slate-100">{actionableRowsCount}</div>
                <div className="mt-1 text-xs text-slate-400">Changed rows excluding failed slice</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Next Step</div>
                <div className="mt-2 text-sm font-semibold text-slate-100">
                  {batchResult.failed > 0 ? "Retry failed or inspect in audit." : "Return to full queue or audit timeline."}
                </div>
                <div className="mt-1 text-xs text-slate-400">Operator recommendation</div>
              </div>
            </div>

            {batchResult.failedIds.length ? (
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-rose-300">Failed IDs</div>
                <div className="mt-2 break-all text-xs text-rose-200">
                  {batchResult.failedIds.join(", ")}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
                All selected rows completed successfully.
              </div>
            )}
          </div>
        ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="py-3 text-left">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
            </th>
            <th className="py-3 text-left">Action</th>
            <th className="py-3 text-left">Source</th>
            <th className="py-3 text-left">Changed</th>
            <th className="py-3 text-left">Company</th>
            <th className="py-3 text-left">Candidate</th>
            <th className="py-3 text-left">Persistence</th>
            <th className="py-3 text-left">Submitted</th>
            <th className="py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-b border-slate-800">
              <td className="py-3">
                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleRow(row.id)} />
              </td>
              <td className="py-3">{row.actionType}</td>
              <td className="py-3">{row.source}</td>
              <td className="py-3">{row.changed ? "YES" : "NO"}</td>
              <td className="py-3">{row.companyId}</td>
              <td className="py-3">{row.candidateId}</td>
              <td className="py-3">{row.persistenceKey || "-"}</td>
              <td className="py-3">{row.createdAt}</td>

              <td className="py-3">
                <button
                  className="mr-2 rounded bg-green-600 px-2 py-1 text-xs disabled:opacity-40"
                  disabled={busyId === row.id || busyId === "batch"}
                  onClick={async () => {
                    try {
                      setBusyId(row.id);
                      setNotice("");
                      setBatchResult(null);
                      await overridePlatformReconciliationDecision(row.id, "APPROVED", getPlatformAccessToken()!);
                      setNotice("Override approve success. Redirecting to audit timeline...");
                      router.push(
                        buildAuditHref(lang, {
                          companyId: row.companyId,
                          candidateId: row.candidateId,
                          persistenceKey: row.persistenceKey || "",
                          source: "admin",
                          actionType: "override_approve",
                          page: 1,
                          limit: 20,
                        })
                      );
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  APPROVE
                </button>

                <button
                  className="rounded bg-red-600 px-2 py-1 text-xs disabled:opacity-40"
                  disabled={busyId === row.id || busyId === "batch"}
                  onClick={async () => {
                    try {
                      setBusyId(row.id);
                      setNotice("");
                      setBatchResult(null);
                      await overridePlatformReconciliationDecision(row.id, "REJECTED", getPlatformAccessToken()!);
                      setNotice("Override reject success. Redirecting to audit timeline...");
                      router.push(
                        buildAuditHref(lang, {
                          companyId: row.companyId,
                          candidateId: row.candidateId,
                          persistenceKey: row.persistenceKey || "",
                          source: "admin",
                          actionType: "override_reject",
                          page: 1,
                          limit: 20,
                        })
                      );
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  REJECT
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlatformReconciliationPage() {
  return (
    <Suspense fallback={<div className="text-slate-300">Loading reconciliation...</div>}>
      <PlatformReconciliationPageContent />
    </Suspense>
  );
}
