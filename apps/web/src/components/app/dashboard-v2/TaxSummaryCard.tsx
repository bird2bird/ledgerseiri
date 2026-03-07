"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { TaxSummaryData } from "./types";

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

function TaxLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <div className="text-sm text-slate-600">{label}</div>
      <div className={strong ? "text-sm font-semibold text-slate-900 tabular-nums" : "text-sm text-slate-900 tabular-nums"}>
        {value}
      </div>
    </div>
  );
}

export function TaxSummaryCard({
  data,
}: {
  data: TaxSummaryData;
}) {
  return (
    <DashboardSectionCard
      title="Tax Summary"
      subtitle={data.periodLabel}
      action={
        <span className="ls-badge px-2.5 py-1 text-[11px] font-medium text-slate-700">
          {data.note}
        </span>
      }
      className="h-full"
    >
      <div className="space-y-3">
        <TaxLine label="売上消費税" value={fmtJPY(data.outputTax)} />
        <TaxLine label="仕入消費税" value={fmtJPY(data.inputTax)} />
        <TaxLine label="差額（概算）" value={fmtJPY(data.estimatedTaxPayable)} strong />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
        参考値です。正式な申告前に税理士または会計データで確認してください。
      </div>
    </DashboardSectionCard>
  );
}
