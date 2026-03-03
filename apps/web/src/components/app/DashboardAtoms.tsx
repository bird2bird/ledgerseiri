"use client";

import React from "react";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export function Card({
  title,
  sub,
  pill,
  children,
}: {
  title: string;
  sub: string;
  pill?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cls("ls-card-solid", "p-4")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-[12px] text-slate-500">{sub}</div>
        </div>
        {pill ? (
          <span className={cls("ls-badge", "px-2 py-1 text-[11px] font-medium text-slate-700")}>{pill}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className={cls("ls-card-solid", "p-3")}>
      <div className="text-[11px] text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function SparkCard({ title }: { title: string }) {
  // tiny sparkline placeholder
  const pts = "5,26 30,26 30,26 55,26 55,10 90,10";
  return (
    <div className={cls("ls-card-solid", "p-3")}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-slate-400">trend</div>
      </div>
      <div className="mt-2 h-10 w-full">
        <svg viewBox="0 0 100 40" className="h-full w-full">
          <polyline
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[color:var(--ls-primary)]"
          />
        </svg>
      </div>
    </div>
  );
}

export function CostRow({ label, pct, amount }: { label: string; pct: number; amount: string }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div className={cls("ls-card-solid", "mt-2 p-3")}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-sm font-semibold text-slate-800">{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-[color:var(--ls-primary)]" style={{ width: `${w}%` }} />
      </div>
      <div className="mt-2 text-[12px] text-slate-500">amount: {amount}</div>
    </div>
  );
}

export function QuickCard({ title, sub, btn }: { title: string; sub: string; btn: string }) {
  return (
    <div className={cls("ls-card-solid", "p-4")}>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-[12px] text-slate-500">{sub}</div>
      <button className={cls("ls-btn", "ls-btn-ghost", "mt-3 px-3 py-1 text-sm font-semibold")}>{btn}</button>
    </div>
  );
}

export function NoticeItem({ tag, date, text }: { tag: string; date: string; text: string }) {
  return (
    <div className={cls("ls-card-solid", "p-3")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cls("ls-badge", "px-2 py-1 text-[11px] font-medium text-slate-700")}>{tag}</span>
          <span className="text-[12px] text-slate-400">{date}</span>
        </div>
        <span className="h-2 w-2 rounded-full bg-[color:var(--ls-primary)]" />
      </div>
      <div className="mt-2 text-sm text-slate-800">{text}</div>
    </div>
  );
}
