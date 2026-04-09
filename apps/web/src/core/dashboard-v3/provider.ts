import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit, DashboardV3Range } from "@/core/dashboard-v3/types";
import { makeDashboardV3CockpitMock } from "@/core/dashboard-v3/mock";
import { adaptLoosePayloadToDashboardV3Cockpit } from "@/core/dashboard-v3/adapter";

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
  const fallback = makeDashboardV3CockpitMock({
    businessView: args.businessView,
    range: args.range ?? "30d",
  });

  if (mode === "real") {
    try {
      const params = new URLSearchParams({
        businessType: args.businessView,
        range: args.range ?? "30d",
      });

      const res = await fetch(`http://localhost:3000/api/dashboard/cockpit-v3?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`cockpit-v3 real request failed: ${res.status}`);
      }

      const payload = await res.json();

      return adaptLoosePayloadToDashboardV3Cockpit({
        businessView: args.businessView,
        payload,
        fallback: {
          ...fallback,
          source: "mock-fallback",
        },
      });
    } catch (err) {
      console.error("[dashboard-v3] real provider failed, fallback to mock", err);
      return {
        ...fallback,
        source: "mock-fallback",
      };
    }
  }

  return {
    ...fallback,
    source: "mock",
  };
}
