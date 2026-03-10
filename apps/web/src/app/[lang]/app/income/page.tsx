"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import {
  createTransaction,
  listTransactionCategories,
  listTransactions,
  type TransactionCategoryItem,
  type TransactionItem,
} from "@/core/transactions/api";
import { listAccounts, type AccountItem } from "@/core/funds/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<TransactionCategoryItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("JPY");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [memo, setMemo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [tx, cat, acc] = await Promise.all([
        listTransactions("INCOME"),
        listTransactionCategories("INCOME"),
        listAccounts(),
      ]);
      setRows(tx.items);
      setCategories(cat.items);
      setAccounts(acc.items);
      if (cat.items[0]) setCategoryId((v) => v || cat.items[0].id);
      if (acc.items[0]) setAccountId((v) => v || acc.items[0].id);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitCreate() {
    try {
      await createTransaction({
        accountId: accountId || null,
        categoryId: categoryId || null,
        type: "SALE",
        direction: "INCOME",
        amount: Number(amount || 0),
        currency,
        occurredAt: new Date(occurredAt).toISOString(),
        memo,
      });
      setDrawerOpen(false);
      setAmount("0");
      setMemo("");
      await load();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }

  const columns: DataTableColumn<TransactionItem>[] = useMemo(
    () => [
      { key: "occurredAt", title: "日付", render: (r) => new Date(r.occurredAt).toLocaleString("ja-JP") },
      { key: "category", title: "カテゴリ", render: (r) => r.categoryName ?? "-" },
      { key: "account", title: "口座", render: (r) => r.accountName ?? "-" },
      { key: "store", title: "店舗", render: (r) => r.storeName ?? "-" },
      {
        key: "amount",
        title: "金額",
        render: (r) => <div className="font-semibold text-emerald-700">{yen(r.amount)}</div>,
      },
      { key: "memo", title: "メモ", render: (r) => r.memo ?? "-" },
    ],
    []
  );

  return (
    <>
      <CrudPageShell
        title="収入"
        description="売上・その他収入を記録します。"
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
          >
            新規収入
          </button>
        }
        filters={
          <FilterBar>
            <div className="text-sm text-slate-500">収入一覧（最新順）</div>
          </FilterBar>
        }
      >
        {error ? (
          <ErrorState description={error} />
        ) : loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="収入データがありません"
            description="最初の収入を登録してください。"
            action={
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                収入を作成
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={drawerOpen} title="新規収入" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">カテゴリ</div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">口座</div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            >
              <option value="">未設定</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">金額</div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">日付</div>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">メモ</div>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitCreate}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              保存
            </button>
          </div>
        </div>
      </CreateEditDrawer>
    </>
  );
}
