import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DrilldownHints,
} from "@/core/dashboard-v3/types";
import { getDashboardCopy } from "@/core/dashboard-copy";
import {
  buildDashboardDrilldownHref,
  getDashboardActionLabel,
} from "@/core/dashboard-v3/drilldown-map";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  drilldownHints?: DashboardV3DrilldownHints;
};

export function DashboardV3AccountantSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const { cockpit, drilldownHints } = props;
  const readiness = cockpit.accountantReadiness;

  const href = buildDashboardDrilldownHref({
    lang: props.lang,
    hint: drilldownHints?.accountant,
  });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">{c.accountantTitle}</div>
            <div className="mt-2 text-sm text-slate-600">
              {c.accountantSummary}
            </div>
          </div>

          {href ? (
            <Link
              href={href}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
            >
              {getDashboardActionLabel({
                lang: props.lang,
                fallback: drilldownHints?.accountant?.label,
                kind: "workspace",
              })}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{c.accountantInvoiceReadiness}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {readiness.invoiceReadinessPercent}%
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{c.accountantExplainCoverage}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {readiness.explainCoverageCount} items
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-500">{c.accountantReviewBlockers}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {readiness.reviewBlockersCount}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">{c.accountantChecklistTitle}</div>
        <div className="mt-2 text-sm text-slate-600">
          {c.accountantChecklistSummary}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {readiness.checklist.map((item) => (
            <div
              key={item.key}
              className={
                "rounded-2xl border px-4 py-3 text-sm " +
                (item.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700")
              }
            >
              {item.label}
            </div>
          ))}
        </div>

        {href ? (
          <div className="mt-6">
            <Link
              href={href}
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {getDashboardActionLabel({
                lang: props.lang,
                fallback: drilldownHints?.accountant?.label,
                kind: "workspace",
              })}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
