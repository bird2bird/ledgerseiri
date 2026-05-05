"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { ImportJobItem } from "@/core/jobs";
import { fmtDate } from "./jobs-shared";
import {
  formatRows,
  getImportedAtToneClass,
  getImportCenterJobHint,
  getImportCenterJobTone,
  getImportCenterRowClass,
  getImportCenterStatusClass,
  getImportCenterStatusLabel,
  getStatusFilterValue,
  isImportCenterPendingPreview,
  numberValue,
  summarizeJobs,
} from "./import-center-status";
import {
  buildImportJobSourceHref,
  buildTransactionTraceHref,
  getDomainLabel,
  getImportCenterModuleLabel,
  getImportJobSourceActionHint,
  getImportJobSourceActionLabel,
} from "./import-center-routing";
import {
  EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE,
  fetchImportJobDetailRows,
  type ImportJobDetailFetchState,
} from "./import-center-detail-data";
import {
  getImportedAtLabel,
  getImportCenterSourceTypeLabel,
  shortId,
  uniqueDomains,
} from "./import-center-display";
import {
  CopyFriendlyId,
  DetailDataStateCard,
  DetailField,
  FutureApiContractCard,
  JsonPayloadDetails,
} from "./import-center-drawer-primitives";
import {
  getSelectedImportJobRowClass,
  readImportCenterUrlSelectionInfo,
  syncImportJobIdToUrl,
} from "./import-center-selection";
import { getDrawerActionToneClass } from "./import-center-drawer-tone";






// Step109-Z1-H11-B-IMPORT-CENTER-LIST-STATUS:
// Productize Import Center list/status without changing backend contracts.
// Keep pending-preview semantics aligned with income/expense history:
// PROCESSING + successRows > 0 + failedRows === 0 => 未正式登録.
//
// Step109-Z1-H11-D-IMPORT-CENTER-MODULE-SOURCE-IMPORTED-AT:
// Display ImportJob module/sourceType/importedAt fields returned by H11-C.
//
// Step109-Z1-H11-E-IMPORT-JOB-DETAIL-DRAWER-SKELETON:
// Add frontend-only ImportJob detail drawer using existing list fields.
//
// Step109-Z1-H11-F-IMPORT-JOB-DRAWER-SOURCE-NAVIGATION:
// Polish drawer actions and add source page navigation without backend changes.
//
// Step109-Z1-H11-G-IMPORT-JOB-URL-HIGHLIGHT:
// Read importJobId from URL, auto-open drawer, highlight selected row, and sync URL.
//
// Step109-Z1-H11-G-FIX1-STOP-URL-DRAWER-FLICKER:
// Apply URL importJobId only once per id and avoid redundant replaceState calls.
//
// Step109-Z1-H11-G-FIX2-DRAWER-OVERLAY-NO-BLUR:
// Remove backdrop blur and button overlay to avoid mouse-triggered compositor flicker.
//
// Step109-Z1-H11-G-FIX3-DISABLE-URL-AUTO-DRAWER:
// URL importJobId highlights the row only; users open drawer manually.
//
// Step109-Z1-H11-H-STAGING-ROWS-API-PREPARATION:
// Add frontend-only placeholders and API contract notes for staging rows / transaction trace.
//
// Step109-Z1-H11-K-FETCH-STAGING-TRANSACTIONS:
// Fetch staging rows and transaction trace from H11-J backend detail APIs.
//
// Step109-Z1-H11-K-FIX1-DRAWER-PORTAL:
// Render drawer through document.body to avoid grid/card hover layout flicker.
//
// Step109-Z1-H11-L-DRAWER-DATA-UI-POLISH:
// Polish staging rows / transaction trace display and add trace navigation placeholders.
//
// Step109-Z1-H11-M-B-TRACE-NAVIGATION-ROUTE-ALIGNMENT:
// Route transaction trace links to real business pages instead of missing /transactions.
//
// Step109-Z1-H11-M-F-REV1-A-AMAZON-TRACE-ROUTING:
// Split Amazon import transaction trace links into Store Orders vs Store Operation views.
//
// Step109-Z1-H11-M-G-FIX3-COMPANY-OPERATION-CATEGORY-OTHER:
// Route company-operation-expense to /expenses?category=other because expenses/page.tsx maps category=other to company-operation workspace.
//
// Step109-Z1-H12-B-IMPORT-JOB-DETAIL-UX-POLISH:
// Final polish for ImportJob detail drawer density/header without changing routing/API behavior.
//
// Step109-Z1-H12-C-IMPORT-CENTER-LIST-STATUS-UX-POLISH:
// Polish Import Center list selected-row visibility and status hints without changing routing/drawer behavior.
//
// Step109-Z1-H13-B-IMPORT-CENTER-EDGE-HARDENING:
// Add selected-hidden notice, drawer bottom padding, and stronger hidden-row count messaging.
//
// Step109-Z1-H13-B-FIX1-EMPTY-FILTER-CLEAR-ACTION:
// Add clear filters action to empty filtered list state after selection is cleared.



function ImportJobDetailDrawer(props: {
  job: ImportJobItem | null;
  onClose: () => void;
  detailRowsState: ImportJobDetailFetchState;
}) {
  const { job, onClose, detailRowsState } = props;

  if (!job) return null;
  if (typeof document === "undefined") return null;

  const rows = formatRows(job);
  const statusLabel = getImportCenterStatusLabel(job);
  const statusClass = getImportCenterStatusClass(job);
  const sourceHref = buildImportJobSourceHref(job);
  const sourceActionLabel = getImportJobSourceActionLabel(job);
  const sourceActionHint = getImportJobSourceActionHint(job);
  const drawerActionToneClass = getDrawerActionToneClass(job);
  const drawerTone = getImportCenterJobTone(job);

  return createPortal(
    <div className="fixed inset-y-0 left-[260px] right-0 z-[1000] pointer-events-none">
      <div
        role="button"
        tabIndex={-1}
        aria-label="ImportJob detail drawer を閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/25 pointer-events-auto"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-slate-200 bg-white shadow-2xl pointer-events-auto">
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                ImportJob Detail
              </div>
              <h3 className="mt-2 truncate text-xl font-black text-slate-950">
                {job.filename || "-"}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {getDomainLabel(job.domain, job.module)}
                </span>
                {job.sourceType ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                    {getImportCenterSourceTypeLabel(job.sourceType)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Imported
                  </div>
                  <div className={`mt-1 truncate text-xs font-black ${getImportedAtToneClass(job)}`}>
                    {getImportedAtLabel(job)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Rows
                  </div>
                  <div className="mt-1 text-xs font-black text-slate-900">
                    {rows.label}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Success
                  </div>
                  <div className="mt-1 text-xs font-black text-emerald-700">
                    {rows.success.toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Failed
                  </div>
                  <div className="mt-1 text-xs font-black text-rose-700">
                    {rows.failed.toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              ×
            </button>
          </div>

          <div className={`mt-4 rounded-2xl border px-4 py-3 ${drawerActionToneClass}`}>
            <div className="text-sm font-black">
              {getImportCenterJobHint(job)}
            </div>
            <div className="mt-1 text-xs font-semibold leading-5 opacity-90">
              {sourceActionHint}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={sourceHref}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                {sourceActionLabel}
              </a>
              <a
                href={`/ja/app/data/import?importJobId=${encodeURIComponent(job.id)}`}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Import Center で表示
              </a>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="ImportJob ID" value={job.id} mono />
            <DetailField label="Company ID" value={job.companyId} mono />
            <DetailField label="Domain" value={job.domain} />
            <DetailField label="Module" value={getImportCenterModuleLabel(job.module)} />
            <DetailField label="Source Type" value={getImportCenterSourceTypeLabel(job.sourceType)} />
            <DetailField label="Status" value={job.status} />
            <DetailField label="Total Rows" value={rows.label} />
            <DetailField label="Rows Breakdown" value={rows.detail} />
            <DetailField label="Deleted Rows" value={Number(job.deletedRowCount || 0).toLocaleString("ja-JP")} />
            <DetailField label="Month Conflict Policy" value={job.monthConflictPolicy || "-"} />
            <DetailField label="Imported At" value={getImportedAtLabel(job)} />
            <DetailField label="Updated At" value={fmtDate(job.updatedAt)} />
            <DetailField label="Created At" value={fmtDate(job.createdAt)} />
            <DetailField label="File Hash" value={job.fileHash || "-"} mono />
          </div>

          <div className="mt-5 space-y-4">
            <div
              className={`rounded-2xl border p-4 ${
                drawerTone === "danger"
                  ? "border-rose-200 bg-rose-50"
                  : drawerTone === "pendingPreview"
                    ? "border-sky-200 bg-sky-50"
                    : drawerTone === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`text-sm font-black ${
                  drawerTone === "danger"
                    ? "text-rose-900"
                    : drawerTone === "pendingPreview"
                      ? "text-sky-900"
                      : drawerTone === "warning"
                        ? "text-amber-900"
                        : "text-slate-900"
                }`}
              >
                Operation Guidance
              </div>
              <div
                className={`mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 ${
                  drawerTone === "danger"
                    ? "text-rose-700"
                    : drawerTone === "pendingPreview"
                      ? "text-sky-700"
                      : drawerTone === "warning"
                        ? "text-amber-700"
                        : "text-slate-600"
                }`}
              >
                {drawerTone === "danger"
                  ? job.errorMessage || "取込エラーがあります。CSV形式・日付・金額・必須項目を元ページで確認してください。"
                  : drawerTone === "pendingPreview"
                    ? "検証済みですが、正式登録は未完了です。元ページで再検証し、正式登録まで進めてください。"
                    : drawerTone === "warning"
                      ? "登録対象が0件です。重複・スキップ条件・対象月を確認してください。"
                      : job.errorMessage || "登録済みデータと trace 明細を確認できます。"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <JsonPayloadDetails
                title="File Months"
                value={job.fileMonthsJson}
              />
              <JsonPayloadDetails
                title="Conflict Months"
                value={job.conflictMonthsJson}
                tone="light"
              />
            </div>

            <DetailDataStateCard
              title={`Staging Rows (${detailRowsState.stagingRows.length})`}
              loading={detailRowsState.loading}
              error={detailRowsState.error}
              empty={detailRowsState.stagingRows.length === 0}
            >
              <div className="space-y-3">
                {detailRowsState.stagingRows.slice(0, 12).map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900">
                          Row #{row.rowNo ?? "-"}
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-500">
                          {row.module || "-"} / {row.businessMonth || "-"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {row.businessMonth || "-"}
                        </span>
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700">
                          {row.matchStatus || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CopyFriendlyId label="Target Entity" value={row.targetEntityId} />
                      <CopyFriendlyId label="Dedupe Hash" value={row.dedupeHash} />
                    </div>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                      Target: <span className="font-black">{row.targetEntityType || "-"}</span>
                      {row.matchReason ? (
                        <span className="ml-2 text-slate-500">{row.matchReason}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      <JsonPayloadDetails
                        title="normalizedPayloadJson"
                        value={row.normalizedPayloadJson}
                      />
                      <JsonPayloadDetails
                        title="rawPayloadJson"
                        value={row.rawPayloadJson}
                        tone="light"
                      />
                    </div>
                  </div>
                ))}

                {detailRowsState.stagingRows.length > 12 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                    先頭12件のみ表示しています。全 {detailRowsState.stagingRows.length} 件。詳細確認が必要な場合は対象CSVまたは後続のページング対応で確認します。
                  </div>
                ) : null}
              </div>
            </DetailDataStateCard>

            <DetailDataStateCard
              title={`Transaction Trace (${detailRowsState.transactions.length})`}
              loading={detailRowsState.loading}
              error={detailRowsState.error}
              empty={detailRowsState.transactions.length === 0}
            >
              <div className="space-y-3">
                {detailRowsState.transactions.slice(0, 12).map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-black text-slate-950">
                          {Number(tx.amount || 0).toLocaleString("ja-JP")} JPY
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-500">
                          {fmtDate(tx.occurredAt)} / {tx.businessMonth || "-"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {tx.type || "-"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {tx.direction || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CopyFriendlyId label="Transaction ID" value={tx.id} />
                      <CopyFriendlyId label="ImportJob ID" value={tx.importJobId} />
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        Source Row: <span className="font-black">{tx.sourceRowNo ?? "-"}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        Business Month: <span className="font-black">{tx.businessMonth || "-"}</span>
                      </div>
                    </div>

                    {tx.memo ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
                        {tx.memo}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={buildTransactionTraceHref(job, tx)}
                        className="inline-flex h-8 items-center justify-center rounded-xl bg-slate-950 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-800"
                      >
                        関連明細へ移動
                      </a>
                      <span className="inline-flex h-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-[11px] font-black text-sky-700">
                        遷移先を自動判定
                      </span>
                    </div>
                  </div>
                ))}

                {detailRowsState.transactions.length > 12 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                    先頭12件のみ表示しています。全 {detailRowsState.transactions.length} 件。関連明細への遷移は表示中の trace から実行できます。
                  </div>
                ) : null}
              </div>
            </DetailDataStateCard>

            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-black text-slate-900">Detail API</div>
              <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                H11-N で Import Center trace navigation の最終回帰は完了済みです。
                Staging Rows と Transaction Trace から、登録結果と関連明細への遷移を確認できます。
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
          >
            閉じる
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}

export function ImportJobsTableCard(props: {
  jobs: ImportJobItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedJob, setSelectedJob] = React.useState<ImportJobItem | null>(null);
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [detailRowsState, setDetailRowsState] = React.useState<ImportJobDetailFetchState>(
    EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE
  );
  const appliedUrlImportJobIdRef = React.useRef<string | null>(null);

  const domains = React.useMemo(() => uniqueDomains(props.jobs), [props.jobs]);

  const openImportJobDetail = React.useCallback((job: ImportJobItem) => {
    appliedUrlImportJobIdRef.current = job.id;
    setSelectedJob((current) => (current?.id === job.id ? current : job));
    setSelectedJobId((current) => (current === job.id ? current : job.id));
    syncImportJobIdToUrl(job.id);
  }, []);

  const closeImportJobDetail = React.useCallback(() => {
    appliedUrlImportJobIdRef.current = null;
    setSelectedJob(null);
    setSelectedJobId(null);
    setDetailRowsState(EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE);
    syncImportJobIdToUrl(null);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!selectedJob?.id) {
      setDetailRowsState(EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE);
      return;
    }

    setDetailRowsState({
      loading: true,
      error: null,
      stagingRows: [],
      transactions: [],
    });

    fetchImportJobDetailRows(selectedJob.id)
      .then((data) => {
        if (cancelled) return;
        setDetailRowsState({
          loading: false,
          error: null,
          stagingRows: data.stagingRows,
          transactions: data.transactions,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setDetailRowsState({
          loading: false,
          error: error instanceof Error ? error.message : "detail rows request failed",
          stagingRows: [],
          transactions: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJob?.id]);

  React.useEffect(() => {
    const selectionInfo = readImportCenterUrlSelectionInfo();
    const importJobId = selectionInfo.importJobId;

    if (!importJobId) {
      return;
    }

    setSelectedJobId((current) => (current === importJobId ? current : importJobId));

    if (!selectionInfo.shouldAutoOpenDrawer) {
      // FIX3 baseline: ordinary URL selection should only highlight the row.
      // Auto-opening is limited to explicit expense trace navigation.
      setSelectedJob(null);
      return;
    }

    const targetJob = props.jobs.find((job) => job.id === importJobId) || null;
    if (!targetJob) {
      setSelectedJob(null);
      return;
    }

    if (appliedUrlImportJobIdRef.current === importJobId && selectedJob?.id === importJobId) {
      return;
    }

    appliedUrlImportJobIdRef.current = importJobId;
    setSelectedJob(targetJob);
  }, [props.jobs, selectedJob?.id]);

  const filteredJobs = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return props.jobs.filter((job) => {
      const domain = String(job.domain || "").trim();
      const status = getStatusFilterValue(job);

      if (domainFilter !== "ALL" && domain !== domainFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!q) return true;

      const haystack = [
        job.id,
        job.filename,
        job.domain,
        job.module,
        job.sourceType,
        job.status,
        job.importedAt,
        job.errorMessage,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [domainFilter, props.jobs, query, statusFilter]);

  const summary = React.useMemo(() => summarizeJobs(filteredJobs), [filteredJobs]);

  const selectedJobExists = React.useMemo(
    () => Boolean(selectedJobId && props.jobs.some((job) => job.id === selectedJobId)),
    [props.jobs, selectedJobId]
  );

  const selectedJobVisibleInFilteredJobs = React.useMemo(
    () => Boolean(selectedJobId && filteredJobs.some((job) => job.id === selectedJobId)),
    [filteredJobs, selectedJobId]
  );

  const selectedJobHiddenByFilter = Boolean(
    selectedJobId && selectedJobExists && !selectedJobVisibleInFilteredJobs
  );

  const hasActiveImportJobListFilters = Boolean(
    query.trim() || domainFilter !== "ALL" || statusFilter !== "ALL"
  );

  function clearImportJobListFilters() {
    setQuery("");
    setDomainFilter("ALL");
    setStatusFilter("ALL");
  }

  function clearImportJobSelectionOnly() {
    setSelectedJob(null);
    setSelectedJobId(null);
    syncImportJobIdToUrl(null);
  }


  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Import Job List</div>
          <div className="mt-1 text-[12px] text-slate-500">
            ImportJob の状態・件数・未正式登録を確認できます
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            表示 {filteredJobs.length.toLocaleString("ja-JP")} / 全 {props.jobs.length.toLocaleString("ja-JP")}
          </span>
          {summary.pendingPreview > 0 ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              未正式登録 {summary.pendingPreview.toLocaleString("ja-JP")}
            </span>
          ) : null}
          {summary.danger > 0 ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              失敗 {summary.danger.toLocaleString("ja-JP")}
            </span>
          ) : null}
          {selectedJobId ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              選択中 {selectedJobId.slice(0, 8)}... / 詳細ボタンで開く
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="block">
          <span className="sr-only">ImportJob search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ファイル名・ドメイン・エラー内容で検索"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </label>

        <label className="block">
          <span className="sr-only">Domain filter</span>
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">すべてのドメイン</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {getDomainLabel(domain)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Status filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">すべての状態</option>
            <option value="SUCCEEDED">成功</option>
            <option value="ZERO_REGISTERED">登録0件</option>
            <option value="FAILED">失敗</option>
            <option value="PENDING_PREVIEW">未正式登録</option>
            <option value="PROCESSING">処理中</option>
            <option value="PENDING">待機中</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-[11px] font-bold text-emerald-700">成功</div>
          <div className="mt-1 text-lg font-black text-emerald-900">{summary.success}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-[11px] font-bold text-amber-700">登録0件</div>
          <div className="mt-1 text-lg font-black text-amber-900">{summary.warning}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-[11px] font-bold text-rose-700">失敗</div>
          <div className="mt-1 text-lg font-black text-rose-900">{summary.danger}</div>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
          <div className="text-[11px] font-bold text-sky-700">未正式登録</div>
          <div className="mt-1 text-lg font-black text-sky-900">{summary.pendingPreview}</div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
          <div className="text-[11px] font-bold text-violet-700">処理中</div>
          <div className="mt-1 text-lg font-black text-violet-900">{summary.processing}</div>
        </div>
      </div>

      {selectedJobId && !selectedJobExists ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          <div>URL で指定された ImportJob ID は現在の一覧に見つかりません。</div>
          <div className="mt-1 text-xs font-semibold text-amber-700">
            履歴更新、対象データ、または別環境の ImportJob ID ではないか確認してください。
          </div>
          <button
            type="button"
            onClick={clearImportJobSelectionOnly}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-xl border border-amber-200 bg-white px-3 text-[11px] font-black text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            選択解除
          </button>
        </div>
      ) : null}

      {selectedJobHiddenByFilter ? (
        <div className="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 p-4 text-sm font-bold leading-6 text-sky-800">
          <div>
            選択中の ImportJob は現在の検索条件・フィルターでは非表示です。
          </div>
          <div className="mt-1 text-xs font-semibold text-sky-700">
            選択中 {selectedJobId?.slice(0, 8)}... を表示するには、検索条件またはフィルターを解除してください。
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearImportJobListFilters}
              className="inline-flex h-8 items-center justify-center rounded-xl bg-sky-700 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-sky-800"
            >
              フィルター解除
            </button>
            <button
              type="button"
              onClick={clearImportJobSelectionOnly}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-sky-200 bg-white px-3 text-[11px] font-black text-sky-800 shadow-sm transition hover:bg-sky-50"
            >
              選択解除
            </button>
          </div>
        </div>
      ) : null}

      {props.jobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="text-sm font-bold text-slate-700">ImportJob はまだありません。</div>
          <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            収入・支出・Amazon 注文などの CSV/Excel 取込を実行すると、ここに履歴が表示されます。
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700">
          <div>条件に一致する ImportJob はありません。検索条件またはフィルターを変更してください。</div>
          {selectedJobId ? (
            <div className="mt-2 text-xs font-semibold text-amber-700">
              選択中の ImportJob がある場合は、上の「フィルター解除」または「選択解除」を使用してください。
            </div>
          ) : null}
          {hasActiveImportJobListFilters ? (
            <button
              type="button"
              onClick={clearImportJobListFilters}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-xl bg-amber-700 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-amber-800"
            >
              検索条件をクリア
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_150px_170px_160px] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 lg:grid">
            <div>ファイル / 種別</div>
            <div>状態</div>
            <div>件数</div>
            <div>登録 / 更新</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredJobs.map((job) => {
              const rows = formatRows(job);

              return (
                <div
                  key={job.id}
                  className={`grid gap-3 px-4 py-4 text-sm transition lg:grid-cols-[minmax(0,1.35fr)_150px_170px_160px] lg:gap-4 ${getImportCenterRowClass(job)} ${getSelectedImportJobRowClass(job, selectedJobId)}`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {job.filename || "-"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {getDomainLabel(job.domain, job.module)}
                      </span>
                      {job.module ? (
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          {getImportCenterModuleLabel(job.module)}
                        </span>
                      ) : null}
                      {job.sourceType ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                          {getImportCenterSourceTypeLabel(job.sourceType)}
                        </span>
                      ) : null}
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {job.id ? `${job.id.slice(0, 8)}...` : "-"}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">
                      {getImportCenterJobHint(job)}
                    </div>
                    {selectedJobId === job.id && !selectedJob ? (
                      <div className="mt-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-black text-sky-700">
                        URLで選択中。詳細ボタンで開けます。
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      状態
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getImportCenterStatusClass(job)}`}>
                      {getImportCenterStatusLabel(job)}
                    </span>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      raw: {job.status || "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => openImportJobDetail(job)}
                      className="mt-2 inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      詳細
                    </button>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      件数
                    </div>
                    <div className="font-bold text-slate-800">{rows.label}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {rows.detail}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      登録 / 更新
                    </div>
                    <div className={`font-bold ${getImportedAtToneClass(job)}`}>
                      登録: {getImportedAtLabel(job)}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">
                      更新: {fmtDate(job.updatedAt)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      作成: {fmtDate(job.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ImportJobDetailDrawer
        job={selectedJob}
        onClose={closeImportJobDetail}
        detailRowsState={detailRowsState}
      />
    </section>
  );
}
