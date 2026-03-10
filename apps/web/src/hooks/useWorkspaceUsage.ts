"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWorkspaceUsage, type WorkspaceUsageResponse } from "@/core/workspace/usageApi";

export function useWorkspaceUsage(args: {
  slug?: string;
  plan?: string;
  locale?: string;
}) {
  const [data, setData] = useState<WorkspaceUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ls_token") ?? undefined
          : undefined;

      const res = await fetchWorkspaceUsage({
        token,
        slug: args.slug,
        plan: args.plan,
        locale: args.locale,
      });

      setData(res);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [args.slug, args.plan, args.locale]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}
