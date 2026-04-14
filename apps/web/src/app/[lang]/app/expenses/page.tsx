"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  normalizeExpenseCategoryParam,
} from "@/core/transactions/transactions";
import { readTransactionsActionMode } from "@/core/transactions/action-mode";
import {
  isDashboardSource,
  readBaseDrilldownQuery,
} from "@/core/drilldown/query-contract";
import { useExpensesPageState } from "@/core/transactions/use-expenses-page-state";
import { useExpensesPageOrchestration } from "@/core/transactions/use-expenses-page-orchestration";
import { renderExpensesPageShell } from "@/core/transactions/expenses-page-shell";

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

  const category = normalizeExpenseCategoryParam(searchParams.get("category"));
  const isDashboard = isDashboardSource(from);

  const state = useExpensesPageState({
    from,
    storeId,
    range,
    category,
    action,
  });

  const orchestration = useExpensesPageOrchestration({
    pathname,
    searchParams,
    router,
    selectedRowId: state.selectedRowId,
  });

  return renderExpensesPageShell({
    lang,
    isDashboard,
    rawFrom,
    from,
    rawStoreId,
    storeId,
    rawRange,
    range,
    category,
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
    txCategories: state.txCategories,
    formLoading: state.formLoading,
    submitLoading: state.submitLoading,
    panelError: state.panelError,

    accountId: state.accountId,
    setAccountId: state.setAccountId,
    categoryId: state.categoryId,
    setCategoryId: state.setCategoryId,
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

    updateCategory: orchestration.updateCategory,
    clearActionMode: orchestration.clearActionMode,
    sidebarActions: orchestration.sidebarActions,
  });
}
