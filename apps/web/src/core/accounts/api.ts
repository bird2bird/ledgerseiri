const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type AccountItem = {
  id: string;
  companyId?: string | null;
  name: string;
  type: string;
  currency: string;
  storeId?: string | null;
  openingBalance?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AccountsListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: AccountItem[];
  message?: string;
};

type AccountWriteResponse = {
  ok: boolean;
  domain: string;
  action: string;
  item: AccountItem;
  message?: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listAccounts(): Promise<AccountsListResponse> {
  const res = await fetch(`${API_BASE}/api/accounts`, {
    credentials: "include",
    cache: "no-store",
  });
  return readJson<AccountsListResponse>(res);
}

export async function createAccount(payload: {
  name: string;
  type?: string;
  currency?: string;
}): Promise<AccountWriteResponse> {
  const res = await fetch(`${API_BASE}/api/accounts`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return readJson<AccountWriteResponse>(res);
}

export async function updateAccount(
  id: string,
  payload: {
    name?: string;
    type?: string;
    currency?: string;
  }
): Promise<AccountWriteResponse> {
  const res = await fetch(`${API_BASE}/api/accounts/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return readJson<AccountWriteResponse>(res);
}
