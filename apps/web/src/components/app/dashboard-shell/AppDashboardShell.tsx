import React from "react";
import {
  type BusinessViewType,
  getBusinessViewDescription,
  getBusinessViewLabel,
} from "@/core/business-view";
import { DashboardUserQuickMenu } from "@/components/app/dashboard-shell/DashboardUserQuickMenu";

type ContractPreview = {
  source: string;
  rangeLabel: string;
  kpiCount: number;
  trendCount: number;
  distributionCount: number;
  alertCount: number;
  explainCount: number;
};

type Props = {
  lang: string;
  businessView: BusinessViewType;
  contractPreview?: ContractPreview;
  children: React.ReactNode;
};

export function AppDashboardShell(props: Props) {
  const label = getBusinessViewLabel(props.businessView);
  const description = getBusinessViewDescription(props.businessView);

  return (
    <div className="space-y-6">
      <DashboardUserQuickMenu
        lang={props.lang}
        businessView={props.businessView}
      />

      <div className="rounded-[28px] border border-black/5 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4">
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
              Dashboard V3 is the primary workspace.
              <br />
              Legacy DashboardHomeV2 remains as fallback below.
            </div>
          </div>

          {props.contractPreview ? (
            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Dashboard V3 contract summary
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    source: {props.contractPreview.source} · range: {props.contractPreview.rangeLabel}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                  <span className="rounded-full border border-white bg-white px-3 py-1">
                    KPI {props.contractPreview.kpiCount}
                  </span>
                  <span className="rounded-full border border-white bg-white px-3 py-1">
                    Trends {props.contractPreview.trendCount}
                  </span>
                  <span className="rounded-full border border-white bg-white px-3 py-1">
                    Distributions {props.contractPreview.distributionCount}
                  </span>
                  <span className="rounded-full border border-white bg-white px-3 py-1">
                    Alerts {props.contractPreview.alertCount}
                  </span>
                  <span className="rounded-full border border-white bg-white px-3 py-1">
                    Explain {props.contractPreview.explainCount}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {props.children}
    </div>
  );
}
