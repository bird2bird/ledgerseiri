"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { createPayment, listInvoices, listPayments, type InvoiceItem, type PaymentItem } from "@/core/invoices/api";
import { listAccounts, type AccountItem } from "@/core/funds/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<PaymentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("JPY");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [memo, setMemo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [payData, invData, accData] = await Promise.all([
        listPayments(),
        listInvoices(),
        listAccounts(),
      ]);
      setRows(payData.items);
      const payable = invData.items.filter((x) => x.balance > 0);
      setInvoices(payable);
      setAccounts(accData.items);
      if (payable[0]) setInvoiceId((v) => v || payable[0].id);
      if (accData.items[0]) setAccountId((v) => v || accData.items[0].id);
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
      await createPayment({
        invoiceId,
        accountId: accountId || null,
        amount: Number(amount || 0),
        currency,
        receivedAt: new Date(receivedAt).toISOString(),
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

  const columns: DataTableColumn<PaymentItem>[] = useMemo(
    () => [
      { key: "receivedAt", title: "入金日", render: (r) => new Date(r.receivedAt).toLocaleString("ja-JP") },
      { key: "invoiceNumber", title: "請求番号", render: (r) => <div className="font-medium text-slate-900">{r.invoiceNumber ?? "-"}</div> },
      { key: "customerName", title: "請求先", render: (r) => r.customerName ?? "-" },
      { key: "accountName", title: "口座", render: (r) => r.accountName ?? "-" },
      { key: "amount", title: "金額", render: (r) => <div className="font-semibold text-emerald-700">{yen(r.amount)}</div> },
      { key: "memo", title: "メモ", render: (r) => r.memo ?? "-" },
    ],
    []
  );

  return (
    <>
      <CrudPageShell
        title="入金"
        description="請求書に対する入金を記録します。"
        actions={<button type="button" onClick={() => setDrawerOpen(true)} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">入金登録</button>}
        filters={<FilterBar><div className="text-sm text-slate-500">入金一覧（最新順）</div></FilterBar>}
      >
        {error ? (
          <ErrorState description={error} />
        ) : loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="入金データがありません"
            description="最初の入金を登録してください。"
            action={<button type="button" onClick={() => setDrawerOpen(true)} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">入金を登録</button>}
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={drawerOpen} title="入金登録" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">請求書</div>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm">
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNumber} / {i.customerName} / 残額 {yen(i.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">入金口座</div>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm">
              <option value="">未設定</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">入金額</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">入金日</div>
            <input type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">メモ</div>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={submitCreate} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">保存</button>
          </div>
        </div>
      </CreateEditDrawer>
    </>
  );
}
