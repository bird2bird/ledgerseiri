"use client";

import React from "react";

export function UpgradePromptCard({
  title = "上位プランで機能を解放",
  description = "AI 分析・多店舗管理・高度なエクスポートを利用できます。",
  cta = "プランを見る",
}: {
  title?: string;
  description?: string;
  cta?: string;
}) {
  return (
    <section className="ls-card-solid p-5">
      <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
        Upgrade
      </div>

      <div className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </div>

      <div className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </div>

      <button className="ls-btn ls-btn-primary mt-4 px-4 py-2 text-sm font-semibold">
        {cta}
      </button>
    </section>
  );
}
