"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { ExpenseBreakdownItem } from "./types";
import {
  getExpenseBreakdownItemHref,
  getExpenseBreakdownOverviewHref,
} from "./dashboard-linking";

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
  const params = useParams<{ lang: string }>();
  const lang = params?.lang;
  const overviewHref = getExpenseBreakdownOverviewHref(lang);

  return (
    <DashboardSectionCard
      title="Expense Breakdown"
      subtitle="費用構成"
      action={
        <Link
          href={overviewHref}
          className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium"
        >
          すべて見る
        </Link>
      }
      className="h-full"
    >
      <div className="space-y-3">
        {items.map((item) => {
          const href = getExpenseBreakdownItemHref(item.category, lang);

          return (
            <Link
              key={item.category}
              href={href}
              className="block rounded-2xl border border-black/5 bg-white p-3 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {item.category}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500">
                    構成比 {item.pct}%
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-slate-900">
                    {fmtJPY(item.amount)}
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900/80"
                  style={{ width: `${Math.max(0, Math.min(100, item.pct))}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
