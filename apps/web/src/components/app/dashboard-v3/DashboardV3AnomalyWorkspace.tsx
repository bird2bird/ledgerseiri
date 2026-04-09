import React from "react";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";

type Props = {
  items: DashboardV3Alert[];
};

function countBySeverity(items: DashboardV3Alert[]) {
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const item of items) {
    if (item.severity === "high") high += 1;
    else if (item.severity === "medium") medium += 1;
    else low += 1;
  }

  return { low, medium, high };
}

export function DashboardV3AnomalyWorkspace(props: Props) {
  const counts = countBySeverity(props.items);

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Anomaly workspace
          </div>
          <div className="mt-1 text-xs text-slate-500">
            重大度ごとの異常件数と次のアクションを整理します。
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
            HIGH {counts.high}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
            MEDIUM {counts.medium}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            LOW {counts.low}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-900">High priority</div>
          <div className="mt-2 text-sm leading-6 text-red-800">
            利益や入金への影響が大きい項目から優先対応します。
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">Medium priority</div>
          <div className="mt-2 text-sm leading-6 text-amber-800">
            直近推移を確認しつつ、悪化トレンドを追います。
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Low priority</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            経過観察とし、異常の蓄積を防ぎます。
          </div>
        </div>
      </div>
    </div>
  );
}
