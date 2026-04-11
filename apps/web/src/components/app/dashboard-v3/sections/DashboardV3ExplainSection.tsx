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
          <div className="text-2xl font-semibold text-slate-900">Explain preview</div>
          <div className="mt-2 text-sm text-slate-600">
            Dashboard が現在提示できる主要な説明サマリー
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {props.items.length} explains
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.key} className="rounded-3xl border border-black/5 bg-slate-50 p-5">
            <div className="text-lg font-semibold text-slate-900">{item.title}</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>

            <div className="mt-5">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                関連画面へ
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
