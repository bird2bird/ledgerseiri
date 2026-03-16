import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Direction = 'INCOME' | 'EXPENSE' | 'TRANSFER';

type CreateCategoryPayload = {
  companyId?: string;
  name?: string;
  direction?: Direction;
  code?: string;
};

type CreateTransactionPayload = {
  companyId?: string;
  storeId?: string;
  accountId?: string | null;
  categoryId?: string | null;
  type?: 'SALE' | 'FBA_FEE' | 'AD' | 'REFUND' | 'OTHER';
  direction?: Direction;
  amount?: number | string;
  currency?: string;
  occurredAt?: string;
  memo?: string;
  externalRef?: string;
};

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId(inputCompanyId?: string) {
    if (inputCompanyId) return inputCompanyId;

    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }

    return company.id;
  }

  private async resolveDefaultStoreId(companyId: string, storeId?: string) {
    if (storeId) return storeId;

    const store = await this.prisma.store.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!store) {
      throw new Error('No store found. Please create a store first.');
    }

    return store.id;
  }

  async listCategories(direction?: Direction) {
    const companyId = await this.resolveCompanyId();

    const items = await this.prisma.transactionCategory.findMany({
      where: {
        companyId,
        ...(direction ? { direction } : {}),
      },
      orderBy: [{ direction: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      ok: true,
      domain: 'transaction-categories',
      action: 'list',
      items,
      message: 'transaction categories loaded',
    };
  }

  async createCategory(payload: CreateCategoryPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    if (!payload?.name || !String(payload.name).trim()) {
      throw new Error('Category name is required.');
    }

    const direction = payload.direction ?? 'EXPENSE';

    const item = await this.prisma.transactionCategory.create({
      data: {
        companyId,
        name: String(payload.name).trim(),
        direction,
        code: payload.code ? String(payload.code).trim() : null,
        isSystem: false,
      },
    });

    return {
      ok: true,
      domain: 'transaction-categories',
      action: 'create',
      item,
      message: 'transaction category created',
    };
  }

  async seedDefaultCategories() {
    const companyId = await this.resolveCompanyId();

    const defaults: Array<{ name: string; direction: Direction; code: string }> = [
      { name: '売上', direction: 'INCOME', code: 'sales' },
      { name: 'その他収入', direction: 'INCOME', code: 'other-income' },
      { name: '広告費', direction: 'EXPENSE', code: 'ads' },
      { name: '運営費', direction: 'EXPENSE', code: 'ops' },
      { name: 'その他支出', direction: 'EXPENSE', code: 'other-expense' },
    ];

    for (const d of defaults) {
      const found = await this.prisma.transactionCategory.findFirst({
        where: {
          companyId,
          direction: d.direction,
          name: d.name,
        },
        select: { id: true },
      });

      if (!found) {
        await this.prisma.transactionCategory.create({
          data: {
            companyId,
            name: d.name,
            direction: d.direction,
            code: d.code,
            isSystem: true,
          },
        });
      }
    }

    return this.listCategories();
  }

  async list(direction?: Direction) {
    const companyId = await this.resolveCompanyId();

    const items = await this.prisma.transaction.findMany({
      where: {
        companyId,
        ...(direction ? { direction } : {}),
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: {
          select: { id: true, name: true, direction: true },
        },
        account: {
          select: { id: true, name: true },
        },
        store: {
          select: { id: true, name: true },
        },
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
        sourceType: t.sourceType,
        amount: t.amount,
        currency: t.currency,
        occurredAt: t.occurredAt,
        externalRef: t.externalRef,
        memo: t.memo,
        createdAt: t.createdAt,
      })),
      message: 'transactions list loaded',
    };
  }

  async create(payload: CreateTransactionPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);
    const storeId = await this.resolveDefaultStoreId(companyId, payload?.storeId);

    const amount = Number(payload.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount must be greater than 0.');
    }

    const direction = payload.direction ?? 'EXPENSE';
    const type = payload.type ?? 'OTHER';

    const item = await this.prisma.transaction.create({
      data: {
        companyId,
        storeId,
        accountId: payload.accountId || null,
        categoryId: payload.categoryId || null,
        type,
        direction,
        sourceType: 'MANUAL',
        amount: Math.round(amount),
        currency: String(payload.currency || 'JPY').trim() || 'JPY',
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        externalRef: payload.externalRef ? String(payload.externalRef) : null,
        memo: payload.memo ? String(payload.memo) : null,
      },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'transactions',
      action: 'create',
      item: {
        id: item.id,
        companyId: item.companyId,
        storeId: item.storeId,
        storeName: item.store?.name ?? null,
        accountId: item.accountId,
        accountName: item.account?.name ?? null,
        categoryId: item.categoryId,
        categoryName: item.category?.name ?? null,
        type: item.type,
        direction: item.direction,
        amount: item.amount,
        currency: item.currency,
        occurredAt: item.occurredAt,
        memo: item.memo,
      },
      message: 'transaction created',
    };
  }

  async update(
    id: string,
    input: {
      amount?: number | string | null;
      memo?: string | null;
    },
  ) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        store: true,
      },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    const nextAmountRaw = input?.amount;
    const hasAmount =
      nextAmountRaw !== undefined &&
      nextAmountRaw !== null &&
      String(nextAmountRaw).trim() !== '';

    const parsedAmount = hasAmount ? Number(nextAmountRaw) : Number(existing.amount ?? 0);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error('amount must be a positive number');
    }

    const normalizedAmount =
      existing.direction === 'EXPENSE'
        ? -Math.abs(parsedAmount)
        : Math.abs(parsedAmount);

    const nextMemo =
      input?.memo === undefined
        ? existing.memo
        : input.memo === null
          ? null
          : String(input.memo);

    const item = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: normalizedAmount,
        memo: nextMemo,
      },
      include: {
        account: true,
        category: true,
        store: true,
      },
    });

    return {
      ok: true,
      item: {
        id: item.id,
        companyId: item.companyId ?? null,
        storeId: item.storeId,
        storeName: item.store?.name ?? null,
        accountId: item.accountId ?? null,
        accountName: item.account?.name ?? null,
        categoryId: item.categoryId ?? null,
        categoryName: item.category?.name ?? null,
        type: item.type,
        direction: item.direction ?? null,
        sourceType: item.sourceType,
        amount: Number(item.amount ?? 0),
        currency: item.currency,
        occurredAt: item.occurredAt instanceof Date ? item.occurredAt.toISOString() : String(item.occurredAt),
        externalRef: item.externalRef ?? null,
        memo: item.memo ?? null,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
      },
      message: 'updated',
    };
  }

}
