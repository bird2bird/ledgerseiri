import type { ExportJobItem, ImportJobItem } from "@/core/jobs";

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function text(value?: string | null, fallback = "-") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

export function statusTone(status?: string | null) {
  switch (String(status ?? "").toUpperCase()) {
    case "SUCCEEDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PROCESSING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

type JobLike = ImportJobItem | ExportJobItem;

export function selectRecentJobs<T extends JobLike>(items: T[], limit = 8): T[] {
  return [...items]
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, limit);
}
