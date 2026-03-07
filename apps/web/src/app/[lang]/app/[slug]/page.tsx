import React from "react";
import { DashboardHomeV2 } from "@/components/app/dashboard-v2/DashboardHomeV2";
import type { PlanCode } from "@/components/app/dashboard-v2/types";

function normalizePlanCode(raw?: string): PlanCode {
  if (raw === "starter" || raw === "standard" || raw === "premium") return raw;
  return "starter";
}

export default async function AppHomeAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;

  const slug = p?.slug || "weiwei";
  const planCode = normalizePlanCode(sp?.plan);

  return <DashboardHomeV2 slug={slug} userName={slug} planCode={planCode} />;
}
