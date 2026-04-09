import React from "react";
import type { DashboardV3DistributionBlock } from "@/core/dashboard-v3/types";

function formatJPY(value: number): string {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

function sumItems(items: DashboardV3DistributionBlock["items"]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}

type Props = {
  items: DashboardV3DistributionBlock[];
};

export function DashboardV3DistributionPreview(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {props.items.map((block) => {
        const total = sumItems(block.items) || 1;

        return (
          <div
            key={block.key}
            className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {block.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  breakdown preview
                </div>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                {block.items.length} items
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {block.items.map((item) => {
                const pct = Math.max(4, Math.round((item.value / total) * 100));

                return (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="font-medium text-slate-900">{item.label}</div>
                      <div className="text-slate-600">{formatJPY(item.value)}</div>
                    </div>

                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-slate-900/80"
                        style={{ width: `${pct}%` }}
                        title={`${item.label}: ${item.value}`}
                      />
                    </div>
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
