import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { resolveMockWorkspace } from "@/core/workspace/workspace";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const sp = await searchParams;

  const workspace = resolveMockWorkspace({
    slug: "weiwei",
    plan: sp?.plan,
  });

  return <DashboardHomeV2 workspace={workspace} />;
}
