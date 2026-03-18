import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type ReportRange = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

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

function dayKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

@Injectable()
export class ReportsService {
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
}
