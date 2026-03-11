export type InvoiceItem = {
  id: string;
  companyId: string;
  storeId: string | null;
  storeName: string | null;
  invoiceNumber: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  currency: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
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
  invoiceNumber: string | null;
  customerName: string | null;
  accountId: string | null;
  accountName: string | null;
  amount: number;
  currency: string;
  receivedAt: string;
  memo?: string | null;
  createdAt: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function listInvoices() {
  return readJson<{ ok: boolean; items: InvoiceItem[]; message: string }>(
    await fetch("/api/invoices", { cache: "no-store" })
  );
}

export async function listUnpaidInvoices() {
  return readJson<{ ok: boolean; items: InvoiceItem[]; message: string }>(
    await fetch("/api/invoices/unpaid", { cache: "no-store" })
  );
}

export async function listInvoiceHistory() {
  return readJson<{ ok: boolean; items: InvoiceItem[]; message: string }>(
    await fetch("/api/invoices/history", { cache: "no-store" })
  );
}

export async function createInvoice(payload: {
  invoiceNumber?: string;
  customerName: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  memo?: string;
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
  return readJson<{ ok: boolean; items: PaymentItem[]; message: string }>(
    await fetch("/api/payments", { cache: "no-store" })
  );
}

export async function createPayment(payload: {
  invoiceId: string;
  accountId?: string | null;
  amount: number;
  currency: string;
  receivedAt: string;
  memo?: string;
}) {
  return readJson(
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}
