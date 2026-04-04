import Link from "next/link";

function chipTone(value?: string | null) {
  const v = String(value || "").toLowerCase();
  if (v.includes("past") || v.includes("risk") || v.includes("suspend")) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (v.includes("trial") || v.includes("watch")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  if (v.includes("active") || v.includes("healthy")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  return "border-slate-700 bg-slate-950/50 text-slate-300";
}

export function PlatformTenantIntelligencePanel({
  lang,
  selectedCompanyId,
  selectedTenantName,
  tenantStatus,
  tenantPlan,
  riskSignal,
  auditHref,
  operationsHref,
  usersHref,
}: {
  lang: string;
  selectedCompanyId?: string;
  selectedTenantName?: string;
  tenantStatus?: string | null;
  tenantPlan?: string | null;
  riskSignal?: string | null;
  auditHref: string;
  operationsHref: string;
  usersHref: string;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-slate-100">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-violet-300/80">
            Tenant Intelligence
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">
            {selectedTenantName || selectedCompanyId || "No tenant selected"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Billing and governance baseline for the currently selected tenant. This shell
            will evolve into tenant health, recent signals, and action workspace in follow-up steps.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={`rounded-full border px-3 py-1.5 text-xs ${chipTone(tenantStatus)}`}>
            Status: {tenantStatus || "unknown"}
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-xs ${chipTone(tenantPlan)}`}>
            Plan: {tenantPlan || "unknown"}
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-xs ${chipTone(riskSignal)}`}>
            Risk: {riskSignal || "none"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected Tenant</div>
            <div className="mt-2 text-sm font-medium text-white">{selectedCompanyId || "none"}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Billing View</div>
            <div className="mt-2 text-sm font-medium text-white">{tenantStatus || "unknown"}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Commercial Tier</div>
            <div className="mt-2 text-sm font-medium text-white">{tenantPlan || "unknown"}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={auditHref}
            className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-200 hover:bg-cyan-500/15"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Investigation</div>
            <div className="mt-2 font-medium">Open Audit Timeline</div>
          </Link>

          <Link
            href={operationsHref}
            className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-4 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Workspace</div>
            <div className="mt-2 font-medium">Open Operations</div>
          </Link>

          <Link
            href={usersHref}
            className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-4 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Workspace</div>
            <div className="mt-2 font-medium">Open Users</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
