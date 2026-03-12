import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async loadTransactions(txWhere: any) {
    return this.prisma.transaction.findMany({
      where: txWhere,
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        type: true,
        direction: true,
        amount: true,
        occurredAt: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
    });
  }

  async loadRecentTransactions(txWhere: any) {
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

  async loadAccounts(companyId: string, normalizedStoreId?: string | null) {
    return this.prisma.account.findMany({
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
    });
  }

  async countIssuedInvoices(invoiceWhere: any) {
    return this.prisma.invoice.count({
      where: invoiceWhere,
    });
  }

  async loadUnpaidInvoices(companyId: string, normalizedStoreId?: string | null) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        ...(normalizedStoreId ? { storeId: normalizedStoreId } : {}),
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
      },
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

  async loadInventoryBalancesSafe(companyId: string) {
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
      const msg = String(e?.message || '');
      if (
        e?.code === 'P2021' ||
        msg.includes('InventoryBalance') ||
        msg.includes('relation') ||
        msg.includes('does not exist')
      ) {
        return [];
      }
      throw e;
    }
  }
}
