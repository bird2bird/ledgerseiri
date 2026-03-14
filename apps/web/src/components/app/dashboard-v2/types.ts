export type DashboardRange = "7d" | "30d" | "90d" | "12m";

export type PlanCode = "starter" | "standard" | "premium";

export type DashboardFilterState = {
  range: DashboardRange;
  storeId: string;
  refreshedAt: string;
};

export type TrendDirection = "up" | "down" | "neutral";

export type KpiCardData = {
  key: string;
  label: string;
  value: string;
  deltaText?: string;
  trend?: TrendDirection;
  subLabel?: string;
  tone?: "default" | "profit" | "warning" | "danger" | "info";
  href?: string;
};

export type AccountBalanceItem = {
  accountId: string;
  accountName: string;
  accountType: "bank" | "cash" | "platform" | "payment";
  balance: number;
  currency: "JPY" | "USD";
  sharePct: number;
};

export type RevenueProfitPoint = {
  label: string;
  revenue: number;
  profit: number;
};

export type CashFlowPoint = {
  label: string;
  cashIn: number;
  cashOut: number;
  netCash: number;
};

export type ExpenseBreakdownItem = {
  category: string;
  amount: number;
  pct: number;
};

export type TaxSummaryData = {
  outputTax: number;
  inputTax: number;
  estimatedTaxPayable: number;
  periodLabel: string;
  note: string;
};

export type DashboardAlert = {
  id: string;
  type: "inventory" | "invoice" | "cash" | "tax" | "expense";
  severity: "info" | "warning" | "critical";
  title: string;
  description?: string;
  href: string;
};

export type BusinessHealthData = {
  score: number;
  status: "good" | "attention" | "risk";
  dimensions: Array<{
    label: string;
    score: number;
  }>;
  insights: Array<{
    id: string;
    title: string;
    detail?: string;
    tone?: "default" | "warning" | "good";
  }>;
};

export type RecentTransactionItem = {
  id: string;
  date: string;
  type: string;
  category: string;
  amount: number;
  account: string;
  store: string;
  memo?: string | null;
};

export type QuickActionItem = {
  key: string;
  label: string;
  subLabel: string;
  href: string;
  icon: "plus" | "minus" | "arrow" | "file" | "upload" | "chart";
  locked?: boolean;
  requiredPlan?: "standard" | "premium";
  upgradeHint?: string;
};

export type DashboardHomeData = {
  filters: DashboardFilterState;
  kpiPrimary: KpiCardData[];
  kpiSecondary: KpiCardData[];
  revenueProfitTrend: RevenueProfitPoint[];
  cashBalances: AccountBalanceItem[];
  expenseBreakdown: ExpenseBreakdownItem[];
  cashFlowTrend: CashFlowPoint[];
  taxSummary: TaxSummaryData;
  alerts: DashboardAlert[];
  businessHealth: BusinessHealthData;
  recentTransactions: RecentTransactionItem[];
  quickActions: QuickActionItem[];
};
