"use client";

import { useMemo } from "react";
import type { PlanCode } from "@/components/app/dashboard-v2/types";
import { getPlanFeatures, type FeatureKey, type FeatureMatrix } from "@/core/billing/features";
import { getPlanLimits } from "@/core/billing/planLimits";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import type { WorkspaceContextValue, WorkspaceLimits } from "@/core/workspace/types";

function resolveEffectiveLimits(ctx: WorkspaceContextValue | null): WorkspaceLimits {
  const planCode: PlanCode = ctx?.subscription.planCode ?? "starter";
  const planLimits = getPlanLimits(planCode);

  if (!ctx) {
    return planLimits;
  }

  if (
    ctx.subscription.source === "db+query-override" ||
    ctx.subscription.source === "mock-query"
  ) {
    return planLimits;
  }

  return {
    maxStores:
      typeof ctx.subscription.limits?.maxStores === "number"
        ? ctx.subscription.limits.maxStores
        : planLimits.maxStores,
    invoiceStorageMb:
      typeof ctx.subscription.limits?.invoiceStorageMb === "number"
        ? ctx.subscription.limits.invoiceStorageMb
        : planLimits.invoiceStorageMb,
    aiChatMonthly:
      typeof ctx.subscription.limits?.aiChatMonthly === "number"
        ? ctx.subscription.limits.aiChatMonthly
        : planLimits.aiChatMonthly,
    aiInvoiceOcrMonthly:
      typeof ctx.subscription.limits?.aiInvoiceOcrMonthly === "number"
        ? ctx.subscription.limits.aiInvoiceOcrMonthly
        : planLimits.aiInvoiceOcrMonthly,
    historyMonths:
      typeof ctx.subscription.limits?.historyMonths === "number"
        ? ctx.subscription.limits.historyMonths
        : planLimits.historyMonths,
  };
}

function resolveEffectiveFeatures(ctx: WorkspaceContextValue | null): FeatureMatrix {
  const planCode: PlanCode = ctx?.subscription.planCode ?? "starter";
  const base = getPlanFeatures(planCode);
  const entitlements = ctx?.subscription.entitlements;

  if (!entitlements) {
    return base;
  }

  return {
    ...base,
    ...entitlements,
  };
}

export function useWorkspaceGate() {
  const { ctx, loading, error, refresh } = useWorkspaceProvider();

  const planCode: PlanCode = ctx?.subscription.planCode ?? "starter";
  const features = useMemo(() => resolveEffectiveFeatures(ctx), [ctx]);
  const limits = useMemo(() => resolveEffectiveLimits(ctx), [ctx]);

  const can = useMemo(
    () => (key: FeatureKey) => features[key] === true,
    [features]
  );

  return {
    ctx,
    loading,
    error,
    refresh,
    planCode,
    workspace: ctx?.workspace ?? null,
    subscription: ctx?.subscription
      ? {
          ...ctx.subscription,
          entitlements: features,
          limits,
        }
      : null,
    features,
    limits,
    can,
  };
}
