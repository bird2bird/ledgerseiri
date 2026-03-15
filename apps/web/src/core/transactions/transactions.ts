import { listTransactions, type TransactionItem } from "@/core/transactions/api";
import { listFundTransfers, type FundTransferItem } from "@/core/funds/api";

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

  if (
    t.includes("sale") ||
    c.includes("売上") ||
    c.includes("sales") ||
    m.includes("amazon") ||
    m.includes("shopify")
  ) {
    return "store-order";
  }

  if (t.includes("cash") || c.includes("現金") || m.includes("cash")) {
    return "cash";
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
  return {
    id: item.id,
    date: item.occurredAt ? new Date(item.occurredAt).toLocaleDateString("ja-JP") : "-",
    category,
    label: item.categoryName ?? item.type ?? "収入",
    amount: Number(item.amount ?? 0),
    account: item.accountName ?? "-",
    store: item.storeName ?? item.storeId ?? "-",
    memo: item.memo ?? null,
  };
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
