import type {
  AiInsightsSnapshot,
  DashboardSummaryResponse,
  ReportSummaryResponse,
  UsageResponse,
  WorkspaceContextResponse,
} from "./types";
import { fetchWithAutoRefresh } from "@/core/auth/client-auth-fetch";

async function readJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loadAiInsightsSnapshot(): Promise<AiInsightsSnapshot> {
  const [
    ctxRes,
    usageRes,
    dashRes,
    incomeRes,
    expenseRes,
    profitRes,
    cashRes,
  ] = await Promise.all([
    fetchWithAutoRefresh("/workspace/context", { credentials: "include", cache: "no-store" }),
    fetchWithAutoRefresh("/workspace/usage", { credentials: "include", cache: "no-store" }),
    fetch("/dashboard/summary", { credentials: "include", cache: "no-store" }),
    fetchWithAutoRefresh("/api/reports/income", { credentials: "include", cache: "no-store" }),
    fetchWithAutoRefresh("/api/reports/expense", { credentials: "include", cache: "no-store" }),
    fetchWithAutoRefresh("/api/reports/profit", { credentials: "include", cache: "no-store" }),
    fetchWithAutoRefresh("/api/reports/cashflow", { credentials: "include", cache: "no-store" }),
  ]);

  const [
    workspaceCtx,
    usage,
    dashboard,
    incomeReport,
    expenseReport,
    profitReport,
    cashflowReport,
  ] = await Promise.all([
    readJson<WorkspaceContextResponse>(ctxRes, "/workspace/context"),
    readJson<UsageResponse>(usageRes, "/workspace/usage"),
    readJson<DashboardSummaryResponse>(dashRes, "/dashboard/summary"),
    readJson<ReportSummaryResponse>(incomeRes, "/api/reports/income"),
    readJson<ReportSummaryResponse>(expenseRes, "/api/reports/expense"),
    readJson<ReportSummaryResponse>(profitRes, "/api/reports/profit"),
    readJson<ReportSummaryResponse>(cashRes, "/api/reports/cashflow"),
  ]);

  return {
    workspaceCtx: workspaceCtx || null,
    usage: usage || null,
    dashboard: dashboard || null,
    incomeReport: incomeReport || null,
    expenseReport: expenseReport || null,
    profitReport: profitReport || null,
    cashflowReport: cashflowReport || null,
  };
}
