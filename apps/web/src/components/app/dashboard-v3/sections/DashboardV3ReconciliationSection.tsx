import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DrilldownHints,
} from "@/core/dashboard-v3/types";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardCopy } from "@/core/dashboard-copy";
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

export function DashboardV3ReconciliationSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const { cockpit, drilldownHints, subscriptionAccess } = props;
  const summary = cockpit.reconciliationSummary;
  const canOpen = props.subscriptionAccess?.canOpenReconciliation ?? true;
  const lockKind = props.subscriptionAccess?.isReadonly ? "readonly" : "standard";
  const locked = getDashboardUpgradeCta({
    lang: props.lang,
    kind: lockKind,
  });

  const cards = [
    { key: "invoice", label: c.reconciliationInvoice, value: summary.missingInvoices },
    { key: "bank", label: c.reconciliationBank, value: summary.missingBankProofs },
    { key: "review", label: c.reconciliationReview, value: summary.pendingReview },
    { key: "payout", label: c.reconciliationPayout, value: summary.unmatchedPayoutItems },
  ];

  const href = canOpen
    ? buildDashboardDrilldownHref({
        lang: props.lang,
        hint: drilldownHints?.reconciliation,
      })
    : null;

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
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
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {getDashboardActionLabel({
              lang: props.lang,
              kind: "queue",
            })}
          </Link>
        ) : (
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            {locked.badge}
          </div>
        )}
      </div>

      {!canOpen ? (
        <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-sm leading-7 text-amber-900">{locked.summary}</div>
            <div className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900">
              {locked.action}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-[20px] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>

            <div className="mt-4">
              {href ? (
                <Link
                  href={href}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {getDashboardActionLabel({
                    lang: props.lang,
                    kind: "queue",
                  })}
                </Link>
              ) : (
                <div className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900">
                  {locked.action}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
