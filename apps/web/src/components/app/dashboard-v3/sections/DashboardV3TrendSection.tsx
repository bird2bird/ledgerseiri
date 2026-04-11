import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3TrendSeries[];
};

function getPolyline(points: number[], width: number, height: number) {
  const max = Math.max(...points, 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function DashboardV3TrendSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {props.items.map((series) => {
        const values = series.points.map((p) => Number(p.value) || 0);
        const maxValue = Math.max(1, ...values);
        const polyline = getPolyline(values, 320, 120);

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
                chart
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-[220px] items-end gap-4">
                <div className="flex flex-1 items-end justify-between gap-3">
                  {series.points.map((point) => {
                    const height = Math.max(
                      20,
                      Math.round(((Number(point.value) || 0) / maxValue) * 130)
                    );

                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                        <div className="flex h-[140px] items-end">
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

                <div className="hidden w-[340px] xl:block">
                  <svg viewBox="0 0 320 140" className="h-[160px] w-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="3"
                      points={polyline}
                    />
                    {values.map((value, index) => {
                      const x = values.length > 1 ? (index * 320) / (values.length - 1) : 0;
                      const y = 120 - (value / maxValue) * 120;
                      return (
                        <circle
                          key={`${series.key}-${index}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="white"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
