import type { BusinessViewType } from "@/core/business-view";

export type DashboardV3Range = "today" | "7d" | "30d" | "month";

export type DashboardV3Kpi = {
  key: string;
  label: string;
  value: number;
  unit: "JPY" | "count" | "percent";
  deltaLabel?: string;
};

export type DashboardV3TrendPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export type DashboardV3TrendSeries = {
  key: string;
  title: string;
  primaryLabel: string;
  secondaryLabel?: string;
  points: DashboardV3TrendPoint[];
};

export type DashboardV3DistributionItem = {
  key: string;
  label: string;
  value: number;
};

export type DashboardV3DistributionBlock = {
  key: string;
  title: string;
  items: DashboardV3DistributionItem[];
};

export type DashboardV3Alert = {
  key: string;
  title: string;
  severity: "low" | "medium" | "high";
  summary: string;
};

export type DashboardV3ExplainSummary = {
  key: string;
  title: string;
  summary: string;
};

export type DashboardV3Cockpit = {
  businessView: BusinessViewType;
  range: DashboardV3Range;
  source: "mock" | "real" | "mock-fallback";
  summaryKpis: DashboardV3Kpi[];
  trendSeries: DashboardV3TrendSeries[];
  distributions: DashboardV3DistributionBlock[];
  alerts: DashboardV3Alert[];
  explainSummaries: DashboardV3ExplainSummary[];
};
