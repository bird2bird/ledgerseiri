"use client";

import React from "react";
import type { ImportJobStagingRowItem } from "./import-center-detail-data";

type JsonRecord = Record<string, unknown>;

export type AmazonSpApiOrdersStagingSummary = {
  stagingMode: "mixed-header-item" | "item-level";
  totalRows: number;
  orderCount: number;
  headerRowCount: number;
  itemRowCount: number;
  legacyItemRowCount: number;
  unknownRowCount: number;
  itemCount: number;
  skuCount: number;
  totalQuantity: number;
  totalAmount: number;
  rowsWithoutAmazonOrderId: number;
  headerRowsWithoutItems: number;
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

function firstPositiveNumber(...values: number[]): number {
  return values.find((value) => Number.isFinite(value) && value > 0) || 0;
}

function resolvePayload(row: ImportJobStagingRowItem): JsonRecord {
  const normalized = asRecord(row.normalizedPayloadJson);
  const raw = asRecord(row.rawPayloadJson);
  const rawItem = asRecord(raw.item);
  const rawOrder = asRecord(raw.order);
  if (Object.keys(normalized).length > 0) return normalized;
  if (Object.keys(rawOrder).length > 0) return rawOrder;
  return rawItem;
}

function resolveRowKind(row: ImportJobStagingRowItem): "order-header" | "order-item" | "legacy-order-item" | "unknown" {
  const payload = resolvePayload(row);
  const rowKind = readString(payload, "rowKind");
  const stagingLevel = readString(payload, "stagingLevel");
  const orderItemId = readString(payload, "orderItemId");

  if (rowKind === "order-header" || stagingLevel === "order") return "order-header";
  if (rowKind === "order-item" || stagingLevel === "item") return "order-item";
  if (orderItemId) return "legacy-order-item";
  return "unknown";
}

export function buildAmazonSpApiOrdersStagingSummary(
  rows: ImportJobStagingRowItem[]
): AmazonSpApiOrdersStagingSummary {
  const orders = new Set<string>();
  const headerOrders = new Set<string>();
  const itemOrders = new Set<string>();
  const skus = new Set<string>();

  let headerRowCount = 0;
  let itemRowCount = 0;
  let legacyItemRowCount = 0;
  let unknownRowCount = 0;
  let itemCount = 0;
  let totalQuantity = 0;
  let totalAmount = 0;
  let rowsWithoutAmazonOrderId = 0;

  for (const row of rows) {
    const payload = resolvePayload(row);
    const kind = resolveRowKind(row);

    const amazonOrderId = firstString(
      readString(payload, "amazonOrderId"),
      readString(payload, "orderId")
    );
    const orderItemId = firstString(readString(payload, "orderItemId"));
    const sellerSku = firstString(readString(payload, "sellerSku"), readString(payload, "sku"));

    if (amazonOrderId) {
      orders.add(amazonOrderId);
    } else {
      rowsWithoutAmazonOrderId += 1;
    }

    if (kind === "order-header") {
      headerRowCount += 1;
      if (amazonOrderId) headerOrders.add(amazonOrderId);
      continue;
    }

    if (kind === "order-item" || kind === "legacy-order-item") {
      if (kind === "legacy-order-item") legacyItemRowCount += 1;
      itemRowCount += 1;
      if (amazonOrderId) itemOrders.add(amazonOrderId);
      if (sellerSku) skus.add(sellerSku);
      if (orderItemId || sellerSku) itemCount += 1;

      totalQuantity += firstPositiveNumber(
        readNumber(payload, "quantityOrdered"),
        readNumber(payload, "quantity")
      );

      totalAmount += firstPositiveNumber(
        readNumber(payload, "itemPriceAmount"),
        readNumber(payload, "itemAmount"),
        readNumber(payload, "amount"),
        readNumber(payload, "totalAmount")
      );

      continue;
    }

    unknownRowCount += 1;
  }

  const headerRowsWithoutItems = Array.from(headerOrders).filter((orderId) => !itemOrders.has(orderId)).length;

  return {
    stagingMode: headerRowCount > 0 ? "mixed-header-item" : "item-level",
    totalRows: rows.length,
    orderCount: orders.size,
    headerRowCount,
    itemRowCount,
    legacyItemRowCount,
    unknownRowCount,
    itemCount,
    skuCount: skus.size,
    totalQuantity,
    totalAmount,
    rowsWithoutAmazonOrderId,
    headerRowsWithoutItems,
  };
}

function MetricCard(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{props.label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs font-semibold text-slate-500">{props.hint}</div> : null}
    </div>
  );
}

export function AmazonSpApiOrdersStagingSummaryPanel(props: {
  rows: ImportJobStagingRowItem[];
  loading?: boolean;
  error?: string | null;
}) {
  const summary = React.useMemo(
    () => buildAmazonSpApiOrdersStagingSummary(props.rows || []),
    [props.rows]
  );

  return (
    <section
      data-testid="amazon-sp-api-orders-staging-summary-panel"
      className="rounded-3xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-sky-950">Amazon注文サマリー</div>
          <div className="mt-1 text-xs font-semibold leading-5 text-sky-700">
            ImportStagingRow の order-header / order-item を分離して集計しています。Transaction作成・在庫扣減は行いません。
          </div>
        </div>
        <div
          data-testid="amazon-sp-api-orders-staging-mode-badge"
          className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-black text-sky-700"
        >
          staging mode: {summary.stagingMode}
        </div>
      </div>

      {props.loading ? (
        <div className="mt-3 rounded-2xl border border-sky-100 bg-white/70 p-3 text-xs font-bold text-sky-700">
          staging rows を読み込み中です。
        </div>
      ) : null}

      {props.error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          staging rows の取得に失敗しました: {props.error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Amazon注文"
          value={summary.orderCount.toLocaleString("ja-JP")}
          hint="amazonOrderId distinct"
        />
        <MetricCard
          label="注文ヘッダー"
          value={summary.headerRowCount.toLocaleString("ja-JP")}
          hint="order-header rows"
        />
        <MetricCard
          label="保存商品明細"
          value={summary.itemRowCount.toLocaleString("ja-JP")}
          hint={`order-item rows / staging rows ${summary.totalRows.toLocaleString("ja-JP")}`}
        />
        <MetricCard
          label="商品明細なし注文"
          value={summary.headerRowsWithoutItems.toLocaleString("ja-JP")}
          hint="header exists, item rows missing"
        />
        <MetricCard
          label="SKU"
          value={summary.skuCount.toLocaleString("ja-JP")}
          hint="sellerSku distinct"
        />
        <MetricCard
          label="数量合計"
          value={summary.totalQuantity.toLocaleString("ja-JP")}
          hint="quantityOrdered from item rows"
        />
        <MetricCard
          label="商品金額合計"
          value={`¥${Math.round(summary.totalAmount).toLocaleString("ja-JP")}`}
          hint="itemPriceAmount from item rows"
        />
        <MetricCard
          label="旧item rows"
          value={summary.legacyItemRowCount.toLocaleString("ja-JP")}
          hint="pre-Step145 compatibility"
        />
        <MetricCard
          label="不明rows"
          value={summary.unknownRowCount.toLocaleString("ja-JP")}
          hint="要データ確認"
        />
      </div>

      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
        Step146-B は表示専用です。order-header は注文確認用、order-item は商品明細確認用です。
        Transaction作成・InventoryMovement作成・在庫扣減は行いません。
      </div>
    </section>
  );
}
