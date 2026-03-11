"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { listUnpaidInvoices, type InvoiceItem } from "@/core/invoices/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listUnpaidInvoices();
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

  const columns: DataTableColumn<InvoiceItem>[] = useMemo(
    () => [
      { key: "invoiceNumber", title: "請求番号", render: (r) => <div className="font-medium text-slate-900">{r.invoiceNumber}</div> },
      { key: "customerName", title: "請求先", render: (r) => r.customerName },
      { key: "status", title: "状態", render: (r) => r.status },
      { key: "dueDate", title: "支払期日", render: (r) => new Date(r.dueDate).toLocaleDateString("ja-JP") },
      { key: "total", title: "請求額", render: (r) => yen(r.total) },
      { key: "paidAmount", title: "入金済", render: (r) => yen(r.paidAmount) },
      { key: "balance", title: "未回収", render: (r) => <div className="font-semibold text-rose-700">{yen(r.balance)}</div> },
    ],
    []
  );

  return (
    <CrudPageShell title="未入金" description="未回収の請求と期日超過案件を確認します。">
      {error ? (
        <ErrorState description={error} />
      ) : loading ? (
        <div className="text-sm text-slate-500">読み込み中...</div>
      ) : rows.length === 0 ? (
        <EmptyState title="未入金はありません" description="未回収請求は現在ありません。" />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      )}
    </CrudPageShell>
  );
}
