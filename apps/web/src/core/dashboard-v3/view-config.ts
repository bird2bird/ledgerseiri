import type { BusinessViewType } from "@/core/business-view";

export type DashboardV3ViewConfig = {
  primaryFocus: string;
  kpiKeys: string[];
  trendKeys: string[];
  distributionKeys: string[];
  anomalyFocus: string;
  explainFocus: string;
};

const CONFIG: Record<BusinessViewType, DashboardV3ViewConfig> = {
  amazon: {
    primaryFocus: "売上・入金・差額・広告費・返金",
    kpiKeys: ["sales", "payout", "gap", "orders"],
    trendKeys: ["sales-orders", "payout-gap"],
    distributionKeys: ["cost-breakdown", "channel-breakdown"],
    anomalyFocus: "refund-risk / ads-efficiency / payout-gap",
    explainFocus: "sales-vs-payout / coverage-status",
  },
  ec: {
    primaryFocus: "売上・回収・費用・受注",
    kpiKeys: ["sales", "payout", "gap", "orders"],
    trendKeys: ["sales-orders", "payout-gap"],
    distributionKeys: ["cost-breakdown", "channel-breakdown"],
    anomalyFocus: "cash-ops-watch / cost-pressure",
    explainFocus: "ec-cash-conversion",
  },
  restaurant: {
    primaryFocus: "売上・原価・人件費・利益",
    kpiKeys: ["sales", "payout", "gap", "orders"],
    trendKeys: ["sales-orders", "payout-gap"],
    distributionKeys: ["cost-breakdown", "channel-breakdown"],
    anomalyFocus: "food-cost-pressure / labor-pressure",
    explainFocus: "restaurant-margin",
  },
  generic: {
    primaryFocus: "売上・入金・費用・案件進行",
    kpiKeys: ["sales", "payout", "gap", "orders"],
    trendKeys: ["sales-orders", "payout-gap"],
    distributionKeys: ["cost-breakdown", "channel-breakdown"],
    anomalyFocus: "cash-ops-watch",
    explainFocus: "generic-cash-ops",
  },
};

export function getDashboardV3ViewConfig(view: BusinessViewType): DashboardV3ViewConfig {
  return CONFIG[view];
}
