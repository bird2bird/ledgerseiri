"use client";

import { useWorkspace } from "@/core/workspace/useWorkspace";
import { useUsage } from "@/core/workspace/useUsage";
import { getPlanFeatures, type FeatureMatrix } from "@/core/billing/features";

export function useBillingGuard() {
  const workspace = useWorkspace();
  const usage = useUsage();

  const plan = workspace?.subscription?.planCode ?? "starter";

  const planFeatures = getPlanFeatures(plan);
  const partialEntitlements = workspace?.subscription?.entitlements ?? {};

  const entitlements: FeatureMatrix = {
    ...planFeatures,
    ...partialEntitlements,
  };

  const limits = usage?.effectiveLimits ?? {};
  const overLimit = usage?.overLimit ?? {};

  return {
    plan,
    entitlements,
    limits,
    overLimit,
  };
}
