import type { BillingAccessMode, BillingPlanCode } from "@/core/billing/plan-config";

export function getPlanTagline(plan: BillingPlanCode) {
  if (plan === "starter") return "把账管清楚";
  if (plan === "standard") return "多店铺不乱";
  return "有人替你盯经营";
}

export function getAccessModeCopy(accessMode: BillingAccessMode) {
  if (accessMode === "trial") {
    return "Premium trial is active. Full experience is temporarily unlocked.";
  }

  if (accessMode === "readonly") {
    return "Readonly mode is active. History is visible, but add/import/upload actions are locked.";
  }

  return "Paid access is active.";
}
