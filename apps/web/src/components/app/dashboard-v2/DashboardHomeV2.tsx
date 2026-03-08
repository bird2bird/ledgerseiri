"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";

import { dashboardHomeMock } from "@/components/app/dashboard-v2/mock";
import type { DashboardHomeData, DashboardRange, QuickActionItem } from "@/components/app/dashboard-v2/types";
import type { WorkspaceContextValue } from "@/core/workspace/types";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { fetchWorkspaceContext } from "@/core/workspace/api";
import { fetchDashboardSummary } from "@/core/dashboard/api";

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
  return items.map((item) => {
    if (item.key === "transfer" && !features.fundTransfer) {
      return {
        ...item,
        locked: true,
        requiredPlan: "standard",
        upgradeHint: "Standard 以上で資金移動を利用できます。",
      };
    }

    if (item.key === "invoice" && !features.invoiceManagement) {
      return {
        ...item,
        locked: true,
        requiredPlan: "standard",
        upgradeHint: "Standard 以上で請求管理を利用できます。",
      };
    }

    if (item.key === "import" && !features.invoiceUpload) {
      return {
        ...item,
        locked: true,
        requiredPlan: "standard",
        upgradeHint: "上位プランでデータインポートを利用できます。",
      };
    }

    if (item.key === "export" && !features.advancedExport) {
      return {
        ...item,
        locked: true,
        requiredPlan: "standard",
        upgradeHint: "Standard 以上で高度なデータエクスポートを利用できます。",
      };
    }

    return {
      ...item,
      locked: false,
      requiredPlan: undefined,
      upgradeHint: undefined,
    };
  });
}

export function DashboardHomeV2({
  ctx,
}: {
  ctx: WorkspaceContextValue;
}) {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const currentLang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;

  const [resolvedCtx, setResolvedCtx] = useState<WorkspaceContextValue>(ctx);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [ctxError, setCtxError] = useState<string | null>(null);

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const { workspace, subscription, features, limits, can } = useWorkspaceContext(resolvedCtx);

  const [dashboardData, setDashboardData] = useState<DashboardHomeData>(dashboardHomeMock);
  const data = dashboardData;

  const [range, setRange] = useState<DashboardRange>(dashboardHomeMock.filters.range);
  const [storeId, setStoreId] = useState<string>(dashboardHomeMock.filters.storeId);

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
          locale: currentLang,
          plan: debugPlan,
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
  }, [workspace.slug, currentLang, debugPlan]);

  const loadDashboardSummary = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("ls_token") : null;

    if (!token) return;

    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const summary = await fetchDashboardSummary({
        token,
        storeId,
        range,
        locale: currentLang,
      });

      setDashboardData(summary);

      if (summary?.filters?.range) {
        setRange(summary.filters.range);
      }

      if (summary?.filters?.storeId) {
        setStoreId(summary.filters.storeId);
      }
    } catch (e: any) {
      setDashboardError(e?.message ?? String(e));
    } finally {
      setDashboardLoading(false);
    }
  }, [storeId, range, currentLang]);

  useEffect(() => {
    loadDashboardSummary();
  }, [loadDashboardSummary]);

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
        fundTransfer: can("fundTransfer"),
        invoiceManagement: can("invoiceManagement"),
        advancedExport: can("advancedExport"),
        invoiceUpload: can("invoiceUpload"),
      }),
    [data.quickActions, can]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[12px] font-medium ${planBadgeClass(
            subscription.planCode
          )}`}
          title={`source: ${subscription.source} / workspace: ${workspace.slug} / maxStores: ${limits.maxStores}`}
        >
          Current Plan: {planLabel(subscription.planCode)} · {limits.maxStores} Stores
        </span>

        {subscription.source !== "db" ? (
          <span className="inline-flex rounded-full border border-black/5 bg-white px-3 py-1.5 text-[12px] text-slate-600">
            source: {subscription.source}
          </span>
        ) : null}

        {ctxLoading ? (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-700">
            syncing...
          </span>
        ) : null}

        {dashboardLoading ? (
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[12px] text-violet-700">
            dashboard syncing...
          </span>
        ) : null}
      </div>

      {ctxError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          workspace context refresh failed, using last known context
        </div>
      ) : null}

      {dashboardError ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          dashboard summary fetch failed, using last known dashboard data
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
        onRefresh={loadDashboardSummary}
      />

      <KpiRowPrimary items={data.kpiPrimary} />
      <KpiRowSecondary items={data.kpiSecondary} />

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <RevenueProfitTrendCard
            points={data.revenueProfitTrend}
            rangeLabel="30D"
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <CashBalanceCard totalCash={totalCash} items={data.cashBalances} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
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

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
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

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
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
