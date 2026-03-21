export type ReconciliationDecisionValue = "approved" | "rejected";

export class CreateReconciliationDecisionItemDto {
  candidateId!: string;
  decision!: ReconciliationDecisionValue;
  persistenceKey!: string;
  confidence!: number;
}

export class CreateReconciliationDecisionBatchDto {
  submittedAt!: string;
  items!: CreateReconciliationDecisionItemDto[];
}


export class ReconciliationDecisionScopeDto {
  companyId!: string;
}
