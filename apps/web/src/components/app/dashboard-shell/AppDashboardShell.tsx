import React from "react";
import {
  type BusinessViewType,
  getBusinessViewDescription,
  getBusinessViewLabel,
} from "@/core/business-view";

type Props = {
  businessView: BusinessViewType;
  children: React.ReactNode;
};

export function AppDashboardShell(props: Props) {
  const label = getBusinessViewLabel(props.businessView);
  const description = getBusinessViewDescription(props.businessView);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/5 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Dashboard Shell / Business View Layer
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {label}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Current dashboard content still uses DashboardHomeV2.
            <br />
            Step85-F 以降で section / chart-first cockpit へ移行します。
          </div>
        </div>
      </div>

      {props.children}
    </div>
  );
}
