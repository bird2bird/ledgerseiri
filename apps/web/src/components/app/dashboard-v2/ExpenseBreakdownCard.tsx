"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { ExpenseBreakdownItem } from "./types";

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

export function ExpenseBreakdownCard({
  items,
}: {
  items: ExpenseBreakdownItem[];
}) {
  return (
    <DashboardSectionCard
      title="Expense Breakdown"
      subtitle="支出内訳"
      className="h-full"
    >
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.category} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-900">{it.category}</div>
              <div className="text-sm font-semibold text-slate-900">{it.pct}%</div>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[color:var(--ls-primary)]"
                style={{ width: `${Math.max(0, Math.min(100, it.pct))}%` }}
              />
            </div>

            <div className="mt-2 text-[12px] text-slate-500 tabular-nums">
              {fmtJPY(it.amount)}
            </div>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
