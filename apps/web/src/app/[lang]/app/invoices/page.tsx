"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { createInvoice, listInvoices, type InvoiceItem } from "@/core/invoices/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [subtotal, setSubtotal] = useState("0");
  const [tax, setTax] = useState("0");
  const [memo, setMemo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listInvoices();
      setRows(data.items);
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
      await createInvoice({
        invoiceNumber: invoiceNumber || undefined,
        customerName,
        currency,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        subtotal: Number(subtotal || 0),
        tax: Number(tax || 0),
        memo,
      });
      setDrawerOpen(false);
      setCustomerName("");
      setInvoiceNumber("");
      setSubtotal("0");
      setTax("0");
      setMemo("");
      await load();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }

  const columns: DataTableColumn<InvoiceItem>[] = useMemo(
    () => [
      { key: "invoiceNumber", title: "請求番号", render: (r) => <div className="font-medium text-slate-900">{r.invoiceNumber}</div> },
      { key: "customerName", title: "請求先", render: (r) => r.customerName },
      { key: "status", title: "状態", render: (r) => r.status },
      { key: "issueDate", title: "発行日", render: (r) => new Date(r.issueDate).toLocaleDateString("ja-JP") },
      { key: "dueDate", title: "支払期日", render: (r) => new Date(r.dueDate).toLocaleDateString("ja-JP") },
      { key: "total", title: "請求額", render: (r) => yen(r.total), className: "whitespace-nowrap" },
      { key: "paidAmount", title: "入金済", render: (r) => yen(r.paidAmount), className: "whitespace-nowrap" },
      { key: "balance", title: "残額", render: (r) => <div className="font-semibold text-slate-900">{yen(r.balance)}</div>, className: "whitespace-nowrap" },
    ],
    []
  );

  return (
    <>
      <CrudPageShell
        title="請求書"
        description="請求書一覧と請求状態を管理します。"
        actions={
          <button type="button" onClick={() => setDrawerOpen(true)} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">
            新規請求書
          </button>
        }
        filters={<FilterBar><div className="text-sm text-slate-500">請求一覧（支払期日順）</div></FilterBar>}
      >
        {error ? (
          <ErrorState description={error} />
        ) : loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="請求書がありません"
            description="最初の請求書を作成してください。"
            action={<button type="button" onClick={() => setDrawerOpen(true)} className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold">請求書を作成</button>}
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={drawerOpen} title="新規請求書" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">請求先</div>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">請求番号（任意）</div>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">発行日</div>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">支払期日</div>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">小計</div>
            <input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">税額</div>
            <input value={tax} onChange={(e) => setTax(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm" />
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
