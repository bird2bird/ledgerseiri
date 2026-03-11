import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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

  private async loadInventoryBalancesSafe(companyId: string): Promise<any[]> {
    try {
      return await this.prisma.inventoryBalance.findMany({
        where: { companyId },
        include: {
          sku: {
            select: {
              id: true,
              name: true,
              costAmount: true,
            },
          },
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2021') {
        return [];
      }
      throw e;
    }
  }

  @Get('dashboard')
  async dashboard(
    @Query('range') rangeInput?: string,
    @Query('storeId') storeId?: string,
    @Query('locale') locale?: string,
  ) {
    return this.summary(rangeInput, storeId, locale);
  }

  @Get('dashboard/summary')
  async summary(
    @Query('range') rangeInput?: string,
    @Query('storeId') storeId?: string,
    @Query('locale') _locale?: string,
  ) {
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
      transactions,
      recentTransactions,
      accounts,
      invoicesInRange,
      unpaidInvoices,
      historyInvoices,
      inventoryBalances,
    ] = await Promise.all([
      this.prisma.transaction.findMany({
        where: txWhere,
        orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
        include: {
          store: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),

      this.prisma.transaction.findMany({
        where: txWhere,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        take: 8,
        include: {
          store: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),

      this.prisma.account.findMany({
        where: {
          companyId,
          ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
        },
        orderBy: [{ createdAt: 'asc' }],
        include: {
          transactions: {
            where: { companyId },
            select: {
              id: true,
              amount: true,
              direction: true,
            },
          },
          transfersIn: {
            where: { companyId },
            select: { id: true, amount: true },
          },
          transfersOut: {
            where: { companyId },
            select: { id: true, amount: true },
          },
        },
      }),

      this.prisma.invoice.findMany({
        where: invoiceWhere,
        orderBy: [{ issueDate: 'asc' }, { createdAt: 'asc' }],
        include: {
          store: { select: { id: true, name: true } },
        },
      }),

      this.prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
          ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          store: { select: { id: true, name: true } },
        },
      }),

      this.prisma.invoice.findMany({
        where: {
          companyId,
          paidAmount: { gt: 0 },
          ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          store: { select: { id: true, name: true } },
        },
      }),

      this.loadInventoryBalancesSafe(companyId),
    ]);

    const revenue = transactions
      .filter((x) => x.direction === 'INCOME')
      .reduce((sum, x) => sum + safeNumber(x.amount), 0);

    const expense = transactions
      .filter((x) => x.direction === 'EXPENSE')
      .reduce((sum, x) => sum + safeNumber(x.amount), 0);

    const profit = revenue - expense;

    const cashBalances = accounts.map((a) => {
      const income = a.transactions
        .filter((t) => t.direction === 'INCOME')
        .reduce((sum, t) => sum + safeNumber(t.amount), 0);

      const expenseAmt = a.transactions
        .filter((t) => t.direction === 'EXPENSE')
        .reduce((sum, t) => sum + safeNumber(t.amount), 0);

      const transferIn = a.transfersIn.reduce((sum, t) => sum + safeNumber(t.amount), 0);
      const transferOut = a.transfersOut.reduce((sum, t) => sum + safeNumber(t.amount), 0);

      const balance =
        safeNumber(a.openingBalance) + income - expenseAmt + transferIn - transferOut;

      return {
        id: a.id,
        name: a.name,
        type: a.type,
        balance,
      };
    });

    const cash = cashBalances.reduce((sum, x) => sum + safeNumber(x.balance), 0);

    const unpaidAmount = unpaidInvoices.reduce(
      (sum, x) => sum + (safeNumber(x.totalAmount) - safeNumber(x.paidAmount)),
      0,
    );
    const unpaidCount = unpaidInvoices.length;

    const inventoryValue = inventoryBalances.reduce((sum, x) => {
      const qty = safeNumber(x.quantity);
      const cost = safeNumber(x.sku?.costAmount);
      return sum + qty * cost;
    }, 0);

    const inventoryAlertCount = inventoryBalances.filter((x) => {
      return safeNumber(x.quantity) <= safeNumber(x.alertLevel);
    }).length;

    const estimatedTax = Math.max(0, Math.round(revenue * 0.1));

    const runwayMonths =
      expense > 0 ? Number((cash / Math.max(expense, 1)).toFixed(1)) : 0;

    const buckets: Record<string, { revenue: number; expense: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      buckets[yyyyMmDd(d)] = { revenue: 0, expense: 0 };
    }

    for (const t of transactions) {
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

    const expenseMap: Record<string, number> = {};
    for (const t of transactions.filter((x) => x.direction === 'EXPENSE')) {
      const key = t.category?.name || t.type || 'OTHER';
      expenseMap[key] = (expenseMap[key] || 0) + safeNumber(t.amount);
    }

    const expenseBreakdown = Object.entries(expenseMap)
      .map(([label, amount]) => ({
        label,
        amount,
        share: expense > 0 ? Number(((amount / expense) * 100).toFixed(0)) : 0,
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
      recentTransactions: recentTransactions.map((x) => ({
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
        issuedCount: invoicesInRange.length,
        unpaidCount,
        historyCount: historyInvoices.length,
      },
    };
  }
}
