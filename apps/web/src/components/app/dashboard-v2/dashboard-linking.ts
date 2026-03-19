export type DashboardLang = "ja" | "en" | "zh-CN" | "zh-TW";

export type DashboardLinkTarget =
  | "revenue"
  | "expense"
  | "profit"
  | "cash"
  | "tax"
  | "invoice"
  | "inventory"
  | "stockAlert"
  | "runway"
  | "invoiceIssued"
  | "invoiceHistory"
  | "aiInsights";

function normalizeLang(lang?: string): DashboardLang {
  if (lang === "en") return "en";
  if (lang === "zh-CN") return "zh-CN";
  if (lang === "zh-TW") return "zh-TW";
  return "ja";
}

export function buildDashboardTargetHref(
  target: DashboardLinkTarget,
  lang?: string
): string {
  const l = normalizeLang(lang);

  switch (target) {
    case "revenue":
      return `/${l}/app/income`;
    case "expense":
      return `/${l}/app/expenses`;
    case "profit":
      return `/${l}/app/reports/profit`;
    case "cash":
      return `/${l}/app/accounts`;
    case "tax":
      return `/${l}/app/tax/summary`;
    case "invoice":
      return `/${l}/app/invoices/unpaid`;
    case "inventory":
      return `/${l}/app/products`;
    case "stockAlert":
      return `/${l}/app/inventory/alerts`;
    case "runway":
      return `/${l}/app/reports/cashflow`;
    case "invoiceIssued":
      return `/${l}/app/invoices`;
    case "invoiceHistory":
      return `/${l}/app/invoices/history`;
      case "aiInsights":
        return `/${l}/app/ai-insights`;

    default:
      return `/${l}/app`;
  }
}

export function getSummaryCardHref(key: string, lang?: string): string | null {
  switch (key) {
    case "revenue":
      return buildDashboardTargetHref("revenue", lang);
    case "expense":
      return buildDashboardTargetHref("expense", lang);
    case "profit":
      return buildDashboardTargetHref("profit", lang);
    case "cash":
      return buildDashboardTargetHref("cash", lang);
    case "tax":
      return buildDashboardTargetHref("tax", lang);
    case "invoice":
      return buildDashboardTargetHref("invoice", lang);
    case "inventory":
      return buildDashboardTargetHref("inventory", lang);
    case "stockAlert":
      return buildDashboardTargetHref("stockAlert", lang);
    case "runway":
      return buildDashboardTargetHref("runway", lang);
    default:
      return null;
  }
}

export function getAlertHref(
  key?: string,
  type?: string,
  lang?: string
): string | null {
  if (key === "unpaid" || type === "invoice") {
    return buildDashboardTargetHref("invoice", lang);
  }

  if (
    key === "inventory" ||
    key === "inventoryAlert" ||
    type === "inventory"
  ) {
    return buildDashboardTargetHref("stockAlert", lang);
  }

  if (key === "tax" || type === "tax") {
    return buildDashboardTargetHref("tax", lang);
  }

  if (key === "cash" || type === "cash") {
    return buildDashboardTargetHref("cash", lang);
  }

  return null;
}

export function getAlertsOverviewHref(lang?: string): string {
  return buildDashboardTargetHref("invoice", lang);
}

export function getInvoiceStatsHref(
  kind: "issued" | "unpaid" | "history",
  lang?: string
): string {
  switch (kind) {
    case "issued":
      return buildDashboardTargetHref("invoiceIssued", lang);
    case "unpaid":
      return buildDashboardTargetHref("invoice", lang);
    case "history":
      return buildDashboardTargetHref("invoiceHistory", lang);
    default:
      return buildDashboardTargetHref("invoiceIssued", lang);
  }
}

export function getTaxSummaryHref(lang?: string): string {
  return buildDashboardTargetHref("tax", lang);
}

export function getCashBalancesOverviewHref(lang?: string): string {
  const l = normalizeLang(lang);
  return `/${l}/app/account-balances?from=dashboard&view=all&sort=balance_desc`;
}

export function getCashBalanceItemHref(lang?: string): string {
  const l = normalizeLang(lang);
  return `/${l}/app/account-balances?from=dashboard&view=all&sort=balance_desc`;
}

export function getRecentTransactionsOverviewHref(lang?: string): string {
  const l = normalizeLang(lang);
  return `/${l}/app/journals`;
}

export function getRevenueProfitTrendOverviewHref(lang?: string): string {
  return buildDashboardTargetHref("profit", lang);
}

export function getRevenueProfitPointHref(lang?: string): string {
  return buildDashboardTargetHref("profit", lang);
}

export function getCashFlowTrendOverviewHref(lang?: string): string {
  return buildDashboardTargetHref("runway", lang);
}

export function getCashFlowPointHref(lang?: string): string {
  return buildDashboardTargetHref("runway", lang);
}

export function getExpenseBreakdownOverviewHref(lang?: string): string {
  return buildDashboardTargetHref("expense", lang);
}

export function getExpenseBreakdownItemHref(category?: string, lang?: string): string {
  const l = normalizeLang(lang);
  const c = String(category ?? "").trim();

  if (!c) return `/${l}/app/expenses`;
  if (c.includes("広告")) return `/${l}/app/expenses?category=advertising`;
  if (c.includes("物流")) return `/${l}/app/expenses?category=logistics`;
  if (c.includes("給与")) return `/${l}/app/expenses?category=payroll`;
  if (c.includes("仕入")) return `/${l}/app/purchases`;

  return `/${l}/app/expenses`;
}

export function getRecentTransactionItemHref(
  item: { type?: string; amount?: number } | undefined,
  lang?: string
): string {
  const l = normalizeLang(lang);

  if (!item) return `/${l}/app/journals`;

  const t = String(item.type ?? "");
  const amt = Number(item.amount ?? 0);

  if (t.includes("支出") || amt < 0) return `/${l}/app/expenses`;
  if (t.includes("収入") || amt >= 0) return `/${l}/app/income`;

  return `/${l}/app/journals`;
}

export function normalizeDashboardHref(href?: string, lang?: string): string {
  const l = normalizeLang(lang);
  const raw = String(href ?? "").trim();

  if (!raw) return `/${l}/app`;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  if (raw.startsWith("/app")) return `/${l}${raw}`;
  if (raw.startsWith("/ja/app") || raw.startsWith("/en/app") || raw.startsWith("/zh-CN/app") || raw.startsWith("/zh-TW/app")) {
    return raw.replace(/^\/(ja|en|zh-CN|zh-TW)\//, `/${l}/`);
  }

  if (raw.startsWith("/")) return raw;
  return `/${l}/app`;
}

export function getBusinessHealthInsightHref(title?: string, lang?: string): string {
  const t = String(title ?? "");

  if (/Revenue|売上|収入/i.test(t)) return buildDashboardTargetHref("revenue", lang);
  if (/Profit|利益|Margin/i.test(t)) return buildDashboardTargetHref("profit", lang);
  if (/Cash|資金|Runway/i.test(t)) return buildDashboardTargetHref("cash", lang);
  if (/Inventory|在庫/i.test(t)) return buildDashboardTargetHref("stockAlert", lang);
  if (/Payment|未入金|Outstanding/i.test(t)) return buildDashboardTargetHref("invoice", lang);

  return getBusinessHealthOverviewHref(lang);
}

export function getQuickActionHref(href?: string, lang?: string): string {
  return normalizeDashboardHref(href, lang);
}

export function getBusinessHealthOverviewHref(lang?: string): string {
  const l = normalizeLang(lang);
  return `/${l}/app/reports/profit`;
}

export function getBusinessHealthLockedHref(lang?: string): string {
  const l = normalizeLang(lang);
  return `/${l}/app/billing/change`;
}

export function getAiInsightsHref(lang?: string): string {
  return buildDashboardTargetHref("aiInsights", lang);
}



export function getAccountsPageHref(
  lang?: string,
  params?: { from?: string; storeId?: string; range?: string; view?: string; sort?: string }
): string {
  const l = normalizeLang(lang)
  const qs = new URLSearchParams()

  if (params?.from) qs.set("from", params.from)
  if (params?.storeId) qs.set("storeId", params.storeId)
  if (params?.range) qs.set("range", params.range)
  if (params?.view) qs.set("view", params.view)
  if (params?.sort) qs.set("sort", params.sort)

  const q = qs.toString()
  return q ? `/${l}/app/accounts?${q}` : `/${l}/app/accounts`
}

export function getAccountBalancesPageHref(
  lang?: string,
  params?: { from?: string; storeId?: string; range?: string; view?: string; sort?: string }
): string {
  const l = normalizeLang(lang)
  const qs = new URLSearchParams()

  if (params?.from) qs.set("from", params.from)
  if (params?.storeId) qs.set("storeId", params.storeId)
  if (params?.range) qs.set("range", params.range)
  if (params?.view) qs.set("view", params.view)
  if (params?.sort) qs.set("sort", params.sort)

  const q = qs.toString()
  return q ? `/${l}/app/account-balances?${q}` : `/${l}/app/account-balances`
}

export const DASHBOARD_LINKING_AUDIT = {
  businessHealth: [
    "getBusinessHealthOverviewHref",
    "getBusinessHealthLockedHref",
  ],

  summary: [
    "getSummaryCardHref",
    "getInvoiceStatsHref",
  ],
  alerts: [
    "getAlertHref",
    "getAlertsOverviewHref",
  ],
  tax: [
    "getTaxSummaryHref",
  ],
  cash: [
    "getCashBalancesOverviewHref",
    "getCashBalanceItemHref",
    "getCashFlowTrendOverviewHref",
    "getCashFlowPointHref",
  ],
  recentTransactions: [
    "getRecentTransactionsOverviewHref",
    "getRecentTransactionItemHref",
  ],
  trends: [
    "getRevenueProfitTrendOverviewHref",
    "getRevenueProfitPointHref",
  ],
  expense: [
    "getExpenseBreakdownOverviewHref",
    "getExpenseBreakdownItemHref",
  ],
  quickActions: [
    "getQuickActionHref",
  ],
  accounts: [
    "getAccountsPageHref",
    "getAccountBalancesPageHref",
  ],
    ai: [
      "getAiInsightsHref",
    ],
} as const;

