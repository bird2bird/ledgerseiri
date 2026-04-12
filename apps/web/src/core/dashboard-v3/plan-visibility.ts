import type { BillingPlanCode } from "@/core/billing/plan-config";

export type DashboardPlanVisibility = {
  showAiPreview: boolean;
  showUpgradeHints: boolean;
  showAdvancedOpsTone: boolean;
};

export function getDashboardPlanVisibility(plan: BillingPlanCode): DashboardPlanVisibility {
  if (plan === "premium") {
    return {
      showAiPreview: true,
      showUpgradeHints: false,
      showAdvancedOpsTone: true,
    };
  }

  if (plan === "standard") {
    return {
      showAiPreview: true,
      showUpgradeHints: true,
      showAdvancedOpsTone: true,
    };
  }

  return {
    showAiPreview: false,
    showUpgradeHints: true,
    showAdvancedOpsTone: false,
  };
}
