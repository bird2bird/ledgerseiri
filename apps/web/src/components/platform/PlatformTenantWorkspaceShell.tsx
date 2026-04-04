import Link from "next/link";

export function PlatformTenantWorkspaceShell({
  lang,
  selectedCompanyId,
}: {
  lang: string;
  selectedCompanyId?: string;
}) {
  const selectedAuditHref = selectedCompanyId
    ? `/${lang}/platform/audit?companyId=${encodeURIComponent(selectedCompanyId)}&page=1&limit=20`
    : `/${lang}/platform/audit?page=1&limit=20`;

  return (
    <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-100">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
            Platform Tenant Workspace
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Tenants control shell
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Tenant-focused workspace for platform governance, billing status review,
            audit investigation, and cross-page drill-down.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300">
              Selected tenant:{" "}
              <span className="font-medium text-white">{selectedCompanyId || "none"}</span>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300">
              Workspace phase: shell baseline
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
          <Link
            href={`/${lang}/platform/dashboard`}
            className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Navigation</div>
            <div className="mt-2 font-medium">Open Dashboard</div>
          </Link>

          <Link
            href={`/${lang}/platform/users`}
            className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Navigation</div>
            <div className="mt-2 font-medium">Open Users</div>
          </Link>

          <Link
            href={`/${lang}/platform/operations`}
            className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Investigation</div>
            <div className="mt-2 font-medium">Open Operations</div>
          </Link>

          <Link
            href={selectedAuditHref}
            className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200 hover:bg-cyan-500/15"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Investigation</div>
            <div className="mt-2 font-medium">
              {selectedCompanyId ? "Open Selected Tenant Audit" : "Open Audit"}
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
