"use client";

import React from "react";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type DashboardSectionCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DashboardSectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: DashboardSectionCardProps) {
  return (
    <section className={cls("ls-card-solid p-4", className)}>
      <div className="flex min-h-[44px] items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-[12px] text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cls("mt-4", bodyClassName)}>{children}</div>
    </section>
  );
}
