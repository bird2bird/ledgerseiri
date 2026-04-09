import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { DashboardV3Workspace } from "@/components/app/dashboard-v3/DashboardV3Workspace";
import { LegacyDashboardFallback } from "@/components/app/dashboard-v3/LegacyDashboardFallback";
import { AppDashboardShell } from "@/components/app/dashboard-shell/AppDashboardShell";
import { normalizeBusinessView } from "@/core/business-view";
import { fetchDashboardCockpitV3Mock } from "@/core/dashboard-v3/api";
import { getWorkspaceContext } from "@/core/workspace/repository";

function rangeLabel(range: "today" | "7d" | "30d" | "month"): string {
  if (range === "today") return "Today";
  if (range === "7d") return "7D";
  if (range === "month") return "Month";
  return "30D";
}

export default async function AppHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ plan?: string; businessType?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const lang = p?.lang || "ja";

  const businessView = normalizeBusinessView(sp?.businessType);

  const ctx = await getWorkspaceContext({
    slug: "weiwei",
    plan: sp?.plan,
    locale: lang,
  });

  const cockpit = await fetchDashboardCockpitV3Mock({
    businessView,
    range: "30d",
  });

  return (
    <AppDashboardShell
      businessView={businessView}
      contractPreview={{
        source: cockpit.source,
        rangeLabel: rangeLabel(cockpit.range),
        kpiCount: cockpit.summaryKpis.length,
        trendCount: cockpit.trendSeries.length,
        distributionCount: cockpit.distributions.length,
        alertCount: cockpit.alerts.length,
        explainCount: cockpit.explainSummaries.length,
      }}
    >
      <DashboardV3Workspace lang={lang} businessView={businessView} cockpit={cockpit} />
      <LegacyDashboardFallback businessView={businessView}>
        <DashboardHomeV2 />
      </LegacyDashboardFallback>
    </AppDashboardShell>
  );
}
