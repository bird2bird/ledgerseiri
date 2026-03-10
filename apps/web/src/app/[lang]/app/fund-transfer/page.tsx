"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { RowActions } from "@/components/crud/RowActions";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";
import { ErrorState } from "@/components/crud/ErrorState";
import { EmptyState } from "@/components/crud/EmptyState";
import { createFundTransfer, listAccounts, listFundTransfers, type AccountItem, type FundTransferItem } from "@/core/funds/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<FundTransferItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("JPY");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [memo, setMemo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [transferData, accountData] = await Promise.all([listFundTransfers(), listAccounts()]);
      setRows(transferData.items);
      setAccounts(accountData.items);
      if (accountData.items.length >= 2) {
        setFromAccountId((v) => v || accountData.items[0].id);
        setToAccountId((v) => v || accountData.items[1].id);
      }
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
      await createFundTransfer({
        fromAccountId,
        toAccountId,
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

  const columns: DataTableColumn<FundTransferItem>[] = useMemo(
    () => [
      { key: "from", title: "振替元", render: (r) => <div className="font-medium text-slate-900">{r.fromAccountName}</div> },
      { key: "to", title: "振替先", render: (r) => r.toAccountName },
      { key: "amount", title: "金額", render: (r) => yen(r.amount), className: "whitespace-nowrap" },
      { key: "currency", title: "通貨", render: (r) => r.currency },
      { key: "occurredAt", title: "日付", render: (r) => new Date(r.occurredAt).toLocaleString("ja-JP") },
      { key: "memo", title: "メモ", render: (r) => r.memo ?? "-" },
      {
        key: "actions",
        title: "操作",
        render: () => (
          <RowActions
            onEdit={() => alert("編集は Step 32A-2 で接続します")}
            onDelete={() => setDeleteOpen(true)}
          />
        ),
      },
    ],
    []
  );

  return (
    <>
      <CrudPageShell
        title="資金移動"
        description="口座間の資金移動を記録します。"
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
          >
            新規振替
          </button>
        }
        filters={<FilterBar><div className="text-sm text-slate-500">一覧は最新順で表示されます。</div></FilterBar>}
      >
        {error ? (
          <ErrorState description={error} />
        ) : loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="資金移動データがありません"
            description="最初の振替を作成してください。"
            action={
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                振替を作成
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={drawerOpen} title="新規振替" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">振替元</div>
            <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">振替先</div>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">金額</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">日付</div>
            <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">メモ</div>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={submitCreate} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">
              保存
            </button>
          </div>
        </div>
      </CreateEditDrawer>

      <DeleteConfirmDialog
        open={deleteOpen}
        description="削除 API は Step 32A-2 で接続します。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          alert("削除は Step 32A-2 で接続します");
        }}
      />
    </>
  );
}
