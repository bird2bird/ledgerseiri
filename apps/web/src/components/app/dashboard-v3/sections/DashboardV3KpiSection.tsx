import React from "react";
import Link from "next/link";
import type { DashboardV3Kpi, DashboardV3DrilldownHints } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardUpgradeCta } from "@/core/dashboard-v3/upgrade-cta";
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
  subscriptionAccess?: DashboardSubscriptionAccess;
};

function formatValue(item: DashboardV3Kpi): string {
  if (item.unit === "JPY") {
    return `¥${Number(item.value).toLocaleString("ja-JP")}`;
  }
  return Number(item.value).toLocaleString("ja-JP");
}

export function DashboardV3KpiSection(props: Props) {
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView, props.lang);
  const canOpen = props.subscriptionAccess?.canOpenKpiDrilldown ?? true;
  const readonlyCta = getDashboardUpgradeCta({
    lang: props.lang,
    kind: "readonly",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-black/5 bg-white px-5 py-4 shadow-sm">
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
          const href = canOpen
            ? buildDashboardDrilldownHref({
                lang: props.lang,
                hint,
              })
            : null;

          return (
            <div
              key={item.key}
              className={
                "relative flex min-h-[210px] flex-col justify-between rounded-[24px] border border-black/5 p-6 shadow-sm " +
                theme.kpiClasses[index % theme.kpiClasses.length]
              }
            >
              <div>
                <div className="text-sm font-medium opacity-90">{item.label}</div>
                <div className="mt-4 text-[44px] font-semibold tracking-tight">
                  {formatValue(item)}
                </div>
                <div className="mt-3 text-sm opacity-80">
                  {item.deltaLabel || "—"}
                </div>
              </div>

              <div className="mt-6">
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-white"
                  >
                    {getDashboardActionLabel({
                      lang: props.lang,
                      kind: "detail",
                    })}
                  </Link>
                ) : props.subscriptionAccess?.isReadonly ? (
                  <div className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm">
                    {readonlyCta.action}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
