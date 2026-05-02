export type IncomeImportLedgerScopeDto = 'cash-income' | 'other-income';

export type IncomeImportPreviewRowDto = {
  rowNo?: number;
  ledgerScope?: string;
  occurredAt?: string;
  amount?: number;
  currency?: string;
  incomeCategory?: string;
  payer?: string;
  accountName?: string;
  memo?: string;
  status?: 'ok' | 'error' | string;
  messages?: string[];
};

export type IncomeImportPreviewDto = {
  companyId?: string;
  filename?: string;
  ledgerScope?: IncomeImportLedgerScopeDto;
  rows?: IncomeImportPreviewRowDto[];
};
