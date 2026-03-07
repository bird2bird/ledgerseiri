"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { QuickActionItem } from "./types";

function iconFor(icon: string) {
  switch (icon) {
    case "plus":
      return "+";
    case "minus":
      return "−";
    case "arrow":
      return "→";
    case "file":
      return "□";
    case "upload":
      return "↑";
    case "chart":
      return "↗";
    default:
      return "•";
  }
}

export function QuickActionsCard({
  items,
}: {
  items: QuickActionItem[];
}) {
  return (
    <DashboardSectionCard
      title="Quick Actions"
      subtitle="よく使う操作"
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className="group rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-base font-semibold text-slate-700">
                {iconFor(item.icon)}
              </div>
              <div className="text-slate-300 transition group-hover:text-slate-500">→</div>
            </div>

            <div className="mt-4 text-sm font-medium text-slate-900">{item.label}</div>
            <div className="mt-1 text-[12px] text-slate-500">{item.subLabel}</div>
          </a>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
