import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreateAccountPayload = {
  companyId?: string;
  storeId?: string | null;
  name?: string;
  type?: 'BANK' | 'CASH' | 'EWALLET' | 'PAYMENT_GATEWAY' | 'OTHER';
  currency?: string;
  openingBalance?: number | string;
};

@Injectable()
export class AccountService {
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
    const accounts = await this.prisma.account.findMany({
      orderBy: [{ createdAt: 'asc' }],
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'list',
      items: accounts.map((a) => ({
        id: a.id,
        companyId: a.companyId,
        storeId: a.storeId,
        storeName: a.store?.name ?? null,
        name: a.name,
        type: a.type,
        currency: a.currency,
        openingBalance: a.openingBalance,
        isActive: a.isActive,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      message: 'accounts list loaded',
    };
  }

  async getMeta() {
    const count = await this.prisma.account.count();

    return {
      ok: true,
      domain: 'accounts',
      status: 'live-minimal',
      count,
      message: 'accounts service is connected',
    };
  }

  async create(payload: CreateAccountPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    if (!payload?.name || !String(payload.name).trim()) {
      throw new Error('Account name is required.');
    }

    const type = payload.type ?? 'BANK';
    const openingBalance = Number(payload.openingBalance ?? 0);

    const account = await this.prisma.account.create({
      data: {
        companyId,
        storeId: payload.storeId || null,
        name: String(payload.name).trim(),
        type,
        currency: String(payload.currency || 'JPY').trim() || 'JPY',
        openingBalance: Number.isFinite(openingBalance) ? Math.round(openingBalance) : 0,
        isActive: true,
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'create',
      item: account,
      message: 'account created',
    };
  }

  async balances() {
    const accounts = await this.prisma.account.findMany({
      orderBy: [{ createdAt: 'asc' }],
      include: {
        store: { select: { name: true } },
        transfersOut: {
          select: { amount: true },
        },
        transfersIn: {
          select: { amount: true },
        },
      },
    });

    const items = accounts.map((a) => {
      const income = 0;
      const expense = 0;

      const transferOut = a.transfersOut.reduce((sum, t) => sum + t.amount, 0);
      const transferIn = a.transfersIn.reduce((sum, t) => sum + t.amount, 0);
      const currentBalance =
        a.openingBalance + income - expense - transferOut + transferIn;

      return {
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        storeName: a.store?.name ?? null,
        openingBalance: a.openingBalance,
        income,
        expense,
        transferOut,
        transferIn,
        currentBalance,
        isActive: a.isActive,
      };
    });

    const totalBalance = items.reduce((sum, i) => sum + i.currentBalance, 0);

    return {
      ok: true,
      domain: 'account-balances',
      action: 'list',
      summary: {
        accountCount: items.length,
        totalBalance,
        currency: 'JPY',
      },
      items,
      message: 'account balances loaded',
    };
  }
}
