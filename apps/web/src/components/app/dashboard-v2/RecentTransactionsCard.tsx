"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { RecentTransactionItem } from "./types";
import {
  getRecentTransactionItemHref,
  getRecentTransactionsOverviewHref,
} from "./dashboard-linking";

function fmtJPY(n: number) {
  try {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
      signDisplay: "always",
    }).format(n);
  } catch {
    return `${n >= 0 ? "+" : "-"}¥${Math.abs(Math.round(n))}`;
  }
}

export function RecentTransactionsCard({
  items,
}: {
  items: RecentTransactionItem[];
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang;
  const overviewHref = getRecentTransactionsOverviewHref(lang);

  return (
    <DashboardSectionCard
      title="Recent Transactions"
      subtitle="最近の収支記録"
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
          const href = item.href ?? getRecentTransactionItemHref(item, lang);

          return (
            <Link
              key={item.id}
              href={href}
              className="block rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-slate-900">{item.category}</span>
                    <span className="text-[12px] text-slate-500">{item.type}</span>
                    <span className="text-[12px] text-slate-400">·</span>
                    <span className="text-[12px] text-slate-500">{item.date}</span>
                  </div>

                  <div className="mt-1 text-[12px] leading-5 text-slate-500">
                    {item.account} / {item.store}
                    {item.memo ? ` / ${item.memo}` : ""}
                  </div>
                </div>

                <div
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    item.amount < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {fmtJPY(item.amount)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
