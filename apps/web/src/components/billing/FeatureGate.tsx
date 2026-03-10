"use client";

import React from "react";
import { useBillingGuard } from "@/core/billing/useBillingGuard";
import type { FeatureKey } from "@/core/billing/features";
import { UpgradeNudge } from "./UpgradeNudge";

type Props = {
  feature: FeatureKey;
  children: React.ReactNode;
};

export function FeatureGate({ feature, children }: Props) {
  const { entitlements } = useBillingGuard();

  if (!entitlements?.[feature]) {
    return <UpgradeNudge feature={feature} />;
  }

  return <>{children}</>;
}
