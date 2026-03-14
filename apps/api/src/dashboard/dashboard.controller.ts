import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';
import { clearExpiredDashboardCache as clearSharedDashboardCache, getCachedDashboard as getSharedCachedDashboard, getDashboardCacheKey as getSharedDashboardCacheKey, setCachedDashboard as setSharedDashboardCache } from './dashboard-cache';
import type { DashboardAccountBalanceRow, DashboardAlertItem, DashboardBusinessHealth, DashboardCashBalanceItem, DashboardDailyBucketRow, DashboardExpenseBreakdownItem, DashboardExpenseBreakdownRow, DashboardFilters, DashboardInvoiceStats, DashboardInvoiceWhere, DashboardRecentTransactionItem, DashboardRecentTransactionRow, DashboardSummaryCards, DashboardSummaryResponse, DashboardTaxSummary, DashboardTrendBucketMap, DashboardTrendPoint, DashboardTxWhere } from './dashboard.types';



type RangeCode = '7d' | '30d' | '90d' | '12m';
type MaybeStoreId = string | undefined;

function parseRange(input?: string): RangeCode {
  const v = String(input || '').toLowerCase();
  if (v === '7d') return '7d';
  if (v === '90d') return '90d';
  if (v === '12m') return '12m';
  return '30d';
}

function rangeDays(range: RangeCode): number {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  if (range === '12m') return 365;
  return 30;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function yyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortLabel(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${m}-${day}`;
}

function safeNumber(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

@Controller()
export class DashboardController {
  // Legacy local cache fields retained only for compatibility; active cache is delegated to dashboard-cache.ts

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
  ) {}

          private async resolveCompanyId(): Promise<string> {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }

    return company.id;
  }

  private normalizeStoreId(storeId?: string): string | null {
    const v = String(storeId || '').trim();
    if (!v || v === 'all') return null;
    return v;
  }

  private makeTxWhere(companyId: string, from: Date, to: Date, storeId?: MaybeStoreId): DashboardTxWhere {
    const normalizedStoreId = this.normalizeStoreId(storeId);
    return {
      companyId,
      occurredAt: {
        gte: from,
        lte: to,
      },
      ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
    };
  }

  private makeInvoiceWhere(companyId: string, from: Date, to: Date, storeId?: MaybeStoreId): DashboardInvoiceWhere {
    const normalizedStoreId = this.normalizeStoreId(storeId);
    return {
      companyId,
      issueDate: {
        gte: from,
        lte: to,
      },
      ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
    };
  }

  private buildSummaryCards(params: {
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

  private buildFilters(
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

  private mapRecentTransaction(x: DashboardRecentTransactionRow): DashboardRecentTransactionItem {
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



  private buildTrendBuckets(
    from: Date,
    days: number,
    bucketRows: DashboardDailyBucketRow[],
  ): DashboardTrendBucketMap {
    const buckets: DashboardTrendBucketMap = this.buildTrendBuckets(from, days, bucketRows);

    return buckets;
  }

  private deriveTrendBuckets(
    from: Date,
    days: number,
    bucketRows: DashboardDailyBucketRow[],
  ): DashboardTrendBucketMap {
    const buckets: DashboardTrendBucketMap = {};

    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      buckets[yyyyMmDd(d)] = { revenue: 0, expense: 0 };
    }

    for (const t of bucketRows) {
      const key = yyyyMmDd(new Date(t.occurredAt));
      if (!buckets[key]) continue;
      if (t.direction === 'INCOME') buckets[key].revenue += safeNumber(t.amount);
      if (t.direction === 'EXPENSE') buckets[key].expense += safeNumber(t.amount);
    }

    return buckets;
  }

  private buildRevenueProfitTrend(
    buckets: DashboardTrendBucketMap,
  ): DashboardTrendPoint[] {
    return Object.entries(buckets).map(([k, v]) => ({
      label: shortLabel(new Date(k)),
      revenue: v.revenue,
      profit: v.revenue - v.expense,
    }));
  }

  private buildCashFlowTrend(
    buckets: DashboardTrendBucketMap,
  ): DashboardTrendPoint[] {
    return Object.entries(buckets).map(([k, v]) => ({
      label: shortLabel(new Date(k)),
      income: v.revenue,
      expense: v.expense,
      net: v.revenue - v.expense,
    }));
  }

  private buildExpenseBreakdown(
    expenseRows: DashboardExpenseBreakdownRow[],
    expense: number,
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

  private buildCashBalances(
    accountBalanceRows: DashboardAccountBalanceRow[],
  ): DashboardCashBalanceItem[] {
    return accountBalanceRows.map((a: DashboardAccountBalanceRow) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: safeNumber(a.balance),
    }));
  }

  private deriveSummaryMetrics(params: {
    summaryTotals: {
      revenue: unknown;
      expense: unknown;
      profit: unknown;
    };
    cashBalances: DashboardCashBalanceItem[];
    unpaidSummary: {
      unpaidAmount: unknown;
      unpaidCount: unknown;
    };
    inventorySummary: {
      inventoryValue: unknown;
      inventoryAlertCount: unknown;
    };
  }): {
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
  } {
    const { summaryTotals, cashBalances, unpaidSummary, inventorySummary } = params;

    const revenue = safeNumber(summaryTotals.revenue);
    const expense = safeNumber(summaryTotals.expense);
    const profit = safeNumber(summaryTotals.profit);
    const cash = cashBalances.reduce((sum, x) => sum + safeNumber(x.balance), 0);

    const unpaidAmount = safeNumber(unpaidSummary.unpaidAmount);
    const unpaidCount = safeNumber(unpaidSummary.unpaidCount);

    const inventoryValue = safeNumber(inventorySummary.inventoryValue);
    const inventoryAlertCount = safeNumber(inventorySummary.inventoryAlertCount);

    const estimatedTax = Math.max(0, Math.round(revenue * 0.1));
    const runwayMonths =
      expense > 0 ? Number((cash / Math.max(expense, 1)).toFixed(1)) : 0;

    return {
      revenue,
      expense,
      profit,
      cash,
      estimatedTax,
      unpaidAmount,
      unpaidCount,
      inventoryValue,
      inventoryAlertCount,
      runwayMonths,
    };
  }

  private buildAlerts(params: {
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


  private buildBusinessHealth(params: {
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

  @Get('dashboard')
  async dashboard(
    @Query('range') rangeInput?: string,
    @Query('storeId') storeId?: string,
    @Query('locale') locale?: string,
  ) : Promise<DashboardSummaryResponse> {
    return this.summary(rangeInput, storeId, locale);
  }

  @Get('dashboard/summary')
  async summary(
    @Query('range') rangeInput?: string,
    @Query('storeId') storeId?: string,
    @Query('locale') _locale?: string,
  ) : Promise<DashboardSummaryResponse> {
      clearSharedDashboardCache();
      const cacheKey = getSharedDashboardCacheKey(rangeInput || '30d', storeId, _locale);
      const cached: DashboardSummaryResponse | null = getSharedCachedDashboard(cacheKey);
      if (cached) {
        return cached;
      }
    const companyId = await this.resolveCompanyId();
    const range = parseRange(rangeInput);
    const days = rangeDays(range);

    const today = new Date();
    const to = endOfDay(today);
    const from = startOfDay(addDays(today, -(days - 1)));
    const normalizedStoreId = this.normalizeStoreId(storeId);

    const txWhere: DashboardTxWhere = this.makeTxWhere(companyId, from, to, normalizedStoreId || undefined);
    const invoiceWhere: DashboardInvoiceWhere = this.makeInvoiceWhere(companyId, from, to, normalizedStoreId || undefined);

      const [
        recentTransactions,
        accountBalanceRows,
        issuedInvoiceCount,
        unpaidSummary,
        historyInvoiceCount,
        inventorySummary,
        summaryTotals,
        expenseRows,
        bucketRows,
      ] = await Promise.all([
        this.dashboardService.loadRecentTransactions(txWhere),

        this.dashboardService.loadAccountBalanceRows(companyId, normalizedStoreId),

        this.dashboardService.countIssuedInvoices(invoiceWhere),

        this.dashboardService.loadUnpaidSummary(companyId, normalizedStoreId),

        this.dashboardService.countHistoryInvoices(companyId, normalizedStoreId),

        this.dashboardService.loadInventorySummary(companyId),

        this.dashboardService.loadSummaryTotals(txWhere),

        this.dashboardService.loadExpenseBreakdown(txWhere),

        this.dashboardService.loadDailyBuckets(txWhere),
      ]);

      const cashBalances: DashboardCashBalanceItem[] = this.buildCashBalances(accountBalanceRows);

      const {
        revenue,
        expense,
        profit,
        cash,
        estimatedTax,
        unpaidAmount,
        unpaidCount,
        inventoryValue,
        inventoryAlertCount,
        runwayMonths,
      } = this.deriveSummaryMetrics({
        summaryTotals,
        cashBalances,
        unpaidSummary,
        inventorySummary,
      });

      const buckets: DashboardTrendBucketMap = this.deriveTrendBuckets(
        from,
        days,
        bucketRows,
      );

      const revenueProfitTrend: DashboardTrendPoint[] = this.buildRevenueProfitTrend(buckets);

      const cashFlowTrend: DashboardTrendPoint[] = this.buildCashFlowTrend(buckets);

      const expenseBreakdown: DashboardExpenseBreakdownItem[] = this.buildExpenseBreakdown(expenseRows, expense);
    const alerts: DashboardAlertItem[] = this.buildAlerts({
      unpaidCount,
      unpaidAmount,
      inventoryAlertCount,
    });

    const businessHealth: DashboardBusinessHealth = this.buildBusinessHealth({
      revenue,
      profit,
      unpaidCount,
      unpaidAmount,
      inventoryAlertCount,
      cash,
    });

    const taxSummary: DashboardTaxSummary = {
      estimatedTax,
      note: 'current-period estimate',
    };

    const invoiceStats: DashboardInvoiceStats = {
      issuedCount: issuedInvoiceCount,
      unpaidCount,
      historyCount: historyInvoiceCount,
    };

    const summaryCards: DashboardSummaryCards = this.buildSummaryCards({
      revenue,
      expense,
      profit,
      cash,
      estimatedTax,
      unpaidAmount,
      unpaidCount,
      inventoryValue,
      inventoryAlertCount,
      runwayMonths,
    });

    const filters: DashboardFilters = this.buildFilters(
      range,
      normalizedStoreId,
      from,
      to,
    );

    const recentTransactionItems: DashboardRecentTransactionItem[] =
      recentTransactions.map((x: DashboardRecentTransactionRow): DashboardRecentTransactionItem =>
        this.mapRecentTransaction(x),
      );

    const response: DashboardSummaryResponse = {
      summary: summaryCards,
      filters,
      revenueProfitTrend,
      cashFlowTrend,
      cashBalances,
      expenseBreakdown,
      taxSummary,
      alerts,
      businessHealth,
      recentTransactions: recentTransactionItems,
      invoiceStats,
    };

    setSharedDashboardCache(cacheKey, response);

    return response;
  }
}
