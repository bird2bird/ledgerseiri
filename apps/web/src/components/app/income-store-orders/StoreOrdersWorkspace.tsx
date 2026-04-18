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
type OrderDateRangePreset = "ALL" | "30D" | "60D" | "90D";
type OrderListSortMode = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "qty-desc";

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
  "60D": "近60天",
  "90D": "近90天",
};

const ORDER_LIST_SORT_LABELS: Record<OrderListSortMode, string> = {
  "date-desc": "日期新→旧",
  "date-asc": "日期旧→新",
  "amount-desc": "金额高→低",
  "amount-asc": "金额低→高",
  "qty-desc": "数量高→低",
};

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function toOrderDateMs(row: IncomeRow) {
  const raw = String(row.date || row.sortAt || row.importedAt || "").trim();
  if (!raw) return 0;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const match = raw.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])[\/\-.月]?\s*(0?[1-9]|[12]\d|3[01])?/);
  if (!match) return 0;

  const yyyy = Number(match[1]);
  const mm = Number(match[2]) - 1;
  const dd = Number(match[3] || 1);
  return new Date(yyyy, mm, dd).getTime();
}

function filterRowsByOrderDateRange(rows: IncomeRow[], preset: OrderDateRangePreset) {
  if (preset === "ALL") return rows;

  const days = preset === "30D" ? 30 : preset === "60D" ? 60 : 90;
  const timestamps = rows.map(toOrderDateMs).filter((value) => value > 0);
  if (timestamps.length === 0) return rows;

  const maxTs = Math.max(...timestamps);
  const threshold = maxTs - days * 24 * 60 * 60 * 1000;

  return rows.filter((row) => {
    const ts = toOrderDateMs(row);
    if (ts <= 0) return false;
    return ts >= threshold && ts <= maxTs;
  });
}

function sortOrderListRows(rows: IncomeRow[], sortMode: OrderListSortMode) {
  const next = [...rows];

  if (sortMode === "date-asc") {
    return next.sort((a, b) => toOrderDateMs(a) - toOrderDateMs(b));
  }

  if (sortMode === "amount-desc") {
    return next.sort((a, b) => amountOf(b) - amountOf(a));
  }

  if (sortMode === "amount-asc") {
    return next.sort((a, b) => amountOf(a) - amountOf(b));
  }

  if (sortMode === "qty-desc") {
    return next.sort((a, b) => Number(b.quantity ?? 0) - Number(a.quantity ?? 0));
  }

  return next.sort((a, b) => toOrderDateMs(b) - toOrderDateMs(a));
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

  const avgOrderAmount = totalRows > 0 ? totalAmount / totalRows : 0;
  const storeSummary = useMemo(() => buildStoreSummary(rows), [rows]);
  const labelSummary = useMemo(() => buildLabelSummary(rows), [rows]);
  const sampleBars = useMemo(() => buildSampleBars(rows), [rows]);

  const uniqueStores = storeSummary.length;
  const topStore = storeSummary[0];
  const maxStoreAmount = Math.max(1, ...storeSummary.map((item) => item.amount), 1);
  const maxBarAmount = Math.max(1, ...sampleBars.map((row) => amountOf(row)), 1);

  const viewModeLabel =
    storeOrderViewMode === "aggregated" ? "聚合视图" : "原始transaction视图";

  const [breakdownFilter, setBreakdownFilter] = useState<BreakdownFilter>("ALL");
  const [breakdownSortMode, setBreakdownSortMode] =
    useState<BreakdownSortMode>("date-desc");
  const [orderDateRangePreset, setOrderDateRangePreset] =
    useState<OrderDateRangePreset>("ALL");
  const [orderListSortMode, setOrderListSortMode] =
    useState<OrderListSortMode>("date-desc");
  const [copyMessage, setCopyMessage] = useState("");
  const [drawerRowId, setDrawerRowId] = useState("");
  const [isBreakdownDrawerOpen, setIsBreakdownDrawerOpen] = useState(false);
  const drawerOpenedAtRef = React.useRef(0);

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

  const filteredOrderRows = useMemo(
    () => filterRowsByOrderDateRange(rows, orderDateRangePreset),
    [rows, orderDateRangePreset]
  );

  const sortedOrderRows = useMemo(
    () => sortOrderListRows(filteredOrderRows, orderListSortMode),
    [filteredOrderRows, orderListSortMode]
  );

  const orderListTotalRows = sortedOrderRows.length;
  const orderListTotalPages = Math.max(1, Math.ceil(orderListTotalRows / pageSize));

  const orderListVisibleRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrderRows.slice(start, start + pageSize);
  }, [sortedOrderRows, currentPage, pageSize]);

  const orderListPageStart =
    orderListTotalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const orderListPageEnd =
    orderListTotalRows === 0 ? 0 : Math.min(currentPage * pageSize, orderListTotalRows);

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
    if (currentPage > orderListTotalPages) {
      setCurrentPage(orderListTotalPages);
    }
  }, [currentPage, orderListTotalPages, setCurrentPage]);

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
    if (!selectedRowId) return;
    const stillExists = rows.some((row) => row.id === selectedRowId);
    if (!stillExists) {
      onSelectRow("");
    }
  }, [selectedRowId, rows, onSelectRow]);

  React.useEffect(() => {
    if (storeOrderViewMode === "aggregated") return;
    if (!selectedRowId) return;
    onSelectRow("");
  }, [storeOrderViewMode, selectedRowId, onSelectRow]);

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

  if (!isActiveRoute) {
    return null;
  }

  return (
    <div className="space-y-6">
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
          <div className="mt-3 text-4xl font-semibold">{formatIncomeJPY(totalAmount)}</div>
          <div className="mt-4 text-sm text-white/80">
            {viewModeLabel}で表示中の売上総額
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#06b6d4,#67e8f9)] p-6 text-slate-950 shadow-sm">
          <div className="text-sm text-slate-700">表示行数</div>
          <div className="mt-3 text-4xl font-semibold">{totalRows}</div>
          <div className="mt-4 text-sm text-slate-700">
            聚合 {aggregatedStoreOrderCount} / 原始 {rawStoreOrderCount}
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(135deg,#f97316,#fb923c)] p-6 text-white shadow-sm">
          <div className="text-sm text-white/80">総販売数量</div>
          <div className="mt-3 text-4xl font-semibold">{totalQuantity}</div>
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
              下半分には店舗注文の一覧を表示します。日付範囲と並び順を切り替えて確認できます。
            </div>
          </div>

          <div className="grid gap-3 xl:min-w-[420px]">
            <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
              <label className="text-sm font-medium text-slate-700">订单日期范围</label>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "30D", "60D", "90D"] as OrderDateRangePreset[]).map((item) => (
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

            <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
              <label className="text-sm font-medium text-slate-700">排序</label>
              <div className="flex flex-wrap gap-2">
                {(["date-desc", "date-asc", "amount-desc", "amount-asc", "qty-desc"] as OrderListSortMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setOrderListSortMode(item)}
                    className={
                      orderListSortMode === item
                        ? "rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {ORDER_LIST_SORT_LABELS[item]}
                  </button>
                ))}
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
          ) : orderListVisibleRows.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">注文データがありません。</div>
          ) : (
            orderListVisibleRows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  drawerOpenedAtRef.current = Date.now();
                  setDrawerRowId(row.id);
                  setIsBreakdownDrawerOpen(true);
                  onSelectRow(row.id);
                }}
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
            全 {orderListTotalRows} 行・総販売数量 {totalQuantity} 点のうち、{orderListPageStart} - {orderListPageEnd} 行を表示
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
              onClick={() => setCurrentPage(clampPage(currentPage - 1, orderListTotalPages))}
              disabled={currentPage <= 1}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              前へ
            </button>

            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
              {currentPage} / {orderListTotalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(clampPage(currentPage + 1, orderListTotalPages))}
              disabled={currentPage >= orderListTotalPages}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(orderListTotalPages)}
              disabled={currentPage >= orderListTotalPages}
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
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
          />

          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-[760px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">Transaction Breakdown</div>
                  <div className="mt-2 text-sm text-slate-500">
                    選択中の聚合行に紐づく原始 transaction を右側で確認できます。
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => closeBreakdownDrawer("generic")}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>

              {drawerSelectedRow ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Order ID</div>
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
                      <div className="text-xs text-slate-500">Date</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRow.date || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {drawerSelectedRawTransactionRows.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Gross Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatIncomeJPY(breakdownGrossSum)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Net Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatIncomeJPY(breakdownNetSum)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Fee Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatIncomeJPY(breakdownFeeSum)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Qty Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {breakdownQtySum}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="mt-5 space-y-3">
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
              {breakdownRows.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  当前未找到与所选聚合行匹配的原始 transaction。Drawer 已正常打开，请继续检查 date / orderId / SKU 聚合键是否一致。
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
