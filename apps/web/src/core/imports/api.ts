import type {
  CashIncomeCommitRequest,
  CashIncomeCommitResponse,
  CashIncomePreviewRequest,
  CashIncomePreviewResponse,
  CommitImportRequest,
  CommitImportResponse,
  ExpenseImportCommitRequest,
  ExpenseImportCommitResponse,
  ExpenseImportPreviewRequest,
  ExpenseImportPreviewResponse,
  ExpenseImportJobCommitRequest,
  ExpenseImportJobCommitResponse,
  DetectMonthConflictsRequest,
  DetectMonthConflictsResponse,
  ImportHistoryResponse,
  LoadImportSummaryResponse,
  PreviewImportRequest,
  PreviewImportResponse,
} from "./types";

async function readJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJson<T>(res, url);
}

export async function detectMonthConflicts(
  payload: DetectMonthConflictsRequest
): Promise<DetectMonthConflictsResponse> {
  return postJson<DetectMonthConflictsResponse>(
    "/api/imports/detect-month-conflicts",
    payload
  );
}

export async function previewImportSkeleton(
  payload: PreviewImportRequest
): Promise<PreviewImportResponse> {
  return postJson<PreviewImportResponse>("/api/imports/preview", payload);
}

export async function commitImportSkeleton(
  importJobId: string,
  payload: CommitImportRequest
): Promise<CommitImportResponse> {
  return postJson<CommitImportResponse>(
    `/api/imports/${importJobId}/commit`,
    payload
  );
}

export async function loadImportSummary(
  importJobId: string,
  args?: { companyId?: string }
): Promise<LoadImportSummaryResponse> {
  const params = new URLSearchParams();
  if (args?.companyId) params.set("companyId", args.companyId);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const url = `/api/imports/${importJobId}/summary${suffix}`;

  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  return readJson<LoadImportSummaryResponse>(res, url);
}

export async function loadImportHistorySkeleton(args?: {
  module?: string;
  companyId?: string;
}): Promise<ImportHistoryResponse> {
  const params = new URLSearchParams();
  if (args?.module) params.set("module", args.module);
  if (args?.companyId) params.set("companyId", args.companyId);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const url = `/api/imports/history${suffix}`;

  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  return readJson<ImportHistoryResponse>(res, url);
}

export async function previewCashIncomeImport(
  payload: CashIncomePreviewRequest
): Promise<CashIncomePreviewResponse> {
  const res = await fetch("/api/imports/cash-income/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`cash income preview failed: ${res.status}`);
  }

  return (await res.json()) as CashIncomePreviewResponse;
}


export async function commitCashIncomeImport(
  payload: CashIncomeCommitRequest
): Promise<CashIncomeCommitResponse> {
  return postJson<CashIncomeCommitResponse>(
    "/api/imports/cash-income/commit",
    payload
  );
}



// Step109-Z1-H9-2B-EXPENSE-PREVIEW-API:
// Preview inline expense import rows through backend ImportJob/ImportStagingRow.
// H9-2 intentionally keeps formal registration on the legacy expense/commit API.
export async function previewExpenseImport(
  payload: ExpenseImportPreviewRequest
): Promise<ExpenseImportPreviewResponse> {
  return postJson<ExpenseImportPreviewResponse>(
    "/api/imports/expense/preview",
    payload
  );
}

// Step109-Z1-H9-3-EXPENSE-JOB-COMMIT-API:
// Commit an expense ImportJob created by previewExpenseImport.
// Keep legacy commitExpenseImport() below for /app/data/import compatibility.
export async function commitExpenseImportJob(
  importJobId: string,
  payload: ExpenseImportJobCommitRequest = {}
): Promise<ExpenseImportJobCommitResponse> {
  return postJson<ExpenseImportJobCommitResponse>(
    `/api/imports/expense/${importJobId}/commit`,
    payload
  );
}

export async function commitExpenseImport(
  payload: ExpenseImportCommitRequest
): Promise<ExpenseImportCommitResponse> {
  return postJson<ExpenseImportCommitResponse>(
    "/api/imports/expense/commit",
    payload
  );
}

// Step109-Z1-H8-6B-IMPORT-HISTORY-HELPER:
// Additive helper for income import history panels.
// Keep existing imports API exports intact because /app/data/import still depends on them.
export type IncomeImportHistoryModule = "cash-income" | "other-income" | "store-orders";

// Step109-Z1-H9-4B-EXPENSE-HISTORY-HELPER:
// Additive helper for expense ImportJob history panels.
// loadImportHistorySkeleton already accepts any module string, so this is frontend type/UI wiring only.
export type ExpenseImportHistoryModule =
  | "company-operation-expense"
  | "store-operation-expense"
  | "payroll-expense"
  | "other-expense";


export type ImportJobHistoryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | string;

export type ImportJobHistoryItem = {
  id: string;
  companyId?: string;
  domain?: string | null;
  module?: IncomeImportHistoryModule | string | null;
  sourceType?: string | null;
  filename?: string | null;
  fileHash?: string | null;
  status?: ImportJobHistoryStatus | null;
  monthConflictPolicy?: string | null;
  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  deletedRowCount?: number | null;
  fileMonthsJson?: unknown;
  conflictMonthsJson?: unknown;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  importedAt?: string | null;
};

export type IncomeImportHistoryResponse = {
  ok?: boolean;
  action?: "history" | string;
  companyId?: string;
  module?: string | null;
  total?: number;
  items?: ImportJobHistoryItem[];
  message?: string;
};

export type ExpenseImportHistoryResponse = {
  ok?: boolean;
  action?: "history" | string;
  companyId?: string;
  module?: string | null;
  total?: number;
  items?: ImportJobHistoryItem[];
  message?: string;
};

export async function listImportHistory(args: {
  module?: IncomeImportHistoryModule;
  companyId?: string;
}): Promise<IncomeImportHistoryResponse> {
  const data = await loadImportHistorySkeleton({
    module: args.module,
    companyId: args.companyId,
  });

  const raw = data as unknown as IncomeImportHistoryResponse;

  if (raw.ok === false) {
    throw new Error(raw.message || "Import history request failed.");
  }

  return {
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total || 0),
  };
}


// Step112-A-INVENTORY-AUDIT-LINKBACK:
// Lightweight frontend helper for Import History panels.
// Reuses existing inventory audit queue API; no backend contract change.
export type InventoryAuditIssueForImportJob = {
  id: string;
  importJobId: string;
  audit?: {
    status?: unknown;
    reason?: unknown;
    code?: unknown;
    sku?: unknown;
    linkedSkuCode?: unknown;
    resolutionMovementId?: unknown;
  };
};

export type InventoryAuditIssuesForImportJobResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: InventoryAuditIssueForImportJob[];
  total?: number;
  summary?: {
    totalIssues?: number;
    openIssues?: number;
    byStatus?: Array<{ status: string; count: number }>;
  };
  message?: string;
};

export type InventoryAuditImportSummary = {
  total: number;
  open: number;
  closed: number;
  unresolved: number;
  resolved: number;
  skuIssueRows: number;
  unresolvedSkuRows: number;
  resolvedSkuRows: number;
  deductedRows: number;
  inventoryMovementCount: number;
};

export function summarizeInventoryAuditIssuesForImportJob(
  data: InventoryAuditIssuesForImportJobResponse
): InventoryAuditImportSummary {
  const items = Array.isArray(data.items) ? data.items : [];

  // Step112-B-FIX1:
  // This helper is used for a single ImportJob row. Therefore detailed counts must be scoped
  // to the returned items, not to response.summary, because summary may represent a wider
  // audit queue aggregate depending on backend implementation.
  const scopedTotal = items.length;
  const scopedOpen = items.filter((item) => String(item.audit?.status ?? "").toUpperCase() === "OPEN").length;
  const scopedClosed = items.filter((item) => String(item.audit?.status ?? "").toUpperCase() === "CLOSED").length;

  const total = scopedTotal || Number(data.total ?? data.summary?.totalIssues ?? 0);
  const open =
    scopedTotal > 0
      ? scopedOpen
      : Number(
          data.summary?.openIssues ??
            data.summary?.byStatus?.find((item) => item.status === "OPEN")?.count ??
            0
        );
  const closed =
    scopedTotal > 0
      ? scopedClosed
      : Number(
          data.summary?.byStatus?.find((item) => item.status === "CLOSED")?.count ??
            Math.max(total - open, 0)
        );

  const skuIssueRows = items.filter((item) => {
    const code = String(item.audit?.code ?? item.audit?.reason ?? "").toUpperCase();
    return code === "PRODUCT_SKU_NOT_FOUND";
  }).length;

  const unresolvedSkuRows = items.filter((item) => {
    const status = String(item.audit?.status ?? "").toUpperCase();
    const code = String(item.audit?.code ?? item.audit?.reason ?? "").toUpperCase();
    return status === "OPEN" && code === "PRODUCT_SKU_NOT_FOUND";
  }).length;

  const resolvedSkuRows = items.filter((item) => {
    const status = String(item.audit?.status ?? "").toUpperCase();
    const code = String(item.audit?.code ?? item.audit?.reason ?? "").toUpperCase();
    return status === "CLOSED" && code === "PRODUCT_SKU_NOT_FOUND";
  }).length;

  const movementIds = new Set(
    items
      .map((item) => String(item.audit?.resolutionMovementId ?? "").trim())
      .filter(Boolean)
  );

  const deductedRows = items.filter((item) => {
    const status = String(item.audit?.status ?? "").toUpperCase();
    return status === "CLOSED" && String(item.audit?.resolutionMovementId ?? "").trim();
  }).length;

  return {
    total,
    open,
    closed,
    unresolved: open,
    resolved: closed,
    skuIssueRows: skuIssueRows || (scopedTotal ? 0 : total),
    unresolvedSkuRows,
    resolvedSkuRows,
    deductedRows,
    inventoryMovementCount: movementIds.size,
  };
}

export async function listInventoryAuditIssuesForImportJob(
  importJobId: string
): Promise<InventoryAuditIssuesForImportJobResponse> {
  const params = new URLSearchParams();
  params.set("status", "ALL");
  params.set("importJobId", importJobId);
  params.set("limit", "50");
  params.set("offset", "0");

  const url = `/api/inventory/audit-issues?${params.toString()}`;
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await readJson<InventoryAuditIssuesForImportJobResponse>(res, url);

  if (data.ok === false) {
    throw new Error(data.message || "Inventory audit import summary request failed.");
  }

  return {
    ...data,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total || data.items?.length || 0),
  };
}

export async function listExpenseImportHistory(args: {
  module?: ExpenseImportHistoryModule;
  companyId?: string;
}): Promise<ExpenseImportHistoryResponse> {
  const data = await loadImportHistorySkeleton({
    module: args.module,
    companyId: args.companyId,
  });

  const raw = data as unknown as ExpenseImportHistoryResponse;

  if (raw.ok === false) {
    throw new Error(raw.message || "Expense import history request failed.");
  }

  return {
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total || 0),
  };
}


// Step132-B-FRONTEND-AMAZON-SP-API-CONNECTION-PANEL:
// Frontend helper for the Amazon SP-API connection panel.
// This only requests the existing sanitized OAuth authorization URL route.
// It does not call real SP-API reports, does not create ImportJob, and never handles raw tokens.
export type AmazonSpApiAuthorizationUrlRequest = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  returnTo?: string;
  sandbox?: boolean;
  forceReauthorize?: boolean;
  locale?: string;
};

export type AmazonSpApiAuthorizationUrlResponse = {
  ok?: boolean;
  source?: string;
  authorizationUrl?: string;
  stateIssued?: boolean;
  stateExpiresAt?: string;
  redirectUri?: string;
  marketplaceId?: string;
  region?: string;
  storeId?: string;
  sandbox?: boolean;
  realAmazonRedirectNow?: boolean;
  tokenExchangeHttpCallNow?: boolean;
  tokenPersistenceDatabaseWriteNow?: boolean;
  realSpApiRequestNow?: boolean;
  sanitizedResult?: {
    companyId?: string;
    storeId?: string;
    marketplaceId?: string;
    region?: string;
    authorizationUrlReadyForFrontendLater?: boolean;
    oauthStatePersistencePending?: boolean;
  };
  messageRedacted?: string;
};

export async function requestAmazonSpApiAuthorizationUrl(
  args: AmazonSpApiAuthorizationUrlRequest = {}
): Promise<AmazonSpApiAuthorizationUrlResponse> {
  const params = new URLSearchParams();

  params.set("storeId", args.storeId || "store-step130b-boundary");
  params.set("marketplaceId", args.marketplaceId || "A1VC38T7YXB528");
  params.set("region", args.region || "JP");
  params.set("sandbox", args.sandbox === false ? "false" : "true");
  params.set("locale", args.locale || "ja-JP");

  if (args.returnTo) params.set("returnTo", args.returnTo);
  if (args.forceReauthorize) params.set("forceReauthorize", "true");

  const url = `/api/imports/amazon-sp-api/oauth/authorization-url?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return readJson<AmazonSpApiAuthorizationUrlResponse>(res, url);
}


// Step134-B-FRONTEND-AMAZON-SP-API-STATUS-READ:
// Read the backend connection status endpoint from the frontend panel.
// This is a sanitized status read only. It does not expose raw tokens, does not call Amazon Reports API,
// does not create ImportJob, and does not write transactions or inventory.
export type AmazonSpApiConnectionBackendStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "RECONNECT_REQUIRED"
  | "ERROR";

export type AmazonSpApiConnectionStatusRequest = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
};

export type AmazonSpApiConnectionStatusResponse = {
  ok?: boolean;
  source?: string;
  status?: AmazonSpApiConnectionBackendStatus | string;
  connected?: boolean;
  reconnectRequired?: boolean;
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  tokenExpiresAt?: string | null;
  lastConnectedAt?: string | null;
  lastStatusCheckedAt?: string | null;
  lastErrorCode?: string | null;
  message?: string;
  messageRedacted?: string;
  realSpApiRequestNow?: boolean;
  reportsApiCallNow?: boolean;
  importJobWriteNow?: boolean;
  transactionWriteNow?: boolean;
  inventoryWriteNow?: boolean;
  rawTokenReturnedNow?: boolean;
  clientSecretReturnedNow?: boolean;
  sanitizedResult?: {
    companyId?: string;
    storeId?: string;
    marketplaceId?: string;
    region?: string;
    status?: AmazonSpApiConnectionBackendStatus | string;
    connected?: boolean;
    reconnectRequired?: boolean;
  };
};

export async function readAmazonSpApiConnectionStatus(
  args: AmazonSpApiConnectionStatusRequest = {}
): Promise<AmazonSpApiConnectionStatusResponse> {
  const params = new URLSearchParams();

  params.set("storeId", args.storeId || "store-step130b-boundary");
  params.set("marketplaceId", args.marketplaceId || "A1VC38T7YXB528");
  params.set("region", args.region || "JP");

  const url = `/api/imports/amazon-sp-api/connection/status?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return readJson<AmazonSpApiConnectionStatusResponse>(res, url);
}
