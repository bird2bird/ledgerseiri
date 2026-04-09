import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import { DashboardV3HeaderSection } from "@/components/app/dashboard-v3/sections/DashboardV3HeaderSection";
import { DashboardV3MetricsSemanticsSection } from "@/components/app/dashboard-v3/sections/DashboardV3MetricsSemanticsSection";
import { DashboardV3KpiSection } from "@/components/app/dashboard-v3/sections/DashboardV3KpiSection";
import { DashboardV3TrendSection } from "@/components/app/dashboard-v3/sections/DashboardV3TrendSection";
import { DashboardV3DistributionSection } from "@/components/app/dashboard-v3/sections/DashboardV3DistributionSection";
import { DashboardV3AnomalySection } from "@/components/app/dashboard-v3/sections/DashboardV3AnomalySection";
import { DashboardV3ExplainSection } from "@/components/app/dashboard-v3/sections/DashboardV3ExplainSection";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

export function DashboardV3Workspace(props: Props) {
  const { cockpit, lang, businessView } = props;

  return (
    <div className="space-y-6">
      <DashboardV3HeaderSection businessView={businessView} cockpit={cockpit} />
      <DashboardV3MetricsSemanticsSection businessView={businessView} />
      <DashboardV3KpiSection items={cockpit.summaryKpis} />
      <DashboardV3TrendSection items={cockpit.trendSeries} />
      <DashboardV3DistributionSection items={cockpit.distributions} />
      <DashboardV3AnomalySection lang={lang} businessView={businessView} items={cockpit.alerts} />
      <DashboardV3ExplainSection lang={lang} items={cockpit.explainSummaries} />
    </div>
  );
}
