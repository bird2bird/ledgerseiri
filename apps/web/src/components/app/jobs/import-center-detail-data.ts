import type { ImportJobTransactionTraceItem } from "./import-center-routing";

// Step109-Z1-H15-C-IMPORT-CENTER-DETAIL-DATA:
// Extract ImportJob detail data types and fetch helper.
// Keep API contracts unchanged:
// - GET /api/import-jobs/:id/staging-rows
// - GET /api/import-jobs/:id/transactions

export type ImportJobStagingRowItem = {
  id: string;
  importJobId?: string | null;
  companyId?: string | null;
  module?: string | null;
  rowNo?: number | null;
  businessMonth?: string | null;
  rawPayloadJson?: unknown;
  normalizedPayloadJson?: unknown;
  dedupeHash?: string | null;
  matchStatus?: string | null;
  matchReason?: string | null;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
  createdAt?: string | null;
};

export type ImportJobDetailFetchState = {
  loading: boolean;
  error: string | null;
  stagingRows: ImportJobStagingRowItem[];
  transactions: ImportJobTransactionTraceItem[];
};

export const EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE: ImportJobDetailFetchState = {
  loading: false,
  error: null,
  stagingRows: [],
  transactions: [],
};

export async function fetchImportJobDetailRows(importJobId: string): Promise<{
  stagingRows: ImportJobStagingRowItem[];
  transactions: ImportJobTransactionTraceItem[];
}> {
  const [stagingRes, transactionsRes] = await Promise.all([
    fetch(`/api/import-jobs/${encodeURIComponent(importJobId)}/staging-rows`, {
      cache: "no-store",
    }),
    fetch(`/api/import-jobs/${encodeURIComponent(importJobId)}/transactions`, {
      cache: "no-store",
    }),
  ]);

  if (!stagingRes.ok) {
    throw new Error(`staging rows request failed: ${stagingRes.status}`);
  }

  if (!transactionsRes.ok) {
    throw new Error(`transactions request failed: ${transactionsRes.status}`);
  }

  const stagingJson = await stagingRes.json();
  const transactionsJson = await transactionsRes.json();

  if (stagingJson?.ok === false) {
    throw new Error(stagingJson?.message || "staging rows request failed");
  }

  if (transactionsJson?.ok === false) {
    throw new Error(transactionsJson?.message || "transactions request failed");
  }

  return {
    stagingRows: Array.isArray(stagingJson?.items) ? stagingJson.items : [],
    transactions: Array.isArray(transactionsJson?.items) ? transactionsJson.items : [],
  };
}
