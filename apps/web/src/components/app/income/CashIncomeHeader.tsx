"use client";

import React from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";

type CashHeaderRange = "7d" | "30d" | "90d" | "12m" | "custom";

function toDateInputValue(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseRowDate(row: IncomeRow) {
  const raw = String((row as any).sortAt || (row as any).importedAt || row.date || "");
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function makeTrendSeries(rows: IncomeRow[], range: CashHeaderRange, startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(now);

  if (range === "7d") start.setDate(now.getDate() - 6);
  if (range === "30d") start.setDate(now.getDate() - 29);
  if (range === "90d") start.setDate(now.getDate() - 89);
  if (range === "12m") start.setMonth(now.getMonth() - 11, 1);

  let startMs = start.getTime();
  let endMs = now.getTime();

  if (range === "custom") {
    startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
    endMs = endDate ? new Date(`${endDate}T23:59:59`).getTime() : now.getTime();
  }

  const filtered = rows.filter((row) => {
    const ts = parseRowDate(row);
    if (!ts) return false;
    if (startMs && ts < startMs) return false;
    if (endMs && ts > endMs) return false;
    return true;
  });

  const buckets = new Map<string, number>();
  for (const row of filtered) {
    const raw = String(row.date || "");
    const key = raw.includes("T") ? raw.slice(0, 10) : raw.slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + Number(row.amount || 0));
  }

  const points = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([date, amount]) => ({ date, amount }));

  return points;
}

function buildPath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  return values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i * width) / (values.length - 1);
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function CashIncomeHeader(props: {
  lang: string;
  isDashboard: boolean;
  storeId: string;
  range: string;
  rows: IncomeRow[];
  totalAmount: number;
  updateStoreId: (next: string) => void;
  updateRange: (next: string) => void;
}) {
  const { lang, isDashboard, storeId, range, rows, totalAmount, updateStoreId, updateRange } = props;

  const [headerRange, setHeaderRange] = React.useState<CashHeaderRange>(
    range === "7d" || range === "30d" || range === "90d" || range === "12m" ? range : "30d"
  );
  const [customStartDate, setCustomStartDate] = React.useState(toDateInputValue(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [customEndDate, setCustomEndDate] = React.useState(toDateInputValue(new Date()));

  React.useEffect(() => {
    if (headerRange !== "custom") {
      setHeaderRange(
        range === "7d" || range === "30d" || range === "90d" || range === "12m" ? range : "30d"
      );
    }
  }, [range, headerRange]);

  const storeOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => String(row.store || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const visibleRowsCount = rows.length;
  const accountCount = React.useMemo(
    () => new Set(rows.map((row) => String(row.account || "-"))).size,
    [rows]
  );
  const avgAmount = visibleRowsCount > 0 ? totalAmount / visibleRowsCount : 0;
  const latestDate = rows[0]?.date || "-";

  const trendPoints = React.useMemo(
    () => makeTrendSeries(rows, headerRange, customStartDate, customEndDate),
    [rows, headerRange, customStartDate, customEndDate]
  );

  const trendValues = trendPoints.map((p) => p.amount);
  const trendPath = buildPath(trendValues, 360, 120);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">現金収入</div>
            <div className="mt-2 text-sm text-slate-500">
              現金入金データの確認、店舗別の絞り込み、期間管理を一つの画面で行います。
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/app/income`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              収入 root に戻る
            </Link>
            {isDashboard ? (
              <Link
                href={`/${lang}/app`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard に戻る
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">店舗选择</div>
            <select
              value={storeId}
              onChange={(e) => updateStoreId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="all">全店舗</option>
              {storeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">当前范围</div>
            <select
              value={headerRange}
              onChange={(e) => {
                const next = e.target.value as CashHeaderRange;
                setHeaderRange(next);
                if (next !== "custom") updateRange(next);
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
              <option value="12m">近12个月</option>
              <option value="custom">自定义日期</option>
            </select>
          </div>
        </div>

        {headerRange === "custom" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">开始日期</div>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">结束日期</div>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Visible Cash Income</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatIncomeJPY(totalAmount)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Rows</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{visibleRowsCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Accounts</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{accountCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Average</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatIncomeJPY(avgAmount)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Latest {latestDate}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="text-lg font-semibold text-slate-900">入金趋势</div>
            <div className="mt-1 text-sm text-slate-500">
              直近の現金入金推移を簡潔に確認できます。
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {trendPoints.length > 1 ? (
                <div>
                  <svg viewBox="0 0 360 120" className="h-[120px] w-full">
                    <path d={trendPath} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
                  </svg>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    {trendPoints.slice(-3).map((point) => (
                      <div key={point.date} className="rounded-xl bg-white px-3 py-2">
                        <div>{point.date}</div>
                        <div className="mt-1 font-medium text-slate-900">
                          {formatIncomeJPY(point.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[160px] items-center justify-center text-sm text-slate-500">
                  表示可能なトレンドデータがまだありません。
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-slate-900">入金状况</div>
            <div className="mt-1 text-sm text-slate-500">
              店舗と期間を切り替えながら現金収入の概況を確認できます。
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">当前店铺</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {storeId === "all" ? "全店舗" : storeId}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">当前范围</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {headerRange === "custom" ? `${customStartDate || "-"} → ${customEndDate || "-"}` : headerRange}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">当前状态</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  明細確認・登録・編集の基線UIを適用済み
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
