"use client";

import React from "react";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";

export type CashAccountOption = {
  id: string;
  name: string;
  type?: string | null;
  currency?: string | null;
};

export type CashIncomeDrawerProps = {
  mode: "create" | "edit";
  open: boolean;
  row: IncomeRow | null;
  onClose: () => void;

  accounts: CashAccountOption[];
  formLoading: boolean;
  submitLoading: boolean;
  panelError: string;
  setPanelError: (next: string) => void;

  accountId: string;
  setAccountId: (next: string) => void;
  amount: string;
  setAmount: (next: string) => void;
  occurredAt: string;
  setOccurredAt: (next: string) => void;
  memo: string;
  setMemo: (next: string) => void;
  submitCreate: () => Promise<void>;

  editAmount: string;
  setEditAmount: (next: string) => void;
  editMemo: string;
  setEditMemo: (next: string) => void;
  editUiError: string;
  editUiMessage: string;
  editSaveLoading: boolean;
  editCanSave: boolean;
  deleteLoading: boolean;
  handleEditSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
};

export function CashIncomeDrawer(props: CashIncomeDrawerProps) {
  const {
    mode,
    open,
    row,
    onClose,
    accounts,
    formLoading,
    submitLoading,
    panelError,
    setPanelError,
    accountId,
    setAccountId,
    amount,
    setAmount,
    occurredAt,
    setOccurredAt,
    memo,
    setMemo,
    submitCreate,
    editAmount,
    setEditAmount,
    editMemo,
    setEditMemo,
    editUiError,
    editUiMessage,
    editSaveLoading,
    editCanSave,
    deleteLoading,
    handleEditSave,
    handleDelete,
  } = props;

  if (!open) return null;

  const isCreate = mode === "create";
  const workingAmount = isCreate ? amount : editAmount;
  const parsedAmount = Number(workingAmount || 0);
  const amountValid = workingAmount !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const createCanSubmit =
    !!accountId && amountValid && !!occurredAt && !submitLoading && !formLoading;

  const currentError = isCreate ? panelError : editUiError;
  const saving = isCreate ? submitLoading : editSaveLoading || deleteLoading;
  const canSubmit = isCreate ? createCanSubmit : editCanSave && !editSaveLoading;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  function closeDrawer() {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    onClose();
  }

  async function submit() {
    if (isCreate) {
      setPanelError("");

      if (!accountId) {
        setPanelError("口座を選択してください。");
        return;
      }
      if (!amountValid) {
        setPanelError("金額は 0 より大きい数値を入力してください。");
        return;
      }
      if (!occurredAt) {
        setPanelError("発生日を入力してください。");
        return;
      }

      await submitCreate();
      onClose();
      return;
    }

    await handleEditSave();
  }

  function submitDelete() {
    if (isCreate || !row || deleteLoading || editSaveLoading) return;
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (isCreate || !row || deleteLoading) return;

    await handleDelete();
    setDeleteConfirmOpen(false);
    onClose();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close cash income drawer backdrop"
        onClick={closeDrawer}
        className="fixed inset-y-0 right-0 left-[260px] z-40 bg-slate-950/30 backdrop-blur-[1px]"
      />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-[720px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-slate-900">
                {isCreate ? "新規現金収入を登録" : "現金収入を編集"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {isCreate
                  ? "現金入金データを手動で追加します。"
                  : "選択した現金入金データの金額とメモを編集します。"}
              </div>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              閉じる
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          {currentError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {currentError}
            </div>
          ) : null}

          {editUiMessage && !isCreate ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {editUiMessage}
            </div>
          ) : null}

          {!isCreate && row ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-sm font-medium text-slate-900">選択中の明細</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="mt-1 font-semibold text-slate-900">{row.date}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Account</div>
                  <div className="mt-1 font-semibold text-slate-900">{row.account}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Current Amount</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {formatIncomeJPY(row.amount)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {isCreate ? (
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">口座</div>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={formLoading || submitLoading}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
                >
                  <option value="">未選択</option>
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">口座</div>
                <div className="flex h-11 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900">
                  {row?.account || "-"}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">カテゴリ</div>
              <div className="flex h-11 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900">
                現金収入（自動）
              </div>
              <div className="mt-2 text-xs text-slate-500">
                現金収入ワークスペースではカテゴリを自動設定します。
              </div>
            </div>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">金額</div>
              <input
                value={isCreate ? amount : editAmount}
                onChange={(e) =>
                  isCreate ? setAmount(e.target.value) : setEditAmount(e.target.value)
                }
                disabled={formLoading || saving}
                inputMode="numeric"
                placeholder="例: 12000"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">発生日</div>
              {isCreate ? (
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  disabled={formLoading || submitLoading}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
                />
              ) : (
                <div className="flex h-11 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900">
                  {row?.date || "-"}
                </div>
              )}
            </label>
          </div>

          <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">メモ</div>
            <textarea
              value={isCreate ? memo : editMemo}
              onChange={(e) =>
                isCreate ? setMemo(e.target.value) : setEditMemo(e.target.value)
              }
              disabled={formLoading || saving}
              rows={5}
              placeholder="例: 店頭現金売上 / イベント売上 / 現金補正入金"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 disabled:bg-slate-50"
            />
          </label>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-sm font-medium text-slate-900">
              {isCreate ? "登録プレビュー" : "編集プレビュー"}
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500">Amount</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {amountValid ? formatIncomeJPY(parsedAmount) : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Account</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {isCreate
                    ? accounts.find((item) => item.id === accountId)?.name || "-"
                    : row?.account || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Category</div>
                <div className="mt-1 font-semibold text-slate-900">
                  現金収入（自動）
                </div>
              </div>
            </div>
          </div>

          {deleteConfirmOpen && !isCreate && row ? (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cash-delete-confirm-title"
              className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div
                    id="cash-delete-confirm-title"
                    className="text-base font-semibold text-rose-900"
                  >
                    現金収入明細を削除しますか？
                  </div>
                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    この操作は取り消せません。削除後は一覧から除外されます。
                  </p>
                </div>
                <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700">
                  削除確認
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-rose-100 bg-white/80 p-4 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">発生日</div>
                  <div className="mt-1 font-semibold text-slate-900">{row.date || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">口座</div>
                  <div className="mt-1 font-semibold text-slate-900">{row.account || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">金額</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {formatIncomeJPY(row.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">メモ</div>
                  <div className="mt-1 line-clamp-2 font-semibold text-slate-900">
                    {row.memo || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleteLoading}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deleteLoading}
                  className="rounded-xl border border-rose-600 bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteLoading ? "削除中..." : "削除する"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            {!isCreate ? (
              <button
                type="button"
                onClick={submitDelete}
                disabled={deleteLoading || editSaveLoading}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteLoading ? "削除中..." : "削除"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || deleteLoading || deleteConfirmOpen}
                className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
