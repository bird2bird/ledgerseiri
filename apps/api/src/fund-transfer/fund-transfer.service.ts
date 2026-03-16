import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreateFundTransferPayload = {
  companyId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number | string;
  currency?: string;
  occurredAt?: string;
  memo?: string;
};

@Injectable()
export class FundTransferService {
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
    const items = await this.prisma.fundTransfer.findMany({
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });

    return {
      ok: true,
      domain: 'fund-transfer',
      action: 'list',
      items: items.map((t) => ({
        id: t.id,
        companyId: t.companyId,
        fromAccountId: t.fromAccountId,
        fromAccountName: t.fromAccount.name,
        toAccountId: t.toAccountId,
        toAccountName: t.toAccount.name,
        amount: t.amount,
        currency: t.currency,
        occurredAt: t.occurredAt,
        memo: t.memo,
        createdAt: t.createdAt,
      })),
      message: 'fund-transfer list loaded',
    };
  }

  async getMeta() {
    const count = await this.prisma.fundTransfer.count();

    return {
      ok: true,
      domain: 'fund-transfer',
      status: 'live-minimal',
      count,
      message: 'fund-transfer service is connected',
    };
  }

  async create(payload: CreateFundTransferPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    if (!payload?.fromAccountId || !payload?.toAccountId) {
      throw new Error('fromAccountId and toAccountId are required.');
    }

    if (payload.fromAccountId === payload.toAccountId) {
      throw new Error('fromAccountId and toAccountId must be different.');
    }

    const amount = Number(payload.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount must be greater than 0.');
    }

    const transfer = await this.prisma.fundTransfer.create({
      data: {
        companyId,
        fromAccountId: payload.fromAccountId,
        toAccountId: payload.toAccountId,
        amount: Math.round(amount),
        currency: String(payload.currency || 'JPY').trim() || 'JPY',
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        memo: payload.memo ? String(payload.memo) : null,
      },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });

    return {
      ok: true,
      domain: 'fund-transfer',
      action: 'create',
      item: {
        id: transfer.id,
        fromAccountId: transfer.fromAccountId,
        fromAccountName: transfer.fromAccount.name,
        toAccountId: transfer.toAccountId,
        toAccountName: transfer.toAccount.name,
        amount: transfer.amount,
        currency: transfer.currency,
        occurredAt: transfer.occurredAt,
        memo: transfer.memo,
      },
      message: 'fund transfer created',
    };
  }

  async update(
    id: string,
    input: {
      amount?: number | string | null;
      memo?: string | null;
    },
  ) {
    const existing = await this.prisma.fundTransfer.findUnique({
      where: { id },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      throw new Error('FundTransfer not found');
    }

    const nextAmountRaw = input?.amount;
    const hasAmount =
      nextAmountRaw !== undefined &&
      nextAmountRaw !== null &&
      String(nextAmountRaw).trim() !== '';

    const parsedAmount = hasAmount ? Number(nextAmountRaw) : Number(existing.amount ?? 0);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error('amount must be greater than 0.');
    }

    const nextMemo =
      input?.memo === undefined
        ? existing.memo
        : input.memo === null
          ? null
          : String(input.memo);

    const transfer = await this.prisma.fundTransfer.update({
      where: { id },
      data: {
        amount: Math.round(Math.abs(parsedAmount)),
        memo: nextMemo,
      },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });

    return {
      ok: true,
      domain: 'fund-transfer',
      action: 'update',
      item: {
        id: transfer.id,
        companyId: transfer.companyId,
        fromAccountId: transfer.fromAccountId,
        fromAccountName: transfer.fromAccount.name,
        toAccountId: transfer.toAccountId,
        toAccountName: transfer.toAccount.name,
        amount: transfer.amount,
        currency: transfer.currency,
        occurredAt: transfer.occurredAt,
        memo: transfer.memo,
        createdAt: transfer.createdAt,
      },
      message: 'fund transfer updated',
    };
  }

}
