import Link from "next/link";
import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardAtRiskQueuePanel({
  lang,
  title,
  subtitle,
  openRiskQueueLabel,
  immediateLabel,
  immediateCount,
  followUpLabel,
  followUpCount,
  observeLabel,
  observeCount,
  noAtRiskUsersLabel,
  statusLabel,
  revenueLabel,
  lastBillingUpdateLabel,
  riskChip,
  priorityChip,
  rows,
}: {
  lang: string;
  title: string;
  subtitle: string;
  openRiskQueueLabel: string;
  immediateLabel: string;
  immediateCount: string;
  followUpLabel: string;
  followUpCount: string;
  observeLabel: string;
  observeCount: string;
  noAtRiskUsersLabel: string;
  statusLabel: string;
  revenueLabel: string;
  lastBillingUpdateLabel: string;
  riskChip: (level?: string) => string;
  priorityChip: (level?: string) => string;
  rows: Array<{
    id: string;
    email: string;
    companyId: string | null;
    billingRiskLevel: string;
    recoveryPriority: string;
    planStatus: string;
    estimatedMonthlyRevenue: string;
    subscriptionUpdatedAt: string;
    queue: string;
  }>;
}) {
  return (
    <PlatformDashboardSectionCard
      title={title}
      subtitle={subtitle}
      action={
        <Link
          href={`/${lang}/platform/users?queue=risk`}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
        >
          {openRiskQueueLabel}
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${lang}/platform/users?queue=past_due`}
          className={`rounded-full border px-3 py-1.5 text-xs ${priorityChip("immediate")}`}
        >
          {immediateLabel} · {immediateCount}
        </Link>
        <Link
          href={`/${lang}/platform/users?queue=canceled`}
          className={`rounded-full border px-3 py-1.5 text-xs ${priorityChip("follow-up")}`}
        >
          {followUpLabel} · {followUpCount}
        </Link>
        <Link
          href={`/${lang}/platform/users?queue=trialing`}
          className={`rounded-full border px-3 py-1.5 text-xs ${priorityChip("observe")}`}
        >
          {observeLabel} · {observeCount}
        </Link>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
            {noAtRiskUsersLabel}
          </div>
        ) : (
          rows.map((row) => (
            <Link
              key={row.id}
              href={`/${lang}/platform/users?queue=${row.queue}&selected=${row.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{row.email}</div>
                  <div className="mt-1 text-xs text-slate-400">{row.companyId || "-"}</div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex rounded-full border px-2 py-1 text-xs ${riskChip(row.billingRiskLevel)}`}>
                    {row.billingRiskLevel}
                  </div>
                  <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs ${priorityChip(row.recoveryPriority)}`}>
                    {row.recoveryPriority}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                <div>
                  {statusLabel}: <span className="text-slate-100">{row.planStatus}</span>
                </div>
                <div>
                  {revenueLabel}: <span className="text-slate-100">{row.estimatedMonthlyRevenue}</span>
                </div>
                <div>
                  {lastBillingUpdateLabel}: <span className="text-slate-100">{row.subscriptionUpdatedAt}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </PlatformDashboardSectionCard>
  );
}
