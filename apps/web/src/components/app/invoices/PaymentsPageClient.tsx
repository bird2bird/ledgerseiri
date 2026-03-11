"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { formatDateTime, formatYen, getInvoiceDisplayNo, listPayments, type PaymentItem } from "@/core/invoices/api";
import { InvoiceStatusBadge } from "@/components/app/invoices/InvoiceStatusBadge";

export function PaymentsPageClient() {
  const [rows, setRows] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listPayments();
      setRows(res.items || []);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo<DataTableColumn<PaymentItem>[]>(() => {
    return [
      {
        key: "receivedAt",
        title: "入金日",
        render: (row) => formatDateTime(row.receivedAt),
      },
      {
        key: "invoiceNo",
        title: "請求番号",
        render: (row) => getInvoiceDisplayNo(row as any),
      },
      {
        key: "customerName",
        title: "取引先",
        render: (row) => row.customerName || "-",
      },
      {
        key: "invoiceStatus",
        title: "請求状態",
        render: (row) =>
          row.invoiceStatus ? <InvoiceStatusBadge status={row.invoiceStatus} /> : <span className="text-slate-400">-</span>,
      },
      {
        key: "amount",
        title: "入金額",
        className: "text-right",
        render: (row) => <span className="font-semibold text-emerald-700">{formatYen(row.amount)}</span>,
      },
      {
        key: "accountName",
        title: "口座",
        render: (row) => row.accountName || "-",
      },
      {
        key: "memo",
        title: "メモ",
        render: (row) => row.memo || "-",
      },
    ];
  }, []);

  return (
    <CrudPageShell
      title="入金履歴"
      description="実際の回収レコードを確認します。"
      actions={
        <button
          type="button"
          onClick={load}
          className="rounded-[14px] border border-black/8 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          更新
        </button>
      }
    >
      <div className="mb-5 text-sm text-slate-500">Payments ledger（最新順）</div>

      {loading ? (
        <div className="text-sm text-slate-500">読み込み中...</div>
      ) : error ? (
        <ErrorState description={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="データがありません" description="まだ回款レコードがありません。" />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
      )}
    </CrudPageShell>
  );
}
