"use client";

import Link from "next/link";
import {
  buildPlatformAuditHref,
  buildPlatformQueryString,
  buildPlatformReconciliationHref,
  buildPlatformSourceBackLink,
} from "@/core/platform/drilldown";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  fetchPlatformAuditOperationLink,
  fetchPlatformReconciliationList,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  type PlatformAuditListResponse,
  type PlatformAuditRow,
} from "@/core/platform-auth/client";
import { AuditEventDetailDrawer } from "@/components/platform/AuditEventDetailDrawer";

type ActiveFilter = {
  key: string;
  label: string;
  value: string;
};

type AuditGroup = {
  dateKey: string;
  items: PlatformAuditRow[];
};

function toDateKey(value: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10) || value;
  return d.toISOString().slice(0, 10);
}

function formatBool(v: boolean) {
  return v ? "YES" : "NO";
}

function buildQueryString(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

function AuditPageContent() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "ja";

  const q = searchParams.get("q") || "";
  const actionType = searchParams.get("actionType") || "";
  const source = searchParams.get("source") || "";
  const from = searchParams.get("from") || "";
  const selected = searchParams.get("selected") || "";
  const changed = searchParams.get("changed") || "";
  const companyId = searchParams.get("companyId") || "";
  const candidateId = searchParams.get("candidateId") || "";
  const persistenceKey = searchParams.get("persistenceKey") || "";
  const operationId = searchParams.get("operationId") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") || "20"));

  const [data, setData] = useState<PlatformAuditListResponse | null>(null);
  const [operationLink, setOperationLink] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PlatformAuditRow | null>(null);

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [result, opLink] = await Promise.all([
      fetchPlatformReconciliationList(token, {
        page,
        limit,
        q,
        actionType,
        source,
        changed,
        companyId,
        candidateId,
        persistenceKey,
      }),
      operationId ? fetchPlatformAuditOperationLink(operationId, token) : Promise.resolve(null),
    ]);

    setData(result);
    setOperationLink(opLink);
    setError("");
  }

  useEffect(() => {
    setLoading(true);
    reload()
      .catch((e) => {
        if (isPlatformUnauthorizedError(e)) {
          router.replace(`/${lang}/platform-auth/login`);
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, [
    lang,
    router,
    q,
    actionType,
    source,
    changed,
    companyId,
    candidateId,
    persistenceKey,
    operationId,
    page,
    limit,
  ]);

  const items = data?.items || [];

  const relatedRows = useMemo(() => {
    if (!selectedRow) return [];
    return items
      .filter(
        (item) =>
          item.id !== selectedRow.id &&
          item.companyId === selectedRow.companyId &&
          item.candidateId === selectedRow.candidateId &&
          (item.persistenceKey || "") === (selectedRow.persistenceKey || "")
      )
      .slice(0, 6);
  }, [items, selectedRow]);

  const updateFilters = (patch: Record<string, string | number | boolean | null | undefined>) => {
    const qs = buildPlatformQueryString({
      q,
      actionType,
      source,
      changed,
      companyId,
      candidateId,
      persistenceKey,
      operationId,
      page: 1,
      limit,
      ...patch,
    });
    router.push(`/${lang}/platform/audit${qs ? `?${qs}` : ""}`);
  };

  const removeFilter = (key: string) => {
    updateFilters({ [key]: "" });
  };

  const activeFilters = useMemo<ActiveFilter[]>(
    () =>
      [
        q ? { key: "q", label: "Search", value: q } : null,
        actionType ? { key: "actionType", label: "Action", value: actionType } : null,
        source ? { key: "source", label: "Source", value: source } : null,
        changed ? { key: "changed", label: "Changed", value: changed } : null,
        from ? { key: "from", label: "From", value: from } : null,
        selected ? { key: "selected", label: "Selected", value: selected } : null,
        companyId ? { key: "companyId", label: "Company", value: companyId } : null,
        candidateId ? { key: "candidateId", label: "Candidate", value: candidateId } : null,
        persistenceKey ? { key: "persistenceKey", label: "Persistence", value: persistenceKey } : null,
        operationId ? { key: "operationId", label: "Operation", value: operationId } : null,
      ].filter(Boolean) as ActiveFilter[],
    [q, actionType, source, from, selected, changed, companyId, candidateId, persistenceKey, operationId]
  );

  const sourceLink = useMemo(
    () =>
      buildPlatformSourceBackLink(lang, {
        from,
        selected,
        operationId,
        companyId,
        candidateId,
        persistenceKey,
      }),
    [lang, from, selected, operationId, companyId, candidateId, persistenceKey]
  );

  const isAuditContextMatch = (row: PlatformAuditRow) => {
    const rowCandidateId = row.candidateId || "";
    const rowPersistenceKey = row.persistenceKey || "";

    if (operationId && operationLink?.auditIds?.length) {
      return operationLink.auditIds.includes(row.id);
    }

    if (selected && rowCandidateId && selected === rowCandidateId) {
      return true;
    }

    if (candidateId && rowCandidateId && candidateId === rowCandidateId) {
      return true;
    }

    if (persistenceKey && rowPersistenceKey && persistenceKey === rowPersistenceKey) {
      return true;
    }

    return false;
  };

  const pageLabel = useMemo(() => {
    if (!data) return "-";
    return `${data.page} / ${data.totalPages}`;
  }, [data]);

  const stats = useMemo(() => {
    const changedCount = items.filter((x) => x.changed).length;
    const adminCount = items.filter((x) => x.source === "admin").length;
    const overrideCount = items.filter(
      (x) => x.actionType === "override_approve" || x.actionType === "override_reject"
    ).length;
    return { changedCount, adminCount, overrideCount };
  }, [items]);

  const groups = useMemo<AuditGroup[]>(() => {
    const map = new Map<string, PlatformAuditRow[]>();
    for (const item of items) {
      const key = toDateKey(item.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([dateKey, rows]) => ({
      dateKey,
      items: rows,
    }));
  }, [items]);

  const highlightedAuditCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.filter((row) => isAuditContextMatch(row)).length, 0),
    [groups, operationId, operationLink, selected, candidateId, persistenceKey]
  );

  if (loading) return <div className="text-slate-300">Loading audit...</div>;

  return (
    <>
      <AuditEventDetailDrawer
        open={drawerOpen}
        row={selectedRow}
        lang={lang}
        relatedRows={relatedRows}
        onSelectRelatedRow={(row) => setSelectedRow(row)}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRow(null);
        }}
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">Investigation Timeline</div>
            <div className="mt-3 text-3xl font-semibold">Audit Timeline</div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/platform/dashboard`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href={`/${lang}/platform/reconciliation`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Review Queue
            </Link>
            <Link
              href={`/${lang}/platform/operations`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Operations Center
            </Link>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                reload()
                  .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                  .finally(() => setLoading(false));
              }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Reload
            </button>
          </div>
        </div>

        {from || selected ? (
          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100">
            Drill-down context:
            <span className="ml-2 font-semibold text-slate-100">{from || "-"}</span>
            {selected ? (
              <>
                <span className="mx-2 text-cyan-300">·</span>
                Selected:
                <span className="ml-2 font-semibold text-slate-100">{selected}</span>
              </>
            ) : null}
          </div>
        ) : null}

        {from || selected ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceLink ? (
              <Link
                href={sourceLink.href}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15"
              >
                {sourceLink.label}
              </Link>
            ) : null}
            {companyId ? (
                <Link
                  href={`/${lang}/platform/tenants?selected=${encodeURIComponent(companyId)}`}
                  className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/15"
                >
                  Open Tenant
                </Link>
              ) : null}
              {(candidateId || companyId || persistenceKey) ? (
              <Link
                href={buildPlatformReconciliationHref(lang, {
                  from,
                  selected,
                  operationId,
                  companyId,
                  candidateId,
                  persistenceKey,
                })}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Open Review Queue
              </Link>
            ) : null}
            {operationId ? (
              <Link
                href={`/${lang}/platform/operations?selected=${encodeURIComponent(operationId)}`}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Open Operation Detail
              </Link>
            ) : null}
          </div>
        ) : null}

        {(from || selected || operationId || candidateId || persistenceKey) ? (
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Highlighted rows:
            <span className="ml-2 font-semibold text-slate-100">{highlightedAuditCount}</span>
            <span className="mx-2 text-slate-500">·</span>
            Matching priority:
            <span className="ml-2 font-semibold text-slate-100">
              {operationId ? "operation audit links" : persistenceKey ? "persistence key" : candidateId ? "candidate" : selected ? "selected" : "-"}
            </span>
          </div>
        ) : null}

        {operationId && operationLink?.found ? (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Operation context: <span className="font-semibold text-slate-100">{operationId}</span> ·
            Status: <span className="font-semibold text-slate-100">{operationLink.status || "-"}</span> ·
            Linked audits: <span className="font-semibold text-slate-100">{(operationLink.auditIds || []).length}</span>
            <Link
              href={`/${lang}/platform/operations`}
              className="ml-3 text-cyan-300 hover:text-cyan-200"
            >
              Open Operations Center
            </Link>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Search audit rows"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <select
            value={actionType}
            onChange={(e) => updateFilters({ actionType: e.target.value })}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All action types</option>
            <option value="submit">submit</option>
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="batch_approve">batch_approve</option>
            <option value="batch_reject">batch_reject</option>
            <option value="auto_apply">auto_apply</option>
            <option value="undo">undo</option>
            <option value="tenant_suspend">tenant_suspend</option>
            <option value="tenant_activate">tenant_activate</option>
            <option value="user_assign">user_assign</option>
            <option value="user_unassign">user_unassign</option>
            <option value="override_approve">override_approve</option>
            <option value="override_reject">override_reject</option>
          </select>
          <select
            value={source}
            onChange={(e) => updateFilters({ source: e.target.value })}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All sources</option>
            <option value="api">api</option>
            <option value="web">web</option>
            <option value="system">system</option>
            <option value="admin">admin</option>
          </select>
          <select
            value={changed}
            onChange={(e) => updateFilters({ changed: e.target.value })}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All changed states</option>
            <option value="true">Changed only</option>
            <option value="false">Unchanged only</option>
          </select>

          <input
            value={companyId}
            onChange={(e) => updateFilters({ companyId: e.target.value })}
            placeholder="Company ID"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={candidateId}
            onChange={(e) => updateFilters({ candidateId: e.target.value })}
            placeholder="Candidate ID"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <input
            value={persistenceKey}
            onChange={(e) => updateFilters({ persistenceKey: e.target.value })}
            placeholder="Persistence Key"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <button
            type="button"
            onClick={() => router.push(`/${lang}/platform/audit?page=1&limit=${limit}`)}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Rows on page</div>
            <div className="mt-2 text-2xl font-semibold">{items.length}</div>
            <div className="mt-1 text-xs text-slate-400">Page {pageLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Changed events</div>
            <div className="mt-2 text-2xl font-semibold">{stats.changedCount}</div>
            <div className="mt-1 text-xs text-slate-400">Current loaded slice</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Investigation signals</div>
            <div className="mt-2 text-2xl font-semibold">{stats.adminCount + stats.overrideCount}</div>
            <div className="mt-1 text-xs text-slate-400">Admin + override events</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={buildPlatformAuditHref(lang, { changed: "true", page: 1, limit })}
            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15"
          >
            Changed Only
          </Link>
          <Link
            href={buildPlatformAuditHref(lang, { source: "admin", page: 1, limit })}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Admin Source
          </Link>
          <Link
            href={buildPlatformAuditHref(lang, { actionType: "override_approve", page: 1, limit })}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Override Approve
          </Link>
          <Link
            href={buildPlatformAuditHref(lang, { actionType: "override_reject", page: 1, limit })}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Override Reject
          </Link>
        </div>

        {activeFilters.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => removeFilter(filter.key)}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15"
              >
                {filter.label}: {filter.value} ×
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          Total <span className="font-semibold text-slate-100">{data?.total ?? 0}</span> ·
          Investigation workspace path: dashboard → audit → review queue → audit.
        </div>

        <div className="mt-6 space-y-4">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-6 text-sm text-slate-400">
              No audit rows found.
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.dateKey} className="rounded-2xl border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div className="text-sm font-semibold">{group.dateKey}</div>
                  <div className="text-xs text-slate-400">{group.items.length} events</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/50 text-slate-400">
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left">Action</th>
                        <th className="px-4 py-3 text-left">Source</th>
                        <th className="px-4 py-3 text-left">Changed</th>
                        <th className="px-4 py-3 text-left">Company</th>
                        <th className="px-4 py-3 text-left">Candidate</th>
                        <th className="px-4 py-3 text-left">Persistence</th>
                        <th className="px-4 py-3 text-left">Previous</th>
                        <th className="px-4 py-3 text-left">Next</th>
                        <th className="px-4 py-3 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((row: PlatformAuditRow) => (
                        <tr
                          key={row.id}
                          className={
                              isAuditContextMatch(row)
                                ? "cursor-pointer border-b border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                                : "cursor-pointer border-b border-slate-800/70 hover:bg-slate-800/40"
                            }
                          onClick={() => {
                            setSelectedRow(row);
                            setDrawerOpen(true);
                          }}
                        >
                          <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{row.actionType}</span>
                                {isAuditContextMatch(row) ? (
                                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
                                    Context
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                row.source === "admin"
                                  ? "rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200"
                                  : "rounded-full bg-slate-800 px-2 py-1 text-xs"
                              }
                            >
                              {row.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                row.changed
                                  ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                                  : "rounded-full bg-slate-800 px-2 py-1 text-xs"
                              }
                            >
                              {formatBool(row.changed)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{row.companyId}</td>
                          <td className="px-4 py-3">{row.candidateId}</td>
                          <td className="px-4 py-3">{row.persistenceKey || "-"}</td>
                          <td className="px-4 py-3">{row.previousValue || "-"}</td>
                          <td className="px-4 py-3">{row.nextValue || "-"}</td>
                          <td className="px-4 py-3">
                            <div>{row.createdAt}</div>
                            {operationId ? (
                              <div className="mt-2">
                                <Link
                                  href={`/${lang}/platform/operations`}
                                  className="text-xs text-cyan-300 hover:text-cyan-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open Operation
                                </Link>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">Timeline is grouped by created date for faster operator scanning.</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!data?.hasPrevPage}
              onClick={() =>
                router.push(
                  `/${lang}/platform/audit?${buildPlatformQueryString({
                    q,
                    actionType,
                    source,
                    changed,
                    companyId,
                    candidateId,
                    persistenceKey,
                    operationId,
                    page: Math.max(1, page - 1),
                    limit,
                  })}`
                )
              }
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!data?.hasNextPage}
              onClick={() =>
                router.push(
                  `/${lang}/platform/audit?${buildPlatformQueryString({
                    q,
                    actionType,
                    source,
                    changed,
                    companyId,
                    candidateId,
                    persistenceKey,
                    operationId,
                    page: page + 1,
                    limit,
                  })}`
                )
              }
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="text-slate-300">Loading audit...</div>}>
      <AuditPageContent />
    </Suspense>
  );
}
