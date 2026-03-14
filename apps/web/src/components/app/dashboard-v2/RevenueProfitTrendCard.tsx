"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { RevenueProfitPoint } from "./types";
import { getRevenueProfitTrendOverviewHref } from "./dashboard-linking";

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

export function RevenueProfitTrendCard({
  points,
  rangeLabel,
}: {
  points: RevenueProfitPoint[];
  rangeLabel?: string;
}) {
  const params = useParams<{ lang: string }>();
  const href = getRevenueProfitTrendOverviewHref(params?.lang);

  const maxValue = Math.max(
    1,
    ...points.flatMap((p) => [Math.max(0, p.revenue), Math.max(0, p.profit)])
  );

  return (
    <DashboardSectionCard
      title="Revenue & Profit Trend"
      subtitle={rangeLabel ? `期間: ${rangeLabel}` : "収益推移"}
      action={
        <Link
          href={href}
          className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium"
        >
          すべて見る
        </Link>
      }
      className="h-full"
    >
      <Link
        href={href}
        className="block rounded-2xl transition hover:bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-3">
            {points.map((p) => {
              const revenueH = Math.max(6, Math.round((p.revenue / maxValue) * 160));
              const profitH = Math.max(4, Math.round((Math.max(0, p.profit) / maxValue) * 160));

              return (
                <div key={p.label} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-44 items-end gap-1">
                    <div
                      className="w-3 rounded-t-md bg-slate-300"
                      style={{ height: `${revenueH}px` }}
                      title={`Revenue ${fmtJPY(p.revenue)}`}
                    />
                    <div
                      className="w-3 rounded-t-md bg-slate-900"
                      style={{ height: `${profitH}px` }}
                      title={`Profit ${fmtJPY(p.profit)}`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{p.label}</div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900" />
              Profit
            </span>
          </div>
        </div>
      </Link>
    </DashboardSectionCard>
  );
}
