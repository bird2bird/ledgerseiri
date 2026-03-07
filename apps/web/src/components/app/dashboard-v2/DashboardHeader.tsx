"use client";

import React from "react";
import type { DashboardRange } from "./types";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type StoreOption = {
  id: string;
  name: string;
};

type DashboardHeaderProps = {
  userName: string;
  subtitle: string;
  range: DashboardRange;
  storeId: string;
  storeOptions: StoreOption[];
  onChangeRange: (range: DashboardRange) => void;
  onChangeStore: (storeId: string) => void;
  onRefresh: () => void;
};

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "thisMonth", label: "今月" },
  { value: "lastMonth", label: "先月" },
  { value: "thisYear", label: "今年" },
  { value: "custom", label: "カスタム" },
];

export function DashboardHeader({
  userName,
  subtitle,
  range,
  storeId,
  storeOptions,
  onChangeRange,
  onChangeStore,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <section className="ls-card-solid p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="text-[26px] font-semibold tracking-tight text-slate-900">
            こんにちは, {userName}
          </div>
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:items-center xl:justify-end">
          <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
            <span className="text-[12px] font-medium text-slate-500">期間</span>
            <select
              className="bg-transparent text-sm text-slate-900 outline-none"
              value={range}
              onChange={(e) => onChangeRange(e.target.value as DashboardRange)}
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
            <span className="text-[12px] font-medium text-slate-500">店舗</span>
            <select
              className="bg-transparent text-sm text-slate-900 outline-none"
              value={storeId}
              onChange={(e) => onChangeStore(e.target.value)}
            >
              {storeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className={cls(
              "ls-btn",
              "ls-btn-ghost",
              "px-4 py-2 text-sm font-semibold"
            )}
          >
            更新
          </button>
        </div>
      </div>
    </section>
  );
}
