export type ReconciliationDecisionAuditActionType =
  | "approve"
  | "reject"
  | "batch_approve"
  | "batch_reject"
  | "auto_apply"
  | "undo"
  | "submit";

export type ReconciliationDecisionAuditSource =
  | "web"
  | "api"
  | "system";

export type CreateReconciliationDecisionAuditRecord = {
  companyId: string;
  candidateId: string;
  persistenceKey?: string | null;
  actionType: ReconciliationDecisionAuditActionType;
  previousValue?: string | null;
  nextValue?: string | null;
  source: ReconciliationDecisionAuditSource;
};
