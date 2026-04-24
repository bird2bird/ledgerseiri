export type CashIncomePreviewRowDto = {
  rowNo?: number;
  accountName?: string;
  amount?: number;
  occurredAt?: string;
  memo?: string;
  source?: string;
};

export type CashIncomePreviewDto = {
  companyId?: string;
  filename?: string;
  rows?: CashIncomePreviewRowDto[];
};
