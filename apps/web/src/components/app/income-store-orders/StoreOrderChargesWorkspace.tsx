"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LedgerTemplateDownloadButton } from "@/components/app/ledger/LedgerTemplateDownloadButton";
import { LEDGER_SCOPES } from "@/core/ledger/ledger-scopes";
import { loadAmazonStoreOrdersStage } from "@/core/jobs";
import { listTransactions, type TransactionItem } from "@/core/transactions/api";
import {
  buildImportAwareBannerText,
  buildStoreOrdersWorkspaceHref,
  readCrossWorkspaceQuery,
  readImportAwareWorkspaceContext,
} from "@/core/income-store-orders/cross-workspace-query";

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

type ChargeSummary = {
  orderSale?: number;
  adFee: number;
  storageFee: number;
  subscriptionFee: number;
  fbaFee: number;
  tax: number;
  payout: number;
  adjustment: number;
  other: number;
};

function normalizeImportMonths(values: string[]) {
  return values.map((x) => String(x || "").trim()).filter(Boolean);
}

function deriveTransactionMonth(item: TransactionItem): string {
  const businessMonth = String(item.businessMonth || "").trim();
  if (businessMonth) return businessMonth;

  const raw = String(item.occurredAt || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const m = raw.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])/);
  if (!m) return "";
  return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}`;
}

function parseStoreOperationMemo(memo?: string | null) {
  const raw = String(memo || "");
  const prefix = "[imports:store-operation]";
  if (!raw.startsWith(prefix)) {
    return {
      isStoreOperationImport: false,
      kind: "OTHER",
      description: raw || "",
    };
  }

  const body = raw.slice(prefix.length).trim();
  const [kindPart, ...rest] = body.split("|");
  const kind = String(kindPart || "OTHER").trim() || "OTHER";
  const description = rest.join("|").trim() || body || "-";

  return {
    isStoreOperationImport: true,
    kind,
    description,
  };
}

function buildChargeSummaryFromItems(items: ChargeItem[]): ChargeSummary {
  const summary: ChargeSummary = {
    orderSale: 0,
    adFee: 0,
    storageFee: 0,
    subscriptionFee: 0,
    fbaFee: 0,
    tax: 0,
    payout: 0,
    adjustment: 0,
    other: 0,
  };

  for (const item of items) {
    const value = Number(item.signedAmount || 0);
    switch (String(item.kind || "")) {
      case "ORDER_SALE":
        summary.orderSale = Number(summary.orderSale || 0) + value;
        break;
      case "AD_FEE":
        summary.adFee += value;
        break;
      case "STORAGE_FEE":
        summary.storageFee += value;
        break;
      case "SUBSCRIPTION_FEE":
        summary.subscriptionFee += value;
        break;
      case "FBA_FEE":
        summary.fbaFee += value;
        break;
      case "TAX":
        summary.tax += value;
        break;
      case "PAYOUT":
        summary.payout += value;
        break;
      case "ADJUSTMENT":
        summary.adjustment += value;
        break;
      default:
        summary.other += value;
        break;
    }
  }

  return summary;
}

function mapTransactionsToChargeItems(args: {
  items: TransactionItem[];
  importJobId: string;
  importMonths: string[];
}) {
  const { items, importJobId, importMonths } = args;
  const monthSet = new Set(normalizeImportMonths(importMonths));

  return items
    .filter((item) => {
      const parsed = parseStoreOperationMemo(item.memo);
      if (!parsed.isStoreOperationImport) return false;

      const sameJob = importJobId
        ? String(item.importJobId || "").trim() === importJobId
        : true;

      const sameMonth =
        monthSet.size > 0 ? monthSet.has(deriveTransactionMonth(item)) : true;

      return sameJob && sameMonth;
    })
    .map((item, index) => {
      const parsed = parseStoreOperationMemo(item.memo);
      const signedAmount =
        String(item.direction || "") === "INCOME"
          ? Number(item.amount || 0)
          : -Math.abs(Number(item.amount || 0));

      return {
        id: String(item.id || `tx-${index + 1}`),
        rowNo: Number(item.sourceRowNo || index + 1),
        occurredAt: item.occurredAt || null,
        orderId: item.externalRef || null,
        sku: null,
        transactionType: parsed.kind || "OTHER",
        description: parsed.description || "-",
        kind: parsed.kind || "OTHER",
        signedAmount,
      } as ChargeItem;
    });
}

type ChargeFilter =
  | "ALL"
  | "AD_FEE"
  | "STORAGE_FEE"
  | "SUBSCRIPTION_FEE"
  | "FBA_FEE"
  | "TAX"
  | "PAYOUT"
  | "ADJUSTMENT"
  | "OTHER"
  | "ORDER_SALE";

type PageSize = 20 | 50 | 100;
type ChargeDateRangePreset = "ALL" | "30D" | "90D" | "365D" | "CUSTOM";
type ChargeSortMode = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const CHARGE_DATE_RANGE_LABELS: Record<ChargeDateRangePreset, string> = {
  ALL: "全部",
  "30D": "近30天",
  "90D": "近90天",
  "365D": "近365天",
  CUSTOM: "自定义",
};

const CHARGE_SORT_LABELS: Record<ChargeSortMode, string> = {
  "date-desc": "日期（新→旧）",
  "date-asc": "日期（旧→新）",
  "amount-desc": "金额绝对值（高→低）",
  "amount-asc": "金额绝对值（低→高）",
};

const STORE_OPERATION_QUERY_KEYS = {
  filter: "socFilter",
  pageSize: "socPageSize",
  page: "socPage",
  drawer: "socDrawer",
} as const;

const EMPTY_SUMMARY: ChargeSummary = {
  orderSale: 0,
  adFee: 0,
  storageFee: 0,
  subscriptionFee: 0,
  fbaFee: 0,
  tax: 0,
  payout: 0,
  adjustment: 0,
  other: 0,
};

function readInitialFilter(value: string): ChargeFilter {
  const raw = String(value || "").toUpperCase().trim();
  const allowed = new Set<ChargeFilter>([
    "ALL",
    "AD_FEE",
    "STORAGE_FEE",
    "SUBSCRIPTION_FEE",
    "FBA_FEE",
    "TAX",
    "PAYOUT",
    "ADJUSTMENT",
    "OTHER",
    "ORDER_SALE",
  ]);
  return allowed.has(raw as ChargeFilter) ? (raw as ChargeFilter) : "ALL";
}

const FILTER_ITEMS: Array<{ value: ChargeFilter; label: string }> = [
  { value: "ALL", label: "全分類" },
  { value: "AD_FEE", label: "広告費" },
  { value: "SUBSCRIPTION_FEE", label: "月額登録料" },
  { value: "STORAGE_FEE", label: "倉庫費用" },
  { value: "FBA_FEE", label: "FBA費用" },
  { value: "TAX", label: "税金" },
  { value: "PAYOUT", label: "振込" },
  { value: "ADJUSTMENT", label: "調整" },
  { value: "OTHER", label: "その他" },
];

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

function chargeKindBadge(kind?: string) {
  switch (String(kind || "")) {
    case "AD_FEE":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    case "STORAGE_FEE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "SUBSCRIPTION_FEE":
      return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";
    case "FBA_FEE":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "TAX":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "PAYOUT":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200";
    case "ADJUSTMENT":
      return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200";
    case "ORDER_SALE":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function parseChargeTimestamp(value?: string | null): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const normalized = raw.replace(/\s+JST$/i, "").trim();
  const m = normalized.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) return 0;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] || "0");
  const minute = Number(m[5] || "0");
  const second = Number(m[6] || "0");

  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatChargeDate(value?: string | null): string {
  const ts = parseChargeTimestamp(value);
  if (ts <= 0) return String(value || "-");
  return new Date(ts).toLocaleDateString("ja-JP");
}

function formatChargeDateTime(value?: string | null): string {
  const ts = parseChargeTimestamp(value);
  if (ts <= 0) return String(value || "-");
  return new Date(ts).toLocaleString("ja-JP");
}

function sortCharges(items: ChargeItem[]) {
  return [...items].sort((a, b) => {
    const dateDiff = parseChargeTimestamp(b.occurredAt) - parseChargeTimestamp(a.occurredAt);
    if (dateDiff !== 0) return dateDiff;
    const absDiff =
      Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0));
    if (absDiff !== 0) return absDiff;
    return String(a.id).localeCompare(String(b.id));
  });
}

function sumSignedAmount(items: ChargeItem[]) {
  return items.reduce((sum, item) => sum + Number(item.signedAmount || 0), 0);
}

function sumAbsAmount(items: ChargeItem[]) {
  return items.reduce((sum, item) => sum + Math.abs(Number(item.signedAmount || 0)), 0);
}

function biggestCategory(summary: ChargeSummary) {
  const pairs = [
    { key: "AD_FEE", label: "広告費", value: Number(summary.adFee || 0) },
    { key: "STORAGE_FEE", label: "倉庫費用", value: Number(summary.storageFee || 0) },
    { key: "SUBSCRIPTION_FEE", label: "月額登録料", value: Number(summary.subscriptionFee || 0) },
    { key: "FBA_FEE", label: "FBA費用", value: Number(summary.fbaFee || 0) },
    { key: "TAX", label: "税金", value: Number(summary.tax || 0) },
    { key: "PAYOUT", label: "振込", value: Number(summary.payout || 0) },
    { key: "ADJUSTMENT", label: "調整", value: Number(summary.adjustment || 0) },
    { key: "OTHER", label: "その他", value: Number(summary.other || 0) },
  ];
  return pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function isChargePageSize(value: string): value is "20" | "50" | "100" {
  return value === "20" || value === "50" || value === "100";
}

function normalizeChargeDateInputValue(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function toChargeDateBoundaryMs(value: string, endOfDay: boolean) {
  const normalized = normalizeChargeDateInputValue(value);
  if (!normalized) return 0;
  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  const ts = new Date(`${normalized}${suffix}`).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function filterChargeItemsByDateRange(
  rows: ChargeItem[],
  preset: ChargeDateRangePreset,
  startDate: string,
  endDate: string
) {
  if (preset === "ALL") return rows;

  if (preset === "CUSTOM") {
    const startMs = toChargeDateBoundaryMs(startDate, false);
    const endMs = toChargeDateBoundaryMs(endDate, true);
    if (!startMs && !endMs) return rows;

    return rows.filter((row) => {
      const ts = parseChargeTimestamp(row.occurredAt);
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
    const ts = parseChargeTimestamp(row.occurredAt);
    return ts > 0 && ts >= threshold && ts <= now;
  });
}

function sortChargeItems(rows: ChargeItem[], sortMode: ChargeSortMode) {
  const next = [...rows];

  if (sortMode === "date-asc") {
    return next.sort((a, b) => {
      const d = parseChargeTimestamp(a.occurredAt) - parseChargeTimestamp(b.occurredAt);
      if (d !== 0) return d;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  if (sortMode === "amount-desc") {
    return next.sort((a, b) => {
      const d = Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0));
      if (d !== 0) return d;
      return parseChargeTimestamp(b.occurredAt) - parseChargeTimestamp(a.occurredAt);
    });
  }

  if (sortMode === "amount-asc") {
    return next.sort((a, b) => {
      const d = Math.abs(Number(a.signedAmount || 0)) - Math.abs(Number(b.signedAmount || 0));
      if (d !== 0) return d;
      return parseChargeTimestamp(b.occurredAt) - parseChargeTimestamp(a.occurredAt);
    });
  }

  return next.sort((a, b) => {
    const d = parseChargeTimestamp(b.occurredAt) - parseChargeTimestamp(a.occurredAt);
    if (d !== 0) return d;
    return Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0));
  });
}

function buildRelatedCharges(args: {
  selected: ChargeItem | null;
  rows: ChargeItem[];
}) {
  const { selected, rows } = args;
  if (!selected) return [];

  const selectedOrderId = String(selected.orderId || "");
  const selectedSku = String(selected.sku || "");
  const selectedDate = formatChargeDate(selected.occurredAt);

  const related = rows.filter((row) => {
    const sameOrder = selectedOrderId && String(row.orderId || "") === selectedOrderId;
    const sameSku = selectedSku && String(row.sku || "") === selectedSku;
    const sameDate = formatChargeDate(row.occurredAt) === selectedDate;
    const sameKind = String(row.kind || "") === String(selected.kind || "");
    return sameOrder || sameSku || (sameDate && sameKind);
  });

  const dedup = new Map<string, ChargeItem>();
  related.forEach((row) => dedup.set(row.id, row));
  return sortCharges(Array.from(dedup.values()));
}

function buildChargeCorrelationHint(args: {
  selected: ChargeItem;
  relatedRows: ChargeItem[];
}) {
  const { selected, relatedRows } = args;

  const sameOrderRows = relatedRows.filter(
    (row) =>
      selected.orderId &&
      String(row.orderId || "") === String(selected.orderId || "")
  );
  const sameSkuRows = relatedRows.filter(
    (row) => selected.sku && String(row.sku || "") === String(selected.sku || "")
  );
  const sameKindRows = relatedRows.filter(
    (row) => String(row.kind || "") === String(selected.kind || "")
  );

  if (selected.kind === "FBA_FEE") {
    return sameOrderRows.length > 0
      ? `同一 Order ID の関連行が ${sameOrderRows.length} 件あります。FBA費用が注文側に紐づくか確認できます。`
      : "FBA費用ですが、同一 Order ID の関連行は明確ではありません。SKU または同日 settlement と照合してください。";
  }

  if (selected.kind === "PAYOUT") {
    return "振込行です。通常は個別注文より settlement 単位の精算結果として確認するのが適切です。";
  }

  if (selected.kind === "ADJUSTMENT") {
    return `調整行です。同 kind の関連行 ${sameKindRows.length} 件を見ながら、訂正・相殺の関係を確認してください。`;
  }

  if (selected.kind === "TAX") {
    return sameOrderRows.length > 0 || sameSkuRows.length > 0
      ? "税金行です。Order / SKU と関連する費用・売上行があるため、課税対象との関係を確認できます。"
      : "税金行です。個別注文よりも charges 集約で見る方が適切な可能性があります。";
  }

  return sameOrderRows.length > 0 || sameSkuRows.length > 0
    ? `同一 Order / SKU の関連行が見つかっています。注文側明細と相互に照合できます。`
    : "関連行は限定的です。日付・種别・金額帯で監査してください。";
}

function buildReverseStoreOrdersHref(args: {
  lang: string;
  charge: ChargeItem;
  importJobId?: string;
  months?: string[];
  module?: string;
}) {
  const { lang, charge, importJobId, months, module } = args;

  return buildStoreOrdersWorkspaceHref({
    lang,
    from: "store-operation-drawer",
    autoDrawer: true,
    orderId: charge.orderId || "",
    sku: charge.sku || "",
    date: charge.occurredAt ? formatChargeDate(charge.occurredAt) : "",
    transactionId: String(charge.id || ""),
    focusChargeId: String(charge.id || ""),
    importJobId: importJobId || "",
    months: months || [],
    module: module || "store-orders",
  });
}

export function StoreOrderChargesWorkspace(props: { lang: string }) {
  const { lang } = props;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const crossQuery = useMemo(
    () => readCrossWorkspaceQuery(searchParams),
    [searchParamsKey]
  );
  const focusTransactionId =
    crossQuery.transactionId || crossQuery.focusChargeId;

  const importContext = useMemo(
    () => readImportAwareWorkspaceContext(searchParams),
    [searchParamsKey]
  );
  const importMonths = useMemo(
    () => normalizeImportMonths(importContext.months),
    [importContext.months.join("|")]
  );
  const importMonthsKey = importMonths.join("|");

  const importBanner = buildImportAwareBannerText({
    targetLabel: "店舗運営費",
    importJobId: importContext.importJobId,
    months: importMonths,
  });

  const expectedPath = `/${lang}/app/expenses/store-operation`;
  const isActiveRoute = pathname === expectedPath;

  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [summary, setSummary] = useState<ChargeSummary>(EMPTY_SUMMARY);
  const [selectedFilter, setSelectedFilter] = useState<ChargeFilter>(
    readInitialFilter(crossQuery.kind)
  );
  const [chargeDateRangePreset, setChargeDateRangePreset] =
    useState<ChargeDateRangePreset>("ALL");
  const [chargeSortMode, setChargeSortMode] =
    useState<ChargeSortMode>("date-desc");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [draftCustomDateStart, setDraftCustomDateStart] = useState("");
  const [draftCustomDateEnd, setDraftCustomDateEnd] = useState("");
  const [stageFilename, setStageFilename] = useState("");
  const [stageSavedAt, setStageSavedAt] = useState("");
  const [hasStage, setHasStage] = useState(false);

  const initialPageSize = (() => {
    const raw = searchParams.get(STORE_OPERATION_QUERY_KEYS.pageSize) || "";
    return isChargePageSize(raw) ? (Number(raw) as PageSize) : 20;
  })();

  const initialPage = (() => {
    const raw = searchParams.get(STORE_OPERATION_QUERY_KEYS.page) || "";
    if (!/^\d+$/.test(raw)) return 1;
    return Math.max(1, Number(raw));
  })();

  const initialDrawerId = searchParams.get(STORE_OPERATION_QUERY_KEYS.drawer) || "";

  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedChargeId, setSelectedChargeId] = useState(initialDrawerId);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      if (importContext.active) {
        try {
          const res = await listTransactions();
          if (!mounted) return;

          const items = Array.isArray(res.items) ? res.items : [];
          const mapped = sortCharges(
            mapTransactionsToChargeItems({
              items,
              importJobId: importContext.importJobId,
              importMonths,
            })
          );

          setHasStage(false);
          setCharges(mapped);
          setSummary(buildChargeSummaryFromItems(mapped));
          setStageFilename(importContext.importJobId ? `importJob:${importContext.importJobId}` : "db-backed import result");
          setStageSavedAt("");
        } catch (_err) {
          if (!mounted) return;
          setHasStage(false);
          setCharges([]);
          setSummary(EMPTY_SUMMARY);
          setStageFilename(importContext.importJobId ? `importJob:${importContext.importJobId}` : "db-backed import result");
          setStageSavedAt("");
        }
        return;
      }

      const stage = loadAmazonStoreOrdersStage();
      if (!mounted) return;
      setHasStage(!!stage);
      setCharges(Array.isArray(stage?.charges) ? stage!.charges : []);
      setSummary(stage?.chargeSummary ?? EMPTY_SUMMARY);
      setStageFilename(stage?.filename ?? "");
      setStageSavedAt(stage?.savedAt ?? "");
    }

    void loadInitialData();

    return () => {
      mounted = false;
    };
  }, [importContext.active, importContext.importJobId, importMonthsKey]);

  const expenseOnlyCharges = useMemo(() => {
    const base = charges.filter((item) => item.kind !== "ORDER_SALE");
    if (!importContext.active || importContext.months.length === 0) {
      return base;
    }
    const monthSet = new Set(importMonths);
    return base.filter((item) => {
      const direct = String(item.occurredAt || "");
      const match = direct.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])/);
      const month = match
        ? `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`
        : "";
      return month ? monthSet.has(month) : false;
    });
  }, [charges, importContext.active, importMonthsKey]);

  const filteredCharges = useMemo(() => {
    let next = expenseOnlyCharges;

    if (selectedFilter !== "ALL") {
      next = next.filter((item) => item.kind === selectedFilter);
    }

    next = filterChargeItemsByDateRange(
      next,
      chargeDateRangePreset,
      customDateStart,
      customDateEnd
    );

    return sortChargeItems(next, chargeSortMode);
  }, [
    expenseOnlyCharges,
    selectedFilter,
    chargeDateRangePreset,
    customDateStart,
    customDateEnd,
    chargeSortMode,
  ]);

  useEffect(() => {
    const nextFilter = searchParams.get(STORE_OPERATION_QUERY_KEYS.filter) || "";
    const nextPageSize = searchParams.get(STORE_OPERATION_QUERY_KEYS.pageSize) || "";
    const nextPage = searchParams.get(STORE_OPERATION_QUERY_KEYS.page) || "";
    const nextDrawer = searchParams.get(STORE_OPERATION_QUERY_KEYS.drawer) || "";

    if (nextFilter) {
      const parsedFilter = readInitialFilter(nextFilter);
      if (parsedFilter !== selectedFilter) {
        setSelectedFilter((prev) => (prev === parsedFilter ? prev : parsedFilter));
      }
    }

    if (isChargePageSize(nextPageSize) && Number(nextPageSize) !== pageSize) {
      setPageSize(Number(nextPageSize) as PageSize);
    }

    if (/^\d+$/.test(nextPage)) {
      const parsedPage = Math.max(1, Number(nextPage));
      if (parsedPage !== currentPage) {
        setCurrentPage((prev) => (prev === parsedPage ? prev : parsedPage));
      }
    }

    if (nextDrawer && nextDrawer !== selectedChargeId) {
      setSelectedChargeId(nextDrawer);
    }

    hasHydratedChargeQueryStateRef.current = true;
    lastWrittenChargeQueryRef.current = searchParams.toString();
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage((prev) => (prev === 1 ? prev : 1));
  }, [selectedFilter, chargeDateRangePreset, customDateStart, customDateEnd, chargeSortMode, pageSize]);

  useEffect(() => {
    if (!crossQuery.kind) return;
    const nextFilter = readInitialFilter(crossQuery.kind);
    if (nextFilter !== selectedFilter) {
      setSelectedFilter((prev) => (prev === nextFilter ? prev : nextFilter));
    }
  }, [crossQuery.kind, selectedFilter]);

  useEffect(() => {
    if (!crossQuery.autoDrawer) return;
    if (!filteredCharges.length) {
      setSelectedChargeId("");
      return;
    }
    if (selectedChargeId) return;

    if (focusTransactionId) {
      const exact = filteredCharges.find((item) => item.id === focusTransactionId);
      if (exact) {
        drawerOpenedAtRef.current = Date.now();
        setSelectedChargeId(exact.id);
        return;
      }
    }

    if (crossQuery.orderId || crossQuery.sku || crossQuery.date) {
      const matched = filteredCharges.find((item) => {
        const sameOrder = crossQuery.orderId
          ? String(item.orderId || "") === String(crossQuery.orderId)
          : true;
        const sameSku = crossQuery.sku
          ? String(item.sku || "") === String(crossQuery.sku)
          : true;
        const sameDate = crossQuery.date
          ? formatChargeDate(item.occurredAt) === String(crossQuery.date)
          : true;
        return sameOrder && sameSku && sameDate;
      });
      if (matched) {
        drawerOpenedAtRef.current = Date.now();
        setSelectedChargeId(matched.id);
      }
    }
  }, [
    crossQuery.autoDrawer,
    filteredCharges,
    focusTransactionId,
    crossQuery.orderId,
    crossQuery.sku,
    crossQuery.date,
    selectedChargeId,
  ]);

  const selectedCharge = useMemo(
    () => filteredCharges.find((item) => item.id === selectedChargeId) ?? null,
    [filteredCharges, selectedChargeId]
  );

  const selectedChargeStoreOrdersHref = useMemo(() => {
    if (!selectedCharge) {
      return buildStoreOrdersWorkspaceHref({
        lang,
        from: "store-operation-list",
        importJobId: importContext.importJobId,
        months: importMonths,
        module: importContext.module || "store-orders",
      });
    }

    return buildReverseStoreOrdersHref({
      lang,
      charge: selectedCharge,
      importJobId: importContext.importJobId,
      months: importMonths,
      module: importContext.module || "store-orders",
    });
  }, [
    lang,
    selectedCharge,
    importContext.importJobId,
    importMonthsKey,
    importContext.module,
  ]);

  const selectedChargeOrderRelatedCount = useMemo(() => {
    if (!selectedCharge?.orderId) return 0;
    return filteredCharges.filter(
      (item) => String(item.orderId || "") === String(selectedCharge.orderId || "")
    ).length;
  }, [selectedCharge, filteredCharges]);

  const selectedChargeSkuRelatedCount = useMemo(() => {
    if (!selectedCharge?.sku) return 0;
    return filteredCharges.filter(
      (item) => String(item.sku || "") === String(selectedCharge.sku || "")
    ).length;
  }, [selectedCharge, filteredCharges]);

  const relatedCharges = useMemo(
    () => buildRelatedCharges({ selected: selectedCharge, rows: filteredCharges }),
    [selectedCharge, filteredCharges]
  );

  const visibleSignedAmount = useMemo(() => sumSignedAmount(filteredCharges), [filteredCharges]);
  const visibleAbsAmount = useMemo(() => sumAbsAmount(filteredCharges), [filteredCharges]);
  const biggest = useMemo(() => biggestCategory(summary), [summary]);

  const lastUpdatedText = useMemo(() => {
    if (!stageSavedAt) return "-";
    const d = new Date(stageSavedAt);
    if (Number.isNaN(d.getTime())) return stageSavedAt;
    return d.toLocaleString("ja-JP");
  }, [stageSavedAt]);

  const noPreviewYet = !hasStage;
  const hasPreviewButNoCharges = hasStage && expenseOnlyCharges.length === 0;

  const drawerOpenedAtRef = useRef(0);
  const hasHydratedChargeQueryStateRef = useRef(false);
  const lastWrittenChargeQueryRef = useRef("");

  const totalRows = filteredCharges.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage((prev) => (prev === totalPages ? prev : totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!isActiveRoute) return;
    if (!hasHydratedChargeQueryStateRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set(STORE_OPERATION_QUERY_KEYS.filter, selectedFilter);
    params.set(STORE_OPERATION_QUERY_KEYS.pageSize, String(pageSize));
    params.set(STORE_OPERATION_QUERY_KEYS.page, String(currentPage));

    if (selectedChargeId) {
      params.set(STORE_OPERATION_QUERY_KEYS.drawer, selectedChargeId);
    } else {
      params.delete(STORE_OPERATION_QUERY_KEYS.drawer);
    }

    const nextQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");

    if (nextQuery === currentQuery) {
      lastWrittenChargeQueryRef.current = nextQuery;
      return;
    }

    if (nextQuery === lastWrittenChargeQueryRef.current) {
      return;
    }

    lastWrittenChargeQueryRef.current = nextQuery;
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

        // window.history.replaceState(window.history.state, "", nextUrl);
  }, [isActiveRoute, pathname, selectedFilter, pageSize, currentPage, selectedChargeId]);

  const visibleCharges = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCharges.slice(start, start + pageSize);
  }, [filteredCharges, currentPage, pageSize]);

  const pageStartRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEndRow = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows);

  const drawerOpen = !!selectedCharge && relatedCharges.length > 0;

  useEffect(() => {
    if (!selectedChargeId) return;
    const stillExists = filteredCharges.some((item) => item.id === selectedChargeId);
    if (!stillExists) {
      setSelectedChargeId("");
    }
  }, [selectedChargeId, filteredCharges]);

  useEffect(() => {
    if (!selectedChargeId) return;
    const selectedIndex = filteredCharges.findIndex((item) => item.id === selectedChargeId);
    if (selectedIndex < 0) return;

    const shouldPage = Math.floor(selectedIndex / pageSize) + 1;
    if (shouldPage !== currentPage) {
      setCurrentPage((prev) => (prev === shouldPage ? prev : shouldPage));
    }
  }, [selectedChargeId, filteredCharges, pageSize, currentPage]);

  useEffect(() => {
    if (selectedChargeId && !drawerOpen) {
      setSelectedChargeId("");
    }
  }, [selectedChargeId, drawerOpen]);

  const normalizedDraftCustomDateStart = normalizeChargeDateInputValue(draftCustomDateStart);
  const normalizedDraftCustomDateEnd = normalizeChargeDateInputValue(draftCustomDateEnd);
  const isCustomDateRangeInvalid =
    !!normalizedDraftCustomDateStart &&
    !!normalizedDraftCustomDateEnd &&
    normalizedDraftCustomDateStart > normalizedDraftCustomDateEnd;

  function applyCustomDateRange() {
    if (isCustomDateRangeInvalid) return;
    setChargeDateRangePreset("CUSTOM");
    setCustomDateStart(normalizedDraftCustomDateStart);
    setCustomDateEnd(normalizedDraftCustomDateEnd);
    setCurrentPage(1);
  }

  function clearCustomDateRange() {
    setChargeDateRangePreset("CUSTOM");
    setDraftCustomDateStart("");
    setDraftCustomDateEnd("");
    setCustomDateStart("");
    setCustomDateEnd("");
    setCurrentPage(1);
  }

  function closeDrawer(source: "generic" | "backdrop" = "generic") {
    if (source === "backdrop") {
      const elapsed = Date.now() - drawerOpenedAtRef.current;
      if (elapsed < 250) return;
    }

    setSelectedChargeId("");
  }
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
              {/* Step109-Z1-H4B-EXACT2-STORE-OPERATION-TEMPLATE-DOWNLOAD: fixed ledger_scope template for store-operation-expense. */}
              <div className="mt-4">
                <LedgerTemplateDownloadButton
                  scope={LEDGER_SCOPES.STORE_OPERATION_EXPENSE}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  店舗運営費テンプレート下载
                </LedgerTemplateDownloadButton>
              </div>
          <div className="mt-1 text-sm text-emerald-700">
            {importBanner.subtitle}
          </div>
          <div className="mt-2 text-xs text-emerald-700">
            当前列表已切换为 DB-backed import-aware results，并按统一 contract 进行过滤，不再依赖 browser stage。
          </div>
        </div>
      ) : null}
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
              href={buildStoreOrdersWorkspaceHref({ lang, from: "store-operation-list" })}
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

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Stage File</div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-900">
              {stageFilename || "まだ preview が保存されていません"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Last Updated</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{lastUpdatedText}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Visible Rows</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{filteredCharges.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Current Filter</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {FILTER_ITEMS.find((x) => x.value === selectedFilter)?.label ?? "全分類"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">可視 Signed Total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(visibleSignedAmount)}</div>
          <div className="mt-2 text-xs text-slate-500">符号付き合計（収入/支出差引）</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">可視 Absolute Total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(visibleAbsAmount)}</div>
          <div className="mt-2 text-xs text-slate-500">金額絶対値ベースの規模</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">最大分類</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{biggest?.label ?? "-"}</div>
          <div className="mt-2 text-xs text-slate-500">{formatJPY(biggest?.value ?? 0)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">振込</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.payout)}</div>
          <div className="mt-2 text-xs text-slate-500">精算・入金の把握</div>
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
          <div className="text-sm text-slate-500">調整</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.adjustment)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">その他</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.other)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">注文売上（参考）</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.orderSale ?? 0)}</div>
          <div className="mt-2 text-xs text-slate-500">同CSV内の売上分類</div>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-slate-950">操作メニュー</div>
            <div className="mt-1 text-sm text-slate-600">
              店舗運営費の取込前に、ledger_scope 固定テンプレートをダウンロードできます。
            </div>
          </div>
          {/* Step109-Z1-H4B-STORE-VISIBLE-TEMPLATE-DOWNLOAD: fixed ledger_scope template for store-operation-expense. */}
          <LedgerTemplateDownloadButton
            scope={LEDGER_SCOPES.STORE_OPERATION_EXPENSE}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            店舗運営費テンプレート下载
          </LedgerTemplateDownloadButton>
        </div>
      </section>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">分類フィルター</div>
            <div className="mt-2 text-sm text-slate-500">
              店舗運営費ページ上で Amazon transaction charges を分類別に絞り込みます。
            </div>
          </div>
          <div className="text-sm text-slate-500">並び順: 日付降順 → 金額絶対値降順</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_ITEMS.map((item) => {
            const active = selectedFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedFilter(item.value)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-semibold text-slate-900">Charges Detail</div>
            <div className="mt-2 text-sm text-slate-500">
              店舗運営費ページ上で Amazon transaction charges を確認します。支持日期范围切换、排序、分页、选择行与右侧 Drawer 监查路径。
            </div>
          </div>

          {!noPreviewYet && !hasPreviewButNoCharges ? (
            <div className="grid gap-3 xl:min-w-[420px]">
              <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
                <label className="text-sm font-medium text-slate-700">订单日期范围</label>
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "30D", "90D", "365D", "CUSTOM"] as ChargeDateRangePreset[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setChargeDateRangePreset(item);
                        if (item !== "CUSTOM") {
                          setCurrentPage(1);
                        }
                      }}
                      className={
                        chargeDateRangePreset === item
                          ? "rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      }
                    >
                      {CHARGE_DATE_RANGE_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>

              {chargeDateRangePreset === "CUSTOM" ? (
                <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[180px_auto] sm:items-start">
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

              <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
                <label className="text-sm font-medium text-slate-700">当前排序</label>
                <div className="flex items-center gap-3">
                  <select
                    value={chargeSortMode}
                    onChange={(e) => {
                      setChargeSortMode(e.target.value as ChargeSortMode);
                      setCurrentPage(1);
                    }}
                    className="h-11 min-w-[220px] rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="date-desc">{CHARGE_SORT_LABELS["date-desc"]}</option>
                    <option value="date-asc">{CHARGE_SORT_LABELS["date-asc"]}</option>
                    <option value="amount-desc">{CHARGE_SORT_LABELS["amount-desc"]}</option>
                    <option value="amount-asc">{CHARGE_SORT_LABELS["amount-asc"]}</option>
                  </select>
                  <div className="text-xs text-slate-500">
                    当前：{CHARGE_SORT_LABELS[chargeSortMode]}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {selectedCharge ? (
          <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50 p-5">
            <div className="text-lg font-semibold text-slate-900">Selected Charge</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Date</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatChargeDate(selectedCharge.occurredAt)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Kind</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {chargeKindLabel(selectedCharge.kind)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Order ID / SKU</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedCharge.orderId || "-"} / {selectedCharge.sku || "-"}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Signed Amount</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatJPY(selectedCharge.signedAmount)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-indigo-100 bg-indigo-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-indigo-600">
                Cross Workspace Drill-down
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">transactionId</div>
                  <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                    {selectedCharge.id}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">same Order rows</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedChargeOrderRelatedCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">same SKU rows</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedChargeSkuRelatedCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">from</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {crossQuery.from || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {(selectedCharge.orderId || selectedCharge.sku) ? (
                  <Link
                    href={selectedChargeStoreOrdersHref}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    店舗注文の対象行へ移動
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => closeDrawer("generic")}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  選択解除
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
            行を選択すると、ここに charges 行の要約が表示されます。
          </div>
        )}

        {noPreviewYet ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <div className="text-lg font-semibold text-slate-900">まだ Amazon preview がありません</div>
            <div className="mt-2 text-sm text-slate-500">
              店舗運営費を表示するには、先に Amazon transaction CSV を preview し、stage に保存してください。
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app/data/import?module=income`}
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Import / CSV確認へ移動
              </Link>
              <Link
                href={buildStoreOrdersWorkspaceHref({
                  lang,
                  from: importContext.active ? "import-commit" : "store-operation-list",
                  importJobId: importContext.importJobId,
                  months: importMonths,
                  module: importContext.module || "store-orders",
                })}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                店舗注文へ戻る
              </Link>
            </div>
          </div>
        ) : hasPreviewButNoCharges ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <div className="text-lg font-semibold text-slate-900">preview はありますが、charges データがありません</div>
            <div className="mt-2 text-sm text-slate-500">
              現在の stage には「非订单费用」charges が保存されていません。再度 preview を実行し、最新の Amazon charges / settlement を保存してください。
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app/data/import?module=income`}
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                再度 preview を実行
              </Link>
              <Link
                href={`/${lang}/app/expenses`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                支出 root へ戻る
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
              <div className="grid grid-cols-[120px_140px_1.35fr_150px_140px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                <div>Date</div>
                <div>Kind</div>
                <div>Type / Description</div>
                <div>Order ID</div>
                <div>SKU</div>
                <div className="text-right">Signed Amount</div>
              </div>

              {visibleCharges.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">
                  現在のフィルター条件では表示対象がありません。別の分類を選択してください。
                </div>
              ) : (
                visibleCharges.map((charge) => (
                  <button
                    key={charge.id}
                    type="button"
                    onClick={() => {
                      drawerOpenedAtRef.current = Date.now();
                      setSelectedChargeId(charge.id);
                    }}
                    className={`grid w-full grid-cols-[120px_140px_1.35fr_150px_140px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                      selectedChargeId === charge.id ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : ""
                    }`}
                  >
                    <div className="text-slate-600">{formatChargeDate(charge.occurredAt)}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${chargeKindBadge(charge.kind)}`}
                      >
                        {chargeKindLabel(charge.kind)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{charge.transactionType || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{charge.description || "-"}</div>
                    </div>
                    <div className="text-slate-600">{charge.orderId || "-"}</div>
                    <div className="text-slate-600">{charge.sku || "-"}</div>
                    <div className="text-right font-medium text-slate-900">{formatJPY(charge.signedAmount)}</div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6">
                <div className="text-sm text-slate-500">
                  全 {totalRows} 行のうち、{pageStartRow} - {pageEndRow} 行を表示
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">1ページあたり</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value) as PageSize);
                      setCurrentPage(1);
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
          </>
        )}
      </div>

      {drawerOpen ? (
        <>
          <div
            aria-label="Charge breakdown drawer backdrop"
            className="pointer-events-none fixed lg:absolute top-16 bottom-0 right-0 lg:inset-0 left-[292px] z-40 bg-slate-950/30 backdrop-blur-[1px]"
          />

          <aside className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-full max-w-[760px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">Charge Breakdown</div>
                  <div className="mt-2 text-sm text-slate-500">
                    選択中の charge を audit workspace として右側 Drawer で確認できます。
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => closeDrawer("generic")}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>

              {selectedCharge ? (
                <>
                  <div className="mt-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Charge Summary
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Kind</div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${chargeKindBadge(selectedCharge.kind)}`}
                        >
                          {chargeKindLabel(selectedCharge.kind)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {relatedCharges.length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Order ID</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedCharge.orderId || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">SKU</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedCharge.sku || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Amount Summary
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Signed Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatJPY(sumSignedAmount(relatedCharges))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Absolute Sum</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatJPY(sumAbsAmount(relatedCharges))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Selected Amount</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatJPY(selectedCharge.signedAmount)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Occurred At</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatChargeDateTime(selectedCharge.occurredAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Audit Guidance
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-600">
                      Correlation Hint
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      {buildChargeCorrelationHint({
                        selected: selectedCharge,
                        relatedRows: relatedCharges,
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">related rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {relatedCharges.length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">same order rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedCharge?.orderId
                          ? relatedCharges.filter(
                              (row) =>
                                String(row.orderId || "") === String(selectedCharge.orderId || "")
                            ).length
                          : 0}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">same sku rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedCharge?.sku
                          ? relatedCharges.filter(
                              (row) =>
                                String(row.sku || "") === String(selectedCharge.sku || "")
                            ).length
                          : 0}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">selected tx</div>
                      <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {selectedCharge.id}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">transactionId</div>
                      <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {selectedCharge.id}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">same Order rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedChargeOrderRelatedCount}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">same SKU rows</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedChargeSkuRelatedCount}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Workspace Actions
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {(selectedCharge.orderId || selectedCharge.sku) ? (
                      <Link
                        href={buildReverseStoreOrdersHref({
                          lang,
                          charge: selectedCharge,
                          importJobId: importContext.importJobId,
                          months: importMonths,
                          module: importContext.module || "store-orders",
                        })}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        店舗注文の対象行へ戻る
                      </Link>
                    ) : null}

                    <Link
                      href={buildStoreOrdersWorkspaceHref({ lang, from: "store-operation-list" })}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      店舗注文一覧へ戻る
                    </Link>
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Related Charge Rows
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  同一 Order / SKU / date-kind で関連づく charge rows を audit workspace として確認できます。
                </div>
              </div>

              {relatedCharges.map((charge) => (
                <div
                  key={charge.id}
                  className={`rounded-[24px] border p-5 shadow-sm ${
                    charge.id === selectedChargeId
                      ? "border-slate-300 bg-slate-50 ring-1 ring-inset ring-slate-300"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${chargeKindBadge(charge.kind)}`}
                        >
                          {chargeKindLabel(charge.kind)}
                        </span>
                        {charge.id === selectedChargeId ? (
                          <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                            SELECTED
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {charge.transactionType || "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {charge.description || "-"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatJPY(charge.signedAmount)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        rowNo {charge.rowNo}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Date</div>
                      <div className="mt-1 text-sm text-slate-800">
                        {formatChargeDate(charge.occurredAt)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Transaction Time</div>
                      <div className="mt-1 text-sm text-slate-800">
                        {formatChargeDateTime(charge.occurredAt)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Order ID</div>
                      <div className="mt-1 text-sm text-slate-800">{charge.orderId || "-"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">SKU</div>
                      <div className="mt-1 text-sm text-slate-800">{charge.sku || "-"}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Charge Audit Hint</div>
                    <div className="mt-1 text-sm text-slate-800">
                      {charge.kind === "PAYOUT"
                        ? "振込行です。個別订单より settlement 単位で確認するのが基本です。"
                        : charge.kind === "FBA_FEE"
                        ? "FBA関連費用です。注文側の SKU / Order ID と関連づくか確認できます。"
                        : charge.kind === "ADJUSTMENT"
                        ? "調整行です。訂正・相殺・取消の関係を確認してください。"
                        : charge.kind === "TAX"
                        ? "税金行です。個別注文に紐づく税か、精算全体の税かを判定してください。"
                        : "店舗運営費の charges 行として監査できます。"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      transactionId: {charge.id}
                    </div>

                    {(charge.orderId || charge.sku) ? (
                      <Link
                        href={buildReverseStoreOrdersHref({
                          lang,
                          charge,
                          importJobId: importContext.importJobId,
                          months: importMonths,
                          module: importContext.module || "store-orders",
                        })}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        店舗注文の対象行へ戻る
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
