"use client";

import Link from "next/link";
import React from "react";
import type { ReportPageVm, ReportRange } from "@/core/reports/types";

const RANGE_ITEMS: Array<{ key: ReportRange; label: string }> = [
  { key: "thisMonth", label: "今月" },
  { key: "lastMonth", label: "先月" },
  { key: "thisYear", label: "今年" },
  { key: "custom", label: "カスタム" },
];

function summaryToneClass(tone: ReportPageVm["summaryCards"][number]["tone"]) {
  switch (tone) {
    case "profit":
      return "bg-emerald-50 border-emerald-200 text-emerald-800";
    case "warning":
      return "bg-amber-50 border-amber-200 text-amber-800";
    case "danger":
      return "bg-rose-50 border-rose-200 text-rose-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
    default:
      return "bg-slate-50 border-slate-200 text-slate-800";
  }
}

export function ReportPageShared(props: {
  vm: ReportPageVm;
  onRangeChange: (next: ReportRange) => void;
  onStoreChange: (next: string) => void;
}) {
  const { vm, onRangeChange, onStoreChange } = props;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">{vm.title}</div>
            <div className="mt-2 text-sm text-slate-500">{vm.description}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={vm.exportHref}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {RANGE_ITEMS.map((item) => {
            const active = vm.range === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onRangeChange(item.key)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-medium text-slate-700">Store</div>
          <select
            value={vm.storeId}
            onChange={(e) => onStoreChange(e.target.value)}
            className="h-11 rounded-[14px] border border-black/8 bg-white px-3 text-sm text-slate-700"
          >
            {vm.stores.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {vm.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {vm.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {vm.summaryCards.map((item) => (
          <div
            key={item.key}
            className={`rounded-3xl border p-5 shadow-sm ${summaryToneClass(item.tone)}`}
          >
            <div className="text-sm opacity-80">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold">{item.value}</div>
            {item.subValue ? <div className="mt-2 text-xs opacity-80">{item.subValue}</div> : null}
              {item.detailHref ? (
                <div className="mt-4">
                  <Link
                    href={item.detailHref}
                    className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    明細を見る
                  </Link>
                </div>
              ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Breakdown</div>
          <div className="mt-4 space-y-3">
            {vm.loading ? (
              <div className="text-sm text-slate-500">loading...</div>
            ) : vm.breakdownItems.length === 0 ? (
              <div className="text-sm text-slate-500">no breakdown</div>
            ) : (
              vm.breakdownItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-sm font-semibold text-slate-900">{item.amount}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Trend</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div
              className="grid gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
              style={{ gridTemplateColumns: `repeat(${vm.trendColumns.length}, minmax(0, 1fr))` }}
            >
              {vm.trendColumns.map((col) => (
                <div key={col.key} className={col.align === "right" ? "text-right" : ""}>
                  {col.label}
                </div>
              ))}
            </div>

            {vm.loading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : vm.trendRows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
            ) : (
              vm.trendRows.map((row) => (
                <div
                  key={row.key}
                  className="grid gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                  style={{ gridTemplateColumns: `repeat(${vm.trendColumns.length}, minmax(0, 1fr))` }}
                >
                  {vm.trendColumns.map((col) => (
                    <div
                      key={col.key}
                      className={`${col.align === "right" ? "text-right" : ""} text-slate-700`}
                    >
                      {row.values[col.key] ?? "-"}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPageShared;
