"use client";

import { useMemo } from "react";
import type { WorkspaceContextValue, WorkspaceLimits } from "@/core/workspace/types";
import { getPlanFeatures, type FeatureKey, type FeatureMatrix } from "@/core/billing/features";
import { getPlanLimits } from "@/core/billing/planLimits";

function resolveEffectiveLimits(ctx: WorkspaceContextValue): WorkspaceLimits {
  const planLimits = getPlanLimits(ctx.subscription.planCode);

  // For debug / QA override mode, plan should drive visible limits.
  if (ctx.subscription.source === "db+query-override" || ctx.subscription.source === "mock-query") {
    return planLimits;
  }

  // For normal DB mode, keep DB-backed limits but fall back to plan defaults if needed.
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

export function useWorkspaceContext(ctx: WorkspaceContextValue) {
  const features = useMemo<FeatureMatrix>(() => {
    const base = getPlanFeatures(ctx.subscription.planCode);
    const entitlements = ctx.subscription.entitlements;

    if (!entitlements) return base;

    return {
      ...base,
      ...entitlements,
    };
  }, [ctx.subscription.planCode, ctx.subscription.entitlements]);

  const limits = useMemo(
    () => resolveEffectiveLimits(ctx),
    [ctx]
  );

  const can = useMemo(
    () => (key: FeatureKey) => features[key] === true,
    [features]
  );

  return {
    workspace: ctx.workspace,
    subscription: {
      ...ctx.subscription,
      limits,
    },
    features,
    limits,
    can,
  };
}
