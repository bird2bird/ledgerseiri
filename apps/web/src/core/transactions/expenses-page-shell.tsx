import React from "react";
import Link from "next/link";
import type {
  ExpenseCategory,
  ExpenseRow,
} from "@/core/transactions/transactions";
import type { AccountItem } from "@/core/funds/api";
import type { TransactionCategoryItem } from "@/core/transactions/api";
import { TransactionsPageSidebar } from "@/components/app/transactions/TransactionsPageSidebar";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import { renderTransactionsSelectedSummary } from "@/core/transactions/transactions-selected-summary";
import { renderSharedTransactionEditForm } from "@/core/transactions/transactions-edit-form-shared";
import { renderTransactionsListTable } from "@/core/transactions/transactions-list-shared";
import {
  EXPENSE_CATEGORY_ITEMS,
  EXPENSE_CATEGORY_LABELS,
  getExpensesPageTitle,
  formatExpensesJPY,
} from "@/core/transactions/expenses-page-constants";

export function renderExpensesPageShell(args: {
  lang: string;
  isDashboard: boolean;
  rawFrom: string | null;
  from: string;
  rawStoreId: string | null;
  storeId: string;
  rawRange: string | null;
  range: string;
  category: ExpenseCategory;
  adapterNote: string;
  action: string;

  rows: ExpenseRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: ExpenseRow | null;
  loading: boolean;
  error: string;
  totalAmount: number;

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

  updateCategory: (next: ExpenseCategory) => void;
  clearActionMode: () => void;
  sidebarActions: Array<{
    label: string;
    href?: string;
    disabled?: boolean;
  }>;
}) {
  const {
    lang,
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
    selectedRowId,
    onSelectRow,
    selectedRow,
    loading,
    error,
    totalAmount,

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
    clearActionMode,
    sidebarActions,
  } = args;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              {getExpensesPageTitle(category)}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              支出データの確認、絞り込み、カテゴリ運用を一つの画面で管理します。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${lang}/app`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawFrom ?? from}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawStoreId ?? storeId}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawRange ?? range}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Category</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {EXPENSE_CATEGORY_LABELS[category]}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Category Filters</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXPENSE_CATEGORY_ITEMS.map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateCategory(item)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {EXPENSE_CATEGORY_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      {action === "create" ? (
        <TransactionsInlineActionPanel
          title="新規支出を登録"
          description="既存の /api/transactions contract を使って手動支出を追加します。"
          onClose={clearActionMode}
        >
          {formLoading ? (
            <div className="text-sm text-slate-500">loading...</div>
          ) : (
            <div className="space-y-4">
              {panelError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {panelError}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">口座</div>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  >
                    <option value="">未選択</option>
                    {accounts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">カテゴリ</div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  >
                    <option value="">未選択</option>
                    {txCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">金額</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="numeric"
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">発生日</div>
                  <input
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-slate-700">メモ</div>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={clearActionMode}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void submitCreate().then(() => {
                      clearActionMode();
                    }).catch(() => {});
                  }}
                  disabled={submitLoading}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          )}
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "import" ? (
        <TransactionsInlineActionPanel
          title="支出データを取込"
          description="次段階で import center と接続します。"
          onClose={clearActionMode}
        >
          <div className="text-sm text-slate-600">
            CSV 取込導線は action mode に統合済みです。次段階で
            <span className="mx-1 font-medium">/app/data/import?module=expenses</span>
            への導線整理を行います。
          </div>
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "edit" ? (
        <TransactionsInlineActionPanel
          title="支出データを編集"
          description="選択中の行を初期値として、編集フォーム skeleton を確認できます。"
          onClose={clearActionMode}
        >
          {selectedRow ? (
            renderSharedTransactionEditForm({
              previewItems: [
                { label: "Date", value: selectedRow.date },
                { label: "Label", value: selectedRow.label },
                {
                  label: "Category",
                  value: EXPENSE_CATEGORY_LABELS[selectedRow.category],
                },
                { label: "Account", value: selectedRow.account },
                { label: "Store", value: selectedRow.store },
                { label: "Amount", value: formatExpensesJPY(selectedRow.amount) },
              ],
              metaItems: [
                { label: "Date", value: selectedRow.date },
                {
                  label: "Category",
                  value: EXPENSE_CATEGORY_LABELS[selectedRow.category],
                },
                { label: "Account", value: selectedRow.account },
                { label: "Store", value: selectedRow.store },
              ],
              readonlyLabelValue: selectedRow.label,

              editAmount,
              onEditAmountChange: (value) => {
                setEditAmount(value);
                setEditUiError("");
                setEditUiMessage("");
              },
              editAmountInvalid: !editAmountValid,

              editMemo,
              onEditMemoChange: (value) => {
                setEditMemo(value);
                setEditUiError("");
                setEditUiMessage("");
              },
              editMemoTooLong,
              memoMaxLength: 500,

              dirty: editDirty,
              error: editUiError,
              message: editUiMessage,
              banner: "Step41M-C: real save 接続済み。保存中状態・成功メッセージ自動クリア・再同期 UX を追加しています。",

              onReset: () => {
                setEditAmount(String(selectedRow.amount ?? ""));
                setEditMemo(selectedRow.memo ?? "");
                setEditUiError("");
                setEditUiMessage("");
              },
              onSave: () => {
                void handleEditSave();
              },
              resetDisabled: editSaveLoading,
              saveDisabled: !editCanSave || editSaveLoading,
              saveLoading: editSaveLoading,
            })
          ) : (
            <div className="text-sm text-slate-600">
              編集するには、先に一覧から 1 行選択してください。
            </div>
          )}
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "category-settings" ? (
        <TransactionsInlineActionPanel
          title="カテゴリ設定"
          description="支出カテゴリ運用への導線です。"
          onClose={clearActionMode}
        >
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${lang}/app/settings/categories`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              カテゴリ設定を開く
            </Link>
            <Link
              href={`/${lang}/app/data/import?module=expenses`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              取込設定を確認
            </Link>
          </div>
        </TransactionsInlineActionPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <TransactionsPageSidebar
          metricLabel="Visible Expense"
          metricValue={formatExpensesJPY(totalAmount)}
          rowsCount={rows.length}
          actionItems={sidebarActions}
        />

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Expense Rows</div>
          <div className="mt-1 text-sm text-slate-500">
            query → state → context → adapter → render
          </div>

          {renderTransactionsSelectedSummary({
            title: "Selected Row",
            selected: !!selectedRow,
            emptyMessage: "行を選択すると、ここに支出明細の要約が表示されます。",
            items: selectedRow
              ? [
                  { label: "ID", value: selectedRow.id },
                  { label: "Date", value: selectedRow.date },
                  { label: "Label", value: selectedRow.label },
                  {
                    label: "Category",
                    value: EXPENSE_CATEGORY_LABELS[selectedRow.category],
                  },
                  { label: "Account", value: selectedRow.account },
                  { label: "Store", value: selectedRow.store },
                  { label: "Amount", value: formatExpensesJPY(selectedRow.amount) },
                  { label: "Memo", value: selectedRow.memo || "-" },
                ]
              : [],
          })}

          {renderTransactionsListTable({
            columns: (
              <div className="grid grid-cols-[120px_1fr_140px_140px_120px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                <div>Date</div>
                <div>Label</div>
                <div>Category</div>
                <div>Account</div>
                <div className="text-right">Amount</div>
              </div>
            ),
            loading,
            error,
            isEmpty: rows.length === 0,
            rows: rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onSelectRow(row.id)}
                className={`grid grid-cols-[120px_1fr_140px_140px_120px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                  selectedRowId === row.id
                    ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                    : ""
                }`}
              >
                <div className="text-slate-600">{row.date}</div>
                <div>
                  <div className="font-medium text-slate-900">{row.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.store}</div>
                </div>
                <div className="text-slate-600">{EXPENSE_CATEGORY_LABELS[row.category]}</div>
                <div className="text-slate-600">{row.account}</div>
                <div className="text-right font-medium text-slate-900">
                  {formatExpensesJPY(row.amount)}
                </div>
              </div>
            )),
          })}
        </div>
      </div>
    </div>
  );
}
