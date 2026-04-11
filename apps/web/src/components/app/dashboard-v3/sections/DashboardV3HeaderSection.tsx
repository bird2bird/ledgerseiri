import React from "react";
import Link from "next/link";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getBusinessViewConfig } from "@/core/business-view/config";
import { getDashboardV3ViewConfig } from "@/core/dashboard-v3/view-config";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";

type Props = {
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

function rangeLabel(range: DashboardV3Cockpit["range"]): string {
  if (range === "today") return "Today";
  if (range === "7d") return "7D";
  if (range === "month") return "Month";
  return "30D";
}

function sourceTone(source: DashboardV3Cockpit["source"]) {
  if (source === "real") {
    return "border-emerald-300/40 bg-emerald-400/15 text-emerald-50";
  }
  if (source === "mock-fallback") {
    return "border-amber-300/40 bg-amber-400/15 text-amber-50";
  }
  return "border-white/20 bg-white/10 text-white/90";
}

function sourceDescription(source: DashboardV3Cockpit["source"]) {
  if (source === "real") return "API aggregate source is active.";
  if (source === "mock-fallback") return "Real fetch failed; currently showing fallback data.";
  return "Mock source is active.";
}

function businessTypeLabel(view: BusinessViewType): string {
  if (view === "amazon") return "Amazon";
  if (view === "ec") return "EC";
  if (view === "restaurant") return "飲食店";
  return "その他";
}

export function DashboardV3HeaderSection(props: Props) {
  const cfg = getBusinessViewConfig(props.businessView);
  const viewCfg = getDashboardV3ViewConfig(props.businessView);
  const theme = getDashboardTheme(props.businessView);

  return (
    <div className={"rounded-[28px] border p-6 shadow-sm md:p-8 " + theme.heroClass}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            Dashboard Shell / Business View Layer
          </div>

          <div className="mt-5 text-3xl font-semibold tracking-tight">
            {cfg.workspaceTitle}
          </div>

          <div className="mt-2 text-sm text-white/80">
            source: {props.cockpit.source} · range: {rangeLabel(props.cockpit.range)}
          </div>

          <div className="mt-4 text-sm leading-7 text-white/90">
            {cfg.workspaceSubtitle}
          </div>

          <div className="mt-3 text-sm text-white/75">
            {theme.accentText}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              primary focus: {viewCfg.primaryFocus}
            </div>

            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              current type: {businessTypeLabel(props.businessView)}
            </div>

            <Link
              href="/ja/app/settings/profile"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-white/15"
            >
              切り替える
            </Link>
          </div>
        </div>

        <div className="flex min-w-[260px] flex-col gap-3">
          <div
            className={
              "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium " +
              sourceTone(props.cockpit.source)
            }
          >
            source: {props.cockpit.source}
          </div>

          <div className="text-xs text-white/75">
            {sourceDescription(props.cockpit.source)}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              KPI {props.cockpit.summaryKpis.length}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              Trends {props.cockpit.trendSeries.length}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              Distributions {props.cockpit.distributions.length}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              Alerts {props.cockpit.alerts.length}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 col-span-2">
              Explain {props.cockpit.explainSummaries.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
