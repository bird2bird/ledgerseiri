import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DrilldownHints,
} from "@/core/dashboard-v3/types";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardUpgradeCta } from "@/core/dashboard-v3/upgrade-cta";
import {
  buildDashboardDrilldownHref,
  getDashboardActionLabel,
} from "@/core/dashboard-v3/drilldown-map";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  drilldownHints?: DashboardV3DrilldownHints;
  subscriptionAccess?: DashboardSubscriptionAccess;
};

function findKpi(cockpit: DashboardV3Cockpit, keys: string[]) {
  return cockpit.summaryKpis.find((item) => keys.includes(item.key));
}

function formatValue(value: number, unit: "JPY" | "count" | "percent") {
  if (unit === "JPY") return `¥${value.toLocaleString("ja-JP")}`;
  if (unit === "percent") return `${value.toLocaleString("ja-JP")}%`;
  return value.toLocaleString("ja-JP");
}

export function DashboardV3ProfitBridgeSection(props: Props) {
  const { cockpit, drilldownHints, subscriptionAccess } = props;
  const sales = findKpi(cockpit, ["sales"]);
  const payout = findKpi(cockpit, ["payout"]);
  const gap = findKpi(cockpit, ["gap"]);
  const costBlock = cockpit.distributions[0];
  const canOpen = props.subscriptionAccess?.canOpenProfitDrilldown ?? true;
  const readonlyCta = getDashboardUpgradeCta({
    lang: props.lang,
    kind: "readonly",
  });

  const detailCards = [
    { item: sales, hint: drilldownHints?.sales },
    { item: payout, hint: drilldownHints?.payout },
    { item: gap, hint: drilldownHints?.profit },
  ].filter((x) => x.item);

  const profitHref = canOpen
    ? buildDashboardDrilldownHref({
        lang: props.lang,
        hint: drilldownHints?.profit,
      })
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">Profit bridge</div>
            <div className="mt-2 text-sm text-slate-600">
              Understand how sales move through payout, gap, and cost pressure.
            </div>
          </div>
          {profitHref ? (
            <Link
              href={profitHref}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {getDashboardActionLabel({
                lang: props.lang,
                kind: "detail",
              })}
            </Link>
          ) : (
            <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              {readonlyCta.badge}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {detailCards.map(({ item, hint }) => {
            const href = canOpen
              ? buildDashboardDrilldownHref({
                  lang: props.lang,
                  hint,
                })
              : null;

            return (
              <div
                key={item!.key}
                className="rounded-[20px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="text-sm text-slate-500">{item!.label}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatValue(item!.value, item!.unit)}
                </div>
                {item!.deltaLabel ? (
                  <div className="mt-2 text-xs text-slate-500">{item!.deltaLabel}</div>
                ) : null}

                <div className="mt-4">
                  {href ? (
                    <Link
                      href={href}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {getDashboardActionLabel({
                        lang: props.lang,
                        kind: "detail",
                      })}
                    </Link>
                  ) : (
                    <div className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900">
                      {readonlyCta.action}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Cost pressure summary</div>
        <div className="mt-2 text-sm text-slate-600">
          Preview the largest cost categories affecting current profitability.
        </div>

        <div className="mt-5 space-y-3">
          {costBlock?.items?.slice(0, 4).map((item) => (
            <div
              key={item.key}
              className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-900">{item.label}</div>
                <div className="text-sm text-slate-700">
                  ¥{Number(item.value).toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
          ))}

          {!costBlock?.items?.length ? (
            <div className="rounded-[18px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              Cost breakdown preview will appear here.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
