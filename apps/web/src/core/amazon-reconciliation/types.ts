import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";

export type MatchingBaselineStatus = "ready" | "attention" | "planned";

export type MatchingBaselineBlock = {
  title: string;
  status: MatchingBaselineStatus;
  headline: string;
  detail: string;
};

export type MatchingRecommendedAction = {
  href: string;
  label: string;
};

export type MatchingBaselineSummary = {
  importBaseline: MatchingBaselineBlock;
  exportBaseline: MatchingBaselineBlock;
  matchingEngine: MatchingBaselineBlock;
  totalFailedJobs: number;
  latestActivityAt: string | null;
  recommendedAction: MatchingRecommendedAction;
};

export type AmazonReconciliationSnapshot = {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
  matching: MatchingBaselineSummary;
};
