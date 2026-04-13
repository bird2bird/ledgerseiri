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
      hint: "税理士交付工作区从 Standard 开始开放。Starter 可查看准备度摘要，但不能进入详细交付页面。",
      action: "升级到 Standard",
    };
  }

  if (locale === "zh-TW") {
    return {
      label: "Standard 起可用",
      hint: "稅理士交付工作區從 Standard 開始開放。Starter 可查看準備度摘要，但不能進入詳細交付頁面。",
      action: "升級到 Standard",
    };
  }

  if (locale === "en") {
    return {
      label: "Standard required",
      hint: "The accountant handoff workspace is available from Standard. Starter can view readiness but cannot open the detailed handoff page.",
      action: "Upgrade to Standard",
    };
  }

  return {
    label: "Standard 以上",
    hint: "税理士連携ワークスペースは Standard 以上で利用できます。Starter では準備度表示のみで、詳細画面には入れません。",
    action: "Standard にアップグレード",
  };
}

export function DashboardV3AccountantSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const { cockpit, drilldownHints, subscriptionAccess } = props;
  const readiness = cockpit.accountantReadiness;
  const canOpen = subscriptionAccess?.canOpenAccountantHandoff ?? true;
  const locked = lockedCopy(props.lang);

  const href = canOpen
    ? buildDashboardDrilldownHref({
        lang: props.lang,
        hint: drilldownHints?.accountant,
      })
    : null;

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
          ) : (
            <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              {canOpen ? "" : locked.label}
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
