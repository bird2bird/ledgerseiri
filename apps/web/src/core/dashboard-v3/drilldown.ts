import type { DashboardV3Alert, DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";

export function getDashboardV3AlertHref(lang: string, alert: DashboardV3Alert): string {
  if (alert.key === "refund-risk") {
    return `/${lang}/app/reports/expense?focus=refund-risk&from=dashboard-v3-alerts`;
  }
  if (alert.key === "ads-efficiency") {
    return `/${lang}/app/ai-insights?focus=ads-efficiency&from=dashboard-v3-alerts`;
  }
  if (alert.key === "payout-gap-pressure") {
    return `/${lang}/app/amazon-reconciliation?focus=payout-gap-pressure&from=dashboard-v3-alerts`;
  }
  if (alert.key === "food-cost-pressure") {
    return `/${lang}/app/reports/expense?focus=food-cost-pressure&from=dashboard-v3-alerts`;
  }
  if (alert.key === "labor-pressure") {
    return `/${lang}/app/reports/profit?focus=labor-pressure&from=dashboard-v3-alerts`;
  }
  if (alert.key === "cost-pressure") {
    return `/${lang}/app/reports/expense?focus=cost-pressure&from=dashboard-v3-alerts`;
  }
  return `/${lang}/app?from=dashboard-v3-alerts`;
}

export function getDashboardV3ExplainHref(lang: string, explain: DashboardV3ExplainSummary): string {
  if (explain.key === "sales-vs-payout") {
    return `/${lang}/app/amazon-reconciliation?focus=sales-vs-payout&from=dashboard-v3-explain`;
  }
  if (explain.key === "coverage-status") {
    return `/${lang}/app/ai-insights?focus=coverage-status&from=dashboard-v3-explain`;
  }
  if (explain.key === "margin-pressure") {
    return `/${lang}/app/reports/profit?focus=margin-pressure&from=dashboard-v3-explain`;
  }
  if (explain.key === "ec-cash-conversion") {
    return `/${lang}/app/reports/income?focus=ec-cash-conversion&from=dashboard-v3-explain`;
  }
  if (explain.key === "restaurant-margin") {
    return `/${lang}/app/reports/profit?focus=restaurant-margin&from=dashboard-v3-explain`;
  }
  return `/${lang}/app?from=dashboard-v3-explain`;
}
