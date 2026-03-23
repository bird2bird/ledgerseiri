import type {
  AccountBalanceItem,
  BusinessHealthData,
  DashboardAlert,
  DashboardHomeData,
  DashboardRange,
  ExpenseBreakdownItem,
  RecentTransactionItem,
  RevenueProfitPoint,
  CashFlowPoint,
} from "@/components/app/dashboard-v2/types";
import { getAlertHref, getSummaryCardHref } from "@/components/app/dashboard-v2/dashboard-linking";
import { TenantSuspendedError, ensureNotTenantSuspended } from "@/core/tenant-suspended";

type FetchDashboardSummaryArgs = {
  token?: string | null;
  storeId?: string;
  range?: string;
  locale?: string;
};

function money(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

async function readJson<T>(res: Response): Promise<T> {
  await ensureNotTenantSuspended(res);
  return (await res.json()) as T;
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function dateOnly(v: string | Date) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function accountTypeOf(v: unknown): AccountBalanceItem["accountType"] {
  const s = String(v ?? "").toUpperCase();
  if (s === "BANK") return "bank";
  if (s === "CASH") return "cash";
  if (s === "PLATFORM") return "platform";
  if (s === "PAYMENT") return "payment";
  return "bank";
}

function normalizeRange(v?: string): DashboardRange {
  if (v === "7d" || v === "30d" || v === "90d" || v === "12m") return v;
  return "30d";
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
      periodLabel: "過去30日",
      note: "current-period estimate",
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

function rangeLabel(range: DashboardRange) {
  if (range === "7d") return "過去7日";
  if (range === "90d") return "過去90日";
  if (range === "12m") return "過去12ヶ月";
  return "過去30日";
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
    if (err instanceof TenantSuspendedError || (err as any)?.message === "TENANT_SUSPENDED") {
      throw err;
    }
    console.error("fetchDashboardSummary failed:", err);
    return emptyDashboard(normalizeRange(args.range), args.storeId ?? "all");
  }

  const summary = raw?.summary ?? {};
  const filters = raw?.filters ?? {};

  const range = normalizeRange(filters.range ?? args.range);
  const storeId = String(filters.storeId ?? args.storeId ?? "all");
  const totalCash = toNum(summary.cash);
  const uiLang = args.locale ?? "ja";

  const cashBalances: AccountBalanceItem[] = asArray<any>(raw?.cashBalances).map((x: any) => ({
    accountId: String(x.id ?? ""),
    accountName: String(x.name ?? "-"),
    accountType: accountTypeOf(x.type),
    balance: toNum(x.balance),
    currency: "JPY",
    sharePct: totalCash > 0 ? Math.round((toNum(x.balance) / totalCash) * 100) : 0,
  }));

  const revenueProfitTrend: RevenueProfitPoint[] = asArray<any>(raw?.revenueProfitTrend).map((x: any) => ({
    label: String(x.label ?? "-"),
    revenue: toNum(x.revenue),
    profit: toNum(x.profit),
  }));

  const cashFlowTrend: CashFlowPoint[] = asArray<any>(raw?.cashFlowTrend).map((x: any) => ({
    label: String(x.label ?? "-"),
    cashIn: toNum(x.income ?? x.cashIn),
    cashOut: toNum(x.expense ?? x.cashOut),
    netCash: toNum(x.net ?? x.netCash),
  }));

  const expenseBreakdown: ExpenseBreakdownItem[] = asArray<any>(raw?.expenseBreakdown).map((x: any) => ({
    category: String(x.label ?? x.category ?? "-"),
    amount: toNum(x.amount),
    pct: toNum(x.share ?? x.pct),
  }));

  const alerts: DashboardAlert[] = asArray<any>(raw?.alerts).map((x: any, idx: number) => {
    const alertType: DashboardAlert["type"] =
      x.key === "unpaid"
        ? "invoice"
        : x.key === "inventory" || x.key === "inventoryAlert"
        ? "inventory"
        : x.key === "tax"
        ? "tax"
        : x.key === "cash"
        ? "cash"
        : "expense";

    return {
      id: String(x.id ?? x.key ?? `alert-${idx}`),
      type: alertType,
      severity: x.level === "critical" ? "critical" : x.level === "warning" ? "warning" : "info",
      title: String(x.title ?? "Alert"),
      description: x.description ? String(x.description) : undefined,
      href: getAlertHref(x.key, alertType, uiLang) ?? `/${uiLang}/app`,
    };
  });

  const rawBusiness = raw?.businessHealth ?? {};
  const dimensions = asArray<any>(rawBusiness.dimensions).map((x: any) => ({
    label: String(x.label ?? "-"),
    score: toNum(x.score),
  }));

  const insights = asArray<any>(rawBusiness.insights).map((x: any, idx: number) => ({
    id: String(x.id ?? `insight-${idx}`),
    title: String(x.title ?? "-"),
    detail: x.detail ? String(x.detail) : undefined,
    tone: x.tone === "good" || x.tone === "warning" ? x.tone : "default",
  }));

  const fallbackInsight =
    !insights.length && (rawBusiness.headline || rawBusiness.summary)
      ? [
          {
            id: "summary",
            title: String(rawBusiness.headline ?? "経営状態の要約"),
            detail: rawBusiness.summary ? String(rawBusiness.summary) : undefined,
            tone: "default" as const,
          },
        ]
      : [];

  const businessHealth: BusinessHealthData = {
    score: toNum(rawBusiness.score),
    status:
      rawBusiness.status === "good" || rawBusiness.status === "risk"
        ? rawBusiness.status
        : "attention",
    dimensions,
    insights: insights.length ? insights : fallbackInsight,
  };

  const recentTransactions: RecentTransactionItem[] = asArray<any>(raw?.recentTransactions).map((x: any) => ({
    id: String(x.id ?? ""),
    date: dateOnly(x.occurredAt ?? x.date ?? new Date()),
    type: x.direction === "EXPENSE" ? "支出" : "収入",
    category: String(x.categoryName ?? x.type ?? x.sourceType ?? "-"),
    amount: x.direction === "EXPENSE" ? -Math.abs(toNum(x.amount)) : Math.abs(toNum(x.amount)),
    account: String(x.accountName ?? "-"),
    store: String(x.storeName ?? "-"),
    memo: x.memo ? String(x.memo) : null,
  }));

  const kpiPrimary = [
    { key: "revenue", label: "今月収入", value: money(toNum(summary.revenue)), deltaText: "-", trend: "neutral" as const, tone: "profit" as const, href: getSummaryCardHref("revenue", uiLang) ?? undefined },
    { key: "expense", label: "今月支出", value: money(toNum(summary.expense)), deltaText: "-", trend: "neutral" as const, tone: "warning" as const, href: getSummaryCardHref("expense", uiLang) ?? undefined },
    { key: "profit", label: "今月利益", value: money(toNum(summary.profit)), deltaText: "-", trend: "neutral" as const, tone: "profit" as const, href: getSummaryCardHref("profit", uiLang) ?? undefined },
    { key: "cash", label: "総資金", value: money(toNum(summary.cash)), deltaText: "-", trend: "neutral" as const, tone: "info" as const, href: getSummaryCardHref("cash", uiLang) ?? undefined },
    { key: "tax", label: "消費税概算", value: money(toNum(summary.estimatedTax)), subLabel: "今期見込み", tone: "default" as const, href: getSummaryCardHref("tax", uiLang) ?? undefined },
  ];

  const kpiSecondary = [
    { key: "invoice", label: "未入金", value: money(toNum(summary.unpaidAmount)), subLabel: `${toNum(summary.unpaidCount)}件`, tone: "warning" as const, href: getSummaryCardHref("invoice", uiLang) ?? undefined },
    { key: "inventory", label: "在庫金額", value: money(toNum(summary.inventoryValue)), subLabel: "全店舗合計", tone: "default" as const, href: getSummaryCardHref("inventory", uiLang) ?? undefined },
    { key: "stockAlert", label: "在庫アラート", value: `${toNum(summary.inventoryAlertCount)}件`, subLabel: "補充が必要", tone: "danger" as const, href: getSummaryCardHref("stockAlert", uiLang) ?? undefined },
    { key: "runway", label: "資金余力", value: `${toNum(summary.runwayMonths).toFixed(1)}ヶ月`, subLabel: "現在の支出ペース", tone: "info" as const, href: getSummaryCardHref("runway", uiLang) ?? undefined },
  ];

  return {
    filters: {
      range,
      storeId,
      refreshedAt: new Date().toISOString(),
    },

    kpiPrimary,
    kpiSecondary,

    revenueProfitTrend,
    cashBalances,
    expenseBreakdown,
    cashFlowTrend,
    taxSummary: {
      outputTax: toNum(summary.estimatedTax),
      inputTax: 0,
      estimatedTaxPayable: toNum(summary.estimatedTax),
      periodLabel: rangeLabel(range),
      note: String(raw?.taxSummary?.note ?? "current-period estimate"),
    },
    alerts,
    businessHealth,
    recentTransactions,
    quickActions: emptyDashboard(range, storeId).quickActions,
  };
}
