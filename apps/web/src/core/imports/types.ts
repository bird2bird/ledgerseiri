export type MonthConflictPolicy =
  | "skip_existing_months"
  | "replace_existing_months";

export type DetectMonthConflictsRequest = {
  companyId?: string;
  filename?: string;
  csvText?: string;
  workbookBase64?: string;
  module?: "store-orders" | "store-operation" | string;
  sourceType?: "amazon-csv" | "excel" | string;
};

export type DetectMonthStat = {
  month: string;
  existingCount: number;
};

export type DetectMonthConflictsResponse = {
  ok?: boolean;
  action?: string;
  module?: string | null;
  companyId?: string | null;
  sourceType?: string | null;
  fileMonths: string[];
  existingMonths: string[];
  conflictMonths: string[];
  hasConflict: boolean;
  monthStats: DetectMonthStat[];
  message?: string;
};

export type PreviewImportRequest = {
  companyId?: string;
  filename?: string;
  csvText?: string;
  workbookBase64?: string;
  module?: "store-orders" | "store-operation" | string;
  sourceType?: "amazon-csv" | "excel" | string;
  monthConflictPolicy?: MonthConflictPolicy | string;
};

export type PreviewImportResponse = {
  ok?: boolean;
  action?: string;
  module?: string | null;
  companyId?: string | null;
  sourceType?: string | null;
  importJobId?: string;
  monthConflictPolicy?: string | null;
  fileMonths: string[];
  existingMonths?: string[];
  conflictMonths?: string[];
  summary?: {
    totalRows: number;
    validRows: number;
    newRows: number;
    duplicateRows: number;
    conflictRows: number;
    errorRows: number;
  };
  rows?: Array<{
    rowNo: number;
    businessMonth?: string | null;
    matchStatus: "new" | "duplicate" | "conflict" | "error" | string;
    matchReason?: string;
    normalizedPayload?: Record<string, unknown>;
  }>;
  message?: string;
};

export type CommitImportRequest = {
  companyId?: string;
  monthConflictPolicy?: MonthConflictPolicy | string;
};

export type CommitImportResponse = {
  ok?: boolean;
  action?: string;
  companyId?: string | null;
  importJobId?: string;
  monthConflictPolicy?: string | null;
  importedRows: number;
  duplicateRows: number;
  conflictRows: number;
  errorRows: number;
  deletedRows: number;
  status?: string | null;
  job?: {
    id: string;
    filename?: string | null;
    status?: string | null;
    totalRows?: number | null;
    successRows?: number | null;
    failedRows?: number | null;
    deletedRowCount?: number | null;
    importedAt?: string | null;
  } | null;
  message?: string;
};

export type ImportHistoryResponse = {
  ok?: boolean;
  action?: string;
  companyId?: string | null;
  module?: string | null;
  total?: number;
  items?: Array<{
    id: string;
    filename?: string | null;
    status?: string | null;
    module?: string | null;
    sourceType?: string | null;
    monthConflictPolicy?: string | null;
    totalRows?: number | null;
    successRows?: number | null;
    failedRows?: number | null;
    deletedRowCount?: number | null;
    fileMonthsJson?: string[] | null;
    conflictMonthsJson?: string[] | null;
    errorMessage?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    importedAt?: string | null;
  }>;
  message?: string;
};
