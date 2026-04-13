import React from "react";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3Alert[];
};

function toneClass(severity: DashboardV3Alert["severity"]) {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export function DashboardV3AnomalySection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const structure = getDashboardSectionStructure(props.businessView, props.lang);
  const hasItems = props.items.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {structure.anomalyTitle}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {structure.anomalySummary}
        </div>
      </div>

      {hasItems ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {props.items.map((item) => {
            const label =
              item.severity === "high"
                ? c.anomalyHigh
                : item.severity === "medium"
                  ? c.anomalyMedium
                  : c.anomalyLow;

            return (
              <div
                key={item.key}
                className={"rounded-[24px] border p-5 shadow-sm " + toneClass(item.severity)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold">{item.title}</div>
                  <div className="rounded-full border border-current/15 bg-white/60 px-2.5 py-1 text-[11px] font-medium">
                    {label}
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 opacity-90">{item.summary}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm">
          <div className="text-base font-semibold text-emerald-900">
            No high-priority alerts right now.
          </div>
          <div className="mt-2 text-sm text-emerald-800">
            The current range has no high-priority refund, ad, or payout-gap anomaly to review.
          </div>
        </div>
      )}
    </div>
  );
}
