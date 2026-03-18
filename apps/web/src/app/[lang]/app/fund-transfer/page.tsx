"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  normalizeTransferStatusParam,
} from "@/core/transactions/transactions";
import { readTransactionsActionMode } from "@/core/transactions/action-mode";
import {
  isDashboardSource,
  readBaseDrilldownQuery,
} from "@/core/drilldown/query-contract";
import { useFundTransferPageState } from "@/core/transactions/use-fund-transfer-page-state";
import { useFundTransferPageOrchestration } from "@/core/transactions/use-fund-transfer-page-orchestration";
import { renderFundTransferPageShell } from "@/core/transactions/fund-transfer-page-shell";

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

  const status = normalizeTransferStatusParam(searchParams.get("status"));
  const isDashboard = isDashboardSource(from);

  const state = useFundTransferPageState({
    from,
    storeId,
    range,
    status,
    action,
  });

  const orchestration = useFundTransferPageOrchestration({
    pathname,
    searchParams,
    router,
    selectedRowId: state.selectedRowId,
  });

  return renderFundTransferPageShell({
    lang,
    isDashboard,
    rawFrom,
    from,
    rawStoreId,
    storeId,
    rawRange,
    range,
    status,
    adapterNote: state.adapterNote,
    action,

    rows: state.rows,
    selectedRowId: state.selectedRowId,
    onSelectRow: state.setSelectedRowId,
    selectedRow: state.selectedRow,
    loading: state.loading,
    error: state.error,
    totalAmount: state.totalAmount,

    accounts: state.accounts,
    formLoading: state.formLoading,
    submitLoading: state.submitLoading,
    panelError: state.panelError,

    fromAccountId: state.fromAccountId,
    setFromAccountId: state.setFromAccountId,
    toAccountId: state.toAccountId,
    setToAccountId: state.setToAccountId,
    amount: state.amount,
    setAmount: state.setAmount,
    occurredAt: state.occurredAt,
    setOccurredAt: state.setOccurredAt,
    memo: state.memo,
    setMemo: state.setMemo,

    editAmount: state.editAmount,
    setEditAmount: state.setEditAmount,
    editMemo: state.editMemo,
    setEditMemo: state.setEditMemo,
    editUiError: state.editUiError,
    setEditUiError: state.setEditUiError,
    editUiMessage: state.editUiMessage,
    setEditUiMessage: state.setEditUiMessage,
    editSaveLoading: state.editSaveLoading,
    editAmountValid: state.editAmountValid,
    editMemoTooLong: state.editMemoTooLong,
    editDirty: state.editDirty,
    editCanSave: state.editCanSave,

    submitCreate: state.submitCreate,
    handleEditSave: state.handleEditSave,

    updateStatus: orchestration.updateStatus,
    clearActionMode: orchestration.clearActionMode,
    sidebarActions: orchestration.sidebarActions,
  });
}
