import type { PlanCode } from "@/components/app/dashboard-v2/types";

export type FeatureKey =
  | "aiInsights"
  | "aiChat"
  | "invoiceUpload"
  | "invoiceOcr"
  | "multiStore"
  | "fundTransfer"
  | "invoiceManagement"
  | "advancedExport"
  | "skuLevelExport"
  | "history24m";

export type FeatureMatrix = Record<FeatureKey, boolean>;

export const PLAN_FEATURES: Record<PlanCode, FeatureMatrix> = {
  starter: {
    aiInsights: false,
    aiChat: false,
    invoiceUpload: true,
    invoiceOcr: false,
    multiStore: false,
    fundTransfer: false,
    invoiceManagement: false,
    advancedExport: false,
    skuLevelExport: false,
    history24m: false,
  },

  standard: {
    aiInsights: false,
    aiChat: false,
    invoiceUpload: true,
    invoiceOcr: false,
    multiStore: true,
    fundTransfer: true,
    invoiceManagement: true,
    advancedExport: true,
    skuLevelExport: true,
    history24m: true,
  },

  premium: {
    aiInsights: true,
    aiChat: true,
    invoiceUpload: true,
    invoiceOcr: true,
    multiStore: true,
    fundTransfer: true,
    invoiceManagement: true,
    advancedExport: true,
    skuLevelExport: true,
    history24m: true,
  },
};

export function getPlanFeatures(planCode: PlanCode): FeatureMatrix {
  return PLAN_FEATURES[planCode] ?? PLAN_FEATURES.starter;
}

export function hasFeature(planCode: PlanCode, key: FeatureKey): boolean {
  return getPlanFeatures(planCode)[key] === true;
}
