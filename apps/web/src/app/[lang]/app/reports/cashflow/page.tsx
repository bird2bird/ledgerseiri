"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCashflowReport, type CashflowReportResponse } from "@/core/reports/cashflow-api";

function fmtJPY(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

const RANGE_ITEMS = [
  { key: "thisMonth", label: "今月" },
  { key: "lastMonth", label: "先月" },
  { key: "thisYear", label: "今年" },
] as const;

export default function CashflowReportPage() {
  const [range, setRange] = useState<"thisMonth" | "lastMonth" | "thisYear">("thisMonth");
  const [data, setData] = useState<CashflowReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReport(nextRange: "thisMonth" | "lastMonth" | "thisYear") {
    setLoading(true);
    setError("");
    try {
      const res = await getCashflowReport(nextRange);
      setData(res);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport(range);
  }, [range]);

  const summary = data?.summary;
  const trend = data?.trend ?? [];
  const breakdown = data?.breakdown ?? [];
  const periodLabel = data?.filters?.label ?? "-";

  const trendRowsCount = useMemo(() => trend.length, [trend]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">キャッシュフローレポート</div>
            <div className="mt-2 text-sm text-slate-500">
              収入・支出・資金移動を集計し、期間ごとのキャッシュフローを確認します。
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_ITEMS.map((item) => {
              const active = range === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRange(item.key)}
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
        </div>

        <div className="mt-4 text-sm text-slate-500">対象期間: {periodLabel}</div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-black/5 bg-white p-6 text-sm text-slate-500 shadow-sm">
          loading...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Cash In</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-700">
                + {fmtJPY(summary?.cashIn ?? 0)}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Cash Out</div>
              <div className="mt-2 text-2xl font-semibold text-rose-700">
                - {fmtJPY(summary?.cashOut ?? 0)}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Net Cash</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {fmtJPY(summary?.netCash ?? 0)}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Inbound Transfers</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-700">
                + {fmtJPY(summary?.inboundTransfers ?? 0)}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Outbound Transfers</div>
              <div className="mt-2 text-2xl font-semibold text-rose-700">
                - {fmtJPY(summary?.outboundTransfers ?? 0)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Trend</div>
                  <div className="mt-1 text-sm text-slate-500">daily cashflow baseline</div>
                </div>
                <div className="text-sm text-slate-500">Rows: {trendRowsCount}</div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <div>Date</div>
                  <div className="text-right">Cash In</div>
                  <div className="text-right">Cash Out</div>
                  <div className="text-right">Net</div>
                </div>

                {trend.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-500">no trend rows</div>
                ) : (
                  trend.map((row) => (
                    <div
                      key={row.date}
                      className="grid grid-cols-[120px_1fr_1fr_1fr] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                    >
                      <div className="text-slate-600">{row.date}</div>
                      <div className="text-right text-emerald-700">{fmtJPY(row.cashIn)}</div>
                      <div className="text-right text-rose-700">{fmtJPY(row.cashOut)}</div>
                      <div className="text-right font-medium text-slate-900">{fmtJPY(row.netCash)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <div>
                <div className="text-lg font-semibold text-slate-900">Breakdown</div>
                <div className="mt-1 text-sm text-slate-500">cashflow composition</div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <div>Category</div>
                  <div className="text-right">Amount</div>
                </div>

                {breakdown.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-500">no breakdown rows</div>
                ) : (
                  breakdown.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[1fr_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                    >
                      <div className="text-slate-700">{row.label}</div>
                      <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
