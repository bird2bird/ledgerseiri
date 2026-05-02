"use client";

import React from "react";
import type { ImportJobItem } from "@/core/jobs";
import { fmtDate } from "./jobs-shared";

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

type ImportCenterTone =
  | "success"
  | "warning"
  | "danger"
  | "pendingPreview"
  | "processing"
  | "neutral";

function numberValue(value?: number | null) {
  return Number(value || 0);
}

function isImportCenterPendingPreview(job: ImportJobItem) {
  const status = String(job.status || "").toUpperCase();
  const success = numberValue(job.successRows);
  const failed = numberValue(job.failedRows);

  return status === "PROCESSING" && success > 0 && failed === 0;
}

function getImportCenterJobTone(job: ImportJobItem): ImportCenterTone {
  const status = String(job.status || "").toUpperCase();
  const total = numberValue(job.totalRows);
  const success = numberValue(job.successRows);
  const failed = numberValue(job.failedRows);

  if (status === "FAILED" || failed > 0) return "danger";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "warning";
  if (isImportCenterPendingPreview(job)) return "pendingPreview";
  if (status === "PROCESSING" || status === "PENDING") return "processing";
  if (status === "SUCCEEDED") return "success";
  return "neutral";
}

function getImportCenterStatusLabel(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);
  const status = String(job.status || "").toUpperCase();

  if (tone === "success") return "成功";
  if (tone === "warning") return "登録0件";
  if (tone === "danger") return "失敗";
  if (tone === "pendingPreview") return "未正式登録";
  if (tone === "processing") return status === "PENDING" ? "待機中" : "処理中";
  return status || "-";
}

function getImportCenterStatusClass(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "pendingPreview") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tone === "processing") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getImportCenterRowClass(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "danger") return "bg-rose-50/35 hover:bg-rose-50/60";
  if (tone === "warning") return "bg-amber-50/35 hover:bg-amber-50/60";
  if (tone === "pendingPreview") return "bg-sky-50/35 hover:bg-sky-50/60";
  if (tone === "processing") return "bg-violet-50/25 hover:bg-violet-50/50";
  return "hover:bg-slate-50";
}

function getImportCenterJobHint(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "danger") {
    return job.errorMessage || "取込に失敗、または一部の行でエラーがあります。";
  }

  if (tone === "warning") {
    return "登録対象がありません。重複済み、または全行がスキップされた可能性があります。";
  }

  if (tone === "pendingPreview") {
    return "検証済みですが、importedAt が未設定です。正式登録または再検証が必要です。";
  }

  if (tone === "processing") {
    return "処理中の ImportJob です。長時間残る場合は履歴更新または管理者確認が必要です。";
  }

  if (tone === "success") {
    return "登録済みの ImportJob です。";
  }

  return "ImportJob の状態を確認してください。";
}

function formatRows(job: ImportJobItem) {
  const total = numberValue(job.totalRows);
  const success = numberValue(job.successRows);
  const failed = numberValue(job.failedRows);

  return {
    total,
    success,
    failed,
    label: `${total.toLocaleString("ja-JP")} 件`,
    detail: `成功 ${success.toLocaleString("ja-JP")} / 失敗 ${failed.toLocaleString("ja-JP")}`,
  };
}

function getImportCenterModuleLabel(module?: string | null) {
  const value = String(module || "").trim();

  if (value === "cash-income") return "現金収入";
  if (value === "other-income") return "その他収入";
  if (value === "company-operation-expense") return "会社運営費";
  if (value === "store-operation-expense") return "店舗運営費";
  if (value === "payroll-expense") return "給与";
  if (value === "other-expense") return "その他支出";
  if (value === "store-orders") return "店舗注文";
  if (value === "store-operation") return "店舗運営費";
  return value || "-";
}

function getImportCenterSourceTypeLabel(sourceType?: string | null) {
  const value = String(sourceType || "").trim();

  if (!value) return "-";
  if (value.toLowerCase() === "csv") return "CSV";
  if (value === "expense-csv") return "支出CSV";
  if (value === "amazon-csv") return "Amazon CSV";
  if (value === "manual") return "手動";
  return value;
}

function getDomainLabel(value?: string | null, module?: string | null) {
  const domain = String(value || "").trim();
  const moduleValue = String(module || "").trim();

  if (domain === "income" && moduleValue === "cash-income") return "現金収入";
  if (domain === "income" && moduleValue === "other-income") return "その他収入";
  if (domain === "ledger" && moduleValue === "company-operation-expense") return "会社運営費";
  if (domain === "ledger" && moduleValue === "store-operation-expense") return "店舗運営費";
  if (domain === "ledger" && moduleValue === "payroll-expense") return "給与";
  if (domain === "ledger" && moduleValue === "other-expense") return "その他支出";

  if (!domain) return getImportCenterModuleLabel(moduleValue);
  if (domain === "amazon-store-orders") return "Amazon 店舗注文";
  if (domain === "store-orders") return "店舗注文";
  if (domain === "import-jobs") return "Import Jobs";
  if (domain === "cash-income") return "現金収入";
  if (domain === "other-income") return "その他収入";
  if (domain.includes("expense")) return "支出";
  return domain;
}

function getImportedAtLabel(job: ImportJobItem) {
  return job.importedAt ? fmtDate(job.importedAt) : "未登録";
}

function getImportedAtToneClass(job: ImportJobItem) {
  if (job.importedAt) return "text-emerald-700";
  if (isImportCenterPendingPreview(job)) return "text-sky-700";
  return "text-slate-400";
}

function getStatusFilterValue(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);
  if (tone === "pendingPreview") return "PENDING_PREVIEW";
  if (tone === "warning") return "ZERO_REGISTERED";
  return String(job.status || "").toUpperCase() || "UNKNOWN";
}

function summarizeJobs(jobs: ImportJobItem[]) {
  return jobs.reduce(
    (summary, job) => {
      const tone = getImportCenterJobTone(job);
      if (tone === "success") summary.success += 1;
      if (tone === "warning") summary.warning += 1;
      if (tone === "danger") summary.danger += 1;
      if (tone === "pendingPreview") summary.pendingPreview += 1;
      if (tone === "processing") summary.processing += 1;
      summary.rows += numberValue(job.totalRows);
      return summary;
    },
    {
      success: 0,
      warning: 0,
      danger: 0,
      pendingPreview: 0,
      processing: 0,
      rows: 0,
    }
  );
}

function uniqueDomains(jobs: ImportJobItem[]) {
  return Array.from(
    new Set(
      jobs
        .map((job) => String(job.domain || "").trim())
        .filter(Boolean)
    )
  ).sort();
}

function formatJsonPreview(value: unknown) {
  if (value == null) return "-";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function DetailField(props: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-bold text-slate-500">{props.label}</div>
      <div
        className={`mt-1 break-words text-sm font-bold text-slate-900 ${
          props.mono ? "font-mono text-xs" : ""
        }`}
      >
        {props.value || "-"}
      </div>
    </div>
  );
}

function ImportJobDetailDrawer(props: {
  job: ImportJobItem | null;
  onClose: () => void;
}) {
  const { job, onClose } = props;

  if (!job) return null;

  const rows = formatRows(job);
  const statusLabel = getImportCenterStatusLabel(job);
  const statusClass = getImportCenterStatusClass(job);

  return (
    <div className="fixed inset-y-0 right-0 left-[260px] z-50 pointer-events-none">
      <button
        type="button"
        aria-label="ImportJob detail drawer を閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] pointer-events-auto"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-slate-200 bg-white shadow-2xl pointer-events-auto">
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
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              ×
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
            {getImportCenterJobHint(job)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">Error Message</div>
              <div className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                {job.errorMessage || "エラーは記録されていません。"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-black text-slate-900">File Months</div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-100">
                {formatJsonPreview(job.fileMonthsJson)}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-black text-slate-900">Conflict Months</div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-100">
                {formatJsonPreview(job.conflictMonthsJson)}
              </pre>
            </div>

            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-4">
              <div className="text-sm font-black text-slate-900">Next Step</div>
              <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                H11-E は list API で取得済みの項目だけを表示する skeleton です。
                H11-F 以降で staging rows / transaction trace 用の detail API を追加します。
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
    </div>
  );
}

export function ImportJobsTableCard(props: {
  jobs: ImportJobItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedJob, setSelectedJob] = React.useState<ImportJobItem | null>(null);

  const domains = React.useMemo(() => uniqueDomains(props.jobs), [props.jobs]);

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

      {props.jobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="text-sm font-bold text-slate-700">ImportJob はまだありません。</div>
          <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            収入・支出・Amazon 注文などの CSV/Excel 取込を実行すると、ここに履歴が表示されます。
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700">
          条件に一致する ImportJob はありません。検索条件またはフィルターを変更してください。
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
                  className={`grid gap-3 px-4 py-4 text-sm transition lg:grid-cols-[minmax(0,1.35fr)_150px_170px_160px] lg:gap-4 ${getImportCenterRowClass(job)}`}
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
                      onClick={() => setSelectedJob(job)}
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
        onClose={() => setSelectedJob(null)}
      />
    </section>
  );
}
