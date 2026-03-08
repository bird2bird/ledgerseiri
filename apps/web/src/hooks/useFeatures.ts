"use client";

import { useMemo } from "react";
import type { PlanCode } from "@/components/app/dashboard-v2/types";
import { getPlanFeatures, hasFeature, type FeatureKey } from "@/core/billing/features";

export function useFeatures(planCode: PlanCode) {
  const features = useMemo(() => getPlanFeatures(planCode), [planCode]);

  const can = useMemo(
    () => (key: FeatureKey) => hasFeature(planCode, key),
    [planCode]
  );

  return {
    features,
    can,
  };
}
