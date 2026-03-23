"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformUsersList,
  fetchPlatformTenantsList,
  getPlatformAccessToken,
  controlPlatformUser,
} from "@/core/platform-auth/client";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }

  useEffect(() => {
    reload()
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  async function onUnassign(id: string) {
    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      await controlPlatformUser(id, "unassign", token);
      alert("User unassign success");
      await reload();
    } catch (e) {
      alert("User unassign failed: " + e);
    }
  }

  async function onAssign(id: string) {
    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      const companyId = prompt("Input tenant id to assign:");
      if (!companyId) return;
      await controlPlatformUser(id, "assign", token, companyId);
      alert("User assign success");
      await reload();
    } catch (e) {
      alert("User assign failed: " + e);
    }
  }

  if (loading) return <div className="text-slate-300">Loading users...</div>;
  if (error) return <div className="text-rose-300">{error}</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="mb-4 text-2xl font-semibold">Users</div>
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
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/70">
                <td className="px-3 py-3 font-medium">{row.email}</td>
                <td className="px-3 py-3">{row.assignmentStatus}</td>
                <td className="px-3 py-3">{row.companyName || "-"}</td>
                <td className="px-3 py-3">{row.createdAt}</td>
                <td className="px-3 py-3">
                  <button
                    className="mr-2 rounded bg-cyan-600 px-2 py-1 text-xs"
                    onClick={() => onAssign(row.id)}
                  >
                    ASSIGN
                  </button>
                  <button
                    className="rounded bg-rose-600 px-2 py-1 text-xs"
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
  );
}
