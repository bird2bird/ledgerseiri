"use client";

import React from "react";
import type { FeatureKey } from "@/core/billing/features";
import { useWorkspaceGate } from "@/hooks/useWorkspaceGate";

export function FeatureGate({
  feature,
  children,
  fallback = null,
  loadingFallback = null,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}) {
  const { loading, can } = useWorkspaceGate();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!can(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
