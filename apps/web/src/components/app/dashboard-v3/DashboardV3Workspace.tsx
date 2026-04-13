import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";
import type { BillingPlanPreview } from "@/core/billing/plan-config";
import type { DashboardSubscriptionAccess } from "@/core/dashboard-v3/subscription-access";
import { DashboardV3PlanStatusBar } from "@/components/app/dashboard-v3/sections/DashboardV3PlanStatusBar";
import { DashboardV3GlobalStatusBar } from "@/components/app/dashboard-v3/sections/DashboardV3GlobalStatusBar";
import { DashboardV3HeaderSection } from "@/components/app/dashboard-v3/sections/DashboardV3HeaderSection";
import { DashboardV3OnboardingBridgeSection } from "@/components/app/dashboard-v3/sections/DashboardV3OnboardingBridgeSection";
import { DashboardV3MetricsSemanticsSection } from "@/components/app/dashboard-v3/sections/DashboardV3MetricsSemanticsSection";
import { DashboardV3KpiSection } from "@/components/app/dashboard-v3/sections/DashboardV3KpiSection";
import { DashboardV3TrendSection } from "@/components/app/dashboard-v3/sections/DashboardV3TrendSection";
import { DashboardV3ProfitBridgeSection } from "@/components/app/dashboard-v3/sections/DashboardV3ProfitBridgeSection";
import { DashboardV3DistributionSection } from "@/components/app/dashboard-v3/sections/DashboardV3DistributionSection";
import { DashboardV3AnomalySection } from "@/components/app/dashboard-v3/sections/DashboardV3AnomalySection";
import { DashboardV3ReconciliationSection } from "@/components/app/dashboard-v3/sections/DashboardV3ReconciliationSection";
import { DashboardV3ExplainSection } from "@/components/app/dashboard-v3/sections/DashboardV3ExplainSection";
import { DashboardV3AccountantSection } from "@/components/app/dashboard-v3/sections/DashboardV3AccountantSection";
import { DashboardV3MigrationPanel } from "@/components/app/dashboard-v3/DashboardV3MigrationPanel";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  cockpit: DashboardV3Cockpit;
  planPreview: BillingPlanPreview;
  subscriptionAccess: DashboardSubscriptionAccess;
};

export function DashboardV3Workspace(props: Props) {
  const { cockpit, lang, businessView, planPreview, subscriptionAccess } = props;
  const isAmazon = businessView === "amazon";

  if (isAmazon) {
    return (
      <div className="space-y-6">
        <DashboardV3PlanStatusBar planPreview={planPreview} />

        <DashboardV3GlobalStatusBar
          lang={lang}
          businessView={businessView}
          cockpit={cockpit}
          planPreview={planPreview}
        />

        <DashboardV3KpiSection
          lang={lang}
          businessView={businessView}
          items={cockpit.summaryKpis}
          drilldownHints={cockpit.drilldownHints}
        />

        <DashboardV3TrendSection
          lang={lang}
          businessView={businessView}
          items={cockpit.trendSeries}
        />

        <DashboardV3ProfitBridgeSection
          lang={lang}
          businessView={businessView}
          cockpit={cockpit}
          drilldownHints={cockpit.drilldownHints}
        />

        <DashboardV3DistributionSection
          lang={lang}
          businessView={businessView}
          items={cockpit.distributions}
        />

        <DashboardV3AnomalySection
          lang={lang}
          businessView={businessView}
          items={cockpit.alerts}
        />

        <DashboardV3ReconciliationSection
          lang={lang}
          businessView={businessView}
          cockpit={cockpit}
          drilldownHints={cockpit.drilldownHints}
          subscriptionAccess={subscriptionAccess}
        />

        <DashboardV3ExplainSection
          lang={lang}
          businessView={businessView}
          items={cockpit.explainSummaries}
          subscriptionAccess={subscriptionAccess}
        />

        <DashboardV3AccountantSection
          lang={lang}
          businessView={businessView}
          cockpit={cockpit}
          drilldownHints={cockpit.drilldownHints}
          subscriptionAccess={subscriptionAccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardV3HeaderSection
        lang={lang}
        businessView={businessView}
        cockpit={cockpit}
      />

      <DashboardV3OnboardingBridgeSection businessView={businessView} />

      <DashboardV3KpiSection
        lang={lang}
        businessView={businessView}
        items={cockpit.summaryKpis}
        drilldownHints={cockpit.drilldownHints}
      />

      <DashboardV3TrendSection
        lang={lang}
        businessView={businessView}
        items={cockpit.trendSeries}
      />

      <DashboardV3DistributionSection
        lang={lang}
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
        subscriptionAccess={subscriptionAccess}
      />

      <DashboardV3MetricsSemanticsSection businessView={businessView} />

      <DashboardV3MigrationPanel
        lang={lang}
        businessView={businessView}
      />
    </div>
  );
}
