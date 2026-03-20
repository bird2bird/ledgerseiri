"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { AmazonReconciliationLoadingState } from "@/components/app/amazon-reconciliation/AmazonReconciliationLoadingState";
import { AmazonReconciliationErrorState } from "@/components/app/amazon-reconciliation/AmazonReconciliationErrorState";
import { selectRecentJobs } from "@/components/app/amazon-reconciliation/amazon-reconciliation-shared";

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

  const recentImport = useMemo(() => selectRecentJobs(importItems, 8), [importItems]);
  const recentExport = useMemo(() => selectRecentJobs(exportItems, 8), [exportItems]);

  const importFailed = Number(importSummary?.failed ?? 0);
  const exportFailed = Number(exportSummary?.failed ?? 0);
  const totalFailed = importFailed + exportFailed;

  if (loading) {
    return <AmazonReconciliationLoadingState />;
  }

  if (error) {
    return (
      <AmazonReconciliationErrorState
        lang={lang}
        error={error}
        onReload={load}
      />
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
