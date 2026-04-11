import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import { DashboardV3HeaderSection } from "@/components/app/dashboard-v3/sections/DashboardV3HeaderSection";
import { DashboardV3OnboardingBridgeSection } from "@/components/app/dashboard-v3/sections/DashboardV3OnboardingBridgeSection";
import { DashboardV3MetricsSemanticsSection } from "@/components/app/dashboard-v3/sections/DashboardV3MetricsSemanticsSection";
import { DashboardV3KpiSection } from "@/components/app/dashboard-v3/sections/DashboardV3KpiSection";
import { DashboardV3TrendSection } from "@/components/app/dashboard-v3/sections/DashboardV3TrendSection";
import { DashboardV3DistributionSection } from "@/components/app/dashboard-v3/sections/DashboardV3DistributionSection";
import { DashboardV3AnomalySection } from "@/components/app/dashboard-v3/sections/DashboardV3AnomalySection";
import { DashboardV3ExplainSection } from "@/components/app/dashboard-v3/sections/DashboardV3ExplainSection";
import { DashboardV3MigrationPanel } from "@/components/app/dashboard-v3/DashboardV3MigrationPanel";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
};

export function DashboardV3Workspace(props: Props) {
  const { cockpit, lang, businessView } = props;

  return (
    <div className="space-y-6">
      <DashboardV3HeaderSection
        lang={lang}
        businessView={businessView}
        cockpit={cockpit}
      />

      <DashboardV3OnboardingBridgeSection businessView={businessView} />

      <DashboardV3KpiSection
        businessView={businessView}
        items={cockpit.summaryKpis}
      />

      <DashboardV3TrendSection
        businessView={businessView}
        items={cockpit.trendSeries}
      />

      <DashboardV3DistributionSection
        businessView={businessView}
        items={cockpit.distributions}
      />

      <DashboardV3AnomalySection
        lang={lang}
        businessView={businessView}
        items={cockpit.alerts}
      />

      <DashboardV3ExplainSection
        lang={lang}
        businessView={businessView}
        items={cockpit.explainSummaries}
      />

      <DashboardV3MetricsSemanticsSection businessView={businessView} />

      <DashboardV3MigrationPanel
        lang={lang}
        businessView={businessView}
      />
    </div>
  );
}
