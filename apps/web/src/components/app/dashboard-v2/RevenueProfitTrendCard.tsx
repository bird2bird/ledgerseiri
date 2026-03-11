"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { RevenueProfitPoint } from "./types";

function fmtJPY(n: number) {
  try {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `¥${Math.round(n)}`;
  }
}

function polyline(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function RevenueProfitTrendCard({
  points,
  rangeLabel,
}: {
  points: RevenueProfitPoint[];
  rangeLabel: "7D" | "30D" | "90D" | "12M";
}) {
  const width = 100;
  const height = 40;
  const max = Math.max(1, ...points.flatMap((p) => [p.revenue, p.profit]));

  const revenuePts = points.map((p, i) => ({
    x: points.length === 1 ? 0 : (i / (points.length - 1)) * width,
    y: height - (p.revenue / max) * (height - 4) - 2,
  }));

  const profitPts = points.map((p, i) => ({
    x: points.length === 1 ? 0 : (i / (points.length - 1)) * width,
    y: height - (p.profit / max) * (height - 4) - 2,
  }));

  const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = points.reduce((s, p) => s + p.profit, 0);
  const margin = Math.round((totalProfit / Math.max(1, totalRevenue)) * 100);

  return (
    <DashboardSectionCard
      title="Revenue / Profit Trend"
      subtitle="売上と利益の推移"
      action={
        <span className="ls-badge px-2.5 py-1 text-[11px] font-medium text-slate-700">
          {rangeLabel}
        </span>
      }
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex items-center gap-4 text-[12px]">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ls-primary)]" />
              Revenue
            </div>
            <div className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Profit
            </div>
          </div>

          <div className="mt-4 h-56 w-full">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <polyline
                points={polyline(revenuePts)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[color:var(--ls-primary)]"
              />
              <polyline
                points={polyline(profitPts)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500"
              />
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-[12px] text-slate-500">
            {points.slice(-3).map((p) => (
              <div key={p.label} className="rounded-xl bg-slate-50 px-3 py-2">
                <div>{p.label}</div>
                <div className="mt-1 font-medium text-slate-800">{fmtJPY(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
            <div className="text-[12px] text-slate-500">Total Revenue</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {fmtJPY(totalRevenue)}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
            <div className="text-[12px] text-slate-500">Total Profit</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {fmtJPY(totalProfit)}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
            <div className="text-[12px] text-slate-500">Profit Margin</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {margin}%
            </div>
          </div>
        </div>
      </div>
    </DashboardSectionCard>
  );
}
