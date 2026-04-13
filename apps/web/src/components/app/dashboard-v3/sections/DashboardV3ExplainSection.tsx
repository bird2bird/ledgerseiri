import React from "react";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { normalizeDashboardLocale } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3ExplainSummary[];
  subscriptionAccess?: DashboardSubscriptionAccess;
};

function lockedCopy(lang: string) {
  const locale = normalizeDashboardLocale(lang);

  if (locale === "zh-CN") {
    return {
      title: "Premium 功能",
      summary: "AI explain 经营解读仅对 Premium 开放。升级后可查看自动解释和变化原因。",
      button: "升级到 Premium",
    };
  }

  if (locale === "zh-TW") {
    return {
      title: "Premium 功能",
      summary: "AI explain 經營解讀僅對 Premium 開放。升級後可查看自動解釋與變化原因。",
      button: "升級到 Premium",
    };
  }

  if (locale === "en") {
    return {
      title: "Premium feature",
      summary: "AI explain insights are available on Premium. Upgrade to unlock automatic explanations and drivers.",
      button: "Upgrade to Premium",
    };
  }

  return {
    title: "Premium 機能",
    summary: "AI explain による経営解説は Premium のみ利用できます。アップグレードで自動説明と変動要因を確認できます。",
    button: "Premium にアップグレード",
  };
}

export function DashboardV3ExplainSection(props: Props) {
  const structure = getDashboardSectionStructure(props.businessView);
  const canUse = props.subscriptionAccess?.canUseExplainSection ?? true;
  const locked = lockedCopy(props.lang);

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">
            {structure.explainTitle}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {structure.explainSummary}
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {canUse ? `${props.items.length} explains` : locked.title}
        </div>
      </div>

      {canUse ? (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {props.items.map((item) => (
            <div key={item.key} className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-900">{item.title}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-lg font-semibold text-amber-900">{locked.title}</div>
          <div className="mt-3 text-sm leading-7 text-amber-800">
            {locked.summary}
          </div>
          <div className="mt-5 inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900">
            {locked.button}
          </div>
        </div>
      )}
    </div>
  );
}
