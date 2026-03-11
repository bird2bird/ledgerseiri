"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import type { DashboardHomeData, DashboardRange, QuickActionItem, PlanCode } from "@/components/app/dashboard-v2/types";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import { fetchDashboardSummary } from "@/core/dashboard/api";
import { dashboardHomeMock } from "@/components/app/dashboard-v2/mock";

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

function planBadgeClass(planCode: PlanCode) {
  if (planCode === "starter") return "border-slate-200 bg-slate-50 text-slate-700";
  if (planCode === "standard") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function planLabel(planCode: PlanCode) {
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

    return {
      ...item,
      locked: false,
      requiredPlan: undefined,
      upgradeHint: undefined,
    };
  });
}

function rangeBadgeLabel(range: DashboardRange): "7D" | "30D" | "90D" | "12M" {
  if (range === "7d") return "7D";
  if (range === "90d") return "90D";
  if (range === "12m") return "12M";
  return "30D";
}

export function DashboardHomeV2() {
  const params = useParams<{ lang: string }>();
  const currentLang = normalizeLang(params?.lang) as Lang;

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const { ctx: providerCtx, loading: ctxLoading, error: ctxError } = useWorkspaceProvider();
  const effectiveCtx = providerCtx ?? {
    workspace: {
      slug: "default",
      displayName: "Default",
      companyName: "LedgerSeiri Demo Company",
      locale: currentLang,
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
  };

  const { workspace, subscription, features, limits, can } = useWorkspaceContext(effectiveCtx);

  const [range, setRange] = useState<DashboardRange>("30d");
  const [storeId, setStoreId] = useState<string>("all");
  const [dashboardData, setDashboardData] = useState<DashboardHomeData>({
    ...dashboardHomeMock,
    filters: {
      ...dashboardHomeMock.filters,
      range: "30d",
      storeId: "all",
      refreshedAt: new Date().toISOString(),
    },
  });

  const loadDashboardSummary = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const next = await fetchDashboardSummary({
        storeId,
        range,
        locale: currentLang,
      });

      setDashboardData(next);
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

  const totalCash = dashboardData.cashBalances.reduce((sum, item) => sum + item.balance, 0);

  const quickActions = useMemo(
    () =>
      getQuickActionsByFeatures(dashboardData.quickActions, {
        fundTransfer: can("fundTransfer"),
        invoiceManagement: can("invoiceManagement"),
        advancedExport: can("advancedExport"),
        invoiceUpload: can("invoiceUpload"),
      }),
    [dashboardData.quickActions, can]
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
        userName={workspace.displayName || "User"}
        subtitle="収支、請求、回収、資金状況をひとつの画面で確認できます。"
        range={range}
        storeId={storeId}
        storeOptions={storeOptions}
        onChangeRange={setRange}
        onChangeStore={setStoreId}
        onRefresh={loadDashboardSummary}
      />

      <KpiRowPrimary items={dashboardData.kpiPrimary} />
      <KpiRowSecondary items={dashboardData.kpiSecondary} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueProfitTrendCard
          points={dashboardData.revenueProfitTrend}
          rangeLabel={rangeBadgeLabel(range)}
        />
        <CashBalanceCard totalCash={totalCash} items={dashboardData.cashBalances} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <ExpenseBreakdownCard items={dashboardData.expenseBreakdown} />
        <CashFlowTrendCard points={dashboardData.cashFlowTrend} />
        <TaxSummaryCard data={dashboardData.taxSummary} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <AlertsTasksCard items={dashboardData.alerts} />

        {subscription.planCode === "starter" ? (
          <BusinessHealthLockedCard planCode="starter" />
        ) : subscription.planCode === "standard" ? (
          <BusinessHealthLockedCard planCode="standard" />
        ) : (
          <BusinessHealthCard data={dashboardData.businessHealth} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <RecentTransactionsCard items={dashboardData.recentTransactions} />
        <QuickActionsCard items={quickActions} />
      </div>
    </div>
  );
}
