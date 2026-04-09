import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import { DashboardV3KpiRow } from "@/components/app/dashboard-v3-preview/DashboardV3KpiRow";
import { DashboardV3TrendPreview } from "@/components/app/dashboard-v3-preview/DashboardV3TrendPreview";
import { DashboardV3DistributionPreview } from "@/components/app/dashboard-v3-preview/DashboardV3DistributionPreview";
import { DashboardV3AlertsPreview } from "@/components/app/dashboard-v3-preview/DashboardV3AlertsPreview";
import { DashboardV3ExplainPreview } from "@/components/app/dashboard-v3-preview/DashboardV3ExplainPreview";
import { DashboardV3AnomalyWorkspace } from "@/components/app/dashboard-v3/DashboardV3AnomalyWorkspace";
import { getDashboardMetricSemantics } from "@/core/dashboard-v3/semantics";
import { getBusinessViewConfig } from "@/core/business-view/config";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

function rangeLabel(range: DashboardV3Cockpit["range"]): string {
  if (range === "today") return "Today";
  if (range === "7d") return "7D";
  if (range === "month") return "Month";
  return "30D";
}

export function DashboardV3Workspace(props: Props) {
  const { cockpit, lang, businessView } = props;
  const semantics = getDashboardMetricSemantics();
  const cfg = getBusinessViewConfig(businessView);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {cfg.workspaceTitle}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              source: {cockpit.source} · range: {rangeLabel(cockpit.range)}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-700">
              {cfg.workspaceSubtitle}
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

      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          {cfg.metricsSemanticsTitle}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {cfg.metricsSemanticsSubtitle}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {semantics.map((item) => (
            <div key={item.key} className="rounded-2xl border border-black/5 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{item.label}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {item.definition}
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-500">
                {item.whyItMatters}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DashboardV3KpiRow items={cockpit.summaryKpis} />
      <DashboardV3TrendPreview items={cockpit.trendSeries} />
      <DashboardV3DistributionPreview items={cockpit.distributions} />
      <DashboardV3AnomalyWorkspace businessView={businessView} items={cockpit.alerts} />
      <DashboardV3AlertsPreview lang={lang} items={cockpit.alerts} />
      <DashboardV3ExplainPreview lang={lang} items={cockpit.explainSummaries} />
    </div>
  );
}
