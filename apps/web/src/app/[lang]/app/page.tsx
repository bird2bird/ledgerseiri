import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { AppDashboardShell } from "@/components/app/dashboard-shell/AppDashboardShell";
import { normalizeBusinessView } from "@/core/business-view";
import { getWorkspaceContext } from "@/core/workspace/repository";

export default async function AppHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ plan?: string; businessType?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const businessView = normalizeBusinessView(sp?.businessType);

  const ctx = await getWorkspaceContext({
    slug: "weiwei",
    plan: sp?.plan,
    locale: p?.lang,
  });

  return (
    <AppDashboardShell businessView={businessView}>
      <DashboardHomeV2 />
    </AppDashboardShell>
  );
}
