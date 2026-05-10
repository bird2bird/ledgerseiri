"use client";

import React from "react";
import {
  AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
  AMAZON_SP_API_DEFAULT_STORE_ID,
  previewAmazonSpApiOrdersDryRun,
  previewAmazonSpApiOrdersReal,
  type AmazonSpApiOrdersDryRunPreviewResponse,
  type AmazonSpApiOrdersRealPreviewResponse,
} from "@/core/imports/api";

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("ja-JP").format(value);
}

function formatCurrency(value?: number | null, currency = "JPY") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

function getTodayIsoDateRange() {
  const createdAfter = "2026-05-01T00:00:00Z";
  const createdBefore = "2026-05-02T00:00:00Z";
  return { createdAfter, createdBefore };
}

function SummaryPill({
  label,
  value,
  helper,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{helper}</div>
    </div>
  );
}

export function AmazonSpApiOrdersDryRunPreviewPanel() {
  const [loading, setLoading] = React.useState(false);
  const [realLoading, setRealLoading] = React.useState(false);
  const [result, setResult] = React.useState<AmazonSpApiOrdersDryRunPreviewResponse | AmazonSpApiOrdersRealPreviewResponse | null>(null);
  const [error, setError] = React.useState("");

  async function runDryRunPreview() {
    setLoading(true);
    setError("");

    try {
      const range = getTodayIsoDateRange();
      const data = await previewAmazonSpApiOrdersDryRun({
        storeId: AMAZON_SP_API_DEFAULT_STORE_ID,
        marketplaceId: AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
        region: "JP",
        createdAfter: range.createdAfter,
        createdBefore: range.createdBefore,
        orderStatuses: ["Shipped"],
        dryRun: true,
      });

      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runRealPreview() {
    setRealLoading(true);
    setError("");

    try {
      const range = getTodayIsoDateRange();
      const data = await previewAmazonSpApiOrdersReal({
        storeId: AMAZON_SP_API_DEFAULT_STORE_ID,
        marketplaceId: AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
        region: "JP",
        createdAfter: range.createdAfter,
        createdBefore: range.createdBefore,
        orderStatuses: ["Shipped"],
        maxResultsPerPage: 50,
        realPreview: true,
      });

      setResult({
        ...data,
        realPreview: true,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRealLoading(false);
    }
  }

  const orders = Array.isArray(result?.normalizedOrders) ? result.normalizedOrders : [];
  const orderItems = Array.isArray(result?.normalizedOrderItems) ? result.normalizedOrderItems : [];
  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
  const unresolvedSkus = result?.skuResolutionSummary?.unresolvedSellerSkus || [];
  const currency = result?.transactionImpactPreview?.currencyCode || "JPY";

  return (
    <section
      data-testid="amazon-sp-api-orders-dry-run-preview-panel"
      className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">
              Amazon注文API プレビュー
            </h2>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
              Dry-run
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
              書き込みなし
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
              Step140-W required for live network
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Amazon SP-API Orders の dry-run preview です。現段階では synthetic fixture を使って
            注文・商品・SKU警告・在庫影響・収入プレビューを表示します。ImportJob作成、Transaction作成、
            在庫扣減、Amazon実通信は実行しません。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SummaryPill
              label="注文"
              value={formatNumber(result?.validationSummary?.totalOrders)}
              helper="normalizedOrders"
            />
            <SummaryPill
              label="商品行"
              value={formatNumber(result?.validationSummary?.totalOrderItems)}
              helper="normalizedOrderItems"
            />
            <SummaryPill
              label="SKU未解決"
              value={formatNumber(result?.skuResolutionSummary?.unresolvedSkuCount)}
              helper="在庫扣減ブロック"
            />
            <SummaryPill
              label="収入プレビュー"
              value={formatCurrency(result?.transactionImpactPreview?.totalPreviewAmount, currency)}
              helper="Transaction作成なし"
            />
            <SummaryPill
              label="在庫扣減"
              value={result?.inventoryImpactPreview?.wouldDeductInventory ? "あり" : "なし"}
              helper="dry-runでは0"
            />
          </div>

          {result ? (
            <div
              data-testid="amazon-sp-api-orders-dry-run-result"
              className="mt-5 grid gap-4 xl:grid-cols-12"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-4 xl:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Orders Preview
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-800">
                      注文プレビュー / dry-run
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                    {result.dryRun ? "dryRun=true" : "dryRun=false"}
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2">Amazon注文ID</th>
                        <th className="whitespace-nowrap px-3 py-2">月</th>
                        <th className="whitespace-nowrap px-3 py-2">状態</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.amazonOrderId || order.dedupeHash}>
                          <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-800">
                            {order.amazonOrderId || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
                            {order.businessMonth || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
                            {order.orderStatus || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-black text-slate-900">
                            {formatCurrency(order.orderTotalAmount, order.currencyCode || currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:col-span-5">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  SKU / Inventory
                </div>
                <div className="mt-1 text-sm font-black text-slate-800">
                  SKU解決と在庫影響
                </div>

                <div className="mt-3 space-y-2">
                  {orderItems.map((item) => {
                    const unresolved = !item.sellerSku;
                    return (
                      <div
                        key={item.orderItemId || `${item.amazonOrderId}-${item.asin}`}
                        className={`rounded-2xl border px-3 py-2 ${
                          unresolved
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-slate-800">
                              {item.title || item.asin || "—"}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">
                              SKU: {item.sellerSku || "未解決"} / Qty: {item.quantityOrdered ?? 0}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${
                              unresolved
                                ? "border-amber-300 bg-amber-100 text-amber-800"
                                : "border-emerald-300 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {unresolved ? "要確認" : "resolved"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 xl:col-span-12">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Safety Guard
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-800">
                      実行境界
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                    commit disabled
                  </span>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    DB書込: {result.controllerWritesDatabase === false ? "なし" : "未確認"}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    Amazon通信: {result.controllerCallsAmazon === false ? "なし" : "未確認"}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    Transaction: {result.transactionWriteNow === false ? "なし" : "未確認"}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    Inventory: {result.inventoryWriteNow === false ? "なし" : "未確認"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {unresolvedSkus.length > 0 || warnings.length > 0 ? (
            <div
              data-testid="amazon-sp-api-orders-unresolved-sku-warning"
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800"
            >
              SKU未解決があります。現段階では在庫扣減を実行しません。
              {warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div
              data-testid="amazon-sp-api-orders-dry-run-error"
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700"
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-[240px] flex-col gap-2">
          <button
            data-testid="amazon-sp-api-orders-dry-run-preview-button"
            type="button"
            onClick={() => void runDryRunPreview()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "プレビュー中..." : "注文APIプレビュー"}
          </button>

          <button
            data-testid="amazon-sp-api-orders-real-preview-button"
            type="button"
            onClick={() => void runRealPreview()}
            disabled={realLoading || loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 text-sm font-black text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {realLoading ? "Real preview中..." : "Real preview"}
          </button>

          <button
            data-testid="amazon-sp-api-orders-commit-disabled-button"
            type="button"
            disabled
            title="Commitは後続ステップで実装します"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400"
          >
            Commitは未実装
          </button>
        </div>
      </div>
    </section>
  );
}
