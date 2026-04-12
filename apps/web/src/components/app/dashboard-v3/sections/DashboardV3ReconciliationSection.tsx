import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";

type Props = {
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

export function DashboardV3ReconciliationSection(props: Props) {
  const { cockpit } = props;
  const high = cockpit.alerts.filter((item) => item.severity === "high").length;
  const medium = cockpit.alerts.filter((item) => item.severity === "medium").length;
  const low = cockpit.alerts.filter((item) => item.severity === "low").length;

  const cards = [
    { key: "invoice", label: "missing invoices", value: high + 1 },
    { key: "bank", label: "missing bank proofs", value: medium + 1 },
    { key: "review", label: "pending review", value: cockpit.alerts.length || 1 },
    { key: "payout", label: "unmatched payout items", value: low + 1 },
  ];

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Reconciliation health</div>
          <div className="mt-2 text-sm text-slate-600">
            Missing attachments, unmatched records, and review queue should be visible from the dashboard.
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          dashboard action center
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>
            <div className="mt-3 text-xs text-slate-500">drilldown-ready placeholder</div>
          </div>
        ))}
      </div>
    </div>
  );
}
