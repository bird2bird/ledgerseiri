export type AccountView = "all" | "bank" | "cash" | "platform" | "payment";
export type BalanceSort = "balance_desc" | "balance_asc" | "name_asc";

export type AccountsSource = "dashboard" | "page" | "other";

export type AccountsContext = {
  from: AccountsSource;
  storeId: string;
  range: string;
  view: AccountView;
  sort: BalanceSort;
};

export type AccountRow = {
  id: string;
  name: string;
  type: Exclude<AccountView, "all">;
  institution?: string;
  currency: "JPY" | "USD";
  status: "active" | "inactive";
  balance: number;
  lastUpdated: string;
};

export type AccountBalanceRow = {
  id: string;
  name: string;
  type: Exclude<AccountView, "all">;
  currency: "JPY" | "USD";
  balance: number;
  sharePct: number;
  status: "healthy" | "warning";
};

export type AccountsEnvelope<T> = {
  rows: T[];
  meta: {
    from: AccountsSource;
    storeId: string;
    range: string;
    view: AccountView;
    sort: BalanceSort;
    adapterMode: "mock-context-aware";
    note: string;
  };
};

const ACCOUNT_ROWS: AccountRow[] = [
  {
    id: "acc-bank-001",
    name: "三井住友銀行",
    type: "bank",
    institution: "SMBC",
    currency: "JPY",
    status: "active",
    balance: 820000,
    lastUpdated: "2026-03-14 09:12",
  },
  {
    id: "acc-bank-002",
    name: "楽天銀行",
    type: "bank",
    institution: "Rakuten",
    currency: "JPY",
    status: "active",
    balance: 315000,
    lastUpdated: "2026-03-14 09:12",
  },
  {
    id: "acc-cash-001",
    name: "会社現金",
    type: "cash",
    currency: "JPY",
    status: "active",
    balance: 68000,
    lastUpdated: "2026-03-14 08:40",
  },
  {
    id: "acc-platform-001",
    name: "Amazon 売上金",
    type: "platform",
    currency: "JPY",
    status: "active",
    balance: 540000,
    lastUpdated: "2026-03-14 07:30",
  },
  {
    id: "acc-payment-001",
    name: "Stripe",
    type: "payment",
    currency: "JPY",
    status: "active",
    balance: 126000,
    lastUpdated: "2026-03-14 06:55",
  },
];

function normalizeAccountsSource(v?: string | null): AccountsSource {
  if (v === "dashboard") return "dashboard";
  if (v === "page") return "page";
  return "other";
}

export function normalizeAccountViewParam(v?: string | null): AccountView {
  return (["all", "bank", "cash", "platform", "payment"].includes(String(v))
    ? v
    : "all") as AccountView;
}

export function normalizeBalanceSortParam(v?: string | null): BalanceSort {
  return (["balance_desc", "balance_asc", "name_asc"].includes(String(v))
    ? v
    : "balance_desc") as BalanceSort;
}

export function createAccountsContext(input: Partial<AccountsContext>): AccountsContext {
  return {
    from: normalizeAccountsSource(input.from),
    storeId: String(input.storeId ?? "all"),
    range: String(input.range ?? "30d"),
    view: normalizeAccountViewParam(input.view),
    sort: normalizeBalanceSortParam(input.sort),
  };
}

function applyView(rows: AccountRow[], view: AccountView): AccountRow[] {
  if (view === "all") return rows;
  return rows.filter((row) => row.type === view);
}

function applySort(rows: AccountRow[], sort: BalanceSort): AccountRow[] {
  const next = [...rows];
  if (sort === "balance_asc") {
    next.sort((a, b) => a.balance - b.balance);
    return next;
  }
  if (sort === "name_asc") {
    next.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    return next;
  }
  next.sort((a, b) => b.balance - a.balance);
  return next;
}

function buildMeta<T>(ctx: AccountsContext, note: string): AccountsEnvelope<T>["meta"] {
  return {
    from: ctx.from,
    storeId: ctx.storeId,
    range: ctx.range,
    view: ctx.view,
    sort: ctx.sort,
    adapterMode: "mock-context-aware",
    note,
  };
}

export async function fetchAccountsPageData(
  view: AccountView,
  sort: BalanceSort,
  ctx: AccountsContext
): Promise<AccountsEnvelope<AccountRow>> {
  const rows = applySort(applyView(ACCOUNT_ROWS, view), sort);
  return {
    rows,
    meta: buildMeta(
      ctx,
      "Step40B: accounts page 已具备 dashboard round-trip query contract，可直接替换为真实 Accounts API。"
    ),
  };
}

export async function fetchAccountBalancesPageData(
  view: AccountView,
  sort: BalanceSort,
  ctx: AccountsContext
): Promise<AccountsEnvelope<AccountBalanceRow>> {
  const accountRows = applySort(applyView(ACCOUNT_ROWS, view), sort);
  const total = accountRows.reduce((sum, row) => sum + row.balance, 0);

  const rows: AccountBalanceRow[] = accountRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    balance: row.balance,
    sharePct: total > 0 ? Math.round((row.balance / total) * 100) : 0,
    status: row.balance < 100000 ? "warning" : "healthy",
  }));

  return {
    rows,
    meta: buildMeta(
      ctx,
      "Step40B: balances page 已共享 accounts view/sort/store/range contract，后续可并入真实余额接口。"
    ),
  };
}
