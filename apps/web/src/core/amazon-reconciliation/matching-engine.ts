import type {
  ExportJobItem,
  ImportJobItem,
  MetaSummary,
} from "@/core/jobs";
import type { MatchingBaselineSummary, MatchingEngineAction } from "./types";

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
  primaryAction: MatchingEngineAction | null;
  secondaryAction: MatchingEngineAction | null;
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

function deriveEngineActions(args: {
  status: MatchingEngineStatus;
}): {
  primaryAction: MatchingEngineAction | null;
  secondaryAction: MatchingEngineAction | null;
} {
  if (args.status === "not_ready") {
    return {
      primaryAction: {
        label: "データインポートを開く",
        href: "/app/data/import",
      },
      secondaryAction: {
        label: "データエクスポートを開く",
        href: "/app/data/export",
      },
    };
  }

  if (args.status === "review_required") {
    return {
      primaryAction: {
        label: "失敗ジョブを確認",
        href: "/app/amazon-reconciliation",
      },
      secondaryAction: {
        label: "仕訳一覧へ",
        href: "/app/journals",
      },
    };
  }

  return {
    primaryAction: {
      label: "仕訳一覧へ",
      href: "/app/journals",
    },
    secondaryAction: {
      label: "詳細レポートへ",
      href: "/app/reports/detail",
    },
  };
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
  const { primaryAction, secondaryAction } = deriveEngineActions({ status });

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
    primaryAction,
    secondaryAction,
  };
}
