import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type CreateInvoicePayload = {
  companyId?: string;
  storeId?: string | null;
  invoiceNo?: string;
  invoiceNumber?: string;
  customerName?: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  subtotal?: number | string;
  tax?: number | string;
  memo?: string;
};

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId(inputCompanyId?: string) {
    const companyId = String(inputCompanyId ?? '').trim();
    if (!companyId) {
      throw new Error('COMPANY_CONTEXT_REQUIRED');
    }
    return companyId;
  }

  private async resolveDefaultStoreId(companyId: string, storeId?: string | null) {
    const inputStoreId = String(storeId ?? '').trim();
    if (inputStoreId) {
      const ownedStore = await this.prisma.store.findFirst({
        where: { id: inputStoreId, companyId },
        select: { id: true },
      });
      if (!ownedStore) {
        throw new Error('store not found or not owned by current company.');
      }
      return ownedStore.id;
    }

    const store = await this.prisma.store.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return store?.id ?? null;
  }

  private mapInvoice(
    row: {
      id: string;
      companyId: string;
      storeId: string | null;
      invoiceNo: string;
      customerName: string;
      status: InvoiceStatus;
      currency: string;
      issueDate: Date;
      dueDate: Date;
      totalAmount: number;
      paidAmount: number;
      memo: string | null;
      createdAt: Date;
      updatedAt: Date;
      store?: { name: string } | null;
    },
  ) {
    const totalAmount = Number(row.totalAmount ?? 0);
    const subtotal = Math.round(totalAmount / 1.1);
    const tax = totalAmount - subtotal;

    return {
      id: row.id,
      companyId: row.companyId,
      storeId: row.storeId,
      storeName: row.store?.name ?? null,
      invoiceNo: row.invoiceNo,
      invoiceNumber: row.invoiceNo,
      customerName: row.customerName,
      status: row.status,
      currency: row.currency,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      totalAmount,
      total: totalAmount,
      subtotal,
      tax,
      paidAmount: Number(row.paidAmount ?? 0),
      balance: totalAmount - Number(row.paidAmount ?? 0),
      memo: row.memo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async list(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const items = await this.prisma.invoice.findMany({
      where: { companyId: resolvedCompanyId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'invoices',
      action: 'list',
      items: items.map((x) => this.mapInvoice(x)),
      message: 'invoices loaded',
    };
  }

  async unpaid(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const items = await this.prisma.invoice.findMany({
      where: {
        companyId: resolvedCompanyId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'invoices',
      action: 'unpaid',
      items: items.map((x) => this.mapInvoice(x)),
      message: 'unpaid invoices loaded',
    };
  }

  async history(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const items = await this.prisma.invoice.findMany({
      where: {
        companyId: resolvedCompanyId,
        paidAmount: { gt: 0 },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'invoices',
      action: 'history',
      items: items.map((x) => this.mapInvoice(x)),
      message: 'invoice history loaded',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'invoices',
      statusOptions: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELED'],
      message: 'invoice meta loaded',
    };
  }

  async create(payload: CreateInvoicePayload) {
    const companyId = await this.resolveCompanyId(payload?.companyId);
    const storeId = await this.resolveDefaultStoreId(companyId, payload?.storeId);

    const customerName = String(payload.customerName || '').trim();
    if (!customerName) {
      throw new Error('customerName is required.');
    }

    const issueDate = payload.issueDate ? new Date(payload.issueDate) : new Date();
    const dueDate = payload.dueDate ? new Date(payload.dueDate) : issueDate;

    const subtotal = Math.round(Number(payload.subtotal ?? 0));
    const tax = Math.round(Number(payload.tax ?? 0));

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error('subtotal must be >= 0.');
    }
    if (!Number.isFinite(tax) || tax < 0) {
      throw new Error('tax must be >= 0.');
    }

    const totalAmount = subtotal + tax;

    const invoiceNo =
      String(payload.invoiceNo || payload.invoiceNumber || '').trim() ||
      `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()
        .toString()
        .slice(-6)}`;

    const item = await this.prisma.invoice.create({
      data: {
        companyId,
        storeId,
        invoiceNo,
        customerName,
        status: 'ISSUED',
        currency: String(payload.currency || 'JPY').trim() || 'JPY',
        issueDate,
        dueDate,
        totalAmount,
        paidAmount: 0,
        memo: payload.memo ? String(payload.memo) : null,
      },
      include: {
        store: { select: { name: true } },
      },
    });

    return {
      ok: true,
      domain: 'invoices',
      action: 'create',
      item: this.mapInvoice(item),
      message: 'invoice created',
    };
  }
}
