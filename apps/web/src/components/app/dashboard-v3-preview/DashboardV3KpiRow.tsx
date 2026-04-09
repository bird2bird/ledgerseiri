import React from "react";
import type { DashboardV3Kpi } from "@/core/dashboard-v3/types";

function formatValue(value: number, unit: "JPY" | "count" | "percent"): string {
  if (unit === "JPY") return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
  if (unit === "percent") return `${Number(value || 0).toLocaleString("ja-JP")}%`;
  return Number(value || 0).toLocaleString("ja-JP");
}

type Props = {
  items: DashboardV3Kpi[];
};

export function DashboardV3KpiRow(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {props.items.map((item) => (
        <div
          key={item.key}
          className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {formatValue(item.value, item.unit)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {item.deltaLabel || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
