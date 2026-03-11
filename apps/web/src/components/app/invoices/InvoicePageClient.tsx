"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { EmptyState } from "@/components/crud/EmptyState";
import { ErrorState } from "@/components/crud/ErrorState";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { InvoiceStatusBadge } from "@/components/app/invoices/InvoiceStatusBadge";
import { PaymentCreateDrawer } from "@/components/app/invoices/PaymentCreateDrawer";
import {
  createInvoice,
  formatDate,
  formatDateTime,
  formatYen,
  getInvoiceDisplayNo,
  listInvoiceHistory,
  listInvoices,
  listUnpaidInvoices,
  type InvoiceItem,
} from "@/core/invoices/api";

type Mode = "all" | "unpaid" | "history";

function toInputDate(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function InvoicePageClient({
  mode,
}: {
  mode: Mode;
}) {
  const [rows, setRows] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceItem | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [issueDate, setIssueDate] = useState(() => toInputDate(new Date()));
  const [dueDate, setDueDate] = useState(() => toInputDate(new Date()));
  const [subtotal, setSubtotal] = useState("0");
  const [tax, setTax] = useState("0");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loader = useMemo(() => {
    if (mode === "unpaid") return listUnpaidInvoices;
    if (mode === "history") return listInvoiceHistory;
    return listInvoices;
  }, [mode]);

  const title = mode === "unpaid" ? "未入金" : mode === "history" ? "入金履歴" : "請求書";
  const description =
    mode === "unpaid"
      ? "未回収の請求と期日超過案件を確認します。"
      : mode === "history"
      ? "入金履歴と請求回収状況を確認します。"
      : "請求書一覧と請求状態を管理します。";

  const sectionLabel =
    mode === "unpaid"
      ? "ISSUED / PARTIALLY_PAID / OVERDUE を表示"
      : mode === "history"
      ? "入金済み・一部入金済みの請求履歴"
      : "請求一覧（最新状態）";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loader();
      setRows(res.items || []);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    load();
  }, [load]);

  function openPayment(row: InvoiceItem) {
    setActiveInvoice(row);
    setPaymentOpen(true);
  }

  function resetCreateForm() {
    setCustomerName("");
    setIssueDate(toInputDate(new Date()));
    setDueDate(toInputDate(new Date()));
    setSubtotal("0");
    setTax("0");
    setMemo("");
    setSaveError(null);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();

    const subtotalNum = Math.round(Number(subtotal || 0));
    const taxNum = Math.round(Number(tax || 0));

    if (!customerName.trim()) {
      setSaveError("取引先を入力してください。");
      return;
    }
    if (!Number.isFinite(subtotalNum) || subtotalNum < 0) {
      setSaveError("小計は 0 以上で入力してください。");
      return;
    }
    if (!Number.isFinite(taxNum) || taxNum < 0) {
      setSaveError("税額は 0 以上で入力してください。");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      await createInvoice({
        customerName: customerName.trim(),
        currency: "JPY",
        issueDate: new Date(`${issueDate}T00:00:00`).toISOString(),
        dueDate: new Date(`${dueDate}T00:00:00`).toISOString(),
        subtotal: subtotalNum,
        tax: taxNum,
        memo: memo.trim() || undefined,
      });

      setCreateOpen(false);
      resetCreateForm();
      await load();
    } catch (err: any) {
      setSaveError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<DataTableColumn<InvoiceItem>[]>(() => {
    if (mode === "history") {
      return [
        {
          key: "invoiceNo",
          title: "請求番号",
          render: (row) => getInvoiceDisplayNo(row),
        },
        {
          key: "customerName",
          title: "取引先",
          render: (row) => row.customerName,
        },
        {
          key: "status",
          title: "状態",
          render: (row) => <InvoiceStatusBadge status={row.status} />,
        },
        {
          key: "total",
          title: "請求額",
          className: "text-right",
          render: (row) => <span className="font-semibold">{formatYen(row.totalAmount)}</span>,
        },
        {
          key: "paidAmount",
          title: "回収額",
          className: "text-right",
          render: (row) => <span className="font-semibold text-emerald-700">{formatYen(row.paidAmount)}</span>,
        },
        {
          key: "updatedAt",
          title: "更新日",
          render: (row) => formatDateTime(row.updatedAt),
        },
      ];
    }

    if (mode === "unpaid") {
      return [
        {
          key: "invoiceNo",
          title: "請求番号",
          render: (row) => getInvoiceDisplayNo(row),
        },
        {
          key: "customerName",
          title: "取引先",
          render: (row) => row.customerName,
        },
        {
          key: "status",
          title: "状態",
          render: (row) => <InvoiceStatusBadge status={row.status} />,
        },
        {
          key: "dueDate",
          title: "支払期日",
          render: (row) => formatDate(row.dueDate),
        },
        {
          key: "total",
          title: "請求額",
          className: "text-right",
          render: (row) => <span className="font-semibold">{formatYen(row.totalAmount)}</span>,
        },
        {
          key: "paidAmount",
          title: "入金済",
          className: "text-right",
          render: (row) => <span className="text-emerald-700">{formatYen(row.paidAmount)}</span>,
        },
        {
          key: "balance",
          title: "未収残高",
          className: "text-right",
          render: (row) => <span className="font-semibold text-rose-600">{formatYen(row.balance)}</span>,
        },
        {
          key: "action",
          title: "操作",
          render: (row) => (
            <button
              type="button"
              onClick={() => openPayment(row)}
              className="rounded-[12px] border border-[color:var(--ls-primary)]/20 bg-[color:var(--ls-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--ls-primary)]"
            >
              回款登记
            </button>
          ),
        },
      ];
    }

    return [
      {
        key: "invoiceNo",
        title: "請求番号",
        render: (row) => getInvoiceDisplayNo(row),
      },
      {
        key: "customerName",
        title: "取引先",
        render: (row) => row.customerName,
      },
      {
        key: "issueDate",
        title: "発行日",
        render: (row) => formatDate(row.issueDate),
      },
      {
        key: "dueDate",
        title: "支払期日",
        render: (row) => formatDate(row.dueDate),
      },
      {
        key: "status",
        title: "状態",
        render: (row) => <InvoiceStatusBadge status={row.status} />,
      },
      {
        key: "total",
        title: "請求額",
        className: "text-right",
        render: (row) => <span className="font-semibold">{formatYen(row.totalAmount)}</span>,
      },
      {
        key: "paidAmount",
        title: "入金済",
        className: "text-right",
        render: (row) => <span className="text-emerald-700">{formatYen(row.paidAmount)}</span>,
      },
      {
        key: "balance",
        title: "残高",
        className: "text-right",
        render: (row) => (
          <span className={row.balance > 0 ? "font-semibold text-rose-600" : "font-semibold text-slate-500"}>
            {formatYen(row.balance)}
          </span>
        ),
      },
      {
        key: "action",
        title: "操作",
        render: (row) =>
          row.balance > 0 ? (
            <button
              type="button"
              onClick={() => openPayment(row)}
              className="rounded-[12px] border border-[color:var(--ls-primary)]/20 bg-[color:var(--ls-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--ls-primary)]"
            >
              回款登记
            </button>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          ),
      },
    ];
  }, [mode]);

  return (
    <>
      <CrudPageShell
        title={title}
        description={description}
        actions={
          mode === "all" ? (
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              className="rounded-[16px] bg-[color:var(--ls-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              新規請求書
            </button>
          ) : (
            <button
              type="button"
              onClick={load}
              className="rounded-[14px] border border-black/8 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              更新
            </button>
          )
        }
      >
        <div className="mb-5 text-sm text-slate-500">{sectionLabel}</div>

        {loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : error ? (
          <ErrorState description={error} />
        ) : rows.length === 0 ? (
          <EmptyState title="データがありません" description="条件に一致する請求書がまだありません。" />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={createOpen} title="新規請求書" onClose={() => setCreateOpen(false)}>
        <form className="space-y-5" onSubmit={handleCreateInvoice}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">取引先</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              placeholder="Example Customer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">発行日</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">支払期日</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">小計</label>
              <input
                type="number"
                min={0}
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">税額</label>
              <input
                type="number"
                min={0}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">メモ</label>
            <textarea
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-[14px] border border-black/8 px-3 py-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
            />
          </div>

          {saveError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-[14px] border border-black/8 px-4 py-2 text-sm font-medium text-slate-700"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[14px] bg-[color:var(--ls-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </CreateEditDrawer>

      <PaymentCreateDrawer
        open={paymentOpen}
        invoice={activeInvoice}
        onClose={() => {
          setPaymentOpen(false);
          setActiveInvoice(null);
        }}
        onSaved={load}
      />
    </>
  );
}
