import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreatePaymentPayload = {
  companyId?: string;
  invoiceId?: string;
  accountId?: string | null;
  amount?: number | string;
  currency?: string;
  receivedAt?: string;
  memo?: string;
};

@Injectable()
export class PaymentService {
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

    const items = await this.prisma.paymentReceipt.findMany({
      where: { companyId: resolvedCompanyId },
      orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            customerName: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
        account: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      ok: true,
      domain: 'payments',
      action: 'list',
      items: items.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        invoiceId: p.invoiceId,
        invoiceNo: p.invoice?.invoiceNo ?? null,
        invoiceNumber: p.invoice?.invoiceNo ?? null,
        customerName: p.invoice?.customerName ?? null,
        invoiceStatus: p.invoice?.status ?? null,
        invoiceTotalAmount: p.invoice?.totalAmount ?? null,
        invoicePaidAmount: p.invoice?.paidAmount ?? null,
        accountId: p.accountId,
        accountName: p.account?.name ?? null,
        amount: p.amount,
        currency: p.currency,
        receivedAt: p.receivedAt,
        memo: p.memo,
        createdAt: p.createdAt,
      })),
      message: 'payments loaded',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'payments',
      message: 'payments meta loaded',
    };
  }

  async create(payload: CreatePaymentPayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);

    const invoiceId = String(payload?.invoiceId || '').trim();
    if (!invoiceId) {
      throw new Error('invoiceId is required.');
    }

    const amount = Math.round(Number(payload?.amount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount must be greater than 0.');
    }

    const receivedAt = payload?.receivedAt ? new Date(payload.receivedAt) : new Date();
    const currency = String(payload?.currency || 'JPY').trim() || 'JPY';
    const memo = payload?.memo ? String(payload.memo) : null;
    const accountId = payload?.accountId || null;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        companyId: true,
        storeId: true,
        invoiceNo: true,
        currency: true,
        totalAmount: true,
        paidAmount: true,
      },
    });

    if (!invoice) {
      throw new Error('invoice not found.');
    }

    if (invoice.companyId !== companyId) {
      throw new Error('invoice does not belong to current company.');
    }

    if (accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, companyId },
        select: { id: true },
      });
      if (!account) {
        throw new Error('account not found or not owned by current company.');
      }
    }

    const newPaid = Number(invoice.paidAmount ?? 0) + amount;

    let nextStatus: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' = 'ISSUED';
    if (newPaid <= 0) {
      nextStatus = 'ISSUED';
    } else if (newPaid < Number(invoice.totalAmount ?? 0)) {
      nextStatus = 'PARTIALLY_PAID';
    } else {
      nextStatus = 'PAID';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentReceipt.create({
        data: {
          companyId,
          invoiceId,
          accountId,
          amount,
          currency,
          receivedAt,
          memo,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              customerName: true,
              totalAmount: true,
              paidAmount: true,
              status: true,
            },
          },
          account: {
            select: { id: true, name: true },
          },
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          status: nextStatus,
        },
      });

      await tx.transaction.create({
        data: {
          companyId,
          storeId: invoice.storeId!,
          accountId,
          categoryId: null,
          type: 'SALE',
          direction: 'INCOME',
          sourceType: 'INVOICE_PAYMENT',
          amount,
          currency,
          occurredAt: receivedAt,
          externalRef: invoice.invoiceNo,
          memo: memo ?? `Invoice payment ${invoice.invoiceNo}`,
        },
      });

      return payment;
    });

    return {
      ok: true,
      domain: 'payments',
      action: 'create',
      item: {
        id: result.id,
        companyId: result.companyId,
        invoiceId: result.invoiceId,
        invoiceNo: result.invoice?.invoiceNo ?? null,
        invoiceNumber: result.invoice?.invoiceNo ?? null,
        customerName: result.invoice?.customerName ?? null,
        accountId: result.accountId,
        accountName: result.account?.name ?? null,
        amount: result.amount,
        currency: result.currency,
        receivedAt: result.receivedAt,
        memo: result.memo,
        createdAt: result.createdAt,
      },
      message: 'payment created',
    };
  }
}
