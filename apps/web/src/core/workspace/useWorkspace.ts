"use client";

import { useWorkspaceProvider } from "@/core/workspace/provider";

export function useWorkspace() {
  const { ctx } = useWorkspaceProvider();
  return ctx;
}
