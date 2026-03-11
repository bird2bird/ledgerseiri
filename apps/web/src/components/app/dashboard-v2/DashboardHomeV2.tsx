"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";

import type { DashboardHomeData, DashboardRange, QuickActionItem, PlanCode } from "@/components/app/dashboard-v2/types";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { useWorkspaceProvider } from "@/core/workspace/provider";
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

function createEmptyDashboardData(): DashboardHomeData {
  return {
    filters: {
      range: "30d",
      storeId: "all",
      refreshedAt: new Date().toISOString(),
    },

    kpiPrimary: [
      { key: "revenue", label: "今月収入", value: "¥0", deltaText: "-", trend: "neutral", tone: "profit" },
      { key: "expense", label: "今月支出", value: "¥0", deltaText: "-", trend: "neutral", tone: "warning" },
      { key: "profit", label: "今月利益", value: "¥0", deltaText: "-", trend: "neutral", tone: "profit" },
      { key: "cash", label: "総資金", value: "¥0", deltaText: "-", trend: "neutral", tone: "info" },
      { key: "tax", label: "消費税概算", value: "¥0", subLabel: "今期見込み", tone: "default" },
    ],

    kpiSecondary: [
      { key: "invoice", label: "未入金", value: "¥0", subLabel: "0件", tone: "warning" },
      { key: "inventory", label: "在庫金額", value: "¥0", subLabel: "全店舗合計", tone: "default" },
      { key: "stockAlert", label: "在庫アラート", value: "0件", subLabel: "補充が必要", tone: "danger" },
      { key: "runway", label: "資金余力", value: "0.0ヶ月", subLabel: "現在の支出ペース", tone: "info" },
    ],

    revenueProfitTrend: [],
    cashBalances: [],
    expenseBreakdown: [],
    cashFlowTrend: [],

    taxSummary: {
      outputTax: 0,
      inputTax: 0,
      estimatedTaxPayable: 0,
      periodLabel: "当期",
      note: "実データ",
    },

    alerts: [],

    businessHealth: {
      score: 0,
      status: "attention",
      dimensions: [],
      insights: [],
    },

    recentTransactions: [],

    quickActions: [
      { key: "addIncome", label: "収入を追加", subLabel: "現金・売上", href: "/ja/app/income", icon: "plus" },
      { key: "addExpense", label: "支出を追加", subLabel: "経費・運営費", href: "/ja/app/expenses", icon: "minus" },
      { key: "transfer", label: "資金移動を記録", subLabel: "口座間移動", href: "/ja/app/fund-transfer", icon: "arrow" },
      { key: "invoice", label: "請求書を作成", subLabel: "新規請求", href: "/ja/app/invoices", icon: "file" },
      { key: "import", label: "データをインポート", subLabel: "CSV / 明細", href: "/ja/app/data/import", icon: "upload" },
      { key: "reports", label: "レポートを見る", subLabel: "利益 / CF", href: "/ja/app/reports/profit", icon: "chart" },
    ],
  };
}

function trendRangeLabel(range: DashboardRange): "30D" | "90D" | "12M" {
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
      planCode: "starter" as const,
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

  const [dashboardData, setDashboardData] = useState<DashboardHomeData>(createEmptyDashboardData());
  const [range, setRange] = useState<DashboardRange>("30d");
  const [storeId, setStoreId] = useState<string>("all");

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
      setRange(next.filters.range);
      setStoreId(next.filters.storeId);
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
        subtitle={workspace.companyName || "LedgerSeiri operating dashboard"}
        range={range}
        storeId={storeId}
        storeOptions={storeOptions}
        onChangeRange={setRange}
        onChangeStore={setStoreId}
        onRefresh={loadDashboardSummary}
      />

      <KpiRowPrimary items={dashboardData.kpiPrimary} />
      <KpiRowSecondary items={dashboardData.kpiSecondary} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <RevenueProfitTrendCard
            points={dashboardData.revenueProfitTrend}
            rangeLabel={trendRangeLabel(range)}
          />
        </div>
        <div>
          <CashBalanceCard totalCash={totalCash} items={dashboardData.cashBalances} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ExpenseBreakdownCard items={dashboardData.expenseBreakdown} />
        </div>
        <div className="xl:col-span-1">
          <CashFlowTrendCard points={dashboardData.cashFlowTrend} />
        </div>
        <div className="xl:col-span-1">
          <TaxSummaryCard data={dashboardData.taxSummary} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div>
          <AlertsTasksCard items={dashboardData.alerts} />
        </div>
        <div>
          {subscription.planCode === "starter" ? (
            <BusinessHealthLockedCard planCode="starter" />
          ) : (
            <BusinessHealthCard data={dashboardData.businessHealth} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <RecentTransactionsCard items={dashboardData.recentTransactions} />
        </div>
        <div>
          <QuickActionsCard items={quickActions} />
        </div>
      </div>
    </div>
  );
}
