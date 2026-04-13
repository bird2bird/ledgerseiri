import React from "react";
import Link from "next/link";
import type { DashboardV3Kpi, DashboardV3DrilldownHints } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import {
  buildDashboardDrilldownHref,
  getDashboardActionLabel,
  getHintByKpiKey,
} from "@/core/dashboard-v3/drilldown-map";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3Kpi[];
  drilldownHints?: DashboardV3DrilldownHints;
};

function formatValue(item: DashboardV3Kpi): string {
  if (item.unit === "JPY") {
    return `¥${Number(item.value).toLocaleString("ja-JP")}`;
  }
  return Number(item.value).toLocaleString("ja-JP");
}

export function DashboardV3KpiSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {structure.kpiTitle}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {structure.kpiSummary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {props.items.map((item, index) => {
          const hint = getHintByKpiKey(props.drilldownHints, item.key);
          const href = buildDashboardDrilldownHref({
            lang: props.lang,
            hint,
          });

          return (
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

              {href ? (
                <div className="mt-5">
                  <Link
                    href={href}
                    className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-white"
                  >
                    {getDashboardActionLabel({
                      lang: props.lang,
                      fallback: hint?.label,
                      kind: "detail",
                    })}
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
