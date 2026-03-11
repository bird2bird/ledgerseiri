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

    const items = await this.prisma.paymentReceipt.findMany({
      where: { companyId },
      orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            customerName: true,
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
      items: items.map((p: any) => ({
        id: p.id,
        companyId: p.companyId,
        invoiceId: p.invoiceId,
        invoiceNo: p.invoice?.invoiceNo ?? null,
        invoiceNumber: p.invoice?.invoiceNo ?? null,
        customerName: p.invoice?.customerName ?? null,
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

    const invoiceId = String(payload.invoiceId || '').trim();
    if (!invoiceId) {
      throw new Error('invoiceId is required.');
    }

    const amount = Math.round(Number(payload.amount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount must be greater than 0.');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        companyId: true,
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

    const item = await this.prisma.paymentReceipt.create({
      data: {
        companyId,
        invoiceId,
        accountId: payload.accountId || null,
        amount,
        currency: String(payload.currency || 'JPY').trim() || 'JPY',
        receivedAt: payload.receivedAt ? new Date(payload.receivedAt) : new Date(),
        memo: payload.memo ? String(payload.memo) : null,
      },
    });

    const newPaid = invoice.paidAmount + amount;
    const nextStatus = newPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        status: nextStatus,
      },
    });

    return {
      ok: true,
      domain: 'payments',
      action: 'create',
      item,
      message: 'payment created',
    };
  }
}
