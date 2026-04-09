import React from "react";
import {
  type BusinessViewType,
  getBusinessViewDescription,
  getBusinessViewLabel,
} from "@/core/business-view";
import type {
  DashboardV3Alert,
  DashboardV3DistributionBlock,
  DashboardV3Kpi,
  DashboardV3TrendSeries,
} from "@/core/dashboard-v3/types";
import { DashboardV3KpiRow } from "@/components/app/dashboard-v3-preview/DashboardV3KpiRow";
import { DashboardV3TrendPreview } from "@/components/app/dashboard-v3-preview/DashboardV3TrendPreview";
import { DashboardV3DistributionPreview } from "@/components/app/dashboard-v3-preview/DashboardV3DistributionPreview";
import { DashboardV3AlertsPreview } from "@/components/app/dashboard-v3-preview/DashboardV3AlertsPreview";

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
  businessView: BusinessViewType;
  contractPreview?: ContractPreview;
  previewKpis?: DashboardV3Kpi[];
  previewTrends?: DashboardV3TrendSeries[];
  previewDistributions?: DashboardV3DistributionBlock[];
  previewAlerts?: DashboardV3Alert[];
  children: React.ReactNode;
};

export function AppDashboardShell(props: Props) {
  const label = getBusinessViewLabel(props.businessView);
  const description = getBusinessViewDescription(props.businessView);

  return (
    <div className="space-y-6">
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
              Current dashboard content still uses DashboardHomeV2.
              <br />
              Step85-J 以降で explain preview を追加します。
            </div>
          </div>

          {props.contractPreview ? (
            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Dashboard V3 contract preview
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

      {props.previewKpis && props.previewKpis.length > 0 ? (
        <DashboardV3KpiRow items={props.previewKpis} />
      ) : null}

      {props.previewTrends && props.previewTrends.length > 0 ? (
        <DashboardV3TrendPreview items={props.previewTrends} />
      ) : null}

      {props.previewDistributions && props.previewDistributions.length > 0 ? (
        <DashboardV3DistributionPreview items={props.previewDistributions} />
      ) : null}

      {props.previewAlerts && props.previewAlerts.length > 0 ? (
        <DashboardV3AlertsPreview items={props.previewAlerts} />
      ) : null}

      {props.children}
    </div>
  );
}
