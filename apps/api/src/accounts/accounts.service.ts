import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccountType } from '@prisma/client';

type CreateAccountPayload = {
  companyId?: string;
  name?: string;
  type?: string;
  currency?: string;
};

type UpdateAccountPayload = {
  name?: string;
  type?: string;
  currency?: string;
};

const ACCOUNT_TYPE_VALUES: AccountType[] = [
  AccountType.BANK,
  AccountType.CASH,
  AccountType.EWALLET,
  AccountType.PAYMENT_GATEWAY,
  AccountType.OTHER,
];

function normalizeAccountType(input?: string): AccountType {
  const raw = String(input ?? '').trim().toUpperCase();
  const found = ACCOUNT_TYPE_VALUES.find((v) => v === raw);
  return found ?? AccountType.BANK;
}

@Injectable()
export class AccountsService {
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

  async list() {
    const companyId = await this.resolveCompanyId();

    const items = await this.prisma.account.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'asc' }],
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'list',
      items: items.map((a) => ({
        id: a.id,
        companyId: a.companyId,
        name: a.name,
        type: a.type,
        currency: a.currency,
        storeId: a.storeId ?? null,
        openingBalance: Number(a.openingBalance ?? 0),
        isActive: Boolean(a.isActive),
        createdAt:
          a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
        updatedAt:
          a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
      })),
      message: 'accounts list loaded',
    };
  }


  async listBalances() {
    const companyId = await this.resolveCompanyId();

    const [accounts, transactions, fundTransfers] = await Promise.all([
      this.prisma.account.findMany({
        where: { companyId },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.transaction.findMany({
        where: {
          companyId,
          accountId: { not: null },
        },
        select: {
          accountId: true,
          direction: true,
          amount: true,
        },
      }),
      this.prisma.fundTransfer.findMany({
        where: { companyId },
        select: {
          fromAccountId: true,
          toAccountId: true,
          amount: true,
        },
      }),
    ]);

    const txAgg = new Map<
      string,
      { incomeTotal: number; expenseTotal: number }
    >();

    for (const tx of transactions) {
      const accountId = tx.accountId;
      if (!accountId) continue;

      const prev = txAgg.get(accountId) ?? {
        incomeTotal: 0,
        expenseTotal: 0,
      };

      const amount = Number(tx.amount ?? 0);

      if (tx.direction === 'INCOME') {
        prev.incomeTotal += Math.abs(amount);
      } else if (tx.direction === 'EXPENSE') {
        prev.expenseTotal += Math.abs(amount);
      }

      txAgg.set(accountId, prev);
    }

    const transferAgg = new Map<
      string,
      { inboundTransferTotal: number; outboundTransferTotal: number }
    >();

    for (const ft of fundTransfers) {
      const amount = Math.abs(Number(ft.amount ?? 0));

      if (ft.toAccountId) {
        const prevTo = transferAgg.get(ft.toAccountId) ?? {
          inboundTransferTotal: 0,
          outboundTransferTotal: 0,
        };
        prevTo.inboundTransferTotal += amount;
        transferAgg.set(ft.toAccountId, prevTo);
      }

      if (ft.fromAccountId) {
        const prevFrom = transferAgg.get(ft.fromAccountId) ?? {
          inboundTransferTotal: 0,
          outboundTransferTotal: 0,
        };
        prevFrom.outboundTransferTotal += amount;
        transferAgg.set(ft.fromAccountId, prevFrom);
      }
    }

    return {
      ok: true,
      domain: 'account-balances',
      action: 'list',
      items: accounts.map((a) => {
        const openingBalance = Number(a.openingBalance ?? 0);
        const tx = txAgg.get(a.id) ?? {
          incomeTotal: 0,
          expenseTotal: 0,
        };
        const tf = transferAgg.get(a.id) ?? {
          inboundTransferTotal: 0,
          outboundTransferTotal: 0,
        };

        const currentBalance =
          openingBalance +
          tx.incomeTotal -
          tx.expenseTotal +
          tf.inboundTransferTotal -
          tf.outboundTransferTotal;

        return {
          id: a.id,
          companyId: a.companyId,
          name: a.name,
          type: a.type,
          currency: a.currency,
          storeId: a.storeId ?? null,
          openingBalance,
          incomeTotal: tx.incomeTotal,
          expenseTotal: tx.expenseTotal,
          inboundTransferTotal: tf.inboundTransferTotal,
          outboundTransferTotal: tf.outboundTransferTotal,
          currentBalance,
          isActive: Boolean(a.isActive),
          createdAt:
            a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
          updatedAt:
            a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
        };
      }),
      message: 'account balances loaded',
    };
  }

  async create(payload: CreateAccountPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    const name = String(payload?.name ?? '').trim();
    if (!name) {
      throw new Error('Account name is required.');
    }

    const item = await this.prisma.account.create({
      data: {
        companyId,
        name,
        type: normalizeAccountType(payload?.type),
        currency: String(payload?.currency ?? 'JPY').trim() || 'JPY',
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'create',
      item: {
        id: item.id,
        companyId: item.companyId,
        name: item.name,
        type: item.type,
        currency: item.currency,
        storeId: item.storeId ?? null,
        openingBalance: Number(item.openingBalance ?? 0),
        isActive: Boolean(item.isActive),
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : String(item.createdAt),
        updatedAt:
          item.updatedAt instanceof Date
            ? item.updatedAt.toISOString()
            : String(item.updatedAt),
      },
      message: 'account created',
    };
  }

  async update(id: string, payload: UpdateAccountPayload) {
    const existing = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Account not found.');
    }

    const nextName =
      payload?.name === undefined ? existing.name : String(payload.name).trim();
    if (!nextName) {
      throw new Error('Account name is required.');
    }

    const nextType =
      payload?.type === undefined
        ? existing.type
        : normalizeAccountType(payload.type);

    const nextCurrency =
      payload?.currency === undefined
        ? existing.currency
        : String(payload.currency).trim() || existing.currency;

    const item = await this.prisma.account.update({
      where: { id },
      data: {
        name: nextName,
        type: nextType,
        currency: nextCurrency,
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'update',
      item: {
        id: item.id,
        companyId: item.companyId,
        name: item.name,
        type: item.type,
        currency: item.currency,
        storeId: item.storeId ?? null,
        openingBalance: Number(item.openingBalance ?? 0),
        isActive: Boolean(item.isActive),
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : String(item.createdAt),
        updatedAt:
          item.updatedAt instanceof Date
            ? item.updatedAt.toISOString()
            : String(item.updatedAt),
      },
      message: 'account updated',
    };
  }
}
