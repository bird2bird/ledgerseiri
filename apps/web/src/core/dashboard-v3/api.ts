import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit, DashboardV3Range } from "@/core/dashboard-v3/types";
import { loadDashboardCockpitV3, type DashboardV3ProviderMode } from "@/core/dashboard-v3/provider";

export async function fetchDashboardCockpitV3(args: {
  businessView: BusinessViewType;
  range?: DashboardV3Range;
  mode?: DashboardV3ProviderMode;
  companyId?: string;
}): Promise<DashboardV3Cockpit> {
  return loadDashboardCockpitV3({
    businessView: args.businessView,
    range: args.range ?? "30d",
    mode: args.mode ?? "mock",
    companyId: args.companyId,
  });
}

export async function fetchDashboardCockpitV3Mock(args: {
  businessView: BusinessViewType;
  range?: DashboardV3Range;
}): Promise<DashboardV3Cockpit> {
  return fetchDashboardCockpitV3({
    businessView: args.businessView,
    range: args.range ?? "30d",
    mode: "mock",
  });
}
