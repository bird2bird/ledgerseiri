import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit, DashboardV3Range } from "@/core/dashboard-v3/types";
import { makeDashboardV3CockpitMock } from "@/core/dashboard-v3/mock";

export type DashboardV3ProviderMode = "mock" | "real";

export type DashboardV3ProviderArgs = {
  businessView: BusinessViewType;
  range?: DashboardV3Range;
  mode?: DashboardV3ProviderMode;
};

export async function loadDashboardCockpitV3(
  args: DashboardV3ProviderArgs
): Promise<DashboardV3Cockpit> {
  const mode = args.mode ?? "mock";

  if (mode === "real") {
    // Real provider seam placeholder.
    // Step89 では interface を固定し、fallback を mock に残します。
    return makeDashboardV3CockpitMock({
      businessView: args.businessView,
      range: args.range ?? "30d",
    });
  }

  return makeDashboardV3CockpitMock({
    businessView: args.businessView,
    range: args.range ?? "30d",
  });
}
