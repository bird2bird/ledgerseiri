import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardMetricSemantics } from "@/core/dashboard-v3/semantics";
import { getBusinessViewConfig } from "@/core/business-view/config";

type Props = {
  businessView: BusinessViewType;
};

export function DashboardV3MetricsSemanticsSection(props: Props) {
  const cfg = getBusinessViewConfig(props.businessView);
  const semantics = getDashboardMetricSemantics();

  return (
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
  );
}
