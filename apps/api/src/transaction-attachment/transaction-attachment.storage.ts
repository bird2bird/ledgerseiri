import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  TRANSACTION_ATTACHMENT_STORAGE_KEY_PREFIX,
  TRANSACTION_ATTACHMENT_STORAGE_ROOT,
} from './transaction-attachment.constants';

type PutLocalAttachmentInput = {
  companyId: string;
  transactionId: string;
  originalName: string;
  buffer: Buffer;
};

type PutLocalAttachmentResult = {
  fileName: string;
  storageKey: string;
  absolutePath: string;
  checksum: string;
  sizeBytes: number;
};

@Injectable()
export class TransactionAttachmentStorage {
  get storageRoot() {
    return TRANSACTION_ATTACHMENT_STORAGE_ROOT;
  }

  sanitizeFileName(input: string) {
    const base = String(input || 'attachment')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();

    return base.slice(0, 160) || 'attachment';
  }

  buildStorageKey(companyId: string, transactionId: string, fileName: string) {
    const safeCompanyId = this.sanitizePathSegment(companyId);
    const safeTransactionId = this.sanitizePathSegment(transactionId);
    const safeFileName = this.sanitizeFileName(fileName);

    return [
      TRANSACTION_ATTACHMENT_STORAGE_KEY_PREFIX,
      safeCompanyId,
      safeTransactionId,
      `${randomUUID()}-${safeFileName}`,
    ].join('/');
  }

  resolveAbsolutePath(storageKey: string) {
    const normalizedKey = String(storageKey || '')
      .split('/')
      .filter(Boolean)
      .map((segment) => this.sanitizePathSegment(segment))
      .join('/');

    return join(this.storageRoot, normalizedKey);
  }

  async put(input: PutLocalAttachmentInput): Promise<PutLocalAttachmentResult> {
    const fileName = this.sanitizeFileName(input.originalName);
    const storageKey = this.buildStorageKey(input.companyId, input.transactionId, fileName);
    const absolutePath = this.resolveAbsolutePath(storageKey);
    const checksum = createHash('sha256').update(input.buffer).digest('hex');

    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      fileName,
      storageKey,
      absolutePath,
      checksum,
      sizeBytes: input.buffer.length,
    };
  }

  private sanitizePathSegment(input: string) {
    return String(input || '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 180);
  }
}
