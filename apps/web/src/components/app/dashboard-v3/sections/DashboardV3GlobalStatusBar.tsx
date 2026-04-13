import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BillingPlanPreview } from "@/core/billing/plan-config";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  planPreview: BillingPlanPreview;
};

function formatBusinessViewLabel(businessView: BusinessViewType, lang: string) {
  const c = getDashboardCopy(lang);
  return c.businessLabels[businessView];
}

export function DashboardV3GlobalStatusBar(props: Props) {
  const { lang, businessView, cockpit, planPreview } = props;
  const copy = getDashboardCopy(lang);

  return (
    <div className="rounded-[28px] border border-black/5 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {copy.cockpitEyebrow}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatBusinessViewLabel(businessView, lang)} · {copy.cockpitOperatingOverview}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {copy.cockpitSummary}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{copy.statusSource}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.source}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{copy.statusRange}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.range}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{copy.statusPlan}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.currentPlan}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{copy.statusAccess}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.accessMode}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{copy.statusAlerts}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.alerts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
