"use client";

import Link from "next/link";
import type { PlatformAuditRow } from "@/core/platform-auth/client";

function diffKind(row: PlatformAuditRow) {
  if (!row.changed) return "UNCHANGED";
  if (!row.previousValue && row.nextValue) return "CREATED";
  if (row.previousValue && !row.nextValue) return "CLEARED";
  return "UPDATED";
}

export function AuditEventDetailDrawer({
  open,
  row,
  lang,
  onClose,
  onSelectRelatedRow,
  relatedRows = [],
}: {
  open: boolean;
  row: PlatformAuditRow | null;
  lang: string;
  onClose: () => void;
  onSelectRelatedRow?: (row: PlatformAuditRow) => void;
  relatedRows?: PlatformAuditRow[];
}) {
  if (!open || !row) return null;

  const reconciliationHref =
    `/${lang}/platform/reconciliation?candidateId=${encodeURIComponent(row.candidateId)}`
    + `&companyId=${encodeURIComponent(row.companyId)}`
    + `&persistenceKey=${encodeURIComponent(row.persistenceKey || "")}`;

  const similarHref =
    `/${lang}/platform/audit?companyId=${encodeURIComponent(row.companyId)}`
    + `&candidateId=${encodeURIComponent(row.candidateId)}`
    + `&persistenceKey=${encodeURIComponent(row.persistenceKey || "")}`
    + `&page=1&limit=20`;

  const changedOnlyHref =
    `/${lang}/platform/audit?changed=true`
    + `&companyId=${encodeURIComponent(row.companyId)}`
    + `&candidateId=${encodeURIComponent(row.candidateId)}`
    + `&persistenceKey=${encodeURIComponent(row.persistenceKey || "")}`
    + `&page=1&limit=20`;

  const dashboardHref = `/${lang}/platform/dashboard`;
  const kind = diffKind(row);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/45">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Investigation Workspace</div>
            <h3 className="mt-3 text-2xl font-semibold">{row.actionType}</h3>
            <div className="mt-2 text-xs text-slate-500">{row.id}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Current Focus</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs text-cyan-200">{row.actionType}</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs">{row.source}</span>
            <span className={row.changed ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200" : "rounded-full bg-slate-800 px-2.5 py-1 text-xs"}>
              {row.changed ? "CHANGED" : "UNCHANGED"}
            </span>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs">{kind}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Base Info</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Source", row.source],
                ["Changed", row.changed ? "YES" : "NO"],
                ["Diff Kind", kind],
                ["Created At", row.createdAt],
                ["Company", row.companyId],
                ["Candidate", row.candidateId],
                ["Persistence", row.persistenceKey || "-"],
                ["Submitted At", row.submittedAt],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="mt-1 break-all text-sm font-medium text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Value Diff</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <div className="text-xs text-rose-300">Previous</div>
                <div className="mt-2 min-h-[64px] break-all text-sm text-slate-100">{row.previousValue || "-"}</div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="text-xs text-emerald-300">Next</div>
                <div className="mt-2 min-h-[64px] break-all text-sm text-slate-100">{row.nextValue || "-"}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Related Events</div>
              <div className="text-xs text-slate-500">{relatedRows.length} linked rows in current slice</div>
            </div>

            <div className="mt-4 space-y-3">
              {relatedRows.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                  No related events in the current loaded slice.
                </div>
              ) : (
                relatedRows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectRelatedRow?.(item)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left hover:border-cyan-500/40 hover:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item.actionType}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.createdAt}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{item.source}</span>
                        <span className={item.changed ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200" : "rounded-full bg-slate-800 px-2 py-1 text-xs"}>
                          {item.changed ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-cyan-300">Switch focus to this event</div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Investigation Paths</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={similarHref} className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
                Similar Audit View
              </Link>
              <Link href={changedOnlyHref} className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-200 hover:bg-cyan-500/15">
                Changed Events Only
              </Link>
              <Link href={reconciliationHref} className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500">
                Open Review Queue
              </Link>
              <Link href={dashboardHref} className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
                Back to Dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
