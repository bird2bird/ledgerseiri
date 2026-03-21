import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";
import type { MatchingEngineSummary, MatchingExecutionPreview } from "./matching-engine";

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

export type MatchingEngineAction = {
  label: string;
  href: string;
};

export type MatchingSummaryCardModel = {
  title: string;
  lead: string;
  coverageLabel: string;
  coverageValue: string;
  failedJobsLabel: string;
  failedJobsValue: number;
  latestActivityLabel: string;
  latestActivityValue: string;
  nextActionHref: string;
  nextActionLabel: string;
};

export type AmazonReconciliationSnapshot = {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
  matching: MatchingBaselineSummary;
  matchingCard: MatchingSummaryCardModel;
  engineSummary: MatchingEngineSummary;
  executionPreview: MatchingExecutionPreview;
};
