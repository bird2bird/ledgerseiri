type LatestTenantOperation = {
  id?: string;
  type?: string;
  status?: string;
  requestedAt?: string;
  note?: string;
  requestedByAdminEmail?: string;
} | null;

function toneClass(status?: string | null) {
  const v = String(status || "").toLowerCase();
  if (v.includes("suspend") || v.includes("risk") || v.includes("past_due") || v.includes("canceled")) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (v.includes("trial") || v.includes("pending") || v.includes("watch")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  if (v.includes("active") || v.includes("healthy") || v.includes("success")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  return "border-slate-700 bg-slate-950/50 text-slate-300";
}

export function PlatformTenantActionWorkspace({
  selectedCompanyId,
  selectedTenantName,
  companyStatus,
  subscriptionStatus,
  latestTenantOperation,
  busyId,
  notice,
  error,
  onSuspend,
  onActivate,
}: {
  selectedCompanyId?: string;
  selectedTenantName?: string;
  companyStatus?: string | null;
  subscriptionStatus?: string | null;
  latestTenantOperation?: LatestTenantOperation;
  busyId?: string | null;
  notice?: string;
  error?: string;
  onSuspend: () => void;
  onActivate: () => void;
}) {
  const isBusy = !!busyId;
  const hasSelection = !!selectedCompanyId;

  return (
    <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-slate-100">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-emerald-300/80">
            Tenant Action Workspace
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">
            {selectedTenantName || selectedCompanyId || "No tenant selected"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Operational control area for tenant activation, suspension, and governance feedback.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={`rounded-full border px-3 py-1.5 text-xs ${toneClass(companyStatus)}`}>
            Company: {companyStatus || "unknown"}
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-xs ${toneClass(subscriptionStatus)}`}>
            Billing: {subscriptionStatus || "unknown"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected Tenant</div>
            <div className="mt-2 text-sm font-medium text-white">{selectedCompanyId || "none"}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick Actions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSuspend}
                disabled={!hasSelection || isBusy}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 disabled:opacity-40"
              >
                Suspend Tenant
              </button>
              <button
                type="button"
                onClick={onActivate}
                disabled={!hasSelection || isBusy}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 disabled:opacity-40"
              >
                Activate Tenant
              </button>
            </div>
            {!hasSelection ? (
              <div className="mt-3 text-xs text-slate-500">Select a tenant row to enable actions.</div>
            ) : null}
          </div>

          {notice ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest Tenant Operation</div>
          {latestTenantOperation?.id ? (
            <div className="mt-3 space-y-2 text-sm">
              <div>
                Type: <span className="text-slate-200">{latestTenantOperation.type || "-"}</span>
              </div>
              <div>
                Status: <span className="text-slate-200">{latestTenantOperation.status || "-"}</span>
              </div>
              <div>
                Requested At: <span className="text-slate-200">{latestTenantOperation.requestedAt || "-"}</span>
              </div>
              <div>
                Requested By: <span className="text-slate-200">{latestTenantOperation.requestedByAdminEmail || "-"}</span>
              </div>
              <div>
                Note: <span className="text-slate-200">{latestTenantOperation.note || "-"}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-400">No recent tenant operation.</div>
          )}

          {isBusy ? (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Tenant action in progress...
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
