import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3TrendSeries[];
};

export function DashboardV3TrendSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {structure.trendTitle}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {structure.trendSummary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((series) => (
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
                trend
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-[180px] items-end justify-between gap-3">
                {series.points.map((point, index) => {
                  const value = Number(point.value) || 0;
                  const max = Math.max(
                    1,
                    ...series.points.map((p) => Number(p.value) || 0)
                  );
                  const height = Math.max(20, Math.round((value / max) * 120));

                  return (
                    <div key={`${series.key}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-[130px] items-end">
                        <div
                          className="w-full rounded-t-[18px] bg-white/65"
                          style={{ height: `${height}px`, minWidth: "18px" }}
                        />
                      </div>
                      <div className="text-xs text-white/75">{point.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
