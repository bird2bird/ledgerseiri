import type {
  ExportJobItem,
  ImportJobItem,
  MetaSummary,
} from "@/core/jobs";
import type { MatchingBaselineSummary } from "./types";

export type MatchingEngineStatus = "not_ready" | "ready" | "review_required";

export type MatchingEngineSummary = {
  status: MatchingEngineStatus;
  matchedCount: number;
  unmatchedCount: number;
  reviewRequiredCount: number;
  totalCandidates: number;
  latestActivityAt: string | null;
  statusLabel: string;
  summaryText: string;
};

function resolveEngineStatus(args: {
  matching: MatchingBaselineSummary;
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
}): MatchingEngineStatus {
  const importReady = args.matching.importBaseline.status === "ready";
  const exportReady = args.matching.exportBaseline.status === "ready";

  const failedCount =
    Number(args.importSummary?.failed ?? 0) +
    Number(args.exportSummary?.failed ?? 0);

  if (!importReady || !exportReady) {
    return "not_ready";
  }

  if (failedCount > 0) {
    return "review_required";
  }

  return "ready";
}

function makeStatusLabel(status: MatchingEngineStatus): string {
  if (status === "ready") return "Ready";
  if (status === "review_required") return "Review required";
  return "Not ready";
}

function makeSummaryText(args: {
  status: MatchingEngineStatus;
  totalCandidates: number;
  reviewRequiredCount: number;
}): string {
  if (args.status === "ready") {
    return `Matching engine baseline is ready. ${args.totalCandidates} candidates available for next-step reconciliation.`;
  }

  if (args.status === "review_required") {
    return `Matching baseline exists, but ${args.reviewRequiredCount} job failures should be reviewed before reconciliation confidence improves.`;
  }

  return "Settlement / order / fee reconciliation baseline is not ready yet.";
}

export function deriveMatchingEngineSummary(args: {
  matching: MatchingBaselineSummary;
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
}): MatchingEngineSummary {
  const totalCandidates = args.importItems.length + args.exportItems.length;
  const reviewRequiredCount = args.matching.totalFailedJobs;
  const status = resolveEngineStatus(args);

  const matchedCount = 0;
  const unmatchedCount = totalCandidates;

  return {
    status,
    matchedCount,
    unmatchedCount,
    reviewRequiredCount,
    totalCandidates,
    latestActivityAt: args.matching.latestActivityAt,
    statusLabel: makeStatusLabel(status),
    summaryText: makeSummaryText({
      status,
      totalCandidates,
      reviewRequiredCount,
    }),
  };
}
