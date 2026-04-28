import { listTransactions, type TransactionItem } from "@/core/transactions/api";
import { listFundTransfers, type FundTransferItem } from "@/core/funds/api";
import type { AmazonStoreOrderFact } from "@/core/jobs";
import { getCashRevenueCategoryLabel, resolveCashRevenueCategoryFromText } from "@/core/transactions/cash-revenue-category";

export type IncomeCategory = "all" | "store-order" | "cash" | "other";
export type ExpenseCategory = "all" | "advertising" | "logistics" | "payroll" | "other";
export type JournalTab = "all" | "unposted" | "posted" | "flagged";
export type TransferStatus = "all" | "scheduled" | "completed";

export type TransactionsSource = "dashboard" | "page" | "unknown";

export type TransactionsContext = {
  source: TransactionsSource;
  from?: string | null;
  storeId?: string | null;
  range?: string | null;
  category?: string | null;
  tab?: string | null;
  status?: string | null;
};

export type IncomeRow = {
  id: string;
  date: string;
  category: Exclude<IncomeCategory, "all">;
  label: string;
  amount: number;
  account: string;
  store: string;
  memo?: string | null;
  revenueCategory?: string | null;

  sourceType?: string | null;
  externalRef?: string | null;
  sku?: string | null;
  quantity?: number | null;
  productName?: string | null;
  fulfillment?: string | null;
  importedAt?: string | null;
  sortAt?: string | null;

  importJobId?: string | null;
  businessMonth?: string | null;
  sourceFileName?: string | null;
  sourceRowNo?: number | null;

  grossAmount?: number | null;
  netAmount?: number | null;
  feeAmount?: number | null;
  taxAmount?: number | null;
  shippingAmount?: number | null;
  promotionAmount?: number | null;

  itemSalesAmount?: number | null;
  itemSalesTaxAmount?: number | null;
  shippingTaxAmount?: number | null;
  promotionDiscountAmount?: number | null;
  promotionDiscountTaxAmount?: number | null;
  commissionFeeAmount?: number | null;
  fbaFeeAmount?: number | null;
};

export type ExpenseRow = {
  id: string;
  date: string;
  category: Exclude<ExpenseCategory, "all">;
  label: string;
  amount: number;
  account: string;
  store: string;
  memo?: string | null;
};

export type JournalRow = {
  id: string;
  date: string;
  entryNo: string;
  summary: string;
  status: Exclude<JournalTab, "all">;
  amount: number;
};

export type TransferRow = {
  id: string;
  date: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  status: Exclude<TransferStatus, "all">;
  memo?: string | null;
};

export type TransactionsEnvelope<T> = {
  rows: T[];
  meta: {
    source: TransactionsSource;
    from?: string | null;
    storeId?: string | null;
    range?: string | null;
    activeFilter: string;
    adapterMode: "api-context-aware" | "mock-context-aware";
    note?: string;
  };
};

const JOURNAL_ROWS: JournalRow[] = [
  {
    id: "jr1",
    date: "2026-03-15",
    entryNo: "JNL-2026-0315-01",
    summary: "Amazon 売上計上",
    status: "posted",
    amount: 125000,
  },
  {
    id: "jr2",
    date: "2026-03-14",
    entryNo: "JNL-2026-0314-01",
    summary: "広告費計上",
    status: "posted",
    amount: 42000,
  },
  {
    id: "jr3",
    date: "2026-03-13",
    entryNo: "JNL-2026-0313-01",
    summary: "仕訳確認待ち",
    status: "unposted",
    amount: 18000,
  },
  {
    id: "jr4",
    date: "2026-03-12",
    entryNo: "JNL-2026-0312-01",
    summary: "要確認仕訳",
    status: "flagged",
    amount: 9800,
  },
];

function normalizeSource(v?: string | null): TransactionsSource {
  if (v === "dashboard") return "dashboard";
  if (v === "page") return "page";
  return "unknown";
}

export function normalizeIncomeCategoryParam(v?: string | null): IncomeCategory {
  return (
    ["all", "store-order", "cash", "other"].includes(String(v)) ? v : "all"
  ) as IncomeCategory;
}

export function normalizeExpenseCategoryParam(v?: string | null): ExpenseCategory {
  return (
    ["all", "advertising", "logistics", "payroll", "other"].includes(String(v)) ? v : "all"
  ) as ExpenseCategory;
}

export function normalizeJournalTabParam(v?: string | null): JournalTab {
  return (
    ["all", "unposted", "posted", "flagged"].includes(String(v)) ? v : "all"
  ) as JournalTab;
}

export function normalizeTransferStatusParam(v?: string | null): TransferStatus {
  return (
    ["all", "scheduled", "completed"].includes(String(v)) ? v : "all"
  ) as TransferStatus;
}

export function createTransactionsContext(
  input: Partial<TransactionsContext>
): TransactionsContext {
  return {
    source: normalizeSource(input.from ?? input.source),
    from: input.from ?? null,
    storeId: input.storeId ?? null,
    range: input.range ?? null,
    category: input.category ?? null,
    tab: input.tab ?? null,
    status: input.status ?? null,
  };
}

function buildMeta(
  ctx: TransactionsContext,
  activeFilter: string,
  adapterMode: TransactionsEnvelope<unknown>["meta"]["adapterMode"],
  note?: string
): TransactionsEnvelope<unknown>["meta"] {
  return {
    source: ctx.source,
    from: ctx.from ?? null,
    storeId: ctx.storeId ?? null,
    range: ctx.range ?? null,
    activeFilter,
    adapterMode,
    note,
  };
}

function mapIncomeCategory(item: TransactionItem): Exclude<IncomeCategory, "all"> {
  const t = String(item.type ?? "").toLowerCase();
  const c = String(item.categoryName ?? "").toLowerCase();
  const m = String(item.memo ?? "").toLowerCase();

  // Step109-Z1-B-FIX5-v2:
  // Marker priority must be deterministic:
  // 1) cash-income technical markers
  // 2) other-income import marker
  // 3) store-order source heuristics such as Amazon/Shopify.
  // This prevents cash rows from leaking into /income/other and prevents
  // other-income rows imported from "Amazon JP Seed Store" from becoming store-order.
  if (
    m.includes("[cash]") ||
    m.includes("[revenue-category:") ||
    t.includes("cash") ||
    c.includes("現金") ||
    m.includes("cash")
  ) {
    return "cash";
  }

  if (m.includes("[other-income-category:")) {
    return "other";
  }

  if (
    m.includes("[imports:store-orders]") ||
    t.includes("sale") ||
    c.includes("売上") ||
    c.includes("sales") ||
    m.includes("amazon") ||
    m.includes("shopify")
  ) {
    return "store-order";
  }

  return "other";
}

function mapExpenseCategory(item: TransactionItem): Exclude<ExpenseCategory, "all"> {
  const t = String(item.type ?? "").toLowerCase();
  const c = String(item.categoryName ?? "").toLowerCase();
  const m = String(item.memo ?? "").toLowerCase();

  if (t.includes("ad") || c.includes("広告") || m.includes("ads")) return "advertising";
  if (t.includes("ship") || c.includes("物流") || c.includes("送料") || m.includes("fba")) return "logistics";
  if (t.includes("salary") || c.includes("給与") || c.includes("人件")) return "payroll";
  return "other";
}

function mapIncomeRow(item: TransactionItem): IncomeRow {
  const category = mapIncomeCategory(item);
  const cashRevenueCategory = resolveCashRevenueCategoryFromText({
    memo: item.memo,
    categoryName: item.categoryName,
    label: item.type,
  });

  return {
    id: item.id,
    date: item.occurredAt ? new Date(item.occurredAt).toLocaleDateString("ja-JP") : "-",
    category,
    label:
      category === "cash"
        ? getCashRevenueCategoryLabel(cashRevenueCategory)
        : item.categoryName ?? item.productName ?? item.type ?? "収入",
    amount: Number(item.amount ?? 0),
    account: item.accountName ?? "-",
    store: item.storeName ?? item.storeId ?? "-",
    memo: item.memo ?? null,
    revenueCategory: category === "cash" ? cashRevenueCategory : null,
    sourceType: item.sourceType ?? "api-transaction",
    externalRef: item.externalRef ?? null,
    sku: item.sku ?? null,
    quantity: item.quantity ?? null,
    productName: item.productName ?? item.categoryName ?? item.type ?? "収入",
    fulfillment: item.fulfillment ?? null,
    importedAt: item.createdAt ?? null,
    sortAt: item.occurredAt ?? null,

    importJobId: item.importJobId ?? null,
    businessMonth: item.businessMonth ?? null,
    sourceFileName: item.sourceFileName ?? null,
    sourceRowNo: item.sourceRowNo ?? null,

    grossAmount: Number(item.grossAmount ?? item.amount ?? 0),
    netAmount: Number(item.netAmount ?? item.amount ?? 0),
    feeAmount: Number(item.feeAmount ?? 0),
    taxAmount: Number(item.taxAmount ?? 0),
    shippingAmount: Number(item.shippingAmount ?? 0),
    promotionAmount: Number(item.promotionAmount ?? 0),

    itemSalesAmount: Number(item.itemSalesAmount ?? item.grossAmount ?? item.amount ?? 0),
    itemSalesTaxAmount: Number(item.itemSalesTaxAmount ?? item.taxAmount ?? 0),
    shippingTaxAmount: Number(item.shippingTaxAmount ?? 0),
    promotionDiscountAmount: Number(item.promotionDiscountAmount ?? item.promotionAmount ?? 0),
    promotionDiscountTaxAmount: Number(item.promotionDiscountTaxAmount ?? 0),
    commissionFeeAmount: Number(item.commissionFeeAmount ?? item.feeAmount ?? 0),
    fbaFeeAmount: Number(item.fbaFeeAmount ?? 0),
  };
}

export function buildIncomeRowsFromAmazonFacts(args: {
  facts: AmazonStoreOrderFact[];
  filename?: string | null;
  savedAt?: string | null;
}): IncomeRow[] {
  const { facts, filename, savedAt } = args;

  return (facts ?? []).map((fact, index) => ({
    id: `${fact.orderId || "order"}-${fact.sku || "sku"}-${fact.rowNo || index + 1}`,
    date: formatAmazonOrderDate(fact.orderDate),
    category: "store-order",
    label: fact.productName || fact.rawLabel || fact.sku || fact.orderId || "店舗注文",
    amount: Number(fact.amount ?? 0),
    account: "Amazon CSV Stage",
    store: fact.store || "Amazon",
    memo: filename ? `imported from ${filename}` : "imported from amazon csv",
    sourceType: "amazon-store-orders-stage",
    externalRef: fact.orderId || null,
    sku: fact.sku || null,
    quantity: Number(fact.quantity ?? 0),
    productName: fact.productName || null,
    fulfillment: fact.fulfillment || null,
    importedAt: savedAt || null,
    sortAt: fact.orderDate || savedAt || null,
    grossAmount: Number(fact.grossAmount ?? fact.amount ?? 0),
    netAmount: Number(fact.netAmount ?? fact.amount ?? 0),
    feeAmount: Number(fact.feeAmount ?? 0),
    taxAmount: Number(fact.taxAmount ?? 0),
    shippingAmount: Number(fact.shippingAmount ?? 0),
    promotionAmount: Number(fact.promotionAmount ?? 0),

    itemSalesAmount: Number(
      (fact as AmazonStoreOrderFact & { itemSalesAmount?: number | null }).itemSalesAmount
      ?? fact.grossAmount
      ?? fact.amount
      ?? 0
    ),
    itemSalesTaxAmount: Number(
      (fact as AmazonStoreOrderFact & { itemSalesTaxAmount?: number | null }).itemSalesTaxAmount
      ?? fact.taxAmount
      ?? 0
    ),
    shippingTaxAmount: Number(
      (fact as AmazonStoreOrderFact & { shippingTaxAmount?: number | null }).shippingTaxAmount
      ?? 0
    ),
    promotionDiscountAmount: Number(
      (fact as AmazonStoreOrderFact & { promotionDiscountAmount?: number | null }).promotionDiscountAmount
      ?? fact.promotionAmount
      ?? 0
    ),
    promotionDiscountTaxAmount: Number(
      (fact as AmazonStoreOrderFact & { promotionDiscountTaxAmount?: number | null }).promotionDiscountTaxAmount
      ?? 0
    ),
    commissionFeeAmount: Number(
      (fact as AmazonStoreOrderFact & { commissionFeeAmount?: number | null }).commissionFeeAmount
      ?? fact.feeAmount
      ?? 0
    ),
    fbaFeeAmount: Number(
      (fact as AmazonStoreOrderFact & { fbaFeeAmount?: number | null }).fbaFeeAmount
      ?? 0
    ),
  }));
}

function mapExpenseRow(item: TransactionItem): ExpenseRow {
  const category = mapExpenseCategory(item);
  return {
    id: item.id,
    date: item.occurredAt ? new Date(item.occurredAt).toLocaleDateString("ja-JP") : "-",
    category,
    label: item.categoryName ?? item.type ?? "支出",
    amount: Math.abs(Number(item.amount ?? 0)),
    account: item.accountName ?? "-",
    store: item.storeName ?? item.storeId ?? "-",
    memo: item.memo ?? null,
  };
}

function mapTransferStatus(item: FundTransferItem): Exclude<TransferStatus, "all"> {
  const occurred = Date.parse(item.occurredAt);
  if (!Number.isNaN(occurred) && occurred > Date.now()) return "scheduled";
  return "completed";
}

function mapTransferRow(item: FundTransferItem): TransferRow {
  return {
    id: item.id,
    date: item.occurredAt ? new Date(item.occurredAt).toLocaleDateString("ja-JP") : "-",
    fromAccount: item.fromAccountName,
    toAccount: item.toAccountName,
    amount: Number(item.amount ?? 0),
    status: mapTransferStatus(item),
    memo: item.memo ?? null,
  };
}

function formatAmazonOrderDate(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleDateString("ja-JP");
  }

  const normalized = raw.replace(/\s+JST$/i, "").trim();
  const m = normalized.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = Number(m[6] || "0");

    const d = new Date(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("ja-JP");
    }
  }

  const dateOnly = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("ja-JP");
    }
  }

  return raw;
}

function parseIncomeRowSortTimestamp(value?: string | null): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.getTime();
  }

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

  const d = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function aggregateStoreOrderIncomeRows(rows: IncomeRow[]): IncomeRow[] {
  const map = new Map<string, IncomeRow>();

  for (const row of rows) {
    const dateKey = String(row.date || "-");
    const orderKey = String(row.externalRef || row.id || "order");
    const skuKey = String(row.sku || "sku");
    const key = `${dateKey}__${orderKey}__${skuKey}`;

    const quantity = Number(row.quantity ?? 0);
    const amount = Number(row.amount ?? 0);
    const grossAmount = Number(row.grossAmount ?? row.amount ?? 0);
    const netAmount = Number(row.netAmount ?? row.amount ?? 0);
    const feeAmount = Number(row.feeAmount ?? 0);
    const taxAmount = Number(row.taxAmount ?? 0);
    const shippingAmount = Number(row.shippingAmount ?? 0);
    const promotionAmount = Number(row.promotionAmount ?? 0);

    const itemSalesAmount = Number(row.itemSalesAmount ?? row.grossAmount ?? row.amount ?? 0);
    const itemSalesTaxAmount = Number(row.itemSalesTaxAmount ?? row.taxAmount ?? 0);
    const shippingTaxAmount = Number(row.shippingTaxAmount ?? 0);
    const promotionDiscountAmount = Number(row.promotionDiscountAmount ?? row.promotionAmount ?? 0);
    const promotionDiscountTaxAmount = Number(row.promotionDiscountTaxAmount ?? 0);
    const commissionFeeAmount = Number(row.commissionFeeAmount ?? row.feeAmount ?? 0);
    const fbaFeeAmount = Number(row.fbaFeeAmount ?? 0);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...row,
        id: key,
        quantity,
        amount,
        grossAmount,
        netAmount,
        feeAmount,
        taxAmount,
        shippingAmount,
        promotionAmount,

        itemSalesAmount,
        itemSalesTaxAmount,
        shippingTaxAmount,
        promotionDiscountAmount,
        promotionDiscountTaxAmount,
        commissionFeeAmount,
        fbaFeeAmount,
      });
      continue;
    }

    const nextSortAt =
      parseIncomeRowSortTimestamp(row.sortAt) > parseIncomeRowSortTimestamp(existing.sortAt)
        ? row.sortAt
        : existing.sortAt;

    const nextImportedAt =
      parseIncomeRowSortTimestamp(row.importedAt) > parseIncomeRowSortTimestamp(existing.importedAt)
        ? row.importedAt
        : existing.importedAt;

    map.set(key, {
      ...existing,
      date: existing.date !== "-" ? existing.date : row.date,
      label: existing.label || row.label,
      amount: Number(existing.amount ?? 0) + amount,
      quantity: Number(existing.quantity ?? 0) + quantity,
      grossAmount: Number(existing.grossAmount ?? 0) + grossAmount,
      netAmount: Number(existing.netAmount ?? 0) + netAmount,
      feeAmount: Number(existing.feeAmount ?? 0) + feeAmount,
      taxAmount: Number(existing.taxAmount ?? 0) + taxAmount,
      shippingAmount: Number(existing.shippingAmount ?? 0) + shippingAmount,
      promotionAmount: Number(existing.promotionAmount ?? 0) + promotionAmount,

      itemSalesAmount: Number(existing.itemSalesAmount ?? 0) + itemSalesAmount,
      itemSalesTaxAmount: Number(existing.itemSalesTaxAmount ?? 0) + itemSalesTaxAmount,
      shippingTaxAmount: Number(existing.shippingTaxAmount ?? 0) + shippingTaxAmount,
      promotionDiscountAmount: Number(existing.promotionDiscountAmount ?? 0) + promotionDiscountAmount,
      promotionDiscountTaxAmount: Number(existing.promotionDiscountTaxAmount ?? 0) + promotionDiscountTaxAmount,
      commissionFeeAmount: Number(existing.commissionFeeAmount ?? 0) + commissionFeeAmount,
      fbaFeeAmount: Number(existing.fbaFeeAmount ?? 0) + fbaFeeAmount,

      productName: existing.productName || row.productName,
      fulfillment: existing.fulfillment || row.fulfillment,
      store: existing.store || row.store,
      memo: existing.memo || row.memo,
      importedAt: nextImportedAt ?? existing.importedAt ?? row.importedAt ?? null,
      sortAt: nextSortAt ?? existing.sortAt ?? row.sortAt ?? null,
    });
  }

  return Array.from(map.values());
}

export function sortStoreOrderIncomeRows(rows: IncomeRow[]): IncomeRow[] {
  return [...rows].sort((a, b) => {
    const diff = parseIncomeRowSortTimestamp(b.sortAt) - parseIncomeRowSortTimestamp(a.sortAt);
    if (diff !== 0) return diff;
    return String(b.externalRef || b.id).localeCompare(String(a.externalRef || a.id));
  });
}

export async function fetchIncomePageData(
  category: IncomeCategory,
  ctx: TransactionsContext
): Promise<TransactionsEnvelope<IncomeRow>> {
  const res = await listTransactions("INCOME");
  const allRows = res.items.map(mapIncomeRow);
  const rows = allRows.filter((x) => category === "all" || x.category === category);

  return {
    rows,
    meta: buildMeta(
      ctx,
      `category:${category}`,
      "api-context-aware",
      "Step41A: income page 已进入 transactions adapter，内部复用真实 /api/transactions contract。"
    ),
  };
}

export async function fetchExpensesPageData(
  category: ExpenseCategory,
  ctx: TransactionsContext
): Promise<TransactionsEnvelope<ExpenseRow>> {
  const res = await listTransactions("EXPENSE");
  const allRows = res.items.map(mapExpenseRow);
  const rows = allRows.filter((x) => category === "all" || x.category === category);

  return {
    rows,
    meta: buildMeta(
      ctx,
      `category:${category}`,
      "api-context-aware",
      "Step41B: expenses page 已迁移进入 transactions domain，内部复用真实 /api/transactions contract。"
    ),
  };
}

export async function fetchJournalsPageData(
  tab: JournalTab,
  ctx: TransactionsContext
): Promise<TransactionsEnvelope<JournalRow>> {
  const rows = JOURNAL_ROWS.filter((x) => tab === "all" || x.status === tab);
  return {
    rows,
    meta: buildMeta(
      ctx,
      `tab:${tab}`,
      "mock-context-aware",
      "Step41A: journals page 先使用 scaffold adapter，后续可替换真实 journal API。"
    ),
  };
}

export async function fetchFundTransferPageData(
  status: TransferStatus,
  ctx: TransactionsContext
): Promise<TransactionsEnvelope<TransferRow>> {
  const res = await listFundTransfers();
  const allRows = res.items.map(mapTransferRow);
  const rows = allRows.filter((x) => status === "all" || x.status === status);

  return {
    rows,
    meta: buildMeta(
      ctx,
      `status:${status}`,
      "api-context-aware",
      "Step41A: fund-transfer page 已进入 transactions adapter，内部复用真实 /api/fund-transfer contract。"
    ),
  };
}


export const TRANSACTIONS_FOUNDATION_AUDIT = {
  filters: [
    "normalizeIncomeCategoryParam",
    "normalizeExpenseCategoryParam",
    "normalizeJournalTabParam",
    "normalizeTransferStatusParam",
  ],
  context: [
    "createTransactionsContext",
  ],
  adapters: [
    "fetchIncomePageData",
    "fetchExpensesPageData",
    "fetchJournalsPageData",
    "fetchFundTransferPageData",
  ],
} as const;
