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



function getComparableTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function getJobTimestamp(job: { updatedAt?: string | null; createdAt?: string | null }): number | null {
  return getComparableTimestamp(job.updatedAt ?? job.createdAt ?? null);
}

function getDayDiff(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

function pickBestExportCandidate(args: {
  item: ImportJobItem;
  exportItems: ExportJobItem[];
  fallbackIndex: number;
}): ExportJobItem | null {
  const importDomain = normalizeDomainValue(args.item.domain);
  const importTs = getJobTimestamp(args.item);

  const sameDomainExports = args.exportItems.filter(
    (item) => normalizeDomainValue(item.domain) === importDomain
  );

  const pool = sameDomainExports.length > 0 ? sameDomainExports : args.exportItems;
  if (pool.length === 0) return null;

  let best = pool[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of pool) {
    const exportTs = getJobTimestamp(candidate);
    const dayDiff = getDayDiff(importTs, exportTs);
    const score = dayDiff === null ? 999999 : dayDiff;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  if (sameDomainExports.length === 0) {
    return args.exportItems[args.fallbackIndex] ?? best ?? null;
  }

  return best ?? null;
}

function normalizeDomainValue(value?: string | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function resolveCandidateDecision(args: {
  engineStatus: MatchingEngineStatus;
  importDomain?: string | null;
  exportDomain?: string | null;
  hasPairedExport: boolean;
  importTimestamp?: number | null;
  exportTimestamp?: number | null;
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
  const dayDiff = getDayDiff(args.importTimestamp ?? null, args.exportTimestamp ?? null);

  if (importDomain && exportDomain && importDomain !== exportDomain) {
    return {
      status: "review",
      confidence: 0.42,
      reason: "Import/export candidates exist, but their domains do not match, so review is required before reconciliation.",
    };
  }

  if (args.engineStatus === "review_required") {
    return {
      status: "review",
      confidence: dayDiff !== null && dayDiff <= 3 ? 0.62 : 0.55,
      reason: dayDiff !== null && dayDiff <= 3
        ? "Runtime still requires review, but the paired candidate is close in time, so this remains a higher-priority review candidate."
        : "Baseline pairing exists, but runtime failures or unresolved conditions mean this candidate should still be reviewed.",
    };
  }

  if (importDomain && exportDomain && importDomain === exportDomain) {
    if (dayDiff !== null && dayDiff <= 3) {
      return {
        status: "auto",
        confidence: 0.92,
        reason: "Import/export candidates share the same domain and are closely aligned in time, so this candidate is a strong auto-match.",
      };
    }

    if (dayDiff !== null && dayDiff <= 7) {
      return {
        status: "auto",
        confidence: 0.85,
        reason: "Import/export candidates share the same domain and are reasonably close in time, so this candidate is eligible for first-pass auto reconciliation.",
      };
    }

    return {
      status: "auto",
      confidence: 0.78,
      reason: "Import/export candidates share the same domain, but the time distance is wider, so confidence is moderate.",
    };
  }

  return {
    status: "review",
    confidence: 0.58,
    reason: "A paired candidate exists and runtime baseline is ready, but domain evidence is incomplete, so review is still recommended.",
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
  const importTimestamp = getJobTimestamp(args.item);
  const exportTimestamp = args.pairedExport ? getJobTimestamp(args.pairedExport) : null;

  const decision = resolveCandidateDecision({
    engineStatus: args.engineStatus,
    importDomain: args.item.domain,
    exportDomain: args.pairedExport?.domain ?? null,
    hasPairedExport: Boolean(args.pairedExport),
    importTimestamp,
    exportTimestamp,
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
      pairedExport: pickBestExportCandidate({
        item,
        exportItems: args.exportItems,
        fallbackIndex: index,
      }),
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
    ...(() => {
      const weighted = weightedConfidenceV2({
        sourceAmount: (candidate as any).sourceAmount ?? (candidate as any).amount,
        targetAmount: (candidate as any).targetAmount ?? (candidate as any).matchedAmount,
        sourceDate: (candidate as any).sourceDate ?? (candidate as any).date,
        targetDate: (candidate as any).targetDate ?? (candidate as any).matchedDate,
        sourceType: (candidate as any).sourceType,
        targetType: (candidate as any).targetType,
        conflictCount: (candidate as any).conflictCount ?? 0,
      });

      return {
        confidence: weighted.confidence,
        reason: weighted.reason,
      };
    })(),
    persistenceKey: makeCandidatePersistenceKey(candidate),
  }));
}


export type ReconciliationDecisionSubmitItem = {
  candidateId: string;
  decision: CandidateDecision;
  persistenceKey: string;
  confidence: number;
};

export type ReconciliationDecisionSubmitPayload = {
  submittedAt: string;
  items: ReconciliationDecisionSubmitItem[];
};

export type ReconciliationDecisionSubmitResult = {
  acceptedCount: number;
  submittedAt: string;
  persistenceKeys: string[];
};

export function buildDecisionSubmitPayload(args: {
  records: CandidateDecisionRecord[];
}): ReconciliationDecisionSubmitPayload {
  return {
    submittedAt: new Date().toISOString(),
    items: args.records
      .filter((record) => record.decision !== "pending")
      .map((record) => ({
        candidateId: record.candidateId,
        decision: record.decision === "approved" ? "approved" : "rejected",
        persistenceKey: record.persistenceKey,
        confidence: record.confidence,
      })),
  };
}





export type ReconciliationMatchingPolicy = {
  amountWeights: {
    exact: number;
    near005: number;
    near01: number;
    near03: number;
    near05: number;
    near10: number;
    fallback: number;
  };
  timeWeights: {
    sameHalfDay: number;
    sameDay: number;
    within2d: number;
    within3d: number;
    within7d: number;
    within14d: number;
    fallback: number;
  };
  domainWeights: {
    amazonSettlement: number;
    importExport: number;
    orderPayment: number;
    genericKnown: number;
    fallback: number;
  };
  penalties: {
    oneConflict: number;
    twoConflicts: number;
    manyConflicts: number;
  };
  scoringWeights: {
    amount: number;
    time: number;
    domain: number;
  };
  autoApplyThreshold: number;
};

export const DEFAULT_RECONCILIATION_MATCHING_POLICY: ReconciliationMatchingPolicy = {
  amountWeights: {
    exact: 1.0,
    near005: 0.96,
    near01: 0.92,
    near03: 0.82,
    near05: 0.72,
    near10: 0.55,
    fallback: 0.25,
  },
  timeWeights: {
    sameHalfDay: 1.0,
    sameDay: 0.95,
    within2d: 0.88,
    within3d: 0.80,
    within7d: 0.62,
    within14d: 0.42,
    fallback: 0.20,
  },
  domainWeights: {
    amazonSettlement: 1.0,
    importExport: 0.82,
    orderPayment: 0.86,
    genericKnown: 0.70,
    fallback: 0.55,
  },
  penalties: {
    oneConflict: 0.05,
    twoConflicts: 0.10,
    manyConflicts: 0.18,
  },
  scoringWeights: {
    amount: 0.45,
    time: 0.30,
    domain: 0.25,
  },
  autoApplyThreshold: 0.90,
};

function resolveMatchingPolicy(
  policy?: Partial<ReconciliationMatchingPolicy>,
): ReconciliationMatchingPolicy {
  return {
    amountWeights: {
      ...DEFAULT_RECONCILIATION_MATCHING_POLICY.amountWeights,
      ...(policy?.amountWeights ?? {}),
    },
    timeWeights: {
      ...DEFAULT_RECONCILIATION_MATCHING_POLICY.timeWeights,
      ...(policy?.timeWeights ?? {}),
    },
    domainWeights: {
      ...DEFAULT_RECONCILIATION_MATCHING_POLICY.domainWeights,
      ...(policy?.domainWeights ?? {}),
    },
    penalties: {
      ...DEFAULT_RECONCILIATION_MATCHING_POLICY.penalties,
      ...(policy?.penalties ?? {}),
    },
    scoringWeights: {
      ...DEFAULT_RECONCILIATION_MATCHING_POLICY.scoringWeights,
      ...(policy?.scoringWeights ?? {}),
    },
    autoApplyThreshold:
      policy?.autoApplyThreshold ??
      DEFAULT_RECONCILIATION_MATCHING_POLICY.autoApplyThreshold,
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function amountProximityScore(a: unknown, b: unknown, policy: ReconciliationMatchingPolicy): number {
  const av = safeNumber(a);
  const bv = safeNumber(b);
  if (av === null || bv === null) return 0.35;

  const diff = Math.abs(av - bv);
  const base = Math.max(Math.abs(av), Math.abs(bv), 1);
  const ratio = diff / base;

  if (ratio <= 0.001) return 1.0;
  if (ratio <= 0.005) return 0.96;
  if (ratio <= 0.01) return 0.92;
  if (ratio <= 0.03) return 0.82;
  if (ratio <= 0.05) return 0.72;
  if (ratio <= 0.10) return 0.55;
  return 0.25;
}

function parseDateLike(value: unknown): number | null {
  if (!value) return null;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : null;
}

function timeDecayScore(a: unknown, b: unknown, policy: ReconciliationMatchingPolicy): number {
  const ta = parseDateLike(a);
  const tb = parseDateLike(b);
  if (ta === null || tb === null) return 0.45;

  const diffDays = Math.abs(ta - tb) / (1000 * 60 * 60 * 24);

  if (diffDays <= 0.5) return 1.0;
  if (diffDays <= 1) return 0.95;
  if (diffDays <= 2) return 0.88;
  if (diffDays <= 3) return 0.80;
  if (diffDays <= 7) return 0.62;
  if (diffDays <= 14) return 0.42;
  return 0.20;
}

function domainWeightScore(sourceType: unknown, targetType: unknown, policy: ReconciliationMatchingPolicy): number {
  const s = String(sourceType ?? "").toLowerCase();
  const t = String(targetType ?? "").toLowerCase();

  if (s.includes("amazon") && t.includes("settlement")) return policy.domainWeights.amazonSettlement;
  if (s.includes("import") && t.includes("export")) return policy.domainWeights.importExport;
  if (s.includes("order") && t.includes("payment")) return policy.domainWeights.orderPayment;
  if (s && t) return policy.domainWeights.genericKnown;
  return policy.domainWeights.fallback;
}

function conflictPenaltyScore(conflictCount: number, policy: ReconciliationMatchingPolicy): number {
  if (conflictCount <= 0) return 0;
  if (conflictCount === 1) return policy.penalties.oneConflict;
  if (conflictCount === 2) return policy.penalties.twoConflicts;
  return policy.penalties.manyConflicts;
}

function buildWeightedReason(args: {
  amountScore: number;
  timeScore: number;
  domainScore: number;
  penalty: number;
}): string {
  const parts = [
    `amount ${(args.amountScore * 100).toFixed(0)}%`,
    `time ${(args.timeScore * 100).toFixed(0)}%`,
    `domain ${(args.domainScore * 100).toFixed(0)}%`,
  ];

  if (args.penalty > 0) {
    parts.push(`conflict penalty -${(args.penalty * 100).toFixed(0)}%`);
  }

  return parts.join(" / ");
}

function weightedConfidenceV2(args: {
  sourceAmount?: unknown;
  targetAmount?: unknown;
  sourceDate?: unknown;
  targetDate?: unknown;
  sourceType?: unknown;
  targetType?: unknown;
  conflictCount?: number;
  policy?: Partial<ReconciliationMatchingPolicy>;
}): { confidence: number; reason: string } {
  const policy = resolveMatchingPolicy(args.policy);

  const amountScore = amountProximityScore(args.sourceAmount, args.targetAmount, policy);
  const timeScore = timeDecayScore(args.sourceDate, args.targetDate, policy);
  const domainScore = domainWeightScore(args.sourceType, args.targetType, policy);
  const penalty = conflictPenaltyScore(Number(args.conflictCount ?? 0), policy);

  const weighted =
    amountScore * policy.scoringWeights.amount +
    timeScore * policy.scoringWeights.time +
    domainScore * policy.scoringWeights.domain -
    penalty;

  return {
    confidence: clampScore(weighted),
    reason: buildWeightedReason({
      amountScore,
      timeScore,
      domainScore,
      penalty,
    }),
  };
}

export type AutoApplySuggestion = {
  candidateId: string;
  recommendedDecision: "approved";
  confidence: number;
  reason: string;
};

export function deriveAutoApplySuggestions(args: {
  candidates: MatchingCandidate[];
  policy?: Partial<ReconciliationMatchingPolicy>;
}): AutoApplySuggestion[] {
  const policy = resolveMatchingPolicy(args.policy);

  return args.candidates
    .filter(
      (candidate) =>
        candidate.status === "auto" &&
        candidate.confidence >= policy.autoApplyThreshold
    )
    .map((candidate) => ({
      candidateId: candidate.id,
      recommendedDecision: "approved",
      confidence: candidate.confidence,
      reason: candidate.reason,
    }));
}
