"use client";

import { useMemo } from "react";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import { getPlanLimits } from "@/core/billing/planLimits";

function pct(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(999, Math.round((used / limit) * 100));
}

function num(value?: number | null): number {
  return Number(value ?? 0);
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

    const storesLimit = num(effectiveLimits.maxStores);
    const invoiceStorageLimit = num(effectiveLimits.invoiceStorageMb);
    const aiChatLimit = num(effectiveLimits.aiChatMonthly);
    const aiInvoiceOcrLimit = num(effectiveLimits.aiInvoiceOcrMonthly);

    return {
      workspace: ctx?.workspace ?? null,
      subscription: subscription ?? null,
      effectiveLimits,
      usage,
      utilization: {
        storesPct: pct(usage.storesUsed, storesLimit),
        invoiceStoragePct: pct(usage.invoiceStorageMbUsed, invoiceStorageLimit),
        aiChatPct: pct(usage.aiChatUsedMonthly, aiChatLimit),
        aiInvoiceOcrPct: pct(usage.aiInvoiceOcrUsedMonthly, aiInvoiceOcrLimit),
      },
      overLimit: {
        stores: usage.storesUsed > storesLimit,
        invoiceStorage: usage.invoiceStorageMbUsed > invoiceStorageLimit,
        aiChat: aiChatLimit > 0
          ? usage.aiChatUsedMonthly > aiChatLimit
          : false,
        aiInvoiceOcr: aiInvoiceOcrLimit > 0
          ? usage.aiInvoiceOcrUsedMonthly > aiInvoiceOcrLimit
          : false,
      },
      period: {
        monthKey: new Date().toISOString().slice(0, 7),
      },
    };
  }, [ctx, subscription, effectiveLimits, planCode, source]);
}
