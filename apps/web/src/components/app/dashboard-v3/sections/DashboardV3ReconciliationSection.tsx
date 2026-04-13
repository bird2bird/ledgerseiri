import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DrilldownHints,
} from "@/core/dashboard-v3/types";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardCopy, normalizeDashboardLocale } from "@/core/dashboard-copy";
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

function lockedCopy(lang: string) {
  const locale = normalizeDashboardLocale(lang);

  if (locale === "zh-CN") {
    return {
      label: "Standard 起可用",
      hint: "对账工作台从 Standard 开始开放。Starter 可查看摘要，但不能进入处理页面。",
      action: "升级到 Standard",
    };
  }

  if (locale === "zh-TW") {
    return {
      label: "Standard 起可用",
      hint: "對帳工作台從 Standard 開始開放。Starter 可查看摘要，但不能進入處理頁面。",
      action: "升級到 Standard",
    };
  }

  if (locale === "en") {
    return {
      label: "Standard required",
      hint: "The reconciliation workspace is available from Standard. Starter can view the summary but cannot open the action workspace.",
      action: "Upgrade to Standard",
    };
  }

  return {
    label: "Standard 以上",
    hint: "照合ワークスペースは Standard 以上で利用できます。Starter では概要表示のみで、処理画面には入れません。",
    action: "Standard にアップグレード",
  };
}

export function DashboardV3ReconciliationSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const { cockpit, drilldownHints, subscriptionAccess } = props;
  const summary = cockpit.reconciliationSummary;
  const canOpen = subscriptionAccess?.canOpenReconciliation ?? true;
  const locked = lockedCopy(props.lang);

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
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
            {canOpen ? c.reconciliationBadge : locked.label}
          </div>
        )}
      </div>

      {!canOpen ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          {locked.hint}
          <div className="mt-3 inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium">
            {locked.action}
          </div>
        </div>
      ) : null}

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
