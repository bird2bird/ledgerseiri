/**
 * Step109-Z1-H1-LEDGER-SCOPE-BASELINE
 *
 * Ledger Scope is the stable page ownership label.
 *
 * Page ownership MUST be decided by ledger_scope, not keyword inference.
 *
 * Rules after H-series:
 *   - ledger_scope decides which page owns the transaction.
 *   - ledger_subcategory decides the category inside that page.
 *   - keyword rules are allowed only as fallback for legacy data.
 */

export const LEDGER_SCOPES = {
  CASH_INCOME: "cash-income",
  STORE_ORDERS: "store-orders",
  OTHER_INCOME: "other-income",
  STORE_OPERATION_EXPENSE: "store-operation-expense",
  COMPANY_OPERATION_EXPENSE: "company-operation-expense",
  PAYROLL_EXPENSE: "payroll-expense",
  OTHER_EXPENSE: "other-expense",
} as const;

export type LedgerScope =
  (typeof LEDGER_SCOPES)[keyof typeof LEDGER_SCOPES];

export type LedgerDirection = "INCOME" | "EXPENSE";

export type LedgerTemplateColumn = {
  key: string;
  label: string;
  required: boolean;
  description: string;
};

export type LedgerScopeConfig = {
  scope: LedgerScope;
  direction: LedgerDirection;
  titleJa: string;
  routeHint: string;
  marker: string;
  templateFileName: string;
  subcategories: Array<{
    value: string;
    labelJa: string;
  }>;
  templateColumns: LedgerTemplateColumn[];
  sampleRow: Record<string, string | number>;
};

export const LEDGER_SCOPE_MARKER = "ledger-scope";
export const LEDGER_SUBCATEGORY_MARKER = "ledger-subcategory";

export const LEDGER_SCOPE_CONFIGS: Record<LedgerScope, LedgerScopeConfig> = {
  [LEDGER_SCOPES.CASH_INCOME]: {
    scope: LEDGER_SCOPES.CASH_INCOME,
    direction: "INCOME",
    titleJa: "現金収入",
    routeHint: "/app/income/cash",
    marker: "[ledger-scope:cash-income]",
    templateFileName: "cash-income-template.csv",
    subcategories: [
      { value: "cash-sales", labelJa: "現金売上" },
      { value: "cash-service", labelJa: "現金サービス収入" },
      { value: "cash-other", labelJa: "その他現金収入" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: cash-income" },
      { key: "occurred_at", label: "occurred_at", required: true, description: "発生日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "cash_account", label: "cash_account", required: true, description: "現金口座名" },
      { key: "income_source", label: "income_source", required: false, description: "収入元" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "cash-income",
      occurred_at: "2026/04/30",
      amount: 10000,
      currency: "JPY",
      cash_account: "現金口座",
      income_source: "店頭現金売上",
      memo: "現金売上",
    },
  },

  [LEDGER_SCOPES.STORE_ORDERS]: {
    scope: LEDGER_SCOPES.STORE_ORDERS,
    direction: "INCOME",
    titleJa: "店舗注文",
    routeHint: "/app/income/store-orders",
    marker: "[ledger-scope:store-orders]",
    templateFileName: "store-orders-template.csv",
    subcategories: [
      { value: "amazon-order", labelJa: "Amazon注文" },
      { value: "manual-order", labelJa: "手動注文" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: store-orders" },
      { key: "order_date", label: "order_date", required: true, description: "注文日 YYYY/MM/DD" },
      { key: "amazon_order_id", label: "amazon_order_id", required: true, description: "Amazon注文番号" },
      { key: "store", label: "store", required: true, description: "店舗名" },
      { key: "sku", label: "sku", required: false, description: "SKU。ASINとのどちらか必須" },
      { key: "asin", label: "asin", required: false, description: "ASIN。SKUとのどちらか必須" },
      { key: "product_name", label: "product_name", required: false, description: "商品名" },
      { key: "quantity", label: "quantity", required: true, description: "販売数量" },
      { key: "gross_sales", label: "gross_sales", required: true, description: "売上総額" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "store-orders",
      order_date: "2026/04/30",
      amazon_order_id: "503-xxxxxxx-xxxxxxx",
      store: "Amazon JP",
      sku: "SKU001",
      asin: "B0XXXXXXX",
      product_name: "商品A",
      quantity: 1,
      gross_sales: 3980,
      currency: "JPY",
      memo: "Amazon注文",
    },
  },

  [LEDGER_SCOPES.OTHER_INCOME]: {
    scope: LEDGER_SCOPES.OTHER_INCOME,
    direction: "INCOME",
    titleJa: "その他収入",
    routeHint: "/app/income/other",
    marker: "[ledger-scope:other-income]",
    templateFileName: "other-income-template.csv",
    subcategories: [
      { value: "service-income", labelJa: "サービス収入" },
      { value: "subsidy", labelJa: "補助金・助成金" },
      { value: "refund-adjustment", labelJa: "返金・調整入金" },
      { value: "misc-income", labelJa: "雑収入" },
      { value: "interest", labelJa: "受取利息" },
      { value: "other-income", labelJa: "その他収入" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: other-income" },
      { key: "occurred_at", label: "occurred_at", required: true, description: "発生日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "income_category", label: "income_category", required: true, description: "その他収入の区分" },
      { key: "account_name", label: "account_name", required: false, description: "入金口座。空欄の場合は未消込" },
      { key: "payer", label: "payer", required: false, description: "入金元" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "other-income",
      occurred_at: "2026/04/30",
      amount: 5000,
      currency: "JPY",
      income_category: "補助金・助成金",
      account_name: "楽天銀行",
      payer: "横浜市",
      memo: "補助金入金",
    },
  },

  [LEDGER_SCOPES.STORE_OPERATION_EXPENSE]: {
    scope: LEDGER_SCOPES.STORE_OPERATION_EXPENSE,
    direction: "EXPENSE",
    titleJa: "店舗運営費",
    routeHint: "/app/expenses/store-operation",
    marker: "[ledger-scope:store-operation-expense]",
    templateFileName: "store-operation-expense-template.csv",
    subcategories: [
      { value: "amazon-fee", labelJa: "Amazon手数料" },
      { value: "fba-fee", labelJa: "FBA手数料" },
      { value: "advertising", labelJa: "広告費" },
      { value: "shipping", labelJa: "配送費" },
      { value: "storage", labelJa: "保管料" },
      { value: "return-related", labelJa: "返品関連費" },
      { value: "other-store-operation", labelJa: "その他店舗運営費" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: store-operation-expense" },
      { key: "occurred_at", label: "occurred_at", required: true, description: "発生日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "expense_category", label: "expense_category", required: true, description: "店舗運営費の区分" },
      { key: "store", label: "store", required: true, description: "店舗名" },
      { key: "amazon_transaction_type", label: "amazon_transaction_type", required: false, description: "Amazon transaction type" },
      { key: "account_name", label: "account_name", required: false, description: "支払口座。空欄の場合は未消込" },
      { key: "evidence_no", label: "evidence_no", required: false, description: "証憑番号" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "store-operation-expense",
      occurred_at: "2026/04/30",
      amount: 16544,
      currency: "JPY",
      expense_category: "広告費",
      store: "Amazon JP",
      amazon_transaction_type: "AdvertisingFee",
      account_name: "三井住友銀行",
      evidence_no: "INV-001",
      memo: "Amazon広告費",
    },
  },

  [LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE]: {
    scope: LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE,
    direction: "EXPENSE",
    titleJa: "会社運営費",
    routeHint: "/app/expenses?category=other",
    marker: "[ledger-scope:company-operation-expense]",
    templateFileName: "company-operation-expense-template.csv",
    subcategories: [
      { value: "rent", labelJa: "家賃・地代" },
      { value: "utilities", labelJa: "水道光熱費" },
      { value: "communication", labelJa: "通信費" },
      { value: "software", labelJa: "SaaS・システム" },
      { value: "office", labelJa: "消耗品・備品" },
      { value: "accounting-tax", labelJa: "会計・税理士" },
      { value: "other-company-operation", labelJa: "その他会社運営費" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: company-operation-expense" },
      { key: "occurred_at", label: "occurred_at", required: true, description: "発生日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "expense_category", label: "expense_category", required: true, description: "会社運営費の区分" },
      { key: "vendor", label: "vendor", required: false, description: "支払先" },
      { key: "account_name", label: "account_name", required: false, description: "支払口座。空欄の場合は未消込" },
      { key: "invoice_no", label: "invoice_no", required: false, description: "請求書番号" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "company-operation-expense",
      occurred_at: "2026/04/30",
      amount: 2980,
      currency: "JPY",
      expense_category: "SaaS・システム",
      vendor: "OpenAI",
      account_name: "楽天銀行",
      invoice_no: "INV-20260430",
      memo: "ChatGPT利用料",
    },
  },

  [LEDGER_SCOPES.PAYROLL_EXPENSE]: {
    scope: LEDGER_SCOPES.PAYROLL_EXPENSE,
    direction: "EXPENSE",
    titleJa: "給与",
    routeHint: "/app/expenses?category=payroll",
    marker: "[ledger-scope:payroll-expense]",
    templateFileName: "payroll-expense-template.csv",
    subcategories: [
      { value: "salary", labelJa: "給与" },
      { value: "executive", labelJa: "役員報酬" },
      { value: "outsourcing", labelJa: "外注人件費" },
      { value: "social", labelJa: "社会保険・福利厚生" },
      { value: "withholding-tax", labelJa: "源泉所得税" },
      { value: "other-payroll", labelJa: "その他給与関連" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: payroll-expense" },
      { key: "payment_date", label: "payment_date", required: true, description: "支払日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "payroll_category", label: "payroll_category", required: true, description: "給与区分" },
      { key: "payee", label: "payee", required: true, description: "支払対象者" },
      { key: "account_name", label: "account_name", required: false, description: "支払口座。空欄の場合は未消込" },
      { key: "evidence_no", label: "evidence_no", required: false, description: "証憑番号" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "payroll-expense",
      payment_date: "2026/04/30",
      amount: 250000,
      currency: "JPY",
      payroll_category: "給与",
      payee: "山田太郎",
      account_name: "三井住友銀行",
      evidence_no: "PAY-202604",
      memo: "4月給与",
    },
  },

  [LEDGER_SCOPES.OTHER_EXPENSE]: {
    scope: LEDGER_SCOPES.OTHER_EXPENSE,
    direction: "EXPENSE",
    titleJa: "その他支出",
    routeHint: "/app/other-expense",
    marker: "[ledger-scope:other-expense]",
    templateFileName: "other-expense-template.csv",
    subcategories: [
      { value: "misc", labelJa: "雑費" },
      { value: "bank", labelJa: "手数料" },
      { value: "tax", labelJa: "税金・公課" },
      { value: "adjustment", labelJa: "調整・返金" },
      { value: "other", labelJa: "その他" },
    ],
    templateColumns: [
      { key: "ledger_scope", label: "ledger_scope", required: true, description: "固定値: other-expense" },
      { key: "occurred_at", label: "occurred_at", required: true, description: "発生日 YYYY/MM/DD" },
      { key: "amount", label: "amount", required: true, description: "金額。正数で入力" },
      { key: "currency", label: "currency", required: true, description: "通常 JPY" },
      { key: "expense_category", label: "expense_category", required: true, description: "その他支出の区分" },
      { key: "vendor", label: "vendor", required: false, description: "支払先" },
      { key: "account_name", label: "account_name", required: false, description: "支払口座。空欄の場合は未消込" },
      { key: "invoice_no", label: "invoice_no", required: false, description: "請求書番号" },
      { key: "memo", label: "memo", required: false, description: "メモ" },
    ],
    sampleRow: {
      ledger_scope: "other-expense",
      occurred_at: "2026/04/30",
      amount: 1100,
      currency: "JPY",
      expense_category: "雑費",
      vendor: "不明",
      account_name: "現金口座",
      invoice_no: "",
      memo: "その他支出",
    },
  },
};

export function getLedgerScopeConfig(scope: LedgerScope) {
  return LEDGER_SCOPE_CONFIGS[scope];
}

export function isLedgerScope(value: string): value is LedgerScope {
  return Object.values(LEDGER_SCOPES).includes(value as LedgerScope);
}

export function normalizeLedgerScope(value?: string | null): LedgerScope | "" {
  const normalized = String(value || "").trim().toLowerCase();
  return isLedgerScope(normalized) ? normalized : "";
}

export function buildLedgerScopeMarker(scope: LedgerScope) {
  return `[${LEDGER_SCOPE_MARKER}:${scope}]`;
}

export function buildLedgerSubcategoryMarker(subcategory: string) {
  return `[${LEDGER_SUBCATEGORY_MARKER}:${subcategory}]`;
}

export function readLedgerMarker(text: string | null | undefined, marker: string) {
  const raw = String(text || "");
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[${escaped}:([^\\]]+)\\]`, "i");
  const match = raw.match(regex);
  return match?.[1]?.trim() || "";
}

export function readLedgerScopeFromText(text: string | null | undefined) {
  return normalizeLedgerScope(readLedgerMarker(text, LEDGER_SCOPE_MARKER));
}

export function readLedgerSubcategoryFromText(text: string | null | undefined) {
  return readLedgerMarker(text, LEDGER_SUBCATEGORY_MARKER).trim().toLowerCase();
}

export function appendLedgerMarkersToMemo(args: {
  memo?: string | null;
  scope: LedgerScope;
  subcategory?: string | null;
}) {
  const visibleMemo = String(args.memo || "").trim();
  const markers = [buildLedgerScopeMarker(args.scope)];

  if (args.subcategory) {
    markers.push(buildLedgerSubcategoryMarker(args.subcategory));
  }

  return [visibleMemo, ...markers].filter(Boolean).join(" ").trim();
}

export function stripLedgerMarkersFromMemo(memo?: string | null) {
  return String(memo || "")
    .replace(/\[ledger-scope:[^\]]+\]/gi, "")
    .replace(/\[ledger-subcategory:[^\]]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function convertLegacyExpenseKindToLedgerScope(value?: string | null): LedgerScope | "" {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "company-operation" ||
    normalized === "company_operation" ||
    normalized === "company-ops" ||
    normalized === "company_ops"
  ) {
    return LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE;
  }

  if (normalized === "payroll" || normalized === "salary") {
    return LEDGER_SCOPES.PAYROLL_EXPENSE;
  }

  if (
    normalized === "other-expense" ||
    normalized === "other_expense" ||
    normalized === "other" ||
    normalized === "misc"
  ) {
    return LEDGER_SCOPES.OTHER_EXPENSE;
  }

  return "";
}

export function readLedgerScopeWithLegacyFallback(text: string | null | undefined) {
  const scope = readLedgerScopeFromText(text);
  if (scope) return scope;

  const legacyExpenseKind = readLedgerMarker(text, "expense-kind");
  return convertLegacyExpenseKindToLedgerScope(legacyExpenseKind);
}

function escapeCsvCell(value: string | number | null | undefined) {
  const raw = String(value ?? "");
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildLedgerTemplateCsv(scope: LedgerScope) {
  const config = getLedgerScopeConfig(scope);
  const headers = config.templateColumns.map((column) => column.key);
  const sample = headers.map((key) => config.sampleRow[key] ?? "");

  return [
    headers.map(escapeCsvCell).join(","),
    sample.map(escapeCsvCell).join(","),
  ].join("\n");
}

export function validateLedgerTemplateScope(args: {
  currentScope: LedgerScope;
  rowScope: string | null | undefined;
}) {
  const rowScope = normalizeLedgerScope(args.rowScope);

  if (!rowScope) {
    return {
      ok: false,
      code: "missing_ledger_scope",
      messageJa: "ledger_scope が未入力です。現在ページのテンプレートをダウンロードして再取込してください。",
    } as const;
  }

  if (rowScope !== args.currentScope) {
    return {
      ok: false,
      code: "ledger_scope_mismatch",
      messageJa: `このファイルは現在のページ用テンプレートではありません。現在ページ: ${args.currentScope} / ファイル内: ${rowScope}`,
    } as const;
  }

  return {
    ok: true,
    code: "ok",
    messageJa: "ledger_scope が一致しています。",
  } as const;
}
