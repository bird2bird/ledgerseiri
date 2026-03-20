import Link from "next/link";
import React from "react";

type HealthLike = {
  score?: number;
  headline?: string;
};

type UsageLike = {
  aiChatUsedMonthly?: number;
};

type LimitsLike = {
  aiChatMonthly?: number;
};

export function AiInsightsHero(props: {
  workspaceName: string;
  primaryReportHref: string;
  health: HealthLike;
  usageData: UsageLike;
  effectiveLimits: LimitsLike;
  monthKey?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
        <div>
          <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
            AI Insights
          </div>

          <h1 className="mt-5 text-[34px] font-semibold tracking-tight">AI Insights</h1>

          <div className="mt-2 text-sm text-white/80">
            ダッシュボードとレポートの実データを集約し、経営状態の示唆を提示します。
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
              workspace: {props.workspaceName}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
              plan: Premium
            </span>
            <Link
              href={props.primaryReportHref}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              利益分析へ
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Health Score</div>
            <div className="mt-2 text-lg font-semibold">{props.health.score ?? 0}</div>
            <div className="mt-1 text-xs text-slate-500">{props.health.headline ?? "—"}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">AI Chat Usage</div>
            <div className="mt-2 text-lg font-semibold">
              {props.usageData.aiChatUsedMonthly ?? 0} / {props.effectiveLimits.aiChatMonthly ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500">{props.monthKey ?? "current month"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
