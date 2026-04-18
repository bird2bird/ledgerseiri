"use client";

import { useMemo } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  normalizeIncomeCategoryParam,
  type IncomeCategory,
} from "@/core/transactions/transactions";
import { readTransactionsActionMode } from "@/core/transactions/action-mode";
import {
  isDashboardSource,
  readBaseDrilldownQuery,
} from "@/core/drilldown/query-contract";
import { useIncomePageState } from "@/core/transactions/use-income-page-state";
import { useIncomePageOrchestration } from "@/core/transactions/use-income-page-orchestration";
import { renderIncomePageShell } from "@/core/transactions/income-page-shell";

type IncomePageVariant = "root" | "cash" | "store-order" | "other";

function variantToCategory(variant: IncomePageVariant): IncomeCategory {
  if (variant === "cash") return "cash";
  if (variant === "store-order") return "store-order";
  if (variant === "other") return "other";
  return "all";
}

function buildCategoryHref(args: {
  lang: string;
  variant: IncomePageVariant;
  category: IncomeCategory;
}) {
  const { lang, variant, category } = args;

  if (variant === "root") {
    return category === "all"
      ? `/${lang}/app/income`
      : `/${lang}/app/income?category=${category}`;
  }

  if (category === "cash") return `/${lang}/app/income/cash`;
  if (category === "store-order") return `/${lang}/app/income/store-orders`;
  if (category === "other") return `/${lang}/app/income/other`;
  return `/${lang}/app/income`;
}

export function IncomePageClient(props: {
  pageVariant: IncomePageVariant;
}) {
  const { pageVariant } = props;

  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = params?.lang ?? "ja";
  const action = readTransactionsActionMode(searchParams);

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const importJobId = String(searchParams.get("importJobId") || "");
  const importMonthsRaw = String(searchParams.get("months") || "");
  const importMonths = useMemo(
    () =>
      importMonthsRaw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    [importMonthsRaw]
  );
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);

  const queryCategory = normalizeIncomeCategoryParam(searchParams.get("category"));
  const forcedCategory = variantToCategory(pageVariant);
  const category = pageVariant === "root" ? queryCategory : forcedCategory;

  const isDashboard = isDashboardSource(from);

  const state = useIncomePageState({
    from,
    storeId,
    range,
    category,
    action,
    importJobId,
    importMonths,
  });

  const orchestration = useIncomePageOrchestration({
    pathname,
    searchParams,
    router,
    selectedRowId: state.selectedRowId,
  });

  return renderIncomePageShell({
    lang,
    pageVariant,
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
    visibleRows: state.visibleRows,
    selectedRowId: state.selectedRowId,
    onSelectRow: state.setSelectedRowId,
    selectedRow: state.selectedRow,
    selectedRawTransactionRows: state.selectedRawTransactionRows,
    rawStoreOrderRows: state.rawStoreOrderRows,
    loading: state.loading,
    error: state.error,
    totalAmount: state.totalAmount,
    totalNetAmount: state.totalNetAmount,
    totalFeeAmount: state.totalFeeAmount,
    totalTaxAmount: state.totalTaxAmount,
    totalShippingAmount: state.totalShippingAmount,
    totalPromotionAmount: state.totalPromotionAmount,
    stageChargeSummary: state.stageChargeSummary,
    rawStoreOrderCount: state.rawStoreOrderCount,
    aggregatedStoreOrderCount: state.aggregatedStoreOrderCount,
    storeOrderViewMode: state.storeOrderViewMode,
    setStoreOrderViewMode: state.setStoreOrderViewMode,

    pageSize: state.pageSize,
    setPageSize: state.setPageSize,
    currentPage: state.currentPage,
    setCurrentPage: state.setCurrentPage,
    totalPages: state.totalPages,
    totalRows: state.totalRows,
    totalQuantity: state.totalQuantity,
    pageStartRow: state.pageStartRow,
    pageEndRow: state.pageEndRow,

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
    categoryHrefBuilder: (next) =>
      buildCategoryHref({
        lang,
        variant: pageVariant,
        category: next,
      }),
  });
}
