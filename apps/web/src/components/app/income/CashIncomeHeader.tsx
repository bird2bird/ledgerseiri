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

function resolveCashRangeWindow(range: CashHeaderRange, startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(now);

  if (range === "7d") start.setDate(now.getDate() - 6);
  if (range === "30d") start.setDate(now.getDate() - 29);
  if (range === "90d") start.setDate(now.getDate() - 89);
  if (range === "12m") start.setMonth(now.getMonth() - 11, 1);

  start.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  let startDateObj = start;
  let endDateObj = now;

  if (range === "custom") {
    const customStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const customEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

    startDateObj =
      customStart && !Number.isNaN(customStart.getTime())
        ? customStart
        : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

    endDateObj = customEnd && !Number.isNaN(customEnd.getTime()) ? customEnd : now;

    if (startDateObj.getTime() > endDateObj.getTime()) {
      const tmp = startDateObj;
      startDateObj = endDateObj;
      endDateObj = tmp;
    }
  }

  startDateObj.setHours(0, 0, 0, 0);
  endDateObj.setHours(23, 59, 59, 999);

  return { startDateObj, endDateObj };
}

function getCashRangeDays(startDateObj: Date, endDateObj: Date) {
  const start = new Date(startDateObj);
  const end = new Date(endDateObj);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
}

function resolveCashTrendAggregation(
  range: CashHeaderRange,
  startDateObj: Date,
  endDateObj: Date
): CashChartGranularity {
  if (range === "7d" || range === "30d") return "day";
  if (range === "90d" || range === "12m") return "week";

  const days = getCashRangeDays(startDateObj, endDateObj);
  if (days <= 31) return "day";
  if (days <= 366) return "week";
  return "month";
}

function resolveCashBarGranularity(
  range: CashHeaderRange,
  startDateObj: Date,
  endDateObj: Date
): CashChartGranularity {
  if (range === "7d" || range === "30d") return "day";
  if (range === "90d") return "week";
  if (range === "12m") return "month";

  const days = getCashRangeDays(startDateObj, endDateObj);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

function getCashAggregationLabel(granularity: CashChartGranularity) {
  if (granularity === "day") return "日別";
  if (granularity === "week") return "週別";
  return "月別";
}

function getCashBucketMeta(date: Date, granularity: CashChartGranularity) {
  if (granularity === "month") {
    return {
      key: getCashMonthKey(date),
      label: getCashMonthLabel(date),
      dateValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
    };
  }

  if (granularity === "week") {
    return {
      key: getCashWeekKey(date),
      label: getCashWeekLabel(date),
      dateValue: getCashWeekStart(date).getTime(),
    };
  }

  return {
    key: formatCashDateKey(date),
    label: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
    dateValue: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
  };
}

function getCashSeriesCursorStart(date: Date, granularity: CashChartGranularity) {
  const cursor = new Date(date);
  cursor.setHours(0, 0, 0, 0);

  if (granularity === "week") return getCashWeekStart(cursor);
  if (granularity === "month") return new Date(cursor.getFullYear(), cursor.getMonth(), 1);

  return cursor;
}

function stepCashSeriesCursor(cursor: Date, granularity: CashChartGranularity) {
  if (granularity === "month") {
    cursor.setMonth(cursor.getMonth() + 1, 1);
    return;
  }

  if (granularity === "week") {
    cursor.setDate(cursor.getDate() + 7);
    return;
  }

  cursor.setDate(cursor.getDate() + 1);
}

function buildCashRangeSeries(
  rows: IncomeRow[],
  range: CashHeaderRange,
  startDate: string,
  endDate: string,
  granularity: CashChartGranularity
) {
  const { startDateObj, endDateObj } = resolveCashRangeWindow(range, startDate, endDate);
  const startMs = startDateObj.getTime();
  const endMs = endDateObj.getTime();

  const buckets = new Map<string, { amount: number; label: string; dateValue: number }>();

  for (const row of rows) {
    const ts = parseRowDate(row);
    if (!ts) continue;
    if (ts < startMs) continue;
    if (ts > endMs) continue;

    const date = new Date(ts);
    const meta = getCashBucketMeta(date, granularity);
    const found = buckets.get(meta.key);

    if (found) {
      found.amount += Number(row.amount || 0);
    } else {
      buckets.set(meta.key, {
        amount: Number(row.amount || 0),
        label: meta.label,
        dateValue: meta.dateValue,
      });
    }
  }

  const points: { date: string; amount: number; label: string; dateValue: number }[] = [];
  const cursor = getCashSeriesCursorStart(startDateObj, granularity);
  const endCursor = getCashSeriesCursorStart(endDateObj, granularity);

  let guard = 0;
  const maxGuard = granularity === "day" ? 1500 : granularity === "week" ? 260 : 120;

  while (cursor.getTime() <= endCursor.getTime() && guard < maxGuard) {
    const meta = getCashBucketMeta(cursor, granularity);
    const found = buckets.get(meta.key);

    points.push({
      date: meta.key,
      amount: found?.amount || 0,
      label: meta.label,
      dateValue: meta.dateValue,
    });

    stepCashSeriesCursor(cursor, granularity);
    guard += 1;
  }

  return points;
}

function makeTrendSeries(rows: IncomeRow[], range: CashHeaderRange, startDate: string, endDate: string) {
  const { startDateObj, endDateObj } = resolveCashRangeWindow(range, startDate, endDate);

  return buildCashRangeSeries(
    rows,
    range,
    startDate,
    endDate,
    resolveCashTrendAggregation(range, startDateObj, endDateObj)
  );
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

  const slashNormalized = raw.replace(/\//g, "-");
  const directDate = new Date(slashNormalized);
  if (!Number.isNaN(directDate.getTime())) return directDate;

  const normalized = slashNormalized.includes("T")
    ? slashNormalized
    : `${slashNormalized}T00:00:00`;
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

function getCashPointDisplayLabel(point: { date: string; label?: string }): string {
  return point.label || formatCashDateLabel(point.date);
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

// cash-chart-range-aware-productization-l4a-v3
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
  const [customStartDate, setCustomStartDate] = React.useState(
    toDateInputValue(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
  );
  const [customEndDate, setCustomEndDate] = React.useState(toDateInputValue(new Date()));

  const cashRangeWindow = React.useMemo(
    () => resolveCashRangeWindow(headerRange, customStartDate, customEndDate),
    [headerRange, customStartDate, customEndDate]
  );

  const defaultCashBarGranularity = React.useMemo(
    () => resolveCashBarGranularity(headerRange, cashRangeWindow.startDateObj, cashRangeWindow.endDateObj),
    [headerRange, cashRangeWindow.startDateObj, cashRangeWindow.endDateObj]
  );

  const [cashChartGranularity, setCashChartGranularity] =
    React.useState<CashChartGranularity>(defaultCashBarGranularity);

  React.useEffect(() => {
    setCashChartGranularity(defaultCashBarGranularity);
  }, [defaultCashBarGranularity]);

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

  const cashTrendAggregation = React.useMemo(
    () => resolveCashTrendAggregation(headerRange, cashRangeWindow.startDateObj, cashRangeWindow.endDateObj),
    [headerRange, cashRangeWindow.startDateObj, cashRangeWindow.endDateObj]
  );
  const cashTrendAggregationLabel = getCashAggregationLabel(cashTrendAggregation);

  const trendPoints = React.useMemo(
    () => buildCashRangeSeries(rows, headerRange, customStartDate, customEndDate, cashTrendAggregation),
    [rows, headerRange, customStartDate, customEndDate, cashTrendAggregation]
  );

  const trendValues = trendPoints.map((p) => p.amount);
  const trendPath = buildPath(trendValues, 360, 120);

  const cashTrendTicks = React.useMemo(
    () => buildCashNiceTicks(Math.max(...trendPoints.map((item) => item.amount), 0), 4),
    [trendPoints]
  );
  const cashTrendMax = cashTrendTicks[cashTrendTicks.length - 1] || 1;

  const cashBarSourcePoints = React.useMemo(
    () => buildCashRangeSeries(rows, headerRange, customStartDate, customEndDate, "day"),
    [rows, headerRange, customStartDate, customEndDate]
  );

  const cashBarPoints = React.useMemo(
    () => buildCashBarSeries(cashBarSourcePoints, cashChartGranularity),
    [cashBarSourcePoints, cashChartGranularity]
  );
  const cashBarDisplayLimit = cashChartGranularity === "day" ? 31 : cashChartGranularity === "week" ? 16 : 12;
  const safeCashBarPoints =
    cashBarPoints.length > cashBarDisplayLimit ? cashBarPoints.slice(-cashBarDisplayLimit) : cashBarPoints;
  const cashBarTicks = React.useMemo(
    () => buildCashNiceTicks(Math.max(...safeCashBarPoints.map((item) => item.amount), 0), 4),
    [safeCashBarPoints]
  );
  const cashBarMax = cashBarTicks[cashBarTicks.length - 1] || 1;

  const cashTrendTotal = trendPoints.reduce((sum, item) => sum + item.amount, 0);
  const cashTrendPeak = trendPoints.reduce<{ date: string; amount: number; label?: string } | null>(
    (best, current) => (!best || current.amount > best.amount ? current : best),
    null
  );
  const cashTrendLatest = trendPoints[trendPoints.length - 1] ?? null;
  const cashTrendLatestNonZero =
    [...trendPoints].reverse().find((item) => item.amount > 0) ?? cashTrendLatest;
  const cashRangeLabel =
    headerRange === "7d"
      ? "直近7日"
      : headerRange === "30d"
        ? "直近30日"
        : headerRange === "90d"
          ? "直近90日"
          : headerRange === "12m"
            ? "直近12か月"
            : "カスタム";

  const cashBarPeak = safeCashBarPoints.reduce<{ label: string; amount: number } | null>(
    (best, current) => (!best || current.amount > best.amount ? current : best),
    null
  );
  const cashBarLatest = safeCashBarPoints[safeCashBarPoints.length - 1] ?? null;
  const cashBarAmountLabelEvery = Math.max(1, Math.ceil(safeCashBarPoints.length / 5));

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
        <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]" data-scope="cash-chart-hover-layer-polish-l3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">入金趋势</div>
              <div className="mt-1 text-sm leading-6 text-slate-500">
                選択した期間に応じて、日別・週別・月別に自動集計した現金収入の推移です。
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right shadow-inner shadow-white/60">
              <div className="text-[11px] font-semibold text-slate-500">表示範囲</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-950">{cashRangeLabel}</div>
              <div className="text-[11px] text-slate-500">表示粒度 {cashTrendAggregationLabel} / 表示点数 {trendPoints.length}点</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">合計入金</div>
              <div className="mt-1 text-base font-semibold text-slate-950">{formatChartYen(cashTrendTotal)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{cashTrendAggregation === "day" ? "最大入金日" : "最大区間"}</div>
              <div className="mt-1 text-base font-semibold text-slate-950">
                {cashTrendPeak ? getCashPointDisplayLabel(cashTrendPeak) : "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">最新入金</div>
              <div className="mt-1 text-base font-semibold text-slate-950">
                {cashTrendLatestNonZero ? `${getCashPointDisplayLabel(cashTrendLatestNonZero)} / ${formatChartYen(cashTrendLatestNonZero.amount)}` : "-"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            {trendPoints.length > 0 ? (
              <div className="overflow-x-auto rounded-[26px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
                <svg
                  viewBox="0 0 760 320"
                  className="min-w-[720px]"
                  role="img"
                  aria-label="現金収入の入金趋势"
                >
                  {(() => {
                    const width = 760;
                    const padding = { top: 18, right: 24, bottom: 44, left: 112 };
                    const innerWidth = width - padding.left - padding.right;
                    const innerHeight = 220;
                    const height = 320;
                    const xLabelEvery = Math.max(1, Math.ceil(trendPoints.length / 7));
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
                    const baselineY = padding.top + innerHeight;
                    const areaPath =
                      coords.length > 0 && path
                        ? `${path} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
                        : "";
                    const peakAmount = Math.max(...coords.map((point) => point.amount), 0);

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
                                stroke="#e6edf5"
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

                        {coords.map((point, index) => {
                          const isFirstLabel = index === 0;
                          const isLastLabel = index === coords.length - 1;
                          const isSparseLabel =
                            index % xLabelEvery === 0 && index < Math.max(1, coords.length - 2);
                          const shouldShowDateLabel = isFirstLabel || isLastLabel || isSparseLabel;

                          return (
                            <g key={`cash-trend-row-${point.date}`}>
                              {shouldShowDateLabel ? (
                                <line
                                  x1={point.x}
                                  y1={padding.top}
                                  x2={point.x}
                                  y2={padding.top + innerHeight}
                                  stroke="#f1f5f9"
                                  strokeWidth="1"
                                />
                              ) : null}
                              {shouldShowDateLabel ? (
                                <text
                                  x={point.x}
                                  y={height - 14}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#475569"
                                >
                                  {getCashPointDisplayLabel(point)}
                                </text>
                              ) : null}
                            </g>
                          );
                        })}

                        <line
                          x1={padding.left}
                          y1={padding.top + innerHeight}
                          x2={padding.left + innerWidth}
                          y2={padding.top + innerHeight}
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                        />
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + innerHeight}
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                        />

                        {areaPath ? (
                          <path
                            d={areaPath}
                            fill="url(#cashTrendAreaGradient)"
                            opacity="1"
                          />
                        ) : null}

                        <defs>
                          <linearGradient id="cashTrendAreaGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {path ? (
                          <path
                            d={path}
                            fill="none"
                            stroke="#111827"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : null}

                        {coords.map((point, index) => {
                          const isPeakPoint = point.amount > 0 && point.amount === peakAmount;
                          const isLatestPoint =
                            cashTrendLatestNonZero != null && point.date === cashTrendLatestNonZero.date;
                          const isVisiblePoint = point.amount > 0 || isPeakPoint || isLatestPoint;

                          return isVisiblePoint ? (
                            <circle
                              key={`cash-trend-dot-${point.date}`}
                              cx={point.x}
                              cy={point.y}
                              r={isPeakPoint || isLatestPoint ? "5.8" : "3.6"}
                              fill={isPeakPoint ? "#1d4ed8" : isLatestPoint ? "#059669" : "#2563eb"}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          ) : null;
                        })}

                        {coords.map((point, index) => {
                          const isPeakPoint = point.amount > 0 && point.amount === peakAmount;
                          const isLatestPoint =
                            cashTrendLatestNonZero != null && point.date === cashTrendLatestNonZero.date;
                          const isVisiblePoint = point.amount > 0 || isPeakPoint || isLatestPoint;
                          const tooltipWidth = 148;
                          const tooltipHeight = 64;
                          const tooltipX = Math.min(
                            Math.max(point.x + 12, padding.left + 8),
                            padding.left + innerWidth - tooltipWidth
                          );
                          const tooltipY = Math.max(point.y - 58, padding.top + 8);

                          return isVisiblePoint ? (
                            <g
                              key={`cash-trend-hover-layer-${point.date}`}
                              className="group outline-none"
                              tabIndex={0}
                            >
                              <title>{`${getCashPointDisplayLabel(point)} / ${formatChartYen(point.amount)}`}</title>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="15"
                                fill="transparent"
                                className="cursor-pointer"
                              />
                              <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
                                <line
                                  x1={point.x}
                                  y1={padding.top}
                                  x2={point.x}
                                  y2={padding.top + innerHeight}
                                  stroke="#94a3b8"
                                  strokeDasharray="4 4"
                                  strokeWidth="1"
                                  opacity="0.55"
                                />
                                <rect
                                  x={tooltipX}
                                  y={tooltipY}
                                  width={tooltipWidth}
                                  height={tooltipHeight}
                                  rx="14"
                                  fill="#0f172a"
                                  opacity="0.96"
                                />
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 19}
                                  fontSize="11"
                                  fill="#cbd5e1"
                                >
                                  {getCashPointDisplayLabel(point)}
                                </text>
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 38}
                                  fontSize="13"
                                  fontWeight="700"
                                  fill="#ffffff"
                                >
                                  {formatChartYen(point.amount)}
                                </text>
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 55}
                                  fontSize="10"
                                  fontWeight="600"
                                  fill={isPeakPoint ? "#93c5fd" : isLatestPoint ? "#86efac" : "#94a3b8"}
                                >
                                  {isPeakPoint ? (cashTrendAggregation === "day" ? "最大入金日" : "最大区間") : isLatestPoint ? "最新入金" : `${cashTrendAggregationLabel}入金`}
                                </text>
                              </g>
                            </g>
                          ) : null;
                        })}

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

        </div>

        <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]" data-scope="cash-bar-hover-layer-polish-l3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">入金状況</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                  期間別の入金合計を比較します。表示範囲は左側の入金推移と連動します。
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

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">表示単位</div>
                <div className="mt-1 text-base font-semibold text-slate-950">
                  {cashChartGranularity === "day" ? "日別" : cashChartGranularity === "week" ? "週別" : "月別"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">最大区間</div>
                <div className="mt-1 text-base font-semibold text-slate-950">
                  {cashBarPeak ? `${cashBarPeak.label} / ${formatChartYen(cashBarPeak.amount)}` : "-"}
                </div>
              </div>
            </div>

            {safeCashBarPoints.length > 0 ? (
              <div className="overflow-x-auto rounded-[26px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
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
                    const barLabelEvery = Math.max(1, Math.ceil(safeCashBarPoints.length / 5));

                    return (
                      <>
                        <line
                          x1={padding.left}
                          y1={padding.top + innerHeight}
                          x2={padding.left + innerWidth}
                          y2={padding.top + innerHeight}
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                        />
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + innerHeight}
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                        />

                        {safeCashBarPoints.map((point, index) => {
                          const x = padding.left + gap / 2 + index * (columnWidth + gap);
                          const h = (point.amount / cashBarMax) * innerHeight;
                          const y = padding.top + innerHeight - h;
                          const isCurrentBar = index === safeCashBarPoints.length - 1;
                          const isPeakBar = cashBarPeak != null && point.amount === cashBarPeak.amount;
                          const shouldShowBarAmount =
                            point.amount > 0 &&
                            (isCurrentBar || isPeakBar || index % cashBarAmountLabelEvery === 0 || safeCashBarPoints.length <= 6);

                          const tooltipWidth = 132;
                          const tooltipHeight = 62;
                          const tooltipX = Math.min(
                            Math.max(x + columnWidth / 2 - tooltipWidth / 2, padding.left + 4),
                            padding.left + innerWidth - tooltipWidth
                          );
                          const tooltipY = Math.max(y - tooltipHeight - 12, padding.top + 6);
                          const granularityLabel =
                            cashChartGranularity === "day" ? "日別" : cashChartGranularity === "week" ? "週別" : "月別";

                          return (
                            <g key={`cash-bar-${point.key}`} className="group outline-none" tabIndex={0}>
                              <rect
                                x={x}
                                y={y}
                                width={columnWidth}
                                height={Math.max(h, 2)}
                                rx="10"
                                fill={index === safeCashBarPoints.length - 1 ? "#2563eb" : "#334155"}
                                opacity={index === safeCashBarPoints.length - 1 ? 0.96 : 0.9}
                                className="transition-opacity duration-150 group-hover:opacity-75 group-focus:opacity-75"
                              />
                              <rect
                                x={x - 4}
                                y={padding.top}
                                width={columnWidth + 8}
                                height={innerHeight}
                                rx="12"
                                fill="transparent"
                                className="cursor-pointer"
                              />
                              <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
                                <line
                                  x1={x + columnWidth / 2}
                                  y1={padding.top}
                                  x2={x + columnWidth / 2}
                                  y2={padding.top + innerHeight}
                                  stroke="#94a3b8"
                                  strokeDasharray="4 4"
                                  strokeWidth="1"
                                  opacity="0.45"
                                />
                                <rect
                                  x={tooltipX}
                                  y={tooltipY}
                                  width={tooltipWidth}
                                  height={tooltipHeight}
                                  rx="14"
                                  fill="#0f172a"
                                  opacity="0.96"
                                />
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 18}
                                  fontSize="10"
                                  fontWeight="600"
                                  fill="#94a3b8"
                                >
                                  {granularityLabel} / {point.label}
                                </text>
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 39}
                                  fontSize="14"
                                  fontWeight="700"
                                  fill="#ffffff"
                                >
                                  {formatChartYen(point.amount)}
                                </text>
                                <text
                                  x={tooltipX + 12}
                                  y={tooltipY + 54}
                                  fontSize="10"
                                  fontWeight="600"
                                  fill={isCurrentBar ? "#93c5fd" : isPeakBar ? "#fde68a" : "#94a3b8"}
                                >
                                  {isCurrentBar ? "現在区間" : isPeakBar ? "最大区間" : "入金額"}
                                </text>
                              </g>
                              {shouldShowBarAmount ? (
                                <text
                                  data-role="cash-bar-amount-label"
                                  x={x + columnWidth / 2}
                                  y={Math.max(y - 8, padding.top + 12)}
                                  textAnchor="middle"
                                  fontSize={safeCashBarPoints.length > 8 ? "10" : "11"}
                                  fontWeight="700"
                                  fill={isCurrentBar ? "#1d4ed8" : "#1f2937"}
                                  className="pointer-events-none select-none"
                                >
                                  {formatChartYen(point.amount)}
                                </text>
                              ) : null}
                              {isCurrentBar && point.amount > 0 ? (
                                <text
                                  x={x + columnWidth / 2}
                                  y={Math.max(y - 24, padding.top + 10)}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="700"
                                  fill="#1d4ed8"
                                >
                                  Current
                                </text>
                              ) : null}

                              {(index === 0 ||
                                index === safeCashBarPoints.length - 1 ||
                                (index % barLabelEvery === 0 && index < safeCashBarPoints.length - 2)) ? (
                                <text
                                  x={x + columnWidth / 2}
                                  y={padding.top + innerHeight + 17}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#475569"
                                >
                                  {point.label}
                                </text>
                              ) : null}
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

          </div>
        </div>
      </div>
    </div>
  );
}
