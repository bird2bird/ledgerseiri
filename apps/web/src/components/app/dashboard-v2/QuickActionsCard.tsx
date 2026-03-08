"use client";

import React from "react";
import Link from "next/link";
import { DashboardSectionCard } from "./DashboardSectionCard";
import type { QuickActionItem } from "./types";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

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

function LockBadge({ level }: { level?: "standard" | "premium" }) {
  const text = level === "premium" ? "🔒 Pro" : "🔒 Std+";
  const tone =
    level === "premium"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        tone
      )}
    >
      {text}
    </span>
  );
}

function billingHref(level?: "standard" | "premium") {
  if (level === "premium") return "/ja/app/billing/change?target=premium";
  return "/ja/app/billing/change?target=standard";
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
        {items.map((item) => {
          const common = cls(
            "group rounded-2xl border p-4 transition",
            item.locked
              ? "border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]"
              : "border-black/5 bg-white hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]"
          );

          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cls(
                    "flex h-10 w-10 items-center justify-center rounded-2xl text-base font-semibold",
                    item.locked
                      ? "bg-slate-200 text-slate-400"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {iconFor(item.icon)}
                </div>

                <div className="flex items-center gap-2">
                  {item.locked ? <LockBadge level={item.requiredPlan} /> : null}
                  <div
                    className={cls(
                      "transition",
                      item.locked
                        ? "text-slate-300"
                        : "text-slate-300 group-hover:text-slate-500"
                    )}
                  >
                    →
                  </div>
                </div>
              </div>

              <div
                className={cls(
                  "mt-4 text-sm font-medium",
                  item.locked ? "text-slate-500" : "text-slate-900"
                )}
              >
                {item.label}
              </div>

              <div
                className={cls(
                  "mt-1 text-[12px]",
                  item.locked ? "text-slate-400" : "text-slate-500"
                )}
              >
                {item.locked && item.upgradeHint ? item.upgradeHint : item.subLabel}
              </div>
            </>
          );

          if (item.locked) {
            return (
              <Link
                key={item.key}
                href={billingHref(item.requiredPlan)}
                className={common}
                title={item.upgradeHint || "Upgrade required"}
              >
                {content}
              </Link>
            );
          }

          return (
            <a
              key={item.key}
              href={item.href}
              className={common}
            >
              {content}
            </a>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
