"use client";

import React from "react";
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
        cta="プラン変更を見る"
        href="/ja/app/billing/change"
        targetPlan="standard"
      />
    );
  }

  return (
    <UpgradePromptCard
      title="AI Business Health の全機能は Premium で解放"
      description="AI 月次解説、異常検知、改善提案、会話型分析は Premium で利用できます。"
      cta="Premium を確認"
      href="/ja/app/billing/change"
      targetPlan="premium"
    />
  );
}
