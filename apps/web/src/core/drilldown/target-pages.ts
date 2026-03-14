export type ExpenseCategory = "all" | "advertising" | "logistics" | "payroll" | "other";
export type InvoiceTab = "unpaid" | "issued" | "history";
export type ProfitFocus = "profit" | "revenue" | "margin" | "trend";
export type AlertSeverity = "all" | "info" | "warning" | "critical";
export type DrilldownSource = "dashboard" | "page" | "unknown";

export type DrilldownQueryContext = {
  source: DrilldownSource;
  from?: string | null;
  storeId?: string | null;
  range?: string | null;
  category?: string | null;
  tab?: string | null;
  focus?: string | null;
  severity?: string | null;
};

export type DrilldownEnvelope<T> = {
  rows: T[];
  meta: {
    source: DrilldownSource;
    from?: string | null;
    storeId?: string | null;
    range?: string | null;
    activeFilter: string;
    adapterMode: "mock-context-aware";
    note?: string;
  };
};

export type ExpenseRow = {
  id: string;
  date: string;
  category: Exclude<ExpenseCategory, "all">;
  label: string;
  amount: number;
  account: string;
};

export type InvoiceRow = {
  id: string;
  customer: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  status: InvoiceTab;
};

export type InventoryAlertRow = {
  id: string;
  sku: string;
  title: string;
  severity: Exclude<AlertSeverity, "all">;
  stock: number;
};

export type ProfitMetricBlock = {
  title: string;
  value: string;
  note: string;
};

const EXPENSE_ROWS: ExpenseRow[] = [
  { id: "e1", date: "2026-03-12", category: "advertising", label: "Amazon Ads", amount: 42000, account: "三井住友銀行" },
  { id: "e2", date: "2026-03-11", category: "logistics", label: "FBA 配送", amount: 18000, account: "三井住友銀行" },
  { id: "e3", date: "2026-03-10", category: "payroll", label: "外注デザイン", amount: 65000, account: "楽天銀行" },
  { id: "e4", date: "2026-03-09", category: "other", label: "SaaS 利用料", amount: 9800, account: "三井住友銀行" },
  { id: "e5", date: "2026-03-08", category: "advertising", label: "Google Ads", amount: 21000, account: "楽天銀行" },
  { id: "e6", date: "2026-03-07", category: "logistics", label: "ヤマト送料", amount: 9600, account: "現金" },
];

const INVOICE_ROWS: InvoiceRow[] = [
  { id: "i1", customer: "A社", invoiceNo: "INV-2026-031", amount: 120000, dueDate: "2026-03-20", status: "unpaid" },
  { id: "i2", customer: "B社", invoiceNo: "INV-2026-032", amount: 80000, dueDate: "2026-03-18", status: "unpaid" },
  { id: "i3", customer: "C社", invoiceNo: "INV-2026-033", amount: 56000, dueDate: "2026-03-16", status: "issued" },
  { id: "i4", customer: "D社", invoiceNo: "INV-2026-034", amount: 42000, dueDate: "2026-03-10", status: "history" },
  { id: "i5", customer: "E社", invoiceNo: "INV-2026-035", amount: 150000, dueDate: "2026-03-26", status: "issued" },
  { id: "i6", customer: "F社", invoiceNo: "INV-2026-036", amount: 73000, dueDate: "2026-02-28", status: "history" },
];

const INVENTORY_ALERT_ROWS: InventoryAlertRow[] = [
  { id: "a1", sku: "KIMOCA-R65", title: "安全在庫を下回っています", severity: "warning", stock: 8 },
  { id: "a2", sku: "LOMBO-MON15", title: "在庫切れ寸前です", severity: "critical", stock: 2 },
  { id: "a3", sku: "RK-R75", title: "補充候補", severity: "info", stock: 14 },
  { id: "a4", sku: "KIMOCA-PUMP", title: "在庫切れ寸前です", severity: "critical", stock: 1 },
];

const PROFIT_METRICS: Record<ProfitFocus, ProfitMetricBlock> = {
  profit: { title: "営業利益", value: "¥242,623", note: "Dashboard summary からの初期 focus" },
  revenue: { title: "売上高", value: "¥243,123", note: "売上 KPI / trend drill-down" },
  margin: { title: "利益率", value: "99.8%", note: "利益 ÷ 売上 の簡易表示" },
  trend: { title: "利益推移", value: "30日", note: "Trend chart focus" },
};

function normalizeSource(v?: string | null): DrilldownSource {
  if (v === "dashboard") return "dashboard";
  if (v === "page") return "page";
  return "unknown";
}

export function normalizeExpenseCategoryParam(v?: string | null): ExpenseCategory {
  return (["all", "advertising", "logistics", "payroll", "other"].includes(String(v))
    ? v
    : "all") as ExpenseCategory;
}

export function normalizeInvoiceTabParam(v?: string | null): InvoiceTab {
  return (["unpaid", "issued", "history"].includes(String(v))
    ? v
    : "unpaid") as InvoiceTab;
}

export function normalizeProfitFocusParam(v?: string | null): ProfitFocus {
  return (["profit", "revenue", "margin", "trend"].includes(String(v))
    ? v
    : "profit") as ProfitFocus;
}

export function normalizeAlertSeverityParam(v?: string | null): AlertSeverity {
  return (["all", "info", "warning", "critical"].includes(String(v))
    ? v
    : "all") as AlertSeverity;
}

export function createDrilldownContext(input: Partial<DrilldownQueryContext>): DrilldownQueryContext {
  return {
    source: normalizeSource(input.from ?? input.source),
    from: input.from ?? null,
    storeId: input.storeId ?? null,
    range: input.range ?? null,
    category: input.category ?? null,
    tab: input.tab ?? null,
    focus: input.focus ?? null,
    severity: input.severity ?? null,
  };
}

function buildMeta(
  ctx: DrilldownQueryContext,
  activeFilter: string,
  note?: string
): DrilldownEnvelope<unknown>["meta"] {
  return {
    source: ctx.source,
    from: ctx.from ?? null,
    storeId: ctx.storeId ?? null,
    range: ctx.range ?? null,
    activeFilter,
    adapterMode: "mock-context-aware",
    note,
  };
}

export async function fetchExpensesDrilldown(
  category: ExpenseCategory,
  ctx: DrilldownQueryContext
): Promise<DrilldownEnvelope<ExpenseRow>> {
  const rows = EXPENSE_ROWS.filter((x) => category === "all" || x.category === category);
  return {
    rows,
    meta: buildMeta(
      ctx,
      `category:${category}`,
      "Step39D: dashboard/store/range context 已进入 adapter，后续可直接替换为真实 API。"
    ),
  };
}

export async function fetchInvoicesDrilldown(
  tab: InvoiceTab,
  ctx: DrilldownQueryContext
): Promise<DrilldownEnvelope<InvoiceRow>> {
  const rows = INVOICE_ROWS.filter((x) => x.status === tab);
  return {
    rows,
    meta: buildMeta(
      ctx,
      `tab:${tab}`,
      "Step39D: invoice drill-down 已具备 dashboard context 感知。"
    ),
  };
}

export async function fetchProfitDrilldown(
  focus: ProfitFocus,
  ctx: DrilldownQueryContext
): Promise<{
  metric: ProfitMetricBlock;
  meta: DrilldownEnvelope<never>["meta"];
}> {
  return {
    metric: PROFIT_METRICS[focus],
    meta: buildMeta(
      ctx,
      `focus:${focus}`,
      "Step39D: profit focus 已通过统一 context 解析进入 adapter。"
    ),
  };
}

export async function fetchInventoryAlertsDrilldown(
  severity: AlertSeverity,
  ctx: DrilldownQueryContext
): Promise<DrilldownEnvelope<InventoryAlertRow>> {
  const rows = INVENTORY_ALERT_ROWS.filter((x) => severity === "all" || x.severity === severity);
  return {
    rows,
    meta: buildMeta(
      ctx,
      `severity:${severity}`,
      "Step39D: inventory alerts 已具备统一 dashboard source context。"
    ),
  };
}
