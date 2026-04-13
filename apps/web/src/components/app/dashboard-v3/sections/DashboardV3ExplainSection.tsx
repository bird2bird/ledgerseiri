import React from "react";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardUpgradeCta } from "@/core/dashboard-v3/upgrade-cta";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3ExplainSummary[];
  subscriptionAccess?: DashboardSubscriptionAccess;
};

export function DashboardV3ExplainSection(props: Props) {
  const structure = getDashboardSectionStructure(props.businessView, props.lang);
  const canUse = props.subscriptionAccess?.canUseExplainSection ?? true;
  const lockKind = props.subscriptionAccess?.isReadonly ? "readonly" : "premium";
  const locked = getDashboardUpgradeCta({
    lang: props.lang,
    kind: lockKind,
  });

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">
            {structure.explainTitle}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {structure.explainSummary}
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          {canUse ? `${props.items.length} explains` : locked.badge}
        </div>
      </div>

      {canUse ? (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {props.items.map((item) => (
            <div key={item.key} className="rounded-[20px] border border-black/5 bg-slate-50 p-5">
              <div className="text-lg font-semibold text-slate-900">{item.title}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-base font-semibold text-amber-900">{locked.title}</div>
              <div className="mt-2 text-sm leading-7 text-amber-800">
                {locked.summary}
              </div>
            </div>
            <div className="inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900">
              {locked.action}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
