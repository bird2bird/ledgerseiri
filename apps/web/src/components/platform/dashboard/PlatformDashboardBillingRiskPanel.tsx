import { PlatformDashboardMetricCard } from "./PlatformDashboardMetricCard";
import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardBillingRiskPanel({
  title,
  riskTenantsLabel,
  riskTenantsValue,
  riskTenantsSubtitle,
  activeTenantsLabel,
  activeTenantsValue,
  trialingTenantsLabel,
  trialingTenantsValue,
  pastDueTenantsLabel,
  pastDueTenantsValue,
  canceledTenantsLabel,
  canceledTenantsValue,
  freeTenantsLabel,
  freeTenantsValue,
}: {
  title: string;
  riskTenantsLabel: string;
  riskTenantsValue: string;
  riskTenantsSubtitle: string;
  activeTenantsLabel: string;
  activeTenantsValue: string;
  trialingTenantsLabel: string;
  trialingTenantsValue: string;
  pastDueTenantsLabel: string;
  pastDueTenantsValue: string;
  canceledTenantsLabel: string;
  canceledTenantsValue: string;
  freeTenantsLabel: string;
  freeTenantsValue: string;
}) {
  return (
    <PlatformDashboardSectionCard title={title}>
      <div className="grid gap-3">
        <PlatformDashboardMetricCard
          title={riskTenantsLabel}
          value={riskTenantsValue}
          subtitle={riskTenantsSubtitle}
          tone="amber"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{activeTenantsLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{activeTenantsValue}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{trialingTenantsLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{trialingTenantsValue}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{pastDueTenantsLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{pastDueTenantsValue}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{canceledTenantsLabel}</div>
            <div className="mt-2 text-xl font-semibold text-white">{canceledTenantsValue}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{freeTenantsLabel}</div>
          <div className="mt-2 text-xl font-semibold text-white">{freeTenantsValue}</div>
        </div>
      </div>
    </PlatformDashboardSectionCard>
  );
}
