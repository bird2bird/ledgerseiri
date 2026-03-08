"use client";

import React from "react";
import type { KpiCardData } from "./types";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function toneClasses(tone?: KpiCardData["tone"]) {
  switch (tone) {
    case "profit":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        iconWrap: "bg-emerald-50 text-emerald-600",
      };
    case "warning":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        iconWrap: "bg-amber-50 text-amber-600",
      };
    case "danger":
      return {
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        iconWrap: "bg-rose-50 text-rose-600",
      };
    case "info":
      return {
        badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
        iconWrap: "bg-indigo-50 text-indigo-600",
      };
    default:
      return {
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        iconWrap: "bg-slate-100 text-slate-600",
      };
  }
}

function trendGlyph(trend?: KpiCardData["trend"]) {
  if (trend === "up") return "↗";
  if (trend === "down") return "↘";
  return "•";
}

function iconGlyph(key: string) {
  switch (key) {
    case "revenue":
      return "¥";
    case "expense":
      return "−";
    case "profit":
      return "↗";
    case "cash":
      return "◉";
    case "tax":
      return "%";
    case "invoice":
      return "□";
    case "inventory":
      return "▣";
    case "stockAlert":
      return "!";
    case "runway":
      return "→";
    default:
      return "•";
  }
}

export function KpiCard({
  data,
  dense = false,
}: {
  data: KpiCardData;
  dense?: boolean;
}) {
  const tone = toneClasses(data.tone);

  return (
    <section
      className={cls(
        "ls-card-solid h-full overflow-hidden",
        dense ? "p-4" : "p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cls(
                "flex shrink-0 items-center justify-center rounded-2xl font-semibold",
                dense ? "h-10 w-10 text-sm" : "h-11 w-11 text-base",
                tone.iconWrap
              )}
            >
              {iconGlyph(data.key)}
            </div>

            <div className="min-w-0">
              <div className="text-[12px] font-medium text-slate-500">
                {data.label}
              </div>

              <div
                className={cls(
                  "mt-2 font-semibold tracking-tight text-slate-900 tabular-nums",
                  dense ? "text-[30px] leading-none" : "text-[40px] leading-none"
                )}
              >
                {data.value}
              </div>
            </div>
          </div>

          {data.subLabel ? (
            <div className="mt-4 text-[12px] text-slate-500">{data.subLabel}</div>
          ) : null}
        </div>

        {data.deltaText ? (
          <span
            className={cls(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              tone.badge
            )}
          >
            <span>{trendGlyph(data.trend)}</span>
            <span>{data.deltaText}</span>
          </span>
        ) : null}
      </div>
    </section>
  );
}
