import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";

type Props = {
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

export function DashboardV3AccountantSection(props: Props) {
  const { cockpit } = props;
  const explainCount = cockpit.explainSummaries.length;
  const alertCount = cockpit.alerts.length;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Accountant handoff readiness</div>
        <div className="mt-2 text-sm text-slate-600">
          Make missing invoice and export readiness visible before month-end handoff.
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">invoice readiness</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">82%</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">explain coverage</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{explainCount} items</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">review blockers</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{alertCount}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Month-end handoff checklist</div>
        <div className="mt-2 text-sm text-slate-600">
          A lightweight collaboration surface for accountant export readiness.
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            "Sales summary prepared",
            "Expense attachments reviewed",
            "Missing invoice queue checked",
            "Payout mismatch queue checked",
            "Inventory reference exported",
            "Profit reference reviewed",
          ].map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
