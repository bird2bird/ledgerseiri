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

export function DashboardV3ReconciliationSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const { cockpit, drilldownHints } = props;
  const summary = cockpit.reconciliationSummary;

  const cards = [
    { key: "invoice", label: c.reconciliationInvoice, value: summary.missingInvoices },
    { key: "bank", label: c.reconciliationBank, value: summary.missingBankProofs },
    { key: "review", label: c.reconciliationReview, value: summary.pendingReview },
    { key: "payout", label: c.reconciliationPayout, value: summary.unmatchedPayoutItems },
  ];

  const href = buildDashboardDrilldownHref({
    lang: props.lang,
    hint: drilldownHints?.reconciliation,
  });

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">{c.reconciliationTitle}</div>
          <div className="mt-2 text-sm text-slate-600">
            {c.reconciliationSummary}
          </div>
        </div>

        {href ? (
          <Link
            href={href}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            {getDashboardActionLabel({
              lang: props.lang,
              fallback: drilldownHints?.reconciliation?.label,
              kind: "queue",
            })}
          </Link>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            {c.reconciliationBadge}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>

            {href ? (
              <div className="mt-4">
                <Link
                  href={href}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  {getDashboardActionLabel({
                    lang: props.lang,
                    fallback: drilldownHints?.reconciliation?.label,
                    kind: "queue",
                  })}
                </Link>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">{c.reconciliationPlaceholder}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
