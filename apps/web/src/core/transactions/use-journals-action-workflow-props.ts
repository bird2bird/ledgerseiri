import { useMemo } from "react";
import type { JournalRow, JournalTab } from "@/core/transactions/transactions";
import {
  buildBulkPostWorkflowProps,
  buildFlaggedWorkflowProps,
} from "@/core/transactions/journals-action-workflow";
import type { JournalsActionUiTone } from "@/core/transactions/journals-action-execution";

export function useJournalsActionWorkflowProps(args: {
  selectedRow: JournalRow | null;
  rowsCount: number;
  tab: JournalTab;
  rawRange: string | null;
  range: string;
  tabLabels: Record<JournalTab, string>;
  fmtJPY: (value: number) => string;

  bulkPostUiMessage: string;
  bulkPostUiTone: JournalsActionUiTone;
  bulkPostLoading: boolean;

  flaggedUiMessage: string;
  flaggedUiTone: JournalsActionUiTone;
  flaggedLoading: boolean;

  onBulkPostExecute: () => void;
  onFlaggedReviewExecute: () => void;
  onSecondary: () => void;
}) {
  const {
    selectedRow,
    rowsCount,
    tab,
    rawRange,
    range,
    tabLabels,
    fmtJPY,

    bulkPostUiMessage,
    bulkPostUiTone,
    bulkPostLoading,

    flaggedUiMessage,
    flaggedUiTone,
    flaggedLoading,

    onBulkPostExecute,
    onFlaggedReviewExecute,
    onSecondary,
  } = args;

  const bulkPostWorkflowProps = useMemo(
    () =>
      selectedRow
        ? buildBulkPostWorkflowProps({
            row: selectedRow,
            tabLabels,
            fmtJPY,
            bulkPostUiMessage,
            bulkPostUiTone,
            bulkPostLoading,
            onExecute: onBulkPostExecute,
            onSecondary,
          })
        : null,
    [
      selectedRow,
      tabLabels,
      fmtJPY,
      bulkPostUiMessage,
      bulkPostUiTone,
      bulkPostLoading,
      onBulkPostExecute,
      onSecondary,
    ]
  );

  const flaggedWorkflowProps = useMemo(
    () =>
      buildFlaggedWorkflowProps({
        tab,
        rowsCount,
        selectedEntryNo: selectedRow ? selectedRow.entryNo : null,
        rangeLabel: rawRange ?? range,
        tabLabels,
        flaggedUiMessage,
        flaggedUiTone,
        flaggedLoading,
        onExecute: onFlaggedReviewExecute,
        onSecondary,
      }),
    [
      tab,
      rowsCount,
      selectedRow,
      rawRange,
      range,
      tabLabels,
      flaggedUiMessage,
      flaggedUiTone,
      flaggedLoading,
      onFlaggedReviewExecute,
      onSecondary,
    ]
  );

  return {
    bulkPostWorkflowProps,
    flaggedWorkflowProps,
  };
}
