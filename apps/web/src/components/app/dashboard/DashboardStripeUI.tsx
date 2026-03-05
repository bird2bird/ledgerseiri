"use client";

import React from "react";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Tone = "neutral" | "good" | "bad" | "info";

export function KpiCard({
  label,
  value,
  sub,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: React.ReactNode;
  tone?: Tone;
}) {
  const ring =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "info"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-black/10 bg-white text-slate-700";

  return (
    <div className="ls-card-solid p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium text-slate-600">{label}</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</div>
          {sub ? <div className="mt-1 text-[12px] text-slate-500">{sub}</div> : null}
        </div>
        {delta ? (
          <span className={cls("ls-badge px-2 py-1 text-[11px] font-medium border", ring)}>
            {delta}
          </span>
        ) : (
          <span className={cls("ls-badge px-2 py-1 text-[11px] font-medium border", ring)}> </span>
        )}
      </div>
    </div>
  );
}

/**
 * KPI row wrapper for the LEFT(main) column top.
 * Keep it inside the left column so it won't squeeze the right aside.
 */
export function KpiRow({
  items,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    delta?: React.ReactNode;
    tone?: Tone;
  }>;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {items.map((it, i) => (
        <div key={i} className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard {...it} />
        </div>
      ))}
    </div>
  );
}

/**
 * AI Insight card for the RIGHT(aside) column top.
 * IMPORTANT: props signature matches the existing usage expectation in page.tsx.
 */
export function AiInsightCard({
  title,
  score,
  message,
  items,
}: {
  title: string;
  score: string;
  message: string;
  items: { k: string; v: string }[];
}) {
  return (
    <section className="ls-card-solid p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-[12px] text-slate-500">Actionable suggestions</div>
        </div>
        <span className={cls("ls-badge", "px-2 py-1 text-[11px] font-medium text-slate-700")}>
          {score}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-700 leading-6">{message}</div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {items.slice(0, 3).map((it) => (
          <div key={it.k} className="ls-card p-3">
            <div className="text-[11px] text-slate-500">{it.k}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{it.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
