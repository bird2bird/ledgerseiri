import Link from "next/link";
import { PlatformDashboardMetricCard } from "./PlatformDashboardMetricCard";
import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardOperationsSnapshot({
  lang,
  title,
  openOperationsLabel,
  totalOperationsLabel,
  totalOperationsValue,
  byScopeSubtitle,
  failedLabel,
  failedValue,
  partialFailedLabel,
  partialFailedValue,
  topFailureCodesLabel,
  topFailureCodes,
}: {
  lang: string;
  title: string;
  openOperationsLabel: string;
  totalOperationsLabel: string;
  totalOperationsValue: string;
  byScopeSubtitle: string;
  failedLabel: string;
  failedValue: string;
  partialFailedLabel: string;
  partialFailedValue: string;
  topFailureCodesLabel: string;
  topFailureCodes: Array<{ code: string; count: number }>;
}) {
  return (
    <PlatformDashboardSectionCard
      title={title}
      action={
        <Link
          href={`/${lang}/platform/operations`}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
        >
          {openOperationsLabel}
        </Link>
      }
    >
      <div className="grid gap-4">
        <PlatformDashboardMetricCard
          title={totalOperationsLabel}
          value={totalOperationsValue}
          subtitle={byScopeSubtitle}
          tone="rose"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{failedLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{failedValue}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{partialFailedLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{partialFailedValue}</div>
          </div>
        </div>

        {topFailureCodes.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{topFailureCodesLabel}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topFailureCodes.map((row) => (
                <div
                  key={row.code}
                  className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100"
                >
                  {row.code} · {row.count}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PlatformDashboardSectionCard>
  );
}
