export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_ENDPOINT =
  "/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model" as const;

export type AmazonSpApiSandboxImportJobReadModelFilter =
  | "all"
  | "amazon-sp-api-sandbox"
  | "pending-review"
  | "uncommitted-staging"
  | "invalid-sp-api-sandbox";

export type AmazonSpApiSandboxImportJobReadModelSort =
  | "createdAt_desc"
  | "createdAt_asc"
  | "filename_asc"
  | "filename_desc"
  | "totalRows_desc"
  | "totalRows_asc";

export type AmazonSpApiSandboxImportJobReadModelPageSize = 20 | 50 | 100;

export type AmazonSpApiSandboxImportJobReadModelRequest = {
  filter?: AmazonSpApiSandboxImportJobReadModelFilter;
  sort?: AmazonSpApiSandboxImportJobReadModelSort;
  page?: number;
  pageSize?: AmazonSpApiSandboxImportJobReadModelPageSize;
};

export type AmazonSpApiSandboxImportJobReadModelRow = {
  id: string;
  filename: string | null;
  sourceType: "amazon-sp-api-sandbox";
  module: string | null;
  status: string;
  displayStatus: string;
  classification: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  stagingRows: number;
  createdAt: string | null;
  updatedAt: string | null;
  importedAt: string | null;
  allowedActions: {
    viewOnly: true;
    commitSales: false;
    executeInventory: false;
    realSpApi: false;
    oauth: false;
  };
};

export type AmazonSpApiSandboxImportJobReadModelSuccess = {
  ok: true;
  status: 200;
  dryRun: true;
  displayOnly: true;
  sourceType: "amazon-sp-api-sandbox";
  rows: AmazonSpApiSandboxImportJobReadModelRow[];
  page: number;
  pageSize: AmazonSpApiSandboxImportJobReadModelPageSize;
  totalRows: number;
  totalPages: number;
};

export type AmazonSpApiSandboxImportJobReadModelClientErrorKind =
  | "invalid-query"
  | "unauthenticated"
  | "forbidden-or-tenant-suspended"
  | "unexpected-status"
  | "unsafe-response";

export type AmazonSpApiSandboxImportJobReadModelFailure = {
  ok: false;
  status: number;
  kind: AmazonSpApiSandboxImportJobReadModelClientErrorKind;
  message: string;
};

export type AmazonSpApiSandboxImportJobReadModelResult =
  | AmazonSpApiSandboxImportJobReadModelSuccess
  | AmazonSpApiSandboxImportJobReadModelFailure;

const ALLOWED_FILTERS = new Set<string>([
  "all",
  "amazon-sp-api-sandbox",
  "pending-review",
  "uncommitted-staging",
  "invalid-sp-api-sandbox",
]);

const ALLOWED_SORTS = new Set<string>([
  "createdAt_desc",
  "createdAt_asc",
  "filename_asc",
  "filename_desc",
  "totalRows_desc",
  "totalRows_asc",
]);

const ALLOWED_PAGE_SIZES = new Set<number>([20, 50, 100]);

const FORBIDDEN_RESPONSE_FIELDS = [
  "companyId",
  "rawPayloadJson",
  "normalizedPayloadJson",
  "dedupeHash",
  "fileMonthsJson",
  "conflictMonthsJson",
  "raw",
  "payload",
  "normalizedPayload",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const integer = Math.floor(value);
  return integer >= 1 ? integer : fallback;
}

function normalizeFilter(value: AmazonSpApiSandboxImportJobReadModelRequest["filter"]): AmazonSpApiSandboxImportJobReadModelFilter {
  return value && ALLOWED_FILTERS.has(value) ? value : "amazon-sp-api-sandbox";
}

function normalizeSort(value: AmazonSpApiSandboxImportJobReadModelRequest["sort"]): AmazonSpApiSandboxImportJobReadModelSort {
  return value && ALLOWED_SORTS.has(value) ? value : "createdAt_desc";
}

function normalizePageSize(value: AmazonSpApiSandboxImportJobReadModelRequest["pageSize"]): AmazonSpApiSandboxImportJobReadModelPageSize {
  return typeof value === "number" && ALLOWED_PAGE_SIZES.has(value) ? value : 20;
}

export function buildAmazonSpApiSandboxImportJobReadModelUrl(
  input: AmazonSpApiSandboxImportJobReadModelRequest = {},
): string {
  const params = new URLSearchParams();

  params.set("filter", normalizeFilter(input.filter));
  params.set("sort", normalizeSort(input.sort));
  params.set("page", String(toPositiveInteger(input.page, 1)));
  params.set("pageSize", String(normalizePageSize(input.pageSize)));
  params.set("dryRun", "true");

  return `${AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_ENDPOINT}?${params.toString()}`;
}

function fail(status: number, kind: AmazonSpApiSandboxImportJobReadModelClientErrorKind, message: string): AmazonSpApiSandboxImportJobReadModelFailure {
  return {
    ok: false,
    status,
    kind,
    message,
  };
}

function isAmazonSpApiSandboxImportJobReadModelFailure(
  value: AmazonSpApiSandboxImportJobReadModelRow | AmazonSpApiSandboxImportJobReadModelFailure,
): value is AmazonSpApiSandboxImportJobReadModelFailure {
  return "ok" in value && value.ok === false;
}

function assertNoForbiddenFields(record: Record<string, unknown>, context: string): AmazonSpApiSandboxImportJobReadModelFailure | null {
  for (const field of FORBIDDEN_RESPONSE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      return fail(200, "unsafe-response", `${context} contains forbidden field: ${field}`);
    }
  }

  return null;
}

function parseAllowedActions(value: unknown): AmazonSpApiSandboxImportJobReadModelRow["allowedActions"] {
  if (!isRecord(value)) {
    return {
      viewOnly: true,
      commitSales: false,
      executeInventory: false,
      realSpApi: false,
      oauth: false,
    };
  }

  return {
    // Step122-X: viewOnly is intentionally a literal true.
    // Commit / inventory / real SP-API / OAuth remain disabled regardless of server payload.
    viewOnly: true,
    commitSales: false,
    executeInventory: false,
    realSpApi: false,
    oauth: false,
  };
}

function parseRow(value: unknown): AmazonSpApiSandboxImportJobReadModelRow | AmazonSpApiSandboxImportJobReadModelFailure {
  if (!isRecord(value)) {
    return fail(200, "unsafe-response", "row must be an object");
  }

  const forbidden = assertNoForbiddenFields(value, "row");
  if (forbidden) return forbidden;

  if (typeof value.id !== "string") return fail(200, "unsafe-response", "row.id must be string");
  if (value.sourceType !== "amazon-sp-api-sandbox") return fail(200, "unsafe-response", "row.sourceType must be amazon-sp-api-sandbox");

  return {
    id: value.id,
    filename: typeof value.filename === "string" ? value.filename : null,
    sourceType: "amazon-sp-api-sandbox",
    module: typeof value.module === "string" ? value.module : null,
    status: typeof value.status === "string" ? value.status : "",
    displayStatus: typeof value.displayStatus === "string" ? value.displayStatus : "",
    classification: typeof value.classification === "string" ? value.classification : "",
    totalRows: typeof value.totalRows === "number" ? value.totalRows : 0,
    successRows: typeof value.successRows === "number" ? value.successRows : 0,
    failedRows: typeof value.failedRows === "number" ? value.failedRows : 0,
    stagingRows: typeof value.stagingRows === "number" ? value.stagingRows : 0,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    importedAt: typeof value.importedAt === "string" ? value.importedAt : null,
    allowedActions: parseAllowedActions(value.allowedActions),
  };
}

function parseSuccessPayload(payload: unknown): AmazonSpApiSandboxImportJobReadModelResult {
  if (!isRecord(payload)) {
    return fail(200, "unsafe-response", "response must be an object");
  }

  const forbidden = assertNoForbiddenFields(payload, "response");
  if (forbidden) return forbidden;

  if (payload.dryRun !== true) return fail(200, "unsafe-response", "response.dryRun must be true");
  if (payload.displayOnly !== true) return fail(200, "unsafe-response", "response.displayOnly must be true");
  if (payload.sourceType !== "amazon-sp-api-sandbox") {
    return fail(200, "unsafe-response", "response.sourceType must be amazon-sp-api-sandbox");
  }

  if (!Array.isArray(payload.rows)) return fail(200, "unsafe-response", "response.rows must be an array");

  const rows: AmazonSpApiSandboxImportJobReadModelRow[] = [];
  for (const item of payload.rows) {
    const row = parseRow(item);
    if (isAmazonSpApiSandboxImportJobReadModelFailure(row)) return row;
    rows.push(row);
  }

  const page = typeof payload.page === "number" ? payload.page : 1;
  const pageSize = typeof payload.pageSize === "number" && ALLOWED_PAGE_SIZES.has(payload.pageSize)
    ? (payload.pageSize as AmazonSpApiSandboxImportJobReadModelPageSize)
    : 20;

  return {
    ok: true,
    status: 200,
    dryRun: true,
    displayOnly: true,
    sourceType: "amazon-sp-api-sandbox",
    rows,
    page,
    pageSize,
    totalRows: typeof payload.totalRows === "number" ? payload.totalRows : rows.length,
    totalPages: typeof payload.totalPages === "number" ? payload.totalPages : 1,
  };
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAmazonSpApiSandboxImportJobReadModel(
  input: AmazonSpApiSandboxImportJobReadModelRequest = {},
): Promise<AmazonSpApiSandboxImportJobReadModelResult> {
  const response = await fetch(buildAmazonSpApiSandboxImportJobReadModelUrl(input), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    return fail(401, "unauthenticated", "ログインが必要です。再度ログインしてください。");
  }

  if (response.status === 403) {
    return fail(403, "forbidden-or-tenant-suspended", "このデータを表示する権限がありません。");
  }

  if (response.status === 400) {
    return fail(400, "invalid-query", "検索条件が正しくありません。フィルターまたはページサイズを確認してください。");
  }

  if (response.status !== 200) {
    return fail(response.status, "unexpected-status", `Unexpected response status: ${response.status}`);
  }

  return parseSuccessPayload(await safeJson(response));
}
