"use client";

import Link from "next/link";
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
  const limits = getPlanLimits(args.planCode);

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
      limits,
    },
    limits,
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

  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    message: string;
    target: string;
  }>({
    open: false,
    message: "現在のプラン上限に達しました。アップグレードすると引き続き利用できます。",
    target: "standard",
  });

  async function loadWorkspaceContext() {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? undefined
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
            ? undefined
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

  useEffect(() => {
    function onPlanLimit(event: Event) {
      const custom = event as CustomEvent<{ message?: string; target?: string }>;
      setUpgradeModal({
        open: true,
        message:
          custom.detail?.message ||
          "現在のプラン上限に達しました。アップグレードすると引き続き利用できます。",
        target: custom.detail?.target || "standard",
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("ledgerseiri:plan-limit-reached", onPlanLimit as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ledgerseiri:plan-limit-reached", onPlanLimit as EventListener);
      }
    };
  }, []);

  const value = useMemo<WorkspaceProviderValue>(
    () => ({
      ctx,
      loading,
      error,
      refresh: loadWorkspaceContext,
    }),
    [ctx, loading, error]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}

      {upgradeModal.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-lg font-semibold text-slate-900">プラン上限に達しました</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              {upgradeModal.message}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setUpgradeModal((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
                className="inline-flex items-center justify-center rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                閉じる
              </button>

              <Link
                href={`/${lang}/app/billing/change?target=${upgradeModal.target || "standard"}`}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                onClick={() =>
                  setUpgradeModal((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
              >
                アップグレード
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceProvider() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceProvider must be used inside WorkspaceProvider");
  }
  return ctx;
}
