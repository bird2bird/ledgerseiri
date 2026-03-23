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
  companyId?: string;
  name?: string;
  type?: string;
  currency?: string;
};

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId(inputCompanyId?: string) {
    const companyId = String(inputCompanyId ?? '').trim();
    if (!companyId) {
      throw new Error('COMPANY_CONTEXT_REQUIRED');
    }
    return companyId;
  }

  async list(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const items = await this.prisma.account.findMany({
      where: { companyId: resolvedCompanyId },
      orderBy: [{ createdAt: 'asc' }],
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'list',
      items,
      message: 'accounts list loaded',
    };
  }

  async listBalances(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const accounts = await this.prisma.account.findMany({
      where: { companyId: resolvedCompanyId },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'balances',
      items: accounts,
    };
  }

  async create(payload: CreateAccountPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    const created = await this.prisma.account.create({
      data: {
        companyId,
        name: payload.name ?? 'Unnamed',
        type: (payload.type as AccountType) ?? AccountType.BANK,
        currency: payload.currency ?? 'JPY',
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'create',
      item: created,
    };
  }

  async update(id: string, payload: UpdateAccountPayload) {
    const existing = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Account not found.');
    }

    const companyId = await this.resolveCompanyId(payload?.companyId);

    if (existing.companyId !== companyId) {
      throw new Error('Account not found.');
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        type: (payload.type as AccountType) ?? existing.type,
        currency: payload.currency ?? existing.currency,
      },
    });

    return {
      ok: true,
      domain: 'accounts',
      action: 'update',
      item: updated,
    };
  }
}
