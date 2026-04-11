import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";
import { getBusinessViewConfig } from "@/core/business-view/config";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3Alert[];
};

function count(items: DashboardV3Alert[], severity: "low" | "medium" | "high") {
  return items.filter((item) => item.severity === severity).length;
}

function severityTone(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function DashboardV3AnomalySection(props: Props) {
  const cfg = getBusinessViewConfig(props.businessView);

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">{cfg.anomalyTitle}</div>
          <div className="mt-2 text-sm text-slate-600">{cfg.anomalySubtitle}</div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
            HIGH {count(props.items, "high")}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
            MEDIUM {count(props.items, "medium")}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            LOW {count(props.items, "low")}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <div className="text-lg font-semibold text-red-900">High priority</div>
          <div className="mt-3 text-sm leading-7 text-red-800">{cfg.highPriorityText}</div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-lg font-semibold text-amber-900">Medium priority</div>
          <div className="mt-3 text-sm leading-7 text-amber-800">{cfg.mediumPriorityText}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-lg font-semibold text-slate-900">Low priority</div>
          <div className="mt-3 text-sm leading-7 text-slate-600">{cfg.lowPriorityText}</div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">Alerts / anomaly preview</div>
            <div className="mt-2 text-sm text-slate-600">
              Dashboard が現在検知している主要アラート
            </div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
            {props.items.length} alerts
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {props.items.map((item) => (
            <div key={item.key} className="rounded-3xl border border-black/5 bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>
                  <div className="mt-3 text-sm text-slate-500">推移を確認</div>
                </div>
                <span
                  className={
                    "inline-flex rounded-full border px-3 py-1 text-xs font-medium " +
                    severityTone(item.severity)
                  }
                >
                  {item.severity.toUpperCase()}
                </span>
              </div>

              <div className="mt-5">
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                >
                  詳細を見る
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
