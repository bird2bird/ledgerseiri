import type { ReportRange } from "@/core/reports/types";

export type DetailReportKind = "cashflow" | "income" | "expense" | "profit";

export function normalizeDetailReportKind(
  value: string | null | undefined
): DetailReportKind {
  switch (value) {
    case "income":
    case "expense":
    case "profit":
    case "cashflow":
      return value;
    default:
      return "cashflow";
  }
}

export function normalizeDetailMetric(value: string | null | undefined): string {
  return String(value ?? "").trim() || "summary";
}

export function buildDetailReportHref(args: {
  lang: string;
  kind: DetailReportKind;
  metric?: string | null;
  range?: string | null;
  storeId?: string | null;
}) {
  const { lang, kind, metric, range, storeId } = args;
  const qs = new URLSearchParams();
  qs.set("kind", kind);
  if (metric) qs.set("metric", metric);
  if (range) qs.set("range", range);
  if (storeId) qs.set("storeId", storeId);
  return `/${lang}/app/reports/detail?${qs.toString()}`;
}


export function normalizeReportDetailKind(
  value: string | null | undefined
): DetailReportKind {
  return normalizeDetailReportKind(value);
}


export function normalizeReportDetailMetric(
  value: string | null | undefined
): string {
  return normalizeDetailMetric(value);
}


export function normalizeReportRangeParam(
  value: string | null | undefined
): ReportRange {
  switch (value) {
    case "lastMonth":
    case "thisYear":
    case "custom":
    case "thisMonth":
      return value;
    default:
      return "thisMonth";
  }
}


export function readReportDetailQuery(
  searchParams:
    | URLSearchParams
    | { get(name: string): string | null }
) {
  return {
    kind: searchParams.get("kind"),
    metric: searchParams.get("metric"),
    range: searchParams.get("range"),
    storeId: searchParams.get("storeId"),
  };
}


export function setDetailQueryParam(
  qs: URLSearchParams,
  key: "kind" | "metric" | "range" | "storeId",
  value: string | null | undefined
) {
  const next = String(value ?? "").trim();
  if (next) {
    qs.set(key, next);
  } else {
    qs.delete(key);
  }
}
