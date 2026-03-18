import type { ReportRange, ReportStoreOption } from "@/core/reports/types";

export function normalizeReportRange(value: string | null | undefined): ReportRange {
  if (
    value === "thisMonth" ||
    value === "lastMonth" ||
    value === "thisYear" ||
    value === "custom"
  ) {
    return value;
  }
  return "thisMonth";
}

export function readReportStoreId(value: string | null | undefined): string {
  const v = String(value ?? "all").trim();
  return v || "all";
}

export function fmtJPY(value: number) {
  return `¥${Math.round(Number(value || 0)).toLocaleString("ja-JP")}`;
}

export function fmtPct(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function buildReportExportHref(args: {
  lang: string;
  reportKey: "cashflow" | "income" | "expense" | "profit";
  range: ReportRange;
  storeId: string;
}) {
  const { lang, reportKey, range, storeId } = args;
  const qs = new URLSearchParams();
  qs.set("module", "reports");
  qs.set("report", reportKey);
  qs.set("range", range);
  qs.set("storeId", storeId);
  return `/${lang}/app/data/export?${qs.toString()}`;
}

export function buildReportStoreOptions(storeId: string): ReportStoreOption[] {
  const base: ReportStoreOption[] = [{ value: "all", label: "全店舗" }];
  if (storeId !== "all") {
    base.push({ value: storeId, label: `Store: ${storeId}` });
  }
  return base;
}

function buildReportQuery(args: { range: ReportRange; storeId: string }) {
  const qs = new URLSearchParams();
  qs.set("range", args.range);
  qs.set("storeId", args.storeId);
  return qs.toString();
}

async function getJson(endpoint: string, args: { range: ReportRange; storeId: string }) {
  const query = buildReportQuery(args);
  const res = await fetch(`${endpoint}?${query}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load report (${res.status})`);
  }

  return res.json();
}

export function fetchCashflowReport(args: { range: ReportRange; storeId: string }) {
  return getJson("/api/reports/cashflow", args);
}

export function fetchIncomeReport(args: { range: ReportRange; storeId: string }) {
  return getJson("/api/reports/income", args);
}

export function fetchExpenseReport(args: { range: ReportRange; storeId: string }) {
  return getJson("/api/reports/expense", args);
}

export function fetchProfitReport(args: { range: ReportRange; storeId: string }) {
  return getJson("/api/reports/profit", args);
}
