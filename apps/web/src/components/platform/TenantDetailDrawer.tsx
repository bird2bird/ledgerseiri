"use client";

type TenantRow = {
  id: string;
  name: string;
  companyStatus: string;
  createdAt: string;
  userCount: number;
  storeCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
};

export function TenantDetailDrawer({
  open,
  row,
  onClose,
  onOpenAudit,
}: {
  open: boolean;
  row: TenantRow | null;
  onClose: () => void;
  onOpenAudit?: () => void;
}) {
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[115] flex justify-end bg-slate-950/45">
      <div className="h-full w-full max-w-xl border-l border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Tenant Detail</div>
            <h3 className="mt-3 text-2xl font-semibold">{row.name}</h3>
            <div className="mt-2 break-all text-xs text-slate-500">{row.id}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {[
            ["Tenant Status", row.companyStatus],
            ["Billing Plan", row.subscriptionPlan || "-"],
            ["Billing Status", row.subscriptionStatus || "-"],
            ["Users", String(row.userCount)],
            ["Stores", String(row.storeCount)],
            ["Period End", row.currentPeriodEnd || "-"],
            ["Created", row.createdAt],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
            >
              <div className="text-xs text-slate-400">{label}</div>
              <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onOpenAudit}
            className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Open Audit Entry
          </button>
        </div>
      </div>
    </div>
  );
}
