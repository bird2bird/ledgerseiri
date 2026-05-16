"use client";

import React from "react";
import type { ImportJobStagingRowItem } from "./import-center-detail-data";

type JsonRecord = Record<string, unknown>;

export type AmazonSpApiGroupedOrderItem = {
  stagingRowId: string;
  rowNo: number | null;
  status: string;
  amazonOrderId: string;
  orderItemId: string;
  sellerSku: string;
  asin: string;
  title: string;
  quantityOrdered: number;
  itemPriceAmount: number;
  itemTaxAmount: number;
  shippingPriceAmount: number;
};

export type AmazonSpApiGroupedOrder = {
  amazonOrderId: string;
  itemCount: number;
  skuCount: number;
  totalQuantity: number;
  totalAmount: number;
  items: AmazonSpApiGroupedOrderItem[];
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(record: JsonRecord, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function firstString(...values: string[]): string {
  return values.find((value) => value.trim().length > 0)?.trim() || "";
}

function firstNumber(...values: number[]): number {
  return values.find((value) => Number.isFinite(value) && value !== 0) || 0;
}

function resolvePayload(row: ImportJobStagingRowItem): JsonRecord {
  const normalized = asRecord(row.normalizedPayloadJson);
  const raw = asRecord(row.rawPayloadJson);
  const rawItem = asRecord(raw.item);
  return Object.keys(normalized).length > 0 ? normalized : rawItem;
}

function buildGroupedItem(row: ImportJobStagingRowItem): AmazonSpApiGroupedOrderItem | null {
  const payload = resolvePayload(row);

  const amazonOrderId = firstString(
    readString(payload, "amazonOrderId"),
    readString(payload, "orderId")
  );

  if (!amazonOrderId) return null;

  return {
    stagingRowId: String(row.id),
    rowNo: typeof row.rowNo === "number" ? row.rowNo : null,
    status: firstString(readString(payload, "status"), readString(payload, "rowStatus")),
    amazonOrderId,
    orderItemId: firstString(readString(payload, "orderItemId")),
    sellerSku: firstString(readString(payload, "sellerSku"), readString(payload, "sku")),
    asin: firstString(readString(payload, "asin")),
    title: firstString(readString(payload, "title"), readString(payload, "itemName"), readString(payload, "productName")),
    quantityOrdered: firstNumber(readNumber(payload, "quantityOrdered"), readNumber(payload, "quantity")),
    itemPriceAmount: firstNumber(readNumber(payload, "itemPriceAmount"), readNumber(payload, "itemAmount"), readNumber(payload, "amount")),
    itemTaxAmount: firstNumber(readNumber(payload, "itemTaxAmount"), readNumber(payload, "taxAmount")),
    shippingPriceAmount: firstNumber(readNumber(payload, "shippingPriceAmount"), readNumber(payload, "shippingAmount")),
  };
}

export function buildAmazonSpApiGroupedOrders(rows: ImportJobStagingRowItem[]): AmazonSpApiGroupedOrder[] {
  const map = new Map<string, AmazonSpApiGroupedOrder>();

  for (const row of rows) {
    const item = buildGroupedItem(row);
    if (!item) continue;

    const current =
      map.get(item.amazonOrderId) ||
      ({
        amazonOrderId: item.amazonOrderId,
        itemCount: 0,
        skuCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        items: [],
      } satisfies AmazonSpApiGroupedOrder);

    current.items.push(item);
    map.set(item.amazonOrderId, current);
  }

  for (const group of map.values()) {
    const skuSet = new Set(group.items.map((item) => item.sellerSku).filter(Boolean));
    group.itemCount = group.items.length;
    group.skuCount = skuSet.size;
    group.totalQuantity = group.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
    group.totalAmount = group.items.reduce((sum, item) => sum + item.itemPriceAmount + item.shippingPriceAmount + item.itemTaxAmount, 0);
    group.items.sort((a, b) => (a.rowNo ?? 0) - (b.rowNo ?? 0));
  }

  return Array.from(map.values()).sort((a, b) => {
    const aRow = a.items[0]?.rowNo ?? 0;
    const bRow = b.items[0]?.rowNo ?? 0;
    return aRow - bRow;
  });
}

function money(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function CompactValue(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{props.label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{props.value}</div>
    </div>
  );
}

export function AmazonSpApiOrdersGroupedStagingList(props: {
  rows: ImportJobStagingRowItem[];
  maxOrders?: number;
}) {
  const groups = React.useMemo(() => buildAmazonSpApiGroupedOrders(props.rows || []), [props.rows]);
  const maxOrders = props.maxOrders ?? 20;
  const visibleGroups = groups.slice(0, maxOrders);
  const hiddenCount = Math.max(groups.length - visibleGroups.length, 0);

  return (
    <section
      data-testid="amazon-sp-api-orders-grouped-staging-list"
      className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-emerald-950">Amazon注文リスト</div>
          <div className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
            現在保存済みの item-level staging rows を amazonOrderId でグループ表示しています。
          </div>
        </div>
        <div className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-black text-emerald-700">
          grouped by amazonOrderId
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
          Amazon注文データがまだありません。ImportJob の staging rows を確認してください。
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {visibleGroups.map((group) => (
          <article
            key={group.amazonOrderId}
            data-testid="amazon-sp-api-orders-group-card"
            className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-500">Amazon注文ID</div>
                <div className="mt-1 break-all text-sm font-black text-slate-950">{group.amazonOrderId}</div>
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                {group.itemCount} 明細
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <CompactValue label="SKU" value={group.skuCount.toLocaleString("ja-JP")} />
              <CompactValue label="数量" value={group.totalQuantity.toLocaleString("ja-JP")} />
              <CompactValue label="合計" value={money(group.totalAmount)} />
              <CompactValue label="Rows" value={group.items.map((item) => item.rowNo ?? "-").join(", ")} />
            </div>

            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">ASIN</th>
                    <th className="px-3 py-2">商品名</th>
                    <th className="px-3 py-2">数量</th>
                    <th className="px-3 py-2">商品金額</th>
                    <th className="px-3 py-2">税</th>
                    <th className="px-3 py-2">送料</th>
                    <th className="px-3 py-2">Order Item ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {group.items.map((item) => (
                    <tr key={item.stagingRowId} className="align-top">
                      <td className="px-3 py-2 font-black text-slate-800">{item.sellerSku || "—"}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{item.asin || "—"}</td>
                      <td className="max-w-[260px] px-3 py-2 font-semibold text-slate-700">{item.title || "—"}</td>
                      <td className="px-3 py-2 font-black text-slate-900">{item.quantityOrdered || 0}</td>
                      <td className="px-3 py-2 font-black text-slate-900">{money(item.itemPriceAmount)}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{money(item.itemTaxAmount)}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{money(item.shippingPriceAmount)}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{item.orderItemId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          先頭 {visibleGroups.length} 注文のみ表示しています。残り {hiddenCount} 注文は Step144-C 以降でページング/検索対応します。
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold leading-5 text-slate-600">
        Step144-B は表示専用です。Transaction作成・InventoryMovement作成・在庫扣減は行いません。
      </div>
    </section>
  );
}
