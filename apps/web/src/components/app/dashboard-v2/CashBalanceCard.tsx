"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { AccountBalanceItem } from "./types";

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

function accountBadge(type: AccountBalanceItem["accountType"]) {
  switch (type) {
    case "bank":
      return "銀行";
    case "cash":
      return "現金";
    case "platform":
      return "平台";
    case "payment":
      return "決済";
    default:
      return type;
  }
}

export function CashBalanceCard({
  totalCash,
  items,
}: {
  totalCash: number;
  items: AccountBalanceItem[];
}) {
  return (
    <DashboardSectionCard
      title="Cash Balance by Account"
      subtitle="口座別資金残高"
      className="h-full"
    >
      <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
        <div className="text-[12px] text-slate-500">総資金</div>
        <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-900 tabular-nums">
          {fmtJPY(totalCash)}
        </div>

        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-200">
          {items.map((it) => (
            <div
              key={it.accountId}
              className="h-3 bg-[color:var(--ls-primary)] odd:opacity-90 even:opacity-70"
              style={{ width: `${it.sharePct}%` }}
              title={`${it.accountName}: ${it.sharePct}%`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div
            key={it.accountId}
            className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-medium text-slate-900">
                  {it.accountName}
                </div>
                <span className="ls-badge px-2 py-0.5 text-[11px] text-slate-600">
                  {accountBadge(it.accountType)}
                </span>
              </div>
              <div className="mt-1 text-[12px] text-slate-500">
                Share {it.sharePct}%
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold text-slate-900 tabular-nums">
                {fmtJPY(it.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
