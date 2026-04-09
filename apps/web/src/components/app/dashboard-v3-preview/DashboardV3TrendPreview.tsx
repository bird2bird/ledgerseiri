import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";

function maxOfSeries(points: DashboardV3TrendSeries["points"]): number {
  let max = 0;
  for (const p of points) {
    if (p.value > max) max = p.value;
    if ((p.secondaryValue || 0) > max) max = p.secondaryValue || 0;
  }
  return max || 1;
}

type Props = {
  items: DashboardV3TrendSeries[];
};

export function DashboardV3TrendPreview(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {props.items.map((series) => {
        const max = maxOfSeries(series.points);

        return (
          <div
            key={series.key}
            className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {series.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {series.primaryLabel}
                  {series.secondaryLabel ? ` / ${series.secondaryLabel}` : ""}
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                preview
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3">
              {series.points.map((point) => {
                const height = Math.max(24, Math.round((point.value / max) * 120));

                return (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-[130px] items-end">
                      <div
                        className="w-8 rounded-t-2xl bg-slate-900/85"
                        style={{ height: `${height}px` }}
                        title={`${point.label}: ${point.value}`}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">{point.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
