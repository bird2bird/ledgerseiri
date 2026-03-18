"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  normalizeJournalTabParam,
  type JournalTab,
} from "@/core/transactions/transactions";
import {
  JOURNALS_TAB_ITEMS,
  JOURNALS_TAB_LABELS,
  formatJournalJPY,
} from "@/core/transactions/journals-page-constants";
import { useJournalsActionShellState } from "@/core/transactions/use-journals-action-shell-state";
import { useJournalsPageState } from "@/core/transactions/use-journals-page-state";
import { useJournalsPageOrchestration } from "@/core/transactions/use-journals-page-orchestration";
import { renderJournalsPageShell } from "@/core/transactions/journals-page-shell";
import { readTransactionsActionMode } from "@/core/transactions/action-mode";
import {
  isDashboardSource,
  readBaseDrilldownQuery,
} from "@/core/drilldown/query-contract";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = params?.lang ?? "ja";
  const action = readTransactionsActionMode(searchParams);

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);

  const tab = normalizeJournalTabParam(searchParams.get("tab"));
  const isDashboard = isDashboardSource(from);

  const {
    rows,
    selectedRowId,
    setSelectedRowId,
    selectedRow,
    adapterNote,
    loading,
    error,
    totalAmount,
  } = useJournalsPageState({
    from,
    storeId,
    range,
    tab,
  });

  const {
    bulkPostUiMessage,
    setBulkPostUiMessage,
    bulkPostUiTone,
    setBulkPostUiTone,
    bulkPostLoading,
    setBulkPostLoading,
    flaggedUiMessage,
    setFlaggedUiMessage,
    flaggedUiTone,
    setFlaggedUiTone,
    flaggedLoading,
    setFlaggedLoading,
    resetAllActionShellState,
  } = useJournalsActionShellState();
  const {
    updateTab,
    clearActionMode,
    sidebarActions,
    actionPanelProps,
  } = useJournalsPageOrchestration({
    pathname,
    searchParams,
    router,
    tab,
    rawRange,
    range,
    tabLabels: JOURNALS_TAB_LABELS,
    fmtJPY: formatJournalJPY,
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
  });
  return renderJournalsPageShell({
    lang,
    isDashboard,
    rawFrom,
    from,
    rawStoreId,
    storeId,
    rawRange,
    range,
    tab,
    adapterNote,
    tabItems: JOURNALS_TAB_ITEMS,
    tabLabels: JOURNALS_TAB_LABELS,
    onUpdateTab: updateTab,
    action,
    actionPanelProps,
    rows,
    selectedRowId,
    selectedRow,
    loading,
    error,
    totalAmount: formatJournalJPY(totalAmount),
    onSelectRow: setSelectedRowId,
    fmtJPY: formatJournalJPY,
  });
}
