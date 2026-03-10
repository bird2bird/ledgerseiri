"use client";

import { useMemo } from "react";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import { getPlanLimits } from "@/core/billing/planLimits";

function pct(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(999, Math.round((used / limit) * 100));
}

export function useUsage() {
  const { ctx } = useWorkspaceProvider();

  const subscription = ctx?.subscription;
  const planCode = subscription?.planCode ?? "starter";
  const source = subscription?.source ?? "mock-default";

  const effectiveLimits =
    source === "db+query-override" || source === "mock-query"
      ? getPlanLimits(planCode)
      : (subscription?.limits ?? getPlanLimits(planCode));

  return useMemo(() => {
    const usage = {
      storesUsed: 1,
      invoiceStorageMbUsed: 0,
      aiChatUsedMonthly: 0,
      aiInvoiceOcrUsedMonthly: 0,
    };

    return {
      workspace: ctx?.workspace ?? null,
      subscription: subscription ?? null,
      effectiveLimits,
      usage,
      utilization: {
        storesPct: pct(usage.storesUsed, effectiveLimits.maxStores),
        invoiceStoragePct: pct(usage.invoiceStorageMbUsed, effectiveLimits.invoiceStorageMb),
        aiChatPct: pct(usage.aiChatUsedMonthly, effectiveLimits.aiChatMonthly),
        aiInvoiceOcrPct: pct(usage.aiInvoiceOcrUsedMonthly, effectiveLimits.aiInvoiceOcrMonthly),
      },
      overLimit: {
        stores: usage.storesUsed > effectiveLimits.maxStores,
        invoiceStorage: usage.invoiceStorageMbUsed > effectiveLimits.invoiceStorageMb,
        aiChat: effectiveLimits.aiChatMonthly > 0
          ? usage.aiChatUsedMonthly > effectiveLimits.aiChatMonthly
          : false,
        aiInvoiceOcr: effectiveLimits.aiInvoiceOcrMonthly > 0
          ? usage.aiInvoiceOcrUsedMonthly > effectiveLimits.aiInvoiceOcrMonthly
          : false,
      },
      period: {
        monthKey: new Date().toISOString().slice(0, 7),
      },
    };
  }, [ctx, subscription, effectiveLimits, planCode, source]);
}
