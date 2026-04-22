import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import { renderTransactionsSelectedSummary } from "@/core/transactions/transactions-selected-summary";
import {
  buildImportAwareBannerText,
  buildStoreOperationWorkspaceHref,
  readCrossWorkspaceQuery,
  readImportAwareWorkspaceContext,
} from "@/core/income-store-orders/cross-workspace-query";

type Props = {
  lang: string;
  rows: IncomeRow[];
  visibleRows: IncomeRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: IncomeRow | null;
  selectedRawTransactionRows: IncomeRow[];
  rawStoreOrderRows: IncomeRow[];
  loading: boolean;
  error: string;
  totalAmount: number;
  totalNetAmount: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  totalShippingAmount: number;
  totalPromotionAmount: number;
  stageChargeSummary: {
    orderSale: number;
    adFee: number;
    storageFee: number;
    subscriptionFee: number;
    fbaFee: number;
    tax: number;
    payout: number;
    adjustment: number;
    other: number;
  };
  rawStoreOrderCount: number;
  aggregatedStoreOrderCount: number;
  storeOrderViewMode: "aggregated" | "raw";
  setStoreOrderViewMode: (value: "aggregated" | "raw") => void;

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

type BreakdownFilter = "ALL" | "ORDER" | "FEE" | "ADJUST" | "REFUND" | "OTHER";
type BreakdownSortMode = "date-desc" | "amount-desc" | "fee-desc";
type OrderDateRangePreset = "ALL" | "30D" | "90D" | "365D" | "CUSTOM";
type OrderListSortMode = "date-desc" | "date-asc" | "qty-desc" | "qty-asc" | "fee-desc" | "fee-asc" | "item-sales-desc" | "item-sales-asc" | "item-tax-desc" | "item-tax-asc" | "shipping-desc" | "shipping-asc" | "shipping-tax-desc" | "shipping-tax-asc" | "promotion-desc" | "promotion-asc" | "promotion-tax-desc" | "promotion-tax-asc" | "fba-fee-desc" | "fba-fee-asc";

const BREAKDOWN_FILTER_ITEMS: BreakdownFilter[] = [
  "ALL",
  "ORDER",
  "FEE",
  "ADJUST",
  "REFUND",
  "OTHER",
];

const BREAKDOWN_FILTER_LABELS: Record<BreakdownFilter, string> = {
  ALL: "全部",
  ORDER: "ORDER",
  FEE: "FEE",
  ADJUST: "ADJUST",
  REFUND: "REFUND",
  OTHER: "OTHER",
};

const BREAKDOWN_SORT_LABELS: Record<BreakdownSortMode, string> = {
  "date-desc": "日期新→旧",
  "amount-desc": "金额高→低",
  "fee-desc": "Fee高→低",
};

const ORDER_DATE_RANGE_LABELS: Record<OrderDateRangePreset, string> = {
  ALL: "全部",
  "30D": "近30天",
  "90D": "近90天",
  "365D": "近365天",
  CUSTOM: "自定义",
};

const ORDER_LIST_SORT_LABELS: Record<OrderListSortMode, string> = {
  "date-desc": "日付（新→旧）",
  "date-asc": "日付（旧→新）",
  "qty-desc": "数量（高→低）",
  "qty-asc": "数量（低→高）",
  "fee-desc": "手数料（高→低）",
  "fee-asc": "手数料（低→高）",
  "item-sales-desc": "商品売上（高→低）",
  "item-sales-asc": "商品売上（低→高）",
  "item-tax-desc": "商品の売上税（高→低）",
  "item-tax-asc": "商品の売上税（低→高）",
  "shipping-desc": "配送料（高→低）",
  "shipping-asc": "配送料（低→高）",
  "shipping-tax-desc": "配送料の税金（高→低）",
  "shipping-tax-asc": "配送料の税金（低→高）",
  "promotion-desc": "プロモーション割引額（高→低）",
  "promotion-asc": "プロモーション割引額（低→高）",
  "promotion-tax-desc": "プロモーション割引の税金（高→低）",
  "promotion-tax-asc": "プロモーション割引の税金（低→高）",
  "fba-fee-desc": "FBA 手数料（高→低）",
  "fba-fee-asc": "FBA 手数料（低→高）",
};

const STORE_ORDERS_QUERY_KEYS = {
  range: "soRange",
  sort: "soSort",
  page: "soPage",
  pageSize: "soPageSize",
  view: "soView",
  start: "soStart",
  end: "soEnd",
  drawer: "soDrawer",
  breakdownFilter: "soBf",
  breakdownSort: "soBs",
} as const;

function isOrderDateRangePreset(value: string): value is OrderDateRangePreset {
  return (
    value === "ALL" ||
    value === "30D" ||
    value === "90D" ||
    value === "365D" ||
    value === "CUSTOM"
  );
}

function isOrderListSortMode(value: string): value is OrderListSortMode {
  return (
    value === "date-desc" ||
    value === "date-asc" ||
    value === "qty-desc" ||
    value === "qty-asc" ||
    value === "fee-desc" ||
    value === "fee-asc" ||
    value === "item-sales-desc" ||
    value === "item-sales-asc" ||
    value === "item-tax-desc" ||
    value === "item-tax-asc" ||
    value === "shipping-desc" ||
    value === "shipping-asc" ||
    value === "shipping-tax-desc" ||
    value === "shipping-tax-asc" ||
    value === "promotion-desc" ||
    value === "promotion-asc" ||
    value === "promotion-tax-desc" ||
    value === "promotion-tax-asc" ||
    value === "fba-fee-desc" ||
    value === "fba-fee-asc"
  );
}

function isStoreOrderViewMode(value: string): value is "aggregated" | "raw" {
  return value === "aggregated" || value === "raw";
}

function isOrderPageSize(value: string): value is "20" | "50" | "100" {
  return value === "20" || value === "50" || value === "100";
}

function isBreakdownFilter(value: string): value is BreakdownFilter {
  return (
    value === "ALL" ||
    value === "ORDER" ||
    value === "FEE" ||
    value === "ADJUST" ||
    value === "REFUND" ||
    value === "OTHER"
  );
}

function isBreakdownSortMode(value: string): value is BreakdownSortMode {
  return value === "date-desc" || value === "amount-desc" || value === "fee-desc";
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function toOrderDateMs(row: IncomeRow) {
  const raw = String(row.date || row.importedAt || "").trim();
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function normalizeDateInputValue(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function toDateInputBoundaryMs(value: string, endOfDay: boolean) {
  const normalized = normalizeDateInputValue(value);
  if (!normalized) return 0;
  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  const ts = new Date(`${normalized}${suffix}`).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function feeAmountOf(row: IncomeRow) {
  return Number(row.feeAmount ?? 0);
}

function formatAmazonOrderItemSales(row: IncomeRow) {
  return formatIncomeJPY(row.itemSalesAmount ?? row.grossAmount ?? row.amount ?? 0);
}

function formatAmazonOrderItemSalesTax(row: IncomeRow) {
  return formatIncomeJPY(row.itemSalesTaxAmount ?? row.taxAmount ?? 0);
}

function formatAmazonOrderShipping(row: IncomeRow) {
  return formatIncomeJPY(row.shippingAmount ?? 0);
}

function formatAmazonOrderShippingTax(row: IncomeRow) {
  return formatIncomeJPY(row.shippingTaxAmount ?? 0);
}

function formatAmazonOrderPromotionDiscount(row: IncomeRow) {
  return formatIncomeJPY(row.promotionDiscountAmount ?? row.promotionAmount ?? 0);
}

function formatAmazonOrderPromotionDiscountTax(row: IncomeRow) {
  return formatIncomeJPY(row.promotionDiscountTaxAmount ?? 0);
}

function formatAmazonOrderCommissionFee(row: IncomeRow) {
  return formatIncomeJPY(row.commissionFeeAmount ?? row.feeAmount ?? 0);
}

function formatAmazonOrderFbaFee(row: IncomeRow) {
  const direct = Number(row.fbaFeeAmount ?? 0);
  if (direct > 0) {
    return formatIncomeJPY(direct);
  }

  const fee = Number(row.feeAmount ?? 0);
  const commission = Number(row.commissionFeeAmount ?? 0);
  const fallback = Math.max(0, fee - commission);

  return formatIncomeJPY(fallback);
}

function filterRowsByOrderDateRange(
  rows: IncomeRow[],
  preset: OrderDateRangePreset,
  startDate: string,
  endDate: string
) {
  if (preset === "ALL") return rows;

  if (preset === "CUSTOM") {
    const startMs = toDateInputBoundaryMs(startDate, false);
    const endMs = toDateInputBoundaryMs(endDate, true);

    if (!startMs && !endMs) return rows;

    return rows.filter((row) => {
      const ts = toOrderDateMs(row);
      if (ts <= 0) return false;
      if (startMs && ts < startMs) return false;
      if (endMs && ts > endMs) return false;
      return true;
    });
  }

  const days = preset === "30D" ? 30 : preset === "90D" ? 90 : 365;
  const now = Date.now();
  const threshold = now - days * 24 * 60 * 60 * 1000;

  return rows.filter((row) => {
    const ts = toOrderDateMs(row);
    return ts > 0 && ts >= threshold && ts <= now;
  });
}

function sortOrderListRows(rows: IncomeRow[], sortMode: OrderListSortMode) {
  const next = [...rows];

  const compareTextAsc = (a: string, b: string) => a.localeCompare(b, "ja");
  const compareTextDesc = (a: string, b: string) => b.localeCompare(a, "ja");

  const orderKey = (row: IncomeRow) =>
    String(row.externalRef || row.label || row.id || "");

  const compareStableAsc = (a: IncomeRow, b: IncomeRow) =>
    compareTextAsc(orderKey(a), orderKey(b)) ||
    compareTextAsc(String(a.id), String(b.id));

  const compareStableDesc = (a: IncomeRow, b: IncomeRow) =>
    compareTextDesc(orderKey(a), orderKey(b)) ||
    compareTextDesc(String(a.id), String(b.id));

  const compareDateAsc = (a: IncomeRow, b: IncomeRow) =>
    toOrderDateMs(a) - toOrderDateMs(b) || compareStableAsc(a, b);

  const compareDateDesc = (a: IncomeRow, b: IncomeRow) =>
    toOrderDateMs(b) - toOrderDateMs(a) || compareStableDesc(a, b);

  if (sortMode === "date-asc") {
    return next.sort(compareDateAsc);
  }

  if (sortMode === "qty-desc") {
    return next.sort(
      (a, b) =>
        Number(b.quantity ?? 0) - Number(a.quantity ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "qty-asc") {
    return next.sort(
      (a, b) =>
        Number(a.quantity ?? 0) - Number(b.quantity ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "item-sales-desc") {
    return next.sort(
      (a, b) =>
        Number(b.itemSalesAmount ?? b.grossAmount ?? b.amount ?? 0) -
          Number(a.itemSalesAmount ?? a.grossAmount ?? a.amount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "item-sales-asc") {
    return next.sort(
      (a, b) =>
        Number(a.itemSalesAmount ?? a.grossAmount ?? a.amount ?? 0) -
          Number(b.itemSalesAmount ?? b.grossAmount ?? b.amount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "item-tax-desc") {
    return next.sort(
      (a, b) =>
        Number(b.itemSalesTaxAmount ?? b.taxAmount ?? 0) -
          Number(a.itemSalesTaxAmount ?? a.taxAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "item-tax-asc") {
    return next.sort(
      (a, b) =>
        Number(a.itemSalesTaxAmount ?? a.taxAmount ?? 0) -
          Number(b.itemSalesTaxAmount ?? b.taxAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "shipping-desc") {
    return next.sort(
      (a, b) =>
        Number(b.shippingAmount ?? 0) - Number(a.shippingAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "shipping-asc") {
    return next.sort(
      (a, b) =>
        Number(a.shippingAmount ?? 0) - Number(b.shippingAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "shipping-tax-desc") {
    return next.sort(
      (a, b) =>
        Number(b.shippingTaxAmount ?? 0) - Number(a.shippingTaxAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "shipping-tax-asc") {
    return next.sort(
      (a, b) =>
        Number(a.shippingTaxAmount ?? 0) - Number(b.shippingTaxAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "promotion-desc") {
    return next.sort(
      (a, b) =>
        Number(b.promotionDiscountAmount ?? b.promotionAmount ?? 0) -
          Number(a.promotionDiscountAmount ?? a.promotionAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "promotion-asc") {
    return next.sort(
      (a, b) =>
        Number(a.promotionDiscountAmount ?? a.promotionAmount ?? 0) -
          Number(b.promotionDiscountAmount ?? b.promotionAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "promotion-tax-desc") {
    return next.sort(
      (a, b) =>
        Number(b.promotionDiscountTaxAmount ?? 0) -
          Number(a.promotionDiscountTaxAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "promotion-tax-asc") {
    return next.sort(
      (a, b) =>
        Number(a.promotionDiscountTaxAmount ?? 0) -
          Number(b.promotionDiscountTaxAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  if (sortMode === "fee-desc") {
    return next.sort(
      (a, b) => feeAmountOf(b) - feeAmountOf(a) || compareDateDesc(a, b)
    );
  }

  if (sortMode === "fee-asc") {
    return next.sort(
      (a, b) => feeAmountOf(a) - feeAmountOf(b) || compareDateAsc(a, b)
    );
  }

  if (sortMode === "fba-fee-desc") {
    return next.sort(
      (a, b) =>
        Number(b.fbaFeeAmount ?? 0) - Number(a.fbaFeeAmount ?? 0) ||
        compareDateDesc(a, b)
    );
  }

  if (sortMode === "fba-fee-asc") {
    return next.sort(
      (a, b) =>
        Number(a.fbaFeeAmount ?? 0) - Number(b.fbaFeeAmount ?? 0) ||
        compareDateAsc(a, b)
    );
  }

  return next.sort(compareDateDesc);
}

function amountOf(row: IncomeRow) {
  return Number(row.amount ?? 0);
}

function sumBreakdownGross(rows: IncomeRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.grossAmount ?? row.amount ?? 0), 0);
}

function sumBreakdownNet(rows: IncomeRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.netAmount ?? row.amount ?? 0), 0);
}

function sumBreakdownFee(rows: IncomeRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.feeAmount ?? 0), 0);
}

function sumBreakdownQty(rows: IncomeRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
}

function buildStoreOrderCompositeKey(args: {
  date?: string | null;
  orderId?: string | null;
  sku?: string | null;
}) {
  return `${String(args.date || "-")}__${String(args.orderId || "")}__${String(args.sku || "")}`;
}

function resolveDrawerRawTransactionRows(args: {
  drawerSelectedRow: IncomeRow | null;
  rawStoreOrderRows: IncomeRow[];
  storeOrderViewMode: "aggregated" | "raw";
  fallbackRows: IncomeRow[];
}) {
  const { drawerSelectedRow, rawStoreOrderRows, storeOrderViewMode, fallbackRows } = args;

  if (!drawerSelectedRow) {
    return [];
  }

  if (storeOrderViewMode === "raw") {
    const exactRaw = rawStoreOrderRows.filter((row) => row.id === drawerSelectedRow.id);
    return exactRaw.length > 0 ? exactRaw : fallbackRows;
  }

  const selectedDate = String(drawerSelectedRow.date || "-");
  const selectedOrderId = String(drawerSelectedRow.externalRef || "");
  const selectedSku = String(drawerSelectedRow.sku || "");
  const selectedKey = buildStoreOrderCompositeKey({
    date: selectedDate,
    orderId: selectedOrderId,
    sku: selectedSku,
  });

  const exact = rawStoreOrderRows.filter((row) => {
    const rowKey = buildStoreOrderCompositeKey({
      date: row.date,
      orderId: row.externalRef,
      sku: row.sku,
    });
    return rowKey === selectedKey;
  });
  if (exact.length > 0) return exact;

  const byAggregateId = rawStoreOrderRows.filter((row) => {
    const rowKey = buildStoreOrderCompositeKey({
      date: row.date,
      orderId: row.externalRef,
      sku: row.sku,
    });
    return rowKey === String(drawerSelectedRow.id || "");
  });
  if (byAggregateId.length > 0) return byAggregateId;

  const byDateAndOrder = rawStoreOrderRows.filter((row) => {
    return (
      String(row.date || "-") === selectedDate &&
      String(row.externalRef || "") === selectedOrderId
    );
  });
  if (byDateAndOrder.length > 0) return byDateAndOrder;

  return fallbackRows;
}

function getBreakdownTag(row: IncomeRow) {
  const memo = String(row.memo || "").toLowerCase();
  const label = String(row.label || "").toLowerCase();
  const source = String(row.sourceType || "").toLowerCase();
  const text = `${memo} ${label} ${source}`;

  const fee = Number(row.feeAmount ?? 0);
  const gross = Number(row.grossAmount ?? row.amount ?? 0);
  const net = Number(row.netAmount ?? row.amount ?? 0);

  if (text.includes("refund") || text.includes("返金") || text.includes("返品")) {
    return {
      label: "REFUND",
      className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    };
  }

  if (
    text.includes("adjust") ||
    text.includes("調整") ||
    text.includes("訂正") ||
    text.includes("取消")
  ) {
    return {
      label: "ADJUST",
      className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    };
  }

  if (fee > 0 || text.includes("fee") || text.includes("手数料")) {
    return {
      label: "FEE",
      className: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    };
  }

  if (gross > 0 || net > 0) {
    return {
      label: "ORDER",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    };
  }

  return {
    label: "OTHER",
    className: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  };
}

function sortBreakdownRows(rows: IncomeRow[], sortMode: BreakdownSortMode) {
  const next = [...rows];

  if (sortMode === "amount-desc") {
    return next.sort(
      (a, b) =>
        Number(b.grossAmount ?? b.amount ?? 0) - Number(a.grossAmount ?? a.amount ?? 0)
    );
  }

  if (sortMode === "fee-desc") {
    return next.sort((a, b) => Number(b.feeAmount ?? 0) - Number(a.feeAmount ?? 0));
  }

  return next.sort((a, b) => {
    const byDate = String(b.date || "").localeCompare(String(a.date || ""));
    if (byDate !== 0) return byDate;

    const byImportedAt = String(b.importedAt || "").localeCompare(
      String(a.importedAt || "")
    );
    if (byImportedAt !== 0) return byImportedAt;

    return Number(b.grossAmount ?? b.amount ?? 0) - Number(a.grossAmount ?? a.amount ?? 0);
  });
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return;
  }

  throw new Error("clipboard unavailable");
}

function buildBreakdownCopyText(args: {
  selectedRow: IncomeRow | null;
  rows: IncomeRow[];
  filter: BreakdownFilter;
  sortMode: BreakdownSortMode;
  grossSum: number;
  netSum: number;
  feeSum: number;
  qtySum: number;
}) {
  const { selectedRow, rows, filter, sortMode, grossSum, netSum, feeSum, qtySum } = args;

  if (!selectedRow) return "";

  const lines = [
    "LedgerSeiri - Transaction Breakdown Audit Summary",
    `Order ID: ${selectedRow.externalRef || "-"}`,
    `SKU: ${selectedRow.sku || "-"}`,
    `Date: ${selectedRow.date || "-"}`,
    `Filter: ${BREAKDOWN_FILTER_LABELS[filter]}`,
    `Sort: ${BREAKDOWN_SORT_LABELS[sortMode]}`,
    `Rows: ${rows.length}`,
    `Gross Sum: ${formatIncomeJPY(grossSum)}`,
    `Net Sum: ${formatIncomeJPY(netSum)}`,
    `Fee Sum: ${formatIncomeJPY(feeSum)}`,
    `Qty Sum: ${qtySum}`,
    "",
    "Details:",
  ];

  rows.forEach((row, index) => {
    const tag = getBreakdownTag(row).label;
    lines.push(
      `${index + 1}. [${tag}] ${row.date || "-"} | ${row.externalRef || row.label} | SKU ${row.sku || "-"} | Qty ${row.quantity ?? "-"} | G ${formatIncomeJPY(row.grossAmount ?? row.amount ?? 0)} | N ${formatIncomeJPY(row.netAmount ?? row.amount ?? 0)} | F ${formatIncomeJPY(row.feeAmount ?? 0)} | ${row.sourceType || "-"} | ${row.memo || "-"}`
    );
  });

  return lines.join("\n");
}

function getSourceBadge(row: IncomeRow) {
  const source = String(row.sourceType || "").toLowerCase();

  if (source.includes("amazon-store-orders-stage")) {
    return {
      label: "STAGE",
      className: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
    };
  }

  if (source.includes("csv") || source.includes("import")) {
    return {
      label: "CSV",
      className: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
    };
  }

  if (source.includes("api")) {
    return {
      label: "API",
      className: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
    };
  }

  if (source.includes("manual")) {
    return {
      label: "MANUAL",
      className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    };
  }

  return {
    label: "SOURCE",
    className: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  };
}

function buildLinkedChargeHint(row: IncomeRow) {
  const tag = getBreakdownTag(row).label;

  if (tag === "FEE") {
    return "该行属于费用类，通常应与 店舗運営費 / Amazon charges 视图联动核对。";
  }

  if (tag === "ADJUST") {
    return "该行属于调整类，建议在 店舗運営費 中确认 settlement / adjustment 的落点。";
  }

  if (tag === "REFUND") {
    return "该行属于返金类，建议对照订单销售与费用回退是否同时发生。";
  }

  if (tag === "OTHER") {
    return "该行不属于标准 ORDER / FEE，建议在 charges 侧进一步确认分类归属。";
  }

  return "该行属于订单销售类，可与同订单聚合内的 fee / adjust / refund 交叉核对。";
}

function buildOrderFeeCorrelationHint(args: {
  row: IncomeRow;
  relatedRows: IncomeRow[];
}) {
  const { row, relatedRows } = args;
  const tag = getBreakdownTag(row).label;

  const feeRows = relatedRows.filter((item) => getBreakdownTag(item).label === "FEE");
  const orderRows = relatedRows.filter((item) => getBreakdownTag(item).label === "ORDER");
  const refundRows = relatedRows.filter((item) => getBreakdownTag(item).label === "REFUND");
  const adjustRows = relatedRows.filter((item) => getBreakdownTag(item).label === "ADJUST");

  const feeTotal = sumBreakdownFee(feeRows);
  const gross = Number(row.grossAmount ?? row.amount ?? 0);
  const net = Number(row.netAmount ?? row.amount ?? 0);
  const fee = Number(row.feeAmount ?? 0);

  if (tag === "ORDER") {
    if (feeRows.length > 0) {
      return `同一订单聚合内存在 ${feeRows.length} 条 FEE，Fee Sum ${formatIncomeJPY(feeTotal)}，可用于核对订单净额。`;
    }
    if (fee > 0) {
      return `该 ORDER 行自带 Fee ${formatIncomeJPY(fee)}，可直接核对 Net ${formatIncomeJPY(net)} 与 Gross ${formatIncomeJPY(gross)} 的关系。`;
    }
    return "当前聚合内未发现独立 FEE 行，可继续确认是否为纯销售收入。";
  }

  if (tag === "FEE") {
    if (orderRows.length > 0) {
      return `该 FEE 行与 ${orderRows.length} 条 ORDER 行同属当前订单聚合，通常可视为订单销售的关联费用。`;
    }
    return "当前聚合内未发现明显的 ORDER 行，请继续确认该费用是否属于其他 Amazon charge。";
  }

  if (tag === "REFUND") {
    return `当前聚合中 ORDER ${orderRows.length} 条 / FEE ${feeRows.length} 条，可继续检查 refund 是否伴随费用回退。`;
  }

  if (tag === "ADJUST") {
    return `当前聚合中 ORDER ${orderRows.length} 条 / FEE ${feeRows.length} 条 / REFUND ${refundRows.length} 条，建议检查 adjustment 是否用于冲正。`;
  }

  return `当前聚合中 ORDER ${orderRows.length} 条 / FEE ${feeRows.length} 条 / ADJUST ${adjustRows.length} 条，可继续判定该行与费用侧的关系。`;
}

function buildStoreOperationDrawerHref(args: {
  lang: string;
  selectedRow: IncomeRow | null;
  row: IncomeRow;
}) {
  const { lang, selectedRow, row } = args;

  return buildStoreOperationWorkspaceHref({
    lang,
    from: "store-order-breakdown",
    autoDrawer: true,
    orderId: selectedRow?.externalRef || row.externalRef || "",
    sku: selectedRow?.sku || row.sku || "",
    date: selectedRow?.date || row.date || "",
    kind: getBreakdownTag(row).label,
    transactionId: String(row.id || ""),
    focusChargeId: String(row.id || ""),
    sourceType: String(row.sourceType || ""),
    view: "charges",
  });
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const crossQuery = readCrossWorkspaceQuery(searchParams);
  const importContext = readImportAwareWorkspaceContext(searchParams);
  const importBanner = buildImportAwareBannerText({
    targetLabel: "店舗注文",
    importJobId: importContext.importJobId,
    months: importContext.months,
  });

  const {
    lang,
    rows,
    visibleRows,
    selectedRowId,
    onSelectRow,
    selectedRow,
    selectedRawTransactionRows,
    rawStoreOrderRows,
    loading,
    error,
    totalAmount,
    totalNetAmount,
    totalFeeAmount,
    totalTaxAmount,
    totalShippingAmount,
    totalPromotionAmount,
    stageChargeSummary,
    rawStoreOrderCount,
    aggregatedStoreOrderCount,
    storeOrderViewMode,
    setStoreOrderViewMode,
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

  const expectedPath = `/${lang}/app/income/store-orders`;
  const isActiveRoute = pathname === expectedPath;
  const viewModeLabel =
    storeOrderViewMode === "aggregated" ? "聚合视图" : "原始transaction视图";

  const [breakdownFilter, setBreakdownFilter] = useState<BreakdownFilter>("ALL");
  const [breakdownSortMode, setBreakdownSortMode] =
    useState<BreakdownSortMode>("date-desc");
  const [orderDateRangePreset, setOrderDateRangePreset] =
    useState<OrderDateRangePreset>("ALL");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [draftCustomDateStart, setDraftCustomDateStart] = useState("");
  const [draftCustomDateEnd, setDraftCustomDateEnd] = useState("");
  const [orderListSortMode, setOrderListSortMode] =
    useState<OrderListSortMode>("date-desc");
  const [copyMessage, setCopyMessage] = useState("");
  const [drawerRowId, setDrawerRowId] = useState("");
  const [isBreakdownDrawerOpen, setIsBreakdownDrawerOpen] = useState(false);
  const drawerOpenedAtRef = React.useRef(0);
  const hasHydratedOrderQueryRef = React.useRef(false);
  const lastWrittenOrderQueryRef = React.useRef("");

  const drawerSelectedRow =
    rows.find((row) => row.id === drawerRowId) ?? null;

  const drawerOpen =
    storeOrderViewMode === "aggregated" &&
    isBreakdownDrawerOpen &&
    !!drawerRowId &&
    !!drawerSelectedRow;

  const drawerSelectedRawTransactionRows = useMemo(
    () =>
      resolveDrawerRawTransactionRows({
        drawerSelectedRow,
        rawStoreOrderRows,
        storeOrderViewMode,
        fallbackRows: selectedRawTransactionRows,
      }),
    [
      drawerSelectedRow,
      rawStoreOrderRows,
      storeOrderViewMode,
      selectedRawTransactionRows,
    ]
  );

  const drawerStoreOperationHref =
    drawerSelectedRow
      ? buildStoreOperationWorkspaceHref({
          lang,
          from: "store-order-drawer",
          autoDrawer: true,
          orderId: drawerSelectedRow.externalRef || "",
          sku: drawerSelectedRow.sku || "",
          date: drawerSelectedRow.date || "",
          kind: "ORDER",
          transactionId: String(drawerSelectedRow.id || ""),
          focusChargeId: "",
          sourceType: String(drawerSelectedRow.sourceType || ""),
          view: "charges",
        })
      : `/${lang}/app/expenses/store-operation`;

  const filteredOrderRows = useMemo(
    () =>
      filterRowsByOrderDateRange(
        rows,
        orderDateRangePreset,
        customDateStart,
        customDateEnd
      ),
    [rows, orderDateRangePreset, customDateStart, customDateEnd]
  );

  const sortedOrderRows = useMemo(
    () => sortOrderListRows(filteredOrderRows, orderListSortMode),
    [filteredOrderRows, orderListSortMode]
  );

  const filteredTotalAmount = useMemo(
    () =>
      filteredOrderRows.reduce(
        (sum, row) => sum + Number(row.itemSalesAmount ?? row.grossAmount ?? row.amount ?? 0),
        0
      ),
    [filteredOrderRows]
  );

  const filteredTotalNetAmount = useMemo(
    () =>
      filteredOrderRows.reduce(
        (sum, row) => sum + Number(row.netAmount ?? row.amount ?? 0),
        0
      ),
    [filteredOrderRows]
  );

  const filteredTotalFeeAmount = useMemo(
    () => filteredOrderRows.reduce((sum, row) => sum + Number(row.feeAmount ?? 0), 0),
    [filteredOrderRows]
  );

  const filteredTotalTaxAmount = useMemo(
    () =>
      filteredOrderRows.reduce(
        (sum, row) => sum + Number(row.itemSalesTaxAmount ?? row.taxAmount ?? 0),
        0
      ),
    [filteredOrderRows]
  );

  const filteredTotalShippingAmount = useMemo(
    () => filteredOrderRows.reduce((sum, row) => sum + Number(row.shippingAmount ?? 0), 0),
    [filteredOrderRows]
  );

  const filteredTotalPromotionAmount = useMemo(
    () =>
      filteredOrderRows.reduce(
        (sum, row) => sum + Number(row.promotionDiscountAmount ?? row.promotionAmount ?? 0),
        0
      ),
    [filteredOrderRows]
  );

  const filteredTotalQuantity = useMemo(
    () => filteredOrderRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    [filteredOrderRows]
  );
  const localTotalRows = sortedOrderRows.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotalRows / pageSize));

  const avgOrderAmount = localTotalRows > 0 ? filteredTotalAmount / localTotalRows : 0;
  const storeSummary = useMemo(() => buildStoreSummary(filteredOrderRows), [filteredOrderRows]);
  const labelSummary = useMemo(() => buildLabelSummary(filteredOrderRows), [filteredOrderRows]);
  const sampleBars = useMemo(() => buildSampleBars(sortedOrderRows), [sortedOrderRows]);

  const uniqueStores = storeSummary.length;
  const topStore = storeSummary[0];
  const maxStoreAmount = Math.max(1, ...storeSummary.map((item) => item.amount), 1);
  const maxBarAmount = Math.max(1, ...sampleBars.map((row) => amountOf(row)), 1);

  const localVisibleRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrderRows.slice(start, start + pageSize);
  }, [sortedOrderRows, currentPage, pageSize]);

  const localPageStartRow =
    localTotalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const localPageEndRow =
    localTotalRows === 0 ? 0 : Math.min(currentPage * pageSize, localTotalRows);


  const normalizedDraftCustomDateStart = normalizeDateInputValue(draftCustomDateStart);
  const normalizedDraftCustomDateEnd = normalizeDateInputValue(draftCustomDateEnd);
  const isCustomDateRangeInvalid =
    !!normalizedDraftCustomDateStart &&
    !!normalizedDraftCustomDateEnd &&
    normalizedDraftCustomDateStart > normalizedDraftCustomDateEnd;

  function applyCustomDateRange() {
    if (isCustomDateRangeInvalid) {
      return;
    }

    setOrderDateRangePreset("CUSTOM");
    setCustomDateStart(normalizedDraftCustomDateStart);
    setCustomDateEnd(normalizedDraftCustomDateEnd);
    setCurrentPage(1);
  }

  function clearCustomDateRange() {
    setOrderDateRangePreset("CUSTOM");
    setDraftCustomDateStart("");
    setDraftCustomDateEnd("");
    setCustomDateStart("");
    setCustomDateEnd("");
    setCurrentPage(1);
  }

  const renderMiniSortArrows = (
    descMode: OrderListSortMode,
    ascMode: OrderListSortMode
  ) => (
    <span className="ml-1 inline-flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={() => { setOrderListSortMode(descMode); setCurrentPage(1); }}
        className={
          orderListSortMode === descMode
            ? "inline-flex h-4 w-4 items-center justify-center rounded border border-slate-900 bg-slate-900 text-[9px] leading-none text-white"
            : "inline-flex h-4 w-4 items-center justify-center rounded border border-slate-200 bg-white text-[9px] leading-none text-slate-500 hover:bg-slate-50"
        }
        aria-label={`sort ${descMode}`}
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => { setOrderListSortMode(ascMode); setCurrentPage(1); }}
        className={
          orderListSortMode === ascMode
            ? "inline-flex h-4 w-4 items-center justify-center rounded border border-slate-900 bg-slate-900 text-[9px] leading-none text-white"
            : "inline-flex h-4 w-4 items-center justify-center rounded border border-slate-200 bg-white text-[9px] leading-none text-slate-500 hover:bg-slate-50"
        }
        aria-label={`sort ${ascMode}`}
      >
        ↑
      </button>
    </span>
  );


  const getSortHeaderTextClass = (active: boolean) =>
    active ? "font-semibold text-slate-900" : "font-medium text-slate-600";

  const getSortHeaderWrapClass = (active: boolean) =>
    active
      ? "flex min-h-[48px] items-center justify-center rounded-lg bg-slate-200/80 px-2 py-1"
      : "flex min-h-[48px] items-center justify-center px-2 py-1";

  const breakdownRows = useMemo(() => {
    const filtered =
      breakdownFilter === "ALL"
        ? drawerSelectedRawTransactionRows
        : drawerSelectedRawTransactionRows.filter(
            (row) => getBreakdownTag(row).label === breakdownFilter
          );

    return sortBreakdownRows(filtered, breakdownSortMode);
  }, [drawerSelectedRawTransactionRows, breakdownFilter, breakdownSortMode]);

  const breakdownGrossSum = useMemo(
    () => sumBreakdownGross(breakdownRows),
    [breakdownRows]
  );
  React.useEffect(() => {
    if (!drawerOpen) {
      setCopyMessage("");
    }
  }, [drawerOpen]);

  const breakdownNetSum = useMemo(
    () => sumBreakdownNet(breakdownRows),
    [breakdownRows]
  );
  const breakdownFeeSum = useMemo(
    () => sumBreakdownFee(breakdownRows),
    [breakdownRows]
  );
  const breakdownQtySum = useMemo(
    () => sumBreakdownQty(breakdownRows),
    [breakdownRows]
  );

  const breakdownTagSummary = useMemo(() => {
    return breakdownRows.reduce(
      (acc, row) => {
        const tag = getBreakdownTag(row).label;
        acc.ALL += 1;
        if (tag === "ORDER") acc.ORDER += 1;
        if (tag === "FEE") acc.FEE += 1;
        if (tag === "REFUND") acc.REFUND += 1;
        if (tag === "ADJUST") acc.ADJUST += 1;
        return acc;
      },
      {
        ALL: 0,
        ORDER: 0,
        FEE: 0,
        REFUND: 0,
        ADJUST: 0,
      }
    );
  }, [breakdownRows]);

  async function handleCopyBreakdownSummary() {
    try {
      const text = buildBreakdownCopyText({
        selectedRow: drawerSelectedRow,
        rows: breakdownRows,
        filter: breakdownFilter,
        sortMode: breakdownSortMode,
        grossSum: breakdownGrossSum,
        netSum: breakdownNetSum,
        feeSum: breakdownFeeSum,
        qtySum: breakdownQtySum,
      });

      await copyTextToClipboard(text);
      setCopyMessage("核对摘要已复制。");
      window.setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage("复制失败，请重试。");
      window.setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  function closeBreakdownDrawer(source: "generic" | "backdrop" = "generic") {
    if (source === "backdrop") {
      const elapsed = Date.now() - drawerOpenedAtRef.current;
      if (elapsed < 250) return;
    }

    setIsBreakdownDrawerOpen(false);
    setCopyMessage("");
    setDrawerRowId("");
    onSelectRow("");
  }

  React.useEffect(() => {
    if (!crossQuery.autoDrawer) return;
    if (storeOrderViewMode !== "aggregated") return;
    if (!rows.length) return;
    if (selectedRowId) return;

    const matched = rows.find((row) => {
      const sameOrder = crossQuery.orderId
        ? String(row.externalRef || "") === crossQuery.orderId
        : true;
      const sameSku = crossQuery.sku
        ? String(row.sku || "") === crossQuery.sku
        : true;
      const sameDate = crossQuery.date
        ? String(row.date || "") === crossQuery.date
        : true;
      return sameOrder && sameSku && sameDate;
    });

    if (matched) {
      drawerOpenedAtRef.current = Date.now();
      setDrawerRowId(matched.id);
      setIsBreakdownDrawerOpen(true);
      onSelectRow(matched.id);
    }
  }, [
    crossQuery.autoDrawer,
    crossQuery.orderId,
    crossQuery.sku,
    crossQuery.date,
    rows,
    selectedRowId,
    storeOrderViewMode,
    onSelectRow,
  ]);

  React.useEffect(() => {
    if (storeOrderViewMode !== "aggregated") {
      setIsBreakdownDrawerOpen(false);
      setDrawerRowId("");
    }
  }, [storeOrderViewMode]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [orderDateRangePreset, orderListSortMode, setCurrentPage]);

  React.useEffect(() => {
    if (currentPage > localTotalPages) {
      setCurrentPage(localTotalPages);
    }
  }, [currentPage, localTotalPages, setCurrentPage]);

  React.useEffect(() => {
    if (!isActiveRoute) return;

    const nextRange = searchParams.get(STORE_ORDERS_QUERY_KEYS.range) || "";
    const nextSort = searchParams.get(STORE_ORDERS_QUERY_KEYS.sort) || "";
    const nextPage = searchParams.get(STORE_ORDERS_QUERY_KEYS.page) || "";
    const nextPageSize = searchParams.get(STORE_ORDERS_QUERY_KEYS.pageSize) || "";
    const nextView = searchParams.get(STORE_ORDERS_QUERY_KEYS.view) || "";
    const nextDrawer = searchParams.get(STORE_ORDERS_QUERY_KEYS.drawer) || "";
    const nextBreakdownFilter =
      searchParams.get(STORE_ORDERS_QUERY_KEYS.breakdownFilter) || "";
    const nextBreakdownSort =
      searchParams.get(STORE_ORDERS_QUERY_KEYS.breakdownSort) || "";
    const nextStart = normalizeDateInputValue(
      searchParams.get(STORE_ORDERS_QUERY_KEYS.start) || ""
    );
    const nextEnd = normalizeDateInputValue(
      searchParams.get(STORE_ORDERS_QUERY_KEYS.end) || ""
    );

    if (isOrderDateRangePreset(nextRange) && nextRange !== orderDateRangePreset) {
      setOrderDateRangePreset(nextRange);
    }

    if (isOrderListSortMode(nextSort) && nextSort !== orderListSortMode) {
      setOrderListSortMode(nextSort);
    }

    if (isOrderPageSize(nextPageSize) && Number(nextPageSize) !== pageSize) {
      setPageSize(Number(nextPageSize) as 20 | 50 | 100);
    }

    if (isStoreOrderViewMode(nextView) && nextView !== storeOrderViewMode) {
      setStoreOrderViewMode(nextView);
    }

    if (isBreakdownFilter(nextBreakdownFilter) && nextBreakdownFilter !== breakdownFilter) {
      setBreakdownFilter(nextBreakdownFilter);
    }

    if (isBreakdownSortMode(nextBreakdownSort) && nextBreakdownSort !== breakdownSortMode) {
      setBreakdownSortMode(nextBreakdownSort);
    }

    if (nextDrawer) {
      const matchedDrawerRow = rows.find((row) => row.id === nextDrawer);
      if (matchedDrawerRow) {
        if (drawerRowId !== matchedDrawerRow.id) {
          setDrawerRowId(matchedDrawerRow.id);
        }
        if (selectedRowId !== matchedDrawerRow.id) {
          onSelectRow(matchedDrawerRow.id);
        }
        if (storeOrderViewMode === "aggregated" && !isBreakdownDrawerOpen) {
          setIsBreakdownDrawerOpen(true);
        }
      }
    } else if (drawerRowId || isBreakdownDrawerOpen) {
      setDrawerRowId("");
      setIsBreakdownDrawerOpen(false);
    }

    if (nextStart !== customDateStart) {
      setCustomDateStart(nextStart);
    }
    if (nextEnd !== customDateEnd) {
      setCustomDateEnd(nextEnd);
    }
    if (nextStart !== draftCustomDateStart) {
      setDraftCustomDateStart(nextStart);
    }
    if (nextEnd !== draftCustomDateEnd) {
      setDraftCustomDateEnd(nextEnd);
    }

    if (/^\d+$/.test(nextPage)) {
      const parsedPage = Math.max(1, Number(nextPage));
      if (parsedPage !== currentPage) {
        setCurrentPage(parsedPage);
      }
    }

    hasHydratedOrderQueryRef.current = true;
    lastWrittenOrderQueryRef.current = searchParams.toString();
  }, [
    isActiveRoute,
    searchParams,
    setPageSize,
    setCurrentPage,
    setStoreOrderViewMode,
  ]);

  React.useEffect(() => {
    if (currentPage > localTotalPages) {
      setCurrentPage(localTotalPages);
      return;
    }
    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, localTotalPages, setCurrentPage]);

  React.useEffect(() => {
    if (!selectedRowId) return;

    const stillExists = sortedOrderRows.some((row) => row.id === selectedRowId);
    if (!stillExists) {
      setIsBreakdownDrawerOpen(false);
      setDrawerRowId("");
      setCopyMessage("");
      onSelectRow("");
    }
  }, [selectedRowId, sortedOrderRows, onSelectRow]);

  React.useEffect(() => {
    setIsBreakdownDrawerOpen(false);
    setDrawerRowId("");
    setCopyMessage("");
    onSelectRow("");
  }, [pathname, onSelectRow]);

  React.useEffect(() => {
    return () => {
      setIsBreakdownDrawerOpen(false);
      setDrawerRowId("");
      setCopyMessage("");
      onSelectRow("");
    };
  }, [onSelectRow]);

  React.useEffect(() => {
    if (isActiveRoute) return;
    setIsBreakdownDrawerOpen(false);
    setDrawerRowId("");
    setCopyMessage("");
    onSelectRow("");
  }, [isActiveRoute, onSelectRow]);

  React.useEffect(() => {
    if (!isActiveRoute) return;
    if (!hasHydratedOrderQueryRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set(STORE_ORDERS_QUERY_KEYS.range, orderDateRangePreset);
    params.set(STORE_ORDERS_QUERY_KEYS.sort, orderListSortMode);
    params.set(STORE_ORDERS_QUERY_KEYS.page, String(currentPage));
    params.set(STORE_ORDERS_QUERY_KEYS.pageSize, String(pageSize));
    params.set(STORE_ORDERS_QUERY_KEYS.view, storeOrderViewMode);
    params.set(STORE_ORDERS_QUERY_KEYS.breakdownFilter, breakdownFilter);
    params.set(STORE_ORDERS_QUERY_KEYS.breakdownSort, breakdownSortMode);

    if (
      storeOrderViewMode === "aggregated" &&
      isBreakdownDrawerOpen &&
      drawerRowId
    ) {
      params.set(STORE_ORDERS_QUERY_KEYS.drawer, drawerRowId);
    } else {
      params.delete(STORE_ORDERS_QUERY_KEYS.drawer);
    }

    if (orderDateRangePreset === "CUSTOM" && customDateStart) {
      params.set(STORE_ORDERS_QUERY_KEYS.start, customDateStart);
    } else {
      params.delete(STORE_ORDERS_QUERY_KEYS.start);
    }

    if (orderDateRangePreset === "CUSTOM" && customDateEnd) {
      params.set(STORE_ORDERS_QUERY_KEYS.end, customDateEnd);
    } else {
      params.delete(STORE_ORDERS_QUERY_KEYS.end);
    }

    const nextQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");

    if (nextQuery === currentQuery) {
      lastWrittenOrderQueryRef.current = nextQuery;
      return;
    }

    if (nextQuery === lastWrittenOrderQueryRef.current) {
      return;
    }

    lastWrittenOrderQueryRef.current = nextQuery;
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    // DIAG TEMP DISABLED: replaceState was interfering with route navigation

    // window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    isActiveRoute,
    pathname,
    orderDateRangePreset,
    customDateStart,
    customDateEnd,
    orderListSortMode,
    currentPage,
    pageSize,
    storeOrderViewMode,
    breakdownFilter,
    breakdownSortMode,
    isBreakdownDrawerOpen,
    drawerRowId,
  ]);

  if (!isActiveRoute) {
    return null;
  }

  return (
    <div className="relative space-y-6">
      {importContext.active ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="text-sm font-semibold text-emerald-800">
            {importBanner.title}
          </div>
          <div className="mt-1 text-sm text-emerald-700">
            {importBanner.subtitle}
          </div>
          <div className="mt-2 text-xs text-emerald-700">
            当前页面已进入统一 import-aware contract。店铺注文的数据过滤由上游 import-aware 数据源负责。
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#8b5cf6,#a78bfa)] p-6 text-white shadow-sm">
          <div className="text-sm text-white/80">注文売上</div>
          <div className="mt-3 text-4xl font-semibold">{formatIncomeJPY(filteredTotalAmount)}</div>
          <div className="mt-4 text-sm text-white/80">
            {viewModeLabel}で表示中の売上総額
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#06b6d4,#67e8f9)] p-6 text-slate-950 shadow-sm">
          <div className="text-sm text-slate-700">表示行数</div>
          <div className="mt-3 text-4xl font-semibold">{localTotalRows}</div>
          <div className="mt-4 text-sm text-slate-700">
            聚合 {aggregatedStoreOrderCount} / 原始 {rawStoreOrderCount}
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#f97316,#fb923c)] p-6 text-white shadow-sm">
          <div className="text-sm text-white/80">総販売数量</div>
          <div className="mt-3 text-4xl font-semibold">{filteredTotalQuantity}</div>
          <div className="mt-4 text-sm text-white/80">
            平均注文額 {formatIncomeJPY(avgOrderAmount)}
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

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">表示モード</div>
        <div className="mt-2 text-sm text-slate-500">
          聚合视图は date + orderId + SKU 単位で集約します。原始transaction视图は stage の元行をそのまま確認できます。
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStoreOrderViewMode("aggregated")}
            className={
              storeOrderViewMode === "aggregated"
                ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            }
          >
            聚合视图 ({aggregatedStoreOrderCount})
          </button>
          <button
            type="button"
            onClick={() => setStoreOrderViewMode("raw")}
            className={
              storeOrderViewMode === "raw"
                ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            }
          >
            原始transaction视图 ({rawStoreOrderCount})
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Amazon Transaction Charges Overview</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            transaction CSV から分類した費用 / 税金 / 振込 / 調整の概況です。
          </div>
          <Link
            href={`/${lang}/app/expenses/store-operation`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            店舗運営費 View
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">広告費</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.adFee)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">月額登録料</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.subscriptionFee)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">倉庫費用</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.storageFee)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">FBA費用</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.fbaFee)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">税金</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.tax)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">振込</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.payout)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">調整</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.adjustment)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">その他</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatIncomeJPY(stageChargeSummary.other)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">商品売上 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(filteredTotalAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Net 金額 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(filteredTotalNetAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">手数料 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(filteredTotalFeeAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">商品の売上税 合計</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatIncomeJPY(filteredTotalTaxAmount)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">配送料 / 割引</div>
          <div className="mt-2 text-sm text-slate-700">
            配送料 {formatIncomeJPY(filteredTotalShippingAmount)} / 割引 {formatIncomeJPY(filteredTotalPromotionAmount)}
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
              {viewModeLabel}
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
              <div className="mt-1 text-sm text-slate-500">現在表示モードの最新 6 行を可視化</div>

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
              現在の表示モードのラベル別分布を要約します。
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
              下半分には店舗注文の一覧を表示します。订单日期范围可切换，排序可直接在表头操作。
            </div>
          </div>

          <div className="grid gap-3 xl:min-w-[420px]">
            <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
              <label className="text-sm font-medium text-slate-700">订单日期范围</label>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "30D", "90D", "365D", "CUSTOM"] as OrderDateRangePreset[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setOrderDateRangePreset(item)}
                    className={
                      orderDateRangePreset === item
                        ? "rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {ORDER_DATE_RANGE_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            {orderDateRangePreset === "CUSTOM" ? (
              <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-start">
                <label className="pt-2 text-sm font-medium text-slate-700">自定义日期</label>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={draftCustomDateStart}
                      onChange={(e) => setDraftCustomDateStart(e.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    />
                    <input
                      type="date"
                      value={draftCustomDateEnd}
                      onChange={(e) => setDraftCustomDateEnd(e.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyCustomDateRange}
                      disabled={isCustomDateRangeInvalid}
                      className={[
                        "rounded-xl px-3 py-2 text-xs font-semibold transition",
                        isCustomDateRangeInvalid
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                          : "border border-slate-900 bg-slate-900 text-white hover:opacity-90",
                      ].join(" ")}
                    >
                      应用
                    </button>
                    <button
                      type="button"
                      onClick={clearCustomDateRange}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      清除
                    </button>
                  </div>
                  {isCustomDateRangeInvalid ? (
                    <div className="text-xs text-rose-600">
                      开始日期不能晚于结束日期。
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="text-xs text-slate-500">
              当前排序列：{ORDER_LIST_SORT_LABELS[orderListSortMode]}
              {orderDateRangePreset === "CUSTOM"
                ? ` · 日期范围 ${customDateStart || "-"} ~ ${customDateEnd || "-"}`
                : ""}
            </div>
          </div>
        </div>

        {renderTransactionsSelectedSummary({
          title: "Selected Order",
          selected: !!selectedRow,
          emptyMessage: "行を選択すると、ここに店舗注文行の要約が表示されます。",
          items: selectedRow
            ? [
                { label: "日付", value: selectedRow.date },
                { label: "注文番号", value: selectedRow.externalRef || "-" },
                { label: "SKU", value: selectedRow.sku || "-" },
                { label: "商品説明", value: selectedRow.productName || selectedRow.label || "-" },
                { label: "数量", value: String(selectedRow.quantity ?? "-") },
                { label: "商品売上", value: formatAmazonOrderItemSales(selectedRow) },
                { label: "商品の売上税", value: formatAmazonOrderItemSalesTax(selectedRow) },
                { label: "配送料", value: formatAmazonOrderShipping(selectedRow) },
                { label: "配送料の税金", value: formatAmazonOrderShippingTax(selectedRow) },
                { label: "プロモーション割引額", value: formatAmazonOrderPromotionDiscount(selectedRow) },
                { label: "プロモーション割引の税金", value: formatAmazonOrderPromotionDiscountTax(selectedRow) },
                { label: "手数料", value: formatAmazonOrderCommissionFee(selectedRow) },
                { label: "FBA 手数料", value: formatAmazonOrderFbaFee(selectedRow) },
                { label: "Store", value: selectedRow.store || "-" },
                { label: "Fulfillment", value: selectedRow.fulfillment || "-" },
                { label: "Source", value: selectedRow.sourceType || "-" },
                { label: "Imported At", value: selectedRow.importedAt || "-" },
                { label: "Memo", value: selectedRow.memo || "-" },
              ]
            : [],
        })}

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
          <div className="grid grid-cols-[110px_118px_124px_108px_124px_140px_212px_96px_84px] gap-4 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className={getSortHeaderWrapClass(orderListSortMode === "date-desc" || orderListSortMode === "date-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "date-desc" || orderListSortMode === "date-asc") + " whitespace-nowrap"}>日付</span>
              {renderMiniSortArrows("date-desc", "date-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "item-sales-desc" || orderListSortMode === "item-sales-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "item-sales-desc" || orderListSortMode === "item-sales-asc") + " whitespace-nowrap"}>商品売上</span>
              {renderMiniSortArrows("item-sales-desc", "item-sales-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "item-tax-desc" || orderListSortMode === "item-tax-asc")}>
              <span
                className={
                  getSortHeaderTextClass(orderListSortMode === "item-tax-desc" || orderListSortMode === "item-tax-asc") +
                  " inline-flex min-h-[36px] flex-col items-center justify-center text-center leading-tight"
                }
              >
                <span>商品</span>
                <span>売上税</span>
              </span>
              {renderMiniSortArrows("item-tax-desc", "item-tax-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "shipping-desc" || orderListSortMode === "shipping-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "shipping-desc" || orderListSortMode === "shipping-asc") + " whitespace-nowrap"}>配送料</span>
              {renderMiniSortArrows("shipping-desc", "shipping-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "shipping-tax-desc" || orderListSortMode === "shipping-tax-asc")}>
              <span
                className={
                  getSortHeaderTextClass(orderListSortMode === "shipping-tax-desc" || orderListSortMode === "shipping-tax-asc") +
                  " inline-flex min-h-[36px] flex-col items-center justify-center text-center leading-tight"
                }
              >
                <span>配送料</span>
                <span>税金</span>
              </span>
              {renderMiniSortArrows("shipping-tax-desc", "shipping-tax-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "promotion-desc" || orderListSortMode === "promotion-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "promotion-desc" || orderListSortMode === "promotion-asc") + " whitespace-nowrap"}>プロモーション割引額</span>
              {renderMiniSortArrows("promotion-desc", "promotion-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "promotion-tax-desc" || orderListSortMode === "promotion-tax-asc")}>
              <span
                className={
                  getSortHeaderTextClass(orderListSortMode === "promotion-tax-desc" || orderListSortMode === "promotion-tax-asc") +
                  " inline-flex min-h-[36px] w-full flex-col items-center justify-center text-center leading-tight whitespace-nowrap"
                }
              >
                <span className="whitespace-nowrap">プロモーション割引</span>
                <span className="whitespace-nowrap">税金</span>
              </span>
              {renderMiniSortArrows("promotion-tax-desc", "promotion-tax-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "fee-desc" || orderListSortMode === "fee-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "fee-desc" || orderListSortMode === "fee-asc") + " whitespace-nowrap"}>手数料</span>
              {renderMiniSortArrows("fee-desc", "fee-asc")}
            </div>
            <div className={getSortHeaderWrapClass(orderListSortMode === "fba-fee-desc" || orderListSortMode === "fba-fee-asc")}>
              <span className={getSortHeaderTextClass(orderListSortMode === "fba-fee-desc" || orderListSortMode === "fba-fee-asc") + " whitespace-nowrap"}>FBA 手数料</span>
              {renderMiniSortArrows("fba-fee-desc", "fba-fee-asc")}
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">loading...</div>
          ) : error ? (
            <div className="px-4 py-10 text-sm text-rose-600">{error}</div>
          ) : localVisibleRows.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">
              当前筛选条件下暂无店铺订单数据。
            </div>
          ) : (
            localVisibleRows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  drawerOpenedAtRef.current = Date.now();
                  setDrawerRowId(row.id);
                  setIsBreakdownDrawerOpen(true);
                  onSelectRow(row.id);
                }}
                className={`grid w-full grid-cols-[110px_118px_124px_108px_124px_140px_212px_96px_84px] gap-4 border-t border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                  selectedRowId === row.id ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : ""
                }`}
              >
                <div className="text-slate-600">{row.date}</div>
                <div className="text-right font-medium text-slate-900">
                  {formatAmazonOrderItemSales(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderItemSalesTax(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderShipping(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderShippingTax(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderPromotionDiscount(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderPromotionDiscountTax(row)}
                </div>
                <div className="text-right font-medium text-slate-900">
                  {formatAmazonOrderCommissionFee(row)}
                </div>
                <div className="text-right text-slate-600">
                  {formatAmazonOrderFbaFee(row)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6">
            <div className="text-sm text-slate-500">
              {localTotalRows === 0
                ? "当前筛选条件下暂无可显示数据。"
                : `全 ${localTotalRows} 行・総販売数量 ${filteredTotalQuantity} 点のうち、${localPageStartRow} - ${localPageEndRow} 行を表示`}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">1ページあたり</label>
              <select
                value={pageSize}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (next === 20 || next === 50 || next === 100) {
                    setPageSize(next);
                    setCurrentPage(1);
                  }
                }}
                className="h-10 min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
              </select>
            </div>
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
              onClick={() => setCurrentPage(clampPage(currentPage - 1, localTotalPages))}
              disabled={currentPage <= 1}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              前へ
            </button>

            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
              {currentPage} / {localTotalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(clampPage(currentPage + 1, localTotalPages))}
              disabled={currentPage >= localTotalPages}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(localTotalPages)}
              disabled={currentPage >= localTotalPages}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              最後
            </button>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div
            aria-label="Close transaction breakdown drawer"
            onClick={() => closeBreakdownDrawer("backdrop")}
            className="fixed lg:absolute top-16 bottom-0 right-0 lg:inset-0 left-[320px] left-[260px] z-40 bg-slate-950/30 backdrop-blur-[1px]"
          />

          <aside className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-full max-w-[760px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">Transaction Breakdown</div>
                  <div className="mt-2 text-sm text-slate-500">
                    選択中の聚合行に紐づく原始 transaction を右側で確認できます。
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={drawerStoreOperationHref}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    店舗運営費で開く
                  </Link>
                  <button
                    type="button"
                    onClick={() => closeBreakdownDrawer("generic")}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    閉じる
                  </button>
                </div>
              </div>

              {drawerSelectedRow ? (
                <>
                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      订单摘要
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">注文番号</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRow.externalRef || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">SKU</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRow.sku || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">日付</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRow.date || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">関連行数</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRawTransactionRows.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      金额摘要
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">商品売上</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderItemSales(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">商品の売上税</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderItemSalesTax(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">配送料</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderShipping(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">配送料の税金</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderShippingTax(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">プロモーション割引額</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderPromotionDiscount(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">プロモーション割引の税金</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderPromotionDiscountTax(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">手数料</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderCommissionFee(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">FBA 手数料</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatAmazonOrderFbaFee(drawerSelectedRow)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">数量 合計</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {breakdownQtySum}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  筛选与操作
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {BREAKDOWN_FILTER_ITEMS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setBreakdownFilter(item)}
                        className={
                          breakdownFilter === item
                            ? "rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                            : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        }
                      >
                        {BREAKDOWN_FILTER_LABELS[item]}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={breakdownSortMode}
                      onChange={(e) =>
                        setBreakdownSortMode(e.target.value as BreakdownSortMode)
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="date-desc">日期新→旧</option>
                      <option value="amount-desc">金额高→低</option>
                      <option value="fee-desc">Fee高→低</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyBreakdownSummary();
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      复制核对摘要
                    </button>
                  </div>
                </div>

                {copyMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {copyMessage}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  明细结果摘要
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">ALL</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{breakdownTagSummary.ALL}</div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-500">ORDER</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{breakdownTagSummary.ORDER}</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-sky-500">FEE</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{breakdownTagSummary.FEE}</div>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-rose-500">REFUND</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{breakdownTagSummary.REFUND}</div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-amber-500">ADJUST</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{breakdownTagSummary.ADJUST}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  原始 transaction 明细
                </div>
              </div>

              {breakdownRows.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  当前未找到与所选聚合行匹配的原始 transaction。
                  <div className="mt-2 text-xs text-slate-400">
                    Drawer 已正常打开。请继续检查 date / orderId / SKU 聚合键，或切换至原始 transaction 视图进行核对。
                  </div>
                </div>
              ) : (
                breakdownRows.map((row) => {
                  const breakdownTag = getBreakdownTag(row);
                  const sourceBadge = getSourceBadge(row);
                  const linkedChargeHint = buildLinkedChargeHint(row);
                  const correlationHint = buildOrderFeeCorrelationHint({
                    row,
                    relatedRows: drawerSelectedRawTransactionRows,
                  });
                  const storeOperationHref = buildStoreOperationDrawerHref({
                    lang,
                    selectedRow: drawerSelectedRow,
                    row,
                  });

                  return (
                    <div
                      key={row.id}
                      className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${breakdownTag.className}`}
                            >
                              {breakdownTag.label}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourceBadge.className}`}
                            >
                              {sourceBadge.label}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {row.externalRef || row.label}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {row.productName || row.label}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            G {formatIncomeJPY(row.grossAmount ?? row.amount ?? 0)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            N {formatIncomeJPY(row.netAmount ?? row.amount ?? 0)} / F {formatIncomeJPY(row.feeAmount ?? 0)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Date</div>
                          <div className="mt-1 text-sm text-slate-800">{row.date}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">SKU</div>
                          <div className="mt-1 text-sm text-slate-800">{row.sku || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Qty</div>
                          <div className="mt-1 text-sm text-slate-800">{row.quantity ?? "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Store / Fulfillment</div>
                          <div className="mt-1 text-sm text-slate-800">
                            {row.store} / {row.fulfillment || "-"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Tax / Shipping</div>
                          <div className="mt-1 text-sm text-slate-800">
                            T {formatIncomeJPY(row.taxAmount ?? 0)} / S {formatIncomeJPY(row.shippingAmount ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Promotion</div>
                          <div className="mt-1 text-sm text-slate-800">
                            {formatIncomeJPY(row.promotionAmount ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Transaction Time</div>
                          <div className="mt-1 text-sm text-slate-800">
                            {row.importedAt || row.date || "-"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Source Detail</div>
                          <div className="mt-1 text-sm text-slate-800">
                            {row.sourceType || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Account {row.account || "-"} / Label {row.label || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Memo / Source</div>
                        <div className="mt-1 text-sm text-slate-800">{row.memo || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.sourceType || "-"}</div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-sky-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-sky-500">Linked Charge Hint</div>
                          <div className="mt-1 text-sm text-slate-800">{linkedChargeHint}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-emerald-50 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-emerald-500">Order / Fee Correlation Hint</div>
                          <div className="mt-1 text-sm text-slate-800">{correlationHint}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          transactionId: {row.id}
                        </div>

                        <Link
                          href={storeOperationHref}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          店舗運営費で確認
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
