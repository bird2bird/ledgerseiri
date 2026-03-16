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
  createdAt: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function listTransactionCategories(direction?: "INCOME" | "EXPENSE" | "TRANSFER") {
  const qs = direction ? `?direction=${direction}` : "";
  return readJson<{ ok: boolean; items: TransactionCategoryItem[] }>(
    await fetch(`/api/transaction-categories${qs}`, { cache: "no-store" })
  );
}

export async function listTransactions(direction?: "INCOME" | "EXPENSE" | "TRANSFER") {
  const qs = direction ? `?direction=${direction}` : "";
  return readJson<{ ok: boolean; items: TransactionItem[] }>(
    await fetch(`/api/transactions${qs}`, { cache: "no-store" })
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
    await fetch("/api/transactions", {
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
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
  }>(await fetch("/dashboard/summary", { cache: "no-store" }));
}
