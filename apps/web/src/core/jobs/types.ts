export type JobStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | string;

export type ImportJobItem = {
  id: string;
  companyId?: string;
  domain?: string | null;
  filename?: string | null;
  status?: JobStatus | null;
  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ExportJobItem = {
  id: string;
  companyId?: string;
  domain?: string | null;
  format?: string | null;
  status?: JobStatus | null;
  filterJson?: unknown;
  fileUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MetaSummary = {
  total?: number;
  pending?: number;
  processing?: number;
  succeeded?: number;
  failed?: number;
};

export type ImportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ImportJobItem[];
  total?: number;
  message?: string;
};

export type ExportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ExportJobItem[];
  total?: number;
  message?: string;
};

export type ImportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  domains?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  summary?: MetaSummary;
  message?: string;
};

export type ExportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  domains?: Array<{ value: string; label: string }>;
  formats?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  summary?: MetaSummary;
  message?: string;
};

export type JobsSnapshot = {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importMeta: ImportMetaResponse | null;
  exportMeta: ExportMetaResponse | null;
};
