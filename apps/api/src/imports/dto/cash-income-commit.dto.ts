export type CashIncomeCommitPayloadDto = {
  entityType?: string;
  module?: string;
  type?: string;
  direction?: string;
  amount?: number;
  occurredAt?: string;
  accountName?: string;
  accountId?: string | null;
  categoryId?: string | null;
  memo?: string;
  source?: string;
  cashMarker?: string;
};

export type CashIncomeCommitRowDto = {
  rowNo?: number;
  matchStatus?: string;
  matchReason?: string;
  normalizedPayload?: CashIncomeCommitPayloadDto;
};

export type CashIncomeCommitDto = {
  companyId?: string;
  filename?: string;
  rows?: CashIncomeCommitRowDto[];
};
