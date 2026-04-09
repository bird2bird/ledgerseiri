import React from "react";
import Link from "next/link";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";
import { getDashboardV3AlertHref } from "@/core/dashboard-v3/drilldown";

function severityClasses(severity: "low" | "medium" | "high"): string {
  if (severity === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

type Props = {
  lang: string;
  items: DashboardV3Alert[];
};

export function DashboardV3AlertsPreview(props: Props) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Alerts / anomaly preview
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Dashboard が現在検知している主要アラート
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
          {props.items.length} alerts
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {props.items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-black/5 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {item.title}
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-600">
                  {item.summary}
                </div>
              </div>

              <span
                className={
                  "inline-flex rounded-full border px-3 py-1 text-xs font-medium " +
                  severityClasses(item.severity)
                }
              >
                {item.severity.toUpperCase()}
              </span>
            </div>

            <div className="mt-4">
              <Link
                href={getDashboardV3AlertHref(props.lang, item)}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
