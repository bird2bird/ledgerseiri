import { readErrorTextOrThrowSpecialCases } from "@/core/tenant-suspended";
import { fetchWithAutoRefresh } from "@/core/auth/client-auth-fetch";

export type TransactionCategoryItem = {
  id: string;
  companyId: string;
  name: string;
  direction: "INCOME" | "EXPENSE" | "TRANSFER";
  code?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransactionAttachmentDocumentType =
  | "BANK_STATEMENT"
  | "INVOICE"
  | "RECEIPT"
  | "PAYROLL_BANK_STATEMENT"
  | "OTHER_DOCUMENT";

export type TransactionAttachmentItem = {
  id: string;
  companyId: string;
  transactionId: string;
  documentType: TransactionAttachmentDocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksum: string | null;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListTransactionAttachmentsResponse = {
  ok: boolean;
  domain: "transactionAttachments";
  action: "list";
  transactionId: string;
  items: TransactionAttachmentItem[];
};

export type UploadTransactionAttachmentResponse = {
  ok: boolean;
  domain: "transactionAttachments";
  action: "create";
  transactionId: string;
  item: TransactionAttachmentItem;
};

export type TransactionItem = {
  id: string;
  companyId: string | null;
  storeId: string;
  storeName: string | null;
  accountId: string | null;
  accountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  type: string;
  direction: "INCOME" | "EXPENSE" | "TRANSFER" | null;
  sourceType: string;
  amount: number;
  currency: string;
  occurredAt: string;
  externalRef?: string | null;
  memo?: string | null;
  importJobId?: string | null;
  businessMonth?: string | null;
  sourceFileName?: string | null;
  sourceRowNo?: number | null;

  sku?: string | null;
  quantity?: number | null;
  productName?: string | null;
  fulfillment?: string | null;

  grossAmount?: number | null;
  netAmount?: number | null;
  feeAmount?: number | null;
  taxAmount?: number | null;
  shippingAmount?: number | null;
  promotionAmount?: number | null;

  itemSalesAmount?: number | null;
  itemSalesTaxAmount?: number | null;
  shippingTaxAmount?: number | null;
  promotionDiscountAmount?: number | null;
  promotionDiscountTaxAmount?: number | null;
  commissionFeeAmount?: number | null;
  fbaFeeAmount?: number | null;

  createdAt: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await readErrorTextOrThrowSpecialCases(res, "standard");
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function listTransactionCategories(
  direction?: "INCOME" | "EXPENSE" | "TRANSFER"
) {
  const qs = direction ? `?direction=${direction}` : "";
  return readJson<{ ok: boolean; items: TransactionCategoryItem[] }>(
    await fetchWithAutoRefresh(`/api/transaction-categories${qs}`, {
      cache: "no-store",
    })
  );
}

export async function listTransactions(
  direction?: "INCOME" | "EXPENSE" | "TRANSFER"
) {
  const qs = direction ? `?direction=${direction}` : "";
  return readJson<{ ok: boolean; items: TransactionItem[] }>(
    await fetchWithAutoRefresh(`/api/transactions${qs}`, {
      cache: "no-store",
    })
  );
}

export async function createTransaction(payload: {
  accountId?: string | null;
  categoryId?: string | null;
  type?: string;
  direction: "INCOME" | "EXPENSE";
  amount: number;
  currency: string;
  occurredAt: string;
  memo?: string;
}) {
  return readJson(
    await fetchWithAutoRefresh("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateTransaction(
  id: string,
  payload: {
    amount?: number;
    memo?: string | null;
  }
) {
  return readJson<{ ok: boolean; item: TransactionItem; message: string }>(
    await fetchWithAutoRefresh(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteTransaction(id: string) {
  return readJson<{ ok: boolean; id: string; message: string }>(
    await fetchWithAutoRefresh(`/api/transactions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
  );
}

export async function listTransactionAttachments(transactionId: string) {
  return readJson<ListTransactionAttachmentsResponse>(
    await fetchWithAutoRefresh(`/api/transactions/${transactionId}/attachments`, {
      cache: "no-store",
    })
  );
}

export async function uploadTransactionAttachment(
  transactionId: string,
  payload: {
    documentType: TransactionAttachmentDocumentType;
    file: File;
  }
) {
  const formData = new FormData();
  formData.append("documentType", payload.documentType);
  formData.append("file", payload.file);

  return readJson<UploadTransactionAttachmentResponse>(
    await fetchWithAutoRefresh(`/api/transactions/${transactionId}/attachments`, {
      method: "POST",
      body: formData,
    })
  );
}

export async function getDashboardSummary() {
  return readJson<{
    ok: boolean;
    revenue: number;
    expense: number;
    profit: number;
    cash: number;
    message?: string;
  }>(
    await fetch("/dashboard/summary", { cache: "no-store" })
  );
}
