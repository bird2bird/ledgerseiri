import React from "react";
import Link from "next/link";
import type {
  IncomeCategory,
  IncomeRow,
} from "@/core/transactions/transactions";
import type { AccountItem } from "@/core/funds/api";
import type { TransactionCategoryItem } from "@/core/transactions/api";
import { TransactionsPageSidebar } from "@/components/app/transactions/TransactionsPageSidebar";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import { renderTransactionsSelectedSummary } from "@/core/transactions/transactions-selected-summary";
import { renderSharedTransactionEditForm } from "@/core/transactions/transactions-edit-form-shared";
import { renderTransactionsListTable } from "@/core/transactions/transactions-list-shared";
import { StoreOrdersWorkspace } from "@/components/app/income-store-orders/StoreOrdersWorkspace";
import {
  INCOME_CATEGORY_ITEMS,
  INCOME_CATEGORY_LABELS,
  getIncomePageTitle,
  formatIncomeJPY,
} from "@/core/transactions/income-page-constants";

type IncomePageVariant = "root" | "cash" | "store-order" | "other";

function getVariantTitle(variant: IncomePageVariant, category: IncomeCategory) {
  if (variant === "cash") return "現金収入";
  if (variant === "store-order") return "店舗注文";
  if (variant === "other") return "その他収入";
  return getIncomePageTitle(category);
}

function getVariantDescription(variant: IncomePageVariant) {
  if (variant === "cash") {
    return "現金収入データの確認、絞り込み、登録アクションを一つの画面で管理します。";
  }
  if (variant === "store-order") {
    return "店舗注文データの確認、絞り込み、登録アクションを一つの画面で管理します。";
  }
  if (variant === "other") {
    return "その他収入データの確認、絞り込み、登録アクションを一つの画面で管理します。";
  }
  return "収入データの確認、絞り込み、登録アクションを一つの画面で管理します。";
}

function navTabs(variant: IncomePageVariant): IncomeCategory[] {
  if (variant === "root") return INCOME_CATEGORY_ITEMS;
  return ["cash", "store-order", "other"];
}

function getCashActionLabel(label: string) {
  if (label === "新規収入") return "新規現金収入";
  if (label === "CSV取込") return "現金収入CSV取込";
  if (label === "編集") return "現金収入を編集";
  if (label === "店舗紐付け") return "入金元/補助設定";
  return label;
}

const CASH_RANGE_OPTIONS = [
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
  { value: "12m", label: "近12个月" },
] as const;

function getCashRangeLabel(range: string) {
  const match = CASH_RANGE_OPTIONS.find((item) => item.value === range);
  return match?.label ?? "近30天";
}

export function renderIncomePageShell(args: {
  lang: string;
  pageVariant: IncomePageVariant;
  isDashboard: boolean;
  rawFrom: string | null;
  from: string;
  rawStoreId: string | null;
  storeId: string;
  rawRange: string | null;
  range: string;
  category: IncomeCategory;
  adapterNote: string;
  action: string;

  rows: IncomeRow[];
  visibleRows: IncomeRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: IncomeRow | null;
  selectedRawTransactionRows: IncomeRow[];
  rawStoreOrderRows: IncomeRow[];
  loading: boolean;
  error: string;
  totalAmount: number;
  totalNetAmount: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  totalShippingAmount: number;
  totalPromotionAmount: number;
  stageChargeSummary: {
    orderSale: number;
    adFee: number;
    storageFee: number;
    subscriptionFee: number;
    fbaFee: number;
    tax: number;
    payout: number;
    adjustment: number;
    other: number;
  };
  rawStoreOrderCount: number;
  aggregatedStoreOrderCount: number;
  storeOrderViewMode: "aggregated" | "raw";
  setStoreOrderViewMode: (value: "aggregated" | "raw") => void;

  pageSize: 20 | 50 | 100;
  setPageSize: (value: 20 | 50 | 100) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  totalPages: number;
  totalRows: number;
  totalQuantity: number;
  pageStartRow: number;
  pageEndRow: number;

  accounts: AccountItem[];
  txCategories: TransactionCategoryItem[];
  formLoading: boolean;
  submitLoading: boolean;
  panelError: string;

  accountId: string;
  setAccountId: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  occurredAt: string;
  setOccurredAt: (value: string) => void;
  memo: string;
  setMemo: (value: string) => void;

  editAmount: string;
  setEditAmount: (value: string) => void;
  editMemo: string;
  setEditMemo: (value: string) => void;
  editUiError: string;
  setEditUiError: (value: string) => void;
  editUiMessage: string;
  setEditUiMessage: (value: string) => void;
  editSaveLoading: boolean;
  editAmountValid: boolean;
  editMemoTooLong: boolean;
  editDirty: boolean;
  editCanSave: boolean;

  submitCreate: () => Promise<void>;
  handleEditSave: () => Promise<void>;

  updateCategory: (next: IncomeCategory) => void;
  updateStoreId: (next: string) => void;
  updateRange: (next: string) => void;
  clearActionMode: () => void;
  sidebarActions: Array<{
    label: string;
    href?: string;
    disabled?: boolean;
  }>;
  categoryHrefBuilder: (next: IncomeCategory) => string;
}) {
  const {
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
    adapterNote,
    action,

    rows,
    visibleRows,
    selectedRowId,
    onSelectRow,
    selectedRow,
    selectedRawTransactionRows,
    rawStoreOrderRows,
    loading,
    error,
    totalAmount,
    totalNetAmount,
    totalFeeAmount,
    totalTaxAmount,
    totalShippingAmount,
    totalPromotionAmount,
    stageChargeSummary,
    rawStoreOrderCount,
    aggregatedStoreOrderCount,
    storeOrderViewMode,
    setStoreOrderViewMode,

    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRows,
    totalQuantity,
    pageStartRow,
    pageEndRow,

    accounts,
    txCategories,
    formLoading,
    submitLoading,
    panelError,

    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    amount,
    setAmount,
    occurredAt,
    setOccurredAt,
    memo,
    setMemo,

    editAmount,
    setEditAmount,
    editMemo,
    setEditMemo,
    editUiError,
    setEditUiError,
    editUiMessage,
    setEditUiMessage,
    editSaveLoading,
    editAmountValid,
    editMemoTooLong,
    editDirty,
    editCanSave,

    submitCreate,
    handleEditSave,

    updateCategory,
    updateStoreId,
    updateRange,
    clearActionMode,
    sidebarActions,
    categoryHrefBuilder,
  } = args;

  const tabs = navTabs(pageVariant);
  const isRoot = pageVariant === "root";
  const isStoreOrderPage = pageVariant === "store-order";
  const isCashPage = pageVariant === "cash";

  const cashRowsCount = rows.length;
  const cashUniqueAccounts = new Set(
    rows.map((row) => String(row.account || "-"))
  ).size;
  const cashAverageAmount = cashRowsCount > 0 ? totalAmount / cashRowsCount : 0;
  const cashLatestDate = rows[0]?.date || "-";
  const cashSidebarActions = isCashPage
    ? sidebarActions.map((item) => ({
        ...item,
        label: getCashActionLabel(item.label),
      }))
    : sidebarActions;

  const cashStoreOptions = Array.from(
    new Set(
      rows
        .map((row) => String(row.store || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      
                <div className="mt-2">
                  {selectedRow ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="grid gap-3 md:grid-cols-5">
                        <div>
                          <div className="text-xs text-slate-500">Date</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Label</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.label}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Account</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.account}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Store</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.store || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Amount</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{formatIncomeJPY(selectedRow.amount)}</div>
                        </div>
                      </div>
                      {selectedRow.memo ? (
                        <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                          {selectedRow.memo}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      行を選択すると、ここに現金収入明細の概要を表示します。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  Cash Income Rows
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  現金入金明細を一覧で確認し、選択行の編集導線へ接続します。
                </div>
              </div>
              <div className="text-sm text-slate-500">
                全 {totalRows} 行のうち、{pageStartRow} - {pageEndRow} 行を表示
              </div>
            </div>

            {renderTransactionsListTable({
              columns: (
                <div className="grid grid-cols-[120px_1.05fr_1fr_160px_120px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <div>Date</div>
                  <div>Label</div>
                  <div>Memo / Store</div>
                  <div>Account</div>
                  <div className="text-right">Amount</div>
                </div>
              ),
              loading,
              error,
              isEmpty: visibleRows.length === 0,
              rows: visibleRows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => onSelectRow(row.id)}
                  className={`grid grid-cols-[120px_1.05fr_1fr_160px_120px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                    selectedRowId === row.id
                      ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                      : ""
                  }`}
                >
                  <div className="text-slate-600">{row.date}</div>
                  <div>
                    <div className="font-medium text-slate-900">{row.label}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">{row.memo || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.store || "-"}</div>
                  </div>
                  <div className="text-slate-600">{row.account}</div>
                  <div className="text-right font-medium text-slate-900">
                    {formatIncomeJPY(row.amount)}
                  </div>
                </div>
              )),
            })}

            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">1ページあたり</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) as 20 | 50 | 100);
                    setCurrentPage(1);
                  }}
                  className="h-10 min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                >
                  <option value={20}>20 条</option>
                  <option value={50}>50 条</option>
                  <option value={100}>100 条</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  最初
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  前へ
                </button>
                <div className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  次へ
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  最後
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
