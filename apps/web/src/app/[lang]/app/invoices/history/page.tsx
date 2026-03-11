"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { listInvoiceHistory, type InvoiceItem } from "@/core/invoices/api";

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
      const data = await listInvoiceHistory();
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
      { key: "total", title: "請求額", render: (r) => yen(r.total) },
      { key: "paidAmount", title: "入金済", render: (r) => <div className="font-semibold text-emerald-700">{yen(r.paidAmount)}</div> },
      { key: "updatedAt", title: "更新日", render: (r) => new Date(r.updatedAt).toLocaleString("ja-JP") },
    ],
    []
  );

  return (
    <CrudPageShell title="入金履歴" description="入金履歴と請求回収状況を確認します。">
      {error ? (
        <ErrorState description={error} />
      ) : loading ? (
        <div className="text-sm text-slate-500">読み込み中...</div>
      ) : rows.length === 0 ? (
        <EmptyState title="入金履歴がありません" description="入金済み請求はまだありません。" />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      )}
    </CrudPageShell>
  );
}
