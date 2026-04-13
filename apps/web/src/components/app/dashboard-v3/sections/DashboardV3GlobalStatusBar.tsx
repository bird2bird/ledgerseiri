import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BillingPlanPreview } from "@/core/billing/plan-config";
import { getDashboardCopy } from "@/core/dashboard-copy";
import { resolveDashboardSourceStatus } from "@/core/dashboard-v3/source-status";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  planPreview: BillingPlanPreview;
  companyId?: string;
};

function formatBusinessViewLabel(businessView: BusinessViewType, lang: string) {
  const c = getDashboardCopy(lang);
  return c.businessLabels[businessView];
}

function toneClasses(tone: "emerald" | "amber" | "slate") {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function DashboardV3GlobalStatusBar(props: Props) {
  const { lang, businessView, cockpit, planPreview, companyId } = props;
  const copy = getDashboardCopy(lang);
  const sourceStatus = resolveDashboardSourceStatus({
    lang,
    cockpit,
    companyId,
  });

  return (
    <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {copy.cockpitEyebrow}
          </div>
          <div className="mt-2 text-[32px] font-semibold tracking-tight text-slate-900">
            {formatBusinessViewLabel(businessView, lang)}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            {copy.cockpitOperatingOverview}
          </div>
          <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.cockpitSummary}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className={"inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium " + toneClasses(sourceStatus.tone)}>
              {sourceStatus.badge}
            </div>
            <div className="text-sm text-slate-700">{sourceStatus.summary}</div>
            <div className="text-xs text-slate-500">{sourceStatus.detail}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{copy.statusSource}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.source}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{copy.statusRange}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.range}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{copy.statusPlan}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {copy.planLabel[planPreview.currentPlan]}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{copy.statusAccess}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {copy.accessModeLabel[planPreview.accessMode]}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{copy.statusAlerts}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{cockpit.alerts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
