import React from "react";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";

type Props = {
  lang: string;
  items: DashboardV3ExplainSummary[];
};

export function DashboardV3ExplainSection(props: Props) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">Explain preview</div>
          <div className="mt-2 text-sm text-slate-600">
            主要な説明サマリーだけを簡潔に表示します。
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {props.items.length} explains
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.key} className="rounded-3xl border border-black/5 bg-slate-50 p-5">
            <div className="text-lg font-semibold text-slate-900">{item.title}</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
