export type DashboardRangeValue = '7d' | '30d' | '90d' | '365d' | string;

export interface DashboardSummaryCards {
  revenue: number;
  expense: number;
  profit: number;
  cash: number;
  estimatedTax: number;
  unpaidAmount: number;
  unpaidCount: number;
  inventoryValue: number;
  inventoryAlertCount: number;
  runwayMonths: number;
}

export interface DashboardFilters {
  range: DashboardRangeValue;
  storeId: string;
  from: Date;
  to: Date;
}

export interface DashboardTrendPoint {
  label: string;
  revenue?: number;
  profit?: number;
  income?: number;
  expense?: number;
  net?: number;
}

export interface DashboardCashBalanceItem {
  id: string;
  name: string;
  type: string;
  sourceType?: string | null;
  balance: number;
}

export interface DashboardExpenseBreakdownItem {
  label: string;
  amount: number;
  share: number;
}

export interface DashboardTaxSummary {
  estimatedTax: number;
  note: string;
}

export interface DashboardAlertItem {
  key: string;
  level: string;
  title: string;
  description: string;
}

export interface DashboardBusinessHealthItem {
  label: string;
  value: string;
}

export interface DashboardBusinessHealth {
  score: number;
  status: string;
  headline: string;
  summary: string;
  items: DashboardBusinessHealthItem[];
}

export interface DashboardRecentTransactionItem {
  id: string;
  occurredAt: Date;
  amount: number;
  currency: string;
  direction: string | null;
  type: string;
  sourceType?: string | null;
  externalRef?: string | null;
  memo: string | null;
  storeName: string | null;
  accountName: string | null;
  categoryName: string | null;
}

export interface DashboardInvoiceStats {
  issuedCount: number;
  historyCount: number;
  unpaidCount: number;
}

export interface DashboardSummaryResponse {
  summary: DashboardSummaryCards;
  filters: DashboardFilters;
  revenueProfitTrend: DashboardTrendPoint[];
  cashFlowTrend: DashboardTrendPoint[];
  cashBalances: DashboardCashBalanceItem[];
  expenseBreakdown: DashboardExpenseBreakdownItem[];
  taxSummary: DashboardTaxSummary;
  alerts: DashboardAlertItem[];
  businessHealth: DashboardBusinessHealth;
  recentTransactions: DashboardRecentTransactionItem[];
  invoiceStats: DashboardInvoiceStats;
}

export type DashboardTxWhere = import('@prisma/client').Prisma.TransactionWhereInput;
export type DashboardInvoiceWhere = import('@prisma/client').Prisma.InvoiceWhereInput;
export type DashboardTrendBucketMap = Record<string, { revenue: number; expense: number }>;

export interface DashboardRecentTransactionRow {
  id: string;
  occurredAt: Date;
  amount: number;
  currency: string;
  direction: string | null;
  type: string;
  sourceType?: string | null;
  externalRef?: string | null;
  memo: string | null;
  store?: { id: string; name: string } | null;
  account?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
}

export interface DashboardSummaryTotalsRow {
  revenue: number;
  expense: number;
  profit: number;
}

export interface DashboardUnpaidSummaryRow {
  unpaidAmount: number;
  unpaidCount: number;
}

export interface DashboardAccountBalanceRow {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface DashboardExpenseBreakdownRow {
  label: string;
  amount: number;
}

export interface DashboardDailyBucketRow {
  occurredAt: Date;
  direction: string | null;
  amount: number;
}

export interface DashboardInventorySummaryRow {
  inventoryValue: number;
  inventoryAlertCount: number;
}
