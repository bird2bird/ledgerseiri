import React from "react";

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

export function statusTone(status?: string | null) {
  const s = String(status || "").toUpperCase();
  if (s === "SUCCEEDED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (s === "PROCESSING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function formatLabel(value?: string | null) {
  const v = String(value || "").trim();
  return v ? v.toUpperCase() : "-";
}

export function text(value?: string | null, fallback = "-") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

type JobLikeWithCreatedAt = {
  createdAt?: string | null;
};

export function selectRecentJobs<T extends JobLikeWithCreatedAt>(items: T[], limit = 8): T[] {
  return [...items]
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, limit);
}

export function JobsMetricCard(props: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const tone =
    props.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : props.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={cls("rounded-[22px] border p-4", tone)}>
      <div className="text-[11px] font-medium text-slate-500">{props.label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{props.value}</div>
      {props.helper ? <div className="mt-2 text-xs text-slate-500">{props.helper}</div> : null}
    </div>
  );
}
