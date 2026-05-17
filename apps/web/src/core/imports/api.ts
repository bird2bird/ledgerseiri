
function formatImportApiErrorBodyForMessage(body: unknown): string {
  if (body == null) return "";

  if (typeof body === "string") {
    return body.length > 1200 ? `${body.slice(0, 1200)}...` : body;
  }

  try {
    const value = body as any;
    const parts: string[] = [];

    const message = value?.message;
    const code = value?.code;
    const amazonStatus = value?.amazonStatus;
    const httpStatus = value?.httpStatus;
    const requestSummary = value?.requestSummary;
    const sanitizedResponse = value?.sanitizedResponse;

    if (message) parts.push(`message=${String(message)}`);
    if (code) parts.push(`code=${String(code)}`);
    if (amazonStatus) parts.push(`amazonStatus=${String(amazonStatus)}`);
    if (httpStatus !== undefined && httpStatus !== null) parts.push(`httpStatus=${String(httpStatus)}`);

    if (requestSummary) {
      parts.push(`requestSummary=${JSON.stringify(requestSummary)}`);
    }

    if (sanitizedResponse) {
      parts.push(`sanitizedResponse=${JSON.stringify(sanitizedResponse).slice(0, 1200)}`);
    }

    if (parts.length) return parts.join(" | ");

    return JSON.stringify(body).slice(0, 1200);
  } catch {
    return String(body);
  }
}

import type {
  AmazonSpApiConnectionStatusFrontendBackendStatus,
  AmazonSpApiConnectionStatusFrontendReadModelStatus,
  AmazonSpApiConnectionStatusFrontendResponse,
} from "@/components/app/imports/amazon-sp-api-connection-status-frontend-contract";

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
  const text = await res.text();
  let parsed: unknown = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const details = formatImportApiErrorBodyForMessage(parsed);
    throw new Error(details ? `${label} failed: ${res.status} | ${details}` : `${label} failed: ${res.status}`);
  }

  return parsed as T;
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

  params.set("storeId", args.storeId || "cmn4jghll0005o901075vk5w4");
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
// Step139-Z2-FRONTEND-AMAZON-SP-API-REAL-STATUS-API-HELPER:
// Read the backend real DB connection status endpoint from the frontend panel.
// This helper consumes the Step139-Y3 sanitized read-model response:
// AmazonSpApiConnection + AmazonSpApiCredential + AmazonSpApiAccessTokenCache.
// It does not expose raw tokens, does not call Amazon Orders/Reports API,
// does not create ImportJob, and does not write transactions or inventory.
export type AmazonSpApiConnectionBackendStatus =
  AmazonSpApiConnectionStatusFrontendBackendStatus;

export type AmazonSpApiConnectionReadModelStatus =
  AmazonSpApiConnectionStatusFrontendReadModelStatus;

export type AmazonSpApiConnectionStatusRequest = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
};

export type AmazonSpApiConnectionStatusResponse =
  AmazonSpApiConnectionStatusFrontendResponse & {
    ok?: boolean;
    message?: string;
    messageRedacted?: string;
    reconnectRequired?: boolean;
    tokenExpiresAt?: string | null;
    lastConnectedAt?: string | null;
    lastStatusCheckedAt?: string | null;
    reportsApiCallNow?: false;
    rawTokenReturnedNow?: false;
    clientSecretReturnedNow?: false;
    sanitizedResult?: {
      companyId?: string;
      storeId?: string;
      marketplaceId?: string;
      region?: string;
      status?: AmazonSpApiConnectionBackendStatus | string;
      readModelStatus?: AmazonSpApiConnectionReadModelStatus | string;
      connected?: boolean;
      reconnectRequired?: boolean;
      credentialPresent?: boolean;
      accessTokenCachePresent?: boolean;
      accessTokenExpired?: boolean;
    };
  };

export const AMAZON_SP_API_CONNECTION_STATUS_ENDPOINT =
  "/api/imports/amazon-sp-api/connection/status" as const;

export const AMAZON_SP_API_DEFAULT_MARKETPLACE_ID = "A1VC38T7YXB528" as const;
export const AMAZON_SP_API_DEFAULT_REGION = "JP" as const;
export const AMAZON_SP_API_DEFAULT_STORE_ID = "cmn4jghll0005o901075vk5w4" as const;

export function buildAmazonSpApiConnectionStatusUrl(
  args: AmazonSpApiConnectionStatusRequest = {}
): string {
  const params = new URLSearchParams();

  params.set("storeId", args.storeId || AMAZON_SP_API_DEFAULT_STORE_ID);
  params.set("marketplaceId", args.marketplaceId || AMAZON_SP_API_DEFAULT_MARKETPLACE_ID);
  params.set("region", args.region || AMAZON_SP_API_DEFAULT_REGION);

  return `${AMAZON_SP_API_CONNECTION_STATUS_ENDPOINT}?${params.toString()}`;
}

export function assertAmazonSpApiConnectionStatusResponseIsSanitized(
  data: AmazonSpApiConnectionStatusResponse
): AmazonSpApiConnectionStatusResponse {
  const unsafePayload = JSON.stringify(data);

  for (const forbidden of [
    "encrypted-refresh-secret",
    "encrypted-access-secret",
    "AUTHORIZATION_CODE_SECRET",
    "RAW_LWA_RESPONSE_SECRET",
    "PLAINTEXT_ACCESS_TOKEN",
    "PLAINTEXT_REFRESH_TOKEN",
  ]) {
    if (unsafePayload.includes(forbidden)) {
      throw new Error("Amazon SP-API connection status response exposed a forbidden secret marker.");
    }
  }

  if (data.rawAuthorizationCodeReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return raw authorization code.");
  }
  if (data.rawLwaResponseReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return raw LWA response.");
  }
  if (data.rawAccessTokenReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return raw access token.");
  }
  if (data.rawRefreshTokenReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return raw refresh token.");
  }
  if (data.encryptedRefreshTokenReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return encrypted refresh token.");
  }
  if (data.encryptedAccessTokenReturnedNow !== false) {
    throw new Error("Amazon SP-API status response must not return encrypted access token.");
  }

  return data;
}

export async function readAmazonSpApiConnectionStatus(
  args: AmazonSpApiConnectionStatusRequest = {}
): Promise<AmazonSpApiConnectionStatusResponse> {
  const url = buildAmazonSpApiConnectionStatusUrl(args);
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await readJson<AmazonSpApiConnectionStatusResponse>(res, url);
  return assertAmazonSpApiConnectionStatusResponseIsSanitized(data);
}

// Step140-L-FRONTEND-AMAZON-SP-API-ORDERS-DRY-RUN-PREVIEW:
// Frontend helper for the backend dry-run-only route:
// POST /api/imports/amazon-sp-api/orders/preview
// This calls only the Step140-K dry-run preview controller route.
// It does not call Amazon directly, does not write ImportJob/StagingRow/Transaction/Inventory,
// and commit remains disabled in the frontend.
export type AmazonSpApiOrdersDryRunPreviewRequest = {
  storeId: string;
  marketplaceId?: string;
  region?: string;
  createdAfter: string;
  createdBefore: string;
  orderStatuses?: string[];
  dryRun: true;
};

export type AmazonSpApiOrdersDryRunPreviewResponse = {
  requestId?: string;
  source?: "amazon-sp-api-orders-dry-run-fixture" | string;
  dryRun: true;
  routeImplementedNow?: true;
  route?: "/api/imports/amazon-sp-api/orders/preview" | string;
  guardedBy?: "JwtAuthGuard" | string;
  controllerMode?: "dry-run-preview-only" | string;
  controllerWritesDatabase?: false;
  controllerCallsAmazon?: false;
  controllerUsesHttpClient?: false;
  controllerUsesSigV4?: false;
  importJobWriteNow?: false;
  importStagingRowWriteNow?: false;
  transactionWriteNow?: false;
  inventoryWriteNow?: false;
  service?: "AmazonSpApiOrdersPreviewService" | string;
  previewMode?: "dry-run-fixture" | string;
  serviceWritesDatabase?: false;
  serviceCallsAmazon?: false;
  companyId?: string;
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  normalizedOrders?: Array<{
    amazonOrderId?: string;
    purchaseDate?: string;
    businessMonth?: string;
    orderStatus?: string;
    currencyCode?: string;
    orderTotalAmount?: number;
    itemCount?: number;
    dedupeHash?: string;
  }>;
  normalizedOrderItems?: Array<{
    amazonOrderId?: string;
    orderItemId?: string;
    asin?: string;
    sellerSku?: string | null;
    title?: string;
    quantityOrdered?: number;
    itemPriceAmount?: number;
    itemTaxAmount?: number;
    itemCurrencyCode?: string;
    itemLevelDedupeHash?: string;
  }>;
  validationSummary?: {
    totalOrders?: number;
    totalOrderItems?: number;
    validationErrorCount?: number;
    warningCount?: number;
    commitEligibleCount?: number;
  };
  dedupeSummary?: {
    duplicateOrdersCount?: number;
    duplicateItemsCount?: number;
    uniqueOrderDedupeHashes?: string[];
    uniqueItemDedupeHashes?: string[];
  };
  skuResolutionSummary?: {
    resolvedSkuCount?: number;
    unresolvedSkuCount?: number;
    unresolvedSellerSkus?: string[];
    inventoryBlockedCount?: number;
  };
  inventoryImpactPreview?: {
    wouldDeductInventory?: false;
    blockedBecauseDryRun?: true;
    blockedBecauseUnresolvedSkuCount?: number;
    impacts?: Array<{
      sellerSku?: string | null;
      quantityOrdered?: number;
      resolutionStatus?: "resolved" | "unresolved" | string;
      wouldDeductQuantity?: number;
    }>;
  };
  transactionImpactPreview?: {
    wouldCreateTransactions?: false;
    blockedBecauseDryRun?: true;
    transactionPreviewCount?: number;
    totalPreviewAmount?: number;
    currencyCode?: string;
  };
  warnings?: string[];
  writesDatabase?: false;
  realAmazonOrdersApiCall?: false;
};

export const AMAZON_SP_API_ORDERS_DRY_RUN_PREVIEW_ENDPOINT =
  "/api/imports/amazon-sp-api/orders/preview" as const;

export async function previewAmazonSpApiOrdersDryRun(
  payload: AmazonSpApiOrdersDryRunPreviewRequest
): Promise<AmazonSpApiOrdersDryRunPreviewResponse> {
  return postJson<AmazonSpApiOrdersDryRunPreviewResponse>(
    AMAZON_SP_API_ORDERS_DRY_RUN_PREVIEW_ENDPOINT,
    {
      ...payload,
      dryRun: true,
    }
  );
}
// Step140-V-FRONTEND-AMAZON-SP-API-ORDERS-REAL-PREVIEW:
// Frontend helper for the guarded backend route:
// POST /api/imports/amazon-sp-api/orders/real-preview
// This does not call Amazon directly from the browser and does not write ImportJob/StagingRow/Transaction/Inventory.
// Step140-V route uses mocked server transport until Step140-W implements server-only raw signed real network transport.
export type AmazonSpApiOrdersRealPreviewRequest = {
  storeId: string;
  marketplaceId?: string;
  region?: string;
  createdAfter: string;
  createdBefore?: string;
  orderStatuses?: string[];
  maxResultsPerPage?: number;
  realPreview: true;
};


export type AmazonSpApiOrdersRealPreviewProductionVerification = {
  step?: "Step141-A" | string;
  source?: "amazon-sp-api-orders-real-preview-production-verification" | string;
  accepted?: boolean;
  reason?: string;
  messageRedacted?: string;
  transportMode?: string;
  credentialSource?: "env" | "repository" | string;
  previewMode?: string | null;
  dryRun?: boolean | null;
  orderCount?: number;
  orderItemCount?: number;
  unresolvedSkuCount?: number;
  incomePreviewAmount?: number | null;
  accessTokenRefresh?: {
    attempted?: boolean;
    accepted?: boolean | null;
    reason?: string | null;
    cacheWriteNow?: boolean;
  };
  productionReadiness?: {
    canProceedToStep141BImportJobPersistence?: boolean;
    requiresRealAmazonData?: boolean;
    requiresPaginationVerification?: boolean;
    requiresErrorMappingVerification?: boolean;
    requiresCredentialStabilityVerification?: boolean;
  };
  boundaries?: {
    writesImportJob?: false;
    writesImportStagingRow?: false;
    writesTransaction?: false;
    writesInventory?: false;
    returnsRawAccessToken?: false;
    returnsRawRefreshToken?: false;
    returnsAwsSecret?: false;
  };
};

export type AmazonSpApiOrdersRealPreviewResponse =
  Omit<AmazonSpApiOrdersDryRunPreviewResponse, "dryRun" | "source" | "previewMode" | "controllerMode"> & {
    source?: "amazon-sp-api-orders-real-preview" | string;
    previewMode?: "real-http-mocked-transport-no-persistence" | string;
    dryRun: false;
    realPreview?: true;
    routeImplementedNow?: true;
    route?: "/api/imports/amazon-sp-api/orders/real-preview" | string;
    controllerMode?: "real-preview-guarded-mocked-transport-until-step140-w" | string;
    controllerWritesDatabase?: false;
    controllerCallsAmazon?: boolean;
    controllerUsesHttpClient?: true;
    controllerUsesSigV4?: true;
    controllerTransportMode?: "mocked-server-transport" | "blocked-real-network-pending-step140-w" | string;
    realNetworkTransportImplementedNow?: false;
    step140WRequiredForLiveAmazonNetwork?: true;
    productionVerification?: AmazonSpApiOrdersRealPreviewProductionVerification;
  };

export const AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT =
  "/api/imports/amazon-sp-api/orders/real-preview" as const;

export async function previewAmazonSpApiOrdersReal(
  payload: AmazonSpApiOrdersRealPreviewRequest
): Promise<AmazonSpApiOrdersRealPreviewResponse> {
  return postJson<AmazonSpApiOrdersRealPreviewResponse>(
    AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT,
    {
      ...payload,
      realPreview: true,
    }
  );
}


// Step141-C-FRONTEND-AMAZON-SP-API-ORDERS-REAL-IMPORTJOB-COMMIT:
// Frontend helper for backend route:
// POST /api/imports/amazon-sp-api/orders/real-importjob
// Browser never receives raw LWA/AWS credentials. This only asks the server to persist a verified real preview
// into ImportJob + ImportStagingRow. It does not create Transactions or deduct Inventory.
export type AmazonSpApiOrdersRealImportJobCommitRequest = AmazonSpApiOrdersRealPreviewRequest & {
  realPreview: true;
};

export type AmazonSpApiOrdersRealImportJobCommitResponse = {
  step?: "Step141-B" | string;
  source?: "amazon-sp-api-orders-real-importjob-staging-persistence" | string;
  accepted?: boolean;
  reason?: string;
  messageRedacted?: string;
  companyId?: string;
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  importJobId?: string | null;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  businessMonths?: string[];
  fileHash?: string | null;
  filename?: string | null;
  domain?: "income" | string;
  module?: "store-orders" | string;
  sourceType?: "amazon-sp-api-orders" | string;
  routeImplementedNow?: true;
  controllerRoute?: "POST /api/imports/amazon-sp-api/orders/real-importjob" | string;
  controllerWritesImportJob?: boolean;
  controllerWritesImportStagingRows?: boolean;
  controllerWritesTransaction?: false;
  controllerWritesInventory?: false;
  boundaries?: {
    writesImportJob?: boolean;
    writesImportStagingRow?: boolean;
    writesTransaction?: false;
    writesInventory?: false;
    writesInventoryMovement?: false;
    callsAmazon?: false;
    returnsRawAccessToken?: false;
    returnsRawRefreshToken?: false;
    returnsAwsSecret?: false;
  };
};

export const AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT =
  "/api/imports/amazon-sp-api/orders/real-importjob" as const;

export async function commitAmazonSpApiOrdersRealImportJob(
  payload: AmazonSpApiOrdersRealImportJobCommitRequest
): Promise<AmazonSpApiOrdersRealImportJobCommitResponse> {
  return postJson<AmazonSpApiOrdersRealImportJobCommitResponse>(
    AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT,
    {
      ...payload,
      realPreview: true,
    }
  );
}


// Step141-G2-FRONTEND-AMAZON-SP-API-STAGING-COMMIT-READINESS:
// Frontend read helper for backend dry-run readiness endpoint.
// This is review-only UI wiring. It does not create Transaction or InventoryMovement.
export type AmazonSpApiOrdersStagingCommitReadinessRow = {
  stagingRowId: string;
  rowNo: number;
  businessMonth: string | null;
  matchStatus: string;
  matchReason: string | null;
  dedupeHash: string | null;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  asin: string | null;
  itemPriceAmount: number | null;
  quantityOrdered: number | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  readiness: "READY" | "BLOCKED" | string;
  blockers: string[];
  warnings: string[];
};

export type AmazonSpApiOrdersStagingCommitReadinessResponse = {
  source?: "amazon-sp-api-orders-staging-commit-readiness" | string;
  route?: "/api/imports/amazon-sp-api/orders/staging-commit-readiness" | string;
  dryRun?: true;
  writesDatabase?: false;
  transactionWriteNow?: false;
  inventoryWriteNow?: false;
  importJobId?: string;
  importJobFound?: boolean;
  sourceType?: "amazon-sp-api-orders" | string | null;
  status?: string | null;
  totalRows?: number;
  readyRows?: number;
  blockedRows?: number;
  duplicateRows?: number;
  existingTransactionRows?: number;
  existingInventoryMovementRows?: number;
  unresolvedSkuRows?: number;
  missingAmountRows?: number;
  missingOrderIdentityRows?: number;
  canCommit?: boolean;
  commitBlockedReasons?: string[];
  rows?: AmazonSpApiOrdersStagingCommitReadinessRow[];
};

export const AMAZON_SP_API_ORDERS_STAGING_COMMIT_READINESS_ENDPOINT =
  "/api/imports/amazon-sp-api/orders/staging-commit-readiness" as const;

export async function readAmazonSpApiOrdersStagingCommitReadiness(
  importJobId: string
): Promise<AmazonSpApiOrdersStagingCommitReadinessResponse> {
  return postJson<AmazonSpApiOrdersStagingCommitReadinessResponse>(
    AMAZON_SP_API_ORDERS_STAGING_COMMIT_READINESS_ENDPOINT,
    {
      importJobId,
      dryRun: true,
    }
  );
}


// Step142-B4: Frontend helper for backend read-only income Transaction dry-run route.
// This route is dry-run only and must not create Transaction / InventoryMovement.
export type AmazonSpApiOrdersIncomeTransactionDryRunRow = {
  stagingRowId: string;
  rowNo: number | null;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  productSkuId: string | null;
  amount: number | null;
  asin?: string | null;
  title?: string | null;
  itemPriceAmount?: number | null;
  itemTaxAmount?: number | null;
  shippingPriceAmount?: number | null;
  candidateAmount?: number | null;
  amountPolicy?: "ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX" | string;
  orderStatus?: string | null;
  orderTotalAmount?: number | null;
  currency: string;
  businessDate: string | null;
  businessMonth: string | null;
  dedupeHash: string | null;
  existingTransactionId: string | null;
  blockers: string[];
  warnings: string[];
};

export type AmazonSpApiOrdersIncomeTransactionDryRunResponse = {
  source: "amazon-sp-api-orders-income-transaction-dry-run" | string;
  dryRun: true;
  route: "service-only" | string;
  companyId: string;
  importJobId: string;
  sourceType: "amazon-sp-api-orders" | string;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  writesDatabase: false;
  summary: {
    totalRows: number;
    previewableRows: number;
    blockedRows: number;
    duplicateRows: number;
    existingTransactionRows: number;
    missingAmountRows: number;
    missingOrderIdentityRows: number;
    itemPriceTotal?: number;
    itemTaxTotal?: number;
    shippingPriceTotal?: number;
    candidateAmountTotal?: number;
    amountPolicy?: "ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX" | string;
  };
  rows: AmazonSpApiOrdersIncomeTransactionDryRunRow[];
  guardrails: {
    doesNotCreateTransaction: true;
    doesNotCreateInventoryMovement: true;
    doesNotUpdateImportJob: true;
    doesNotUpdateImportStagingRow: true;
    serviceOnly: true;
  };
};

export const AMAZON_SP_API_ORDERS_INCOME_TRANSACTION_DRY_RUN_ROUTE =
  "/api/imports/amazon-sp-api/orders/income-transaction-dry-run" as const;

export async function fetchAmazonSpApiOrdersIncomeTransactionDryRun(args: {
  importJobId: string;
  companyId?: string | null;
}): Promise<AmazonSpApiOrdersIncomeTransactionDryRunResponse> {
  const importJobId = String(args.importJobId || "").trim();
  if (!importJobId) {
    throw new Error("importJobId is required for Amazon SP-API Orders income transaction dry-run.");
  }

  const params = new URLSearchParams();
  params.set("importJobId", importJobId);

  const companyId = String(args.companyId || "").trim();
  if (companyId) {
    params.set("companyId", companyId);
  }

  const url = `${AMAZON_SP_API_ORDERS_INCOME_TRANSACTION_DRY_RUN_ROUTE}?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
  });
  const data = await readJson<AmazonSpApiOrdersIncomeTransactionDryRunResponse>(
    res,
    "amazon-sp-api-orders-income-transaction-dry-run"
  );

  if (data.dryRun !== true) {
    throw new Error("Amazon SP-API Orders income transaction dry-run response must have dryRun=true.");
  }
  if (data.writesDatabase !== false) {
    throw new Error("Amazon SP-API Orders income transaction dry-run response must have writesDatabase=false.");
  }
  if (data.transactionWriteNow !== false) {
    throw new Error("Amazon SP-API Orders income transaction dry-run response must have transactionWriteNow=false.");
  }
  if (data.inventoryWriteNow !== false) {
    throw new Error("Amazon SP-API Orders income transaction dry-run response must have inventoryWriteNow=false.");
  }

  return data;
}

