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
  | "invoiceHistory";

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
