import type { JournalRow, JournalTab } from "@/core/transactions/transactions";

export type JournalsWorkflowTone = "info" | "success" | "error";

export function buildBulkPostWorkflowProps(args: {
  row: JournalRow;
  tabLabels: Record<JournalTab, string>;
  fmtJPY: (amount: number) => string;
  bulkPostUiMessage: string;
  bulkPostUiTone: JournalsWorkflowTone;
  bulkPostLoading: boolean;
  onExecute: () => void;
  onSecondary: () => void;
}) {
  const {
    row,
    tabLabels,
    fmtJPY,
    bulkPostUiMessage,
    bulkPostUiTone,
    bulkPostLoading,
    onExecute,
    onSecondary,
  } = args;

  return {
    previewTitle: "転記対象プレビュー",
    previewItems: [
      { label: "Entry No", value: row.entryNo },
      { label: "Status", value: tabLabels[row.status] },
      { label: "Summary", value: row.summary, fullWidth: true },
      { label: "Amount", value: fmtJPY(row.amount) },
    ],
    statusMessage: bulkPostUiMessage,
    statusTone: bulkPostUiTone,
    executionTitle: "転記アクション",
    executionDescription:
      "選択中の仕訳を対象として、一括転記実行フローの UI shell を先に標準化しています。",
    executionNote:
      "現在は execution placeholder です。次段階で journal API / bulk-post contract を接続します。",
    onExecute,
    executeLabel: "一括転記を実行",
    executeDisabled: bulkPostLoading,
    executeLoading: bulkPostLoading,
    secondaryLabel: "閉じる",
    onSecondary,
    secondaryDisabled: bulkPostLoading,
  };
}

export function buildFlaggedWorkflowProps(args: {
  tab: JournalTab;
  rowsCount: number;
  selectedEntryNo?: string | null;
  rangeLabel: string;
  tabLabels: Record<JournalTab, string>;
  flaggedUiMessage: string;
  flaggedUiTone: JournalsWorkflowTone;
  flaggedLoading: boolean;
  onExecute: () => void;
  onSecondary: () => void;
}) {
  const {
    tab,
    rowsCount,
    selectedEntryNo,
    rangeLabel,
    tabLabels,
    flaggedUiMessage,
    flaggedUiTone,
    flaggedLoading,
    onExecute,
    onSecondary,
  } = args;

  return {
    previewTitle: "要確認レビュー対象",
    previewItems: [
      { label: "Current Tab", value: tabLabels[tab] },
      { label: "Rows", value: String(rowsCount) },
      { label: "Selected", value: selectedEntryNo ?? "未選択" },
      { label: "Range", value: rangeLabel, fullWidth: true },
    ],
    statusMessage: flaggedUiMessage,
    statusTone: flaggedUiTone,
    executionTitle: "レビューアクション",
    executionDescription:
      "flagged 一覧を対象として、dedicated review 実行フローの UI shell を先に標準化しています。",
    executionNote:
      "現在は execution placeholder です。次段階で flagged review contract を接続します。",
    onExecute,
    executeLabel: "レビュー開始",
    executeDisabled: flaggedLoading,
    executeLoading: flaggedLoading,
    secondaryLabel: "閉じる",
    onSecondary,
    secondaryDisabled: flaggedLoading,
  };
}
