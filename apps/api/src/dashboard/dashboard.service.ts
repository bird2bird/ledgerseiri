import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { DashboardAccountBalanceRow, DashboardDailyBucketRow, DashboardExpenseBreakdownRow, DashboardInventorySummaryRow, DashboardInvoiceWhere, DashboardRecentTransactionRow, DashboardSummaryTotalsRow, DashboardTxWhere, DashboardUnpaidSummaryRow } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async loadRecentTransactions(txWhere: DashboardTxWhere): Promise<DashboardRecentTransactionRow[]> {
    return this.prisma.transaction.findMany({
      where: txWhere,
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: 8,
      include: {
        store: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  async countIssuedInvoices(invoiceWhere: DashboardInvoiceWhere): Promise<number> {
    return this.prisma.invoice.count({
      where: invoiceWhere,
    });
  }

  async countHistoryInvoices(companyId: string, normalizedStoreId?: string | null) {
    return this.prisma.invoice.count({
      where: {
        companyId,
        paidAmount: { gt: 0 },
        ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
      },
    });
  }

  async loadUnpaidSummary(companyId: string, normalizedStoreId?: string | null): Promise<DashboardUnpaidSummaryRow> {
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const unpaidAmount = rows.reduce(
      (sum, x) => sum + (Number(x.totalAmount ?? 0) - Number(x.paidAmount ?? 0)),
      0,
    );

    return {
      unpaidAmount,
      unpaidCount: rows.length,
    };
  }

  async loadAccountBalanceRows(companyId: string, normalizedStoreId?: string | null): Promise<DashboardAccountBalanceRow[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        companyId,
        ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
      },
      orderBy: [{ createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        openingBalance: true,
      },
    });

    const accountIds = accounts.map((a) => a.id);
    if (!accountIds.length) {
      return [];
    }

    const [incomeAgg, expenseAgg, transferInAgg, transferOutAgg] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['accountId'],
        where: {
          companyId,
          accountId: { in: accountIds },
          direction: 'INCOME',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.transaction.groupBy({
        by: ['accountId'],
        where: {
          companyId,
          accountId: { in: accountIds },
          direction: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.fundTransfer.groupBy({
        by: ['toAccountId'],
        where: {
          companyId,
          toAccountId: { in: accountIds },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.fundTransfer.groupBy({
        by: ['fromAccountId'],
        where: {
          companyId,
          fromAccountId: { in: accountIds },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const incomeMap = new Map(
      incomeAgg
        .filter((x) => x.accountId)
        .map((x) => [x.accountId as string, Number(x._sum.amount ?? 0)])
    );

    const expenseMap = new Map(
      expenseAgg
        .filter((x) => x.accountId)
        .map((x) => [x.accountId as string, Number(x._sum.amount ?? 0)])
    );

    const transferInMap = new Map(
      transferInAgg
        .filter((x) => x.toAccountId)
        .map((x) => [x.toAccountId as string, Number(x._sum.amount ?? 0)])
    );

    const transferOutMap = new Map(
      transferOutAgg
        .filter((x) => x.fromAccountId)
        .map((x) => [x.fromAccountId as string, Number(x._sum.amount ?? 0)])
    );

    return accounts.map((a) => {
      const income = incomeMap.get(a.id) ?? 0;
      const expense = expenseMap.get(a.id) ?? 0;
      const transferIn = transferInMap.get(a.id) ?? 0;
      const transferOut = transferOutMap.get(a.id) ?? 0;

      return {
        id: a.id,
        name: a.name,
        type: a.type,
        balance:
          Number(a.openingBalance ?? 0) +
          income -
          expense +
          transferIn -
          transferOut,
      };
    });
  }

  async loadSummaryTotals(txWhere: DashboardTxWhere): Promise<DashboardSummaryTotalsRow> {
    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          ...txWhere,
          direction: 'INCOME',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...txWhere,
          direction: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const revenue = Number(incomeAgg._sum.amount ?? 0);
    const expense = Number(expenseAgg._sum.amount ?? 0);
    return {
      revenue,
      expense,
      profit: revenue - expense,
    };
  }

  async loadExpenseBreakdown(txWhere: DashboardTxWhere): Promise<DashboardExpenseBreakdownRow[]> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: {
        ...txWhere,
        direction: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    const categoryIds = Array.from(
      new Set(rows.map((x) => x.categoryId).filter((x): x is string => Boolean(x)))
    );

    const categories = categoryIds.length
      ? await this.prisma.transactionCategory.findMany({
          where: {
            id: { in: categoryIds },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const categoryMap = new Map(categories.map((x) => [x.id, x.name]));

    return rows.map((x) => ({
      label: x.categoryId ? (categoryMap.get(x.categoryId) ?? x.type ?? 'OTHER') : (x.type ?? 'OTHER'),
      amount: Number(x._sum.amount ?? 0),
    }));
  }

  async loadDailyBuckets(txWhere: DashboardTxWhere): Promise<DashboardDailyBucketRow[]> {
    const rows = await this.prisma.transaction.findMany({
      where: txWhere,
      select: {
        occurredAt: true,
        direction: true,
        amount: true,
      },
      orderBy: [{ occurredAt: 'asc' }],
    });

    return rows.map((x) => ({
      occurredAt: x.occurredAt,
      direction: x.direction,
      amount: Number(x.amount ?? 0),
    }));
  }

  async loadInventorySummary(companyId: string): Promise<DashboardInventorySummaryRow> {
    try {
      const rows = await this.prisma.inventoryBalance.findMany({
        where: { companyId },
        select: {
          quantity: true,
          alertLevel: true,
          sku: {
            select: {
              costAmount: true,
            },
          },
        },
      });

      const inventoryValue = rows.reduce((sum, x) => {
        const qty = Number(x.quantity ?? 0);
        const cost = Number(x.sku?.costAmount ?? 0);
        return sum + qty * cost;
      }, 0);

      const inventoryAlertCount = rows.filter((x) => {
        return Number(x.quantity ?? 0) <= Number(x.alertLevel ?? 0);
      }).length;

      return {
        inventoryValue,
        inventoryAlertCount,
      };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (
        e?.code === 'P2021' ||
        msg.includes('InventoryBalance') ||
        msg.includes('relation') ||
        msg.includes('does not exist')
      ) {
        return {
          inventoryValue: 0,
          inventoryAlertCount: 0,
        };
      }
      throw e;
    }
  }

}
