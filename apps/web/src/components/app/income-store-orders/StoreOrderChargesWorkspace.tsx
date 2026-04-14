"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAmazonStoreOrdersStage } from "@/core/jobs";

type ChargeItem = {
  id: string;
  rowNo: number;
  occurredAt?: string | null;
  orderId?: string | null;
  sku?: string | null;
  transactionType: string;
  description: string;
  kind: string;
  signedAmount: number;
};

function formatJPY(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function chargeKindLabel(kind?: string) {
  switch (String(kind || "")) {
    case "ORDER_SALE":
      return "注文売上";
    case "AD_FEE":
      return "広告費";
    case "STORAGE_FEE":
      return "倉庫費用";
    case "SUBSCRIPTION_FEE":
      return "月額登録料";
    case "FBA_FEE":
      return "FBA費用";
    case "TAX":
      return "税金";
    case "PAYOUT":
      return "振込";
    case "ADJUSTMENT":
      return "調整";
    default:
      return "その他";
  }
}

function sortCharges(items: ChargeItem[]) {
  return [...items].sort((a, b) => Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0)));
}

export function StoreOrderChargesWorkspace(props: { lang: string }) {
  const { lang } = props;
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [summary, setSummary] = useState({
    orderSale: 0,
    adFee: 0,
    storageFee: 0,
    subscriptionFee: 0,
    fbaFee: 0,
    tax: 0,
    payout: 0,
    adjustment: 0,
    other: 0,
  });

  useEffect(() => {
    const stage = loadAmazonStoreOrdersStage();
    setCharges(Array.isArray(stage?.charges) ? stage!.charges : []);
    setSummary(
      stage?.chargeSummary ?? {
        orderSale: 0,
        adFee: 0,
        storageFee: 0,
        subscriptionFee: 0,
        fbaFee: 0,
        tax: 0,
        payout: 0,
        adjustment: 0,
        other: 0,
      }
    );
  }, []);

  const sortedCharges = useMemo(() => sortCharges(charges), [charges]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">店舗運営費（Amazon精算）</div>
            <div className="mt-2 text-sm text-slate-500">
              Amazon transaction CSV から分類した広告費、月額登録料、倉庫費用、FBA費用、税金、振込、調整を確認します。会計上は「支出 → 店舗運営費」として扱うビューです。
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${lang}/app/expenses`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              支出 root へ戻る
            </Link>
            <Link
              href={`/${lang}/app/income/store-orders`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              店舗注文へ戻る
            </Link>
            <Link
              href={`/${lang}/app/data/import?module=income`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Import へ戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">広告費</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.adFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">月額登録料</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.subscriptionFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">倉庫費用</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.storageFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">FBA費用</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.fbaFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">税金</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.tax)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">振込</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.payout)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">調整</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.adjustment)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">その他</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.other)}</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Charges Detail</div>
        <div className="mt-2 text-sm text-slate-500">
          金額の絶対値が大きい順に transaction charges を表示します。
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
          <div className="grid grid-cols-[130px_140px_1.3fr_160px_150px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Date</div>
            <div>Kind</div>
            <div>Type / Description</div>
            <div>Order ID</div>
            <div>SKU</div>
            <div className="text-right">Signed Amount</div>
          </div>

          {sortedCharges.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">charges data is empty. 先に import preview を実行してください。</div>
          ) : (
            sortedCharges.map((charge) => (
              <div
                key={charge.id}
                className="grid grid-cols-[130px_140px_1.3fr_160px_150px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div className="text-slate-600">{charge.occurredAt || "-"}</div>
                <div className="text-slate-700">{chargeKindLabel(charge.kind)}</div>
                <div>
                  <div className="font-medium text-slate-900">{charge.transactionType || "-"}</div>
                  <div className="mt-1 text-xs text-slate-500">{charge.description || "-"}</div>
                </div>
                <div className="text-slate-600">{charge.orderId || "-"}</div>
                <div className="text-slate-600">{charge.sku || "-"}</div>
                <div className="text-right font-medium text-slate-900">{formatJPY(charge.signedAmount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
