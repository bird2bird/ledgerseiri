"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { RecentTransactionItem } from "./types";

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

export function RecentTransactionsCard({
  items,
}: {
  items: RecentTransactionItem[];
}) {
  return (
    <DashboardSectionCard
      title="Recent Transactions"
      subtitle="最新の取引"
      action={
        <button className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium">
          すべて見る
        </button>
      }
      className="h-full"
      bodyClassName="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="px-3 py-3 font-medium">日付</th>
              <th className="px-3 py-3 font-medium">種類</th>
              <th className="px-3 py-3 font-medium">区分</th>
              <th className="px-3 py-3 font-medium text-right">金額</th>
              <th className="px-3 py-3 font-medium">口座</th>
              <th className="px-3 py-3 font-medium">店舗</th>
              <th className="px-3 py-3 font-medium">メモ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-3 py-3 text-slate-700">{it.date}</td>
                <td className="px-3 py-3 text-slate-700">{it.type}</td>
                <td className="px-3 py-3 text-slate-700">{it.category}</td>
                <td className={`px-3 py-3 text-right font-semibold tabular-nums ${it.amount < 0 ? "text-rose-600" : "text-slate-900"}`}>
                  {fmtJPY(it.amount)}
                </td>
                <td className="px-3 py-3 text-slate-700">{it.account}</td>
                <td className="px-3 py-3 text-slate-700">{it.store}</td>
                <td className="px-3 py-3 text-slate-500">{it.memo || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSectionCard>
  );
}
