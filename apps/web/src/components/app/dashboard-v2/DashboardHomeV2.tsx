"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";

import { dashboardHomeMock } from "@/components/app/dashboard-v2/mock";
import type { DashboardRange, QuickActionItem } from "@/components/app/dashboard-v2/types";
import type { WorkspaceContextValue } from "@/core/workspace/types";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { fetchWorkspaceContext } from "@/core/workspace/api";

import { DashboardHeader } from "@/components/app/dashboard-v2/DashboardHeader";
import { KpiRowPrimary } from "@/components/app/dashboard-v2/KpiRowPrimary";
import { KpiRowSecondary } from "@/components/app/dashboard-v2/KpiRowSecondary";
import { RevenueProfitTrendCard } from "@/components/app/dashboard-v2/RevenueProfitTrendCard";
import { CashBalanceCard } from "@/components/app/dashboard-v2/CashBalanceCard";
import { ExpenseBreakdownCard } from "@/components/app/dashboard-v2/ExpenseBreakdownCard";
import { CashFlowTrendCard } from "@/components/app/dashboard-v2/CashFlowTrendCard";
import { TaxSummaryCard } from "@/components/app/dashboard-v2/TaxSummaryCard";
import { AlertsTasksCard } from "@/components/app/dashboard-v2/AlertsTasksCard";
import { BusinessHealthCard } from "@/components/app/dashboard-v2/BusinessHealthCard";
import { BusinessHealthLockedCard } from "@/components/app/dashboard-v2/BusinessHealthLockedCard";
import { RecentTransactionsCard } from "@/components/app/dashboard-v2/RecentTransactionsCard";
import { QuickActionsCard } from "@/components/app/dashboard-v2/QuickActionsCard";

function planBadgeClass(planCode: WorkspaceContextValue["subscription"]["planCode"]) {
  if (planCode === "starter") return "border-slate-200 bg-slate-50 text-slate-700";
  if (planCode === "standard") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function planLabel(planCode: WorkspaceContextValue["subscription"]["planCode"]) {
  if (planCode === "starter") return "Starter";
  if (planCode === "standard") return "Standard";
  return "Premium";
}

function getQuickActionsByFeatures(
  items: QuickActionItem[],
  features: {
    fundTransfer: boolean;
    invoiceManagement: boolean;
    advancedExport: boolean;
    invoiceUpload: boolean;
  }
): QuickActionItem[] {
  return items.filter((item) => {
    if (item.key === "transfer") return features.fundTransfer;
    if (item.key === "invoice") return features.invoiceManagement;
    if (item.key === "import") return features.invoiceUpload;
    if (item.key === "export") return features.advancedExport;
    return true;
  });
}

export function DashboardHomeV2({
  ctx,
}: {
  ctx: WorkspaceContextValue;
}) {
  const params = useParams<{ lang: string }>();
  const currentLang = normalizeLang(params?.lang) as Lang;

  const [resolvedCtx, setResolvedCtx] = useState<WorkspaceContextValue>(ctx);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [ctxError, setCtxError] = useState<string | null>(null);

  const { workspace, subscription, features } = useWorkspaceContext(resolvedCtx);
  const limits = subscription.limits;

  const data = dashboardHomeMock;

  const [range, setRange] = useState<DashboardRange>(data.filters.range);
  const [storeId, setStoreId] = useState<string>(data.filters.storeId);

  useEffect(() => {
    let alive = true;

    async function loadWorkspaceContext() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ls_token") : null;

        if (!token) return;

        setCtxLoading(true);
        setCtxError(null);

        const serverCtx = await fetchWorkspaceContext({
          token,
          slug: workspace.slug,
          plan: subscription.source === "mock-query" ? subscription.planCode : undefined,
          locale: currentLang,
        });

        if (!alive) return;
        setResolvedCtx(serverCtx);
      } catch (e: any) {
        if (!alive) return;
        setCtxError(e?.message ?? String(e));
      } finally {
        if (!alive) return;
        setCtxLoading(false);
      }
    }

    loadWorkspaceContext();
    return () => {
      alive = false;
    };
  }, [workspace.slug, subscription.planCode, subscription.source, currentLang]);

  const storeOptions = [
    { id: "all", name: "全店舗" },
    { id: "amazon-jp", name: "Amazon JP" },
    { id: "shopify", name: "Shopify" },
    { id: "physical", name: "実店舗" },
  ];

  const totalCash = data.cashBalances.reduce((sum, item) => sum + item.balance, 0);

  const quickActions = useMemo(
    () =>
      getQuickActionsByFeatures(data.quickActions, {
        fundTransfer: features.fundTransfer,
        invoiceManagement: features.invoiceManagement,
        advancedExport: features.advancedExport,
        invoiceUpload: true,
      }),
    [data.quickActions, features]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[12px] font-medium ${planBadgeClass(
            subscription.planCode
          )}`}
          title={`source: ${subscription.source} / workspace: ${workspace.slug} / maxStores: ${limits.maxStores}`}
        >
          Current Plan: {planLabel(subscription.planCode)} · {limits.maxStores} Stores
        </span>

        <span className="inline-flex rounded-full border border-black/5 bg-white px-3 py-1.5 text-[12px] text-slate-600">
          source: {subscription.source}
        </span>

        {ctxLoading ? (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-700">
            syncing...
          </span>
        ) : null}
      </div>

      {ctxError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          workspace context fallback active: {ctxError}
        </div>
      ) : null}

      <DashboardHeader
        userName={workspace.displayName}
        subtitle="今日の経営状況を確認しましょう"
        range={range}
        storeId={storeId}
        storeOptions={storeOptions}
        onChangeRange={setRange}
        onChangeStore={setStoreId}
        onRefresh={() => {
          console.log("refresh dashboard home v2", {
            lang: currentLang,
            workspace: workspace.slug,
            plan: subscription.planCode,
            source: subscription.source,
          });
        }}
      />

      <KpiRowPrimary items={data.kpiPrimary} />
      <KpiRowSecondary items={data.kpiSecondary} />

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-8">
          <RevenueProfitTrendCard
            points={data.revenueProfitTrend}
            rangeLabel={features.history24m ? "30D" : "30D"}
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <CashBalanceCard totalCash={totalCash} items={data.cashBalances} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 lg:col-span-6 xl:col-span-4">
          <ExpenseBreakdownCard items={data.expenseBreakdown} />
        </div>
        <div className="col-span-12 lg:col-span-6 xl:col-span-4">
          <CashFlowTrendCard points={data.cashFlowTrend} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <TaxSummaryCard data={data.taxSummary} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-4">
          <AlertsTasksCard items={data.alerts} />
        </div>
        <div className="col-span-12 xl:col-span-8">
          {features.aiInsights ? (
            <BusinessHealthCard data={data.businessHealth} />
          ) : (
            <BusinessHealthLockedCard
              planCode={subscription.planCode === "starter" ? "starter" : "standard"}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-8">
          <RecentTransactionsCard items={data.recentTransactions} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <QuickActionsCard items={quickActions} />
        </div>
      </div>
    </div>
  );
}
