import type {
  DashboardAccountBalanceRow,
  DashboardAlertItem,
  DashboardBusinessHealth,
  DashboardCashBalanceItem,
  DashboardExpenseBreakdownItem,
  DashboardExpenseBreakdownRow,
  DashboardFilters,
  DashboardRecentTransactionItem,
  DashboardRecentTransactionRow,
  DashboardSummaryCards,
  DashboardTrendBucketMap,
  DashboardTrendPoint,
} from './dashboard.types';

export function buildSummaryCards(params: {
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
}): DashboardSummaryCards {
  return {
    revenue: params.revenue,
    expense: params.expense,
    profit: params.profit,
    cash: params.cash,
    estimatedTax: params.estimatedTax,
    unpaidAmount: params.unpaidAmount,
    unpaidCount: params.unpaidCount,
    inventoryValue: params.inventoryValue,
    inventoryAlertCount: params.inventoryAlertCount,
    runwayMonths: params.runwayMonths,
  };
}

export function buildFilters(
  range: string,
  normalizedStoreId: string | null,
  from: Date,
  to: Date,
): DashboardFilters {
  return {
    range,
    storeId: normalizedStoreId ?? 'all',
    from,
    to,
  };
}

export function mapRecentTransaction(
  x: DashboardRecentTransactionRow,
): DashboardRecentTransactionItem {
  return {
    id: x.id,
    occurredAt: x.occurredAt,
    amount: x.amount,
    currency: x.currency,
    direction: x.direction,
    sourceType: x.sourceType,
    type: x.type,
    memo: x.memo,
    externalRef: x.externalRef,
    storeName: x.store?.name ?? null,
    accountName: x.account?.name ?? null,
    categoryName: x.category?.name ?? null,
  };
}

export function buildRevenueProfitTrend(
  buckets: DashboardTrendBucketMap,
  shortLabel: (d: Date) => string,
): DashboardTrendPoint[] {
  return Object.entries(buckets).map(([k, v]) => ({
    label: shortLabel(new Date(k)),
    revenue: v.revenue,
    profit: v.revenue - v.expense,
  }));
}

export function buildCashFlowTrend(
  buckets: DashboardTrendBucketMap,
  shortLabel: (d: Date) => string,
): DashboardTrendPoint[] {
  return Object.entries(buckets).map(([k, v]) => ({
    label: shortLabel(new Date(k)),
    income: v.revenue,
    expense: v.expense,
    net: v.revenue - v.expense,
  }));
}

export function buildExpenseBreakdown(
  expenseRows: DashboardExpenseBreakdownRow[],
  expense: number,
  safeNumber: (v: unknown) => number,
): DashboardExpenseBreakdownItem[] {
  return expenseRows
    .map((x: DashboardExpenseBreakdownRow) => ({
      label: x.label,
      amount: safeNumber(x.amount),
      share: expense > 0 ? Number(((safeNumber(x.amount) / expense) * 100).toFixed(0)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

export function buildCashBalances(
  accountBalanceRows: DashboardAccountBalanceRow[],
  safeNumber: (v: unknown) => number,
): DashboardCashBalanceItem[] {
  return accountBalanceRows.map((a: DashboardAccountBalanceRow) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: safeNumber(a.balance),
  }));
}

export function buildAlerts(params: {
  unpaidCount: number;
  unpaidAmount: number;
  inventoryAlertCount: number;
}): DashboardAlertItem[] {
  const { unpaidCount, unpaidAmount, inventoryAlertCount } = params;
  const alerts: DashboardAlertItem[] = [];

  if (unpaidCount > 0) {
    alerts.push({
      key: 'unpaid',
      level: 'warning',
      title: `未入金の請求書が ${unpaidCount} 件あります`,
      description: `未回収金額: ¥${unpaidAmount.toLocaleString()}`,
    });
  }

  if (inventoryAlertCount > 0) {
    alerts.push({
      key: 'inventory',
      level: 'warning',
      title: `在庫アラートが ${inventoryAlertCount} 件あります`,
      description: '補充対象の商品を確認してください。',
    });
  }

  return alerts;
}

export function buildBusinessHealth(params: {
  revenue: number;
  profit: number;
  unpaidCount: number;
  unpaidAmount: number;
  inventoryAlertCount: number;
  cash: number;
}): DashboardBusinessHealth {
  const { revenue, profit, unpaidCount, unpaidAmount, inventoryAlertCount, cash } = params;

  return {
    score:
      revenue <= 0
        ? 50
        : Math.max(
            35,
            Math.min(
              95,
              Math.round(
                60 +
                  (profit > 0 ? 12 : -12) +
                  (unpaidCount === 0 ? 8 : -6) +
                  (inventoryAlertCount === 0 ? 5 : -4),
              ),
            ),
          ),
    status: profit > 0 ? 'good' : 'attention',
    headline: profit > 0 ? '利益は黒字です' : '収支の見直しが必要です',
    summary: `売上 ¥${revenue.toLocaleString()} / 利益 ¥${profit.toLocaleString()} / 未入金 ¥${unpaidAmount.toLocaleString()}`,
    items: [
      { label: 'Revenue', value: `¥${revenue.toLocaleString()}` },
      { label: 'Profit', value: `¥${profit.toLocaleString()}` },
      { label: 'Unpaid', value: `¥${unpaidAmount.toLocaleString()}` },
      { label: 'Cash', value: `¥${cash.toLocaleString()}` },
    ],
  };
}
