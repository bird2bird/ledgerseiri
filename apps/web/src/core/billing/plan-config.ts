export type BillingPlanCode = "starter" | "standard" | "premium";
export type BillingAccessMode = "active" | "trial" | "readonly";

export type BillingPlanPreview = {
  currentPlan: BillingPlanCode;
  accessMode: BillingAccessMode;
  trialDaysRemaining: number;
};

export function getPlanDisplayName(plan: BillingPlanCode) {
  if (plan === "starter") return "Starter";
  if (plan === "standard") return "Standard";
  return "Premium";
}

export function makeBillingPlanPreview(input?: Partial<BillingPlanPreview>): BillingPlanPreview {
  return {
    currentPlan: input?.currentPlan ?? "starter",
    accessMode: input?.accessMode ?? "active",
    trialDaysRemaining: input?.trialDaysRemaining ?? 0,
  };
}
