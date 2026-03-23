import { TransactionType } from "@prisma/client";
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Direction = 'INCOME' | 'EXPENSE' | 'TRANSFER';

type CreateTransactionPayload = {
  companyId?: string;
  storeId?: string;
  accountId?: string | null;
  categoryId?: string | null;
  type?: string;
  direction?: Direction;
  amount?: number | string;
  currency?: string;
  occurredAt?: string;
  memo?: string;
};

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId(inputCompanyId?: string) {
    const companyId = String(inputCompanyId ?? '').trim();
    if (!companyId) {
      throw new Error('COMPANY_CONTEXT_REQUIRED');
    }
    return companyId;
  }

  private async resolveDefaultStoreId(companyId: string, storeId?: string) {
    if (storeId) return storeId;

    const store = await this.prisma.store.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!store) {
      throw new Error('No store found.');
    }

    return store.id;
  }

  private async getMonthlyTransactionLimit(companyId: string): Promise<number> {
    const row = await this.prisma.workspaceSubscription.findUnique({
      where: { companyId },
      select: { planCode: true },
    });

    const plan = String(row?.planCode ?? 'STARTER').trim().toUpperCase();

    if (plan === 'PREMIUM') return Number.MAX_SAFE_INTEGER;
    if (plan === 'STANDARD') return 2000;
    return 100;
  }

  private getMonthRange(baseDate?: Date) {
    const now = baseDate ?? new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  }

  private async countTransactionsThisMonth(companyId: string, baseDate?: Date): Promise<number> {
    const { start, end } = this.getMonthRange(baseDate);

    return this.prisma.transaction.count({
      where: {
        companyId,
        occurredAt: {
          gte: start,
          lt: end,
        },
      },
    });
  }

  private async assertTransactionCreateAllowed(companyId: string, baseDate?: Date): Promise<void> {
    const [limit, used] = await Promise.all([
      this.getMonthlyTransactionLimit(companyId),
      this.countTransactionsThisMonth(companyId, baseDate),
    ]);

    if (used >= limit) {
      throw new Error('PLAN_LIMIT_REACHED');
    }
  }

  async list(companyId?: string, direction?: Direction) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const items = await this.prisma.transaction.findMany({
      where: {
        companyId: resolvedCompanyId,
        ...(direction ? { direction } : {}),
      },
      orderBy: [{ occurredAt: 'desc' }],
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'transactions',
      action: 'list',
      items: items.map((t) => ({
        id: t.id,
        companyId: t.companyId,
        storeId: t.storeId,
        storeName: t.store?.name ?? null,
        accountId: t.accountId,
        accountName: t.account?.name ?? null,
        categoryId: t.categoryId,
        categoryName: t.category?.name ?? null,
        type: t.type,
        direction: t.direction,
        amount: t.amount,
        currency: t.currency,
        occurredAt: t.occurredAt,
        memo: t.memo,
      })),
    };
  }

  async create(payload: CreateTransactionPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);
    const storeId = await this.resolveDefaultStoreId(companyId, payload?.storeId);

    const amount = Number(payload.amount ?? 0);
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const item = await this.prisma.transaction.create({
      data: {
        companyId,
        storeId,
        accountId: payload.accountId || null,
        categoryId: payload.categoryId || null,
        type: (payload.type as TransactionType) ?? TransactionType.OTHER,
        direction: payload.direction ?? 'EXPENSE',
        sourceType: 'MANUAL',
        amount,
        currency: payload.currency ?? 'JPY',
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        memo: payload.memo ?? null,
      },
    });

    return {
      ok: true,
      item,
    };
  }

  async update(id: string, payload: { companyId?: string; amount?: number }) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) throw new Error('Not found');

    const companyId = await this.resolveCompanyId(payload?.companyId);

    if (existing.companyId !== companyId) {
      throw new Error('Not found');
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: payload.amount ?? existing.amount,
      },
    });

    return {
      ok: true,
      item: updated,
    };
  }
}
