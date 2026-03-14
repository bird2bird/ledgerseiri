"use client";

import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { QuickActionItem } from "./types";
import { getQuickActionHref } from "./dashboard-linking";

function iconGlyph(icon: QuickActionItem["icon"]) {
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
      return "◧";
    default:
      return "•";
  }
}

export function QuickActionsCard({
  items,
}: {
  items: QuickActionItem[];
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang;

  return (
    <DashboardSectionCard
      title="Quick Actions"
      subtitle="よく使う操作へのショートカット"
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const href = getQuickActionHref(item.href, lang);

          if (item.locked) {
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4 opacity-95"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700">
                    {iconGlyph(item.icon)}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{item.label}</div>
                    <div className="mt-1 text-[12px] text-slate-600">{item.subLabel}</div>
                    {item.upgradeHint ? (
                      <div className="mt-2 text-[12px] leading-5 text-amber-800">
                        {item.upgradeHint}
                      </div>
                    ) : null}
                    {item.requiredPlan ? (
                      <div className="mt-2 inline-flex rounded-full border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-800">
                        Requires {item.requiredPlan}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              className="group block rounded-2xl border border-black/5 bg-white p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                  {iconGlyph(item.icon)}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{item.subLabel}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
