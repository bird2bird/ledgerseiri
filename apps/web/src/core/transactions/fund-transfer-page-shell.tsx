import React from "react";
import Link from "next/link";
import type {
  TransferRow,
  TransferStatus,
} from "@/core/transactions/transactions";
import type { AccountItem } from "@/core/funds/api";
import { TransactionsPageSidebar } from "@/components/app/transactions/TransactionsPageSidebar";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import { TransactionsEditFeedback } from "@/components/app/transactions/TransactionsEditFeedback";
import { TransactionsEditActions } from "@/components/app/transactions/TransactionsEditActions";
import { TransactionsEditAmountField } from "@/components/app/transactions/TransactionsEditAmountField";
import { TransactionsEditMemoField } from "@/components/app/transactions/TransactionsEditMemoField";
import { TransactionsEditInfoStack } from "@/components/app/transactions/TransactionsEditInfoStack";
import { TransactionsEditPreviewCard } from "@/components/app/transactions/TransactionsEditPreviewCard";
import { TransactionsReadonlyMetaGrid } from "@/components/app/transactions/TransactionsReadonlyMetaGrid";
import {
  FUND_TRANSFER_STATUS_ITEMS,
  FUND_TRANSFER_STATUS_LABELS,
  getFundTransferPageTitle,
  formatFundTransferJPY,
} from "@/core/transactions/fund-transfer-page-constants";

export function renderFundTransferPageShell(args: {
  lang: string;
  isDashboard: boolean;
  rawFrom: string | null;
  from: string;
  rawStoreId: string | null;
  storeId: string;
  rawRange: string | null;
  range: string;
  status: TransferStatus;
  adapterNote: string;
  action: string;

  rows: TransferRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: TransferRow | null;
  loading: boolean;
  error: string;
  totalAmount: number;

  accounts: AccountItem[];
  formLoading: boolean;
  submitLoading: boolean;
  panelError: string;

  fromAccountId: string;
  setFromAccountId: (value: string) => void;
  toAccountId: string;
  setToAccountId: (value: string) => void;
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

  updateStatus: (next: TransferStatus) => void;
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
    status,
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
    formLoading,
    submitLoading,
    panelError,

    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
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

    updateStatus,
    clearActionMode,
    sidebarActions,
  } = args;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              {getFundTransferPageTitle()}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              口座間の資金移動を確認し、状態別に整理しながら次アクションへ進めます。
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
            <div className="text-sm text-slate-500">Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {FUND_TRANSFER_STATUS_LABELS[status]}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Transfer Status</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FUND_TRANSFER_STATUS_ITEMS.map((item) => {
            const active = status === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateStatus(item)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {FUND_TRANSFER_STATUS_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      {action === "create" ? (
        <TransactionsInlineActionPanel
          title="新規振替を登録"
          description="既存の /api/fund-transfer contract を使って口座振替を追加します。"
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
                  <div className="mb-1 text-sm font-medium text-slate-700">振替元口座</div>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
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
                  <div className="mb-1 text-sm font-medium text-slate-700">振替先口座</div>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
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
          title="振替データを取込"
          description="次段階で import center と接続します。"
          onClose={clearActionMode}
        >
          <Link
            href={`/${lang}/app/data/import?module=fund-transfer`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            import center を開く
          </Link>
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "edit" ? (
        <TransactionsInlineActionPanel
          title="振替データを編集"
          description="選択中の行を初期値として、real save 接続済みの編集フォームを確認できます。"
          onClose={clearActionMode}
        >
          {selectedRow ? (
            <div className="space-y-4">
              <TransactionsEditInfoStack
                preview={
                  <TransactionsEditPreviewCard
                    title="編集対象プレビュー"
                    items={[
                      { label: "Date", value: selectedRow.date },
                      { label: "Status", value: FUND_TRANSFER_STATUS_LABELS[selectedRow.status] },
                      { label: "From", value: selectedRow.fromAccount },
                      { label: "To", value: selectedRow.toAccount },
                      { label: "Amount", value: formatFundTransferJPY(selectedRow.amount) },
                      { label: "Memo", value: selectedRow.memo || "-" },
                    ]}
                  />
                }
                meta={
                  <TransactionsReadonlyMetaGrid
                    items={[
                      { label: "Date", value: selectedRow.date },
                      { label: "Status", value: FUND_TRANSFER_STATUS_LABELS[selectedRow.status] },
                      { label: "From", value: selectedRow.fromAccount },
                      { label: "To", value: selectedRow.toAccount },
                    ]}
                  />
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <TransactionsEditAmountField
                    value={editAmount}
                    onChange={(value) => {
                      setEditAmount(value);
                      setEditUiError("");
                      setEditUiMessage("");
                    }}
                    invalid={!editAmountValid}
                  />
                </div>

                <div>
                  <TransactionsEditMemoField
                    value={editMemo}
                    onChange={(value) => {
                      setEditMemo(value);
                      setEditUiError("");
                      setEditUiMessage("");
                    }}
                    tooLong={editMemoTooLong}
                    maxLength={500}
                  />
                </div>
              </div>

              <TransactionsEditFeedback
                dirty={editDirty}
                error={editUiError}
                message={editUiMessage}
                banner="Step41N-C: real save 接続済み。保存中状態・成功メッセージ自動クリア・再同期 UX を追加しています。"
              />

              <TransactionsEditActions
                onReset={() => {
                  setEditAmount(String(selectedRow.amount ?? ""));
                  setEditMemo(selectedRow.memo ?? "");
                  setEditUiError("");
                  setEditUiMessage("");
                }}
                onSave={() => {
                  void handleEditSave();
                }}
                resetDisabled={editSaveLoading}
                saveDisabled={!editCanSave || editSaveLoading}
                saveLoading={editSaveLoading}
              />
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              編集するには、先に一覧から 1 行選択してください。
            </div>
          )}
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "resync" ? (
        <TransactionsInlineActionPanel
          title="再同期"
          description="選択中の振替行を対象として、次段階で再同期処理へ接続します。"
          onClose={clearActionMode}
        >
          {selectedRow ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">再同期対象プレビュー</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">From</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.fromAccount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">To</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.toAccount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{FUND_TRANSFER_STATUS_LABELS[selectedRow.status]}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Amount</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{formatFundTransferJPY(selectedRow.amount)}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Memo</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.memo || "-"}</div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                次段階では、ここから transfer sync / reconciliation action を呼び出します。
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              再同期するには、先に一覧から 1 行選択してください。
            </div>
          )}
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "details" ? (
        <TransactionsInlineActionPanel
          title="残高・明細確認"
          description="関連する残高ページへ移動できます。"
          onClose={clearActionMode}
        >
          <Link
            href={`/${lang}/app/account-balances`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            口座残高を開く
          </Link>
        </TransactionsInlineActionPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <TransactionsPageSidebar
          metricLabel="Visible Transfer Total"
          metricValue={formatFundTransferJPY(totalAmount)}
          rowsCount={rows.length}
          actionItems={sidebarActions}
        />

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Transfer Rows</div>
          <div className="mt-1 text-sm text-slate-500">
            query → state → context → adapter → render
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Selected Row</div>
            {selectedRow ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><div className="text-xs uppercase tracking-wide text-slate-500">ID</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.id}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-slate-500">Date</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-slate-500">From</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.fromAccount}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-slate-500">To</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.toAccount}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-slate-500">Status</div><div className="mt-1 text-sm font-medium text-slate-900">{FUND_TRANSFER_STATUS_LABELS[selectedRow.status]}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-slate-500">Amount</div><div className="mt-1 text-sm font-medium text-slate-900">{formatFundTransferJPY(selectedRow.amount)}</div></div>
                <div className="sm:col-span-2"><div className="text-xs uppercase tracking-wide text-slate-500">Memo</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.memo || "-"}</div></div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">
                行を選択すると、ここに振替明細の要約が表示されます。
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[120px_1fr_1fr_120px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Date</div>
              <div>From</div>
              <div>To</div>
              <div className="text-right">Amount</div>
              <div>Status</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : error ? (
              <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => onSelectRow(row.id)}
                  className={`grid grid-cols-[120px_1fr_1fr_120px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                    selectedRowId === row.id
                      ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                      : ""
                  }`}
                >
                  <div className="text-slate-600">{row.date}</div>
                  <div className="text-slate-600">{row.fromAccount}</div>
                  <div className="text-slate-600">{row.toAccount}</div>
                  <div className="text-right font-medium text-slate-900">
                    {formatFundTransferJPY(row.amount)}
                  </div>
                  <div className="text-slate-600">{FUND_TRANSFER_STATUS_LABELS[row.status]}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
