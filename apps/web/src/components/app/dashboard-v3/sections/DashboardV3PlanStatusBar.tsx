import React from "react";
import type { BillingPlanPreview } from "@/core/billing/plan-config";
import { getPlanTagline } from "@/core/billing/ui-copy";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  planPreview: BillingPlanPreview;
};

export function DashboardV3PlanStatusBar(props: Props) {
  const { planPreview } = props;
  const copy = getDashboardCopy(props.lang);

  return (
    <div className="rounded-[24px] border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
            {copy.planStatusTitle}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="text-2xl font-semibold text-slate-900">
              {copy.planLabel[planPreview.currentPlan]}
            </div>
            <div className="rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-xs text-slate-600">
              {getPlanTagline(planPreview.currentPlan)}
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {copy.accessModeCopy[planPreview.accessMode]}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              {copy.planCurrent}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {copy.planLabel[planPreview.currentPlan]}
            </div>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              {copy.planAccessMode}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {copy.accessModeLabel[planPreview.accessMode]}
            </div>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              {copy.planTrialRemaining}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {planPreview.trialDaysRemaining} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
