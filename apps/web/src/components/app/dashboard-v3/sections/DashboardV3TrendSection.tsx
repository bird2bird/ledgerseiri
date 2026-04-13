import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardTheme } from "@/core/dashboard-v3/theme";
import { getDashboardSectionStructure } from "@/core/dashboard-v3/structure";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3TrendSeries[];
};

function getMax(values: number[]) {
  return Math.max(1, ...values);
}

function getMin(values: number[]) {
  return Math.min(...values);
}

function getPolyline(values: number[], width = 360, height = 150) {
  const max = getMax(values);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function getTrendSummary(values: number[]) {
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const max = getMax(values);
  const min = getMin(values);
  const delta = last - first;

  return {
    delta,
    max,
    min,
    last,
  };
}

function businessTrendTitle(lang: string, businessView: BusinessViewType, index: number, fallback: string) {
  const c = getDashboardCopy(lang);
  if (businessView === "amazon") {
    return index === 0 ? c.trendAmazonPrimary : c.trendAmazonSecondary;
  }
  if (businessView === "ec") {
    return index === 0 ? c.trendEcPrimary : c.trendEcSecondary;
  }
  return fallback;
}

function trendHint(lang: string, businessView: BusinessViewType, index: number) {
  const c = getDashboardCopy(lang);
  if (businessView === "amazon") {
    return index === 0 ? c.trendAmazonPrimaryHint : c.trendAmazonSecondaryHint;
  }
  if (businessView === "ec") {
    return index === 0 ? c.trendEcPrimaryHint : c.trendEcSecondaryHint;
  }
  return "";
}

function renderEnhancedChart(
  lang: string,
  businessView: BusinessViewType,
  series: DashboardV3TrendSeries,
  index: number
) {
  const c = getDashboardCopy(lang);
  const values = series.points.map((p) => Number(p.value) || 0);
  const max = getMax(values);
  const polyline = getPolyline(values, 360, 150);
  const summary = getTrendSummary(values);

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-white/80">
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
          {c.trendLatest} {summary.last.toLocaleString("ja-JP")}
        </span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
          {c.trendMax} {summary.max.toLocaleString("ja-JP")}
        </span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
          {c.trendMin} {summary.min.toLocaleString("ja-JP")}
        </span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
          {c.trendDelta} {summary.delta >= 0 ? "+" : ""}{summary.delta.toLocaleString("ja-JP")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex h-[220px] items-end justify-between gap-3">
          {series.points.map((point, pointIndex) => {
            const value = Number(point.value) || 0;
            const height = Math.max(20, Math.round((value / max) * 150));

            return (
              <div key={`${series.key}-${pointIndex}`} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-[160px] items-end">
                  <div
                    className="w-full rounded-t-[18px] bg-white/65"
                    style={{ height: `${height}px`, minWidth: "18px" }}
                    title={`${point.label}: ${value.toLocaleString("ja-JP")}`}
                  />
                </div>
                <div className="text-xs text-white/75">{point.label}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          <svg viewBox="0 0 360 170" className="h-[190px] w-full overflow-visible">
            <line x1="0" y1="150" x2="360" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <line x1="0" y1="100" x2="360" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <line x1="0" y1="50" x2="360" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

            <polyline
              fill="none"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="3"
              points={polyline}
            />
            {values.map((value, pointIndex) => {
              const x = values.length > 1 ? (pointIndex * 360) / (values.length - 1) : 0;
              const y = 150 - (value / max) * 150;
              return (
                <g key={`${series.key}-dot-${pointIndex}`}>
                  <circle cx={x} cy={y} r="4.5" fill="white" />
                </g>
              );
            })}
          </svg>
          <div className="mt-2 text-xs text-white/70">
            {trendHint(lang, businessView, index)}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBasicChart(series: DashboardV3TrendSeries) {
  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-[180px] items-end justify-between gap-3">
        {series.points.map((point, index) => {
          const value = Number(point.value) || 0;
          const max = Math.max(
            1,
            ...series.points.map((p) => Number(p.value) || 0)
          );
          const height = Math.max(20, Math.round((value / max) * 120));

          return (
            <div key={`${series.key}-${index}`} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-[130px] items-end">
                <div
                  className="w-full rounded-t-[18px] bg-white/65"
                  style={{ height: `${height}px`, minWidth: "18px" }}
                />
              </div>
              <div className="text-xs text-white/75">{point.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardV3TrendSection(props: Props) {
  const c = getDashboardCopy(props.lang);
  const theme = getDashboardTheme(props.businessView);
  const structure = getDashboardSectionStructure(props.businessView);
  const isEnhanced = props.businessView === "amazon" || props.businessView === "ec";

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/5 bg-white px-5 py-4 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">
          {structure.trendTitle}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {structure.trendSummary}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.items.map((series, index) => (
          <div
            key={series.key}
            className={"rounded-[28px] border p-6 shadow-sm " + theme.chartPanelClass}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">
                  {isEnhanced
                    ? businessTrendTitle(props.lang, props.businessView, index, series.title)
                    : series.title}
                </div>
                <div className="mt-2 text-sm text-white/75">
                  {series.primaryLabel}
                  {series.secondaryLabel ? ` / ${series.secondaryLabel}` : ""}
                </div>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                {isEnhanced ? c.trendReportChart : c.trendSimpleChart}
              </div>
            </div>

            {isEnhanced
              ? renderEnhancedChart(props.lang, props.businessView, series, index)
              : renderBasicChart(series)}
          </div>
        ))}
      </div>
    </div>
  );
}
