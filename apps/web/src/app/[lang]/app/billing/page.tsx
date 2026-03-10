"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useWorkspaceProvider } from "@/core/workspace/provider";
import { useWorkspaceUsage } from "@/hooks/useWorkspaceUsage";
import { getPlanFeatures } from "@/core/billing/features";
import { getPlanLimits } from "@/core/billing/planLimits";

type PlanCode = "starter" | "standard" | "premium";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function planTone(code: PlanCode) {
  if (code === "premium") {
    return {
      card: "border-violet-200 bg-violet-50",
      badge: "border-violet-200 bg-violet-100 text-violet-700",
      ring: "ring-violet-300",
      accent: "text-violet-700",
    };
  }

  if (code === "standard") {
    return {
      card: "border-sky-200 bg-sky-50",
      badge: "border-sky-200 bg-sky-100 text-sky-700",
      ring: "ring-sky-300",
      accent: "text-sky-700",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    ring: "ring-slate-200",
    accent: "text-slate-700",
  };
}

function planLabel(code: PlanCode) {
  if (code === "starter") return "Starter";
  if (code === "standard") return "Standard";
  return "Premium";
}

function planPrice(code: PlanCode) {
  if (code === "starter") return "¥980 / 月";
  if (code === "standard") return "¥1,980 / 月";
  return "¥4,980 / 月";
}

function normalizePlan(code?: string | null): PlanCode | undefined {
  if (code === "starter" || code === "standard" || code === "premium") return code;
  return undefined;
}

function featureList(code: PlanCode) {
  const features = getPlanFeatures(code);
  const limits = getPlanLimits(code);

  const rows = [
    `${limits.maxStores} 店舗`,
    `${limits.historyMonths} ヶ月履歴`,
    "請求アップロード",
  ];

  if (features.invoiceManagement) rows.push("請求管理");
  if (features.fundTransfer) rows.push("資金移動");
  if (features.advancedExport) rows.push("高度なエクスポート");
  if (features.aiInsights) rows.push("AI Insights");
  if (features.aiChat) rows.push("AI Chat");
  if (features.invoiceOcr) rows.push("AI OCR");

  return rows;
}

function UsageProgress({
  label,
  helper,
  used,
  limit,
  pct,
  over,
}: {
  label: string;
  helper: string;
  used: number;
  limit: number;
  pct: number;
  over: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-500">{helper}</div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-slate-900">
            {used} / {limit}
          </div>
          <div className={cls("mt-1 text-xs", over ? "text-rose-600" : "text-slate-500")}>
            {pct}% 使用
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cls(
            "h-full rounded-full transition-all",
            over ? "bg-rose-500" : "bg-[color:var(--ls-primary)]"
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function BillingPageInner() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;

  const { ctx, loading: ctxLoading, error: ctxError } = useWorkspaceProvider();
  const usage = useWorkspaceUsage({
    slug: "default",
    locale: lang,
    plan: debugPlan,
  });

  const currentPlan =
    normalizePlan(ctx?.subscription.planCode) ??
    normalizePlan(debugPlan) ??
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
      })),
    []
  );

  const effectiveLimits =
    usage.data?.effectiveLimits ??
    ctx?.subscription.limits ??
    getPlanLimits(currentPlan);

  const usageData = usage.data?.usage;
  const util = usage.data?.utilization;
  const over = usage.data?.overLimit;

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
              現在の契約プラン、利用上限、機能解放状況を確認できます。
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/app/billing/change?target=standard${debugPlan ? `&plan=${debugPlan}` : ""}`}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                プラン変更へ
              </Link>

              <span className="text-xs text-slate-500">
                status: {ctx?.subscription.status ?? "active"}
              </span>

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
                {effectiveLimits.maxStores}
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

      {ctxLoading || usage.loading ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          subscription / usage を読み込み中...
        </div>
      ) : null}

      {ctxError || usage.error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          契約情報または利用状況の取得に失敗しました。最後に利用可能な情報を表示しています。
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
        <section className="col-span-12 xl:col-span-5 ls-card-solid rounded-[28px] p-5">
          <div className="text-sm font-semibold text-slate-900">Usage / Limits</div>
          <div className="mt-1 text-[12px] text-slate-500">
            現在の利用状況と上限
            {usage.data?.period?.monthKey ? `（${usage.data.period.monthKey}）` : ""}
          </div>

          <div className="mt-5 space-y-4">
            <UsageProgress
              label="店舗数"
              helper="現在利用中の店舗数 / 利用上限"
              used={usageData?.storesUsed ?? 0}
              limit={effectiveLimits.maxStores}
              pct={util?.storesPct ?? 0}
              over={over?.stores ?? false}
            />

            <UsageProgress
              label="請求保存容量"
              helper="請求書・証憑の保存容量"
              used={usageData?.invoiceStorageMbUsed ?? 0}
              limit={effectiveLimits.invoiceStorageMb}
              pct={util?.invoiceStoragePct ?? 0}
              over={over?.invoiceStorage ?? false}
            />

            <UsageProgress
              label="AI Chat / 月"
              helper="月次 AI Chat 利用量"
              used={usageData?.aiChatUsedMonthly ?? 0}
              limit={effectiveLimits.aiChatMonthly}
              pct={util?.aiChatPct ?? 0}
              over={over?.aiChat ?? false}
            />

            <UsageProgress
              label="AI OCR / 月"
              helper="月次 AI OCR 利用量"
              used={usageData?.aiInvoiceOcrUsedMonthly ?? 0}
              limit={effectiveLimits.aiInvoiceOcrMonthly}
              pct={util?.aiInvoiceOcrPct ?? 0}
              over={over?.aiInvoiceOcr ?? false}
            />
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
              const planLimits = getPlanLimits(plan.code);

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

                  <div className="mt-4 text-xs text-slate-500">
                    maxStores: {planLimits.maxStores} / history: {planLimits.historyMonths}m
                  </div>

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
      <BillingPageInner />
    </Suspense>
  );
}
