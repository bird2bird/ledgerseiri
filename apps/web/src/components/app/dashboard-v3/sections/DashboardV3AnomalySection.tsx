import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";
import { getBusinessViewConfig } from "@/core/business-view/config";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3Alert[];
};

function count(items: DashboardV3Alert[], severity: "low" | "medium" | "high") {
  return items.filter((item) => item.severity === severity).length;
}

function severityTone(severity: "low" | "medium" | "high") {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function priorityWidth(severity: "low" | "medium" | "high") {
  if (severity === "high") return "w-[88%]";
  if (severity === "medium") return "w-[58%]";
  return "w-[28%]";
}

function priorityColor(severity: "low" | "medium" | "high") {
  if (severity === "high") return "bg-red-500";
  if (severity === "medium") return "bg-amber-500";
  return "bg-slate-500";
}

function actionHint(lang: string, view: BusinessViewType, severity: "low" | "medium" | "high") {
  const c = getDashboardCopy(lang);
  if (view === "amazon") {
    if (severity === "high") return c.anomalyHintAmazonHigh;
    if (severity === "medium") return c.anomalyHintAmazonMedium;
    return c.anomalyHintAmazonLow;
  }
  if (view === "ec") {
    if (severity === "high") return c.anomalyHintEcHigh;
    if (severity === "medium") return c.anomalyHintEcMedium;
    return c.anomalyHintEcLow;
  }
  return "";
}

export function DashboardV3AnomalySection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const cfg = getBusinessViewConfig(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);
  const isEnhanced = props.businessView === "amazon" || props.businessView === "ec";

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            {structure.anomalyTitle}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {structure.anomalySummary}
          </div>
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
          <div className="text-lg font-semibold text-red-900">{c.anomalyHigh}</div>
          <div className="mt-3 text-sm leading-7 text-red-800">{cfg.highPriorityText}</div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-lg font-semibold text-amber-900">{c.anomalyMedium}</div>
          <div className="mt-3 text-sm leading-7 text-amber-800">{cfg.mediumPriorityText}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-lg font-semibold text-slate-900">{c.anomalyLow}</div>
          <div className="mt-3 text-sm leading-7 text-slate-600">{cfg.lowPriorityText}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.key} className="rounded-3xl border border-black/5 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>
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

            {isEnhanced ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div
                      className={"h-2 rounded-full " + priorityColor(item.severity) + " " + priorityWidth(item.severity)}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{c.anomalyPriority}</span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-600">
                  {actionHint(props.lang, props.businessView, item.severity)}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
