"use client";

import { useEffect, useMemo, useState } from "react";

type TenantOption = {
  id: string;
  name: string;
};

export function AssignUserDialog({
  open,
  email,
  tenants,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  email: string;
  tenants: TenantOption[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (companyId: string) => Promise<void> | void;
}) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedId(tenants[0]?.id || "");
  }, [open, tenants]);

  const tenantLabel = useMemo(() => {
    const hit = tenants.find((x) => x.id === selectedId);
    return hit ? `${hit.name} (${hit.id})` : selectedId;
  }, [selectedId, tenants]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">User Assignment</div>
            <h3 className="mt-3 text-2xl font-semibold">Assign user to tenant</h3>
            <div className="mt-2 text-sm text-slate-400">{email}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Select tenant</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.id})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            Selected target: {tenantLabel || "-"}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedId || !!loading}
            onClick={() => onSubmit(selectedId)}
            className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
