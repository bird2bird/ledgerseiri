import { useMemo } from "react";
import { clearTransactionsActionHref } from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";
import {
  executeBulkPostShellAction,
  executeFlaggedReviewShellAction,
} from "@/core/transactions/journals-action-handlers";
import { useJournalsPageActions } from "@/core/transactions/use-journals-page-actions";
import { useJournalsActionWorkflowProps } from "@/core/transactions/use-journals-action-workflow-props";
import type { JournalRow, JournalTab } from "@/core/transactions/transactions";

export function useJournalsPageOrchestration(args: {
  pathname: string;
  searchParams: { get(name: string): string | null; toString(): string };
  router: { replace(href: string): void };

  tab: JournalTab;
  rawRange: string | null;
  range: string;
  tabLabels: Record<JournalTab, string>;
  fmtJPY: (value: number) => string;

  rows: JournalRow[];
  selectedRowId: string;
  selectedRow: JournalRow | null;

  bulkPostUiMessage: string;
  bulkPostUiTone: "info" | "success" | "error";
  bulkPostLoading: boolean;
  setBulkPostUiMessage: (value: string) => void;
  setBulkPostUiTone: (value: "info" | "success" | "error") => void;
  setBulkPostLoading: (value: boolean) => void;

  flaggedUiMessage: string;
  flaggedUiTone: "info" | "success" | "error";
  flaggedLoading: boolean;
  setFlaggedUiMessage: (value: string) => void;
  setFlaggedUiTone: (value: "info" | "success" | "error") => void;
  setFlaggedLoading: (value: boolean) => void;

  resetAllActionShellState: () => void;
}) {
  const {
    pathname,
    searchParams,
    router,
    tab,
    rawRange,
    range,
    tabLabels,
    fmtJPY,
    rows,
    selectedRowId,
    selectedRow,
    bulkPostUiMessage,
    bulkPostUiTone,
    bulkPostLoading,
    setBulkPostUiMessage,
    setBulkPostUiTone,
    setBulkPostLoading,
    flaggedUiMessage,
    flaggedUiTone,
    flaggedLoading,
    setFlaggedUiMessage,
    setFlaggedUiTone,
    setFlaggedLoading,
    resetAllActionShellState,
  } = args;

  function updateTab(next: JournalTab) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "tab", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function clearActionMode() {
    resetAllActionShellState();
    router.replace(clearTransactionsActionHref(pathname, searchParams));
  }

  async function handleBulkPostExecute() {
    await executeBulkPostShellAction({
      hasSelection: !!selectedRow,
      setMessage: setBulkPostUiMessage,
      setTone: setBulkPostUiTone,
      setLoading: setBulkPostLoading,
    });
  }

  async function handleFlaggedReviewExecute() {
    await executeFlaggedReviewShellAction({
      setMessage: setFlaggedUiMessage,
      setTone: setFlaggedUiTone,
      setLoading: setFlaggedLoading,
    });
  }

  const { sidebarActions } = useJournalsPageActions({
    pathname,
    searchParams,
    selectedRowId,
  });

  const { bulkPostWorkflowProps, flaggedWorkflowProps } =
    useJournalsActionWorkflowProps({
      selectedRow,
      rowsCount: rows.length,
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

      onBulkPostExecute: () => {
        void handleBulkPostExecute();
      },
      onFlaggedReviewExecute: () => {
        void handleFlaggedReviewExecute();
      },
      onSecondary: clearActionMode,
    });

  const actionPanelProps = useMemo(
    () => ({
      selectedRow,
      bulkPostWorkflowProps,
      flaggedWorkflowProps,
      clearActionMode,
    }),
    [selectedRow, bulkPostWorkflowProps, flaggedWorkflowProps]
  );

  return {
    updateTab,
    clearActionMode,
    sidebarActions,
    actionPanelProps,
  };
}
