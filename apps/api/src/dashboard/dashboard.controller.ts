import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';
import { clearExpiredDashboardCache as clearSharedDashboardCache, getCachedDashboard as getSharedCachedDashboard, getDashboardCacheKey as getSharedDashboardCacheKey, setCachedDashboard as setSharedDashboardCache } from './dashboard-cache';
import type { DashboardAccountBalanceRow, DashboardDailyBucketRow, DashboardExpenseBreakdownRow, DashboardRecentTransactionItem, DashboardSummaryResponse } from './dashboard.types';

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

          private async resolveCompanyId() {
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

  private makeTxWhere(companyId: string, from: Date, to: Date, storeId?: MaybeStoreId) {
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

  private makeInvoiceWhere(companyId: string, from: Date, to: Date, storeId?: MaybeStoreId) {
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
      const cached = getSharedCachedDashboard(cacheKey);
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

    const txWhere = this.makeTxWhere(companyId, from, to, normalizedStoreId || undefined);
    const invoiceWhere = this.makeInvoiceWhere(companyId, from, to, normalizedStoreId || undefined);

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

      const revenue = safeNumber(summaryTotals.revenue);
      const expense = safeNumber(summaryTotals.expense);
      const profit = safeNumber(summaryTotals.profit);
    const cashBalances = accountBalanceRows.map((a: DashboardAccountBalanceRow) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: safeNumber(a.balance),
    }));

    const cash = cashBalances.reduce((sum, x) => sum + safeNumber(x.balance), 0);

    const unpaidAmount = safeNumber(unpaidSummary.unpaidAmount);
    const unpaidCount = safeNumber(unpaidSummary.unpaidCount);

    const inventoryValue = safeNumber(inventorySummary.inventoryValue);

    const inventoryAlertCount = safeNumber(inventorySummary.inventoryAlertCount);

    const estimatedTax = Math.max(0, Math.round(revenue * 0.1));

    const runwayMonths =
      expense > 0 ? Number((cash / Math.max(expense, 1)).toFixed(1)) : 0;

      const buckets: Record<string, { revenue: number; expense: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = addDays(from, i);
        buckets[yyyyMmDd(d)] = { revenue: 0, expense: 0 };
      }

      for (const t of bucketRows as DashboardDailyBucketRow[]) {
        const key = yyyyMmDd(new Date(t.occurredAt));
        if (!buckets[key]) continue;
        if (t.direction === 'INCOME') buckets[key].revenue += safeNumber(t.amount);
        if (t.direction === 'EXPENSE') buckets[key].expense += safeNumber(t.amount);
      }

      const revenueProfitTrend = Object.entries(buckets).map(([k, v]) => ({
        label: shortLabel(new Date(k)),
        revenue: v.revenue,
        profit: v.revenue - v.expense,
      }));

      const cashFlowTrend = Object.entries(buckets).map(([k, v]) => ({
        label: shortLabel(new Date(k)),
        income: v.revenue,
        expense: v.expense,
        net: v.revenue - v.expense,
      }));

      const expenseBreakdown = expenseRows
        .map((x: DashboardExpenseBreakdownRow) => ({
          label: x.label,
          amount: safeNumber(x.amount),
          share: expense > 0 ? Number(((safeNumber(x.amount) / expense) * 100).toFixed(0)) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);
    const alerts = [
      ...(unpaidCount > 0
        ? [
            {
              key: 'unpaid',
              level: 'warning',
              title: `未入金の請求書が ${unpaidCount} 件あります`,
              description: `未回収金額: ¥${unpaidAmount.toLocaleString()}`,
            },
          ]
        : []),
      ...(inventoryAlertCount > 0
        ? [
            {
              key: 'inventory',
              level: 'warning',
              title: `在庫アラートが ${inventoryAlertCount} 件あります`,
              description: '補充対象の商品を確認してください。',
            },
          ]
        : []),
    ];

    const businessHealth = {
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

    return {
      summary: {
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
      },
      filters: {
        range,
        storeId: normalizedStoreId ?? 'all',
        from,
        to,
      },
      revenueProfitTrend,
      cashFlowTrend,
      cashBalances,
      expenseBreakdown,
      taxSummary: {
        estimatedTax,
        note: 'current-period estimate',
      },
      alerts,
      businessHealth,
      recentTransactions: recentTransactions.map((x): DashboardRecentTransactionItem => ({
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
      })),
      invoiceStats: {
        issuedCount: issuedInvoiceCount,
        unpaidCount,
        historyCount: historyInvoiceCount,
      },
    };
  }
}
