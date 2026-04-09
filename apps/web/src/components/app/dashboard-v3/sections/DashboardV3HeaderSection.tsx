import React from "react";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getBusinessViewConfig } from "@/core/business-view/config";
import { getDashboardV3ViewConfig } from "@/core/dashboard-v3/view-config";

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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (source === "mock-fallback") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function DashboardV3HeaderSection(props: Props) {
  const cfg = getBusinessViewConfig(props.businessView);
  const viewCfg = getDashboardV3ViewConfig(props.businessView);

  return (
    <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {cfg.workspaceTitle}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            source: {props.cockpit.source} · range: {rangeLabel(props.cockpit.range)}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            {cfg.workspaceSubtitle}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            primary focus: {viewCfg.primaryFocus}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span
            className={
              "inline-flex rounded-full border px-3 py-1 text-xs font-medium " +
              sourceTone(props.cockpit.source)
            }
          >
            source: {props.cockpit.source}
          </span>

          <div className="flex flex-wrap gap-2 text-xs text-slate-700">
            <span className="rounded-full border border-white bg-white px-3 py-1">
              KPI {props.cockpit.summaryKpis.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Trends {props.cockpit.trendSeries.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Distributions {props.cockpit.distributions.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Alerts {props.cockpit.alerts.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Explain {props.cockpit.explainSummaries.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
