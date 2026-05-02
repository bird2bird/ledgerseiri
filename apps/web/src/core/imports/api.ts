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
export type IncomeImportHistoryModule = "cash-income" | "other-income";

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
