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
    <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#7C4DFF_0%,#8B5CF6_52%,#9F67FF_100%)] p-7 text-white shadow-[0_18px_40px_rgba(124,77,255,0.22)]">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div className="min-w-0">
          <div className="inline-flex rounded-full bg-white/16 px-3 py-1 text-[11px] font-medium text-white/90">
            Dashboard Overview
          </div>

          <div className="mt-5 text-[38px] font-semibold tracking-tight">
            こんにちは, {userName}
          </div>

          <div className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
            {subtitle}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              更新する
            </button>

            <div className="text-xs text-white/80">
              LedgerSeiri operating dashboard
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/18 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-[20px] bg-white/92 px-4 py-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">期間</div>
              <div className="mt-2">
                <select
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
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
            </div>

            <div className="rounded-[20px] bg-white/92 px-4 py-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">店舗</div>
              <div className="mt-2">
                <select
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
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
            </div>

            <button
              onClick={onRefresh}
              className={cls(
                "rounded-[20px] bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm transition",
                "hover:bg-slate-50"
              )}
            >
              更新
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
