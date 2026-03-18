const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type AccountBalanceItem = {
  id: string;
  companyId?: string | null;
  name: string;
  type: string;
  currency: string;
  storeId?: string | null;
  openingBalance: number;
  incomeTotal: number;
  expenseTotal: number;
  inboundTransferTotal: number;
  outboundTransferTotal: number;
  currentBalance: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AccountBalancesResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: AccountBalanceItem[];
  message?: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listAccountBalances(): Promise<AccountBalancesResponse> {
  const res = await fetch(`${API_BASE}/api/account-balances`, {
    credentials: "include",
    cache: "no-store",
  });
  return readJson<AccountBalancesResponse>(res);
}
