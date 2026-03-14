export type ExpenseCategory = "all" | "advertising" | "logistics" | "payroll" | "other";
export type InvoiceTab = "unpaid" | "issued" | "history";
export type ProfitFocus = "profit" | "revenue" | "margin" | "trend";
export type AlertSeverity = "all" | "info" | "warning" | "critical";

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
  invoiceNo: string;
  customer: string;
  amount: number;
  dueDate: string;
  status: Exclude<InvoiceTab, "all" | "history"> | "history";
};

export type ProfitMetric = {
  title: string;
  value: string;
  note: string;
};

export type InventoryAlertRow = {
  id: string;
  sku: string;
  title: string;
  severity: Exclude<AlertSeverity, "all">;
  stock: number;
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
  { id: "i1", invoiceNo: "INV-2026-031", customer: "Amazon JP", amount: 120000, dueDate: "2026-03-20", status: "unpaid" },
  { id: "i2", invoiceNo: "INV-2026-032", customer: "Shopify Store", amount: 86000, dueDate: "2026-03-18", status: "unpaid" },
  { id: "i3", invoiceNo: "INV-2026-033", customer: "Retail Partner", amount: 54000, dueDate: "2026-03-15", status: "issued" },
  { id: "i4", invoiceNo: "INV-2026-028", customer: "Distributor A", amount: 132000, dueDate: "2026-02-28", status: "history" },
  { id: "i5", invoiceNo: "INV-2026-027", customer: "Distributor B", amount: 47000, dueDate: "2026-02-22", status: "history" },
];

const PROFIT_METRICS: Record<Exclude<ProfitFocus, "all">, ProfitMetric> = {
  profit: { title: "営業利益", value: "¥242,623", note: "Dashboard summary からの初期 focus" },
  revenue: { title: "売上高", value: "¥243,123", note: "Revenue KPI / Trend から遷移" },
  margin: { title: "利益率", value: "99.8%", note: "粗利/営業利益の簡易表示" },
  trend: { title: "利益推移", value: "30日", note: "Trend chart focus" },
};

const INVENTORY_ALERT_ROWS: InventoryAlertRow[] = [
  { id: "a1", sku: "KIMOCA-R65", title: "安全在庫を下回っています", severity: "warning", stock: 8 },
  { id: "a2", sku: "LOMBO-MON15", title: "在庫切れ寸前です", severity: "critical", stock: 2 },
  { id: "a3", sku: "RK-R75", title: "補充候補", severity: "info", stock: 14 },
  { id: "a4", sku: "KIMOCA-PUMP", title: "在庫切れ寸前です", severity: "critical", stock: 1 },
];

export type DrilldownEnvelope<T> = {
  source: "adapter-mock";
  rows: T[];
  total: number;
  fetchedAt: string;
  contractVersion: "step39c";
};

function envelope<T>(rows: T[]): DrilldownEnvelope<T> {
  return {
    source: "adapter-mock",
    rows,
    total: rows.length,
    fetchedAt: new Date().toISOString(),
    contractVersion: "step39c",
  };
}

export async function fetchExpensesDrilldown(category: ExpenseCategory): Promise<DrilldownEnvelope<ExpenseRow>> {
  const rows = EXPENSE_ROWS.filter((x) => category === "all" || x.category === category);
  return envelope(rows);
}

export async function fetchInvoicesDrilldown(tab: InvoiceTab): Promise<DrilldownEnvelope<InvoiceRow>> {
  const rows = INVOICE_ROWS.filter((x) => x.status === tab);
  return envelope(rows);
}

export async function fetchProfitDrilldown(focus: ProfitFocus): Promise<{
  source: "adapter-mock";
  metric: ProfitMetric;
  fetchedAt: string;
  contractVersion: "step39c";
}> {
  return {
    source: "adapter-mock",
    metric: PROFIT_METRICS[focus],
    fetchedAt: new Date().toISOString(),
    contractVersion: "step39c",
  };
}

export async function fetchInventoryAlertsDrilldown(
  severity: AlertSeverity
): Promise<DrilldownEnvelope<InventoryAlertRow>> {
  const rows = INVENTORY_ALERT_ROWS.filter((x) => severity === "all" || x.severity === severity);
  return envelope(rows);
}
