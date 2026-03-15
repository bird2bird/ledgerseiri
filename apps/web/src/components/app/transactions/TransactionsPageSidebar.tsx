"use client";

import React from "react";
import Link from "next/link";

export type TransactionsSidebarActionItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export function TransactionsPageSidebar(props: {
  metricLabel: string;
  metricValue: string;
  rowsCount: number;
  rowCountLabel?: string;
  actionsTitle?: string;
  actionItems: TransactionsSidebarActionItem[];
}) {
  const {
    metricLabel,
    metricValue,
    rowsCount,
    rowCountLabel = "Rows",
    actionsTitle = "Page Actions",
    actionItems,
  } = props;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">{metricLabel}</div>
        <div className="mt-2 text-3xl font-semibold text-slate-900">{metricValue}</div>
        <div className="mt-4 text-sm text-slate-500">{rowCountLabel}</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">{rowsCount}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">{actionsTitle}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {actionItems.map((item) => {
            const className = item.disabled
              ? "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-400 cursor-not-allowed"
              : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50";

            if (item.href && !item.disabled) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TransactionsPageSidebar;
