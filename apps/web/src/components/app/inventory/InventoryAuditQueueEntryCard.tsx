"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AuditSummaryResponse = {
  ok: boolean;
  summary?: {
    openIssues?: number;
    totalIssues?: number;
  };
};

export default function InventoryAuditQueueEntryCard() {
  const pathname = usePathname();
  const [openIssues, setOpenIssues] = useState<number | null>(null);

  const href = useMemo(() => {
    const base = pathname.replace(/\/$/, "");
    return `${base}/audit`;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/inventory/audit-issues?status=OPEN&limit=1&offset=0", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return;

        const data = (await response.json()) as AuditSummaryResponse;
        if (!cancelled) {
          setOpenIssues(Number(data.summary?.openIssues ?? 0));
        }
      } catch {
        if (!cancelled) setOpenIssues(null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-amber-700">Inventory Audit Queue</div>
          <h2 className="mt-1 text-lg font-bold text-amber-950">未解決の在庫監査</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Amazon注文取込でSKUマッピングできず、在庫減算が保留された明細を確認します。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-center">
            <div className="text-xs font-semibold text-amber-700">OPEN</div>
            <div className="mt-1 text-2xl font-bold text-amber-950">
              {openIssues === null ? "-" : openIssues.toLocaleString("ja-JP")}
            </div>
          </div>

          <Link
            href={href}
            className="rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            監査キューを開く
          </Link>
        </div>
      </div>
    </section>
  );
}
