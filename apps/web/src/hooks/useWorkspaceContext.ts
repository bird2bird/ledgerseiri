"use client";

import { useMemo } from "react";
import type { WorkspaceContextValue } from "@/core/workspace/types";
import { getPlanFeatures } from "@/core/billing/features";

export function useWorkspaceContext(ctx: WorkspaceContextValue) {
  const features = useMemo(
    () => getPlanFeatures(ctx.subscription.planCode),
    [ctx.subscription.planCode]
  );

  return {
    workspace: ctx.workspace,
    subscription: ctx.subscription,
    features,
  };
}
