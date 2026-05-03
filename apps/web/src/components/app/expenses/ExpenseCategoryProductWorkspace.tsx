"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LedgerTemplateDownloadButton } from "@/components/app/ledger/LedgerTemplateDownloadButton";
import { ExpenseImportDialog } from "@/components/app/imports/ExpenseImportDialog";
import { ExpenseImportHistoryPanel } from "@/components/app/imports/ExpenseImportHistoryPanel";
import { listTransactions, updateTransaction, type TransactionItem } from "@/core/transactions/api";
import type { ExpenseImportHistoryModule } from "@/core/imports/api";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import {
  LEDGER_SCOPES,
  appendLedgerMarkersToMemo,
  readLedgerScopeWithLegacyFallback,
  readLedgerSubcategoryFromText,
  stripLedgerMarkersFromMemo,
  type LedgerScope,
} from "@/core/ledger/ledger-scopes";

export type ExpenseCategoryProductKind =
  | "company-operation"
  | "payroll"
  | "other-expense";

type ExpenseCategoryRecord = {
  id: string;
  date: string;
  sortAt: string;
  categoryLabel: string;
  amount: number;
  account: string;
  vendor: string;
  memo: string;
  source: string;
  statusFlags: string[];
  rawMemo: string;
  ledgerScope: string;
  ownershipMode: "ledger-scope" | "legacy-expense-kind" | "legacy-unscoped-default";
  importJobId: string;
  sourceRowNo: string;
  sourceFileName: string;
};


type ExpenseClassificationDebugRow = {
  id: string;
  decidedKind: ExpenseCategoryProductKind | "store-operation";
  bucket: string;
  reason: string;
  amount: number;
  occurredAt: string;
  type: string;
  sourceType: string;
  categoryName: string;
  memo: string;
  importJobId: string;
  sourceFileName: string;
  ledgerScope: string;
  ledgerSubcategory: string;
  ownershipMode: "ledger-scope" | "legacy-expense-kind" | "legacy-unscoped-default";
  searchText: string;
};

type DashboardPoint = {
  key: string;
  label: string;
  fullDate: string;
  amount: number;
  count: number;
  start: Date;
};

type RangePreset = "30d" | "90d" | "12m";
type SortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

// Step109-Z1-H11-M-G-EXPENSE-CATEGORY-TRACE-HIGHLIGHT:
// Import Center transaction trace highlights shared expense-category rows.
type ExpenseCategoryTraceSelectionInfo = {
  active: boolean;
  transactionId: string;
  importJobId: string;
  sourceRowNo: string;
  module: string;
  traceTarget: string;
};

function readExpenseCategoryTraceSelectionInfo(
  searchParams: URLSearchParams,
  expectedModule: string,
  kind: ExpenseCategoryProductKind
): ExpenseCategoryTraceSelectionInfo {
  const fromImportTrace = searchParams.get("from") === "import-center-trace";
  const domain = String(searchParams.get("domain") || "").trim();
  const module = String(searchParams.get("module") || "").trim();
  const traceTarget = String(searchParams.get("traceTarget") || "").trim();
  const category = String(searchParams.get("category") || "").trim();

  const expected = String(expectedModule || "").trim();
  const moduleMatches = module === expected;

  const targetMatches =
    traceTarget === "expense-category" ||
    traceTarget === "other-expense" ||
    traceTarget === expected ||
    (!traceTarget && domain === "ledger");

  const categoryMatches =
    !category ||
    category === kind ||
    (kind === "company-operation" && category === "company-operation") ||
    (kind === "payroll" && category === "payroll") ||
    (kind === "other-expense" && category === "other-expense");

  const active =
    fromImportTrace &&
    domain === "ledger" &&
    Boolean(searchParams.get("transactionId")) &&
    moduleMatches &&
    targetMatches &&
    categoryMatches;

  return {
    active,
    transactionId: searchParams.get("transactionId") || "",
    importJobId: searchParams.get("importJobId") || "",
    sourceRowNo: searchParams.get("sourceRowNo") || "",
    module,
    traceTarget,
  };
}

function clearExpenseCategoryTraceSelectionUrl() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.delete("from");
  url.searchParams.delete("transactionId");
  url.searchParams.delete("importJobId");
  url.searchParams.delete("sourceRowNo");
  url.searchParams.delete("module");
  url.searchParams.delete("domain");
  url.searchParams.delete("traceTarget");

  const query = url.searchParams.toString();
  window.history.replaceState(null, "", query ? `${url.pathname}?${query}` : url.pathname);
}


const PAGE_CONFIG: Record<
  ExpenseCategoryProductKind,
  {
    title: string;
    subtitle: string;
    sourceLabel: string;
    totalLabel: string;
    primaryAction: string;
    importLabel: string;
    settingLabel: string;
    badgeLabel: string;
    scope: string;
  }
> = {
  "company-operation": {
    title: "会社運営費",
    subtitle:
      "家賃、通信費、ソフトウェア、消耗品など、会社運営に関わる支出をその他収入ページと同じ操作感で管理します。",
    sourceLabel: "運営費区分選択",
    totalLabel: "表示中の会社運営費",
    primaryAction: "新規会社運営費",
    importLabel: "会社運営費CSV/Excel取込",
    settingLabel: "支払先/証憑設定",
    badgeLabel: "会社運営費",
    scope: "company-operation-expense",
  },
  payroll: {
    title: "給与",
    subtitle:
      "給与、役員報酬、外注人件費などの支出を一覧、集計、証憑確認まで一画面で管理します。",
    sourceLabel: "給与区分選択",
    totalLabel: "表示中の給与支出",
    primaryAction: "新規給与支出",
    importLabel: "給与CSV/Excel取込",
    settingLabel: "給与/証憑設定",
    badgeLabel: "給与",
    scope: "payroll-expense",
  },
  "other-expense": {
    title: "その他支出",
    subtitle:
      "広告費・物流費・給与・会社運営費に分類しきれない支出を整理し、銀行流水・証憑との未消込を確認します。",
    sourceLabel: "支出区分選択",
    totalLabel: "表示中のその他支出",
    primaryAction: "新規その他支出",
    importLabel: "その他支出CSV/Excel取込",
    settingLabel: "支出/証憑設定",
    badgeLabel: "その他支出",
    scope: "other-expense",
  },
};

const KIND_OPTIONS: Record<
  ExpenseCategoryProductKind,
  Array<{ value: string; label: string }>
> = {
  "company-operation": [
    { value: "all", label: "全会社運営費" },
    { value: "rent", label: "家賃・地代" },
    { value: "utilities", label: "水道光熱費" },
    { value: "communication", label: "通信費" },
    { value: "software", label: "SaaS・システム" },
    { value: "office", label: "消耗品・備品" },
    { value: "accounting-tax", label: "会計・税理士" },
    { value: "other-company-operation", label: "その他会社運営費" },
  ],
  payroll: [
    { value: "all", label: "全給与" },
    { value: "salary", label: "給与" },
    { value: "executive", label: "役員報酬" },
    { value: "outsourcing", label: "外注人件費" },
    { value: "social", label: "社会保険・福利厚生" },
    { value: "withholding-tax", label: "源泉所得税" },
    { value: "other-payroll", label: "その他給与関連" },
  ],
  "other-expense": [
    { value: "all", label: "全その他支出" },
    { value: "misc", label: "雑費" },
    { value: "bank", label: "手数料" },
    { value: "tax", label: "税金・公課" },
    { value: "adjustment", label: "調整・返金" },
    { value: "other", label: "その他" },
  ],
};

function parseExpenseDateMs(item: TransactionItem) {
  const raw = String(item.occurredAt || item.createdAt || "");
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = cloneDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatCompactDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}


// Step109-Z1-G3-EXPENSE-CLASSIFICATION-PRECISION:
// Classification uses multiple transaction surfaces instead of memo-only matching.
// This keeps the current routes stable while reducing false fall-through into その他支出.
function getExpenseSearchText(item: TransactionItem) {
  return normalizeText(
    [
      item.type,
      item.direction,
      item.sourceType,
      item.categoryId,
      item.categoryName,
      item.memo,
      item.accountName,
      item.storeName,
      item.storeId,
      item.externalRef,
      item.importJobId,
      item.businessMonth,
      item.sourceFileName,
      item.sku,
      item.productName,
      item.fulfillment,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getExpenseCategoryText(item: TransactionItem) {
  return normalizeText(
    [
      item.type,
      item.sourceType,
      item.categoryName,
      item.memo,
      item.externalRef,
      item.importJobId,
      item.sourceFileName,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function classifyCompanyOperationBucket(text: string) {
  if (
    includesAny(text, [
      "家賃",
      "地代",
      "rent",
      "office rent",
      "賃料",
      "lease",
    ])
  ) return "rent";

  if (
    includesAny(text, [
      "水道",
      "光熱",
      "電気",
      "ガス",
      "gas",
      "utility",
      "utilities",
      "water",
      "electric",
      "electricity",
    ])
  ) return "utilities";

  if (
    includesAny(text, [
      "saas",
      "software",
      "ソフトウェア",
      "システム",
      "サーバ",
      "server",
      "cloud",
      "クラウド",
      "aws",
      "google",
      "notion",
      "chatgpt",
      "openai",
      "github",
      "vercel",
      "domain",
      "hosting",
      "shopify",
      "freee",
      "弥生",
      "会計ソフト",
    ])
  ) return "software";

  if (
    includesAny(text, [
      "消耗品",
      "備品",
      "事務用品",
      "office",
      "supplies",
      "文具",
      "printer",
      "インク",
      "コピー",
      "pc",
      "パソコン",
      "モニター",
      "keyboard",
      "mouse",
    ])
  ) return "office";

  if (
    includesAny(text, [
      "通信",
      "電話",
      "internet",
      "wifi",
      "wi-fi",
      "回線",
      "携帯",
      "mobile",
      "sim",
      "docomo",
      "au",
      "softbank",
      "rakuten mobile",
    ])
  ) return "communication";

  return "all";
}

function classifyPayrollBucket(text: string) {
  if (
    includesAny(text, [
      "役員",
      "役員報酬",
      "executive",
      "director",
      "officer",
    ])
  ) return "executive";

  if (
    includesAny(text, [
      "外注",
      "業務委託",
      "委託費",
      "contractor",
      "freelance",
      "outsourcing",
      "outsourced",
      "外注費",
      "業務委託費",
    ])
  ) return "outsourcing";

  if (
    includesAny(text, [
      "社会保険",
      "健康保険",
      "厚生年金",
      "雇用保険",
      "労働保険",
      "福利厚生",
      "insurance",
      "benefit",
      "pension",
    ])
  ) return "social";

  if (
    includesAny(text, [
      "給与",
      "給料",
      "賃金",
      "賞与",
      "bonus",
      "salary",
      "payroll",
      "wage",
      "人件",
      "人件費",
    ])
  ) return "salary";

  return "all";
}

function classifyOtherExpenseBucket(text: string) {
  if (
    includesAny(text, [
      "手数料",
      "fee",
      "fees",
      "bank fee",
      "振込手数料",
      "決済手数料",
      "payment fee",
      "commission",
    ])
  ) return "bank";

  if (
    includesAny(text, [
      "税金",
      "公課",
      "tax",
      "消費税",
      "法人税",
      "住民税",
      "事業税",
      "印紙",
      "stamp",
    ])
  ) return "tax";

  if (
    includesAny(text, [
      "調整",
      "返金",
      "adjust",
      "adjustment",
      "refund",
      "reversal",
      "修正",
      "差額",
    ])
  ) return "adjustment";

  return "misc";
}

function isCompanyOperationExpense(text: string) {
  if (
    includesAny(text, [
      "company-operation",
      "company_ops",
      "company-ops",
      "office-operation",
      "backoffice",
      "会社運営",
      "会社運営費",
      "一般管理",
      "一般管理費",
      "管理費",
      "販管費",
      "事務所",
      "オフィス",
      "家賃",
      "地代",
      "賃料",
      "水道",
      "光熱",
      "電気",
      "ガス",
      "通信",
      "電話",
      "消耗品",
      "備品",
      "事務用品",
      "saas",
      "software",
      "ソフトウェア",
      "システム",
      "サーバ",
      "server",
      "cloud",
      "クラウド",
      "aws",
      "google",
      "notion",
      "chatgpt",
      "openai",
      "github",
      "vercel",
      "freee",
      "弥生",
      "会計ソフト",
      "office",
      "supplies",
      "rent",
      "utilities",
      "utility",
      "internet",
      "wifi",
      "wi-fi",
      "mobile",
    ])
  ) {
    return true;
  }

  return false;
}

function isPayrollExpense(text: string) {
  return includesAny(text, [
    "payroll",
    "salary",
    "給与",
    "給料",
    "賞与",
    "賃金",
    "役員報酬",
    "人件",
    "人件費",
    "外注",
    "外注費",
    "業務委託",
    "業務委託費",
    "委託費",
    "contractor",
    "freelance",
    "outsourcing",
    "社会保険",
    "福利厚生",
    "健康保険",
    "厚生年金",
    "雇用保険",
    "労働保険",
  ]);
}

function isAdvertisingOrLogistics(text: string) {
  return includesAny(text, [
    "store-operation",
    "store operation",
    "store_ops",
    "store-ops",
    "[imports:store-operation]",
    "amazon charges",
    "amazon transaction",
    "settlement",
    "fba",
    "広告",
    "広告費",
    "ads",
    "ad fee",
    "advertising",
    "sponsored",
    "campaign",
    "物流",
    "送料",
    "shipping",
    "配送",
    "倉庫",
    "warehouse",
    "fulfillment",
    "配送代行",
    "fba fee",
    "commission fee",
    "referral fee",
    "販売手数料",
    "月額登録料",
    "storage fee",
    "保管料",
  ]);
}



// Step109-Z1-H2-EXPENSE-LEDGER-SCOPE-FIRST-READING:
// Page ownership is decided by ledger_scope first.
// No-scope legacy EXPENSE rows are kept in その他支出 to avoid false positives.
function getWorkspaceLedgerScope(kind: ExpenseCategoryProductKind): LedgerScope {
  if (kind === "company-operation") return LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE;
  if (kind === "payroll") return LEDGER_SCOPES.PAYROLL_EXPENSE;
  return LEDGER_SCOPES.OTHER_EXPENSE;
}

function getTransactionLedgerScope(item: TransactionItem): LedgerScope | "" {
  return readLedgerScopeWithLegacyFallback(
    [
      item.memo,
      item.categoryName,
      item.type,
      item.sourceType,
      item.externalRef,
      item.importJobId,
      item.sourceFileName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getTransactionLedgerSubcategory(item: TransactionItem) {
  return readLedgerSubcategoryFromText(
    [
      item.memo,
      item.categoryName,
      item.type,
      item.sourceType,
      item.externalRef,
      item.importJobId,
      item.sourceFileName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getLegacyUnscopedDefaultLedgerScope() {
  return LEDGER_SCOPES.OTHER_EXPENSE;
}

function getEffectiveExpenseLedgerScope(item: TransactionItem): {
  scope: LedgerScope;
  mode: ExpenseClassificationDebugRow["ownershipMode"];
} {
  const explicitScope = getTransactionLedgerScope(item);
  if (explicitScope) {
    const raw = [
      item.memo,
      item.categoryName,
      item.type,
      item.sourceType,
      item.externalRef,
      item.importJobId,
      item.sourceFileName,
    ]
      .filter(Boolean)
      .join(" ");

    const mode = raw.toLowerCase().includes("[expense-kind:")
      ? "legacy-expense-kind"
      : "ledger-scope";

    return {
      scope: explicitScope,
      mode,
    };
  }

  return {
    scope: getLegacyUnscopedDefaultLedgerScope(),
    mode: "legacy-unscoped-default",
  };
}

function mapLedgerScopeToDebugKind(scope: LedgerScope): ExpenseClassificationDebugRow["decidedKind"] {
  if (scope === LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE) return "company-operation";
  if (scope === LEDGER_SCOPES.PAYROLL_EXPENSE) return "payroll";
  if (scope === LEDGER_SCOPES.STORE_OPERATION_EXPENSE) return "store-operation";
  return "other-expense";
}

function normalizeSubcategoryForKind(kind: ExpenseCategoryProductKind, subcategory: string) {
  const normalized = normalizeText(subcategory);
  if (!normalized) return "";

  const allowed = KIND_OPTIONS[kind].map((item) => item.value);
  if (allowed.includes(normalized)) return normalized;

  if (kind === "company-operation") {
    if (["saas", "system", "cloud", "server", "software"].includes(normalized)) return "software";
    if (["stationery", "supplies", "equipment"].includes(normalized)) return "office";
    if (["phone", "mobile", "internet", "wifi"].includes(normalized)) return "communication";
    if (["utility", "utilities", "electricity", "gas", "water"].includes(normalized)) return "utilities";
    if (["accounting", "tax-accountant", "tax_accountant", "zeirishi"].includes(normalized)) return "accounting-tax";
  }

  if (kind === "payroll") {
    if (["wage", "salary", "payroll"].includes(normalized)) return "salary";
    if (["director", "officer", "executive"].includes(normalized)) return "executive";
    if (["contractor", "freelance", "outsourcing"].includes(normalized)) return "outsourcing";
    if (["insurance", "benefit", "pension"].includes(normalized)) return "social";
    if (["withholding", "withholding-tax", "gensen"].includes(normalized)) return "withholding-tax";
  }

  if (kind === "other-expense") {
    if (["fee", "commission", "bank-fee", "bank_fee"].includes(normalized)) return "bank";
    if (["tax", "stamp"].includes(normalized)) return "tax";
    if (["refund", "adjustment", "adjust"].includes(normalized)) return "adjustment";
  }

  return "";
}

// Step109-Z1-G4-EXPENSE-CLASSIFICATION-DEBUG-PANEL:
// Diagnostic classifier used only for ?debug=expense. It shows why rows are
// classified into company-operation / payroll / other-expense / store-operation.
function diagnoseExpenseClassification(item: TransactionItem): ExpenseClassificationDebugRow {
  const text = getExpenseSearchText(item);
  const effective = getEffectiveExpenseLedgerScope(item);
  const decidedKind = mapLedgerScopeToDebugKind(effective.scope);
  const ledgerSubcategory = getTransactionLedgerSubcategory(item);

  const inferredBucket =
    decidedKind === "payroll"
      ? normalizeSubcategoryForKind("payroll", ledgerSubcategory) || classifyPayrollBucket(text)
      : decidedKind === "company-operation"
        ? normalizeSubcategoryForKind("company-operation", ledgerSubcategory) || classifyCompanyOperationBucket(text)
        : decidedKind === "store-operation"
          ? "store-operation"
          : normalizeSubcategoryForKind("other-expense", ledgerSubcategory) || classifyOtherExpenseBucket(text);

  return {
    id: String(item.id || ""),
    decidedKind,
    bucket: inferredBucket,
    reason:
      effective.mode === "ledger-scope"
        ? "matched-ledger-scope"
        : effective.mode === "legacy-expense-kind"
          ? "matched-legacy-expense-kind"
          : "legacy-unscoped-default-other-expense",
    amount: Math.abs(Number(item.amount || 0)),
    occurredAt: String(item.occurredAt || item.createdAt || ""),
    type: String(item.type || ""),
    sourceType: String(item.sourceType || ""),
    categoryName: String(item.categoryName || ""),
    memo: String(item.memo || ""),
    importJobId: String(item.importJobId || ""),
    sourceFileName: String(item.sourceFileName || ""),
    ledgerScope: effective.scope,
    ledgerSubcategory,
    ownershipMode: effective.mode,
    searchText: text,
  };
}

function matchesWorkspaceKind(kind: ExpenseCategoryProductKind, item: TransactionItem) {
  const expectedScope = getWorkspaceLedgerScope(kind);
  const effective = getEffectiveExpenseLedgerScope(item);

  return effective.scope === expectedScope;
}

function getBucket(kind: ExpenseCategoryProductKind, item: TransactionItem) {
  const ledgerSubcategory = getTransactionLedgerSubcategory(item);
  const markerBucket = normalizeSubcategoryForKind(kind, ledgerSubcategory);
  if (markerBucket) return markerBucket;

  const text = getExpenseSearchText(item);

  if (kind === "payroll") return classifyPayrollBucket(text);
  if (kind === "company-operation") return classifyCompanyOperationBucket(text);
  return classifyOtherExpenseBucket(text);
}

function getBucketLabel(kind: ExpenseCategoryProductKind, bucket: string) {
  return KIND_OPTIONS[kind].find((item) => item.value === bucket)?.label || PAGE_CONFIG[kind].badgeLabel;
}


// Step109-Z1-H5G-EXPENSE-STATUS-DISPLAY-STANDARDIZE:
// Display layer normalization for imported expense rows.
// It reads H5D memo markers without changing stored Transaction data.
function readExpenseMemoMarker(
  text: string | null | undefined,
  markers: string[]
) {
  const raw = String(text || "");
  for (const marker of markers) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\[${escaped}:([^\\]]+)\\]`, "i");
    const found = raw.match(regex)?.[1]?.trim();
    if (found) return found;
  }
  return "";
}

function stripExpenseDisplaySystemMarkers(memo: string | null | undefined) {
  return stripLedgerMarkersFromMemo(memo)
    .replace(/\[vendor:[^\]]+\]/gi, "")
    .replace(/\[evidence:[^\]]+\]/gi, "")
    .replace(/\[invoice:[^\]]+\]/gi, "")
    .replace(/\[evidence_no:[^\]]+\]/gi, "")
    .replace(/\[invoice_no:[^\]]+\]/gi, "")
    .replace(/\[account:[^\]]+\]/gi, "")
    .replace(/\[account_name:[^\]]+\]/gi, "")
    .replace(/\[bank:[^\]]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getExpenseDisplayVendor(item: TransactionItem, rawMemo: string) {
  return (
    readExpenseMemoMarker(rawMemo, ["vendor", "payee", "supplier"]) ||
    String(item.storeName || item.storeId || "").trim() ||
    "-"
  );
}

function getExpenseDisplayAccount(item: TransactionItem, rawMemo: string) {
  return (
    String(item.accountName || "").trim() ||
    readExpenseMemoMarker(rawMemo, ["account_name", "account", "bank"]) ||
    "-"
  );
}

function getExpenseDisplayEvidenceNo(item: TransactionItem, rawMemo: string) {
  return (
    readExpenseMemoMarker(rawMemo, [
      "evidence_no",
      "invoice_no",
      "evidence",
      "invoice",
    ]) ||
    String(item.externalRef || "").trim()
  );
}

function hasExpenseDisplayEvidence(item: TransactionItem, rawMemo: string) {
  return Boolean(getExpenseDisplayEvidenceNo(item, rawMemo));
}

function hasExpenseDisplayAccount(item: TransactionItem, rawMemo: string) {
  return getExpenseDisplayAccount(item, rawMemo) !== "-";
}

function mapExpenseRecord(kind: ExpenseCategoryProductKind, item: TransactionItem): ExpenseCategoryRecord {
  const ts = parseExpenseDateMs(item);
  const date = ts > 0 ? formatFullDate(new Date(ts)) : "-";
  const bucket = getBucket(kind, item);
  const amount = Math.abs(Number(item.amount || 0));
  const rawMemo = String(item.memo || "");
  const memo = stripExpenseDisplaySystemMarkers(rawMemo);
  const displayVendor = getExpenseDisplayVendor(item, rawMemo);
  const displayAccount = getExpenseDisplayAccount(item, rawMemo);
  const evidenceNo = getExpenseDisplayEvidenceNo(item, rawMemo);
  const effectiveScope = getEffectiveExpenseLedgerScope(item);

  const statusFlags = [
    effectiveScope.mode === "legacy-unscoped-default" ? "分類未確定" : "scope確定済み",
    hasExpenseDisplayAccount(item, rawMemo)
      ? "銀行流水確認済み"
      : "銀行流水未確認",
    hasExpenseDisplayEvidence(item, rawMemo)
      ? "証憑確認済み"
      : "証憑未添付",
  ].filter(Boolean);

  return {
    id: String(item.id || `${kind}-${date}-${amount}`),
    date,
    sortAt: item.occurredAt || item.createdAt || "",
    categoryLabel: getBucketLabel(kind, bucket),
    amount,
    account: displayAccount,
    vendor: displayVendor,
    memo: memo || evidenceNo || item.categoryName || item.type || "-",
    source: item.sourceFileName || item.importJobId || "manual/api",
    importJobId: String(item.importJobId || ""),
    sourceRowNo: (item as any).sourceRowNo == null ? "" : String((item as any).sourceRowNo),
    sourceFileName: String(item.sourceFileName || ""),
    statusFlags,
    rawMemo,
    ledgerScope: effectiveScope.scope,
    ownershipMode: effectiveScope.mode,
  };
}

function buildDenseDailyPoints(rows: ExpenseCategoryRecord[], range: RangePreset): DashboardPoint[] {
  const days = range === "12m" ? 365 : range === "90d" ? 90 : 30;
  const latest =
    rows
      .map((row) => new Date(row.date).getTime())
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a)[0] || Date.now();

  const end = cloneDate(new Date(latest));
  const start = addDays(end, -(days - 1));
  const map = new Map<string, DashboardPoint>();

  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const key = formatFullDate(date);
    map.set(key, {
      key,
      label: formatCompactDate(date),
      fullDate: key,
      amount: 0,
      count: 0,
      start: date,
    });
  }

  for (const row of rows) {
    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) continue;
    const d = cloneDate(date);
    if (d.getTime() < start.getTime() || d.getTime() > end.getTime()) continue;

    const key = formatFullDate(d);
    const found = map.get(key);
    if (!found) continue;
    found.amount += Number(row.amount || 0);
    found.count += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getNiceMax(points: DashboardPoint[]) {
  const max = Math.max(0, ...points.map((point) => Number(point.amount || 0)));
  if (max <= 0) return 10000;
  const power = Math.pow(10, Math.max(3, Math.floor(Math.log10(max))));
  return Math.ceil(max / power) * power;
}

function getLabelEvery(points: DashboardPoint[]) {
  if (points.length <= 8) return 1;
  if (points.length <= 31) return 5;
  if (points.length <= 95) return 14;
  return 45;
}

function buildPageWindow(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function sortRecords(rows: ExpenseCategoryRecord[], sortMode: SortMode) {
  const next = [...rows];

  if (sortMode === "date_asc") {
    return next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  if (sortMode === "amount_desc") {
    return next.sort((a, b) => b.amount - a.amount);
  }

  if (sortMode === "amount_asc") {
    return next.sort((a, b) => a.amount - b.amount);
  }

  return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function ExpenseChartPair(props: { points: DashboardPoint[] }) {
  const { points } = props;
  const max = getNiceMax(points);
  const labelEvery = getLabelEvery(points);
  const latestKey = points[points.length - 1]?.key || "";
  const peakKey =
    points
      .filter((point) => point.amount > 0)
      .reduce<DashboardPoint | null>((peak, point) => {
        if (!peak || point.amount > peak.amount) return point;
        return peak;
      }, null)?.key || "";

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-950">支出推移</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          選択した期間の支出を日別に自動集計します。支出がない日も 0 円として基線まで表示します。
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/50 p-4">
          <svg viewBox="0 0 800 300" className="h-[300px] w-full overflow-visible" role="img">
            <defs>
              <linearGradient id="expenseTrendArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                <stop offset="68%" stopColor="#ef4444" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              <filter id="expensePointShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
              </filter>
            </defs>
            {(() => {
              const left = 78;
              const right = 762;
              const top = 20;
              const bottom = 262;
              const width = right - left;
              const height = bottom - top;
              const denominator = Math.max(1, points.length - 1);
              const toX = (index: number) => left + (index / denominator) * width;
              const toY = (amount: number) => bottom - Math.min(1, Math.max(0, amount) / Math.max(1, max)) * height;
              const polylinePoints = points
                .map((point, index) => `${toX(index).toFixed(2)},${toY(point.amount).toFixed(2)}`)
                .join(" ");
              const areaPoints = `${left},${bottom} ${polylinePoints} ${right},${bottom}`;

              return (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = bottom - ratio * height;
                    return (
                      <g key={`trend-grid-${ratio}`}>
                        <line
                          x1={left}
                          x2={right}
                          y1={y}
                          y2={y}
                          stroke={ratio === 0 ? "#cbd5e1" : "#e5e7eb"}
                          strokeWidth={ratio === 0 ? 1.5 : 1}
                          strokeDasharray={ratio === 0 ? "0" : "4 8"}
                        />
                        <text x={left - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px] font-medium">
                          {formatIncomeJPY(max * ratio)}
                        </text>
                      </g>
                    );
                  })}

                  <polygon points={areaPoints} fill="url(#expenseTrendArea)" />
                  <polyline points={polylinePoints} fill="none" stroke="#111827" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((point, index) => {
                    const x = toX(index);
                    const y = toY(point.amount);
                    const isZero = point.amount <= 0;
                    const isLatest = point.key === latestKey;
                    const isPeak = point.key === peakKey && point.amount > 0;
                    const tx = Math.min(right - 178, Math.max(left + 8, x - 80));
                    const ty = Math.max(top + 8, y - 58);

                    return (
                      <g key={`trend-${point.key}`} className="group">
                        <rect x={x - 11} y={top} width={22} height={height + 24} fill="transparent" />
                        <circle
                          cx={x}
                          cy={y}
                          r={isZero ? 2.1 : isLatest || isPeak ? 5.5 : 3}
                          className={
                            isZero
                              ? "fill-white stroke-slate-300"
                              : isLatest
                                ? "fill-rose-500 stroke-white"
                                : "fill-red-500 stroke-white"
                          }
                          strokeWidth={isZero ? 1.2 : 2}
                          filter={isLatest || isPeak ? "url(#expensePointShadow)" : undefined}
                          opacity={isZero ? 0.65 : 1}
                        />

                        <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <rect x={tx} y={ty} width={174} height={52} rx={12} className="fill-white stroke-slate-200/90" filter="url(#expensePointShadow)" />
                          <text x={tx + 14} y={ty + 20} className="fill-slate-500 text-[11px] font-semibold">
                            {point.fullDate}
                          </text>
                          <text x={tx + 14} y={ty + 39} className="fill-slate-950 text-[13px] font-bold">
                            {formatIncomeJPY(point.amount)}
                          </text>
                        </g>

                        {index % labelEvery === 0 || index === points.length - 1 ? (
                          <text x={x} y={bottom + 30} textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
                            {point.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-950">支出状況</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          期間別の支出合計を比較します。0 円の日も区間として表示します。
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/50 p-4">
          <svg viewBox="0 0 800 300" className="h-[300px] w-full overflow-visible" role="img">
            <defs>
              <filter id="expenseBarShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>
            {(() => {
              const left = 78;
              const right = 762;
              const top = 20;
              const bottom = 262;
              const width = right - left;
              const height = bottom - top;
              const count = Math.max(1, points.length);
              const gap = points.length > 28 ? 5 : 8;
              const barWidth = Math.max(4, Math.min(18, (width - gap * (count - 1)) / count));
              const toX = (index: number) => left + index * (barWidth + gap);
              const toBarHeight = (amount: number) => {
                if (amount <= 0) return 3;
                return Math.max(9, Math.min(1, amount / Math.max(1, max)) * height);
              };

              return (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = bottom - ratio * height;
                    return (
                      <g key={`bar-grid-${ratio}`}>
                        <line
                          x1={left}
                          x2={right}
                          y1={y}
                          y2={y}
                          stroke={ratio === 0 ? "#cbd5e1" : "#e5e7eb"}
                          strokeWidth={ratio === 0 ? 1.5 : 1}
                          strokeDasharray={ratio === 0 ? "0" : "4 8"}
                        />
                        <text x={left - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px] font-medium">
                          {formatIncomeJPY(max * ratio)}
                        </text>
                      </g>
                    );
                  })}

                  {points.map((point, index) => {
                    const x = toX(index);
                    const barHeight = toBarHeight(point.amount);
                    const y = bottom - barHeight;
                    const isLatest = point.key === latestKey;
                    const isPeak = point.key === peakKey && point.amount > 0;
                    const isZero = point.amount <= 0;
                    const tx = Math.min(right - 178, Math.max(left + 8, x - 80));
                    const ty = Math.max(top + 8, y - 58);

                    return (
                      <g key={`bar-${point.key}`} className="group">
                        <rect x={x - Math.max(3, gap / 2)} y={top} width={barWidth + Math.max(6, gap)} height={height + 24} fill="transparent" />
                        <rect
                          x={x}
                          y={isZero ? bottom - 3 : y}
                          width={barWidth}
                          height={barHeight}
                          rx={barWidth / 2}
                          fill={isLatest ? "#dc2626" : isPeak ? "#64748b" : isZero ? "#f1f5f9" : "#94a3b8"}
                          filter={isLatest || isPeak ? "url(#expenseBarShadow)" : undefined}
                        />
                        <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <rect x={tx} y={ty} width={174} height={52} rx={12} className="fill-white stroke-slate-200/90" filter="url(#expenseBarShadow)" />
                          <text x={tx + 14} y={ty + 20} className="fill-slate-500 text-[11px] font-semibold">
                            {point.fullDate}
                          </text>
                          <text x={tx + 14} y={ty + 39} className="fill-slate-950 text-[13px] font-bold">
                            {formatIncomeJPY(point.amount)}
                          </text>
                        </g>

                        {index % labelEvery === 0 || index === points.length - 1 ? (
                          <text x={x + barWidth / 2} y={bottom + 30} textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
                            {point.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ExpenseCategoryProductWorkspace(props: {
  lang: string;
  kind: ExpenseCategoryProductKind;
}) {
  const { lang, kind } = props;
  const config = PAGE_CONFIG[kind];
  // Step109-Z1-H6B-FIX3-COMPANY-OPERATION-INLINE-IMPORT-DIALOG:
  // H6D enables inline import dialog for 会社運営費 / 給与 / その他支出.
  const [expenseInlineImportOpen, setExpenseInlineImportOpen] = React.useState(false);
  // Step109-Z1-H6D-FIX1-OTHER-EXPENSE-INLINE-IMPORT-DIALOG:
  // H6D enables inline import dialog for 会社運営費 / 給与 / その他支出.
  const isCompanyOperationInlineImportEnabled =
    kind === "company-operation" ||
    kind === "payroll" ||
    kind === "other-expense";

  function handleExpenseInlineImportCommitted(result: { importJobId?: string | null }) {
    setExpenseInlineImportOpen(false);

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("from", "expense-import-commit");
    url.searchParams.set("ledger_scope", config.scope);
    url.searchParams.set("refresh", String(Date.now()));
    url.searchParams.set(
      "category",
      kind === "payroll"
        ? "payroll"
        : kind === "other-expense"
          ? "other-expense"
          : "other"
    );
    if (result.importJobId) {
      url.searchParams.set("importJobId", result.importJobId);
    }

    window.location.assign(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const expenseReturnSearchParams = useSearchParams();
  const detailSectionRef = React.useRef<HTMLDivElement | null>(null);
  const [showImportReturnBanner, setShowImportReturnBanner] = React.useState(true);

  const importReturnInfo = React.useMemo(() => {
    const from = expenseReturnSearchParams.get("from") || "";
    const ledgerScope = expenseReturnSearchParams.get("ledger_scope") || "";
    const importJobId = expenseReturnSearchParams.get("importJobId") || "";
    const refresh = expenseReturnSearchParams.get("refresh") || "";

    return {
      active: from === "expense-import-commit" && ledgerScope === config.scope,
      ledgerScope,
      importJobId,
      refresh,
    };
  }, [expenseReturnSearchParams, config.scope]);

  const expenseCategoryTraceSelection = React.useMemo(
    () => readExpenseCategoryTraceSelectionInfo(expenseReturnSearchParams, config.scope, kind),
    [expenseReturnSearchParams, config.scope, kind]
  );


  React.useEffect(() => {
    if (!importReturnInfo.active) return;

    setShowImportReturnBanner(true);

    const timer = window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [importReturnInfo.active, importReturnInfo.importJobId, importReturnInfo.refresh]);

  const isImportReturnHighlightedRecord = React.useCallback(
    (row: ExpenseCategoryRecord) => {
      // Step109-Z1-H5F-FIX5B-SAFE-HIGHLIGHT-ROW-FIELDS:
      // Keep post-import highlight build-safe even when ExpenseCategoryRecord is inferred without import metadata.
      const rowWithImportMeta = row as ExpenseCategoryRecord & {
        importJobId?: string;
        sourceFileName?: string;
      };

      const rowImportJobId = String(rowWithImportMeta.importJobId || "");
      const rowSourceFileName = String(rowWithImportMeta.sourceFileName || "");

      if (!importReturnInfo.active) return false;

      if (importReturnInfo.importJobId && rowImportJobId === importReturnInfo.importJobId) {
        return true;
      }

      if (
        importReturnInfo.importJobId &&
        row.ledgerScope === importReturnInfo.ledgerScope &&
        [row.source, rowSourceFileName, row.rawMemo]
          .filter(Boolean)
          .join(" ")
          .includes(importReturnInfo.importJobId)
      ) {
        return true;
      }

      return false;
    },
    [importReturnInfo.active, importReturnInfo.importJobId, importReturnInfo.ledgerScope],
  );

  const isExpenseCategoryTraceHighlightedRecord = React.useCallback(
    (row: ExpenseCategoryRecord) => {
      if (!expenseCategoryTraceSelection.active) return false;

      const rowId = String(row.id || "");
      const rowImportJobId = String(row.importJobId || "");
      const rowSourceRowNo = String(row.sourceRowNo || "");
      const rawMemo = String(row.rawMemo || row.memo || "");
      const source = String(row.source || "");
      const sourceFileName = String(row.sourceFileName || "");

      if (
        expenseCategoryTraceSelection.transactionId &&
        rowId === expenseCategoryTraceSelection.transactionId
      ) {
        return true;
      }

      if (
        expenseCategoryTraceSelection.sourceRowNo &&
        rowSourceRowNo &&
        rowSourceRowNo === expenseCategoryTraceSelection.sourceRowNo
      ) {
        if (!expenseCategoryTraceSelection.importJobId) return true;
        return rowImportJobId === expenseCategoryTraceSelection.importJobId;
      }

      if (
        expenseCategoryTraceSelection.transactionId &&
        rawMemo.includes(expenseCategoryTraceSelection.transactionId)
      ) {
        return true;
      }

      if (
        expenseCategoryTraceSelection.importJobId &&
        rowImportJobId &&
        rowImportJobId === expenseCategoryTraceSelection.importJobId
      ) {
        if (!expenseCategoryTraceSelection.sourceRowNo) return true;
        return rowSourceRowNo === expenseCategoryTraceSelection.sourceRowNo;
      }

      if (
        expenseCategoryTraceSelection.importJobId &&
        [source, sourceFileName, rawMemo].filter(Boolean).join(" ").includes(expenseCategoryTraceSelection.importJobId)
      ) {
        return true;
      }

      return false;
    },
    [
      expenseCategoryTraceSelection.active,
      expenseCategoryTraceSelection.transactionId,
      expenseCategoryTraceSelection.importJobId,
      expenseCategoryTraceSelection.sourceRowNo,
    ]
  );

  const isExpenseCategoryUnifiedHighlightedRecord = React.useCallback(
    (row: ExpenseCategoryRecord) =>
      isImportReturnHighlightedRecord(row) || isExpenseCategoryTraceHighlightedRecord(row),
    [isImportReturnHighlightedRecord, isExpenseCategoryTraceHighlightedRecord]
  );


  // Step109-Z1-H5F-FIX4-ADD-IMPORT-JOB-FIELDS: ExpenseCategoryRecord carries importJobId/sourceFileName for post-import highlight.\n  // Step109-Z1-H5F-FIX3-SPAN-BASED-HIGHLIGHT: highlight detail row through scope badge span + CSS :has().\n  // Step109-Z1-H5F-FIX1-IMPORT-RETURN-BANNER-HIGHLIGHT:
  // Show import completion feedback after returning from expense CSV commit.

  const [rows, setRows] = React.useState<ExpenseCategoryRecord[]>([]);
  const [debugRows, setDebugRows] = React.useState<ExpenseClassificationDebugRow[]>([]);
  const [debugEnabled, setDebugEnabled] = React.useState(false);
  // Step109-Z1-H3B-EXPENSE-SCOPE-MOVE-ACTIONS:
  // Legacy/unscoped expense rows can be moved by writing a stable [ledger-scope:*] marker.
  const [scopeMoveBusyId, setScopeMoveBusyId] = React.useState<string | null>(null);
  const [scopeMoveMessage, setScopeMoveMessage] = React.useState("");
  const [reloadSeq, setReloadSeq] = React.useState(0);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [range, setRange] = React.useState<RangePreset>("30d");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [sortMode, setSortMode] = React.useState<SortMode>("date_desc");
  const [pageSize, setPageSize] = React.useState<20 | 50 | 100>(20);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await listTransactions("EXPENSE");
        if (!mounted) return;
        const items = Array.isArray(res.items) ? res.items : [];
        const debug = items.map((item) => diagnoseExpenseClassification(item));
        const next = items
          .filter((item) => matchesWorkspaceKind(kind, item))
          .map((item) => mapExpenseRecord(kind, item));

        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;

        setDebugEnabled(params?.get("debug") === "expense");
        setDebugRows(debug);
        setRows(next);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "支出データの取得に失敗しました。");
        setDebugRows([]);
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [kind, reloadSeq]);

  async function handleMoveExpenseScope(row: ExpenseCategoryRecord, targetScope: LedgerScope) {
    setScopeMoveBusyId(row.id);
    setScopeMoveMessage("");

    try {
      const visibleMemo = stripLedgerMarkersFromMemo(row.rawMemo || row.memo || "");
      const nextMemo = appendLedgerMarkersToMemo({
        memo: visibleMemo,
        scope: targetScope,
      });

      await updateTransaction(row.id, { memo: nextMemo });
      setScopeMoveMessage("分類を更新しました。");
      setReloadSeq((value) => value + 1);
    } catch (err) {
      setScopeMoveMessage(
        err instanceof Error ? err.message : "分類更新に失敗しました。",
      );
    } finally {
      setScopeMoveBusyId(null);
    }
  }

  const filteredRows = React.useMemo(() => {
    const next =
      sourceFilter === "all"
        ? rows
        : rows.filter((row) => row.categoryLabel === getBucketLabel(kind, sourceFilter));

    return sortRecords(next, sortMode);
  }, [rows, sourceFilter, sortMode, kind]);

  const totalAmount = React.useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [filteredRows]
  );

  const accountCount = React.useMemo(
    () => new Set(filteredRows.map((row) => row.account || "-")).size,
    [filteredRows]
  );

  const latestDate = filteredRows[0]?.date || "-";
  const averageAmount = filteredRows.length > 0 ? totalAmount / filteredRows.length : 0;
  const points = React.useMemo(() => buildDenseDailyPoints(filteredRows, range), [filteredRows, range]);

  const summaryCards = React.useMemo(() => {
    const map = new Map<string, { label: string; amount: number; count: number }>();
    for (const row of filteredRows) {
      const found = map.get(row.categoryLabel);
      if (found) {
        found.amount += row.amount;
        found.count += 1;
      } else {
        map.set(row.categoryLabel, {
          label: row.categoryLabel,
          amount: row.amount,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageWindow = buildPageWindow(safePage, totalPages);

  const expenseCategoryTraceTargetExists = React.useMemo(() => {
    if (!expenseCategoryTraceSelection.active || !expenseCategoryTraceSelection.transactionId) return true;
    return filteredRows.some((row) => isExpenseCategoryTraceHighlightedRecord(row));
  }, [
    expenseCategoryTraceSelection.active,
    expenseCategoryTraceSelection.transactionId,
    expenseCategoryTraceSelection.importJobId,
    expenseCategoryTraceSelection.sourceRowNo,
    filteredRows,
    isExpenseCategoryTraceHighlightedRecord,
  ]);

  React.useEffect(() => {
    if (!expenseCategoryTraceSelection.active || !expenseCategoryTraceSelection.transactionId) return;

    const targetIndex = filteredRows.findIndex((row) =>
      isExpenseCategoryTraceHighlightedRecord(row)
    );

    if (targetIndex < 0) return;

    const targetPage = Math.floor(targetIndex / pageSize) + 1;
    if (targetPage !== safePage) {
      setCurrentPage(targetPage);
    }

    const timer = window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    expenseCategoryTraceSelection.active,
    expenseCategoryTraceSelection.transactionId,
    expenseCategoryTraceSelection.importJobId,
    expenseCategoryTraceSelection.sourceRowNo,
    filteredRows,
    pageSize,
    safePage,
    isExpenseCategoryTraceHighlightedRecord,
  ]);

  function closeExpenseCategoryTraceSelectionBanner() {
    clearExpenseCategoryTraceSelectionUrl();
  }


  React.useEffect(() => {
    setCurrentPage(1);
  }, [sourceFilter, range, sortMode, pageSize, kind]);

  return (
    <div className="space-y-6" data-scope={`expense-category-product-workspace ${config.scope}`}>
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-950">{config.title}</div>
            <div className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{config.subtitle}</div>
          </div>
          <Link
            href={`/${lang}/app/expenses`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            支出 root に戻る
          </Link>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">{config.sourceLabel}</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
            >
              {KIND_OPTIONS[kind].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">現在範囲</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RangePreset)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
            >
              <option value="30d">直近30日</option>
              <option value="90d">直近90日</option>
              <option value="12m">直近12ヶ月</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">{config.totalLabel}</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{formatIncomeJPY(totalAmount)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">明細数</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{filteredRows.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">口座数</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{accountCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">平均金額</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{formatIncomeJPY(averageAmount)}</div>
            <div className="mt-2 text-xs text-slate-500">最新日 {latestDate}</div>
          </div>
        </div>
      </section>

      {debugEnabled ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-amber-950">分類診断パネル</div>
              <div className="mt-1 text-sm leading-6 text-amber-800">
                URL に debug=expense が付いている時だけ表示します。会社運営費・給与が 0 件の場合、下の raw fields を見て分類ルールを追加します。
              </div>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              EXPENSE rows {debugRows.length} 件
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {(["company-operation", "payroll", "other-expense", "store-operation"] as const).map((debugKind) => {
              const count = debugRows.filter((row) => row.decidedKind === debugKind).length;
              const amount = debugRows
                .filter((row) => row.decidedKind === debugKind)
                .reduce((sum, row) => sum + row.amount, 0);
              return (
                <div key={debugKind} className="rounded-2xl border border-amber-100 bg-white p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-700">{debugKind}</div>
                  <div className="mt-2 text-xl font-bold text-slate-950">{count} 件</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">{formatIncomeJPY(amount)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-white">
            <div className="grid grid-cols-[130px_150px_160px_1fr_1fr] gap-3 bg-amber-100/70 px-4 py-3 text-xs font-bold text-amber-900">
              <div>日付 / 金額</div>
              <div>判定</div>
              <div>理由</div>
              <div>category/type/source</div>
              <div>memo/import/file</div>
            </div>
            {debugRows.slice(0, 80).map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[130px_150px_160px_1fr_1fr] gap-3 border-t border-amber-100 px-4 py-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{row.occurredAt ? row.occurredAt.slice(0, 10) : "-"}</div>
                  <div className="mt-1 font-bold text-slate-950">{formatIncomeJPY(row.amount)}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-950">{row.decidedKind}</div>
                  <div className="mt-1 text-slate-500">{row.bucket}</div>
                </div>
                <div className="break-all text-slate-700">{row.reason}</div>
                <div className="space-y-1 break-all text-slate-700">
                  <div>category: {row.categoryName || "-"}</div>
                  <div>type: {row.type || "-"}</div>
                  <div>sourceType: {row.sourceType || "-"}</div>
                  <div>ledger_scope: {row.ledgerScope || "-"}</div>
                  <div>ledger_subcategory: {row.ledgerSubcategory || "-"}</div>
                  <div>mode: {row.ownershipMode}</div>
                </div>
                <div className="space-y-1 break-all text-slate-700">
                  <div>memo: {row.memo || "-"} </div>
                  <div>import: {row.importJobId || "-"}</div>
                  <div>file: {row.sourceFileName || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ExpenseChartPair points={points} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          
      <style>{`
        tr:has([data-import-return-highlight="true"]) {
          background: rgb(236 253 245);
          box-shadow: inset 0 0 0 2px rgb(110 231 183);
          transition: background 700ms ease, box-shadow 700ms ease;
        }
        tr:has([data-import-return-highlight="true"]) td {
          background: rgb(236 253 245);
        }
        [data-import-return-highlight="true"] {
          box-shadow: 0 0 0 2px rgb(110 231 183);
        }
      `}</style>

      {expenseCategoryTraceSelection.active ? (
        <div
          data-expense-category-trace-banner="true"
          className={`rounded-[24px] border p-4 shadow-sm ${
            expenseCategoryTraceTargetExists
              ? "border-sky-200 bg-sky-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div
                className={`text-sm font-bold ${
                  expenseCategoryTraceTargetExists ? "text-sky-900" : "text-amber-900"
                }`}
              >
                Import Center から選択中
              </div>
              <div
                className={`mt-1 text-xs leading-5 ${
                  expenseCategoryTraceTargetExists ? "text-sky-800" : "text-amber-800"
                }`}
              >
                transactionId: {expenseCategoryTraceSelection.transactionId || "-"}
                {expenseCategoryTraceSelection.sourceRowNo ? ` / sourceRowNo: ${expenseCategoryTraceSelection.sourceRowNo}` : ""}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                {expenseCategoryTraceTargetExists
                  ? "該当する支出明細をハイライトしています。"
                  : "現在の支出一覧に該当する明細が見つかりません。フィルターやページ範囲を確認してください。"}
              </div>
            </div>
            <button
              type="button"
              onClick={closeExpenseCategoryTraceSelectionBanner}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              選択解除
            </button>
          </div>
        </div>
      ) : null}

      {importReturnInfo.active && showImportReturnBanner ? (
        <div className="mb-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-900">
                {config.title} の取込が完了しました
              </div>
              <div className="mt-1 text-xs leading-5 text-emerald-800">
                CSV/Excel から登録した支出をこのページに反映しました。
                {importReturnInfo.importJobId ? (
                  <span className="ml-1 font-mono">
                    importJobId={importReturnInfo.importJobId}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImportReturnBanner(false)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}

<div className="text-xl font-semibold text-slate-950">操作メニュー</div>
          <div className="text-xs font-medium text-slate-500">
            銀行流水・証憑との閉じ込みは後続 Phase で接続
          </div>
        </div>
        {scopeMoveMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {scopeMoveMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Link
            href={`/${lang}/app/expenses?action=create`}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {config.primaryAction}
          </Link>
          {/* Step109-Z1-H4A-LEDGER-TEMPLATE-DOWNLOAD-BUTTONS:
              Download a page-specific CSV template with fixed ledger_scope. */}
          <LedgerTemplateDownloadButton
            scope={getWorkspaceLedgerScope(kind)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            {config.title}テンプレート下载
          </LedgerTemplateDownloadButton>

          {isCompanyOperationInlineImportEnabled ? (
                <button
                  type="button"
                  onClick={() => setExpenseInlineImportOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {config.importLabel}
                </button>
              ) : (
                <Link
            href={`/${lang}/app/data/import?module=expenses&category=${kind}`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            {config.importLabel}
          </Link>
              )}
          <button
            type="button"
            disabled
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-400"
          >
            {config.title}を編集
          </button>
          <Link
            href={`/${lang}/app/settings/categories`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            {config.settingLabel}
          </Link>
        </div>
      </section>

      {/* Step109-Z1-H9-4C-EXPENSE-HISTORY-PANEL:
          Show ImportJob history for the current expense module.
          This is display-only and does not change preview/commit behavior. */}
      <ExpenseImportHistoryPanel
        module={config.scope as ExpenseImportHistoryModule}
        title={`${config.title} 取込履歴`}
        description={`最近の${config.title} CSV / Excel 取込結果を確認できます。`}
      />


      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-950"><span ref={detailSectionRef} />{config.title} 明細</div>
            <div className="mt-2 text-sm text-slate-600">
              支出明細を一覧で確認できます。銀行流水・証憑が不足する場合は確認対象として扱います。
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            並び替え
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="date_desc">発生日（新しい順）</option>
              <option value="date_asc">発生日（古い順）</option>
              <option value="amount_desc">金額（高い順）</option>
              <option value="amount_asc">金額（低い順）</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-950">支出区分サマリー</div>
              <div className="mt-1 text-sm text-slate-600">税務申告・証憑確認で使いやすい区分に整理しています。</div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              表示中 {summaryCards.length} 区分
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {summaryCards.length > 0 ? (
              summaryCards.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    const found = KIND_OPTIONS[kind].find((option) => option.label === item.label);
                    if (found) setSourceFilter(found.value);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-950">{item.label}</div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.count}件
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-bold text-slate-950">{formatIncomeJPY(item.amount)}</div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                表示できる支出区分はまだありません。
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS[kind].map((item) => {
              const active = sourceFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSourceFilter(item.value)}
                  className={
                    active
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="grid grid-cols-[140px_150px_1fr_180px_150px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            <div>発生日</div>
            <div>種別</div>
            <div>メモ・支払先</div>
            <div>口座 / 状態</div>
            <div>帰属修正</div>
            <div className="text-right">金額</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
          ) : pageRows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">表示できる明細はありません。</div>
          ) : (
            pageRows.map((row) => (
              <div
                key={row.id}
                data-expense-category-trace-highlight={isExpenseCategoryUnifiedHighlightedRecord(row) ? "true" : undefined}
                style={
                  isExpenseCategoryUnifiedHighlightedRecord(row)
                    ? {
                        outline: "3px solid rgba(14, 165, 233, 0.35)",
                        boxShadow: "0 0 0 6px rgba(14, 165, 233, 0.12)",
                        background: "rgba(240, 249, 255, 0.96)",
                      }
                    : undefined
                }
                className="grid grid-cols-[140px_150px_1fr_180px_150px_140px] gap-4 border-t border-slate-100 px-4 py-4 text-sm"
              >
                <div className="text-slate-700">{row.date}</div>
                <div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800">
                    {row.categoryLabel}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-950">{row.memo}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.vendor}</div>
                </div>
                <div>
                  <div className="text-slate-700">{row.account}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.statusFlags.length > 0 ? (
                      row.statusFlags.map((flag) => (
                        <span key={flag} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        確認済み
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {row.ownershipMode === "legacy-unscoped-default" ? (
                    <div className="flex flex-col gap-1">
                      {kind !== "company-operation" ? (
                        <button
                          type="button"
                          disabled={scopeMoveBusyId === row.id}
                          onClick={() =>
                            void handleMoveExpenseScope(
                              row,
                              LEDGER_SCOPES.COMPANY_OPERATION_EXPENSE,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          会社運営費へ
                        </button>
                      ) : null}

                      {kind !== "payroll" ? (
                        <button
                          type="button"
                          disabled={scopeMoveBusyId === row.id}
                          onClick={() =>
                            void handleMoveExpenseScope(
                              row,
                              LEDGER_SCOPES.PAYROLL_EXPENSE,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          給与へ
                        </button>
                      ) : null}

                      {kind !== "other-expense" ? (
                        <button
                          type="button"
                          disabled={scopeMoveBusyId === row.id}
                          onClick={() =>
                            void handleMoveExpenseScope(
                              row,
                              LEDGER_SCOPES.OTHER_EXPENSE,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          その他支出へ
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={scopeMoveBusyId === row.id}
                          onClick={() =>
                            void handleMoveExpenseScope(
                              row,
                              LEDGER_SCOPES.OTHER_EXPENSE,
                            )
                          }
                          className="rounded-lg bg-slate-950 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          その他支出で確定
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200"
                        data-import-return-highlight={
                          isExpenseCategoryUnifiedHighlightedRecord(row) ? "true" : undefined
                        }
                      >
                      scope確定済み
                    </span>
                  )}
                </div>
                <div className="text-right font-bold text-slate-950">{formatIncomeJPY(row.amount)}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            全 {filteredRows.length} 行のうち、{filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredRows.length)} 行を表示
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">1ページあたり</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) as 20 | 50 | 100)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
            <button type="button" onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">最初</button>
            <button type="button" onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">前へ</button>
            {pageWindow.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={page === safePage ? "rounded-xl bg-slate-950 px-4 py-2 font-bold text-white" : "rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold"}
              >
                {page}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">次へ</button>
            <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">最後</button>
          </div>
        </div>
      </section>
      {isCompanyOperationInlineImportEnabled ? (
        <ExpenseImportDialog
          open={expenseInlineImportOpen}
          onClose={() => setExpenseInlineImportOpen(false)}
          ledgerScope={config.scope as LedgerScope}
          label={config.title}
          category={kind}
          defaultFilename={`${config.scope}-template.csv`}
          onCommitted={handleExpenseInlineImportCommitted}
        />
      ) : null}

    </div>
  );
}
