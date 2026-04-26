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

type CashChartGranularity = "day" | "week" | "month";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatChartYen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function parseCashDate(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCashDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatCashDateLabel(key: string) {
  const date = parseCashDate(key);
  if (!date) return key;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function getCashWeekStart(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function getCashMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function getCashMonthLabel(date: Date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}`;
}

function getCashWeekKey(date: Date) {
  return formatCashDateKey(getCashWeekStart(date));
}

function getCashWeekLabel(date: Date) {
  const start = getCashWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getMonth() + 1}/${start.getDate()}–${end.getMonth() + 1}/${end.getDate()}`;
}

function buildCashNiceTicks(maxValue: number, segments = 4) {
  const safeMax = maxValue > 0 ? maxValue : 1;
  const roughStep = safeMax / segments;
  const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(roughStep))));
  const normalized = roughStep / magnitude;

  let stepBase = 1;
  if (normalized <= 1) stepBase = 1;
  else if (normalized <= 2) stepBase = 2;
  else if (normalized <= 5) stepBase = 5;
  else stepBase = 10;

  const step = stepBase * magnitude;
  const ceiling = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= ceiling; value += step) {
    ticks.push(value);
  }
  return ticks.length > 1 ? ticks : [0, ceiling || 1];
}

function buildCashBarSeries(points: { date: string; amount: number }[], granularity: CashChartGranularity) {
  const bucket = new Map<string, { label: string; amount: number; dateValue: number }>();

  points.forEach((point) => {
    const date = parseCashDate(point.date);
    if (!date) return;

    let key = "";
    let label = "";
    let dateValue = 0;

    if (granularity === "month") {
      key = getCashMonthKey(date);
      label = getCashMonthLabel(date);
      dateValue = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    } else if (granularity === "week") {
      key = getCashWeekKey(date);
      label = getCashWeekLabel(date);
      dateValue = getCashWeekStart(date).getTime();
    } else {
      key = formatCashDateKey(date);
      label = `${date.getMonth() + 1}/${date.getDate()}`;
      dateValue = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    const found = bucket.get(key);
    if (found) {
      found.amount += point.amount;
    } else {
      bucket.set(key, {
        label,
        amount: point.amount,
        dateValue,
      });
    }
  });

  return Array.from(bucket.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      amount: value.amount,
      dateValue: value.dateValue,
    }))
    .sort((a, b) => a.dateValue - b.dateValue);
}

function EmptyCashChartState(props: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-6 text-center">
      <div>
        <div className="text-sm font-semibold text-slate-800">{props.title}</div>
        <div className="mt-2 text-sm text-slate-500">{props.description}</div>
      </div>
    </div>
  );
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
  const [cashChartGranularity, setCashChartGranularity] = React.useState<CashChartGranularity>("week");
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

  const visible明細数Count = rows.length;
  const accountCount = React.useMemo(
    () => new Set(rows.map((row) => String(row.account || "-"))).size,
    [rows]
  );
  const avgAmount = visible明細数Count > 0 ? totalAmount / visible明細数Count : 0;
  const latestDate = rows[0]?.date || "-";

  const trendPoints = React.useMemo(
    () => makeTrendSeries(rows, headerRange, customStartDate, customEndDate),
    [rows, headerRange, customStartDate, customEndDate]
  );

  const trendValues = trendPoints.map((p) => p.amount);
  const trendPath = buildPath(trendValues, 360, 120);

  const cashTrendTicks = React.useMemo(
    () => buildCashNiceTicks(Math.max(...trendPoints.map((item) => item.amount), 0), 4),
    [trendPoints]
  );
  const cashTrendMax = cashTrendTicks[cashTrendTicks.length - 1] || 1;

  const cashBarPoints = React.useMemo(
    () => buildCashBarSeries(trendPoints, cashChartGranularity),
    [trendPoints, cashChartGranularity]
  );
  const safeCashBarPoints = cashBarPoints.length > 12 ? cashBarPoints.slice(-12) : cashBarPoints;
  const cashBarTicks = React.useMemo(
    () => buildCashNiceTicks(Math.max(...safeCashBarPoints.map((item) => item.amount), 0), 4),
    [safeCashBarPoints]
  );
  const cashBarMax = cashBarTicks[cashBarTicks.length - 1] || 1;

  const cashPeakTrend = trendPoints.reduce<{ date: string; amount: number } | null>((best, current) => {
    if (!best) return current;
    return current.amount > best.amount ? current : best;
  }, null);

  const cashPeakBar = safeCashBarPoints.reduce<{ label: string; amount: number } | null>((best, current) => {
    if (!best) return current;
    return current.amount > best.amount ? current : best;
  }, null);

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
            <div className="mb-2 text-sm font-medium text-slate-700">店舗選択</div>
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
            <div className="mb-2 text-sm font-medium text-slate-700">現在範囲</div>
            <select
              value={headerRange}
              onChange={(e) => {
                const next = e.target.value as CashHeaderRange;
                setHeaderRange(next);
                if (next !== "custom") updateRange(next);
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="7d">直近7日</option>
              <option value="30d">直近30日</option>
              <option value="90d">直近90日</option>
              <option value="12m">直近12か月</option>
              <option value="custom">カスタム期間</option>
            </select>
          </div>
        </div>

        {headerRange === "custom" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">開始日</div>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">終了日</div>
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
            <div className="text-sm text-slate-500">表示中の現金収入</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatIncomeJPY(totalAmount)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">明細数</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{visible明細数Count}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">口座数</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{accountCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">平均金額</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatIncomeJPY(avgAmount)}
            </div>
            <div className="mt-1 text-xs text-slate-500">最新日 {latestDate}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">入金趋势</div>
              <div className="mt-1 text-sm leading-6 text-slate-500">
                現在範囲に連動して、日付ごとの現金収入推移を表示します。横軸は発生日、縦軸は金額です。
              </div>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              現在範囲と連動
            </div>
          </div>

          <div className="mt-4">
            {trendPoints.length > 0 ? (
              <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-4">
                <svg
                  viewBox={`0 0 760 ${Math.max(280, 76 + Math.max(1, trendPoints.length - 1) * 34)}`}
                  className="min-w-[720px]"
                  role="img"
                  aria-label="現金収入の入金趋势"
                >
                  {(() => {
                    const width = 760;
                    const padding = { top: 18, right: 24, bottom: 44, left: 112 };
                    const innerWidth = width - padding.left - padding.right;
                    const innerHeight = Math.max(220, Math.max(1, trendPoints.length - 1) * 34);
                    const height = innerHeight + padding.top + padding.bottom;
                    const coords = trendPoints.map((point, index) => {
                      const x =
                        padding.left +
                        (trendPoints.length <= 1
                          ? innerWidth / 2
                          : (index / Math.max(1, trendPoints.length - 1)) * innerWidth);
                      const y =
                        padding.top +
                        innerHeight -
                        (point.amount / cashTrendMax) * innerHeight;
                      return { ...point, x, y };
                    });
                    const path = coords
                      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
                      .join(" ");

                    return (
                      <>
                        {cashTrendTicks.map((tick) => {
                          const y =
                            padding.top +
                            innerHeight -
                            (tick / cashTrendMax) * innerHeight;
                          return (
                            <g key={`cash-trend-tick-${tick}`}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + innerWidth}
                                y2={y}
                                stroke="#dbe3ee"
                                strokeWidth="1"
                              />
                              <text
                                x={padding.left - 12}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="12"
                                fill="#64748b"
                              >
                                {formatChartYen(tick)}
                              </text>
                            </g>
                          );
                        })}

                        {coords.map((point) => (
                          <g key={`cash-trend-row-${point.date}`}>
                            <line
                              x1={point.x}
                              y1={padding.top}
                              x2={point.x}
                              y2={padding.top + innerHeight}
                              stroke="#eef2f7"
                              strokeWidth="1"
                            />
                            <text
                              x={point.x}
                              y={height - 14}
                              textAnchor="middle"
                              fontSize="12"
                              fill="#475569"
                            >
                              {formatCashDateLabel(point.date)}
                            </text>
                          </g>
                        ))}

                        <line
                          x1={padding.left}
                          y1={padding.top + innerHeight}
                          x2={padding.left + innerWidth}
                          y2={padding.top + innerHeight}
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + innerHeight}
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />

                        {path ? (
                          <path
                            d={path}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : null}

                        {coords.map((point) => (
                          <g key={`cash-trend-point-${point.date}`}>
                            <circle cx={point.x} cy={point.y} r="4.5" fill="#2563eb" />
                            <text
                              x={Math.min(point.x + 8, padding.left + innerWidth - 4)}
                              y={point.y - 10}
                              fontSize="11"
                              fill="#0f172a"
                            >
                              {formatChartYen(point.amount)}
                            </text>
                          </g>
                        ))}

                        <text
                          x={padding.left + innerWidth / 2}
                          y={height - 2}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#64748b"
                        >
                          発生日
                        </text>
                        <text
                          x={20}
                          y={padding.top + innerHeight / 2}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#64748b"
                          transform={`rotate(-90 20 ${padding.top + innerHeight / 2})`}
                        >
                          金額
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <EmptyCashChartState
                title="表示できる入金データがありません"
                description="店舗 / 期間条件に該当する現金収入があると、ここに推移チャートを表示します。"
              />
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Points</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{trendPoints.length}</div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Peak Date</div>
              <div className="mt-2 text-base font-semibold text-slate-950">
                {cashPeakTrend ? formatCashDateLabel(cashPeakTrend.date) : "-"}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Peak Amount</div>
              <div className="mt-2 text-base font-semibold text-slate-950">
                {cashPeakTrend ? formatChartYen(cashPeakTrend.amount) : "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">入金状況</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                  現在範囲に連動しながら、日別 / 週別 / 月別の入金合計を柱状グラフで確認できます。
                </div>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                {[
                  { key: "day", label: "日別" },
                  { key: "week", label: "週別" },
                  { key: "month", label: "月別" },
                ].map((item) => {
                  const active = cashChartGranularity === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCashChartGranularity(item.key as CashChartGranularity)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {safeCashBarPoints.length > 0 ? (
              <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-4">
                <svg
                  viewBox="0 0 420 300"
                  className="min-w-[400px]"
                  role="img"
                  aria-label="現金収入の入金状況"
                >
                  {cashBarTicks.map((tick) => {
                    const padding = { top: 16, right: 16, bottom: 46, left: 58 };
                    const innerWidth = 420 - padding.left - padding.right;
                    const innerHeight = 300 - padding.top - padding.bottom;
                    const y = padding.top + innerHeight - (tick / cashBarMax) * innerHeight;
                    return (
                      <g key={`cash-bar-tick-${tick}`}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + innerWidth}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {formatChartYen(tick)}
                        </text>
                      </g>
                    );
                  })}

                  {(() => {
                    const padding = { top: 16, right: 16, bottom: 46, left: 58 };
                    const innerWidth = 420 - padding.left - padding.right;
                    const innerHeight = 300 - padding.top - padding.bottom;
                    const columnWidth = safeCashBarPoints.length
                      ? Math.max(18, Math.min(42, innerWidth / safeCashBarPoints.length - 8))
                      : 28;
                    const gap = safeCashBarPoints.length
                      ? Math.max(8, (innerWidth - safeCashBarPoints.length * columnWidth) / Math.max(1, safeCashBarPoints.length))
                      : 12;

                    return (
                      <>
                        <line
                          x1={padding.left}
                          y1={padding.top + innerHeight}
                          x2={padding.left + innerWidth}
                          y2={padding.top + innerHeight}
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + innerHeight}
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />

                        {safeCashBarPoints.map((point, index) => {
                          const x = padding.left + gap / 2 + index * (columnWidth + gap);
                          const h = (point.amount / cashBarMax) * innerHeight;
                          const y = padding.top + innerHeight - h;

                          return (
                            <g key={`cash-bar-${point.key}`}>
                              <rect
                                x={x}
                                y={y}
                                width={columnWidth}
                                height={Math.max(h, 2)}
                                rx="6"
                                fill={index === safeCashBarPoints.length - 1 ? "#2563eb" : "#0f172a"}
                                opacity={index === safeCashBarPoints.length - 1 ? 0.95 : 0.82}
                              />
                              <text
                                x={x + columnWidth / 2}
                                y={padding.top + innerHeight + 17}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#475569"
                              >
                                {point.label}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <EmptyCashChartState
                title="表示できる集計データがありません"
                description="現金収入があると、ここに期間別の入金状況を表示します。"
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Current Granularity</div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {cashChartGranularity === "day" ? "日別" : cashChartGranularity === "week" ? "週別" : "月別"}
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Peak Bucket</div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {cashPeakBar ? `${cashPeakBar.label} / ${formatChartYen(cashPeakBar.amount)}` : "-"}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Filter Context</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {storeId === "all" ? "全店舗" : storeId} / {headerRange === "custom" ? `${customStartDate || "-"} → ${customEndDate || "-"}` : headerRange}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
