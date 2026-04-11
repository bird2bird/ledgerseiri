import React from "react";
import type { DashboardV3Kpi } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";

type Props = {
  businessView: BusinessViewType;
  items: DashboardV3Kpi[];
};

function formatValue(item: DashboardV3Kpi): string {
  if (item.unit === "JPY") {
    return `¥${Number(item.value).toLocaleString("ja-JP")}`;
  }
  return Number(item.value).toLocaleString("ja-JP");
}

function getSectionCopy(view: BusinessViewType) {
  if (view === "amazon") {
    return {
      title: "Key metrics for Amazon operations",
      summary: "売上・入金・差額を起点に、Amazon運営の状態を最初に把握します。",
    };
  }
  if (view === "ec") {
    return {
      title: "Key metrics for cash conversion",
      summary: "回収・費用・受注のバランスを最初に把握します。",
    };
  }
  if (view === "restaurant") {
    return {
      title: "Key metrics for restaurant pressure",
      summary: "原価・人件費・利益圧力を最初に把握します。",
    };
  }
  return {
    title: "Key metrics for business overview",
    summary: "売上・入金・費用・案件進行の全体像を最初に把握します。",
  };
}

export function DashboardV3KpiSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);
  const copy = getSectionCopy(props.businessView);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {copy.title}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {copy.summary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {props.items.map((item, index) => (
          <div
            key={item.key}
            className={
              "rounded-[28px] border border-black/5 p-6 shadow-sm " +
              theme.kpiClasses[index % theme.kpiClasses.length]
            }
          >
            <div className="text-sm font-medium opacity-90">{item.label}</div>
            <div className="mt-4 text-4xl font-semibold tracking-tight">
              {formatValue(item)}
            </div>
            <div className="mt-3 text-sm opacity-80">
              {item.deltaLabel || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
