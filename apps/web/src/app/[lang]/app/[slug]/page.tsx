import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import { getWorkspaceContext } from "@/core/workspace/repository";

export default async function AppHomeAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const ctx = await getWorkspaceContext({
    slug: p?.slug,
    plan: sp?.plan,
    locale: p?.lang,
  });

  return <DashboardHomeV2 ctx={ctx} />;
}
