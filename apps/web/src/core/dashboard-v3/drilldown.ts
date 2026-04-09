import type { DashboardV3Alert, DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";

export function getDashboardV3AlertHref(lang: string, alert: DashboardV3Alert): string {
  if (alert.key === "refund-risk") {
    return `/${lang}/app/reports/expense?focus=refund-risk&from=dashboard-v3-alerts`;
  }
  if (alert.key === "ads-efficiency") {
    return `/${lang}/app/ai-insights?focus=ads-efficiency&from=dashboard-v3-alerts`;
  }
  return `/${lang}/app?from=dashboard-v3-alerts`;
}

export function getDashboardV3ExplainHref(lang: string, explain: DashboardV3ExplainSummary): string {
  if (explain.key === "sales-vs-payout") {
    return `/${lang}/app/amazon-reconciliation?focus=sales-vs-payout&from=dashboard-v3-explain`;
  }
  if (explain.key === "margin-pressure") {
    return `/${lang}/app/reports/profit?focus=margin-pressure&from=dashboard-v3-explain`;
  }
  return `/${lang}/app?from=dashboard-v3-explain`;
}
