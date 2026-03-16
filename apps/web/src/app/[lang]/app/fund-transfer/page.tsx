"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createTransactionsContext,
  fetchFundTransferPageData,
  normalizeTransferStatusParam,
  type TransferRow,
  type TransferStatus,
} from "@/core/transactions/transactions";
import { createFundTransfer, listAccounts, updateFundTransfer,
    type AccountItem } from "@/core/funds/api";
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
  buildTransactionsActionHref,
  clearTransactionsActionHref,
  readTransactionsActionMode,
} from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  isDashboardSource,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const STATUS_ITEMS: TransferStatus[] = ["all", "scheduled", "completed"];

const STATUS_LABELS: Record<TransferStatus, string> = {
  all: "すべて",
  scheduled: "予定",
  completed: "完了",
};

function fmtJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function nowLocalInputValue() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

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

  const [rows, setRows] = useState<TransferRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue());
  const [memo, setMemo] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editUiError, setEditUiError] = useState("");
  const [editUiMessage, setEditUiMessage] = useState("");
  const [editSaveLoading, setEditSaveLoading] = useState(false);

  async function loadRows() {
    setLoading(true);
    setError("");

    try {
      const ctx = createTransactionsContext({
        from,
        storeId,
        range,
        status,
      });

      const res = await fetchFundTransferPageData(status, ctx);
      setRows(res.rows);
      setAdapterNote(res.meta.note ?? "");
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [from, storeId, range, status]);

  useEffect(() => {
    if (action !== "create") return;

    let mounted = true;
    setFormLoading(true);
    setPanelError("");

    listAccounts()
      .then((res) => {
        if (!mounted) return;
        setAccounts(res.items ?? []);
        if ((res.items ?? []).length >= 2) {
          setFromAccountId((v) => v || res.items[0].id);
          setToAccountId((v) => v || res.items[1].id);
        } else if ((res.items ?? []).length === 1) {
          setFromAccountId((v) => v || res.items[0].id);
        }
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setPanelError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (mounted) setFormLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [action]);

  useEffect(() => {
    if (action !== "edit" || !selectedRow) return;
    setEditAmount(String(selectedRow.amount ?? ""));
    setEditMemo(selectedRow.memo ?? "");
    setEditUiError("");
    setEditUiMessage("");
    setEditSaveLoading(false);
  }, [action, selectedRow]);

  const editAmountNumber = Number(editAmount || 0);
  const editAmountValid = Number.isFinite(editAmountNumber) && editAmountNumber > 0;
  const editMemoTooLong = editMemo.length > 500;
  const editDirty = !!selectedRow && (
    String(editAmount) !== String(selectedRow.amount ?? "") ||
    String(editMemo) !== String(selectedRow.memo ?? "")
  );
  const editCanSave = !!selectedRow && editAmountValid && !editMemoTooLong && editDirty;

  const totalAmount = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  function updateStatus(next: TransferStatus) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "status", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function buildCurrentPageActionHref(nextAction: string) {
    return buildTransactionsActionHref(pathname, searchParams, nextAction);
  }

  function clearActionMode() {
    router.replace(clearTransactionsActionHref(pathname, searchParams));
  }

  async function submitCreate() {
    try {
      setSubmitLoading(true);
      setPanelError("");

      await createFundTransfer({
        fromAccountId,
        toAccountId,
        amount: Number(amount || 0),
        currency: "JPY",
        occurredAt: new Date(occurredAt).toISOString(),
        memo,
      });

      setAmount("");
      setMemo("");
      setOccurredAt(nowLocalInputValue());
      clearActionMode();
      await loadRows();
    } catch (e: unknown) {
      setPanelError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleEditSave() {
    setEditUiError("");
    setEditUiMessage("");

    if (!selectedRow) {
      setEditUiError("編集対象が選択されていません。");
      return;
    }
    if (!editAmountValid) {
      setEditUiError("金額は 0 より大きい数値を入力してください。");
      return;
    }
    if (editMemoTooLong) {
      setEditUiError("メモは 500 文字以内で入力してください。");
      return;
    }
    if (!editDirty) {
      setEditUiError("変更内容がありません。");
      return;
    }

    try {
      setEditSaveLoading(true);

      await updateFundTransfer(selectedRow.id, {
        amount: Number(editAmount),
        memo: editMemo,
      });

      const preservedId = selectedRow.id;
      await loadRows();
      setSelectedRowId(preservedId);

      setEditAmount(String(Number(editAmount)));
      setEditMemo(editMemo);
      setEditUiError("");
      setEditUiMessage("保存しました。");
      setTimeout(() => {
        setEditUiMessage("");
      }, 2000);
    } catch (e: unknown) {
      setEditUiMessage("");
      setEditUiError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditSaveLoading(false);
    }
  }

  const sidebarActions = [
    { label: "新規振替", href: buildCurrentPageActionHref("create") },
    { label: "CSV取込", href: buildCurrentPageActionHref("import") },
    { label: "編集", href: buildCurrentPageActionHref("edit"), disabled: !selectedRowId },
    { label: "再同期", href: buildCurrentPageActionHref("resync"), disabled: !selectedRowId },
    { label: "明細確認", href: buildCurrentPageActionHref("details") },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">資金移動</div>
            <div className="mt-2 text-sm text-slate-500">
              口座間の資金移動を確認し、状態別に整理しながら次アクションへ進めます。
            </div>
          </div>

          {isDashboard ? (
            <Link href={`/${lang}/app`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawFrom ?? from}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawStoreId ?? storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawRange ?? range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{STATUS_LABELS[status]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Transfer Status</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_ITEMS.map((item) => {
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
                {STATUS_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      {action === "create" ? (
        <TransactionsInlineActionPanel title="新規振替を登録" description="既存の /api/fund-transfer contract を使って口座振替を追加します。" onClose={clearActionMode}>
          {formLoading ? (
            <div className="text-sm text-slate-500">loading...</div>
          ) : (
            <div className="space-y-4">
              {panelError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{panelError}</div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">振替元口座</div>
                  <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm">
                    <option value="">未選択</option>
                    {accounts.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">振替先口座</div>
                  <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm">
                    <option value="">未選択</option>
                    {accounts.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">金額</div>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm" />
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">発生日</div>
                  <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm" />
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-slate-700">メモ</div>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm" />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={clearActionMode} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  キャンセル
                </button>
                <button type="button" onClick={submitCreate} disabled={submitLoading} className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {submitLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          )}
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "import" ? (
        <TransactionsInlineActionPanel title="振替データを取込" description="次段階で import center と接続します。" onClose={clearActionMode}>
          <Link href={`/${lang}/app/data/import?module=fund-transfer`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            import center を開く
          </Link>
        </TransactionsInlineActionPanel>
      ) : null}

              {action === "edit" ? (
            <TransactionsInlineActionPanel title="振替データを編集" description="選択中の行を初期値として、real save 接続済みの編集フォームを確認できます。" onClose={clearActionMode}>
            {selectedRow ? (
              <div className="space-y-4">
                <TransactionsEditInfoStack
                  preview={(
                                      <TransactionsEditPreviewCard
                                        title="編集対象プレビュー"
                                        items={[
                                          { label: "Date", value: selectedRow.date },
                                          { label: "Status", value: STATUS_LABELS[selectedRow.status] },
                                          { label: "From", value: selectedRow.fromAccount },
                                          { label: "To", value: selectedRow.toAccount },
                                          { label: "Amount", value: fmtJPY(selectedRow.amount) },
                                          { label: "Memo", value: selectedRow.memo || "-" },
                                        ]}
                                      />
                  )}
                  meta={(
                                      <TransactionsReadonlyMetaGrid
                                        items={[
                                          { label: "Date", value: selectedRow.date },
                                          { label: "Status", value: STATUS_LABELS[selectedRow.status] },
                                          { label: "From", value: selectedRow.fromAccount },
                                          { label: "To", value: selectedRow.toAccount },
                                        ]}
                                      />
                  )}
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
                  onSave={handleEditSave}
                  resetDisabled={editSaveLoading}
                  saveDisabled={!editCanSave || editSaveLoading}
                  saveLoading={editSaveLoading}
                />
              </div>
            ) : (
              <div className="text-sm text-slate-600">編集するには、先に一覧から 1 行選択してください。</div>
            )}
          </TransactionsInlineActionPanel>
        ) : null}

{action === "resync" ? (
          <TransactionsInlineActionPanel title="再同期" description="選択中の振替行を対象として、次段階で再同期処理へ接続します。" onClose={clearActionMode}>
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
                      <div className="mt-1 text-sm font-medium text-slate-900">{STATUS_LABELS[selectedRow.status]}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">Amount</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">{fmtJPY(selectedRow.amount)}</div>
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
              <div className="text-sm text-slate-600">再同期するには、先に一覧から 1 行選択してください。</div>
            )}
          </TransactionsInlineActionPanel>
        ) : null}

        {action === "details" ? (
        <TransactionsInlineActionPanel title="残高・明細確認" description="関連する残高ページへ移動できます。" onClose={clearActionMode}>
          <Link href={`/${lang}/app/account-balances`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            口座残高を開く
          </Link>
        </TransactionsInlineActionPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <TransactionsPageSidebar metricLabel="Visible Transfer Total" metricValue={fmtJPY(totalAmount)} rowsCount={rows.length} actionItems={sidebarActions} />

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Transfer Rows</div>
          <div className="mt-1 text-sm text-slate-500">query → state → context → adapter → render</div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Selected Row</div>
              {selectedRow ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">ID</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.id}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Date</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">From</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.fromAccount}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">To</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.toAccount}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Status</div><div className="mt-1 text-sm font-medium text-slate-900">{STATUS_LABELS[selectedRow.status]}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Amount</div><div className="mt-1 text-sm font-medium text-slate-900">{fmtJPY(selectedRow.amount)}</div></div>
                  <div className="sm:col-span-2"><div className="text-xs uppercase tracking-wide text-slate-500">Memo</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.memo || "-"}</div></div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-500">行を選択すると、ここに振替明細の要約が表示されます。</div>
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
                    onClick={() => setSelectedRowId(row.id)}
                     className={`grid grid-cols-[120px_1fr_1fr_120px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                      selectedRowId === row.id
                        ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                        : ""
                    }`}
>
                  <div className="text-slate-600">{row.date}</div>
                  <div className="text-slate-600">{row.fromAccount}</div>
                  <div className="text-slate-600">{row.toAccount}</div>
                  <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
                  <div className="text-slate-600">{STATUS_LABELS[row.status]}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
