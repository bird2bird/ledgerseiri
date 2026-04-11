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

export function DashboardV3KpiSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);

  return (
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
  );
}
