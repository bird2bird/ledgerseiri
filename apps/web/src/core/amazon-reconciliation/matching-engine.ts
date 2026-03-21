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

export type MatchingExecutionPreviewState = "eligible" | "review" | "blocked";

export type MatchingExecutionPreviewItem = {
  id: string;
  label: string;
  detail: string;
  state: MatchingExecutionPreviewState;
  confidenceLabel: string;
};

export type MatchingCandidateStatus = "auto" | "review" | "blocked";

export type MatchingCandidate = {
  id: string;
  sourceType: "import" | "export";
  sourceId: string;
  sourceLabel: string;
  targetType: "import" | "export" | "none";
  targetId: string | null;
  targetLabel: string;
  confidence: number;
  status: MatchingCandidateStatus;
  reason: string;
};

export type MatchingExecutionPreview = {
  eligibleCount: number;
  reviewQueueCount: number;
  blockedCount: number;
  suggestedMatches: MatchingExecutionPreviewItem[];
  nextStepLabel: string;
  nextStepDetail: string;
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


function resolveExecutionPreviewState(
  status: MatchingEngineStatus,
): MatchingExecutionPreviewState {
  if (status === "ready") return "eligible";
  if (status === "review_required") return "review";
  return "blocked";
}

function makeExecutionNextStep(args: {
  status: MatchingEngineStatus;
  totalCandidates: number;
}): {
  nextStepLabel: string;
  nextStepDetail: string;
} {
  if (args.status === "ready") {
    return {
      nextStepLabel: "Ready to execute",
      nextStepDetail: `${args.totalCandidates} candidates can move into the next reconciliation workflow step.`,
    };
  }

  if (args.status === "review_required") {
    return {
      nextStepLabel: "Review queue first",
      nextStepDetail: "Failures or unresolved candidates should be reviewed before execution confidence improves.",
    };
  }

  return {
    nextStepLabel: "Blocked until baseline is ready",
    nextStepDetail: "Prepare import/export baseline first, then execution preview can unlock candidate processing.",
  };
}

function makePreviewItemLabel(args: {
  id: string;
  title: string;
  detail: string;
  state: MatchingExecutionPreviewState;
}): MatchingExecutionPreviewItem {
  return {
    id: args.id,
    label: args.title,
    detail: args.detail,
    state: args.state,
    confidenceLabel:
      args.state === "eligible"
        ? "Baseline ready"
        : args.state === "review"
        ? "Needs review"
        : "Blocked",
  };
}

export function deriveMatchingExecutionPreview(args: {
  engineSummary: MatchingEngineSummary;
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
}): MatchingExecutionPreview {
  const state = resolveExecutionPreviewState(args.engineSummary.status);

  const suggestedMatches: MatchingExecutionPreviewItem[] = [
    ...args.importItems.slice(0, 2).map((item) =>
      makePreviewItemLabel({
        id: `import-${item.id}`,
        title: item.filename ? `Import: ${item.filename}` : `Import Job ${item.id}`,
        detail: item.domain ? `domain: ${item.domain}` : "import baseline candidate",
        state,
      })
    ),
    ...args.exportItems.slice(0, 1).map((item) =>
      makePreviewItemLabel({
        id: `export-${item.id}`,
        title: item.format ? `Export: ${item.format}` : `Export Job ${item.id}`,
        detail: item.domain ? `domain: ${item.domain}` : "export baseline candidate",
        state,
      })
    ),
  ];

  const totalCandidates = args.engineSummary.totalCandidates;

  const eligibleCount = args.engineSummary.status === "ready" ? totalCandidates : 0;
  const reviewQueueCount =
    args.engineSummary.status === "review_required" ? totalCandidates : 0;
  const blockedCount = args.engineSummary.status === "not_ready" ? totalCandidates : 0;

  const { nextStepLabel, nextStepDetail } = makeExecutionNextStep({
    status: args.engineSummary.status,
    totalCandidates,
  });

  return {
    eligibleCount,
    reviewQueueCount,
    blockedCount,
    suggestedMatches,
    nextStepLabel,
    nextStepDetail,
  };
}


function toCandidateStatus(state: MatchingExecutionPreviewState): MatchingCandidateStatus {
  if (state === "eligible") return "auto";
  if (state === "review") return "review";
  return "blocked";
}

function makeImportCandidate(args: {
  item: ImportJobItem;
  index: number;
  pairedExport: ExportJobItem | null;
  state: MatchingExecutionPreviewState;
}): MatchingCandidate {
  const status = toCandidateStatus(args.state);
  const confidence =
    status === "auto" ? 0.75 :
    status === "review" ? 0.45 :
    0.1;

  return {
    id: `candidate-import-${args.item.id}`,
    sourceType: "import",
    sourceId: String(args.item.id),
    sourceLabel: args.item.filename ? `Import: ${args.item.filename}` : `Import Job ${args.item.id}`,
    targetType: args.pairedExport ? "export" : "none",
    targetId: args.pairedExport ? String(args.pairedExport.id) : null,
    targetLabel: args.pairedExport
      ? (args.pairedExport.format ? `Export: ${args.pairedExport.format}` : `Export Job ${args.pairedExport.id}`)
      : "No paired export candidate yet",
    confidence,
    status,
    reason:
      status === "auto"
        ? "Import/export baseline is ready, so this candidate can move into the first-pass reconciliation queue."
        : status === "review"
        ? "Failures or unresolved runtime conditions mean this candidate should be reviewed before reconciliation."
        : "Baseline is not ready yet, so this candidate stays blocked.",
  };
}

function makeExportOnlyCandidate(args: {
  item: ExportJobItem;
  state: MatchingExecutionPreviewState;
}): MatchingCandidate {
  const status = toCandidateStatus(args.state);
  const confidence =
    status === "auto" ? 0.7 :
    status === "review" ? 0.4 :
    0.1;

  return {
    id: `candidate-export-${args.item.id}`,
    sourceType: "export",
    sourceId: String(args.item.id),
    sourceLabel: args.item.format ? `Export: ${args.item.format}` : `Export Job ${args.item.id}`,
    targetType: "none",
    targetId: null,
    targetLabel: "No paired import candidate yet",
    confidence,
    status,
    reason:
      status === "auto"
        ? "Export candidate is available for reconciliation, but no import-side pair has been derived yet."
        : status === "review"
        ? "Export candidate exists, but the runtime requires review before pairing."
        : "Baseline is not ready yet, so export-only candidates stay blocked.",
  };
}

export function deriveMatchingCandidates(args: {
  engineSummary: MatchingEngineSummary;
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
}): MatchingCandidate[] {
  const previewState = resolveExecutionPreviewState(args.engineSummary.status);

  const candidates: MatchingCandidate[] = args.importItems.map((item, index) =>
    makeImportCandidate({
      item,
      index,
      pairedExport: args.exportItems[index] ?? null,
      state: previewState,
    })
  );

  if (args.exportItems.length > args.importItems.length) {
    const extraExports = args.exportItems.slice(args.importItems.length).map((item) =>
      makeExportOnlyCandidate({
        item,
        state: previewState,
      })
    );
    candidates.push(...extraExports);
  }

  return candidates;
}
