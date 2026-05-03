import type { ImportJobItem } from "@/core/jobs";

// Step109-Z1-H15-A-IMPORT-CENTER-STATUS-HELPERS:
// Extract status/tone/row-hint helpers from ImportJobsTableCard.tsx.
// Keep Import Center semantics unchanged:
// PROCESSING + successRows > 0 + failedRows === 0 => 未正式登録.

export type ImportCenterTone =
  | "success"
  | "warning"
  | "danger"
  | "pendingPreview"
  | "processing"
  | "neutral";

export function numberValue(value?: number | null) {
  return Number(value || 0);
}

export function isImportCenterPendingPreview(job: ImportJobItem) {
  const status = String(job.status || "").toUpperCase();
  const success = numberValue(job.successRows);
  const failed = numberValue(job.failedRows);

  return status === "PROCESSING" && success > 0 && failed === 0;
}

export function getImportCenterJobTone(job: ImportJobItem): ImportCenterTone {
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

export function getImportCenterStatusLabel(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);
  const status = String(job.status || "").toUpperCase();

  if (tone === "success") return "成功";
  if (tone === "warning") return "登録0件";
  if (tone === "danger") return "失敗";
  if (tone === "pendingPreview") return "未正式登録";
  if (tone === "processing") return status === "PENDING" ? "待機中" : "処理中";
  return status || "-";
}

export function getImportCenterStatusClass(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "pendingPreview") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tone === "processing") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function getImportCenterRowClass(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "danger") return "bg-rose-50/45 hover:bg-rose-50/70";
  if (tone === "warning") return "bg-amber-50/45 hover:bg-amber-50/70";
  if (tone === "pendingPreview") return "bg-sky-50/45 hover:bg-sky-50/70";
  if (tone === "processing") return "bg-violet-50/40 hover:bg-violet-50/65";
  return "hover:bg-slate-50";
}

export function getImportCenterJobHint(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "danger") {
    return job.errorMessage || "失敗または一部エラーがあります。詳細で error / trace を確認してください。";
  }

  if (tone === "warning") {
    return "登録0件です。重複・対象月・スキップ条件を確認してください。";
  }

  if (tone === "pendingPreview") {
    return "preview 済みですが未正式登録です。元ページで再検証・正式登録してください。";
  }

  if (tone === "processing") {
    return "処理中です。長時間残る場合は履歴更新または管理者確認が必要です。";
  }

  if (tone === "success") {
    return "登録済みです。詳細から staging rows / transaction trace を確認できます。";
  }

  return "ImportJob の状態を確認してください。";
}

export function formatRows(job: ImportJobItem) {
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

export function getImportedAtToneClass(job: ImportJobItem) {
  if (job.importedAt) return "text-emerald-700";
  if (isImportCenterPendingPreview(job)) return "text-sky-700";
  return "text-slate-400";
}

export function getStatusFilterValue(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);
  if (tone === "pendingPreview") return "PENDING_PREVIEW";
  if (tone === "warning") return "ZERO_REGISTERED";
  return String(job.status || "").toUpperCase() || "UNKNOWN";
}

export function summarizeJobs(jobs: ImportJobItem[]) {
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
