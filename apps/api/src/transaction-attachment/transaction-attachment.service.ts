import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TransactionAttachmentService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(inputCompanyId?: string | null) {
    const companyId = String(inputCompanyId ?? '').trim();
    if (!companyId) {
      throw new UnauthorizedException('COMPANY_CONTEXT_REQUIRED');
    }
    return companyId;
  }

  private normalizeAttachment(row: {
    id: string;
    companyId: string;
    transactionId: string;
    documentType: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    checksum: string | null;
    uploadedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      companyId: row.companyId,
      transactionId: row.transactionId,
      documentType: row.documentType,
      fileName: row.fileName,
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      checksum: row.checksum,
      uploadedById: row.uploadedById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listForTransaction(transactionId: string, companyIdInput?: string | null) {
    const companyId = this.resolveCompanyId(companyIdInput);
    const normalizedTransactionId = String(transactionId || '').trim();

    if (!normalizedTransactionId) {
      throw new NotFoundException('TRANSACTION_NOT_FOUND');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: normalizedTransactionId,
        companyId,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('TRANSACTION_NOT_FOUND');
    }

    const items = await this.prisma.transactionAttachment.findMany({
      where: {
        companyId,
        transactionId: normalizedTransactionId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    return {
      ok: true,
      domain: 'transactionAttachments',
      action: 'list',
      transactionId: normalizedTransactionId,
      items: items.map((item) => this.normalizeAttachment(item)),
    };
  }
}
