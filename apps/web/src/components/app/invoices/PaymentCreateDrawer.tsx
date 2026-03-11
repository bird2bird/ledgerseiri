"use client";

import React, { useMemo, useState } from "react";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { createPayment, formatYen, getInvoiceDisplayNo, type InvoiceItem } from "@/core/invoices/api";

function toInputDateTimeValue(value?: string) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function PaymentCreateDrawer({
  open,
  invoice,
  onClose,
  onSaved,
}: {
  open: boolean;
  invoice: InvoiceItem | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const maxAmount = useMemo(() => Number(invoice?.balance ?? 0), [invoice]);
  const [amount, setAmount] = useState<string>("");
  const [receivedAt, setReceivedAt] = useState<string>(toInputDateTimeValue());
  const [memo, setMemo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setAmount(invoice?.balance ? String(invoice.balance) : "");
    setReceivedAt(toInputDateTimeValue());
    setMemo("");
    setError(null);
  }, [open, invoice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    const amt = Math.round(Number(amount || 0));
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("入金額は 1 以上で入力してください。");
      return;
    }
    if (maxAmount > 0 && amt > maxAmount) {
      setError(`入金額は未回収残高 ${formatYen(maxAmount)} 以下にしてください。`);
      return;
    }
    if (!receivedAt) {
      setError("入金日時を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createPayment({
        invoiceId: invoice.id,
        amount: amt,
        currency: invoice.currency || "JPY",
        receivedAt: new Date(receivedAt).toISOString(),
        memo: memo.trim() || undefined,
      });

      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateEditDrawer
      open={open}
      title={invoice ? `回款登记 · ${getInvoiceDisplayNo(invoice)}` : "回款登记"}
      onClose={onClose}
    >
      {!invoice ? null : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-black/6 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{invoice.customerName}</div>
            <div className="mt-2 text-sm text-slate-600">
              請求番号: {getInvoiceDisplayNo(invoice)}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500">請求額</div>
                <div className="font-semibold text-slate-900">{formatYen(invoice.totalAmount)}</div>
              </div>
              <div>
                <div className="text-slate-500">未回収残高</div>
                <div className="font-semibold text-rose-600">{formatYen(invoice.balance)}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">入金額</label>
            <input
              type="number"
              min={1}
              max={maxAmount || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">入金日時</label>
            <input
              type="datetime-local"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              className="h-11 w-full rounded-[14px] border border-black/8 px-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="w-full rounded-[14px] border border-black/8 px-3 py-3 text-sm outline-none focus:border-[color:var(--ls-primary)]/50"
              placeholder="partial payment / final payment ..."
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
      )}
    </CreateEditDrawer>
  );
}
