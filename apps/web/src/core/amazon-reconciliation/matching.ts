import type {
  ExportJobItem,
  ImportJobItem,
  MetaSummary,
} from "@/core/jobs";
import type {
  MatchingBaselineBlock,
  MatchingBaselineSummary,
  MatchingBaselineStatus,
  MatchingSummaryCardModel,
} from "./types";

function latestIso(values: Array<string | null | undefined>): string | null {
  const times = values
    .map((value) => {
      if (!value) return Number.NaN;
      return new Date(value).getTime();
    })
    .filter((value) => Number.isFinite(value));

  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}

function toStatusReadyOrAttention(
  hasItems: boolean,
  failedCount: number,
): MatchingBaselineStatus {
  if (!hasItems) return "attention";
  if (failedCount > 0) return "attention";
  return "ready";
}

function makeBaselineBlock(args: {
  title: string;
  hasItems: boolean;
  failedCount: number;
  readyDetail: string;
  attentionDetail: string;
}): MatchingBaselineBlock {
  const status = toStatusReadyOrAttention(args.hasItems, args.failedCount);

  if (status === "ready") {
    return {
      title: args.title,
      status,
      headline: "Ready",
      detail: args.readyDetail,
    };
  }

  return {
    title: args.title,
    status,
    headline: args.hasItems ? "Needs review" : "Not ready",
    detail: args.attentionDetail,
  };
}

export function deriveMatchingBaselineSummary(args: {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
}): MatchingBaselineSummary {
  const importFailed = Number(args.importSummary?.failed ?? 0);
  const exportFailed = Number(args.exportSummary?.failed ?? 0);
  const totalFailedJobs = importFailed + exportFailed;

  const latestActivityAt = latestIso([
    ...args.importItems.map((item) => item.updatedAt ?? item.createdAt ?? null),
    ...args.exportItems.map((item) => item.updatedAt ?? item.createdAt ?? null),
  ]);

  const importHasItems = args.importItems.length > 0;
  const exportHasItems = args.exportItems.length > 0;

  const importBaseline = makeBaselineBlock({
    title: "Import Baseline",
    hasItems: importHasItems,
    failedCount: importFailed,
    readyDetail: "Step46 import jobs page already connected.",
    attentionDetail: importHasItems
      ? "Import jobs exist, but failures need review before matching confidence improves."
      : "No import jobs yet. Prepare settlement/order source files first.",
  });

  const exportBaseline = makeBaselineBlock({
    title: "Export Baseline",
    hasItems: exportHasItems,
    failedCount: exportFailed,
    readyDetail: "Step46 export jobs page already connected.",
    attentionDetail: exportHasItems
      ? "Export jobs exist, but failures need review before reconciliation workflow stabilizes."
      : "No export jobs yet. Prepare export baseline before closing the reconciliation loop.",
  });

  const matchingEngine: MatchingBaselineBlock = {
    title: "Amazon Matching Engine",
    status: importHasItems && exportHasItems ? "attention" : "planned",
    headline: importHasItems && exportHasItems ? "Baseline ready" : "Planned",
    detail: importHasItems && exportHasItems
      ? "Runtime baseline is ready. Next step can add settlement/order/fee matching logic."
      : "Next step will add settlement/order matching logic baseline.",
  };

  const recommendedAction =
    !importHasItems
      ? { href: "/app/data/import", label: "データインポートを開く" }
      : !exportHasItems
      ? { href: "/app/data/export", label: "データエクスポートを開く" }
      : totalFailedJobs > 0
      ? { href: "/app/amazon-reconciliation", label: "失敗ジョブを確認" }
      : { href: "/app/journals", label: "仕訳一覧へ" };

  return {
    importBaseline,
    exportBaseline,
    matchingEngine,
    totalFailedJobs,
    latestActivityAt,
    recommendedAction,
  };
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function createFallbackMatchingBaselineSummary(): MatchingBaselineSummary {
  return {
    importBaseline: {
      title: "Import Baseline",
      status: "planned",
      headline: "Planned",
      detail: "matching baseline unavailable",
    },
    exportBaseline: {
      title: "Export Baseline",
      status: "planned",
      headline: "Planned",
      detail: "matching baseline unavailable",
    },
    matchingEngine: {
      title: "Amazon Matching Engine",
      status: "planned",
      headline: "Planned",
      detail: "matching baseline unavailable",
    },
    totalFailedJobs: 0,
    latestActivityAt: null,
    recommendedAction: {
      href: "/app/amazon-reconciliation",
      label: "Amazon照合",
    },
  };
}

export function deriveMatchingSummaryCardModel(
  matching: MatchingBaselineSummary,
): MatchingSummaryCardModel {
  const readyCount = [
    matching.importBaseline,
    matching.exportBaseline,
    matching.matchingEngine,
  ].filter((x) => x.status === "ready").length;

  return {
    title: "Matching Summary",
    lead: "Current reconciliation baseline derived from import/export runtime state.",
    coverageLabel: "Coverage",
    coverageValue: `${readyCount}/3 ready`,
    failedJobsLabel: "Failed Jobs",
    failedJobsValue: matching.totalFailedJobs,
    latestActivityLabel: "Latest Activity",
    latestActivityValue: fmtDate(matching.latestActivityAt),
    nextActionHref: matching.recommendedAction.href,
    nextActionLabel: matching.recommendedAction.label,
  };
}
