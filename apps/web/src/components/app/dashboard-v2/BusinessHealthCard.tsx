"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { BusinessHealthData } from "./types";
import {
  getBusinessHealthInsightHref,
  getBusinessHealthOverviewHref,
} from "./dashboard-linking";

function statusTone(status: BusinessHealthData["status"]) {
  switch (status) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "risk":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function statusLabel(status: BusinessHealthData["status"]) {
  switch (status) {
    case "good":
      return "Good";
    case "risk":
      return "Risk";
    default:
      return "Attention";
  }
}

export function BusinessHealthCard({
  data,
}: {
  data: BusinessHealthData;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang;
  const overviewHref = getBusinessHealthOverviewHref(lang);

  return (
    <DashboardSectionCard
      title="Business Health"
      subtitle="経営状態のスコアと示唆"
      action={
        <Link
          href={overviewHref}
          className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium"
        >
          詳細を見る
        </Link>
      }
      className="h-full"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4">
        <div>
          <div className="text-[12px] font-medium text-slate-500">Health Score</div>
          <div className="mt-2 text-[40px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
            {data.score}
          </div>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
            data.status
          )}`}
        >
          {statusLabel(data.status)}
        </span>
      </div>

      {!!data.dimensions?.length ? (
        <div className="mt-4 space-y-3">
          {data.dimensions.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium tabular-nums text-slate-900">{item.score}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!!data.insights?.length ? (
        <div className="mt-5 space-y-3">
          {data.insights.map((item) => {
            const href = getBusinessHealthInsightHref(item.title, lang);
            const toneClass =
              item.tone === "good"
                ? "border-emerald-200 bg-emerald-50"
                : item.tone === "warning"
                ? "border-amber-200 bg-amber-50"
                : "border-black/5 bg-white";

            return (
              <Link
                key={item.id}
                href={href}
                className={`block rounded-2xl border p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)] focus:outline-none focus:ring-2 focus:ring-slate-300 ${toneClass}`}
              >
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                {item.detail ? (
                  <div className="mt-1 text-[12px] leading-5 text-slate-600">{item.detail}</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </DashboardSectionCard>
  );
}
