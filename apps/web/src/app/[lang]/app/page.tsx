import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { DashboardV3Workspace } from "@/components/app/dashboard-v3/DashboardV3Workspace";
import { LegacyDashboardFallback } from "@/components/app/dashboard-v3/LegacyDashboardFallback";
import { AppDashboardShell } from "@/components/app/dashboard-shell/AppDashboardShell";
import { normalizeBusinessView } from "@/core/business-view";
import { BUSINESS_VIEW_COOKIE, readBusinessViewFromUnknown } from "@/core/business-view/storage";
import { fetchDashboardCockpitV3 } from "@/core/dashboard-v3/api";
import { getWorkspaceContext } from "@/core/workspace/repository";
import {
  makePlanPreviewFromWorkspaceSubscription,
  resolveDashboardSubscriptionAccess,
} from "@/core/dashboard-v3/subscription-access";

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
  searchParams: Promise<{ plan?: string; businessType?: string; readonly?: string; companyId?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const lang = p?.lang || "ja";

  const cookieStore = await cookies();
  const cookieBusinessView = readBusinessViewFromUnknown(
    cookieStore.get(BUSINESS_VIEW_COOKIE)?.value
  );

  const queryBusinessView = sp?.businessType
    ? normalizeBusinessView(sp.businessType)
    : null;

  const businessView = queryBusinessView || cookieBusinessView;

  if (!businessView) {
    redirect(`/${lang}/onboarding/business-type?next=/${lang}/app`);
  }

  const workspaceContext = await getWorkspaceContext({
    slug: "weiwei",
    plan: sp?.plan,
    locale: lang,
  });

  const providerMode = businessView === "amazon" ? "real" : "mock";
  const companyId = String(sp?.companyId || "").trim() || undefined;

  const cockpit = await fetchDashboardCockpitV3({
    businessView,
    range: "30d",
    mode: providerMode,
    companyId,
  });

  const planPreview = makePlanPreviewFromWorkspaceSubscription(
    workspaceContext.subscription
  );

  const subscriptionAccess = resolveDashboardSubscriptionAccess(
    workspaceContext.subscription
  );

  return (
    <AppDashboardShell
      lang={lang}
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
      <DashboardV3Workspace
        lang={lang}
        businessView={businessView}
        cockpit={cockpit}
        planPreview={planPreview}
        subscriptionAccess={subscriptionAccess}
      />
      <LegacyDashboardFallback businessView={businessView}>
        <DashboardHomeV2 />
      </LegacyDashboardFallback>
    </AppDashboardShell>
  );
}
