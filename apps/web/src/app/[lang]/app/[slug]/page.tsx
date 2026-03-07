import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { resolveMockWorkspace } from "@/core/workspace/workspace";

export default async function AppHomeAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const workspace = resolveMockWorkspace({
    slug: p?.slug,
    plan: sp?.plan,
  });

  return <DashboardHomeV2 workspace={workspace} />;
}
