export type AccountView = "all" | "bank" | "cash" | "platform" | "payment";
export type BalanceSort = "balance_desc" | "balance_asc" | "name_asc";

export type AccountsSource = "dashboard" | "page" | "unknown";

export type AccountsQueryContext = {
  source: AccountsSource;
  from?: string | null;
  storeId?: string | null;
  range?: string | null;
  view?: string | null;
  sort?: string | null;
};

export type AccountRow = {
  id: string;
  name: string;
  type: Exclude<AccountView, "all">;
  balance: number;
  status: "active" | "inactive";
  updatedAt: string;
};

export type AccountBalanceRow = {
  id: string;
  name: string;
  type: Exclude<AccountView, "all">;
  balance: number;
  status: "active" | "inactive";
  ratioPct: number;
};

export type AccountsEnvelope<T> = {
  rows: T[];
  meta: {
    source: AccountsSource;
    from?: string | null;
    storeId?: string | null;
    range?: string | null;
    activeView: AccountView;
    activeSort: BalanceSort;
    adapterMode: "mock-roundtrip-aware";
    note?: string;
  };
};

const ACCOUNT_ROWS: AccountRow[] = [
  { id: "a1", name: "三井住友銀行", type: "bank", balance: 1200000, status: "active", updatedAt: "2026-03-14 09:20" },
  { id: "a2", name: "楽天銀行", type: "bank", balance: 420000, status: "active", updatedAt: "2026-03-14 09:18" },
  { id: "a3", name: "会社現金", type: "cash", balance: 180000, status: "active", updatedAt: "2026-03-14 09:10" },
  { id: "a4", name: "Amazon 売上金", type: "platform", balance: 850000, status: "active", updatedAt: "2026-03-14 08:50" },
  { id: "a5", name: "Stripe", type: "payment", balance: 520000, status: "active", updatedAt: "2026-03-14 08:30" },
  { id: "a6", name: "旧口座", type: "bank", balance: 0, status: "inactive", updatedAt: "2026-03-01 12:00" },
];

function normalizeSource(v?: string | null): AccountsSource {
  if (v === "dashboard") return "dashboard";
  if (v === "page") return "page";
  return "unknown";
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

export function createAccountsContext(
  input: Partial<AccountsQueryContext>
): AccountsQueryContext {
  return {
    source: normalizeSource(input.from ?? input.source),
    from: input.from ?? null,
    storeId: input.storeId ?? null,
    range: input.range ?? null,
    view: input.view ?? null,
    sort: input.sort ?? null,
  };
}

function applyView(rows: AccountRow[], view: AccountView): AccountRow[] {
  return rows.filter((row) => view === "all" || row.type === view);
}

function applySort(rows: AccountRow[], sort: BalanceSort): AccountRow[] {
  const cloned = [...rows];
  if (sort === "balance_asc") {
    return cloned.sort((a, b) => a.balance - b.balance);
  }
  if (sort === "name_asc") {
    return cloned.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }
  return cloned.sort((a, b) => b.balance - a.balance);
}

function buildMeta<T extends AccountRow | AccountBalanceRow>(
  rows: T[],
  view: AccountView,
  sort: BalanceSort,
  ctx: AccountsQueryContext,
  note: string
): AccountsEnvelope<T>["meta"] {
  void rows;
  return {
    source: ctx.source,
    from: ctx.from ?? null,
    storeId: ctx.storeId ?? null,
    range: ctx.range ?? null,
    activeView: view,
    activeSort: sort,
    adapterMode: "mock-roundtrip-aware",
    note,
  };
}

export async function fetchAccountsPageData(
  view: AccountView,
  sort: BalanceSort,
  ctx: AccountsQueryContext
): Promise<AccountsEnvelope<AccountRow>> {
  const rows = applySort(applyView(ACCOUNT_ROWS, view), sort);

  return {
    rows,
    meta: buildMeta(
      rows,
      view,
      sort,
      ctx,
      "Step40C: accounts page 已具备 round-trip query / context / adapter 联动骨架。"
    ),
  };
}

export async function fetchAccountBalancesPageData(
  view: AccountView,
  sort: BalanceSort,
  ctx: AccountsQueryContext
): Promise<AccountsEnvelope<AccountBalanceRow>> {
  const visible = applySort(applyView(ACCOUNT_ROWS, view), sort);
  const total = visible.reduce((sum, row) => sum + row.balance, 0);

  const rows: AccountBalanceRow[] = visible.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    status: row.status,
    ratioPct: total > 0 ? Math.round((row.balance / total) * 100) : 0,
  }));

  return {
    rows,
    meta: buildMeta(
      rows,
      view,
      sort,
      ctx,
      "Step40C: account-balances page 已具备 round-trip query / context / adapter 联动骨架。"
    ),
  };
}
