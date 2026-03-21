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

export type CandidateDecision = "approved" | "rejected" | "pending";

export type CandidateDecisionRecord = {
  candidateId: string;
  decision: CandidateDecision;
  sourceType: "import" | "export";
  sourceId: string;
  targetType: "import" | "export" | "none";
  targetId: string | null;
  confidence: number;
  reason: string;
  persistenceKey: string;
};

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


function normalizeDomainValue(value?: string | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function resolveCandidateDecision(args: {
  engineStatus: MatchingEngineStatus;
  importDomain?: string | null;
  exportDomain?: string | null;
  hasPairedExport: boolean;
}): {
  status: MatchingCandidateStatus;
  confidence: number;
  reason: string;
} {
  if (args.engineStatus === "not_ready") {
    return {
      status: "blocked",
      confidence: 0.10,
      reason: "Matching baseline is not ready yet, so this candidate remains blocked until import/export runtime preparation is completed.",
    };
  }

  if (!args.hasPairedExport) {
    return {
      status: "review",
      confidence: args.engineStatus === "ready" ? 0.35 : 0.30,
      reason: "No paired export candidate has been derived yet, so this candidate must stay in review.",
    };
  }

  const importDomain = normalizeDomainValue(args.importDomain);
  const exportDomain = normalizeDomainValue(args.exportDomain);

  if (importDomain && exportDomain && importDomain !== exportDomain) {
    return {
      status: "review",
      confidence: 0.40,
      reason: "Import/export candidates exist, but their domains do not match, so review is required before reconciliation.",
    };
  }

  if (args.engineStatus === "review_required") {
    return {
      status: "review",
      confidence: 0.55,
      reason: "Baseline pairing exists, but runtime failures or unresolved conditions mean this candidate should still be reviewed.",
    };
  }

  if (importDomain && exportDomain && importDomain === exportDomain) {
    return {
      status: "auto",
      confidence: 0.85,
      reason: "Import/export candidates are paired and share the same domain, so this candidate is eligible for first-pass auto reconciliation.",
    };
  }

  return {
    status: "auto",
    confidence: 0.70,
    reason: "A paired candidate exists and runtime baseline is ready, but domain evidence is incomplete, so confidence remains moderate.",
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
  engineStatus: MatchingEngineStatus;
}): MatchingCandidate {
  const decision = resolveCandidateDecision({
    engineStatus: args.engineStatus,
    importDomain: args.item.domain,
    exportDomain: args.pairedExport?.domain ?? null,
    hasPairedExport: Boolean(args.pairedExport),
  });

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
    confidence: decision.confidence,
    status: decision.status,
    reason: decision.reason,
  };
}

function makeExportOnlyCandidate(args: {
  item: ExportJobItem;
  state: MatchingExecutionPreviewState;
  engineStatus: MatchingEngineStatus;
}): MatchingCandidate {
  const decision = resolveCandidateDecision({
    engineStatus: args.engineStatus,
    importDomain: null,
    exportDomain: args.item.domain,
    hasPairedExport: false,
  });

  return {
    id: `candidate-export-${args.item.id}`,
    sourceType: "export",
    sourceId: String(args.item.id),
    sourceLabel: args.item.format ? `Export: ${args.item.format}` : `Export Job ${args.item.id}`,
    targetType: "none",
    targetId: null,
    targetLabel: "No paired import candidate yet",
    confidence: decision.confidence,
    status: decision.status,
    reason: decision.reason,
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
      engineStatus: args.engineSummary.status,
    })
  );

  if (args.exportItems.length > args.importItems.length) {
    const extraExports = args.exportItems.slice(args.importItems.length).map((item) =>
      makeExportOnlyCandidate({
        item,
        state: previewState,
        engineStatus: args.engineSummary.status,
      })
    );
    candidates.push(...extraExports);
  }

  return candidates;
}


function toCandidateDecision(status: MatchingCandidateStatus): CandidateDecision {
  if (status === "auto") return "approved";
  if (status === "review") return "pending";
  return "rejected";
}

function makeCandidatePersistenceKey(candidate: MatchingCandidate): string {
  return [
    "reconciliation",
    candidate.sourceType,
    candidate.sourceId,
    candidate.targetType,
    candidate.targetId ?? "none",
  ].join(":");
}

export function buildCandidateDecisionRecords(
  candidates: MatchingCandidate[],
): CandidateDecisionRecord[] {
  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    decision: toCandidateDecision(candidate.status),
    sourceType: candidate.sourceType,
    sourceId: candidate.sourceId,
    targetType: candidate.targetType,
    targetId: candidate.targetId,
    confidence: candidate.confidence,
    reason: candidate.reason,
    persistenceKey: makeCandidatePersistenceKey(candidate),
  }));
}
