import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3TrendSeries[];
};

export function DashboardV3TrendSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {props.items.map((series) => {
        const maxValue = Math.max(1, ...series.points.map((p) => Number(p.value) || 0));

        return (
          <div
            key={series.key}
            className={"rounded-[28px] border p-6 shadow-sm " + theme.chartPanelClass}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{series.title}</div>
                <div className="mt-2 text-sm text-white/75">
                  {series.primaryLabel}
                  {series.secondaryLabel ? ` / ${series.secondaryLabel}` : ""}
                </div>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                preview
              </div>
            </div>

            <div className="mt-10 flex min-h-[220px] items-end justify-between gap-6">
              {series.points.map((point) => {
                const height = Math.max(36, Math.round((Number(point.value) / maxValue) * 120));

                return (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-4">
                    <div className="flex h-[140px] items-end">
                      <div
                        className="w-12 rounded-t-[18px] bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <div className="text-sm text-white/80">{point.label}</div>
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
