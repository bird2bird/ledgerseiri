import { ensureNotTenantSuspended } from "@/core/tenant-suspended";
import { readErrorTextOrThrowSpecialCases } from "@/core/tenant-suspended";
export type AccountItem = {
  id: string;
  companyId: string;
  storeId: string | null;
  storeName: string | null;
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FundTransferItem = {
  id: string;
  companyId: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  currency: string;
  occurredAt: string;
  memo: string | null;
  createdAt: string;
};

export type AccountBalanceItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  storeName: string | null;
  openingBalance: number;
  income: number;
  expense: number;
  transferOut: number;
  transferIn: number;
  currentBalance: number;
  isActive: boolean;
};

async function readJson<T>(res: Response): Promise<T> {
  await ensureNotTenantSuspended(res);

  if (!res.ok) {
    const text = await readErrorTextOrThrowSpecialCases(res, "standard");
    throw new Error(`${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

export async function listAccounts() {
  return readJson<{ ok: boolean; items: AccountItem[]; message: string }>(
    await fetch("/api/accounts", { cache: "no-store" })
  );
}

export async function createAccount(payload: {
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
}) {
  return readJson(
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function listAccountBalances() {
  return readJson<{
    ok: boolean;
    summary: { accountCount: number; totalBalance: number; currency: string };
    items: AccountBalanceItem[];
    message: string;
  }>(await fetch("/api/account-balances", { cache: "no-store" }));
}

export async function listFundTransfers() {
  return readJson<{ ok: boolean; items: FundTransferItem[]; message: string }>(
    await fetch("/api/fund-transfer", { cache: "no-store" })
  );
}

export async function updateFundTransfer(
  id: string,
  payload: {
    amount?: number;
    memo?: string | null;
  }
) {
  return readJson<{ ok: boolean; item: FundTransferItem; message: string }>(
    await fetch(`/api/fund-transfer/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}


export async function createFundTransfer(payload: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  occurredAt: string;
  memo?: string;
}) {
  return readJson(
    await fetch("/api/fund-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}
