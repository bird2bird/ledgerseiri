"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { fetchWorkspaceContext } from "@/core/workspace/api";
import type { WorkspaceContextValue } from "@/core/workspace/types";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function planTone(code: "starter" | "standard" | "premium") {
  if (code === "premium") {
    return {
      card: "border-violet-200 bg-violet-50",
      badge: "border-violet-200 bg-violet-100 text-violet-700",
      ring: "ring-violet-300",
      button: "ls-btn ls-btn-primary",
      accent: "text-violet-700",
    };
  }

  if (code === "standard") {
    return {
      card: "border-sky-200 bg-sky-50",
      badge: "border-sky-200 bg-sky-100 text-sky-700",
      ring: "ring-sky-300",
      button: "ls-btn ls-btn-primary",
      accent: "text-sky-700",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    ring: "ring-slate-200",
    button: "ls-btn ls-btn-ghost",
    accent: "text-slate-700",
  };
}

function planLabel(code: "starter" | "standard" | "premium") {
  if (code === "starter") return "Starter";
  if (code === "standard") return "Standard";
  return "Premium";
}

function planPrice(code: "starter" | "standard" | "premium") {
  if (code === "starter") return "¥980 / 月";
  if (code === "standard") return "¥1,980 / 月";
  return "¥4,980 / 月";
}

function featureList(code: "starter" | "standard" | "premium") {
  if (code === "starter") {
    return [
      "1 店舗",
      "基本帳簿管理",
      "基本ダッシュボード",
      "請求アップロード（基本）",
      "12 ヶ月履歴",
    ];
  }

  if (code === "standard") {
    return [
      "3 店舗",
      "請求管理",
      "資金移動",
      "高度なエクスポート",
      "24 ヶ月履歴",
    ];
  }

  return [
    "10 店舗",
    "AI Insights",
    "AI Chat",
    "AI OCR",
    "高度な運営分析",
    "24 ヶ月履歴",
  ];
}

function maxStoresByPlan(code: "starter" | "standard" | "premium") {
  if (code === "starter") return 1;
  if (code === "standard") return 3;
  return 10;
}

function normalizePlan(
  code?: string | null
): "starter" | "standard" | "premium" | undefined {
  if (code === "starter" || code === "standard" || code === "premium") return code;
  return undefined;
}


function BillingPageContent() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;

  const [ctx, setCtx] = useState<WorkspaceContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ls_token") : null;

        if (!token) {
          if (!alive) return;
          setError("No login token");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

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
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [lang, debugPlan]);

  const queryPlan = normalizePlan(debugPlan);
  const currentPlan =
    normalizePlan(ctx?.subscription.planCode) ??
    queryPlan ??
    "starter";
  const tone = planTone(currentPlan);

  const plans = useMemo(
    () =>
      (["starter", "standard", "premium"] as const).map((code) => ({
        code,
        name: planLabel(code),
        price: planPrice(code),
        features: featureList(code),
        tone: planTone(code),
        maxStores: maxStoresByPlan(code),
      })),
    []
  );

  const currentLimits = {
    maxStores: maxStoresByPlan(currentPlan),
  };

  return (
    <main className="space-y-6">
      <section
        className={cls(
          "overflow-hidden rounded-[32px] border p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]",
          tone.card
        )}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div
              className={cls(
                "inline-flex rounded-full border px-3 py-1 text-[11px] font-medium",
                tone.badge
              )}
            >
              Current Subscription
            </div>

            <h1 className="mt-5 text-[34px] font-semibold tracking-tight text-slate-900">
              {planLabel(currentPlan)}
            </h1>

            <div className="mt-2 text-sm text-slate-600">
              現在のプラン、利用上限、アップグレード候補を確認できます。
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/app/billing/change?target=standard${debugPlan ? `&plan=${debugPlan}` : ""}`}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                プラン変更へ
              </Link>

              <span className="text-xs text-slate-500">
                source: {ctx?.subscription.source ?? "unknown"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-[22px] border border-black/5 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Current Plan</div>
              <div className={cls("mt-2 text-lg font-semibold", tone.accent)}>
                {planLabel(currentPlan)}
              </div>
              <div className="mt-1 text-xs text-slate-500">{planPrice(currentPlan)}</div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Store Limit</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {currentLimits.maxStores}
              </div>
              <div className="mt-1 text-xs text-slate-500">最大サポート店舗数</div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Workspace</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {ctx?.workspace.displayName ?? "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {ctx?.workspace.slug ?? "default"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          subscription / usage を読み込み中...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          billing context の取得に失敗しました。最後に利用可能な情報を表示します。
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
        <section className="col-span-12 xl:col-span-5 ls-card-solid rounded-[28px] p-5">
          <div className="text-sm font-semibold text-slate-900">Usage / Limits</div>
          <div className="mt-1 text-[12px] text-slate-500">現在の利用上限</div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">店舗数</div>
                  <div className="mt-1 text-xs text-slate-500">
                    現在のプランで利用できる最大店舗数
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {currentLimits.maxStores}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">AI / 高度分析</div>
              <div className="mt-2 text-xs text-slate-500">
                {currentPlan === "premium"
                  ? "Premium で利用可能"
                  : currentPlan === "standard"
                  ? "一部制限あり。上位機能は Premium"
                  : "Starter では制限あり"}
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Export / Billing Readiness</div>
              <div className="mt-2 text-xs text-slate-500">
                Standard 以上でより高度な出力と運営管理を利用できます。
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-7 ls-card-solid rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Plan Comparison</div>
              <div className="mt-1 text-[12px] text-slate-500">
                各プランの違いを比較できます
              </div>
            </div>

            <Link
              href={`/${lang}/app/billing/change?target=standard${debugPlan ? `&plan=${debugPlan}` : ""}`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Compare in detail
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const active = plan.code === currentPlan;

              return (
                <section
                  key={plan.code}
                  className={cls(
                    "rounded-[24px] border p-5 transition",
                    plan.tone.card,
                    active && "ring-2 ring-[color:var(--ls-primary)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                    {active ? (
                      <span className="inline-flex rounded-full border border-black/5 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        Current
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">{plan.price}</div>

                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    <Link
                      href={`/${lang}/app/billing/change?target=${plan.code}${debugPlan ? `&plan=${debugPlan}` : ""}`}
                      className={cls(
                        active ? "ls-btn ls-btn-ghost" : "ls-btn ls-btn-primary",
                        "inline-flex px-4 py-2 text-sm font-semibold"
                      )}
                    >
                      {active ? "現在のプラン" : `${plan.name} を確認`}
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="text-sm font-semibold text-slate-900">Upgrade Guidance</div>
        <div className="mt-1 text-[12px] text-slate-500">
          現在プランから上位プランへ移行すると解放される機能
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Starter → Standard</div>
            <div className="mt-2 text-sm text-slate-600">
              複数店舗、請求管理、資金移動、高度なエクスポートが解放されます。
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Standard → Premium</div>
            <div className="mt-2 text-sm text-slate-600">
              AI Insights / AI OCR / AI Chat / 高度な運営分析が解放されます。
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="ls-card-solid p-6">
            <div className="text-sm text-slate-500">Loading billing page...</div>
          </div>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
