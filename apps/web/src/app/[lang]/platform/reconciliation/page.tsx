"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformReconciliationList,
  getPlatformAccessToken,
} from "@/core/platform-auth/client";

type Row = {
  id: string;
  companyId: string;
  candidateId: string;
  decision: string;
  persistenceKey: string;
  confidence: number;
  submittedAt: string;
};

/* ================= OVERRIDE ================= */

async function overrideDecision(id: string, decision: string, token: string) {
  try {
    const res = await fetch(`/api/platform/reconciliation/${id}/override`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decision }),
    });

    if (!res.ok) {
      const t = await res.text();
      alert("Override failed: " + t);
      return;
    }

    alert("Override success");
    window.location.reload();
  } catch (e) {
    alert("Network error: " + e);
  }
}

/* ================= PAGE ================= */

export default function PlatformReconciliationPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getPlatformAccessToken();

    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    fetchPlatformReconciliationList(token)
      .then(setRows)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  if (loading) return <div className="text-slate-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">Reconciliation</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th>Decision</th>
            <th>Confidence</th>
            <th>Company</th>
            <th>Candidate</th>
            <th>Persistence</th>
            <th>Submitted</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-800">
              <td>{row.decision}</td>
              <td>{row.confidence?.toFixed(2)}</td>
              <td>{row.companyId}</td>
              <td>{row.candidateId}</td>
              <td>{row.persistenceKey}</td>
              <td>{row.submittedAt}</td>

              <td>
                <button
                  className="mr-2 bg-green-600 px-2 py-1 text-xs rounded"
                  onClick={() =>
                    overrideDecision(
                      row.id,
                      "APPROVED",
                      getPlatformAccessToken()!
                    )
                  }
                >
                  APPROVE
                </button>

                <button
                  className="bg-red-600 px-2 py-1 text-xs rounded"
                  onClick={() =>
                    overrideDecision(
                      row.id,
                      "REJECTED",
                      getPlatformAccessToken()!
                    )
                  }
                >
                  REJECT
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
