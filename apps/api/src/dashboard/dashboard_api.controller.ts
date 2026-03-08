import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../prisma.service';

type DashboardRange = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function addMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 0, 0, 0));
}

function resolveRange(range?: DashboardRange) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = addMonths(thisMonthStart, 1);
  const lastMonthStart = addMonths(thisMonthStart, -1);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));

  switch (range) {
    case 'lastMonth':
      return { start: lastMonthStart, end: thisMonthStart, label: '先月' };
    case 'thisYear':
      return { start: yearStart, end: nextMonthStart, label: '今年' };
    case 'custom':
      return { start: thisMonthStart, end: nextMonthStart, label: 'カスタム' };
    case 'thisMonth':
    default:
      return { start: thisMonthStart, end: nextMonthStart, label: '今月' };
  }
}

function fmtJPY(n: number) {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

function previousRange(range?: DashboardRange) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = addMonths(thisMonthStart, -1);
  const prevMonthStart = addMonths(thisMonthStart, -2);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
  const lastYearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0));

  switch (range) {
    case 'lastMonth':
      return { start: prevMonthStart, end: lastMonthStart };
    case 'thisYear':
      return { start: lastYearStart, end: yearStart };
    case 'custom':
      return { start: lastMonthStart, end: thisMonthStart };
    case 'thisMonth':
    default:
      return { start: lastMonthStart, end: thisMonthStart };
  }
}

function pctDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return '0.0%';
  if (previous === 0) return '+100.0%';
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardApiController {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserCompanyId(req: any): Promise<string | null> {
    const userId = req?.user?.userId;
    if (!userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    return user?.companyId || null;
  }

  private async resolveStoreScope(req: any, storeId?: string) {
    const companyId = await this.getUserCompanyId(req);
    if (!companyId) {
      return {
        companyId: null,
        storeIds: [] as string[],
        stores: [] as Array<{ id: string; name: string }>,
      };
    }

    const stores = await this.prisma.store.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!storeId || storeId === 'all') {
      return {
        companyId,
        storeIds: stores.map((s) => s.id),
        stores,
      };
    }

    const target = stores.find((s) => s.id === storeId);
    if (!target) {
      return {
        companyId,
        storeIds: [] as string[],
        stores,
      };
    }

    return {
      companyId,
      storeIds: [target.id],
      stores,
    };
  }

  @Get('summary')
  async summary(
    @Req() req: any,
    @Query('storeId') storeId?: string,
    @Query('range') range?: DashboardRange,
    @Query('locale') locale?: string,
  ) {
    const resolvedRange =
      range === 'thisMonth' ||
      range === 'lastMonth' ||
      range === 'thisYear' ||
      range === 'custom'
        ? range
        : 'thisMonth';

    const resolvedLocale = String(locale || 'ja');
    const scope = await this.resolveStoreScope(req, storeId);
    const selectedStoreId = String(storeId || 'all');

    const { start, end, label } = resolveRange(resolvedRange);
    const prev = previousRange(resolvedRange);

    if (!scope.companyId) {
      return {
        filters: {
          range: resolvedRange,
          storeId: selectedStoreId,
          refreshedAt: new Date().toISOString(),
        },
        kpiPrimary: [],
        kpiSecondary: [],
        revenueProfitTrend: [],
        cashBalances: [],
        expenseBreakdown: [],
        cashFlowTrend: [],
        taxSummary: {
          outputTax: 0,
          inputTax: 0,
          estimatedTaxPayable: 0,
          periodLabel: 'N/A',
          note: 'No company scope',
        },
        alerts: [],
        businessHealth: {
          score: 0,
          status: 'risk',
          dimensions: [],
          insights: [],
        },
        recentTransactions: [],
        quickActions: [],
      };
    }

    const txWhere =
      scope.storeIds.length > 0
        ? {
            storeId: { in: scope.storeIds },
            occurredAt: { gte: start, lt: end },
          }
        : {
            id: '__none__',
          };

    const prevWhere =
      scope.storeIds.length > 0
        ? {
            storeId: { in: scope.storeIds },
            occurredAt: { gte: prev.start, lt: prev.end },
          }
        : {
            id: '__none__',
          };

    const [rows, prevRows, recentRows] = await Promise.all([
      this.prisma.transaction.findMany({
        where: txWhere as any,
        select: {
          id: true,
          type: true,
          amount: true,
          occurredAt: true,
          memo: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: prevWhere as any,
        select: {
          type: true,
          amount: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: txWhere as any,
        select: {
          id: true,
          type: true,
          amount: true,
          occurredAt: true,
          memo: true,
          storeId: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: 8,
      }),
    ]);

    const sumCurrent = {
      revenue: 0,
      expense: 0,
      profit: 0,
      tax: 0,
    };

    const sumPrev = {
      revenue: 0,
      expense: 0,
      profit: 0,
      tax: 0,
    };

    for (const row of rows) {
      const amount = Number(row.amount ?? 0);
      sumCurrent.profit += amount;

      if (amount >= 0) {
        sumCurrent.revenue += amount;
      } else {
        sumCurrent.expense += Math.abs(amount);
      }

      if (String(row.type || '').toUpperCase().includes('TAX')) {
        sumCurrent.tax += Math.abs(amount);
      }
    }

    for (const row of prevRows) {
      const amount = Number(row.amount ?? 0);
      sumPrev.profit += amount;

      if (amount >= 0) {
        sumPrev.revenue += amount;
      } else {
        sumPrev.expense += Math.abs(amount);
      }

      if (String(row.type || '').toUpperCase().includes('TAX')) {
        sumPrev.tax += Math.abs(amount);
      }
    }

    const unpaidAmount = 0;
    const unpaidCount = 0;

    const inventoryAmount = 0;
    const stockAlertCount = 0;

    const runwayMonths =
      sumCurrent.expense > 0
        ? (Math.max(sumCurrent.revenue - sumCurrent.expense, 0) / Math.max(sumCurrent.expense, 1)) * 12
        : 0;

    const kpiPrimary = [
      {
        key: 'revenue',
        label: `${label}収入`,
        value: fmtJPY(sumCurrent.revenue),
        deltaText: `${pctDelta(sumCurrent.revenue, sumPrev.revenue)} vs 前期間`,
        trend: sumCurrent.revenue >= sumPrev.revenue ? 'up' : 'down',
        tone: 'profit',
      },
      {
        key: 'expense',
        label: `${label}支出`,
        value: fmtJPY(sumCurrent.expense),
        deltaText: `${pctDelta(sumCurrent.expense, sumPrev.expense)} vs 前期間`,
        trend: sumCurrent.expense <= sumPrev.expense ? 'up' : 'down',
        tone: 'warning',
      },
      {
        key: 'profit',
        label: `${label}利益`,
        value: fmtJPY(sumCurrent.profit),
        deltaText: `${pctDelta(sumCurrent.profit, sumPrev.profit)} vs 前期間`,
        trend: sumCurrent.profit >= sumPrev.profit ? 'up' : 'down',
        tone: 'profit',
      },
      {
        key: 'cash',
        label: '総資金',
        value: fmtJPY(sumCurrent.profit),
        deltaText: `${pctDelta(sumCurrent.profit, sumPrev.profit)}`,
        trend: sumCurrent.profit >= sumPrev.profit ? 'up' : 'down',
        tone: 'info',
      },
      {
        key: 'tax',
        label: '消費税概算',
        value: fmtJPY(sumCurrent.tax),
        subLabel: 'transaction ベース暫定',
        tone: 'default',
      },
    ];

    const kpiSecondary = [
      {
        key: 'invoice',
        label: '未入金',
        value: fmtJPY(unpaidAmount),
        subLabel: `${unpaidCount}件`,
        tone: 'warning',
      },
      {
        key: 'inventory',
        label: '在庫金額',
        value: fmtJPY(inventoryAmount),
        subLabel: 'inventory 未接続',
        tone: 'default',
      },
      {
        key: 'stockAlert',
        label: '在庫アラート',
        value: `${stockAlertCount}件`,
        subLabel: 'inventory 未接続',
        tone: 'danger',
      },
      {
        key: 'runway',
        label: '資金余力',
        value: `${runwayMonths.toFixed(1)}ヶ月`,
        subLabel: '暫定推計',
        tone: 'info',
      },
    ];

    const storeNameMap = new Map(scope.stores.map((s) => [s.id, s.name]));

    const recentTransactions = recentRows.map((row) => {
      const amount = Number(row.amount ?? 0);
      const typeLabel = amount >= 0 ? '収入' : '支出';

      return {
        id: row.id,
        date: new Date(row.occurredAt).toISOString().slice(0, 10),
        type: typeLabel,
        category: row.type || 'OTHER',
        amount,
        account: '未接続',
        store: storeNameMap.get(row.storeId) || 'Unknown Store',
        memo: row.memo || null,
      };
    });

    const fallbackTrend = [
      { label: '03-01', revenue: 38000, profit: 12000 },
      { label: '03-02', revenue: 52000, profit: 18000 },
      { label: '03-03', revenue: 47000, profit: 15000 },
      { label: '03-04', revenue: 61000, profit: 22000 },
      { label: '03-05', revenue: 56000, profit: 21000 },
      { label: '03-06', revenue: 72000, profit: 26000 },
      { label: '03-07', revenue: 68000, profit: 24000 },
    ];

    return {
      filters: {
        range: resolvedRange,
        storeId: selectedStoreId,
        refreshedAt: new Date().toISOString(),
      },

      kpiPrimary,
      kpiSecondary,

      revenueProfitTrend: fallbackTrend,

      cashBalances: [
        {
          accountId: 'fallback-cash',
          accountName: '未接続',
          accountType: 'cash',
          balance: Math.max(sumCurrent.profit, 0),
          currency: 'JPY',
          sharePct: 100,
        },
      ],

      expenseBreakdown: [
        {
          category: '支出合計',
          amount: sumCurrent.expense,
          pct: 100,
        },
      ],

      cashFlowTrend: [
        {
          label: label,
          cashIn: sumCurrent.revenue,
          cashOut: sumCurrent.expense,
          netCash: sumCurrent.profit,
        },
      ],

      taxSummary: {
        outputTax: sumCurrent.tax,
        inputTax: 0,
        estimatedTaxPayable: sumCurrent.tax,
        periodLabel: label,
        note: 'transaction ベース暫定',
      },

      alerts: [
        {
          id: 'summary-alert-1',
          type: 'info',
          severity: 'info',
          title: 'Step 22B v1: KPI / Recent Transactions は実データです',
          description: 'Charts / Alerts / Inventory は次段階で接続します。',
          href: `/${resolvedLocale}/app`,
        },
      ],

      businessHealth: {
        score: sumCurrent.profit > 0 ? 78 : 52,
        status: sumCurrent.profit > 0 ? 'good' : 'attention',
        dimensions: [
          { label: 'Revenue', score: Math.min(100, Math.round(sumCurrent.revenue / 10000)) },
          { label: 'Profit', score: Math.min(100, Math.max(0, Math.round(sumCurrent.profit / 10000))) },
          { label: 'Expense Control', score: sumCurrent.expense > 0 ? 60 : 40 },
        ],
        insights: [
          {
            id: 'bh-1',
            title: '現在は transaction ベースの暫定 Business Health です',
            tone: 'default',
          },
        ],
      },

      recentTransactions,

      quickActions: [
        {
          key: 'addIncome',
          label: '収入を追加',
          subLabel: '現金・売上',
          href: `/${resolvedLocale}/app/transactions/income`,
          icon: 'plus',
        },
        {
          key: 'addExpense',
          label: '支出を追加',
          subLabel: '経費・運営費',
          href: `/${resolvedLocale}/app/transactions/expense`,
          icon: 'minus',
        },
        {
          key: 'transfer',
          label: '資金移動を記録',
          subLabel: '口座間移動',
          href: `/${resolvedLocale}/app/funds/transfer`,
          icon: 'arrow',
        },
        {
          key: 'invoice',
          label: '請求書を作成',
          subLabel: '新規請求',
          href: `/${resolvedLocale}/app/invoices`,
          icon: 'file',
        },
        {
          key: 'import',
          label: 'データをインポート',
          subLabel: 'CSV / 明細',
          href: `/${resolvedLocale}/app/data/import`,
          icon: 'upload',
        },
        {
          key: 'reports',
          label: 'レポートを見る',
          subLabel: '利益 / CF',
          href: `/${resolvedLocale}/app/reports/profit`,
          icon: 'chart',
        },
      ],
    };
  }
}
