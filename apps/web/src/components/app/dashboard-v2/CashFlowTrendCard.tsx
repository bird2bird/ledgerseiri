"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { CashFlowPoint } from "./types";

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

export function CashFlowTrendCard({
  points,
}: {
  points: CashFlowPoint[];
}) {
  const max = Math.max(
    1,
    ...points.flatMap((p) => [p.cashIn, p.cashOut, Math.abs(p.netCash)])
  );

  return (
    <DashboardSectionCard
      title="Cash Flow Trend"
      subtitle="入金・出金・純キャッシュフロー"
      className="h-full"
    >
      <div className="space-y-4">
        {points.map((p) => {
          const inW = (p.cashIn / max) * 100;
          const outW = (p.cashOut / max) * 100;
          return (
            <div key={p.label} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">{p.label}</div>
                <div className="text-[12px] text-slate-500 tabular-nums">
                  Net {fmtJPY(p.netCash)}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
                    <span>Cash In</span>
                    <span className="tabular-nums">{fmtJPY(p.cashIn)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[color:var(--ls-primary)]"
                      style={{ width: `${inW}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-slate-500">
                    <span>Cash Out</span>
                    <span className="tabular-nums">{fmtJPY(p.cashOut)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-400"
                      style={{ width: `${outW}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
