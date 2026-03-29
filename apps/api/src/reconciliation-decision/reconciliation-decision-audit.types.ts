export type ReconciliationDecisionAuditActionType =
  | "approve"
  | "reject"
  | "batch_approve"
  | "batch_reject"
  | "auto_apply"
  | "undo"
  | "submit"
  | "tenant_suspend"
  | "tenant_activate"
  | "user_assign"
  | "user_unassign"
  | "override_approve"
  | "override_reject";

export type ReconciliationDecisionAuditSource =
  | "web"
  | "api"
  | "system"
  | "admin";

export type CreateReconciliationDecisionAuditRecord = {
  companyId: string;
  candidateId: string;
  persistenceKey?: string | null;
  actionType: ReconciliationDecisionAuditActionType;
  previousValue?: string | null;
  nextValue?: string | null;
  source: ReconciliationDecisionAuditSource;
};
