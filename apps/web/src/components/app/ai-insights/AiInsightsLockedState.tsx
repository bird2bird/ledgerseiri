import React from "react";
import { UpgradePromptCard } from "@/components/app/dashboard-v2/UpgradePromptCard";
import { AiInsightsStatCard } from "./AiInsightsStatCard";

export function AiInsightsLockedState(props: {
  planCode: string;
  workspaceName: string;
  upgradeHref: string;
}) {
  const currentPlanLabel =
    props.planCode === "premium"
      ? "Premium"
      : props.planCode === "standard"
      ? "Standard"
      : "Starter";

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
              AI Insights
            </div>

            <h1 className="mt-5 text-[34px] font-semibold tracking-tight">AI Insights</h1>

            <div className="mt-2 text-sm text-white/80">
              利益率、未入金、資金余力、AI 利用枠をもとに経営判断の示唆を提示します。
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                current plan: {currentPlanLabel}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                workspace: {props.workspaceName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Required Plan</div>
              <div className="mt-2 text-lg font-semibold">Premium</div>
              <div className="mt-1 text-xs text-slate-500">AI Insights / AI Chat / AI OCR</div>
            </div>

            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Current Access</div>
              <div className="mt-2 text-lg font-semibold">Locked</div>
              <div className="mt-1 text-xs text-slate-500">Premium で解放されます</div>
            </div>
          </div>
        </div>
      </section>

      <UpgradePromptCard
        title="AI Insights は Premium で利用できます"
        description="AI 分析、経営示唆、AI Chat / OCR の月次利用枠を Premium プランで解放します。"
        cta="Premium を確認"
        href={props.upgradeHref}
        targetPlan="premium"
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AiInsightsStatCard
          title="対象機能"
          value="AI 分析"
          helper="利益率・未入金・資金余力・利用枠の集約表示"
          tone="primary"
        />
        <AiInsightsStatCard
          title="利用条件"
          value="Premium"
          helper="Starter / Standard ではロック表示"
          tone="warning"
        />
        <AiInsightsStatCard
          title="アップグレード先"
          value="Billing"
          helper="プラン比較ページから変更候補を確認"
          tone="default"
        />
      </section>
    </main>
  );
}
