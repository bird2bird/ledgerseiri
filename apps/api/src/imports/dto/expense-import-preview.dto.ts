export type ExpenseImportLedgerScopeDto =
  | 'company-operation-expense'
  | 'payroll-expense'
  | 'other-expense'
  | 'store-operation-expense';

export type ExpenseImportPreviewRowDto = {
  rowNo?: number;
  occurredAt?: string;
  amount?: number;
  currency?: string;
  category?: string;
  vendor?: string;
  accountName?: string;
  evidenceNo?: string;
  memo?: string;
  status?: 'ok' | 'error' | string;
  error?: string;
};

export type ExpenseImportPreviewDto = {
  companyId?: string;
  filename?: string;
  ledgerScope?: ExpenseImportLedgerScopeDto | string;
  category?: string;
  rows?: ExpenseImportPreviewRowDto[];
};
