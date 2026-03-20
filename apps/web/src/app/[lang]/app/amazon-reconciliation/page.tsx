"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  loadJobsSnapshot,
  type ExportJobItem,
  type ImportJobItem,
  type MetaSummary,
} from "@/core/jobs";
import { AmazonReconciliationStatCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationStatCard";
import { AmazonReconciliationHero } from "@/components/app/amazon-reconciliation/AmazonReconciliationHero";
import { AmazonReconciliationJobSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationJobSummaryCard";
import { AmazonReconciliationReadinessCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationReadinessCard";
import { AmazonReconciliationQuickActionsCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationQuickActionsCard";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function text(value?: string | null, fallback = "-") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function statusTone(status?: string | null) {
  switch (String(status ?? "").toUpperCase()) {
    case "SUCCEEDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PROCESSING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function AmazonReconciliationPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [importItems, setImportItems] = useState<ImportJobItem[]>([]);
  const [exportItems, setExportItems] = useState<ExportJobItem[]>([]);
  const [importSummary, setImportSummary] = useState<MetaSummary | null>(null);
  const [exportSummary, setExportSummary] = useState<MetaSummary | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const snapshot = await loadJobsSnapshot();

      setImportItems(snapshot.importItems);
      setExportItems(snapshot.exportItems);
      setImportSummary(snapshot.importMeta?.summary ?? null);
      setExportSummary(snapshot.exportMeta?.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load reconciliation jobs");
      setImportItems([]);
      setExportItems([]);
      setImportSummary(null);
      setExportSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const recentImport = useMemo(
    () =>
      [...importItems]
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
        .slice(0, 8),
    [importItems]
  );

  const recentExport = useMemo(
    () =>
      [...exportItems]
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
        .slice(0, 8),
    [exportItems]
  );

  const importFailed = Number(importSummary?.failed ?? 0);
  const exportFailed = Number(exportSummary?.failed ?? 0);
  const totalFailed = importFailed + exportFailed;

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm text-slate-500">Amazon照合ページを読み込み中...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">
            Amazon reconciliation の読込に失敗しました
          </div>
          <div className="mt-2 break-all text-sm text-rose-600">{error}</div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              再読み込み
            </button>

            <Link
              href={`/${lang}/app/data/import`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Import へ
            </Link>

            <Link
              href={`/${lang}/app/data/export`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Export へ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <AmazonReconciliationHero lang={lang} onReload={load} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <AmazonReconciliationStatCard
          title="Import Jobs"
          value={Number(importSummary?.total ?? importItems.length)}
          helper="import job total"
          tone="primary"
        />
        <AmazonReconciliationStatCard
          title="Export Jobs"
          value={Number(exportSummary?.total ?? exportItems.length)}
          helper="export job total"
          tone="success"
        />
        <AmazonReconciliationStatCard
          title="Failed Jobs"
          value={totalFailed}
          helper="import + export failed"
          tone="warning"
        />
        <AmazonReconciliationStatCard
          title="Current Mode"
          value="Connected"
          helper="real Step46 job baseline connected"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <AmazonReconciliationJobSummaryCard
          mode="import"
          lang={lang}
          summary={importSummary}
          items={recentImport}
        />

        <AmazonReconciliationJobSummaryCard
          mode="export"
          lang={lang}
          summary={exportSummary}
          items={recentExport}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <AmazonReconciliationReadinessCard />
        <AmazonReconciliationQuickActionsCard lang={lang} />
      </section>
    </main>
  );
}
