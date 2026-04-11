import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardOnboardingBridge } from "@/core/dashboard-v3/onboarding-bridge";

type Props = {
  businessView: BusinessViewType;
};

export function DashboardV3OnboardingBridgeSection(props: Props) {
  const bridge = getDashboardOnboardingBridge(props.businessView);

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {bridge.eyebrow}
          </div>

          <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {bridge.title}
          </div>

          <div className="mt-3 text-sm leading-7 text-slate-600">
            {bridge.summary}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {bridge.focusItems.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="xl:w-[360px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-900">
              今の見方
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              {bridge.actionHint}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
