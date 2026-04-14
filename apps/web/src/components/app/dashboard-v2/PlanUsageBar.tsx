"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import { useWorkspaceUsage } from "@/hooks/useWorkspaceUsage";
import type { PlanCode } from "@/components/app/dashboard-v2/types";

type UsageData = {
  storesUsed?: number;
  aiChatUsedMonthly?: number;
  aiInvoiceOcrUsedMonthly?: number;
};

function limitValue(value?: number | null): number {
  return Number(value ?? 0);
}

export function PlanUsageBar() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const { ctx: providerCtx } = useWorkspaceProvider();

  const effectiveCtx = providerCtx ?? {
    workspace: {
      slug: "default",
      displayName: "Default",
      companyName: "LedgerSeiri Demo Company",
      locale: lang,
    },
    subscription: {
      planCode: "starter" as PlanCode,
      status: "active" as const,
      source: "mock-default" as const,
      limits: {
        maxStores: 1,
        invoiceStorageMb: 200,
        aiChatMonthly: 0,
        aiInvoiceOcrMonthly: 0,
        historyMonths: 12,
      },
    },
    limits: {
      maxStores: 1,
      invoiceStorageMb: 200,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
      historyMonths: 12,
    },
  };

  const { subscription, limits } = useWorkspaceContext(effectiveCtx);
  const usage = useWorkspaceUsage({
    slug: effectiveCtx.workspace.slug,
    plan: effectiveCtx.subscription.planCode,
    locale: effectiveCtx.workspace.locale,
  });
  const usageData = (usage.data?.usage || {}) as UsageData;

  return (
    <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="rounded-full border border-black/5 bg-slate-50 px-3 py-1 font-semibold text-slate-800">
            {String(subscription.planCode || "starter").toUpperCase()}
          </span>

          <span className="text-slate-600">
            Stores: {usageData.storesUsed ?? 0} / {limitValue(limits.maxStores)}
          </span>

          <span className="text-slate-600">
            AI: {usageData.aiChatUsedMonthly ?? 0} / {limitValue(limits.aiChatMonthly)}
          </span>

          <span className="text-slate-600">
            OCR: {usageData.aiInvoiceOcrUsedMonthly ?? 0} / {limitValue(limits.aiInvoiceOcrMonthly)}
          </span>
        </div>

        <Link
          href={`/${lang}/app/billing/change`}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
