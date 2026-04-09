import React from "react";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import { DashboardV3KpiRow } from "@/components/app/dashboard-v3-preview/DashboardV3KpiRow";
import { DashboardV3TrendPreview } from "@/components/app/dashboard-v3-preview/DashboardV3TrendPreview";
import { DashboardV3DistributionPreview } from "@/components/app/dashboard-v3-preview/DashboardV3DistributionPreview";
import { DashboardV3AlertsPreview } from "@/components/app/dashboard-v3-preview/DashboardV3AlertsPreview";
import { DashboardV3ExplainPreview } from "@/components/app/dashboard-v3-preview/DashboardV3ExplainPreview";

type Props = {
  lang: string;
  cockpit: DashboardV3Cockpit;
};

function rangeLabel(range: DashboardV3Cockpit["range"]): string {
  if (range === "today") return "Today";
  if (range === "7d") return "7D";
  if (range === "month") return "Month";
  return "30D";
}

export function DashboardV3Workspace(props: Props) {
  const { cockpit, lang } = props;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Dashboard V3 workspace
            </div>
            <div className="mt-1 text-xs text-slate-600">
              source: {cockpit.source} · range: {rangeLabel(cockpit.range)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-700">
            <span className="rounded-full border border-white bg-white px-3 py-1">
              KPI {cockpit.summaryKpis.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Trends {cockpit.trendSeries.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Distributions {cockpit.distributions.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Alerts {cockpit.alerts.length}
            </span>
            <span className="rounded-full border border-white bg-white px-3 py-1">
              Explain {cockpit.explainSummaries.length}
            </span>
          </div>
        </div>
      </div>

      <DashboardV3KpiRow items={cockpit.summaryKpis} />
      <DashboardV3TrendPreview items={cockpit.trendSeries} />
      <DashboardV3DistributionPreview items={cockpit.distributions} />
      <DashboardV3AlertsPreview lang={lang} items={cockpit.alerts} />
      <DashboardV3ExplainPreview lang={lang} items={cockpit.explainSummaries} />
    </div>
  );
}
