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
import { CashIncomeHeader } from "@/components/app/income/CashIncomeHeader";
import { CashIncomeWorkspace } from "@/components/app/income/CashIncomeWorkspace";

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
  const useStoreOrdersStagePreview = searchParams.get("stagePreview") === "1";
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
    useStoreOrdersStagePreview,
  });

  const orchestration = useIncomePageOrchestration({
    pathname,
    searchParams,
    router,
    selectedRowId: state.selectedRowId,
  });

  const shell = renderIncomePageShell({
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
    updateStoreId: orchestration.updateStoreId,
    updateRange: orchestration.updateRange,
    clearActionMode: orchestration.clearActionMode,
    sidebarActions: orchestration.sidebarActions,
    categoryHrefBuilder: (next) =>
      buildCategoryHref({
        lang,
        variant: pageVariant,
        category: next,
      }),
  });

  if (pageVariant === "cash") {
    return (
      <div className="space-y-6">
        <CashIncomeHeader
          lang={lang}
          isDashboard={isDashboard}
          storeId={storeId}
          range={range}
          rows={state.rows}
          totalAmount={state.totalAmount}
          updateStoreId={orchestration.updateStoreId}
          updateRange={orchestration.updateRange}
        />
        <CashIncomeWorkspace
          rows={state.rows}
          selectedRowId={state.selectedRowId}
          onSelectRow={state.setSelectedRowId}
          selectedRow={state.selectedRow}
          pageSize={state.pageSize}
          setPageSize={state.setPageSize}
          currentPage={state.currentPage}
          setCurrentPage={state.setCurrentPage}
          action={action}
          clearActionMode={orchestration.clearActionMode}
          accounts={state.accounts}
          formLoading={state.formLoading}
          submitLoading={state.submitLoading}
          panelError={state.panelError}
          setPanelError={state.setPanelError}
          accountId={state.accountId}
          setAccountId={state.setAccountId}
          amount={state.amount}
          setAmount={state.setAmount}
          occurredAt={state.occurredAt}
          setOccurredAt={state.setOccurredAt}
          memo={state.memo}
          setMemo={state.setMemo}
          submitCreate={state.submitCreate}
          editAmount={state.editAmount}
          setEditAmount={state.setEditAmount}
          editMemo={state.editMemo}
          setEditMemo={state.setEditMemo}
          editUiError={state.editUiError}
          editUiMessage={state.editUiMessage}
          editSaveLoading={state.editSaveLoading}
          editCanSave={state.editCanSave}
          handleEditSave={state.handleEditSave}
          sidebarActions={orchestration.sidebarActions.map((item) => {
            const label =
              item.label === "新規収入"
                ? "新規現金収入"
                : item.label === "CSV取込"
                  ? "現金収入CSV取込"
                  : item.label === "編集"
                    ? "現金収入を編集"
                    : item.label === "店舗紐付け"
                      ? "入金元/補助設定"
                      : item.label;

            const href =
              item.label === "CSV取込"
                ? `/${lang}/app/data/import?module=cash-income`
                : item.label === "店舗紐付け"
                  ? `/${lang}/app/settings/accounts`
                  : item.href;

            return {
              ...item,
              label,
              href,
            };
          })}
        />
      </div>
    );
  }

  return shell;
}
