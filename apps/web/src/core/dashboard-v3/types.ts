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

export type DashboardV3ReconciliationSummary = {
  missingInvoices: number;
  missingBankProofs: number;
  pendingReview: number;
  unmatchedPayoutItems: number;
};

export type DashboardV3AccountantChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

export type DashboardV3AccountantReadiness = {
  invoiceReadinessPercent: number;
  explainCoverageCount: number;
  reviewBlockersCount: number;
  checklist: DashboardV3AccountantChecklistItem[];
};

export type DashboardV3DrilldownHint = {
  key: string;
  route: string;
  label: string;
  params?: Record<string, string>;
};

export type DashboardV3DrilldownHints = {
  sales?: DashboardV3DrilldownHint;
  payout?: DashboardV3DrilldownHint;
  profit?: DashboardV3DrilldownHint;
  reconciliation?: DashboardV3DrilldownHint;
  accountant?: DashboardV3DrilldownHint;
};

export type DashboardV3DataCompleteness = {
  score: number;
  missingInvoiceCount: number;
  missingBankProofCount: number;
  unmatchedCount: number;
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
  reconciliationSummary: DashboardV3ReconciliationSummary;
  accountantReadiness: DashboardV3AccountantReadiness;
  drilldownHints: DashboardV3DrilldownHints;
  dataCompleteness: DashboardV3DataCompleteness;
};
