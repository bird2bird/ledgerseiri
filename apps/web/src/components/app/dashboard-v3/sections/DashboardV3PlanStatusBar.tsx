import React from "react";
import type { BillingPlanPreview } from "@/core/billing/plan-config";
import { getPlanDisplayName } from "@/core/billing/plan-config";
import { getPlanTagline, getAccessModeCopy } from "@/core/billing/ui-copy";

type Props = {
  planPreview: BillingPlanPreview;
};

export function DashboardV3PlanStatusBar(props: Props) {
  const { planPreview } = props;

  return (
    <div className="rounded-[28px] border border-indigo-100 bg-indigo-50 px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            subscription status
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {getPlanDisplayName(planPreview.currentPlan)} · {getPlanTagline(planPreview.currentPlan)}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {getAccessModeCopy(planPreview.accessMode)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">current plan</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {getPlanDisplayName(planPreview.currentPlan)}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">access mode</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.accessMode}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">trial remaining</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.trialDaysRemaining} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
