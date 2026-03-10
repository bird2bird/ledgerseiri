"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useWorkspaceContext } from "@/hooks/useWorkspaceContext";
import { getPlanFeatures } from "@/core/billing/features";
import { getPlanLimits } from "@/core/billing/planLimits";
import type { WorkspaceContextValue } from "@/core/workspace/types";
import { useWorkspaceProvider } from "@/core/workspace/provider";

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

function statusLabel(status?: string | null) {
  if (status === "trialing") return "Trialing";
  if (status === "past_due") return "Past Due";
  if (status === "canceled") return "Canceled";
  return "Active";
}

function yesNo(v: boolean) {
  return v ? "利用可能" : "制限あり";
}

function buildPlanFeatureList(code: PlanCode): string[] {
  const limits = getPlanLimits(code);
  const features = getPlanFeatures(code);

  const items: string[] = [
    `${limits.maxStores} 店舗`,
    `${limits.historyMonths} ヶ月履歴`,
    `請求アップロード`,
  ];

  if (features.invoiceManagement) items.push("請求管理");
  if (features.fundTransfer) items.push("資金移動");
  if (features.advancedExport) items.push("高度なエクスポート");
  if (features.aiInsights) items.push("AI Insights");
  if (features.aiChat) items.push("AI Chat");
  if (features.invoiceOcr) items.push("AI OCR");

  return items;
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

function BillingPageContent() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;
  const { ctx, loading, error } = useWorkspaceProvider();



  const fallbackPlan = normalizePlan(debugPlan) ?? "starter";

  const effectiveCtx = useMemo(
    () =>
      ctx ??
      buildFallbackContext({
        planCode: fallbackPlan,
        locale: lang,
        source: debugPlan ? "mock-query" : "mock-default",
      }),
    [ctx, fallbackPlan, lang, debugPlan]
  );

  const { workspace, subscription, features, limits } = useWorkspaceContext(effectiveCtx);

  const currentPlan = subscription.planCode;
  const tone = planTone(currentPlan);

  const plans = useMemo(
    () =>
      (["starter", "standard", "premium"] as const).map((code) => ({
        code,
        name: planLabel(code),
        price: planPrice(code),
        features: buildPlanFeatureList(code),
        tone: planTone(code),
        limits: getPlanLimits(code),
      })),
    []
  );

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

              <span className="inline-flex rounded-full border border-black/5 bg-white/80 px-3 py-1 text-[11px] text-slate-600">
                status: {statusLabel(subscription.status)}
              </span>

              <span className="inline-flex rounded-full border border-black/5 bg-white/80 px-3 py-1 text-[11px] text-slate-600">
                source: {subscription.source}
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
                {limits.maxStores}
              </div>
              <div className="mt-1 text-xs text-slate-500">最大サポート店舗数</div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Workspace</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {workspace.displayName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {workspace.slug}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          契約情報を読み込み中...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          契約情報の取得に失敗しました。最後に利用可能な情報を表示しています。
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-5 xl:gap-6">
        <section className="col-span-12 xl:col-span-5 ls-card-solid rounded-[28px] p-5">
          <div className="text-sm font-semibold text-slate-900">Usage / Limits</div>
          <div className="mt-1 text-[12px] text-slate-500">現在の契約上限</div>

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
                  {limits.maxStores}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">請求保存容量</div>
                  <div className="mt-1 text-xs text-slate-500">
                    請求書・証憑の保存上限
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {limits.invoiceStorageMb} MB
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">AI Chat / 月</div>
                  <div className="mt-1 text-xs text-slate-500">
                    月次 AI Chat 利用上限
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {limits.aiChatMonthly}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">AI OCR / 月</div>
                  <div className="mt-1 text-xs text-slate-500">
                    月次 AI OCR 利用上限
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {limits.aiInvoiceOcrMonthly}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">履歴保持</div>
                  <div className="mt-1 text-xs text-slate-500">
                    閲覧できる履歴保持期間
                  </div>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {limits.historyMonths} ヶ月
                </div>
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

                  <div className="mt-5 text-xs text-slate-500">
                    maxStores: {plan.limits.maxStores} / history: {plan.limits.historyMonths}m
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

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="text-sm font-semibold text-slate-900">Feature Availability</div>
        <div className="mt-1 text-[12px] text-slate-500">
          現在の契約で解放されている機能
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">請求・出力系</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>請求アップロード: {yesNo(features.invoiceUpload)}</div>
              <div>請求管理: {yesNo(features.invoiceManagement)}</div>
              <div>高度エクスポート: {yesNo(features.advancedExport)}</div>
              <div>SKU レベル出力: {yesNo(features.skuLevelExport)}</div>
            </div>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">AI・運営分析系</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>AI Insights: {yesNo(features.aiInsights)}</div>
              <div>AI Chat: {yesNo(features.aiChat)}</div>
              <div>AI OCR: {yesNo(features.invoiceOcr)}</div>
              <div>資金移動: {yesNo(features.fundTransfer)}</div>
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
