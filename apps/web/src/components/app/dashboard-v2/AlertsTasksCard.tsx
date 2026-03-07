"use client";

import React from "react";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { DashboardAlert } from "./types";

function severityTone(severity: DashboardAlert["severity"]) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function severityLabel(severity: DashboardAlert["severity"]) {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    default:
      return "Info";
  }
}

export function AlertsTasksCard({
  items,
}: {
  items: DashboardAlert[];
}) {
  return (
    <DashboardSectionCard
      title="Alerts & Tasks"
      subtitle="対応が必要な項目"
      action={
        <button className="ls-btn ls-btn-ghost px-3 py-1.5 text-sm font-medium">
          すべて見る
        </button>
      }
      className="h-full"
    >
      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="block rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">
                  {item.title}
                </div>
                {item.description ? (
                  <div className="mt-1 text-[12px] leading-5 text-slate-500">
                    {item.description}
                  </div>
                ) : null}
              </div>

              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${severityTone(
                  item.severity
                )}`}
              >
                {severityLabel(item.severity)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
