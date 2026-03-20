"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { getBusinessHealthLockedHref } from "./dashboard-linking";

type PlanCode = "starter" | "standard" | "premium";

function lockedMessage(planCode: PlanCode) {
  if (planCode === "starter") {
    return {
      title: "Business Health は Standard 以上、AI Insights は Premium で利用できます",
      detail: "まずは Business Health を解放し、Premium では AI Insights による要約と示唆を確認できます。",
      cta: "プランを確認",
    };
  }

  if (planCode === "standard") {
    return {
      title: "AI Insights を含む詳細分析は Premium で解放されます",
      detail: "Premium では Business Health に加え、AI Insights から経営要約・注意点・次の打ち手を確認できます。",
      cta: "Premium を確認",
    };
  }

  return {
    title: "Business Health は利用可能です",
    detail: "現在のプランではこのカードはロックされていません。",
    cta: "詳細を見る",
  };
}

export function BusinessHealthLockedCard({
  planCode,
}: {
  planCode: PlanCode;
}) {
  const params = useParams<{ lang: string }>();
  const href = getBusinessHealthLockedHref(params?.lang);

  const msg = lockedMessage(planCode);

  return (
    <DashboardSectionCard
      title="Business Health"
      subtitle="経営健全性の統合分析"
      action={
        <Link
          href={href}
          className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium"
        >
          プラン変更
        </Link>
      }
      className="h-full"
    >
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 px-6 py-8 text-center">
        <div className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-medium text-violet-700">
          Locked Feature
        </div>

        <div className="mt-4 text-lg font-semibold text-slate-900">
          {msg.title}
        </div>

        <div className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {msg.detail}
        </div>

        <Link
          href={href}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {msg.cta}
        </Link>
      </div>
    </DashboardSectionCard>
  );
}
