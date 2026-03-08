"use client";

import React from "react";
import Link from "next/link";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function planTone(targetPlan?: "standard" | "premium") {
  if (targetPlan === "premium") {
    return {
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      button: "ls-btn ls-btn-primary",
      label: "Premium",
    };
  }

  return {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    button: "ls-btn ls-btn-primary",
    label: "Standard+",
  };
}

export function UpgradePromptCard({
  title = "上位プランで機能を解放",
  description = "AI 分析・多店舗管理・高度なエクスポートを利用できます。",
  cta = "プランを見る",
  href = "/ja/app/billing/change",
  targetPlan = "standard",
  compact = false,
}: {
  title?: string;
  description?: string;
  cta?: string;
  href?: string;
  targetPlan?: "standard" | "premium";
  compact?: boolean;
}) {
  const tone = planTone(targetPlan);

  return (
    <section
      className={cls(
        "ls-card-solid",
        compact ? "p-4" : "p-5"
      )}
    >
      <div
        className={cls(
          "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
          tone.badge
        )}
      >
        Upgrade · {tone.label}
      </div>

      <div
        className={cls(
          "font-semibold tracking-tight text-slate-900",
          compact ? "mt-3 text-base" : "mt-3 text-lg"
        )}
      >
        {title}
      </div>

      <div
        className={cls(
          "text-slate-500",
          compact ? "mt-2 text-sm leading-6" : "mt-2 text-sm leading-6"
        )}
      >
        {description}
      </div>

      <div className="mt-4">
        <Link
          href={href}
          className={cls(tone.button, "inline-flex px-4 py-2 text-sm font-semibold")}
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
