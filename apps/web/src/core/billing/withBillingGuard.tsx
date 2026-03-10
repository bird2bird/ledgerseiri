"use client";

import React from "react";
import { useBillingGuard } from "./useBillingGuard";
import { UpgradeNudge } from "@/components/billing/UpgradeNudge";
import type { FeatureKey } from "@/core/billing/features";

export function withBillingGuard(
  Component: React.ComponentType,
  feature: FeatureKey
) {
  return function GuardedComponent(props: any) {
    const { entitlements } = useBillingGuard();

    if (!entitlements?.[feature]) {
      return <UpgradeNudge feature={feature} />;
    }

    return <Component {...props} />;
  };
}
