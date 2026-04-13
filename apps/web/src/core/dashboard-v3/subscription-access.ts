import type { WorkspaceSubscription } from "@/core/workspace/types";
import type { BillingAccessMode, BillingPlanPreview } from "@/core/billing/plan-config";

export type DashboardSubscriptionAccess = {
  planCode: WorkspaceSubscription["planCode"];
  status: WorkspaceSubscription["status"];
  accessMode: BillingAccessMode;
  canOpenReconciliation: boolean;
  canOpenAccountantHandoff: boolean;
  canUseExplainSection: boolean;
  showUpgradeHints: boolean;
};

function resolveAccessMode(
  status: WorkspaceSubscription["status"]
): BillingAccessMode {
  if (status === "trialing") return "trial";
  if (status === "past_due" || status === "canceled") return "readonly";
  return "active";
}

function getTrialDaysRemaining(currentPeriodEnd?: string | null): number {
  if (!currentPeriodEnd) return 0;
  const end = new Date(currentPeriodEnd);
  if (Number.isNaN(end.getTime())) return 0;

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function makePlanPreviewFromWorkspaceSubscription(
  subscription: WorkspaceSubscription
): BillingPlanPreview {
  return {
    currentPlan: subscription.planCode,
    accessMode: resolveAccessMode(subscription.status),
    trialDaysRemaining:
      subscription.status === "trialing"
        ? getTrialDaysRemaining(subscription.currentPeriodEnd)
        : 0,
  };
}

export function resolveDashboardSubscriptionAccess(
  subscription: WorkspaceSubscription
): DashboardSubscriptionAccess {
  const accessMode = resolveAccessMode(subscription.status);
  const entitlements = subscription.entitlements;

  const isWritable = accessMode === "active" || accessMode === "trial";

  return {
    planCode: subscription.planCode,
    status: subscription.status,
    accessMode,
    canOpenReconciliation: isWritable && Boolean(entitlements?.invoiceManagement),
    canOpenAccountantHandoff: isWritable && Boolean(entitlements?.invoiceManagement),
    canUseExplainSection: isWritable && Boolean(entitlements?.aiInsights),
    showUpgradeHints: subscription.planCode !== "premium",
  };
}
