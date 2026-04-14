import type {
  AmazonStoreOrdersPreviewResponse,
  ExportJobsResponse,
  ExportMetaResponse,
  ImportJobsResponse,
  ImportMetaResponse,
  JobsSnapshot,
} from "./types";

async function readJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loadImportJobsPageSnapshot(): Promise<{
  jobs: ImportJobsResponse;
  meta: ImportMetaResponse;
}> {
  const [jobsRes, metaRes] = await Promise.all([
    fetch("/api/import-jobs", {
      credentials: "include",
      cache: "no-store",
    }),
    fetch("/api/import-jobs/meta", {
      credentials: "include",
      cache: "no-store",
    }),
  ]);

  const [jobs, meta] = await Promise.all([
    readJson<ImportJobsResponse>(jobsRes, "/api/import-jobs"),
    readJson<ImportMetaResponse>(metaRes, "/api/import-jobs/meta"),
  ]);

  return { jobs, meta };
}

export async function loadExportJobsPageSnapshot(): Promise<{
  jobs: ExportJobsResponse;
  meta: ExportMetaResponse;
}> {
  const [jobsRes, metaRes] = await Promise.all([
    fetch("/api/export-jobs", {
      credentials: "include",
      cache: "no-store",
    }),
    fetch("/api/export-jobs/meta", {
      credentials: "include",
      cache: "no-store",
    }),
  ]);

  const [jobs, meta] = await Promise.all([
    readJson<ExportJobsResponse>(jobsRes, "/api/export-jobs"),
    readJson<ExportMetaResponse>(metaRes, "/api/export-jobs/meta"),
  ]);

  return { jobs, meta };
}

export async function loadJobsSnapshot(): Promise<JobsSnapshot> {
  const [importJobsRes, importMetaRes, exportJobsRes, exportMetaRes] = await Promise.all([
    fetch("/api/import-jobs", { credentials: "include", cache: "no-store" }),
    fetch("/api/import-jobs/meta", { credentials: "include", cache: "no-store" }),
    fetch("/api/export-jobs", { credentials: "include", cache: "no-store" }),
    fetch("/api/export-jobs/meta", { credentials: "include", cache: "no-store" }),
  ]);

  const [importJobs, importMeta, exportJobs, exportMeta] = await Promise.all([
    readJson<ImportJobsResponse>(importJobsRes, "/api/import-jobs"),
    readJson<ImportMetaResponse>(importMetaRes, "/api/import-jobs/meta"),
    readJson<ExportJobsResponse>(exportJobsRes, "/api/export-jobs"),
    readJson<ExportMetaResponse>(exportMetaRes, "/api/export-jobs/meta"),
  ]);

  return {
    importItems: Array.isArray(importJobs?.items) ? importJobs.items : [],
    exportItems: Array.isArray(exportJobs?.items) ? exportJobs.items : [],
    importMeta: importMeta || null,
    exportMeta: exportMeta || null,
  };
}

async function postImportJobJson<T>(payload: unknown): Promise<T> {
  const res = await fetch("/api/import-jobs", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await readJson<T & { ok?: boolean; message?: string }>(res, "/api/import-jobs");
  if (body && body.ok === false) {
    throw new Error(body.message || "import-jobs request failed");
  }
  return body as T;
}

export async function previewAmazonStoreOrdersCsv(args: {
  filename: string;
  csvText: string;
}): Promise<AmazonStoreOrdersPreviewResponse> {
  return postImportJobJson<AmazonStoreOrdersPreviewResponse>({
    domain: "amazon-store-orders",
    filename: args.filename,
    csvText: args.csvText,
    commit: false,
  });
}

export async function createAmazonStoreOrdersImportJob(args: {
  filename: string;
  csvText: string;
}): Promise<AmazonStoreOrdersPreviewResponse> {
  return postImportJobJson<AmazonStoreOrdersPreviewResponse>({
    domain: "amazon-store-orders",
    filename: args.filename,
    csvText: args.csvText,
    commit: true,
  });
}

