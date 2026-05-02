import type { ImportJobHistoryItem } from "@/core/imports/api";

// Step109-Z1-H10-1-IMPORT-HISTORY-UI-HELPERS:
// Pure UI helpers shared by income and expense ImportJob history panels.
// Keep panel-specific module labels, event listeners, and pending-preview semantics in each panel.

export function formatImportHistoryDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function shortImportJobId(id?: string | null) {
  const raw = String(id || "").trim();
  if (raw.length <= 14) return raw || "-";
  return `${raw.slice(0, 8)}…${raw.slice(-6)}`;
}

export function formatImportHistoryRows(item: ImportJobHistoryItem) {
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (failed > 0) return `${success}/${total} 件・エラー ${failed}`;
  if (total > 0 && success === 0) return `0/${total} 件・登録なし`;
  return `${success}/${total} 件`;
}

export function getBaseImportHistoryStatusLabel(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) return "失敗";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "登録0件";
  if (status === "SUCCEEDED") return "成功";
  if (status === "PROCESSING") return "処理中";
  if (status === "PENDING") return "待機中";
  if (status === "CANCELLED") return "取消";
  return item.status || "-";
}

export function getBaseImportHistoryStatusClass(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "SUCCEEDED" && total > 0 && success === 0) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "SUCCEEDED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PROCESSING" || status === "PENDING") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function getBaseImportHistoryRowClass(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) {
    return "bg-rose-50/35";
  }

  if (status === "SUCCEEDED" && success === 0) {
    return "bg-amber-50/35";
  }

  return "bg-white";
}
