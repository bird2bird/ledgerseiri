"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";

import { dashboardHomeMock } from "@/components/app/dashboard-v2/mock";
import type { DashboardRange } from "@/components/app/dashboard-v2/types";

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
import { RecentTransactionsCard } from "@/components/app/dashboard-v2/RecentTransactionsCard";
import { QuickActionsCard } from "@/components/app/dashboard-v2/QuickActionsCard";

export default function AppHomePage() {
  const params = useParams<{ lang: string }>();
  const currentLang = normalizeLang(params?.lang) as Lang;

  const data = dashboardHomeMock;

  const [range, setRange] = useState<DashboardRange>(data.filters.range);
  const [storeId, setStoreId] = useState<string>(data.filters.storeId);

  const storeOptions = [
    { id: "all", name: "全店舗" },
    { id: "amazon-jp", name: "Amazon JP" },
    { id: "shopify", name: "Shopify" },
    { id: "physical", name: "実店舗" },
  ];

  const totalCash = data.cashBalances.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="space-y-5">
      <DashboardHeader
        userName="Weiwei"
        subtitle="今日の経営状況を確認しましょう"
        range={range}
        storeId={storeId}
        storeOptions={storeOptions}
        onChangeRange={setRange}
        onChangeStore={setStoreId}
        onRefresh={() => {
          console.log("refresh dashboard home v2", currentLang);
        }}
      />

      <KpiRowPrimary items={data.kpiPrimary} />
      <KpiRowSecondary items={data.kpiSecondary} />

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-8">
          <RevenueProfitTrendCard
            points={data.revenueProfitTrend}
            rangeLabel="30D"
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <CashBalanceCard
            totalCash={totalCash}
            items={data.cashBalances}
          />
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
          <BusinessHealthCard data={data.businessHealth} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-8">
          <RecentTransactionsCard items={data.recentTransactions} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <QuickActionsCard items={data.quickActions} />
        </div>
      </div>
    </div>
  );
}
