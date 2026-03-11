export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELED";

export type InvoiceItem = {
  id: string;
  companyId: string;
  storeId: string | null;
  storeName: string | null;
  invoiceNo?: string | null;
  invoiceNumber?: string | null;
  customerName: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  total: number;
  subtotal: number;
  tax: number;
  paidAmount: number;
  balance: number;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentItem = {
  id: string;
  companyId: string;
  invoiceId: string;
  invoiceNo?: string | null;
  invoiceNumber?: string | null;
  customerName?: string | null;
  invoiceStatus?: InvoiceStatus | null;
  invoiceTotalAmount?: number | null;
  invoicePaidAmount?: number | null;
  accountId?: string | null;
  accountName?: string | null;
  amount: number;
  currency: string;
  receivedAt: string;
  memo?: string | null;
  createdAt: string;
};

type InvoiceListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InvoiceItem[];
  message?: string;
};

type PaymentListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: PaymentItem[];
  message?: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export function getInvoiceDisplayNo(item: Pick<InvoiceItem, "invoiceNo" | "invoiceNumber">) {
  return item.invoiceNo || item.invoiceNumber || "-";
}

export async function listInvoices() {
  return readJson<InvoiceListResponse>(await fetch("/api/invoices", { cache: "no-store" }));
}

export async function listUnpaidInvoices() {
  return readJson<InvoiceListResponse>(await fetch("/api/invoices/unpaid", { cache: "no-store" }));
}

export async function listInvoiceHistory() {
  return readJson<InvoiceListResponse>(await fetch("/api/invoices/history", { cache: "no-store" }));
}

export async function createInvoice(payload: {
  customerName: string;
  currency?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  memo?: string;
  invoiceNo?: string;
}) {
  return readJson(
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function listPayments() {
  return readJson<PaymentListResponse>(await fetch("/api/payments", { cache: "no-store" }));
}

export async function createPayment(payload: {
  invoiceId: string;
  amount: number;
  currency?: string;
  receivedAt: string;
  memo?: string;
  accountId?: string | null;
}) {
  return readJson(
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export function formatYen(value: number | null | undefined) {
  return `¥${Number(value ?? 0).toLocaleString("ja-JP")}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ja-JP");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
