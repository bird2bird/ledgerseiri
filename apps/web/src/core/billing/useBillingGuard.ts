"use client";

import { useWorkspace } from "@/core/workspace/useWorkspace";
import { useUsage } from "@/core/workspace/useUsage";
import { getPlanFeatures, type FeatureMatrix } from "@/core/billing/features";

export function useBillingGuard() {
  const workspace = useWorkspace();
  const usage = useUsage();

  const plan = workspace?.subscription?.planCode ?? "starter";
  const entitlements: FeatureMatrix = workspace?.subscription?.entitlements ?? getPlanFeatures(plan);
  const limits = usage?.effectiveLimits ?? {};
  const overLimit = usage?.overLimit ?? {};

  return {
    plan,
    entitlements,
    limits,
    overLimit
  };
}
