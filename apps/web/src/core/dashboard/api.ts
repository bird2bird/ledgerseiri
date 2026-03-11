import type {
  AccountBalanceItem,
  BusinessHealthData,
  DashboardAlert,
  DashboardHomeData,
  DashboardRange,
  ExpenseBreakdownItem,
  RecentTransactionItem,
} from "@/components/app/dashboard-v2/types";

type FetchDashboardSummaryArgs = {
  token?: string | null;
  storeId?: string;
  range?: DashboardRange;
  locale?: string;
};

function money(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function shortDate(v: string | Date) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateOnly(v: string | Date) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function mapRange(input?: string): DashboardRange {
  const v = String(input || "").toLowerCase();
  if (v === "7d") return "7d";
  if (v === "90d") return "90d";
  if (v === "12m") return "12m";
  return "30d";
}

function accountTypeOf(v: unknown): AccountBalanceItem["accountType"] {
  const x = String(v || "").toLowerCase();
  if (x === "cash") return "cash";
  if (x === "platform") return "platform";
  if (x === "payment") return "payment";
  return "bank";
}

function alertTypeOf(key: string): DashboardAlert["type"] {
  if (key.includes("inventory")) return "inventory";
  if (key.includes("tax")) return "tax";
  if (key.includes("cash")) return "cash";
  if (key.includes("expense")) return "expense";
  return "invoice";
}

function alertSeverityOf(level: string): DashboardAlert["severity"] {
  const v = String(level || "").toLowerCase();
  if (v === "critical" || v === "error") return "critical";
  if (v === "warning" || v === "warn") return "warning";
  return "info";
}

function businessStatusOf(v: unknown): BusinessHealthData["status"] {
  const s = String(v || "").toLowerCase();
  if (s === "good") return "good";
  if (s === "risk" || s === "bad" || s === "critical") return "risk";
  return "attention";
}

function emptyDashboard(range: DashboardRange = "30d", storeId = "all"): DashboardHomeData {
  return {
    filters: {
      range,
      storeId,
      refreshedAt: new Date().toISOString(),
    },

    kpiPrimary: [
      { key: "revenue", label: "今月収入", value: "¥0", deltaText: "-", trend: "neutral", tone: "profit" },
      { key: "expense", label: "今月支出", value: "¥0", deltaText: "-", trend: "neutral", tone: "warning" },
      { key: "profit", label: "今月利益", value: "¥0", deltaText: "-", trend: "neutral", tone: "profit" },
      { key: "cash", label: "総資金", value: "¥0", deltaText: "-", trend: "neutral", tone: "info" },
      { key: "tax", label: "消費税概算", value: "¥0", subLabel: "今期見込み", tone: "default" },
    ],

    kpiSecondary: [
      { key: "invoice", label: "未入金", value: "¥0", subLabel: "0件", tone: "warning" },
      { key: "inventory", label: "在庫金額", value: "¥0", subLabel: "全店舗合計", tone: "default" },
      { key: "stockAlert", label: "在庫アラート", value: "0件", subLabel: "補充が必要", tone: "danger" },
      { key: "runway", label: "資金余力", value: "0.0ヶ月", subLabel: "現在の支出ペース", tone: "info" },
    ],

    revenueProfitTrend: [],
    cashBalances: [],
    expenseBreakdown: [],
    cashFlowTrend: [],

    taxSummary: {
      outputTax: 0,
      inputTax: 0,
      estimatedTaxPayable: 0,
      periodLabel: "当期",
      note: "実データ",
    },

    alerts: [],

    businessHealth: {
      score: 0,
      status: "attention",
      dimensions: [],
      insights: [],
    },

    recentTransactions: [],

    quickActions: [
      { key: "addIncome", label: "収入を追加", subLabel: "現金・売上", href: "/ja/app/income", icon: "plus" },
      { key: "addExpense", label: "支出を追加", subLabel: "経費・運営費", href: "/ja/app/expenses", icon: "minus" },
      { key: "transfer", label: "資金移動を記録", subLabel: "口座間移動", href: "/ja/app/fund-transfer", icon: "arrow" },
      { key: "invoice", label: "請求書を作成", subLabel: "新規請求", href: "/ja/app/invoices", icon: "file" },
      { key: "import", label: "データをインポート", subLabel: "CSV / 明細", href: "/ja/app/data/import", icon: "upload" },
      { key: "reports", label: "レポートを見る", subLabel: "利益 / CF", href: "/ja/app/reports/profit", icon: "chart" },
    ],
  };
}

export async function fetchDashboardSummary(args: FetchDashboardSummaryArgs = {}): Promise<DashboardHomeData> {
  const qs = new URLSearchParams();
  if (args.range) qs.set("range", args.range);
  if (args.storeId) qs.set("storeId", args.storeId);
  if (args.locale) qs.set("locale", args.locale);

  const url = `/dashboard/summary${qs.toString() ? `?${qs.toString()}` : ""}`;

  let raw: any = {};
  try {
    raw = await readJson<any>(
      await fetch(url, {
        cache: "no-store",
        headers: args.token ? { Authorization: `Bearer ${args.token}` } : undefined,
      })
    );
  } catch (err) {
    console.error("fetchDashboardSummary failed:", err);
    return emptyDashboard(args.range ?? "30d", args.storeId ?? "all");
  }

  const summary = raw?.summary ?? {};
  const filters = raw?.filters ?? {};
  const range = mapRange(filters.range ?? args.range);
  const storeId = String(filters.storeId ?? args.storeId ?? "all");

  const revenue = toNum(summary.revenue);
  const expense = toNum(summary.expense);
  const profit = toNum(summary.profit);
  const cash = toNum(summary.cash);
  const estimatedTax = toNum(summary.estimatedTax);
  const unpaidAmount = toNum(summary.unpaidAmount);
  const unpaidCount = toNum(summary.unpaidCount);
  const inventoryValue = toNum(summary.inventoryValue);
  const inventoryAlertCount = toNum(summary.inventoryAlertCount);
  const runwayMonths = toNum(summary.runwayMonths);

  const base = emptyDashboard(range, storeId);

  base.filters = {
    range,
    storeId,
    refreshedAt: new Date().toISOString(),
  };

  base.kpiPrimary = [
    { key: "revenue", label: "今月収入", value: money(revenue), deltaText: "-", trend: "neutral", tone: "profit" },
    { key: "expense", label: "今月支出", value: money(expense), deltaText: "-", trend: "neutral", tone: "warning" },
    { key: "profit", label: "今月利益", value: money(profit), deltaText: "-", trend: "neutral", tone: "profit" },
    { key: "cash", label: "総資金", value: money(cash), deltaText: "-", trend: "neutral", tone: "info" },
    { key: "tax", label: "消費税概算", value: money(estimatedTax), subLabel: "今期見込み", tone: "default" },
  ];

  base.kpiSecondary = [
    { key: "invoice", label: "未入金", value: money(unpaidAmount), subLabel: `${unpaidCount}件`, tone: "warning" },
    { key: "inventory", label: "在庫金額", value: money(inventoryValue), subLabel: "全店舗合計", tone: "default" },
    { key: "stockAlert", label: "在庫アラート", value: `${inventoryAlertCount}件`, subLabel: "補充が必要", tone: "danger" },
    { key: "runway", label: "資金余力", value: `${runwayMonths.toFixed(1)}ヶ月`, subLabel: "現在の支出ペース", tone: "info" },
  ];

  base.revenueProfitTrend = asArray<any>(raw?.revenueProfitTrend).map((x) => ({
    label: String(x?.label ?? shortDate(new Date())),
    revenue: toNum(x?.revenue),
    profit: toNum(x?.profit),
  }));

  base.cashFlowTrend = asArray<any>(raw?.cashFlowTrend).map((x) => ({
    label: String(x?.label ?? shortDate(new Date())),
    cashIn: toNum(x?.income ?? x?.cashIn),
    cashOut: toNum(x?.expense ?? x?.cashOut),
    netCash: toNum(x?.net ?? x?.netCash),
  }));

  const apiCashBalances = asArray<any>(raw?.cashBalances);
  const totalCash = apiCashBalances.reduce((sum, x) => sum + toNum(x?.balance), 0);

  base.cashBalances = apiCashBalances.map((x) => {
    const balance = toNum(x?.balance);
    const sharePct =
      totalCash > 0 ? Math.max(0, Math.round((balance / totalCash) * 100)) : 0;

    return {
      accountId: String(x?.id ?? ""),
      accountName: String(x?.name ?? "-"),
      accountType: accountTypeOf(x?.type),
      balance,
      currency: "JPY",
      sharePct,
    };
  });

  base.expenseBreakdown = asArray<any>(raw?.expenseBreakdown).map<ExpenseBreakdownItem>((x) => ({
    category: String(x?.label ?? x?.category ?? "-"),
    amount: toNum(x?.amount),
    pct: toNum(x?.share ?? x?.pct),
  }));

  const outputTax = revenue > 0 ? estimatedTax : 0;
  base.taxSummary = {
    outputTax,
    inputTax: 0,
    estimatedTaxPayable: estimatedTax,
    periodLabel: range === "12m" ? "過去12ヶ月" : range === "90d" ? "過去90日" : range === "7d" ? "過去7日" : "過去30日",
    note: String(raw?.taxSummary?.note ?? "実データ"),
  };

  base.alerts = asArray<any>(raw?.alerts).map((x, idx) => {
    const key = String(x?.key ?? `alert-${idx}`);
    return {
      id: key,
      type: alertTypeOf(key),
      severity: alertSeverityOf(String(x?.level ?? "info")),
      title: String(x?.title ?? "Alert"),
      description: x?.description ? String(x.description) : undefined,
      href:
        key.includes("inventory")
          ? "/ja/app/inventory/alerts"
          : key.includes("tax")
          ? "/ja/app/tax/summary"
          : key.includes("expense")
          ? "/ja/app/reports/expense"
          : "/ja/app/invoices/unpaid",
    };
  });

  const rawBusiness = raw?.businessHealth ?? {};
  const businessScore = Math.max(0, Math.min(100, toNum(rawBusiness.score, profit >= 0 ? 70 : 45)));

  const fallbackDimensions = [
    { label: "Revenue", score: Math.max(0, Math.min(100, revenue > 0 ? businessScore : 0)) },
    { label: "Profit", score: Math.max(0, Math.min(100, profit >= 0 ? businessScore : 35)) },
    { label: "Cash", score: Math.max(0, Math.min(100, cash > 0 ? businessScore : 20)) },
    { label: "Outstanding Payments", score: Math.max(0, Math.min(100, unpaidAmount > 0 ? 55 : 80)) },
  ];

  const fallbackInsights = [
    {
      id: "health-headline",
      title: String(rawBusiness.headline ?? (profit >= 0 ? "利益は黒字です" : "利益が悪化しています")),
      detail: rawBusiness.summary ? String(rawBusiness.summary) : undefined,
      tone: profit >= 0 ? ("good" as const) : ("warning" as const),
    },
    ...base.alerts.slice(0, 3).map((a, idx) => ({
      id: `alert-insight-${idx}`,
      title: a.title,
      detail: a.description,
      tone:
        a.severity === "critical"
          ? ("warning" as const)
          : a.severity === "warning"
          ? ("warning" as const)
          : ("default" as const),
    })),
  ];

  base.businessHealth = {
    score: businessScore,
    status: businessStatusOf(rawBusiness.status),
    dimensions: asArray<any>(rawBusiness.dimensions).length
      ? asArray<any>(rawBusiness.dimensions).map((d) => ({
          label: String(d?.label ?? "-"),
          score: Math.max(0, Math.min(100, toNum(d?.score))),
        }))
      : fallbackDimensions,
    insights: asArray<any>(rawBusiness.insights).length
      ? asArray<any>(rawBusiness.insights).map((it, idx) => ({
          id: String(it?.id ?? `insight-${idx}`),
          title: String(it?.title ?? "-"),
          detail: it?.detail ? String(it.detail) : undefined,
          tone:
            it?.tone === "good"
              ? "good"
              : it?.tone === "warning"
              ? "warning"
              : "default",
        }))
      : fallbackInsights,
  };

  base.recentTransactions = asArray<any>(raw?.recentTransactions).map<RecentTransactionItem>((x) => ({
    id: String(x?.id ?? ""),
    date: dateOnly(x?.occurredAt ?? new Date()),
    type: String(x?.direction === "EXPENSE" ? "支出" : "収入"),
    category: String(x?.categoryName ?? x?.sourceType ?? x?.type ?? "-"),
    amount: x?.direction === "EXPENSE" ? -Math.abs(toNum(x?.amount)) : Math.abs(toNum(x?.amount)),
    account: String(x?.accountName ?? "-"),
    store: String(x?.storeName ?? "-"),
    memo: x?.memo ? String(x.memo) : null,
  }));

  return base;
}
