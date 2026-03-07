"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { BusinessHealthData } from "./types";

function statusTone(status: BusinessHealthData["status"]) {
  switch (status) {
    case "good":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "attention":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-rose-700 bg-rose-50 border-rose-200";
  }
}

function statusLabel(status: BusinessHealthData["status"]) {
  switch (status) {
    case "good":
      return "Good";
    case "attention":
      return "Attention";
    default:
      return "Risk";
  }
}

function insightTone(tone?: "default" | "warning" | "good") {
  if (tone === "warning") return "border-amber-200 bg-amber-50";
  if (tone === "good") return "border-emerald-200 bg-emerald-50";
  return "border-black/5 bg-white";
}

export function BusinessHealthCard({
  data,
}: {
  data: BusinessHealthData;
}) {
  return (
    <DashboardSectionCard
      title="AI Insights / Business Health"
      subtitle="経営状態の要約"
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/5 bg-slate-50 p-5">
          <div className="text-[12px] text-slate-500">Business Health Score</div>

          <div className="mt-3 flex items-end gap-2">
            <div className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {data.score}
            </div>
            <div className="pb-1 text-sm text-slate-500">/ 100</div>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                data.status
              )}`}
            >
              {statusLabel(data.status)}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {data.dimensions.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
                  <span>{d.label}</span>
                  <span className="tabular-nums text-slate-700">{d.score}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[color:var(--ls-primary)]"
                    style={{ width: `${Math.max(0, Math.min(100, d.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {data.insights.map((it) => (
            <div
              key={it.id}
              className={`rounded-2xl border p-4 ${insightTone(it.tone)}`}
            >
              <div className="text-sm font-medium text-slate-900">{it.title}</div>
              {it.detail ? (
                <div className="mt-1 text-[12px] leading-5 text-slate-500">
                  {it.detail}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </DashboardSectionCard>
  );
}
