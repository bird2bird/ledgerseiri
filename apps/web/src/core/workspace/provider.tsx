"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { fetchWorkspaceContext } from "@/core/workspace/api";
import { TenantSuspendedError } from "@/core/tenant-suspended";
import type { WorkspaceContextValue } from "@/core/workspace/types";
import { getPlanLimits } from "@/core/billing/planLimits";

type WorkspaceProviderValue = {
  ctx: WorkspaceContextValue | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceProviderValue | null>(null);

type PlanCode = "starter" | "standard" | "premium";

function normalizePlan(code?: string | null): PlanCode | undefined {
  if (code === "starter" || code === "standard" || code === "premium") return code;
  return undefined;
}

function buildFallbackContext(args: {
  planCode: PlanCode;
  locale: string;
  source: "mock-default" | "mock-query";
}): WorkspaceContextValue {
  return {
    workspace: {
      slug: "default",
      displayName: "Default",
      companyName: "LedgerSeiri Demo Company",
      locale: args.locale,
    },
    subscription: {
      planCode: args.planCode,
      status: "active",
      source: args.source,
      limits: getPlanLimits(args.planCode),
    },
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();

  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;

  const [ctx, setCtx] = useState<WorkspaceContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWorkspaceContext() {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ls_token") ?? undefined
          : undefined;

      const data = await fetchWorkspaceContext({
        token,
        slug: "default",
        locale: lang,
        plan: debugPlan,
      });

      setCtx(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      const fallbackPlan = normalizePlan(debugPlan) ?? "starter";
      setCtx(
        buildFallbackContext({
          planCode: fallbackPlan,
          locale: lang,
          source: debugPlan ? "mock-query" : "mock-default",
        })
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("ls_token") ?? undefined
            : undefined;

        const data = await fetchWorkspaceContext({
          token,
          slug: "default",
          locale: lang,
          plan: debugPlan,
        });

        if (!alive) return;
        setCtx(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? String(e));
        const fallbackPlan = normalizePlan(debugPlan) ?? "starter";
        setCtx(
          buildFallbackContext({
            planCode: fallbackPlan,
            locale: lang,
            source: debugPlan ? "mock-query" : "mock-default",
          })
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [lang, debugPlan]);

  const value = useMemo<WorkspaceProviderValue>(
    () => ({
      ctx,
      loading,
      error,
      refresh: loadWorkspaceContext,
    }),
    [ctx, loading, error]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceProvider() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceProvider must be used inside WorkspaceProvider");
  }
  return ctx;
}
