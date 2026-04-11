import React from "react";
import type { DashboardV3DistributionBlock } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3DistributionBlock[];
};

function getRingSegments(values: number[]) {
  const total = values.reduce((sum, n) => sum + n, 0) || 1;
  let acc = 0;
  return values.map((value) => {
    const start = (acc / total) * 100;
    acc += value;
    const end = (acc / total) * 100;
    return { start, end };
  });
}

export function DashboardV3DistributionSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {props.items.map((block) => {
        const values = block.items.map((item) => Number(item.value) || 0);
        const maxValue = Math.max(1, ...values);
        const segments = getRingSegments(values);

        return (
          <div
            key={block.key}
            className={"rounded-[28px] border p-6 shadow-sm " + theme.darkPanelClass}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{block.title}</div>
                <div className="mt-2 text-sm text-white/75">distribution view</div>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                {block.items.length} items
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {block.items.map((item) => {
                  const width = Math.max(
                    8,
                    Math.round(((Number(item.value) || 0) / maxValue) * 100)
                  );
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-white/90">
                          ¥{Number(item.value).toLocaleString("ja-JP")}
                        </div>
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-white/15">
                        <div
                          className="h-3 rounded-full bg-white/85"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center">
                <div
                  className="relative h-[180px] w-[180px] rounded-full"
                  style={{
                    background: `conic-gradient(
                      rgba(255,255,255,0.95) ${segments[0]?.end ?? 0}%,
                      rgba(255,255,255,0.75) ${segments[0]?.end ?? 0}% ${segments[1]?.end ?? 0}%,
                      rgba(255,255,255,0.55) ${segments[1]?.end ?? 0}% ${segments[2]?.end ?? 0}%,
                      rgba(255,255,255,0.4) ${segments[2]?.end ?? 0}% ${segments[3]?.end ?? 0}%,
                      rgba(255,255,255,0.3) ${segments[3]?.end ?? 0}% 100%
                    )`,
                  }}
                >
                  <div className="absolute inset-[28px] rounded-full bg-slate-950/35 backdrop-blur-sm" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
