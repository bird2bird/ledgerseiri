import type { ImportJobItem } from "@/core/jobs";
import { getImportCenterJobTone } from "./import-center-status";

// Step109-Z1-H15-B-IMPORT-CENTER-ROUTING-HELPERS:
// Extract Import Center source navigation and transaction trace routing helpers.
// Keep route behavior unchanged:
// - company-operation-expense => /expenses?category=other
// - payroll-expense => /expenses?category=payroll
// - Amazon trace => store-orders vs store-operation split

export type ImportJobTransactionTraceItem = {
  id: string;
  companyId?: string | null;
  importJobId?: string | null;
  sourceRowNo?: number | null;
  type?: string | null;
  direction?: string | null;
  amount?: number | null;
  occurredAt?: string | null;
  businessMonth?: string | null;
  memo?: string | null;
  createdAt?: string | null;
};

export function getImportCenterModuleLabel(module?: string | null) {
  const value = String(module || "").trim();

  if (value === "cash-income") return "現金収入";
  if (value === "other-income") return "その他収入";
  if (value === "company-operation-expense") return "会社運営費";
  if (value === "store-operation-expense") return "店舗運営費";
  if (value === "payroll-expense") return "給与";
  if (value === "other-expense") return "その他支出";
  if (value === "store-orders") return "店舗注文";
  if (value === "store-operation") return "店舗運営費";
  return value || "-";
}

export function getDomainLabel(value?: string | null, module?: string | null) {
  const domain = String(value || "").trim();
  const moduleValue = String(module || "").trim();

  if (domain === "income" && moduleValue === "cash-income") return "現金収入";
  if (domain === "income" && moduleValue === "other-income") return "その他収入";
  if (domain === "ledger" && moduleValue === "company-operation-expense") return "会社運営費";
  if (domain === "ledger" && moduleValue === "store-operation-expense") return "店舗運営費";
  if (domain === "ledger" && moduleValue === "payroll-expense") return "給与";
  if (domain === "ledger" && moduleValue === "other-expense") return "その他支出";

  if (!domain) return getImportCenterModuleLabel(moduleValue);
  if (domain === "amazon-store-orders") return "Amazon 店舗注文";
  if (domain === "store-orders") return "店舗注文";
  if (domain === "import-jobs") return "Import Jobs";
  if (domain === "cash-income") return "現金収入";
  if (domain === "other-income") return "その他収入";
  if (domain.includes("expense")) return "支出";
  return domain;
}

export function buildImportJobSourceHref(job: ImportJobItem) {
  const domain = String(job.domain || "").trim();
  const module = String(job.module || "").trim();
  const params = new URLSearchParams();

  params.set("from", "import-center");
  params.set("importJobId", job.id);

  if (module) params.set("module", module);
  if (domain) params.set("domain", domain);

  const suffix = `?${params.toString()}`;

  if (domain === "income" && module === "cash-income") {
    return `/ja/app/income/cash${suffix}`;
  }

  if (domain === "income" && module === "other-income") {
    return `/ja/app/income/other${suffix}`;
  }

  if (domain === "ledger" && module === "store-operation-expense") {
    return `/ja/app/expenses/store-operation${suffix}`;
  }

  if (domain === "ledger" && module === "other-expense") {
    return `/ja/app/other-expense${suffix}`;
  }

  if (domain === "ledger" && module === "payroll-expense") {
    const payrollParams = new URLSearchParams(params);
    payrollParams.set("category", "payroll");
    return `/ja/app/expenses?${payrollParams.toString()}`;
  }

  if (domain === "ledger" && module === "company-operation-expense") {
    const companyParams = new URLSearchParams(params);
    companyParams.set("category", "other");
    return `/ja/app/expenses?${companyParams.toString()}`;
  }

  if (domain === "amazon-store-orders" || domain === "store-orders" || module === "store-orders") {
    return `/ja/app/income/store-orders${suffix}`;
  }

  return `/ja/app/data/import${suffix}`;
}

export function getImportJobSourceActionLabel(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "pendingPreview") return "元ページで再検証";
  if (tone === "danger") return "元ページでエラー確認";
  return "関連ページへ移動";
}

export function getImportJobSourceActionHint(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);
  const label = getDomainLabel(job.domain, job.module);

  if (tone === "pendingPreview") {
    return `${label} の元ページで同じCSVを再検証し、正式登録まで進めてください。`;
  }

  if (tone === "danger") {
    return `${label} の元ページで取込条件・CSV内容・エラー行を確認してください。`;
  }

  if (tone === "warning") {
    return `${label} の元ページで重複済み・スキップ条件・対象行を確認してください。`;
  }

  return `${label} の関連ページで登録済みデータを確認できます。`;
}

function isAmazonImportJob(job: ImportJobItem) {
  const domain = String(job.domain || "").trim();
  const module = String(job.module || "").trim();
  const sourceType = String(job.sourceType || "").trim().toLowerCase();
  const filename = String(job.filename || "").trim().toLowerCase();

  return (
    domain === "store-orders" ||
    domain === "amazon-store-orders" ||
    domain === "amazon" ||
    module === "store-orders" ||
    sourceType.includes("amazon") ||
    filename.includes("amazon") ||
    filename.includes("monthlytransaction")
  );
}

function inferAmazonTraceTarget(tx: ImportJobTransactionTraceItem): "store-orders" | "store-operation" {
  const type = String(tx.type || "").toLowerCase();
  const direction = String(tx.direction || "").toLowerCase();
  const memo = String(tx.memo || "").toLowerCase();
  const amount = Number(tx.amount || 0);

  const haystack = `${type} ${direction} ${memo}`;

  const operationKeywords = [
    "fee",
    "charge",
    "commission",
    "advertising",
    "advertisement",
    "ads",
    "fba",
    "storage",
    "subscription",
    "refund",
    "adjustment",
    "transfer",
    "settlement",
    "tax",
    "手数料",
    "広告",
    "広告費",
    "fba",
    "倉庫",
    "保管",
    "月額",
    "登録料",
    "返金",
    "調整",
    "振込",
    "税",
  ];

  const orderKeywords = [
    "order",
    "sale",
    "sales",
    "product",
    "principal",
    "revenue",
    "income",
    "注文",
    "売上",
    "商品売上",
    "注文売上",
  ];

  if (operationKeywords.some((keyword) => haystack.includes(keyword))) {
    return "store-operation";
  }

  if (orderKeywords.some((keyword) => haystack.includes(keyword))) {
    return "store-orders";
  }

  if (direction.includes("expense") || direction.includes("out")) {
    return "store-operation";
  }

  if (direction.includes("income") || direction.includes("in")) {
    return "store-orders";
  }

  // Amazon transaction CSV usually represents fees/adjustments as negative signed amounts.
  // Use amount as a final fallback only after text heuristics.
  if (amount < 0) {
    return "store-operation";
  }

  return "store-orders";
}

export function buildTransactionTraceHref(job: ImportJobItem, tx: ImportJobTransactionTraceItem) {
  const domain = String(job.domain || "").trim();
  const module = String(job.module || "").trim();
  const params = new URLSearchParams();

  params.set("from", "import-center-trace");

  if (tx.id) params.set("transactionId", tx.id);
  if (tx.importJobId) params.set("importJobId", tx.importJobId);
  if (tx.sourceRowNo != null) params.set("sourceRowNo", String(tx.sourceRowNo));
  if (module) params.set("module", module);
  if (domain) params.set("domain", domain);

  if (domain === "income" && module === "cash-income") {
    params.set("traceTarget", "cash-income");
    return `/ja/app/income/cash?${params.toString()}`;
  }

  if (domain === "income" && module === "other-income") {
    params.set("traceTarget", "other-income");
    return `/ja/app/income/other?${params.toString()}`;
  }

  if (domain === "ledger" && module === "store-operation-expense") {
    params.set("traceTarget", "store-operation");
    return `/ja/app/expenses/store-operation?${params.toString()}`;
  }

  if (domain === "ledger" && module === "other-expense") {
    params.set("traceTarget", "other-expense");
    return `/ja/app/other-expense?${params.toString()}`;
  }

  if (domain === "ledger" && module === "company-operation-expense") {
    params.set("traceTarget", "expense-category");
    params.set("category", "other");
    return `/ja/app/expenses?${params.toString()}`;
  }

  if (domain === "ledger" && module === "payroll-expense") {
    params.set("traceTarget", "expense-category");
    params.set("category", "payroll");
    return `/ja/app/expenses?${params.toString()}`;
  }

  if (isAmazonImportJob(job)) {
    const traceTarget = inferAmazonTraceTarget(tx);
    params.set("traceTarget", traceTarget);

    if (traceTarget === "store-operation") {
      return `/ja/app/expenses/store-operation?${params.toString()}`;
    }

    return `/ja/app/income/store-orders?${params.toString()}`;
  }

  return `/ja/app/data/import?${params.toString()}`;
}
