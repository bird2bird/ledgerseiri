import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit, DashboardV3Range } from "@/core/dashboard-v3/types";
import { makeDashboardV3CockpitMock } from "@/core/dashboard-v3/mock";

export async function fetchDashboardCockpitV3Mock(args: {
  businessView: BusinessViewType;
  range?: DashboardV3Range;
}): Promise<DashboardV3Cockpit> {
  return makeDashboardV3CockpitMock({
    businessView: args.businessView,
    range: args.range ?? "30d",
  });
}
