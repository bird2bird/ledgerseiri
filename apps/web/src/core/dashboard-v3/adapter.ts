import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";

type LooseCockpitPayload = Partial<DashboardV3Cockpit> & {
  source?: string;
  businessView?: string;
};

export function adaptLoosePayloadToDashboardV3Cockpit(args: {
  businessView: BusinessViewType;
  payload: LooseCockpitPayload;
  fallback: DashboardV3Cockpit;
}): DashboardV3Cockpit {
  const { payload, fallback, businessView } = args;

  return {
    businessView,
    range: payload.range ?? fallback.range,
    source: (payload.source as DashboardV3Cockpit["source"]) ?? fallback.source,
    summaryKpis: Array.isArray(payload.summaryKpis) ? payload.summaryKpis : fallback.summaryKpis,
    trendSeries: Array.isArray(payload.trendSeries) ? payload.trendSeries : fallback.trendSeries,
    distributions: Array.isArray(payload.distributions) ? payload.distributions : fallback.distributions,
    alerts: Array.isArray(payload.alerts) ? payload.alerts : fallback.alerts,
    explainSummaries: Array.isArray(payload.explainSummaries)
      ? payload.explainSummaries
      : fallback.explainSummaries,
  };
}
