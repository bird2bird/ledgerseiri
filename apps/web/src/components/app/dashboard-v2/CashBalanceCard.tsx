"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { AccountBalanceItem } from "./types";
import { getCashBalanceItemHref, getCashBalancesOverviewHref } from "./dashboard-linking";

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

function typeLabel(type: AccountBalanceItem["accountType"]) {
  switch (type) {
    case "bank":
      return "Bank";
    case "cash":
      return "Cash";
    case "platform":
      return "Platform";
    case "payment":
      return "Payment";
    default:
      return "Account";
  }
}

export function CashBalanceCard({
  totalCash,
  items,
}: {
  totalCash: number;
  items: AccountBalanceItem[];
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang;
  const overviewHref = getCashBalancesOverviewHref(lang);

  return (
    <DashboardSectionCard
      title="Cash Balances"
      subtitle="口座別の資金残高"
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
      <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4">
        <div className="text-[12px] font-medium text-slate-500">Total Cash</div>
        <div className="mt-2 text-[32px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
          {fmtJPY(totalCash)}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const href = getCashBalanceItemHref(lang);
          return (
            <Link
              key={item.accountId}
              href={href}
              className="block rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{item.accountName}</div>
                  <div className="mt-1 text-[12px] text-slate-500">
                    {typeLabel(item.accountType)} · {item.sharePct}%
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-slate-900 tabular-nums">
                    {fmtJPY(item.balance)}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500">{item.currency}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
