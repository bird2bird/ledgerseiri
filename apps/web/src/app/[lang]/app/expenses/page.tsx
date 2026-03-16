"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createTransactionsContext,
  fetchExpensesPageData,
  normalizeExpenseCategoryParam,
  type ExpenseCategory,
  type ExpenseRow,
} from "@/core/transactions/transactions";
import {
  createTransaction,
  listTransactionCategories,
  updateTransaction,
    type TransactionCategoryItem,
} from "@/core/transactions/api";
import { listAccounts, type AccountItem } from "@/core/funds/api";
import { TransactionsPageSidebar } from "@/components/app/transactions/TransactionsPageSidebar";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import { TransactionsEditFeedback } from "@/components/app/transactions/TransactionsEditFeedback";
import { TransactionsEditActions } from "@/components/app/transactions/TransactionsEditActions";
import { TransactionsEditAmountField } from "@/components/app/transactions/TransactionsEditAmountField";
import { TransactionsEditMemoField } from "@/components/app/transactions/TransactionsEditMemoField";
import { TransactionsEditInfoStack } from "@/components/app/transactions/TransactionsEditInfoStack";
import { TransactionsStandardEditBodyShell } from "@/components/app/transactions/TransactionsStandardEditBodyShell";
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

const CATEGORY_ITEMS: ExpenseCategory[] = ["all", "advertising", "logistics", "payroll", "other"];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  all: "全カテゴリ",
  advertising: "広告費",
  logistics: "物流費",
  payroll: "給与",
  other: "その他",
};

function pageTitle(category: ExpenseCategory) {
  if (category === "all") return "支出管理";
  return `支出管理 · ${CATEGORY_LABELS[category]}`;
}

function fmtJPY(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
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

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const action = readTransactionsActionMode(searchParams);
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);

  const category = normalizeExpenseCategoryParam(searchParams.get("category"));
  const isDashboard = isDashboardSource(from);

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [txCategories, setTxCategories] = useState<TransactionCategoryItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
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
        category,
      });

      const res = await fetchExpensesPageData(category, ctx);
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
  }, [from, storeId, range, category]);

  useEffect(() => {
    if (action !== "create") return;

    let mounted = true;
    setFormLoading(true);
    setPanelError("");

    Promise.all([listAccounts(), listTransactionCategories("EXPENSE")])
      .then(([accountsRes, categoriesRes]) => {
        if (!mounted) return;
        setAccounts(accountsRes.items ?? []);
        setTxCategories(categoriesRes.items ?? []);

        if ((accountsRes.items ?? []).length > 0) {
          setAccountId((v) => v || accountsRes.items[0].id);
        }
        if ((categoriesRes.items ?? []).length > 0) {
          setCategoryId((v) => v || categoriesRes.items[0].id);
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

        await updateTransaction(selectedRow.id, {
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

const totalAmount = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  function updateCategory(next: ExpenseCategory) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "category", next, "all");
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

      await createTransaction({
        accountId: accountId || null,
        categoryId: categoryId || null,
        type: "EXPENSE_MANUAL",
        direction: "EXPENSE",
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

  const sidebarActions = [
    { label: "新規支出", href: buildCurrentPageActionHref("create") },
    { label: "CSV取込", href: buildCurrentPageActionHref("import") },
    { label: "編集", href: buildCurrentPageActionHref("edit"), disabled: !selectedRowId },
    { label: "カテゴリ設定", href: buildCurrentPageActionHref("category-settings") },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">{pageTitle(category)}</div>
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
            <div className="text-sm text-slate-500">Category</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{CATEGORY_LABELS[category]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Category Filters</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_ITEMS.map((item) => {
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
                {CATEGORY_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      {action === "create" ? (
        <TransactionsInlineActionPanel title="新規支出を登録" description="既存の /api/transactions contract を使って手動支出を追加します。" onClose={clearActionMode}>
          {formLoading ? (
            <div className="text-sm text-slate-500">loading...</div>
          ) : (
            <div className="space-y-4">
              {panelError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{panelError}</div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">口座</div>
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm">
                    <option value="">未選択</option>
                    {accounts.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">カテゴリ</div>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm">
                    <option value="">未選択</option>
                    {txCategories.map((item) => (
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
        <TransactionsInlineActionPanel title="支出データを取込" description="次段階で import center と接続します。" onClose={clearActionMode}>
          <div className="text-sm text-slate-600">
            CSV 取込導線は action mode に統合済みです。次段階で
            <span className="mx-1 font-medium">/app/data/import?module=expenses</span>
            への導線整理を行います。
          </div>
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "edit" ? (
          <TransactionsInlineActionPanel title="支出データを編集" description="選択中の行を初期値として、編集フォーム skeleton を確認できます。" onClose={clearActionMode}>
            {selectedRow ? (
                <TransactionsStandardEditBodyShell
                  info={(
                    <TransactionsEditInfoStack
                      preview={(
                                        <TransactionsEditPreviewCard
                                          title="編集対象プレビュー"
                                          items={[
                                            { label: "Date", value: selectedRow.date },
                                            { label: "Label", value: selectedRow.label },
                                            { label: "Category", value: CATEGORY_LABELS[selectedRow.category] },
                                            { label: "Account", value: selectedRow.account },
                                            { label: "Store", value: selectedRow.store },
                                            { label: "Amount", value: fmtJPY(selectedRow.amount) },
                                          ]}
                                        />
                      )}
                      meta={(
                                        <TransactionsReadonlyMetaGrid
                                          items={[
                                            { label: "Date", value: selectedRow.date },
                                            { label: "Category", value: CATEGORY_LABELS[selectedRow.category] },
                                            { label: "Account", value: selectedRow.account },
                                            { label: "Store", value: selectedRow.store },
                                          ]}
                                        />
                      )}
                    />
                  )}
                  primaryFields={(
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
                        <div className="mb-1 text-sm font-medium text-slate-700">ラベル</div>
                        <input
                          value={selectedRow.label}
                          readOnly
                          className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                  memoField={(
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
                  )}
                  feedback={(
                    <TransactionsEditFeedback
                      dirty={editDirty}
                      error={editUiError}
                      message={editUiMessage}
                      banner="Step41M-C: real save 接続済み。保存中状態・成功メッセージ自動クリア・再同期 UX を追加しています。"
                    />
                  )}
                  actions={(
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
                  )}
                />
            ) : (
              <div className="text-sm text-slate-600">編集するには、先に一覧から 1 行選択してください。</div>
            )}
          </TransactionsInlineActionPanel>
        ) : null}

        {action === "category-settings" ? (
        <TransactionsInlineActionPanel title="カテゴリ設定" description="支出カテゴリ運用への導線です。" onClose={clearActionMode}>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${lang}/app/settings/categories`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              カテゴリ設定を開く
            </Link>
            <Link href={`/${lang}/app/data/import?module=expenses`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              取込設定を確認
            </Link>
          </div>
        </TransactionsInlineActionPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <TransactionsPageSidebar metricLabel="Visible Expense" metricValue={fmtJPY(totalAmount)} rowsCount={rows.length} actionItems={sidebarActions} />

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Expense Rows</div>
          <div className="mt-1 text-sm text-slate-500">query → state → context → adapter → render</div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Selected Row</div>
              {selectedRow ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">ID</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.id}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Date</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Label</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.label}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Category</div><div className="mt-1 text-sm font-medium text-slate-900">{CATEGORY_LABELS[selectedRow.category]}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Account</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.account}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Store</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.store}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Amount</div><div className="mt-1 text-sm font-medium text-slate-900">{fmtJPY(selectedRow.amount)}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Memo</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.memo || "-"}</div></div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-500">行を選択すると、ここに支出明細の要約が表示されます。</div>
              )}
            </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[120px_1fr_140px_140px_120px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Date</div>
              <div>Label</div>
              <div>Category</div>
              <div>Account</div>
              <div className="text-right">Amount</div>
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
                  <div className="text-slate-600">{CATEGORY_LABELS[row.category]}</div>
                  <div className="text-slate-600">{row.account}</div>
                  <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
