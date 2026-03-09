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

function fmtJPY(n: number) {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

function kpiPrefixFromLabel(label: string) {
  switch (label) {
    case '先月':
      return '先月';
    case '今年':
      return '今年';
    case 'カスタム':
      return '期間';
    case '今月':
    default:
      return '今月';
  }
}

function pctDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return '0.0%';
  if (previous === 0) return '+100.0%';
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function isRevenueType(type: string): boolean {
  return ['SALE', 'INCOME', 'CASH_INCOME', 'OTHER_INCOME'].includes(type);
}

function isExpenseType(type: string): boolean {
  return [
    'FBA_FEE',
    'AD',
    'REFUND',
    'EXPENSE',
    'STORE_OPS',
    'COMPANY_OPS',
    'SALARY',
    'OTHER_EXPENSE',
    'PURCHASE',
    'LOGISTICS',
    'TAX',
  ].includes(type);
}

function expenseCategoryLabel(type: string): string {
  switch (type) {
    case 'AD':
      return '広告費';
    case 'FBA_FEE':
      return 'FBA手数料';
    case 'REFUND':
      return '返金';
    case 'SALARY':
      return '給与';
    case 'PURCHASE':
      return '仕入';
    case 'LOGISTICS':
      return '物流';
    case 'STORE_OPS':
      return '店舗運営費';
    case 'COMPANY_OPS':
      return '会社運営費';
    case 'OTHER_EXPENSE':
      return 'その他支出';
    case 'TAX':
      return '税金';
    case 'EXPENSE':
      return '支出';
    default:
      return type || 'その他';
  }
}

function transactionTypeLabel(type: string): string {
  if (isRevenueType(type)) return '収入';
  if (isExpenseType(type)) return '支出';
  return type || 'OTHER';
}

function dayKey(d: Date): string {
  return new Date(d).toISOString().slice(5, 10);
}

function monthKey(d: Date): string {
  const x = new Date(d);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
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
    const kpiPrefix = kpiPrefixFromLabel(label);

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

      if (amount > 0 || isRevenueType(row.type)) {
        sumCurrent.revenue += Math.max(amount, 0);
      }

      if (amount < 0 || isExpenseType(row.type)) {
        sumCurrent.expense += Math.abs(Math.min(amount, 0));
      }

    }

    for (const row of prevRows) {
      const amount = Number(row.amount ?? 0);
      sumPrev.profit += amount;

      if (amount > 0 || isRevenueType(row.type)) {
        sumPrev.revenue += Math.max(amount, 0);
      }

      if (amount < 0 || isExpenseType(row.type)) {
        sumPrev.expense += Math.abs(Math.min(amount, 0));
      }

    }

    const storeNameMap = new Map(scope.stores.map((s) => [s.id, s.name]));

    const recentTransactions = recentRows.map((row) => {
      const amount = Number(row.amount ?? 0);
      return {
        id: row.id,
        date: new Date(row.occurredAt).toISOString().slice(0, 10),
        type: transactionTypeLabel(row.type),
        category: row.type || 'OTHER',
        amount,
        account: '未接続',
        store: storeNameMap.get(row.storeId) || 'Unknown Store',
        memo: row.memo || null,
      };
    });

    const periodBuckets = new Map<string, { revenue: number; profit: number; cashIn: number; cashOut: number }>();

    for (const row of rows) {
      const amount = Number(row.amount ?? 0);
      const key = resolvedRange === 'thisYear' ? monthKey(row.occurredAt) : dayKey(row.occurredAt);

      if (!periodBuckets.has(key)) {
        periodBuckets.set(key, { revenue: 0, profit: 0, cashIn: 0, cashOut: 0 });
      }

      const bucket = periodBuckets.get(key)!;
      bucket.profit += amount;

      if (amount > 0 || isRevenueType(row.type)) {
        bucket.revenue += Math.max(amount, 0);
        bucket.cashIn += Math.max(amount, 0);
      }

      if (amount < 0 || isExpenseType(row.type)) {
        bucket.cashOut += Math.abs(Math.min(amount, 0));
      }
    }

    const sortedBucketKeys = Array.from(periodBuckets.keys()).sort();

    const revenueProfitTrend =
      sortedBucketKeys.length > 0
        ? sortedBucketKeys.map((key) => ({
            label: key,
            revenue: Math.round(periodBuckets.get(key)!.revenue),
            profit: Math.round(periodBuckets.get(key)!.profit),
          }))
        : [
            { label: label, revenue: 0, profit: 0 },
          ];

    const cashFlowTrend =
      sortedBucketKeys.length > 0
        ? sortedBucketKeys.map((key) => {
            const bucket = periodBuckets.get(key)!;
            return {
              label: key,
              cashIn: Math.round(bucket.cashIn),
              cashOut: Math.round(bucket.cashOut),
              netCash: Math.round(bucket.cashIn - bucket.cashOut),
            };
          })
        : [
            { label: label, cashIn: 0, cashOut: 0, netCash: 0 },
          ];

    const expenseByType = new Map<string, number>();

    for (const row of rows) {
      const amount = Number(row.amount ?? 0);
      if (amount >= 0 && !isExpenseType(row.type)) continue;

      const cat = expenseCategoryLabel(row.type);
      const current = expenseByType.get(cat) || 0;
      expenseByType.set(cat, current + Math.abs(Math.min(amount, 0) || amount));
    }

    const totalExpenseForBreakdown = Array.from(expenseByType.values()).reduce((a, b) => a + b, 0);

    const expenseBreakdown =
      expenseByType.size > 0
        ? Array.from(expenseByType.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, amount]) => ({
              category,
              amount: Math.round(amount),
              pct: totalExpenseForBreakdown > 0 ? Math.round((amount / totalExpenseForBreakdown) * 100) : 0,
            }))
        : [
            { category: '支出合計', amount: 0, pct: 100 },
          ];

    const alertList: Array<{
      id: string;
      type: 'inventory' | 'invoice' | 'cash' | 'tax' | 'expense';
      severity: 'info' | 'warning' | 'critical';
      title: string;
      description?: string;
      href: string;
    }> = [];

    if (sumCurrent.expense > sumCurrent.revenue && rows.length > 0) {
      alertList.push({
        id: 'al-expense-over-revenue',
        type: 'expense',
        severity: 'critical',
        title: '支出が収入を上回っています',
        description: '当期間は赤字傾向です。広告費・返金・固定費を確認してください。',
        href: `/${resolvedLocale}/app/reports/expense`,
      });
    }

    if (sumCurrent.tax > 0) {
      alertList.push({
        id: 'al-tax-estimate',
        type: 'tax',
        severity: 'info',
        title: `消費税見込みは ${fmtJPY(sumCurrent.tax)} です`,
        description: 'transaction ベースの暫定参考値です。',
        href: `/${resolvedLocale}/app/tax/summary`,
      });
    }

    if (sumCurrent.expense > 0 && sumPrev.expense > 0) {
      const expenseDelta = ((sumCurrent.expense - sumPrev.expense) / Math.abs(sumPrev.expense)) * 100;
      if (expenseDelta >= 20) {
        alertList.push({
          id: 'al-expense-spike',
          type: 'expense',
          severity: 'warning',
          title: `支出が前期間比 ${expenseDelta.toFixed(1)}% 増加しました`,
          description: '費用増加の内訳を確認してください。',
          href: `/${resolvedLocale}/app/reports/expense`,
        });
      }
    }

    if (recentTransactions.length === 0) {
      alertList.push({
        id: 'al-no-transactions',
        type: 'cash',
        severity: 'info',
        title: '対象期間の transaction はまだありません',
        description: 'まずは収入または支出を登録すると、ダッシュボードに反映されます。',
        href: `/${resolvedLocale}/app`,
      });
    }

    const alerts =
      alertList.length > 0
        ? alertList
        : [
            {
              id: 'summary-alert-1',
              type: 'cash' as const,
              severity: 'info' as const,
              title: '現時点で重要アラートはありません',
              description: 'ダッシュボードは transaction 集計データから生成されています。',
              href: `/${resolvedLocale}/app`,
            },
          ];

    const estimatedRunwayMonths =
      sumCurrent.expense > 0 ? Number((sumCurrent.revenue / sumCurrent.expense).toFixed(1)) : 0;

    const businessHealthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          50 +
            Math.min(25, sumCurrent.profit / 10000) -
            Math.min(20, sumCurrent.expense / 20000)
        )
      )
    );

    const businessHealthStatus =
      businessHealthScore >= 75 ? 'good' : businessHealthScore >= 50 ? 'attention' : 'risk';

    return {
      filters: {
        range: resolvedRange,
        storeId: selectedStoreId,
        refreshedAt: new Date().toISOString(),
      },

      kpiPrimary: [
        {
          key: 'revenue',
          label: `${kpiPrefix}収入`,
          value: fmtJPY(sumCurrent.revenue),
          deltaText: `${pctDelta(sumCurrent.revenue, sumPrev.revenue)} vs 前期間`,
          trend: sumCurrent.revenue >= sumPrev.revenue ? 'up' : 'down',
          tone: 'profit',
        },
        {
          key: 'expense',
          label: `${kpiPrefix}支出`,
          value: fmtJPY(sumCurrent.expense),
          deltaText: `${pctDelta(sumCurrent.expense, sumPrev.expense)} vs 前期間`,
          trend: sumCurrent.expense <= sumPrev.expense ? 'up' : 'down',
          tone: 'warning',
        },
        {
          key: 'profit',
          label: `${kpiPrefix}利益`,
          value: fmtJPY(sumCurrent.profit),
          deltaText: `${pctDelta(sumCurrent.profit, sumPrev.profit)} vs 前期間`,
          trend: sumCurrent.profit >= sumPrev.profit ? 'up' : 'down',
          tone: 'profit',
        },
        {
          key: 'cash',
          label: '総資金',
          value: fmtJPY(sumCurrent.profit),
          deltaText: pctDelta(sumCurrent.profit, sumPrev.profit),
          trend: sumCurrent.profit >= sumPrev.profit ? 'up' : 'down',
          tone: 'info',
        },
        {
          key: 'tax',
          label: '消費税概算',
          value: fmtJPY(sumCurrent.tax),
          subLabel: 'transaction 集計ベース（暫定）',
          tone: 'default',
        },
      ],

      kpiSecondary: [
        {
          key: 'invoice',
          label: '未入金',
          value: '¥0',
          subLabel: '0件',
          tone: 'warning',
        },
        {
          key: 'inventory',
          label: '在庫金額',
          value: '¥0',
          subLabel: 'inventory 未接続（暫定）',
          tone: 'default',
        },
        {
          key: 'stockAlert',
          label: '在庫アラート',
          value: '0件',
          subLabel: 'inventory 未接続（暫定）',
          tone: 'danger',
        },
        {
          key: 'runway',
          label: '資金余力',
          value: `${estimatedRunwayMonths.toFixed(1)}ヶ月`,
          subLabel: 'transaction 支出ベース推計',
          tone: 'info',
        },
      ],

      revenueProfitTrend,
      cashBalances: [
        {
          accountId: 'fallback-cash',
          accountName: '未接続',
          accountType: 'cash',
          balance: Math.round(sumCurrent.profit),
          currency: 'JPY',
          sharePct: 100,
        },
      ],
      expenseBreakdown,
      cashFlowTrend,

      taxSummary: {
        outputTax: Math.round(sumCurrent.tax),
        inputTax: 0,
        estimatedTaxPayable: Math.round(sumCurrent.tax),
        periodLabel: label,
        note: 'transaction 集計ベース（暫定）',
      },

      alerts,

      businessHealth: {
        score: businessHealthScore,
        status: businessHealthStatus,
        dimensions: [
          { label: 'Revenue', score: Math.max(0, Math.min(100, Math.round(sumCurrent.revenue / 10000))) },
          { label: 'Profit', score: Math.max(0, Math.min(100, Math.round(Math.max(sumCurrent.profit, 0) / 10000))) },
          { label: 'Expense Control', score: Math.max(0, 100 - Math.min(60, Math.round(sumCurrent.expense / 10000))) },
        ],
        insights: [
          {
            id: 'bh-1',
            title: 'Business Health は transaction 集計ベースの暫定スコアです',
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
