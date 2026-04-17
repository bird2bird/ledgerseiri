import type {
  CommitImportRequest,
  CommitImportResponse,
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
