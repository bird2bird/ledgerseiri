import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TransactionAttachmentDocumentType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  TRANSACTION_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  isAllowedTransactionAttachmentDocumentType,
  isAllowedTransactionAttachmentMimeType,
} from './transaction-attachment.constants';
import { TransactionAttachmentStorage } from './transaction-attachment.storage';

type TransactionAttachmentUploadFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

@Injectable()
export class TransactionAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: TransactionAttachmentStorage,
  ) {}

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

  private async assertTransactionBelongsToCompany(transactionId: string, companyId: string) {
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

    return normalizedTransactionId;
  }

  async listForTransaction(transactionId: string, companyIdInput?: string | null) {
    const companyId = this.resolveCompanyId(companyIdInput);
    const normalizedTransactionId = await this.assertTransactionBelongsToCompany(
      transactionId,
      companyId,
    );

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

  async downloadForTransaction(
    transactionId: string,
    attachmentId: string,
    companyIdInput?: string | null,
  ) {
    const companyId = this.resolveCompanyId(companyIdInput);
    const normalizedTransactionId = await this.assertTransactionBelongsToCompany(
      transactionId,
      companyId,
    );
    const normalizedAttachmentId = String(attachmentId || '').trim();

    if (!normalizedAttachmentId) {
      throw new NotFoundException('ATTACHMENT_NOT_FOUND');
    }

    const item = await this.prisma.transactionAttachment.findFirst({
      where: {
        id: normalizedAttachmentId,
        companyId,
        transactionId: normalizedTransactionId,
      },
    });

    if (!item) {
      throw new NotFoundException('ATTACHMENT_NOT_FOUND');
    }

    const fileInfo = await this.storage.getFileInfo(item.storageKey);

    return {
      ok: true,
      domain: 'transactionAttachments',
      action: 'download',
      transactionId: normalizedTransactionId,
      item: this.normalizeAttachment(item),
      absolutePath: fileInfo.absolutePath,
      mimeType: item.mimeType || 'application/octet-stream',
      sizeBytes: fileInfo.sizeBytes || item.sizeBytes,
      downloadName: item.originalName || item.fileName || 'attachment',
    };
  }

  async deleteForTransaction(
    transactionId: string,
    attachmentId: string,
    companyIdInput?: string | null,
  ) {
    const companyId = this.resolveCompanyId(companyIdInput);
    const normalizedTransactionId = await this.assertTransactionBelongsToCompany(
      transactionId,
      companyId,
    );
    const normalizedAttachmentId = String(attachmentId || '').trim();

    if (!normalizedAttachmentId) {
      throw new NotFoundException('ATTACHMENT_NOT_FOUND');
    }

    const item = await this.prisma.transactionAttachment.findFirst({
      where: {
        id: normalizedAttachmentId,
        companyId,
        transactionId: normalizedTransactionId,
      },
    });

    if (!item) {
      throw new NotFoundException('ATTACHMENT_NOT_FOUND');
    }

    await this.prisma.transactionAttachment.delete({
      where: {
        id: item.id,
      },
    });

    await this.storage.delete(item.storageKey);

    return {
      ok: true,
      domain: 'transactionAttachments',
      action: 'delete',
      transactionId: normalizedTransactionId,
      id: item.id,
      item: this.normalizeAttachment(item),
    };
  }

  async createForTransaction(
    transactionId: string,
    companyIdInput: string | null | undefined,
    documentTypeInput: string,
    file: TransactionAttachmentUploadFile | undefined,
    uploadedById?: string | null,
  ) {
    const companyId = this.resolveCompanyId(companyIdInput);
    const normalizedTransactionId = await this.assertTransactionBelongsToCompany(
      transactionId,
      companyId,
    );

    const documentType = String(documentTypeInput || '').trim();
    if (!isAllowedTransactionAttachmentDocumentType(documentType)) {
      throw new BadRequestException('INVALID_DOCUMENT_TYPE');
    }

    if (!file?.buffer || !file.originalname) {
      throw new BadRequestException('ATTACHMENT_FILE_REQUIRED');
    }

    const mimeType = String(file.mimetype || '').trim();
    if (!isAllowedTransactionAttachmentMimeType(mimeType)) {
      throw new BadRequestException('UNSUPPORTED_ATTACHMENT_MIME_TYPE');
    }

    const sizeBytes = Number(file.size || file.buffer.length || 0);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException('INVALID_ATTACHMENT_SIZE');
    }

    if (sizeBytes > TRANSACTION_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('ATTACHMENT_FILE_TOO_LARGE');
    }

    const stored = await this.storage.put({
      companyId,
      transactionId: normalizedTransactionId,
      originalName: file.originalname,
      buffer: file.buffer,
    });

    try {
      const item = await this.prisma.transactionAttachment.create({
        data: {
          companyId,
          transactionId: normalizedTransactionId,
          documentType: documentType as TransactionAttachmentDocumentType,
          fileName: stored.fileName,
          originalName: file.originalname,
          mimeType,
          sizeBytes: stored.sizeBytes,
          storageKey: stored.storageKey,
          checksum: stored.checksum,
          uploadedById: uploadedById || null,
        },
      });

      return {
        ok: true,
        domain: 'transactionAttachments',
        action: 'create',
        transactionId: normalizedTransactionId,
        item: this.normalizeAttachment(item),
      };
    } catch (error) {
      await this.storage.delete(stored.storageKey);
      throw error;
    }
  }
}
