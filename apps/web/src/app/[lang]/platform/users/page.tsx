"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformUsersList,
  fetchPlatformTenantsList,
  fetchPlatformOperationsList,
  getPlatformAccessToken,
  controlPlatformUser,
  isPlatformUnauthorizedError,
} from "@/core/platform-auth/client";
import { AssignUserDialog } from "@/components/platform/AssignUserDialog";

type UserRow = {
  id: string;
  email: string;
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
  assignmentStatus: string;
};

type TenantRow = {
  id: string;
  name: string;
};

export default function PlatformUsersPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [rows, setRows] = useState<UserRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [latestUserOperation, setLatestUserOperation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<UserRow | null>(null);

  const [search, setSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [users, tenantRows] = await Promise.all([
      fetchPlatformUsersList(token),
      fetchPlatformTenantsList(token),
    ]);

    setRows(users);
    setTenants(
      tenantRows.map((x: any) => ({
        id: x.id,
        name: x.name,
      }))
    );
    setError("");
  }

  useEffect(() => {
    reload()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  async function onUnassign(id: string) {
    const confirmed = window.confirm("Unassign this user from the current tenant?");
    if (!confirmed) return;

    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }

      setBusyId(id);
      setNotice("");
      setError("");

      await controlPlatformUser(id, "unassign", token);
      setNotice("User unassigned successfully.");
      await reload();
    } catch (e) {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError("User unassign failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  async function submitAssign(companyId: string) {
    if (!assignTarget) return;

    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }

      setBusyId(assignTarget.id);
      setNotice("");
      setError("");

      await controlPlatformUser(assignTarget.id, "assign", token, companyId);
      setNotice("User assigned successfully.");
      setAssignOpen(false);
      setAssignTarget(null);
      await reload();
    } catch (e) {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError("User assign failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchSearch =
        !q ||
        row.email.toLowerCase().includes(q) ||
        (row.companyName || "").toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);

      const matchAssignment =
        !assignmentFilter || row.assignmentStatus === assignmentFilter;

      return matchSearch && matchAssignment;
    });
  }, [rows, search, assignmentFilter]);

  if (loading) return <div className="text-slate-300">Loading users...</div>;

  return (
    <>
      <AssignUserDialog
        open={assignOpen}
        email={assignTarget?.email || "-"}
        tenants={tenants}
        loading={!!busyId}
        onClose={() => {
          if (busyId) return;
          setAssignOpen(false);
          setAssignTarget(null);
        }}
        onSubmit={submitAssign}
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-2xl font-semibold">Users</div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/platform/audit?page=1&limit=20`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Audit Entry
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

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email / tenant / user id"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />

          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All assignment status</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="UNASSIGNED">UNASSIGNED</option>
          </select>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          Showing <span className="font-semibold text-slate-100">{filteredRows.length}</span> of{" "}
          <span className="font-semibold text-slate-100">{rows.length}</span> users
        </div>

        {notice ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mb-4 text-xs text-slate-400">
          Available tenant IDs: {tenants.map((t) => `${t.name}(${t.id})`).join(", ")}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-3 py-3 text-left">Email</th>
                <th className="px-3 py-3 text-left">Assignment</th>
                <th className="px-3 py-3 text-left">Tenant</th>
                <th className="px-3 py-3 text-left">Created</th>
                <th className="px-3 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-3 font-medium">{row.email}</td>
                  <td className="px-3 py-3">{row.assignmentStatus}</td>
                  <td className="px-3 py-3">{row.companyName || "-"}</td>
                  <td className="px-3 py-3">{row.createdAt}</td>
                  <td className="px-3 py-3">
                    <button
                      className="mr-2 rounded bg-cyan-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === row.id}
                      onClick={() => {
                        setAssignTarget(row);
                        setAssignOpen(true);
                      }}
                    >
                      ASSIGN
                    </button>
                    <button
                      className="rounded bg-rose-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === row.id}
                      onClick={() => onUnassign(row.id)}
                    >
                      UNASSIGN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
