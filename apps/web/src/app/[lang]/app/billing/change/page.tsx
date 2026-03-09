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

function cardTone(code: "starter" | "standard" | "premium") {
  if (code === "premium") return "border-violet-200 bg-violet-50";
  if (code === "standard") return "border-sky-200 bg-sky-50";
  return "border-slate-200 bg-white";
}

function planPrice(code: "starter" | "standard" | "premium") {
  if (code === "starter") return "¥980 / 月";
  if (code === "standard") return "¥1,980 / 月";
  return "¥4,980 / 月";
}

function maxStores(code: "starter" | "standard" | "premium") {
  if (code === "starter") return 1;
  if (code === "standard") return 3;
  return 10;
}

function featureList(code: "starter" | "standard" | "premium") {
  if (code === "starter") {
    return ["基本帳簿", "単一店舗", "基本ダッシュボード", "12ヶ月履歴"];
  }
  if (code === "standard") {
    return ["3店舗", "請求管理", "資金移動", "高度エクスポート", "24ヶ月履歴"];
  }
  return ["10店舗", "AI Insights", "AI OCR", "AI Chat", "高度分析", "24ヶ月履歴"];
}

function ChangePlanInner() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;

  const rawTarget = searchParams.get("target") || "standard";
  const target = (rawTarget === "starter" || rawTarget === "standard" || rawTarget === "premium"
    ? rawTarget
    : "standard") as "starter" | "standard" | "premium";

  const [ctx, setCtx] = useState<WorkspaceContextValue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ls_token") : null;

        if (!token) {
          if (!alive) return;
          setLoading(false);
          return;
        }

        const data = await fetchWorkspaceContext({
          token,
          slug: "default",
          locale: lang,
          plan: debugPlan,
        });

        if (!alive) return;
        setCtx(data);
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

  const currentPlan = ctx?.subscription.planCode ?? "starter";

  const plans = useMemo(
    () =>
      (["starter", "standard", "premium"] as const).map((code) => ({
        code,
        name: code === "starter" ? "Starter" : code === "standard" ? "Standard" : "Premium",
        price: planPrice(code),
        desc:
          code === "starter"
            ? "1 店舗向けの基本プラン"
            : code === "standard"
            ? "複数店舗・請求管理・高度な出力向け"
            : "AI 分析・OCR・高度な運営支援向け",
        maxStores: maxStores(code),
        features: featureList(code),
      })),
    []
  );

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
              Plan Change
            </div>

            <h1 className="mt-5 text-[34px] font-semibold tracking-tight">
              プラン変更
            </h1>

            <div className="mt-2 text-sm text-white/80">
              現在プランと変更候補を比較できます。決済導線は次ステップで接続します。
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/app/billing${debugPlan ? `?plan=${debugPlan}` : ""}`}
                className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                Billing に戻る
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Current Plan</div>
              <div className="mt-2 text-lg font-semibold">
                {currentPlan === "starter" ? "Starter" : currentPlan === "standard" ? "Standard" : "Premium"}
              </div>
            </div>

            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Selected Target</div>
              <div className="mt-2 text-lg font-semibold">
                {target === "starter" ? "Starter" : target === "standard" ? "Standard" : "Premium"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          current subscription を読み込み中...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const active = plan.code === target;
          const current = plan.code === currentPlan;

          return (
            <section
              key={plan.code}
              className={cls(
                "rounded-[26px] border p-5 shadow-sm transition",
                cardTone(plan.code),
                active && "ring-2 ring-[color:var(--ls-primary)]"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-slate-900">{plan.name}</div>

                <div className="flex items-center gap-2">
                  {current ? (
                    <span className="inline-flex rounded-full border border-black/5 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      Current
                    </span>
                  ) : null}

                  {active ? (
                    <span className="inline-flex rounded-full border border-[color:var(--ls-primary)] bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[color:var(--ls-primary)]">
                      Selected
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 text-sm text-slate-500">{plan.price}</div>
              <div className="mt-3 text-sm text-slate-600">{plan.desc}</div>

              <div className="mt-4 rounded-[18px] border border-black/5 bg-white/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Store limit</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {plan.maxStores} stores
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>

              <div className="mt-5">
                <Link
                  href={`/${lang}/app/billing/change?target=${plan.code}${debugPlan ? `&plan=${debugPlan}` : ""}`}
                  className={cls(
                    active ? "ls-btn ls-btn-primary" : "ls-btn ls-btn-ghost",
                    "inline-flex px-4 py-2 text-sm font-semibold"
                  )}
                >
                  {active ? "選択中" : "このプランを選択"}
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="text-sm font-semibold text-slate-900">Upgrade Impact</div>
        <div className="mt-1 text-[12px] text-slate-500">
          現在プランと選択プランの差分
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-[11px] font-medium text-slate-500">Current</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {currentPlan === "starter" ? "Starter" : currentPlan === "standard" ? "Standard" : "Premium"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              最大 {maxStores(currentPlan)} 店舗
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-[11px] font-medium text-slate-500">Target</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {target === "starter" ? "Starter" : target === "standard" ? "Standard" : "Premium"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              最大 {maxStores(target)} 店舗
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-dashed border-[color:var(--ls-primary)]/35 bg-[color:var(--ls-primary)]/5 p-4">
          <div className="text-sm font-medium text-slate-900">Next Step</div>
          <div className="mt-2 text-sm text-slate-600">
            Step 23B で決済導線、請求履歴、請求状態、upgrade action を接続します。
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          billing change page を読み込み中...
        </main>
      }
    >
      <ChangePlanInner />
    </Suspense>
  );
}
