import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';
import { clearExpiredDashboardCache as clearSharedDashboardCache, getCachedDashboard as getSharedCachedDashboard, getDashboardCacheKey as getSharedDashboardCacheKey, setCachedDashboard as setSharedDashboardCache } from './dashboard-cache';
import type { DashboardAccountBalanceRow, DashboardAlertItem, DashboardBusinessHealth, DashboardCashBalanceItem, DashboardDailyBucketRow, DashboardExpenseBreakdownItem, DashboardExpenseBreakdownRow, DashboardFilters, DashboardInvoiceStats, DashboardInvoiceWhere, DashboardRecentTransactionItem, DashboardRecentTransactionRow, DashboardSummaryCards, DashboardSummaryResponse, DashboardTaxSummary, DashboardTrendBucketMap, DashboardTrendPoint, DashboardTxWhere } from './dashboard.types';
import { buildAlerts, buildBusinessHealth, buildCashBalances, buildCashFlowTrend, buildExpenseBreakdown, buildFilters, buildRevenueProfitTrend, buildSummaryCards, mapRecentTransaction } from './dashboard.presentation';



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

    private deriveSummaryPresentation(params: {
      from: Date;
      days: number;
      accountBalanceRows: DashboardAccountBalanceRow[];
      summaryTotals: {
        revenue: number;
        expense: number;
        profit: number;
      };
      unpaidSummary: {
        unpaidAmount: number;
        unpaidCount: number;
      };
      inventorySummary: {
        inventoryValue: number;
        inventoryAlertCount: number;
      };
      expenseRows: DashboardExpenseBreakdownRow[];
      bucketRows: DashboardDailyBucketRow[];
    }): {
      cashBalances: DashboardCashBalanceItem[];
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
      revenueProfitTrend: DashboardTrendPoint[];
      cashFlowTrend: DashboardTrendPoint[];
      expenseBreakdown: DashboardExpenseBreakdownItem[];
      alerts: DashboardAlertItem[];
      businessHealth: DashboardBusinessHealth;
    } {
      const {
        from,
        days,
        accountBalanceRows,
        summaryTotals,
        unpaidSummary,
        inventorySummary,
        expenseRows,
        bucketRows,
      } = params;

      const cashBalances: DashboardCashBalanceItem[] = buildCashBalances(accountBalanceRows, safeNumber);

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

      const revenueProfitTrend: DashboardTrendPoint[] = buildRevenueProfitTrend(buckets, shortLabel);
      const cashFlowTrend: DashboardTrendPoint[] = buildCashFlowTrend(buckets, shortLabel);
      const expenseBreakdown: DashboardExpenseBreakdownItem[] = buildExpenseBreakdown(expenseRows, expense, safeNumber);

      const alerts: DashboardAlertItem[] = buildAlerts({
        unpaidCount,
        unpaidAmount,
        inventoryAlertCount,
      });

      const businessHealth: DashboardBusinessHealth = buildBusinessHealth({
        revenue,
        profit,
        unpaidCount,
        unpaidAmount,
        inventoryAlertCount,
        cash,
      });

      return {
        cashBalances,
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
        revenueProfitTrend,
        cashFlowTrend,
        expenseBreakdown,
        alerts,
        businessHealth,
      };
    }

    private async resolveSummaryQueryContext(params: {
      rangeInput?: string;
      storeId?: string;
    }): Promise<{
      companyId: string;
      range: string;
      days: number;
      from: Date;
      to: Date;
      normalizedStoreId: string | null;
      txWhere: DashboardTxWhere;
      invoiceWhere: DashboardInvoiceWhere;
    }> {
      const { rangeInput, storeId } = params;

      const companyId = await this.resolveCompanyId();
      const range = parseRange(rangeInput);
      const days = rangeDays(range);

      const today = new Date();
      const to = endOfDay(today);
      const from = startOfDay(addDays(today, -(days - 1)));
      const normalizedStoreId = this.normalizeStoreId(storeId);

      const txWhere: DashboardTxWhere = this.makeTxWhere(
        companyId,
        from,
        to,
        normalizedStoreId || undefined,
      );

      const invoiceWhere: DashboardInvoiceWhere = this.makeInvoiceWhere(
        companyId,
        from,
        to,
        normalizedStoreId || undefined,
      );

      return {
        companyId,
        range,
        days,
        from,
        to,
        normalizedStoreId,
        txWhere,
        invoiceWhere,
      };
    }

    private assembleSummaryResponse(params: {
      range: string;
      normalizedStoreId: string | null;
      from: Date;
      to: Date;
      issuedInvoiceCount: number;
      historyInvoiceCount: number;
      recentTransactions: DashboardRecentTransactionRow[];
      revenueProfitTrend: DashboardTrendPoint[];
      cashFlowTrend: DashboardTrendPoint[];
      cashBalances: DashboardCashBalanceItem[];
      expenseBreakdown: DashboardExpenseBreakdownItem[];
      alerts: DashboardAlertItem[];
      businessHealth: DashboardBusinessHealth;
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
    }): DashboardSummaryResponse {
      const {
        range,
        normalizedStoreId,
        from,
        to,
        issuedInvoiceCount,
        historyInvoiceCount,
        recentTransactions,
        revenueProfitTrend,
        cashFlowTrend,
        cashBalances,
        expenseBreakdown,
        alerts,
        businessHealth,
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
      } = params;

      const taxSummary: DashboardTaxSummary = {
        estimatedTax,
        note: 'current-period estimate',
      };

      const invoiceStats: DashboardInvoiceStats = {
        issuedCount: issuedInvoiceCount,
        unpaidCount,
        historyCount: historyInvoiceCount,
      };

      const summaryCards: DashboardSummaryCards = buildSummaryCards({
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

      const filters: DashboardFilters = buildFilters(
        range,
        normalizedStoreId,
        from,
        to,
      );

      const recentTransactionItems: DashboardRecentTransactionItem[] =
        recentTransactions.map((x: DashboardRecentTransactionRow): DashboardRecentTransactionItem =>
          mapRecentTransaction(x),
        );

      return {
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
    }

    private async loadSummaryDependencies(params: {
      companyId: string;
      normalizedStoreId: string | null;
      txWhere: DashboardTxWhere;
      invoiceWhere: DashboardInvoiceWhere;
    }): Promise<{
      recentTransactions: DashboardRecentTransactionRow[];
      accountBalanceRows: DashboardAccountBalanceRow[];
      issuedInvoiceCount: number;
      unpaidSummary: {
        unpaidAmount: number;
        unpaidCount: number;
      };
      historyInvoiceCount: number;
      inventorySummary: {
        inventoryValue: number;
        inventoryAlertCount: number;
      };
      summaryTotals: {
        revenue: number;
        expense: number;
        profit: number;
      };
      expenseRows: DashboardExpenseBreakdownRow[];
      bucketRows: DashboardDailyBucketRow[];
    }> {
      const {
        companyId,
        normalizedStoreId,
        txWhere,
        invoiceWhere,
      } = params;

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

      return {
        recentTransactions,
        accountBalanceRows,
        issuedInvoiceCount,
        unpaidSummary,
        historyInvoiceCount,
        inventorySummary,
        summaryTotals,
        expenseRows,
        bucketRows,
      };
    }

    @Get('dashboard')
    async dashboard(
      @Query('range') rangeInput?: string,
      @Query('storeId') storeId?: string,
      @Query('locale') locale?: string,
    ): Promise<DashboardSummaryResponse> {
      return this.summary(rangeInput, storeId, locale);
    }

    @Get('dashboard/summary')
    async summary(
      @Query('range') rangeInput?: string,
      @Query('storeId') storeId?: string,
      @Query('locale') _locale?: string,
    ): Promise<DashboardSummaryResponse> {
      clearSharedDashboardCache();

      const cacheKey = getSharedDashboardCacheKey(rangeInput || '30d', storeId, _locale);
      const cached: DashboardSummaryResponse | null = getSharedCachedDashboard(cacheKey);
      if (cached) {
        return cached;
      }

      // Stage 1: resolve query context
      const queryContext = await this.resolveSummaryQueryContext({
        rangeInput,
        storeId,
      });

      const {
        companyId,
        range,
        days,
        from,
        to,
        normalizedStoreId,
        txWhere,
        invoiceWhere,
      } = queryContext;

      // Stage 2: load dependencies
      const dependencies = await this.loadSummaryDependencies({
        companyId,
        normalizedStoreId,
        txWhere,
        invoiceWhere,
      });

      const {
        recentTransactions,
        issuedInvoiceCount,
        historyInvoiceCount,
      } = dependencies;

      // Stage 3: derive presentation data
      const presentation = this.deriveSummaryPresentation({
        from,
        days,
        accountBalanceRows: dependencies.accountBalanceRows,
        summaryTotals: dependencies.summaryTotals,
        unpaidSummary: dependencies.unpaidSummary,
        inventorySummary: dependencies.inventorySummary,
        expenseRows: dependencies.expenseRows,
        bucketRows: dependencies.bucketRows,
      });

      const {
        cashBalances,
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
        revenueProfitTrend,
        cashFlowTrend,
        expenseBreakdown,
        alerts,
        businessHealth,
      } = presentation;

      // Stage 4: assemble response
      const response: DashboardSummaryResponse = this.assembleSummaryResponse({
        range,
        normalizedStoreId,
        from,
        to,
        issuedInvoiceCount,
        historyInvoiceCount,
        recentTransactions,
        revenueProfitTrend,
        cashFlowTrend,
        cashBalances,
        expenseBreakdown,
        alerts,
        businessHealth,
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

      setSharedDashboardCache(cacheKey, response);

      return { ...(response as any) } as DashboardSummaryResponse;
    }
  }
