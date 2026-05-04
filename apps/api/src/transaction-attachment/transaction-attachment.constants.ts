export const TRANSACTION_ATTACHMENT_STORAGE_ROOT =
  process.env.TRANSACTION_ATTACHMENT_STORAGE_ROOT || '/app-data/attachments';

export const TRANSACTION_ATTACHMENT_STORAGE_KEY_PREFIX = 'attachments';

export const TRANSACTION_ATTACHMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const TRANSACTION_ATTACHMENT_ALLOWED_DOCUMENT_TYPES = [
  'BANK_STATEMENT',
  'INVOICE',
  'RECEIPT',
  'PAYROLL_BANK_STATEMENT',
  'OTHER_DOCUMENT',
] as const;

export type TransactionAttachmentDocumentTypeInput =
  (typeof TRANSACTION_ATTACHMENT_ALLOWED_DOCUMENT_TYPES)[number];

export const TRANSACTION_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export function isAllowedTransactionAttachmentDocumentType(
  value: string,
): value is TransactionAttachmentDocumentTypeInput {
  return TRANSACTION_ATTACHMENT_ALLOWED_DOCUMENT_TYPES.includes(
    value as TransactionAttachmentDocumentTypeInput,
  );
}

export function isAllowedTransactionAttachmentMimeType(value: string) {
  return TRANSACTION_ATTACHMENT_ALLOWED_MIME_TYPES.includes(
    value as (typeof TRANSACTION_ATTACHMENT_ALLOWED_MIME_TYPES)[number],
  );
}
