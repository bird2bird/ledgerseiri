import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type ReportRange = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

type DetailKind = 'cashflow' | 'income' | 'expense' | 'profit';

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function addMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 0, 0, 0));
}

function resolveRange(range?: ReportRange) {
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

function expenseTypeLabel(type: string) {
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

function dayKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

function normalizeDetailKind(kind?: string): DetailKind {
  switch (kind) {
    case 'income':
    case 'expense':
    case 'profit':
    case 'cashflow':
      return kind;
    default:
      return 'cashflow';
  }
}

function normalizeDetailMetric(metric?: string) {
  return String(metric ?? '').trim() || 'summary';
}

function safeAbs(value: unknown) {
  return Math.abs(Number(value ?? 0));
}

function fmtJPY(value: number) {
  return `¥${Math.round(Number(value ?? 0)).toLocaleString('ja-JP')}`;
}

function normalizeDirection(direction: unknown) {
  return String(direction ?? '').toUpperCase();
}

function buildDetailRow(
  key: string,
  values: {
    date?: string;
    type?: string;
    amount?: string;
    note?: string;
  },
) {
  return {
    key,
    values: {
      date: values.date ?? '-',
      type: values.type ?? '-',
      amount: values.amount ?? '-',
      note: values.note ?? '-',
    },
  };
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildTransactionWhere(
    companyId: string,
    range?: ReportRange,
    storeId?: string,
  ) {
    const resolved = resolveRange(range);
    return {
      companyId,
      occurredAt: {
        gte: resolved.start,
        lt: resolved.end,
      },
      ...(storeId && storeId !== 'all' ? { storeId } : {}),
    };
  }

  private buildTransferWhere(
    companyId: string,
    range?: ReportRange,
    storeId?: string,
  ) {
    const resolved = resolveRange(range);
    void storeId;
    return {
      companyId,
      occurredAt: {
        gte: resolved.start,
        lt: resolved.end,
      },
    };
  }

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



  async getIncomeReport(range?: ReportRange) {
    const companyId = await this.resolveCompanyId();
    const resolved = resolveRange(range);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        companyId,
        direction: 'INCOME',
        occurredAt: {
          gte: resolved.start,
          lt: resolved.end,
        },
      },
      select: {
        id: true,
        occurredAt: true,
        amount: true,
        type: true,
        memo: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ occurredAt: 'asc' }],
    });

    let totalIncome = 0;

    const trendMap = new Map<
      string,
      {
        date: string;
        amount: number;
        count: number;
      }
    >();

    const breakdownMap = new Map<
      string,
      {
        key: string;
        label: string;
        amount: number;
        count: number;
      }
    >();

    for (const tx of transactions) {
      const amount = Math.abs(Number(tx.amount ?? 0));
      totalIncome += amount;

      const date = dayKey(tx.occurredAt);
      const trendRow = trendMap.get(date) ?? {
        date,
        amount: 0,
        count: 0,
      };
      trendRow.amount += amount;
      trendRow.count += 1;
      trendMap.set(date, trendRow);

      const rawLabel =
        tx.category?.name?.trim() ||
        String(tx.type || '').trim() ||
        'その他収入';

      const breakdownKey = rawLabel;
      const breakdownRow = breakdownMap.get(breakdownKey) ?? {
        key: breakdownKey,
        label: rawLabel,
        amount: 0,
        count: 0,
      };
      breakdownRow.amount += amount;
      breakdownRow.count += 1;
      breakdownMap.set(breakdownKey, breakdownRow);
    }

    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const breakdown = Array.from(breakdownMap.values()).sort(
      (a, b) => b.amount - a.amount,
    );

    const activeDays = trend.length;
    const rowsCount = transactions.length;
    const averagePerRow = rowsCount > 0 ? totalIncome / rowsCount : 0;

    return {
      ok: true,
      domain: 'reports',
      action: 'income',
      filters: {
        range: range ?? 'thisMonth',
        label: resolved.label,
        start: resolved.start.toISOString(),
        end: resolved.end.toISOString(),
      },
      summary: {
        totalIncome,
        rowsCount,
        averagePerRow,
        activeDays,
      },
      trend,
      breakdown,
      message: 'income report loaded',
    };
  }

  async getExpenseReport(range?: ReportRange) {
    const companyId = await this.resolveCompanyId();
    const resolved = resolveRange(range);

    const rows = await this.prisma.transaction.findMany({
      where: {
        companyId,
        direction: 'EXPENSE',
        occurredAt: {
          gte: resolved.start,
          lt: resolved.end,
        },
      },
      select: {
        id: true,
        occurredAt: true,
        amount: true,
        type: true,
        memo: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    const totalExpense = rows.reduce(
      (sum, row) => sum + Math.abs(Number(row.amount ?? 0)),
      0,
    );

    const rowsCount = rows.length;
    const averagePerRow = rowsCount > 0 ? totalExpense / rowsCount : 0;
    const activeDays = new Set(rows.map((row) => dayKey(row.occurredAt))).size;

    const categoryMap = new Map<string, number>();
    const trendMap = new Map<string, { date: string; amount: number; count: number }>();

    for (const row of rows) {
      const amount = Math.abs(Number(row.amount ?? 0));
      const category = expenseTypeLabel(String(row.type ?? ''));
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + amount);

      const date = dayKey(row.occurredAt);
      const trendRow = trendMap.get(date) ?? { date, amount: 0, count: 0 };
      trendRow.amount += amount;
      trendRow.count += 1;
      trendMap.set(date, trendRow);
    }

    const breakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const recentItems = rows.slice(0, 20).map((row) => ({
      id: row.id,
      date: dayKey(row.occurredAt),
      type: expenseTypeLabel(String(row.type ?? '')),
      amount: Math.abs(Number(row.amount ?? 0)),
      memo: row.memo ?? null,
    }));

    return {
      ok: true,
      domain: 'reports',
      action: 'expense',
      filters: {
        range: range ?? 'thisMonth',
        label: resolved.label,
        start: resolved.start.toISOString(),
        end: resolved.end.toISOString(),
      },
      summary: {
        totalExpense,
        rowsCount,
        averagePerRow,
        activeDays,
      },
      breakdown,
      trend,
      recentItems,
      message: 'expense report loaded',
    };
  }


  async getProfitReport(range?: ReportRange) {
    const companyId = await this.resolveCompanyId();
    const resolved = resolveRange(range);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        companyId,
        occurredAt: {
          gte: resolved.start,
          lt: resolved.end,
        },
      },
      select: {
        id: true,
        occurredAt: true,
        direction: true,
        amount: true,
        type: true,
      },
      orderBy: [{ occurredAt: 'asc' }],
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const trendMap = new Map<
      string,
      {
        date: string;
        income: number;
        expense: number;
        profit: number;
      }
    >();

    const expenseTypeMap = new Map<string, number>();

    for (const tx of transactions) {
      const amount = Math.abs(Number(tx.amount ?? 0));
      const date = dayKey(tx.occurredAt);
      const row = trendMap.get(date) ?? {
        date,
        income: 0,
        expense: 0,
        profit: 0,
      };

      if (tx.direction === 'INCOME') {
        totalIncome += amount;
        row.income += amount;
      } else if (tx.direction === 'EXPENSE') {
        totalExpense += amount;
        row.expense += amount;
        const key = String(tx.type || 'OTHER');
        expenseTypeMap.set(key, (expenseTypeMap.get(key) ?? 0) + amount);
      }

      row.profit = row.income - row.expense;
      trendMap.set(date, row);
    }

    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const breakdown = Array.from(expenseTypeMap.entries())
      .map(([type, amount]) => ({
        type,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const grossProfit = totalIncome - totalExpense;
    const marginPct = totalIncome > 0 ? Number(((grossProfit / totalIncome) * 100).toFixed(1)) : 0;

    return {
      ok: true,
      domain: 'reports',
      action: 'profit',
      filters: {
        range: range ?? 'thisMonth',
        label: resolved.label,
        start: resolved.start.toISOString(),
        end: resolved.end.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        grossProfit,
        marginPct,
      },
      breakdown,
      trend,
      message: 'profit report loaded',
    };
  }

  async getCashflowReport(range?: ReportRange) {
    const companyId = await this.resolveCompanyId();
    const resolved = resolveRange(range);

    const [transactions, transfers] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          companyId,
          occurredAt: {
            gte: resolved.start,
            lt: resolved.end,
          },
        },
        select: {
          id: true,
          occurredAt: true,
          direction: true,
          amount: true,
          type: true,
        },
        orderBy: [{ occurredAt: 'asc' }],
      }),
      this.prisma.fundTransfer.findMany({
        where: {
          companyId,
          occurredAt: {
            gte: resolved.start,
            lt: resolved.end,
          },
        },
        select: {
          id: true,
          occurredAt: true,
          amount: true,
        },
        orderBy: [{ occurredAt: 'asc' }],
      }),
    ]);

    let cashIn = 0;
    let cashOut = 0;
    let inboundTransfers = 0;
    let outboundTransfers = 0;

    const trendMap = new Map<
      string,
      {
        date: string;
        cashIn: number;
        cashOut: number;
        netCash: number;
        inboundTransfers: number;
        outboundTransfers: number;
      }
    >();

    for (const tx of transactions) {
      const date = dayKey(tx.occurredAt);
      const row = trendMap.get(date) ?? {
        date,
        cashIn: 0,
        cashOut: 0,
        netCash: 0,
        inboundTransfers: 0,
        outboundTransfers: 0,
      };

      const amount = Math.abs(Number(tx.amount ?? 0));

      if (tx.direction === 'INCOME') {
        cashIn += amount;
        row.cashIn += amount;
      } else if (tx.direction === 'EXPENSE') {
        cashOut += amount;
        row.cashOut += amount;
      }

      row.netCash = row.cashIn - row.cashOut;
      trendMap.set(date, row);
    }

    for (const ft of transfers) {
      const date = dayKey(ft.occurredAt);
      const row = trendMap.get(date) ?? {
        date,
        cashIn: 0,
        cashOut: 0,
        netCash: 0,
        inboundTransfers: 0,
        outboundTransfers: 0,
      };

      const amount = Math.abs(Number(ft.amount ?? 0));
      inboundTransfers += amount;
      outboundTransfers += amount;
      row.inboundTransfers += amount;
      row.outboundTransfers += amount;
      trendMap.set(date, row);
    }

    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      ok: true,
      domain: 'reports',
      action: 'cashflow',
      filters: {
        range: range ?? 'thisMonth',
        label: resolved.label,
        start: resolved.start.toISOString(),
        end: resolved.end.toISOString(),
      },
      summary: {
        cashIn,
        cashOut,
        netCash: cashIn - cashOut,
        inboundTransfers,
        outboundTransfers,
      },
      breakdown: [
        { key: 'income', label: '収入', amount: cashIn },
        { key: 'expense', label: '支出', amount: cashOut },
        { key: 'transfer-in', label: '振替入金', amount: inboundTransfers },
        { key: 'transfer-out', label: '振替出金', amount: outboundTransfers },
      ],
      trend,
      message: 'cashflow report loaded',
    };
  }
  async getDetailReport(
    kind?: DetailKind,
    metric?: string,
    range?: ReportRange,
    storeId?: string,
  ) {
    const companyId = await this.resolveCompanyId();
    const resolvedKind = normalizeDetailKind(kind);
    const resolvedMetric = normalizeDetailMetric(metric);
    const resolvedRange = resolveRange(range);

    const transactions = await this.prisma.transaction.findMany({
      where: this.buildTransactionWhere(companyId, range, storeId),
      select: {
        id: true,
        occurredAt: true,
        amount: true,
        direction: true,
        type: true,
        storeId: true,
        accountId: true,
        memo: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    const transfers = await this.prisma.fundTransfer.findMany({
      where: this.buildTransferWhere(companyId, range, storeId),
      select: {
        id: true,
        occurredAt: true,
        amount: true,
        fromAccountId: true,
        toAccountId: true,
        memo: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    const incomeRows = transactions.filter(
      (row) => normalizeDirection(row.direction) === 'INCOME',
    );
    const expenseRows = transactions.filter(
      (row) => normalizeDirection(row.direction) === 'EXPENSE',
    );

    let summaryLabel = 'Detail';
    let summaryValue = '-';
    let rows: Array<{
      key: string;
      values: Record<string, string>;
    }> = [];

    if (resolvedKind === 'cashflow') {
      const totalIn = incomeRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const totalOut = expenseRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const totalTransfers = transfers.reduce((sum, row) => sum + safeAbs(row.amount), 0);

      if (resolvedMetric === 'cashIn') {
        summaryLabel = '入金';
        summaryValue = fmtJPY(totalIn);
        rows = incomeRows.map((row) =>
          buildDetailRow(row.id, {
            date: dayKey(row.occurredAt),
            type: String(row.type ?? ''),
            amount: fmtJPY(safeAbs(row.amount)),
            note: String(row.memo ?? ''),
          }),
        );
      } else if (resolvedMetric === 'cashOut') {
        summaryLabel = '出金';
        summaryValue = fmtJPY(totalOut);
        rows = expenseRows.map((row) =>
          buildDetailRow(row.id, {
            date: dayKey(row.occurredAt),
            type: String(row.type ?? ''),
            amount: fmtJPY(safeAbs(row.amount)),
            note: String(row.memo ?? ''),
          }),
        );
      } else if (
        resolvedMetric === 'transfers' ||
        resolvedMetric === 'inboundTransfers' ||
        resolvedMetric === 'outboundTransfers'
      ) {
        summaryLabel = '振替';
        summaryValue = fmtJPY(totalTransfers);
        rows = transfers.map((row) =>
          buildDetailRow(row.id, {
            date: dayKey(row.occurredAt),
            type: 'transfer',
            amount: fmtJPY(safeAbs(row.amount)),
            note: String(row.memo ?? ''),
          }),
        );
      } else {
        summaryLabel = '純キャッシュ';
        summaryValue = fmtJPY(totalIn - totalOut);
        rows = [
          buildDetailRow('cash-in', {
            date: '-',
            type: 'cashIn',
            amount: fmtJPY(totalIn),
            note: 'sum(INCOME)',
          }),
          buildDetailRow('cash-out', {
            date: '-',
            type: 'cashOut',
            amount: fmtJPY(totalOut),
            note: 'sum(EXPENSE)',
          }),
          buildDetailRow('net-cash', {
            date: '-',
            type: 'netCash',
            amount: fmtJPY(totalIn - totalOut),
            note: 'cashIn - cashOut',
          }),
        ];
      }
    }

    if (resolvedKind === 'income') {
      const totalIncome = incomeRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const rowsCount = incomeRows.length;
      const activeDays = new Set(incomeRows.map((row) => dayKey(row.occurredAt))).size;

      if (resolvedMetric === 'rowsCount') {
        summaryLabel = '件数';
        summaryValue = String(rowsCount);
      } else if (resolvedMetric === 'averagePerRow') {
        summaryLabel = '平均金額';
        summaryValue = fmtJPY(rowsCount > 0 ? totalIncome / rowsCount : 0);
      } else if (resolvedMetric === 'activeDays') {
        summaryLabel = '稼働日数';
        summaryValue = String(activeDays);
      } else {
        summaryLabel = '総収入';
        summaryValue = fmtJPY(totalIncome);
      }

      rows = incomeRows.map((row) =>
        buildDetailRow(row.id, {
          date: dayKey(row.occurredAt),
          type: String(row.type ?? ''),
          amount: fmtJPY(safeAbs(row.amount)),
          note: String(row.memo ?? ''),
        }),
      );
    }

    if (resolvedKind === 'expense') {
      const totalExpense = expenseRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const rowsCount = expenseRows.length;
      const activeDays = new Set(expenseRows.map((row) => dayKey(row.occurredAt))).size;

      if (resolvedMetric === 'rowsCount') {
        summaryLabel = '件数';
        summaryValue = String(rowsCount);
      } else if (resolvedMetric === 'averagePerRow') {
        summaryLabel = '平均金額';
        summaryValue = fmtJPY(rowsCount > 0 ? totalExpense / rowsCount : 0);
      } else if (resolvedMetric === 'activeDays') {
        summaryLabel = '稼働日数';
        summaryValue = String(activeDays);
      } else {
        summaryLabel = '総支出';
        summaryValue = fmtJPY(totalExpense);
      }

      rows = expenseRows.map((row) =>
        buildDetailRow(row.id, {
          date: dayKey(row.occurredAt),
          type: String(row.type ?? ''),
          amount: fmtJPY(safeAbs(row.amount)),
          note: String(row.memo ?? ''),
        }),
      );
    }

    if (resolvedKind === 'profit') {
      const totalIncome = incomeRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const totalExpense = expenseRows.reduce((sum, row) => sum + safeAbs(row.amount), 0);
      const grossProfit = totalIncome - totalExpense;
      const marginPct =
        totalIncome > 0 ? Number(((grossProfit / totalIncome) * 100).toFixed(1)) : 0;

      if (resolvedMetric === 'marginPct') {
        summaryLabel = '利益率';
        summaryValue = `${marginPct.toFixed(1)}%`;
      } else if (resolvedMetric === 'totalIncome') {
        summaryLabel = '総収入';
        summaryValue = fmtJPY(totalIncome);
      } else if (resolvedMetric === 'totalExpense') {
        summaryLabel = '総支出';
        summaryValue = fmtJPY(totalExpense);
      } else {
        summaryLabel = '粗利';
        summaryValue = fmtJPY(grossProfit);
      }

      rows = [
        buildDetailRow('profit-income', {
          date: '-',
          type: 'income',
          amount: fmtJPY(totalIncome),
          note: 'sum(INCOME)',
        }),
        buildDetailRow('profit-expense', {
          date: '-',
          type: 'expense',
          amount: fmtJPY(totalExpense),
          note: 'sum(EXPENSE)',
        }),
        buildDetailRow('profit-gross', {
          date: '-',
          type: 'grossProfit',
          amount: fmtJPY(grossProfit),
          note: 'income - expense',
        }),
        buildDetailRow('profit-margin', {
          date: '-',
          type: 'marginPct',
          amount: `${marginPct.toFixed(1)}%`,
          note: 'grossProfit / income',
        }),
      ];
    }

    return {
      ok: true,
      domain: 'reports',
      action: 'detail',
      filters: {
        kind: resolvedKind,
        metric: resolvedMetric,
        range: range ?? 'thisMonth',
        label: resolvedRange.label,
        start: resolvedRange.start.toISOString(),
        end: resolvedRange.end.toISOString(),
        storeId: storeId ?? 'all',
      },
      summary: {
        label: summaryLabel,
        value: summaryValue,
      },
      columns: [
        { key: 'date', label: 'Date', align: 'left' },
        { key: 'type', label: 'Type', align: 'left' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'note', label: 'Note', align: 'left' },
      ],
      rows,
      message: 'detail report loaded',
    };
  }

}
