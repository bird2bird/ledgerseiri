import React from "react";
import Link from "next/link";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";
import { getDashboardV3ExplainHref } from "@/core/dashboard-v3/drilldown";

type Props = {
  lang: string;
  items: DashboardV3ExplainSummary[];
};

export function DashboardV3ExplainPreview(props: Props) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Explain preview
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Dashboard が現在提示できる主要な説明サマリー
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
          {props.items.length} explains
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-black/5 bg-slate-50 p-4"
          >
            <div className="text-sm font-semibold text-slate-900">
              {item.title}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              {item.summary}
            </div>

            <div className="mt-4">
              <Link
                href={getDashboardV3ExplainHref(props.lang, item)}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                関連画面へ
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
