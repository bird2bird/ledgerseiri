import type { ReactNode } from "react";

export function PlatformDashboardSectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,31,66,0.88),rgba(12,16,38,0.92))] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
