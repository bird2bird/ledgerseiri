"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { CashFlowPoint } from "./types";
import { getCashFlowTrendOverviewHref } from "./dashboard-linking";

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
  const params = useParams<{ lang: string }>();
  const href = getCashFlowTrendOverviewHref(params?.lang);

  const maxValue = Math.max(
    1,
    ...points.flatMap((p) => [Math.max(0, p.cashIn), Math.max(0, p.cashOut)])
  );

  return (
    <DashboardSectionCard
      title="Cash Flow Trend"
      subtitle="入出金推移"
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
          <div className="grid grid-cols-6 gap-3">
            {points.map((p) => {
              const inH = Math.max(6, Math.round((p.cashIn / maxValue) * 160));
              const outH = Math.max(6, Math.round((p.cashOut / maxValue) * 160));

              return (
                <div key={p.label} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-44 items-end gap-1">
                    <div
                      className="w-3 rounded-t-md bg-slate-900"
                      style={{ height: `${inH}px` }}
                      title={`Cash In ${fmtJPY(p.cashIn)}`}
                    />
                    <div
                      className="w-3 rounded-t-md bg-slate-300"
                      style={{ height: `${outH}px` }}
                      title={`Cash Out ${fmtJPY(p.cashOut)}`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{p.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {points.slice(-3).map((p) => (
              <div
                key={`${p.label}-summary`}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[12px]"
              >
                <span className="text-slate-500">{p.label}</span>
                <span className="font-medium tabular-nums text-slate-900">
                  Net {fmtJPY(p.netCash)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </DashboardSectionCard>
  );
}
