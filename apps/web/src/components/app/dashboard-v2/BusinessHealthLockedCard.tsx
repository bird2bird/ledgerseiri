"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { UpgradePromptCard } from "./UpgradePromptCard";

export function BusinessHealthLockedCard({
  planCode,
}: {
  planCode: "starter" | "standard";
}) {
  if (planCode === "starter") {
    return (
      <UpgradePromptCard
        title="AI 経営分析は Standard / Premium で解放"
        description="事業の健康状態、異常検知、AI インサイトは上位プランで利用できます。"
        cta="プランを見る"
      />
    );
  }

  return (
    <DashboardSectionCard
      title="AI Insights / Business Health"
      subtitle="Premium で全機能解放"
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/5 bg-slate-50 p-5">
          <div className="text-[12px] text-slate-500">Business Health</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            82
            <span className="ml-2 text-sm font-normal text-slate-500">/100</span>
          </div>

          <div className="mt-3">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              Premium unlock
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {[
              ["Revenue Growth", 84],
              ["Profit Margin", 79],
              ["Cash Runway", 81],
            ].map(([label, score]) => (
              <div key={String(label)}>
                <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
                  <span>{label}</span>
                  <span className="text-slate-700">{score}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-300"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Premium で AI 月次解説を解放
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Premium で異常検知と改善提案を解放
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Premium で AI 会話型分析を解放
          </div>
        </div>
      </div>
    </DashboardSectionCard>
  );
}
