import type { BusinessViewType } from "@/core/business-view";

export type DashboardActionMap = {
  primaryReportHref: string;
  anomalyWorkspaceHref: string;
  explainWorkspaceHref: string;
};

export function getDashboardActionMap(args: {
  lang: string;
  businessView: BusinessViewType;
}): DashboardActionMap {
  const { lang, businessView } = args;

  if (businessView === "amazon") {
    return {
      primaryReportHref: `/${lang}/app/reports/profit?from=dashboard-v3-primary`,
      anomalyWorkspaceHref: `/${lang}/app/amazon-reconciliation?from=dashboard-v3-anomaly`,
      explainWorkspaceHref: `/${lang}/app/ai-insights?from=dashboard-v3-explain`,
    };
  }

  if (businessView === "ec") {
    return {
      primaryReportHref: `/${lang}/app/reports/income?from=dashboard-v3-primary`,
      anomalyWorkspaceHref: `/${lang}/app/reports/expense?from=dashboard-v3-anomaly`,
      explainWorkspaceHref: `/${lang}/app/ai-insights?from=dashboard-v3-explain`,
    };
  }

  if (businessView === "restaurant") {
    return {
      primaryReportHref: `/${lang}/app/reports/profit?from=dashboard-v3-primary`,
      anomalyWorkspaceHref: `/${lang}/app/reports/expense?from=dashboard-v3-anomaly`,
      explainWorkspaceHref: `/${lang}/app/ai-insights?from=dashboard-v3-explain`,
    };
  }

  return {
    primaryReportHref: `/${lang}/app/reports/detail?from=dashboard-v3-primary`,
    anomalyWorkspaceHref: `/${lang}/app/reports/expense?from=dashboard-v3-anomaly`,
    explainWorkspaceHref: `/${lang}/app/ai-insights?from=dashboard-v3-explain`,
  };
}
