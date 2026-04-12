import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BillingPlanPreview } from "@/core/billing/plan-config";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  planPreview: BillingPlanPreview;
};

function formatBusinessViewLabel(businessView: BusinessViewType) {
  if (businessView === "amazon") return "Amazon";
  if (businessView === "ec") return "EC";
  if (businessView === "restaurant") return "Restaurant";
  return "Business Overview";
}

export function DashboardV3GlobalStatusBar(props: Props) {
  const { businessView, cockpit, planPreview } = props;

  return (
    <div className="rounded-[28px] border border-black/5 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Amazon dashboard cockpit
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatBusinessViewLabel(businessView)} · operating overview
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Sales, payout, profit reference, reconciliation readiness, and accountant handoff in one place.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">source</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.source}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">range</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.range}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">plan</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.currentPlan}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">access</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {planPreview.accessMode}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">alerts</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.alerts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
