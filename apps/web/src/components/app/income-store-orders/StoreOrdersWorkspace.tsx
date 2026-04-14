import React, { useMemo } from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import { renderTransactionsSelectedSummary } from "@/core/transactions/transactions-selected-summary";

type Props = {
  lang: string;
  rows: IncomeRow[];
  visibleRows: IncomeRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: IncomeRow | null;
  loading: boolean;
  error: string;
  totalAmount: number;
  totalNetAmount: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  totalShippingAmount: number;
  totalPromotionAmount: number;

  pageSize: 20 | 50 | 100;
  setPageSize: (value: 20 | 50 | 100) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  totalPages: number;
  totalRows: number;
  totalQuantity: number;
  pageStartRow: number;
  pageEndRow: number;

  sidebarActions: Array<{
    label: string;
    href?: string;
    disabled?: boolean;
  }>;
};

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function amountOf(row: IncomeRow) {
  return Number(row.amount ?? 0);
}

function buildStoreSummary(rows: IncomeRow[]) {
  const map = new Map<string, { store: string; amount: number; count: number }>();

  for (const row of rows) {
    const store = row.store || "-";
    const current = map.get(store) ?? { store, amount: 0, count: 0 };
    current.amount += amountOf(row);
    current.count += 1;
    map.set(store, current);
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function buildLabelSummary(rows: IncomeRow[]) {
  const map = new Map<string, { label: string; amount: number; count: number }>();

  for (const row of rows) {
    const label = row.label || "注文";
    const current = map.get(label) ?? { label, amount: 0, count: 0 };
    current.amount += amountOf(row);
    current.count += 1;
    map.set(label, current);
  }

  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

function buildSampleBars(rows: IncomeRow[]) {
  return rows.slice(0, 6);
}

export function StoreOrdersWorkspace(props: Props) {
  const {
    rows,
    visibleRows,
    selectedRowId,
    onSelectRow,
    selectedRow,
    loading,
    error,
    totalAmount,
    totalNetAmount,
    totalFeeAmount,
    totalTaxAmount,
    totalShippingAmount,
    totalPromotionAmount,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRows,
    totalQuantity,
    pageStartRow,
    pageEndRow,
    sidebarActions,
  } = props;

  const avgOrderAmount = totalRows > 0 ? totalAmount / totalRows : 0;
  const storeSummary = useMemo(() => buildStoreSummary(rows), [rows]);
  const labelSummary = useMemo(() => buildLabelSummary(rows), [rows]);
  const sampleBars = useMemo(() => buildSampleBars(rows), [rows]);

  const uniqueStores = storeSummary.length;
  const topStore = storeSummary[0];
  const maxStoreAmount = Math.max(1, ...storeSummary.map((item) => item.amount), 1);
  const maxBarAmount = Math.max(1, ...sampleBars.map((row) => amountOf(row)), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#8b5cf6,#a78bfa)] p-6 text-white shadow-sm">
          <div className="text-sm text-white/80">注文売上</div>
          <div className="mt-3 text-4xl font-semibold">{formatIncomeJPY(totalAmount)}</div>
          <div className="mt-4 text-sm text-white/80">店舗注文として表示中の売上総額</div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#06b6d4,#67e8f9)] p-6 text-slate-950 shadow-sm">
          <div className="text-sm text-slate-700">注文行数</div>
          <div className="mt-3 text-4xl font-semibold">{totalRows}</div>
          <div className="mt-4 text-sm text-slate-700">全件ベースの注文行数</div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#f97316,#fb923c)] p-6 text-white shadow-sm">
          <div className="text-sm text-white/80">総販売数量</div>
          <div className="mt-3 text-4xl font-semibold">{totalQuantity}</div>
          <div className="mt-4 text-sm text-white/80">
            全件ベース数量 / 平均注文額 {formatIncomeJPY(avgOrderAmount)}
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#84cc16,#a3e635)] p-6 text-slate-950 shadow-sm">
          <div className="text-sm text-slate-700">対象店舗数</div>
          <div className="mt-3 text-4xl font-semibold">{uniqueStores}</div>
          <div className="mt-4 text-sm text-slate-700">
            {topStore ? `Top: ${topStore.store}` : "店舗データなし"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Gross 売上</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(totalAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Net 売上</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(totalNetAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Fee 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(totalFeeAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Tax 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(totalTaxAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Promotion / Shipping</div>
          <div className="mt-2 text-sm text-slate-700">
            Promo {formatIncomeJPY(totalPromotionAmount)} / Ship {formatIncomeJPY(totalShippingAmount)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-900">注文分析</div>
              <div className="mt-2 text-sm text-slate-500">
                店舗別構成と注文サンプル金額を上半分で把握します。
              </div>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              Store Orders
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-900">店舗構成</div>
              <div className="mt-1 text-sm text-slate-500">売上上位店舗の構成比</div>

              <div className="mt-5 space-y-4">
                {storeSummary.length > 0 ? (
                  storeSummary.slice(0, 6).map((item) => {
                    const width = Math.max(8, Math.round((item.amount / maxStoreAmount) * 100));
                    return (
                      <div key={item.store} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="font-medium text-slate-800">{item.store}</div>
                          <div className="text-slate-500">
                            {formatIncomeJPY(item.amount)} · {item.count}件
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200">
                          <div
                            className="h-2.5 rounded-full bg-slate-900"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    店舗構成データはまだありません。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-900">注文金額サンプル</div>
              <div className="mt-1 text-sm text-slate-500">日付降順ソート後の最新 6 行を可視化</div>

              <div className="mt-5">
                {sampleBars.length > 0 ? (
                  <div className="flex h-[220px] items-end justify-between gap-3">
                    {sampleBars.map((row) => {
                      const height = Math.max(
                        18,
                        Math.round((amountOf(row) / maxBarAmount) * 170)
                      );

                      return (
                        <div key={row.id} className="flex flex-1 flex-col items-center gap-3">
                          <div className="flex h-[180px] items-end">
                            <div
                              className="w-full min-w-[26px] rounded-t-[18px] bg-[linear-gradient(180deg,#4f46e5,#7c3aed)]"
                              style={{ height: `${height}px` }}
                              title={`${row.label} / ${formatIncomeJPY(amountOf(row))}`}
                            />
                          </div>
                          <div className="text-center text-[11px] text-slate-500">
                            {row.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    可視化する注文データがまだありません。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">注文タイプ概要</div>
            <div className="mt-2 text-sm text-slate-500">
              現在の store-order 行からラベル別の分布を要約します。
            </div>

            <div className="mt-5 space-y-3">
              {labelSummary.length > 0 ? (
                labelSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800">{item.label}</div>
                      <div className="text-sm text-slate-500">
                        {formatIncomeJPY(item.amount)} · {item.count}件
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  まだ分類可能な注文データがありません。
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">ページアクション</div>
            <div className="mt-2 text-sm text-slate-500">
              次段階で CSV / Amazon API 注入導線をここへ接続します。
            </div>

            <div className="mt-5 grid gap-3">
              {sidebarActions.map((item) =>
                item.href ? (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 disabled:opacity-60"
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-semibold text-slate-900">注文一覧</div>
            <div className="mt-2 text-sm text-slate-500">
              下半分には店鋪注文の一覧を表示します。ページサイズは 20 / 50 / 100 から選択可能です。
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
            <label className="text-sm font-medium text-slate-700">1ページあたり</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as 20 | 50 | 100)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value={20}>20 条</option>
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
            </select>
          </div>
        </div>

        {renderTransactionsSelectedSummary({
          title: "Selected Order",
          selected: !!selectedRow,
          emptyMessage: "行を選択すると、ここに店舗注文行の要約が表示されます。",
          items: selectedRow
            ? [
                { label: "ID", value: selectedRow.id },
                { label: "Date", value: selectedRow.date },
                { label: "Order ID", value: selectedRow.externalRef || "-" },
                { label: "Product", value: selectedRow.productName || selectedRow.label },
                { label: "SKU", value: selectedRow.sku || "-" },
                { label: "Qty", value: String(selectedRow.quantity ?? "-") },
                { label: "Store", value: selectedRow.store },
                { label: "Fulfillment", value: selectedRow.fulfillment || "-" },
                { label: "Account", value: selectedRow.account },
                { label: "Gross", value: formatIncomeJPY(selectedRow.grossAmount ?? selectedRow.amount ?? 0) },
                { label: "Net", value: formatIncomeJPY(selectedRow.netAmount ?? selectedRow.amount ?? 0) },
                { label: "Fee", value: formatIncomeJPY(selectedRow.feeAmount ?? 0) },
                { label: "Tax", value: formatIncomeJPY(selectedRow.taxAmount ?? 0) },
                { label: "Shipping", value: formatIncomeJPY(selectedRow.shippingAmount ?? 0) },
                { label: "Promotion", value: formatIncomeJPY(selectedRow.promotionAmount ?? 0) },
                { label: "Source", value: selectedRow.sourceType || "-" },
                { label: "Imported At", value: selectedRow.importedAt || "-" },
                { label: "Memo", value: selectedRow.memo || "-" },
              ]
            : [],
        })}

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
          <div className="grid grid-cols-[110px_1.6fr_160px_90px_150px_170px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Date</div>
            <div>Order / Product</div>
            <div>SKU</div>
            <div className="text-right">Qty</div>
            <div>Store</div>
            <div className="text-right">Gross / Net / Fee</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">loading...</div>
          ) : error ? (
            <div className="px-4 py-10 text-sm text-rose-600">{error}</div>
          ) : visibleRows.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">注文データがありません。</div>
          ) : (
            visibleRows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelectRow(row.id)}
                className={`grid w-full grid-cols-[110px_1.6fr_160px_90px_150px_170px] gap-4 border-t border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                  selectedRowId === row.id ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : ""
                }`}
              >
                <div className="text-slate-600">{row.date}</div>
                <div>
                  <div className="font-medium text-slate-900">
                    {row.externalRef || row.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {row.productName || row.label}
                  </div>
                </div>
                <div className="text-slate-600">{row.sku || "-"}</div>
                <div className="text-right text-slate-600">{row.quantity ?? "-"}</div>
                <div>
                  <div className="text-slate-600">{row.store}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.fulfillment || "-"}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">
                    G {formatIncomeJPY(row.grossAmount ?? row.amount ?? 0)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    N {formatIncomeJPY(row.netAmount ?? row.amount ?? 0)} / F {formatIncomeJPY(row.feeAmount ?? 0)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-sm text-slate-500">
            全 {totalRows} 行・総販売数量 {totalQuantity} 点のうち、{pageStartRow} - {pageEndRow} 行を表示
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              最初
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(clampPage(currentPage - 1, totalPages))}
              disabled={currentPage <= 1}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              前へ
            </button>

            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
              {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(clampPage(currentPage + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              最後
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
