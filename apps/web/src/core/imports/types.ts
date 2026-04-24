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

export type ImportResultSummary = {
  importJobId?: string;
  module?: string | null;
  filename?: string | null;
  createdAt?: string | null;
  importedAt?: string | null;
  months?: {
    fileMonths?: string[];
    conflictMonths?: string[];
    importedMonths?: string[];
  };
  staging?: {
    totalRows?: number;
    newRows?: number;
    duplicateRows?: number;
    conflictRows?: number;
    errorRows?: number;
  };
  commit?: {
    importedRows?: number;
    duplicateRows?: number;
    conflictRows?: number;
    errorRows?: number;
    deletedRows?: number;
  };
  transactions?: {
    committedCount?: number;
    totalCommittedAmount?: number;
    incomeCount?: number;
    expenseCount?: number;
    transferCount?: number;
    byType?: Array<{
      type: string;
      count: number;
      amount: number;
    }>;
    byMonth?: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  };
  coverage?: {
    withAccountCount?: number;
    withCategoryCount?: number;
    distinctStoreCount?: number;
  };
  integrity?: {
    importedRowsMatchesCommittedCount?: boolean;
  };
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
  summary?: ImportResultSummary;
  message?: string;
};

export type LoadImportSummaryResponse = {
  ok?: boolean;
  action?: string;
  companyId?: string | null;
  importJobId?: string;
  summary?: ImportResultSummary;
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

export type CashIncomePreviewRequest = {
  companyId?: string;
  filename?: string;
  rows: Array<{
    rowNo: number;
    accountName: string;
    amount: number;
    occurredAt: string;
    memo: string;
    source?: string;
  }>;
};

export type CashIncomePreviewResponse = {
  ok: boolean;
  action: "cash-income-preview";
  module: "cash-income";
  companyId: string | null;
  filename: string | null;
  summary: {
    totalRows: number;
    pendingRows: number;
    errorRows: number;
    warningRows: number;
    totalPendingAmount: number;
  };
  rows: Array<{
    rowNo: number;
    matchStatus: "pending" | "warning" | "error";
    matchReason?: string;
    normalizedPayload: {
      entityType: "transaction";
      module: "cash-income";
      type: "OTHER";
      direction: "INCOME";
      amount: number;
      occurredAt: string;
      accountName: string;
      accountId: string | null;
      categoryId: null;
      memo: string;
      source?: string;
      cashMarker: "[cash]";
    };
  }>;
  message: string;
};

